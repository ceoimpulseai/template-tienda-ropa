// ARCA crypto utilities — encrypt/decrypt PEM certificates per tenant.
// Uses AES-256-GCM with PBKDF2 key derivation.
// Each encryption gets a random salt stored in the payload for key derivation.
// Supports versioned payloads for future master key rotation.
// Backward compatible with old format (deterministic salt, no version field).

import { pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { env } from '../../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;        // 256 bits
const IV_LENGTH = 12;         // 96 bits
const TAG_LENGTH = 16;        // 128 bits
const ITERATIONS = 600_000;
const DIGEST = 'sha256';
const SALT_PREFIX = 'arca-tenant-key-v1:';
const CURRENT_VERSION = 1;

interface EncryptedPayloadV1 {
  version: number;
  salt: string;
  iv: string;
  tag: string;
  ciphertext: string;
}

interface EncryptedPayloadLegacy {
  iv: string;
  tag: string;
  ciphertext: string;
}

export class EncryptionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'EncryptionError';
  }
}

// Internal key derivation: masterKey + businessId + salt
function deriveKey(masterKey: Buffer, businessId: string, salt: string): Buffer {
  return pbkdf2Sync(masterKey, `${SALT_PREFIX}${businessId}:${salt}`, ITERATIONS, KEY_LENGTH, DIGEST);
}

// Legacy key derivation (deterministic salt based on businessId only)
function deriveKeyLegacy(masterKey: Buffer, businessId: string): Buffer {
  return pbkdf2Sync(masterKey, `${SALT_PREFIX}${businessId}`, ITERATIONS, KEY_LENGTH, DIGEST);
}

/**
 * Encrypt a PEM string for a specific business.
 * Generates a random salt per encryption, stores it in the payload.
 * @param businessId — tenant identifier (UUID)
 * @param pem — PEM certificate or private key content
 * @returns JSON string containing { version, salt, iv, tag, ciphertext }
 */
export function encryptPem(businessId: string, pem: string): string {
  const masterKey = Buffer.from(env.ARCA_MASTER_KEY, 'hex');
  const salt = randomBytes(16).toString('hex');
  const derivedKey = deriveKey(masterKey, businessId, salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv);
  let ciphertext = cipher.update(pem, 'utf-8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return JSON.stringify({
    version: CURRENT_VERSION,
    salt,
    iv: iv.toString('hex'),
    tag,
    ciphertext,
  });
}

/**
 * Decrypt a PEM string for a specific business.
 * Supports both new format (v1 with random salt) and legacy format (deterministic salt).
 * @param businessId — tenant identifier (UUID)
 * @param encrypted — JSON string from encryptPem() or legacy format
 * @returns decrypted PEM string
 * @throws EncryptionError if decryption fails (tampering, wrong key, corrupted data)
 */
export function decryptPem(businessId: string, encrypted: string): string {
  try {
    const parsed = JSON.parse(encrypted);

    // Detect legacy format: no version field, has iv/tag/ciphertext directly
    if (!parsed.version && parsed.iv && parsed.tag && parsed.ciphertext) {
      return decryptLegacy(businessId, parsed as EncryptedPayloadLegacy);
    }

    // New format (v1+)
    const { version, salt, iv, tag, ciphertext } = parsed as EncryptedPayloadV1;

    if (version !== CURRENT_VERSION) {
      throw new EncryptionError(`Unsupported encryption version: ${version}`);
    }

    const masterKey = Buffer.from(env.ARCA_MASTER_KEY, 'hex');
    const derivedKey = deriveKey(masterKey, businessId, salt);
    const decipher = createDecipheriv(ALGORITHM, derivedKey, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    let pem = decipher.update(ciphertext, 'hex', 'utf-8');
    pem += decipher.final('utf-8');
    return pem;
  } catch (err) {
    if (err instanceof EncryptionError) throw err;
    throw new EncryptionError('Failed to decrypt PEM — possible tampering or wrong key', err);
  }
}

function decryptLegacy(businessId: string, payload: EncryptedPayloadLegacy): string {
  const masterKey = Buffer.from(env.ARCA_MASTER_KEY, 'hex');
  const derivedKey = deriveKeyLegacy(masterKey, businessId);
  const decipher = createDecipheriv(ALGORITHM, derivedKey, Buffer.from(payload.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
  let pem = decipher.update(payload.ciphertext, 'hex', 'utf-8');
  pem += decipher.final('utf-8');
  return pem;
}