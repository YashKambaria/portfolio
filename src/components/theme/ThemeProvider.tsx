import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type Theme = 'light' | 'dark';
type ThemeContextValue = { theme: Theme; toggleTheme: (origin?: { x: number; y: number }) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'yk-portfolio-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const wipeTimer = useRef<number | null>(null);
  const applyTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#111820' : '#F4F3EF');
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Theme still works when storage is unavailable. */ }
    setTheme(next);
  }, []);

  const toggleTheme = useCallback((origin?: { x: number; y: number }) => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (origin) {
      root.style.setProperty('--theme-origin-x', `${origin.x}px`);
      root.style.setProperty('--theme-origin-y', `${origin.y}px`);
    }
    if (wipeTimer.current !== null) {
      window.clearTimeout(wipeTimer.current);
      wipeTimer.current = null;
    }
    root.classList.remove('theme-transitioning');
    delete root.dataset.themeWipe;

    // Native view transitions snapshot and recreate the full document. That
    // restarts the WebGL layer (and can reset scroll position), so theme
    // changes use the lightweight CSS ink wipe instead.
    if (!reduce) {
      root.dataset.themeWipe = next;
      root.classList.add('theme-transitioning');
      applyTheme(next);
      wipeTimer.current = window.setTimeout(() => {
        root.classList.remove('theme-transitioning');
        delete root.dataset.themeWipe;
        wipeTimer.current = null;
      }, 600);
    } else {
      applyTheme(next);
    }
  }, [applyTheme, theme]);

  useEffect(() => () => {
    if (wipeTimer.current !== null) window.clearTimeout(wipeTimer.current);
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
