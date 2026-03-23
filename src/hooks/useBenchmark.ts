import { useCallback } from 'react';
import { useBenchmarkStore } from '../store/benchmark-store';
import { runFullBenchmark } from '../benchmark/runner';

export function useBenchmark() {
  const { results, isRunning, progress } = useBenchmarkStore();

  const run = useCallback(async (iterations = 100) => {
    const store = useBenchmarkStore.getState();
    if (store.isRunning) return;

    store.clear();
    store.setRunning(true);

    try {
      await runFullBenchmark(
        (p) => useBenchmarkStore.getState().setProgress(p),
        (r) => useBenchmarkStore.getState().addResult(r),
        { iterations },
      );
    } catch (err) {
      console.error('Benchmark error:', err);
    } finally {
      useBenchmarkStore.getState().setRunning(false);
    }
  }, []);

  return { results, isRunning, progress, run };
}
