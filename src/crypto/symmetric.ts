import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { managedNonce } from '@noble/ciphers/utils.js';
import { toBytes, fromBytes } from './encoding';

/**
 * Encrypt plaintext bytes with XChaCha20-Poly1305.
 * A random 24-byte nonce is automatically generated and prepended to the output.
 * Key must be 32 bytes (the ML-KEM shared secret).
 */
export function encrypt(key: Uint8Array, plaintext: Uint8Array): Uint8Array {
  const cipher = managedNonce(xchacha20poly1305)(key);
  return cipher.encrypt(plaintext);
}

/**
 * Decrypt ciphertext produced by encrypt().
 * Expects the 24-byte nonce prepended to the ciphertext.
 * Throws if authentication fails (tampered data).
 */
export function decrypt(key: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  const cipher = managedNonce(xchacha20poly1305)(key);
  return cipher.decrypt(ciphertext);
}

/** Encrypt a UTF-8 string message. */
export function encryptString(key: Uint8Array, message: string): Uint8Array {
  return encrypt(key, toBytes(message));
}

/** Decrypt to a UTF-8 string. */
export function decryptString(key: Uint8Array, ciphertext: Uint8Array): string {
  return fromBytes(decrypt(key, ciphertext));
}
