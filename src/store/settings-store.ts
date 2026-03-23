import { create } from 'zustand';

export type ActiveTab = 'chat' | 'benchmark' | 'how-it-works';

/** Derive WS URL from current page host — always up-to-date. */
export function getServerUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `ws://${window.location.hostname}:3001`;
  }
  return 'ws://localhost:3001';
}

interface SettingsState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
