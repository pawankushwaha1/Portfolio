const fs = require('fs');

const currentHtml = fs.readFileSync('admin.html', 'utf8');
const custHtml = fs.readFileSync('scripts/customization_section_extracted.html', 'utf8');

const currentIds = new Set([...currentHtml.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
const custIds = [...custHtml.matchAll(/id="([^"]+)"/g)].map(m => m[1]);

const collisions = custIds.filter(id => currentIds.has(id));
console.log('ID collisions:', collisions);
