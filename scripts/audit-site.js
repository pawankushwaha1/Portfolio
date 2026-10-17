const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
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
        off(event, handler) {
          if (eventHandlers.has(event)) {
            const arr = eventHandlers.get(event).filter(h => h !== handler);
            eventHandlers.set(event, arr);
          }
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

async function auditPage(cdp, url, name) {
  console.log(`\n--------------------------------------------------`);
  console.log(`AUDITING: ${name} (${url})`);
  console.log(`--------------------------------------------------`);

  const errors = [];
  const network404s = [];

  const onConsole = (params) => {
    if (params.type === 'error') {
      const text = params.args ? params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ') : 'Unknown error';
      errors.push(`[Console Error] ${text}`);
    }
  };

  const onException = (params) => {
    const desc = params.exceptionDetails ? (params.exceptionDetails.exception ? params.exceptionDetails.exception.description : params.exceptionDetails.text) : 'Unknown exception';
    errors.push(`[Exception] ${desc}`);
  };

  const onResponse = (params) => {
    if (params.response.status >= 400) {
      network404s.push(`[HTTP ${params.response.status}] ${params.response.url}`);
    }
  };

  const onLoadingFailed = (params) => {
    if (params.errorText !== 'net::ERR_ABORTED') {
      network404s.push(`[Load Failed: ${params.errorText}] ${params.requestId}`);
    }
  };

  cdp.on('Runtime.consoleAPICalled', onConsole);
  cdp.on('Runtime.exceptionThrown', onException);
  cdp.on('Network.responseReceived', onResponse);
  cdp.on('Network.loadingFailed', onLoadingFailed);

  await cdp.send('Page.navigate', { url });
  await sleep(1500);

  // Trigger all images to load eagerly, then scroll down and back
  await cdp.send('Runtime.evaluate', {
    expression: `(async () => {
      document.querySelectorAll('img').forEach(img => {
        img.loading = 'eager';
      });
      const distance = 800;
      const total = document.body.scrollHeight;
      for (let y = 0; y < total; y += distance) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 800));
    })()`,
    awaitPromise: true
  });
  await sleep(600);

  // Check DOM state
  const domCheck = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const brokenImages = Array.from(document.querySelectorAll('img'))
        .filter(img => img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith('data:'))
        .map(img => img.src || img.getAttribute('src'));
      const brokenLinks = Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.getAttribute('href'))
        .filter(h => h.startsWith('http://localhost') || h.endsWith('.html'));
      return { brokenImages, brokenLinksCount: brokenLinks.length };
    })()`,
    returnByValue: true
  });

  const domRes = domCheck.result ? domCheck.result.value : {};

  if (errors.length > 0) {
    console.log(`❌ JavaScript Errors (${errors.length}):`);
    errors.forEach(e => console.log('   ', e));
  } else {
    console.log(`✅ No JavaScript runtime errors`);
  }

  if (network404s.length > 0) {
    console.log(`❌ Failed Network Requests (${network404s.length}):`);
    network404s.forEach(n => console.log('   ', n));
  } else {
    console.log(`✅ No failed network requests`);
  }

  if (domRes.brokenImages && domRes.brokenImages.length > 0) {
    console.log(`⚠️ Broken Images (naturalWidth = 0) (${domRes.brokenImages.length}):`);
    domRes.brokenImages.forEach(img => console.log('   ', img));
  } else {
    console.log(`✅ All images loaded properly`);
  }

  cdp.off('Runtime.consoleAPICalled', onConsole);
  cdp.off('Runtime.exceptionThrown', onException);
  cdp.off('Network.responseReceived', onResponse);
  cdp.off('Network.loadingFailed', onLoadingFailed);

  return {
    name,
    url,
    errors,
    network404s,
    brokenImages: domRes.brokenImages || []
  };
}

async function run() {
  const tmpDir = path.join(__dirname, '..', '.tmp_chrome_audit');
  try {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}
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
    await cdp.send('Network.enable');

    // Test on desktop viewport
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    const pages = [
      { name: 'Home Page', url: 'http://localhost:8000/index.html' },
      { name: 'About Page', url: 'http://localhost:8000/about.html' },
      { name: 'Admin CMS', url: 'http://localhost:8000/admin.html' },
      { name: 'Project Overview (Query)', url: 'http://localhost:8000/project.html?id=kinetic-chair' },
      { name: 'Project Research (Query)', url: 'http://localhost:8000/project-research.html?id=kinetic-chair' },
      { name: 'Project Overview (Slug Route)', url: 'http://localhost:8000/projects/kinetic-chair/' },
      { name: 'Project Research (Slug Route)', url: 'http://localhost:8000/projects/kinetic-chair/research/' },
      { name: 'Project Overview (Luma)', url: 'http://localhost:8000/projects/luma/' },
      { name: 'Project Overview (Modu Bottle)', url: 'http://localhost:8000/projects/modu-bottle/' },
      { name: 'Project Overview (Chassis M1)', url: 'http://localhost:8000/projects/chassis-m1/' },
      { name: 'Project Overview (Apex Gears)', url: 'http://localhost:8000/projects/apex-gears/' },
      { name: 'Project Overview (Vinyl Grooves)', url: 'http://localhost:8000/projects/vinyl-grooves/' },
      { name: 'Project Overview (Movie Time)', url: 'http://localhost:8000/projects/movie-time/' }
    ];

    const results = [];
    for (const p of pages) {
      const res = await auditPage(cdp, p.url, p.name);
      results.push(res);
    }

    cdp.close();

    console.log(`\n==================================================`);
    console.log(`                 AUDIT SUMMARY                    `);
    console.log(`==================================================`);
    let totalIssues = 0;
    results.forEach(r => {
      const issueCount = r.errors.length + r.network404s.length + r.brokenImages.length;
      totalIssues += issueCount;
      console.log(`${r.name.padEnd(32)}: ${issueCount === 0 ? '✅ 0 issues' : '❌ ' + issueCount + ' issues'}`);
    });
    console.log(`Total Issues Found: ${totalIssues}`);

  } finally {
    chromeProc.kill('SIGKILL');
  }
}

run().catch(e => {
  console.error('Audit script failed:', e);
  process.exit(1);
});
