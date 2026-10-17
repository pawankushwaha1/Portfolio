const fs = require('fs');
const js = fs.readFileSync('scripts/admin_js_3c9285a.js', 'utf8');

const startIdx = js.indexOf('const THEME_PRESETS = {');
const endIdx = js.indexOf('function initProjectsManager()', startIdx);
const customJs = js.slice(startIdx, endIdx);

console.log('Custom JS length:', customJs.length);
fs.writeFileSync('scripts/customization_js_extracted.js', customJs, 'utf8');
console.log('Saved to scripts/customization_js_extracted.js');
