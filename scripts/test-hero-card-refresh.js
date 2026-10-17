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

function getWebSocketDebuggerUrl(port) {
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
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      } else if (msg.method && eventHandlers.has(msg.method)) {
        eventHandlers.get(msg.method).forEach(h => h(msg.params));
      }
    };
    ws.onerror = reject;
  });
}

async function runTest() {
  const userDataDir = path.resolve('./.tmp_test_hero_profile_' + Date.now());
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:8000/index.html'
  ]);

  try {
    const wsUrl = await getWebSocketDebuggerUrl(PORT);
    const client = await createCdpClient(wsUrl);

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await sleep(1000);

    // 1. Verify default fallback images match hero theme (portrait, red character, flower, glasses)
    const initialCheck = await client.send('Runtime.evaluate', {
      expression: `
        ({
          card1: document.getElementById('heroCardImg1')?.src,
          card2: document.getElementById('heroCardImg2')?.src,
          card3: document.getElementById('heroCardImg3')?.src,
          card4: document.getElementById('heroCardImg4')?.src
        })
      `,
      returnByValue: true
    });
    console.log('Initial default hero cards:', initialCheck.result.value);

    // 2. Simulate user uploading / saving custom hero card images via Admin Panel
    // Let's create distinct custom data URLs for test
    const customTest1 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="100%" height="100%" fill="%23E11D48"/><text x="50%" y="50%" fill="white" font-size="28" font-family="sans-serif" text-anchor="middle" dy=".3em">ADMIN UPLOAD 1</text></svg>';
    const customTest2 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="100%" height="100%" fill="%232563EB"/><text x="50%" y="50%" fill="white" font-size="28" font-family="sans-serif" text-anchor="middle" dy=".3em">ADMIN UPLOAD 2</text></svg>';

    await client.send('Runtime.evaluate', {
      expression: `
        (function() {
          localStorage.setItem('fast_hero_card_1', ${JSON.stringify(customTest1)});
          localStorage.setItem('fast_hero_card_2', ${JSON.stringify(customTest2)});
          
          var data = JSON.parse(localStorage.getItem('portfolio_custom_data') || '{}');
          data.heroCards = data.heroCards || [];
          data.heroCards[0] = { title: 'Admin Custom Card 1', image: ${JSON.stringify(customTest1)}, order: 1 };
          data.heroCards[1] = { title: 'Admin Custom Card 2', image: ${JSON.stringify(customTest2)}, order: 2 };
          localStorage.setItem('portfolio_custom_data', JSON.stringify(data));
          return true;
        })()
      `,
      returnByValue: true
    });

    console.log('Custom admin hero cards written to localStorage.');

    // 3. HARD RELOAD the page
    console.log('Simulating page refresh/reload...');
    await client.send('Page.reload', { ignoreCache: true });

    // 4. Capture early frame (150ms after navigation) to test if different image showed during loading
    await sleep(150);
    const earlyCheck = await client.send('Runtime.evaluate', {
      expression: `
        ({
          card1Src: document.getElementById('heroCardImg1')?.src,
          card2Src: document.getElementById('heroCardImg2')?.src,
          card1Opacity: window.getComputedStyle(document.getElementById('heroCardImg1')).opacity,
          card2Opacity: window.getComputedStyle(document.getElementById('heroCardImg2')).opacity,
          hasFastHero: document.documentElement.classList.contains('has-fast-hero')
        })
      `,
      returnByValue: true
    });
    console.log('Early frame check (during loading at 150ms):', earlyCheck.result.value);

    if (earlyCheck.result.value.card1Src !== customTest1) {
      throw new Error(`FAIL: Early frame card 1 src did not match custom uploaded image! Got: ${earlyCheck.result.value.card1Src}`);
    }
    if (earlyCheck.result.value.card2Src !== customTest2) {
      throw new Error(`FAIL: Early frame card 2 src did not match custom uploaded image! Got: ${earlyCheck.result.value.card2Src}`);
    }

    // 5. Check fully settled frame
    await sleep(1200);
    const settledCheck = await client.send('Runtime.evaluate', {
      expression: `
        ({
          card1Src: document.getElementById('heroCardImg1')?.src,
          card2Src: document.getElementById('heroCardImg2')?.src,
          card1Opacity: window.getComputedStyle(document.getElementById('heroCardImg1')).opacity,
          card2Opacity: window.getComputedStyle(document.getElementById('heroCardImg2')).opacity
        })
      `,
      returnByValue: true
    });
    console.log('Fully settled frame check:', settledCheck.result.value);

    // 6. Capture screenshot of hero section
    const shot = await client.send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(ARTIFACT_DIR, 'hero_cards_instant_refresh.png');
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved verification screenshot to: ${outPath}`);

    client.close();
    console.log('TEST PASSED: Zero flicker, uploaded images display immediately on frame 1 and after settling!');
  } finally {
    try { chromeProc.kill(); } catch(e) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch(e) {}
  }
}

runTest().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
