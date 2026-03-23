import { create } from 'zustand';

export interface Peer {
  peerId: string;
  mlDsaPublicKey: string; // base64
}

interface PeerState {
  peers: Map<string, Peer>;
  activePeerId: string | null;
  setPeers: (peers: Peer[]) => void;
  addPeer: (peer: Peer) => void;
  removePeer: (peerId: string) => void;
  setActivePeer: (peerId: string | null) => void;
}

export const usePeerStore = create<PeerState>()((set) => ({
  peers: new Map(),
  activePeerId: null,

  setPeers: (peers) =>
    set({ peers: new Map(peers.map((p) => [p.peerId, p])) }),

  addPeer: (peer) =>
    set((state) => {
      const next = new Map(state.peers);
      next.set(peer.peerId, peer);
      return { peers: next };
    }),

  removePeer: (peerId) =>
    set((state) => {
      const next = new Map(state.peers);
      next.delete(peerId);
      const activePeerId = state.activePeerId === peerId ? null : state.activePeerId;
      return { peers: next, activePeerId };
    }),

  setActivePeer: (peerId) => set({ activePeerId: peerId }),
}));
