import { useBenchmark } from '../hooks/useBenchmark';
import BenchmarkTable from './BenchmarkTable';
import BenchmarkChart from './BenchmarkChart';
import Tooltip from './Tooltip';

export default function BenchmarkView() {
  const { results, isRunning, progress, run } = useBenchmark();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Performance Benchmark
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Compare{' '}
          <a
            href="https://www.npmjs.com/package/fips-crypto"
            target="_blank"
            rel="noopener noreferrer"
            className="text-quantum-600 dark:text-quantum-400 underline underline-offset-2 hover:text-quantum-500"
          >
            fips-crypto
          </a>{' '}
          vs Pure JavaScript
        </p>
      </div>

      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
        <button
          onClick={() => run(100)}
          disabled={isRunning}
          className="px-5 py-2 bg-quantum-500 hover:bg-quantum-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
        >
          {isRunning ? 'Running...' : 'Run Benchmark'}
        </button>
        {isRunning && (
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-quantum-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-gray-500 font-mono">{progress}%</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {results.length > 0 ? (
          <div className="p-5 space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Operations per second</h3>
              <BenchmarkChart results={results} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Detailed results</h3>
              <BenchmarkTable results={results} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-sm text-gray-400">
            Click "Run Benchmark" to compare performance
          </div>
        )}
      </div>
    </div>
  );
}
