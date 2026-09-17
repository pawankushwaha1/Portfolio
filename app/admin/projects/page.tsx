'use client';

import React, { useEffect, useState } from 'react';
import { Project } from '@/lib/content';
import ProjectEditor from '@/components/admin/ProjectEditor';
import { Plus, Edit2, Trash2, Star, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content?file=projects.json');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProjects(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const saveProjectsToDraft = async (updatedList: Project[]) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: 'projects.json',
          data: updatedList,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProjects(updatedList);
        showToast('Draft saved successfully!');
      } else {
        alert(data.error || 'Failed to save projects');
      }
    } catch (e: any) {
      alert(e.message || 'Error saving projects');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = () => {
    setEditingProject(null);
    setEditorOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      const filtered = projects.filter((p) => p.id !== id);
      saveProjectsToDraft(filtered);
    }
  };

  const handleToggleFeatured = (id: string) => {
    const updated = projects.map((p) =>
      p.id === id ? { ...p, featured: !p.featured } : p
    );
    saveProjectsToDraft(updated);
  };

  const handleSaveProject = (savedProj: Project) => {
    let updated: Project[];
    const exists = projects.some((p) => p.id === savedProj.id);
    if (exists) {
      updated = projects.map((p) => (p.id === savedProj.id ? savedProj : p));
    } else {
      updated = [savedProj, ...projects];
    }
    setEditorOpen(false);
    saveProjectsToDraft(updated);
  };

  return (
    <div className="admin-projects-container">
      <div className="page-header">
        <div>
          <h2 className="admin-card-title">Portfolio Projects</h2>
          <p className="page-desc">
            Manage your industrial prototypes, case studies, and engineering CAD showcases.
          </p>
        </div>
        <button className="admin-btn btn-primary" onClick={handleCreateNew}>
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </div>

      {toastMessage && (
        <div className="admin-toast">
          <CheckCircle2 size={16} className="text-green" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="admin-card">
        {loading ? (
          <div className="loading-state">
            <Loader2 size={24} className="spinner text-accent" />
            <span>Loading projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects found. Click "New Project" to add your first case study.</p>
          </div>
        ) : (
          <table className="items-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Title & Slug</th>
                <th>Category</th>
                <th>Year</th>
                <th>Tag</th>
                <th>Featured</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => (
                <tr key={proj.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proj.image || '/images/projects/work_luma.jpg'}
                      alt={proj.title}
                      className="table-thumb"
                    />
                  </td>
                  <td>
                    <strong>{proj.title}</strong>
                    <span className="slug-text">/{proj.slug || proj.id}</span>
                  </td>
                  <td>
                    <span className="category-badge">{proj.category}</span>
                  </td>
                  <td>{proj.year || '-'}</td>
                  <td>
                    <span className="tag-pill">{proj.tag || 'CAD'}</span>
                  </td>
                  <td>
                    <button
                      className={`star-toggle-btn ${proj.featured ? 'active' : ''}`}
                      onClick={() => handleToggleFeatured(proj.id)}
                      title="Toggle Featured on homepage"
                    >
                      <Star size={16} fill={proj.featured ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions">
                      <button
                        className="admin-btn-icon"
                        onClick={() => handleEdit(proj)}
                        title="Edit Project"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="admin-btn-icon delete"
                        onClick={() => handleDelete(proj.id)}
                        title="Delete Project"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProjectEditor
        project={editingProject}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveProject}
      />

      <style jsx>{`
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .page-desc {
          font-size: 0.86rem;
          color: var(--admin-text-muted);
          margin-top: 4px;
        }
        .slug-text {
          display: block;
          font-size: 0.76rem;
          color: var(--admin-text-dim);
          font-family: monospace;
        }
        .category-badge {
          font-size: 0.78rem;
          text-transform: uppercase;
          font-weight: 600;
          color: var(--admin-text-muted);
        }
        .tag-pill {
          background: rgba(255, 255, 255, 0.06);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.76rem;
          font-weight: 500;
        }
        .star-toggle-btn {
          background: transparent;
          border: none;
          color: var(--admin-text-dim);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .star-toggle-btn.active {
          color: #f59e0b;
        }
        .table-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }
        .admin-btn-icon.delete:hover {
          color: var(--admin-red);
          border-color: rgba(239, 68, 68, 0.4);
        }
        .admin-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: var(--admin-bg-elevated);
          border: 1px solid var(--admin-green);
          border-radius: var(--radius-sm);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.88rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          z-index: 100;
        }
        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 48px 0;
          color: var(--admin-text-muted);
        }
      `}</style>
    </div>
  );
}
