const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8820;
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
  console.log(`Server listening on port ${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debuggingPort = 9410;
  const userDataDir = path.join(ROOT, '.tmp_chrome_verify_image_first');
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debuggingPort}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  try {
    for (let i = 0; i < 30; i++) {
      try {
        const resp = await fetch(`http://127.0.0.1:${debuggingPort}/json/version`);
        if (resp.ok) break;
      } catch (e) {}
      await new Promise(r => setTimeout(r, 100));
    }

    const newTabResp = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?http://127.0.0.1:${PORT}/index.html`, { method: 'PUT' });
    const tabData = await newTabResp.json();
    const ws = new WebSocket(tabData.webSocketDebuggerUrl);

    let msgId = 1;
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
    await new Promise(r => ws.onopen = r);

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return res.result?.value;
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Wait for page to initialize and populate slides
    await new Promise(r => setTimeout(r, 2000));

    // Scroll to #work section
    await evaluate(`
      const work = document.getElementById('work');
      if (work) work.scrollIntoView({ behavior: 'instant', block: 'start' });
    `);
    await new Promise(r => setTimeout(r, 800));

    // Inspect Card 1 properties
    const cardData = await evaluate(`
      (() => {
        const firstCard = document.querySelector('.sw-project-card');
        if (!firstCard) return { error: 'No card found' };
        const title = firstCard.querySelector('.sw-card-title')?.textContent?.trim();
        const cat = firstCard.querySelector('.sw-card-category-pill')?.textContent?.trim();
        const desc = firstCard.querySelector('.sw-card-desc')?.textContent?.trim();
        const highlights = Array.from(firstCard.querySelectorAll('.sw-highlight-item')).map(h => ({
          label: h.querySelector('.sw-highlight-label')?.textContent?.trim(),
          hasIcon: !!h.querySelector('.sw-highlight-icon svg')
        }));
        const ctaText = firstCard.querySelector('.sw-cta-label')?.textContent?.trim();
        const bgImg = firstCard.querySelector('.sw-card-bg-media')?.src;
        const rect = firstCard.getBoundingClientRect();
        return { title, cat, desc, highlights, ctaText, bgImg, rect };
      })()
    `);
    console.log('Card 1 Verified Data:', JSON.stringify(cardData, null, 2));

    // Capture screenshot of desktop Selected Work (Card 1: Kinetic Chair)
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    const p1 = path.join(artifactDir, 'verify_image_first_card1_kinetic.png');
    fs.writeFileSync(p1, Buffer.from(ss1.data, 'base64'));
    console.log(`Saved screenshot 1 to: ${p1}`);

    // Now test hover on Card 1
    const hoverData = await evaluate(`
      (() => {
        const card = document.querySelector('.sw-project-card');
        const img = card.querySelector('.sw-card-bg-media');
        const arrow = card.querySelector('.sw-cta-circle svg');
        // trigger pointerenter
        card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        return {
          cardWidth: card.offsetWidth,
          cardHeight: card.offsetHeight
        };
      })()
    `);
    console.log('Hover triggered:', hoverData);
    await new Promise(r => setTimeout(r, 500));

    const ssHover = await send('Page.captureScreenshot', { format: 'png' });
    const pHover = path.join(artifactDir, 'verify_image_first_hover.png');
    fs.writeFileSync(pHover, Buffer.from(ssHover.data, 'base64'));
    console.log(`Saved screenshot hover to: ${pHover}`);

    // Now navigate or slide to Wellness Journey card
    const wellnessSlideResult = await evaluate(`
      (() => {
        const slider = document.getElementById('swShowcaseSlider');
        const cards = Array.from(slider.querySelectorAll('.sw-project-card'));
        const wIdx = cards.findIndex(c => (c.dataset.slug === 'wellness-journey' || c.dataset.id === 'wellness-journey'));
        if (wIdx >= 0) {
          const cardGap = 36;
          slider.style.transform = 'translateX(calc(-' + (wIdx * 100) + '% - ' + (wIdx * cardGap) + 'px))';
          const wCard = cards[wIdx];
          return {
            found: true,
            index: wIdx,
            title: wCard.querySelector('.sw-card-title')?.textContent?.trim(),
            cat: wCard.querySelector('.sw-card-category-pill')?.textContent?.trim(),
            desc: wCard.querySelector('.sw-card-desc')?.textContent?.trim(),
            highlights: Array.from(wCard.querySelectorAll('.sw-highlight-item')).map(h => ({
              label: h.querySelector('.sw-highlight-label')?.textContent?.trim(),
              hasIcon: !!h.querySelector('.sw-highlight-icon svg')
            })),
            ctaText: wCard.querySelector('.sw-cta-label')?.textContent?.trim(),
            bgImg: wCard.querySelector('.sw-card-bg-media')?.src
          };
        }
        return { found: false, count: cards.length };
      })()
    `);
    console.log('Wellness Journey Slide Result:', JSON.stringify(wellnessSlideResult, null, 2));
    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot of Wellness Journey card
    const ssWellness = await send('Page.captureScreenshot', { format: 'png' });
    const pWellness = path.join(artifactDir, 'verify_image_first_wellness_journey.png');
    fs.writeFileSync(pWellness, Buffer.from(ssWellness.data, 'base64'));
    console.log(`Saved screenshot Wellness Journey to: ${pWellness}`);

    // Test Mobile Viewport (390 x 844)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await evaluate(`
      window.dispatchEvent(new Event('resize'));
      const work = document.getElementById('work');
      if (window.lenis) {
        window.lenis.scrollTo(work, { immediate: true });
      } else if (work) {
        window.scrollTo(0, work.offsetTop);
      }
    `);
    await new Promise(r => setTimeout(r, 1200));

    const ssMobile = await send('Page.captureScreenshot', { format: 'png' });
    const pMobile = path.join(artifactDir, 'verify_image_first_mobile.png');
    fs.writeFileSync(pMobile, Buffer.from(ssMobile.data, 'base64'));
    console.log(`Saved screenshot Mobile to: ${pMobile}`);

    ws.close();
  } finally {
    chromeProc.kill();
    server.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
