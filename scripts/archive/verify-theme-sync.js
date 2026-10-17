const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8802;
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
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debuggingPort = 9380;
  const userDataDir = path.join(ROOT, '.tmp_chrome_verify_themesync');
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
        if (resp.ok) { versionData = await resp.json(); break; }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 100));
    }

    if (!versionData) throw new Error('Chrome remote debugging did not respond');

    // 1. Create Admin Tab
    const adminTabResp = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?http://127.0.0.1:${PORT}/admin.html`, { method: 'PUT' });
    const adminTabData = await adminTabResp.json();
    const adminWs = new WebSocket(adminTabData.webSocketDebuggerUrl);

    let adminMsgId = 1;
    const adminCallbacks = new Map();
    adminWs.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.id && adminCallbacks.has(parsed.id)) {
        const { resolve, reject } = adminCallbacks.get(parsed.id);
        adminCallbacks.delete(parsed.id);
        if (parsed.error) reject(parsed.error);
        else resolve(parsed.result);
      }
    };
    await new Promise((res, rej) => { adminWs.onopen = res; adminWs.onerror = rej; });

    function sendAdmin(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = adminMsgId++;
        adminCallbacks.set(id, { resolve, reject });
        adminWs.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendAdmin('Page.enable');
    await sendAdmin('DOM.enable');
    await sendAdmin('Runtime.enable');
    await sendAdmin('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });

    await new Promise(r => setTimeout(r, 1000));

    // Unlock Admin Panel and switch to Customization tab
    await sendAdmin('Runtime.evaluate', {
      expression: `
        sessionStorage.setItem('portfolio_admin_session', 'authenticated_' + Date.now());
        const overlay = document.getElementById('authOverlay');
        if (overlay) overlay.classList.add('hidden');
        const adminApp = document.getElementById('adminApp');
        if (adminApp) adminApp.classList.remove('hidden');
        if (typeof refreshAllPanels === 'function') refreshAllPanels();
        window.switchTab('customization');
      `
    });

    await new Promise(r => setTimeout(r, 800));

    // 2. Create Website Tab (index.html) in same Chrome profile
    const siteTabResp = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?http://127.0.0.1:${PORT}/index.html`, { method: 'PUT' });
    const siteTabData = await siteTabResp.json();
    const siteWs = new WebSocket(siteTabData.webSocketDebuggerUrl);

    let siteMsgId = 1;
    const siteCallbacks = new Map();
    siteWs.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.id && siteCallbacks.has(parsed.id)) {
        const { resolve, reject } = siteCallbacks.get(parsed.id);
        siteCallbacks.delete(parsed.id);
        if (parsed.error) reject(parsed.error);
        else resolve(parsed.result);
      }
    };
    await new Promise((res, rej) => { siteWs.onopen = res; siteWs.onerror = rej; });

    function sendSite(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = siteMsgId++;
        siteCallbacks.set(id, { resolve, reject });
        siteWs.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendSite('Page.enable');
    await sendSite('DOM.enable');
    await sendSite('Runtime.enable');
    await sendSite('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });

    await new Promise(r => setTimeout(r, 1200));

    // Helper to query website styles
    async function getSiteStyles() {
      const res = await sendSite('Runtime.evaluate', {
        returnByValue: true,
        expression: `
          (function() {
            const root = document.documentElement;
            const hero = document.getElementById('hero') || document.querySelector('.hero-section');
            const title = document.querySelector('.sw-title');
            const pill = document.querySelector('.filter-pill.active');
            const btnHero = document.querySelector('.btn-hero-white');
            const viewIcon = document.querySelector('.sw-view-icon');
            const connect = document.getElementById('connect');
            return {
              rootPrimary: root.style.getPropertyValue('--primary-theme-color'),
              rootHeaderBg: root.style.getPropertyValue('--header-bg-color'),
              rootHeroBg: root.style.getPropertyValue('--hero-bg-color'),
              rootBoldHeading: root.style.getPropertyValue('--bold-heading-color'),
              rootBtnColor: root.style.getPropertyValue('--btn-theme-color'),
              heroComputedBg: hero ? getComputedStyle(hero).backgroundColor : '',
              titleComputedColor: title ? getComputedStyle(title).color : '',
              pillComputedBg: pill ? getComputedStyle(pill).backgroundColor : '',
              btnHeroComputedColor: btnHero ? getComputedStyle(btnHero).color : '',
              viewIconComputedBg: viewIcon ? getComputedStyle(viewIcon).backgroundColor : '',
              connectComputedBg: connect ? getComputedStyle(connect).backgroundColor : ''
            };
          })()
        `
      });
      return res.result.value;
    }

    // ============================================================
    // TEST 1: EMERALD PRESTIGE PRESET
    // ============================================================
    console.log('\n--- TEST 1: Clicking Emerald Preset in Admin ---');
    const clickEmeraldRes = await sendAdmin('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (function() {
          const chip = document.querySelector('.preset-chip[data-theme="emerald"]');
          if (chip) chip.click();
          return {
            chipFound: !!chip,
            savedColors: window.PortfolioData ? window.PortfolioData.get()?.customization?.colors : null
          };
        })()
      `
    });
    console.log('Emerald Click Eval:', clickEmeraldRes.result.value);

    await new Promise(r => setTimeout(r, 900));

    const emeraldStyles = await getSiteStyles();
    console.log('Emerald Site Styles Result:', emeraldStyles);

    // Capture screenshot of website in Emerald
    const shotEmerald = await sendSite('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_live_site_emerald_theme.png'), Buffer.from(shotEmerald.data, 'base64'));
    console.log('Saved verify_live_site_emerald_theme.png');

    // ============================================================
    // TEST 2: OBSIDIAN LUXURY PRESET
    // ============================================================
    console.log('\n--- TEST 2: Clicking Obsidian Preset in Admin ---');
    const clickObsidianRes = await sendAdmin('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (function() {
          const chip = document.querySelector('.preset-chip[data-theme="obsidian"]');
          if (chip) chip.click();
          return {
            chipFound: !!chip,
            savedColors: window.PortfolioData ? window.PortfolioData.get()?.customization?.colors : null
          };
        })()
      `
    });
    console.log('Obsidian Click Eval:', clickObsidianRes.result.value);

    await new Promise(r => setTimeout(r, 900));

    const obsidianStyles = await getSiteStyles();
    console.log('Obsidian Site Styles Result:', obsidianStyles);

    // Capture screenshot of website in Obsidian
    const shotObsidian = await sendSite('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_live_site_obsidian_theme.png'), Buffer.from(shotObsidian.data, 'base64'));
    console.log('Saved verify_live_site_obsidian_theme.png');

    // ============================================================
    // TEST 3: CLASSIC WINE & GOLD PRESET
    // ============================================================
    console.log('\n--- TEST 3: Clicking Classic Wine Preset in Admin ---');
    const clickClassicRes = await sendAdmin('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (function() {
          const chip = document.querySelector('.preset-chip[data-theme="classic"]');
          if (chip) chip.click();
          return {
            chipFound: !!chip,
            savedColors: window.PortfolioData ? window.PortfolioData.get()?.customization?.colors : null
          };
        })()
      `
    });
    console.log('Classic Click Eval:', clickClassicRes.result.value);

    await new Promise(r => setTimeout(r, 900));

    const classicStyles = await getSiteStyles();
    console.log('Classic Wine Site Styles Result:', classicStyles);

    // Capture screenshot of website in Classic Wine & Gold
    const shotClassic = await sendSite('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_live_site_classic_wine_theme.png'), Buffer.from(shotClassic.data, 'base64'));
    console.log('Saved verify_live_site_classic_wine_theme.png');

    // Capture screenshot of Admin Appearance Tab
    const shotAdmin = await sendAdmin('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_admin_appearance_synced.png'), Buffer.from(shotAdmin.data, 'base64'));
    console.log('Saved verify_admin_appearance_synced.png');

    adminWs.close();
    siteWs.close();
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
