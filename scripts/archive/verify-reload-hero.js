const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8765;
const ROOT = path.resolve(__dirname, '..');

// 1. Static HTTP Server
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
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

async function run() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✓ Test server running on http://127.0.0.1:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debuggingPort = 9333;
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile');

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
    // Wait for Chrome CDP endpoint
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

    if (!versionData) {
      throw new Error('Failed to connect to Chrome DevTools endpoint');
    }

    const newTabResp = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?http://127.0.0.1:${PORT}/index.html`, { method: 'PUT' });
    const tabData = await newTabResp.json();
    const wsUrl = tabData.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
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

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result ? res.result.value : undefined;
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('\n=== TEST 1: Navigate to project/modu-bottle and click "Back to Work" ===');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/projects/modu-bottle/index.html` });
    await new Promise(r => setTimeout(r, 1200));

    // Verify on project page
    const projectTitle = await evaluate('document.title');
    console.log(`✓ Project page loaded: "${projectTitle}"`);

    // Capture project bottom to verify bottom nav has been completely removed
    await evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await new Promise(r => setTimeout(r, 600));
    const artifactDir = 'C:\\Users\\kushw\\.gemini\\antigravity\\brain\\f0cdb6f4-1b77-4670-8973-104becbc507e';
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'project_bottom_cleaned.png'), Buffer.from(shot.data, 'base64'));
    console.log('✓ Project bottom screenshot captured');
    await evaluate('window.scrollTo(0, 0)');
    await new Promise(r => setTimeout(r, 300));

    // Click "Back to Work" button
    console.log('-> Clicking "Back to Work" button...');
    await evaluate(`document.getElementById('projectBackBtn').click()`);
    await new Promise(r => setTimeout(r, 1500));

    // Check URL and active card in #work
    const returnUrl = await evaluate('window.location.href');
    const returnPath = await evaluate('window.location.pathname');
    const returnSearch = await evaluate('window.location.search');
    const returnHash = await evaluate('window.location.hash');
    const currentCardIdx = await evaluate('window.workShowcaseSlider ? window.workShowcaseSlider.getCurrentIndex() : -1');
    const currentCardTitle = await evaluate(`
      (() => {
        const idx = window.workShowcaseSlider ? window.workShowcaseSlider.getCurrentIndex() : -1;
        const allCards = document.querySelectorAll('.sw-project-card');
        return (allCards && allCards[idx]) ? allCards[idx].querySelector('.sw-card-title')?.textContent.trim() : null;
      })()
    `);
    const scrollYAfterReturn = await evaluate('window.scrollY');
    const currentSectionIdx = await evaluate('window.portfolioGetCurrentIndex ? window.portfolioGetCurrentIndex() : -1');

    console.log(`✓ Return URL: ${returnUrl}`);
    console.log(`✓ Search Query: "${returnSearch}" (expected: empty or stripped)`);
    console.log(`✓ Hash: "${returnHash}" (expected: #work)`);
    console.log(`✓ Active Card Index: ${currentCardIdx} (title: "${currentCardTitle}")`);
    console.log(`✓ Section Index: ${currentSectionIdx} (expected: 1 for Work)`);
    console.log(`✓ Scroll Y: ${scrollYAfterReturn}px (> 0)`);

    if (returnSearch !== '') {
      console.error(`❌ Search query was not cleaned up! Still contains: "${returnSearch}"`);
      process.exitCode = 1;
    } else {
      console.log('✅ URL search query was cleanly stripped upon arrival!');
    }

    console.log('\n=== TEST 2: User scrolls to Hero section and then hits REFRESH ===');
    // Simulate user scrolling up to Hero section
    await evaluate(`
      window.scrollTo(0, 0);
      if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
      if (window.portfolioGoToSection) window.portfolioGoToSection(0, true);
      if (window.portfolioUpdateActiveStates) window.portfolioUpdateActiveStates(0);
    `);
    await new Promise(r => setTimeout(r, 600));

    async function captureScreenshot(name) {
      const artifactDir = 'C:\\Users\\kushw\\.gemini\\antigravity\\brain\\f0cdb6f4-1b77-4670-8973-104becbc507e';
      const outPath = path.join(artifactDir, name);
      const res = await send('Page.captureScreenshot', { format: 'png' });
      if (res && res.data) {
        fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
        console.log(`✓ Screenshot saved to artifact: ${outPath}`);
      }
    }

    const heroScrollYBeforeReload = await evaluate('window.scrollY');
    const heroSectionIdxBeforeReload = await evaluate('window.portfolioGetCurrentIndex ? window.portfolioGetCurrentIndex() : -1');
    const heroHashBeforeReload = await evaluate('window.location.hash');
    console.log(`Before reload: scrollY=${heroScrollYBeforeReload}, sectionIdx=${heroSectionIdxBeforeReload}, hash=${heroHashBeforeReload}`);

    console.log('-> Triggering Page.reload (F5)...');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 2000));

    await captureScreenshot('hero_after_reload_verified.png');

    const scrollYAfterReload = await evaluate('window.scrollY');
    const sectionIdxAfterReload = await evaluate('window.portfolioGetCurrentIndex ? window.portfolioGetCurrentIndex() : -1');
    const hashAfterReload = await evaluate('window.location.hash');
    const heroPanelActive = await evaluate(`document.getElementById('hero')?.classList.contains('is-active')`);

    console.log(`✓ Scroll Y after reload: ${scrollYAfterReload} (expected: 0)`);
    console.log(`✓ Section Index after reload: ${sectionIdxAfterReload} (expected: 0 for Hero)`);
    console.log(`✓ Hash after reload: "${hashAfterReload}" (expected: empty or #hero)`);
    console.log(`✓ Hero Panel is-active: ${heroPanelActive} (expected: true)`);

    if (scrollYAfterReload === 0 && sectionIdxAfterReload === 0 && heroPanelActive) {
      console.log('✅ PASS: Refreshing from Hero section stays 100% on Hero section (no jump to project card)!');
    } else {
      console.error('❌ FAIL: Screen jumped away from Hero section on reload!');
      process.exitCode = 1;
    }

    console.log('\n=== TEST 3: User is inside Selected Work section and hits REFRESH ===');
    // Navigate back to project analog, click Back to work, stay in work section
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/projects/analog/index.html` });
    await new Promise(r => setTimeout(r, 1200));
    await evaluate(`document.getElementById('projectBackBtn').click()`);
    await new Promise(r => setTimeout(r, 1500));

    const analogScrollY = await evaluate('window.scrollY');
    console.log(`User is at analog card in Work section (scrollY=${analogScrollY}px).`);
    console.log('-> User hits REFRESH directly while in Work section...');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 2000));

    await captureScreenshot('hero_after_work_reload_verified.png');

    const scrollYAfterDirectReload = await evaluate('window.scrollY');
    const sectionIdxAfterDirectReload = await evaluate('window.portfolioGetCurrentIndex ? window.portfolioGetCurrentIndex() : -1');
    const heroPanelActiveDirect = await evaluate(`document.getElementById('hero')?.classList.contains('is-active')`);

    console.log(`✓ Scroll Y after direct reload: ${scrollYAfterDirectReload} (expected: 0)`);
    console.log(`✓ Section Index after direct reload: ${sectionIdxAfterDirectReload} (expected: 0 for Hero)`);
    console.log(`✓ Hero Panel is-active: ${heroPanelActiveDirect} (expected: true)`);

    if (scrollYAfterDirectReload === 0 && sectionIdxAfterDirectReload === 0 && heroPanelActiveDirect) {
      console.log('✅ PASS: Refreshing always resets to Hero section as requested!');
    } else {
      console.error('❌ FAIL: Refresh did not reset to Hero section!');
      process.exitCode = 1;
    }

    ws.close();
  } finally {
    chromeProc.kill();
    server.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

run().catch((err) => {
  console.error('Error during test execution:', err);
  process.exit(1);
});
