import { ml_dsa65 } from 'fips-crypto/auto';

/**
 * Sign a message (typically ciphertext bytes) with ML-DSA-65.
 */
export async function signMessage(
  secretKey: Uint8Array,
  message: Uint8Array,
): Promise<Uint8Array> {
  return ml_dsa65.sign(secretKey, message);
}

/**
 * Verify a ML-DSA-65 signature.
 */
export async function verifySignature(
  publicKey: Uint8Array,
  message: Uint8Array,
  signature: Uint8Array,
): Promise<boolean> {
  try {
    return await ml_dsa65.verify(publicKey, message, signature);
  } catch {
    return false;
  }
}
