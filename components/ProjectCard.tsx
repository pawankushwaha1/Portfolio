'use client';

import React from 'react';
import Link from 'next/link';
import { Project } from '@/lib/content';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const projectLink = `/projects/${project.slug || project.id}`;

  return (
    <article className="work-card" data-category={project.category} data-project-id={project.id}>
      <Link href={projectLink} className="work-card-media-link">
        <div className="work-card-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image || '/images/projects/work_luma.jpg'}
            alt={project.title}
            className="work-card-img"
            loading="lazy"
          />
          {project.tag && <span className="work-badge">{project.tag}</span>}
        </div>
      </Link>

      <div className="work-card-body">
        <div className="work-card-meta">
          <span className="work-category">{project.categoryLabel || project.category}</span>
          {project.year && (
            <>
              <span className="work-dot" />
              <span className="work-year">{project.year}</span>
            </>
          )}
        </div>

        <h3 className="work-card-title">
          <Link href={projectLink}>{project.title}</Link>
        </h3>

        <p className="work-card-desc">
          {project.shortDesc || project.description.substring(0, 110) + '...'}
        </p>

        <div className="work-card-footer">
          <Link href={projectLink} className="work-link">
            <span>View Case Study</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
