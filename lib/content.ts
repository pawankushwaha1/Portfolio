import fs from 'fs';
import path from 'path';

const contentDir = path.join(process.cwd(), 'content');

export interface Project {
  id: string;
  slug?: string;
  category: string;
  categoryLabel?: string;
  shortTitle?: string;
  title: string;
  tag?: string;
  image: string;
  shortDesc?: string;
  description: string;
  timeline?: string;
  role?: string;
  tools?: string;
  deliverable?: string;
  featured?: boolean;
  year?: string;
  showcaseImages?: Array<{ src: string; alt: string }>;
  processImages?: Array<{ src: string; alt: string }>;
}

export interface Experience {
  role: string;
  organization: string;
  dates: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
  details?: string;
}

export interface SkillsData {
  physicalTitle?: string;
  physicalList?: string[];
  physicalPills?: string[];
  digitalTitle?: string;
  digitalList?: string[];
  digitalPills?: string[];
  tools?: string[];
}

export interface AboutData {
  hero: {
    badge: string;
    title: string;
    lead: string;
    bio: string;
    floatingPill: string;
    characterImg: string;
  };
  stats: Array<{ number: string; label: string }>;
  philosophy: Array<{ num: string; title: string; desc: string }>;
  skills: SkillsData;
  milestones?: Array<{ year: string; title: string; desc: string; tag: string }>;
}

export interface SettingsData {
  profile: {
    name: string;
    titleLine1: string;
    titleLine2: string;
    role: string;
    tagline: string;
    location: string;
    statusText: string;
    statusType: 'gold' | 'green' | 'red';
    avatar: string;
    ctaWorkText: string;
    ctaStoryText: string;
    ctaStoryUrl: string;
    music: {
      caption: string;
      trackName: string;
      audioSrc: string;
    };
  };
  categories: Array<{ id: string; name: string }>;
  connect: {
    badge: string;
    heading: string;
    subheading: string;
    statusPill: string;
    email: string;
    location: string;
    socials: {
      github?: string;
      linkedin?: string;
      behance?: string;
      dribbble?: string;
    };
  };
  footer: {
    copy: string;
    tagline: string;
  };
  customization?: {
    colors?: {
      primary?: string;
      headerBg?: string;
      boldText?: string;
      buttons?: string;
      maroon?: string;
      maroonDark?: string;
    };
  };
}

export function readContentFile<T>(filename: string): T {
  const filePath = path.join(contentDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Content file not found: ${filename}`);
  }
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent) as T;
}

export function writeContentFile<T>(filename: string, data: T): void {
  const filePath = path.join(contentDir, filename);
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
