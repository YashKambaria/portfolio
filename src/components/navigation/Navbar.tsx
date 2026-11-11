import { FileText, Github, Linkedin, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { profile } from '../../data/portfolio';
import ThemeToggle from '../theme/ThemeToggle';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <header className={styles.header}><div className={`container ${styles.inner}`}>
    <Link className={styles.brand} to="/" aria-label="Yash Kambaria, home" onClick={close}>YK<span aria-hidden="true">.</span></Link>
    <button className={styles.menuButton} type="button" aria-expanded={open} aria-controls="primary-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    <nav id="primary-navigation" className={`${styles.nav} ${open ? styles.open : ''}`} aria-label="Primary navigation">
      <NavLink to="/projects" onClick={close}>Work</NavLink><a href="/#about" onClick={close}>About</a><a href="/#skills" onClick={close}>Skills</a><a href="/#achievements" onClick={close}>Achievements</a><a href="/#contact" onClick={close}>Contact</a><ThemeToggle onToggle={close} />
    </nav><div className={styles.socialNav}><a href={profile.socials.github} target="_blank" rel="noreferrer" aria-label="GitHub (opens in a new tab)"><Github size={17}/></a><a href={profile.socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn (opens in a new tab)"><Linkedin size={17}/></a>{profile.resumeUrl && <a className={styles.resume} href={profile.resumeUrl}><FileText size={15}/> Resume</a>}</div>
  </div></header>;
}
