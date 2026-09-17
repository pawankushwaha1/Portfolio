'use client';

import React from 'react';
import Link from 'next/link';

interface FooterProps {
  copy?: string;
  tagline?: string;
}

export default function Footer({
  copy = '© 2026 Pawan Kumar Kushwaha',
  tagline = 'Design with curiosity.',
}: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span className="footer-copy">{copy}</span>
        <span className="footer-tagline">{tagline}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
          <Link href="/admin" style={{ color: 'inherit', opacity: 0.5, textDecoration: 'none' }}>
            Admin Panel
          </Link>
        </div>
      </div>
    </footer>
  );
}
