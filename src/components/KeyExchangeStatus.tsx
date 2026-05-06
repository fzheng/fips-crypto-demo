import type { SessionStatus } from '../protocol/session';
import Tooltip from './Tooltip';

interface Props {
  status: SessionStatus;
  peerName: string;
}

export default function KeyExchangeStatus({ status, peerName }: Props) {
  if (status === 'established') return null;

  if (status === 'none') {
    return (
      <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-500/5 border-b border-amber-200 dark:border-amber-500/10 text-xs text-amber-700 dark:text-amber-400 text-center">
        Tap to initiate{' '}
        <Tooltip
          term="ML-KEM"
          explanation="Module Lattice Key Encapsulation Mechanism (FIPS 203). A post-quantum algorithm for securely establishing a shared secret."
        />{' '}
        key exchange with {peerName}
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-500/5 border-b border-blue-200 dark:border-blue-500/10 text-xs text-blue-700 dark:text-blue-400 text-center flex items-center justify-center gap-2">
      <span className="ke-spinner" />
      Exchanging post-quantum keys with {peerName}...
    </div>
  );
}
