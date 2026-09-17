'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FolderGit2, 
  Briefcase, 
  Wrench, 
  Settings, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/content')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const projectCount = data?.projects?.length || 0;
  const experienceCount = (data?.experience?.length || 0) + (data?.education?.length || 0);
  const physicalSkillsCount = data?.skills?.physicalList?.length || 0;
  const digitalSkillsCount = data?.skills?.digitalList?.length || 0;

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-hero admin-card">
        <div className="dashboard-hero-content">
          <span className="meta-badge clean">
            <Sparkles size={14} />
            Pawan K. Kushwaha CMS
          </span>
          <h2 className="admin-hero-title">Welcome back, Pawan.</h2>
          <p className="admin-hero-subtitle">
            Manage your industrial design portfolio, add CAD prototypes, update case studies, and trigger automatic deployments to Vercel.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap">
            <FolderGit2 size={24} />
          </div>
          <div>
            <div className="stat-val">{loading ? '-' : projectCount}</div>
            <div className="stat-label">Total Projects</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap">
            <Briefcase size={24} />
          </div>
          <div>
            <div className="stat-val">{loading ? '-' : experienceCount}</div>
            <div className="stat-label">Milestones & History</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap">
            <Wrench size={24} />
          </div>
          <div>
            <div className="stat-val">
              {loading ? '-' : physicalSkillsCount + digitalSkillsCount}
            </div>
            <div className="stat-label">Skill Capabilities</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap">
            <CheckCircle2 size={24} className="text-green" />
          </div>
          <div>
            <div className="stat-val">Online</div>
            <div className="stat-label">Git Publishing Ready</div>
          </div>
        </div>
      </div>

      {/* Quick Access Sections */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Content Sections</h3>
        </div>

        <div className="dashboard-sections-grid">
          <Link href="/admin/projects" className="section-shortcut-card">
            <div className="shortcut-icon">
              <FolderGit2 size={22} />
            </div>
            <div className="shortcut-info">
              <h4>Manage Projects & Prototypes</h4>
              <p>Add new CAD models, edit case studies, upload blueprints, and set featured items.</p>
            </div>
            <ArrowRight size={18} className="shortcut-arrow" />
          </Link>

          <Link href="/admin/experience" className="section-shortcut-card">
            <div className="shortcut-icon">
              <Briefcase size={22} />
            </div>
            <div className="shortcut-info">
              <h4>Experience & Education</h4>
              <p>Update timeline milestones, manufacturing engagements, and academic degrees.</p>
            </div>
            <ArrowRight size={18} className="shortcut-arrow" />
          </Link>

          <Link href="/admin/skills" className="section-shortcut-card">
            <div className="shortcut-icon">
              <Wrench size={22} />
            </div>
            <div className="shortcut-info">
              <h4>Skills & Tooling</h4>
              <p>Configure Physical fabrication (CNC, SLA 3D, DFM) and Digital UX capabilities.</p>
            </div>
            <ArrowRight size={18} className="shortcut-arrow" />
          </Link>

          <Link href="/admin/settings" className="section-shortcut-card">
            <div className="shortcut-icon">
              <Settings size={22} />
            </div>
            <div className="shortcut-info">
              <h4>Site Settings & Bio</h4>
              <p>Edit profile headline, availability status, ambient track, and social media handles.</p>
            </div>
            <ArrowRight size={18} className="shortcut-arrow" />
          </Link>
        </div>
      </div>

      <style jsx>{`
        .dashboard-hero {
          margin-bottom: 24px;
          background: linear-gradient(135deg, rgba(139, 38, 53, 0.2), #18191e);
          border-color: rgba(139, 38, 53, 0.3);
        }
        .admin-hero-title {
          font-size: 1.65rem;
          font-weight: 800;
          margin: 12px 0 6px;
        }
        .admin-hero-subtitle {
          font-size: 0.92rem;
          color: var(--admin-text-muted);
          max-width: 650px;
          line-height: 1.5;
        }
        .dashboard-sections-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }
        .section-shortcut-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px;
          background: var(--admin-bg-elevated);
          border: 1px solid var(--admin-border);
          border-radius: var(--radius-sm);
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
        }
        .section-shortcut-card:hover {
          border-color: var(--admin-accent);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        .shortcut-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          background: rgba(139, 38, 53, 0.15);
          color: var(--admin-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .shortcut-info {
          flex: 1;
        }
        .shortcut-info h4 {
          font-size: 0.98rem;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .shortcut-info p {
          font-size: 0.8rem;
          color: var(--admin-text-muted);
          line-height: 1.4;
        }
        .shortcut-arrow {
          color: var(--admin-text-dim);
          transition: transform 0.2s ease;
        }
        .section-shortcut-card:hover .shortcut-arrow {
          transform: translateX(4px);
          color: var(--admin-text-main);
        }
      `}</style>
    </div>
  );
}
