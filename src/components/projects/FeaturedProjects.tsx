import { ArrowUpRight, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { projects } from '../../data/portfolio';
import styles from './FeaturedProjects.module.css';

export default function FeaturedProjects() {
  return <section className="section-block" id="work" data-scene="projects" aria-labelledby="work-title">
    <div className="section-heading"><div><span className="eyebrow">SELECTED ENGINEERING WORK</span><h2 id="work-title">Systems built around real engineering questions.</h2></div><Link to="/projects" className="section-link">Project index <ArrowUpRight size={16}/></Link></div>
    <div className={styles.grid}>{projects.map((project, index) => <article className={styles.card} key={project.slug}>
      <div className={`${styles.visual} ${styles[project.visual]}`}>
        {project.image ? <img src={project.image} alt={project.imageAlt} loading="lazy"/> : <div className={styles.splitwiseVisual} aria-label="Smart Splitwise architecture summary"><span>Flutter App</span><b>→</b><span>Spring Cloud Gateway</span><b>→</b><span>Expense Microservice</span><i>Model Service → FastAPI · category prediction</i><small>MongoDB Atlas · groups, users and expenses</small></div>}
        <span className={styles.index}>0{index + 1}</span>
      </div>
      <div className={styles.body}><span className="eyebrow">{project.eyebrow}</span><h3><Link to={`/projects/${project.slug}`}>{project.name}</Link></h3><p className={styles.summary}>{project.summary}</p>
        <p className={styles.contribution}><strong>Contribution</strong> {project.contribution}</p>
        <div className={styles.tags}>{project.technologies.slice(0, 5).map((technology) => <span key={technology}>{technology}</span>)}</div>
        <div className={styles.links}><Link to={`/projects/${project.slug}`}>Case study <ArrowUpRight size={15}/></Link>{project.repo && <a href={project.repo} target="_blank" rel="noreferrer"><Github size={15}/> Repository <span className="sr-only">(opens in a new tab)</span></a>}{!project.repo && <span className={styles.privateNote}>Repository link pending security cleanup</span>}</div>
      </div>
    </article>)}</div>
  </section>;
}
