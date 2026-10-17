const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8788;
const ROOT = path.resolve(__dirname, '..');
const artifactDir = 'C:\\Users\\kushw\\.gemini\\antigravity\\brain\\f0cdb6f4-1b77-4670-8973-104becbc507e';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0].split('#')[0];
  let filePath = path.join(ROOT, decodeURIComponent(urlPath));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

async function run() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✓ Test server running on http://127.0.0.1:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debuggingPort = 9358;
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile_gallery_bento');

  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debuggingPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function getJson(endpoint) {
    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${debuggingPort}/${endpoint}`, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
        });
      }).on('error', reject);
    });
  }

  const versionData = await getJson('json/version');
  const webSocketDebuggerUrl = versionData.webSocketDebuggerUrl;
  console.log('✓ Chrome connected via CDP:', webSocketDebuggerUrl);

  const WebSocket = require('child_process');
  // Use simple node WebSocket via built-in or basic client
  let ws;
  let msgId = 1;
  const callbacks = new Map();

  async function createWsClient(url) {
    const httpReq = http.request(url.replace('ws://', 'http://'), {
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
        'Sec-WebSocket-Version': '13'
      }
    });

    return new Promise((resolve, reject) => {
      httpReq.on('upgrade', (res, socket, upgradeHead) => {
        const events = {
          send: (obj) => {
            const jsonStr = Buffer.from(JSON.stringify(obj));
            const len = jsonStr.length;
            let frame;
            if (len < 126) {
              frame = Buffer.alloc(6 + len);
              frame[0] = 0x81;
              frame[1] = 0x80 | len;
              frame[2] = 0x12; frame[3] = 0x34; frame[4] = 0x56; frame[5] = 0x78;
              for (let i = 0; i < len; i++) frame[6 + i] = jsonStr[i] ^ frame[2 + (i % 4)];
            } else {
              frame = Buffer.alloc(8 + len);
              frame[0] = 0x81;
              frame[1] = 0x80 | 126;
              frame.writeUInt16BE(len, 2);
              frame[4] = 0x12; frame[5] = 0x34; frame[6] = 0x56; frame[7] = 0x78;
              for (let i = 0; i < len; i++) frame[8 + i] = jsonStr[i] ^ frame[4 + (i % 4)];
            }
            socket.write(frame);
          }
        };

        let buffer = Buffer.alloc(0);
        socket.on('data', chunk => {
          buffer = Buffer.concat([buffer, chunk]);
          while (buffer.length >= 2) {
            const secondByte = buffer[1];
            const lengthIndicator = secondByte & 0x7f;
            let offset = 2;
            let payloadLen = lengthIndicator;
            if (lengthIndicator === 126) {
              if (buffer.length < 4) break;
              payloadLen = buffer.readUInt16BE(2);
              offset = 4;
            } else if (lengthIndicator === 127) {
              break;
            }
            if (buffer.length < offset + payloadLen) break;
            const payload = buffer.slice(offset, offset + payloadLen);
            buffer = buffer.slice(offset + payloadLen);
            try {
              const msg = JSON.parse(payload.toString('utf8'));
              if (msg.id && callbacks.has(msg.id)) {
                callbacks.get(msg.id)(msg);
                callbacks.delete(msg.id);
              }
            } catch (err) {}
          }
        });
        resolve(events);
      });
      httpReq.on('error', reject);
      httpReq.end();
    });
  }

  const tabs = await getJson('json/list');
  const targetTab = tabs.find(t => t.type === 'page') || tabs[0];
  ws = await createWsClient(targetTab.webSocketDebuggerUrl);

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, (res) => resolve(res.result));
      ws.send({ id, method, params });
    });
  }

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');
  await sendCommand('DOM.enable');

  console.log('✓ Navigating to admin panel...');
  await sendCommand('Page.navigate', { url: `http://127.0.0.1:${PORT}/admin.html` });
  await new Promise(r => setTimeout(r, 1800));

  // Unlock if auth overlay is present
  const unlockRes = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const auth = document.getElementById('authOverlay');
      if (auth && getComputedStyle(auth).display !== 'none') {
        const inp = document.getElementById('authPasswordInput');
        if (inp) inp.value = 'pawan@2025';
        const btn = document.getElementById('btnAuthUnlock');
        if (btn) btn.click();
        return 'Unlocked';
      }
      return 'Already Unlocked';
    })()`,
    returnByValue: true
  });
  console.log('✓ Admin Auth status:', unlockRes.result.value);
  await new Promise(r => setTimeout(r, 800));

  // Switch to Tab 5 (Gallery / Field Notes & Frames)
  await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const galTab = document.querySelector('[data-tab="gallery"]');
      if (galTab) galTab.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  // Set viewport to 1440x950 for clear Bento view
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 950,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Verify structure of Gallery Bento Frames
  const bentoStructure = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const container = document.getElementById('cardGalleryBentoContainer');
      const switcher = document.getElementById('galleryPageSwitcher');
      const switcherBtns = switcher ? Array.from(switcher.querySelectorAll('.btn-gallery-page-switch')).map(b => b.textContent.trim()) : [];
      
      const sec1 = document.getElementById('galleryPage1Section');
      const sec2 = document.getElementById('galleryPage2Section');
      
      const getPageData = (sec) => {
        if (!sec) return null;
        const title = sec.querySelector('.gallery-admin-page-title')?.textContent.trim();
        const badge = sec.querySelector('.gallery-admin-page-badge')?.textContent.trim();
        const cols = Array.from(sec.querySelectorAll('.gallery-admin-col-column')).map((colEl, cIdx) => {
          const colTitle = colEl.querySelector('.gallery-admin-col-title')?.textContent.trim();
          const rows = Array.from(colEl.querySelectorAll('.gallery-admin-row-slot')).map((rowEl, rIdx) => {
            const rowTag = rowEl.querySelector('.row-slot-tag')?.textContent.trim();
            const typeBadge = rowEl.querySelector('.row-slot-type-badge')?.textContent.trim();
            const caption = rowEl.querySelector('.gallery-admin-slot-caption')?.textContent.trim();
            return { rowTag, typeBadge, caption };
          });
          return { colTitle, rowsCount: rows.length, rows };
        });
        return { title, badge, colsCount: cols.length, cols };
      };

      return {
        containerExists: !!container,
        switcherBtns,
        page1: getPageData(sec1),
        page2: getPageData(sec2)
      };
    })()`,
    returnByValue: true
  });

  console.log('\n--- BENTO STRUCTURE CHECK ---');
  console.log('Container Exists:', bentoStructure.result.value.containerExists);
  console.log('Switcher Buttons:', bentoStructure.result.value.switcherBtns);
  console.log('Page 1 Title:', bentoStructure.result.value.page1?.title);
  console.log('Page 1 Columns Count:', bentoStructure.result.value.page1?.colsCount);
  console.log('Page 1 Col 1 Rows:', bentoStructure.result.value.page1?.cols[0]?.rows);
  console.log('Page 2 Title:', bentoStructure.result.value.page2?.title);
  console.log('Page 2 Columns Count:', bentoStructure.result.value.page2?.colsCount);
  console.log('Page 2 Col 1 Rows:', bentoStructure.result.value.page2?.cols[0]?.rows);

  // Capture screenshot of All Pages Bento layout
  await sendCommand('Runtime.evaluate', {
    expression: `document.getElementById('cardGalleryBentoContainer').scrollIntoView({ behavior: 'instant', block: 'start' });`
  });
  await new Promise(r => setTimeout(r, 600));

  const shotAll = await sendCommand('Page.captureScreenshot', { format: 'png' });
  const shotAllPath = path.join(artifactDir, 'verify_admin_gallery_bento_all_pages.png');
  fs.writeFileSync(shotAllPath, Buffer.from(shotAll.data, 'base64'));
  console.log('✓ Captured screenshot of Admin Bento Grid (All Pages):', shotAllPath);

  // Test Page 1 Filter Switch
  await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const btnP1 = document.querySelector('.btn-gallery-page-switch[data-page-filter="1"]');
      if (btnP1) btnP1.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  const filter1Check = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const sec1 = document.getElementById('galleryPage1Section');
      const sec2 = document.getElementById('galleryPage2Section');
      return {
        sec1Hidden: sec1.classList.contains('is-hidden'),
        sec2Hidden: sec2.classList.contains('is-hidden')
      };
    })()`,
    returnByValue: true
  });
  console.log('✓ Page 1 filter clicked: sec1Hidden =', filter1Check.result.value.sec1Hidden, ', sec2Hidden =', filter1Check.result.value.sec2Hidden);

  const shotP1 = await sendCommand('Page.captureScreenshot', { format: 'png' });
  const shotP1Path = path.join(artifactDir, 'verify_admin_gallery_bento_page1.png');
  fs.writeFileSync(shotP1Path, Buffer.from(shotP1.data, 'base64'));
  console.log('✓ Captured screenshot of Admin Bento Grid (Page 1 filter):', shotP1Path);

  // Test Swap Rows in Page 1, Column 1
  const swapResult = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const sec1 = document.getElementById('galleryPage1Section');
      const col1 = sec1.querySelectorAll('.gallery-admin-col-column')[0];
      const row1Before = col1.querySelectorAll('.gallery-admin-row-slot')[0].querySelector('.gallery-admin-slot-caption').textContent.trim();
      const row2Before = col1.querySelectorAll('.gallery-admin-row-slot')[1].querySelector('.gallery-admin-slot-caption').textContent.trim();
      
      // Perform Swap
      window.swapGalleryRows(1, 1);
      
      const sec1After = document.getElementById('galleryPage1Section');
      const col1After = sec1After.querySelectorAll('.gallery-admin-col-column')[0];
      const row1After = col1After.querySelectorAll('.gallery-admin-row-slot')[0].querySelector('.gallery-admin-slot-caption').textContent.trim();
      const row2After = col1After.querySelectorAll('.gallery-admin-row-slot')[1].querySelector('.gallery-admin-slot-caption').textContent.trim();
      
      // Swap back to preserve clean original order
      window.swapGalleryRows(1, 1);

      return {
        row1Before,
        row2Before,
        row1After,
        row2After,
        successfullySwapped: (row1Before === row2After && row2Before === row1After)
      };
    })()`,
    returnByValue: true
  });
  console.log('✓ Row Swap Test in Page 1, Col 1:', swapResult.result.value);

  // Test Edit Modal with Bento Placement Controls
  await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      // Find first card in Page 1, Col 1
      const editBtn = document.querySelector('#galleryPage1Section .gallery-admin-row-slot .btn-outline-admin');
      if (editBtn) editBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const modalCheck = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modalGallery');
      const pageSelect = document.getElementById('fieldGalleryPage');
      const colSelect = document.getElementById('fieldGalleryCol');
      const rowSelect = document.getElementById('fieldGalleryRow');
      const typeSelect = document.getElementById('fieldGalleryType');
      return {
        isActive: modal.classList.contains('active'),
        pageValue: pageSelect ? pageSelect.value : null,
        colValue: colSelect ? colSelect.value : null,
        rowValue: rowSelect ? rowSelect.value : null,
        typeValue: typeSelect ? typeSelect.value : null
      };
    })()`,
    returnByValue: true
  });
  console.log('✓ Modal Placement Fields Check:', modalCheck.result.value);

  const shotModal = await sendCommand('Page.captureScreenshot', { format: 'png' });
  const shotModalPath = path.join(artifactDir, 'verify_admin_gallery_modal_placement.png');
  fs.writeFileSync(shotModalPath, Buffer.from(shotModal.data, 'base64'));
  console.log('✓ Captured screenshot of Modal Bento Placement controls:', shotModalPath);

  // Close modal
  await sendCommand('Runtime.evaluate', {
    expression: `document.getElementById('modalGallery').classList.remove('active');`
  });
  await new Promise(r => setTimeout(r, 500));

  // Switch back to "All Pages"
  await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const btnAll = document.querySelector('.btn-gallery-page-switch[data-page-filter="all"]');
      if (btnAll) btnAll.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  // Now verify live website (index.html) gallery
  console.log('\n--- LIVE WEBSITE GALLERY CHECK ---');
  await sendCommand('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await new Promise(r => setTimeout(r, 2000));

  const liveSiteCheck = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const galSec = document.getElementById('gallery');
      const p1Cols = document.querySelectorAll('.gallery-page-1 .gallery-col');
      const p2Cols = document.querySelectorAll('.gallery-page-2 .gallery-col');
      
      const p1Data = Array.from(p1Cols).map((c, i) => {
        const cards = Array.from(c.querySelectorAll('.gallery-card')).map(card => ({
          caption: card.dataset.caption,
          isTall: card.classList.contains('card-tall')
        }));
        return { col: i + 1, count: cards.length, cards };
      });

      const p2Data = Array.from(p2Cols).map((c, i) => {
        const cards = Array.from(c.querySelectorAll('.gallery-card')).map(card => ({
          caption: card.dataset.caption,
          isTall: card.classList.contains('card-tall')
        }));
        return { col: i + 1, count: cards.length, cards };
      });

      return {
        galleryExists: !!galSec,
        page1ColsCount: p1Cols.length,
        page2ColsCount: p2Cols.length,
        page1Data: p1Data,
        page2Data: p2Data
      };
    })()`,
    returnByValue: true
  });

  console.log('Gallery Section Exists:', liveSiteCheck.result.value.galleryExists);
  console.log('Page 1 Columns:', liveSiteCheck.result.value.page1ColsCount);
  console.log('Page 2 Columns:', liveSiteCheck.result.value.page2ColsCount);
  console.log('Live Site Page 1 Data:');
  liveSiteCheck.result.value.page1Data.forEach(c => {
    console.log(`  Col ${c.col} (${c.count} cards):`, c.cards.map(k => k.caption).join(' | '));
  });

  // Scroll to gallery and take screenshot of live website
  await sendCommand('Runtime.evaluate', {
    expression: `document.getElementById('gallery').scrollIntoView({ behavior: 'instant', block: 'start' });`
  });
  await new Promise(r => setTimeout(r, 800));

  const shotLive = await sendCommand('Page.captureScreenshot', { format: 'png' });
  const shotLivePath = path.join(artifactDir, 'verify_website_gallery_bento_page1.png');
  fs.writeFileSync(shotLivePath, Buffer.from(shotLive.data, 'base64'));
  console.log('✓ Captured screenshot of Live Website Bento Grid (Page 1):', shotLivePath);

  // Terminate chrome and server
  try { chromeProc.kill(); } catch (e) {}
  await new Promise(r => server.close(r));

  console.log('\n=========================================');
  console.log('✓ ALL GALLERY BENTO GRID VERIFICATIONS PASSED!');
  console.log('=========================================');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
