import { useEffect, useRef } from 'react';
import { useMessageStore, type ChatMessage } from '../store/message-store';
import MessageBubble from './MessageBubble';

const EMPTY_MESSAGES: ChatMessage[] = [];

interface Props {
  peerId: string;
}

export default function MessageList({ peerId }: Props) {
  const messages = useMessageStore((s) => s.messages.get(peerId) ?? EMPTY_MESSAGES);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg px-4 py-2 text-xs text-gray-500 dark:text-gray-400 shadow-sm">
          Messages are end-to-end encrypted with ML-KEM-768 + XChaCha20-Poly1305
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-3 space-y-1.5">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          text={msg.text}
          fromSelf={msg.fromSelf}
          timestamp={msg.timestamp}
          signatureValid={msg.signatureValid}
          crypto={msg.crypto}
          file={msg.file}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
