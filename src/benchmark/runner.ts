import type { BenchmarkConfig, BenchmarkTask } from './types';
import type { BenchmarkResult } from '../store/benchmark-store';
import { getFipsCryptoTasks } from './fips-crypto-bench';
import { getPureJsTasks } from './noble-pq-bench';

const DEFAULT_CONFIG: BenchmarkConfig = {
  iterations: 100,
  warmupIterations: 5,
};

async function runTask(
  task: BenchmarkTask,
  library: 'fips-crypto' | 'pure-js',
  config: BenchmarkConfig,
): Promise<BenchmarkResult> {
  for (let i = 0; i < config.warmupIterations; i++) {
    await task.fn();
  }

  const start = performance.now();
  for (let i = 0; i < config.iterations; i++) {
    await task.fn();
    if (i % 10 === 9) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  const totalMs = performance.now() - start;
  const avgMs = totalMs / config.iterations;
  const opsPerSec = 1000 / avgMs;

  return {
    algorithm: task.algorithm,
    operation: task.operation,
    library,
    iterations: config.iterations,
    totalMs,
    avgMs,
    opsPerSec,
  };
}

export async function runFullBenchmark(
  onProgress: (pct: number) => void,
  onResult: (result: BenchmarkResult) => void,
  config?: Partial<BenchmarkConfig>,
): Promise<BenchmarkResult[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const results: BenchmarkResult[] = [];

  const [fipsTasks, jsTasks] = await Promise.all([
    getFipsCryptoTasks(),
    Promise.resolve(getPureJsTasks()),
  ]);

  const totalTasks = fipsTasks.length + jsTasks.length;
  let completed = 0;

  for (const task of fipsTasks) {
    const result = await runTask(task, 'fips-crypto', cfg);
    results.push(result);
    onResult(result);
    completed++;
    onProgress(Math.round((completed / totalTasks) * 100));
  }

  for (const task of jsTasks) {
    const result = await runTask(task, 'pure-js', cfg);
    results.push(result);
    onResult(result);
    completed++;
    onProgress(Math.round((completed / totalTasks) * 100));
  }

  return results;
}
