import { useCallback } from 'react';
import { useSessionStore } from '../store/session-store';
import type { SessionStatus } from '../protocol/session';

/**
 * Hook to access key exchange state for a specific peer.
 */
export function useKeyExchange(peerId: string | null) {
  const session = useSessionStore((s) =>
    peerId ? s.sessions.get(peerId) : undefined,
  );

  const status: SessionStatus = session?.status ?? 'none';
  const isEstablished = status === 'established';

  return {
    status,
    isEstablished,
    sharedSecret: session?.sharedSecret ?? null,
  };
}
