import { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import Navbar from '../navigation/Navbar';
import Footer from './Footer';
import ParticleBackground from '../background/ParticleBackground';

export default function SiteLayout() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const initialLocation = useRef(location);

  useLayoutEffect(() => {
    if (navigationType === 'POP') {
      const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      // Only resolve a fragment on a fresh entry. Native scroll restoration
      // knows the last reading position for reloads and history navigation.
      if (location !== initialLocation.current || (entry && entry.type !== 'navigate')) return;
    }
    if (location.hash) {
      let id = location.hash.slice(1);
      try { id = decodeURIComponent(id); } catch { /* A malformed escape can still be a literal ID. */ }
      const target = document.getElementById(id);
      target?.scrollIntoView({ behavior: 'instant' });
      if (target && navigationType !== 'POP') {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
      return;
    }
    if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
  }, [location, navigationType]);

  return <div className="site-frame"><ParticleBackground /><a className="skip-link" href="#main-content">Skip to content</a><Navbar /><main id="main-content" tabIndex={-1}><Outlet /></main><Footer /></div>;
}
