'use client';

import React, { useState } from 'react';
import { Project } from '@/lib/content';
import ImageUploader from './ImageUploader';
import { X, Plus, Trash2, Save, Sparkles } from 'lucide-react';

interface ProjectEditorProps {
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
}

export default function ProjectEditor({ project, isOpen, onClose, onSave }: ProjectEditorProps) {
  const isNew = !project;

  const [formData, setFormData] = useState<Project>(() => {
    if (project) return { ...project };
    return {
      id: `project_${Date.now()}`,
      slug: '',
      title: '',
      shortTitle: '',
      category: 'product',
      categoryLabel: 'PRODUCT DESIGN',
      year: new Date().getFullYear().toString(),
      tag: 'Prototyping',
      image: '/images/projects/work_luma.jpg',
      shortDesc: '',
      description: '',
      timeline: '2 Months',
      role: 'Lead Industrial Designer',
      tools: 'Fusion 360, SLA 3D Printing',
      deliverable: 'Functional Working Prototype',
      featured: true,
      showcaseImages: [],
      processImages: [],
    };
  });

  if (!isOpen) return null;

  const updateField = (field: keyof Project, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !prev.slug) {
        next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      return next;
    });
  };

  const addShowcaseImage = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      showcaseImages: [...(prev.showcaseImages || []), { src: url, alt: `${prev.title} view` }],
    }));
  };

  const removeShowcaseImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      showcaseImages: prev.showcaseImages?.filter((_, i) => i !== index),
    }));
  };

  const addProcessImage = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      processImages: [...(prev.processImages || []), { src: url, alt: `${prev.title} process blueprint` }],
    }));
  };

  const removeProcessImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      processImages: prev.processImages?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Project title is required.');
      return;
    }
    const finalSlug = formData.slug || formData.id || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    onSave({
      ...formData,
      slug: finalSlug,
      id: formData.id || finalSlug,
    });
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-box project-editor-modal">
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <Sparkles className="text-accent" size={20} />
            <div>
              <h3>{isNew ? 'Create New Project' : `Edit: ${formData.title}`}</h3>
              <p>Fill out the project specifications, case study, and imagery.</p>
            </div>
          </div>
          <button className="admin-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="project-editor-form">
          <div className="admin-modal-body editor-body">
            <div className="editor-grid">
              {/* Left Column: Basic Info */}
              <div className="editor-col">
                <div className="admin-field-group">
                  <label>Project Title *</label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    value={formData.title}
                    placeholder="e.g. LUMA — Minimalist Modular Desk Lamp"
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </div>

                <div className="form-row-2">
                  <div className="admin-field-group">
                    <label>Short Title (Card Header)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={formData.shortTitle || ''}
                      placeholder="e.g. LUMA"
                      onChange={(e) => updateField('shortTitle', e.target.value)}
                    />
                  </div>
                  <div className="admin-field-group">
                    <label>URL Slug</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={formData.slug || ''}
                      placeholder="e.g. luma-desk-lamp"
                      onChange={(e) => updateField('slug', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="admin-field-group">
                    <label>Category</label>
                    <select
                      className="admin-input"
                      value={formData.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateField('category', val);
                        updateField(
                          'categoryLabel',
                          val === 'product'
                            ? 'PRODUCT DESIGN'
                            : val === 'uiux'
                            ? 'UI/UX DESIGN'
                            : 'GRAPHIC DESIGN'
                        );
                      }}
                    >
                      <option value="product">Product Design</option>
                      <option value="uiux">UI/UX Design</option>
                      <option value="graphic">Graphic Design</option>
                    </select>
                  </div>
                  <div className="admin-field-group">
                    <label>Year</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={formData.year || ''}
                      placeholder="2024"
                      onChange={(e) => updateField('year', e.target.value)}
                    />
                  </div>
                  <div className="admin-field-group">
                    <label>Badge Tag</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={formData.tag || ''}
                      placeholder="e.g. CAD + 3D Print"
                      onChange={(e) => updateField('tag', e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-field-group">
                  <label>Short Summary (for grids & cards)</label>
                  <textarea
                    rows={2}
                    className="admin-textarea"
                    value={formData.shortDesc || ''}
                    placeholder="Brief 1-2 sentence hook..."
                    onChange={(e) => updateField('shortDesc', e.target.value)}
                  />
                </div>

                <div className="admin-field-group">
                  <label>Full Case Study & Engineering Details</label>
                  <textarea
                    rows={6}
                    className="admin-textarea"
                    value={formData.description || ''}
                    placeholder="Detailed explanation of the design challenge, ergonomics, manufacturing constraints, and solutions..."
                    onChange={(e) => updateField('description', e.target.value)}
                  />
                </div>

                <div className="form-row-3">
                  <div className="admin-field-group">
                    <label>Role</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={formData.role || ''}
                      placeholder="Lead Prototyper"
                      onChange={(e) => updateField('role', e.target.value)}
                    />
                  </div>
                  <div className="admin-field-group">
                    <label>Timeline</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={formData.timeline || ''}
                      placeholder="4 Months"
                      onChange={(e) => updateField('timeline', e.target.value)}
                    />
                  </div>
                  <div className="admin-field-group">
                    <label>Featured on Home?</label>
                    <div className="checkbox-toggle-wrap">
                      <input
                        type="checkbox"
                        id="featCheck"
                        checked={formData.featured ?? true}
                        onChange={(e) => updateField('featured', e.target.checked)}
                      />
                      <label htmlFor="featCheck">Featured Project</label>
                    </div>
                  </div>
                </div>

                <div className="admin-field-group">
                  <label>Tools & Software Used</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.tools || ''}
                    placeholder="e.g. Autodesk Fusion 360, SLA 3D Printing, CNC Milling"
                    onChange={(e) => updateField('tools', e.target.value)}
                  />
                </div>
              </div>

              {/* Right Column: Imagery */}
              <div className="editor-col">
                <div className="admin-field-group">
                  <ImageUploader
                    label="Main Cover Image *"
                    currentUrl={formData.image}
                    folder="projects"
                    onUploaded={(url) => updateField('image', url)}
                  />
                </div>

                {/* Showcase Gallery */}
                <div className="sub-gallery-section">
                  <div className="sub-gallery-header">
                    <h4>Showcase Photos ({formData.showcaseImages?.length || 0})</h4>
                    <span className="sub-gallery-desc">Finished product & studio glamour angles</span>
                  </div>
                  <div className="image-thumbnails-list">
                    {formData.showcaseImages?.map((img, idx) => (
                      <div key={idx} className="thumb-item">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.src} alt={img.alt} />
                        <button
                          type="button"
                          className="thumb-delete-btn"
                          onClick={() => removeShowcaseImage(idx)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <ImageUploader
                    label="Add Showcase Photo"
                    folder="projects"
                    onUploaded={addShowcaseImage}
                  />
                </div>

                {/* Process Gallery */}
                <div className="sub-gallery-section">
                  <div className="sub-gallery-header">
                    <h4>Process & CAD Blueprints ({formData.processImages?.length || 0})</h4>
                    <span className="sub-gallery-desc">Foam models, toolpaths, CNC rigs, and schematics</span>
                  </div>
                  <div className="image-thumbnails-list">
                    {formData.processImages?.map((img, idx) => (
                      <div key={idx} className="thumb-item">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.src} alt={img.alt} />
                        <button
                          type="button"
                          className="thumb-delete-btn"
                          onClick={() => removeProcessImage(idx)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <ImageUploader
                    label="Add Process Photo / CAD"
                    folder="projects"
                    onUploaded={addProcessImage}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn btn-primary">
              <Save size={16} />
              Save Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
