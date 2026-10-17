const fs = require('fs');
const css = fs.readFileSync('scripts/admin_css_3c9285a.css', 'utf8');

const startIdx = css.indexOf('/* ==========================================================================\n   APPEARANCE & CUSTOMIZATION');
const altStartIdx = css.indexOf('custom-hero-preview');
console.log('CSS startIdx:', startIdx, 'altStartIdx:', altStartIdx);

let fromIdx = startIdx !== -1 ? startIdx : (altStartIdx !== -1 ? altStartIdx - 50 : 0);
let toIdx = css.indexOf('/* ==========================================================================\n   PROJECTS / SELECTED WORK', fromIdx);
console.log('toIdx:', toIdx);

if (toIdx === -1) {
  toIdx = css.indexOf('.sw-project-card', fromIdx);
}
console.log('Final range:', fromIdx, toIdx);
const customCss = css.slice(fromIdx, toIdx !== -1 ? toIdx : fromIdx + 15000);
fs.writeFileSync('scripts/customization_css_extracted.css', customCss, 'utf8');
console.log('Extracted CSS length:', customCss.length);
