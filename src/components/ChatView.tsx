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
      <div className="px-4 py-2.5 glass-card border-b border-slate-200 dark:border-white/5 flex items-center gap-3">
        {/* Avatar with gradient ring */}
        <div className="rounded-full p-[2px] bg-gradient-to-br from-blue-500 to-emerald-500 shrink-0">
          <span className="w-10 h-10 rounded-full bg-slate-100 dark:bg-surface-dark flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 font-heading">
            {peerId[0]?.toUpperCase()}
          </span>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-heading">{peerId}</div>
          <div className="text-xs">
            {isEstablished ? (
              <span className="text-emerald-600 dark:text-emerald-400">
                <Tooltip
                  term="End-to-end encrypted"
                  explanation="Messages and files are encrypted with XChaCha20-Poly1305 using a shared secret from ML-KEM-768, and signed with ML-DSA-65. The relay server cannot read them."
                />
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">online</span>
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
