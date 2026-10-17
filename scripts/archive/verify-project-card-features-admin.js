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
  const debuggingPort = 9360;
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile_features_test');

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
      await new Promise(r => setTimeout(r, 100));
    }

    if (!versionData) {
      throw new Error('Failed to connect to Chrome CDP endpoint');
    }

    const newTabResp = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?http://127.0.0.1:${PORT}/admin.html`, { method: 'PUT' });
    const tabData = await newTabResp.json();
    const ws = new WebSocket(tabData.webSocketDebuggerUrl);

    let msgId = 1;
    const callbacks = new Map();
    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.id && callbacks.has(parsed.id)) {
        const { resolve, reject } = callbacks.get(parsed.id);
        callbacks.delete(parsed.id);
        if (parsed.error) reject(parsed.error);
        else resolve(parsed.result);
      }
    };

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    function sendCmd(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCmd('Page.enable');
    await sendCmd('DOM.enable');
    await sendCmd('Runtime.enable');
    await sendCmd('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 960,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('--- Step 1: Login to admin.html ---');
    await new Promise(r => setTimeout(r, 1000));

    // Authenticate
    await sendCmd('Runtime.evaluate', {
      expression: `
        document.getElementById('adminPasswordInput').value = 'admin123';
        document.getElementById('btnLogin').click();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Switch to projects tab
    await sendCmd('Runtime.evaluate', {
      expression: `window.switchTab('projects');`
    });
    await new Promise(r => setTimeout(r, 500));

    console.log('--- Step 2: Open Edit Modal for apex-gears ---');
    await sendCmd('Runtime.evaluate', {
      expression: `window.editProject('apex-gears');`
    });
    await new Promise(r => setTimeout(r, 800));

    // Check slot count and values
    const slotsInfo = await sendCmd('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const slots = document.querySelectorAll('#projFeaturesContainer .feature-edit-slot');
          return Array.from(slots).map((s, i) => ({
            index: i + 1,
            label: s.querySelector('.feature-label-input').value,
            icon: s.querySelector('.feature-icon-select').value,
            hasPreviewSvg: Boolean(s.querySelector('.feature-icon-badge-preview svg'))
          }));
        })()
      `
    });

    console.log('Initial Apex Gears slots loaded in modal:', JSON.stringify(slotsInfo.result.value, null, 2));

    // Capture screenshot of Admin Modal Features section
    await sendCmd('Runtime.evaluate', {
      expression: `
        const block = document.querySelector('#projFeaturesContainer');
        if (block) {
          block.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const shot1 = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const shot1Path = path.join(artifactDir, 'verify_admin_features_editor_modal.png');
    fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
    console.log(`✓ Saved screenshot of features editor modal: ${shot1Path}`);

    console.log('--- Step 3: Modify Pill 1 and Pill 2 ---');
    await sendCmd('Runtime.evaluate', {
      expression: `
        (() => {
          const slots = document.querySelectorAll('#projFeaturesContainer .feature-edit-slot');
          // Update Slot 1
          const inp1 = slots[0].querySelector('.feature-label-input');
          inp1.value = 'Custom Zero-Backlash Titanium';
          inp1.dispatchEvent(new Event('input', { bubbles: true }));

          const sel1 = slots[0].querySelector('.feature-icon-select');
          sel1.value = 'dial';
          sel1.dispatchEvent(new Event('change', { bubbles: true }));

          // Update Slot 2
          const inp2 = slots[1].querySelector('.feature-label-input');
          inp2.value = 'Planetary Gear Precision';
          inp2.dispatchEvent(new Event('input', { bubbles: true }));
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const updatedSlotsInfo = await sendCmd('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const slots = document.querySelectorAll('#projFeaturesContainer .feature-edit-slot');
          return Array.from(slots).slice(0, 2).map((s, i) => ({
            index: i + 1,
            label: s.querySelector('.feature-label-input').value,
            icon: s.querySelector('.feature-icon-select').value,
            previewSvgSnippet: s.querySelector('.feature-icon-badge-preview').innerHTML.trim().slice(0, 50)
          }));
        })()
      `
    });
    console.log('Updated slots before save:', JSON.stringify(updatedSlotsInfo.result.value, null, 2));

    console.log('--- Step 4: Click Save Project ---');
    await sendCmd('Runtime.evaluate', {
      expression: `document.getElementById('btnSaveProjectRecord').click();`
    });
    await new Promise(r => setTimeout(r, 1000));

    // Verify stored data in PortfolioData
    const savedDataCheck = await sendCmd('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const data = PortfolioData.get();
          const p = (data.projects || []).find(x => x.id === 'apex-gears' || x.slug === 'apex-gears');
          return {
            title: p.title,
            featuresCount: p.features ? p.features.length : 0,
            features: p.features,
            contentFeatures: p.content ? p.content.features : null
          };
        })()
      `
    });
    console.log('Saved data check in localStorage:', JSON.stringify(savedDataCheck.result.value, null, 2));

    console.log('--- Step 5: Navigate to Website (index.html) and check Apex Gears card ---');
    await sendCmd('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html#work` });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll to #work and find Apex Gears card
    const cardCheck = await sendCmd('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const card = document.querySelector('.sw-project-card[data-id="apex-gears"], .sw-project-card[data-slug="apex-gears"]');
          if (!card) return { found: false };
          const pills = Array.from(card.querySelectorAll('.sw-feature-item')).map(p => ({
            label: p.querySelector('.sw-feature-label')?.textContent.trim(),
            hasIcon: Boolean(p.querySelector('.sw-feature-icon svg'))
          }));
          return {
            found: true,
            pills: pills
          };
        })()
      `
    });
    console.log('Apex Gears Card on index.html:', JSON.stringify(cardCheck.result.value, null, 2));

    // Scroll card into view and capture screenshot
    await sendCmd('Runtime.evaluate', {
      expression: `
        const card = document.querySelector('.sw-project-card[data-id="apex-gears"], .sw-project-card[data-slug="apex-gears"]');
        if (card) {
          card.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shot2 = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const shot2Path = path.join(artifactDir, 'verify_index_card_custom_features.png');
    fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
    console.log(`✓ Saved screenshot of updated card on website: ${shot2Path}`);

    // Verify assertions
    if (!cardCheck.result.value.found) {
      throw new Error('Apex gears card not found on website');
    }
    const firstPill = cardCheck.result.value.pills[0];
    if (firstPill.label !== 'Custom Zero-Backlash Titanium') {
      throw new Error(`Expected first pill to be "Custom Zero-Backlash Titanium" but got "${firstPill.label}"`);
    }

    console.log('========================================================');
    console.log('🎉 ALL TESTS PASSED: Feature editing works in Admin panel and reflects live on project card!');
    console.log('========================================================');

    ws.close();
  } finally {
    chromeProc.kill();
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
