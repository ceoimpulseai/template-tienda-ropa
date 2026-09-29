import { describe, expect, it } from 'vitest';
import { deriveTenantKey, encryptPem, decryptPem, EncryptionError } from './crypto.js';

describe('deriveTenantKey', () => {
  it('returns deterministic key for same businessId', () => {
    const k1 = deriveTenantKey('biz-1');
    const k2 = deriveTenantKey('biz-1');
    expect(k1.equals(k2)).toBe(true);
  });

  it('returns different keys for different businessIds', () => {
    const k1 = deriveTenantKey('biz-1');
    const k2 = deriveTenantKey('biz-2');
    expect(k1.equals(k2)).toBe(false);
  });
});

describe('encryptPem → decryptPem roundtrip', () => {
  it('returns original PEM after encrypt+decrypt', () => {
    const key = deriveTenantKey('biz-1');
    const pem = '-----BEGIN CERTIFICATE-----\nTESTCERT\n-----END CERTIFICATE-----';
    const encrypted = encryptPem(key, pem);
    expect(() => JSON.parse(encrypted)).not.toThrow();
    const parsed = JSON.parse(encrypted);
    expect(parsed).toHaveProperty('iv');
    expect(parsed).toHaveProperty('tag');
    expect(parsed).toHaveProperty('ciphertext');
    const decrypted = decryptPem(key, encrypted);
    expect(decrypted).toBe(pem);
  });

  it('throws EncryptionError on tampered ciphertext', () => {
    const key = deriveTenantKey('biz-1');
    const encrypted = encryptPem(key, 'my-pem');
    const tampered = JSON.stringify({ ...JSON.parse(encrypted), ciphertext: 'deadbeef' });
    expect(() => decryptPem(key, tampered)).toThrow(EncryptionError);
  });

  it('throws EncryptionError with wrong key', () => {
    const key1 = deriveTenantKey('biz-1');
    const key2 = deriveTenantKey('biz-2');
    const encrypted = encryptPem(key1, 'my-pem');
    expect(() => decryptPem(key2, encrypted)).toThrow(EncryptionError);
  });

  it('throws EncryptionError on invalid JSON', () => {
    const key = deriveTenantKey('biz-1');
    expect(() => decryptPem(key, 'not-valid-json')).toThrow(EncryptionError);
  });

  it('throws EncryptionError on missing fields', () => {
    const key = deriveTenantKey('biz-1');
    const invalid = JSON.stringify({ iv: 'abc', tag: 'def' }); // missing ciphertext
    expect(() => decryptPem(key, invalid)).toThrow(EncryptionError);
  });
});