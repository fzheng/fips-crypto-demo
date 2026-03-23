import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

const initial: Theme = (localStorage.getItem('pqc-theme') as Theme) || 'dark';
applyTheme(initial);

export const useThemeStore = create<ThemeState>()((set) => ({
  theme: initial,
  toggle: () =>
    set((state) => {
      const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('pqc-theme', next);
      applyTheme(next);
      return { theme: next };
    }),
}));
