import type { SessionStatus } from '../protocol/session';

interface Props {
  peerId: string;
  isSelected: boolean;
  sessionStatus: SessionStatus;
  onClick: () => void;
}

export default function PeerItem({ peerId, isSelected, sessionStatus, onClick }: Props) {
  const isEncrypted = sessionStatus === 'established';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all cursor-pointer border-b border-slate-100 dark:border-white/5 ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-500/10 border-l-2 border-l-blue-500'
          : 'hover:bg-slate-50 dark:hover:bg-white/5 border-l-2 border-l-transparent'
      }`}
    >
      {/* Avatar with conditional gradient ring */}
      <div className="relative">
        <div className={`rounded-full ${isEncrypted ? 'p-[2px] bg-gradient-to-br from-blue-500 to-emerald-500' : ''}`}>
          <span className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold font-heading shrink-0 ${
            isEncrypted
              ? 'bg-slate-100 dark:bg-surface-dark text-blue-600 dark:text-blue-400'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}>
            {peerId[0]?.toUpperCase()}
          </span>
        </div>
        {isEncrypted && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0A0F1E] flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </div>
      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{peerId}</div>
        <div className="text-xs truncate">
          {isEncrypted ? (
            <span className="text-emerald-600 dark:text-emerald-400">End-to-end encrypted</span>
          ) : sessionStatus === 'ke-initiated' || sessionStatus === 'ke-responded' ? (
            <span className="text-blue-500 dark:text-blue-400">Exchanging keys...</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">Tap to connect</span>
          )}
        </div>
      </div>
    </button>
  );
}
