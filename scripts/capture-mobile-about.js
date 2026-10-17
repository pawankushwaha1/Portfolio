const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9558;
const ARTIFACT_DIR = path.resolve('C:\\Users\\kushw\\.gemini\\antigravity\\brain\\f0cdb6f4-1b77-4670-8973-104becbc507e');

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
      } catch (e) {}
    };
  });
}

async function run() {
  const tmpDir = path.join(__dirname, '..', '.tmp_chrome_about_' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });

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
    await getWebSocketDebuggerUrl(PORT);
    const targetsRes = await new Promise((resolve) => {
      http.get(`http://127.0.0.1:${PORT}/json/list`, res => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => resolve(JSON.parse(raw)));
      });
    });

    const pageTarget = targetsRes.find(t => t.type === 'page');
    const client = await createCdpClient(pageTarget.webSocketDebuggerUrl);

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    console.log('1. Testing Mobile View (390 x 844)...');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await client.send('Page.navigate', { url: 'http://localhost:8000/index.html' });
    await sleep(1500);

    // Allow mobile view via mobileRestriction.enabled = false & reload to test
    await client.send('Runtime.evaluate', {
      expression: `
        const customData = JSON.parse(localStorage.getItem('portfolio_custom_data') || '{}');
        if (!customData.customization) customData.customization = {};
        if (!customData.customization.mobileRestriction) customData.customization.mobileRestriction = {};
        customData.customization.mobileRestriction.enabled = false;
        localStorage.setItem('portfolio_custom_data', JSON.stringify(customData));
        document.documentElement.classList.add('mobile-allowed');
        location.reload();
      `
    });
    await sleep(2000);

    // Scroll to #about section and activate in-view
    await client.send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('about');
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
          el.classList.add('is-in-view');
        }
      `
    });
    await sleep(1000);

    // Capture mobile full screen
    const mobileScreen = await client.send('Page.captureScreenshot', { format: 'png' });
    const mobilePath = path.join(ARTIFACT_DIR, 'mobile_about_redesign_full.png');
    fs.writeFileSync(mobilePath, Buffer.from(mobileScreen.data, 'base64'));
    console.log('Saved:', mobilePath);

    // Capture just the About card element clip
    const evalRes = await client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const card = document.querySelector('#about .about-grid');
          if (!card) return null;
          const rect = card.getBoundingClientRect();
          return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
        })()
      `,
      returnByValue: true
    });

    if (evalRes && evalRes.value) {
      const rect = evalRes.value;
      console.log('About card rect on mobile:', rect);
      const cardClip = await client.send('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: Math.max(0, rect.x - 8),
          y: Math.max(0, rect.y - 8),
          width: rect.width + 16,
          height: rect.height + 16,
          scale: 1
        }
      });
      const cardPath = path.join(ARTIFACT_DIR, 'mobile_about_redesign_card.png');
      fs.writeFileSync(cardPath, Buffer.from(cardClip.data, 'base64'));
      console.log('Saved card clip:', cardPath);
    }

    // 2. Test Desktop View (1280 x 800) to ensure desktop is preserved
    console.log('2. Testing Desktop View (1280 x 800)...');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(800);

    await client.send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('about');
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'center' });
          el.classList.add('is-in-view');
        }
      `
    });
    await sleep(800);

    const desktopScreen = await client.send('Page.captureScreenshot', { format: 'png' });
    const desktopPath = path.join(ARTIFACT_DIR, 'desktop_about_integrity.png');
    fs.writeFileSync(desktopPath, Buffer.from(desktopScreen.data, 'base64'));
    console.log('Saved desktop integrity check:', desktopPath);

    client.close();
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    chromeProc.kill();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

run();
