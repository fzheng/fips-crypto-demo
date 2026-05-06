import { useState } from 'react';
import type { SessionStatus } from '../protocol/session';
import Tooltip from './Tooltip';

interface Props {
  status: SessionStatus;
}

const steps = [
  { label: 'Generate ML-KEM-768 keypair', detail: 'Public key: 1,184 B | Secret key: 2,400 B' },
  { label: 'Send KEM public key to peer', detail: 'Transmitted via relay server (base64)' },
  { label: 'Peer encapsulates shared secret', detail: 'Ciphertext: 1,088 B | Shared secret: 32 B' },
  { label: 'Receive ciphertext from peer', detail: 'Decapsulate -> identical 32-byte shared secret' },
  { label: 'Session established', detail: 'XChaCha20-Poly1305 + ML-DSA-65 signatures' },
];

function stepStatus(index: number, sessionStatus: SessionStatus): 'done' | 'active' | 'pending' {
  if (sessionStatus === 'established') return 'done';
  if (sessionStatus === 'ke-initiated') {
    if (index <= 1) return 'done';
    if (index === 2) return 'active';
    return 'pending';
  }
  if (sessionStatus === 'ke-responded') {
    if (index <= 2) return 'done';
    if (index === 3) return 'active';
    return 'pending';
  }
  return 'pending';
}

function StepIcon({ state }: { state: 'done' | 'active' | 'pending' }) {
  if (state === 'done') {
    return (
      <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (state === 'active') {
    return (
      <span className="w-5 h-5 flex items-center justify-center shrink-0">
        <span className="ke-spinner" />
      </span>
    );
  }
  return (
    <span className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
  );
}

export default function KeyExchangeDetail({ status }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (status === 'none') return null;

  return (
    <div className="border-b border-slate-200 dark:border-white/5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
      >
        <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        {expanded ? 'Hide' : 'Show'} key exchange details
      </button>
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {steps.map((step, i) => {
            const s = stepStatus(i, status);
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                <StepIcon state={s} />
                <div>
                  <div className={s === 'pending' ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}>
                    {step.label}
                  </div>
                  <div className="text-slate-400 dark:text-slate-600 font-mono text-[10px]">{step.detail}</div>
                </div>
              </div>
            );
          })}
          <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-600">
            <Tooltip
              term="Why ML-KEM?"
              explanation="ML-KEM (FIPS 203) is a lattice-based key encapsulation mechanism standardized by NIST. Unlike classical ECDH, it resists attacks from quantum computers."
            />
          </div>
        </div>
      )}
    </div>
  );
}
