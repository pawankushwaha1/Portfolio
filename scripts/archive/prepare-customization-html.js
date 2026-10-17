const fs = require('fs');

let html = fs.readFileSync('scripts/customization_section_extracted.html', 'utf8').trim();

// Ensure it ends with </section>
const endTag = '</section>';
const lastEnd = html.lastIndexOf(endTag);
if (lastEnd !== -1) {
  html = html.slice(0, lastEnd + endTag.length);
}

console.log('Cleaned customization HTML length:', html.length);
fs.writeFileSync('scripts/clean_customization_section.html', html, 'utf8');
