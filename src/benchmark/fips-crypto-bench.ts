import {
  ml_kem512, ml_kem768, ml_kem1024,
  ml_dsa44, ml_dsa65, ml_dsa87,
} from 'fips-crypto/auto';
import type { BenchmarkTask } from './types';

const testMessage = new Uint8Array(64).fill(0xab);

export async function getFipsCryptoTasks(): Promise<BenchmarkTask[]> {
  // Pre-generate keys for encapsulate/decapsulate/sign/verify benchmarks
  const [kem512, kem768, kem1024] = await Promise.all([
    ml_kem512.keygen(),
    ml_kem768.keygen(),
    ml_kem1024.keygen(),
  ]);
  const [dsa44, dsa65, dsa87] = await Promise.all([
    ml_dsa44.keygen(),
    ml_dsa65.keygen(),
    ml_dsa87.keygen(),
  ]);

  // Pre-encapsulate for decapsulate benchmarks
  const [enc512, enc768, enc1024] = await Promise.all([
    ml_kem512.encapsulate(kem512.publicKey),
    ml_kem768.encapsulate(kem768.publicKey),
    ml_kem1024.encapsulate(kem1024.publicKey),
  ]);

  // Pre-sign for verify benchmarks
  const [sig44, sig65, sig87] = await Promise.all([
    ml_dsa44.sign(dsa44.secretKey, testMessage),
    ml_dsa65.sign(dsa65.secretKey, testMessage),
    ml_dsa87.sign(dsa87.secretKey, testMessage),
  ]);

  return [
    // ML-KEM keygen
    { algorithm: 'ML-KEM-512', operation: 'keygen', fn: () => ml_kem512.keygen().then(() => {}) },
    { algorithm: 'ML-KEM-768', operation: 'keygen', fn: () => ml_kem768.keygen().then(() => {}) },
    { algorithm: 'ML-KEM-1024', operation: 'keygen', fn: () => ml_kem1024.keygen().then(() => {}) },

    // ML-KEM encapsulate
    { algorithm: 'ML-KEM-512', operation: 'encapsulate', fn: () => ml_kem512.encapsulate(kem512.publicKey).then(() => {}) },
    { algorithm: 'ML-KEM-768', operation: 'encapsulate', fn: () => ml_kem768.encapsulate(kem768.publicKey).then(() => {}) },
    { algorithm: 'ML-KEM-1024', operation: 'encapsulate', fn: () => ml_kem1024.encapsulate(kem1024.publicKey).then(() => {}) },

    // ML-KEM decapsulate
    { algorithm: 'ML-KEM-512', operation: 'decapsulate', fn: () => ml_kem512.decapsulate(kem512.secretKey, enc512.ciphertext).then(() => {}) },
    { algorithm: 'ML-KEM-768', operation: 'decapsulate', fn: () => ml_kem768.decapsulate(kem768.secretKey, enc768.ciphertext).then(() => {}) },
    { algorithm: 'ML-KEM-1024', operation: 'decapsulate', fn: () => ml_kem1024.decapsulate(kem1024.secretKey, enc1024.ciphertext).then(() => {}) },

    // ML-DSA keygen
    { algorithm: 'ML-DSA-44', operation: 'keygen', fn: () => ml_dsa44.keygen().then(() => {}) },
    { algorithm: 'ML-DSA-65', operation: 'keygen', fn: () => ml_dsa65.keygen().then(() => {}) },
    { algorithm: 'ML-DSA-87', operation: 'keygen', fn: () => ml_dsa87.keygen().then(() => {}) },

    // ML-DSA sign
    { algorithm: 'ML-DSA-44', operation: 'sign', fn: () => ml_dsa44.sign(dsa44.secretKey, testMessage).then(() => {}) },
    { algorithm: 'ML-DSA-65', operation: 'sign', fn: () => ml_dsa65.sign(dsa65.secretKey, testMessage).then(() => {}) },
    { algorithm: 'ML-DSA-87', operation: 'sign', fn: () => ml_dsa87.sign(dsa87.secretKey, testMessage).then(() => {}) },

    // ML-DSA verify
    { algorithm: 'ML-DSA-44', operation: 'verify', fn: () => ml_dsa44.verify(dsa44.publicKey, testMessage, sig44).then(() => {}) },
    { algorithm: 'ML-DSA-65', operation: 'verify', fn: () => ml_dsa65.verify(dsa65.publicKey, testMessage, sig65).then(() => {}) },
    { algorithm: 'ML-DSA-87', operation: 'verify', fn: () => ml_dsa87.verify(dsa87.publicKey, testMessage, sig87).then(() => {}) },
  ];
}
