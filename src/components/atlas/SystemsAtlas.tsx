import { ArrowDownRight, ArrowUpRight, Network } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../../data/portfolio';
import styles from './SystemsAtlas.module.css';

export default function SystemsAtlas() {
  const [selected, setSelected] = useState(projects[0]);
  return <section className={styles.atlas} aria-labelledby="atlas-title">
    <div className={styles.topline}><span className="eyebrow">A MAP OF THE WORK</span><span className={styles.mapIcon}><Network size={16}/> SYSTEMS ATLAS</span></div>
    <div className={styles.atlasGrid}>
      <div className={styles.projectRail} role="group" aria-label="Choose a project to inspect">
        {projects.map((project, index) => <button key={project.slug} type="button" className={`${styles.projectButton} ${selected.slug === project.slug ? styles.active : ''}`} aria-pressed={selected.slug === project.slug} onClick={() => setSelected(project)}>
          <span className={styles.projectNumber}>0{index + 1}</span><span>{project.name}</span><ArrowDownRight size={16} aria-hidden="true"/>
        </button>)}
      </div>
      <div className={styles.inspectPanel} aria-live="polite" aria-atomic="true">
        <span className="eyebrow">{selected.eyebrow}</span><h3>{selected.name}</h3><p>{selected.atlas}</p>
        <div className={styles.conceptLanes}>{selected.concepts.slice(0, 4).map((concept) => <span key={concept}>{concept}</span>)}</div>
        <div className={styles.inspectActions}><Link to={`/projects/${selected.slug}#architecture`}>Inspect architecture <ArrowDownRight size={15}/></Link><Link to={`/projects/${selected.slug}`}>Open case study <ArrowUpRight size={15}/></Link></div>
      </div>
    </div>
    <div className={styles.atlasTextEquivalent}><span className="eyebrow">PROJECT CONCEPTS</span><p>{projects.map((p) => `${p.name}: ${p.concepts.slice(0, 4).join(', ')}`).join(' · ')}</p></div>
  </section>;
}
