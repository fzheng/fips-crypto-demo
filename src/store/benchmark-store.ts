import { create } from 'zustand';

export interface BenchmarkResult {
  algorithm: string;
  operation: string;
  library: 'fips-crypto' | 'pure-js';
  iterations: number;
  totalMs: number;
  avgMs: number;
  opsPerSec: number;
}

interface BenchmarkState {
  results: BenchmarkResult[];
  isRunning: boolean;
  progress: number;
  addResult: (r: BenchmarkResult) => void;
  setRunning: (running: boolean) => void;
  setProgress: (p: number) => void;
  clear: () => void;
}

export const useBenchmarkStore = create<BenchmarkState>()((set) => ({
  results: [],
  isRunning: false,
  progress: 0,

  addResult: (r) =>
    set((state) => ({ results: [...state.results, r] })),

  setRunning: (running) => set({ isRunning: running }),
  setProgress: (p) => set({ progress: p }),
  clear: () => set({ results: [], progress: 0 }),
}));
