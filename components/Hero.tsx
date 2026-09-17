'use client';

import React from 'react';
import Link from 'next/link';
import AudioPlayer from './AudioPlayer';
import { SettingsData } from '@/lib/content';

interface HeroProps {
  settings: SettingsData;
}

export default function Hero({ settings }: HeroProps) {
  const { profile } = settings;

  return (
    <section className="hero-section" id="hero">
      {/* Animated Clouds Background */}
      <div className="hero-clouds-container" id="heroCloudsContainer" aria-hidden="true">
        <div className="hero-clouds-layer" id="heroCloudsLayer" />
      </div>

      <div className="hero-container">
        {/* Left Hero Content */}
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-line">{profile.titleLine1 || 'PAWAN K.'}</span>
            <span className="title-line">{profile.titleLine2 || 'KUSHWAHA'}</span>
          </h1>

          <div className="hero-subtitle-group">
            <p className="hero-role">{profile.role || 'PRODUCT DESIGNER'}</p>
            <p className="hero-tagline">{profile.tagline || 'Design. Make. Explore.'}</p>
          </div>

          {/* Status Capsule */}
          <div className="status-capsule" id="statusCapsule">
            <span className={`status-dot ${profile.statusType || 'gold'}`} />
            <span className="status-text">{profile.statusText || 'Available for opportunities'}</span>
          </div>

          {/* CTA Button Group */}
          <div className="hero-cta-group">
            <a href="#work" className="btn btn-primary" id="ctaWorkBtn">
              {profile.ctaWorkText || 'View My Work'}
            </a>
            <Link href="/about" className="btn btn-secondary" id="ctaStoryBtn">
              {profile.ctaStoryText || 'About Me'}
            </Link>
          </div>

          {/* Lo-Fi Music Capsule */}
          <AudioPlayer
            caption={profile.music?.caption}
            trackName={profile.music?.trackName}
            audioSrc={profile.music?.audioSrc}
          />
        </div>

        {/* Right Hero Graphic */}
        <div className="hero-visual">
          <div className="avatar-container" id="avatarContainer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatar || '/assets/images/hero_character.png'}
              alt={`${profile.name} illustration portrait`}
              className="hero-character-img"
              id="heroCharacterImg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
