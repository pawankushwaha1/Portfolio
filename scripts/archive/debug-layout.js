const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8785;
const ROOT = path.resolve(__dirname, '..');
const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else { res.writeHead(404); res.end(); }
});

server.listen(PORT, async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, ['--remote-debugging-port=9355', '--headless=new', '--user-data-dir=' + path.join(ROOT, '.tmp_dbg2'), 'about:blank']);
  await new Promise(r => setTimeout(r, 1200));
  const newTabResp = await fetch('http://127.0.0.1:9355/json/new?http://127.0.0.1:' + PORT + '/index.html', { method: 'PUT' });
  const tabData = await newTabResp.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  
  function send(method, params = {}) {
    return new Promise(res => {
      const id = Math.random();
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === id) { ws.removeEventListener('message', handler); res(d.result); }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 1500));

  await send('Runtime.evaluate', {
    expression: "window.lenis ? window.lenis.scrollTo('#work', { immediate: true }) : null"
  });
  await new Promise(r => setTimeout(r, 800));

  const info = await send('Runtime.evaluate', {
    expression: `(() => {
      const pills = document.querySelector('.filter-pills');
      const r = pills ? pills.getBoundingClientRect() : null;
      const elAtCenter = r ? document.elementFromPoint(r.x + 10, r.y + 10) : null;
      return {
        pillsRect: r,
        elAtCenter: elAtCenter ? (elAtCenter.tagName + '.' + elAtCenter.className) : null,
        scrollY: window.scrollY
      };
    })()`,
    returnByValue: true
  });
  console.log('Page Debug Info:', info.value);

  // Take full page screenshot
  const fullRes = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT, 'temp_full.png'), Buffer.from(fullRes.data, 'base64'));
  console.log('Captured temp_full.png');

  chromeProc.kill();
  server.close();
  try { fs.rmSync(path.join(ROOT, '.tmp_dbg2'), { recursive: true, force: true }); } catch(e){}
});
