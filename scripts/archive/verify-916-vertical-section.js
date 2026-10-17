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
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile_916');

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

    if (!versionData) throw new Error('Failed to connect to Chrome DevTools endpoint');

    async function createSession(url) {
      const newTabResp = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
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
        height: 1000,
        deviceScaleFactor: 1,
        mobile: false
      });

      return {
        tabId: tabData.id,
        ws,
        send,
        close: async () => {
          ws.close();
          try { await fetch(`http://127.0.0.1:${debuggingPort}/json/close/${tabData.id}`); } catch (e) {}
        }
      };
    }

    // TEST 1: Admin Panel UI
    console.log('\n--- Step 1: Verifying Admin Panel 9:16 Controls ---');
    const adminSession = await createSession(`http://127.0.0.1:${PORT}/admin.html`);
    await new Promise(r => setTimeout(r, 1000));

    // Authenticate Admin Panel and Switch to Selected Work Tab
    await adminSession.send('Runtime.evaluate', {
      expression: `
        sessionStorage.setItem('portfolio_admin_session', 'authenticated_' + Date.now());
        if (typeof window.checkAuth === 'function') window.checkAuth();
        if (typeof window.switchTab === 'function') window.switchTab('projects');
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const adminCheck = await adminSession.send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.getElementById('cardProjectVerticalSectionControl');
        const btnToggle = document.getElementById('btnToggleVerticalSection');
        const indicator = document.getElementById('globalVerticalSectionIndicator');
        const titleInput = document.getElementById('globalVerticalTitleInput');
        const subtitleInput = document.getElementById('globalVerticalSubtitleInput');
        const tagInput = document.getElementById('globalVerticalTagInput');
        const btnSave = document.getElementById('btnSaveVerticalSectionTexts');

        return {
          hasCard: Boolean(card),
          hasBtnToggle: Boolean(btnToggle),
          btnToggleText: btnToggle ? btnToggle.innerText.trim() : null,
          hasIndicator: Boolean(indicator),
          indicatorText: indicator ? indicator.innerText.trim() : null,
          titleVal: titleInput ? titleInput.value : null,
          subtitleVal: subtitleInput ? subtitleInput.value : null,
          tagVal: tagInput ? tagInput.value : null,
          hasBtnSave: Boolean(btnSave)
        };
      })()`,
      returnByValue: true
    });

    console.log('Admin 9:16 Section Check:', adminCheck.result.value);

    // Capture screenshot of Admin 9:16 card
    const cardClip = await adminSession.send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('cardProjectVerticalSectionControl');
        if (!el) return null;
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        const rect = el.getBoundingClientRect();
        return { x: 0, y: Math.max(0, rect.top), width: 1440, height: Math.min(450, rect.height + 20) };
      })()`,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 400));
    if (cardClip.result.value) {
      const c = cardClip.result.value;
      const shot = await adminSession.send('Page.captureScreenshot', {
        clip: { x: c.x, y: c.y, width: c.width, height: c.height, scale: 1 }
      });
      fs.writeFileSync(path.join(artifactDir, 'verify_admin_916_control_card.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured verify_admin_916_control_card.png');
    }

    // Open Project Edit Modal for SkyTrack
    console.log('\n--- Step 2: Verifying Edit Project Modal 9:16 Media Builder ---');
    await adminSession.send('Runtime.evaluate', {
      expression: `window.editProject('skytrack');`
    });
    await new Promise(r => setTimeout(r, 800));

    const modalCheck = await adminSession.send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('modalProject');
        const container = document.getElementById('vertical916ImagesContainer');
        const countBadge = document.getElementById('vertical916CountBadge');
        const btnAddImg = document.getElementById('btnAddVertical916Img');
        const btnAddVid = document.getElementById('btnAddVertical916Vid');
        const visSelect = document.getElementById('fieldProjShowVerticalSection');
        const cards = container ? container.querySelectorAll('.dynamic-img-card') : [];

        return {
          modalActive: modal ? modal.classList.contains('active') : false,
          hasContainer: Boolean(container),
          itemCount: cards.length,
          countBadgeText: countBadge ? countBadge.textContent.trim() : null,
          hasBtnAddImg: Boolean(btnAddImg),
          hasBtnAddVid: Boolean(btnAddVid),
          visSelectVal: visSelect ? visSelect.value : null,
          items: Array.from(cards).map(c => ({
            url: c.querySelector('.dynamic-img-url')?.value,
            alt: c.querySelector('.dynamic-img-alt')?.value,
            type: c.dataset.mediaType
          }))
        };
      })()`,
      returnByValue: true
    });

    console.log('Modal 9:16 Builder Check:', modalCheck.result.value);

    // Capture screenshot of modal 9:16 builder block
    const modalClip = await adminSession.send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('vertical916ImagesContainer')?.closest('.dynamic-images-block');
        if (!el) return null;
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        const rect = el.getBoundingClientRect();
        return { x: Math.max(0, rect.left - 10), y: Math.max(0, rect.top), width: Math.min(1400, rect.width + 20), height: Math.min(650, rect.height + 20) };
      })()`,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 400));
    if (modalClip.result.value) {
      const mc = modalClip.result.value;
      const shot = await adminSession.send('Page.captureScreenshot', {
        clip: { x: mc.x, y: mc.y, width: mc.width, height: mc.height, scale: 1 }
      });
      fs.writeFileSync(path.join(artifactDir, 'verify_admin_modal_916_builder.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured verify_admin_modal_916_builder.png');
    }

    // Close modal
    await adminSession.send('Runtime.evaluate', {
      expression: `document.getElementById('modalProject')?.classList.remove('active');`
    });

    // TEST 3: Project Page 2-Column 9:16 Rendering
    console.log('\n--- Step 3: Verifying Project Page 2-Column 9:16 Showcase ---');
    const projectSession = await createSession(`http://127.0.0.1:${PORT}/project.html?id=skytrack`);
    await new Promise(r => setTimeout(r, 2200));

    const projCheck = await projectSession.send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.getElementById('projectVerticalSection');
        const grid = document.getElementById('pflowVerticalGrid');
        const title = document.getElementById('pflowVerticalTitle');
        const subtitle = document.getElementById('pflowVerticalSubtitle');
        const tag = document.getElementById('pflowVerticalTag');
        const items = grid ? Array.from(grid.querySelectorAll('.pflow-vertical-item')) : [];

        const gridStyles = grid ? window.getComputedStyle(grid) : {};
        const firstItemStyles = items[0] ? window.getComputedStyle(items[0]) : {};

        return {
          sectionExists: Boolean(sec),
          sectionVisible: sec ? (sec.offsetParent !== null && window.getComputedStyle(sec).display !== 'none') : false,
          titleText: title ? title.textContent.trim() : null,
          subtitleText: subtitle ? subtitle.textContent.trim() : null,
          tagText: tag ? tag.textContent.trim() : null,
          itemCount: items.length,
          gridColumns: gridStyles.gridTemplateColumns,
          gridGap: gridStyles.gap,
          firstItemAspectRatio: firstItemStyles.aspectRatio,
          firstItemWidth: items[0] ? items[0].getBoundingClientRect().width : null,
          firstItemHeight: items[0] ? items[0].getBoundingClientRect().height : null
        };
      })()`,
      returnByValue: true
    });

    console.log('Project Page 9:16 Grid Check:', projCheck.result.value);

    // Scroll to 9:16 Vertical Section and take screenshot
    await projectSession.send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.getElementById('projectVerticalSection');
        if (sec) {
          if (window.lenis && typeof window.lenis.scrollTo === 'function') {
            window.lenis.scrollTo(sec, { immediate: true });
          } else {
            window.scrollTo(0, sec.offsetTop);
          }
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const projSecClip = await projectSession.send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.getElementById('projectVerticalSection');
        if (!sec) return null;
        const rect = sec.getBoundingClientRect();
        return { x: 0, y: Math.max(0, rect.top), width: 1440, height: Math.min(900, window.innerHeight - Math.max(0, rect.top)) };
      })()`,
      returnByValue: true
    });

    if (projSecClip.result.value) {
      const pc = projSecClip.result.value;
      const shot = await projectSession.send('Page.captureScreenshot', {
        clip: { x: pc.x, y: pc.y, width: pc.width, height: pc.height, scale: 1 }
      });
      fs.writeFileSync(path.join(artifactDir, 'verify_project_916_two_column_section.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured verify_project_916_two_column_section.png');
    }

    // TEST 4: Pre-rendered static route /projects/breathe/index.html
    console.log('\n--- Step 4: Verifying Pre-rendered Static Route /projects/breathe/index.html ---');
    const breatheSession = await createSession(`http://127.0.0.1:${PORT}/projects/breathe/index.html`);
    await new Promise(r => setTimeout(r, 2200));

    const breatheCheck = await breatheSession.send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.getElementById('projectVerticalSection');
        const grid = document.getElementById('pflowVerticalGrid');
        const items = grid ? Array.from(grid.querySelectorAll('.pflow-vertical-item')) : [];
        const gridStyles = grid ? window.getComputedStyle(grid) : {};

        return {
          sectionExists: Boolean(sec),
          sectionVisible: sec ? (sec.offsetParent !== null && window.getComputedStyle(sec).display !== 'none') : false,
          itemCount: items.length,
          gridColumns: gridStyles.gridTemplateColumns,
          firstItemWidth: items[0] ? items[0].getBoundingClientRect().width : null,
          firstItemHeight: items[0] ? items[0].getBoundingClientRect().height : null
        };
      })()`,
      returnByValue: true
    });

    console.log('Breathe Static Route 9:16 Check:', breatheCheck.result.value);

    await breatheSession.send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.getElementById('projectVerticalSection');
        if (sec) {
          if (window.lenis && typeof window.lenis.scrollTo === 'function') {
            window.lenis.scrollTo(sec, { immediate: true });
          } else {
            window.scrollTo(0, sec.offsetTop);
          }
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const bSecClip = await breatheSession.send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.getElementById('projectVerticalSection');
        if (!sec) return null;
        const rect = sec.getBoundingClientRect();
        return { x: 0, y: Math.max(0, rect.top), width: 1440, height: Math.min(900, window.innerHeight - Math.max(0, rect.top)) };
      })()`,
      returnByValue: true
    });

    if (bSecClip.result.value) {
      const bc = bSecClip.result.value;
      const shot = await breatheSession.send('Page.captureScreenshot', {
        clip: { x: bc.x, y: bc.y, width: bc.width, height: bc.height, scale: 1 }
      });
      fs.writeFileSync(path.join(artifactDir, 'verify_breathe_static_route_916.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured verify_breathe_static_route_916.png');
    }

    // TEST 5: Toggle 9:16 OFF via Admin Panel and test persistence & visibility
    console.log('\n--- Step 5: Testing Admin Toggle OFF ---');
    await adminSession.send('Runtime.evaluate', {
      expression: `document.getElementById('btnToggleVerticalSection')?.click();`
    });
    await new Promise(r => setTimeout(r, 800));

    // Reload project page
    await projectSession.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/project.html?id=skytrack` });
    await new Promise(r => setTimeout(r, 2000));

    const offCheck = await projectSession.send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.getElementById('projectVerticalSection');
        return {
          hasOffClass: document.documentElement.classList.contains('vertical-section-off'),
          displayStyle: sec ? window.getComputedStyle(sec).display : null,
          offsetParentNull: sec ? (sec.offsetParent === null) : true
        };
      })()`,
      returnByValue: true
    });

    console.log('Project Page with 9:16 Turned OFF Check:', offCheck.result.value);

    // Toggle back ON in Admin Panel
    console.log('\n--- Step 6: Toggling 9:16 Back ON and Customizing Title ---');
    await adminSession.send('Runtime.evaluate', {
      expression: `
        document.getElementById('btnToggleVerticalSection')?.click();
        const tInput = document.getElementById('globalVerticalTitleInput');
        if (tInput) tInput.value = 'MOBILE & VERTICAL EXPERIENCES';
        document.getElementById('btnSaveVerticalSectionTexts')?.click();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Reload project page to verify custom text
    await projectSession.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/project.html?id=skytrack` });
    await new Promise(r => setTimeout(r, 2000));

    const customTextCheck = await projectSession.send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.getElementById('projectVerticalSection');
        const title = document.getElementById('pflowVerticalTitle');
        return {
          sectionVisible: sec ? (sec.offsetParent !== null && window.getComputedStyle(sec).display !== 'none') : false,
          titleText: title ? title.textContent.trim() : null
        };
      })()`,
      returnByValue: true
    });

    console.log('Project Page with Custom 9:16 Title Check:', customTextCheck.result.value);

    // Capture screenshot of custom title
    await projectSession.send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.getElementById('projectVerticalSection');
        if (sec) {
          if (window.lenis && typeof window.lenis.scrollTo === 'function') {
            window.lenis.scrollTo(sec, { immediate: true });
          } else {
            window.scrollTo(0, sec.offsetTop);
          }
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const customClip = await projectSession.send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.getElementById('projectVerticalSection');
        if (!sec) return null;
        const rect = sec.getBoundingClientRect();
        return { x: 0, y: Math.max(0, rect.top), width: 1440, height: Math.min(900, window.innerHeight - Math.max(0, rect.top)) };
      })()`,
      returnByValue: true
    });

    if (customClip.result.value) {
      const cc = customClip.result.value;
      const shot = await projectSession.send('Page.captureScreenshot', {
        clip: { x: cc.x, y: cc.y, width: cc.width, height: cc.height, scale: 1 }
      });
      fs.writeFileSync(path.join(artifactDir, 'verify_project_916_custom_title.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured verify_project_916_custom_title.png');
    }

    // Reset title back to VERTICAL STUDIES
    await adminSession.send('Runtime.evaluate', {
      expression: `
        const tInput = document.getElementById('globalVerticalTitleInput');
        if (tInput) tInput.value = 'VERTICAL STUDIES';
        document.getElementById('btnSaveVerticalSectionTexts')?.click();
      `
    });
    await new Promise(r => setTimeout(r, 500));

    await adminSession.close();
    await projectSession.close();
    await breatheSession.close();

    console.log('\n🎉 ALL 9:16 VERTICAL SECTION CHECKS PASSED SUCCESSFULLY!');

  } finally {
    chromeProc.kill();
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
