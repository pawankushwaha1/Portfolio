'use client';

import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Hero from './Hero';
import ProjectCard from './ProjectCard';
import { Project, SettingsData } from '@/lib/content';

interface HomeClientProps {
  settings: SettingsData;
  projects: Project[];
  prototypes: any[];
  gallery: any[];
}

export default function HomeClient({
  settings,
  projects,
  prototypes,
  gallery,
}: HomeClientProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  const filteredProjects =
    activeCategory === 'all'
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  const { connect } = settings;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySent(true);
    setTimeout(() => {
      setInquirySent(false);
      setContactModalOpen(false);
    }, 2500);
  };

  return (
    <div className="portfolio-app-root">
      <Navbar />

      <main id="mainContent">
        {/* HERO SECTION */}
        <Hero settings={settings} />

        {/* WORK SECTION */}
        <section className="work-section" id="work">
          <div className="section-container">
            <div className="section-header">
              <span className="section-badge">SELECTED WORKS</span>
              <h2 className="section-title">FUNCTION MEETS TACTILE FORM.</h2>
              <p className="section-subtitle">
                A curated selection of industrial design, tangible prototypes, and digital interactions.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="category-filter-bar">
              <button
                className={`filter-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                All Projects
              </button>
              {settings.categories?.map((cat) => (
                <button
                  key={cat.id}
                  className={`filter-tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Projects Grid */}
            <div className="work-grid" id="workGrid">
              {filteredProjects.map((proj) => (
                <ProjectCard key={proj.id} project={proj} />
              ))}
            </div>
          </div>
        </section>

        {/* PROTOTYPING SECTION */}
        {prototypes && prototypes.length > 0 && (
          <section className="prototyping-section" id="prototyping">
            <div className="section-container">
              <div className="section-header">
                <span className="section-badge">HANDS-ON EXPLORATION</span>
                <h2 className="section-title">THE PROTOTYPING LAB.</h2>
                <p className="section-subtitle">
                  Physical prototypes reveal truths CAD cannot. From 3D prints to CNC rigs and high-fidelity foam models.
                </p>
              </div>

              <div className="proto-cards-grid">
                {prototypes.slice(0, 6).map((proto: any, idx: number) => (
                  <div key={idx} className="proto-card">
                    <div className="proto-card-img-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proto.image || '/images/projects/proto_cad.jpg'}
                        alt={proto.title}
                        className="proto-card-img"
                        loading="lazy"
                      />
                      <span className="proto-card-tag">{proto.tag || 'Lab Study'}</span>
                    </div>
                    <div className="proto-card-info">
                      <h4 className="proto-card-title">{proto.title}</h4>
                      <p className="proto-card-desc">{proto.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* GALLERY SECTION */}
        {gallery && gallery.length > 0 && (
          <section className="gallery-section" id="gallery">
            <div className="section-container">
              <div className="section-header">
                <span className="section-badge">VISUAL DIARY</span>
                <h2 className="section-title">TEXTURES & TANGIBLES.</h2>
                <p className="section-subtitle">
                  Analog photographs, screenprints, material samples, and workshop experiments.
                </p>
              </div>

              <div className="polaroids-grid">
                {gallery.slice(0, 8).map((item: any, idx: number) => (
                  <div key={idx} className="polaroid-card">
                    <div className="polaroid-photo-frame">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.src}
                        alt={item.title || 'Polaroid snapshot'}
                        className="polaroid-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="polaroid-caption">
                      <span className="polaroid-title">{item.title}</span>
                      <span className="polaroid-tag">{item.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CONNECT SECTION */}
        <section className="connect-section" id="connect">
          <div className="connect-thin-line" />
          <div className="section-container connect-container">
            <div className="connect-info-col">
              <span className="section-badge">{connect.badge || 'GET IN TOUCH'}</span>
              <h2 className="connect-heading">{connect.heading || "LET'S BUILD TOGETHER."}</h2>
              <p className="connect-lead">
                {connect.subheading ||
                  'Open for industrial design consultancies, tactile hardware prototyping, and design engineering.'}
              </p>

              <div className="connect-cta-row">
                <button
                  className="btn btn-primary"
                  onClick={() => setContactModalOpen(true)}
                >
                  Send a Message
                </button>
                <a href={`mailto:${connect.email}`} className="btn btn-outline">
                  {connect.email}
                </a>
              </div>

              {/* Social Links */}
              <div className="connect-socials-row">
                {connect.socials?.github && (
                  <a
                    href={connect.socials.github}
                    target="_blank"
                    rel="noreferrer"
                    className="social-circle-btn"
                    aria-label="GitHub"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                )}
                {connect.socials?.linkedin && (
                  <a
                    href={connect.socials.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="social-circle-btn"
                    aria-label="LinkedIn"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                )}
                {connect.socials?.behance && (
                  <a
                    href={connect.socials.behance}
                    target="_blank"
                    rel="noreferrer"
                    className="social-circle-btn"
                    aria-label="Behance"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M16.969 16.927a2.561 2.561 0 0 0 1.901.677 2.501 2.501 0 0 0 1.531-.475c.362-.235.636-.584.779-.99h2.585a5.091 5.091 0 0 1-1.9 2.896 5.292 5.292 0 0 1-3.091.88 5.839 5.839 0 0 1-2.284-.433 4.871 4.871 0 0 1-1.723-1.211 5.657 5.657 0 0 1-1.08-1.874 7.057 7.057 0 0 1-.383-2.393c-.005-.8.129-1.595.396-2.349a5.313 5.313 0 0 1 5.088-3.604 4.87 4.87 0 0 1 2.376.563c.661.362 1.231.87 1.668 1.485a6.2 6.2 0 0 1 .943 2.133c.194.821.263 1.666.205 2.508h-7.699c-.063.79.184 1.574.688 2.187ZM6.947 4.084a8.065 8.065 0 0 1 1.928.198 4.29 4.29 0 0 1 1.49.638c.418.303.748.711.958 1.182.241.579.357 1.203.341 1.83a3.506 3.506 0 0 1-.506 1.961 3.726 3.726 0 0 1-1.503 1.287 3.588 3.588 0 0 1 2.027 1.437c.464.747.697 1.615.67 2.494a4.593 4.593 0 0 1-.423 2.032 3.945 3.945 0 0 1-1.163 1.413 5.114 5.114 0 0 1-1.683.807 7.135 7.135 0 0 1-1.928.259H0V4.084h6.947Z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Visual Character on Thin Line */}
            <div className="connect-visual-col">
              <div className="avatar-container connect-avatar-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/connect_character.png"
                  alt="Pawan illustration"
                  className="connect-character-img"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer copy={settings.footer?.copy} tagline={settings.footer?.tagline} />

      {/* Interactive Contact Modal */}
      {contactModalOpen && (
        <div className="modal-overlay" onClick={() => setContactModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setContactModalOpen(false)}
            >
              &times;
            </button>
            {inquirySent ? (
              <div className="modal-success-state">
                <h3>Message Prepared!</h3>
                <p>Thank you. Your message will be sent to {connect.email}.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="contact-form-inner">
                <h3>Let's Collaborate</h3>
                <p>Have a physical product, CAD design, or DFM inquiry? Send a note below.</p>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  className="contact-modal-input"
                />
                <input
                  type="email"
                  required
                  placeholder="Your Email"
                  className="contact-modal-input"
                />
                <textarea
                  required
                  rows={4}
                  placeholder="Tell me about your project or prototype..."
                  className="contact-modal-input"
                />
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
