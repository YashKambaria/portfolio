import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';
import DarkAtmosphere from './DarkAtmosphere';
import styles from './ParticleBackground.module.css';

const ParticleCanvas = lazy(() => import('./ParticleCanvas'));
const ParticlePoster = lazy(() => import('./ParticlePoster'));

class ParticleBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch() { this.props.onFailure(); }

  render() { return this.state.failed ? null : this.props.children; }
}

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
    if (reducedMotion || location.pathname !== '/') {
      setReady(false);
      setContextLost(false);
    }
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
    {theme === 'dark' && <DarkAtmosphere reducedMotion={reducedMotion} />}
    {theme === 'light' && (reducedMotion || contextLost) && <Suspense fallback={null}><ParticlePoster /></Suspense>}
    {!reducedMotion && <Suspense fallback={null}>
      <ParticleBoundary onFailure={() => setContextLost(true)}>
        <ParticleCanvas onReady={() => setReady(true)} onContextLost={setContextLost} />
      </ParticleBoundary>
    </Suspense>}
  </div>;
}
