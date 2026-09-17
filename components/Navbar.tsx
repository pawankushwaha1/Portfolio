'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`} id="siteHeader">
      <div className="nav-container">
        <Link href="/" className="logo-script" aria-label="Pawan Kushwaha Home">
          Pawan.
        </Link>

        <nav className="desktop-nav" aria-label="Main Navigation">
          <Link href="/#work" className="nav-link">
            Work
          </Link>
          <Link href="/#prototyping" className="nav-link">
            Prototyping
          </Link>
          <Link href="/#gallery" className="nav-link">
            Gallery
          </Link>
          <Link href="/about" className="nav-link">
            About
          </Link>
          <Link href="/#connect" className="nav-link">
            Connect
          </Link>
        </nav>

        <button
          className="mobile-toggle"
          id="mobileMenuToggle"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg
            className="hamburger-svg"
            viewBox="0 0 24 24"
            width="26"
            height="26"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" className="nav-bar nav-bar-1" />
            <line x1="3" y1="12" x2="21" y2="12" className="nav-bar nav-bar-2" />
            <line x1="3" y1="18" x2="21" y2="18" className="nav-bar nav-bar-3" />
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`} id="mobileDrawer">
        <nav className="mobile-nav-links">
          <Link href="/#work" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
            Work
          </Link>
          <Link
            href="/#prototyping"
            className="mobile-nav-link"
            onClick={() => setMobileOpen(false)}
          >
            Prototyping
          </Link>
          <Link
            href="/#gallery"
            className="mobile-nav-link"
            onClick={() => setMobileOpen(false)}
          >
            Gallery
          </Link>
          <Link href="/about" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
            About
          </Link>
          <Link
            href="/#connect"
            className="mobile-nav-link"
            onClick={() => setMobileOpen(false)}
          >
            Connect
          </Link>
        </nav>
      </div>
    </header>
  );
}
