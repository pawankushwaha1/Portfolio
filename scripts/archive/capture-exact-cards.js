const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8788;
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
  const debuggingPort = 9358;
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile_cards_exact');

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

    await new Promise(r => setTimeout(r, 2000));

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

    // Set custom category data: Category 3 -> "Brand Design"
    await evaluate(`
      (function() {
        const d = PortfolioData.get();
        d.customization = d.customization || {};
        d.customization.categoryFilters = {
          enabled: true,
          productName: 'Product Design',
          uiuxName: 'UI/UX Design',
          graphicName: 'Brand Design',
          suffix: 'Projects'
        };
        PortfolioData.save(d);
      })()
    `);

    await send('Page.reload');
    await new Promise(r => setTimeout(r, 1200));

    // Scroll to work section and move slider to movie-time (Category 3)
    await evaluate(`
      (function() {
        const work = document.getElementById('work');
        if (work) {
          if (window.lenis) {
            window.lenis.scrollTo(work, { immediate: true });
          } else {
            window.scrollTo(0, work.offsetTop);
          }
        }
        if (window.workShowcaseSlider) {
          window.workShowcaseSlider.goToSlug('movie-time', true);
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    // Get position of the active card
    const movieRect = await evaluate(`
      (function() {
        const card = document.querySelector('.sw-project-card[data-slug="movie-time"]');
        if (!card) return null;
        card.scrollIntoView({ block: 'center', inline: 'center' });
        const meta = card.querySelector('.sw-card-meta');
        if (!meta) return null;
        const r = meta.getBoundingClientRect();
        return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.width + 20, height: r.height + 20, scale: 1 };
      })()
    `);

    console.log('movieRect:', movieRect);

    if (movieRect) {
      const shot = await send('Page.captureScreenshot', { format: 'png', clip: movieRect });
      fs.writeFileSync(path.join(artifactDir, 'verify_brand_design_card_updated_category.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured verify_brand_design_card_updated_category.png');
    }

    // Now test BREATHE card
    await evaluate(`
      (function() {
        if (window.workShowcaseSlider) {
          window.workShowcaseSlider.goToSlug('breathe', true);
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    const breatheRect = await evaluate(`
      (function() {
        const card = document.querySelector('.sw-project-card[data-slug="breathe"]');
        if (!card) return null;
        card.scrollIntoView({ block: 'center', inline: 'center' });
        const meta = card.querySelector('.sw-card-meta');
        if (!meta) return null;
        const r = meta.getBoundingClientRect();
        return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.width + 20, height: r.height + 20, scale: 1 };
      })()
    `);

    console.log('breatheRect:', breatheRect);

    if (breatheRect) {
      const shot = await send('Page.captureScreenshot', { format: 'png', clip: breatheRect });
      fs.writeFileSync(path.join(artifactDir, 'verify_breathe_card_updated_category.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured verify_breathe_card_updated_category.png');
    }

    // Clean reset
    await evaluate(`localStorage.removeItem('portfolio_custom_data');`);
    console.log('✓ Cleaned up.');

  } finally {
    try { chromeProc.kill(); } catch (e) {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

run().catch(console.error);
