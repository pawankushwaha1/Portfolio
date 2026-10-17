const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8806;
const ROOT = path.resolve(__dirname, '..');
const artifactDir = 'C:\\Users\\kushw\\.gemini\\antigravity\\brain\\f0cdb6f4-1b77-4670-8973-104becbc507e';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404); res.end();
  }
});

async function run() {
  await new Promise(r => server.listen(PORT, r));
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debuggingPort = 9386;
  const userDataDir = path.join(ROOT, '.tmp_chrome_verify_work_theme');
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debuggingPort}`,
    '--headless=new',
    '--disable-gpu',
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

    const newTabResp = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?http://127.0.0.1:${PORT}/admin.html`, { method: 'PUT' });
    const tabData = await newTabResp.json();
    const ws = new WebSocket(tabData.webSocketDebuggerUrl);

    let msgId = 1;
    const callbacks = new Map();
    ws.onmessage = (event) => {
      const p = JSON.parse(event.data);
      if (p.id && callbacks.has(p.id)) {
        const { resolve, reject } = callbacks.get(p.id);
        callbacks.delete(p.id);
        if (p.error) reject(p.error); else resolve(p.result);
      }
    };
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

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

    // Open site tab
    const siteTabResp = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?http://127.0.0.1:${PORT}/index.html`, { method: 'PUT' });
    const siteTabData = await siteTabResp.json();
    const siteWs = new WebSocket(siteTabData.webSocketDebuggerUrl);
    let siteMsgId = 1;
    const siteCallbacks = new Map();
    siteWs.onmessage = (event) => {
      const p = JSON.parse(event.data);
      if (p.id && siteCallbacks.has(p.id)) {
        const { resolve, reject } = siteCallbacks.get(p.id);
        siteCallbacks.delete(p.id);
        if (p.error) reject(p.error); else resolve(p.result);
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

    await new Promise(r => setTimeout(r, 1000));

    // Admin: Authenticate & apply Emerald
    await sendCmd('Runtime.evaluate', {
      expression: `
        sessionStorage.setItem('portfolio_admin_session', 'authenticated_' + Date.now());
        const overlay = document.getElementById('authOverlay');
        if (overlay) overlay.classList.add('hidden');
        const adminApp = document.getElementById('adminApp');
        if (adminApp) adminApp.classList.remove('hidden');
        window.switchTab('customization');
        document.querySelector('.preset-chip[data-theme="emerald"]').click();
      `
    });

    await new Promise(r => setTimeout(r, 1000));

    // Site: scroll to Selected Work section
    await sendSite('Runtime.evaluate', {
      expression: `
        const work = document.getElementById('work');
        if (work) work.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });

    await new Promise(r => setTimeout(r, 700));

    const shotWork = await sendSite('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_live_site_emerald_selected_work.png'), Buffer.from(shotWork.data, 'base64'));
    console.log('Saved verify_live_site_emerald_selected_work.png');

    // Admin: reset back to Classic Wine & Gold
    await sendCmd('Runtime.evaluate', {
      expression: `
        document.querySelector('.preset-chip[data-theme="classic"]').click();
      `
    });

    await new Promise(r => setTimeout(r, 1000));

    const shotWorkClassic = await sendSite('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_live_site_classic_wine_selected_work.png'), Buffer.from(shotWorkClassic.data, 'base64'));
    console.log('Saved verify_live_site_classic_wine_selected_work.png');

    ws.close();
    siteWs.close();
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

run().catch(console.error);
