import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { readContentFile, Project, SettingsData } from '@/lib/content';
import { ArrowLeft, CheckCircle2, Clock, Wrench, FileText } from 'lucide-react';

interface ProjectDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const projects = readContentFile<Project[]>('projects.json');
  return projects.map((p) => ({
    slug: p.slug || p.id,
  }));
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const projects = readContentFile<Project[]>('projects.json');
  const settings = readContentFile<SettingsData>('settings.json');

  const project = projects.find(
    (p) => p.slug === params.slug || p.id === params.slug
  );

  if (!project) {
    notFound();
  }

  const currentIndex = projects.findIndex((p) => p.id === project.id);
  const nextProject = projects[(currentIndex + 1) % projects.length];

  return (
    <div className="portfolio-app-root">
      <Navbar />

      <main className="project-detail-main">
        <div className="section-container">
          {/* Back Navigation */}
          <div className="project-back-nav">
            <Link href="/#work" className="back-link">
              <ArrowLeft size={16} />
              <span>Back to Works</span>
            </Link>
            <span className="project-meta-pill">{project.categoryLabel || project.category}</span>
          </div>

          {/* Project Header */}
          <header className="project-header">
            <div className="project-headline-wrap">
              <span className="project-year-badge">{project.year || '2024'}</span>
              <h1 className="project-hero-title">{project.title}</h1>
              {project.tag && <span className="project-tag-banner">{project.tag}</span>}
            </div>
            {project.shortDesc && (
              <p className="project-hero-lead">{project.shortDesc}</p>
            )}
          </header>

          {/* Hero Media */}
          <div className="project-hero-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.image || '/images/projects/work_luma.jpg'}
              alt={project.title}
              className="project-main-image"
            />
          </div>

          {/* Specs & Deliverables Grid */}
          <div className="project-specs-bar">
            <div className="spec-block">
              <span className="spec-label">ROLE</span>
              <span className="spec-val">{project.role || 'Lead Industrial Designer'}</span>
            </div>
            <div className="spec-block">
              <span className="spec-label">TIMELINE</span>
              <span className="spec-val">{project.timeline || '3 Months'}</span>
            </div>
            <div className="spec-block">
              <span className="spec-label">TOOLS & SOFTWARE</span>
              <span className="spec-val">{project.tools || 'Fusion 360, SLA 3D Printing'}</span>
            </div>
            <div className="spec-block">
              <span className="spec-label">DELIVERABLE</span>
              <span className="spec-val">{project.deliverable || 'DFM Production Package'}</span>
            </div>
          </div>

          {/* Case Study Body */}
          <article className="project-case-study">
            <h2 className="case-study-heading">Overview & Engineering Challenge</h2>
            <div className="case-study-text">
              {project.description.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </article>

          {/* Showcase Photos */}
          {project.showcaseImages && project.showcaseImages.length > 0 && (
            <section className="project-gallery-section">
              <h3 className="case-study-subheading">Product Showcase & Studio Views</h3>
              <div className="project-images-grid">
                {project.showcaseImages.map((img, idx) => (
                  <figure key={idx} className="project-figure">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt={img.alt} className="gallery-photo" />
                    {img.alt && <figcaption className="figure-caption">{img.alt}</figcaption>}
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Process & CAD Gallery */}
          {project.processImages && project.processImages.length > 0 && (
            <section className="project-gallery-section process-section">
              <h3 className="case-study-subheading">Engineering Blueprints, Toolpaths & CAD</h3>
              <div className="project-images-grid">
                {project.processImages.map((img, idx) => (
                  <figure key={idx} className="project-figure blueprint-figure">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt={img.alt} className="gallery-photo" />
                    {img.alt && <figcaption className="figure-caption">{img.alt}</figcaption>}
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Next Project Nav */}
          {nextProject && (
            <div className="next-project-card">
              <span className="next-label">NEXT CASE STUDY</span>
              <Link href={`/projects/${nextProject.slug || nextProject.id}`} className="next-title-link">
                <h2>{nextProject.title} &rarr;</h2>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer copy={settings.footer?.copy} tagline={settings.footer?.tagline} />

    </div>
  );
}

