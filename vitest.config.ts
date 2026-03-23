import { defineConfig } from 'vitest/config';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
  ],
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    include: ['tests/**/*.test.ts'],
    sequence: { concurrent: false },
    fileParallelism: false,
  },
});
