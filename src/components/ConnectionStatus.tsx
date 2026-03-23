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
    <div className="flex items-center justify-between px-4 py-1.5 bg-quantum-700 dark:bg-quantum-800 text-white text-xs">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span className="font-medium">{label}</span>
        <span className="opacity-50">|</span>
        <span className="font-mono opacity-60">{serverUrl}</span>
      </div>
      <ThemeToggle />
    </div>
  );
}
