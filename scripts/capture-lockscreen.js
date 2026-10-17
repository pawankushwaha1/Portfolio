const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9557;
const ARTIFACT_DIR = path.resolve('C:\\Users\\kushw\\.gemini\\antigravity\\brain\\f0cdb6f4-1b77-4670-8973-104becbc507e');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
            if (page && page.webSocketDebuggerUrl) {
              resolve(page.webSocketDebuggerUrl);
            } else {
              if (attempts > 30) return reject(new Error('Page target not found'));
              setTimeout(check, 200);
            }
          } catch (e) {
            if (attempts > 30) return reject(e);
            setTimeout(check, 200);
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

    ws.onopen = () => {
      resolve({
        send(method, params = {}) {
          return new Promise((res, rej) => {
            const id = nextId++;
            pending.set(id, { res, rej });
            ws.send(JSON.stringify({ id, method, params }));
          });
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
        }
      } catch (e) {}
    };
  });
}

(async () => {
  const tmpDir = path.join(__dirname, '..', '.tmp_chrome_lockscreen');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  try {
    const wsUrl = await getPageWsUrl(PORT);
    const cdp = await createCdpClient(wsUrl);

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    // Emulate iPhone 14 / modern smartphone (390 x 844, touch)
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      fitWindow: false
    });

    // 1. Visit index.html with restriction ON
    await cdp.send('Page.navigate', { url: 'http://localhost:8000/index.html' });
    await sleep(1500);

    // Ensure localStorage does not have mobile-allowed
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        localStorage.removeItem('portfolio_mobile_override');
        localStorage.removeItem('portfolio_mobile_allowed');
        document.documentElement.classList.remove('mobile-allowed');
        if (window.PortfolioComponents && window.PortfolioComponents.DeviceRestriction) {
          window.PortfolioComponents.DeviceRestriction.update();
        }
      })()`,
      awaitPromise: true
    });
    await sleep(1000);

    // Capture screenshot of mobile lock screen
    const snap1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_lockscreen_exact_match.png'), Buffer.from(snap1.data, 'base64'));
    console.log('Saved mobile_lockscreen_exact_match.png');

    // 2. Visit admin.html in desktop mode (1280x900)
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await cdp.send('Page.navigate', { url: 'http://localhost:8000/admin.html' });
    await sleep(1500);

    // Authenticate admin session
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        sessionStorage.setItem('portfolio_admin_session', 'authenticated_' + Date.now());
        const auth = document.getElementById('authOverlay');
        const adminApp = document.getElementById('adminApp');
        if (auth) auth.classList.add('hidden');
        if (adminApp) adminApp.classList.remove('hidden');
        if (typeof refreshAllPanels === 'function') refreshAllPanels();
      })()`,
      awaitPromise: true
    });
    await sleep(800);

    // Switch to tab 2 (Appearance & Customization)
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const tabBtn = document.querySelector('[data-tab="customization"]');
        if (tabBtn) tabBtn.click();
      })()`,
      awaitPromise: true
    });
    await sleep(800);

    // Scroll to #cardMobileRestriction
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.getElementById('cardMobileRestriction');
        if (card) card.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });
    await sleep(600);

    const snap2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'admin_lockscreen_updated_presets.png'), Buffer.from(snap2.data, 'base64'));
    console.log('Saved admin_lockscreen_updated_presets.png');

    // Open lock screen modal preview
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btnPreviewLockScreenModal');
        if (btn) btn.click();
      })()`
    });
    await sleep(800);

    const snap3 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'admin_modal_lockscreen_exact.png'), Buffer.from(snap3.data, 'base64'));
    console.log('Saved admin_modal_lockscreen_exact.png');

    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch(e) {}
  }
})();
