import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { readContentFile, SettingsData } from '@/lib/content';

export const metadata = {
  title: 'Contact — Pawan K. Kushwaha',
  description: 'Inquiries for industrial design, functional prototyping, and collaborative design.',
};

export default function ContactPage() {
  const settings = readContentFile<SettingsData>('settings.json');
  const { connect } = settings;

  return (
    <div className="portfolio-app-root">
      <Navbar />

      <main style={{ paddingTop: '100px', minHeight: '80vh' }}>
        <section className="connect-section">
          <div className="section-container connect-container">
            <div className="connect-info-col" style={{ maxWidth: '650px' }}>
              <span className="section-badge">INQUIRIES</span>
              <h1 className="connect-heading">{connect.heading || "LET'S BUILD TOGETHER."}</h1>
              <p className="connect-lead">
                {connect.subheading ||
                  'Open for industrial design consultancies, tactile hardware prototyping, and physical design engineering.'}
              </p>

              <div style={{ marginTop: '32px' }}>
                <a
                  href={`mailto:${connect.email}`}
                  className="btn btn-primary"
                  style={{ fontSize: '1.05rem', padding: '14px 28px' }}
                >
                  Write to: {connect.email}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer copy={settings.footer?.copy} tagline={settings.footer?.tagline} />
    </div>
  );
}
