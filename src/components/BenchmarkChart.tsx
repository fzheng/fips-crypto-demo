import type { BenchmarkResult } from '../store/benchmark-store';

interface Props {
  results: BenchmarkResult[];
}

export default function BenchmarkChart({ results }: Props) {
  if (results.length === 0) return null;

  const grouped = new Map<string, { fips?: BenchmarkResult; js?: BenchmarkResult }>();
  for (const r of results) {
    const key = `${r.algorithm} ${r.operation}`;
    const entry = grouped.get(key) ?? {};
    if (r.library === 'fips-crypto') entry.fips = r;
    else entry.js = r;
    grouped.set(key, entry);
  }

  let maxOps = 0;
  for (const { fips, js } of grouped.values()) {
    if (fips) maxOps = Math.max(maxOps, fips.opsPerSec);
    if (js) maxOps = Math.max(maxOps, js.opsPerSec);
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([label, { fips, js }]) => (
        <div key={label} className="space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{label}</div>
          <Bar label="fips-crypto" value={fips?.opsPerSec} max={maxOps}
            colorBar="bg-blue-500/70 dark:bg-blue-500/50"
            colorLabel="text-blue-600 dark:text-blue-400"
            colorValue="text-white dark:text-blue-100"
          />
          <Bar label="Pure JS" value={js?.opsPerSec} max={maxOps}
            colorBar="bg-orange-500/70 dark:bg-orange-500/50"
            colorLabel="text-orange-600 dark:text-orange-400"
            colorValue="text-white dark:text-orange-100"
          />
        </div>
      ))}
    </div>
  );
}

function Bar({ label, value, max, colorBar, colorLabel, colorValue }: {
  label: string; value?: number; max: number;
  colorBar: string; colorLabel: string; colorValue: string;
}) {
  const pct = value ? (value / max) * 100 : 0;
  const labelInside = pct > 12;

  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] ${colorLabel} w-16 text-right shrink-0`}>{label}</span>
      <div className="flex-1 bg-slate-100 dark:bg-white/5 rounded-full h-5 overflow-hidden flex items-center">
        {value ? (
          <>
            <div
              className={`h-full ${colorBar} rounded-full transition-all duration-500 ${labelInside ? 'flex items-center justify-end pr-2' : ''}`}
              style={{ width: `${pct}%`, minWidth: '4px' }}
            >
              {labelInside && (
                <span className={`text-[9px] font-mono ${colorValue} whitespace-nowrap`}>
                  {Math.round(value)} ops/s
                </span>
              )}
            </div>
            {!labelInside && (
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 ml-1.5 whitespace-nowrap">
                {Math.round(value)} ops/s
              </span>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
