import { describe, it, expect } from 'vitest';
import { generateIdentity } from '../../src/crypto/identity';

describe('generateIdentity — extended', () => {
  it('preserves nickname exactly', async () => {
    const id = await generateIdentity('Alice With Spaces');
    expect(id.nickname).toBe('Alice With Spaces');
  });

  it('handles unicode nickname', async () => {
    const id = await generateIdentity('用户');
    expect(id.nickname).toBe('用户');
  });

  it('handles empty nickname', async () => {
    const id = await generateIdentity('');
    expect(id.nickname).toBe('');
    // Keys should still be generated
    expect(id.kem.publicKey.length).toBe(1184);
    expect(id.dsa.publicKey.length).toBe(1952);
  });

  it('same nickname produces different keys each time', async () => {
    const id1 = await generateIdentity('alice');
    const id2 = await generateIdentity('alice');
    expect(id1.kem.publicKey).not.toEqual(id2.kem.publicKey);
    expect(id1.kem.secretKey).not.toEqual(id2.kem.secretKey);
    expect(id1.dsa.publicKey).not.toEqual(id2.dsa.publicKey);
    expect(id1.dsa.secretKey).not.toEqual(id2.dsa.secretKey);
  });

  it('KEM and DSA keys are distinct (not related)', async () => {
    const id = await generateIdentity('test');
    // Public keys should be completely different
    expect(id.kem.publicKey.slice(0, 32)).not.toEqual(id.dsa.publicKey.slice(0, 32));
  });

  it('keys are non-zero', async () => {
    const id = await generateIdentity('test');
    const kemPubZero = id.kem.publicKey.every((b) => b === 0);
    const dsaPubZero = id.dsa.publicKey.every((b) => b === 0);
    expect(kemPubZero).toBe(false);
    expect(dsaPubZero).toBe(false);
  });

  it('generated keys are usable for encapsulate + sign', async () => {
    const { ml_kem768 } = await import('fips-crypto/auto');
    const { ml_dsa65 } = await import('fips-crypto/auto');
    const id = await generateIdentity('test');

    // KEM round-trip
    const { ciphertext, sharedSecret: ss1 } = await ml_kem768.encapsulate(id.kem.publicKey);
    const ss2 = await ml_kem768.decapsulate(id.kem.secretKey, ciphertext);
    expect(ss1).toEqual(ss2);

    // DSA round-trip
    const msg = new Uint8Array([1, 2, 3]);
    const sig = await ml_dsa65.sign(id.dsa.secretKey, msg);
    const valid = await ml_dsa65.verify(id.dsa.publicKey, msg, sig);
    expect(valid).toBe(true);
  });
});
