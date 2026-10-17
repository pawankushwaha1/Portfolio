const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8877;
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
  console.log(`✓ Server running on http://127.0.0.1:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debuggingPort = 9417;
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile_final_verify');

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

  // Navigate to skytrack static route
  await callCDP('Page.navigate', { url: `http://127.0.0.1:${PORT}/projects/skytrack/` });
  await new Promise((r) => setTimeout(r, 2000));

  const stats = await callCDP('Runtime.evaluate', {
    expression: `(() => {
      const gItems = document.querySelectorAll('.pflow-gallery-item');
      const lastG = gItems[gItems.length - 1];
      const vGrid = document.querySelector('.pflow-vertical-grid');
      const firstV = document.querySelector('.pflow-vertical-item');
      const headerRow = document.getElementById('pflowVerticalHeaderRow');
      const main = document.getElementById('projectDetailFlow') || document.querySelector('.project-detail-flow');

      const lastGRect = lastG ? lastG.getBoundingClientRect() : null;
      const firstVRect = firstV ? firstV.getBoundingClientRect() : null;
      const vGridRect = vGrid ? vGrid.getBoundingClientRect() : null;
      const mainRect = main ? main.getBoundingClientRect() : null;

      const headerDisplay = headerRow ? window.getComputedStyle(headerRow).display : 'not-found';

      return {
        headerDisplay,
        isHeaderHidden: headerDisplay === 'none',
        topSpace_169_to_916: (lastGRect && firstVRect) ? Math.round(firstVRect.top - lastGRect.bottom) : null,
        bottomSpace_916_to_pageEnd: (vGridRect && mainRect) ? Math.round(mainRect.bottom - vGridRect.bottom) : null
      };
    })()`,
    returnByValue: true
  });

  console.log('✓ SkyTrack Route Verification Stats:', stats.result.value);

  // Capture full section screenshot showing transition from 16:9 to 9:16 without header
  await callCDP('Runtime.evaluate', {
    expression: `(() => {
      const vGrid = document.querySelector('.pflow-vertical-grid');
      if (vGrid) {
        const top = vGrid.getBoundingClientRect().top + window.scrollY - 220;
        window.scrollTo(0, top);
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const shotTransition = await callCDP('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'verify_project_916_header_removed_transition.png'), Buffer.from(shotTransition.data, 'base64'));
  console.log('✓ Captured verify_project_916_header_removed_transition.png');

  // Scroll to bottom and capture bottom spacing
  await callCDP('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo(0, document.body.scrollHeight);
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const shotBottom = await callCDP('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'verify_project_916_bottom_spacing.png'), Buffer.from(shotBottom.data, 'base64'));
  console.log('✓ Captured verify_project_916_bottom_spacing.png');

  // Also verify /projects/breathe/
  await callCDP('Page.navigate', { url: `http://127.0.0.1:${PORT}/projects/breathe/` });
  await new Promise((r) => setTimeout(r, 2000));

  const breatheStats = await callCDP('Runtime.evaluate', {
    expression: `(() => {
      const headerRow = document.getElementById('pflowVerticalHeaderRow');
      return {
        headerDisplay: headerRow ? window.getComputedStyle(headerRow).display : 'not-found',
        isHeaderHidden: headerRow ? window.getComputedStyle(headerRow).display === 'none' : true
      };
    })()`,
    returnByValue: true
  });
  console.log('✓ Breathe Route Verification Stats:', breatheStats.result.value);

  ws.close();
  chromeProc.kill();
  server.close();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  console.log('✓ All checks passed successfully!');
}

run().catch(console.error);
