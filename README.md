# Pawan K. Kushwaha — Portfolio & Local CMS

A modern, high-performance portfolio website built with **Next.js 14 (App Router)**, **TypeScript**, and a **Local Admin Panel** with automated **GitHub + Vercel deployment**.

---

## 🚀 Architecture Overview

```
Local Admin Panel (/admin)
        ↓
Save Draft → Local content files (content/*.json)
        ↓
Preview Locally (http://localhost:3000)
        ↓
Publish to Live → Content Schema Validation
        ↓
Server-Side Git Pipeline (git add → git commit → git push)
        ↓
GitHub Repository (origin/main)
        ↓
Vercel Webhook / Auto-Detection
        ↓
Production Build & Deployment
        ↓
LIVE WEBSITE
```

---

## 🛠️ Getting Started

### 1. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the live preview.

### 2. Access the Admin Panel
Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) to manage your portfolio:
- **Dashboard (`/admin`)**: Overview of content counts, Git sync status, and recent changes.
- **Projects (`/admin/projects`)**: Add, edit, delete, reorder, and toggle featured projects; upload high-res showcase photos and CAD blueprints.
- **Experience (`/admin/experience`)**: Manage milestones, design engagements, and degrees.
- **Skills (`/admin/skills`)**: Manage Physical (CAD, DFM, CNC, 3D printing) and Digital capabilities.
- **Settings & Bio (`/admin/settings`)**: Edit display headlines, availability status, direct email, social media links, and ambient music track.

---

## 📝 Save Draft vs. Publish to Live

- **Save Draft**: Saves your edits directly to the local JSON files in `content/` with zero latency. Changes appear immediately on `http://localhost:3000` for private previewing without touching Git or GitHub.
- **Publish to Live**: Validates all content schemas, stages changed files, creates a timestamped Git commit, and pushes to `origin/main`. Vercel automatically detects the push and deploys the update to your live production domain within 60 seconds.

---

## 📂 Project Structure

```
Portfolio/
├── app/
│   ├── layout.tsx              # Root layout with fonts & metadata
│   ├── page.tsx                # Homepage (Hero, Work, Prototyping, Gallery, Connect)
│   ├── about/page.tsx          # Design philosophy, stats & fabrication journey
│   ├── contact/page.tsx        # Direct contact endpoints
│   ├── projects/
│   │   ├── page.tsx            # Complete project archive
│   │   └── [slug]/page.tsx     # Deep-dive CAD case studies
│   ├── admin/
│   │   ├── layout.tsx          # Admin layout with sidebar & Git status banner
│   │   ├── page.tsx            # Admin dashboard
│   │   ├── projects/page.tsx   # Project manager & editor
│   │   ├── experience/page.tsx # Experience & education editor
│   │   ├── skills/page.tsx     # Skills & tools editor
│   │   └── settings/page.tsx   # Bio, contact & audio settings
│   └── api/admin/
│       ├── content/route.ts    # Read & Save Draft endpoints
│       ├── publish/route.ts    # Server-side Git publishing pipeline
│       └── upload/route.ts     # Image upload endpoint
│
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── ProjectCard.tsx
│   ├── AudioPlayer.tsx
│   └── admin/
│       ├── AdminSidebar.tsx
│       ├── PublishModal.tsx
│       ├── ProjectEditor.tsx
│       └── ImageUploader.tsx
│
├── content/
│   ├── projects.json           # All project case studies
│   ├── experience.json         # Career history & prototyping milestones
│   ├── education.json          # Academic background
│   ├── skills.json             # Tooling & craft data
│   ├── about.json              # Bio & philosophy pillars
│   ├── settings.json           # Profile & contact information
│   ├── prototypes.json         # Prototyping lab studies
│   └── gallery.json            # Visual diary polaroids
│
├── public/
│   ├── images/                 # Uploaded project & profile assets
│   ├── audio/                  # Ambient Lo-Fi audio files
│   └── assets/                 # Brand textures & vectors
│
├── lib/
│   ├── content.ts              # Typed helpers for file I/O
│   ├── git.ts                  # Server-side Git automation
│   └── validation.ts           # JSON schema validation
│
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## 🌐 Connecting to Vercel

1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** ➔ **Project**.
3. Import **`pawankushwaha1/Portfolio`**.
4. Keep the default Framework Preset as **Next.js**.
5. Click **Deploy**.

Every time you click **Publish to Live** in your local admin panel, Vercel will build and deploy your updated portfolio automatically!
