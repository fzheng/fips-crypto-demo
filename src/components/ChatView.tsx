import { useKeyExchange } from '../hooks/useKeyExchange';
import KeyExchangeStatus from './KeyExchangeStatus';
import KeyExchangeDetail from './KeyExchangeDetail';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import Tooltip from './Tooltip';

interface Props {
  peerId: string;
  onSendMessage: (peerId: string, text: string) => void;
  onSendFile: (peerId: string, file: File) => void;
}

export default function ChatView({ peerId, onSendMessage, onSendFile }: Props) {
  const { status, isEstablished } = useKeyExchange(peerId);

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-quantum-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {peerId[0]?.toUpperCase()}
        </span>
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{peerId}</div>
          <div className="text-xs text-gray-500">
            {isEstablished ? (
              <span className="text-emerald-600 dark:text-emerald-400">
                <Tooltip
                  term="End-to-end encrypted"
                  explanation="Messages and files are encrypted with XChaCha20-Poly1305 using a shared secret from ML-KEM-768, and signed with ML-DSA-65. The relay server cannot read them."
                />
              </span>
            ) : (
              'online'
            )}
          </div>
        </div>
      </div>

      <KeyExchangeStatus status={status} peerName={peerId} />
      <KeyExchangeDetail status={status} />

      <div className="flex-1 flex flex-col overflow-hidden chat-bg">
        <MessageList peerId={peerId} />
      </div>

      <MessageInput
        disabled={!isEstablished}
        onSend={(text) => onSendMessage(peerId, text)}
        onSendFile={(file) => onSendFile(peerId, file)}
      />
    </div>
  );
}
