import type { ConnectionState } from '../protocol/ws-client';
import ThemeToggle from './ThemeToggle';

interface Props {
  state: ConnectionState;
  serverUrl: string;
}

const stateConfig = {
  connected: { color: 'bg-emerald-400', label: 'Connected' },
  connecting: { color: 'bg-amber-400 animate-pulse', label: 'Connecting...' },
  disconnected: { color: 'bg-red-400', label: 'Disconnected' },
} as const;

export default function ConnectionStatus({ state, serverUrl }: Props) {
  const { color, label } = stateConfig[state];

  return (
    <div className="relative">
      {/* Gradient accent line */}
      <div className="h-[2px] bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500" />
      <div className="flex items-center justify-between px-4 py-1.5 glass-card border-b border-slate-200 dark:border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`} />
          <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
          <span className="text-slate-300 dark:text-white/20">|</span>
          <span className="font-mono text-slate-400 dark:text-slate-500">{serverUrl}</span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}
