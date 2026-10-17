const fs = require('fs');
const js = fs.readFileSync('scripts/admin_js_3c9285a.js', 'utf8');

const matches = [...js.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)].map(m => m[1]);
console.log('Functions found:', matches.filter(f => f.toLowerCase().includes('cust') || f.toLowerCase().includes('color') || f.toLowerCase().includes('theme') || f.toLowerCase().includes('lens') || f.toLowerCase().includes('palette')));

const lines = js.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('initCustomization') || line.includes('loadCustomization') || line.includes('saveCustomization') || line.includes('applyTheme') || line.includes('THEME_PRESETS')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
