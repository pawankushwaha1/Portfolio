const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8783;
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
  const debuggingPort = 9353;
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile_catshots2');

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

    const newTabResp = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?http://127.0.0.1:${PORT}/index.html`, { method: 'PUT' });
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

    await new Promise(r => setTimeout(r, 1200));

    async function scrollToWork() {
      await evaluate(`
        (function() {
          if (window.lenis) {
            window.lenis.scrollTo('#work', { immediate: true });
          } else {
            const sec = document.getElementById('work');
            if (sec) window.scrollTo(0, sec.offsetTop);
          }
        })()
      `);
      await new Promise(r => setTimeout(r, 800));
    }

    // 1. Capture Default Enabled Pills
    await scrollToWork();
    const clip1 = await evaluate(`
      (function() {
        const header = document.querySelector('.sw-header-container');
        if (!header) return null;
        const r = header.getBoundingClientRect();
        return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: r.width, height: r.height, scale: 1 };
      })()
    `);
    console.log('clip1:', clip1);
    if (clip1) {
      await captureScreenshot('verify_website_category_filters_enabled.png', clip1);
    }

    // 2. Turn OFF via custom data & Capture Disabled
    await evaluate(`
      (function() {
        const d = PortfolioData.get();
        d.customization = d.customization || {};
        d.customization.categoryFilters = d.customization.categoryFilters || {};
        d.customization.categoryFilters.enabled = false;
        PortfolioData.save(d);
      })()
    `);
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 1200));
    await scrollToWork();

    const clip2 = await evaluate(`
      (function() {
        const header = document.querySelector('.sw-header-container');
        if (!header) return null;
        const r = header.getBoundingClientRect();
        return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: r.width, height: r.height, scale: 1 };
      })()
    `);
    console.log('clip2:', clip2);
    if (clip2) {
      await captureScreenshot('verify_website_category_filters_disabled.png', clip2);
    }

    // 3. Custom Category Texts & Capture
    await evaluate(`
      (function() {
        const d = PortfolioData.get();
        d.customization = d.customization || {};
        d.customization.categoryFilters = {
          enabled: true,
          productName: 'Hardware & Physical',
          uiuxName: 'Digital Interfaces',
          graphicName: 'Visual Identity',
          suffix: 'Works'
        };
        PortfolioData.save(d);
      })()
    `);
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 1200));
    await scrollToWork();

    const clip3 = await evaluate(`
      (function() {
        const header = document.querySelector('.sw-header-container');
        if (!header) return null;
        const r = header.getBoundingClientRect();
        return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: r.width, height: r.height, scale: 1 };
      })()
    `);
    console.log('clip3:', clip3);
    if (clip3) {
      await captureScreenshot('verify_website_custom_category_texts.png', clip3);
    }

    // Reset back
    await evaluate(`localStorage.removeItem('portfolio_custom_data');`);
    console.log('✓ Cleaned up.');

  } finally {
    try { chromeProc.kill(); } catch (e) {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

run().catch(console.error);
