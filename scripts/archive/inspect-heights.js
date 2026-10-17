const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

(async () => {
  const PORT = 8824;
  const ROOT = path.resolve('.');
  const server = http.createServer((req, res) => {
    let filePath = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200); fs.createReadStream(filePath).pipe(res);
    } else { res.writeHead(404); res.end(); }
  });
  await new Promise(r => server.listen(PORT, r));

  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--remote-debugging-port=9414',
    '--headless=new',
    '--disable-gpu',
    '--user-data-dir=' + path.join(ROOT, '.tmp_chrome_m4'),
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1200));

  const tabResp = await fetch('http://127.0.0.1:9414/json/new?http://127.0.0.1:' + PORT + '/index.html', { method: 'PUT' });
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

  const debug = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const container = document.getElementById('swShowcaseContainer');
        const slider = document.getElementById('swShowcaseSlider');
        const card = document.querySelector('.sw-project-card');
        return {
          container: {
            offsetHeight: container.offsetHeight,
            clientHeight: container.clientHeight,
            scrollHeight: container.scrollHeight,
            computedHeight: getComputedStyle(container).height
          },
          slider: {
            offsetHeight: slider.offsetHeight,
            clientHeight: slider.clientHeight,
            scrollHeight: slider.scrollHeight,
            computedHeight: getComputedStyle(slider).height
          },
          card: {
            offsetHeight: card.offsetHeight,
            clientHeight: card.clientHeight,
            scrollHeight: card.scrollHeight,
            computedHeight: getComputedStyle(card).height,
            computedFlex: getComputedStyle(card).flex,
            computedAlignSelf: getComputedStyle(card).alignSelf,
            parentDisplay: getComputedStyle(card.parentElement).display,
            parentHeight: getComputedStyle(card.parentElement).height,
            inlineStyle: card.getAttribute('style')
          }
        };
      })()
    `,
    returnByValue: true
  });
  console.log('DOM Heights:', JSON.stringify(debug.result?.value, null, 2));

  ws.close();
  chromeProc.kill();
  server.close();
})();
