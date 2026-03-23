import { describe, it, expect } from 'vitest';
import { generateIdentity } from '../../src/crypto/identity';
import { encapsulateSession, decapsulateSession } from '../../src/crypto/kem';

describe('ML-KEM key exchange', () => {
  it('encapsulate + decapsulate produce the same shared secret', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');

    // Bob encapsulates for Alice
    const { ciphertext, session: bobSession } = await encapsulateSession(
      alice.kem.publicKey,
      alice.dsa.publicKey,
    );

    expect(ciphertext).toBeInstanceOf(Uint8Array);
    expect(ciphertext.length).toBe(1088); // ML-KEM-768 ciphertext size
    expect(bobSession.sharedSecret.length).toBe(32);

    // Alice decapsulates
    const aliceSession = await decapsulateSession(
      ciphertext,
      alice.kem.secretKey,
      bob.dsa.publicKey,
    );

    expect(aliceSession.sharedSecret.length).toBe(32);
    expect(aliceSession.sharedSecret).toEqual(bobSession.sharedSecret);
  });

  it('stores peer DSA public key in session', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');

    const { ciphertext, session: bobSession } = await encapsulateSession(
      alice.kem.publicKey,
      alice.dsa.publicKey,
    );

    expect(bobSession.peerDsaPublicKey).toEqual(alice.dsa.publicKey);

    const aliceSession = await decapsulateSession(
      ciphertext,
      alice.kem.secretKey,
      bob.dsa.publicKey,
    );

    expect(aliceSession.peerDsaPublicKey).toEqual(bob.dsa.publicKey);
  });

  it('sets establishedAt timestamp', async () => {
    const alice = await generateIdentity('alice');
    const before = Date.now();

    const { ciphertext, session } = await encapsulateSession(
      alice.kem.publicKey,
      alice.dsa.publicKey,
    );

    expect(session.establishedAt).toBeGreaterThanOrEqual(before);
    expect(session.establishedAt).toBeLessThanOrEqual(Date.now());
  });

  it('different encapsulations produce different shared secrets', async () => {
    const alice = await generateIdentity('alice');

    const r1 = await encapsulateSession(alice.kem.publicKey, alice.dsa.publicKey);
    const r2 = await encapsulateSession(alice.kem.publicKey, alice.dsa.publicKey);

    expect(r1.session.sharedSecret).not.toEqual(r2.session.sharedSecret);
    expect(r1.ciphertext).not.toEqual(r2.ciphertext);
  });
});
