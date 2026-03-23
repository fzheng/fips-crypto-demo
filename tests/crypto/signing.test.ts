import { describe, it, expect } from 'vitest';
import { generateIdentity } from '../../src/crypto/identity';
import { signMessage, verifySignature } from '../../src/crypto/signing';

describe('ML-DSA-65 signing', () => {
  it('sign and verify a message', async () => {
    const alice = await generateIdentity('alice');
    const message = new Uint8Array([1, 2, 3, 4, 5]);

    const signature = await signMessage(alice.dsa.secretKey, message);
    expect(signature).toBeInstanceOf(Uint8Array);
    expect(signature.length).toBe(3309); // ML-DSA-65 signature size

    const valid = await verifySignature(alice.dsa.publicKey, message, signature);
    expect(valid).toBe(true);
  });

  it('rejects tampered message', async () => {
    const alice = await generateIdentity('alice');
    const message = new Uint8Array([1, 2, 3]);
    const signature = await signMessage(alice.dsa.secretKey, message);

    const tampered = new Uint8Array([1, 2, 4]); // changed last byte
    const valid = await verifySignature(alice.dsa.publicKey, tampered, signature);
    expect(valid).toBe(false);
  });

  it('rejects wrong public key', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');
    const message = new Uint8Array([1, 2, 3]);

    const signature = await signMessage(alice.dsa.secretKey, message);
    const valid = await verifySignature(bob.dsa.publicKey, message, signature);
    expect(valid).toBe(false);
  });

  it('rejects tampered signature', async () => {
    const alice = await generateIdentity('alice');
    const message = new Uint8Array([1, 2, 3]);
    const signature = await signMessage(alice.dsa.secretKey, message);

    signature[0] ^= 0xff;
    const valid = await verifySignature(alice.dsa.publicKey, message, signature);
    expect(valid).toBe(false);
  });

  it('signs different messages with different signatures', async () => {
    const alice = await generateIdentity('alice');
    const sig1 = await signMessage(alice.dsa.secretKey, new Uint8Array([1]));
    const sig2 = await signMessage(alice.dsa.secretKey, new Uint8Array([2]));
    expect(sig1).not.toEqual(sig2);
  });
});
