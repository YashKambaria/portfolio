import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { animateInkReveal } from './inkReveal';

export type Theme = 'light' | 'dark';
type ThemeContextValue = { theme: Theme; toggleTheme: (origin?: { x: number; y: number }) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'yk-portfolio-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const transitionInProgress = useRef(false);
  const applyTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0B1511' : '#F4F3EF');
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Theme still works when storage is unavailable. */ }
    setTheme(next);
  }, []);

  const toggleTheme = useCallback((origin?: { x: number; y: number }) => {
    if (transitionInProgress.current) return;
    const next = theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyTheme(next);
      return;
    }

    const root = document.documentElement;
    const center = origin ?? { x: root.clientWidth / 2, y: root.clientHeight / 2 };
    transitionInProgress.current = true;
    root.setAttribute('data-theme-reveal', '');

    const transition = document.startViewTransition(() => flushSync(() => applyTheme(next)));
    void transition.ready.then(() => animateInkReveal(root, center)).catch(() => transition.skipTransition());
    void transition.finished.then(cleanup, cleanup);

    function cleanup() {
      root.removeAttribute('data-theme-reveal');
      transitionInProgress.current = false;
    }
  }, [applyTheme, theme]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
