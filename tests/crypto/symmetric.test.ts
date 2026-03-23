import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, encryptString, decryptString } from '../../src/crypto/symmetric';

// 32-byte test key (ML-KEM shared secret size)
const testKey = new Uint8Array(32);
for (let i = 0; i < 32; i++) testKey[i] = i;

describe('XChaCha20-Poly1305 symmetric encryption', () => {
  describe('encrypt / decrypt (bytes)', () => {
    it('round-trips plaintext', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const ciphertext = encrypt(testKey, plaintext);
      const decrypted = decrypt(testKey, ciphertext);
      expect(decrypted).toEqual(plaintext);
    });

    it('ciphertext is larger than plaintext (nonce + tag overhead)', () => {
      const plaintext = new Uint8Array(100);
      const ciphertext = encrypt(testKey, plaintext);
      // 24-byte nonce + plaintext + 16-byte Poly1305 tag
      expect(ciphertext.length).toBe(100 + 24 + 16);
    });

    it('encrypting same plaintext twice produces different ciphertext', () => {
      const plaintext = new Uint8Array([1, 2, 3]);
      const c1 = encrypt(testKey, plaintext);
      const c2 = encrypt(testKey, plaintext);
      expect(c1).not.toEqual(c2); // random nonce each time
    });

    it('wrong key fails to decrypt', () => {
      const plaintext = new Uint8Array([1, 2, 3]);
      const ciphertext = encrypt(testKey, plaintext);
      const wrongKey = new Uint8Array(32).fill(0xff);
      expect(() => decrypt(wrongKey, ciphertext)).toThrow();
    });

    it('tampered ciphertext fails to decrypt', () => {
      const plaintext = new Uint8Array([1, 2, 3]);
      const ciphertext = encrypt(testKey, plaintext);
      ciphertext[ciphertext.length - 1] ^= 0xff; // flip last byte (in tag)
      expect(() => decrypt(testKey, ciphertext)).toThrow();
    });

    it('handles empty plaintext', () => {
      const plaintext = new Uint8Array(0);
      const ciphertext = encrypt(testKey, plaintext);
      const decrypted = decrypt(testKey, ciphertext);
      expect(decrypted).toEqual(plaintext);
    });

    it('handles large plaintext (1MB — simulating file encryption)', () => {
      const plaintext = new Uint8Array(1024 * 1024);
      for (let i = 0; i < plaintext.length; i++) plaintext[i] = i % 256;
      const ciphertext = encrypt(testKey, plaintext);
      const decrypted = decrypt(testKey, ciphertext);
      expect(decrypted).toEqual(plaintext);
    });
  });

  describe('encryptString / decryptString', () => {
    it('round-trips text message', () => {
      const msg = 'Hello, post-quantum world!';
      const ciphertext = encryptString(testKey, msg);
      expect(decryptString(testKey, ciphertext)).toBe(msg);
    });

    it('round-trips unicode', () => {
      const msg = '🔒 Quantum-safe messaging! 日本語';
      expect(decryptString(testKey, encryptString(testKey, msg))).toBe(msg);
    });

    it('round-trips empty string', () => {
      expect(decryptString(testKey, encryptString(testKey, ''))).toBe('');
    });
  });
});
