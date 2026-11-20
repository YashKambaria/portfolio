import { useLayoutEffect, useRef } from 'react';
import { useTheme } from '../theme/ThemeProvider';

export const mobileParticleQuery = '(max-width: 1023px)';

export type ParticleStages = {
  compact: boolean;
  bounds: DOMRect | null;
  light: number;
  dark: number;
  throne: number;
};

export function useParticleStages() {
  const { theme } = useTheme();
  const stage = useRef<ParticleStages>({ compact: false, bounds: null, light: 0, dark: 0, throne: 0 });

  useLayoutEffect(() => {
    const query = window.matchMedia(mobileParticleQuery);
    const elements = [...document.querySelectorAll<HTMLElement>('[data-particle-stage]')];
    const main = document.getElementById('main-content');
    let raf = 0;

    const measure = () => {
      raf = 0;
      const view = stage.current;
      view.compact = query.matches;
      if (!view.compact) return;
      const height = window.innerHeight;
      const readingLine = height * .55;
      view.bounds = null;
      view.light = 0;
      view.dark = 0;
      view.throne = 0;
      let distance = Infinity;
      for (const element of elements) {
        const rect = element.getBoundingClientRect();
        if (!rect.height) continue;
        // Finish forming the object when the first third of its stage clears the reading line.
        const name = element.dataset.particleStage;
        const step = name === 'Laptop' ? 0 : Math.max(0, Math.min(1, (readingLine - rect.top) / (rect.height * .34)));
        view.light += step;
        if (name === 'Cooling fan') view.dark = step === 0 ? 0 : 1 + step;
        if (name === 'DSA') view.throne = step;
        if (rect.top >= height || rect.bottom <= 64) continue;
        const offset = Math.abs((rect.top + rect.bottom) * .5 - readingLine);
        if (offset < distance) {
          view.bounds = rect;
          distance = offset;
        }
      }
    };
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    if (main) observer.observe(main);
    query.addEventListener('change', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    measure();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      query.removeEventListener('change', schedule);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [theme]);

  return stage;
}
