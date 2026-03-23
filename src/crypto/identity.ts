import { ml_kem768 } from 'fips-crypto/auto';
import { ml_dsa65 } from 'fips-crypto/auto';
import type { IdentityKeys } from './types';

/**
 * Generate a complete identity: ML-KEM-768 + ML-DSA-65 keypairs.
 * Both keypair generations run in parallel.
 */
export async function generateIdentity(nickname: string): Promise<IdentityKeys> {
  const [kemKeys, dsaKeys] = await Promise.all([
    ml_kem768.keygen(),
    ml_dsa65.keygen(),
  ]);

  return {
    nickname,
    kem: { publicKey: kemKeys.publicKey, secretKey: kemKeys.secretKey },
    dsa: { publicKey: dsaKeys.publicKey, secretKey: dsaKeys.secretKey },
  };
}
