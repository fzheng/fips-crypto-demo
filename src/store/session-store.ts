import { create } from 'zustand';
import type { SessionStatus } from '../protocol/session';

export interface PeerSession {
  peerId: string;
  status: SessionStatus;
  sharedSecret: Uint8Array | null;
  peerDsaPublicKey: Uint8Array | null;
  /** Kept during KE so initiator can decapsulate the response */
  pendingKemSecretKey?: Uint8Array;
  establishedAt?: number;
}

interface SessionState {
  sessions: Map<string, PeerSession>;
  getSession: (peerId: string) => PeerSession | undefined;
  initSession: (peerId: string, kemSecretKey: Uint8Array) => void;
  establishSession: (
    peerId: string,
    sharedSecret: Uint8Array,
    peerDsaPublicKey: Uint8Array,
  ) => void;
  removeSession: (peerId: string) => void;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  sessions: new Map(),

  getSession: (peerId) => get().sessions.get(peerId),

  initSession: (peerId, kemSecretKey) =>
    set((state) => {
      const next = new Map(state.sessions);
      next.set(peerId, {
        peerId,
        status: 'ke-initiated',
        sharedSecret: null,
        peerDsaPublicKey: null,
        pendingKemSecretKey: kemSecretKey,
      });
      return { sessions: next };
    }),

  establishSession: (peerId, sharedSecret, peerDsaPublicKey) =>
    set((state) => {
      const next = new Map(state.sessions);
      next.set(peerId, {
        peerId,
        status: 'established',
        sharedSecret,
        peerDsaPublicKey,
        establishedAt: Date.now(),
      });
      return { sessions: next };
    }),

  removeSession: (peerId) =>
    set((state) => {
      const next = new Map(state.sessions);
      next.delete(peerId);
      return { sessions: next };
    }),
}));
