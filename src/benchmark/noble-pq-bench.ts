import {
  ml_kem512, ml_kem768, ml_kem1024,
} from '@noble/post-quantum/ml-kem.js';
import {
  ml_dsa44, ml_dsa65, ml_dsa87,
} from '@noble/post-quantum/ml-dsa.js';
import type { BenchmarkTask } from './types';

const testMessage = new Uint8Array(64).fill(0xab);

export function getPureJsTasks(): BenchmarkTask[] {
  // Pre-generate keys
  const kem512 = ml_kem512.keygen();
  const kem768 = ml_kem768.keygen();
  const kem1024 = ml_kem1024.keygen();

  const dsa44 = ml_dsa44.keygen();
  const dsa65 = ml_dsa65.keygen();
  const dsa87 = ml_dsa87.keygen();

  // Pre-encapsulate for decapsulate benchmarks
  const enc512 = ml_kem512.encapsulate(kem512.publicKey);
  const enc768 = ml_kem768.encapsulate(kem768.publicKey);
  const enc1024 = ml_kem1024.encapsulate(kem1024.publicKey);

  // Pre-sign for verify benchmarks
  // noble param order: sign(message, secretKey)
  const sig44 = ml_dsa44.sign(testMessage, dsa44.secretKey);
  const sig65 = ml_dsa65.sign(testMessage, dsa65.secretKey);
  const sig87 = ml_dsa87.sign(testMessage, dsa87.secretKey);

  return [
    // ML-KEM keygen
    { algorithm: 'ML-KEM-512', operation: 'keygen', fn: async () => { ml_kem512.keygen(); } },
    { algorithm: 'ML-KEM-768', operation: 'keygen', fn: async () => { ml_kem768.keygen(); } },
    { algorithm: 'ML-KEM-1024', operation: 'keygen', fn: async () => { ml_kem1024.keygen(); } },

    // ML-KEM encapsulate
    { algorithm: 'ML-KEM-512', operation: 'encapsulate', fn: async () => { ml_kem512.encapsulate(kem512.publicKey); } },
    { algorithm: 'ML-KEM-768', operation: 'encapsulate', fn: async () => { ml_kem768.encapsulate(kem768.publicKey); } },
    { algorithm: 'ML-KEM-1024', operation: 'encapsulate', fn: async () => { ml_kem1024.encapsulate(kem1024.publicKey); } },

    // ML-KEM decapsulate — noble: decapsulate(cipherText, secretKey)
    { algorithm: 'ML-KEM-512', operation: 'decapsulate', fn: async () => { ml_kem512.decapsulate(enc512.cipherText, kem512.secretKey); } },
    { algorithm: 'ML-KEM-768', operation: 'decapsulate', fn: async () => { ml_kem768.decapsulate(enc768.cipherText, kem768.secretKey); } },
    { algorithm: 'ML-KEM-1024', operation: 'decapsulate', fn: async () => { ml_kem1024.decapsulate(enc1024.cipherText, kem1024.secretKey); } },

    // ML-DSA keygen
    { algorithm: 'ML-DSA-44', operation: 'keygen', fn: async () => { ml_dsa44.keygen(); } },
    { algorithm: 'ML-DSA-65', operation: 'keygen', fn: async () => { ml_dsa65.keygen(); } },
    { algorithm: 'ML-DSA-87', operation: 'keygen', fn: async () => { ml_dsa87.keygen(); } },

    // ML-DSA sign — noble: sign(message, secretKey)
    { algorithm: 'ML-DSA-44', operation: 'sign', fn: async () => { ml_dsa44.sign(testMessage, dsa44.secretKey); } },
    { algorithm: 'ML-DSA-65', operation: 'sign', fn: async () => { ml_dsa65.sign(testMessage, dsa65.secretKey); } },
    { algorithm: 'ML-DSA-87', operation: 'sign', fn: async () => { ml_dsa87.sign(testMessage, dsa87.secretKey); } },

    // ML-DSA verify — noble: verify(signature, message, publicKey)
    { algorithm: 'ML-DSA-44', operation: 'verify', fn: async () => { ml_dsa44.verify(sig44, testMessage, dsa44.publicKey); } },
    { algorithm: 'ML-DSA-65', operation: 'verify', fn: async () => { ml_dsa65.verify(sig65, testMessage, dsa65.publicKey); } },
    { algorithm: 'ML-DSA-87', operation: 'verify', fn: async () => { ml_dsa87.verify(sig87, testMessage, dsa87.publicKey); } },
  ];
}
