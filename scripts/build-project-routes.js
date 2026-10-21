const fs = require('fs');
const path = require('path');

global.window = global;
global.localStorage = { getItem: () => null, setItem: () => null };
require('../data-manager.js');

const projects = global.PortfolioData.get().projects;
const templatePath = path.join(__dirname, '..', 'project.html');
const template = fs.readFileSync(templatePath, 'utf8');

// 1. Subfolder template (2 levels deep, for /projects/<slug>/)
const subfolderHtml = template
  .replace(/href="styles\.css(?:\?[^"]*)?"/g, 'href="../../styles.css?v=2026.10.01.optimized"')
  .replace(/href="favicon\.ico"/g, 'href="../../favicon.ico"')
  .replace(/href="index\.html/g, 'href="../../index.html')
  .replace(/href="assets\//g, 'href="../../assets/')
  .replace(/src="assets\//g, 'src="../../assets/')
  .replace(/src="lenis\.min\.js"/g, 'src="../../lenis.min.js"')
  .replace(/src="data-manager\.js(?:\?[^"]*)?"/g, 'src="../../data-manager.js?v=2026.10.21.sync_v12"')
  .replace(/src="components\.js(?:\?[^"]*)?"/g, 'src="../../components.js?v=2026.10.21.sync_v12"')
  .replace(/src="project\.js(?:\?[^"]*)?"/g, 'src="../../project.js?v=2026.10.21.sync_v12"')
  .replace('href="project-research.html"', 'href="research/index.html"');

// 2. Research subfolder template (3 levels deep, for /projects/<slug>/research/)
const researchSubfolderHtml = template
  .replace(/href="styles\.css(?:\?[^"]*)?"/g, 'href="../../../styles.css?v=2026.10.01.optimized"')
  .replace(/href="favicon\.ico"/g, 'href="../../../favicon.ico"')
  .replace(/href="index\.html/g, 'href="../../../index.html')
  .replace(/href="assets\//g, 'href="../../../assets/')
  .replace(/src="assets\//g, 'src="../../../assets/')
  .replace(/src="lenis\.min\.js"/g, 'src="../../../lenis.min.js"')
  .replace(/src="data-manager\.js(?:\?[^"]*)?"/g, 'src="../../../data-manager.js?v=2026.10.21.sync_v12"')
  .replace(/src="components\.js(?:\?[^"]*)?"/g, 'src="../../../components.js?v=2026.10.21.sync_v12"')
  .replace(/src="project\.js(?:\?[^"]*)?"/g, 'src="../../../project.js?v=2026.10.21.sync_v12"')
  .replace('href="project-research.html"', 'href="../index.html"')
  .replace('href="research/index.html"', 'href="../index.html"')
  .replace(/<span class="cta-text-full">View research<\/span>\s*<span class="cta-text-short">Research<\/span>\s*<span class="pill-arrow">&rarr;<\/span>|<span>View research<\/span>\s*<span class="pill-arrow">&rarr;<\/span>/, '<span class="pill-arrow">&larr;</span>\n        <span class="cta-text-full">Project Overview</span>\n        <span class="cta-text-short">Overview</span>');

// 3. Root research fallback template
const rootResearchHtml = template
  .replace('<body class="project-page-body">', '<body class="project-page-body" data-page-view="research">')
  .replace('<title>Project Details | Pawan K. Kushwaha</title>', '<title>Project Research | Pawan K. Kushwaha</title>')
  .replace('href="project-research.html"', 'href="project.html"')
  .replace('href="research/index.html"', 'href="project.html"')
  .replace('aria-label="View research"', 'aria-label="Project Overview"')
  .replace(/<span class="cta-text-full">View research<\/span>\s*<span class="cta-text-short">Research<\/span>\s*<span class="pill-arrow">&rarr;<\/span>|<span>View research<\/span>\s*<span class="pill-arrow">&rarr;<\/span>/, '<span class="pill-arrow">&larr;</span>\n        <span class="cta-text-full">Project Overview</span>\n        <span class="cta-text-short">Overview</span>');
fs.writeFileSync(path.join(__dirname, '..', 'project-research.html'), rootResearchHtml, 'utf8');

const baseDir = path.join(__dirname, '..', 'projects');
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

projects.forEach(p => {
  const slug = p.slug || p.id;
  const targetDir = path.join(baseDir, slug);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. Main Project Page: /projects/<slug>/index.html
  const pageHtml = subfolderHtml
    .replace('<body class="project-page-body">', `<body class="project-page-body" data-project-id="${slug}">`)
    .replace('<title>Project Details | Pawan K. Kushwaha</title>', `<title>${p.title} | Pawan K. Kushwaha</title>`)
    .replace(/href="\.\.\/\.\.\/index\.html#work"/g, `href="../../index.html?project=${slug}"`);
  fs.writeFileSync(path.join(targetDir, 'index.html'), pageHtml, 'utf8');

  // 2. Project Research Directory: /projects/<slug>/research/index.html
  const researchDir = path.join(targetDir, 'research');
  if (!fs.existsSync(researchDir)) {
    fs.mkdirSync(researchDir, { recursive: true });
  }
  const researchHtml = researchSubfolderHtml
    .replace('<body class="project-page-body">', `<body class="project-page-body" data-project-id="${slug}" data-page-view="research">`)
    .replace('<title>Project Details | Pawan K. Kushwaha</title>', `<title>${p.title} — Research | Pawan K. Kushwaha</title>`)
    .replace(/href="\.\.\/\.\.\/\.\.\/index\.html#work"/g, `href="../../../index.html?project=${slug}"`);
  fs.writeFileSync(path.join(researchDir, 'index.html'), researchHtml, 'utf8');

  // 3. Project Research File: /projects/<slug>/research.html (direct file fallback)
  const researchFileHtml = subfolderHtml
    .replace('<body class="project-page-body">', `<body class="project-page-body" data-project-id="${slug}" data-page-view="research">`)
    .replace('<title>Project Details | Pawan K. Kushwaha</title>', `<title>${p.title} — Research | Pawan K. Kushwaha</title>`)
    .replace('href="research/index.html"', 'href="index.html"')
    .replace('aria-label="View research"', 'aria-label="Project Overview"')
    .replace(/<span>View research<\/span>\s*<span class="pill-arrow">&rarr;<\/span>/, '<span class="pill-arrow">&larr;</span>\n        <span>Project Overview</span>')
    .replace(/href="\.\.\/\.\.\/index\.html#work"/g, `href="../../index.html?project=${slug}"`);
  fs.writeFileSync(path.join(targetDir, 'research.html'), researchFileHtml, 'utf8');

  console.log(`Generated: /projects/${slug}/ [Overview + Research]`);
});

console.log(`Successfully generated overview and research routes for all ${projects.length} projects!`);
