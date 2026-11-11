import { Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';
import Footer from './Footer';
import ParticleBackground from '../background/ParticleBackground';

export default function SiteLayout() {
  return <div className="site-frame"><ParticleBackground /><a className="skip-link" href="#main-content">Skip to content</a><Navbar /><main id="main-content" tabIndex={-1}><Outlet /></main><Footer /></div>;
}
