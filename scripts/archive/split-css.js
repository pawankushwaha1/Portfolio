const fs = require('fs');
const css = fs.readFileSync('scripts/customization_complete_css.css', 'utf8');

const target = 'DYNAMIC MULTI-IMAGE BUILDER';
const idx = css.indexOf(target);
let cutIdx = css.lastIndexOf('/*', idx);
console.log('Cut index:', cutIdx);

const pureCustCss = css.slice(0, cutIdx).trim();
fs.writeFileSync('scripts/pure_customization.css', pureCustCss, 'utf8');
console.log('Saved pure customization CSS, length:', pureCustCss.length);
