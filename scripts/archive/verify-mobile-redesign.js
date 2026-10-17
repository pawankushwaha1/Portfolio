const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8835;
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
  const debuggingPort = 9435;
  const userDataDir = path.join(ROOT, '.tmp_chrome_verify_sidescroll');
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

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result?.value;
    }

    // Wait until document is ready and work element exists
    for (let i = 0; i < 40; i++) {
      const isReady = await evaluate(`(() => {
        return document.readyState === 'complete' && !!document.getElementById('work') && !!document.getElementById('swShowcaseContainer');
      })()`);
      if (isReady) break;
      await new Promise(r => setTimeout(r, 100));
    }

    // 1. Mobile Viewport (390 x 844) - iPhone 14/15/16 Pro
    console.log('Testing Mobile Viewport 390x844 Side Scroll...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    const scrollInfo = await evaluate(`(() => {
      window.dispatchEvent(new Event('resize'));
      const work = document.getElementById('work');
      const workLink = document.querySelector('.mobile-nav-link[href="#work"]') || document.querySelector('.desktop-nav a[href="#work"]');
      if (workLink) workLink.click();
      if (window.lenis && work) {
        window.lenis.scrollTo(work, { immediate: true });
      } else if (work) {
        window.scrollTo(0, work.offsetTop);
      }
      const rect = work ? work.getBoundingClientRect() : null;
      return {
        scrollY: window.scrollY,
        workTop: work ? work.offsetTop : null,
        rect
      };
    })()`);
    console.log('Scroll info:', scrollInfo);
    await new Promise(r => setTimeout(r, 800));

    // Verify initial Card 0 state
    const card0Data = await evaluate(`(() => {
      const container = document.getElementById('swShowcaseContainer');
      const slider = document.getElementById('swShowcaseSlider');
      const cards = Array.from(document.querySelectorAll('.sw-project-card'));
      const activePill = document.querySelector('.filter-pill.active');

      const c0 = cards[0];
      const c0Rect = c0 ? c0.getBoundingClientRect() : null;
      const ctnRect = container ? container.getBoundingClientRect() : null;

      return {
        cardCount: cards.length,
        isSliderRow: window.getComputedStyle(slider).flexDirection === 'row',
        containerOverflow: window.getComputedStyle(container).overflow,
        c0Visible: c0Rect ? (c0Rect.left >= 0 && c0Rect.right <= window.innerWidth) : false,
        activeCategory: activePill ? activePill.dataset.category : null,
        sliderTransform: slider.style.transform,
        highlightsCount: document.querySelectorAll('.sw-card-highlights:not([style*="display: none"])').length,
        ctnRect
      };
    })()`);
    console.log('Mobile Card 0 State:', card0Data);

    const ssCard0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_mobile_sidescroll_card1.png'), Buffer.from(ssCard0.data, 'base64'));
    console.log('Saved verify_mobile_sidescroll_card1.png');

    // Simulate side-scroll swipe to Card 1
    console.log('Side scrolling to Card 1 (LUMA)...');
    await evaluate(`(() => {
      const work = document.getElementById('work');
      if (work) work.scrollIntoView({ behavior: 'instant', block: 'start' });
      if (typeof window.setMobileWorkCard === 'function') {
        window.setMobileWorkCard(1, true);
      }
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const card1Data = await evaluate(`(() => {
      const slider = document.getElementById('swShowcaseSlider');
      const cards = Array.from(document.querySelectorAll('.sw-project-card'));
      const c1 = cards[1];
      const c1Rect = c1 ? c1.getBoundingClientRect() : null;
      const title = c1 ? c1.querySelector('.sw-card-title')?.textContent.trim() : '';

      return {
        c1Title: title,
        sliderTransform: slider.style.transform,
        c1Visible: c1Rect ? (c1Rect.left >= 0 && c1Rect.left < window.innerWidth) : false
      };
    })()`);
    console.log('Card 1 State after side scroll:', card1Data);

    const ssCard1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_mobile_sidescroll_card2.png'), Buffer.from(ssCard1.data, 'base64'));
    console.log('Saved verify_mobile_sidescroll_card2.png');

    // Test tapping category pill "UI/UX Design"
    console.log('Testing category filter tap to UI/UX Design...');
    await evaluate(`(() => {
      const work = document.getElementById('work');
      if (work) work.scrollIntoView({ behavior: 'instant', block: 'start' });
      const uiuxPill = document.querySelector('.filter-pill[data-category="uiux"]');
      if (uiuxPill) uiuxPill.click();
    })()`);
    await new Promise(r => setTimeout(r, 700));

    const uiuxData = await evaluate(`(() => {
      const slider = document.getElementById('swShowcaseSlider');
      const activePill = document.querySelector('.filter-pill.active');
      const cards = Array.from(document.querySelectorAll('.sw-project-card'));
      // Find card currently in viewport
      const visibleCard = cards.find(c => {
        const r = c.getBoundingClientRect();
        return r.left >= -50 && r.left < 200;
      });
      return {
        activeCategory: activePill ? activePill.dataset.category : null,
        visibleCardTitle: visibleCard ? visibleCard.querySelector('.sw-card-title')?.textContent.trim() : null,
        visibleCardCategory: visibleCard ? visibleCard.dataset.category : null,
        sliderTransform: slider.style.transform
      };
    })()`);
    console.log('UI/UX Side Scroll State:', uiuxData);

    const ssUIUX = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_mobile_sidescroll_uiux.png'), Buffer.from(ssUIUX.data, 'base64'));
    console.log('Saved verify_mobile_sidescroll_uiux.png');

    // 2. iPhone SE Viewport (375 x 667)
    console.log('Testing iPhone SE 375x667 Side Scroll...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true
    });
    await evaluate(`(() => {
      window.dispatchEvent(new Event('resize'));
      const work = document.getElementById('work');
      if (work) work.scrollIntoView({ behavior: 'instant', block: 'start' });
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const ssSE = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_mobile_sidescroll_iphone_se.png'), Buffer.from(ssSE.data, 'base64'));
    console.log('Saved verify_mobile_sidescroll_iphone_se.png');

    // 3. Desktop Viewport (1440 x 900)
    console.log('Testing Desktop Viewport 1440x900 Preservation...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await evaluate(`(() => {
      window.dispatchEvent(new Event('resize'));
      const work = document.getElementById('work');
      if (work) work.scrollIntoView({ behavior: 'instant', block: 'start' });
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const desktopData = await evaluate(`(() => {
      const slider = document.getElementById('swShowcaseSlider');
      const highlights = document.querySelector('.sw-card-highlights');
      return {
        isRow: window.getComputedStyle(slider).flexDirection === 'row',
        highlightsVisible: highlights ? window.getComputedStyle(highlights).display !== 'none' : false
      };
    })()`);
    console.log('Desktop 1440x900 Data:', desktopData);

    const ssDesktop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_desktop_intact_post_sidescroll.png'), Buffer.from(ssDesktop.data, 'base64'));
    console.log('Saved verify_desktop_intact_post_sidescroll.png');

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
