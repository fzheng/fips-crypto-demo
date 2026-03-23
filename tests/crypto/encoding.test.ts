import { describe, it, expect } from 'vitest';
import { toBase64, fromBase64, toBytes, fromBytes, fingerprint } from '../../src/crypto/encoding';

describe('encoding', () => {
  describe('toBase64 / fromBase64', () => {
    it('round-trips empty array', () => {
      const empty = new Uint8Array(0);
      expect(fromBase64(toBase64(empty))).toEqual(empty);
    });

    it('round-trips small data', () => {
      const data = new Uint8Array([0, 1, 2, 127, 128, 255]);
      const b64 = toBase64(data);
      expect(typeof b64).toBe('string');
      expect(fromBase64(b64)).toEqual(data);
    });

    it('round-trips 32-byte key-like data', () => {
      const key = new Uint8Array(32);
      for (let i = 0; i < 32; i++) key[i] = i * 8;
      expect(fromBase64(toBase64(key))).toEqual(key);
    });

    it('round-trips large data (1184 bytes — ML-KEM-768 public key size)', () => {
      const data = new Uint8Array(1184);
      for (let i = 0; i < data.length; i++) data[i] = i % 256;
      expect(fromBase64(toBase64(data))).toEqual(data);
    });
  });

  describe('toBytes / fromBytes', () => {
    it('round-trips ASCII string', () => {
      expect(fromBytes(toBytes('hello'))).toBe('hello');
    });

    it('round-trips unicode string', () => {
      const str = 'Hello 🔒 post-quantum!';
      expect(fromBytes(toBytes(str))).toBe(str);
    });

    it('round-trips empty string', () => {
      expect(fromBytes(toBytes(''))).toBe('');
    });
  });

  describe('fingerprint', () => {
    it('returns hex string of first 8 bytes', () => {
      const key = new Uint8Array([0x0a, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x01, 0x23, 0x99]);
      expect(fingerprint(key)).toBe('0abbccddeeff0123');
    });

    it('pads single-digit hex values with zero', () => {
      const key = new Uint8Array(8).fill(0);
      expect(fingerprint(key)).toBe('0000000000000000');
    });

    it('handles keys shorter than 8 bytes', () => {
      const key = new Uint8Array([0xff]);
      expect(fingerprint(key)).toBe('ff');
    });
  });
});
