const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. Check all img src, data-src, video, audio, link in HTML files
const htmlFiles = ['index.html', 'project.html'];
const projectDirs = fs.readdirSync(path.join(rootDir, 'projects'));
projectDirs.forEach(dir => {
  const p = path.join('projects', dir, 'index.html');
  if (fs.existsSync(path.join(rootDir, p))) htmlFiles.push(p);
});

console.log(`Checking ${htmlFiles.length} HTML files...`);

let missingAssets = [];
let brokenAnchors = [];

htmlFiles.forEach(file => {
  const full = path.join(rootDir, file);
  const content = fs.readFileSync(full, 'utf8');
  const fileDir = path.dirname(full);

  // Check src & data-src
  const srcRegex = /(?:src|data-src|href)=["']([^"']+)["']/g;
  let m;
  while ((m = srcRegex.exec(content)) !== null) {
    const val = m[1].trim();
    if (!val || val.startsWith('http') || val.startsWith('data:') || val.startsWith('mailto:') || val.startsWith('tel:') || val.startsWith('javascript:')) continue;

    if (val.startsWith('#')) {
      // Internal anchor
      const targetId = val.slice(1);
      if (targetId && !content.includes(`id="${targetId}"`) && !content.includes(`id='${targetId}'`)) {
        brokenAnchors.push({ file, anchor: val });
      }
      continue;
    }

    // Relative asset or link
    const clean = val.split('?')[0].split('#')[0];
    if (!clean) continue;

    // Check if points to a project route or file
    let target = path.resolve(fileDir, clean);
    if (!fs.existsSync(target)) {
      // Also try resolving from rootDir if started with /
      let rootTarget = path.resolve(rootDir, clean.replace(/^\//, ''));
      if (!fs.existsSync(rootTarget) && !fs.existsSync(rootTarget + '/index.html')) {
        missingAssets.push({ file, ref: val });
      }
    }
  }
});

console.log(`Missing assets in HTML: ${missingAssets.length}`);
missingAssets.forEach(m => console.log(`  ❌ ${m.file} -> ${m.ref}`));

console.log(`Broken internal anchors in HTML: ${brokenAnchors.length}`);
brokenAnchors.forEach(b => console.log(`  ❌ ${b.file} -> ${b.anchor}`));

// 2. Check data-manager.js project image assets
global.window = global;
global.localStorage = { getItem: () => null, setItem: () => null };
require('../data-manager.js');

const projects = global.PortfolioData.get().projects;
let missingProjectImages = [];

projects.forEach(p => {
  if (p.image && !fs.existsSync(path.join(rootDir, p.image))) {
    missingProjectImages.push({ project: p.slug, field: 'image', path: p.image });
  }
  if (Array.isArray(p.showcaseImages)) {
    p.showcaseImages.forEach((img, idx) => {
      const src = typeof img === 'string' ? img : img.src;
      if (src && !fs.existsSync(path.join(rootDir, src))) {
        missingProjectImages.push({ project: p.slug, field: `showcaseImages[${idx}]`, path: src });
      }
    });
  }
  if (Array.isArray(p.processImages)) {
    p.processImages.forEach((img, idx) => {
      const src = typeof img === 'string' ? img : img.src;
      if (src && !fs.existsSync(path.join(rootDir, src))) {
        missingProjectImages.push({ project: p.slug, field: `processImages[${idx}]`, path: src });
      }
    });
  }
});

console.log(`Missing project images in data-manager.js: ${missingProjectImages.length}`);
missingProjectImages.forEach(m => console.log(`  ❌ Project [${m.project}] ${m.field} -> ${m.path}`));

if (missingAssets.length === 0 && brokenAnchors.length === 0 && missingProjectImages.length === 0) {
  console.log('✅ ALL HTML ASSETS, ANCHORS, AND PROJECT IMAGES ARE 100% VALID AND EXIST ON DISK!');
}
