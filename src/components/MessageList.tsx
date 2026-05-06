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
        <div className="glass-card rounded-xl px-5 py-3 border border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Messages are end-to-end encrypted with ML-KEM-768 + XChaCha20-Poly1305
          </div>
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
