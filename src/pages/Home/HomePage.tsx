import SystemsAtlas from '../../components/atlas/SystemsAtlas';
import FeaturedProjects from '../../components/projects/FeaturedProjects';
import { AboutEducation, Achievements, Capabilities, CompetitiveProgramming, Contact } from '../../components/sections/PortfolioSections';
import { profile } from '../../data/portfolio';
import styles from './HomePage.module.css';
export default function HomePage() { return <>
  <div className="container"><section className={styles.hero} data-scene="hero" aria-labelledby="hero-title"><div className={styles.heroCopy}><span className="eyebrow">YASH KAMBARIA · NIRMA UNIVERSITY · CLASS OF 2027</span><h1 id="hero-title">{profile.headline}</h1><p className={styles.name}>{profile.name}</p><p className={styles.position}>Backend Engineer <span>/</span> Distributed Systems <span>/</span> Cloud-Native Applications</p><p className={styles.intro}>{profile.intro}</p><div className={styles.heroActions}><a className="button button-primary" href="#work">Explore selected work</a><a className="button button-secondary" href={profile.socials.github} target="_blank" rel="noreferrer">GitHub <span className="sr-only">(opens in a new tab)</span></a><a className="button button-secondary" href={profile.socials.linkedin} target="_blank" rel="noreferrer">LinkedIn <span className="sr-only">(opens in a new tab)</span></a></div><p className={styles.educationLine}>B.Tech Computer Science Engineering · August 2023 – August 2027</p></div></section>
    <div className={styles.transitionGap} data-particle-transition="hero-atlas" aria-hidden="true" />
    <div id="systems-atlas" data-scene="atlas" className={styles.atlasWrap}><SystemsAtlas /></div>
    <div className={styles.transitionGap} data-particle-transition="atlas-projects" aria-hidden="true" />
    <FeaturedProjects />
    <div className={styles.transitionGap} data-particle-transition="projects-capabilities" aria-hidden="true" />
    <Capabilities />
    <div className={styles.transitionGap} data-particle-transition="capabilities-practice" aria-hidden="true" />
    <CompetitiveProgramming />
    <AboutEducation />
    <Achievements />
    <Contact />
  </div>
</>; }
