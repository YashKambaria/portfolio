import SystemsAtlas from '../../components/atlas/SystemsAtlas';
import FeaturedProjects from '../../components/projects/FeaturedProjects';
import { AboutEducation, Achievements, Capabilities, CompetitiveProgramming, Contact } from '../../components/sections/PortfolioSections';
import { profile } from '../../data/portfolio';
import styles from './HomePage.module.css';
const stones = ['Power', 'Space', 'Reality', 'Soul', 'Time', 'Mind'];

function ParticleStage({ label, figure, lightOnly = false }: { label: string; figure?: string; lightOnly?: boolean }) {
  return <div className={styles.particlePanel} data-light-only={lightOnly || undefined}>
    <div className={styles.particleStage} data-particle-stage={label} aria-hidden="true" />
    <p className={styles.particleCaption}>
      <span className={styles.lightFigure}>{label}</span>
      {figure && <span className={styles.darkFigure}>{figure}</span>}
      <span>{figure === 'Iron Man' ? <><span className={styles.lightFigure}>Tap or drag</span><span className={styles.darkFigure}>Tap, drag or hold</span></> : 'Tap or drag'}</span>
    </p>
    {figure === 'Iron Man' && <div className={styles.stones} role="group" aria-label="Infinity Stones">
      {stones.map((stone, index) => <button key={stone} type="button"
        onClick={(event) => {
          const frame = event.currentTarget.closest<HTMLElement>('.site-frame');
          if (frame) frame.dataset.mobileStone = `${index}:${performance.now() + 2800}`;
        }}>
        {stone}
      </button>)}
    </div>}
  </div>;
}

export default function HomePage() { return <>
  <div className="container"><section className={styles.hero} data-scene="hero" aria-labelledby="hero-title"><div className={styles.heroCopy}><span className="eyebrow">YASH KAMBARIA · NIRMA UNIVERSITY · CLASS OF 2027</span><h1 id="hero-title">{profile.headline}</h1><p className={styles.name}>{profile.name}</p><p className={styles.position}>Backend Engineer <span>/</span> Distributed Systems <span>/</span> Cloud-Native Applications</p><ParticleStage label="Laptop" figure="Iron Man" /><p className={styles.intro} data-mobile-stone-copy>{profile.intro}</p><div className={styles.heroActions}><a className="button button-primary" href="#work">Explore selected work</a><a className="button button-secondary" href={profile.socials.github} target="_blank" rel="noreferrer">GitHub <span className="sr-only">(opens in a new tab)</span></a><a className="button button-secondary" href={profile.socials.linkedin} target="_blank" rel="noreferrer">LinkedIn <span className="sr-only">(opens in a new tab)</span></a></div><p className={styles.educationLine}>B.Tech Computer Science Engineering · August 2023 – August 2027</p></div></section>
    <div className={styles.transitionGap} data-particle-transition="hero-atlas" aria-hidden="true" />
    <ParticleStage label="CPU" lightOnly />
    <div id="systems-atlas" data-scene="atlas" className={styles.atlasWrap}><SystemsAtlas /></div>
    <div className={styles.transitionGap} data-particle-transition="atlas-projects" aria-hidden="true" />
    <ParticleStage label="Cooling fan" figure="Standing Doom" />
    <FeaturedProjects />
    <div className={styles.transitionGap} data-particle-transition="projects-capabilities" aria-hidden="true" />
    <ParticleStage label="Java" lightOnly />
    <Capabilities />
    <div className={styles.transitionGap} data-particle-transition="capabilities-practice" aria-hidden="true" />
    <ParticleStage label="DSA" figure="Doom on the throne" />
    <CompetitiveProgramming />
    <AboutEducation />
    <Achievements />
    <Contact />
  </div>
</>; }
