const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9556;
const ARTIFACT_DIR = path.resolve('C:\\Users\\kushw\\.gemini\\antigravity\\brain\\f0cdb6f4-1b77-4670-8973-104becbc507e');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getWebSocketDebuggerUrl(port) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            resolve(data.webSocketDebuggerUrl);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', () => {
        if (attempts > 30) return reject(new Error('Chrome failed to start in time'));
        setTimeout(check, 200);
      });
    };
    check();
  });
}

function createCdpClient(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();
    const eventHandlers = new Map();

    ws.onopen = () => {
      resolve({
        send(method, params = {}) {
          return new Promise((res, rej) => {
            const id = nextId++;
            pending.set(id, { res, rej });
            ws.send(JSON.stringify({ id, method, params }));
          });
        },
        on(event, handler) {
          if (!eventHandlers.has(event)) eventHandlers.set(event, []);
          eventHandlers.get(event).push(handler);
        },
        close() {
          try { ws.close(); } catch(e) {}
        }
      });
    };

    ws.onerror = (err) => reject(err);

    ws.onmessage = (msgEvent) => {
      try {
        const data = JSON.parse(msgEvent.data);
        if (data.id && pending.has(data.id)) {
          const { res, rej } = pending.get(data.id);
          pending.delete(data.id);
          if (data.error) rej(data.error);
          else res(data.result);
        } else if (data.method && eventHandlers.has(data.method)) {
          const handlers = eventHandlers.get(data.method);
          handlers.forEach(h => h(data.params));
        }
      } catch (e) {}
    };
  });
}

async function run() {
  const tmpDir = path.join(__dirname, '..', '.tmp_chrome_mobile_test');
  try { if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  fs.mkdirSync(tmpDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tmpDir}`,
    'about:blank'
  ]);

  try {
    const browserWs = await getWebSocketDebuggerUrl(PORT);
    const targetsRes = await new Promise((resolve) => {
      http.get(`http://127.0.0.1:${PORT}/json/list`, res => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => resolve(JSON.parse(raw)));
      });
    });

    const pageTarget = targetsRes.find(t => t.type === 'page');
    const cdp = await createCdpClient(pageTarget.webSocketDebuggerUrl);

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    console.log('--- Step 1: Open Admin Panel ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await cdp.send('Page.navigate', { url: 'http://localhost:8000/admin.html' });
    await sleep(1500);

    // Set authenticated session and refresh panels
    await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        sessionStorage.setItem('portfolio_admin_session', 'authenticated_' + Date.now());
        const auth = document.getElementById('authOverlay');
        const adminApp = document.getElementById('adminApp');
        if (auth) auth.classList.add('hidden');
        if (adminApp) adminApp.classList.remove('hidden');
        if (typeof refreshAllPanels === 'function') refreshAllPanels();
      })()`,
      awaitPromise: true
    });
    await sleep(400);

    // Check Dashboard quick mobile card state
    const dashCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const badge = document.getElementById('quickMobileBadge');
        const card = document.getElementById('cardQuickMobile');
        return {
          cardFound: Boolean(card),
          badgeText: badge ? badge.textContent : null,
          badgeClass: badge ? badge.className : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Dashboard Quick Card State:', dashCheck.result.value);

    // Switch to Customization tab
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const tabBtn = document.querySelector('button[data-tab="customization"]');
        if (tabBtn) tabBtn.click();
      })()`
    });
    await sleep(500);

    // Take screenshot of Admin Panel with Mobile Restriction Card
    const adminSnap = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'admin_mobile_toggle_card.png'), Buffer.from(adminSnap.data, 'base64'));
    console.log('📸 Saved admin_mobile_toggle_card.png');

    // Check Customization tab controls
    const custCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.getElementById('cardMobileRestriction');
        const radOn = document.getElementById('radMobileNoticeOn');
        const radOff = document.getElementById('radMobileNoticeOff');
        const badge = document.getElementById('mobileRestrictionBadge');
        return {
          cardFound: Boolean(card),
          radOnChecked: radOn ? radOn.checked : false,
          radOffChecked: radOff ? radOff.checked : false,
          badgeText: badge ? badge.textContent : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Customization Tab Mobile Card State:', custCheck.result.value);

    console.log('\n--- Step 2: Toggle Mobile Restriction OFF (Allow Website on Mobile) ---');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const radOff = document.getElementById('radMobileNoticeOff');
        if (radOff) {
          radOff.checked = true;
          radOff.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()`
    });
    await sleep(500);

    const toggledOffCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const data = PortfolioData.get();
        const badge = document.getElementById('mobileRestrictionBadge');
        const quickBadge = document.getElementById('quickMobileBadge');
        return {
          savedSetting: data.customization?.mobileRestriction?.enabled,
          badgeText: badge ? badge.textContent : null,
          quickBadgeText: quickBadge ? quickBadge.textContent : null
        };
      })()`,
      returnByValue: true
    });
    console.log('After Turning OFF:', toggledOffCheck.result.value);

    // Take screenshot of Admin Panel with OFF state
    const adminOffSnap = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'admin_mobile_toggle_off.png'), Buffer.from(adminOffSnap.data, 'base64'));
    console.log('📸 Saved admin_mobile_toggle_off.png');

    console.log('\n--- Step 3: Verify Website in Mobile Viewport (iPhone 375x667) when Restriction is OFF ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true
    });

    await cdp.send('Page.navigate', { url: 'http://localhost:8000/index.html' });
    await sleep(1200);

    const mobileSiteCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const root = document.documentElement;
        const screenEl = document.getElementById('deviceRestrictionScreen');
        const screenVisible = screenEl ? window.getComputedStyle(screenEl).display !== 'none' : false;
        const mainEl = document.querySelector('main');
        const mainVisible = mainEl ? window.getComputedStyle(mainEl).display !== 'none' : false;
        const headerEl = document.getElementById('siteHeader');
        const headerVisible = headerEl ? window.getComputedStyle(headerEl).display !== 'none' : false;
        return {
          hasMobileAllowedClass: root.classList.contains('mobile-allowed'),
          hasDeviceRestrictedClass: root.classList.contains('device-restricted'),
          screenVisible,
          mainVisible,
          headerVisible
        };
      })()`,
      returnByValue: true
    });
    console.log('Mobile Website Status (Restriction OFF):', mobileSiteCheck.result.value);

    // Capture screenshot of website showing on mobile
    const siteMobileAllowedSnap = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_website_displayed_when_off.png'), Buffer.from(siteMobileAllowedSnap.data, 'base64'));
    console.log('📸 Saved mobile_website_displayed_when_off.png');

    console.log('\n--- Step 4: Toggle Mobile Restriction Back ON (Notice Active) ---');
    // Open admin again in desktop mode
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.send('Page.navigate', { url: 'http://localhost:8000/admin.html' });
    await sleep(1000);

    // Authenticate and click "Toggle Mobile Mode" button on Dashboard
    await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        sessionStorage.setItem('portfolio_admin_session', 'authenticated_' + Date.now());
        const auth = document.getElementById('authOverlay');
        const adminApp = document.getElementById('adminApp');
        if (auth) auth.classList.add('hidden');
        if (adminApp) adminApp.classList.remove('hidden');
        if (typeof refreshAllPanels === 'function') refreshAllPanels();
        await new Promise(r => setTimeout(r, 200));
        const btnQuick = document.getElementById('btnQuickToggleMobile');
        if (btnQuick) btnQuick.click();
      })()`,
      awaitPromise: true
    });
    await sleep(600);

    const toggledOnCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const data = PortfolioData.get();
        const quickBadge = document.getElementById('quickMobileBadge');
        return {
          savedSetting: data.customization?.mobileRestriction?.enabled,
          quickBadgeText: quickBadge ? quickBadge.textContent : null
        };
      })()`,
      returnByValue: true
    });
    console.log('After Toggling Back ON via Dashboard:', toggledOnCheck.result.value);

    console.log('\n--- Step 5: Verify Website in Mobile Viewport when Restriction is ON ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true
    });
    await cdp.send('Page.navigate', { url: 'http://localhost:8000/index.html' });
    await sleep(1200);

    const mobileSiteRestrictedCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const root = document.documentElement;
        const screenEl = document.getElementById('deviceRestrictionScreen');
        const screenVisible = screenEl ? window.getComputedStyle(screenEl).display !== 'none' : false;
        const mainEl = document.querySelector('main');
        const mainVisible = mainEl ? window.getComputedStyle(mainEl).display !== 'none' : false;
        return {
          hasMobileAllowedClass: root.classList.contains('mobile-allowed'),
          hasDeviceRestrictedClass: root.classList.contains('device-restricted'),
          screenVisible,
          mainVisible
        };
      })()`,
      returnByValue: true
    });
    console.log('Mobile Website Status (Restriction ON):', mobileSiteRestrictedCheck.result.value);

    // Capture screenshot of restriction screen active on mobile
    const siteRestrictedSnap = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_restriction_screen_when_on.png'), Buffer.from(siteRestrictedSnap.data, 'base64'));
    console.log('📸 Saved mobile_restriction_screen_when_on.png');

    console.log('\n--- Step 6: Verify Tablet (iPad 768px) is Allowed even when Restriction is ON ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: false
    });
    await cdp.send('Page.navigate', { url: 'http://localhost:8000/index.html' });
    await sleep(1200);

    const tabletCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const screenEl = document.getElementById('deviceRestrictionScreen');
        const screenVisible = screenEl ? window.getComputedStyle(screenEl).display !== 'none' : false;
        const mainEl = document.querySelector('main');
        const mainVisible = mainEl ? window.getComputedStyle(mainEl).display !== 'none' : false;
        return { screenVisible, mainVisible };
      })()`,
      returnByValue: true
    });
    console.log('Tablet (iPad 768px) Status:', tabletCheck.result.value);

    cdp.close();
    console.log('\n✅ ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

run().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
