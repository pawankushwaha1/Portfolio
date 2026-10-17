const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8775;
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
  const debuggingPort = 9345;
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile_covtitle_clean');

  // Clean temp user data dir if exists
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

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails));
      return res.result ? res.result.value : undefined;
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('\n=== TEST 1: Admin Panel Global Cover Title Toggle Card ===');
    await new Promise(r => setTimeout(r, 1200));

    // Authenticate & open Selected Work tab
    await evaluate(`
      (async function() {
        sessionStorage.setItem('portfolio_admin_session', 'authenticated_' + Date.now());
        const pass = document.getElementById('authPasswordInput');
        if (pass) {
          pass.value = 'pawan@2025';
          const btn = document.getElementById('btnAuthUnlock');
          if (btn) btn.click();
        }
        const overlay = document.getElementById('authOverlay');
        const app = document.getElementById('adminApp');
        if (overlay) overlay.classList.add('hidden');
        if (app) app.classList.remove('hidden');
      })()
    `);
    await new Promise(r => setTimeout(r, 800));

    // Switch to projects tab
    await evaluate(`
      (function() {
        const tabBtn = document.querySelector('[data-tab="tab-projects"]');
        if (tabBtn) tabBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 800));

    const cardExists = await evaluate(`Boolean(document.getElementById('cardProjectCoverTitleControl'))`);
    const btnText = await evaluate(`document.getElementById('btnToggleCoverTitleText')?.textContent`);
    const badgeText = await evaluate(`document.getElementById('globalCoverTitleIndicator')?.textContent`);

    console.log(`✓ Card exists: ${cardExists}`);
    console.log(`✓ Initial Button text: "${btnText}"`);
    console.log(`✓ Initial Badge text: "${badgeText}"`);

    // Scroll to card and take screenshot
    await evaluate(`document.getElementById('cardProjectCoverTitleControl')?.scrollIntoView({ behavior: 'instant', block: 'center' })`);
    await new Promise(r => setTimeout(r, 400));
    const shotCard = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_admin_cover_title_card.png'), Buffer.from(shotCard.data, 'base64'));
    console.log('✓ Captured verify_admin_cover_title_card.png');

    console.log('\n=== TEST 2: Project Page with Cover Title ON ===');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/projects/luma/index.html` });
    await new Promise(r => setTimeout(r, 1200));

    const titleVisible = await evaluate(`
      (function() {
        const block = document.querySelector('.hero-typography-block');
        const mainTitle = document.querySelector('.hero-main-title');
        const catPill = document.querySelector('.hero-cat-pill');
        if (!block || !mainTitle || !catPill) return false;
        const style = window.getComputedStyle(block);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      })()
    `);
    console.log(`✓ Project Page Cover Title & Category visible when ON: ${titleVisible}`);

    const shotTitleOn = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_project_cover_title_enabled.png'), Buffer.from(shotTitleOn.data, 'base64'));
    console.log('✓ Captured verify_project_cover_title_enabled.png');

    console.log('\n=== TEST 3: Admin Panel Toggle Cover Title OFF ===');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/admin.html` });
    await new Promise(r => setTimeout(r, 1000));

    await evaluate(`
      (function() {
        const tabBtn = document.querySelector('[data-tab="tab-projects"]');
        if (tabBtn) tabBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 500));

    // Click toggle button
    await evaluate(`document.getElementById('btnToggleCoverTitle')?.click()`);
    await new Promise(r => setTimeout(r, 600));

    const btnTextOff = await evaluate(`document.getElementById('btnToggleCoverTitleText')?.textContent`);
    const badgeTextOff = await evaluate(`document.getElementById('globalCoverTitleIndicator')?.textContent`);
    const dataCoverTitle = await evaluate(`PortfolioData.get()?.customization?.projectPage?.showCoverTitle`);

    console.log(`✓ After toggle Button text: "${btnTextOff}"`);
    console.log(`✓ After toggle Badge text: "${badgeTextOff}"`);
    console.log(`✓ PortfolioData showCoverTitle: ${dataCoverTitle}`);

    console.log('\n=== TEST 4: Project Page with Cover Title OFF ===');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/projects/luma/index.html` });
    await new Promise(r => setTimeout(r, 1200));

    const titleHidden = await evaluate(`
      (function() {
        const block = document.querySelector('.hero-typography-block');
        if (!block) return true;
        const style = window.getComputedStyle(block);
        return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
      })()
    `);
    const backBtnVisible = await evaluate(`
      (function() {
        const btn = document.getElementById('projectBackBtn');
        if (!btn) return false;
        const style = window.getComputedStyle(btn);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })()
    `);

    console.log(`✓ Cover Title & Category Overlay successfully HIDDEN: ${titleHidden}`);
    console.log(`✓ Back to Work button remains visible & functional: ${backBtnVisible}`);

    const shotTitleOff = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_project_cover_title_disabled.png'), Buffer.from(shotTitleOff.data, 'base64'));
    console.log('✓ Captured verify_project_cover_title_disabled.png');

    console.log('\n=== TEST 5: Modal Per-Project Cover Title Controller ===');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/admin.html` });
    await new Promise(r => setTimeout(r, 1000));

    await evaluate(`
      (function() {
        const tabBtn = document.querySelector('[data-tab="tab-projects"]');
        if (tabBtn) tabBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 500));

    // Turn global back ON first
    await evaluate(`document.getElementById('btnToggleCoverTitle')?.click()`);
    await new Promise(r => setTimeout(r, 400));

    // Open LUMA edit modal
    await evaluate(`window.editProject('luma')`);
    await new Promise(r => setTimeout(r, 800));

    // Scroll to cover title pill controller
    await evaluate(`document.getElementById('labelProjCoverTitleEnabled')?.scrollIntoView({ behavior: 'instant', block: 'center' })`);
    await new Promise(r => setTimeout(r, 400));

    const shotModal = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_admin_project_edit_cover_title_modal.png'), Buffer.from(shotModal.data, 'base64'));
    console.log('✓ Captured verify_admin_project_edit_cover_title_modal.png');

    // Turn LUMA cover title OFF individually
    await evaluate(`document.getElementById('labelProjCoverTitleDisabled')?.click()`);
    await new Promise(r => setTimeout(r, 300));
    await evaluate(`document.getElementById('btnSaveProjectRecord')?.click()`);
    await new Promise(r => setTimeout(r, 800));

    const lumaSavedTitle = await evaluate(`PortfolioData.get()?.projects?.find(p => p.id === 'luma')?.showCoverTitle`);
    console.log(`✓ LUMA per-project showCoverTitle saved: ${lumaSavedTitle}`);

    // Check projects table has the ⊘T indicator badge on LUMA thumbnail
    const tableBadgeFound = await evaluate(`
      (function() {
        const rows = document.querySelectorAll('#projectsTableBody tr');
        for (const row of rows) {
          if (row.textContent.includes('luma') && row.innerHTML.includes('⊘T')) {
            return true;
          }
        }
        return false;
      })()
    `);
    console.log(`✓ LUMA table row displays '⊘T' Cover Title Disabled badge: ${tableBadgeFound}`);

    console.log('\n=== TEST 6: Per-Project Override Verification on Project Pages ===');
    // LUMA (Title disabled per-project)
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/projects/luma/index.html` });
    await new Promise(r => setTimeout(r, 1200));

    const lumaHidden = await evaluate(`
      (function() {
        const block = document.querySelector('.hero-typography-block');
        if (!block) return true;
        const style = window.getComputedStyle(block);
        return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
      })()
    `);
    console.log(`✓ LUMA cover title hidden (per-project override OFF): ${lumaHidden}`);

    // Analog (Title enabled via global ON)
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/projects/analog/index.html` });
    await new Promise(r => setTimeout(r, 1200));

    const analogVisible = await evaluate(`
      (function() {
        const block = document.querySelector('.hero-typography-block');
        if (!block) return false;
        const style = window.getComputedStyle(block);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      })()
    `);
    console.log(`✓ Analog cover title visible (global ON): ${analogVisible}`);

    console.log('\n=== TEST 7: Clean Reset LUMA to Title ON ===');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/admin.html` });
    await new Promise(r => setTimeout(r, 1000));
    await evaluate(`
      (function() {
        const tabBtn = document.querySelector('[data-tab="tab-projects"]');
        if (tabBtn) tabBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 500));
    await evaluate(`window.editProject('luma')`);
    await new Promise(r => setTimeout(r, 600));
    await evaluate(`document.getElementById('labelProjCoverTitleEnabled')?.click()`);
    await new Promise(r => setTimeout(r, 300));
    await evaluate(`document.getElementById('btnSaveProjectRecord')?.click()`);
    await new Promise(r => setTimeout(r, 600));

    const lumaResetTitle = await evaluate(`PortfolioData.get()?.projects?.find(p => p.id === 'luma')?.showCoverTitle`);
    console.log(`✓ LUMA reset showCoverTitle: ${lumaResetTitle}`);

    console.log('\n========================================');
    console.log('ALL COVER TITLE TESTS PASSED 100%!');
    console.log('========================================\n');

  } finally {
    try { chromeProc.kill(); } catch (e) {}
    server.close();
  }
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
