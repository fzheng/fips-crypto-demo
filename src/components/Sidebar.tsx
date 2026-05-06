import { useIdentityStore } from '../store/identity-store';
import { useSettingsStore, type ActiveTab } from '../store/settings-store';
import { fingerprint } from '../crypto/encoding';
import PeerList from './PeerList';

interface Props {
  onSelectPeer: (peerId: string) => void;
  onInitiateKE: (peerId: string) => void;
}

const tabs: { id: ActiveTab; label: string }[] = [
  { id: 'chat', label: 'Chats' },
  { id: 'benchmark', label: 'Benchmark' },
  { id: 'how-it-works', label: 'Learn' },
];

export default function Sidebar({ onSelectPeer, onInitiateKE }: Props) {
  const identity = useIdentityStore((s) => s.identity);
  const { activeTab, setActiveTab } = useSettingsStore();

  return (
    <div className="w-80 glass-card border-r border-slate-200 dark:border-white/5 flex flex-col h-full">
      {/* Header */}
      {identity && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            {/* Avatar with gradient ring */}
            <div className="rounded-full p-[2px] bg-gradient-to-br from-blue-500 to-emerald-500 shrink-0">
              <span className="w-10 h-10 rounded-full bg-slate-100 dark:bg-surface-dark flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 font-heading">
                {identity.nickname[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-heading">{identity.nickname}</div>
              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                KEM {fingerprint(identity.kem.publicKey)} · DSA {fingerprint(identity.dsa.publicKey)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'chat' ? (
        <div className="flex-1 overflow-y-auto">
          <PeerList onSelectPeer={onSelectPeer} onInitiateKE={onInitiateKE} />
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
