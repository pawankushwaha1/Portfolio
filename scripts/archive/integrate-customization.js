const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 1. Update admin.html
let html = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');

// A. Sidebar nav item
const sidebarTarget = `<button class="nav-item active" data-tab="dashboard">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Dashboard</span>
        </button>`;

const sidebarReplacement = `<button class="nav-item active" data-tab="dashboard">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Dashboard</span>
        </button>
        <button class="nav-item" data-tab="customization">
          <span class="nav-icon">🎨</span>
          <span class="nav-label">Appearance &amp; Styles</span>
        </button>`;

if (html.includes(sidebarTarget) && !html.includes('data-tab="customization"')) {
  html = html.replace(sidebarTarget, sidebarReplacement);
  console.log('✓ Added customization nav item to sidebar');
} else {
  console.log('• Sidebar nav item already present or target not found');
}

// B. Dashboard quick action card
const dashboardTarget = `<div class="action-card">
              <div>
                <h4>BACKUP SITE DATA</h4>
                <p>Export a clean JSON copy of all website content for safekeeping or restore anytime.</p>
              </div>
              <button class="btn-outline-admin" id="btnQuickExport">Download Backup 💾</button>
            </div>`;

const dashboardReplacement = `<div class="action-card">
              <div>
                <h4>APPEARANCE &amp; CUSTOMIZATION</h4>
                <p>Theme presets, master color controller, hero typography, profile picture layer, and optical lens.</p>
              </div>
              <button class="btn-outline-admin" id="btnQuickCustomization">Edit Appearance 🎨</button>
            </div>
            <div class="action-card">
              <div>
                <h4>BACKUP SITE DATA</h4>
                <p>Export a clean JSON copy of all website content for safekeeping or restore anytime.</p>
              </div>
              <button class="btn-outline-admin" id="btnQuickExport">Download Backup 💾</button>
            </div>`;

if (html.includes(dashboardTarget) && !html.includes('id="btnQuickCustomization"')) {
  html = html.replace(dashboardTarget, dashboardReplacement);
  console.log('✓ Added quick action card to Dashboard');
} else {
  console.log('• Dashboard quick action already present or target not found');
}

// C. Insert tab-customization section
const tabCustomizationHtml = fs.readFileSync(path.join(__dirname, 'clean_customization_section.html'), 'utf8');
const heroSectionTarget = `<!-- TAB 2: HERO SECTION -->
        <section class="tab-panel" id="tab-profile">`;

const heroSectionReplacement = `<!-- TAB: APPEARANCE & CUSTOMIZATION -->
        ${tabCustomizationHtml}

        <!-- TAB 2: HERO SECTION -->
        <section class="tab-panel" id="tab-profile">`;

if (html.includes(heroSectionTarget) && !html.includes('id="tab-customization"')) {
  html = html.replace(heroSectionTarget, heroSectionReplacement);
  console.log('✓ Inserted tab-customization section into admin.html');
} else {
  console.log('• tab-customization already present or target not found');
}

fs.writeFileSync(path.join(ROOT, 'admin.html'), html, 'utf8');

// 2. Update admin.css
let css = fs.readFileSync(path.join(ROOT, 'admin.css'), 'utf8');
const customCss = fs.readFileSync(path.join(__dirname, 'pure_customization.css'), 'utf8');

const cssMarker = '/* ==========================================================================\n   APPEARANCE & CUSTOMIZATION TAB STYLES\n   ========================================================================== */';

if (!css.includes(cssMarker)) {
  const cssToAppend = `\n\n${cssMarker}\n:root {\n  --color-maroon: #13294A;\n  --color-maroon-dark: #0D1C33;\n  --color-maroon-light: #1E3F70;\n  --color-cream-border: #E8E5E0;\n}\n\n${customCss}\n`;
  css += cssToAppend;
  fs.writeFileSync(path.join(ROOT, 'admin.css'), css, 'utf8');
  console.log('✓ Appended customization styles to admin.css');
} else {
  console.log('• Customization styles already in admin.css');
}

console.log('HTML and CSS integration complete!');
