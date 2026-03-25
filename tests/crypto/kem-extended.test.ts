import { describe, it, expect } from 'vitest';
import { generateIdentity } from '../../src/crypto/identity';
import { encapsulateSession, decapsulateSession } from '../../src/crypto/kem';

describe('ML-KEM key exchange — extended', () => {
  it('shared secret is exactly 32 bytes', async () => {
    const alice = await generateIdentity('alice');
    const { ciphertext, session } = await encapsulateSession(
      alice.kem.publicKey,
      alice.dsa.publicKey,
    );
    expect(session.sharedSecret.length).toBe(32);

    const decap = await decapsulateSession(ciphertext, alice.kem.secretKey, alice.dsa.publicKey);
    expect(decap.sharedSecret.length).toBe(32);
  });

  it('wrong secret key produces a different shared secret (decapsulation failure)', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');

    const { ciphertext, session: bobSession } = await encapsulateSession(
      alice.kem.publicKey,
      alice.dsa.publicKey,
    );

    // Use Bob's KEM secret key instead of Alice's — should get a different shared secret
    // ML-KEM is designed to not throw but return a random shared secret on bad decapsulation
    const wrongSession = await decapsulateSession(ciphertext, bob.kem.secretKey, alice.dsa.publicKey);
    expect(wrongSession.sharedSecret).not.toEqual(bobSession.sharedSecret);
  });

  it('same keypair can be used for multiple independent sessions', async () => {
    const alice = await generateIdentity('alice');

    const r1 = await encapsulateSession(alice.kem.publicKey, alice.dsa.publicKey);
    const r2 = await encapsulateSession(alice.kem.publicKey, alice.dsa.publicKey);
    const r3 = await encapsulateSession(alice.kem.publicKey, alice.dsa.publicKey);

    const s1 = await decapsulateSession(r1.ciphertext, alice.kem.secretKey, alice.dsa.publicKey);
    const s2 = await decapsulateSession(r2.ciphertext, alice.kem.secretKey, alice.dsa.publicKey);
    const s3 = await decapsulateSession(r3.ciphertext, alice.kem.secretKey, alice.dsa.publicKey);

    // Each session has a unique shared secret
    expect(s1.sharedSecret).toEqual(r1.session.sharedSecret);
    expect(s2.sharedSecret).toEqual(r2.session.sharedSecret);
    expect(s3.sharedSecret).toEqual(r3.session.sharedSecret);
    expect(s1.sharedSecret).not.toEqual(s2.sharedSecret);
    expect(s2.sharedSecret).not.toEqual(s3.sharedSecret);
  });

  it('bidirectional: both sides can initiate and encapsulate', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');

    // Alice → Bob
    const { ciphertext: ct1, session: aliceSide1 } = await encapsulateSession(
      bob.kem.publicKey,
      bob.dsa.publicKey,
    );
    const bobSide1 = await decapsulateSession(ct1, bob.kem.secretKey, alice.dsa.publicKey);
    expect(aliceSide1.sharedSecret).toEqual(bobSide1.sharedSecret);

    // Bob → Alice
    const { ciphertext: ct2, session: bobSide2 } = await encapsulateSession(
      alice.kem.publicKey,
      alice.dsa.publicKey,
    );
    const aliceSide2 = await decapsulateSession(ct2, alice.kem.secretKey, bob.dsa.publicKey);
    expect(bobSide2.sharedSecret).toEqual(aliceSide2.sharedSecret);

    // The two sessions have different keys
    expect(aliceSide1.sharedSecret).not.toEqual(aliceSide2.sharedSecret);
  });

  it('shared secret bytes are not all zeros', async () => {
    const alice = await generateIdentity('alice');
    const { session } = await encapsulateSession(alice.kem.publicKey, alice.dsa.publicKey);
    const allZeros = new Uint8Array(32).fill(0);
    expect(session.sharedSecret).not.toEqual(allZeros);
  });

  it('ciphertext bytes are not all zeros', async () => {
    const alice = await generateIdentity('alice');
    const { ciphertext } = await encapsulateSession(alice.kem.publicKey, alice.dsa.publicKey);
    const allZeros = new Uint8Array(1088).fill(0);
    expect(ciphertext).not.toEqual(allZeros);
  });

  it('throws on invalid public key length', async () => {
    const badKey = new Uint8Array(100); // wrong size
    const dsaKey = new Uint8Array(1952);
    await expect(encapsulateSession(badKey, dsaKey)).rejects.toThrow();
  });

  it('throws on invalid ciphertext length during decapsulation', async () => {
    const alice = await generateIdentity('alice');
    const badCt = new Uint8Array(100); // wrong size
    await expect(
      decapsulateSession(badCt, alice.kem.secretKey, alice.dsa.publicKey),
    ).rejects.toThrow();
  });
});
