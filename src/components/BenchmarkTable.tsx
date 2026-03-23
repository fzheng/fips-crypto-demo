import type { BenchmarkResult } from '../store/benchmark-store';

interface Props {
  results: BenchmarkResult[];
}

export default function BenchmarkTable({ results }: Props) {
  if (results.length === 0) return null;

  const grouped = new Map<string, { fips?: BenchmarkResult; js?: BenchmarkResult }>();
  for (const r of results) {
    const key = `${r.algorithm}|${r.operation}`;
    const entry = grouped.get(key) ?? {};
    if (r.library === 'fips-crypto') entry.fips = r;
    else entry.js = r;
    grouped.set(key, entry);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
            <th className="text-left py-2.5 px-3 font-medium">Algorithm</th>
            <th className="text-left py-2.5 px-3 font-medium">Operation</th>
            <th className="text-right py-2.5 px-3 font-medium">
              <span className="text-quantum-600 dark:text-quantum-400">fips-crypto</span>
            </th>
            <th className="text-right py-2.5 px-3 font-medium">
              <span className="text-orange-600 dark:text-orange-400">Pure JS</span>
            </th>
            <th className="text-right py-2.5 px-3 font-medium">Speedup</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(grouped.entries()).map(([key, { fips, js }]) => {
            const [algo, op] = key.split('|');
            const speedup = fips && js ? js.avgMs / fips.avgMs : null;
            return (
              <tr key={key} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="py-2 px-3 font-mono text-gray-700 dark:text-gray-300">{algo}</td>
                <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{op}</td>
                <td className="py-2 px-3 text-right font-mono text-quantum-700 dark:text-quantum-300">
                  {fips ? `${fips.avgMs.toFixed(3)} ms` : '—'}
                </td>
                <td className="py-2 px-3 text-right font-mono text-orange-700 dark:text-orange-300">
                  {js ? `${js.avgMs.toFixed(3)} ms` : '—'}
                </td>
                <td className="py-2 px-3 text-right font-mono font-semibold">
                  {speedup !== null ? (
                    <span className={speedup > 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                      {speedup.toFixed(1)}x
                    </span>
                  ) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
