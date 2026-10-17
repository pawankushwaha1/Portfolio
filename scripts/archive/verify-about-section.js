const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8839;
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
  const debuggingPort = 9439;
  const userDataDir = path.join(ROOT, '.tmp_chrome_verify_about');
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

    // Wait until document is ready
    for (let i = 0; i < 40; i++) {
      const isReady = await evaluate(`(() => {
        return document.readyState === 'complete' && !!document.getElementById('about');
      })()`);
      if (isReady) break;
      await new Promise(r => setTimeout(r, 100));
    }

    // 1. Desktop Viewport (1440 x 900)
    console.log('Testing Desktop Viewport 1440x900...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Scroll to #about section
    await evaluate(`(() => {
      window.dispatchEvent(new Event('resize'));
      const about = document.getElementById('about');
      if (window.lenis && about) {
        window.lenis.scrollTo(about, { immediate: true });
      } else if (about) {
        window.scrollTo(0, about.offsetTop);
      }
      if (about) about.classList.add('is-in-view');
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const aboutDataDesktop = await evaluate(`(() => {
      const about = document.getElementById('about');
      const redCard = document.querySelector('.about-card-red');
      const infoCards = document.querySelectorAll('.about-info-card');
      const toolTiles = document.querySelectorAll('.about-tool-tile');
      const headline = document.querySelector('.about-main-headline');
      const divider = document.querySelector('.about-work-divider');

      const container = document.querySelector('.about-container');
      const style = window.getComputedStyle(about);
      const rectA = about.getBoundingClientRect();
      const rectC = container ? container.getBoundingClientRect() : { top: 0, bottom: 0, height: 0 };

      return {
        scrollY: window.scrollY,
        aboutTop: about ? about.offsetTop : null,
        aboutHeight: about ? about.offsetHeight : null,
        containerHeight: rectC.height,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        spaceAbove: rectC.top - rectA.top,
        spaceBelow: rectA.bottom - rectC.bottom,
        dividerTop: divider ? divider.offsetTop : null,
        dividerHeight: divider ? divider.offsetHeight : null,
        infoCardCount: infoCards.length,
        toolCount: toolTiles.length,
        headlineText: headline ? headline.textContent.replace(/\\s+/g, ' ').trim() : '',
        redCardFound: !!redCard,
        dividerFound: !!divider
      };
    })()`);
    console.log('Desktop About Data:', aboutDataDesktop);

    const ssDesktop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_about_desktop_1440.png'), Buffer.from(ssDesktop.data, 'base64'));
    console.log('Saved verify_about_desktop_1440.png');

    // Capture the transition area showing About bottom, Divider, and Selected Work top
    await evaluate(`(() => {
      const divider = document.querySelector('.about-work-divider');
      if (divider) {
        window.scrollTo(0, divider.offsetTop - 300);
      }
    })()`);
    await new Promise(r => setTimeout(r, 600));
    const ssDivider = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_about_work_divider_transition.png'), Buffer.from(ssDivider.data, 'base64'));
    console.log('Saved verify_about_work_divider_transition.png');

    // 2. Tablet Viewport (820 x 1180) - iPad Air
    console.log('Testing Tablet Viewport 820x1180...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 820,
      height: 1180,
      deviceScaleFactor: 1.5,
      mobile: true
    });
    await evaluate(`(() => {
      window.dispatchEvent(new Event('resize'));
      const about = document.getElementById('about');
      if (window.lenis && about) {
        window.lenis.scrollTo(about, { immediate: true });
      } else if (about) {
        window.scrollTo(0, about.offsetTop);
      }
      if (about) about.classList.add('is-in-view');
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const ssTablet = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_about_tablet_820.png'), Buffer.from(ssTablet.data, 'base64'));
    console.log('Saved verify_about_tablet_820.png');

    // 3. Mobile Viewport (390 x 844) - iPhone 14/15/16 Pro
    console.log('Testing Mobile Viewport 390x844...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await evaluate(`(() => {
      window.dispatchEvent(new Event('resize'));
      const about = document.getElementById('about');
      if (window.lenis && about) {
        window.lenis.scrollTo(about, { immediate: true });
      } else if (about) {
        window.scrollTo(0, about.offsetTop);
      }
      if (about) about.classList.add('is-in-view');
    })()`);
    await new Promise(r => setTimeout(r, 800));

    // Capture mobile top part
    const ssMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_about_mobile_390_top.png'), Buffer.from(ssMobile.data, 'base64'));
    console.log('Saved verify_about_mobile_390_top.png');

    // Scroll slightly down to capture the info cards & CTA on mobile
    await evaluate(`(() => {
      window.scrollBy(0, 480);
    })()`);
    await new Promise(r => setTimeout(r, 500));
    const ssMobileBottom = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_about_mobile_390_bottom.png'), Buffer.from(ssMobileBottom.data, 'base64'));
    console.log('Saved verify_about_mobile_390_bottom.png');

    // Scroll down to cards 2, 3 and CTA on mobile
    await evaluate(`(() => {
      const cta = document.querySelector('.about-cta-row');
      if (cta) cta.scrollIntoView({ behavior: 'instant', block: 'end' });
    })()`);
    await new Promise(r => setTimeout(r, 600));
    const ssMobileCardsCta = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_about_mobile_cards_and_cta.png'), Buffer.from(ssMobileCardsCta.data, 'base64'));
    console.log('Saved verify_about_mobile_cards_and_cta.png');

    // Capture mobile divider transition
    await evaluate(`(() => {
      const divider = document.querySelector('.about-work-divider');
      if (divider) divider.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`);
    await new Promise(r => setTimeout(r, 600));
    const ssMobileDivider = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verify_about_work_divider_mobile.png'), Buffer.from(ssMobileDivider.data, 'base64'));
    console.log('Saved verify_about_work_divider_mobile.png');

    // 4. Test Navigation & Scroll to Work
    console.log('Testing Navbar link click to #work...');
    await evaluate(`(() => {
      const workLink = document.querySelector('.desktop-nav a[href="#work"]') || document.querySelector('.mobile-nav-link[href="#work"]');
      if (workLink) workLink.click();
    })()`);
    await new Promise(r => setTimeout(r, 900));

    const workNavData = await evaluate(`(() => {
      const work = document.getElementById('work');
      return {
        scrollY: window.scrollY,
        workTop: work ? work.offsetTop : null,
        isNearWork: Math.abs(window.scrollY - (work ? work.offsetTop : 0)) < 20
      };
    })()`);
    console.log('Work Navigation Status:', workNavData);

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
