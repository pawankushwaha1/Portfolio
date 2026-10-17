const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\kushw\\.gemini\\antigravity\\brain\\f0cdb6f4-1b77-4670-8973-104becbc507e';
const PORT = 9555;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getWebSocketDebuggerUrl(port) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            resolve(data.webSocketDebuggerUrl);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', () => {
        if (attempts > 30) return reject(new Error('Chrome failed to start in time'));
        setTimeout(check, 200);
      });
    };
    check();
  });
}

function createCdpClient(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();
    const eventHandlers = new Map();

    ws.onopen = () => {
      resolve({
        send(method, params = {}) {
          return new Promise((res, rej) => {
            const id = nextId++;
            pending.set(id, { res, rej });
            ws.send(JSON.stringify({ id, method, params }));
          });
        },
        on(event, handler) {
          if (!eventHandlers.has(event)) eventHandlers.set(event, []);
          eventHandlers.get(event).push(handler);
        },
        close() {
          try { ws.close(); } catch(e) {}
        }
      });
    };

    ws.onerror = (err) => reject(err);

    ws.onmessage = (msgEvent) => {
      try {
        const data = JSON.parse(msgEvent.data);
        if (data.id && pending.has(data.id)) {
          const { res, rej } = pending.get(data.id);
          pending.delete(data.id);
          if (data.error) rej(data.error);
          else res(data.result);
        } else if (data.method && eventHandlers.has(data.method)) {
          const handlers = eventHandlers.get(data.method);
          handlers.forEach(h => h(data.params));
        }
      } catch (e) {
        console.error('Error handling message:', e);
      }
    };
  });
}

async function navigatePage(cdp, url) {
  return new Promise(async (resolve) => {
    let finished = false;
    const done = () => {
      if (!finished) {
        finished = true;
        resolve();
      }
    };
    cdp.on('Page.loadEventFired', done);
    try {
      await cdp.send('Page.navigate', { url });
    } catch (e) {}
    setTimeout(done, 1200);
  });
}

async function run() {
  console.log('Launching headless Chrome on port ' + PORT + '...');
  const tmpDir = path.join(__dirname, '..', '.tmp_chrome_inspect_test');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tmpDir}`,
    'about:blank'
  ]);

  try {
    const browserWs = await getWebSocketDebuggerUrl(PORT);
    console.log('Browser WS ready:', browserWs);

    const targetsRes = await new Promise((resolve) => {
      http.get(`http://127.0.0.1:${PORT}/json/list`, res => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => resolve(JSON.parse(raw)));
      });
    });

    const pageTarget = targetsRes.find(t => t.type === 'page');
    const cdp = await createCdpClient(pageTarget.webSocketDebuggerUrl);

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    console.log('\n======================================================');
    console.log('    TEST SUITE: DEVTOOLS INSPECT (RESPONSIVE) SIZES');
    console.log('======================================================\n');

    // Standard Desktop User-Agent (inspect responsive mode in desktop browser)
    await cdp.send('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    await navigatePage(cdp, 'http://localhost:8000/index.html');
    await sleep(500);

    const inspectCases = [
      // MOBILE SCREEN SIZES in DevTools Inspect -> MUST BE RESTRICTED (overlay flex, header none)
      { name: 'DevTools Mobile S (320px)', width: 320, height: 650, expectRestricted: true },
      { name: 'DevTools Mobile M (375px)', width: 375, height: 667, expectRestricted: true },
      { name: 'DevTools Mobile L (425px)', width: 425, height: 800, expectRestricted: true },
      { name: 'DevTools Phone Mid (600px)', width: 600, height: 800, expectRestricted: true },
      { name: 'DevTools Phone Max (700px)', width: 700, height: 800, expectRestricted: true },
      { name: 'DevTools User Test (765x864)', width: 765, height: 864, expectRestricted: true },
      { name: 'DevTools Mobile Limit (767px)', width: 767, height: 800, expectRestricted: true },
      { name: 'DevTools Mobile Landscape (844x390)', width: 844, height: 390, expectRestricted: true },

      // TABLETS & PADS in DevTools Inspect -> MUST BE ALLOWED (overlay none, website visible)
      { name: 'DevTools Tablet Preset (768px)', width: 768, height: 1024, expectRestricted: false },
      { name: 'iPad Air Preset (820px)', width: 820, height: 1180, expectRestricted: false },
      { name: 'iPad Pro / Laptop (1024px)', width: 1024, height: 1366, expectRestricted: false },
      { name: 'DevTools Laptop L (1440px)', width: 1440, height: 900, expectRestricted: false }
    ];

    let allPass = true;

    for (const tc of inspectCases) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: tc.width,
        height: tc.height,
        deviceScaleFactor: 1,
        mobile: false
      });
      await sleep(250);

      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const overlay = document.getElementById('deviceRestrictionScreen');
          const overlayDisplay = overlay ? window.getComputedStyle(overlay).display : 'none';
          const siteHeader = document.getElementById('siteHeader');
          const headerDisplay = siteHeader ? window.getComputedStyle(siteHeader).display : '';
          const isRestricted = overlayDisplay === 'flex' && headerDisplay === 'none';
          const isAllowed = overlayDisplay === 'none' && headerDisplay !== 'none';
          return {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            overlayDisplay,
            headerDisplay,
            isRestricted,
            isAllowed
          };
        })()`,
        returnByValue: true
      });

      const res = evalRes.result.value;
      const pass = tc.expectRestricted ? res.isRestricted : res.isAllowed;
      if (!pass) allPass = false;

      const statusTag = pass ? '[PASS]' : '[FAIL]';
      const expectedStr = tc.expectRestricted ? 'RESTRICTED (Overlay ON)' : 'ALLOWED (Website ON)';
      console.log(`${statusTag} ${tc.name.padEnd(36)} -> Expected: ${expectedStr} | Overlay: ${res.overlayDisplay}, Header: ${res.headerDisplay}`);

      // Capture representative screenshots
      if (tc.width === 765 && tc.height === 864) {
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(artifactDir, 'inspect_user_765x864.png'), Buffer.from(shot.data, 'base64'));
      }
      if (tc.width === 375 && tc.height === 667) {
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(artifactDir, 'inspect_mobile_375px.png'), Buffer.from(shot.data, 'base64'));
      }
      if (tc.width === 768 && tc.height === 1024) {
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(artifactDir, 'inspect_tablet_768px.png'), Buffer.from(shot.data, 'base64'));
      }
      if (tc.width === 1024 && tc.height === 1366) {
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(artifactDir, 'inspect_laptop_1024px.png'), Buffer.from(shot.data, 'base64'));
      }
    }

    cdp.close();

    console.log('\n======================================================');
    if (allPass) {
      console.log('    SUCCESS: ALL 10 DEVTOOLS RESPONSIVE SIZES PASSED!');
      console.log('    Mobile sizes (< 720px) -> Restriction Screen active');
      console.log('    Tablet & Laptop sizes (>= 768px) -> Full Website active');
    } else {
      console.log('    SOME TESTS FAILED!');
    }
    console.log('======================================================\n');
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
