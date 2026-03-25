import { describe, it, expect } from 'vitest';
import { generateIdentity } from '../../src/crypto/identity';
import { encapsulateSession, decapsulateSession } from '../../src/crypto/kem';
import { encryptString, decryptString, encrypt, decrypt } from '../../src/crypto/symmetric';
import { signMessage, verifySignature } from '../../src/crypto/signing';
import { buildSignedEnvelope } from '../../src/crypto/envelope';
import { toBase64, fromBase64 } from '../../src/crypto/encoding';

/** Helper: set up a key exchange between two identities and return the shared key */
async function setupSession(alice: Awaited<ReturnType<typeof generateIdentity>>, bob: Awaited<ReturnType<typeof generateIdentity>>) {
  const { ciphertext: kemCt, session: bobSession } = await encapsulateSession(
    alice.kem.publicKey, alice.dsa.publicKey,
  );
  const aliceSession = await decapsulateSession(kemCt, alice.kem.secretKey, bob.dsa.publicKey);
  expect(aliceSession.sharedSecret).toEqual(bobSession.sharedSecret);
  return aliceSession.sharedSecret;
}

describe('end-to-end crypto flow — extended', () => {
  it('three-party: Alice-Bob and Alice-Charlie have independent sessions', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');
    const charlie = await generateIdentity('charlie');

    const keyAB = await setupSession(alice, bob);
    const keyAC = await setupSession(alice, charlie);

    // Keys should differ
    expect(keyAB).not.toEqual(keyAC);

    // Alice sends to Bob — only Bob can decrypt
    const ct = encryptString(keyAB, 'For Bob only');
    expect(decryptString(keyAB, ct)).toBe('For Bob only');
    expect(() => decryptString(keyAC, ct)).toThrow();
  });

  it('empty file transfer', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');
    const sharedKey = await setupSession(alice, bob);

    const emptyFile = new Uint8Array(0);
    const ts = Date.now();
    const ct = encrypt(sharedKey, emptyFile);
    const envelope = buildSignedEnvelope(ct, 'file', ts, 'empty.txt', 'text/plain');
    const sig = await signMessage(alice.dsa.secretKey, envelope);

    const envReceived = buildSignedEnvelope(ct, 'file', ts, 'empty.txt', 'text/plain');
    expect(await verifySignature(alice.dsa.publicKey, envReceived, sig)).toBe(true);
    expect(decrypt(sharedKey, ct)).toEqual(emptyFile);
  });

  it('max demo file size (5MB) encrypts and decrypts', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');
    const sharedKey = await setupSession(alice, bob);

    const bigFile = new Uint8Array(5 * 1024 * 1024);
    for (let i = 0; i < bigFile.length; i++) bigFile[i] = i % 256;

    const ct = encrypt(sharedKey, bigFile);
    const decrypted = decrypt(sharedKey, ct);
    expect(decrypted).toEqual(bigFile);
  });

  it('relay-tampered MIME type is detected', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');
    const sharedKey = await setupSession(alice, bob);

    const ts = Date.now();
    const ct = encrypt(sharedKey, new Uint8Array([1, 2, 3]));
    const envelope = buildSignedEnvelope(ct, 'file', ts, 'doc.pdf', 'application/pdf');
    const sig = await signMessage(alice.dsa.secretKey, envelope);

    // Relay changes MIME type
    const tampered = buildSignedEnvelope(ct, 'file', ts, 'doc.pdf', 'application/x-executable');
    expect(await verifySignature(alice.dsa.publicKey, tampered, sig)).toBe(false);
  });

  it('relay-tampered messageType (text→file) is detected', async () => {
    const alice = await generateIdentity('alice');
    const sharedKey = new Uint8Array(32).fill(42);

    const ts = Date.now();
    const ct = encryptString(sharedKey, 'hello');
    const envelope = buildSignedEnvelope(ct, 'text', ts);
    const sig = await signMessage(alice.dsa.secretKey, envelope);

    // Relay changes message type from text to file
    const tampered = buildSignedEnvelope(ct, 'file', ts);
    expect(await verifySignature(alice.dsa.publicKey, tampered, sig)).toBe(false);
  });

  it('bidirectional conversation: both sides send and receive', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');
    const sharedKey = await setupSession(alice, bob);

    // Alice sends to Bob
    const ts1 = Date.now();
    const ct1 = encryptString(sharedKey, 'Hello Bob!');
    const env1 = buildSignedEnvelope(ct1, 'text', ts1);
    const sig1 = await signMessage(alice.dsa.secretKey, env1);
    expect(await verifySignature(alice.dsa.publicKey, env1, sig1)).toBe(true);
    expect(decryptString(sharedKey, ct1)).toBe('Hello Bob!');

    // Bob sends to Alice
    const ts2 = Date.now();
    const ct2 = encryptString(sharedKey, 'Hello Alice!');
    const env2 = buildSignedEnvelope(ct2, 'text', ts2);
    const sig2 = await signMessage(bob.dsa.secretKey, env2);
    expect(await verifySignature(bob.dsa.publicKey, env2, sig2)).toBe(true);
    expect(decryptString(sharedKey, ct2)).toBe('Hello Alice!');

    // Cross-verification: Alice's sig doesn't validate with Bob's key
    expect(await verifySignature(bob.dsa.publicKey, env1, sig1)).toBe(false);
  });

  it('session re-establishment produces different keys', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');

    const key1 = await setupSession(alice, bob);
    const key2 = await setupSession(alice, bob);
    expect(key1).not.toEqual(key2);

    // Messages encrypted with key1 cannot be decrypted with key2
    const ct = encryptString(key1, 'old session');
    expect(() => decryptString(key2, ct)).toThrow();
  });

  it('base64 transport preserves all crypto material', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');
    const sharedKey = await setupSession(alice, bob);

    const ts = Date.now();
    const ct = encrypt(sharedKey, new Uint8Array([0xff, 0x00, 0xfe, 0x01]));
    const sig = await signMessage(alice.dsa.secretKey, buildSignedEnvelope(ct, 'file', ts, 'bin.dat', 'application/octet-stream'));

    // Simulate full base64 round-trip (as WebSocket transport does)
    const ctB64 = toBase64(ct);
    const sigB64 = toBase64(sig);

    const ctBack = fromBase64(ctB64);
    const sigBack = fromBase64(sigB64);

    expect(ctBack).toEqual(ct);
    expect(sigBack).toEqual(sig);

    const env = buildSignedEnvelope(ctBack, 'file', ts, 'bin.dat', 'application/octet-stream');
    expect(await verifySignature(alice.dsa.publicKey, env, sigBack)).toBe(true);
    expect(decrypt(sharedKey, ctBack)).toEqual(new Uint8Array([0xff, 0x00, 0xfe, 0x01]));
  });

  it('unicode message through full pipeline', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');
    const sharedKey = await setupSession(alice, bob);

    const unicodeMessages = [
      'Hello \ud83d\udd12',
      '\u91cf\u5b50\u5bc6\u7801\u5b66\u6d4b\u8bd5', // Quantum cryptography test
      '\u0410\u043b\u0438\u0441\u0430 \u0438 \u0411\u043e\u0431', // Alice and Bob in Russian
      '\ud83c\uddf5\ud83c\uddf6\ud83c\udde8', // flag emojis
    ];

    for (const msg of unicodeMessages) {
      const ts = Date.now();
      const ct = encryptString(sharedKey, msg);
      const env = buildSignedEnvelope(ct, 'text', ts);
      const sig = await signMessage(alice.dsa.secretKey, env);

      const ctTransported = fromBase64(toBase64(ct));
      const sigTransported = fromBase64(toBase64(sig));
      const envReceived = buildSignedEnvelope(ctTransported, 'text', ts);

      expect(await verifySignature(alice.dsa.publicKey, envReceived, sigTransported)).toBe(true);
      expect(decryptString(sharedKey, ctTransported)).toBe(msg);
    }
  });

  it('file with unicode filename through full pipeline', async () => {
    const alice = await generateIdentity('alice');
    const bob = await generateIdentity('bob');
    const sharedKey = await setupSession(alice, bob);

    const fileName = '\u6d4b\u8bd5\u6587\u4ef6.pdf';
    const fileType = 'application/pdf';
    const fileData = new Uint8Array(100).fill(0xab);
    const ts = Date.now();

    const ct = encrypt(sharedKey, fileData);
    const env = buildSignedEnvelope(ct, 'file', ts, fileName, fileType);
    const sig = await signMessage(alice.dsa.secretKey, env);

    const envReceived = buildSignedEnvelope(ct, 'file', ts, fileName, fileType);
    expect(await verifySignature(alice.dsa.publicKey, envReceived, sig)).toBe(true);
    expect(decrypt(sharedKey, ct)).toEqual(fileData);
  });
});
