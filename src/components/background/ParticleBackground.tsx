import { Suspense, lazy, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';
import ParticlePoster from './ParticlePoster';
import styles from './ParticleBackground.module.css';

const ParticleCanvas = lazy(() => import('./ParticleCanvas'));

export default function ParticleBackground() {
  const location = useLocation();
  const { theme } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [ready, setReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reducedMotion || location.pathname !== '/') setReady(false);
  }, [location.pathname, reducedMotion]);

  if (location.pathname !== '/') return null;

  const className = [
    'particle-layer',
    styles.layer,
    theme === 'dark' ? styles.dark : '',
    ready && !contextLost && !reducedMotion ? styles.ready : '',
    contextLost ? styles.contextLost : '',
  ].filter(Boolean).join(' ');

  return <div className={className} aria-hidden="true">
    <ParticlePoster dark={theme === 'dark'} />
    {!reducedMotion && <Suspense fallback={null}>
      <ParticleCanvas onReady={() => setReady(true)} onContextLost={setContextLost} />
    </Suspense>}
  </div>;
}
