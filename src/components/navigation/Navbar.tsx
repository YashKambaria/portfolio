import { FileText, Github, Linkedin, Menu, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { profile } from '../../data/portfolio';
import ThemeToggle from '../theme/ThemeToggle';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);
  return <header className={styles.header} onKeyDown={(event) => {
    if (event.key !== 'Escape' || !open) return;
    close();
    menuButton.current?.focus();
  }}><div className={`container ${styles.inner}`}>
    <Link className={styles.brand} to="/" aria-label="Yash Kambaria, home" onClick={close}>YK<span aria-hidden="true">.</span></Link>
    <div className={styles.mobileControls}><ThemeToggle />
    <button ref={menuButton} className={styles.menuButton} type="button" aria-expanded={open} aria-controls="primary-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>
    <nav id="primary-navigation" className={`${styles.nav} ${open ? styles.open : ''}`} aria-label="Primary navigation">
      <NavLink to="/projects" onClick={close}>Work</NavLink><Link to="/#about" onClick={close}>About</Link><Link to="/#skills" onClick={close}>Skills</Link><Link to="/#achievements" onClick={close}>Achievements</Link><Link to="/#contact" onClick={close}>Contact</Link><span className={styles.desktopTheme}><ThemeToggle /></span>
    </nav><div className={styles.socialNav}><a href={profile.socials.github} target="_blank" rel="noreferrer" aria-label="GitHub (opens in a new tab)"><Github size={17}/></a><a href={profile.socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn (opens in a new tab)"><Linkedin size={17}/></a>{profile.resumeUrl && <a className={styles.resume} href={profile.resumeUrl}><FileText size={15}/> Resume</a>}</div>
  </div></header>;
}
