import { describe, it, expect } from 'vitest';
import { generateIdentity } from '../../src/crypto/identity';

describe('generateIdentity', () => {
  it('generates ML-KEM-768 and ML-DSA-65 keypairs', async () => {
    const identity = await generateIdentity('alice');

    expect(identity.nickname).toBe('alice');

    // ML-KEM-768 key sizes
    expect(identity.kem.publicKey).toBeInstanceOf(Uint8Array);
    expect(identity.kem.secretKey).toBeInstanceOf(Uint8Array);
    expect(identity.kem.publicKey.length).toBe(1184);
    expect(identity.kem.secretKey.length).toBe(2400);

    // ML-DSA-65 key sizes
    expect(identity.dsa.publicKey).toBeInstanceOf(Uint8Array);
    expect(identity.dsa.secretKey).toBeInstanceOf(Uint8Array);
    expect(identity.dsa.publicKey.length).toBe(1952);
    expect(identity.dsa.secretKey.length).toBe(4032);
  });

  it('generates different keys each time', async () => {
    const a = await generateIdentity('alice');
    const b = await generateIdentity('bob');

    expect(a.kem.publicKey).not.toEqual(b.kem.publicKey);
    expect(a.dsa.publicKey).not.toEqual(b.dsa.publicKey);
  });
});
