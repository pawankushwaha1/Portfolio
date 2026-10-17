const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8798;
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
  console.log(`Server listening at http://127.0.0.1:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debuggingPort = 9368;
  const userDataDir = path.join(ROOT, '.tmp_chrome_customization_verify');
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

    const newTabResp = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?http://127.0.0.1:${PORT}/admin.html`, { method: 'PUT' });
    const tabData = await newTabResp.json();
    const ws = new WebSocket(tabData.webSocketDebuggerUrl);

    let msgId = 1;
    const callbacks = new Map();
    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.id && callbacks.has(parsed.id)) {
        const { resolve, reject } = callbacks.get(parsed.id);
        callbacks.delete(parsed.id);
        if (parsed.error) reject(parsed.error);
        else resolve(parsed.result);
      }
    };

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    function sendCmd(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCmd('Page.enable');
    await sendCmd('DOM.enable');
    await sendCmd('Runtime.enable');
    await sendCmd('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });

    // Wait for page to load
    await new Promise(r => setTimeout(r, 1500));

    // Unlock Admin Panel
    console.log('Unlocking admin panel...');
    const loginRes = await sendCmd('Runtime.evaluate', {
      expression: `
        sessionStorage.setItem('portfolio_admin_session', 'authenticated_' + Date.now());
        const passIn = document.getElementById('authPasswordInput');
        if (passIn) passIn.value = 'pawan@2025';
        const authForm = document.getElementById('authForm');
        if (authForm) authForm.dispatchEvent(new Event('submit', { cancelable: true }));
        const overlay = document.getElementById('authOverlay');
        if (overlay) overlay.classList.add('hidden');
        const adminApp = document.getElementById('adminApp');
        if (adminApp) adminApp.classList.remove('hidden');
        if (typeof refreshAllPanels === 'function') refreshAllPanels();
        'unlocked'
      `,
      returnByValue: true
    });
    console.log('Login eval result:', loginRes.result.value);

    await new Promise(r => setTimeout(r, 1000));

    // Switch to Customization Tab
    console.log('Switching to Customization tab...');
    const switchTabRes = await sendCmd('Runtime.evaluate', {
      expression: `
        window.switchTab('customization');
        const tab = document.getElementById('tab-customization');
        ({
          tabExists: Boolean(tab),
          isActive: tab ? tab.classList.contains('active') : false,
          hasColorPalette: Boolean(document.getElementById('cardColorPalette')),
          hasMasterCircle: Boolean(document.getElementById('custColorPrimary')),
          has3Previews: Boolean(document.getElementById('syncHeaderSample')) &&
                        Boolean(document.getElementById('syncBoldTextSample')) &&
                        Boolean(document.getElementById('syncBtnSample'))
        })
      `,
      returnByValue: true
    });
    console.log('Tab switch verification:', JSON.stringify(switchTabRes.result.value, null, 2));

    // Scroll to Card 4 (Color Palette & Instant Theme Presets)
    await sendCmd('Runtime.evaluate', {
      expression: `
        const card = document.getElementById('cardColorPalette');
        if (card) {
          card.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot of Color Palette & Presets matching user request
    const shot1 = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const shot1Path = path.join(artifactDir, 'verify_admin_appearance_customization_palette.png');
    fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
    console.log('Saved screenshot 1 to:', shot1Path);

    // Test clicking Emerald Prestige preset chip
    console.log('Testing preset chip: Emerald Prestige...');
    const presetRes = await sendCmd('Runtime.evaluate', {
      expression: `
        const emeraldChip = document.querySelector('.preset-chip[data-theme="emerald"]');
        if (emeraldChip) {
          emeraldChip.click();
        }
        ({
          masterHex: document.getElementById('custColorPrimaryHex')?.value,
          headerBgHex: document.getElementById('custColorHeaderBgHex')?.value,
          boldTextHex: document.getElementById('custColorBoldTextHex')?.value,
          buttonsHex: document.getElementById('custColorButtonsHex')?.value,
          sampleHeaderBg: document.getElementById('syncHeaderSample')?.style.backgroundColor,
          sampleBoldColor: document.getElementById('syncBoldTextSample')?.style.color,
          sampleBtnBg: document.getElementById('syncBtnSample')?.style.backgroundColor
        })
      `,
      returnByValue: true
    });
    console.log('Emerald preset values:', JSON.stringify(presetRes.result.value, null, 2));

    await new Promise(r => setTimeout(r, 600));

    const shot2 = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const shot2Path = path.join(artifactDir, 'verify_admin_emerald_preset_live_preview.png');
    fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
    console.log('Saved screenshot 2 to:', shot2Path);

    // Click Save Customization
    console.log('Saving customization...');
    await sendCmd('Runtime.evaluate', {
      expression: `
        const saveBtn = document.getElementById('btnSaveCustomization');
        if (saveBtn) saveBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Reset back to Classic Wine & Gold and save
    console.log('Resetting to Classic Wine & Gold...');
    await sendCmd('Runtime.evaluate', {
      expression: `
        const classicChip = document.querySelector('.preset-chip[data-theme="classic"]');
        if (classicChip) classicChip.click();
        const saveBtn = document.getElementById('btnSaveCustomization');
        if (saveBtn) saveBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Scroll to top of Customization Tab to view Hero Typography and Profile Picture controls
    await sendCmd('Runtime.evaluate', {
      expression: `
        window.scrollTo({ top: 0, behavior: 'instant' });
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shot3 = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const shot3Path = path.join(artifactDir, 'verify_admin_appearance_overview.png');
    fs.writeFileSync(shot3Path, Buffer.from(shot3.data, 'base64'));
    console.log('Saved screenshot 3 to:', shot3Path);

    // Open live website to verify styles applied
    await sendCmd('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
    await new Promise(r => setTimeout(r, 2000));

    const liveSiteRes = await sendCmd('Runtime.evaluate', {
      expression: `
        ({
          title: document.title,
          primaryThemeColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-theme-color'),
          boldHeadingColor: getComputedStyle(document.documentElement).getPropertyValue('--bold-heading-color'),
          headerBgColor: getComputedStyle(document.documentElement).getPropertyValue('--header-bg-color')
        })
      `,
      returnByValue: true
    });
    console.log('Live site CSS tokens:', JSON.stringify(liveSiteRes.result.value, null, 2));

    const shotLive = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const shotLivePath = path.join(artifactDir, 'verify_live_site_theme_applied.png');
    fs.writeFileSync(shotLivePath, Buffer.from(shotLive.data, 'base64'));
    console.log('Saved live site screenshot to:', shotLivePath);

    ws.close();
    console.log('Verification completed successfully!');
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    server.close();
  }
}

run().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
