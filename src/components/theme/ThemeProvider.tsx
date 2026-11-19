import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';
type ThemeContextValue = { theme: Theme; toggleTheme: (origin?: { x: number; y: number }) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'yk-portfolio-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const veil = useRef<HTMLDivElement>(null);
  const applyTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0B1511' : '#F4F3EF');
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Theme still works when storage is unavailable. */ }
    setTheme(next);
  }, []);

  const toggleTheme = useCallback((origin?: { x: number; y: number }) => {
    const layer = veil.current;
    if (layer?.dataset.phase) return;
    const next = theme === 'dark' ? 'light' : 'dark';
    if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyTheme(next);
      return;
    }

    layer.style.setProperty('--theme-origin-x', `${origin?.x ?? window.innerWidth / 2}px`);
    layer.style.setProperty('--theme-origin-y', `${origin?.y ?? window.innerHeight / 2}px`);
    layer.dataset.target = next;
    layer.dataset.phase = 'cover';
  }, [applyTheme, theme]);

  const finishPhase = () => {
    const layer = veil.current;
    if (layer?.dataset.phase === 'cover') {
      const next = layer.dataset.target === 'dark' ? 'dark' : 'light';
      // Commit both the palette and the canvas mode while the screen is covered.
      flushSync(() => applyTheme(next));
      layer.dataset.phase = 'reveal';
    } else if (layer) {
      delete layer.dataset.phase;
      delete layer.dataset.target;
    }
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>
    {children}
    <div ref={veil} className="theme-veil" aria-hidden="true" onAnimationEnd={finishPhase}>
      <div className="theme-veil-ink" />
    </div>
  </ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
