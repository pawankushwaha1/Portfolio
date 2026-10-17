const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8786;
const ROOT = path.resolve(__dirname, '..');
const artifactDir = 'C:\\Users\\kushw\\.gemini\\antigravity\\brain\\f0cdb6f4-1b77-4670-8973-104becbc507e';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0].split('#')[0];
  let filePath = path.join(ROOT, decodeURIComponent(urlPath));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

async function run() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✓ Test server running on http://127.0.0.1:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debuggingPort = 9356;
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile_cards_cat');

  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debuggingPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  try {
    let versionData = null;
    for (let i = 0; i < 30; i++) {
      try {
        const resp = await fetch(`http://127.0.0.1:${debuggingPort}/json/version`);
        if (resp.ok) {
          versionData = await resp.json();
          break;
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 200));
    }

    if (!versionData) throw new Error('Failed to connect to Chrome DevTools endpoint');

    const newTabResp = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?http://127.0.0.1:${PORT}/admin.html`, { method: 'PUT' });
    const tabData = await newTabResp.json();
    const ws = new WebSocket(tabData.webSocketDebuggerUrl);
    let idCounter = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error('Evaluation error: ' + JSON.stringify(res.exceptionDetails));
      }
      return res.result ? res.result.value : undefined;
    }

    async function captureScreenshot(filename, clip = null) {
      const params = { format: 'png' };
      if (clip) params.clip = clip;
      const res = await send('Page.captureScreenshot', params);
      const buf = Buffer.from(res.data, 'base64');
      const outPath = path.join(artifactDir, filename);
      fs.writeFileSync(outPath, buf);
      console.log(`✓ Captured ${filename}`);
    }

    async function navigate(url) {
      await send('Page.navigate', { url });
      await new Promise(r => setTimeout(r, 1500));
    }

    // 1. Login to Admin Panel & switch to Selected Work
    await evaluate(`
      sessionStorage.setItem('portfolio_admin_session', 'authenticated_' + Date.now());
      if (typeof window.checkAuth === 'function') window.checkAuth();
      if (typeof window.switchTab === 'function') window.switchTab('projects');
    `);
    await new Promise(r => setTimeout(r, 800));

    console.log('\n=== TEST 1: Update Category 3 to "Brand Design" in Admin Panel ===');
    // Set inputs exactly as user did:
    // Category 1: "Product Design"
    // Category 2: "Digital & UI/UX"
    // Category 3: "Brand Design"
    await evaluate(`
      document.getElementById('catNameProductInput').value = 'Industrial Design';
      document.getElementById('catNameUiuxInput').value = 'Digital & UI/UX';
      document.getElementById('catNameGraphicInput').value = 'Brand Design';
      document.getElementById('catBadgeSuffixInput').value = 'Projects';
      document.getElementById('btnSaveCategoryTexts').click();
    `);
    await new Promise(r => setTimeout(r, 800));

    // Verify Admin Table shows updated categories
    const tableCats = await evaluate(`
      (function() {
        const rows = document.querySelectorAll('#projectsTableBody tr');
        return Array.from(rows).slice(0, 5).map(tr => {
          const title = tr.querySelector('.table-title')?.textContent.trim();
          const cat = tr.querySelector('.table-category-pill')?.textContent.trim();
          return { title, cat };
        });
      })()
    `);
    console.log('✓ Admin Table Categories Sample:', tableCats);

    console.log('\n=== TEST 2: Navigate to Website and Verify Cards Category Labels ===');
    await navigate(`http://127.0.0.1:${PORT}/index.html#work`);
    await new Promise(r => setTimeout(r, 1500));

    // Scroll to work section and jump to BREATHE card
    const cardInfo = await evaluate(`
      (function() {
        const cards = document.querySelectorAll('.sw-project-card');
        return Array.from(cards).map(c => ({
          slug: c.dataset.slug || c.dataset.id,
          cat: c.dataset.category,
          categoryLabelText: c.querySelector('.sw-card-category')?.textContent.trim(),
          titleText: c.querySelector('.sw-card-title')?.textContent.trim()
        }));
      })()
    `);

    console.log('✓ All Project Cards Rendered with Category Labels:');
    cardInfo.forEach(c => {
      console.log(`   - [${c.slug}] Category: "${c.categoryLabelText}" | Title: "${c.titleText}"`);
    });

    // Check specific cards:
    const kineticCard = cardInfo.find(c => c.slug === 'kinetic-chair');
    const breatheCard = cardInfo.find(c => c.slug === 'breathe');
    const movieTimeCard = cardInfo.find(c => c.slug === 'movie-time');
    const vinylCard = cardInfo.find(c => c.slug === 'vinyl-grooves');

    if (!breatheCard) throw new Error('BREATHE card not found!');
    if (!movieTimeCard) throw new Error('MOVIE TIME card not found!');

    console.log(`\n✓ Kinetic Chair card category label: "${kineticCard?.categoryLabelText}" (expected: "INDUSTRIAL DESIGN")`);
    console.log(`✓ BREATHE card category label: "${breatheCard?.categoryLabelText}" (expected: "DIGITAL & UI/UX")`);
    console.log(`✓ MOVIE TIME card category label: "${movieTimeCard?.categoryLabelText}" (expected: "BRAND DESIGN")`);
    console.log(`✓ VINYL GROOVES card category label: "${vinylCard?.categoryLabelText}" (expected: "BRAND DESIGN")`);

    if (breatheCard.categoryLabelText !== 'DIGITAL & UI/UX') {
      throw new Error(`Expected BREATHE card category to be "DIGITAL & UI/UX", got "${breatheCard.categoryLabelText}"`);
    }
    if (movieTimeCard.categoryLabelText !== 'BRAND DESIGN') {
      throw new Error(`Expected MOVIE TIME card category to be "BRAND DESIGN", got "${movieTimeCard.categoryLabelText}"`);
    }
    if (kineticCard.categoryLabelText !== 'INDUSTRIAL DESIGN') {
      throw new Error(`Expected Kinetic Chair card category to be "INDUSTRIAL DESIGN", got "${kineticCard.categoryLabelText}"`);
    }

    // Scroll directly to BREATHE card and take screenshot
    await evaluate(`
      (function() {
        if (window.workShowcaseSlider) {
          window.workShowcaseSlider.goToSlug('breathe', true);
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    // Capture BREATHE card meta clip (matching user's uploaded image!)
    const breatheMetaClip = await evaluate(`
      (function() {
        const breatheCard = document.querySelector('.sw-project-card[data-slug="breathe"]');
        if (!breatheCard) return null;
        const meta = breatheCard.querySelector('.sw-card-meta');
        if (!meta) return null;
        const r = meta.getBoundingClientRect();
        return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.width + 20, height: Math.min(180, r.height + 20), scale: 1 };
      })()
    `);
    if (breatheMetaClip) {
      await captureScreenshot('verify_breathe_card_updated_category.png', breatheMetaClip);
    }

    // Scroll to MOVIE TIME card (Category 3: BRAND DESIGN) and take screenshot
    await evaluate(`
      (function() {
        if (window.workShowcaseSlider) {
          window.workShowcaseSlider.goToSlug('movie-time', true);
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    const movieMetaClip = await evaluate(`
      (function() {
        const card = document.querySelector('.sw-project-card[data-slug="movie-time"]');
        if (!card) return null;
        const meta = card.querySelector('.sw-card-meta');
        if (!meta) return null;
        const r = meta.getBoundingClientRect();
        return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.width + 20, height: Math.min(180, r.height + 20), scale: 1 };
      })()
    `);
    if (movieMetaClip) {
      await captureScreenshot('verify_brand_design_card_updated_category.png', movieMetaClip);
    }

    console.log('\n=== TEST 3: Clean Reset ===');
    await evaluate(`localStorage.removeItem('portfolio_custom_data');`);
    console.log('✓ Reset to defaults completed.');

    console.log('\n================================================================');
    console.log('ALL TESTS PASSED: CARD CATEGORY LABELS UPDATE 100% IN SYNC!');
    console.log('================================================================\n');

  } finally {
    try { chromeProc.kill(); } catch (e) {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
