import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, encryptString, decryptString } from '../../src/crypto/symmetric';

const key = new Uint8Array(32);
for (let i = 0; i < 32; i++) key[i] = i;

describe('XChaCha20-Poly1305 — extended', () => {
  describe('nonce handling', () => {
    it('first 24 bytes of ciphertext are the nonce', () => {
      const ct1 = encrypt(key, new Uint8Array([1]));
      const ct2 = encrypt(key, new Uint8Array([1]));
      const nonce1 = ct1.slice(0, 24);
      const nonce2 = ct2.slice(0, 24);
      // Random nonces should differ
      expect(nonce1).not.toEqual(nonce2);
    });

    it('nonce is 24 bytes', () => {
      const ct = encrypt(key, new Uint8Array([1, 2, 3]));
      // Minimum ciphertext: 24 (nonce) + plaintext + 16 (tag)
      expect(ct.length).toBe(24 + 3 + 16);
    });
  });

  describe('tag authentication', () => {
    it('flipping any byte in the tag causes decryption to fail', () => {
      const ct = encrypt(key, new Uint8Array([1, 2, 3]));
      for (let offset = ct.length - 16; offset < ct.length; offset++) {
        const tampered = new Uint8Array(ct);
        tampered[offset] ^= 0x01;
        expect(() => decrypt(key, tampered)).toThrow();
      }
    });

    it('flipping a byte in the nonce causes decryption to fail', () => {
      const ct = encrypt(key, new Uint8Array([1, 2, 3]));
      const tampered = new Uint8Array(ct);
      tampered[0] ^= 0x01;
      expect(() => decrypt(key, tampered)).toThrow();
    });

    it('flipping a byte in the ciphertext body causes decryption to fail', () => {
      const plaintext = new Uint8Array(100).fill(42);
      const ct = encrypt(key, plaintext);
      const tampered = new Uint8Array(ct);
      tampered[30] ^= 0xff; // in the body region
      expect(() => decrypt(key, tampered)).toThrow();
    });
  });

  describe('ciphertext structure', () => {
    it('overhead is constant regardless of plaintext size', () => {
      const overhead = 24 + 16; // nonce + tag
      for (const size of [0, 1, 10, 100, 1000, 10000]) {
        const ct = encrypt(key, new Uint8Array(size));
        expect(ct.length).toBe(size + overhead);
      }
    });

    it('ciphertext is not a simple copy of plaintext', () => {
      const plaintext = new Uint8Array(100).fill(0xaa);
      const ct = encrypt(key, plaintext);
      // The body portion (after nonce, before tag) should not equal plaintext
      const body = ct.slice(24, ct.length - 16);
      expect(body).not.toEqual(plaintext);
    });
  });

  describe('key sensitivity', () => {
    it('single bit difference in key fails decryption', () => {
      const ct = encrypt(key, new Uint8Array([1, 2, 3]));
      const altKey = new Uint8Array(key);
      altKey[0] ^= 0x01;
      expect(() => decrypt(altKey, ct)).toThrow();
    });

    it('all-zero key works', () => {
      const zeroKey = new Uint8Array(32);
      const pt = new Uint8Array([1, 2, 3]);
      const ct = encrypt(zeroKey, pt);
      expect(decrypt(zeroKey, ct)).toEqual(pt);
    });

    it('all-0xff key works', () => {
      const ffKey = new Uint8Array(32).fill(0xff);
      const pt = new Uint8Array([1, 2, 3]);
      const ct = encrypt(ffKey, pt);
      expect(decrypt(ffKey, ct)).toEqual(pt);
    });
  });

  describe('encryptString / decryptString edge cases', () => {
    it('handles very long string (50KB)', () => {
      const msg = 'A'.repeat(50_000);
      expect(decryptString(key, encryptString(key, msg))).toBe(msg);
    });

    it('handles string with only whitespace', () => {
      const msg = '   \t\n\r  ';
      expect(decryptString(key, encryptString(key, msg))).toBe(msg);
    });

    it('handles string with newlines', () => {
      const msg = 'line1\nline2\nline3';
      expect(decryptString(key, encryptString(key, msg))).toBe(msg);
    });

    it('wrong key fails for string decryption too', () => {
      const ct = encryptString(key, 'secret');
      const wrongKey = new Uint8Array(32).fill(0xff);
      expect(() => decryptString(wrongKey, ct)).toThrow();
    });
  });

  describe('minimum ciphertext validation', () => {
    it('decrypting too-short ciphertext throws', () => {
      // Need at least 24 (nonce) + 16 (tag) = 40 bytes minimum
      expect(() => decrypt(key, new Uint8Array(39))).toThrow();
      expect(() => decrypt(key, new Uint8Array(10))).toThrow();
      expect(() => decrypt(key, new Uint8Array(0))).toThrow();
    });
  });
});
