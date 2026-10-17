const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9568;
const ARTIFACT_DIR = path.resolve('C:\\Users\\kushw\\.gemini\\antigravity\\brain\\f0cdb6f4-1b77-4670-8973-104becbc507e');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getPageWsUrl(port) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      http.get(`http://127.0.0.1:${port}/json/list`, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const list = JSON.parse(raw);
            const page = list.find(t => t.type === 'page');
            if (page && page.webSocketDebuggerUrl) resolve(page.webSocketDebuggerUrl);
            else { if (attempts > 30) reject(new Error('fail')); else setTimeout(check, 200); }
          } catch(e) { if (attempts > 30) reject(e); else setTimeout(check, 200); }
        });
      }).on('error', () => { if (attempts > 30) reject(new Error('fail')); else setTimeout(check, 200); });
    };
    check();
  });
}

function createCdpClient(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();
    ws.onopen = () => {
      resolve({
        send(method, params = {}) {
          return new Promise((res, rej) => {
            const id = nextId++;
            pending.set(id, { res, rej });
            ws.send(JSON.stringify({ id, method, params }));
          });
        },
        close() { try { ws.close(); } catch(e) {} }
      });
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message));
        else res(msg.result);
      }
    };
    ws.onerror = reject;
  });
}

(async () => {
  const tempDir = path.join(ARTIFACT_DIR, 'scratch', 'temp_sc_dash_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  const proc = spawn(chromePath, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempDir}`,
    '--headless=new',
    '--window-size=1440,900',
    'about:blank'
  ]);
  try {
    const wsUrl = await getPageWsUrl(PORT);
    const client = await createCdpClient(wsUrl);
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Page.navigate', { url: 'http://localhost:8000/admin.html' });
    await sleep(1500);
    await client.send('Runtime.evaluate', {
      expression: `(async () => {
        if (window.PortfolioData && window.PortfolioData.auth) {
          await window.PortfolioData.auth.verifyPassword('pawan@2025');
        }
      })()`,
      awaitPromise: true
    });
    await client.send('Page.navigate', { url: 'http://localhost:8000/admin.html' });
    await sleep(1500);
    const shot = await client.send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(ARTIFACT_DIR, 'admin_dashboard_with_sync_card.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved dashboard screenshot:', shotPath);
    client.close();
  } finally {
    try { proc.kill(); } catch(e) {}
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e) {}
  }
})();
