const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const PORT = 8128;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav'
};

const server = http.createServer((req, res) => {
  let cleanUrl = req.url.split('?')[0].split('#')[0];
  if (cleanUrl === '/') cleanUrl = '/index.html';

  let filePath = path.join(rootDir, cleanUrl);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!path.extname(cleanUrl) && fs.existsSync(filePath + '/index.html')) {
    filePath = filePath + '/index.html';
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  const tempDir = path.join(__dirname, '..', '.audit_edge_temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProcess = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
    `--user-data-dir=${tempDir}`,
    '--window-size=1440,900',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const versionRes = await fetch('http://127.0.0.1:9229/json/list');
    const tabs = await versionRes.json();
    const tab = tabs.find(t => t.type === 'page') || tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();
    const failedRequests = [];
    const consoleErrors = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const resolve = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        resolve(msg.result);
      }

      if (msg.method === 'Network.responseReceived') {
        const { response } = msg.params;
        if (response.status >= 400) {
          failedRequests.push({ url: response.url, status: response.status });
        }
      }

      if (msg.method === 'Runtime.consoleAPICalled') {
        const { type, args } = msg.params;
        if (type === 'error' || type === 'warning') {
          consoleErrors.push({
            type,
            text: args.map(a => a.value || a.description || JSON.stringify(a)).join(' ')
          });
        }
      }

      if (msg.method === 'Log.entryAdded') {
        const { entry } = msg.params;
        if (entry.level === 'error') {
          consoleErrors.push({ type: 'log_error', text: entry.text, url: entry.url });
        }
      }
    };

    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await new Promise(r => ws.onopen = r);
    await sendCommand('Network.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('Log.enable');
    await sendCommand('Page.enable');

    const pagesToTest = [
      '/index.html',
      '/project.html?id=kinetic-chair',
      '/projects/kinetic-chair',
      '/projects/luma',
      '/projects/analog',
      '/projects/gantt-lamp',
      '/projects/modu-bottle',
      '/projects/chassis-m1',
      '/projects/apex-gears',
      '/projects/wellness-journey'
    ];

    console.log('\n=== AUDITING PAGES FOR 404s AND CONSOLE ERRORS ===');

    for (const page of pagesToTest) {
      failedRequests.length = 0;
      consoleErrors.length = 0;

      await sendCommand('Page.navigate', { url: `http://localhost:${PORT}${page}` });
      await new Promise(r => setTimeout(r, 1200));

      console.log(`\nTesting: ${page}`);
      if (failedRequests.length > 0) {
        console.error(`  ❌ Failed Network Requests (${failedRequests.length}):`);
        failedRequests.forEach(fr => console.error(`     [${fr.status}] ${fr.url}`));
      } else {
        console.log(`  ✓ 0 network errors`);
      }

      if (consoleErrors.length > 0) {
        console.error(`  ⚠️ Console Warnings/Errors (${consoleErrors.length}):`);
        consoleErrors.forEach(ce => console.error(`     [${ce.type}] ${ce.text}`));
      } else {
        console.log(`  ✓ 0 console errors`);
      }
    }

    ws.close();
    edgeProcess.kill();
    server.close();
    console.log('\nAudit complete.');
    process.exit(0);
  } catch (err) {
    console.error('Audit script error:', err);
    server.close();
    process.exit(1);
  }
});
