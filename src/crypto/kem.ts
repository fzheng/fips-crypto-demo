import { ml_kem768 } from 'fips-crypto/auto';
import type { SessionKeys } from './types';

/**
 * RESPONDER side: Encapsulate a shared secret using the initiator's ML-KEM-768 public key.
 */
export async function encapsulateSession(
  initiatorKemPublicKey: Uint8Array,
  initiatorDsaPublicKey: Uint8Array,
): Promise<{ ciphertext: Uint8Array; session: SessionKeys }> {
  const { ciphertext, sharedSecret } = await ml_kem768.encapsulate(initiatorKemPublicKey);

  return {
    ciphertext,
    session: {
      sharedSecret,
      peerDsaPublicKey: initiatorDsaPublicKey,
      establishedAt: Date.now(),
    },
  };
}

/**
 * INITIATOR side: Decapsulate the ciphertext to recover the shared secret.
 */
export async function decapsulateSession(
  ciphertext: Uint8Array,
  ownKemSecretKey: Uint8Array,
  peerDsaPublicKey: Uint8Array,
): Promise<SessionKeys> {
  const sharedSecret = await ml_kem768.decapsulate(ownKemSecretKey, ciphertext);

  return {
    sharedSecret,
    peerDsaPublicKey,
    establishedAt: Date.now(),
  };
}
