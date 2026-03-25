import { describe, it, expect } from 'vitest';
import { runFullBenchmark } from '../../src/benchmark/runner';

describe('benchmark runner', () => {
  it('produces results for both libraries', async () => {
    const results = await runFullBenchmark(
      () => {},
      () => {},
      { iterations: 2, warmupIterations: 1 },
    );

    expect(results.length).toBeGreaterThan(0);

    const fipsResults = results.filter((r) => r.library === 'fips-crypto');
    const jsResults = results.filter((r) => r.library === 'pure-js');
    expect(fipsResults.length).toBeGreaterThan(0);
    expect(jsResults.length).toBeGreaterThan(0);
  }, 30000);

  it('each result has correct structure', async () => {
    const results = await runFullBenchmark(
      () => {},
      () => {},
      { iterations: 2, warmupIterations: 1 },
    );

    for (const r of results) {
      expect(r.algorithm).toBeTruthy();
      expect(r.operation).toBeTruthy();
      expect(['fips-crypto', 'pure-js']).toContain(r.library);
      expect(r.iterations).toBe(2);
      expect(r.totalMs).toBeGreaterThan(0);
      expect(r.avgMs).toBeGreaterThan(0);
      expect(r.opsPerSec).toBeGreaterThan(0);
    }
  }, 30000);

  it('avgMs equals totalMs / iterations', async () => {
    const results = await runFullBenchmark(
      () => {},
      () => {},
      { iterations: 3, warmupIterations: 1 },
    );

    for (const r of results) {
      expect(r.avgMs).toBeCloseTo(r.totalMs / r.iterations, 5);
    }
  }, 30000);

  it('opsPerSec equals 1000 / avgMs', async () => {
    const results = await runFullBenchmark(
      () => {},
      () => {},
      { iterations: 2, warmupIterations: 1 },
    );

    for (const r of results) {
      expect(r.opsPerSec).toBeCloseTo(1000 / r.avgMs, 5);
    }
  }, 30000);

  it('calls onProgress with increasing percentages', async () => {
    const progressValues: number[] = [];
    await runFullBenchmark(
      (pct) => progressValues.push(pct),
      () => {},
      { iterations: 2, warmupIterations: 1 },
    );

    expect(progressValues.length).toBeGreaterThan(0);
    // Progress should be monotonically non-decreasing
    for (let i = 1; i < progressValues.length; i++) {
      expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
    }
    // Should end at 100
    expect(progressValues[progressValues.length - 1]).toBe(100);
  }, 30000);

  it('calls onResult for each completed task', async () => {
    const resultCallbacks: string[] = [];
    const results = await runFullBenchmark(
      () => {},
      (r) => resultCallbacks.push(`${r.library}:${r.algorithm}:${r.operation}`),
      { iterations: 2, warmupIterations: 1 },
    );

    expect(resultCallbacks.length).toBe(results.length);
  }, 30000);

  it('covers keygen, encapsulate, decapsulate for ML-KEM', async () => {
    const results = await runFullBenchmark(
      () => {},
      () => {},
      { iterations: 2, warmupIterations: 1 },
    );

    const kemOps = results
      .filter((r) => r.algorithm.includes('KEM'))
      .map((r) => r.operation);

    expect(kemOps).toContain('keygen');
    expect(kemOps).toContain('encapsulate');
    expect(kemOps).toContain('decapsulate');
  }, 30000);

  it('covers keygen, sign, verify for ML-DSA', async () => {
    const results = await runFullBenchmark(
      () => {},
      () => {},
      { iterations: 2, warmupIterations: 1 },
    );

    const dsaOps = results
      .filter((r) => r.algorithm.includes('DSA'))
      .map((r) => r.operation);

    expect(dsaOps).toContain('keygen');
    expect(dsaOps).toContain('sign');
    expect(dsaOps).toContain('verify');
  }, 30000);
});
