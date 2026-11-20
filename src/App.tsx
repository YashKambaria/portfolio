import { Route, Routes } from 'react-router-dom';
import SiteLayout from './components/layout/SiteLayout';
import HomePage from './pages/Home/HomePage';
import ProjectsPage from './pages/Projects/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetail/ProjectDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:slug" element={<ProjectDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <Analytics />
    </>
  );
}
