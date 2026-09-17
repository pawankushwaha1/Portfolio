'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, CheckCircle2, Briefcase, GraduationCap } from 'lucide-react';

interface MilestoneItem {
  year: string;
  title: string;
  desc: string;
  tag: string;
}

interface EducationItem {
  institution: string;
  degree: string;
  year: string;
  details?: string;
}

export default function AdminExperiencePage() {
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/content?file=experience.json').then((r) => r.json()),
      fetch('/api/admin/content?file=education.json').then((r) => r.json()),
    ])
      .then(([expData, eduData]) => {
        if (expData.success && Array.isArray(expData.data)) setMilestones(expData.data);
        if (eduData.success && Array.isArray(eduData.data)) setEducation(eduData.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddMilestone = () => {
    setMilestones([
      {
        year: '2025',
        title: 'Industrial Design Specialist',
        desc: 'Spearheaded physical DFM prototyping and injection molding tooling.',
        tag: 'Prototype',
      },
      ...milestones,
    ]);
  };

  const updateMilestone = (idx: number, field: keyof MilestoneItem, val: string) => {
    const updated = [...milestones];
    updated[idx] = { ...updated[idx], [field]: val };
    setMilestones(updated);
  };

  const removeMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleAddEducation = () => {
    setEducation([
      {
        institution: 'Design Institute',
        degree: 'Bachelor of Design (B.Des)',
        year: '2020 - 2024',
        details: 'Product Design & Ergonomics',
      },
      ...education,
    ]);
  };

  const updateEducation = (idx: number, field: keyof EducationItem, val: string) => {
    const updated = [...education];
    updated[idx] = { ...updated[idx], [field]: val };
    setEducation(updated);
  };

  const removeEducation = (idx: number) => {
    setEducation(education.filter((_, i) => i !== idx));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: 'experience.json', data: milestones }),
        }),
        fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: 'education.json', data: education }),
        }),
      ]);
      showToast('Experience & Education drafts saved!');
    } catch (e: any) {
      alert(e.message || 'Error saving data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-experience-container">
      <div className="page-header">
        <div>
          <h2 className="admin-card-title">Experience & Career History</h2>
          <p className="page-desc">
            Edit your design journey milestones, fabrication engagements, and credentials.
          </p>
        </div>
        <button
          className="admin-btn btn-primary"
          onClick={handleSaveAll}
          disabled={saving || loading}
        >
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Draft'}</span>
        </button>
      </div>

      {toastMessage && (
        <div className="admin-toast">
          <CheckCircle2 size={16} className="text-green" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Experience / Milestones */}
      <div className="admin-card" style={{ marginBottom: '28px' }}>
        <div className="admin-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={20} className="text-accent" />
            <h3 className="admin-card-title">Work & Project Milestones</h3>
          </div>
          <button className="admin-btn btn-secondary" onClick={handleAddMilestone}>
            <Plus size={14} /> Add Milestone
          </button>
        </div>

        <div className="items-list">
          {milestones.map((item, idx) => (
            <div key={idx} className="item-row-card">
              <div className="row-header">
                <div className="field-split">
                  <input
                    type="text"
                    className="admin-input year-input"
                    value={item.year}
                    placeholder="Year"
                    onChange={(e) => updateMilestone(idx, 'year', e.target.value)}
                  />
                  <input
                    type="text"
                    className="admin-input title-input"
                    value={item.title}
                    placeholder="Role or Engagement Title"
                    onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                  />
                  <input
                    type="text"
                    className="admin-input tag-input"
                    value={item.tag}
                    placeholder="Tag / Sector"
                    onChange={(e) => updateMilestone(idx, 'tag', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="admin-btn-icon delete"
                  onClick={() => removeMilestone(idx)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                rows={2}
                className="admin-textarea"
                value={item.desc}
                placeholder="Description of deliverables and achievements..."
                onChange={(e) => updateMilestone(idx, 'desc', e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GraduationCap size={20} className="text-accent" />
            <h3 className="admin-card-title">Education & Qualifications</h3>
          </div>
          <button className="admin-btn btn-secondary" onClick={handleAddEducation}>
            <Plus size={14} /> Add Degree
          </button>
        </div>

        <div className="items-list">
          {education.map((item, idx) => (
            <div key={idx} className="item-row-card">
              <div className="row-header">
                <div className="field-split">
                  <input
                    type="text"
                    className="admin-input year-input"
                    value={item.year}
                    placeholder="Year range"
                    onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                  />
                  <input
                    type="text"
                    className="admin-input title-input"
                    value={item.degree}
                    placeholder="Degree / Qualification"
                    onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="admin-btn-icon delete"
                  onClick={() => removeEducation(idx)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <input
                  type="text"
                  className="admin-input"
                  value={item.institution}
                  placeholder="Institution name"
                  onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                />
                <input
                  type="text"
                  className="admin-input"
                  value={item.details || ''}
                  placeholder="Specialization or honors"
                  onChange={(e) => updateEducation(idx, 'details', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

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
        .items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .item-row-card {
          background: var(--admin-bg-elevated);
          border: 1px solid var(--admin-border);
          border-radius: var(--radius-sm);
          padding: 16px;
        }
        .row-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .field-split {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .year-input {
          max-width: 130px;
        }
        .tag-input {
          max-width: 180px;
        }
        .title-input {
          flex: 1;
          font-weight: 600;
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
      `}</style>
    </div>
  );
}
