import { describe, it, expect } from 'vitest';
import { toBase64, fromBase64, toBytes, fromBytes, fingerprint } from '../../src/crypto/encoding';

describe('encoding — extended', () => {
  describe('toBase64 / fromBase64 edge cases', () => {
    it('round-trips all 256 byte values', () => {
      const data = new Uint8Array(256);
      for (let i = 0; i < 256; i++) data[i] = i;
      expect(fromBase64(toBase64(data))).toEqual(data);
    });

    it('round-trips 2400-byte data (ML-KEM-768 secret key size)', () => {
      const data = new Uint8Array(2400);
      for (let i = 0; i < data.length; i++) data[i] = (i * 7) % 256;
      expect(fromBase64(toBase64(data))).toEqual(data);
    });

    it('round-trips 3309-byte data (ML-DSA-65 signature size)', () => {
      const data = new Uint8Array(3309);
      for (let i = 0; i < data.length; i++) data[i] = (i * 13) % 256;
      expect(fromBase64(toBase64(data))).toEqual(data);
    });

    it('round-trips 1-byte array', () => {
      const data = new Uint8Array([42]);
      expect(fromBase64(toBase64(data))).toEqual(data);
    });

    it('base64 output contains only valid characters', () => {
      const data = new Uint8Array(256);
      for (let i = 0; i < 256; i++) data[i] = i;
      const b64 = toBase64(data);
      expect(b64).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('throws on invalid base64 input', () => {
      expect(() => fromBase64('not!valid!base64!@#$')).toThrow();
    });

    it('base64 length is correct (4/3 ratio, padded to multiple of 4)', () => {
      for (const len of [1, 2, 3, 4, 5, 10, 32, 100]) {
        const data = new Uint8Array(len);
        const b64 = toBase64(data);
        expect(b64.length % 4).toBe(0);
      }
    });
  });

  describe('toBytes / fromBytes edge cases', () => {
    it('round-trips multi-byte unicode characters', () => {
      const str = '\u00e9\u00e8\u00ea'; // accented e's
      expect(fromBytes(toBytes(str))).toBe(str);
    });

    it('round-trips emoji sequences', () => {
      const str = '\ud83d\udd12\ud83d\udd11\ud83d\udee1\ufe0f'; // lock, key, shield
      expect(fromBytes(toBytes(str))).toBe(str);
    });

    it('round-trips CJK characters', () => {
      const str = '\u91cf\u5b50\u5bc6\u7801\u5b66'; // Chinese for "quantum cryptography"
      expect(fromBytes(toBytes(str))).toBe(str);
    });

    it('produces non-empty bytes for non-empty string', () => {
      expect(toBytes('a').length).toBeGreaterThan(0);
    });

    it('produces empty bytes for empty string', () => {
      expect(toBytes('').length).toBe(0);
    });

    it('round-trips string with null characters', () => {
      const str = 'hello\x00world';
      expect(fromBytes(toBytes(str))).toBe(str);
    });

    it('round-trips long string (10KB)', () => {
      const str = 'x'.repeat(10000);
      expect(fromBytes(toBytes(str))).toBe(str);
    });
  });

  describe('fingerprint edge cases', () => {
    it('returns exactly 16 hex characters for 8+ byte key', () => {
      const key = new Uint8Array(1184); // ML-KEM-768 public key size
      expect(fingerprint(key)).toHaveLength(16);
    });

    it('returns 2 chars per byte for short keys', () => {
      expect(fingerprint(new Uint8Array([0xab]))).toHaveLength(2);
      expect(fingerprint(new Uint8Array([0xab, 0xcd]))).toHaveLength(4);
      expect(fingerprint(new Uint8Array([0xab, 0xcd, 0xef]))).toHaveLength(6);
    });

    it('returns empty string for empty key', () => {
      expect(fingerprint(new Uint8Array(0))).toBe('');
    });

    it('output only contains hex characters', () => {
      const key = new Uint8Array(100);
      for (let i = 0; i < 100; i++) key[i] = i;
      expect(fingerprint(key)).toMatch(/^[0-9a-f]+$/);
    });

    it('different keys produce different fingerprints', () => {
      const k1 = new Uint8Array(8).fill(0x00);
      const k2 = new Uint8Array(8).fill(0xff);
      expect(fingerprint(k1)).not.toBe(fingerprint(k2));
    });
  });
});
