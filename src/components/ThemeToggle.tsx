import { useThemeStore } from '../store/theme-store';

export default function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 text-white/80 hover:text-white text-[11px] transition-colors"
      title={`Currently ${isDark ? 'dark' : 'light'} mode`}
    >
      {/* Sun icon */}
      <svg className={`w-3.5 h-3.5 ${isDark ? 'opacity-40' : 'opacity-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>

      {/* Track */}
      <div className="w-8 h-4 rounded-full bg-white/20 relative">
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200 ${
            isDark ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </div>

      {/* Moon icon */}
      <svg className={`w-3.5 h-3.5 ${isDark ? 'opacity-100' : 'opacity-40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>
  );
}
