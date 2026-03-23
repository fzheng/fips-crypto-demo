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
  { label: 'Receive ciphertext from peer', detail: 'Decapsulate → identical 32-byte shared secret' },
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

export default function KeyExchangeDetail({ status }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (status === 'none') return null;

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
      >
        <span className={`transition-transform text-[10px] ${expanded ? 'rotate-90' : ''}`}>▶</span>
        {expanded ? 'Hide' : 'Show'} key exchange details
      </button>
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {steps.map((step, i) => {
            const s = stepStatus(i, status);
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5">
                  {s === 'done' ? '✅' : s === 'active' ? '⏳' : '⬜'}
                </span>
                <div>
                  <div className={s === 'pending' ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}>
                    {step.label}
                  </div>
                  <div className="text-gray-400 dark:text-gray-600 font-mono text-[10px]">{step.detail}</div>
                </div>
              </div>
            );
          })}
          <div className="mt-2 text-[10px] text-gray-400 dark:text-gray-600">
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
