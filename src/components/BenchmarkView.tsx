import { useBenchmark } from '../hooks/useBenchmark';
import BenchmarkTable from './BenchmarkTable';
import BenchmarkChart from './BenchmarkChart';

export default function BenchmarkView() {
  const { results, isRunning, progress, run } = useBenchmark();

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0A0F1E]">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-white/5 glass-card">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-heading">
          Performance Benchmark
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Compare{' '}
          <a
            href="https://www.npmjs.com/package/fips-crypto"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-500"
          >
            fips-crypto
          </a>{' '}
          vs Pure JavaScript
        </p>
      </div>

      <div className="px-5 py-3 border-b border-slate-200 dark:border-white/5 flex items-center gap-3">
        <button
          onClick={() => run(100)}
          disabled={isRunning}
          className="px-5 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-40 cursor-pointer hover:shadow-lg hover:shadow-blue-500/20"
        >
          {isRunning ? 'Running...' : 'Run Benchmark'}
        </button>
        {isRunning && (
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 bg-slate-200 dark:bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">{progress}%</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {results.length > 0 ? (
          <div className="p-5 space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 font-heading">Operations per second</h3>
              <BenchmarkChart results={results} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 font-heading">Detailed results</h3>
              <BenchmarkTable results={results} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-sm text-slate-400">
            Click "Run Benchmark" to compare performance
          </div>
        )}
      </div>
    </div>
  );
}
