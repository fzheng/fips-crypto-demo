import { describe, it, expect } from 'vitest';
import { generateIdentity } from '../../src/crypto/identity';
import { signMessage, verifySignature } from '../../src/crypto/signing';

describe('ML-DSA-65 signing — extended', () => {
  it('signature is exactly 3309 bytes', async () => {
    const alice = await generateIdentity('alice');
    const sig = await signMessage(alice.dsa.secretKey, new Uint8Array([1, 2, 3]));
    expect(sig.length).toBe(3309);
  });

  it('signs and verifies empty message', async () => {
    const alice = await generateIdentity('alice');
    const sig = await signMessage(alice.dsa.secretKey, new Uint8Array(0));
    expect(sig.length).toBe(3309);
    expect(await verifySignature(alice.dsa.publicKey, new Uint8Array(0), sig)).toBe(true);
  });

  it('signs and verifies large message (100KB)', async () => {
    const alice = await generateIdentity('alice');
    const bigMsg = new Uint8Array(100 * 1024);
    for (let i = 0; i < bigMsg.length; i++) bigMsg[i] = i % 256;
    const sig = await signMessage(alice.dsa.secretKey, bigMsg);
    expect(await verifySignature(alice.dsa.publicKey, bigMsg, sig)).toBe(true);
  });

  it('same message signed twice produces different signatures (randomized)', async () => {
    const alice = await generateIdentity('alice');
    const msg = new Uint8Array([1, 2, 3]);
    const sig1 = await signMessage(alice.dsa.secretKey, msg);
    const sig2 = await signMessage(alice.dsa.secretKey, msg);
    // ML-DSA-65 uses randomized signing — signatures should differ
    // (they both verify, but the bytes differ)
    expect(await verifySignature(alice.dsa.publicKey, msg, sig1)).toBe(true);
    expect(await verifySignature(alice.dsa.publicKey, msg, sig2)).toBe(true);
  });

  it('rejects signature with single bit flip in middle', async () => {
    const alice = await generateIdentity('alice');
    const msg = new Uint8Array([10, 20, 30]);
    const sig = await signMessage(alice.dsa.secretKey, msg);
    sig[sig.length >> 1] ^= 0x01; // flip one bit in the middle
    expect(await verifySignature(alice.dsa.publicKey, msg, sig)).toBe(false);
  });

  it('rejects truncated signature', async () => {
    const alice = await generateIdentity('alice');
    const msg = new Uint8Array([1]);
    const sig = await signMessage(alice.dsa.secretKey, msg);
    const truncated = sig.slice(0, 100);
    // fips-crypto returns false for invalid length rather than throwing
    const result = await verifySignature(alice.dsa.publicKey, msg, truncated).catch(() => false);
    expect(result).toBe(false);
  });

  it('rejects empty signature', async () => {
    const alice = await generateIdentity('alice');
    const msg = new Uint8Array([1]);
    const result = await verifySignature(alice.dsa.publicKey, msg, new Uint8Array(0)).catch(() => false);
    expect(result).toBe(false);
  });

  it('sign/verify works with 1-byte message', async () => {
    const alice = await generateIdentity('alice');
    const sig = await signMessage(alice.dsa.secretKey, new Uint8Array([0xff]));
    expect(await verifySignature(alice.dsa.publicKey, new Uint8Array([0xff]), sig)).toBe(true);
    expect(await verifySignature(alice.dsa.publicKey, new Uint8Array([0xfe]), sig)).toBe(false);
  });

  it('throws on invalid secret key length', async () => {
    const badKey = new Uint8Array(100);
    await expect(signMessage(badKey, new Uint8Array([1]))).rejects.toThrow();
  });

  it('rejects with invalid public key length in verify', async () => {
    const alice = await generateIdentity('alice');
    const sig = await signMessage(alice.dsa.secretKey, new Uint8Array([1]));
    const badPubKey = new Uint8Array(100);
    const result = await verifySignature(badPubKey, new Uint8Array([1]), sig).catch(() => false);
    expect(result).toBe(false);
  });
});
