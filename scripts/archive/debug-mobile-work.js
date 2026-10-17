const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

(async () => {
  const PORT = 8823;
  const ROOT = path.resolve('.');
  const artifactDir = 'C:\\Users\\kushw\\.gemini\\antigravity\\brain\\f0cdb6f4-1b77-4670-8973-104becbc507e';
  const server = http.createServer((req, res) => {
    let filePath = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200); fs.createReadStream(filePath).pipe(res);
    } else { res.writeHead(404); res.end(); }
  });
  await new Promise(r => server.listen(PORT, r));

  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--remote-debugging-port=9413',
    '--headless=new',
    '--disable-gpu',
    '--user-data-dir=' + path.join(ROOT, '.tmp_chrome_m3'),
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1200));

  const tabResp = await fetch('http://127.0.0.1:9413/json/new?http://127.0.0.1:' + PORT + '/index.html', { method: 'PUT' });
  const tab = await tabResp.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let msgId = 1;
  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = msgId++;
    const handler = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === id) { ws.removeEventListener('message', handler); m.error ? rej(m.error) : res(m.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 2000));

  const bounds = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const w = document.getElementById('work');
        const card = document.querySelector('.sw-project-card');
        const container = document.getElementById('swShowcaseContainer');
        return {
          workRect: w ? w.getBoundingClientRect() : null,
          cardRect: card ? card.getBoundingClientRect() : null,
          containerRect: container ? container.getBoundingClientRect() : null,
          cardStyles: card ? {
            display: getComputedStyle(card).display,
            width: getComputedStyle(card).width,
            height: getComputedStyle(card).height,
            opacity: getComputedStyle(card).opacity,
            visibility: getComputedStyle(card).visibility
          } : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Bounds:', JSON.stringify(bounds.result?.value, null, 2));

  // If card is found, capture clip of #work
  const workRect = bounds.result?.value?.workRect;
  if (workRect) {
    const clip = {
      x: Math.max(0, workRect.x),
      y: Math.max(0, workRect.y),
      width: workRect.width,
      height: Math.min(844, workRect.height),
      scale: 1
    };
    const ss = await send('Page.captureScreenshot', { format: 'png', clip });
    fs.writeFileSync(path.join(artifactDir, 'verify_image_first_mobile_card_clip.png'), Buffer.from(ss.data, 'base64'));
    console.log('Mobile clip screenshot saved');
  }

  ws.close();
  chromeProc.kill();
  server.close();
})();
