import { describe, it, expect } from 'vitest';
import { generateIdentity } from '../../src/crypto/identity';
import { encapsulateSession, decapsulateSession } from '../../src/crypto/kem';
import { encryptString, decryptString, encrypt, decrypt } from '../../src/crypto/symmetric';
import { signMessage, verifySignature } from '../../src/crypto/signing';
import { buildSignedEnvelope } from '../../src/crypto/envelope';
import { toBase64, fromBase64 } from '../../src/crypto/encoding';

describe('end-to-end crypto flow', () => {
  it('full text message exchange between two users', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');

    // Key exchange
    const { ciphertext: kemCt, session: bobSession } = await encapsulateSession(
      alice.kem.publicKey, alice.dsa.publicKey,
    );
    const aliceSession = await decapsulateSession(kemCt, alice.kem.secretKey, bob.dsa.publicKey);
    expect(aliceSession.sharedSecret).toEqual(bobSession.sharedSecret);
    const sharedKey = aliceSession.sharedSecret;

    // Alice sends a message
    const message = 'Hello Bob! This is quantum-safe.';
    const timestamp = Date.now();
    const ct = encryptString(sharedKey, message);

    // Sign the full envelope (ciphertext + metadata)
    const envelope = buildSignedEnvelope(ct, 'text', timestamp);
    const sig = await signMessage(alice.dsa.secretKey, envelope);

    // Simulate transport
    const ctReceived = fromBase64(toBase64(ct));
    const sigReceived = fromBase64(toBase64(sig));

    // Bob rebuilds envelope and verifies
    const envelopeReceived = buildSignedEnvelope(ctReceived, 'text', timestamp);
    const valid = await verifySignature(alice.dsa.publicKey, envelopeReceived, sigReceived);
    expect(valid).toBe(true);

    const decrypted = decryptString(sharedKey, ctReceived);
    expect(decrypted).toBe(message);
  });

  it('full file exchange between two users', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');

    const { ciphertext: kemCt, session: bobSession } = await encapsulateSession(
      alice.kem.publicKey, alice.dsa.publicKey,
    );
    const aliceSession = await decapsulateSession(kemCt, alice.kem.secretKey, bob.dsa.publicKey);
    const sharedKey = aliceSession.sharedSecret;

    const fileBytes = new Uint8Array(5000);
    for (let i = 0; i < fileBytes.length; i++) fileBytes[i] = i % 256;

    const timestamp = Date.now();
    const ct = encrypt(sharedKey, fileBytes);
    const envelope = buildSignedEnvelope(ct, 'file', timestamp, 'test.png', 'image/png');
    const sig = await signMessage(alice.dsa.secretKey, envelope);

    // Transport
    const ctReceived = fromBase64(toBase64(ct));
    const sigReceived = fromBase64(toBase64(sig));

    // Bob verifies (must rebuild envelope with same metadata)
    const envReceived = buildSignedEnvelope(ctReceived, 'file', timestamp, 'test.png', 'image/png');
    expect(await verifySignature(alice.dsa.publicKey, envReceived, sigReceived)).toBe(true);

    const decryptedFile = decrypt(sharedKey, ctReceived);
    expect(decryptedFile).toEqual(fileBytes);
  });

  it('detects relay-tampered metadata (fileName rewritten)', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');

    const { ciphertext: kemCt, session: bobSession } = await encapsulateSession(
      alice.kem.publicKey, alice.dsa.publicKey,
    );
    const aliceSession = await decapsulateSession(kemCt, alice.kem.secretKey, bob.dsa.publicKey);
    const sharedKey = aliceSession.sharedSecret;

    const timestamp = Date.now();
    const ct = encrypt(sharedKey, new Uint8Array([1, 2, 3]));
    const envelope = buildSignedEnvelope(ct, 'file', timestamp, 'real.png', 'image/png');
    const sig = await signMessage(alice.dsa.secretKey, envelope);

    // Relay rewrites the filename
    const tamperedEnvelope = buildSignedEnvelope(ct, 'file', timestamp, 'malware.exe', 'image/png');
    const valid = await verifySignature(alice.dsa.publicKey, tamperedEnvelope, sig);
    expect(valid).toBe(false); // signature breaks when metadata changes
  });

  it('detects relay-tampered timestamp', async () => {
    const alice = await generateIdentity('alice');

    const timestamp = Date.now();
    const ct = encryptString(new Uint8Array(32), 'hello');
    const envelope = buildSignedEnvelope(ct, 'text', timestamp);
    const sig = await signMessage(alice.dsa.secretKey, envelope);

    // Relay rewrites the timestamp
    const tamperedEnvelope = buildSignedEnvelope(ct, 'text', timestamp + 60000);
    const valid = await verifySignature(alice.dsa.publicKey, tamperedEnvelope, sig);
    expect(valid).toBe(false);
  });

  it('rejects message from impersonator', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');
    const eve = await generateIdentity('eve');

    const { ciphertext: kemCt, session: bobSession } = await encapsulateSession(
      alice.kem.publicKey, alice.dsa.publicKey,
    );
    const aliceSession = await decapsulateSession(kemCt, alice.kem.secretKey, bob.dsa.publicKey);
    const sharedKey = aliceSession.sharedSecret;

    const timestamp = Date.now();
    const forgedCt = encryptString(sharedKey, 'I am Alice, trust me');
    const envelope = buildSignedEnvelope(forgedCt, 'text', timestamp);
    const eveSig = await signMessage(eve.dsa.secretKey, envelope);

    // Bob tries to verify with Alice's key — should fail
    const valid = await verifySignature(alice.dsa.publicKey, envelope, eveSig);
    expect(valid).toBe(false);
  });

  it('detects tampered ciphertext', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');

    const { ciphertext: kemCt, session: bobSession } = await encapsulateSession(
      alice.kem.publicKey, alice.dsa.publicKey,
    );
    const aliceSession = await decapsulateSession(kemCt, alice.kem.secretKey, bob.dsa.publicKey);
    const sharedKey = aliceSession.sharedSecret;

    const timestamp = Date.now();
    const ct = encryptString(sharedKey, 'secret');
    const envelope = buildSignedEnvelope(ct, 'text', timestamp);
    const sig = await signMessage(alice.dsa.secretKey, envelope);

    // Tamper ciphertext
    const tampered = new Uint8Array(ct);
    tampered[tampered.length - 5] ^= 0xff;

    const tamperedEnvelope = buildSignedEnvelope(tampered, 'text', timestamp);
    expect(await verifySignature(alice.dsa.publicKey, tamperedEnvelope, sig)).toBe(false);
    expect(() => decrypt(sharedKey, tampered)).toThrow();
  });

  it('multiple messages in the same session', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');

    const { ciphertext: kemCt, session: bobSession } = await encapsulateSession(
      alice.kem.publicKey, alice.dsa.publicKey,
    );
    const aliceSession = await decapsulateSession(kemCt, alice.kem.secretKey, bob.dsa.publicKey);
    const sharedKey = aliceSession.sharedSecret;

    const messages = ['first', 'second', 'third', 'Hello 🔒!'];

    for (const msg of messages) {
      const ts = Date.now();
      const ct = encryptString(sharedKey, msg);
      const env = buildSignedEnvelope(ct, 'text', ts);
      const sig = await signMessage(alice.dsa.secretKey, env);
      expect(await verifySignature(alice.dsa.publicKey, env, sig)).toBe(true);
      expect(decryptString(sharedKey, ct)).toBe(msg);
    }
  });
});
