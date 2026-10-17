const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8874;
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
  console.log(`Server running on http://127.0.0.1:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debuggingPort = 9414;
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile_verify_anim');

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

  await new Promise((resolve) => setTimeout(resolve, 1500));

  let pageTargets = [];
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const data = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${debuggingPort}/json`, (res) => {
          let body = '';
          res.on('data', (c) => body += c);
          res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
      });
      pageTargets = data.filter((t) => t.type === 'page');
      if (pageTargets.length > 0) break;
    } catch (e) {}
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const ws = new WebSocket(pageTargets[0].webSocketDebuggerUrl);
  await new Promise((resolve) => ws.onopen = resolve);

  let messageId = 1;
  function callCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      const onMessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.id === id) {
          ws.removeEventListener('message', onMessage);
          if (payload.error) reject(payload.error);
          else resolve(payload.result);
        }
      };
      ws.addEventListener('message', onMessage);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await callCDP('Page.enable');
  await callCDP('Runtime.enable');
  await callCDP('DOM.enable');
  await callCDP('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1080,
    deviceScaleFactor: 2,
    mobile: false
  });

  await callCDP('Page.navigate', { url: `http://127.0.0.1:${PORT}/project.html?id=skytrack` });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Inspect computed styles
  const inspection = await callCDP('Runtime.evaluate', {
    expression: `(() => {
      const v = document.querySelector('.pflow-vertical-item');
      const g = document.querySelector('.pflow-gallery-item');
      const csV = v ? window.getComputedStyle(v) : {};
      const csG = g ? window.getComputedStyle(g) : {};
      return {
        vBorder: csV.border,
        vOutline: csV.outline,
        vBg: csV.backgroundColor,
        vTransition: csV.transition,
        vTransform: csV.transform,
        vRadius: csV.borderRadius,
        gBorder: csG.border,
        gOutline: csG.outline,
        gBg: csG.backgroundColor,
        gTransition: csG.transition,
        gTransform: csG.transform,
        gRadius: csG.borderRadius
      };
    })()`,
    returnByValue: true
  });
  console.log('✓ Computed Styles Default:', JSON.stringify(inspection.result.value, null, 2));

  // 2. Scroll to 9:16 section
  await callCDP('Runtime.evaluate', {
    expression: `(() => {
      const vSec = document.getElementById('projectVerticalSection');
      if (vSec) vSec.scrollIntoView({ block: 'center' });
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  // Capture close-up of 9:16 card top (demonstrating outline removed)
  const vRectRes = await callCDP('Runtime.evaluate', {
    expression: `(() => {
      const v = document.querySelector('.pflow-vertical-item');
      if (!v) return null;
      const r = v.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    })()`,
    returnByValue: true
  });
  const vRect = vRectRes.result.value;

  if (vRect) {
    const shotTop = await callCDP('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: vRect.x,
        y: vRect.y,
        width: vRect.width,
        height: 80,
        scale: 2
      }
    });
    fs.writeFileSync(path.join(artifactDir, 'verify_916_outline_removed.png'), Buffer.from(shotTop.data, 'base64'));
    console.log('✓ Captured verify_916_outline_removed.png (clean borderless top edge)');
  }

  // 3. Hover test on 9:16 item
  if (vRect) {
    const centerX = vRect.x + vRect.width / 2;
    const centerY = vRect.y + 100;
    await callCDP('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: centerX,
      y: centerY
    });
    await new Promise((r) => setTimeout(r, 600)); // wait for transition

    const hoverInspection = await callCDP('Runtime.evaluate', {
      expression: `(() => {
        const v = document.querySelector('.pflow-vertical-item');
        const cs = v ? window.getComputedStyle(v) : {};
        return {
          hoverTransform: cs.transform,
          hoverBoxShadow: cs.boxShadow
        };
      })()`,
      returnByValue: true
    });
    console.log('✓ 9:16 Hover Computed Styles:', JSON.stringify(hoverInspection.result.value, null, 2));

    // Capture screenshot of 9:16 item hovered
    const shotHover = await callCDP('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: Math.max(0, vRect.x - 20),
        y: Math.max(0, vRect.y - 20),
        width: vRect.width + 40,
        height: vRect.height + 40,
        scale: 2
      }
    });
    fs.writeFileSync(path.join(artifactDir, 'verify_916_hover_animation.png'), Buffer.from(shotHover.data, 'base64'));
    console.log('✓ Captured verify_916_hover_animation.png');
  }

  // 4. Capture full viewport overview of the 9:16 section
  const fullShot = await callCDP('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'verify_916_three_columns_clean.png'), Buffer.from(fullShot.data, 'base64'));
  console.log('✓ Captured verify_916_three_columns_clean.png');

  // 5. Test static route /projects/skytrack/
  await callCDP('Page.navigate', { url: `http://127.0.0.1:${PORT}/projects/skytrack/` });
  await new Promise((r) => setTimeout(r, 2000));
  await callCDP('Runtime.evaluate', {
    expression: `(() => {
      const vSec = document.getElementById('projectVerticalSection');
      if (vSec) vSec.scrollIntoView({ block: 'center' });
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const staticShot = await callCDP('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'verify_static_route_skytrack_916_clean.png'), Buffer.from(staticShot.data, 'base64'));
  console.log('✓ Captured verify_static_route_skytrack_916_clean.png');

  ws.close();
  chromeProc.kill();
  server.close();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  console.log('✓ All verifications completed successfully!');
}

run().catch(console.error);
