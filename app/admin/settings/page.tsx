'use client';

import React, { useEffect, useState } from 'react';
import { SettingsData, AboutData } from '@/lib/content';
import ImageUploader from '@/components/admin/ImageUploader';
import { Save, CheckCircle2, User, Globe, Music, BookOpen } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [about, setAbout] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/content?file=settings.json').then((r) => r.json()),
      fetch('/api/admin/content?file=about.json').then((r) => r.json()),
    ])
      .then(([setData, abtData]) => {
        if (setData.success) setSettings(setData.data);
        if (abtData.success) setAbout(abtData.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !about) return;

    setSaving(true);
    try {
      await Promise.all([
        fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: 'settings.json', data: settings }),
        }),
        fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: 'about.json', data: about }),
        }),
      ]);
      showToast('Settings & Profile draft saved!');
    } catch (e: any) {
      alert(e.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings || !about) {
    return <div style={{ color: 'var(--admin-text-muted)' }}>Loading site settings...</div>;
  }

  return (
    <form onSubmit={handleSave} className="admin-settings-container">
      <div className="page-header">
        <div>
          <h2 className="admin-card-title">Site Settings & Bio</h2>
          <p className="page-desc">
            Update personal branding, bio introductions, contact endpoints, and social media handles.
          </p>
        </div>
        <button type="submit" className="admin-btn btn-primary" disabled={saving}>
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

      {/* Profile & Branding */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} className="text-accent" />
            <h3 className="admin-card-title">Profile & Headline</h3>
          </div>
        </div>

        <div className="form-row-2">
          <div className="admin-field-group">
            <label>Full Display Name</label>
            <input
              type="text"
              className="admin-input"
              value={settings.profile.name}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  profile: { ...settings.profile, name: e.target.value },
                })
              }
            />
          </div>
          <div className="admin-field-group">
            <label>Professional Role / Specialization</label>
            <input
              type="text"
              className="admin-input"
              value={settings.profile.role}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  profile: { ...settings.profile, role: e.target.value },
                })
              }
            />
          </div>
        </div>

        <div className="form-row-3">
          <div className="admin-field-group">
            <label>Title Line 1 (Hero)</label>
            <input
              type="text"
              className="admin-input"
              value={settings.profile.titleLine1}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  profile: { ...settings.profile, titleLine1: e.target.value },
                })
              }
            />
          </div>
          <div className="admin-field-group">
            <label>Title Line 2 (Hero)</label>
            <input
              type="text"
              className="admin-input"
              value={settings.profile.titleLine2}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  profile: { ...settings.profile, titleLine2: e.target.value },
                })
              }
            />
          </div>
          <div className="admin-field-group">
            <label>Tagline</label>
            <input
              type="text"
              className="admin-input"
              value={settings.profile.tagline}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  profile: { ...settings.profile, tagline: e.target.value },
                })
              }
            />
          </div>
        </div>

        <div className="form-row-3">
          <div className="admin-field-group">
            <label>Location</label>
            <input
              type="text"
              className="admin-input"
              value={settings.profile.location}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  profile: { ...settings.profile, location: e.target.value },
                })
              }
            />
          </div>
          <div className="admin-field-group">
            <label>Status Badge Text</label>
            <input
              type="text"
              className="admin-input"
              value={settings.profile.statusText}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  profile: { ...settings.profile, statusText: e.target.value },
                })
              }
            />
          </div>
          <div className="admin-field-group">
            <label>Status Color</label>
            <select
              className="admin-input"
              value={settings.profile.statusType}
              onChange={(e: any) =>
                setSettings({
                  ...settings,
                  profile: { ...settings.profile, statusType: e.target.value },
                })
              }
            >
              <option value="gold">Gold (Available for work)</option>
              <option value="green">Green (Active / Open)</option>
              <option value="red">Red (Booked)</option>
            </select>
          </div>
        </div>
      </div>

      {/* About & Bio */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={20} className="text-accent" />
            <h3 className="admin-card-title">About Page & Philosophy</h3>
          </div>
        </div>

        <div className="admin-field-group">
          <label>Hero Heading</label>
          <input
            type="text"
            className="admin-input"
            value={about.hero.title}
            onChange={(e) =>
              setAbout({
                ...about,
                hero: { ...about.hero, title: e.target.value },
              })
            }
          />
        </div>

        <div className="admin-field-group">
          <label>Introductory Lead</label>
          <textarea
            rows={3}
            className="admin-textarea"
            value={about.hero.lead}
            onChange={(e) =>
              setAbout({
                ...about,
                hero: { ...about.hero, lead: e.target.value },
              })
            }
          />
        </div>

        <div className="admin-field-group">
          <label>In-Depth Bio Statement</label>
          <textarea
            rows={4}
            className="admin-textarea"
            value={about.hero.bio}
            onChange={(e) =>
              setAbout({
                ...about,
                hero: { ...about.hero, bio: e.target.value },
              })
            }
          />
        </div>

        <div className="admin-field-group">
          <label>Avatar / Character Portrait Image</label>
          <ImageUploader
            currentUrl={about.hero.characterImg}
            folder="profile"
            onUploaded={(url) =>
              setAbout({
                ...about,
                hero: { ...about.hero, characterImg: url },
              })
            }
          />
        </div>
      </div>

      {/* Connect, Email & Socials */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={20} className="text-accent" />
            <h3 className="admin-card-title">Contact & Social Links</h3>
          </div>
        </div>

        <div className="form-row-2">
          <div className="admin-field-group">
            <label>Direct Contact Email</label>
            <input
              type="email"
              className="admin-input"
              value={settings.connect.email}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  connect: { ...settings.connect, email: e.target.value },
                })
              }
            />
          </div>
          <div className="admin-field-group">
            <label>GitHub Profile URL</label>
            <input
              type="text"
              className="admin-input"
              value={settings.connect.socials?.github || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  connect: {
                    ...settings.connect,
                    socials: { ...settings.connect.socials, github: e.target.value },
                  },
                })
              }
            />
          </div>
        </div>

        <div className="form-row-3">
          <div className="admin-field-group">
            <label>LinkedIn URL</label>
            <input
              type="text"
              className="admin-input"
              value={settings.connect.socials?.linkedin || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  connect: {
                    ...settings.connect,
                    socials: { ...settings.connect.socials, linkedin: e.target.value },
                  },
                })
              }
            />
          </div>
          <div className="admin-field-group">
            <label>Behance URL</label>
            <input
              type="text"
              className="admin-input"
              value={settings.connect.socials?.behance || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  connect: {
                    ...settings.connect,
                    socials: { ...settings.connect.socials, behance: e.target.value },
                  },
                })
              }
            />
          </div>
          <div className="admin-field-group">
            <label>Dribbble URL</label>
            <input
              type="text"
              className="admin-input"
              value={settings.connect.socials?.dribbble || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  connect: {
                    ...settings.connect,
                    socials: { ...settings.connect.socials, dribbble: e.target.value },
                  },
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Audio Track */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Music size={20} className="text-accent" />
            <h3 className="admin-card-title">Hero Vinyl Audio Track</h3>
          </div>
        </div>

        <div className="form-row-2">
          <div className="admin-field-group">
            <label>Track Caption</label>
            <input
              type="text"
              className="admin-input"
              value={settings.profile.music.caption}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  profile: {
                    ...settings.profile,
                    music: { ...settings.profile.music, caption: e.target.value },
                  },
                })
              }
            />
          </div>
          <div className="admin-field-group">
            <label>Track Title</label>
            <input
              type="text"
              className="admin-input"
              value={settings.profile.music.trackName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  profile: {
                    ...settings.profile,
                    music: { ...settings.profile.music, trackName: e.target.value },
                  },
                })
              }
            />
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
    </form>
  );
}
