import { Link } from 'react-router-dom';
export default function NotFoundPage() { return <div className="container page-shell"><span className="eyebrow">404</span><h1 className="page-title">Page not found</h1><Link to="/">Return home</Link></div>; }
