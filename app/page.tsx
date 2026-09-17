import React from 'react';
import { readContentFile, Project, SettingsData } from '@/lib/content';
import HomeClient from '@/components/HomeClient';

export default function HomePage() {
  const settings = readContentFile<SettingsData>('settings.json');
  const projects = readContentFile<Project[]>('projects.json');
  const prototypes = readContentFile<any[]>('prototypes.json');
  const gallery = readContentFile<any[]>('gallery.json');

  return (
    <HomeClient
      settings={settings}
      projects={projects}
      prototypes={prototypes}
      gallery={gallery}
    />
  );
}
