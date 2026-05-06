import { useState, useMemo } from 'react';
import type { CryptoDetail, FileAttachment } from '../store/message-store';

interface Props {
  text: string;
  fromSelf: boolean;
  timestamp: number;
  signatureValid: boolean;
  crypto?: CryptoDetail;
  file?: FileAttachment;
}

function formatTime(ms: number): string {
  if (ms < 0.001) return '<1us';
  if (ms < 1) return `${(ms * 1000).toFixed(0)}us`;
  return `${ms.toFixed(2)}ms`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(type: string): boolean {
  return type.startsWith('image/');
}

export default function MessageBubble({ text, fromSelf, timestamp, signatureValid, crypto, file }: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const fileUrl = useMemo(() => {
    if (!file?.data?.length) return null;
    const blob = new Blob([new Uint8Array(file.data)], { type: file.type });
    return URL.createObjectURL(blob);
  }, [file]);

  const handleDownload = () => {
    if (!fileUrl || !file) return;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = file.name;
    a.click();
  };

  return (
    <div className={`flex ${fromSelf ? 'justify-end' : 'justify-start'} px-3`}>
      <div
        className={`relative max-w-[75%] rounded-xl shadow-sm overflow-hidden ${
          fromSelf
            ? 'bg-blue-50 dark:bg-blue-500/15 text-slate-900 dark:text-slate-100 border border-blue-100 dark:border-blue-500/20'
            : 'bg-white dark:bg-white/5 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/10'
        }`}
      >
        {/* Image preview */}
        {file && isImage(file.type) && fileUrl && (
          <img
            src={fileUrl}
            alt={file.name}
            className="max-w-full max-h-64 object-contain cursor-pointer"
            onClick={() => window.open(fileUrl, '_blank')}
          />
        )}

        {/* Non-image file card */}
        {file && !isImage(file.type) && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-3 p-3 w-full text-left hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{file.name}</div>
              <div className="text-[10px] text-slate-500">{formatFileSize(file.size)}</div>
            </div>
          </button>
        )}

        <div className="px-3 py-2">
          {/* Text */}
          {!file && <div className="text-[13px] leading-relaxed break-words">{text}</div>}
          {file && isImage(file.type) && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{file.name} · {formatFileSize(file.size)}</div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-1.5 mt-1 -mb-0.5">
            {!fromSelf && (
              <span className={`text-[10px] font-medium ${signatureValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {signatureValid ? (
                  <span className="flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    verified
                  </span>
                ) : 'invalid'}
              </span>
            )}
            {crypto && (
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="text-[10px] text-blue-500 dark:text-blue-400 opacity-70 hover:opacity-100 cursor-pointer"
              >
                {showDetail ? 'hide crypto' : 'crypto'}
              </button>
            )}
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{time}</span>
            {fromSelf && (
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          {/* Crypto detail */}
          {showDetail && crypto && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10 text-[10px] font-mono space-y-1.5">
              {fromSelf ? (
                <>
                  <CryptoStep step="1" label="Encrypt" algo="XChaCha20-Poly1305"
                    detail={`${file ? formatFileSize(file.size) + ' file' : `"${text.slice(0, 20)}${text.length > 20 ? '...' : ''}"`} -> ${crypto.ciphertextSize} B`}
                    timing={crypto.encryptTimeMs}
                  />
                  <CryptoStep step="2" label="Sign" algo="ML-DSA-65"
                    detail={`ciphertext -> ${crypto.signatureSize.toLocaleString()} B signature`}
                    timing={crypto.signTimeMs}
                  />
                  <div className="text-slate-400 dark:text-slate-500 pt-0.5">
                    Total sent: {(crypto.ciphertextSize + crypto.signatureSize).toLocaleString()} bytes
                  </div>
                </>
              ) : (
                <>
                  <CryptoStep step="1" label="Verify" algo="ML-DSA-65"
                    detail={`${crypto.signatureSize.toLocaleString()} B sig -> ${signatureValid ? 'valid' : 'invalid'}`}
                    timing={crypto.verifyTimeMs}
                  />
                  <CryptoStep step="2" label="Decrypt" algo="XChaCha20-Poly1305"
                    detail={`${crypto.ciphertextSize} B -> ${file ? formatFileSize(file.size) + ' file' : 'plaintext'}`}
                    timing={crypto.decryptTimeMs}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CryptoStep({ step, label, algo, detail, timing }: {
  step: string; label: string; algo: string; detail: string; timing?: number;
}) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-blue-500 dark:text-blue-400/60 shrink-0">{step}.</span>
      <div>
        <span className="text-blue-600 dark:text-blue-300">{label}</span>
        <span className="text-slate-400 dark:text-slate-600"> via </span>
        <span className="text-slate-600 dark:text-slate-400">{algo}</span>
        {timing !== undefined && (
          <span className="text-slate-400 dark:text-slate-600"> ({formatTime(timing)})</span>
        )}
        <div className="text-slate-400 dark:text-slate-600">{detail}</div>
      </div>
    </div>
  );
}
