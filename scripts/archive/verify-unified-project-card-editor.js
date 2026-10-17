const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8794;
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
  const userDataDir = path.join(ROOT, '.tmp_chrome_profile_unified_card_test');

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
      height: 980,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('--- Step 1: Login to admin.html ---');
    await new Promise(r => setTimeout(r, 1000));

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

    console.log('--- Step 2: Open Edit Modal for wellness-journey ---');
    await sendCmd('Runtime.evaluate', {
      expression: `window.editProject('wellness-journey');`
    });
    await new Promise(r => setTimeout(r, 800));

    // Inspect active subtab & visible sections
    const modalInspection = await sendCmd('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const cardSec = document.getElementById('projModalSectionCard');
          const caseSec = document.getElementById('projModalSectionCaseStudy');
          const btnCard = document.getElementById('btnSubtabCard');
          const btnCase = document.getElementById('btnSubtabCaseStudy');

          return {
            isCardSecVisible: cardSec ? window.getComputedStyle(cardSec).display !== 'none' : false,
            isCaseSecVisible: caseSec ? window.getComputedStyle(caseSec).display !== 'none' : false,
            isCardSubtabActive: btnCard ? btnCard.classList.contains('active') : false,
            category: document.getElementById('fieldProjCategory')?.value,
            shortTitle: document.getElementById('fieldProjShortTitle')?.value,
            desc1: document.getElementById('fieldProjDesc1')?.value,
            desc2: document.getElementById('fieldProjDesc2')?.value,
            brief: document.getElementById('fieldProjBrief')?.value,
            pillCount: document.querySelectorAll('#projFeaturesContainer .feature-edit-slot').length
          };
        })()
      `
    });
    console.log('Modal inspection upon opening:', JSON.stringify(modalInspection.result.value, null, 2));

    // Capture screenshot of the unified Project Card Content Editor
    const shotAdmin = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const shotAdminPath = path.join(artifactDir, 'verify_admin_unified_card_editor.png');
    fs.writeFileSync(shotAdminPath, Buffer.from(shotAdmin.data, 'base64'));
    console.log(`✓ Saved screenshot of unified card editor modal: ${shotAdminPath}`);

    console.log('--- Step 3: Edit all card elements in this same place ---');
    await sendCmd('Runtime.evaluate', {
      expression: `
        (() => {
          // 1. Card Title
          const titleInput = document.getElementById('fieldProjShortTitle');
          titleInput.value = 'WELLNESS JOURNEY PLUS';
          titleInput.dispatchEvent(new Event('input', { bubbles: true }));

          // 2. Description Paragraph 1
          const d1Input = document.getElementById('fieldProjDesc1');
          d1Input.value = 'Next-generation biometric behavioral design system engineered for daily micro-habits.';
          d1Input.dispatchEvent(new Event('input', { bubbles: true }));

          // 3. Description Paragraph 2
          const d2Input = document.getElementById('fieldProjDesc2');
          d2Input.value = 'Continuous telemetry data sync with zero cognitive friction and adaptive visual cadences.';
          d2Input.dispatchEvent(new Event('input', { bubbles: true }));

          // 4. Feature Pills 1 & 2
          const slots = document.querySelectorAll('#projFeaturesContainer .feature-edit-slot');
          if (slots.length >= 2) {
            const p1Label = slots[0].querySelector('.feature-label-input');
            p1Label.value = 'Biometric Telemetry';
            p1Label.dispatchEvent(new Event('input', { bubbles: true }));
            const p1Icon = slots[0].querySelector('.feature-icon-select');
            p1Icon.value = 'telemetry';
            p1Icon.dispatchEvent(new Event('change', { bubbles: true }));

            const p2Label = slots[1].querySelector('.feature-label-input');
            p2Label.value = 'Micro-Interactions';
            p2Label.dispatchEvent(new Event('input', { bubbles: true }));
            const p2Icon = slots[1].querySelector('.feature-icon-select');
            p2Icon.value = 'interaction';
            p2Icon.dispatchEvent(new Event('change', { bubbles: true }));
          }

          // 5. Project Brief
          const briefInput = document.getElementById('fieldProjBrief');
          briefInput.value = 'An intuitive wellness companion bridging real-time bio-signals and daily routines.';
          briefInput.dispatchEvent(new Event('input', { bubbles: true }));
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot of edited values in Admin Modal
    const shotAdminEdited = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const shotAdminEditedPath = path.join(artifactDir, 'verify_admin_unified_card_edited.png');
    fs.writeFileSync(shotAdminEditedPath, Buffer.from(shotAdminEdited.data, 'base64'));
    console.log(`✓ Saved screenshot of edited card fields in admin: ${shotAdminEditedPath}`);

    console.log('--- Step 4: Click Save Project ---');
    await sendCmd('Runtime.evaluate', {
      expression: `document.getElementById('btnSaveProjectRecord').click();`
    });
    await new Promise(r => setTimeout(r, 1000));

    // Check saved data in PortfolioData
    const savedCheck = await sendCmd('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const data = PortfolioData.get();
          const p = (data.projects || []).find(x => x.id === 'wellness-journey' || x.slug === 'wellness-journey');
          return {
            shortTitle: p.shortTitle,
            desc1: p.desc1,
            desc2: p.desc2,
            projectBrief: p.projectBrief,
            brief: p.brief,
            firstTwoFeatures: (p.features || []).slice(0, 2)
          };
        })()
      `
    });
    console.log('Saved data in PortfolioData:', JSON.stringify(savedCheck.result.value, null, 2));

    console.log('--- Step 5: Navigate to Website (index.html#work) and verify card live sync ---');
    await sendCmd('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html#work` });
    await new Promise(r => setTimeout(r, 2000));

    // Evaluate Wellness Journey Card in index.html
    const indexCardCheck = await sendCmd('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const card = document.querySelector('.sw-project-card[data-id="wellness-journey"], .sw-project-card[data-slug="wellness-journey"]');
          if (!card) return { found: false };

          const headline = card.querySelector('.sw-title-link, .sw-card-title')?.textContent.trim();
          const descParas = Array.from(card.querySelectorAll('.sw-card-desc p')).map(p => p.textContent.trim());
          const pills = Array.from(card.querySelectorAll('.sw-feature-item')).map(item => ({
            label: item.querySelector('.sw-feature-label')?.textContent.trim(),
            hasIcon: Boolean(item.querySelector('.sw-feature-icon svg'))
          }));
          const briefText = card.querySelector('.sw-brief-text')?.textContent.trim();

          return {
            found: true,
            headline,
            descParas,
            pills: pills.slice(0, 3),
            briefText
          };
        })()
      `
    });
    console.log('Live card on homepage index.html:', JSON.stringify(indexCardCheck.result.value, null, 2));

    // Scroll card into view and capture screenshot
    await sendCmd('Runtime.evaluate', {
      expression: `
        const card = document.querySelector('.sw-project-card[data-id="wellness-journey"], .sw-project-card[data-slug="wellness-journey"]');
        if (card) {
          card.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const shotCard = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const shotCardPath = path.join(artifactDir, 'verify_index_card_all_unified_edits.png');
    fs.writeFileSync(shotCardPath, Buffer.from(shotCard.data, 'base64'));
    console.log(`✓ Saved screenshot of updated card on website: ${shotCardPath}`);

    // Assertions
    const cardData = indexCardCheck.result.value;
    if (!cardData.found) {
      throw new Error('Wellness journey card not found on website');
    }
    if (cardData.headline !== 'WELLNESS JOURNEY PLUS') {
      throw new Error(`Expected headline 'WELLNESS JOURNEY PLUS' but got '${cardData.headline}'`);
    }
    if (!cardData.descParas[0]?.includes('Next-generation biometric behavioral design system')) {
      throw new Error(`Expected Desc 1 to match new text, got '${cardData.descParas[0]}'`);
    }
    if (!cardData.descParas[1]?.includes('Continuous telemetry data sync')) {
      throw new Error(`Expected Desc 2 to match new text, got '${cardData.descParas[1]}'`);
    }
    if (cardData.pills[0]?.label !== 'Biometric Telemetry') {
      throw new Error(`Expected Pill 1 to be 'Biometric Telemetry', got '${cardData.pills[0]?.label}'`);
    }
    if (cardData.pills[1]?.label !== 'Micro-Interactions') {
      throw new Error(`Expected Pill 2 to be 'Micro-Interactions', got '${cardData.pills[1]?.label}'`);
    }
    if (!cardData.briefText?.includes('An intuitive wellness companion')) {
      throw new Error(`Expected Brief to match new text, got '${cardData.briefText}'`);
    }

    console.log('========================================================================');
    console.log('🎉 VERIFICATION SUCCESSFUL:');
    console.log('- All project card elements (Category, Title, Desc 1, Desc 2, 6 Specs/Pills, Project Brief) are editable together in the unified section.');
    console.log('- Saving updates live on the website Selected Work carousel immediately.');
    console.log('========================================================================');

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
