'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, CheckCircle2, Wrench, Cpu } from 'lucide-react';
import { SkillsData } from '@/lib/content';

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<SkillsData>({
    physicalTitle: 'Physical & Industrial Design',
    physicalList: [],
    physicalPills: [],
    digitalTitle: 'Digital, UX & Visual Crafts',
    digitalList: [],
    digitalPills: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPhysicalPill, setNewPhysicalPill] = useState('');
  const [newDigitalPill, setNewDigitalPill] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/content?file=skills.json')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setSkills((prev) => ({ ...prev, ...res.data }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: 'skills.json', data: skills }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Skills draft saved successfully!');
      } else {
        alert(data.error || 'Failed to save skills');
      }
    } catch (e: any) {
      alert(e.message || 'Error saving skills');
    } finally {
      setSaving(false);
    }
  };

  const addPhysicalBullet = () => {
    setSkills((prev) => ({
      ...prev,
      physicalList: [...(prev.physicalList || []), 'New physical design capability'],
    }));
  };

  const updatePhysicalBullet = (idx: number, val: string) => {
    const list = [...(skills.physicalList || [])];
    list[idx] = val;
    setSkills({ ...skills, physicalList: list });
  };

  const removePhysicalBullet = (idx: number) => {
    setSkills({
      ...skills,
      physicalList: skills.physicalList?.filter((_, i) => i !== idx),
    });
  };

  const addPhysicalPill = () => {
    if (!newPhysicalPill.trim()) return;
    setSkills((prev) => ({
      ...prev,
      physicalPills: [...(prev.physicalPills || []), newPhysicalPill.trim()],
    }));
    setNewPhysicalPill('');
  };

  const removePhysicalPill = (idx: number) => {
    setSkills({
      ...skills,
      physicalPills: skills.physicalPills?.filter((_, i) => i !== idx),
    });
  };

  const addDigitalBullet = () => {
    setSkills((prev) => ({
      ...prev,
      digitalList: [...(prev.digitalList || []), 'New digital interaction capability'],
    }));
  };

  const updateDigitalBullet = (idx: number, val: string) => {
    const list = [...(skills.digitalList || [])];
    list[idx] = val;
    setSkills({ ...skills, digitalList: list });
  };

  const removeDigitalBullet = (idx: number) => {
    setSkills({
      ...skills,
      digitalList: skills.digitalList?.filter((_, i) => i !== idx),
    });
  };

  const addDigitalPill = () => {
    if (!newDigitalPill.trim()) return;
    setSkills((prev) => ({
      ...prev,
      digitalPills: [...(prev.digitalPills || []), newDigitalPill.trim()],
    }));
    setNewDigitalPill('');
  };

  const removeDigitalPill = (idx: number) => {
    setSkills({
      ...skills,
      digitalPills: skills.digitalPills?.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="admin-skills-container">
      <div className="page-header">
        <div>
          <h2 className="admin-card-title">Skills & Fabrication Tools</h2>
          <p className="page-desc">
            Organize your physical manufacturing proficiencies and digital software stack.
          </p>
        </div>
        <button
          className="admin-btn btn-primary"
          onClick={handleSave}
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

      <div className="skills-columns-grid">
        {/* Physical Column */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wrench size={20} className="text-accent" />
              <input
                type="text"
                className="admin-input card-header-input"
                value={skills.physicalTitle || 'Physical & Industrial Design'}
                onChange={(e) => setSkills({ ...skills, physicalTitle: e.target.value })}
              />
            </div>
          </div>

          <div className="admin-field-group">
            <label>Tool / Material Chips</label>
            <div className="pill-tags-list">
              {skills.physicalPills?.map((pill, idx) => (
                <span key={idx} className="skill-chip">
                  {pill}
                  <button type="button" onClick={() => removePhysicalPill(idx)}>
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="add-pill-row">
              <input
                type="text"
                className="admin-input"
                placeholder="Add tool (e.g. SolidWorks, SLA Print)"
                value={newPhysicalPill}
                onChange={(e) => setNewPhysicalPill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhysicalPill())}
              />
              <button type="button" className="admin-btn btn-secondary" onClick={addPhysicalPill}>
                Add
              </button>
            </div>
          </div>

          <div className="admin-field-group" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label>Detailed Competency Bullets</label>
              <button
                type="button"
                className="admin-btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                onClick={addPhysicalBullet}
              >
                <Plus size={12} /> Add Bullet
              </button>
            </div>
            <div className="bullets-stack">
              {skills.physicalList?.map((bullet, idx) => (
                <div key={idx} className="bullet-input-row">
                  <input
                    type="text"
                    className="admin-input"
                    value={bullet}
                    onChange={(e) => updatePhysicalBullet(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    className="admin-btn-icon delete"
                    onClick={() => removePhysicalBullet(idx)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Digital Column */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={20} className="text-accent" />
              <input
                type="text"
                className="admin-input card-header-input"
                value={skills.digitalTitle || 'Digital, UX & Visual Crafts'}
                onChange={(e) => setSkills({ ...skills, digitalTitle: e.target.value })}
              />
            </div>
          </div>

          <div className="admin-field-group">
            <label>Digital Software / Discipline Chips</label>
            <div className="pill-tags-list">
              {skills.digitalPills?.map((pill, idx) => (
                <span key={idx} className="skill-chip">
                  {pill}
                  <button type="button" onClick={() => removeDigitalPill(idx)}>
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="add-pill-row">
              <input
                type="text"
                className="admin-input"
                placeholder="Add discipline (e.g. Figma, Next.js)"
                value={newDigitalPill}
                onChange={(e) => setNewDigitalPill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDigitalPill())}
              />
              <button type="button" className="admin-btn btn-secondary" onClick={addDigitalPill}>
                Add
              </button>
            </div>
          </div>

          <div className="admin-field-group" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label>Detailed Competency Bullets</label>
              <button
                type="button"
                className="admin-btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                onClick={addDigitalBullet}
              >
                <Plus size={12} /> Add Bullet
              </button>
            </div>
            <div className="bullets-stack">
              {skills.digitalList?.map((bullet, idx) => (
                <div key={idx} className="bullet-input-row">
                  <input
                    type="text"
                    className="admin-input"
                    value={bullet}
                    onChange={(e) => updateDigitalBullet(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    className="admin-btn-icon delete"
                    onClick={() => removeDigitalBullet(idx)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
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
        .skills-columns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
          gap: 24px;
        }
        .card-header-input {
          font-size: 1.05rem;
          font-weight: 700;
          background: transparent;
          border: 1px solid transparent;
        }
        .card-header-input:focus {
          background: var(--admin-bg-elevated);
          border-color: var(--admin-border);
        }
        .pill-tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        .skill-chip {
          background: var(--admin-bg-elevated);
          border: 1px solid var(--admin-border);
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.82rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .skill-chip button {
          background: none;
          border: none;
          color: var(--admin-text-dim);
          cursor: pointer;
          font-size: 1.1rem;
          line-height: 1;
        }
        .skill-chip button:hover {
          color: var(--admin-red);
        }
        .add-pill-row {
          display: flex;
          gap: 10px;
        }
        .bullets-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bullet-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
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
