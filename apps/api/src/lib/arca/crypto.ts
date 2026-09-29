import { pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { env } from '../../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // 96 bits
const TAG_LENGTH = 16; // 128 bits
const ITERATIONS = 600_000;
const DIGEST = 'sha256';
const SALT_PREFIX = 'arca-tenant-key-v1:';

export class EncryptionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export function deriveTenantKey(businessId: string): Buffer {
  const masterKey = Buffer.from(env.ARCA_MASTER_KEY, 'hex');
  const salt = `${SALT_PREFIX}${businessId}`;
  return pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, DIGEST);
}

export function encryptPem(tenantKey: Buffer, pem: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, tenantKey, iv);
  let ciphertext = cipher.update(pem, 'utf-8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return JSON.stringify({ iv: iv.toString('hex'), tag, ciphertext });
}

export function decryptPem(tenantKey: Buffer, encrypted: string): string {
  try {
    const { iv, tag, ciphertext } = JSON.parse(encrypted);
    const decipher = createDecipheriv(
      ALGORITHM,
      tenantKey,
      Buffer.from(iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    let pem = decipher.update(ciphertext, 'hex', 'utf-8');
    pem += decipher.final('utf-8');
    return pem;
  } catch (err) {
    throw new EncryptionError('Failed to decrypt PEM — possible tampering or wrong key', err);
  }
}