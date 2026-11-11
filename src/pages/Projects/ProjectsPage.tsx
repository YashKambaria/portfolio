import { Link } from 'react-router-dom';
import { projects } from '../../data/portfolio';
export default function ProjectsPage() { return <div className="container page-shell"><span className="eyebrow">PROJECT INDEX</span><h1 className="page-title">Selected work</h1><ul className="route-list">{projects.map((project) => <li key={project.slug}><Link to={`/projects/${project.slug}`}>{project.name}<span>{project.concepts}</span></Link></li>)}</ul></div>; }
