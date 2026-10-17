const fs = require('fs');
const path = require('path');

// Mock browser environment for unit test of data and markup
global.window = global;
global.document = {
  documentElement: { classList: { add: () => {}, remove: () => {} }, style: { setProperty: () => {} } },
  getElementById: () => null,
  querySelectorAll: () => []
};
global.localStorage = {
  getItem: () => null,
  setItem: () => null
};

require('../data-manager.js');

const projects = global.PortfolioData.get().projects;

console.log('=== 1. VERIFYING PROJECT DATA STRUCTURE ===');
const requiredRequiredRoutes = [
  '/projects/kinetic-chair',
  '/projects/luma',
  '/projects/analog',
  '/projects/gantt-lamp',
  '/projects/modu-bottle',
  '/projects/chassis-m1',
  '/projects/apex-gears',
  '/projects/wellness-journey'
];

let allValid = true;

projects.forEach((p, idx) => {
  const missing = [];
  if (!p.id) missing.push('id');
  if (!p.slug) missing.push('slug');
  if (!p.title) missing.push('title');
  if (!p.category) missing.push('category');
  if (!p.description && !p.shortDesc) missing.push('description');
  if (!p.image) missing.push('image');
  if (!p.route) missing.push('route');
  if (!p.content) missing.push('content');

  if (missing.length > 0) {
    console.error(`❌ Project [${p.id || idx}] missing fields: ${missing.join(', ')}`);
    allValid = false;
  } else {
    console.log(`✓ Project [${p.slug}] -> Route: ${p.route} | Title: "${p.title}" | Category: ${p.category} | Content: OK`);
  }
});

console.log('\n=== 2. VERIFYING REQUIRED 8 ROUTES ===');
requiredRequiredRoutes.forEach(reqRoute => {
  const found = projects.find(p => p.route === reqRoute);
  if (found) {
    console.log(`✓ Found required route ${reqRoute} -> Project: ${found.title}`);
  } else {
    console.error(`❌ Missing required route ${reqRoute}`);
    allValid = false;
  }
});

console.log('\n=== 3. VERIFYING PHYSICAL PROJECT DIRECTORIES ===');
projects.forEach(p => {
  const slug = p.slug || p.id;
  const filePath = path.join(__dirname, '..', 'projects', slug, 'index.html');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasCorrectId = content.includes(`data-project-id="${slug}"`);
    const hasStyles = content.includes('href="../../styles.css');
    const hasScripts = content.includes('src="../../project.js"');
    if (hasCorrectId && hasStyles && hasScripts) {
      console.log(`✓ Route directory verified: /projects/${slug} (has correct data-project-id & assets)`);
    } else {
      console.error(`❌ Route directory /projects/${slug} exists but has invalid attributes`);
      allValid = false;
    }
  } else {
    console.error(`❌ Route directory missing: projects/${slug}/index.html`);
    allValid = false;
  }
});

console.log('\n=== 4. SUMMARY ===');
if (allValid) {
  console.log('✅ ALL VERIFICATIONS PASSED SUCCESSFULLY!');
} else {
  console.error('❌ SOME CHECKS FAILED');
  process.exit(1);
}
