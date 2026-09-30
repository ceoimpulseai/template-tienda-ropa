import { describe, expect, it } from 'vitest';
import { encryptPem, decryptPem, EncryptionError } from './crypto.js';

const TEST_PEM = '-----BEGIN CERTIFICATE-----\nTESTCERT\n-----END CERTIFICATE-----';

describe('encryptPem → decryptPem roundtrip', () => {
  it('returns original PEM after encrypt+decrypt', () => {
    const businessId = 'biz-1';
    const encrypted = encryptPem(businessId, TEST_PEM);
    expect(() => JSON.parse(encrypted)).not.toThrow();
    const parsed = JSON.parse(encrypted);
    expect(parsed).toHaveProperty('version', 1);
    expect(parsed).toHaveProperty('salt');
    expect(parsed).toHaveProperty('iv');
    expect(parsed).toHaveProperty('tag');
    expect(parsed).toHaveProperty('ciphertext');
    const decrypted = decryptPem(businessId, encrypted);
    expect(decrypted).toBe(TEST_PEM);
  });

  it('different encryptions of same PEM produce different ciphertexts (random salt)', () => {
    const businessId = 'biz-1';
    const encrypted1 = encryptPem(businessId, TEST_PEM);
    const encrypted2 = encryptPem(businessId, TEST_PEM);
    expect(encrypted1).not.toBe(encrypted2);
    // But both decrypt to same PEM
    expect(decryptPem(businessId, encrypted1)).toBe(TEST_PEM);
    expect(decryptPem(businessId, encrypted2)).toBe(TEST_PEM);
  });

  it('different businessIds produce different ciphertexts', () => {
    const encrypted1 = encryptPem('biz-1', TEST_PEM);
    const encrypted2 = encryptPem('biz-2', TEST_PEM);
    expect(encrypted1).not.toBe(encrypted2);
    expect(decryptPem('biz-1', encrypted1)).toBe(TEST_PEM);
    expect(decryptPem('biz-2', encrypted2)).toBe(TEST_PEM);
  });

  it('throws EncryptionError on tampered ciphertext', () => {
    const businessId = 'biz-1';
    const encrypted = encryptPem(businessId, 'my-pem');
    const tampered = JSON.stringify({ ...JSON.parse(encrypted), ciphertext: 'deadbeef' });
    expect(() => decryptPem(businessId, tampered)).toThrow(EncryptionError);
  });

  it('throws EncryptionError with wrong businessId (wrong key)', () => {
    const encrypted = encryptPem('biz-1', 'my-pem');
    expect(() => decryptPem('biz-2', encrypted)).toThrow(EncryptionError);
  });

  it('throws EncryptionError on invalid JSON', () => {
    const businessId = 'biz-1';
    expect(() => decryptPem(businessId, 'not-valid-json')).toThrow(EncryptionError);
  });

  it('throws EncryptionError on missing fields', () => {
    const businessId = 'biz-1';
    const invalid = JSON.stringify({ iv: 'abc', tag: 'def' }); // missing ciphertext, salt, version
    expect(() => decryptPem(businessId, invalid)).toThrow(EncryptionError);
  });

  it('throws EncryptionError on unsupported version', () => {
    const businessId = 'biz-1';
    const payload = {
      version: 999,
      salt: 'aaaaaaaaaaaaaaaa',
      iv: 'bbbbbbbbbbbb',
      tag: 'cccccccccccccccc',
      ciphertext: 'dddd',
    };
    expect(() => decryptPem(businessId, JSON.stringify(payload))).toThrow(EncryptionError);
  });
});