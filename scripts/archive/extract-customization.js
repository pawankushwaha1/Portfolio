const { execSync } = require('child_process');
const fs = require('fs');

const html = execSync('git show 3c9285a:admin.html', { encoding: 'utf8', maxBuffer: 15 * 1024 * 1024 });
const startTag = '<section class="tab-panel" id="tab-customization">';
const nextSectionTag = '<section class="tab-panel" id="tab-projects">';

const startIdx = html.indexOf(startTag);
const endIdx = html.indexOf(nextSectionTag, startIdx);

const sectionHtml = html.slice(startIdx, endIdx);
console.log('HTML Section extracted, length:', sectionHtml.length);
fs.writeFileSync('scripts/customization_section_extracted.html', sectionHtml, 'utf8');

const js = execSync('git show 3c9285a:admin.js', { encoding: 'utf8', maxBuffer: 15 * 1024 * 1024 });
fs.writeFileSync('scripts/admin_js_3c9285a.js', js, 'utf8');

const css = execSync('git show 3c9285a:admin.css', { encoding: 'utf8', maxBuffer: 15 * 1024 * 1024 });
fs.writeFileSync('scripts/admin_css_3c9285a.css', css, 'utf8');

console.log('Extracted files saved to scripts/');
