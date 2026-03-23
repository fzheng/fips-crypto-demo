import { create } from 'zustand';
import type { IdentityKeys } from '../crypto/types';
import { generateIdentity } from '../crypto/identity';

interface IdentityState {
  identity: IdentityKeys | null;
  isGenerating: boolean;
  generate: (nickname: string) => Promise<void>;
  clear: () => void;
}

export const useIdentityStore = create<IdentityState>()((set) => ({
  identity: null,
  isGenerating: false,

  generate: async (nickname) => {
    set({ isGenerating: true });
    try {
      const identity = await generateIdentity(nickname);
      set({ identity, isGenerating: false });
    } catch (err) {
      set({ isGenerating: false });
      throw err;
    }
  },

  clear: () => set({ identity: null }),
}));
