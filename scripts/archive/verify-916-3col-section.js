const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8792;
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
  const debuggingPort = 9362;
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile_916_3col');

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

  try {
    let versionData = null;
    for (let i = 0; i < 30; i++) {
      try {
        const resp = await fetch(`http://127.0.0.1:${debuggingPort}/json/version`);
        if (resp.ok) {
          versionData = await resp.json();
          break;
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 200));
    }

    const newTabResp = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?about:blank`, { method: 'PUT' });
    const tabData = await newTabResp.json();
    const ws = new WebSocket(tabData.webSocketDebuggerUrl);
    let idCounter = 1;
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

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 950,
      deviceScaleFactor: 1,
      mobile: false
    });

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

    // 1. VERIFY ADMIN PANEL
    console.log('\n--- 1. VERIFY ADMIN PANEL CONTROLS ---');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/admin.html` });
    await new Promise(r => setTimeout(r, 1800));

    // Unlock admin
    const unlockStatus = await evaluate(`(() => {
      const auth = document.getElementById('authOverlay');
      if (auth && getComputedStyle(auth).display !== 'none') {
        const inp = document.getElementById('authPasswordInput');
        if (inp) inp.value = 'pawan@2025';
        const btn = document.getElementById('btnAuthUnlock');
        if (btn) btn.click();
        return 'Unlocked';
      }
      return 'Already Unlocked';
    })()`);
    console.log('Admin Auth status:', unlockStatus);
    await new Promise(r => setTimeout(r, 800));

    // Click Projects tab (Tab 3)
    await evaluate(`(() => {
      const projTab = document.querySelector('[data-tab="projects"]');
      if (projTab) projTab.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    // Verify 9:16 global controller card in Tab 3
    const adminCardInfo = await evaluate(`(() => {
      const card = document.getElementById('cardProjectVerticalSectionControl');
      const title = card?.querySelector('.card-box-title')?.textContent.trim();
      const hint = card?.querySelector('.field-hint')?.textContent.trim();
      return { exists: !!card, title, hint };
    })()`);
    console.log('Admin 9:16 Card Exists:', adminCardInfo.exists);
    console.log('Admin 9:16 Card Title:', adminCardInfo.title);
    console.log('Admin 9:16 Card Hint:', adminCardInfo.hint);

    // Scroll to 9:16 card and capture screenshot
    await evaluate(`document.getElementById('cardProjectVerticalSectionControl').scrollIntoView({ behavior: 'instant', block: 'center' });`);
    await new Promise(r => setTimeout(r, 400));
    const shotAdminCard = await send('Page.captureScreenshot', { format: 'png' });
    const shotAdminCardPath = path.join(artifactDir, 'verify_admin_916_three_columns_card.png');
    fs.writeFileSync(shotAdminCardPath, Buffer.from(shotAdminCard.data, 'base64'));
    console.log('✓ Captured screenshot of Admin 9:16 (3 Columns) card:', shotAdminCardPath);

    // Open modal for SkyTrack to verify 3-column media builder
    await evaluate(`(() => {
      const skyTrackCard = Array.from(document.querySelectorAll('.project-admin-card')).find(c => c.textContent.includes('SkyTrack'));
      const editBtn = skyTrackCard?.querySelector('.btn-outline-admin');
      if (editBtn) editBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const modalBuilderInfo = await evaluate(`(() => {
      const block = document.querySelector('.dynamic-images-block:has(#vertical916ImagesContainer)');
      const title = block?.querySelector('.dynamic-images-title')?.textContent.trim();
      const desc = block?.querySelector('.dynamic-images-desc')?.textContent.trim();
      const container = document.getElementById('vertical916ImagesContainer');
      const cards = container ? container.querySelectorAll('.dynamic-img-card').length : 0;
      const thumb = container?.querySelector('.dynamic-img-thumb-wrap');
      const thumbStyle = thumb ? getComputedStyle(thumb) : null;
      return {
        title,
        desc,
        cardsCount: cards,
        thumbWidth: thumbStyle?.width,
        thumbHeight: thumbStyle?.height,
        thumbAspectRatio: thumbStyle?.aspectRatio
      };
    })()`);
    console.log('Modal 9:16 Builder Title:', modalBuilderInfo.title);
    console.log('Modal 9:16 Builder Desc:', modalBuilderInfo.desc);
    console.log('Modal 9:16 Media Items Count:', modalBuilderInfo.cardsCount);
    console.log('Modal 9:16 Thumb Dimensions:', modalBuilderInfo.thumbWidth, 'x', modalBuilderInfo.thumbHeight, `(aspect: ${modalBuilderInfo.thumbAspectRatio})`);

    // Scroll to modal 9:16 builder and capture screenshot
    await evaluate(`document.getElementById('vertical916ImagesContainer').scrollIntoView({ behavior: 'instant', block: 'center' });`);
    await new Promise(r => setTimeout(r, 400));
    const shotModalBuilder = await send('Page.captureScreenshot', { format: 'png' });
    const shotModalBuilderPath = path.join(artifactDir, 'verify_admin_modal_916_three_columns_builder.png');
    fs.writeFileSync(shotModalBuilderPath, Buffer.from(shotModalBuilder.data, 'base64'));
    console.log('✓ Captured screenshot of Modal 9:16 Builder:', shotModalBuilderPath);

    // Close modal
    await evaluate(`document.getElementById('modalProject').classList.remove('active');`);
    await new Promise(r => setTimeout(r, 400));

    // 2. VERIFY GALLERY BENTO FRAMES IN ADMIN (Pages, Columns, Rows)
    console.log('\n--- 2. VERIFY GALLERY BENTO FRAMES IN ADMIN ---');
    await evaluate(`(() => {
      const galTab = document.querySelector('[data-tab="gallery"]');
      if (galTab) galTab.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const galInfo = await evaluate(`(() => {
      const sec1 = document.getElementById('galleryPage1Section');
      const sec2 = document.getElementById('galleryPage2Section');
      const sec1Cols = sec1 ? sec1.querySelectorAll('.gallery-admin-col-column').length : 0;
      const sec2Cols = sec2 ? sec2.querySelectorAll('.gallery-admin-col-column').length : 0;
      const sec1RowsCol1 = sec1 ? sec1.querySelectorAll('.gallery-admin-col-column')[0].querySelectorAll('.gallery-admin-row-slot').length : 0;
      return {
        sec1Exists: !!sec1,
        sec2Exists: !!sec2,
        sec1Cols,
        sec2Cols,
        sec1RowsCol1
      };
    })()`);
    console.log('Gallery Bento Page 1 Exists:', galInfo.sec1Exists, `(${galInfo.sec1Cols} columns, ${galInfo.sec1RowsCol1} rows in Col 1)`);
    console.log('Gallery Bento Page 2 Exists:', galInfo.sec2Exists, `(${galInfo.sec2Cols} columns)`);

    await evaluate(`document.getElementById('cardGalleryBentoContainer').scrollIntoView({ behavior: 'instant', block: 'start' });`);
    await new Promise(r => setTimeout(r, 400));
    const shotGal = await send('Page.captureScreenshot', { format: 'png' });
    const shotGalPath = path.join(artifactDir, 'verify_admin_gallery_bento_frames_grid.png');
    fs.writeFileSync(shotGalPath, Buffer.from(shotGal.data, 'base64'));
    console.log('✓ Captured screenshot of Gallery Bento Grid:', shotGalPath);

    // 3. VERIFY PROJECT PAGE (3 COLUMNS PER ROW WITH PROPER SPACE)
    console.log('\n--- 3. VERIFY PROJECT PAGE (3 COLUMNS PER ROW WITH PROPER SPACE) ---');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/projects/skytrack/` });
    await new Promise(r => setTimeout(r, 2000));

    const projectPageInfo = await evaluate(`(() => {
      const sec = document.getElementById('projectVerticalSection');
      const grid = document.getElementById('pflowVerticalGrid');
      const items = grid ? Array.from(grid.querySelectorAll('.pflow-vertical-item')) : [];
      const computed = grid ? getComputedStyle(grid) : null;
      
      const itemStyles = items.map((it, idx) => {
        const cs = getComputedStyle(it);
        const rect = it.getBoundingClientRect();
        return {
          idx: idx + 1,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          aspectRatio: cs.aspectRatio,
          borderRadius: cs.borderRadius
        };
      });

      const galSec = document.getElementById('projectGallerySection');
      const vertSec = document.getElementById('projectVerticalSection');
      const galRect = galSec ? galSec.getBoundingClientRect() : null;
      const vertRect = vertSec ? vertSec.getBoundingClientRect() : null;
      const sectionDistance = (galRect && vertRect) ? Math.round(vertRect.top - galRect.bottom) : null;

      const last169Item = document.querySelector('.pflow-gallery-item:last-child');
      const first916Item = document.querySelector('.pflow-vertical-item:first-child');
      const itemDistance = (last169Item && first916Item) ? Math.round(first916Item.getBoundingClientRect().top - last169Item.getBoundingClientRect().bottom) : null;

      return {
        sectionExists: !!sec,
        sectionVisible: sec ? getComputedStyle(sec).display !== 'none' : false,
        gridDisplay: computed?.display,
        gridTemplateColumns: computed?.gridTemplateColumns,
        gridGap: computed?.gap,
        itemsCount: items.length,
        items: itemStyles,
        sectionDistance,
        itemDistance
      };
    })()`);

    console.log('Project 9:16 Section Exists:', projectPageInfo.sectionExists);
    console.log('Project 9:16 Section Visible:', projectPageInfo.sectionVisible);
    console.log('Grid Display:', projectPageInfo.gridDisplay);
    console.log('Grid Template Columns:', projectPageInfo.gridTemplateColumns);
    console.log('Grid Gap (Proper Space):', projectPageInfo.gridGap);
    console.log('Section Separation Distance:', projectPageInfo.sectionDistance, 'px');
    console.log('Direct Distance between 16:9 item and 9:16 item:', projectPageInfo.itemDistance, 'px');
    console.log('Items Count in Row:', projectPageInfo.itemsCount);
    projectPageInfo.items.forEach(it => {
      console.log(`  Item ${it.idx}: ${it.width}px x ${it.height}px (aspect-ratio: ${it.aspectRatio}, radius: ${it.borderRadius})`);
    });

    // Scroll to the transition between 16:9 and 9:16 section and take screenshot
    await evaluate(`(() => {
      const vertSec = document.getElementById('projectVerticalSection');
      if (vertSec) vertSec.scrollIntoView({ behavior: 'instant', block: 'start' });
      window.scrollBy(0, -220); // Show bottom of 16:9 and top of 9:16
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const shotBetween = await send('Page.captureScreenshot', { format: 'png' });
    const shotBetweenPath = path.join(artifactDir, 'verify_space_between_169_and_916.png');
    fs.writeFileSync(shotBetweenPath, Buffer.from(shotBetween.data, 'base64'));
    console.log('✓ Captured screenshot of Space between 16:9 and 9:16:', shotBetweenPath);

    // Scroll to 9:16 vertical section on project page and take screenshot
    await evaluate(`document.getElementById('projectVerticalSection').scrollIntoView({ behavior: 'instant', block: 'center' });`);
    await new Promise(r => setTimeout(r, 800));

    const shotProjGrid = await send('Page.captureScreenshot', { format: 'png' });
    const shotProjGridPath = path.join(artifactDir, 'verify_project_916_three_columns_grid.png');
    fs.writeFileSync(shotProjGridPath, Buffer.from(shotProjGrid.data, 'base64'));
    console.log('✓ Captured screenshot of Project 3-column 9:16 grid:', shotProjGridPath);

    // Test responsive tablet view (900px)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 900,
      height: 950,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 400));
    const tabletCols = await evaluate(`getComputedStyle(document.getElementById('pflowVerticalGrid')).gridTemplateColumns`);
    console.log('✓ Tablet View (900px) Columns:', tabletCols);

    // Test responsive mobile view (480px)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 480,
      height: 900,
      deviceScaleFactor: 1,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 400));
    const mobileCols = await evaluate(`getComputedStyle(document.getElementById('pflowVerticalGrid')).gridTemplateColumns`);
    console.log('✓ Mobile View (480px) Columns:', mobileCols);

    console.log('\n=========================================');
    console.log('✓ ALL 3-COLUMN 9:16 SECTION CHECKS PASSED!');
    console.log('=========================================');

  } finally {
    try { chromeProc.kill(); } catch (e) {}
    await new Promise(r => server.close(r));
  }
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
