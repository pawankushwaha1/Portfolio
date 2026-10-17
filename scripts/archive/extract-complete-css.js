const fs = require('fs');
const css = fs.readFileSync('scripts/admin_css_3c9285a.css', 'utf8');

const startIdx = css.indexOf('/* Live Typography Preview Box */');
const nextIdx = css.indexOf('/* ==========================================================================\n   PROJECTS', startIdx);
console.log('startIdx:', startIdx, 'nextIdx:', nextIdx);

const extracted = css.slice(startIdx, nextIdx !== -1 ? nextIdx : startIdx + 30000);
console.log('CSS length:', extracted.length);
fs.writeFileSync('scripts/customization_complete_css.css', extracted, 'utf8');
