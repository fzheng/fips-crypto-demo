import { usePeerStore } from '../store/peer-store';
import { useSessionStore } from '../store/session-store';
import PeerItem from './PeerItem';

interface Props {
  onSelectPeer: (peerId: string) => void;
  onInitiateKE: (peerId: string) => void;
}

export default function PeerList({ onSelectPeer, onInitiateKE }: Props) {
  const peers = usePeerStore((s) => s.peers);
  const activePeerId = usePeerStore((s) => s.activePeerId);
  const sessions = useSessionStore((s) => s.sessions);

  const peerList = Array.from(peers.values());

  if (peerList.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-400 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-sm mb-1">No peers online</div>
        <div className="text-slate-400 dark:text-slate-600 text-xs">Open another browser tab to connect</div>
      </div>
    );
  }

  return (
    <div>
      {peerList.map((peer) => {
        const session = sessions.get(peer.peerId);
        return (
          <PeerItem
            key={peer.peerId}
            peerId={peer.peerId}
            isSelected={activePeerId === peer.peerId}
            sessionStatus={session?.status ?? 'none'}
            onClick={() => {
              onSelectPeer(peer.peerId);
              if (!session || session.status === 'none') {
                onInitiateKE(peer.peerId);
              }
            }}
          />
        );
      })}
    </div>
  );
}
