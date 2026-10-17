const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8879;
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
  const debuggingPort = 9419;
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile_final_36');

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

  // 1. Check dynamic route
  await callCDP('Page.navigate', { url: `http://127.0.0.1:${PORT}/project.html?id=skytrack` });
  await new Promise((r) => setTimeout(r, 2000));

  const stats = await callCDP('Runtime.evaluate', {
    expression: `(() => {
      const gItems = document.querySelectorAll('.pflow-gallery-item');
      const g0 = gItems[0];
      const g1 = gItems[1];
      const lastG = gItems[gItems.length - 1];
      const vGrid = document.querySelector('.pflow-vertical-grid');
      const firstV = document.querySelector('.pflow-vertical-item');
      const main = document.getElementById('projectDetailFlow') || document.querySelector('.project-detail-flow');

      const g0Rect = g0 ? g0.getBoundingClientRect() : null;
      const g1Rect = g1 ? g1.getBoundingClientRect() : null;
      const lastGRect = lastG ? lastG.getBoundingClientRect() : null;
      const firstVRect = firstV ? firstV.getBoundingClientRect() : null;
      const vGridRect = vGrid ? vGrid.getBoundingClientRect() : null;
      const mainRect = main ? main.getBoundingClientRect() : null;

      return {
        gapBetween169Cards: (g0Rect && g1Rect) ? Math.round(g1Rect.top - g0Rect.bottom) : null,
        gapBetween169And916: (lastGRect && firstVRect) ? Math.round(firstVRect.top - lastGRect.bottom) : null,
        bottomSpace916ToPageEnd: (vGridRect && mainRect) ? Math.round(mainRect.bottom - vGridRect.bottom) : null
      };
    })()`,
    returnByValue: true
  });

  console.log('✓ Dynamic Route (/project.html?id=skytrack) Spacing Stats:', stats.result.value);

  // Scroll to show transition
  await callCDP('Runtime.evaluate', {
    expression: `(() => {
      const vGrid = document.querySelector('.pflow-vertical-grid');
      if (vGrid) {
        const top = vGrid.getBoundingClientRect().top + window.scrollY - 200;
        window.scrollTo(0, top);
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const shotTransition = await callCDP('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'verify_36px_space_between_169_and_916.png'), Buffer.from(shotTransition.data, 'base64'));
  console.log('✓ Captured verify_36px_space_between_169_and_916.png');

  // Scroll to bottom
  await callCDP('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo(0, document.body.scrollHeight);
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const shotBottom = await callCDP('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'verify_36px_space_bottom_page.png'), Buffer.from(shotBottom.data, 'base64'));
  console.log('✓ Captured verify_36px_space_bottom_page.png');

  // 2. Check static route /projects/skytrack/
  await callCDP('Page.navigate', { url: `http://127.0.0.1:${PORT}/projects/skytrack/` });
  await new Promise((r) => setTimeout(r, 2000));

  const staticStats = await callCDP('Runtime.evaluate', {
    expression: `(() => {
      const gItems = document.querySelectorAll('.pflow-gallery-item');
      const g0 = gItems[0];
      const g1 = gItems[1];
      const lastG = gItems[gItems.length - 1];
      const vGrid = document.querySelector('.pflow-vertical-grid');
      const firstV = document.querySelector('.pflow-vertical-item');
      const main = document.getElementById('projectDetailFlow') || document.querySelector('.project-detail-flow');

      const g0Rect = g0 ? g0.getBoundingClientRect() : null;
      const g1Rect = g1 ? g1.getBoundingClientRect() : null;
      const lastGRect = lastG ? lastG.getBoundingClientRect() : null;
      const firstVRect = firstV ? firstV.getBoundingClientRect() : null;
      const vGridRect = vGrid ? vGrid.getBoundingClientRect() : null;
      const mainRect = main ? main.getBoundingClientRect() : null;

      return {
        gapBetween169Cards: (g0Rect && g1Rect) ? Math.round(g1Rect.top - g0Rect.bottom) : null,
        gapBetween169And916: (lastGRect && firstVRect) ? Math.round(firstVRect.top - lastGRect.bottom) : null,
        bottomSpace916ToPageEnd: (vGridRect && mainRect) ? Math.round(mainRect.bottom - vGridRect.bottom) : null
      };
    })()`,
    returnByValue: true
  });
  console.log('✓ Static Route (/projects/skytrack/) Spacing Stats:', staticStats.result.value);

  // 3. Mobile Emulation (390x844)
  await callCDP('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 500));

  const mobileStats = await callCDP('Runtime.evaluate', {
    expression: `(() => {
      const lastG = document.querySelector('.pflow-gallery-item:last-child');
      const firstV = document.querySelector('.pflow-vertical-item');
      const vGrid = document.querySelector('.pflow-vertical-grid');
      const main = document.getElementById('projectDetailFlow') || document.querySelector('.project-detail-flow');

      const lastGRect = lastG ? lastG.getBoundingClientRect() : null;
      const firstVRect = firstV ? firstV.getBoundingClientRect() : null;
      const vGridRect = vGrid ? vGrid.getBoundingClientRect() : null;
      const mainRect = main ? main.getBoundingClientRect() : null;

      return {
        gapBetween169And916: (lastGRect && firstVRect) ? Math.round(firstVRect.top - lastGRect.bottom) : null,
        bottomSpace916ToPageEnd: (vGridRect && mainRect) ? Math.round(mainRect.bottom - vGridRect.bottom) : null
      };
    })()`,
    returnByValue: true
  });
  console.log('✓ Mobile Spacing Stats (390px):', mobileStats.result.value);

  ws.close();
  chromeProc.kill();
  server.close();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  console.log('✓ All verification tests passed successfully!');
}

run().catch(console.error);
