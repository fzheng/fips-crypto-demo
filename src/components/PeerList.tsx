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
        <div className="text-gray-400 dark:text-gray-500 text-sm mb-1">No peers online</div>
        <div className="text-gray-300 dark:text-gray-600 text-xs">Open another browser tab to connect</div>
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
