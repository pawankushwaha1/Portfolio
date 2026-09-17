import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { readContentFile, AboutData, SettingsData, SkillsData } from '@/lib/content';

export const metadata = {
  title: 'About — Pawan K. Kushwaha | Product Designer & Prototyper',
  description: 'Design philosophy, hands-on fabrication background, and skills of Pawan K. Kushwaha.',
};

export default function AboutPage() {
  const about = readContentFile<AboutData>('about.json');
  const settings = readContentFile<SettingsData>('settings.json');
  const skills = readContentFile<SkillsData>('skills.json');
  const milestones = readContentFile<any[]>('experience.json');

  return (
    <div className="portfolio-app-root">
      <Navbar />

      <main className="about-page-main">
        {/* About Hero */}
        <section className="about-hero-section">
          <div className="section-container about-hero-container">
            <div className="about-hero-content">
              <span className="section-badge">{about.hero.badge || 'PRODUCT DESIGN • PROTOTYPING'}</span>
              <h1 className="about-hero-title">{about.hero.title}</h1>
              <p className="about-hero-lead">{about.hero.lead}</p>
              <p className="about-hero-bio">{about.hero.bio}</p>

              <div className="about-hero-actions">
                <a href="#philosophy" className="btn btn-primary">
                  Design Philosophy
                </a>
                <Link href="/#connect" className="btn btn-secondary">
                  Get In Touch
                </Link>
              </div>
            </div>

            <div className="about-hero-visual">
              <div className="avatar-container about-avatar-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={about.hero.characterImg || '/assets/images/connect_character.png'}
                  alt="Pawan Kushwaha"
                  className="about-character-img"
                />
                <span className="floating-pill-badge">{about.hero.floatingPill || 'Design. Make. Explore.'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        {about.stats && about.stats.length > 0 && (
          <section className="stats-section">
            <div className="section-container stats-container">
              {about.stats.map((st, i) => (
                <div key={i} className="about-stat-box">
                  <span className="stat-number">{st.number}</span>
                  <span className="stat-label-text">{st.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Philosophy Section */}
        <section className="philosophy-section" id="philosophy">
          <div className="section-container">
            <div className="section-header">
              <span className="section-badge">CORE PRINCIPLES</span>
              <h2 className="section-title">HOW I APPROACH DESIGN.</h2>
            </div>

            <div className="philosophy-grid">
              {about.philosophy?.map((ph, idx) => (
                <div key={idx} className="philosophy-card">
                  <span className="ph-number">{ph.num}</span>
                  <h3 className="ph-title">{ph.title}</h3>
                  <p className="ph-desc">{ph.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Skills & Fabrication Stack */}
        <section className="skills-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-badge">CAPABILITIES</span>
              <h2 className="section-title">TOOLING & CRAFT.</h2>
            </div>

            <div className="about-skills-grid">
              {/* Physical */}
              <div className="about-skill-col">
                <h3 className="skill-col-title">{skills.physicalTitle || 'Physical & Industrial Design'}</h3>
                <ul className="skill-bullets-list">
                  {skills.physicalList?.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
                <div className="skill-pills-row">
                  {skills.physicalPills?.map((pill, i) => (
                    <span key={i} className="skill-pill-tag">
                      {pill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Digital */}
              <div className="about-skill-col">
                <h3 className="skill-col-title">{skills.digitalTitle || 'Digital, UX & Visual Crafts'}</h3>
                <ul className="skill-bullets-list">
                  {skills.digitalList?.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
                <div className="skill-pills-row">
                  {skills.digitalPills?.map((pill, i) => (
                    <span key={i} className="skill-pill-tag">
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Milestones / Career Timeline */}
        {milestones && milestones.length > 0 && (
          <section className="milestones-section">
            <div className="section-container">
              <div className="section-header">
                <span className="section-badge">JOURNEY</span>
                <h2 className="section-title">EXPERIENCE & MILESTONES.</h2>
              </div>

              <div className="milestones-timeline">
                {milestones.map((m: any, idx: number) => (
                  <div key={idx} className="timeline-item">
                    <span className="timeline-year">{m.year}</span>
                    <div className="timeline-content">
                      <div className="timeline-top">
                        <h4 className="timeline-title">{m.title}</h4>
                        {m.tag && <span className="timeline-tag">{m.tag}</span>}
                      </div>
                      <p className="timeline-desc">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer copy={settings.footer?.copy} tagline={settings.footer?.tagline} />
    </div>
  );
}

