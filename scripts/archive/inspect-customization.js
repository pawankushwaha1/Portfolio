const fs = require('fs');

const html = fs.readFileSync('scripts/customization_section_extracted.html', 'utf8');
const cardMatches = [...html.matchAll(/<!--\s*(CARD[^>]*?)-->/gi)].map(m => m[1]);
console.log('Cards found:', cardMatches);

const cardTitles = [...html.matchAll(/class="card-box-title">([^<]+)<\/h3>/gi)].map(m => m[1]);
console.log('Card titles:', cardTitles);

const inputIds = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
console.log('Total element IDs:', inputIds.length);
console.log('Some IDs:', inputIds.slice(0, 30));
