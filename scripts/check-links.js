const fs = require('fs');
const path = require('path');

function getAllHtmlFiles(dir) {
  let results = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'scratch') {
      results = results.concat(getAllHtmlFiles(full));
    } else if (item.isFile() && item.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const htmlFiles = getAllHtmlFiles('.');
console.log('Total HTML files found:', htmlFiles.length);

let totalIssues = 0;
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const hrefMatches = content.matchAll(/href=["']([^"'#]+)(#[^"']*)?["']/g);
  for (const m of hrefMatches) {
    let href = m[1];
    if (href.startsWith('http:') || href.startsWith('https:') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    // Strip query params
    const cleanHref = href.split('?')[0];
    // Check if relative path or root path
    let targetPath;
    if (cleanHref.startsWith('/')) {
      targetPath = path.resolve('.', '.' + cleanHref);
    } else {
      targetPath = path.resolve(path.dirname(file), cleanHref);
    }
    // If target is a directory or route ending with /, check for index.html
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      targetPath = path.join(targetPath, 'index.html');
    }
    if (!fs.existsSync(targetPath)) {
      console.log('❌ Broken link in', path.relative('.', file), '->', href);
      totalIssues++;
    }
  }
}
console.log('Link check complete! Total broken relative links:', totalIssues);
