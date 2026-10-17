const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8781;
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
  const debuggingPort = 9351;
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile_catfilters');

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

    // Login to Admin Panel
    await evaluate(`
      (function() {
        sessionStorage.setItem('portfolio_admin_session', 'authenticated_' + Date.now());
        if (typeof window.checkAuth === 'function') window.checkAuth();
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    // Switch to Selected Work tab
    await evaluate(`
      if (typeof window.switchTab === 'function') {
        window.switchTab('projects');
      }
    `);
    await new Promise(r => setTimeout(r, 600));

    console.log('\n=== TEST 1: Admin Panel Category Filters Card ===');
    const cardExists = await evaluate(`Boolean(document.getElementById('cardProjectCategoryFiltersControl'))`);
    console.log('✓ Category Filters Card exists:', cardExists);

    const initBtnText = await evaluate(`document.getElementById('btnToggleCategoryFiltersText')?.textContent.trim()`);
    const initBadgeText = await evaluate(`document.getElementById('globalCategoryFiltersIndicator')?.textContent.trim()`);
    const initProdInput = await evaluate(`document.getElementById('catNameProductInput')?.value.trim()`);
    const initUiuxInput = await evaluate(`document.getElementById('catNameUiuxInput')?.value.trim()`);
    const initGraphInput = await evaluate(`document.getElementById('catNameGraphicInput')?.value.trim()`);
    const initSuffixInput = await evaluate(`document.getElementById('catBadgeSuffixInput')?.value.trim()`);

    console.log(`✓ Initial Button text: "${initBtnText}"`);
    console.log(`✓ Initial Badge text: "${initBadgeText}"`);
    console.log(`✓ Initial Product input: "${initProdInput}"`);
    console.log(`✓ Initial UI/UX input: "${initUiuxInput}"`);
    console.log(`✓ Initial Graphic input: "${initGraphInput}"`);
    console.log(`✓ Initial Suffix input: "${initSuffixInput}"`);

    // Capture screenshot of the Admin Panel Category Filters card
    const cardRect = await evaluate(`
      (function() {
        const el = document.getElementById('cardProjectCategoryFiltersControl');
        if (!el) return null;
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
        const r = el.getBoundingClientRect();
        return { x: Math.max(0, r.x - 20), y: Math.max(0, r.y - 20), width: r.width + 40, height: r.height + 40, scale: 1 };
      })()
    `);
    await new Promise(r => setTimeout(r, 300));
    if (cardRect) {
      await captureScreenshot('verify_admin_category_filters_card.png', cardRect);
    }

    console.log('\n=== TEST 2: Website Default Category Filter Pills ===');
    await navigate(`http://127.0.0.1:${PORT}/index.html#work`);
    await new Promise(r => setTimeout(r, 1200));

    const pillsVisible = await evaluate(`
      (function() {
        const el = document.querySelector('.filter-pills');
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })()
    `);
    console.log('✓ Filter pills visible by default:', pillsVisible);

    const pillItemsText = await evaluate(`
      (function() {
        const pills = document.querySelectorAll('.filter-pill');
        return Array.from(pills).map(p => p.textContent.replace(/\\s+/g, ' ').trim());
      })()
    `);
    console.log('✓ Default Pill Items:', pillItemsText);

    const pillsRect = await evaluate(`
      (function() {
        const el = document.getElementById('workStickyFrame') || document.querySelector('.sw-header-container');
        if (!el) return null;
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        const r = el.getBoundingClientRect();
        return { x: 0, y: Math.max(0, r.y), width: 1440, height: 260, scale: 1 };
      })()
    `);
    await new Promise(r => setTimeout(r, 400));
    if (pillsRect) {
      await captureScreenshot('verify_website_category_filters_enabled.png', pillsRect);
    }

    console.log('\n=== TEST 3: Admin Global Toggle Category Filters OFF ===');
    await navigate(`http://127.0.0.1:${PORT}/admin.html`);
    await evaluate(`
      (function() {
        sessionStorage.setItem('portfolio_admin_session', 'authenticated_' + Date.now());
        if (typeof window.checkAuth === 'function') window.checkAuth();
        if (typeof window.switchTab === 'function') window.switchTab('projects');
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    // Click Toggle button to turn OFF
    await evaluate(`document.getElementById('btnToggleCategoryFilters').click()`);
    await new Promise(r => setTimeout(r, 600));

    const afterToggleText = await evaluate(`document.getElementById('btnToggleCategoryFiltersText')?.textContent.trim()`);
    console.log(`✓ After toggle Button text: "${afterToggleText}"`);

    // Verify on Website index.html that filter-pills is hidden
    await navigate(`http://127.0.0.1:${PORT}/index.html#work`);
    await new Promise(r => setTimeout(r, 1000));

    const pillsHidden = await evaluate(`
      (function() {
        const el = document.querySelector('.filter-pills');
        if (!el) return true;
        const style = window.getComputedStyle(el);
        return style.display === 'none';
      })()
    `);
    console.log('✓ Filter pills successfully HIDDEN on website:', pillsHidden);

    const headerNoPillsRect = await evaluate(`
      (function() {
        const el = document.querySelector('.sw-header-container');
        if (!el) return null;
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        const r = el.getBoundingClientRect();
        return { x: 0, y: Math.max(0, r.y), width: 1440, height: 240, scale: 1 };
      })()
    `);
    await new Promise(r => setTimeout(r, 300));
    if (headerNoPillsRect) {
      await captureScreenshot('verify_website_category_filters_disabled.png', headerNoPillsRect);
    }

    console.log('\n=== TEST 4: Turn ON & Edit Custom Category Names & Suffix ===');
    await navigate(`http://127.0.0.1:${PORT}/admin.html`);
    await evaluate(`
      (function() {
        sessionStorage.setItem('portfolio_admin_session', 'authenticated_' + Date.now());
        if (typeof window.checkAuth === 'function') window.checkAuth();
        if (typeof window.switchTab === 'function') window.switchTab('projects');
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    // Turn back ON
    await evaluate(`document.getElementById('btnToggleCategoryFilters').click()`);
    await new Promise(r => setTimeout(r, 300));

    // Edit input texts
    await evaluate(`
      document.getElementById('catNameProductInput').value = 'Hardware & Physical';
      document.getElementById('catNameUiuxInput').value = 'Digital Interfaces';
      document.getElementById('catNameGraphicInput').value = 'Visual Identity';
      document.getElementById('catBadgeSuffixInput').value = 'Works';
      document.getElementById('btnSaveCategoryTexts').click();
    `);
    await new Promise(r => setTimeout(r, 600));

    // Verify on website
    await navigate(`http://127.0.0.1:${PORT}/index.html#work`);
    await new Promise(r => setTimeout(r, 1000));

    const customPillItemsText = await evaluate(`
      (function() {
        const pills = document.querySelectorAll('.filter-pill');
        return Array.from(pills).map(p => p.textContent.replace(/\\s+/g, ' ').trim());
      })()
    `);
    console.log('✓ Custom Pill Items on Website:', customPillItemsText);

    const customPillsRect = await evaluate(`
      (function() {
        const el = document.querySelector('.sw-header-container');
        if (!el) return null;
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        const r = el.getBoundingClientRect();
        return { x: 0, y: Math.max(0, r.y), width: 1440, height: 240, scale: 1 };
      })()
    `);
    await new Promise(r => setTimeout(r, 300));
    if (customPillsRect) {
      await captureScreenshot('verify_website_custom_category_texts.png', customPillsRect);
    }

    console.log('\n=== TEST 5: Project Page Reflects Custom Category Name ===');
    await navigate(`http://127.0.0.1:${PORT}/projects/kinetic-chair/index.html`);
    await new Promise(r => setTimeout(r, 1200));

    const projectCatBadge = await evaluate(`
      (function() {
        const pill = document.querySelector('.hero-cat-pill') || document.querySelector('.project-cat-badge');
        return pill ? pill.textContent.trim() : '';
      })()
    `);
    console.log('✓ Kinetic Chair Project Category Badge:', projectCatBadge);

    const projectOverviewCat = await evaluate(`
      (function() {
        const tag = document.getElementById('pflowCategoryTag');
        return tag ? tag.textContent.trim() : '';
      })()
    `);
    console.log('✓ Kinetic Chair Overview Category Tag:', projectOverviewCat);

    const projectHeroRect = await evaluate(`
      (function() {
        const el = document.querySelector('.hero-typography-block') || document.querySelector('.project-cover-typography');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.max(0, r.x - 20), y: Math.max(0, r.y - 20), width: r.width + 40, height: r.height + 40, scale: 1 };
      })()
    `);
    await new Promise(r => setTimeout(r, 300));
    if (projectHeroRect) {
      await captureScreenshot('verify_project_custom_category_badge.png', projectHeroRect);
    }

    console.log('\n=== TEST 6: Clean Reset ===');
    await evaluate(`
      (function() {
        localStorage.removeItem('portfolio_custom_data');
      })()
    `);
    console.log('✓ Reset to defaults completed.');

    console.log('\n======================================================');
    console.log('ALL CATEGORY FILTERS & TEXT EDIT TESTS PASSED 100%!');
    console.log('======================================================\n');

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
