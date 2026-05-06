import { useState, useRef, type FormEvent } from 'react';

interface Props {
  disabled: boolean;
  onSend: (text: string) => void;
  onSendFile: (file: File) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function MessageInput({ disabled, onSend, onSendFile }: Props) {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large. Max ${MAX_FILE_SIZE / 1024 / 1024} MB for this demo.`);
      return;
    }
    onSendFile(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 py-3 glass-card border-t border-slate-200 dark:border-white/5 flex items-center gap-2"
    >
      {/* Attach button */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled}
        className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors disabled:opacity-30 shrink-0 cursor-pointer"
        title="Attach file or image"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.pdf,.txt,.json,.csv,.doc,.docx,.zip"
      />

      {/* Text input */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? 'Complete key exchange first...' : 'Type a message'}
        className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 disabled:opacity-40 transition-all"
      />

      {/* Send button */}
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-full transition-all disabled:opacity-30 shrink-0 cursor-pointer hover:shadow-lg hover:shadow-blue-500/20"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
      </button>
    </form>
  );
}
