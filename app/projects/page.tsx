import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProjectCard from '@/components/ProjectCard';
import { readContentFile, Project, SettingsData } from '@/lib/content';

export const metadata = {
  title: 'All Projects & Case Studies — Pawan K. Kushwaha',
  description: 'Industrial design archives, hardware prototypes, and mechanical explorations.',
};

export default function ProjectsPage() {
  const projects = readContentFile<Project[]>('projects.json');
  const settings = readContentFile<SettingsData>('settings.json');

  return (
    <div className="portfolio-app-root">
      <Navbar />

      <main style={{ paddingTop: '100px', minHeight: '80vh' }}>
        <section className="work-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-badge">COMPLETE PORTFOLIO</span>
              <h1 className="section-title">ALL PROJECTS & CAD STUDIES.</h1>
              <p className="section-subtitle">
                Explore every functional prototype, product design engagement, and mechanical artifact.
              </p>
            </div>

            <div className="work-grid" style={{ marginTop: '40px' }}>
              {projects.map((proj) => (
                <ProjectCard key={proj.id} project={proj} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer copy={settings.footer?.copy} tagline={settings.footer?.tagline} />
    </div>
  );
}
