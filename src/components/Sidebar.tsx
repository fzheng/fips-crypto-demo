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
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      {/* Header - WhatsApp style */}
      {identity && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-quantum-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {identity.nickname[0]?.toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{identity.nickname}</div>
              <div className="text-[10px] font-mono text-gray-400 dark:text-gray-500 truncate">
                KEM {fingerprint(identity.kem.publicKey)} · DSA {fingerprint(identity.dsa.publicKey)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav tabs */}
      <div className="flex bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              activeTab === tab.id
                ? 'text-quantum-600 dark:text-quantum-400 border-b-2 border-quantum-500'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
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
