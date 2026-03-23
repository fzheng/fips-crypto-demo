export interface BenchmarkTask {
  algorithm: string;
  operation: string;
  fn: () => Promise<void>;
}

export interface BenchmarkConfig {
  iterations: number;
  warmupIterations: number;
}
