const fs = require('fs');
const { spawn } = require('child_process');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debuggingPort = 9488;
  const userDataDir = 'C:\\Users\\kushw\\Downloads\\Portfolio\\.tmp_sample';
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debuggingPort}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  for (let i = 0; i < 30; i++) {
    try {
      const resp = await fetch(`http://127.0.0.1:${debuggingPort}/json/version`);
      if (resp.ok) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 100));
  }

  const newTabResp = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?about:blank`, { method: 'PUT' });
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

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  const fileUrl = 'file:///C:/Users/kushw/.gemini/antigravity/brain/f0cdb6f4-1b77-4670-8973-104becbc507e/.user_uploaded/media_1791812593005_12e9b164.png';
  // wait the file name is media_1791815220545_12e9b164.png
  const actualUrl = 'file:///C:/Users/kushw/.gemini/antigravity/brain/f0cdb6f4-1b77-4670-8973-104becbc507e/.user_uploaded/media_1791815220545_12e9b164.png';
  await send('Page.navigate', { url: actualUrl });
  await new Promise(r => setTimeout(r, 500));

  const pixelData = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const img = document.querySelector('img');
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const p1 = ctx.getImageData(10, 32, 1, 1).data;
        const p2 = ctx.getImageData(512, 32, 1, 1).data;
        const p3 = ctx.getImageData(1000, 32, 1, 1).data;
        const pTop = ctx.getImageData(512, 2, 1, 1).data;
        const pBottom = ctx.getImageData(512, 60, 1, 1).data;
        
        let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
        const all = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 0; i < all.length; i += 4) {
          if (all[i] < minR) minR = all[i];
          if (all[i] > maxR) maxR = all[i];
          if (all[i+1] < minG) minG = all[i+1];
          if (all[i+1] > maxG) maxG = all[i+1];
          if (all[i+2] < minB) minB = all[i+2];
          if (all[i+2] > maxB) maxB = all[i+2];
        }
        return {
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          p1: Array.from(p1),
          p2: Array.from(p2),
          p3: Array.from(p3),
          pTop: Array.from(pTop),
          pBottom: Array.from(pBottom),
          range: { minR, maxR, minG, maxG, minB, maxB }
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Pixel results:', JSON.stringify(pixelData.result.value, null, 2));

  ws.close();
  chromeProc.kill();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}

test();
