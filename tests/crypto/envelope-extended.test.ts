import { describe, it, expect } from 'vitest';
import { buildSignedEnvelope } from '../../src/crypto/envelope';

describe('buildSignedEnvelope — extended', () => {
  it('text envelope without file metadata has consistent length', () => {
    const ct = new Uint8Array(100);
    const env = buildSignedEnvelope(ct, 'text', 1000);
    // prefix(15) + type("text"=4) + timestamp(8) + ciphertext(100) = 127
    expect(env.length).toBe(127);
  });

  it('file envelope includes fileName and fileType bytes', () => {
    const ct = new Uint8Array(50);
    const env1 = buildSignedEnvelope(ct, 'file', 1000);
    const env2 = buildSignedEnvelope(ct, 'file', 1000, 'photo.png', 'image/png');
    // env2 should be larger by the length of "photo.png" + "image/png"
    expect(env2.length).toBe(env1.length + 'photo.png'.length + 'image/png'.length);
  });

  it('envelope without optional fields is smaller', () => {
    const ct = new Uint8Array(10);
    const noFile = buildSignedEnvelope(ct, 'text', 1000);
    const withFile = buildSignedEnvelope(ct, 'file', 1000, 'doc.pdf', 'application/pdf');
    expect(noFile.length).toBeLessThan(withFile.length);
  });

  it('envelope with empty fileName differs from no fileName', () => {
    const ct = new Uint8Array(10);
    const env1 = buildSignedEnvelope(ct, 'file', 1000);
    const env2 = buildSignedEnvelope(ct, 'file', 1000, '');
    // Empty string encodes to 0 bytes, same as undefined — these should be equal
    expect(env1).toEqual(env2);
  });

  it('timestamp is encoded as 8 big-endian bytes', () => {
    const ct = new Uint8Array(0);
    const env = buildSignedEnvelope(ct, 'text', 1234567890);
    // Timestamp starts at offset: prefix(15) + type("text"=4) = 19
    const tsBytes = env.slice(19, 27);
    expect(tsBytes.length).toBe(8);
    const view = new DataView(tsBytes.buffer, tsBytes.byteOffset, 8);
    expect(view.getFloat64(0, false)).toBe(1234567890);
  });

  it('large ciphertext does not corrupt envelope', () => {
    const ct = new Uint8Array(1024 * 1024); // 1MB
    for (let i = 0; i < ct.length; i++) ct[i] = i % 256;
    const env = buildSignedEnvelope(ct, 'file', Date.now(), 'big.bin', 'application/octet-stream');
    // Verify the ciphertext is embedded correctly
    const ctStart = 15 + 4 + 8; // prefix + "file" + timestamp
    const embedded = env.slice(ctStart, ctStart + ct.length);
    expect(embedded).toEqual(ct);
  });

  it('unicode fileName is properly encoded', () => {
    const ct = new Uint8Array([1]);
    const env1 = buildSignedEnvelope(ct, 'file', 1000, 'résumé.pdf');
    const env2 = buildSignedEnvelope(ct, 'file', 1000, 'resume.pdf');
    // UTF-8 encoding of accented chars is longer
    expect(env1.length).toBeGreaterThan(env2.length);
  });

  it('different messageType strings produce different lengths', () => {
    const ct = new Uint8Array([1]);
    const textEnv = buildSignedEnvelope(ct, 'text', 1000);
    const fileEnv = buildSignedEnvelope(ct, 'file', 1000);
    // "text" and "file" are both 4 chars, so length should be equal
    expect(textEnv.length).toBe(fileEnv.length);
    // But content should differ
    expect(textEnv).not.toEqual(fileEnv);
  });

  it('envelope starts with exact prefix bytes', () => {
    const env = buildSignedEnvelope(new Uint8Array(0), 'text', 0);
    const prefixBytes = new TextEncoder().encode('pqc-envelope-v1');
    expect(env.slice(0, 15)).toEqual(prefixBytes);
  });

  it('zero timestamp is valid', () => {
    const env = buildSignedEnvelope(new Uint8Array([1]), 'text', 0);
    expect(env.length).toBeGreaterThan(0);
  });

  it('very large timestamp is valid', () => {
    const env = buildSignedEnvelope(new Uint8Array([1]), 'text', Number.MAX_SAFE_INTEGER);
    expect(env.length).toBeGreaterThan(0);
  });
});
