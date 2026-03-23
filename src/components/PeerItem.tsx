import type { SessionStatus } from '../protocol/session';

interface Props {
  peerId: string;
  isSelected: boolean;
  sessionStatus: SessionStatus;
  onClick: () => void;
}

export default function PeerItem({ peerId, isSelected, sessionStatus, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-800/50 ${
        isSelected
          ? 'bg-quantum-50 dark:bg-quantum-900/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
      }`}
    >
      {/* Avatar */}
      <div className="relative">
        <span className="w-12 h-12 rounded-full bg-quantum-500 flex items-center justify-center text-lg font-semibold text-white shrink-0">
          {peerId[0]?.toUpperCase()}
        </span>
        {sessionStatus === 'established' && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </div>
      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{peerId}</div>
        <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
          {sessionStatus === 'established'
            ? 'End-to-end encrypted'
            : sessionStatus === 'ke-initiated' || sessionStatus === 'ke-responded'
              ? 'Exchanging keys...'
              : 'Tap to connect'}
        </div>
      </div>
    </button>
  );
}
