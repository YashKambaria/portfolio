import { Link, useParams } from 'react-router-dom';
import { projects } from '../../data/portfolio';

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    return <div className="container page-shell">
      <h1 className="page-title">Project not found</h1>
      <Link to="/projects">Back to projects</Link>
    </div>;
  }

  return <div className="container page-shell">
    <Link to="/projects">← All projects</Link>
    <span className="eyebrow page-eyebrow">CASE STUDY</span>
    <h1 className="page-title">{project.name}</h1>
    <p className="page-note">{project.summary}</p>
    <p className="page-note"><strong>Contribution</strong> {project.contribution}</p>
    <section id="architecture" className="architecture-shell" aria-labelledby="architecture-title">
      <span className="eyebrow">ARCHITECTURE INSPECTION</span>
      <h2 id="architecture-title">Project concepts</h2>
      <ul className="architecture-concepts" role="list">
        {project.concepts.map((concept) => <li key={concept}>{concept}</li>)}
      </ul>
    </section>
  </div>;
}
