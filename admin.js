/**
 * Pawan K. Kushwaha Portfolio - Admin Control Center Engine
 * Unified, pure management for exact website sections:
 * 1. Hero Section (#hero)
 * 2. Selected Work (#work)
 * 3. Prototyping (#prototyping)
 * 4. Field Notes & Frames (#gallery)
 * 5. Let's Connect & Footer (#connect)
 * Plus Security (Password) and Backup/Restore.
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (window.PortfolioMediaDB && typeof window.PortfolioMediaDB.waitForReady === 'function') {
    await window.PortfolioMediaDB.waitForReady(800);
  }
  initAuth();
  initTabs();
  initProfileManager();
  initAboutManager();
  initProjectsManager();
  initPrototypingManager();
  initGalleryManager();
  initConnectManager();
  initCustomizationManager();
  initSecurityManager();
  initBackupManager();
  initCloudSyncManager();
  initModalCloseHandlers();
  initLivePreviewModal();
  initAutoSave();
  initMediaGuideModal();
  setupMediaUrlEnhancers();

  window.addEventListener('portfolioMediaReady', () => {
    refreshAllPanels();
  });

  const btnGlobal = document.getElementById('btnGlobalSave');
  if (btnGlobal) {
    btnGlobal.addEventListener('click', () => saveAllAdminChanges(true));
  }
});

/* ==========================================================================
   PERSISTENT INDEXEDDB MEDIA UPLOADER & RESOLVER
   ========================================================================== */
function resolveMediaAdmin(src) {
  if (!src) return '';
  if (typeof src !== 'string') return src;
  if (src.startsWith('idb://') && window.PortfolioMediaDB) {
    return window.PortfolioMediaDB.resolveUrlSync(src);
  }
  return src;
}

function generateFastCardDataUrl(fileOrBlob, maxDim = 900, quality = 0.80) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch(err) {
            resolve(e.target.result);
          }
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(fileOrBlob);
    } catch(err) {
      resolve(null);
    }
  });
}

async function handleAdminFileUpload(file, inputEl, previewEl, keyPrefix, isVideo = false) {
  if (!file) return;
  try {
    let processedFile = file;
    if (!isVideo && file.type && file.type.startsWith('image/')) {
      if (window.PortfolioMediaDB && typeof window.PortfolioMediaDB.compressImage === 'function') {
        processedFile = await window.PortfolioMediaDB.compressImage(file, 1600, 1600, 0.82);
      }
    }
    if (isVideo) {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 25) {
        showToast(`⚠️ Video file is too large (${sizeMB.toFixed(1)} MB). GitHub sync limits files to 25MB. Please compress your clip or paste a direct video link.`, 'warning');
        return;
      } else if (sizeMB > 6) {
        showToast(`Notice: Video is ${sizeMB.toFixed(1)} MB. For instant website updates across all devices, clips under 3MB or direct links are recommended.`, 'info');
      }
    }
    const mediaKey = `${keyPrefix}_${Date.now()}`;

    // Read complete Data URL
    const toDataUrl = (blobOrFile) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blobOrFile);
    });
    const dataUrl = await toDataUrl(processedFile);

    // 1. Save in IndexedDB and cache in memory immediately
    if (window.PortfolioMediaDB) {
      await window.PortfolioMediaDB.saveMedia(mediaKey, processedFile);
      if (typeof window.PortfolioMediaDB.setMemoryCache === 'function') {
        window.PortfolioMediaDB.setMemoryCache(mediaKey, dataUrl);
      }
    }

    // 2. Set input value
    if (inputEl) {
      inputEl.value = `idb://${mediaKey}`;
    }

    // 3. Set preview directly
    if (previewEl) {
      previewEl.src = dataUrl || (processedFile instanceof Blob ? URL.createObjectURL(processedFile) : '');
      if (isVideo && typeof previewEl.play === 'function') {
        previewEl.muted = true;
        previewEl.play().catch(() => {});
      }
    }

    // 4. Cache in localStorage for zero-delay refresh
    if (!isVideo && dataUrl) {
      try {
        localStorage.setItem(`fast_media_${mediaKey}`, dataUrl);
        const m = keyPrefix.match(/hero_card_(\d)/);
        if (m) {
          localStorage.setItem(`fast_hero_card_${m[1]}`, dataUrl);
        }
      } catch (quotaErr) {
        try {
          Object.keys(localStorage).forEach(k => {
            if (k.startsWith('fast_media_') && k !== `fast_media_${mediaKey}`) {
              localStorage.removeItem(k);
            }
          });
          localStorage.setItem(`fast_media_${mediaKey}`, dataUrl);
        } catch (_) {}
      }
    }

    if (inputEl) {
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
    showToast(`${isVideo ? 'Video' : 'Image'} uploaded & saved!`, 'success');
  } catch (err) {
    console.error('File upload error:', err);
    showToast('Failed to upload file.', 'error');
  }
}

function checkLocalPathWarning(inputEl) {
  if (!inputEl) return;
  const val = inputEl.value.trim();
  const isLocalDisk = /^(?:[a-zA-Z]:[\\\/]|\/Users\/|\/home\/|file:)/i.test(val);
  const parent = inputEl.closest('.form-group') || inputEl.parentNode;
  let warningEl = parent.querySelector('.local-path-warning');
  if (isLocalDisk) {
    if (!warningEl) {
      warningEl = document.createElement('div');
      warningEl.className = 'local-path-warning';
      warningEl.style.cssText = 'color: #D97706; font-size: 11.5px; margin-top: 5px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); padding: 5px 8px; border-radius: 6px; line-height: 1.4;';
      warningEl.innerHTML = '⚠️ <strong>Browser Security Note:</strong> Browsers block loading direct computer paths (<code>C:\\...</code>). Click 📁 <strong>Upload</strong> to store the file directly, or copy it to the project\'s <code>assets/</code> folder.';
      parent.appendChild(warningEl);
    }
  } else {
    if (warningEl) warningEl.remove();
  }
}

/* ==========================================================================
   SMART MEDIA URL PROCESSING, AUTO-CONVERSION & LINK VALIDATION
   ========================================================================== */
function processMediaUrlInput(rawInput, expectedType = 'any') {
  if (!rawInput || typeof rawInput !== 'string') {
    return { original: '', url: '', isExternal: false, detectedType: 'unknown' };
  }
  let url = rawInput.trim();
  // Strip surrounding quotes
  url = url.replace(/^[\"'«»“”]|[\"'«»“”]$/g, '').trim();

  let converted = false;
  let note = '';

  // 1. Google Drive Share Link conversion
  // Format: https://drive.google.com/file/d/FILE_ID/view... or https://drive.google.com/open?id=FILE_ID
  const gDriveMatch = url.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+))/i);
  if (gDriveMatch) {
    const fileId = gDriveMatch[1] || gDriveMatch[2];
    if (fileId) {
      url = `https://lh3.googleusercontent.com/d/${fileId}`;
      converted = true;
      note = 'Auto-converted Google Drive link to direct CDN stream';
    }
  }

  // 2. Dropbox share link conversion (dl=0 -> raw=1)
  if (url.includes('dropbox.com') && (url.includes('dl=0') || !url.includes('raw=1'))) {
    if (url.includes('dl=0')) url = url.replace('dl=0', 'raw=1');
    else url += (url.includes('?') ? '&' : '?') + 'raw=1';
    converted = true;
    note = 'Auto-converted Dropbox link to direct download stream';
  }

  // 3. GitHub Blob link conversion (github.com/.../blob/... -> raw.githubusercontent.com)
  const ghBlobMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/i);
  if (ghBlobMatch) {
    url = `https://raw.githubusercontent.com/${ghBlobMatch[1]}/${ghBlobMatch[2]}/${ghBlobMatch[3]}/${ghBlobMatch[4]}`;
    converted = true;
    note = 'Auto-converted GitHub link to raw CDN';
  }

  // 4. Imgur single page link to direct image link
  const imgurMatch = url.match(/^https?:\/\/(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)(?:\.[a-zA-Z]+)?$/i);
  if (imgurMatch && !url.includes('/a/') && !url.includes('/gallery/')) {
    const id = imgurMatch[1];
    if (!/\.(jpg|jpeg|png|gif|webp|mp4)$/i.test(url)) {
      url = `https://i.imgur.com/${id}.jpg`;
      converted = true;
      note = 'Auto-converted Imgur link to direct image';
    }
  }

  const isExternal = /^https?:\/\//i.test(url);
  const isVideoExt = /\.(mp4|webm|mov|ogg|m4v)($|\?|#)/i.test(url) || url.includes('/video/upload/') || (url.includes('cloudinary.com') && url.includes('/video/'));
  const isImageExt = /\.(jpg|jpeg|png|webp|gif|svg|avif)($|\?|#)/i.test(url) || url.includes('/image/upload/') || (url.includes('cloudinary.com') && url.includes('/image/'));
  const isYouTube = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/i.test(url);
  const isVimeo = /vimeo\.com\/(?:video\/)?([0-9]+)/i.test(url);

  let detectedType = 'unknown';
  if (isVideoExt || isYouTube || isVimeo) detectedType = 'video';
  else if (isImageExt) detectedType = 'image';

  return {
    original: rawInput,
    url: url,
    converted: converted,
    note: note,
    isExternal: isExternal,
    detectedType: detectedType,
    isVideoExt: isVideoExt,
    isImageExt: isImageExt,
    isYouTube: isYouTube,
    isVimeo: isVimeo
  };
}

function updateMediaInputStatus(inputEl, expectedType = 'any') {
  if (!inputEl) return;
  const val = inputEl.value.trim();
  const parent = inputEl.closest('.form-group') || inputEl.parentNode;
  let statusRow = parent.querySelector('.media-url-status-row');

  if (!statusRow) {
    statusRow = document.createElement('div');
    statusRow.className = 'media-url-status-row';
    const rowWrap = inputEl.closest('.img-picker-row') || inputEl.closest('.video-picker-row') || inputEl.parentNode;
    if (rowWrap && rowWrap.parentNode) {
      rowWrap.parentNode.insertBefore(statusRow, rowWrap.nextSibling);
    } else {
      parent.appendChild(statusRow);
    }
  }

  // Update open/test link button if present
  const openBtn = parent.querySelector('.btn-sm-open-link');
  if (openBtn) {
    if (/^https?:\/\//i.test(val)) {
      openBtn.href = val;
      openBtn.style.display = 'inline-flex';
    } else {
      openBtn.style.display = 'none';
    }
  }

  if (!val) {
    statusRow.innerHTML = '';
    statusRow.style.display = 'none';
    return;
  }

  statusRow.style.display = 'flex';
  const norm = processMediaUrlInput(val, expectedType);

  // Type mismatch check
  if (expectedType === 'image' && norm.detectedType === 'video') {
    statusRow.innerHTML = `
      <span class="media-url-status-pill pill-warn">🎬 Video URL detected</span>
      <span class="media-url-status-pill pill-switch" data-action="switch-to-video" title="Click to switch this card to Video mode">Switch to Video ➔</span>
    `;
    const switchBtn = statusRow.querySelector('[data-action="switch-to-video"]');
    if (switchBtn) {
      switchBtn.onclick = () => {
        const cardBox = inputEl.closest('.hero-card-admin-box') || inputEl.closest('.project-card-editor-box') || inputEl.closest('form');
        if (cardBox) {
          const vidRadio = cardBox.querySelector('input[type="radio"][value="video"]');
          if (vidRadio) {
            vidRadio.checked = true;
            vidRadio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      };
    }
    return;
  }

  if (expectedType === 'video' && norm.detectedType === 'image') {
    statusRow.innerHTML = `
      <span class="media-url-status-pill pill-warn">🖼️ Image URL detected</span>
      <span class="media-url-status-pill pill-switch" data-action="switch-to-image" title="Click to switch this card to Image mode">Switch to Image ➔</span>
    `;
    const switchBtn = statusRow.querySelector('[data-action="switch-to-image"]');
    if (switchBtn) {
      switchBtn.onclick = () => {
        const cardBox = inputEl.closest('.hero-card-admin-box') || inputEl.closest('.project-card-editor-box') || inputEl.closest('form');
        if (cardBox) {
          const imgRadio = cardBox.querySelector('input[type="radio"][value="image"]');
          if (imgRadio) {
            imgRadio.checked = true;
            imgRadio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      };
    }
    return;
  }

  if (/^(?:[a-zA-Z]:[\\\/]|\/Users\/|\/home\/|file:)/i.test(val)) {
    statusRow.innerHTML = '<span class="media-url-status-pill pill-warn">⚠️ Computer path blocked by browser security. Click 📁 Upload or use a web link.</span>';
    return;
  }

  if (norm.isExternal) {
    let extra = '';
    if (norm.converted) extra = ` • ${norm.note}`;
    statusRow.innerHTML = `<span class="media-url-status-pill pill-cdn">🌐 Remote CDN Link • 0 KB saved to data • Fast &lt;1s sync${extra}</span>`;
  } else if (val.startsWith('assets/')) {
    statusRow.innerHTML = `<span class="media-url-status-pill pill-local">📁 Local Asset: ${val}</span>`;
  } else if (val.startsWith('idb://')) {
    statusRow.innerHTML = '<span class="media-url-status-pill pill-cdn">💾 Stored in local database</span>';
  } else {
    statusRow.innerHTML = `<span class="media-url-status-pill pill-local">🔗 Path: ${val}</span>`;
  }
}

function setupMediaUrlEnhancers() {
  const mediaInputIds = [
    { id: 'heroCardImg1', type: 'image' },
    { id: 'heroCardVid1', type: 'video' },
    { id: 'heroCardImg2', type: 'image' },
    { id: 'heroCardVid2', type: 'video' },
    { id: 'heroCardImg3', type: 'image' },
    { id: 'heroCardVid3', type: 'video' },
    { id: 'heroCardImg4', type: 'image' },
    { id: 'heroCardVid4', type: 'video' },
    { id: 'aboutPortraitImg', type: 'image' },
    { id: 'fieldProjImage', type: 'image' },
    { id: 'fieldProjMobileImage', type: 'image' },
    { id: 'fieldProjVideo', type: 'video' },
    { id: 'fieldGallerySrc', type: 'image' },
    { id: 'fieldGalleryVideo', type: 'video' },
    { id: 'connMediaSrc', type: 'image' },
    { id: 'connVideoSrc', type: 'video' },
    { id: 'fieldProtoSrc', type: 'image' },
    { id: 'fieldProtoVideo', type: 'video' },
    { id: 'custLockScreenImage', type: 'image' },
    { id: 'fieldToolCustomImg', type: 'image' }
  ];

  mediaInputIds.forEach(({ id, type }) => {
    const input = document.getElementById(id);
    if (!input || input.dataset.urlEnhanced === 'true') return;
    input.dataset.urlEnhanced = 'true';

    // Upgrade placeholder if generic
    if (type === 'image' && (!input.placeholder || input.placeholder.startsWith('assets/'))) {
      input.placeholder = 'Paste image link (Cloudinary, Imgur, Supabase) or assets/path';
    } else if (type === 'video' && (!input.placeholder || input.placeholder.includes('video.mp4'))) {
      input.placeholder = 'Paste video link (Cloudinary MP4, GitHub CDN) or assets/path';
    }

    const parent = input.parentNode;
    if (parent && parent.classList.contains('input-with-action')) {
      parent.classList.add('media-enhanced');
      let actionBar = parent.querySelector('.media-url-action-bar');
      if (!actionBar) {
        actionBar = document.createElement('div');
        actionBar.className = 'media-url-action-bar';
        parent.appendChild(actionBar);
      }

      // Add Paste Button
      if (!actionBar.querySelector('.btn-sm-paste')) {
        const pasteBtn = document.createElement('button');
        pasteBtn.type = 'button';
        pasteBtn.className = 'btn-sm-paste';
        pasteBtn.title = 'Paste Link / URL from clipboard';
        pasteBtn.innerHTML = '📋 Paste Link';

        pasteBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          let text = '';
          try {
            if (navigator.clipboard && navigator.clipboard.readText) {
              text = await navigator.clipboard.readText();
            }
          } catch(err) {}
          if (!text) {
            text = window.prompt(`Paste your ${type === 'video' ? 'Video' : 'Photo'} Link / URL:`);
          }
          if (text) {
            const norm = processMediaUrlInput(text, type);
            if (input.disabled) {
              input.disabled = false;
            }
            if (id === 'fieldProjVideo') window.updateProjMediaTypeUI?.('video');
            if (id === 'fieldProjImage') window.updateProjMediaTypeUI?.('image');
            if (id === 'fieldGalleryVideo') window.updateGalleryMediaTypeUI?.('video');
            if (id === 'fieldGallerySrc') window.updateGalleryMediaTypeUI?.('image');

            input.value = norm.url;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            if (typeof showToast === 'function') {
              showToast(`✓ ${type === 'video' ? 'Video' : 'Image'} link pasted & loaded!`);
            }
          }
        });
        actionBar.appendChild(pasteBtn);
      }

      // Move upload button into action bar if found
      const uploadBtn = parent.querySelector('.btn-sm-upload');
      if (uploadBtn && uploadBtn.parentNode !== actionBar) {
        actionBar.appendChild(uploadBtn);
      }

      // Add Open Link Test Button
      if (!actionBar.querySelector('.btn-sm-open-link')) {
        const testLink = document.createElement('a');
        testLink.className = 'btn-sm-open-link';
        testLink.target = '_blank';
        testLink.rel = 'noopener noreferrer';
        testLink.title = 'Test link in new tab';
        testLink.innerHTML = '↗ Open Link';
        testLink.style.display = 'none';
        actionBar.appendChild(testLink);
      }
    }

    // Input & Paste event handlers for smart normalization
    const handleValueUpdate = () => {
      const raw = input.value;
      const norm = processMediaUrlInput(raw, type);
      if (norm.converted && norm.url !== raw) {
        input.value = norm.url;
      }
      checkLocalPathWarning(input);
      updateMediaInputStatus(input, type);
    };

    input.addEventListener('input', handleValueUpdate);
    input.addEventListener('change', handleValueUpdate);
    input.addEventListener('paste', () => setTimeout(handleValueUpdate, 50));

    // Initial status check
    updateMediaInputStatus(input, type);
  });
}

/* ==========================================================================
   MEDIA HOSTING & DIRECT URL GUIDE MODAL CONTROLLER
   ========================================================================== */
function initMediaGuideModal() {
  const modal = document.getElementById('modalMediaGuide');
  if (!modal) return;

  // Open triggers
  document.querySelectorAll('.btn-open-media-guide').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    });
  });

  // Tab switching inside guide
  const tabButtons = modal.querySelectorAll('.btn-guide-tab');
  const tabPanes = modal.querySelectorAll('.guide-tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tabTarget;
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
    });
  });

  // Copy sample URLs
  modal.querySelectorAll('.btn-guide-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.copyTarget;
      const codeEl = document.getElementById(targetId);
      if (codeEl) {
        const text = codeEl.textContent.trim();
        navigator.clipboard.writeText(text).then(() => {
          if (typeof showToast === 'function') showToast('Sample URL copied to clipboard! Click "📋 Paste" next to any input.');
        }).catch(() => {
          if (typeof showToast === 'function') showToast('Sample URL: ' + text);
        });
      }
    });
  });

  // Live Link Tester & Converter inside Guide
  const testerInput = document.getElementById('guideTesterInput');
  const btnRunTest = document.getElementById('btnRunGuideTest');
  const testerResult = document.getElementById('guideTesterResult');

  if (testerInput && btnRunTest && testerResult) {
    const runTest = () => {
      const raw = testerInput.value.trim();
      if (!raw) {
        testerResult.style.display = 'none';
        return;
      }

      const norm = processMediaUrlInput(raw);
      testerResult.style.display = 'block';

      let mediaPreviewHtml = '';
      if (norm.detectedType === 'video') {
        mediaPreviewHtml = `
          <div style="margin-top: 10px; border-radius: 8px; overflow: hidden; max-height: 200px; background: #000;">
            <video src="${norm.url}" autoplay muted loop playsinline controls style="width: 100%; max-height: 200px; object-fit: contain;"></video>
          </div>
        `;
      } else {
        mediaPreviewHtml = `
          <div style="margin-top: 10px; border-radius: 8px; overflow: hidden; max-height: 200px; background: #F1F5F9; text-align: center;">
            <img src="${norm.url}" alt="Preview" style="max-width: 100%; max-height: 200px; object-fit: contain;" onerror="this.alt='Failed to load image. Check if URL is public.';">
          </div>
        `;
      }

      testerResult.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <strong style="font-size: 13px; color: #0F172A;">Detected Type: <span style="color: #2563EB; text-transform: uppercase;">${norm.detectedType}</span></strong>
          <span class="media-url-status-pill ${norm.isExternal ? 'pill-cdn' : 'pill-local'}">${norm.isExternal ? '🌐 Remote CDN' : '📁 Local Path'}</span>
        </div>
        ${norm.converted ? `<div style="font-size: 12px; color: #059669; font-weight: 600; margin-bottom: 6px;">✓ ${norm.note}</div>` : ''}
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 10px; font-family: monospace; font-size: 12px; word-break: break-all; margin-bottom: 10px;">
          ${norm.url}
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn-primary btn-sm" id="btnCopyTestedUrl" style="padding: 6px 12px; font-size: 12px;">Copy Direct Link 📋</button>
          <a href="${norm.url}" target="_blank" class="btn-outline-admin btn-sm" style="padding: 6px 12px; font-size: 12px; text-decoration: none;">Open in New Tab ↗</a>
        </div>
        ${mediaPreviewHtml}
      `;

      const copyBtn = document.getElementById('btnCopyTestedUrl');
      if (copyBtn) {
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(norm.url).then(() => {
            if (typeof showToast === 'function') showToast('✓ Direct URL copied! Paste into any input in Admin.');
          });
        };
      }
    };

    btnRunTest.addEventListener('click', runTest);
    testerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runTest();
      }
    });
  }
}

/* ==========================================================================
   1. AUTHENTICATION & LOGIN GATE (UPGRADED WITH BRUTE-FORCE SHIELD & SESSION TIMEOUT)
   ========================================================================== */
function initAuth() {
  const authOverlay = document.getElementById('authOverlay');
  const adminApp = document.getElementById('adminApp');
  const authForm = document.getElementById('authForm');
  const passInput = document.getElementById('authPasswordInput');
  const errorMsg = document.getElementById('authErrorMsg');
  const btnLogout = document.getElementById('btnLogout');
  const btnToggleAuthPass = document.getElementById('btnToggleAuthPass');
  const authFooterHint = document.getElementById('authFooterHint');
  const authLockoutBanner = document.getElementById('authLockoutBanner');
  const authLockoutSeconds = document.getElementById('authLockoutSeconds');
  const btnAuthUnlock = document.getElementById('btnAuthUnlock');
  const btnShowRecoveryPrompt = document.getElementById('btnShowRecoveryPrompt');
  const authRecoveryBox = document.getElementById('authRecoveryBox');
  const authRecoveryInput = document.getElementById('authRecoveryInput');
  const btnSubmitRecoveryKey = document.getElementById('btnSubmitRecoveryKey');

  let lockoutTimerInterval = null;

  function updateFooterHint() {
    if (!authFooterHint) return;
    if (window.PortfolioData && PortfolioData.auth.isCustomPasswordSet()) {
      authFooterHint.innerHTML = '<span>🔒 Protected by Custom Master Password</span>';
    } else {
      authFooterHint.innerHTML = '<span>Default password: <strong>pawan@2025</strong></span>';
    }
  }

  function checkLockout() {
    if (!window.PortfolioData) return;
    const lockout = PortfolioData.auth.getLockoutState();
    if (lockout.isLocked) {
      if (authLockoutBanner) authLockoutBanner.classList.remove('hidden');
      if (btnAuthUnlock) btnAuthUnlock.disabled = true;
      if (passInput) passInput.disabled = true;
      let remaining = lockout.remainingSeconds;
      if (authLockoutSeconds) authLockoutSeconds.textContent = remaining;

      if (lockoutTimerInterval) clearInterval(lockoutTimerInterval);
      lockoutTimerInterval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(lockoutTimerInterval);
          lockoutTimerInterval = null;
          if (authLockoutBanner) authLockoutBanner.classList.add('hidden');
          if (btnAuthUnlock) btnAuthUnlock.disabled = false;
          if (passInput) {
            passInput.disabled = false;
            passInput.focus();
          }
        } else {
          if (authLockoutSeconds) authLockoutSeconds.textContent = remaining;
        }
      }, 1000);
    } else {
      if (authLockoutBanner) authLockoutBanner.classList.add('hidden');
      if (btnAuthUnlock) btnAuthUnlock.disabled = false;
      if (passInput) passInput.disabled = false;
    }
  }

  // Toggle password visibility
  if (btnToggleAuthPass && passInput) {
    btnToggleAuthPass.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      btnToggleAuthPass.textContent = isPass ? '🙈' : '👁️';
    });
  }

  // Toggle recovery key box
  if (btnShowRecoveryPrompt && authRecoveryBox) {
    btnShowRecoveryPrompt.addEventListener('click', () => {
      authRecoveryBox.classList.toggle('hidden');
      if (!authRecoveryBox.classList.contains('hidden') && authRecoveryInput) {
        authRecoveryInput.focus();
      }
    });
  }

  // Handle recovery key submission
  if (btnSubmitRecoveryKey && authRecoveryInput) {
    btnSubmitRecoveryKey.addEventListener('click', async () => {
      const keyVal = authRecoveryInput.value.trim();
      if (!keyVal) {
        alert('Please enter your emergency recovery key.');
        authRecoveryInput.focus();
        return;
      }
      const isValid = await PortfolioData.auth.verifyPassword(keyVal);
      if (isValid) {
        authOverlay.classList.add('hidden');
        adminApp.classList.remove('hidden');
        authRecoveryInput.value = '';
        authRecoveryBox.classList.add('hidden');
        refreshAllPanels();
        showToast('Unlocked via Recovery Key! Please set a new password now.', 'warning');
        if (window.switchTab) window.switchTab('security');
      } else {
        alert('Invalid emergency recovery key.');
        authRecoveryInput.classList.add('shake');
        setTimeout(() => authRecoveryInput.classList.remove('shake'), 500);
      }
    });
  }

  // Check existing session
  if (window.PortfolioData && PortfolioData.auth.isAuthenticated()) {
    authOverlay.classList.add('hidden');
    adminApp.classList.remove('hidden');
    refreshAllPanels();
  } else {
    authOverlay.classList.remove('hidden');
    adminApp.classList.add('hidden');
    checkLockout();
    updateFooterHint();
  }

  const btnResetToDefaultPass = document.getElementById('btnResetToDefaultPass');
  if (btnResetToDefaultPass) {
    btnResetToDefaultPass.addEventListener('click', () => {
      PortfolioData.auth.resetPasswordToDefault();
      if (passInput) {
        passInput.disabled = false;
        passInput.value = 'pawan@2025';
        passInput.type = 'text';
        if (btnToggleAuthPass) btnToggleAuthPass.textContent = '🙈';
        passInput.focus();
      }
      if (btnAuthUnlock) btnAuthUnlock.disabled = false;
      if (authLockoutBanner) authLockoutBanner.classList.add('hidden');
      if (lockoutTimerInterval) {
        clearInterval(lockoutTimerInterval);
        lockoutTimerInterval = null;
      }
      updateFooterHint();
      showToast('Password reset to default (pawan@2025). Click Unlock!', 'info');
    });
  }

  // Handle unlock submission
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = passInput.value.trim();
      const isDefault = (password.toLowerCase() === 'pawan@2025' || password.toLowerCase() === 'admin123');

      const lockout = PortfolioData.auth.getLockoutState();
      if (lockout.isLocked && !isDefault) return;

      errorMsg.classList.remove('visible');

      const isValid = await PortfolioData.auth.verifyPassword(password);
      if (isValid) {
        authOverlay.classList.add('hidden');
        adminApp.classList.remove('hidden');
        passInput.value = '';
        if (authLockoutBanner) authLockoutBanner.classList.add('hidden');
        if (lockoutTimerInterval) {
          clearInterval(lockoutTimerInterval);
          lockoutTimerInterval = null;
        }
        refreshAllPanels();
        showToast('Welcome to Owner Control Center!', 'success');
      } else {
        errorMsg.classList.add('visible');
        passInput.classList.add('shake');
        setTimeout(() => passInput.classList.remove('shake'), 500);
        passInput.focus();
        checkLockout();
      }
    });
  }

  // Handle logout
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      PortfolioData.auth.logout();
      authOverlay.classList.remove('hidden');
      adminApp.classList.add('hidden');
      if (passInput) passInput.value = '';
      checkLockout();
      updateFooterHint();
      showToast('Logged out successfully.', 'success');
    });
  }

  // Inactivity auto-lock session monitoring
  let lastTouch = 0;
  function handleActivity() {
    const now = Date.now();
    if (now - lastTouch > 10000) { // Throttle touch calls to at most once per 10s
      lastTouch = now;
      if (window.PortfolioData) PortfolioData.auth.touchSession();
    }
  }
  window.addEventListener('mousemove', handleActivity, { passive: true });
  window.addEventListener('keydown', handleActivity, { passive: true });
  window.addEventListener('click', handleActivity, { passive: true });
  window.addEventListener('scroll', handleActivity, { passive: true });

  // Periodically check if session has expired
  setInterval(() => {
    if (adminApp && !adminApp.classList.contains('hidden')) {
      if (window.PortfolioData && !PortfolioData.auth.isAuthenticated()) {
        authOverlay.classList.remove('hidden');
        adminApp.classList.add('hidden');
        if (passInput) passInput.value = '';
        checkLockout();
        updateFooterHint();
        showToast('Session locked due to inactivity.', 'info');
      }
    }
  }, 15000);
}

/* ==========================================================================
   2. TAB NAVIGATION & DASHBOARD
   ========================================================================== */
function initTabs() {
  const navItems = document.querySelectorAll('.admin-sidebar .nav-item');
  const tabPanels = document.querySelectorAll('.tab-panel');

  window.switchTab = function(tabName) {
    navItems.forEach(item => {
      if (item.dataset.tab === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    tabPanels.forEach(panel => {
      if (panel.id === `tab-${tabName}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabName = item.dataset.tab;
      window.switchTab(tabName);
    });
  });

  // Quick action jumps from dashboard
  const btnQuickProfile = document.getElementById('btnQuickProfile');
  const btnQuickAddProject = document.getElementById('btnQuickAddProject');
  const btnQuickProto = document.getElementById('btnQuickProto');
  const btnQuickGallery = document.getElementById('btnQuickGallery');
  const btnQuickCustomization = document.getElementById('btnQuickCustomization');
  const btnQuickConnect = document.getElementById('btnQuickConnect');
  const btnQuickExport = document.getElementById('btnQuickExport');

  if (btnQuickCustomization) {
    btnQuickCustomization.addEventListener('click', () => window.switchTab('customization'));
  }

  if (btnQuickProfile) {
    btnQuickProfile.addEventListener('click', () => window.switchTab('profile'));
  }

  const btnQuickAbout = document.getElementById('btnQuickAbout');
  if (btnQuickAbout) {
    btnQuickAbout.addEventListener('click', () => window.switchTab('about'));
  }

  if (btnQuickAddProject) {
    btnQuickAddProject.addEventListener('click', () => {
      window.switchTab('projects');
      document.getElementById('btnOpenNewProjectModal')?.click();
    });
  }

  if (btnQuickProto) {
    btnQuickProto.addEventListener('click', () => window.switchTab('prototyping'));
  }

  if (btnQuickGallery) {
    btnQuickGallery.addEventListener('click', () => window.switchTab('gallery'));
  }

  if (btnQuickConnect) {
    btnQuickConnect.addEventListener('click', () => window.switchTab('connect'));
  }

  if (btnQuickExport) {
    btnQuickExport.addEventListener('click', async () => {
      await PortfolioData.exportJSON();
      showToast('Backup JSON downloaded successfully!', 'success');
    });
  }
}

function refreshAllPanels() {
  updateDashboardStats();
  loadProfileData();
  loadAboutData();
  loadCustomizationData();
  loadProjectsData();
  renderProjectsTable();
  loadPrototypingData();
  renderPrototypingGrid();
  loadGalleryData();
  renderGalleryGrid();
  loadConnectData();
  if (typeof refreshSecurityOverview === 'function') {
    refreshSecurityOverview();
  }
}

function updateDashboardStats() {
  const data = PortfolioData.get();
  
  const statProj = document.getElementById('statProjects');
  const statProto = document.getElementById('statPrototypes');
  const statGallery = document.getElementById('statGallery');
  const statHero = document.getElementById('statHeroCards');
  const sideProj = document.getElementById('sidebarProjectCount');
  const sideProto = document.getElementById('sidebarProtoCount');
  const sideGallery = document.getElementById('sidebarGalleryCount');

  const projLen = (data.projects || []).length;
  const protoLen = (data.prototypes || []).length;
  const galLen = (data.gallery || []).length;
  const heroLen = (data.heroCards || []).length || 4;

  if (statProj) statProj.textContent = projLen;
  if (sideProj) sideProj.textContent = projLen;
  if (statProto) statProto.textContent = protoLen;
  if (sideProto) sideProto.textContent = protoLen;
  if (statGallery) statGallery.textContent = galLen;
  if (sideGallery) sideGallery.textContent = galLen;
  if (statHero) statHero.textContent = heroLen;

  const isMobileNoticeEnabled = data.customization?.mobileRestriction?.enabled !== false;
  const quickBadge = document.getElementById('quickMobileBadge');
  if (quickBadge) {
    if (isMobileNoticeEnabled) {
      quickBadge.textContent = 'NOTICE ON';
      quickBadge.className = 'media-status-badge active';
    } else {
      quickBadge.textContent = 'NOTICE OFF';
      quickBadge.className = 'media-status-badge disabled';
    }
  }
}

/* ==========================================================================
   3. HERO SECTION (SECTION 1) MANAGER
   ========================================================================== */
function initProfileManager() {
  const btnSave = document.getElementById('btnSaveProfile');

  window.updateHeroMediaTypeUI = function(cardIdx, type) {
    const radioImg = document.getElementById(`heroMediaTypeImage${cardIdx}`);
    const radioVid = document.getElementById(`heroMediaTypeVideo${cardIdx}`);
    const labelImg = document.getElementById(`labelHeroMediaTypeImage${cardIdx}`);
    const labelVid = document.getElementById(`labelHeroMediaTypeVideo${cardIdx}`);
    const imgGroup = document.getElementById(`heroCardImgGroup${cardIdx}`);
    const vidGroup = document.getElementById(`heroCardVidGroup${cardIdx}`);
    const imgInp = document.getElementById(`heroCardImg${cardIdx}`);
    const vidInp = document.getElementById(`heroCardVid${cardIdx}`);
    const imgUpload = document.getElementById(`fileHeroCardUpload${cardIdx}`);
    const vidUpload = document.getElementById(`fileHeroCardVidUpload${cardIdx}`);
    const imgUploadBtn = document.getElementById(`fileHeroCardUploadBtn${cardIdx}`);
    const vidUploadBtn = document.getElementById(`fileHeroCardVidUploadBtn${cardIdx}`);
    const imgBadge = document.getElementById(`heroCardImgBadge${cardIdx}`);
    const vidBadge = document.getElementById(`heroCardVidBadge${cardIdx}`);

    if (type === 'video') {
      if (radioVid) radioVid.checked = true;
      labelVid?.classList.add('active');
      labelImg?.classList.remove('active');

      // Video Active
      if (vidInp) vidInp.disabled = false;
      if (vidUpload) vidUpload.disabled = false;
      vidUploadBtn?.classList.remove('disabled');
      vidGroup?.classList.remove('is-disabled');
      vidGroup?.classList.add('is-active');
      if (vidBadge) {
        vidBadge.className = 'media-status-badge active';
        vidBadge.textContent = '● Active';
      }

      // Photo Disabled
      if (imgInp) imgInp.disabled = true;
      if (imgUpload) imgUpload.disabled = true;
      imgUploadBtn?.classList.add('disabled');
      imgGroup?.classList.add('is-disabled');
      imgGroup?.classList.remove('is-active');
      if (imgBadge) {
        imgBadge.className = 'media-status-badge disabled';
        imgBadge.textContent = '⊘ Disabled';
      }
    } else {
      if (radioImg) radioImg.checked = true;
      labelImg?.classList.add('active');
      labelVid?.classList.remove('active');

      // Photo Active
      if (imgInp) imgInp.disabled = false;
      if (imgUpload) imgUpload.disabled = false;
      imgUploadBtn?.classList.remove('disabled');
      imgGroup?.classList.remove('is-disabled');
      imgGroup?.classList.add('is-active');
      if (imgBadge) {
        imgBadge.className = 'media-status-badge active';
        imgBadge.textContent = '● Active';
      }

      // Video Disabled
      if (vidInp) vidInp.disabled = true;
      if (vidUpload) vidUpload.disabled = true;
      vidUploadBtn?.classList.add('disabled');
      vidGroup?.classList.add('is-disabled');
      vidGroup?.classList.remove('is-active');
      if (vidBadge) {
        vidBadge.className = 'media-status-badge disabled';
        vidBadge.textContent = '⊘ Disabled';
      }
    }
  };

  // Bind 4 Hero Overlapping Cards Previews, Option Switchers and File Uploaders
  for (let i = 1; i <= 4; i++) {
    const radioImg = document.getElementById(`heroMediaTypeImage${i}`);
    const radioVid = document.getElementById(`heroMediaTypeVideo${i}`);
    if (radioImg) radioImg.addEventListener('change', () => window.updateHeroMediaTypeUI(i, 'image'));
    if (radioVid) radioVid.addEventListener('change', () => window.updateHeroMediaTypeUI(i, 'video'));

    const imgGroup = document.getElementById(`heroCardImgGroup${i}`);
    const vidGroup = document.getElementById(`heroCardVidGroup${i}`);
    if (imgGroup) {
      imgGroup.addEventListener('click', () => {
        if (imgGroup.classList.contains('is-disabled')) {
          window.updateHeroMediaTypeUI(i, 'image');
          document.getElementById(`heroCardImg${i}`)?.focus();
        }
      });
    }
    if (vidGroup) {
      vidGroup.addEventListener('click', () => {
        if (vidGroup.classList.contains('is-disabled')) {
          window.updateHeroMediaTypeUI(i, 'video');
          document.getElementById(`heroCardVid${i}`)?.focus();
        }
      });
    }

    const imgInp = document.getElementById(`heroCardImg${i}`);
    const imgPrev = document.getElementById(`heroCardPreview${i}`);
    const imgUpload = document.getElementById(`fileHeroCardUpload${i}`);
    const vidInp = document.getElementById(`heroCardVid${i}`);
    const vidPrev = document.getElementById(`heroCardVidPreview${i}`);
    const vidUpload = document.getElementById(`fileHeroCardVidUpload${i}`);

    if (imgInp && imgPrev) {
      imgInp.addEventListener('input', () => {
        checkLocalPathWarning(imgInp);
        imgPrev.src = resolveMediaAdmin(imgInp.value) || `assets/images/hero_card_${i}.jpg`;
        const val = imgInp.value.trim();
        if (val && !val.startsWith('idb://') && !val.startsWith('blob:')) {
          try { localStorage.setItem(`fast_hero_card_${i}`, val); } catch(e) {}
        }
      });
    }
    if (imgUpload && imgInp && imgPrev) {
      imgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        handleAdminFileUpload(file, imgInp, imgPrev, `hero_card_${i}_img`, false);
      });
    }

    if (vidInp && vidPrev) {
      vidInp.addEventListener('input', () => {
        checkLocalPathWarning(vidInp);
        const resolved = resolveMediaAdmin(vidInp.value);
        vidPrev.src = resolved;
        if (resolved) {
          vidPrev.muted = true;
          vidPrev.play().catch(() => {});
        }
      });
    }
    if (vidUpload && vidInp && vidPrev) {
      vidUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        handleAdminFileUpload(file, vidInp, vidPrev, `hero_card_${i}_vid`, true);
      });
    }
  }

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const data = PortfolioData.get();

      data.profile = {
        ...data.profile,
        role: document.getElementById('profRole')?.value.trim() || 'PRODUCT DESIGNER',
        titleLine1: document.getElementById('profTitleLine1')?.value.trim() || 'PAWAN K.',
        titleLine2: document.getElementById('profTitleLine2')?.value.trim() || 'KUSHWAHA',
        ctaWorkText: document.getElementById('profCtaWorkText')?.value.trim() || 'View My Work',
        ctaWorkUrl: document.getElementById('profCtaWorkUrl')?.value.trim() || '#work',
        ctaStoryText: document.getElementById('profCtaStoryText')?.value.trim() || 'Send an Email',
        ctaStoryUrl: document.getElementById('profCtaStoryUrl')?.value.trim() || 'mailto:pawankushwaha1@gmail.com',
        music: {
          ...(data.profile?.music || {}),
          audioSrc: document.getElementById('profMusicSrc')?.value.trim() || 'assets/audio/ambient_lofi.wav'
        }
      };

      // Save 4 Hero Overlapping Cards
      data.heroCards = data.heroCards || [];
      for (let i = 1; i <= 4; i++) {
        const titleVal = document.getElementById(`heroCardTitle${i}`)?.value.trim() || `Card ${i}`;
        const imgVal = document.getElementById(`heroCardImg${i}`)?.value.trim() || `assets/images/hero_card_${i}.jpg`;
        const vidVal = document.getElementById(`heroCardVid${i}`)?.value.trim() || '';
        const rotVal = parseFloat(document.getElementById(`heroCardRot${i}`)?.value) || 0;
        const linkVal = document.getElementById(`heroCardLink${i}`)?.value.trim() || '#work';
        const mediaTypeVal = document.querySelector(`input[name="heroMediaType${i}"]:checked`)?.value || (vidVal ? 'video' : 'image');
        const isHeroVid = mediaTypeVal === 'video' || (!mediaTypeVal && vidVal && !imgVal);

        if (isHeroVid) {
          try { localStorage.removeItem(`fast_hero_card_${i}`); } catch(e) {}
        } else if (imgVal) {
          if (!imgVal.startsWith('idb://') && !imgVal.startsWith('blob:')) {
            try { localStorage.setItem(`fast_hero_card_${i}`, imgVal); } catch(e) {}
          } else if (imgVal.startsWith('idb://') && window.PortfolioMediaDB) {
            const resolved = window.PortfolioMediaDB.resolveUrlSync(imgVal);
            if (resolved && !resolved.startsWith('idb://') && !resolved.startsWith('blob:')) {
              try { localStorage.setItem(`fast_hero_card_${i}`, resolved); } catch(e) {}
            }
          }
        }

        const existingCard = data.heroCards[i - 1] || {};
        data.heroCards[i - 1] = {
          ...existingCard,
          id: existingCard.id || `hero-card-${i}`,
          title: titleVal,
          alt: titleVal,
          mediaType: mediaTypeVal,
          image: imgVal,
          video: vidVal,
          rotation: rotVal,
          link: linkVal,
          order: i
        };
      }

      // Mirror into customization.hero for comprehensive multi-token sync
      data.customization = data.customization || {};
      data.customization.hero = data.customization.hero || {};
      data.customization.hero.titleLine1 = data.profile.titleLine1;
      data.customization.hero.titleLine2 = data.profile.titleLine2;
      data.customization.hero.role = data.profile.role;

      PortfolioData.save(data);
      updateDashboardStats();
      syncPreviewIframe();
      showToast('Hero section saved & published live to website!', 'success');
    });
  }
}

function loadProfileData() {
  const data = PortfolioData.get();
  const p = data.profile || {};
  const m = p.music || {};

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('profRole', p.role || 'PRODUCT DESIGNER');
  setVal('profTitleLine1', p.titleLine1 || 'PAWAN K.');
  setVal('profTitleLine2', p.titleLine2 || 'KUSHWAHA');
  setVal('profCtaWorkText', p.ctaWorkText || 'View My Work');
  setVal('profCtaWorkUrl', p.ctaWorkUrl || '#work');
  setVal('profCtaStoryText', p.ctaStoryText || 'Send an Email');
  setVal('profCtaStoryUrl', p.ctaStoryUrl || 'mailto:pawankushwaha1@gmail.com');
  setVal('profMusicSrc', m.audioSrc || 'assets/audio/ambient_lofi.wav');

  // Load 4 Hero Cards
  const heroCards = data.heroCards || [];
  for (let i = 1; i <= 4; i++) {
    const c = heroCards[i - 1] || {};
    setVal(`heroCardTitle${i}`, c.title || c.alt || `Card ${i}`);
    setVal(`heroCardImg${i}`, c.image || `assets/images/hero_card_${i}.jpg`);
    setVal(`heroCardVid${i}`, c.video || '');
    setVal(`heroCardRot${i}`, c.rotation !== undefined ? c.rotation : (i === 1 ? -11 : i === 2 ? 7 : i === 3 ? -3 : 11));
    setVal(`heroCardLink${i}`, c.link || '#work');

    const mType = c.mediaType || (c.video ? 'video' : 'image');
    if (window.updateHeroMediaTypeUI) window.updateHeroMediaTypeUI(i, mType);

    const prevImg = document.getElementById(`heroCardPreview${i}`);
    if (prevImg) prevImg.src = resolveMediaAdmin(c.image) || `assets/images/hero_card_${i}.jpg`;

    const prevVid = document.getElementById(`heroCardVidPreview${i}`);
    if (prevVid) {
      const vidResolved = resolveMediaAdmin(c.video);
      prevVid.src = vidResolved || '';
      if (vidResolved) {
        prevVid.muted = true;
        prevVid.play().catch(() => {});
      }
    }
  }
}

/* ==========================================================================
   3.5. ABOUT ME & SECTION DIVIDER (SECTION 1) MANAGER
   ========================================================================== */
let currentAboutTools = [];

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getToolTileInnerHtml(tool) {
  const isImageMode = tool.type === 'custom-image' || tool.preset === 'custom-image' || (!!tool.customImage && tool.type !== 'preset');
  const customImg = tool.customImage ? (resolveMediaAdmin(tool.customImage) || tool.customImage) : '';
  const textStyle = tool.textColor ? `color: ${tool.textColor};` : '';

  if (isImageMode && customImg) {
    const isContain = tool.fit === 'contain';
    const imgFitStyle = isContain ? 'max-width:24px;max-height:24px;object-fit:contain;' : 'width:100%;height:100%;object-fit:cover;border-radius:inherit;';
    return `<img src="${customImg}" alt="${escapeHtml(tool.name || 'Tool')}" style="${imgFitStyle}display:block;">`;
  }

  const preset = (tool.preset || 'custom-badge').toLowerCase();

  switch (preset) {
    case 'fusion':
      return `<span class="tool-f-letter">F</span><span class="tool-f-sub">360</span>`;
    case 'figma':
      return `<svg width="20" height="20" viewBox="0 0 38 57" fill="none" aria-hidden="true"><path d="M19 28.5C13.7533 28.5 9.5 24.2467 9.5 19C9.5 13.7533 13.7533 9.5 19 9.5H28.5V28.5H19Z" fill="#F24E1E"/><path d="M28.5 0H19C13.7533 0 9.5 4.25329 9.5 9.5H19C24.2467 9.5 28.5 5.24671 28.5 0Z" fill="#FF7262"/><path d="M28.5 0V19C28.5 24.2467 24.2467 28.5 19 28.5V0H28.5Z" fill="#A259FF"/><path d="M9.5 38C9.5 32.7533 13.7533 28.5 19 28.5V47.5C13.7533 47.5 9.5 43.2467 9.5 38Z" fill="#0ACF83"/><path d="M28.5 28.5C28.5 33.7467 24.2467 38 19 38C13.7533 38 9.5 33.7467 9.5 28.5C9.5 23.2533 13.7533 19 19 19C24.2467 19 28.5 23.2533 28.5 28.5Z" fill="#1ABCFE"/></svg>`;
    case 'ps':
      return `<span class="tool-adobe-text" style="${textStyle}">Ps</span>`;
    case 'ai':
      return `<span class="tool-adobe-text" style="${textStyle}">Ai</span>`;
    case 'sketch':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${tool.textColor || '#FFFFFF'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
    case 'cad':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${tool.textColor || '#FFFFFF'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
    case 'solidworks':
      return `<span class="tool-adobe-text" style="color:${tool.textColor || '#FFFFFF'};font-size:14px;font-weight:900;">SW</span>`;
    case 'blender':
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.5" fill="${tool.textColor || '#EA7600'}"/><path d="M12 2C8 2 6 5 6 8c0 3 2 5 6 5s6-2 6-5c0-3-2-6-6-6z" stroke="${tool.textColor || '#EA7600'}" stroke-width="1.8" fill="none"/><path d="M5 19c2 2 5 3 7 3s5-1 7-3" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'rhino':
      return `<span class="tool-adobe-text" style="color:${tool.textColor || '#FFFFFF'};font-size:14px;font-weight:900;">Rh</span>`;
    case 'keyshot':
      return `<span class="tool-adobe-text" style="color:${tool.textColor || '#29B6F6'};font-size:14px;font-weight:900;">KS</span>`;
    case 'ae':
      return `<span class="tool-adobe-text" style="color:${tool.textColor || '#D291FF'};">Ae</span>`;
    case 'pr':
      return `<span class="tool-adobe-text" style="color:${tool.textColor || '#E099FF'};">Pr</span>`;
    case 'custom-badge':
    default:
      const txt = (tool.badgeText || (tool.name ? tool.name.slice(0, 3).toUpperCase() : '3D')).replace(/</g, '&lt;');
      return `<span class="tool-adobe-text" style="color:${tool.textColor || '#FFFFFF'};font-size:13px;font-weight:900;">${txt}</span>`;
  }
}

function getToolTileClassName(tool) {
  const isImageMode = tool.type === 'custom-image' || tool.preset === 'custom-image' || (!!tool.customImage && tool.type !== 'preset');
  if (isImageMode && tool.customImage) {
    return 'about-tool-tile tool-custom' + (tool.fit === 'contain' ? ' fit-contain' : '');
  }
  const preset = (tool.preset || 'custom-badge').toLowerCase();
  switch (preset) {
    case 'fusion': return 'about-tool-tile tool-fusion';
    case 'figma': return 'about-tool-tile tool-figma';
    case 'ps': return 'about-tool-tile tool-ps';
    case 'ai': return 'about-tool-tile tool-ai';
    case 'sketch': return 'about-tool-tile tool-sketch';
    case 'cad': return 'about-tool-tile tool-cad';
    case 'solidworks': return 'about-tool-tile tool-solidworks';
    case 'blender': return 'about-tool-tile tool-blender';
    case 'rhino': return 'about-tool-tile tool-rhino';
    case 'keyshot': return 'about-tool-tile tool-keyshot';
    case 'ae': return 'about-tool-tile tool-ae';
    case 'pr': return 'about-tool-tile tool-pr';
    default: return 'about-tool-tile tool-custom';
  }
}

function initAboutManager() {
  const btnSave = document.getElementById('btnSaveAbout');
  const portraitInp = document.getElementById('aboutPortraitImg');
  const portraitPrev = document.getElementById('aboutPortraitPreview');
  const portraitUpload = document.getElementById('fileAboutPortraitUpload');

  if (portraitInp && portraitPrev) {
    portraitInp.addEventListener('input', () => {
      checkLocalPathWarning(portraitInp);
      portraitPrev.src = resolveMediaAdmin(portraitInp.value) || 'assets/images/hero_card_2.jpg';
    });
  }

  if (portraitUpload && portraitInp && portraitPrev) {
    portraitUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      handleAdminFileUpload(file, portraitInp, portraitPrev, 'about_portrait', false);
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', () => saveAboutData(true));
  }

  // --- Software & Tool Icons Manager Setup ---
  const btnAddTool = document.getElementById('btnAddToolIcon');
  if (btnAddTool) {
    btnAddTool.addEventListener('click', () => openToolModal(-1));
  }

  const btnSaveTool = document.getElementById('btnSaveToolIcon');
  if (btnSaveTool) {
    btnSaveTool.addEventListener('click', saveToolRecord);
  }

  // Modal Format Switcher (Image vs Preset vs Monogram)
  document.querySelectorAll('input[name="toolIconMode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('#modalToolIcon .media-type-pill').forEach(l => l.classList.remove('active'));
      radio.closest('.media-type-pill')?.classList.add('active');
      syncToolModalFields();
      updateToolModalLivePreview();
    });
  });

  const presetSelect = document.getElementById('fieldToolPreset');
  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      syncToolModalFields();
      updateToolModalLivePreview();
    });
  }

  const fitSelect = document.getElementById('fieldToolImageFit');
  if (fitSelect) {
    fitSelect.addEventListener('change', updateToolModalLivePreview);
  }

  // Modal Inputs update live preview
  ['fieldToolName', 'fieldToolBadgeText', 'fieldToolBgColor', 'fieldToolTextColor', 'fieldToolCustomImg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateToolModalLivePreview);
    }
  });

  // Modal Color Pickers
  const bgPicker = document.getElementById('fieldToolBgColorPicker');
  const bgText = document.getElementById('fieldToolBgColor');
  if (bgPicker && bgText) {
    bgPicker.addEventListener('input', () => {
      bgText.value = bgPicker.value;
      updateToolModalLivePreview();
    });
    bgText.addEventListener('input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(bgText.value.trim())) {
        bgPicker.value = bgText.value.trim();
      }
      updateToolModalLivePreview();
    });
  }

  const textPicker = document.getElementById('fieldToolTextColorPicker');
  const textColorInput = document.getElementById('fieldToolTextColor');
  if (textPicker && textColorInput) {
    textPicker.addEventListener('input', () => {
      textColorInput.value = textPicker.value;
      updateToolModalLivePreview();
    });
    textColorInput.addEventListener('input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(textColorInput.value.trim())) {
        textPicker.value = textColorInput.value.trim();
      }
      updateToolModalLivePreview();
    });
  }

  // File Upload for Custom Tool Icon
  const fileToolUpload = document.getElementById('fileToolUpload');
  const fieldToolCustomImg = document.getElementById('fieldToolCustomImg');
  const fieldToolImgPreview = document.getElementById('fieldToolImgPreview');
  if (fileToolUpload && fieldToolCustomImg && fieldToolImgPreview) {
    fileToolUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const reader = new FileReader();
        reader.onload = async (re) => {
          const dataUrl = re.target.result;
          fieldToolImgPreview.src = dataUrl;

          // Automatically activate image mode tab
          const imgRadio = document.getElementById('toolModeImage');
          if (imgRadio) {
            imgRadio.checked = true;
            document.querySelectorAll('#modalToolIcon .media-type-pill').forEach(l => l.classList.remove('active'));
            imgRadio.closest('.media-type-pill')?.classList.add('active');
            syncToolModalFields();
          }

          let finalPath = dataUrl;
          const mediaKey = `tool_icon_${Date.now()}`;
          if (window.PortfolioMediaDB && typeof window.PortfolioMediaDB.saveMedia === 'function') {
            await window.PortfolioMediaDB.saveMedia(mediaKey, file);
            if (dataUrl.length > 65536) {
              finalPath = `idb://${mediaKey}`;
            }
          }

          fieldToolCustomImg.value = finalPath;
          updateToolModalLivePreview();
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('File upload error:', err);
        handleAdminFileUpload(file, fieldToolCustomImg, fieldToolImgPreview, 'tool_icon', false);
      }
    });
  }
}

function syncToolModalFields() {
  const mode = document.querySelector('input[name="toolIconMode"]:checked')?.value || 'preset';
  const imageGroup = document.getElementById('toolImageGroup');
  const presetGroup = document.getElementById('toolPresetGroup');
  const badgeGroup = document.getElementById('toolBadgeGroup');

  if (imageGroup) imageGroup.style.display = mode === 'image' ? 'block' : 'none';
  if (presetGroup) presetGroup.style.display = mode === 'preset' ? 'block' : 'none';
  if (badgeGroup) badgeGroup.style.display = mode === 'badge' ? 'block' : 'none';
}

function updateToolModalLivePreview() {
  const tilePreview = document.getElementById('modalToolLivePreviewTile');
  const liveName = document.getElementById('modalToolLiveName');
  if (!tilePreview) return;

  const nameVal = document.getElementById('fieldToolName')?.value.trim() || 'Tool Name';
  const modeVal = document.querySelector('input[name="toolIconMode"]:checked')?.value || 'preset';
  const presetVal = document.getElementById('fieldToolPreset')?.value || 'fusion';
  const badgeVal = document.getElementById('fieldToolBadgeText')?.value.trim() || '';
  const imgVal = document.getElementById('fieldToolCustomImg')?.value.trim() || '';
  const fitVal = document.getElementById('fieldToolImageFit')?.value || 'cover';
  const bgVal = document.getElementById('fieldToolBgColor')?.value.trim() || '';
  const textVal = document.getElementById('fieldToolTextColor')?.value.trim() || '';

  if (liveName) {
    liveName.textContent = nameVal;
  }

  const dummyTool = {
    name: nameVal,
    type: modeVal === 'image' ? 'custom-image' : (modeVal === 'badge' ? 'custom-badge' : 'preset'),
    preset: modeVal === 'image' ? 'custom-image' : (modeVal === 'badge' ? 'custom-badge' : presetVal),
    badgeText: badgeVal,
    customImage: imgVal,
    fit: fitVal,
    bgColor: bgVal,
    textColor: textVal
  };

  tilePreview.className = getToolTileClassName(dummyTool);
  tilePreview.style.background = bgVal || '';
  tilePreview.style.color = textVal || '';
  tilePreview.innerHTML = getToolTileInnerHtml(dummyTool);
}

function renderAboutToolsAdmin() {
  const container = document.getElementById('aboutToolsListContainer');
  const badge = document.getElementById('adminToolCountBadge');
  if (!container) return;

  if (badge) {
    badge.textContent = `${currentAboutTools.length} Icon${currentAboutTools.length === 1 ? '' : 's'}`;
  }

  if (currentAboutTools.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 28px; text-align: center; background: #FFF; border: 1px dashed rgba(19,41,74,0.18); border-radius: 12px;">
        <p style="margin: 0 0 10px 0; color: var(--color-slate); font-size: 13.5px;">No software icons configured yet.</p>
        <button type="button" class="btn-primary" onclick="openToolModal(-1)" style="font-size: 13px;">+ Add First Tool Icon</button>
      </div>`;
    return;
  }

  container.innerHTML = currentAboutTools.map((tool, index) => {
    const isFirst = index === 0;
    const isLast = index === currentAboutTools.length - 1;
    const isHidden = tool.visible === false;
    const tileClass = getToolTileClassName(tool);
    const tileInner = getToolTileInnerHtml(tool);
    const bgStyle = tool.bgColor ? `background:${tool.bgColor};` : '';
    const textStyle = tool.textColor ? `color:${tool.textColor};` : '';
    const combinedStyle = [bgStyle, textStyle].filter(Boolean).join(' ');

    const isCustomImg = tool.type === 'custom-image' || tool.preset === 'custom-image' || (!!tool.customImage && tool.type !== 'preset');
    const badgeLabel = isCustomImg ? '🖼️ IMAGE' : (tool.type === 'custom-badge' ? '🔤 ' + (tool.badgeText || 'BADGE') : '🎨 ' + (tool.preset || 'preset').toUpperCase());

    return `
      <div class="about-tool-admin-card ${isHidden ? 'is-hidden' : ''}">
        <div class="about-tool-info">
          <div class="about-tool-preview-tile ${tileClass}" style="${combinedStyle}">
            ${tileInner}
          </div>
          <div class="about-tool-details">
            <div class="about-tool-title" title="${escapeHtml(tool.name)}">${escapeHtml(tool.name || 'Untitled Tool')}</div>
            <span class="about-tool-preset-badge">${escapeHtml(badgeLabel)}</span>
            ${isHidden ? '<span style="font-size:10px; color:#DC2626; margin-left:4px; font-weight:700;">(HIDDEN)</span>' : ''}
          </div>
        </div>
        <div class="about-tool-actions">
          <button type="button" class="btn-tool-nav" title="Move Left" onclick="moveAboutTool(${index}, -1)" ${isFirst ? 'disabled' : ''}>◀</button>
          <button type="button" class="btn-tool-nav" title="Move Right" onclick="moveAboutTool(${index}, 1)" ${isLast ? 'disabled' : ''}>▶</button>
          <button type="button" class="btn-tool-action" title="Quick Upload Image" onclick="quickUploadToolImage(${index})">📁</button>
          <button type="button" class="btn-tool-action" title="Edit Full Settings" onclick="openToolModal(${index})">✏️</button>
          <button type="button" class="btn-tool-action action-delete" title="Delete Tool" onclick="deleteAboutTool(${index})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function openToolModal(index) {
  const modal = document.getElementById('modalToolIcon');
  const heading = document.getElementById('modalToolIconHeading');
  if (!modal) return;

  const idxInput = document.getElementById('editToolIndex');
  const idInput = document.getElementById('editToolId');
  const nameInput = document.getElementById('fieldToolName');
  const presetSelect = document.getElementById('fieldToolPreset');
  const fitSelect = document.getElementById('fieldToolImageFit');
  const badgeInput = document.getElementById('fieldToolBadgeText');
  const customImgInput = document.getElementById('fieldToolCustomImg');
  const customImgPrev = document.getElementById('fieldToolImgPreview');
  const bgInput = document.getElementById('fieldToolBgColor');
  const bgPicker = document.getElementById('fieldToolBgColorPicker');
  const textInput = document.getElementById('fieldToolTextColor');
  const textPicker = document.getElementById('fieldToolTextColorPicker');
  const visibleCheck = document.getElementById('fieldToolVisible');

  if (idxInput) idxInput.value = index;

  if (index >= 0 && currentAboutTools[index]) {
    const tool = currentAboutTools[index];
    if (heading) heading.textContent = 'Edit Software Tool Icon';
    if (idInput) idInput.value = tool.id || '';
    if (nameInput) nameInput.value = tool.name || '';
    if (presetSelect) presetSelect.value = tool.preset || 'fusion';
    if (fitSelect) fitSelect.value = tool.fit || 'cover';
    if (badgeInput) badgeInput.value = tool.badgeText || '';
    if (customImgInput) customImgInput.value = tool.customImage || '';
    if (customImgPrev) customImgPrev.src = resolveMediaAdmin(tool.customImage) || 'assets/images/favicon.svg';
    if (bgInput) bgInput.value = tool.bgColor || '';
    if (bgPicker && tool.bgColor && /^#[0-9A-Fa-f]{6}$/.test(tool.bgColor)) bgPicker.value = tool.bgColor;
    if (textInput) textInput.value = tool.textColor || '';
    if (textPicker && tool.textColor && /^#[0-9A-Fa-f]{6}$/.test(tool.textColor)) textPicker.value = tool.textColor;
    if (visibleCheck) visibleCheck.checked = tool.visible !== false;

    // Detect Mode
    let mode = 'preset';
    if (tool.type === 'custom-image' || tool.preset === 'custom-image' || (tool.customImage && tool.type !== 'preset')) {
      mode = 'image';
    } else if (tool.type === 'custom-badge' || tool.preset === 'custom-badge') {
      mode = 'badge';
    }
    const radio = document.querySelector(`input[name="toolIconMode"][value="${mode}"]`);
    if (radio) {
      radio.checked = true;
      document.querySelectorAll('#modalToolIcon .media-type-pill').forEach(l => l.classList.remove('active'));
      radio.closest('.media-type-pill')?.classList.add('active');
    }
  } else {
    if (heading) heading.textContent = 'Add New Software Tool Icon';
    if (idInput) idInput.value = 'tool-' + Date.now();
    if (nameInput) nameInput.value = '';
    if (presetSelect) presetSelect.value = 'solidworks';
    if (fitSelect) fitSelect.value = 'cover';
    if (badgeInput) badgeInput.value = 'SW';
    if (customImgInput) customImgInput.value = '';
    if (customImgPrev) customImgPrev.src = 'assets/images/favicon.svg';
    if (bgInput) bgInput.value = '';
    if (textInput) textInput.value = '';
    if (visibleCheck) visibleCheck.checked = true;

    const radio = document.querySelector('input[name="toolIconMode"][value="image"]');
    if (radio) {
      radio.checked = true;
      document.querySelectorAll('#modalToolIcon .media-type-pill').forEach(l => l.classList.remove('active'));
      radio.closest('.media-type-pill')?.classList.add('active');
    }
  }

  syncToolModalFields();
  updateToolModalLivePreview();
  modal.classList.add('active');
}

function saveToolRecord() {
  const nameInput = document.getElementById('fieldToolName');
  if (!nameInput || !nameInput.value.trim()) {
    showToast('Please enter a tool name / title.', 'error');
    if (nameInput) nameInput.focus();
    return;
  }

  const idx = parseInt(document.getElementById('editToolIndex')?.value, 10);
  const id = document.getElementById('editToolId')?.value || ('tool-' + Date.now());
  const name = nameInput.value.trim();
  const selectedMode = document.querySelector('input[name="toolIconMode"]:checked')?.value || 'preset';
  const preset = document.getElementById('fieldToolPreset')?.value || 'fusion';
  const badgeText = document.getElementById('fieldToolBadgeText')?.value.trim() || '';
  const customImage = document.getElementById('fieldToolCustomImg')?.value.trim() || '';
  const fit = document.getElementById('fieldToolImageFit')?.value || 'cover';
  const bgColor = document.getElementById('fieldToolBgColor')?.value.trim() || '';
  const textColor = document.getElementById('fieldToolTextColor')?.value.trim() || '';
  const visible = document.getElementById('fieldToolVisible')?.checked ?? true;

  // Auto-detect image mode if image is present
  const mode = customImage && selectedMode === 'image' ? 'image' : selectedMode;

  const toolData = {
    id,
    name,
    type: mode === 'image' ? 'custom-image' : (mode === 'badge' ? 'custom-badge' : 'preset'),
    preset: mode === 'image' ? 'custom-image' : (mode === 'badge' ? 'custom-badge' : preset),
    badgeText: mode === 'badge' ? badgeText : '',
    customImage: mode === 'image' ? customImage : '',
    fit: mode === 'image' ? fit : 'cover',
    bgColor,
    textColor,
    visible
  };

  if (idx >= 0 && idx < currentAboutTools.length) {
    currentAboutTools[idx] = toolData;
  } else {
    currentAboutTools.push(toolData);
  }

  renderAboutToolsAdmin();
  saveAboutData(false);
  document.getElementById('modalToolIcon')?.classList.remove('active');
  showToast(`Tool icon "${name}" updated successfully!`, 'success');
}

function quickUploadToolImage(index) {
  if (index < 0 || index >= currentAboutTools.length) return;
  const tool = currentAboutTools[index];

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*,.svg';
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showToast(`Uploading icon image for "${tool.name}"...`, 'info');
      const reader = new FileReader();
      reader.onload = async (re) => {
        const dataUrl = re.target.result;
        let finalMediaPath = dataUrl;
        const mediaKey = `tool_${tool.id || index}_${Date.now()}`;

        if (window.PortfolioMediaDB && typeof window.PortfolioMediaDB.saveMedia === 'function') {
          await window.PortfolioMediaDB.saveMedia(mediaKey, file);
          if (dataUrl.length > 65536) {
            finalMediaPath = `idb://${mediaKey}`;
          }
        }

        tool.type = 'custom-image';
        tool.preset = 'custom-image';
        tool.customImage = finalMediaPath;
        tool.fit = tool.fit || 'cover';

        renderAboutToolsAdmin();
        saveAboutData(false);
        showToast(`Uploaded new icon image for "${tool.name}"!`, 'success');
      };
      reader.readAsDataURL(file);
    } catch(err) {
      console.error('Quick upload error:', err);
      showToast('Error uploading icon: ' + err.message, 'error');
    }
  };
  fileInput.click();
}

function moveAboutTool(index, dir) {
  const newIndex = index + dir;
  if (newIndex < 0 || newIndex >= currentAboutTools.length) return;
  const temp = currentAboutTools[index];
  currentAboutTools[index] = currentAboutTools[newIndex];
  currentAboutTools[newIndex] = temp;
  renderAboutToolsAdmin();
  saveAboutData(false);
}

function deleteAboutTool(index) {
  if (currentAboutTools.length <= 1) {
    showToast('At least one tool icon should remain in your stack.', 'warning');
    return;
  }
  const toolName = currentAboutTools[index]?.name || 'this tool';
  if (!confirm(`Are you sure you want to remove "${toolName}" from your software stack?`)) return;
  currentAboutTools.splice(index, 1);
  renderAboutToolsAdmin();
  saveAboutData(false);
  showToast(`Removed "${toolName}" from stack.`, 'success');
}

window.openToolModal = openToolModal;
window.quickUploadToolImage = quickUploadToolImage;
window.moveAboutTool = moveAboutTool;
window.deleteAboutTool = deleteAboutTool;

function loadAboutData() {
  const data = PortfolioData.get();
  const ab = data.about || {};
  const sDiv = data.sectionDivider || {};

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  // 1. Headline & Tag
  setVal('aboutTag', ab.tag || 'ABOUT ME');
  setVal('aboutHeadline1', ab.headlineLine1 || 'I DESIGN TO');
  setVal('aboutHeadline2', ab.headlineLine2 || 'MAKE IDEAS');
  setVal('aboutHeadline3', ab.headlineLine3 || 'TANGIBLE.');

  // 2. Bio & Narrative & CTA
  setVal('aboutBio1', ab.bioParagraph1 || '');
  setVal('aboutBio2', ab.bioParagraph2 || '');
  setVal('aboutStatement', ab.statementPhrase || 'Design. Make. Explore.');
  setVal('aboutCtaText', ab.ctaText || 'MORE ABOUT MY JOURNEY');
  setVal('aboutCtaUrl', ab.ctaUrl || 'about.html');

  // 3. Center Column (Portrait, Nametag, Tools)
  setVal('aboutPortraitImg', ab.portraitImage || 'assets/images/hero_card_2.jpg');
  setVal('aboutNametag1', ab.nametagLine1 || 'Pawan K.');
  setVal('aboutNametag2', ab.nametagLine2 || 'Kushwaha');
  setVal('aboutRepeatText', ab.repeatText || 'Ideas\nDesign\nPrototype\nRepeat.');
  setVal('aboutToolsNote', ab.toolsNote || 'Tools I use to turn ideas into products.');

  const portraitPrev = document.getElementById('aboutPortraitPreview');
  if (portraitPrev) {
    portraitPrev.src = resolveMediaAdmin(ab.portraitImage) || 'assets/images/hero_card_2.jpg';
  }

  // 3.5. Load Software & Tool Icons Stack
  currentAboutTools = (ab.tools && Array.isArray(ab.tools) && ab.tools.length > 0)
    ? JSON.parse(JSON.stringify(ab.tools))
    : JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA.about.tools || []));
  renderAboutToolsAdmin();

  // 4. Info Cards
  setVal('aboutEduTitle', ab.educationTitle || 'EDUCATION');
  setVal('aboutEduDegree', ab.educationDegree || 'B.Des. Industrial & Product Design');
  setVal('aboutEduSchool', ab.educationSchool || 'Chandigarh University');

  setVal('aboutFocusTitle', ab.focusTitle || 'FOCUS AREAS');
  setVal('aboutFocusItem1', ab.focusItem1 || 'Product Design · UI/UX');
  setVal('aboutFocusItem2', ab.focusItem2 || '3D Modeling · Prototyping');
  setVal('aboutFocusItem3', ab.focusItem3 || 'User-Centered Design');

  setVal('aboutBeyondTitle', ab.beyondTitle || 'BEYOND DESIGN');
  setVal('aboutBeyondDesc', ab.beyondDesc || 'Exploring new tools, making physical products, and learning through hands-on experiments.');

  // 5. Section Divider Marquee
  setVal('aboutDividerHeight', sDiv.height || 72);
  setVal('aboutDividerText1', sDiv.text1 || 'SELECTED WORK');
  setVal('aboutDividerText2', sDiv.text2 || 'INDUSTRIAL & PRODUCT DESIGN');
  setVal('aboutDividerText3', sDiv.text3 || 'TURNING IDEAS INTO PRODUCTS');
  setVal('aboutDividerText4', sDiv.text4 || '3D MODELING & PROTOTYPING');
  setVal('aboutDividerText5', sDiv.text5 || 'PHYSICAL & DIGITAL EXPERIENCES');
}

function saveAboutData(showNotification = true) {
  const data = PortfolioData.get();

  data.about = {
    ...data.about,
    tag: document.getElementById('aboutTag')?.value.trim() || 'ABOUT ME',
    headlineLine1: document.getElementById('aboutHeadline1')?.value.trim() || 'I DESIGN TO',
    headlineLine2: document.getElementById('aboutHeadline2')?.value.trim() || 'MAKE IDEAS',
    headlineLine3: document.getElementById('aboutHeadline3')?.value.trim() || 'TANGIBLE.',
    bioParagraph1: document.getElementById('aboutBio1')?.value.trim() || '',
    bioParagraph2: document.getElementById('aboutBio2')?.value.trim() || '',
    statementPhrase: document.getElementById('aboutStatement')?.value.trim() || 'Design. Make. Explore.',
    ctaText: document.getElementById('aboutCtaText')?.value.trim() || 'MORE ABOUT MY JOURNEY',
    ctaUrl: document.getElementById('aboutCtaUrl')?.value.trim() || 'about.html',
    portraitImage: document.getElementById('aboutPortraitImg')?.value.trim() || 'assets/images/hero_card_2.jpg',
    nametagLine1: document.getElementById('aboutNametag1')?.value.trim() || 'Pawan K.',
    nametagLine2: document.getElementById('aboutNametag2')?.value.trim() || 'Kushwaha',
    repeatText: document.getElementById('aboutRepeatText')?.value.trim() || 'Ideas\nDesign\nPrototype\nRepeat.',
    toolsNote: document.getElementById('aboutToolsNote')?.value.trim() || 'Tools I use to turn ideas into products.',
    tools: currentAboutTools.length > 0 ? currentAboutTools : (data.about?.tools || []),
    educationTitle: document.getElementById('aboutEduTitle')?.value.trim() || 'EDUCATION',
    educationDegree: document.getElementById('aboutEduDegree')?.value.trim() || 'B.Des. Industrial & Product Design',
    educationSchool: document.getElementById('aboutEduSchool')?.value.trim() || 'Chandigarh University',
    focusTitle: document.getElementById('aboutFocusTitle')?.value.trim() || 'FOCUS AREAS',
    focusItem1: document.getElementById('aboutFocusItem1')?.value.trim() || 'Product Design · UI/UX',
    focusItem2: document.getElementById('aboutFocusItem2')?.value.trim() || '3D Modeling · Prototyping',
    focusItem3: document.getElementById('aboutFocusItem3')?.value.trim() || 'User-Centered Design',
    beyondTitle: document.getElementById('aboutBeyondTitle')?.value.trim() || 'BEYOND DESIGN',
    beyondDesc: document.getElementById('aboutBeyondDesc')?.value.trim() || 'Exploring new tools, making physical products, and learning through hands-on experiments.'
  };

  data.sectionDivider = {
    ...data.sectionDivider,
    enabled: true,
    height: parseInt(document.getElementById('aboutDividerHeight')?.value, 10) || 72,
    text1: document.getElementById('aboutDividerText1')?.value.trim() || 'SELECTED WORK',
    text2: document.getElementById('aboutDividerText2')?.value.trim() || 'INDUSTRIAL & PRODUCT DESIGN',
    text3: document.getElementById('aboutDividerText3')?.value.trim() || 'TURNING IDEAS INTO PRODUCTS',
    text4: document.getElementById('aboutDividerText4')?.value.trim() || '3D MODELING & PROTOTYPING',
    text5: document.getElementById('aboutDividerText5')?.value.trim() || 'PHYSICAL & DIGITAL EXPERIENCES'
  };

  const success = PortfolioData.save(data);
  updateDashboardStats();
  syncPreviewIframe();

  if (showNotification) {
    if (success) {
      showToast('About Me section & ribbon saved & published live!', 'success');
    } else {
      showToast('Warning: Storage limit exceeded. Please reduce media size.', 'error');
    }
  }
}

/* ==========================================================================
   4. SELECTED WORK (SECTION 3) MANAGER
   ========================================================================== */
function initProjectsManager() {
  const btnSaveHeader = document.getElementById('btnSaveWorkHeader');
  const btnOpenModal = document.getElementById('btnOpenNewProjectModal');
  const filterSelect = document.getElementById('projectCategoryFilter');
  const searchInput = document.getElementById('projectSearchInput');
  const btnSaveProject = document.getElementById('btnSaveProjectRecord');

  const thumbInput = document.getElementById('fieldProjImage');
  const thumbPreview = document.getElementById('fieldProjThumbPreview');
  const thumbFileUpload = document.getElementById('fileProjThumbUpload');

  // Section Header Save
  if (btnSaveHeader) {
    btnSaveHeader.addEventListener('click', () => {
      const data = PortfolioData.get();
      data.sections = data.sections || {};
      data.sections.workTitle = document.getElementById('workSectionTitle')?.value.trim() || 'SELECTED WORK';
      data.sections.workSubtitle = document.getElementById('workSectionSubtitle')?.value.trim() || 'Ideas transformed into meaningful, functional experiences.';
      data.workTitle = data.sections.workTitle;
      data.workSubtitle = data.sections.workSubtitle;
      data.customization = data.customization || {};
      data.customization.sections = data.customization.sections || {};
      data.customization.sections.workTitle = data.sections.workTitle;
      data.customization.sections.workSubtitle = data.sections.workSubtitle;
      PortfolioData.save(data);
      syncPreviewIframe();
      showToast('Selected Work section header saved & published live to website!', 'success');
    });
  }

  // Card thumbnail image
  if (thumbInput && thumbPreview) {
    thumbInput.addEventListener('input', () => {
      checkLocalPathWarning(thumbInput);
      thumbPreview.src = resolveMediaAdmin(thumbInput.value) || 'assets/images/work_luma.jpg';
    });
  }

  if (thumbFileUpload && thumbInput && thumbPreview) {
    thumbFileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      handleAdminFileUpload(file, thumbInput, thumbPreview, 'proj_thumb', false);
    });
  }

  // Card Mobile Thumbnail Image
  const mobileThumbInput = document.getElementById('fieldProjMobileImage');
  const mobileThumbPreview = document.getElementById('fieldProjMobileThumbPreview');
  const mobileThumbFileUpload = document.getElementById('fileProjMobileThumbUpload');
  const mobileThumbBadge = document.getElementById('projMobileImgBadge');
  const btnClearMobileThumb = document.getElementById('btnClearProjMobileThumb');

  window.updateMobileThumbUI = function(val) {
    const hasVal = Boolean(val && val.trim());
    if (mobileThumbPreview) {
      if (hasVal) {
        mobileThumbPreview.style.display = 'block';
        mobileThumbPreview.src = resolveMediaAdmin(val.trim());
      } else {
        mobileThumbPreview.style.display = 'none';
        mobileThumbPreview.src = '';
      }
    }
    if (mobileThumbBadge) {
      mobileThumbBadge.className = hasVal ? 'media-status-badge active' : 'media-status-badge';
      mobileThumbBadge.textContent = hasVal ? '● Custom Mobile Active' : '○ Same as Desktop';
    }
    if (btnClearMobileThumb) {
      btnClearMobileThumb.style.display = hasVal ? 'inline-block' : 'none';
    }
  };

  if (mobileThumbInput) {
    mobileThumbInput.addEventListener('input', () => {
      checkLocalPathWarning(mobileThumbInput);
      window.updateMobileThumbUI(mobileThumbInput.value);
    });
  }

  if (mobileThumbFileUpload && mobileThumbInput) {
    mobileThumbFileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      handleAdminFileUpload(file, mobileThumbInput, mobileThumbPreview, 'proj_mobile', false);
      setTimeout(() => window.updateMobileThumbUI(mobileThumbInput.value), 250);
    });
  }

  if (btnClearMobileThumb && mobileThumbInput) {
    btnClearMobileThumb.addEventListener('click', () => {
      mobileThumbInput.value = '';
      window.updateMobileThumbUI('');
    });
  }

  // Showcase Demo Video Controls
  const projVidInput = document.getElementById('fieldProjVideo');
  const projVidPreview = document.getElementById('fieldProjVideoPreview');
  const projVidFileUpload = document.getElementById('fileProjVideoUpload');

  window.updateProjMediaTypeUI = function(type) {
    const radioImg = document.getElementById('projMediaTypeImage');
    const radioVid = document.getElementById('projMediaTypeVideo');
    const labelImg = document.getElementById('labelProjMediaTypeImage');
    const labelVid = document.getElementById('labelProjMediaTypeVideo');
    const imgGroup = document.getElementById('projImageGroup');
    const vidGroup = document.getElementById('projVideoGroup');
    const imgInp = document.getElementById('fieldProjImage');
    const vidInp = document.getElementById('fieldProjVideo');
    const imgUpload = document.getElementById('fileProjThumbUpload');
    const vidUpload = document.getElementById('fileProjVideoUpload');
    const imgUploadBtn = document.getElementById('fileProjThumbUploadBtn');
    const vidUploadBtn = document.getElementById('fileProjVideoUploadBtn');
    const imgBadge = document.getElementById('projImgBadge');
    const vidBadge = document.getElementById('projVidBadge');

    if (type === 'video') {
      if (radioVid) radioVid.checked = true;
      labelVid?.classList.add('active');
      labelImg?.classList.remove('active');

      // Video Active
      if (vidInp) vidInp.disabled = false;
      if (vidUpload) vidUpload.disabled = false;
      vidUploadBtn?.classList.remove('disabled');
      vidGroup?.classList.remove('is-disabled');
      vidGroup?.classList.add('is-active');
      if (vidBadge) {
        vidBadge.className = 'media-status-badge active';
        vidBadge.textContent = '● Active';
      }

      // Photo Disabled
      if (imgInp) imgInp.disabled = true;
      if (imgUpload) imgUpload.disabled = true;
      imgUploadBtn?.classList.add('disabled');
      imgGroup?.classList.add('is-disabled');
      imgGroup?.classList.remove('is-active');
      if (imgBadge) {
        imgBadge.className = 'media-status-badge disabled';
        imgBadge.textContent = '⊘ Disabled';
      }
    } else {
      if (radioImg) radioImg.checked = true;
      labelImg?.classList.add('active');
      labelVid?.classList.remove('active');

      // Photo Active
      if (imgInp) imgInp.disabled = false;
      if (imgUpload) imgUpload.disabled = false;
      imgUploadBtn?.classList.remove('disabled');
      imgGroup?.classList.remove('is-disabled');
      imgGroup?.classList.add('is-active');
      if (imgBadge) {
        imgBadge.className = 'media-status-badge active';
        imgBadge.textContent = '● Active';
      }

      // Video Disabled
      if (vidInp) vidInp.disabled = true;
      if (vidUpload) vidUpload.disabled = true;
      vidUploadBtn?.classList.add('disabled');
      vidGroup?.classList.add('is-disabled');
      vidGroup?.classList.remove('is-active');
      if (vidBadge) {
        vidBadge.className = 'media-status-badge disabled';
        vidBadge.textContent = '⊘ Disabled';
      }
    }
  };

  const radioProjImg = document.getElementById('projMediaTypeImage');
  const radioProjVid = document.getElementById('projMediaTypeVideo');
  if (radioProjImg) radioProjImg.addEventListener('change', () => window.updateProjMediaTypeUI('image'));
  if (radioProjVid) radioProjVid.addEventListener('change', () => window.updateProjMediaTypeUI('video'));

  const projImageGroupEl = document.getElementById('projImageGroup');
  const projVideoGroupEl = document.getElementById('projVideoGroup');
  if (projImageGroupEl) {
    projImageGroupEl.addEventListener('click', () => {
      if (projImageGroupEl.classList.contains('is-disabled')) {
        window.updateProjMediaTypeUI('image');
        document.getElementById('fieldProjImage')?.focus();
      }
    });
  }
  if (projVideoGroupEl) {
    projVideoGroupEl.addEventListener('click', () => {
      if (projVideoGroupEl.classList.contains('is-disabled')) {
        window.updateProjMediaTypeUI('video');
        document.getElementById('fieldProjVideo')?.focus();
      }
    });
  }

  if (projVidInput && projVidPreview) {
    projVidInput.addEventListener('input', () => {
      checkLocalPathWarning(projVidInput);
      const res = resolveMediaAdmin(projVidInput.value.trim());
      projVidPreview.src = res;
      if (res) {
        projVidPreview.muted = true;
        projVidPreview.play().catch(() => {});
      }
    });
  }

  if (projVidFileUpload && projVidInput && projVidPreview) {
    projVidFileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      handleAdminFileUpload(file, projVidInput, projVidPreview, 'proj_video', true);
    });
  }

  // Overview and Process dynamic media add buttons
  const btnAddOverviewImg = document.getElementById('btnAddOverviewImg');
  if (btnAddOverviewImg) {
    btnAddOverviewImg.addEventListener('click', () => {
      addDynamicImageCard('overviewImagesContainer', '', '', 'assets/images/work_luma.jpg', 'Overview', 'image');
      const container = document.getElementById('overviewImagesContainer');
      const inputs = container?.querySelectorAll('.dynamic-img-url');
      if (inputs && inputs.length > 0) inputs[inputs.length - 1].focus();
    });
  }

  const btnAddOverviewVid = document.getElementById('btnAddOverviewVid');
  if (btnAddOverviewVid) {
    btnAddOverviewVid.addEventListener('click', () => {
      addDynamicImageCard('overviewImagesContainer', '', '', 'assets/Video-39694.mp4', 'Overview', 'video');
      const container = document.getElementById('overviewImagesContainer');
      const inputs = container?.querySelectorAll('.dynamic-img-url');
      if (inputs && inputs.length > 0) inputs[inputs.length - 1].focus();
    });
  }

  const btnAddProcessImg = document.getElementById('btnAddProcessImg');
  if (btnAddProcessImg) {
    btnAddProcessImg.addEventListener('click', () => {
      addDynamicImageCard('processImagesContainer', '', '', 'assets/images/proto_cad.jpg', 'Process', 'image');
      const container = document.getElementById('processImagesContainer');
      const inputs = container?.querySelectorAll('.dynamic-img-url');
      if (inputs && inputs.length > 0) inputs[inputs.length - 1].focus();
    });
  }

  const btnAddProcessVid = document.getElementById('btnAddProcessVid');
  if (btnAddProcessVid) {
    btnAddProcessVid.addEventListener('click', () => {
      addDynamicImageCard('processImagesContainer', '', '', 'assets/Video-39694.mp4', 'Process', 'video');
      const container = document.getElementById('processImagesContainer');
      const inputs = container?.querySelectorAll('.dynamic-img-url');
      if (inputs && inputs.length > 0) inputs[inputs.length - 1].focus();
    });
  }

  const btnAddVertical916Img = document.getElementById('btnAddVertical916Img');
  if (btnAddVertical916Img) {
    btnAddVertical916Img.addEventListener('click', () => {
      addDynamicImageCard('vertical916ImagesContainer', '', '', 'assets/images/proto_cad.jpg', '9:16 Study', 'image');
      const container = document.getElementById('vertical916ImagesContainer');
      const inputs = container?.querySelectorAll('.dynamic-img-url');
      if (inputs && inputs.length > 0) inputs[inputs.length - 1].focus();
    });
  }

  const btnAddVertical916Vid = document.getElementById('btnAddVertical916Vid');
  if (btnAddVertical916Vid) {
    btnAddVertical916Vid.addEventListener('click', () => {
      addDynamicImageCard('vertical916ImagesContainer', '', '', 'assets/Video-39694.mp4', '9:16 Study', 'video');
      const container = document.getElementById('vertical916ImagesContainer');
      const inputs = container?.querySelectorAll('.dynamic-img-url');
      if (inputs && inputs.length > 0) inputs[inputs.length - 1].focus();
    });
  }

  if (searchInput) searchInput.addEventListener('input', renderProjectsTable);
  if (filterSelect) filterSelect.addEventListener('change', renderProjectsTable);
  if (btnOpenModal) btnOpenModal.addEventListener('click', () => openProjectModal());
  if (btnSaveProject) btnSaveProject.addEventListener('click', saveProjectRecord);

  // Modal Section Sub-Tabs (Project Card vs Case Study Page vs All)
  const btnSubtabCard = document.getElementById('btnSubtabCard');
  const btnSubtabCaseStudy = document.getElementById('btnSubtabCaseStudy');
  const btnSubtabAll = document.getElementById('btnSubtabAll');
  if (btnSubtabCard) btnSubtabCard.addEventListener('click', () => setProjModalSubtab('card'));
  if (btnSubtabCaseStudy) btnSubtabCaseStudy.addEventListener('click', () => setProjModalSubtab('caseStudy'));
  if (btnSubtabAll) btnSubtabAll.addEventListener('click', () => setProjModalSubtab('all'));

  const btnResetProjFeatures = document.getElementById('btnResetProjFeatures');
  if (btnResetProjFeatures) {
    btnResetProjFeatures.addEventListener('click', () => {
      const cat = document.getElementById('fieldProjCategory')?.value || 'product';
      const defaults = getDefaultFeaturesForProject(cat);
      renderProjectFeatureSlots(defaults);
      showToast('Project card specs reset to category defaults!', 'info');
    });
  }

  // Global Project Waves Animation Toggle Button
  const btnToggleWaves = document.getElementById('btnToggleProjectWaves');
  const wavesIndicator = document.getElementById('globalWavesIndicator');
  const btnToggleWavesText = document.getElementById('btnToggleWavesText');
  const btnToggleWavesIcon = document.getElementById('btnToggleWavesIcon');

  window.updateGlobalWavesUI = function(isEnabled) {
    if (wavesIndicator) {
      wavesIndicator.className = isEnabled ? 'media-status-badge active' : 'media-status-badge disabled';
      wavesIndicator.textContent = isEnabled ? '● Waves Active' : '⊘ Waves Disabled';
    }
    if (btnToggleWavesText) {
      btnToggleWavesText.textContent = isEnabled ? 'Waves: ON' : 'Waves: OFF';
    }
    if (btnToggleWavesIcon) {
      btnToggleWavesIcon.textContent = isEnabled ? '🌊' : '⊘';
    }
    if (btnToggleWaves) {
      btnToggleWaves.style.background = isEnabled ? 'var(--color-navy)' : '#4B5563';
      btnToggleWaves.style.borderColor = isEnabled ? 'var(--color-navy)' : '#4B5563';
    }
  };

  if (btnToggleWaves) {
    btnToggleWaves.addEventListener('click', () => {
      const data = PortfolioData.get();
      data.customization = data.customization || {};
      data.customization.projectPage = data.customization.projectPage || {};
      const current = data.customization.projectPage.wavesAnimation !== false;
      const next = !current;
      data.customization.projectPage.wavesAnimation = next;
      data.customization.projectPage.enableWavesAnimation = next;
      PortfolioData.save(data);
      window.updateGlobalWavesUI(next);
      syncPreviewIframe();
      showToast(`Project cover waves animation turned ${next ? 'ON' : 'OFF'}!`, 'success');
    });
  }

  // Modal Project Waves Controls
  window.updateProjWavesUI = function(isWavesOn) {
    const radioOn = document.getElementById('projWavesEnabled');
    const radioOff = document.getElementById('projWavesDisabled');
    const labelOn = document.getElementById('labelProjWavesEnabled');
    const labelOff = document.getElementById('labelProjWavesDisabled');
    const badge = document.getElementById('projWavesBadge');

    if (radioOn && radioOff) {
      radioOn.checked = isWavesOn;
      radioOff.checked = !isWavesOn;
    }
    if (labelOn && labelOff) {
      labelOn.classList.toggle('active', isWavesOn);
      labelOff.classList.toggle('active', !isWavesOn);
    }
    if (badge) {
      badge.className = isWavesOn ? 'media-status-badge active' : 'media-status-badge disabled';
      badge.textContent = isWavesOn ? '● Waves Active' : '⊘ Waves Disabled';
    }
  };

  const labelWavesOn = document.getElementById('labelProjWavesEnabled');
  const labelWavesOff = document.getElementById('labelProjWavesDisabled');
  if (labelWavesOn) labelWavesOn.addEventListener('click', () => window.updateProjWavesUI(true));
  if (labelWavesOff) labelWavesOff.addEventListener('click', () => window.updateProjWavesUI(false));

  // Global Project View Research Toggle Button
  const btnToggleViewResearch = document.getElementById('btnToggleProjectViewResearch');
  const viewResearchIndicator = document.getElementById('globalViewResearchIndicator');
  const btnToggleViewResearchText = document.getElementById('btnToggleViewResearchText');
  const btnToggleViewResearchIcon = document.getElementById('btnToggleViewResearchIcon');

  window.updateGlobalViewResearchUI = function(isEnabled) {
    if (viewResearchIndicator) {
      viewResearchIndicator.className = isEnabled ? 'media-status-badge active' : 'media-status-badge disabled';
      viewResearchIndicator.textContent = isEnabled ? '● Research Active' : '⊘ Research Disabled';
    }
    if (btnToggleViewResearchText) {
      btnToggleViewResearchText.textContent = isEnabled ? 'View Research: ON' : 'View Research: OFF';
    }
    if (btnToggleViewResearchIcon) {
      btnToggleViewResearchIcon.textContent = isEnabled ? '🔬' : '⊘';
    }
    if (btnToggleViewResearch) {
      btnToggleViewResearch.style.background = isEnabled ? 'var(--color-navy)' : '#4B5563';
      btnToggleViewResearch.style.borderColor = isEnabled ? 'var(--color-navy)' : '#4B5563';
    }
  };

  if (btnToggleViewResearch) {
    btnToggleViewResearch.addEventListener('click', () => {
      const data = PortfolioData.get();
      data.customization = data.customization || {};
      data.customization.projectPage = data.customization.projectPage || {};
      const current = data.customization.projectPage.viewResearch !== false && data.customization.projectPage.showViewResearch !== false;
      const next = !current;
      data.customization.projectPage.viewResearch = next;
      data.customization.projectPage.showViewResearch = next;
      PortfolioData.save(data);
      window.updateGlobalViewResearchUI(next);
      syncPreviewIframe();
      showToast(`Project 'View Research' buttons turned ${next ? 'ON' : 'OFF'}!`, 'success');
    });
  }

  // Modal Project View Research Controls
  window.updateProjViewResearchUI = function(isResearchOn) {
    const radioOn = document.getElementById('projViewResearchEnabled');
    const radioOff = document.getElementById('projViewResearchDisabled');
    const labelOn = document.getElementById('labelProjViewResearchEnabled');
    const labelOff = document.getElementById('labelProjViewResearchDisabled');
    const badge = document.getElementById('projViewResearchBadge');

    if (radioOn && radioOff) {
      radioOn.checked = isResearchOn;
      radioOff.checked = !isResearchOn;
    }
    if (labelOn && labelOff) {
      labelOn.classList.toggle('active', isResearchOn);
      labelOff.classList.toggle('active', !isResearchOn);
    }
    if (badge) {
      badge.className = isResearchOn ? 'media-status-badge active' : 'media-status-badge disabled';
      badge.textContent = isResearchOn ? '● Active' : '⊘ Disabled';
    }
  };

  const labelResearchOn = document.getElementById('labelProjViewResearchEnabled');
  const labelResearchOff = document.getElementById('labelProjViewResearchDisabled');
  if (labelResearchOn) labelResearchOn.addEventListener('click', () => window.updateProjViewResearchUI(true));
  if (labelResearchOff) labelResearchOff.addEventListener('click', () => window.updateProjViewResearchUI(false));

  // Global Project Cover Title Toggle Button
  const btnToggleCoverTitle = document.getElementById('btnToggleCoverTitle');
  const coverTitleIndicator = document.getElementById('globalCoverTitleIndicator');
  const btnToggleCoverTitleText = document.getElementById('btnToggleCoverTitleText');
  const btnToggleCoverTitleIcon = document.getElementById('btnToggleCoverTitleIcon');

  window.updateGlobalCoverTitleUI = function(isEnabled) {
    if (coverTitleIndicator) {
      coverTitleIndicator.className = isEnabled ? 'media-status-badge active' : 'media-status-badge disabled';
      coverTitleIndicator.textContent = isEnabled ? '● Title Active' : '⊘ Title Disabled';
    }
    if (btnToggleCoverTitleText) {
      btnToggleCoverTitleText.textContent = isEnabled ? 'Cover Title: ON' : 'Cover Title: OFF';
    }
    if (btnToggleCoverTitleIcon) {
      btnToggleCoverTitleIcon.textContent = isEnabled ? '🔤' : '⊘';
    }
    if (btnToggleCoverTitle) {
      btnToggleCoverTitle.style.background = isEnabled ? 'var(--color-navy)' : '#4B5563';
      btnToggleCoverTitle.style.borderColor = isEnabled ? 'var(--color-navy)' : '#4B5563';
    }
  };

  if (btnToggleCoverTitle) {
    btnToggleCoverTitle.addEventListener('click', () => {
      const data = PortfolioData.get();
      data.customization = data.customization || {};
      data.customization.projectPage = data.customization.projectPage || {};
      const current = data.customization.projectPage.showCoverTitle !== false && data.customization.projectPage.coverTitle !== false;
      const next = !current;
      data.customization.projectPage.showCoverTitle = next;
      data.customization.projectPage.coverTitle = next;
      data.customization.projectPage.coverTitleSet = true;
      PortfolioData.save(data);
      window.updateGlobalCoverTitleUI(next);
      syncPreviewIframe();
      showToast(`Project cover title & category overlay turned ${next ? 'ON' : 'OFF'}!`, 'success');
    });
  }

  // Modal Project Cover Title Controls
  window.updateProjCoverTitleUI = function(isTitleOn) {
    const radioOn = document.getElementById('projCoverTitleEnabled');
    const radioOff = document.getElementById('projCoverTitleDisabled');
    const labelOn = document.getElementById('labelProjCoverTitleEnabled');
    const labelOff = document.getElementById('labelProjCoverTitleDisabled');
    const badge = document.getElementById('projCoverTitleBadge');

    if (radioOn && radioOff) {
      radioOn.checked = isTitleOn;
      radioOff.checked = !isTitleOn;
    }
    if (labelOn && labelOff) {
      labelOn.classList.toggle('active', isTitleOn);
      labelOff.classList.toggle('active', !isTitleOn);
    }
    if (badge) {
      badge.className = isTitleOn ? 'media-status-badge active' : 'media-status-badge disabled';
      badge.textContent = isTitleOn ? '● Active' : '⊘ Disabled';
    }
  };

  const labelTitleOn = document.getElementById('labelProjCoverTitleEnabled');
  const labelTitleOff = document.getElementById('labelProjCoverTitleDisabled');
  if (labelTitleOn) labelTitleOn.addEventListener('click', () => window.updateProjCoverTitleUI(true));
  if (labelTitleOff) labelTitleOff.addEventListener('click', () => window.updateProjCoverTitleUI(false));

  // Global Project Visual Showcase Header Controls
  const btnToggleShowcaseHeader = document.getElementById('btnToggleShowcaseHeader');
  const showcaseHeaderIndicator = document.getElementById('globalShowcaseHeaderIndicator');
  const btnToggleShowcaseHeaderText = document.getElementById('btnToggleShowcaseHeaderText');
  const btnToggleShowcaseHeaderIcon = document.getElementById('btnToggleShowcaseHeaderIcon');
  const globalShowcaseTitleInput = document.getElementById('globalShowcaseTitleInput');
  const globalShowcaseSubtitleInput = document.getElementById('globalShowcaseSubtitleInput');
  const globalShowcaseTagInput = document.getElementById('globalShowcaseTagInput');
  const btnSaveShowcaseHeaderTexts = document.getElementById('btnSaveShowcaseHeaderTexts');

  window.updateGlobalShowcaseHeaderUI = function(isEnabled) {
    if (showcaseHeaderIndicator) {
      showcaseHeaderIndicator.className = isEnabled ? 'media-status-badge active' : 'media-status-badge disabled';
      showcaseHeaderIndicator.textContent = isEnabled ? '● Header Active' : '⊘ Header Hidden';
    }
    if (btnToggleShowcaseHeaderText) {
      btnToggleShowcaseHeaderText.textContent = isEnabled ? 'Showcase Header: ON' : 'Showcase Header: OFF';
    }
    if (btnToggleShowcaseHeaderIcon) {
      btnToggleShowcaseHeaderIcon.textContent = isEnabled ? '🖼️' : '⊘';
    }
    if (btnToggleShowcaseHeader) {
      btnToggleShowcaseHeader.style.background = isEnabled ? 'var(--color-navy)' : '#4B5563';
      btnToggleShowcaseHeader.style.borderColor = isEnabled ? 'var(--color-navy)' : '#4B5563';
    }
  };

  if (btnToggleShowcaseHeader) {
    btnToggleShowcaseHeader.addEventListener('click', () => {
      const data = PortfolioData.get();
      data.customization = data.customization || {};
      data.customization.projectPage = data.customization.projectPage || {};
      const current = data.customization.projectPage.showShowcaseHeader !== false;
      const next = !current;
      data.customization.projectPage.showShowcaseHeader = next;
      PortfolioData.save(data);
      window.updateGlobalShowcaseHeaderUI(next);
      syncPreviewIframe();
      showToast(`Project visual showcase header turned ${next ? 'ON' : 'OFF'}!`, 'success');
    });
  }

  if (btnSaveShowcaseHeaderTexts) {
    btnSaveShowcaseHeaderTexts.addEventListener('click', () => {
      const data = PortfolioData.get();
      data.customization = data.customization || {};
      data.customization.projectPage = data.customization.projectPage || {};
      data.customization.projectPage.showcaseHeaderTitle = (globalShowcaseTitleInput?.value.trim()) || 'VISUAL SHOWCASE';
      data.customization.projectPage.showcaseHeaderSubtitle = (globalShowcaseSubtitleInput?.value.trim()) || 'Form, ergonomics, and production detail studies.';
      data.customization.projectPage.showcaseHeaderTag = (globalShowcaseTagInput?.value.trim()) || 'DESIGN ARCHITECTURE 16:9 SHOWCASE';
      PortfolioData.save(data);
      syncPreviewIframe();
      showToast('Visual showcase header texts saved live!', 'success');
    });
  }

  // Global Project 9:16 Vertical Section Controls
  const btnToggleVerticalSection = document.getElementById('btnToggleVerticalSection');
  const verticalSectionIndicator = document.getElementById('globalVerticalSectionIndicator');
  const btnToggleVerticalSectionText = document.getElementById('btnToggleVerticalSectionText');
  const btnToggleVerticalSectionIcon = document.getElementById('btnToggleVerticalSectionIcon');
  const globalVerticalTitleInput = document.getElementById('globalVerticalTitleInput');
  const globalVerticalSubtitleInput = document.getElementById('globalVerticalSubtitleInput');
  const globalVerticalTagInput = document.getElementById('globalVerticalTagInput');
  const btnSaveVerticalSectionTexts = document.getElementById('btnSaveVerticalSectionTexts');

  window.updateGlobalVerticalSectionUI = function(isEnabled) {
    if (verticalSectionIndicator) {
      verticalSectionIndicator.className = isEnabled ? 'media-status-badge active' : 'media-status-badge disabled';
      verticalSectionIndicator.textContent = isEnabled ? '● 9:16 Section Active' : '⊘ 9:16 Section Hidden';
    }
    if (btnToggleVerticalSectionText) {
      btnToggleVerticalSectionText.textContent = isEnabled ? '9:16 Section: ON' : '9:16 Section: OFF';
    }
    if (btnToggleVerticalSectionIcon) {
      btnToggleVerticalSectionIcon.textContent = isEnabled ? '📱' : '⊘';
    }
    if (btnToggleVerticalSection) {
      btnToggleVerticalSection.style.background = isEnabled ? 'var(--color-navy)' : '#4B5563';
      btnToggleVerticalSection.style.borderColor = isEnabled ? 'var(--color-navy)' : '#4B5563';
    }
  };

  if (btnToggleVerticalSection) {
    btnToggleVerticalSection.addEventListener('click', () => {
      const data = PortfolioData.get();
      data.customization = data.customization || {};
      data.customization.projectPage = data.customization.projectPage || {};
      const current = data.customization.projectPage.showVerticalSection !== false;
      const next = !current;
      data.customization.projectPage.showVerticalSection = next;
      PortfolioData.save(data);
      window.updateGlobalVerticalSectionUI(next);
      syncPreviewIframe();
      showToast(`Project 9:16 vertical section turned ${next ? 'ON' : 'OFF'}!`, 'success');
    });
  }

  if (btnSaveVerticalSectionTexts) {
    btnSaveVerticalSectionTexts.addEventListener('click', () => {
      const data = PortfolioData.get();
      data.customization = data.customization || {};
      data.customization.projectPage = data.customization.projectPage || {};
      data.customization.projectPage.verticalSectionTitle = (globalVerticalTitleInput?.value.trim()) || 'VERTICAL STUDIES';
      data.customization.projectPage.verticalSectionSubtitle = (globalVerticalSubtitleInput?.value.trim()) || 'Mobile interactions, vertical prototyping, and tactile ergonomics.';
      data.customization.projectPage.verticalSectionTag = (globalVerticalTagInput?.value.trim()) || 'MOBILE INTERFACE 9:16 SHOWCASE';
      PortfolioData.save(data);
      syncPreviewIframe();
      showToast('9:16 vertical section texts saved live!', 'success');
    });
  }

  // Modal Project Visual Showcase Header Controls
  window.updateProjShowcaseHeaderUI = function(isHeaderOn) {
    const radioOn = document.getElementById('projShowcaseHeaderEnabled');
    const radioOff = document.getElementById('projShowcaseHeaderDisabled');
    const labelOn = document.getElementById('labelProjShowcaseHeaderEnabled');
    const labelOff = document.getElementById('labelProjShowcaseHeaderDisabled');
    const badge = document.getElementById('projShowcaseHeaderBadge');

    if (radioOn && radioOff) {
      radioOn.checked = isHeaderOn;
      radioOff.checked = !isHeaderOn;
    }
    if (labelOn && labelOff) {
      labelOn.classList.toggle('active', isHeaderOn);
      labelOff.classList.toggle('active', !isHeaderOn);
    }
    if (badge) {
      badge.className = isHeaderOn ? 'media-status-badge active' : 'media-status-badge disabled';
      badge.textContent = isHeaderOn ? '● Active' : '⊘ Hidden';
    }
  };

  const labelShowcaseHeaderOn = document.getElementById('labelProjShowcaseHeaderEnabled');
  const labelShowcaseHeaderOff = document.getElementById('labelProjShowcaseHeaderDisabled');
  if (labelShowcaseHeaderOn) labelShowcaseHeaderOn.addEventListener('click', () => window.updateProjShowcaseHeaderUI(true));
  if (labelShowcaseHeaderOff) labelShowcaseHeaderOff.addEventListener('click', () => window.updateProjShowcaseHeaderUI(false));

  // Global Project Category Filters Controls
  const btnToggleCategoryFilters = document.getElementById('btnToggleCategoryFilters');
  const categoryFiltersIndicator = document.getElementById('globalCategoryFiltersIndicator');
  const btnToggleCategoryFiltersText = document.getElementById('btnToggleCategoryFiltersText');
  const btnToggleCategoryFiltersIcon = document.getElementById('btnToggleCategoryFiltersIcon');
  const catNameProductInput = document.getElementById('catNameProductInput');
  const catNameUiuxInput = document.getElementById('catNameUiuxInput');
  const catNameGraphicInput = document.getElementById('catNameGraphicInput');
  const catBadgeSuffixInput = document.getElementById('catBadgeSuffixInput');
  const btnSaveCategoryTexts = document.getElementById('btnSaveCategoryTexts');

  window.updateGlobalCategoryFiltersUI = function(isEnabled) {
    if (categoryFiltersIndicator) {
      categoryFiltersIndicator.className = isEnabled ? 'media-status-badge active' : 'media-status-badge disabled';
      categoryFiltersIndicator.textContent = isEnabled ? '● Filters Active' : '⊘ Filters Hidden';
    }
    if (btnToggleCategoryFiltersText) {
      btnToggleCategoryFiltersText.textContent = isEnabled ? 'Category Filters: ON' : 'Category Filters: OFF';
    }
    if (btnToggleCategoryFiltersIcon) {
      btnToggleCategoryFiltersIcon.textContent = isEnabled ? '🏷️' : '⊘';
    }
    if (btnToggleCategoryFilters) {
      btnToggleCategoryFilters.style.background = isEnabled ? 'var(--color-navy)' : '#4B5563';
      btnToggleCategoryFilters.style.borderColor = isEnabled ? 'var(--color-navy)' : '#4B5563';
    }
  };

  if (btnToggleCategoryFilters) {
    btnToggleCategoryFilters.addEventListener('click', () => {
      const data = PortfolioData.get();
      data.customization = data.customization || {};
      data.customization.categoryFilters = data.customization.categoryFilters || {};
      const current = data.customization.categoryFilters.enabled !== false;
      const next = !current;
      data.customization.categoryFilters.enabled = next;
      PortfolioData.save(data);
      window.updateGlobalCategoryFiltersUI(next);
      syncPreviewIframe();
      showToast(`Category filter buttons turned ${next ? 'ON' : 'OFF'}!`, 'success');
    });
  }

  window.updateAdminCategoryDropdowns = function() {
    const data = PortfolioData.get();
    const cf = data?.customization?.categoryFilters || {};
    const prodName = cf.productName || 'Product Design';
    const uiuxName = cf.uiuxName || 'UI/UX Design';
    const graphName = cf.graphicName || 'Graphic Design';

    const selects = [
      document.getElementById('projectCategoryFilter'),
      document.getElementById('fieldProjCategory')
    ];

    selects.forEach(sel => {
      if (!sel) return;
      const optProd = sel.querySelector('option[value="product"]');
      const optUiux = sel.querySelector('option[value="uiux"]');
      const optGraph = sel.querySelector('option[value="graphic"]');
      if (optProd) optProd.textContent = prodName;
      if (optUiux) optUiux.textContent = uiuxName;
      if (optGraph) optGraph.textContent = graphName;
    });
  };

  if (btnSaveCategoryTexts) {
    btnSaveCategoryTexts.addEventListener('click', () => {
      const data = PortfolioData.get();
      data.customization = data.customization || {};
      data.customization.categoryFilters = data.customization.categoryFilters || {};
      const prodName = catNameProductInput?.value.trim() || 'Product Design';
      const uiuxName = catNameUiuxInput?.value.trim() || 'UI/UX Design';
      const graphName = catNameGraphicInput?.value.trim() || 'Graphic Design';
      const suffixVal = catBadgeSuffixInput?.value.trim();

      data.customization.categoryFilters.productName = prodName;
      data.customization.categoryFilters.uiuxName = uiuxName;
      data.customization.categoryFilters.graphicName = graphName;
      data.customization.categoryFilters.suffix = suffixVal !== undefined && suffixVal !== '' ? suffixVal : 'Projects';

      // Also sync data.categories array
      if (Array.isArray(data.categories)) {
        data.categories = data.categories.map(c => {
          if (c.id === 'product') return { ...c, name: prodName };
          if (c.id === 'uiux') return { ...c, name: uiuxName };
          if (c.id === 'graphic') return { ...c, name: graphName };
          return c;
        });
      }

      // Also update data.projects categoryLabel to reflect the new category names in cards!
      if (Array.isArray(data.projects)) {
        data.projects = data.projects.map(p => {
          if (p.category === 'product') {
            return { ...p, categoryLabel: prodName.toUpperCase() };
          } else if (p.category === 'uiux') {
            return { ...p, categoryLabel: uiuxName.toUpperCase() };
          } else if (p.category === 'graphic') {
            return { ...p, categoryLabel: graphName.toUpperCase() };
          }
          return p;
        });
      }

      PortfolioData.save(data);
      window.updateAdminCategoryDropdowns();
      renderProjectsTable();
      syncPreviewIframe();
      showToast('Category names and settings saved live!', 'success');
    });
  }
}

function loadProjectsData() {
  const data = PortfolioData.get();
  const sec = data.sections || {};
  const titleEl = document.getElementById('workSectionTitle');
  const subEl = document.getElementById('workSectionSubtitle');

  if (titleEl) titleEl.value = sec.workTitle || data.workTitle || 'SELECTED WORK';
  if (subEl) subEl.value = sec.workSubtitle || data.workSubtitle || 'Ideas transformed into meaningful, functional experiences.';

  const isWavesOn = data?.customization?.projectPage?.wavesAnimation !== false;
  if (window.updateGlobalWavesUI) window.updateGlobalWavesUI(isWavesOn);

  const isResearchOn = data?.customization?.projectPage?.viewResearch !== false && data?.customization?.projectPage?.showViewResearch !== false;
  if (window.updateGlobalViewResearchUI) window.updateGlobalViewResearchUI(isResearchOn);

  const isCoverTitleOn = data?.customization?.projectPage?.showCoverTitle !== false && data?.customization?.projectPage?.coverTitle !== false;
  if (window.updateGlobalCoverTitleUI) window.updateGlobalCoverTitleUI(isCoverTitleOn);

  const isShowcaseHeaderOn = data?.customization?.projectPage?.showShowcaseHeader !== false;
  if (window.updateGlobalShowcaseHeaderUI) window.updateGlobalShowcaseHeaderUI(isShowcaseHeaderOn);
  if (globalShowcaseTitleInput) globalShowcaseTitleInput.value = data?.customization?.projectPage?.showcaseHeaderTitle || 'VISUAL SHOWCASE';
  if (globalShowcaseSubtitleInput) globalShowcaseSubtitleInput.value = data?.customization?.projectPage?.showcaseHeaderSubtitle || 'Form, ergonomics, and production detail studies.';
  if (globalShowcaseTagInput) globalShowcaseTagInput.value = data?.customization?.projectPage?.showcaseHeaderTag || 'DESIGN ARCHITECTURE 16:9 SHOWCASE';

  const isVerticalOn = data?.customization?.projectPage?.showVerticalSection !== false;
  if (window.updateGlobalVerticalSectionUI) window.updateGlobalVerticalSectionUI(isVerticalOn);
  const globalVertTitle = document.getElementById('globalVerticalTitleInput');
  const globalVertSubtitle = document.getElementById('globalVerticalSubtitleInput');
  const globalVertTag = document.getElementById('globalVerticalTagInput');
  if (globalVertTitle) globalVertTitle.value = data?.customization?.projectPage?.verticalSectionTitle || 'VERTICAL STUDIES';
  if (globalVertSubtitle) globalVertSubtitle.value = data?.customization?.projectPage?.verticalSectionSubtitle || 'Mobile interactions, vertical prototyping, and tactile ergonomics.';
  if (globalVertTag) globalVertTag.value = data?.customization?.projectPage?.verticalSectionTag || 'MOBILE INTERFACE 9:16 SHOWCASE';

  const cf = data?.customization?.categoryFilters || {};
  const isCategoryFiltersOn = cf.enabled !== false;
  if (window.updateGlobalCategoryFiltersUI) window.updateGlobalCategoryFiltersUI(isCategoryFiltersOn);
  const catNameProd = document.getElementById('catNameProductInput');
  const catNameUiux = document.getElementById('catNameUiuxInput');
  const catNameGraph = document.getElementById('catNameGraphicInput');
  const catBadgeSuffix = document.getElementById('catBadgeSuffixInput');
  if (catNameProd) catNameProd.value = cf.productName || 'Product Design';
  if (catNameUiux) catNameUiux.value = cf.uiuxName || 'UI/UX Design';
  if (catNameGraph) catNameGraph.value = cf.graphicName || 'Graphic Design';
  if (catBadgeSuffix) catBadgeSuffix.value = cf.suffix !== undefined ? cf.suffix : 'Projects';
  if (window.updateAdminCategoryDropdowns) window.updateAdminCategoryDropdowns();
}

function addDynamicImageCard(containerId, src = '', alt = '', defaultPlaceholder = 'assets/images/work_luma.jpg', labelPrefix = 'Media', initialType = '') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const emptyNotice = container.querySelector('.dynamic-images-empty');
  if (emptyNotice) emptyNotice.remove();

  const card = document.createElement('div');
  card.className = 'dynamic-img-card';

  const currentSrc = src || '';
  const currentAlt = alt || '';

  const detectedIsVid = Boolean(
    initialType === 'video' ||
    (typeof currentSrc === 'string' && (currentSrc.includes('.mp4') || currentSrc.includes('.webm') || currentSrc.startsWith('data:video/')))
  );
  let currentType = initialType ? initialType : (detectedIsVid ? 'video' : 'image');
  card.dataset.mediaType = currentType;

  card.innerHTML = `
    <div class="dynamic-img-thumb-wrap">
      <img src="" alt="Preview" class="dynamic-img-preview" style="display:none;">
      <video autoplay muted loop playsinline class="dynamic-img-preview dyn-vid-preview" style="display:none; width:100%; height:100%; object-fit:cover;"></video>
      <span class="dyn-vid-badge" style="display:none;">VID 🎬</span>
    </div>
    <div class="dynamic-img-content">
      <div class="dynamic-img-top-row">
        <div class="dyn-media-pill-group">
          <button type="button" class="dyn-media-pill dyn-media-pill-image ${currentType === 'image' ? 'active' : ''}" data-type="image">🖼️ Image</button>
          <button type="button" class="dyn-media-pill dyn-media-pill-video ${currentType === 'video' ? 'active' : ''}" data-type="video">🎬 Video</button>
        </div>
        <button type="button" class="btn-remove-img" title="Remove item">&times;</button>
      </div>
      <div class="dynamic-img-url-row" style="display: flex; gap: 6px; align-items: center;">
        <input type="text" class="form-input form-input-sm dynamic-img-url" placeholder="Paste link (Cloudinary, Imgur, Supabase, MP4) or assets/path" style="flex: 1;">
        <button type="button" class="btn-sm-paste dyn-btn-paste" title="Paste link from clipboard">📋 Paste</button>
        <label class="btn-sm-upload" title="Upload local media">
          📁 Upload
          <input type="file" class="dynamic-img-file-input" style="display:none;">
        </label>
        <a href="#" target="_blank" class="btn-sm-open-link dyn-btn-test" title="Open link in new tab" style="display:none;">↗</a>
      </div>
      <div class="media-url-status-row dyn-media-status" style="display:none;"></div>
      <input type="text" class="form-input form-input-sm dynamic-img-alt" placeholder="Caption / Title">
    </div>
  `;

  const thumbWrap = card.querySelector('.dynamic-img-thumb-wrap');
  const imgEl = card.querySelector('img.dynamic-img-preview');
  const vidEl = card.querySelector('video.dynamic-img-preview');
  const vidBadge = card.querySelector('.dyn-vid-badge');
  const pillImg = card.querySelector('.dyn-media-pill-image');
  const pillVid = card.querySelector('.dyn-media-pill-video');
  const urlInput = card.querySelector('.dynamic-img-url');
  const altInput = card.querySelector('.dynamic-img-alt');
  const fileInput = card.querySelector('.dynamic-img-file-input');
  const removeBtn = card.querySelector('.btn-remove-img');
  const uploadLabel = card.querySelector('.btn-sm-upload');
  const btnPaste = card.querySelector('.dyn-btn-paste');
  const dynTestLink = card.querySelector('.dyn-btn-test');
  const dynStatusRow = card.querySelector('.dyn-media-status');

  urlInput.value = currentSrc;
  altInput.value = currentAlt;
  altInput.placeholder = `Caption (e.g. ${labelPrefix} Detail)`;

  function updateDynStatus() {
    const val = urlInput.value.trim();
    if (!val) {
      if (dynStatusRow) { dynStatusRow.style.display = 'none'; dynStatusRow.innerHTML = ''; }
      if (dynTestLink) dynTestLink.style.display = 'none';
      return;
    }
    if (dynTestLink) {
      if (/^https?:\/\//i.test(val)) {
        dynTestLink.href = val;
        dynTestLink.style.display = 'inline-flex';
      } else {
        dynTestLink.style.display = 'none';
      }
    }
    if (dynStatusRow) {
      dynStatusRow.style.display = 'flex';
      const norm = processMediaUrlInput(val, currentType);
      if (norm.isExternal) {
        dynStatusRow.innerHTML = '<span class="media-url-status-pill pill-cdn">🌐 Remote CDN Link • 0 KB saved • Fast &lt;1s sync</span>';
      } else if (val.startsWith('assets/')) {
        dynStatusRow.innerHTML = `<span class="media-url-status-pill pill-local">📁 Local Asset: ${val}</span>`;
      }
    }
  }

  function setMediaType(type) {
    currentType = type;
    card.dataset.mediaType = type;
    if (type === 'video') {
      pillVid.classList.add('active');
      pillImg.classList.remove('active');
      urlInput.placeholder = 'Paste video link (Cloudinary MP4, GitHub CDN) or assets/path';
      fileInput.accept = 'video/*,video/mp4,video/webm';
      if (uploadLabel) uploadLabel.title = 'Upload local video';
    } else {
      pillImg.classList.add('active');
      pillVid.classList.remove('active');
      urlInput.placeholder = 'Paste image link (Cloudinary, Imgur, Supabase) or assets/path';
      fileInput.accept = 'image/*';
      if (uploadLabel) uploadLabel.title = 'Upload local image';
    }
    updateThumb();
    updateDynStatus();
  }

  function updateThumb() {
    const val = urlInput.value.trim();
    const resolved = resolveMediaAdmin(val) || '';

    if (currentType === 'video') {
      if (imgEl) imgEl.style.display = 'none';
      if (vidEl) {
        vidEl.style.display = 'block';
        const vidSrc = resolved || (defaultPlaceholder.endsWith('.mp4') ? defaultPlaceholder : 'assets/Video-39694.mp4');
        vidEl.src = vidSrc;
        vidEl.muted = true;
        vidEl.play().catch(() => {});
      }
      if (vidBadge) vidBadge.style.display = 'block';
    } else {
      if (vidEl) {
        vidEl.pause();
        vidEl.removeAttribute('src');
        vidEl.load();
        vidEl.style.display = 'none';
      }
      if (imgEl) {
        imgEl.style.display = 'block';
        imgEl.src = resolved || defaultPlaceholder;
        imgEl.onerror = () => { imgEl.src = defaultPlaceholder; };
      }
      if (vidBadge) vidBadge.style.display = 'none';
    }
  }

  pillImg.addEventListener('click', (e) => {
    e.preventDefault();
    setMediaType('image');
  });

  pillVid.addEventListener('click', (e) => {
    e.preventDefault();
    setMediaType('video');
  });

  urlInput.addEventListener('input', () => {
    const raw = urlInput.value;
    const norm = processMediaUrlInput(raw, currentType);
    if (norm.converted && norm.url !== raw) {
      urlInput.value = norm.url;
    }
    if (norm.detectedType === 'video' && currentType !== 'video') {
      setMediaType('video');
    } else if (norm.detectedType === 'image' && currentType !== 'image') {
      setMediaType('image');
    }
    checkLocalPathWarning(urlInput);
    updateThumb();
    updateDynStatus();
  });

  if (btnPaste) {
    btnPaste.addEventListener('click', async (e) => {
      e.preventDefault();
      let text = '';
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          text = await navigator.clipboard.readText();
        }
      } catch(err) {}
      if (!text) {
        text = window.prompt(`Paste your ${currentType === 'video' ? 'Video' : 'Photo'} Link / URL:`);
      }
      if (text) {
        const norm = processMediaUrlInput(text, currentType);
        urlInput.value = norm.url;
        if (norm.detectedType === 'video' && currentType !== 'video') {
          setMediaType('video');
        } else if (norm.detectedType === 'image' && currentType !== 'image') {
          setMediaType('image');
        }
        updateThumb();
        updateDynStatus();
        if (typeof showToast === 'function') showToast('✓ Media link pasted and verified!');
      }
    });
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isFileVid = Boolean(file.type && file.type.startsWith('video/'));
    if (isFileVid && currentType !== 'video') {
      setMediaType('video');
    } else if (!isFileVid && currentType !== 'image') {
      setMediaType('image');
    }
    handleAdminFileUpload(file, urlInput, null, 'dyn_media', isFileVid || currentType === 'video').then(() => {
      updateThumb();
      updateDynStatus();
    });
  });

  removeBtn.addEventListener('click', () => {
    card.remove();
    updateDynamicImageCounters();
  });

  setMediaType(currentType);
  updateDynStatus();

  container.appendChild(card);
  updateDynamicImageCounters();
}

function updateDynamicImageCounters() {
  const overviewContainer = document.getElementById('overviewImagesContainer');
  const processContainer = document.getElementById('processImagesContainer');
  const overviewBadge = document.getElementById('overviewCountBadge');
  const processBadge = document.getElementById('processCountBadge');

  if (overviewContainer && overviewBadge) {
    const cards = overviewContainer.querySelectorAll('.dynamic-img-card');
    overviewBadge.textContent = cards.length === 1 ? '1 Item' : `${cards.length} Items`;
    if (cards.length === 0 && !overviewContainer.querySelector('.dynamic-images-empty')) {
      overviewContainer.innerHTML = '<div class="dynamic-images-empty">No overview media added yet. Click "+ Add Image 🖼️" or "+ Add Video 🎬" to add.</div>';
    }
  }

  if (processContainer && processBadge) {
    const cards = processContainer.querySelectorAll('.dynamic-img-card');
    processBadge.textContent = cards.length === 1 ? '1 Item' : `${cards.length} Items`;
    if (cards.length === 0 && !processContainer.querySelector('.dynamic-images-empty')) {
      processContainer.innerHTML = '<div class="dynamic-images-empty">No process media added yet. Click "+ Add Image 🖼️" or "+ Add Video 🎬" to add.</div>';
    }
  }

  const verticalContainer = document.getElementById('vertical916ImagesContainer');
  const verticalBadge = document.getElementById('vertical916CountBadge');
  if (verticalContainer && verticalBadge) {
    const cards = verticalContainer.querySelectorAll('.dynamic-img-card');
    verticalBadge.textContent = cards.length === 1 ? '1 Item' : `${cards.length} Items`;
    if (cards.length === 0 && !verticalContainer.querySelector('.dynamic-images-empty')) {
      verticalContainer.innerHTML = '<div class="dynamic-images-empty">No 9:16 vertical media added yet. Click "+ Add 9:16 Image 🖼️" or "+ Add 9:16 Video 🎬" to add.</div>';
    }
  }
}

function getImagesFromContainer(containerId, fallbackTitle = 'Project', defaultType = 'Media') {
  const container = document.getElementById(containerId);
  if (!container) return [];
  const cards = container.querySelectorAll('.dynamic-img-card');
  const result = [];

  cards.forEach((card, idx) => {
    const url = card.querySelector('.dynamic-img-url')?.value.trim();
    let alt = card.querySelector('.dynamic-img-alt')?.value.trim();
    const isCardVideo = card.dataset.mediaType === 'video' || Boolean(card.querySelector('.dyn-media-pill-video.active'));
    if (url) {
      if (!alt) alt = `${fallbackTitle} ${defaultType} ${idx + 1}`;
      const isVid = isCardVideo || (typeof window.PortfolioData?.isMediaVideo === 'function' ? window.PortfolioData.isMediaVideo(url) : (/\.(mp4|webm|mov|ogg|m4v)($|\?|#)/i.test(url) || url.includes('/video/upload/') || url.startsWith('data:video/')));
      result.push({
        src: url,
        alt: alt,
        isVideo: isVid,
        mediaType: isVid ? 'video' : 'image'
      });
    }
  });

  return result;
}

function renderProjectsTable() {
  const tableBody = document.getElementById('projectsTableBody');
  const filterVal = document.getElementById('projectCategoryFilter')?.value || 'all';
  const query = document.getElementById('projectSearchInput')?.value.toLowerCase().trim() || '';
  if (!tableBody) return;

  const data = PortfolioData.get();
  const projects = data.projects || [];

  let filtered = filterVal === 'all' 
    ? projects 
    : projects.filter(p => p.category === filterVal);

  if (query) {
    filtered = filtered.filter(p => {
      const matchTitle = (p.title || '').toLowerCase().includes(query);
      const matchShort = (p.shortTitle || '').toLowerCase().includes(query);
      const matchId = (p.id || '').toLowerCase().includes(query);
      const matchTag = (p.tag || '').toLowerCase().includes(query);
      const matchRole = (p.role || '').toLowerCase().includes(query);
      const matchTools = (p.tools || '').toLowerCase().includes(query);
      return matchTitle || matchShort || matchId || matchTag || matchRole || matchTools;
    });
  }

  tableBody.innerHTML = '';

  if (filtered.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--color-text-muted);">No projects found matching your criteria.</td></tr>';
    return;
  }

  filtered.forEach((p, idx) => {
    const isFirst = (idx === 0);
    const isLast = (idx === filtered.length - 1);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align: center;">
        <div class="reorder-group">
          <button type="button" class="btn-reorder" onclick="moveProject('${p.id}', 'up')" ${isFirst ? 'disabled' : ''} title="Move Up">▲</button>
          <button type="button" class="btn-reorder" onclick="moveProject('${p.id}', 'down')" ${isLast ? 'disabled' : ''} title="Move Down">▼</button>
        </div>
      </td>
      <td>
        <div style="position:relative; width:48px; height:48px; border-radius:10px; overflow:hidden; background:#0F172A; display:inline-block;">
        ${((p.mediaType === 'video' && (p.video || p.videoUrl)) || ((p.video || p.videoUrl) && p.mediaType !== 'image'))
          ? `<video src="${resolveMediaAdmin(p.video || p.videoUrl)}" autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover; display:block;"></video>
             <span style="position:absolute; bottom:2px; right:2px; background:rgba(0,0,0,0.75); color:#fff; font-size:8px; font-weight:700; padding:1px 3px; border-radius:3px;">VID</span>`
          : `<img src="${resolveMediaAdmin(p.image) || 'assets/images/work_luma.jpg'}" alt="${p.shortTitle}" class="table-thumb" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.src='assets/images/work_luma.jpg'">`
        }
        ${(p.mobileImage || p.mobileThumbnail) ? `<span title="Custom Mobile Thumbnail Configured" style="position:absolute; top:2px; left:2px; background:rgba(30,144,255,0.9); color:#fff; font-size:8px; font-weight:700; padding:1px 3px; border-radius:3px;">📱</span>` : ''}
        ${(p.showCoverTitle === false || p.coverTitle === false) ? `<span title="Cover Title Disabled" style="position:absolute; top:2px; right:2px; background:rgba(220,38,38,0.85); color:#fff; font-size:8px; font-weight:700; padding:1px 3px; border-radius:3px;">⊘T</span>` : ''}
        ${p.showShowcaseHeader === false ? `<span title="Showcase Header Disabled" style="position:absolute; bottom:2px; left:2px; background:rgba(220,38,38,0.85); color:#fff; font-size:8px; font-weight:700; padding:1px 3px; border-radius:3px;">⊘H</span>` : ''}
        ${p.showVerticalSection === false ? `<span title="9:16 Section Disabled" style="position:absolute; bottom:2px; right:2px; background:rgba(220,38,38,0.85); color:#fff; font-size:8px; font-weight:700; padding:1px 3px; border-radius:3px;">⊘V</span>` : ''}
        </div>
      </td>
      <td>
        <div class="table-title">${p.title || p.shortTitle}</div>
        <div style="font-size: 12px; color: var(--color-text-muted);">Slug: <code>${p.id}</code></div>
      </td>
      <td>
        <span class="table-category-pill ${p.category}">${p.category ? (p.category === 'product' ? (data.customization?.categoryFilters?.productName || 'PRODUCT') : p.category === 'uiux' ? (data.customization?.categoryFilters?.uiuxName || 'UI/UX') : p.category === 'graphic' ? (data.customization?.categoryFilters?.graphicName || 'GRAPHIC') : p.category).toUpperCase() : 'PROJECT'}</span>
      </td>
      <td>
        <span style="font-size: 13px; font-weight: 500;">${p.tag || 'Design'}</span>
      </td>
      <td style="text-align: right;">
        <div class="table-actions">
          <a href="project.html?id=${encodeURIComponent(p.id)}" target="_blank" class="btn-outline-admin" style="padding: 6px 12px; font-size: 12.5px;" title="View Case Study">Preview ↗</a>
          <button class="btn-primary" style="padding: 6px 12px; font-size: 12.5px;" onclick="editProject('${p.id}')">Edit ✏️</button>
          <button class="btn-danger" style="padding: 6px 12px; font-size: 12.5px;" onclick="deleteProject('${p.id}')">Delete 🗑️</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

/* ==========================================================================
   PROJECT CARD SPECIFICATIONS & FEATURES (6 PILLS) CONTROLLERS
   ========================================================================== */
const FEATURE_ICON_OPTIONS = [
  { value: 'chair', label: '🪑 Seating / Chair' },
  { value: 'spine', label: '🦴 Spine / Ergonomics' },
  { value: 'layers', label: '📐 Layers / Structure' },
  { value: 'material', label: '🍃 Material / Efficient' },
  { value: 'activity', label: '🏃 Activity / Movement' },
  { value: 'food', label: '🍎 Food / Nutrition' },
  { value: 'group', label: '👥 Group / Social' },
  { value: 'book', label: '📖 Guide / Book' },
  { value: 'armchair', label: '🛠️ CAD / Tooling / DFM' },
  { value: 'testing', label: '📦 Prototype / Testing' },
  { value: 'dial', label: '⚙️ Dial / Control / Detent' },
  { value: 'light', label: '☀️ Light / Circadian' },
  { value: 'optic', label: '👁️ Optic / Glare-free' },
  { value: 'flow', label: '🔄 Flow / User Journey' },
  { value: 'telemetry', label: '📈 Telemetry / Pulse' },
  { value: 'token', label: '🧩 Tokens / Design System' },
  { value: 'interaction', label: '👆 Micro-interaction' },
  { value: 'wireframe', label: '🔲 Wireframe / Layout' },
  { value: 'type', label: '🔤 Typography / Hierarchy' },
  { value: 'vector', label: '✒️ Vector / Pen' },
  { value: 'foil', label: '✨ Foil / Print Finishes' },
  { value: 'contrast', label: '🌓 Contrast / Duotone' },
  { value: 'texture', label: '🏁 Silkscreen / Texture' },
  { value: 'guideline', label: '📖 Brand Guidelines' }
];

function escapeAdminHtmlAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getFeatureSvg(iconType, label = '') {
  const norm = ((iconType || '') + ' ' + (label || '')).toLowerCase();

  // Testing & Prototyping
  if (norm.includes('test') || norm.includes('prototype') || norm.includes('benchmark')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
  }

  // Graphic Design: Typography
  if (norm.includes('typograph') || norm.includes('hierarchy') || norm.includes('font') || (/\btype\b/i).test(iconType || '')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`;
  }
  // Graphic Design: Vector
  if (norm.includes('vector') || norm.includes('pen') || norm.includes('bezier')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;
  }
  // Graphic Design: Foil & finishes
  if (norm.includes('foil') || norm.includes('sparkle') || norm.includes('finish') || norm.includes('print')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`;
  }
  // Graphic Design: Contrast / Duotone
  if (norm.includes('contrast') || norm.includes('duotone')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/></svg>`;
  }
  // Graphic Design: Silkscreen textures
  if (norm.includes('silkscreen') || norm.includes('texture') || norm.includes('grid')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>`;
  }
  // Graphic Design: Guidelines / Identity / Book
  if (norm.includes('guideline') || norm.includes('identity') || norm.includes('book') || norm.includes('understand') || norm.includes('learn')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
  }

  // Physical / Activity / Runner / Movement
  if (norm.includes('run') || norm.includes('physical') || norm.includes('sport') || norm.includes('movement') || (norm.includes('activity') && !norm.includes('telemetry'))) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="17" cy="4" r="2"/><path d="m15 8-4.5 4.5-3-2L3 13.5"/><path d="m10.5 12.5 3 3.5v6"/><path d="m7.5 10.5-2 11.5"/></svg>`;
  }

  // Food / Nutrition / Apple / Diet
  if (norm.includes('food') || norm.includes('apple') || norm.includes('nutrition') || norm.includes('diet') || norm.includes('health')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c.5 2-1 4-2 5"/><path d="M12 7c-1.5-1.5-4-1.5-5.5 0-2 2-2 6 0 9 1.5 2.2 4 4 5.5 4s4-1.8 5.5-4c2-3 2-7 0-9-1.5-1.5-4-1.5-5.5 0z"/></svg>`;
  }

  // Group / Social / Community / People
  if (norm.includes('group') || norm.includes('social') || norm.includes('team') || norm.includes('people') || norm.includes('community')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  }

  // UI/UX: Flow
  if (norm.includes('flow') || norm.includes('user')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>`;
  }
  // UI/UX: Telemetry / Activity
  if (norm.includes('telemetry') || norm.includes('pulse')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;
  }
  // UI/UX: Tokens / System
  if (norm.includes('token') || norm.includes('system') || norm.includes('component')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`;
  }
  // UI/UX: Interaction / Cursor
  if (norm.includes('interaction') || norm.includes('micro') || norm.includes('tap') || norm.includes('cursor')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>`;
  }
  // UI/UX: Wireframe
  if (norm.includes('wireframe') || norm.includes('window') || norm.includes('layout')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`;
  }

  // Lightweight structure / Layers
  if (norm.includes('structure') || norm.includes('layers') || norm.includes('ribs') || norm.includes('ribbing') || norm.includes('billet') || norm.includes('plywood') || norm.includes('chassis') || norm.includes('prepreg')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
  }

  // Material efficiency / Sustainability
  if (norm.includes('material') || norm.includes('efficient') || norm.includes('polymer') || norm.includes('resin') || norm.includes('sustainable') || norm.includes('saving')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;
  }

  // Spine & Posture curvature
  if (norm.includes('spine') || norm.includes('posture') || norm.includes('ergonomic geometry') || norm.includes('lumbar')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3c0 2 3 3 3 5s-3 3-3 5a3 3 0 0 0 6 0c0-2-3-3-3-5s3-3 3-5a3 3 0 0 0-3-3z"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>`;
  }

  // Seating & Ergonomic Chair
  if (norm.includes('chair') || norm.includes('seating') || norm.includes('seat')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 11a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6H3v-6z"/><line x1="6" y1="18" x2="6" y2="21"/><line x1="18" y1="18" x2="18" y2="21"/></svg>`;
  }

  // Lighting & Optics
  if (norm.includes('circadian') || norm.includes('sun') || (/\blight\b/i).test(norm)) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  }
  if (norm.includes('optic') || norm.includes('glare')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }

  // Construction, Tooling, DFM & Engineering
  if (norm.includes('construction') || norm.includes('cad') || norm.includes('tooling') || norm.includes('dfm') || norm.includes('milled') || norm.includes('precision') || norm.includes('armchair')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3 8.7 2.7c-.4-.4-1-.4-1.4 0L2.7 7.3c-.4.4-.4 1 0 1.4l12.6 12.6c.4.4 1 .4 1.4 0l4.6-4.6c.4-.4.4-1 0-1.4Z"/><path d="m7.5 7.5 2 2"/><path d="m10.5 10.5 2 2"/><path d="m13.5 13.5 2 2"/></svg>`;
  }

  // Dials & Controls
  if (norm.includes('dial') || norm.includes('detent') || norm.includes('knurl') || norm.includes('gear')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
  }

  // Default testing / prototype / box
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
}

function getDefaultFeaturesForProject(projectOrCat) {
  let cat = typeof projectOrCat === 'string' ? projectOrCat : (projectOrCat?.category || 'product');
  const id = typeof projectOrCat === 'object' ? (projectOrCat?.id || projectOrCat?.slug) : '';

  if (id === 'kinetic_chair' || id === 'kinetic-chair') {
    return [
      { label: "Ergonomic seating", icon: "chair" },
      { label: "Spine supporting", icon: "spine" },
      { label: "Lightweight structure", icon: "layers" },
      { label: "Material efficient", icon: "material" },
      { label: "Plywood construction", icon: "armchair" },
      { label: "Prototype & testing", icon: "testing" }
    ];
  } else if (id === 'apex_gears' || id === 'apex-gears') {
    return [
      { label: "Zero-backlash teeth", icon: "chair" },
      { label: "Micro planetary set", icon: "spine" },
      { label: "Carbon prepreg arms", icon: "layers" },
      { label: "Low friction mesh", icon: "material" },
      { label: "Ceramic bearings", icon: "armchair" },
      { label: "Finite element FEA", icon: "testing" }
    ];
  } else if (cat === 'product') {
    return [
      { label: "Precision engineering", icon: "chair" },
      { label: "Ergonomic geometry", icon: "spine" },
      { label: "Lightweight structure", icon: "layers" },
      { label: "Material efficient", icon: "material" },
      { label: "DFM production CAD", icon: "armchair" },
      { label: "Functional prototype", icon: "testing" }
    ];
  } else if (cat === 'uiux') {
    return [
      { label: "User-centric flow", icon: "flow" },
      { label: "Adaptive telemetry", icon: "telemetry" },
      { label: "Design system tokens", icon: "token" },
      { label: "Micro-interactions", icon: "interaction" },
      { label: "Interactive wireframes", icon: "wireframe" },
      { label: "Usability benchmark", icon: "testing" }
    ];
  } else {
    return [
      { label: "Typographic hierarchy", icon: "type" },
      { label: "Vector composition", icon: "vector" },
      { label: "Foil & print finishes", icon: "foil" },
      { label: "High contrast duotone", icon: "contrast" },
      { label: "Silkscreen textures", icon: "texture" },
      { label: "Identity guidelines", icon: "guideline" }
    ];
  }
}

function renderProjectFeatureSlots(features = []) {
  const container = document.getElementById('projFeaturesContainer');
  if (!container) return;
  container.innerHTML = '';

  const activeFeatures = Array.isArray(features) ? [...features] : [];
  while (activeFeatures.length < 6) {
    activeFeatures.push({ label: '', icon: 'chair' });
  }

  activeFeatures.slice(0, 6).forEach((feat, idx) => {
    const slot = document.createElement('div');
    slot.className = 'feature-edit-slot';
    const currentLabel = feat.label || '';
    const currentIcon = feat.icon || 'chair';

    const optionsHtml = FEATURE_ICON_OPTIONS.map(opt => {
      const isSelected = opt.value === currentIcon ? 'selected' : '';
      return `<option value="${opt.value}" ${isSelected}>${opt.label}</option>`;
    }).join('');

    slot.innerHTML = `
      <div class="feature-slot-header">
        <span class="feature-slot-badge">Pill ${idx + 1} Spec</span>
        <div class="feature-icon-badge-preview" id="featIconPreview_${idx}" title="Live Icon Preview">
          ${getFeatureSvg(currentIcon, currentLabel)}
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <input type="text" class="form-input form-input-sm feature-label-input" placeholder="Pill label (e.g. Zero-backlash teeth)" value="${escapeAdminHtmlAttr(currentLabel)}">
        <select class="form-select form-select-sm feature-icon-select" style="font-size: 12px; padding: 5px 8px;">
          ${optionsHtml}
        </select>
      </div>
    `;

    const labelInput = slot.querySelector('.feature-label-input');
    const iconSelect = slot.querySelector('.feature-icon-select');
    const iconBadge = slot.querySelector('.feature-icon-badge-preview');

    const updatePreview = () => {
      const selectedIcon = iconSelect.value;
      const labelText = labelInput.value.trim();
      iconBadge.innerHTML = getFeatureSvg(selectedIcon, labelText);
    };

    iconSelect.addEventListener('change', updatePreview);
    labelInput.addEventListener('input', updatePreview);

    container.appendChild(slot);
  });
}

function setProjModalSubtab(tab) {
  const btnCard = document.getElementById('btnSubtabCard');
  const btnCaseStudy = document.getElementById('btnSubtabCaseStudy');
  const btnAll = document.getElementById('btnSubtabAll');
  const secCard = document.getElementById('projModalSectionCard');
  const secCaseStudy = document.getElementById('projModalSectionCaseStudy');

  if (btnCard) btnCard.classList.toggle('active', tab === 'card');
  if (btnCaseStudy) btnCaseStudy.classList.toggle('active', tab === 'caseStudy');
  if (btnAll) btnAll.classList.toggle('active', tab === 'all');

  if (secCard && secCaseStudy) {
    if (tab === 'card') {
      secCard.style.display = 'block';
      secCaseStudy.style.display = 'none';
    } else if (tab === 'caseStudy') {
      secCard.style.display = 'none';
      secCaseStudy.style.display = 'block';
    } else if (tab === 'all') {
      secCard.style.display = 'block';
      secCaseStudy.style.display = 'block';
    }
  }
}
window.setProjModalSubtab = setProjModalSubtab;

function openProjectModal(projectToEdit = null) {
  const modal = document.getElementById('modalProject');
  const heading = document.getElementById('modalProjectHeading');
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  // Always switch to Project Card subtab by default for quick card editing
  setProjModalSubtab('card');

  if (projectToEdit) {
    heading.textContent = `Edit Project: ${projectToEdit.shortTitle || projectToEdit.title}`;
    setVal('editProjectId', projectToEdit.id);
    setVal('fieldProjSlug', projectToEdit.id);
    document.getElementById('fieldProjSlug').readOnly = true;
    setVal('fieldProjCategory', projectToEdit.category || 'product');
    setVal('fieldProjCategoryLabel', projectToEdit.categoryLabel || '');
    setVal('fieldProjFocalPoint', projectToEdit.focalPoint || 'center center');
    setVal('fieldProjShortTitle', projectToEdit.shortTitle || '');
    setVal('fieldProjTitle', projectToEdit.title || '');
    setVal('fieldProjTag', projectToEdit.tag || '');
    setVal('fieldProjImage', projectToEdit.image || '');
    setVal('fieldProjVideo', projectToEdit.video || projectToEdit.videoUrl || '');

    // Card descriptions & brief (edited in Section 1)
    const pDesc1 = projectToEdit.desc1 || (projectToEdit.content && projectToEdit.content.desc1) || (projectToEdit.description ? projectToEdit.description.split('\n\n')[0] : '') || projectToEdit.shortDesc || '';
    const pDesc2 = projectToEdit.desc2 || (projectToEdit.content && projectToEdit.content.desc2) || (projectToEdit.description && projectToEdit.description.includes('\n\n') ? projectToEdit.description.split('\n\n')[1] : '') || '';
    const pBrief = projectToEdit.projectBrief || (projectToEdit.content && projectToEdit.content.brief) || projectToEdit.brief || pDesc1 || projectToEdit.shortDesc || '';

    setVal('fieldProjDesc1', pDesc1);
    setVal('fieldProjDesc2', pDesc2);
    setVal('fieldProjBrief', pBrief);
    setVal('fieldProjShortDesc', projectToEdit.shortDesc || pBrief || pDesc1);
    setVal('fieldProjDesc', projectToEdit.description || '');
    setVal('fieldProjTimeline', projectToEdit.timeline || '');
    setVal('fieldProjRole', projectToEdit.role || '');
    setVal('fieldProjTools', projectToEdit.tools || '');
    setVal('fieldProjDeliverables', projectToEdit.deliverable || '');

    // Populate 6 Project Card Specification Pills
    const activeFeatures = (Array.isArray(projectToEdit.features) && projectToEdit.features.length > 0)
      ? projectToEdit.features
      : ((projectToEdit.content && Array.isArray(projectToEdit.content.features) && projectToEdit.content.features.length > 0)
        ? projectToEdit.content.features
        : getDefaultFeaturesForProject(projectToEdit));
    renderProjectFeatureSlots(activeFeatures);

    const preview = document.getElementById('fieldProjThumbPreview');
    if (preview && projectToEdit.image) preview.src = resolveMediaAdmin(projectToEdit.image);

    const mobImgVal = projectToEdit.mobileImage || projectToEdit.mobileThumbnail || '';
    setVal('fieldProjMobileImage', mobImgVal);
    if (window.updateMobileThumbUI) window.updateMobileThumbUI(mobImgVal);

    const vidPreview = document.getElementById('fieldProjVideoPreview');
    const existingVid = projectToEdit.video || projectToEdit.videoUrl || '';
    if (vidPreview) {
      const resVid = resolveMediaAdmin(existingVid);
      vidPreview.src = resVid;
      if (resVid) {
        vidPreview.muted = true;
        vidPreview.play().catch(() => {});
      }
    }

    const mType = projectToEdit.mediaType || (existingVid ? 'video' : 'image');
    if (window.updateProjMediaTypeUI) window.updateProjMediaTypeUI(mType);

    let projWaves = true;
    if (projectToEdit.wavesAnimation !== undefined && projectToEdit.wavesAnimation !== null) {
      projWaves = Boolean(projectToEdit.wavesAnimation);
    } else {
      const globalData = PortfolioData.get();
      projWaves = globalData?.customization?.projectPage?.wavesAnimation !== false;
    }
    if (window.updateProjWavesUI) window.updateProjWavesUI(projWaves);

    let projViewResearch = true;
    if (projectToEdit.viewResearch !== undefined && projectToEdit.viewResearch !== null) {
      projViewResearch = Boolean(projectToEdit.viewResearch);
    } else if (projectToEdit.showViewResearch !== undefined && projectToEdit.showViewResearch !== null) {
      projViewResearch = Boolean(projectToEdit.showViewResearch);
    } else {
      const globalData = PortfolioData.get();
      projViewResearch = globalData?.customization?.projectPage?.viewResearch !== false && globalData?.customization?.projectPage?.showViewResearch !== false;
    }
    if (window.updateProjViewResearchUI) window.updateProjViewResearchUI(projViewResearch);

    let projCoverTitle = true;
    if (projectToEdit.showCoverTitle !== undefined && projectToEdit.showCoverTitle !== null) {
      projCoverTitle = Boolean(projectToEdit.showCoverTitle);
    } else if (projectToEdit.coverTitle !== undefined && projectToEdit.coverTitle !== null) {
      projCoverTitle = Boolean(projectToEdit.coverTitle);
    } else {
      const globalData = PortfolioData.get();
      projCoverTitle = globalData?.customization?.projectPage?.showCoverTitle !== false && globalData?.customization?.projectPage?.coverTitle !== false;
    }
    if (window.updateProjCoverTitleUI) window.updateProjCoverTitleUI(projCoverTitle);

    let projShowcaseHeader = true;
    if (projectToEdit.showShowcaseHeader !== undefined && projectToEdit.showShowcaseHeader !== null) {
      projShowcaseHeader = Boolean(projectToEdit.showShowcaseHeader);
    } else {
      const globalData = PortfolioData.get();
      projShowcaseHeader = globalData?.customization?.projectPage?.showShowcaseHeader !== false;
    }
    if (window.updateProjShowcaseHeaderUI) window.updateProjShowcaseHeaderUI(projShowcaseHeader);
    setVal('fieldProjShowcaseTitle', projectToEdit.showcaseHeaderTitle || '');
    setVal('fieldProjShowcaseSubtitle', projectToEdit.showcaseHeaderSubtitle || '');
    setVal('fieldProjShowcaseTag', projectToEdit.showcaseHeaderTag || '');

    // Populate dynamic showcase images (Overview)
    const overviewContainer = document.getElementById('overviewImagesContainer');
    const processContainer = document.getElementById('processImagesContainer');
    if (overviewContainer) overviewContainer.innerHTML = '';
    if (processContainer) processContainer.innerHTML = '';

    const showcases = projectToEdit.showcaseImages || [];
    if (showcases.length > 0) {
      showcases.forEach((item, idx) => {
        const itemSrc = typeof item === 'string' ? item : (item.src || item.url || '');
        const itemAlt = typeof item === 'string' ? `${projectToEdit.shortTitle || 'Project'} Overview ${idx + 1}` : (item.alt || `${projectToEdit.shortTitle || 'Project'} Overview ${idx + 1}`);
        const isVid = (typeof item === 'object' && Boolean(item.isVideo || item.mediaType === 'video')) ||
                      itemSrc.includes('.mp4') || itemSrc.includes('.webm') || itemSrc.startsWith('data:video/');
        addDynamicImageCard('overviewImagesContainer', itemSrc, itemAlt, 'assets/images/work_luma.jpg', 'Overview', isVid ? 'video' : 'image');
      });
    } else if (projectToEdit.image) {
      addDynamicImageCard('overviewImagesContainer', projectToEdit.image, projectToEdit.shortTitle || 'Overview', 'assets/images/work_luma.jpg', 'Overview', 'image');
    } else {
      addDynamicImageCard('overviewImagesContainer', 'assets/images/work_luma.jpg', 'Overview 1', 'assets/images/work_luma.jpg', 'Overview', 'image');
    }

    // Populate dynamic process images (Process)
    const processes = projectToEdit.processImages || [];
    if (processes.length > 0) {
      processes.forEach((item, idx) => {
        const itemSrc = typeof item === 'string' ? item : (item.src || item.url || '');
        const itemAlt = typeof item === 'string' ? `${projectToEdit.shortTitle || 'Project'} Process ${idx + 1}` : (item.alt || `${projectToEdit.shortTitle || 'Project'} Process ${idx + 1}`);
        const isVid = (typeof item === 'object' && Boolean(item.isVideo || item.mediaType === 'video')) ||
                      itemSrc.includes('.mp4') || itemSrc.includes('.webm') || itemSrc.startsWith('data:video/');
        addDynamicImageCard('processImagesContainer', itemSrc, itemAlt, 'assets/images/proto_cad.jpg', 'Process', isVid ? 'video' : 'image');
      });
    } else {
      addDynamicImageCard('processImagesContainer', 'assets/images/proto_cad.jpg', 'Process 1', 'assets/images/proto_cad.jpg', 'Process', 'image');
    }

    // Set 9:16 visibility & custom texts
    const vertVisSelect = document.getElementById('fieldProjShowVerticalSection');
    if (vertVisSelect) {
      if (projectToEdit.showVerticalSection === true) vertVisSelect.value = 'true';
      else if (projectToEdit.showVerticalSection === false) vertVisSelect.value = 'false';
      else vertVisSelect.value = 'default';
    }
    setVal('fieldProjVerticalTitle', projectToEdit.verticalSectionTitle || '');
    setVal('fieldProjVerticalSubtitle', projectToEdit.verticalSectionSubtitle || '');
    setVal('fieldProjVerticalTag', projectToEdit.verticalSectionTag || '');

    // Populate dynamic 9:16 vertical images
    const verticalContainer = document.getElementById('vertical916ImagesContainer');
    if (verticalContainer) verticalContainer.innerHTML = '';

    const verticals = projectToEdit.verticalImages || [];
    if (verticals.length > 0) {
      verticals.forEach((item, idx) => {
        const itemSrc = typeof item === 'string' ? item : (item.src || item.url || '');
        const itemAlt = typeof item === 'string' ? `${projectToEdit.shortTitle || 'Project'} 9:16 Study ${idx + 1}` : (item.alt || `${projectToEdit.shortTitle || 'Project'} 9:16 Study ${idx + 1}`);
        const isVid = (typeof item === 'object' && Boolean(item.isVideo || item.mediaType === 'video')) ||
                      itemSrc.includes('.mp4') || itemSrc.includes('.webm') || itemSrc.startsWith('data:video/');
        addDynamicImageCard('vertical916ImagesContainer', itemSrc, itemAlt, 'assets/images/proto_cad.jpg', '9:16 Study', isVid ? 'video' : 'image');
      });
    }

    updateDynamicImageCounters();

  } else {
    heading.textContent = 'Add New Project';
    setVal('editProjectId', '');
    setVal('fieldProjSlug', '');
    document.getElementById('fieldProjSlug').readOnly = false;
    setVal('fieldProjCategory', 'product');
    setVal('fieldProjCategoryLabel', 'PRODUCT DESIGN');
    setVal('fieldProjFocalPoint', 'center center');
    setVal('fieldProjShortTitle', '');
    setVal('fieldProjTitle', '');
    setVal('fieldProjTag', 'Scale Prototyping');
    setVal('fieldProjImage', 'assets/images/work_luma.jpg');
    setVal('fieldProjVideo', '');
    setVal('fieldProjDesc1', '');
    setVal('fieldProjDesc2', '');
    setVal('fieldProjBrief', '');
    setVal('fieldProjShortDesc', '');
    setVal('fieldProjDesc', '');
    setVal('fieldProjTimeline', '3 Months (2025)');
    setVal('fieldProjRole', 'Lead Industrial Designer');
    setVal('fieldProjTools', 'Fusion 360, KeyShot, CNC');
    setVal('fieldProjDeliverables', 'Working Prototype, Production Ready CAD');

    // Populate default 6 Project Card Specification Pills
    renderProjectFeatureSlots(getDefaultFeaturesForProject('product'));

    const preview = document.getElementById('fieldProjThumbPreview');
    if (preview) preview.src = 'assets/images/work_luma.jpg';

    setVal('fieldProjMobileImage', '');
    if (window.updateMobileThumbUI) window.updateMobileThumbUI('');

    const vidPreview = document.getElementById('fieldProjVideoPreview');
    if (vidPreview) vidPreview.src = '';

    if (window.updateProjMediaTypeUI) window.updateProjMediaTypeUI('image');

    const globalData = PortfolioData.get();
    const projWaves = globalData?.customization?.projectPage?.wavesAnimation !== false;
    if (window.updateProjWavesUI) window.updateProjWavesUI(projWaves);

    const projViewResearch = globalData?.customization?.projectPage?.viewResearch !== false && globalData?.customization?.projectPage?.showViewResearch !== false;
    if (window.updateProjViewResearchUI) window.updateProjViewResearchUI(projViewResearch);

    const projCoverTitle = globalData?.customization?.projectPage?.showCoverTitle !== false && globalData?.customization?.projectPage?.coverTitle !== false;
    if (window.updateProjCoverTitleUI) window.updateProjCoverTitleUI(projCoverTitle);

    const projShowcaseHeader = globalData?.customization?.projectPage?.showShowcaseHeader !== false;
    if (window.updateProjShowcaseHeaderUI) window.updateProjShowcaseHeaderUI(projShowcaseHeader);
    setVal('fieldProjShowcaseTitle', '');
    setVal('fieldProjShowcaseSubtitle', '');
    setVal('fieldProjShowcaseTag', '');

    const overviewContainer = document.getElementById('overviewImagesContainer');
    const processContainer = document.getElementById('processImagesContainer');
    if (overviewContainer) overviewContainer.innerHTML = '';
    if (processContainer) processContainer.innerHTML = '';

    addDynamicImageCard('overviewImagesContainer', 'assets/images/work_luma.jpg', 'Overview 1', 'assets/images/work_luma.jpg', 'Overview');
    addDynamicImageCard('overviewImagesContainer', 'assets/images/card_gantri.jpg', 'Overview 2', 'assets/images/card_gantri.jpg', 'Overview');
    addDynamicImageCard('processImagesContainer', 'assets/images/proto_cad.jpg', 'Process 1', 'assets/images/proto_cad.jpg', 'Process');
    addDynamicImageCard('processImagesContainer', 'assets/images/proto_drafting.jpg', 'Process 2', 'assets/images/proto_drafting.jpg', 'Process');

    const vertVisSelect = document.getElementById('fieldProjShowVerticalSection');
    if (vertVisSelect) vertVisSelect.value = 'default';
    setVal('fieldProjVerticalTitle', '');
    setVal('fieldProjVerticalSubtitle', '');
    setVal('fieldProjVerticalTag', '');

    const verticalContainer = document.getElementById('vertical916ImagesContainer');
    if (verticalContainer) verticalContainer.innerHTML = '';

    updateDynamicImageCounters();
  }

  modal.classList.add('active');
  setTimeout(setupMediaUrlEnhancers, 60);
}

function saveProjectRecord() {
  const editId = document.getElementById('editProjectId').value.trim();
  const slug = document.getElementById('fieldProjSlug').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const shortTitle = document.getElementById('fieldProjShortTitle').value.trim();
  const title = document.getElementById('fieldProjTitle').value.trim();

  if (!slug || !shortTitle) {
    alert('Please provide a unique Project ID/Slug and Title.');
    return;
  }

  const data = PortfolioData.get();
  data.projects = data.projects || [];

  if (!editId) {
    const exists = data.projects.some(p => p.id === slug);
    if (exists) {
      alert(`A project with ID "${slug}" already exists. Please choose a different slug.`);
      return;
    }
  }

  const category = document.getElementById('fieldProjCategory').value;
  const cf = data?.customization?.categoryFilters || {};
  const categoryLabels = {
    product: (cf.productName || 'PRODUCT DESIGN').toUpperCase(),
    uiux: (cf.uiuxName || 'UI/UX DESIGN').toUpperCase(),
    graphic: (cf.graphicName || 'GRAPHIC DESIGN').toUpperCase()
  };

  const showcaseImages = getImagesFromContainer('overviewImagesContainer', shortTitle, 'Overview');
  const processImages = getImagesFromContainer('processImagesContainer', shortTitle, 'Process');
  const fallbackMainImg = document.getElementById('fieldProjImage').value.trim() || 'assets/images/work_luma.jpg';
  const mobileImgVal = document.getElementById('fieldProjMobileImage') ? document.getElementById('fieldProjMobileImage').value.trim() : '';
  const videoDemoVal = document.getElementById('fieldProjVideo') ? document.getElementById('fieldProjVideo').value.trim() : '';
  const projMediaTypeVal = document.querySelector('input[name="projMediaType"]:checked')?.value || (videoDemoVal ? 'video' : 'image');
  const projWavesVal = document.getElementById('projWavesDisabled')?.checked ? false : true;
  const projViewResearchVal = document.getElementById('projViewResearchDisabled')?.checked ? false : true;
  const projCoverTitleVal = document.getElementById('projCoverTitleDisabled')?.checked ? false : true;
  const projShowcaseHeaderVal = document.getElementById('projShowcaseHeaderDisabled')?.checked ? false : true;
  const projShowcaseTitleVal = document.getElementById('fieldProjShowcaseTitle')?.value.trim() || '';
  const projShowcaseSubtitleVal = document.getElementById('fieldProjShowcaseSubtitle')?.value.trim() || '';
  const projShowcaseTagVal = document.getElementById('fieldProjShowcaseTag')?.value.trim() || '';

  const verticalImages = getImagesFromContainer('vertical916ImagesContainer', shortTitle, '9:16 Study');
  const projVerticalVisibilitySelect = document.getElementById('fieldProjShowVerticalSection')?.value;
  let projVerticalVal = null;
  if (projVerticalVisibilitySelect === 'true') projVerticalVal = true;
  else if (projVerticalVisibilitySelect === 'false') projVerticalVal = false;
  const projVerticalTitleVal = document.getElementById('fieldProjVerticalTitle')?.value.trim() || '';
  const projVerticalSubtitleVal = document.getElementById('fieldProjVerticalSubtitle')?.value.trim() || '';
  const projVerticalTagVal = document.getElementById('fieldProjVerticalTag')?.value.trim() || '';

  // Extract 6 Project Card Specification / Feature Pills
  const featureSlots = document.querySelectorAll('#projFeaturesContainer .feature-edit-slot');
  const projectFeatures = [];
  featureSlots.forEach(slot => {
    const lbl = slot.querySelector('.feature-label-input')?.value.trim() || '';
    const icn = slot.querySelector('.feature-icon-select')?.value || 'chair';
    if (lbl) {
      projectFeatures.push({ label: lbl, icon: icn });
    }
  });

  // Extract Project Card Content (Paragraph 1, Paragraph 2, and Project Brief)
  const desc1Val = document.getElementById('fieldProjDesc1')?.value.trim() || '';
  const desc2Val = document.getElementById('fieldProjDesc2')?.value.trim() || '';
  const briefVal = document.getElementById('fieldProjBrief')?.value.trim() || '';
  const caseDescVal = document.getElementById('fieldProjDesc')?.value.trim() || '';
  const finalDesc = caseDescVal || [desc1Val, desc2Val].filter(Boolean).join('\n\n');
  const finalShortDesc = briefVal || desc1Val || document.getElementById('fieldProjShortDesc')?.value.trim() || '';

  const customCategoryLabel = document.getElementById('fieldProjCategoryLabel')?.value.trim();
  const focalPointVal = document.getElementById('fieldProjFocalPoint')?.value.trim() || 'center center';

  const projectRecord = {
    id: editId || slug,
    category: category,
    categoryLabel: customCategoryLabel || categoryLabels[category] || category.toUpperCase(),
    focalPoint: focalPointVal,
    shortTitle: shortTitle,
    title: title || shortTitle,
    tag: document.getElementById('fieldProjTag').value.trim(),
    mediaType: projMediaTypeVal,
    wavesAnimation: projWavesVal,
    viewResearch: projViewResearchVal,
    showViewResearch: projViewResearchVal,
    showCoverTitle: projCoverTitleVal,
    coverTitle: projCoverTitleVal,
    showShowcaseHeader: projShowcaseHeaderVal,
    showcaseHeaderTitle: projShowcaseTitleVal,
    showcaseHeaderSubtitle: projShowcaseSubtitleVal,
    showcaseHeaderTag: projShowcaseTagVal,
    showVerticalSection: projVerticalVal,
    verticalSectionTitle: projVerticalTitleVal,
    verticalSectionSubtitle: projVerticalSubtitleVal,
    verticalSectionTag: projVerticalTagVal,
    image: (showcaseImages.length > 0 && !showcaseImages[0].isVideo && (fallbackMainImg === 'assets/images/work_luma.jpg' || !fallbackMainImg))
      ? showcaseImages[0].src
      : fallbackMainImg,
    mobileImage: mobileImgVal,
    mobileThumbnail: mobileImgVal,
    video: (showcaseImages.length > 0 && showcaseImages[0].isVideo && !videoDemoVal)
      ? showcaseImages[0].src
      : videoDemoVal,
    videoUrl: (showcaseImages.length > 0 && showcaseImages[0].isVideo && !videoDemoVal)
      ? showcaseImages[0].src
      : videoDemoVal,
    desc1: desc1Val,
    desc2: desc2Val,
    projectBrief: briefVal,
    brief: briefVal,
    shortDesc: finalShortDesc,
    description: finalDesc,
    timeline: document.getElementById('fieldProjTimeline').value.trim(),
    role: document.getElementById('fieldProjRole').value.trim(),
    tools: document.getElementById('fieldProjTools').value.trim(),
    deliverable: document.getElementById('fieldProjDeliverables').value.trim(),
    features: projectFeatures,
    showcaseImages: showcaseImages.length > 0 ? showcaseImages : (
      projMediaTypeVal === 'video' && videoDemoVal
        ? [{ src: videoDemoVal, alt: `${shortTitle} Overview Video`, isVideo: true, mediaType: 'video' }]
        : [{ src: fallbackMainImg, alt: `${shortTitle} Overview 1`, isVideo: false, mediaType: 'image' }]
    ),
    processImages: processImages,
    verticalImages: verticalImages
  };

  if (window.PortfolioData && typeof window.PortfolioData.generateDefaultSections === 'function') {
    projectRecord.sections = window.PortfolioData.generateDefaultSections(projectRecord);
  }

  if (editId) {
    const idx = data.projects.findIndex(p => 
      p.id === editId || 
      p.slug === editId || 
      (Array.isArray(p.alias) && p.alias.includes(editId))
    );
    if (idx !== -1) {
      const existing = data.projects[idx];
      const existingContent = existing.content || {};
      data.projects[idx] = {
        ...existing,
        ...projectRecord,
        desc1: desc1Val,
        desc2: desc2Val,
        projectBrief: briefVal,
        brief: briefVal,
        features: projectFeatures,
        content: {
          ...existingContent,
          desc1: desc1Val,
          desc2: desc2Val,
          brief: briefVal || existingContent.brief,
          features: projectFeatures,
          timeline: projectRecord.timeline,
          role: projectRecord.role,
          tools: projectRecord.tools,
          deliverable: projectRecord.deliverable,
          showcaseImages: projectRecord.showcaseImages,
          processImages: projectRecord.processImages,
          verticalImages: projectRecord.verticalImages
        },
        id: data.projects[idx].id
      };
    } else {
      projectRecord.content = {
        desc1: desc1Val,
        desc2: desc2Val,
        brief: briefVal,
        features: projectFeatures,
        timeline: projectRecord.timeline,
        role: projectRecord.role,
        tools: projectRecord.tools,
        deliverable: projectRecord.deliverable,
        showcaseImages: projectRecord.showcaseImages,
        processImages: projectRecord.processImages,
        verticalImages: projectRecord.verticalImages
      };
      data.projects.push(projectRecord);
    }
  } else {
    projectRecord.content = {
      desc1: desc1Val,
      desc2: desc2Val,
      brief: briefVal,
      features: projectFeatures,
      timeline: projectRecord.timeline,
      role: projectRecord.role,
      tools: projectRecord.tools,
      deliverable: projectRecord.deliverable,
      showcaseImages: projectRecord.showcaseImages,
      processImages: projectRecord.processImages,
      verticalImages: projectRecord.verticalImages
    };
    data.projects.push(projectRecord);
  }

  PortfolioData.save(data);
  syncPreviewIframe();
  document.getElementById('modalProject').classList.remove('active');
  renderProjectsTable();
  updateDashboardStats();
  showToast(`Project "${shortTitle}" saved & published live to website!`, 'success');
}

window.editProject = function(id) {
  const data = PortfolioData.get();
  const proj = (data.projects || []).find(p => p.id === id);
  if (proj) openProjectModal(proj);
};

window.deleteProject = function(id) {
  if (!confirm(`Are you sure you want to delete project "${id}"? This action cannot be undone.`)) return;
  const data = PortfolioData.get();
  data.projects = (data.projects || []).filter(p => p.id !== id);
  PortfolioData.save(data);
  renderProjectsTable();
  updateDashboardStats();
  showToast(`Project "${id}" deleted.`, 'success');
};

window.moveProject = function(id, dir) {
  const data = PortfolioData.get();
  const list = data.projects;
  if (!list || list.length < 2) return;

  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return;

  const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= list.length) return;

  const temp = list[idx];
  list[idx] = list[targetIdx];
  list[targetIdx] = temp;

  PortfolioData.save(data);
  renderProjectsTable();
  showToast('Project display order updated!', 'success');
};

/* ==========================================================================
   5. PROTOTYPING WORKSHOP (SECTION 3) MANAGER
   ========================================================================== */
function initPrototypingManager() {
  const btnSaveHeader = document.getElementById('btnSaveProtoHeader');
  const btnOpenModal = document.getElementById('btnOpenNewProtoModal');
  const btnSaveProto = document.getElementById('btnSaveProtoRecord');
  const srcInput = document.getElementById('fieldProtoSrc');
  const preview = document.getElementById('fieldProtoPreview');
  const fileUpload = document.getElementById('fileProtoUpload');

  // Section Header Save
  if (btnSaveHeader) {
    btnSaveHeader.addEventListener('click', () => {
      const data = PortfolioData.get();
      data.sections = data.sections || {};
      data.sections.protoTitle = document.getElementById('protoSectionTitle')?.value.trim() || 'PROTOTYPING';
      data.sections.protoSubtitle = document.getElementById('protoSectionSubtitle')?.value.trim() || "Things I've drafted, 3D printed, CNC machined, and iterated with hands-on curiosity.";
      data.sections.protoTagline = document.getElementById('protoSectionTagline')?.value.trim() || 'Design. Make. Explore.';
      data.protoTitle = data.sections.protoTitle;
      data.protoSubtitle = data.sections.protoSubtitle;
      data.protoTagline = data.sections.protoTagline;
      data.customization = data.customization || {};
      data.customization.sections = data.customization.sections || {};
      data.customization.sections.protoTitle = data.sections.protoTitle;
      data.customization.sections.protoSubtitle = data.sections.protoSubtitle;
      data.customization.sections.protoTagline = data.sections.protoTagline;
      PortfolioData.save(data);
      syncPreviewIframe();
      showToast('Prototyping section header saved & published live to website!', 'success');
    });
  }

  if (srcInput && preview) {
    srcInput.addEventListener('input', () => {
      checkLocalPathWarning(srcInput);
      preview.src = resolveMediaAdmin(srcInput.value) || 'assets/images/proto_drafting.jpg';
    });
  }

  if (fileUpload && srcInput && preview) {
    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      handleAdminFileUpload(file, srcInput, preview, 'proto_img', false);
    });
  }

  // Video Demo Controls for Prototyping Step
  const protoVidInput = document.getElementById('fieldProtoVideo');
  const protoVidPreview = document.getElementById('fieldProtoVideoPreview');
  const protoVidUpload = document.getElementById('fileProtoVideoUpload');

  window.updateProtoMediaTypeUI = function(type) {
    const radioImg = document.getElementById('protoMediaTypeImage');
    const radioVid = document.getElementById('protoMediaTypeVideo');
    const labelImg = document.getElementById('labelProtoMediaTypeImage');
    const labelVid = document.getElementById('labelProtoMediaTypeVideo');
    const imgGroup = document.getElementById('protoImageGroup');
    const vidGroup = document.getElementById('protoVideoGroup');
    const imgInp = document.getElementById('fieldProtoSrc');
    const vidInp = document.getElementById('fieldProtoVideo');
    const imgUpload = document.getElementById('fileProtoUpload');
    const vidUpload = document.getElementById('fileProtoVideoUpload');
    const imgUploadBtn = document.getElementById('fileProtoUploadBtn');
    const vidUploadBtn = document.getElementById('fileProtoVideoUploadBtn');
    const imgBadge = document.getElementById('protoImgBadge');
    const vidBadge = document.getElementById('protoVidBadge');

    if (type === 'video') {
      if (radioVid) radioVid.checked = true;
      labelVid?.classList.add('active');
      labelImg?.classList.remove('active');

      // Video Active
      if (vidInp) vidInp.disabled = false;
      if (vidUpload) vidUpload.disabled = false;
      vidUploadBtn?.classList.remove('disabled');
      vidGroup?.classList.remove('is-disabled');
      vidGroup?.classList.add('is-active');
      if (vidBadge) {
        vidBadge.className = 'media-status-badge active';
        vidBadge.textContent = '● Active';
      }

      // Photo Disabled
      if (imgInp) imgInp.disabled = true;
      if (imgUpload) imgUpload.disabled = true;
      imgUploadBtn?.classList.add('disabled');
      imgGroup?.classList.add('is-disabled');
      imgGroup?.classList.remove('is-active');
      if (imgBadge) {
        imgBadge.className = 'media-status-badge disabled';
        imgBadge.textContent = '⊘ Disabled';
      }
    } else {
      if (radioImg) radioImg.checked = true;
      labelImg?.classList.add('active');
      labelVid?.classList.remove('active');

      // Photo Active
      if (imgInp) imgInp.disabled = false;
      if (imgUpload) imgUpload.disabled = false;
      imgUploadBtn?.classList.remove('disabled');
      imgGroup?.classList.remove('is-disabled');
      imgGroup?.classList.add('is-active');
      if (imgBadge) {
        imgBadge.className = 'media-status-badge active';
        imgBadge.textContent = '● Active';
      }

      // Video Disabled
      if (vidInp) vidInp.disabled = true;
      if (vidUpload) vidUpload.disabled = true;
      vidUploadBtn?.classList.add('disabled');
      vidGroup?.classList.add('is-disabled');
      vidGroup?.classList.remove('is-active');
      if (vidBadge) {
        vidBadge.className = 'media-status-badge disabled';
        vidBadge.textContent = '⊘ Disabled';
      }
    }
  };

  const radioProtoImg = document.getElementById('protoMediaTypeImage');
  const radioProtoVid = document.getElementById('protoMediaTypeVideo');
  if (radioProtoImg) radioProtoImg.addEventListener('change', () => window.updateProtoMediaTypeUI('image'));
  if (radioProtoVid) radioProtoVid.addEventListener('change', () => window.updateProtoMediaTypeUI('video'));

  const protoImgGroupEl = document.getElementById('protoImageGroup');
  const protoVidGroupEl = document.getElementById('protoVideoGroup');
  if (protoImgGroupEl) {
    protoImgGroupEl.addEventListener('click', () => {
      if (protoImgGroupEl.classList.contains('is-disabled')) {
        window.updateProtoMediaTypeUI('image');
        document.getElementById('fieldProtoSrc')?.focus();
      }
    });
  }
  if (protoVidGroupEl) {
    protoVidGroupEl.addEventListener('click', () => {
      if (protoVidGroupEl.classList.contains('is-disabled')) {
        window.updateProtoMediaTypeUI('video');
        document.getElementById('fieldProtoVideo')?.focus();
      }
    });
  }

  if (protoVidInput && protoVidPreview) {
    protoVidInput.addEventListener('input', () => {
      checkLocalPathWarning(protoVidInput);
      const res = resolveMediaAdmin(protoVidInput.value.trim());
      protoVidPreview.src = res;
      if (res) {
        protoVidPreview.muted = true;
        protoVidPreview.play().catch(() => {});
      }
    });
  }

  if (protoVidUpload && protoVidInput && protoVidPreview) {
    protoVidUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      handleAdminFileUpload(file, protoVidInput, protoVidPreview, 'proto_vid', true);
    });
  }

  if (btnOpenModal) btnOpenModal.addEventListener('click', () => openProtoModal());
  if (btnSaveProto) btnSaveProto.addEventListener('click', saveProtoRecord);
}

function loadPrototypingData() {
  const data = PortfolioData.get();
  const sec = data.sections || {};
  const titleEl = document.getElementById('protoSectionTitle');
  const subEl = document.getElementById('protoSectionSubtitle');
  const tagEl = document.getElementById('protoSectionTagline');

  if (titleEl) titleEl.value = sec.protoTitle || data.protoTitle || 'PROTOTYPING';
  if (subEl) subEl.value = sec.protoSubtitle || data.protoSubtitle || "Things I've drafted, 3D printed, CNC machined, and iterated with hands-on curiosity.";
  if (tagEl) tagEl.value = sec.protoTagline || data.protoTagline || 'Design. Make. Explore.';
}

function renderPrototypingGrid() {
  const grid = document.getElementById('protoGrid');
  if (!grid) return;

  const data = PortfolioData.get();
  const protos = data.prototypes || [];

  grid.innerHTML = '';
  protos.forEach((p, index) => {
    const isFirst = (index === 0);
    const isLast = (index === protos.length - 1);
    const isVideo = Boolean((p.mediaType === 'video' && p.video) || (!p.mediaType && p.video && !p.src));
    const resolvedVideo = resolveMediaAdmin(p.video);
    const resolvedImg = resolveMediaAdmin(p.src) || 'assets/images/proto_drafting.jpg';

    const mediaHtml = isVideo
      ? `<video src="${resolvedVideo}" class="proto-admin-thumb" autoplay muted loop playsinline></video>`
      : `<img src="${resolvedImg}" alt="${p.title}" class="proto-admin-thumb" onerror="this.src='assets/images/proto_drafting.jpg'">`;

    const card = document.createElement('div');
    card.className = 'proto-admin-card';
    card.innerHTML = `
      <div class="card-reorder-bar">
        <span>Step #${index + 1}</span>
        <div class="card-reorder-actions">
          <button type="button" class="btn-reorder-sm" onclick="moveProto('${p.id}', 'up')" ${isFirst ? 'disabled' : ''} title="Move Up">▲</button>
          <button type="button" class="btn-reorder-sm" onclick="moveProto('${p.id}', 'down')" ${isLast ? 'disabled' : ''} title="Move Down">▼</button>
        </div>
      </div>
      <div style="position: relative; border-radius: var(--radius-sm); overflow: hidden;">
        ${mediaHtml}
        ${isVideo ? '<span style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.7); color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px;">🎬 Video</span>' : ''}
      </div>
      <div>
        <div style="font-size: 11px; font-weight: 800; color: #E53935; letter-spacing: 0.04em; text-transform: uppercase;">${p.tag}</div>
        <div class="proto-admin-card-title" style="margin-top: 3px;">${p.title}</div>
        <div style="font-size: 11.5px; color: var(--color-text-muted); margin-top: 4px;">
          ${index < 6 ? '⭐ Active (Step 0' + (index + 1) + ' on Website)' : '📌 Extra Step Card'}
        </div>
      </div>
      <div style="display: flex; gap: 8px; margin-top: auto; border-top: 1px solid var(--color-cream-border); padding-top: 10px;">
        <button class="btn-outline-admin" style="padding: 6px 12px; font-size: 12.5px; flex: 1;" onclick="editProto('${p.id}')">Edit ✏️</button>
        <button class="btn-danger" style="padding: 6px 12px; font-size: 12.5px;" onclick="deleteProto('${p.id}')">Delete 🗑️</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openProtoModal(protoToEdit = null) {
  const modal = document.getElementById('modalProto');
  const heading = document.getElementById('modalProtoHeading');
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  if (protoToEdit) {
    heading.textContent = `Edit Prototyping Card: ${protoToEdit.step || protoToEdit.tag}`;
    setVal('editProtoId', protoToEdit.id);
    setVal('fieldProtoTag', protoToEdit.tag);
    setVal('fieldProtoTitle', protoToEdit.title);
    setVal('fieldProtoSrc', protoToEdit.src);
    setVal('fieldProtoVideo', protoToEdit.video || '');
    setVal('fieldProtoTilt', protoToEdit.tilt || 'tilt-left');
    if (document.getElementById('fieldProtoIsExtra')) {
      document.getElementById('fieldProtoIsExtra').checked = Boolean(protoToEdit.isExtra);
    }
    const prev = document.getElementById('fieldProtoPreview');
    if (prev) prev.src = resolveMediaAdmin(protoToEdit.src);
    const vidPrev = document.getElementById('fieldProtoVideoPreview');
    if (vidPrev) {
      const resV = resolveMediaAdmin(protoToEdit.video);
      vidPrev.src = resV || '';
      if (resV) {
        vidPrev.muted = true;
        vidPrev.play().catch(() => {});
      }
    }

    const mType = protoToEdit.mediaType || (protoToEdit.video && !protoToEdit.src ? 'video' : 'image');
    if (window.updateProtoMediaTypeUI) window.updateProtoMediaTypeUI(mType);
  } else {
    heading.textContent = 'Add Prototyping Card';
    const data = PortfolioData.get();
    const nextNum = (data.prototypes || []).length + 1;
    const padNum = String(nextNum).padStart(2, '0');
    setVal('editProtoId', '');
    setVal('fieldProtoTag', `STEP ${padNum} • RAPID PROTOTYPING`);
    setVal('fieldProtoTitle', 'New fabrication & assembly test');
    setVal('fieldProtoSrc', 'assets/images/proto_drafting.jpg');
    setVal('fieldProtoVideo', '');
    setVal('fieldProtoTilt', 'tilt-left');
    if (document.getElementById('fieldProtoIsExtra')) {
      document.getElementById('fieldProtoIsExtra').checked = (nextNum > 6);
    }
    const prev = document.getElementById('fieldProtoPreview');
    if (prev) prev.src = 'assets/images/proto_drafting.jpg';
    const vidPrev = document.getElementById('fieldProtoVideoPreview');
    if (vidPrev) vidPrev.src = '';

    if (window.updateProtoMediaTypeUI) window.updateProtoMediaTypeUI('image');
  }

  modal.classList.add('active');
}

function saveProtoRecord() {
  const editId = document.getElementById('editProtoId').value.trim();
  const tag = document.getElementById('fieldProtoTag').value.trim();
  const title = document.getElementById('fieldProtoTitle').value.trim();
  const src = document.getElementById('fieldProtoSrc').value.trim() || 'assets/images/proto_drafting.jpg';
  const video = document.getElementById('fieldProtoVideo')?.value.trim() || '';
  const tilt = document.getElementById('fieldProtoTilt')?.value || 'tilt-left';
  const isExtra = document.getElementById('fieldProtoIsExtra') ? document.getElementById('fieldProtoIsExtra').checked : false;
  const mediaTypeVal = document.querySelector('input[name="protoMediaType"]:checked')?.value || (video && !src ? 'video' : 'image');

  const data = PortfolioData.get();
  data.prototypes = data.prototypes || [];

  const id = editId || ('proto_' + Date.now());
  const stepMatch = tag.match(/STEP\s*\d+/i);
  const step = stepMatch ? stepMatch[0].toUpperCase() : `STEP ${data.prototypes.length + 1}`;

  const protoObj = { id, step, tag, title, mediaType: mediaTypeVal, src, video, tilt, isExtra };

  if (editId) {
    const idx = data.prototypes.findIndex(p => p.id === editId);
    if (idx !== -1) data.prototypes[idx] = protoObj;
  } else {
    data.prototypes.push(protoObj);
  }

  PortfolioData.save(data);
  syncPreviewIframe();
  document.getElementById('modalProto').classList.remove('active');
  renderPrototypingGrid();
  updateDashboardStats();
  showToast('Prototyping step saved & published live to website!', 'success');
}

window.editProto = function(id) {
  const data = PortfolioData.get();
  const proto = (data.prototypes || []).find(p => p.id === id);
  if (proto) openProtoModal(proto);
};

window.deleteProto = function(id) {
  if (!confirm('Are you sure you want to delete this prototyping step?')) return;
  const data = PortfolioData.get();
  data.prototypes = (data.prototypes || []).filter(p => p.id !== id);
  PortfolioData.save(data);
  renderPrototypingGrid();
  updateDashboardStats();
  showToast('Step deleted.', 'success');
};

window.moveProto = function(id, dir) {
  const data = PortfolioData.get();
  const list = data.prototypes;
  if (!list || list.length < 2) return;

  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return;

  const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= list.length) return;

  const temp = list[idx];
  list[idx] = list[targetIdx];
  list[targetIdx] = temp;

  PortfolioData.save(data);
  renderPrototypingGrid();
  showToast('Step order updated!', 'success');
};

/* ==========================================================================
   6. FIELD NOTES & FRAMES (SECTION 4) GALLERY MANAGER
   ========================================================================== */
function initGalleryManager() {
  const btnSaveHeader = document.getElementById('btnSaveGalleryHeader');
  const btnOpenModal = document.getElementById('btnOpenNewGalleryModal');
  const btnSaveGallery = document.getElementById('btnSaveGalleryRecord');
  const srcInput = document.getElementById('fieldGallerySrc');
  const preview = document.getElementById('fieldGalleryPreview');
  const fileUpload = document.getElementById('fileGalleryUpload');

  // Section Header Save
  if (btnSaveHeader) {
    btnSaveHeader.addEventListener('click', () => {
      const data = PortfolioData.get();
      data.sections = data.sections || {};
      data.sections.galleryTitle = document.getElementById('gallerySectionTitle')?.value.trim() || 'FIELD NOTES & FRAMES';
      data.sections.gallerySubtitle = document.getElementById('gallerySectionSubtitle')?.value.trim() || 'Visual journal of travels, prototypes, and material inspirations.';
      data.sections.galleryTagline = document.getElementById('gallerySectionTagline')?.value.trim() || 'Design. Make. Explore.';
      data.galleryTitle = data.sections.galleryTitle;
      data.gallerySubtitle = data.sections.gallerySubtitle;
      data.galleryTagline = data.sections.galleryTagline;
      data.customization = data.customization || {};
      data.customization.sections = data.customization.sections || {};
      data.customization.sections.galleryTitle = data.sections.galleryTitle;
      data.customization.sections.gallerySubtitle = data.sections.gallerySubtitle;
      data.customization.sections.galleryTagline = data.sections.galleryTagline;
      PortfolioData.save(data);
      syncPreviewIframe();
      showToast('Gallery section header saved & published live to website!', 'success');
    });
  }

  if (srcInput && preview) {
    srcInput.addEventListener('input', () => {
      checkLocalPathWarning(srcInput);
      preview.src = resolveMediaAdmin(srcInput.value.trim()) || 'assets/images/gallery_forest.jpg';
    });
  }

  if (fileUpload && srcInput && preview) {
    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      handleAdminFileUpload(file, srcInput, preview, 'gallery_img', false);
    });
  }

  // Media Type Switching & Video Controls
  const radioImage = document.getElementById('galleryTypeImage');
  const radioVideo = document.getElementById('galleryTypeVideo');
  const labelImage = document.getElementById('labelGalleryTypeImage');
  const labelVideo = document.getElementById('labelGalleryTypeVideo');
  const imageGroup = document.getElementById('galleryImageGroup');
  const videoGroup = document.getElementById('galleryVideoGroup');
  const vidInput = document.getElementById('fieldGalleryVideo');
  const vidPreview = document.getElementById('fieldGalleryVideoPreview');
  const vidUpload = document.getElementById('fileGalleryVideoUpload');

  window.updateGalleryMediaTypeUI = function(type) {
    const imgInp = document.getElementById('fieldGallerySrc');
    const vidInp = document.getElementById('fieldGalleryVideo');
    const imgUpload = document.getElementById('fileGalleryUpload');
    const vidUpload = document.getElementById('fileGalleryVideoUpload');
    const imgUploadBtn = document.getElementById('fileGalleryUploadBtn');
    const vidUploadBtn = document.getElementById('fileGalleryVideoUploadBtn');
    const imgBadge = document.getElementById('galleryImgBadge');
    const vidBadge = document.getElementById('galleryVidBadge');

    if (type === 'video') {
      if (radioVideo) radioVideo.checked = true;
      labelVideo?.classList.add('active');
      labelImage?.classList.remove('active');

      // Video Active
      if (vidInp) vidInp.disabled = false;
      if (vidUpload) vidUpload.disabled = false;
      vidUploadBtn?.classList.remove('disabled');
      videoGroup?.classList.remove('is-disabled');
      videoGroup?.classList.add('is-active');
      if (vidBadge) {
        vidBadge.className = 'media-status-badge active';
        vidBadge.textContent = '● Active';
      }

      // Photo Disabled
      if (imgInp) imgInp.disabled = true;
      if (imgUpload) imgUpload.disabled = true;
      imgUploadBtn?.classList.add('disabled');
      imageGroup?.classList.add('is-disabled');
      imageGroup?.classList.remove('is-active');
      if (imgBadge) {
        imgBadge.className = 'media-status-badge disabled';
        imgBadge.textContent = '⊘ Disabled';
      }
    } else {
      if (radioImage) radioImage.checked = true;
      labelImage?.classList.add('active');
      labelVideo?.classList.remove('active');

      // Photo Active
      if (imgInp) imgInp.disabled = false;
      if (imgUpload) imgUpload.disabled = false;
      imgUploadBtn?.classList.remove('disabled');
      imageGroup?.classList.remove('is-disabled');
      imageGroup?.classList.add('is-active');
      if (imgBadge) {
        imgBadge.className = 'media-status-badge active';
        imgBadge.textContent = '● Active';
      }

      // Video Disabled
      if (vidInp) vidInp.disabled = true;
      if (vidUpload) vidUpload.disabled = true;
      vidUploadBtn?.classList.add('disabled');
      videoGroup?.classList.add('is-disabled');
      videoGroup?.classList.remove('is-active');
      if (vidBadge) {
        vidBadge.className = 'media-status-badge disabled';
        vidBadge.textContent = '⊘ Disabled';
      }
    }
  };

  if (radioImage) radioImage.addEventListener('change', () => window.updateGalleryMediaTypeUI('image'));
  if (radioVideo) radioVideo.addEventListener('change', () => window.updateGalleryMediaTypeUI('video'));

  if (imageGroup) {
    imageGroup.addEventListener('click', () => {
      if (imageGroup.classList.contains('is-disabled')) {
        window.updateGalleryMediaTypeUI('image');
        document.getElementById('fieldGallerySrc')?.focus();
      }
    });
  }
  if (videoGroup) {
    videoGroup.addEventListener('click', () => {
      if (videoGroup.classList.contains('is-disabled')) {
        window.updateGalleryMediaTypeUI('video');
        document.getElementById('fieldGalleryVideo')?.focus();
      }
    });
  }

  if (vidInput && vidPreview) {
    vidInput.addEventListener('input', () => {
      checkLocalPathWarning(vidInput);
      vidPreview.src = resolveMediaAdmin(vidInput.value.trim());
    });
  }

  if (vidUpload && vidInput && vidPreview) {
    vidUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      handleAdminFileUpload(file, vidInput, vidPreview, 'gallery_vid', true);
    });
  }

  if (btnOpenModal) btnOpenModal.addEventListener('click', () => openGalleryModal());
  const btnOpenModalTop = document.getElementById('btnOpenNewGalleryModalTop');
  if (btnOpenModalTop) btnOpenModalTop.addEventListener('click', () => openGalleryModal());
  if (btnSaveGallery) btnSaveGallery.addEventListener('click', saveGalleryRecord);

  // Gallery Bento Column Filter
  const switcherContainer = document.getElementById('galleryColFilter') || document.getElementById('galleryPageSwitcher');
  if (switcherContainer) {
    switcherContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-gallery-col-switch, .btn-gallery-page-switch');
      if (!btn) return;
      switcherContainer.querySelectorAll('.btn-gallery-col-switch, .btn-gallery-page-switch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.currentGalleryColFilter = btn.dataset.colFilter || btn.dataset.pageFilter || 'all';
      const colDivs = document.querySelectorAll('.gallery-admin-col-column');
      colDivs.forEach(colEl => {
        const colNum = colEl.dataset.col;
        if (window.currentGalleryColFilter === 'all' || window.currentGalleryColFilter === colNum) {
          colEl.style.display = '';
        } else {
          colEl.style.display = 'none';
        }
      });
    });
  }
}

function loadGalleryData() {
  const data = PortfolioData.get();
  const sec = data.sections || {};
  const titleEl = document.getElementById('gallerySectionTitle');
  const subEl = document.getElementById('gallerySectionSubtitle');
  const taglineEl = document.getElementById('gallerySectionTagline');

  if (titleEl) titleEl.value = sec.galleryTitle || data.galleryTitle || 'FIELD NOTES & FRAMES';
  if (subEl) subEl.value = sec.gallerySubtitle || data.gallerySubtitle || 'Visual journal of travels, prototypes, and material inspirations.';
  if (taglineEl) taglineEl.value = sec.galleryTagline || data.galleryTagline || 'Design. Make. Explore.';
}

/* ==========================================================================
   GALLERY 3-COLUMN BENTO GRID MATRIX & HELPER FUNCTIONS
   ========================================================================== */
window.currentGalleryColFilter = 'all';

function getGalleryGridMatrix() {
  const data = PortfolioData.get();
  const items = data.gallery || [];

  const matrix = {
    1: [], // Column 1 (Left)
    2: [], // Column 2 (Center)
    3: []  // Column 3 (Right)
  };

  items.forEach((g, idx) => {
    let colNum = parseInt(g.col, 10);
    if (!colNum || colNum < 1 || colNum > 3) {
      colNum = (idx % 3) + 1;
    }
    matrix[colNum].push(g);
  });

  return matrix;
}

function rebuildCanonicalGallery(matrix) {
  const result = [];
  [1, 2, 3].forEach(c => {
    (matrix[c] || []).forEach((item, rIdx) => {
      item.col = c;
      item.row = rIdx + 1;
      item.page = 1;
      item.isExtra = false;

      // Determine default alternating aspect ratio if needed:
      // Col 1 & 3: Row 1 tall, Row 2 square, Row 3 tall, Row 4 square
      // Col 2: Row 1 square, Row 2 tall, Row 3 square, Row 4 tall
      if (!item.type || item.type === 'card-short') {
        const isOddCol = (c === 1 || c === 3);
        const isEvenRow = (rIdx % 2 === 1);
        item.type = (isOddCol ? (isEvenRow ? 'card-square' : 'card-tall') : (isEvenRow ? 'card-tall' : 'card-square'));
      }
      result.push(item);
    });
  });
  return result;
}

function renderGalleryGrid() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const data = PortfolioData.get();
  const items = data.gallery || [];

  grid.innerHTML = '';
  if (items.length === 0) {
    grid.innerHTML = '<p style="color: var(--color-text-muted); padding: 24px; text-align: center;">No frames in gallery. Click "+ Add Frame" to begin.</p>';
    return;
  }

  const matrix = getGalleryGridMatrix();

  const colMeta = {
    1: { name: 'Column 1 (Left)', pattern: 'Tall • Square • Tall • Square' },
    2: { name: 'Column 2 (Center)', pattern: 'Square • Tall • Square • Tall' },
    3: { name: 'Column 3 (Right)', pattern: 'Tall • Square • Tall • Square' }
  };

  const threeColGrid = document.createElement('div');
  threeColGrid.className = 'gallery-admin-3col-grid';

  for (let col = 1; col <= 3; col++) {
    const colCards = matrix[col] || [];
    const colDiv = document.createElement('div');
    colDiv.className = 'gallery-admin-col-column';
    colDiv.dataset.col = String(col);

    if (window.currentGalleryColFilter && window.currentGalleryColFilter !== 'all' && window.currentGalleryColFilter !== String(col)) {
      colDiv.style.display = 'none';
    }

    const colHeader = document.createElement('div');
    colHeader.className = 'gallery-admin-col-header';
    colHeader.innerHTML = `
      <div>
        <span class="gallery-admin-col-title">${colMeta[col].name}</span>
        <div class="gallery-admin-col-sub" style="font-size: 10.5px; color: var(--color-text-muted); margin-top: 2px;">${colMeta[col].pattern}</div>
      </div>
      <button type="button" class="btn-outline-admin btn-xs" onclick="openGalleryModal(null, { col: ${col}, row: ${colCards.length + 1} })" style="padding: 4px 10px; font-size: 11px; font-weight: 600;">
        + Add
      </button>
    `;
    colDiv.appendChild(colHeader);

    const slotsCont = document.createElement('div');
    slotsCont.className = 'gallery-admin-slots-container';

    const maxRows = Math.max(4, colCards.length);
    for (let r = 0; r < maxRows; r++) {
      const cardItem = colCards[r];
      const rowNum = r + 1;

      if (cardItem) {
        const isVideo = Boolean((cardItem.mediaType === 'video') || (!cardItem.mediaType && cardItem.video && !cardItem.src) || (cardItem.video && !cardItem.src) || (cardItem.src && /\.(mp4|webm|mov|ogg)($|\?)/i.test(cardItem.src)));
        const resolvedVideo = resolveMediaAdmin(cardItem.video || cardItem.src);
        const resolvedImg = resolveMediaAdmin(cardItem.src || 'assets/images/gallery_forest.jpg');
        const isTall = (cardItem.type === 'card-tall');

        const thumbMedia = isVideo
          ? `<video src="${resolvedVideo}" class="gallery-admin-slot-thumb" muted autoplay loop playsinline></video>`
          : `<img src="${resolvedImg}" alt="${cardItem.caption || ''}" class="gallery-admin-slot-thumb" onerror="this.src='assets/images/gallery_forest.jpg'">`;

        let overlayLabel = '';
        if (cardItem.scriptOverlay) {
          overlayLabel = `<span class="gallery-admin-slot-overlay-badge" title="Script Overlay">✍️ ${cardItem.scriptOverlay.replace(/\n/g, ' ')}</span>`;
        } else if (cardItem.badge) {
          overlayLabel = `<span class="gallery-admin-slot-overlay-badge" title="Badge Tag">🏷️ ${cardItem.badge}</span>`;
        }

        const rowTags = {
          1: '🔝 ROW 1 • TOP',
          2: 'ROW 2',
          3: 'ROW 3',
          4: '🔻 ROW 4 • BOTTOM'
        };
        const rowLabel = rowTags[rowNum] || `ROW ${rowNum} • EXTRA`;

        const isFirstInCol = (r === 0);
        const isLastInCol = (r === colCards.length - 1);

        const slotDiv = document.createElement('div');
        slotDiv.className = 'gallery-admin-row-slot';
        slotDiv.innerHTML = `
          <div class="gallery-admin-row-slot-header">
            <span class="row-slot-tag">${rowLabel}</span>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span class="row-slot-type-badge ${isTall ? 'type-tall' : 'type-square'}">${isTall ? 'Tall (9:16)' : 'Square (1:1)'}${isVideo ? ' • 🎬' : ''}</span>
              <button type="button" class="btn-reorder-sm" onclick="moveGalleryItem('${cardItem.id}', 'up')" ${isFirstInCol ? 'disabled' : ''} title="Move Up">▲</button>
              <button type="button" class="btn-reorder-sm" onclick="moveGalleryItem('${cardItem.id}', 'down')" ${isLastInCol ? 'disabled' : ''} title="Move Down">▼</button>
            </div>
          </div>
          <div class="gallery-admin-slot-thumb-wrap ${isTall ? 'is-tall' : 'is-square'}">
            ${thumbMedia}
            ${overlayLabel}
          </div>
          <div class="gallery-admin-slot-caption" title="${cardItem.caption || ''}">${cardItem.caption || 'Untitled Frame'}</div>
          <div class="gallery-admin-slot-actions">
            <button type="button" class="btn-outline-admin btn-xs" style="flex: 1; padding: 5px 8px; font-size: 11.5px;" onclick="editGallery('${cardItem.id}')">Edit ✏️</button>
            <button type="button" class="btn-danger btn-xs" style="padding: 5px 8px; font-size: 11.5px;" onclick="deleteGallery('${cardItem.id}')" title="Delete Frame">🗑️</button>
          </div>
        `;
        slotsCont.appendChild(slotDiv);
      } else {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'gallery-admin-empty-slot';
        emptyDiv.onclick = () => openGalleryModal(null, { col: col, row: rowNum });
        emptyDiv.innerHTML = `
          <span class="empty-slot-icon">➕</span>
          <span class="empty-slot-text">Empty Row ${rowNum} Frame</span>
          <span class="empty-slot-sub">Click to add to Col ${col}</span>
        `;
        slotsCont.appendChild(emptyDiv);
      }
    }

    colDiv.appendChild(slotsCont);
    threeColGrid.appendChild(colDiv);
  }

  grid.appendChild(threeColGrid);
}

window.moveGalleryItem = function(id, dir) {
  const data = PortfolioData.get();
  const matrix = getGalleryGridMatrix();

  let targetCol = null;
  let targetIdx = -1;

  for (let c = 1; c <= 3; c++) {
    const list = matrix[c] || [];
    const idx = list.findIndex(x => x.id === id);
    if (idx !== -1) {
      targetCol = c;
      targetIdx = idx;
      break;
    }
  }

  if (targetCol === null || targetIdx === -1) return;
  const colList = matrix[targetCol];
  const newIdx = dir === 'up' ? targetIdx - 1 : targetIdx + 1;
  if (newIdx < 0 || newIdx >= colList.length) return;

  const temp = colList[targetIdx];
  colList[targetIdx] = colList[newIdx];
  colList[newIdx] = temp;

  data.gallery = rebuildCanonicalGallery(matrix);
  PortfolioData.save(data);
  syncPreviewIframe();
  renderGalleryGrid();
  showToast(`Moved frame in Column ${targetCol}!`, 'success');
};

window.swapGalleryRows = function(colNum) {
  const col = parseInt(colNum, 10) || 1;
  const data = PortfolioData.get();
  const matrix = getGalleryGridMatrix();
  const colCards = matrix[col] || [];

  if (colCards.length < 2) {
    showToast(`Need at least 2 frames in Column ${col} to swap.`, 'warning');
    return;
  }

  const temp = colCards[0];
  colCards[0] = colCards[1];
  colCards[1] = temp;

  data.gallery = rebuildCanonicalGallery(matrix);
  PortfolioData.save(data);
  syncPreviewIframe();
  renderGalleryGrid();
  showToast(`Swapped frames in Column ${col}!`, 'success');
};

function openGalleryModal(itemToEdit = null, defaults = {}) {
  const modal = document.getElementById('modalGallery');
  const heading = document.getElementById('modalGalleryHeading');
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val !== undefined ? val : ''; };
  const vidPreview = document.getElementById('fieldGalleryVideoPreview');

  if (itemToEdit) {
    heading.textContent = 'Edit Gallery Frame';
    setVal('editGalleryId', itemToEdit.id);
    setVal('fieldGallerySrc', itemToEdit.src);
    setVal('fieldGalleryVideo', itemToEdit.video || '');
    setVal('fieldGalleryCaption', itemToEdit.caption);
    setVal('fieldGalleryType', itemToEdit.type || 'card-tall');
    setVal('fieldGalleryScript', itemToEdit.scriptOverlay || '');
    setVal('fieldGalleryBadge', itemToEdit.badge || '');

    const colVal = String(itemToEdit.col || 1);
    const rowVal = String(itemToEdit.row || 1);

    setVal('fieldGalleryCol', colVal);
    setVal('fieldGalleryRow', rowVal);
    setVal('fieldGalleryPage', '1');

    const prev = document.getElementById('fieldGalleryPreview');
    if (prev) prev.src = resolveMediaAdmin(itemToEdit.src || 'assets/images/gallery_forest.jpg');
    if (vidPreview) vidPreview.src = resolveMediaAdmin(itemToEdit.video || '');

    const mediaType = itemToEdit.mediaType || (itemToEdit.video ? 'video' : 'image');
    if (window.updateGalleryMediaTypeUI) window.updateGalleryMediaTypeUI(mediaType);
    checkLocalPathWarning(document.getElementById('fieldGallerySrc'));
    checkLocalPathWarning(document.getElementById('fieldGalleryVideo'));

  } else {
    heading.textContent = 'Add Gallery Frame';
    setVal('editGalleryId', '');
    setVal('fieldGallerySrc', 'assets/images/gallery_forest.jpg');
    setVal('fieldGalleryVideo', '');
    setVal('fieldGalleryCaption', 'New Visual Experiment / Studio Capture');

    const colVal = String(defaults.col || '1');
    const rowVal = String(defaults.row || '1');

    setVal('fieldGalleryCol', colVal);
    setVal('fieldGalleryRow', rowVal);
    setVal('fieldGalleryPage', '1');

    let defaultType = defaults.type;
    if (!defaultType) {
      const colNum = parseInt(colVal, 10);
      const rowNum = parseInt(rowVal, 10);
      const isOddCol = (colNum === 1 || colNum === 3);
      const isOddRow = (rowNum % 2 === 1);
      defaultType = isOddCol ? (isOddRow ? 'card-tall' : 'card-square') : (isOddRow ? 'card-square' : 'card-tall');
    }

    setVal('fieldGalleryType', defaultType);
    setVal('fieldGalleryScript', '');
    setVal('fieldGalleryBadge', '');

    const prev = document.getElementById('fieldGalleryPreview');
    if (prev) prev.src = 'assets/images/gallery_forest.jpg';
    if (vidPreview) vidPreview.src = '';
    if (window.updateGalleryMediaTypeUI) window.updateGalleryMediaTypeUI('image');
    checkLocalPathWarning(document.getElementById('fieldGallerySrc'));
    checkLocalPathWarning(document.getElementById('fieldGalleryVideo'));
  }

  modal.classList.add('active');
}

function saveGalleryRecord() {
  const editId = document.getElementById('editGalleryId').value.trim();
  const src = document.getElementById('fieldGallerySrc').value.trim() || 'assets/images/gallery_forest.jpg';
  const video = document.getElementById('fieldGalleryVideo')?.value.trim() || '';
  const mediaType = document.querySelector('input[name="galleryMediaType"]:checked')?.value || (video ? 'video' : 'image');
  const caption = document.getElementById('fieldGalleryCaption').value.trim();
  const col = parseInt(document.getElementById('fieldGalleryCol')?.value, 10) || 1;
  const row = parseInt(document.getElementById('fieldGalleryRow')?.value, 10) || 1;
  const type = document.getElementById('fieldGalleryType')?.value || 'card-tall';
  const scriptText = document.getElementById('fieldGalleryScript')?.value.trim();
  const badgeText = document.getElementById('fieldGalleryBadge')?.value.trim();

  const finalVideo = (mediaType === 'video') ? (video || (/\.(mp4|webm|mov|ogg)($|\?)/i.test(src) ? src : '')) : '';
  const finalSrc = (mediaType === 'image') ? src : (src || 'assets/images/gallery_forest.jpg');

  const data = PortfolioData.get();
  data.gallery = data.gallery || [];

  const id = editId || ('g_' + Date.now());
  const item = {
    id,
    page: 1,
    col,
    row,
    type,
    mediaType,
    src: finalSrc,
    video: finalVideo,
    caption,
    isExtra: false
  };

  if (scriptText) item.scriptOverlay = scriptText;
  if (badgeText) item.badge = badgeText;

  const matrix = getGalleryGridMatrix();

  for (let c = 1; c <= 3; c++) {
    matrix[c] = (matrix[c] || []).filter(x => x.id !== id);
  }

  const targetColList = matrix[col] || [];
  const insertIdx = Math.max(0, Math.min(row - 1, targetColList.length));
  targetColList.splice(insertIdx, 0, item);
  matrix[col] = targetColList;

  data.gallery = rebuildCanonicalGallery(matrix);
  PortfolioData.save(data);
  syncPreviewIframe();
  document.getElementById('modalGallery').classList.remove('active');
  renderGalleryGrid();
  updateDashboardStats();
  showToast('Gallery frame saved & arranged in 3-column Bento grid!', 'success');
}

window.editGallery = function(id) {
  const data = PortfolioData.get();
  const item = (data.gallery || []).find(g => g.id === id);
  if (item) openGalleryModal(item);
};

window.deleteGallery = function(id) {
  if (!confirm('Are you sure you want to delete this gallery frame?')) return;
  const data = PortfolioData.get();
  data.gallery = (data.gallery || []).filter(g => g.id !== id);
  PortfolioData.save(data);
  syncPreviewIframe();
  renderGalleryGrid();
  updateDashboardStats();
  showToast('Frame deleted.', 'success');
};

window.moveGallery = function(id, dir) {
  window.moveGalleryItem(id, dir);
};

/* ==========================================================================
   7. LET'S CONNECT & FOOTER (SECTION 5) MANAGER
   ========================================================================== */
function initConnectManager() {
  const btnSave = document.getElementById('btnSaveConnect');

  // Media Type Switching & Controls
  const radioImage = document.getElementById('connMediaTypeImage');
  const radioVideo = document.getElementById('connMediaTypeVideo');
  const labelImage = document.getElementById('labelConnMediaTypeImage');
  const labelVideo = document.getElementById('labelConnMediaTypeVideo');
  const imageControls = document.getElementById('connImageControls');
  const videoControls = document.getElementById('connVideoControls');

  const mediaSrcInput = document.getElementById('connMediaSrc');
  const mediaPreview = document.getElementById('connMediaPreview');
  const mediaUpload = document.getElementById('fileConnMediaUpload');

  const videoSrcInput = document.getElementById('connVideoSrc');
  const videoPreview = document.getElementById('connVideoPreview');
  const videoUpload = document.getElementById('fileConnVideoUpload');

  window.updateConnMediaTypeUI = function(type) {
    const imgInp = document.getElementById('connMediaSrc');
    const vidInp = document.getElementById('connVideoSrc');
    const imgUpload = document.getElementById('fileConnMediaUpload');
    const vidUpload = document.getElementById('fileConnVideoUpload');
    const imgUploadBtn = document.getElementById('fileConnMediaUploadBtn');
    const vidUploadBtn = document.getElementById('fileConnVideoUploadBtn');
    const imgBadge = document.getElementById('connImgBadge');
    const vidBadge = document.getElementById('connVidBadge');

    if (type === 'video') {
      if (radioVideo) radioVideo.checked = true;
      labelVideo?.classList.add('active');
      labelImage?.classList.remove('active');

      // Video Active
      if (vidInp) vidInp.disabled = false;
      if (vidUpload) vidUpload.disabled = false;
      vidUploadBtn?.classList.remove('disabled');
      videoControls?.classList.remove('is-disabled');
      videoControls?.classList.add('is-active');
      if (vidBadge) {
        vidBadge.className = 'media-status-badge active';
        vidBadge.textContent = '● Active';
      }

      // Photo Disabled
      if (imgInp) imgInp.disabled = true;
      if (imgUpload) imgUpload.disabled = true;
      imgUploadBtn?.classList.add('disabled');
      imageControls?.classList.add('is-disabled');
      imageControls?.classList.remove('is-active');
      if (imgBadge) {
        imgBadge.className = 'media-status-badge disabled';
        imgBadge.textContent = '⊘ Disabled';
      }
    } else {
      if (radioImage) radioImage.checked = true;
      labelImage?.classList.add('active');
      labelVideo?.classList.remove('active');

      // Photo Active
      if (imgInp) imgInp.disabled = false;
      if (imgUpload) imgUpload.disabled = false;
      imgUploadBtn?.classList.remove('disabled');
      imageControls?.classList.remove('is-disabled');
      imageControls?.classList.add('is-active');
      if (imgBadge) {
        imgBadge.className = 'media-status-badge active';
        imgBadge.textContent = '● Active';
      }

      // Video Disabled
      if (vidInp) vidInp.disabled = true;
      if (vidUpload) vidUpload.disabled = true;
      vidUploadBtn?.classList.add('disabled');
      videoControls?.classList.add('is-disabled');
      videoControls?.classList.remove('is-active');
      if (vidBadge) {
        vidBadge.className = 'media-status-badge disabled';
        vidBadge.textContent = '⊘ Disabled';
      }
    }
  };

  if (radioImage) radioImage.addEventListener('change', () => window.updateConnMediaTypeUI('image'));
  if (radioVideo) radioVideo.addEventListener('change', () => window.updateConnMediaTypeUI('video'));

  if (imageControls) {
    imageControls.addEventListener('click', () => {
      if (imageControls.classList.contains('is-disabled')) {
        window.updateConnMediaTypeUI('image');
        document.getElementById('connMediaSrc')?.focus();
      }
    });
  }
  if (videoControls) {
    videoControls.addEventListener('click', () => {
      if (videoControls.classList.contains('is-disabled')) {
        window.updateConnMediaTypeUI('video');
        document.getElementById('connVideoSrc')?.focus();
      }
    });
  }

  if (mediaSrcInput && mediaPreview) {
    mediaSrcInput.addEventListener('input', () => {
      checkLocalPathWarning(mediaSrcInput);
      mediaPreview.src = resolveMediaAdmin(mediaSrcInput.value.trim()) || 'assets/images/footer_media.jpg';
    });
  }

  if (mediaUpload && mediaSrcInput && mediaPreview) {
    mediaUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      handleAdminFileUpload(file, mediaSrcInput, mediaPreview, 'conn_img', false);
    });
  }

  if (videoSrcInput && videoPreview) {
    videoSrcInput.addEventListener('input', () => {
      checkLocalPathWarning(videoSrcInput);
      videoPreview.src = resolveMediaAdmin(videoSrcInput.value.trim());
    });
  }

  if (videoUpload && videoSrcInput && videoPreview) {
    videoUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      handleAdminFileUpload(file, videoSrcInput, videoPreview, 'conn_vid', true);
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const data = PortfolioData.get();
      const activeMediaType = document.querySelector('input[name="connMediaType"]:checked')?.value || 'image';

      data.connect = {
        ...data.connect,
        title: document.getElementById('connTitle')?.value.trim() || "LET'S BUILD SOMETHING EXTRAORDINARY",
        statusBadge: document.getElementById('connStatusBadge')?.value.trim() || 'STUDIO • OPEN TO WORK',
        mediaType: activeMediaType,
        mediaSrc: document.getElementById('connMediaSrc')?.value.trim() || 'assets/images/footer_media.jpg',
        videoSrc: document.getElementById('connVideoSrc')?.value.trim() || '',
        emailLabel: document.getElementById('connEmailLabel')?.value.trim() || 'Send an Email',
        email: document.getElementById('connEmail')?.value.trim() || 'pawankushwaha1@gmail.com',
        resumeLabel: document.getElementById('connResumeLabel')?.value.trim() || 'Download Resume',
        resumeUrl: document.getElementById('connResumeUrl')?.value.trim() || 'assets/PORTFOLIO.pdf',
        socials: {
          instagram: document.getElementById('connSocialInstagram')?.value.trim() || 'https://instagram.com',
          linkedin: document.getElementById('connSocialLinkedin')?.value.trim() || 'https://linkedin.com',
          behance: document.getElementById('connSocialBehance')?.value.trim() || 'https://behance.net',
          dribbble: document.getElementById('connSocialDribbble')?.value.trim() || 'https://dribbble.com'
        },
        colophon1: document.getElementById('connColophon1')?.value.trim() || 'PAWAN K. KUSHWAHA • INDUSTRIAL DESIGNER',
        colophon2: document.getElementById('connColophon2')?.value.trim() || 'NEW DELHI, INDIA • 2026'
      };

      data.customization = data.customization || {};
      data.customization.sections = data.customization.sections || {};
      data.customization.sections.connectTitle = data.connect.title;
      data.customization.sections.connectSubtitle = data.connect.desc || '';

      PortfolioData.save(data);
      syncPreviewIframe();
      showToast('Connect & Footer saved & published live to website!', 'success');
    });
  }
}

function loadConnectData() {
  const data = PortfolioData.get();
  const c = data.connect || {};
  const s = c.socials || {};

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  setVal('connTitle', c.title || "LET'S BUILD SOMETHING EXTRAORDINARY");
  setVal('connStatusBadge', c.statusBadge || 'STUDIO • OPEN TO WORK');
  setVal('connMediaSrc', c.mediaSrc || 'assets/images/footer_media.jpg');
  setVal('connVideoSrc', c.videoSrc || '');

  if (window.updateConnMediaTypeUI) {
    window.updateConnMediaTypeUI(c.mediaType || 'image');
  }

  const mediaPreview = document.getElementById('connMediaPreview');
  if (mediaPreview && c.mediaSrc) mediaPreview.src = resolveMediaAdmin(c.mediaSrc);

  const videoPreview = document.getElementById('connVideoPreview');
  if (videoPreview) {
    if (c.videoSrc) {
      videoPreview.src = resolveMediaAdmin(c.videoSrc);
    } else {
      videoPreview.removeAttribute('src');
    }
  }

  checkLocalPathWarning(document.getElementById('connMediaSrc'));
  checkLocalPathWarning(document.getElementById('connVideoSrc'));

  setVal('connEmailLabel', c.emailLabel || 'Send an Email');
  setVal('connEmail', c.email || 'pawankushwaha1@gmail.com');
  setVal('connResumeLabel', c.resumeLabel || 'Download Resume');
  setVal('connResumeUrl', c.resumeUrl || 'assets/PORTFOLIO.pdf');

  setVal('connSocialInstagram', s.instagram || 'https://instagram.com');
  setVal('connSocialLinkedin', s.linkedin || 'https://linkedin.com');
  setVal('connSocialBehance', s.behance || 'https://behance.net');
  setVal('connSocialDribbble', s.dribbble || 'https://dribbble.com');

  setVal('connColophon1', c.colophon1 || 'PAWAN K. KUSHWAHA • INDUSTRIAL DESIGNER');
  setVal('connColophon2', c.colophon2 || 'NEW DELHI, INDIA • 2026');
}

/* ==========================================================================
   8. SECURITY & PASSWORD MANAGER (ADVANCED ACCESS CONTROL SUITE)
   ========================================================================== */
function refreshSecurityOverview() {
  if (!window.PortfolioData) return;

  const badgeMasterPassStatus = document.getElementById('badgeMasterPassStatus');
  const valMasterPassStatus = document.getElementById('valMasterPassStatus');
  const subMasterPassDate = document.getElementById('subMasterPassDate');
  const secDefaultPassWarning = document.getElementById('secDefaultPassWarning');
  const badgeAutoLockStatus = document.getElementById('badgeAutoLockStatus');
  const valAutoLockTimeout = document.getElementById('valAutoLockTimeout');
  const selectAutoLockTimeout = document.getElementById('selectAutoLockTimeout');
  const badgeRecoveryStatus = document.getElementById('badgeRecoveryStatus');
  const valRecoveryStatus = document.getElementById('valRecoveryStatus');
  const subRecoveryDate = document.getElementById('subRecoveryDate');
  const recoveryKeyActiveBox = document.getElementById('recoveryKeyActiveBox');
  const displayRecoveryKey = document.getElementById('displayRecoveryKey');
  const auditLogTbody = document.getElementById('auditLogTbody');

  const isCustom = PortfolioData.auth.isCustomPasswordSet();
  if (isCustom) {
    if (valMasterPassStatus) valMasterPassStatus.textContent = 'Custom Password Set';
    if (badgeMasterPassStatus) {
      badgeMasterPassStatus.textContent = 'Secure';
      badgeMasterPassStatus.className = 'sec-stat-badge badge-secure';
    }
    const dt = PortfolioData.auth.getPasswordUpdatedAt();
    if (subMasterPassDate) subMasterPassDate.textContent = dt ? 'Updated: ' + new Date(dt).toLocaleDateString() : 'Custom Active';
    if (secDefaultPassWarning) secDefaultPassWarning.classList.add('hidden');
  } else {
    if (valMasterPassStatus) valMasterPassStatus.textContent = 'Default Password';
    if (badgeMasterPassStatus) {
      badgeMasterPassStatus.textContent = 'Action Needed';
      badgeMasterPassStatus.className = 'sec-stat-badge badge-warning';
    }
    if (subMasterPassDate) subMasterPassDate.textContent = 'pawan@2025';
    if (secDefaultPassWarning) secDefaultPassWarning.classList.remove('hidden');
  }

  // Session Auto-Lock
  const secConfig = PortfolioData.auth.getSecurityConfig();
  if (selectAutoLockTimeout) selectAutoLockTimeout.value = String(secConfig.autoLockMinutes);
  if (valAutoLockTimeout) {
    valAutoLockTimeout.textContent = secConfig.autoLockMinutes === 0 ? 'Disabled' : `${secConfig.autoLockMinutes} Minutes`;
  }
  if (badgeAutoLockStatus) {
    badgeAutoLockStatus.textContent = secConfig.autoLockMinutes === 0 ? 'Off' : `${secConfig.autoLockMinutes}m`;
    badgeAutoLockStatus.className = secConfig.autoLockMinutes === 0 ? 'sec-stat-badge badge-warning' : 'sec-stat-badge badge-info';
  }

  // Emergency Recovery Key
  const hasRecovery = PortfolioData.auth.hasRecoveryKey();
  if (hasRecovery) {
    if (badgeRecoveryStatus) {
      badgeRecoveryStatus.textContent = 'Armed';
      badgeRecoveryStatus.className = 'sec-stat-badge badge-secure';
    }
    if (valRecoveryStatus) valRecoveryStatus.textContent = 'Protected';
    const rdt = PortfolioData.auth.getRecoveryKeyCreatedAt();
    if (subRecoveryDate) subRecoveryDate.textContent = rdt ? 'Created: ' + new Date(rdt).toLocaleDateString() : 'Active';
    if (recoveryKeyActiveBox) recoveryKeyActiveBox.classList.remove('hidden');
    if (displayRecoveryKey && displayRecoveryKey.textContent === 'SEC-••••-••••-••••-••••') {
      displayRecoveryKey.textContent = 'SEC-••••-••••-••••-•••• (Key Stored)';
    }
  } else {
    if (badgeRecoveryStatus) {
      badgeRecoveryStatus.textContent = 'Not Set';
      badgeRecoveryStatus.className = 'sec-stat-badge badge-warning';
    }
    if (valRecoveryStatus) valRecoveryStatus.textContent = 'Standby';
    if (subRecoveryDate) subRecoveryDate.textContent = 'No backup key generated';
    if (recoveryKeyActiveBox) recoveryKeyActiveBox.classList.add('hidden');
  }

  // Render Audit Log
  if (auditLogTbody) {
    const logs = PortfolioData.auth.getAuditLog();
    if (logs.length === 0) {
      auditLogTbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--color-text-muted); padding: 18px;">No security events recorded yet.</td></tr>`;
    } else {
      auditLogTbody.innerHTML = logs.map(ev => {
        let pillClass = 'status-info';
        if (ev.type === 'success') pillClass = 'status-success';
        if (ev.type === 'warning') pillClass = 'status-warning';
        
        const dateStr = new Date(ev.timestamp).toLocaleString();
        const actionStr = escapeHtml(ev.action || 'Unknown Event');
        const typeStr = escapeHtml(ev.type || 'info');
        return `
          <tr>
            <td style="font-family: monospace; font-size: 11.5px; color: var(--color-text-muted);">${dateStr}</td>
            <td><strong>${actionStr}</strong></td>
            <td><span class="audit-status-pill ${pillClass}">${typeStr}</span></td>
          </tr>
        `;
      }).join('');
    }
  }
}

function initSecurityManager() {
  const form = document.getElementById('formChangePassword');
  const curPass = document.getElementById('passCurrent');
  const newPass = document.getElementById('passNew');
  const confirmPass = document.getElementById('passConfirm');
  const passConfirmError = document.getElementById('passConfirmError');
  const pwdStrengthFill = document.getElementById('pwdStrengthFill');
  const pwdStrengthText = document.getElementById('pwdStrengthText');
  const ruleLength = document.getElementById('ruleLength');
  const ruleUpperLower = document.getElementById('ruleUpperLower');
  const ruleNumberSymbol = document.getElementById('ruleNumberSymbol');
  const ruleNotCommon = document.getElementById('ruleNotCommon');

  const btnQuickLockAdmin = document.getElementById('btnQuickLockAdmin');
  const btnSaveSessionSettings = document.getElementById('btnSaveSessionSettings');
  const selectAutoLockTimeout = document.getElementById('selectAutoLockTimeout');
  const btnGenerateRecoveryKey = document.getElementById('btnGenerateRecoveryKey');
  const btnCopyRecoveryKey = document.getElementById('btnCopyRecoveryKey');
  const recoveryKeyActiveBox = document.getElementById('recoveryKeyActiveBox');
  const displayRecoveryKey = document.getElementById('displayRecoveryKey');
  const btnClearAuditLog = document.getElementById('btnClearAuditLog');

  // Wire all show/hide eye toggles
  document.querySelectorAll('.btn-toggle-eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = targetId ? document.getElementById(targetId) : null;
      if (input) {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.textContent = isPass ? '🙈' : '👁️';
      }
    });
  });

  // Live Password Strength Evaluation
  function evaluateStrength(v) {
    if (!v) {
      if (pwdStrengthFill) {
        pwdStrengthFill.className = 'pwd-strength-fill';
        pwdStrengthFill.style.width = '0%';
      }
      if (pwdStrengthText) pwdStrengthText.textContent = 'Enter a password';
      [ruleLength, ruleUpperLower, ruleNumberSymbol, ruleNotCommon].forEach(el => {
        if (el) el.className = 'rule-pending';
      });
      return 0;
    }

    const hasLength = v.length >= 8;
    const hasUpperLower = /[a-z]/.test(v) && /[A-Z]/.test(v);
    const hasNumSymbol = /[\d\W_]/.test(v);
    const isCommon = ['admin123', 'pawan@2025', '12345678', 'password', 'qwerty123'].includes(v.toLowerCase());
    const isNotCommon = !isCommon;

    if (ruleLength) ruleLength.className = hasLength ? 'rule-passed' : 'rule-pending';
    if (ruleUpperLower) ruleUpperLower.className = hasUpperLower ? 'rule-passed' : 'rule-pending';
    if (ruleNumberSymbol) ruleNumberSymbol.className = hasNumSymbol ? 'rule-passed' : 'rule-pending';
    if (ruleNotCommon) ruleNotCommon.className = isNotCommon ? 'rule-passed' : 'rule-pending';

    let score = 0;
    if (hasLength) score++;
    if (hasUpperLower) score++;
    if (hasNumSymbol) score++;
    if (isNotCommon && score >= 2) score++;

    if (pwdStrengthFill && pwdStrengthText) {
      pwdStrengthFill.className = 'pwd-strength-fill';
      if (score <= 1) {
        pwdStrengthFill.classList.add('strength-weak');
        pwdStrengthText.textContent = 'Weak';
        pwdStrengthText.style.color = '#EF4444';
      } else if (score === 2) {
        pwdStrengthFill.classList.add('strength-fair');
        pwdStrengthText.textContent = 'Fair';
        pwdStrengthText.style.color = '#F59E0B';
      } else if (score === 3) {
        pwdStrengthFill.classList.add('strength-good');
        pwdStrengthText.textContent = 'Good';
        pwdStrengthText.style.color = '#3B82F6';
      } else {
        pwdStrengthFill.classList.add('strength-strong');
        pwdStrengthText.textContent = 'Strong & Secure';
        pwdStrengthText.style.color = '#10B981';
      }
    }
    return score;
  }

  if (newPass) {
    newPass.addEventListener('input', () => {
      evaluateStrength(newPass.value);
      if (confirmPass && confirmPass.value) {
        checkConfirmMatch();
      }
    });
  }

  function checkConfirmMatch() {
    if (!confirmPass || !newPass || !passConfirmError) return true;
    if (confirmPass.value && newPass.value !== confirmPass.value) {
      passConfirmError.classList.remove('hidden');
      return false;
    } else {
      passConfirmError.classList.add('hidden');
      return true;
    }
  }

  if (confirmPass) {
    confirmPass.addEventListener('input', checkConfirmMatch);
  }

  // Handle Password Change Form
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const curVal = curPass.value.trim();
      const newVal = newPass.value;
      const confVal = confirmPass.value;

      const isCurrentValid = await PortfolioData.auth.verifyPassword(curVal);
      if (!isCurrentValid) {
        alert('Current master password incorrect.');
        curPass.focus();
        return;
      }

      if (newVal !== confVal) {
        alert('New passwords do not match.');
        confirmPass.focus();
        return;
      }

      if (newVal.length < 8) {
        alert('New password must be at least 8 characters long.');
        newPass.focus();
        return;
      }

      if (['admin123', 'pawan@2025', '12345678', 'password'].includes(newVal.toLowerCase())) {
        alert('This is a common or default password. Please choose a more unique master password.');
        newPass.focus();
        return;
      }

      await PortfolioData.auth.setPassword(newVal);
      form.reset();
      evaluateStrength('');
      refreshSecurityOverview();
      showToast('Master password updated and hardened successfully! 🛡️', 'success');
    });
  }

  // Quick Lock Button
  if (btnQuickLockAdmin) {
    btnQuickLockAdmin.addEventListener('click', () => {
      PortfolioData.auth.logout();
      const authOverlay = document.getElementById('authOverlay');
      const adminApp = document.getElementById('adminApp');
      if (authOverlay && adminApp) {
        authOverlay.classList.remove('hidden');
        adminApp.classList.add('hidden');
      }
      showToast('Admin panel locked.', 'info');
    });
  }

  // Session Security Settings
  if (btnSaveSessionSettings && selectAutoLockTimeout) {
    btnSaveSessionSettings.addEventListener('click', () => {
      const mins = parseInt(selectAutoLockTimeout.value, 10);
      PortfolioData.auth.saveSecurityConfig({ autoLockMinutes: mins });
      refreshSecurityOverview();
      showToast('Session security settings saved!', 'success');
    });
  }

  // Emergency Recovery Key Generator
  if (btnGenerateRecoveryKey) {
    btnGenerateRecoveryKey.addEventListener('click', async () => {
      if (confirm('Generate a new Emergency Master Recovery Key? Any previous recovery key will be invalidated.')) {
        const key = await PortfolioData.auth.generateRecoveryKey();
        if (recoveryKeyActiveBox) recoveryKeyActiveBox.classList.remove('hidden');
        if (displayRecoveryKey) displayRecoveryKey.textContent = key;
        refreshSecurityOverview();
        showToast('New Emergency Recovery Key generated!', 'success');
      }
    });
  }

  if (btnCopyRecoveryKey && displayRecoveryKey) {
    btnCopyRecoveryKey.addEventListener('click', () => {
      const keyText = displayRecoveryKey.textContent.trim();
      if (keyText && !keyText.includes('••••')) {
        navigator.clipboard.writeText(keyText).then(() => {
          showToast('Emergency Recovery Key copied to clipboard! 📋', 'success');
        }).catch(() => {
          prompt('Copy your recovery key:', keyText);
        });
      } else {
        alert('Please generate a new recovery key first.');
      }
    });
  }

  // Clear Audit Log
  if (btnClearAuditLog) {
    btnClearAuditLog.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear the security audit log?')) {
        PortfolioData.auth.clearAuditLog();
        refreshSecurityOverview();
        showToast('Security audit log cleared.', 'info');
      }
    });
  }

  // Initial populate
  refreshSecurityOverview();
}

/* ==========================================================================
   9. BACKUP & EXPORT MANAGER
   ========================================================================== */
function initBackupManager() {
  const btnExport = document.getElementById('btnDownloadBackup');
  const fileInput = document.getElementById('fileRestoreBackup');
  const btnReset = document.getElementById('btnResetToDefault');

  if (btnExport) {
    btnExport.addEventListener('click', async () => {
      await PortfolioData.exportJSON();
      showToast('Site data backup downloaded!', 'success');
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const res = PortfolioData.importJSON(event.target.result);
          if (res.success) {
            refreshAllPanels();
            showToast('Backup restored successfully!', 'success');
          } else {
            alert('Failed to import backup file: ' + res.error);
          }
        } catch(err) {
          alert('Error parsing JSON backup file: ' + err.message);
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      const confirmed = confirm('WARNING: Are you sure you want to reset all portfolio data back to original defaults? All custom content will be replaced.');
      if (confirmed) {
        PortfolioData.resetDefaults();
        refreshAllPanels();
        showToast('Website reset to factory defaults.', 'success');
      }
    });
  }
}

/* ==========================================================================
   9B. MULTI-DEVICE CLOUD SYNC MANAGER
   ========================================================================== */
function initCloudSyncManager() {
  const chkEnabled = document.getElementById('chkCloudSyncEnabled');
  const selProvider = document.getElementById('selCloudProvider');
  const boxJsonBin = document.getElementById('boxJsonBinSettings');
  const txtEndpoint = document.getElementById('txtCloudEndpoint');
  const txtApiKey = document.getElementById('txtCloudApiKey');
  const boxGitHub = document.getElementById('boxGitHubSettings');
  const txtGitHubRepo = document.getElementById('txtGitHubRepo');
  const txtGitHubToken = document.getElementById('txtGitHubToken');
  const txtGitHubBranch = document.getElementById('txtGitHubBranch');
  const chkAutoPush = document.getElementById('chkAutoPushOnSave');
  const btnSaveConfig = document.getElementById('btnSaveCloudConfig');
  const btnTestPush = document.getElementById('btnTestCloudPush');
  const btnPullCloud = document.getElementById('btnPullCloudData');
  const btnDownloadNetlify = document.getElementById('btnDownloadNetlifyData');
  const btnBannerCloudSync = document.getElementById('btnBannerCloudSync');
  const topbarSyncStatus = document.getElementById('topbarSyncStatus');

  const updateUI = () => {
    const cfg = PortfolioData.getCloudSyncConfig ? PortfolioData.getCloudSyncConfig() : { enabled: false };
    const pillBadge = document.getElementById('pillSyncBadge');
    const statMode = document.getElementById('statStorageMode');
    const statModeDesc = document.getElementById('statStorageModeDesc');
    const statLastSynced = document.getElementById('statLastSynced');
    const topbarDot = document.getElementById('topbarSyncDot');
    const topbarText = document.getElementById('topbarSyncText');

    if (chkEnabled) chkEnabled.checked = Boolean(cfg.enabled);
    if (selProvider) selProvider.value = cfg.provider || 'github';
    if (txtEndpoint) txtEndpoint.value = cfg.endpointUrl || '';
    if (txtApiKey) txtApiKey.value = cfg.apiKey || '';
    if (txtGitHubRepo) txtGitHubRepo.value = cfg.githubRepo || 'pawankushwaha1/Portfolio';
    if (txtGitHubToken) txtGitHubToken.value = cfg.githubToken || '';
    if (txtGitHubBranch) txtGitHubBranch.value = cfg.githubBranch || 'main';
    if (chkAutoPush) chkAutoPush.checked = cfg.autoPushOnSave !== false;

    // Toggle provider sub-boxes
    const prov = selProvider ? selProvider.value : 'github';
    if (boxJsonBin) boxJsonBin.style.display = (prov === 'github') ? 'none' : 'block';
    if (boxGitHub) boxGitHub.style.display = (prov === 'github') ? 'block' : 'none';

    // Last synced timestamp
    if (statLastSynced) {
      if (cfg.lastSyncTime) {
        const d = new Date(cfg.lastSyncTime);
        statLastSynced.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString() + ')';
      } else {
        statLastSynced.textContent = 'Not yet synced';
      }
    }

    // Badges & storage mode text
    if (cfg.enabled) {
      if (pillBadge) {
        pillBadge.textContent = '● Live Cloud Sync Active';
        pillBadge.style.background = 'rgba(34,197,94,0.18)';
        pillBadge.style.color = '#15803D';
        pillBadge.style.borderColor = 'rgba(34,197,94,0.35)';
      }
      if (statMode) {
        const provName = cfg.provider === 'github' ? 'GitHub Auto-Deploy' : (cfg.provider === 'rest' ? 'Custom REST API' : 'JSONBin.io');
        statMode.textContent = provName;
        statMode.style.color = '#15803D';
      }
      if (statModeDesc) {
        statModeDesc.textContent = 'Edits automatically sync across all phones & computers worldwide';
      }
      if (topbarDot) topbarDot.style.background = '#22c55e';
      if (topbarText) topbarText.textContent = 'LIVE CLOUD SYNC ACTIVE';
    } else {
      if (pillBadge) {
        pillBadge.textContent = 'Local Browser Only';
        pillBadge.style.background = 'rgba(229,169,60,0.18)';
        pillBadge.style.color = '#B45309';
        pillBadge.style.borderColor = 'rgba(229,169,60,0.35)';
      }
      if (statMode) {
        statMode.textContent = 'Local Browser Memory';
        statMode.style.color = 'var(--color-navy)';
      }
      if (statModeDesc) {
        statModeDesc.textContent = 'Saved on this computer only. Follow Option A or B below to sync all devices.';
      }
      if (topbarDot) topbarDot.style.background = '#E5A93C';
      if (topbarText) topbarText.textContent = 'LOCAL (CLICK TO SYNC ALL DEVICES)';
    }
  };

  // Provider dropdown change
  if (selProvider) {
    selProvider.addEventListener('change', () => {
      const prov = selProvider.value;
      if (boxJsonBin) boxJsonBin.style.display = (prov === 'github') ? 'none' : 'block';
      if (boxGitHub) boxGitHub.style.display = (prov === 'github') ? 'block' : 'none';
    });
  }

  // 1-Click Netlify JSON Download
  if (btnDownloadNetlifyData) {
    btnDownloadNetlifyData.addEventListener('click', async () => {
      try {
        await PortfolioData.exportNetlifyDataJSON();
        showToast('📥 Downloaded portfolio-data.json! Commit or upload to Netlify to update all devices worldwide.', 'success');
      } catch (err) {
        showToast('Export error: ' + err.message, 'error');
      }
    });
  }

  // Save Cloud Configuration
  if (btnSaveConfig) {
    btnSaveConfig.addEventListener('click', () => {
      const cfg = {
        enabled: chkEnabled ? chkEnabled.checked : false,
        provider: selProvider ? selProvider.value : 'github',
        endpointUrl: txtEndpoint ? txtEndpoint.value.trim() : '',
        apiKey: txtApiKey ? txtApiKey.value.trim() : '',
        githubRepo: txtGitHubRepo ? txtGitHubRepo.value.trim() : '',
        githubToken: txtGitHubToken ? txtGitHubToken.value.trim() : '',
        githubBranch: txtGitHubBranch ? txtGitHubBranch.value.trim() : 'main',
        githubPath: 'portfolio-data.json',
        autoPushOnSave: chkAutoPush ? chkAutoPush.checked : true,
        lastSyncTime: PortfolioData.getCloudSyncConfig().lastSyncTime
      };

      if (cfg.enabled) {
        if (cfg.provider === 'github' && (!cfg.githubRepo || !cfg.githubToken)) {
          alert('Please enter your GitHub Repository (username/repo) and Personal Access Token.');
          return;
        }
        if (cfg.provider !== 'github' && !cfg.endpointUrl) {
          alert('Please enter your Cloud Endpoint URL (e.g. JSONBin URL).');
          return;
        }
      }

      PortfolioData.saveCloudSyncConfig(cfg);
      updateUI();
      showToast('Cloud Sync settings saved successfully! 🌐', 'success');
    });
  }

  // Push to Cloud Now
  if (btnTestPush) {
    btnTestPush.addEventListener('click', async () => {
      const originalText = btnTestPush.innerHTML;
      btnTestPush.disabled = true;
      btnTestPush.innerHTML = '<span>⏳ Pushing to Cloud...</span>';

      try {
        const res = await PortfolioData.pushToCloud();
        if (res.success) {
          showToast(`🚀 Pushed to ${res.provider.toUpperCase()}! All devices will now see your updates.`, 'success');
          updateUI();
        } else {
          showToast(`Push failed: ${res.error}`, 'error');
        }
      } catch (err) {
        showToast('Push error: ' + err.message, 'error');
      } finally {
        btnTestPush.disabled = false;
        btnTestPush.innerHTML = originalText;
      }
    });
  }

  // Pull from Cloud Now
  if (btnPullCloud) {
    btnPullCloud.addEventListener('click', async () => {
      const originalText = btnPullCloud.innerHTML;
      btnPullCloud.disabled = true;
      btnPullCloud.innerHTML = '<span>⏳ Pulling from Cloud...</span>';

      try {
        const res = await PortfolioData.loadRemoteData();
        if (res.adopted) {
          refreshAllPanels();
          showToast(`⬇️ Successfully loaded latest data from ${res.source.toUpperCase()}!`, 'success');
          updateUI();
        } else {
          showToast('Already up-to-date with the latest version.', 'info');
        }
      } catch (err) {
        showToast('Pull error: ' + err.message, 'error');
      } finally {
        btnPullCloud.disabled = false;
        btnPullCloud.innerHTML = originalText;
      }
    });
  }

  // Quick nav to Cloud Sync tab from topbar or banner
  const goToCloudSyncTab = () => {
    const tabLink = document.querySelector('[data-tab="cloud-sync"]');
    if (tabLink) tabLink.click();
  };
  if (topbarSyncStatus) topbarSyncStatus.addEventListener('click', goToCloudSyncTab);
  if (btnBannerCloudSync) btnBannerCloudSync.addEventListener('click', goToCloudSyncTab);

  // Listen for background sync success
  window.addEventListener('portfolioCloudSyncSuccess', () => {
    updateUI();
  });

  // Initial UI populate
  updateUI();
}

/* ==========================================================================
   10. MODAL CLOSE HANDLERS & TOASTS
   ========================================================================== */
function initModalCloseHandlers() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close;
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('active');
    });
  });

  document.querySelectorAll('.admin-modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.admin-modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : '⚠️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ==========================================================================
   10. LIVE PREVIEW MODAL, AUTO-SAVE & UNIVERSAL SYNC CONTROLLER
   ========================================================================== */
function initLivePreviewModal() {
  const modal = document.getElementById('previewModal');
  const btnOpen = document.getElementById('btnOpenLivePreview');
  const btnBanner = document.getElementById('btnBannerPreview');
  const btnDash = document.getElementById('btnDashboardLivePreview');
  const btnClose = document.getElementById('btnClosePreview');
  const btnReload = document.getElementById('btnReloadPreview');
  const frame = document.getElementById('previewFrame');

  function openPreview() {
    if (!modal) return;
    modal.classList.add('active');
    if (frame && (!frame.src || frame.src === 'about:blank' || !frame.src.includes('index.html'))) {
      frame.src = 'index.html?t=' + Date.now();
    } else {
      syncPreviewIframe();
    }
  }

  function closePreview() {
    if (modal) modal.classList.remove('active');
  }

  if (btnOpen) btnOpen.addEventListener('click', openPreview);
  if (btnBanner) btnBanner.addEventListener('click', openPreview);
  if (btnDash) btnDash.addEventListener('click', openPreview);
  if (btnClose) btnClose.addEventListener('click', closePreview);

  if (btnReload && frame) {
    btnReload.addEventListener('click', () => {
      frame.src = 'index.html?t=' + Date.now();
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closePreview();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closePreview();
    }
  });
}

function syncPreviewIframe() {
  const frame = document.getElementById('previewFrame');
  if (frame && frame.contentWindow) {
    try {
      frame.contentWindow.postMessage({ type: 'PORTFOLIO_DATA_UPDATED' }, '*');
      if (typeof frame.contentWindow.hydratePortfolioFromData === 'function') {
        frame.contentWindow.hydratePortfolioFromData();
      }
    } catch(e) {}
  }
}

/* ==========================================================================
   APPEARANCE & CUSTOMIZATION ENGINE
   ========================================================================== */
const THEME_PRESETS = {
  classic: {
    primary: "#642B2B",
    headerBg: "#4F1F1F",
    boldText: "#5C2828",
    buttons: "#5C2828",
    maroon: "#642B2B",
    maroonDark: "#4F1F1F",
    cream: "#FAF9F6",
    gold: "#E5A93C",
    textDark: "#1F1F1F"
  },
  obsidian: {
    primary: "#141416",
    headerBg: "#0A0A0C",
    boldText: "#141416",
    buttons: "#141416",
    maroon: "#141416",
    maroonDark: "#0A0A0C",
    cream: "#F8F8FA",
    gold: "#F5A623",
    textDark: "#1A1A1A"
  },
  emerald: {
    primary: "#183D2D",
    headerBg: "#0E261C",
    boldText: "#183D2D",
    buttons: "#183D2D",
    maroon: "#183D2D",
    maroonDark: "#0E261C",
    cream: "#F4F8F5",
    gold: "#D4AF37",
    textDark: "#14221B"
  },
  indigo: {
    primary: "#1E293B",
    headerBg: "#0F172A",
    boldText: "#1E293B",
    buttons: "#1E293B",
    maroon: "#1E293B",
    maroonDark: "#0F172A",
    cream: "#F8FAFC",
    gold: "#E28743",
    textDark: "#0F172A"
  },
  espresso: {
    primary: "#3B2A1E",
    headerBg: "#261B13",
    boldText: "#3B2A1E",
    buttons: "#3B2A1E",
    maroon: "#3B2A1E",
    maroonDark: "#261B13",
    cream: "#FAF6F0",
    gold: "#C89666",
    textDark: "#2B1D14"
  },
  crimson: {
    primary: "#781818",
    headerBg: "#551010",
    boldText: "#781818",
    buttons: "#781818",
    maroon: "#781818",
    maroonDark: "#551010",
    cream: "#FFF5F5",
    gold: "#E5A93C",
    textDark: "#2D0A0A"
  }
};

let currentProfileAlign = 'center';
let currentProfileLayer = 'back';

function setupRangeBadge(sliderId, badgeId, suffix, callback) {
  const slider = document.getElementById(sliderId);
  const badge = document.getElementById(badgeId);
  if (!slider || !badge) return;

  const update = () => {
    badge.textContent = slider.value + suffix;
    if (callback) callback();
  };

  slider.addEventListener('input', update);
}

function setRangeValue(sliderId, badgeId, value, suffix) {
  const slider = document.getElementById(sliderId);
  const badge = document.getElementById(badgeId);
  if (slider) slider.value = value;
  if (badge) badge.textContent = value + suffix;
}

function setupColorSync(pickerId, hexId, onSync) {
  const picker = document.getElementById(pickerId);
  const hex = document.getElementById(hexId);
  if (!picker || !hex) return;

  picker.addEventListener('input', () => {
    hex.value = picker.value.toUpperCase();
    if (typeof onSync === 'function') onSync(picker.value);
    updateHeroPreview();
  });

  picker.addEventListener('change', () => {
    hex.value = picker.value.toUpperCase();
    if (typeof onSync === 'function') onSync(picker.value);
    updateHeroPreview();
    if (typeof saveCustomizationData === 'function') {
      saveCustomizationData(false);
    }
  });

  hex.addEventListener('input', () => {
    let val = hex.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      picker.value = val;
      if (typeof onSync === 'function') onSync(val);
      updateHeroPreview();
    }
  });

  hex.addEventListener('change', () => {
    let val = hex.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      picker.value = val;
      hex.value = val.toUpperCase();
      if (typeof onSync === 'function') onSync(val);
      updateHeroPreview();
      if (typeof saveCustomizationData === 'function') {
        saveCustomizationData(false);
      }
    }
  });
}

function setColorInputVal(pickerId, hexId, val) {
  if (!val) return;
  const p = document.getElementById(pickerId);
  const h = document.getElementById(hexId);
  if (p) p.value = val;
  if (h) h.value = val.toUpperCase();
}

function updateIndividualPreviews() {
  const primaryCol = document.getElementById('custColorPrimaryHex')?.value || '#642B2B';
  const headerCol = document.getElementById('custColorHeaderBgHex')?.value || primaryCol;
  const boldCol = document.getElementById('custColorBoldTextHex')?.value || primaryCol;
  const btnCol = document.getElementById('custColorButtonsHex')?.value || primaryCol;

  const headerSample = document.getElementById('syncHeaderSample');
  const boldTextSample = document.getElementById('syncBoldTextSample');
  const btnSample = document.getElementById('syncBtnSample');
  const btnSecSample = document.getElementById('syncBtnSecSample');

  if (headerSample && headerCol) headerSample.style.backgroundColor = headerCol;
  if (boldTextSample && boldCol) boldTextSample.style.color = boldCol;
  if (btnSample && btnCol) {
    btnSample.style.backgroundColor = btnCol;
    btnSample.style.borderColor = btnCol;
  }
  if (btnSecSample && btnCol) {
    btnSecSample.style.borderColor = btnCol;
    btnSecSample.style.color = btnCol;
  }
}

function applyColorValues(colors) {
  if (!colors) return;
  if (colors.primary) {
    setColorInputVal('custColorPrimary', 'custColorPrimaryHex', colors.primary);
  }
  if (colors.headerBg) {
    setColorInputVal('custColorHeaderBg', 'custColorHeaderBgHex', colors.headerBg);
  } else if (colors.primary) {
    setColorInputVal('custColorHeaderBg', 'custColorHeaderBgHex', colors.primary);
  }
  if (colors.boldText) {
    setColorInputVal('custColorBoldText', 'custColorBoldTextHex', colors.boldText);
  } else if (colors.primary) {
    setColorInputVal('custColorBoldText', 'custColorBoldTextHex', colors.primary);
  }
  if (colors.buttons) {
    setColorInputVal('custColorButtons', 'custColorButtonsHex', colors.buttons);
  } else if (colors.primary) {
    setColorInputVal('custColorButtons', 'custColorButtonsHex', colors.primary);
  }
  if (colors.maroon) {
    setColorInputVal('custColorMaroon', 'custColorMaroonHex', colors.maroon);
  }
  if (colors.maroonDark) {
    setColorInputVal('custColorMaroonDark', 'custColorMaroonDarkHex', colors.maroonDark);
  }
  if (colors.cream) {
    setColorInputVal('custColorCream', 'custColorCreamHex', colors.cream);
  }
  if (colors.gold) {
    setColorInputVal('custColorGold', 'custColorGoldHex', colors.gold);
  }
  if (colors.textDark) {
    setColorInputVal('custColorTextDark', 'custColorTextDarkHex', colors.textDark);
  }
  updateIndividualPreviews();
}

function setLayerOrder(orderVal) {
  currentProfileLayer = orderVal;
  const layerCards = [
    { card: document.getElementById('layerCardBack'), val: 'back' },
    { card: document.getElementById('layerCardFront'), val: 'front' },
    { card: document.getElementById('layerCardWave'), val: 'wave-front' }
  ];
  layerCards.forEach(c => {
    if (c.card) {
      const match = (c.val === orderVal);
      c.card.classList.toggle('active', match);
      const radio = c.card.querySelector('input[type="radio"]');
      if (radio) radio.checked = match;
    }
  });
}

function updateHeroPreview() {
  const previewBox = document.getElementById('heroTextPreview');
  const titleEl = document.getElementById('previewHeroTitle');
  const line1El = document.getElementById('previewTitleLine1');
  const line2El = document.getElementById('previewTitleLine2');
  const roleEl = document.getElementById('previewHeroRole');
  const taglineEl = document.getElementById('previewHeroTagline');

  const titleSize = parseFloat(document.getElementById('custHeroTitleSize')?.value || 8.0);
  const lineHeight = parseFloat(document.getElementById('custHeroLineHeight')?.value || 0.88);
  const letterSpacing = parseFloat(document.getElementById('custHeroLetterSpacing')?.value || 0.015);
  const roleSize = parseFloat(document.getElementById('custHeroRoleSize')?.value || 0.88);
  const taglineSize = parseFloat(document.getElementById('custHeroTaglineSize')?.value || 2.4);

  const line1 = document.getElementById('custHeroLine1')?.value || 'PAWAN K.';
  const line2 = document.getElementById('custHeroLine2')?.value || 'KUSHWAHA';
  const role = document.getElementById('custHeroRole')?.value || 'PRODUCT DESIGNER';
  const colorMaroon = document.getElementById('custColorMaroon')?.value || '#642B2B';
  const colorMaroonDark = document.getElementById('custColorMaroonDark')?.value || '#4F1F1F';

  if (previewBox) {
    previewBox.style.background = `radial-gradient(circle at 70% 30%, ${colorMaroon} 0%, ${colorMaroonDark} 100%)`;
  }
  if (titleEl) {
    const previewScale = Math.min(1.2, Math.max(0.6, titleSize / 8.0));
    titleEl.style.fontSize = `${(36 * previewScale).toFixed(1)}px`;
    titleEl.style.lineHeight = lineHeight;
    titleEl.style.letterSpacing = `${letterSpacing}em`;
  }
  if (line1El) line1El.textContent = line1;
  if (line2El) line2El.textContent = line2;
  if (roleEl) {
    roleEl.textContent = role;
    const roleScale = Math.min(1.4, Math.max(0.7, roleSize / 0.88));
    roleEl.style.fontSize = `${(12 * roleScale).toFixed(1)}px`;
  }
  if (taglineEl) {
    const tagScale = Math.min(1.4, Math.max(0.7, taglineSize / 2.4));
    taglineEl.style.fontSize = `${(22 * tagScale).toFixed(1)}px`;
  }
}

function updateSectionBgPreview(sec) {
  const typeInp = document.getElementById(`cust${sec}BgType`);
  const imgInp = document.getElementById(`cust${sec}BgImage`);
  const colorInp = document.getElementById(`cust${sec}BgColor`);
  const prev = document.getElementById(`prev${sec}Bg`);
  const label = document.getElementById(`labelPrev${sec}Bg`);
  if (!prev) return;

  const mode = typeInp ? typeInp.value : 'image';
  const colorVal = colorInp ? colorInp.value : '#55161C';
  const imgVal = imgInp ? imgInp.value.trim() : '';

  if (mode === 'color' || (!imgVal && colorVal)) {
    prev.style.backgroundImage = 'none';
    prev.style.backgroundColor = colorVal;
    if (label) label.textContent = 'Solid Color';
  } else {
    prev.style.backgroundImage = `url('${imgVal}')`;
    prev.style.backgroundColor = 'transparent';
    if (label) label.textContent = 'Active Photo';
  }
}

function switchSectionBgMode(sec, mode) {
  const typeInp = document.getElementById(`cust${sec}BgType`);
  const wrapImg = document.getElementById(`wrap${sec}BgImage`);
  const wrapCol = document.getElementById(`wrap${sec}BgColor`);
  const switcher = document.querySelector(`.bg-type-switcher[data-sec="${sec}"]`);

  if (typeInp) typeInp.value = mode;

  if (switcher) {
    switcher.querySelectorAll('.btn-bg-type').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === mode);
    });
  }

  if (wrapImg) wrapImg.style.display = (mode === 'image' ? 'block' : 'none');
  if (wrapCol) wrapCol.style.display = (mode === 'color' ? 'block' : 'none');

  updateSectionBgPreview(sec);
}

function compressImageFile(file, maxWidth = 1920, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));
    if (file.type === 'image/svg+xml' || file.size < 120 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > 1080) {
          width = Math.round((width * 1080) / height);
          height = 1080;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let result = canvas.toDataURL('image/webp', quality);
        if (!result || result.length < 50 || result.startsWith('data:image/png')) {
          result = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(result);
      };
      img.onerror = () => {
        resolve(e.target.result);
      };
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function initCustomizationManager() {
  // Range sliders and numerical badges
  setupRangeBadge('custHeroTitleSize', 'badgeHeroTitleSize', ' rem', updateHeroPreview);
  setupRangeBadge('custHeroLineHeight', 'badgeHeroLineHeight', '', updateHeroPreview);
  setupRangeBadge('custHeroLetterSpacing', 'badgeHeroLetterSpacing', ' em', updateHeroPreview);
  setupRangeBadge('custHeroRoleSize', 'badgeHeroRoleSize', ' rem', updateHeroPreview);
  setupRangeBadge('custHeroTaglineSize', 'badgeHeroTaglineSize', ' rem', updateHeroPreview);
  setupRangeBadge('custProfileScale', 'badgeProfileScale', '%');
  setupRangeBadge('custProfileOffsetX', 'badgeProfileOffsetX', ' px');
  setupRangeBadge('custProfileOffsetY', 'badgeProfileOffsetY', ' px');
  setupRangeBadge('custLensSize', 'badgeLensSize', ' px');
  setupRangeBadge('custLensScale', 'badgeLensScale', 'x');

  // Backgrounds & Parallax Range Badges
  setupRangeBadge('custHeroBgSpeed', 'badgeHeroBgSpeed', 'x');
  setupRangeBadge('custProtoBgOverlay', 'badgeProtoBgOverlay', '%');
  setupRangeBadge('custProtoBgSpeed', 'badgeProtoBgSpeed', 'x');
  setupRangeBadge('custConnectBgOverlay', 'badgeConnectBgOverlay', '%');
  setupRangeBadge('custConnectBgSpeed', 'badgeConnectBgSpeed', 'x');

  // Wire up per-section type switcher buttons
  document.querySelectorAll('.bg-type-switcher .btn-bg-type').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.sec;
      const type = btn.dataset.type;
      switchSectionBgMode(sec, type);
    });
  });

  // Wire up image and color input live sync
  ['Hero', 'Proto', 'Connect'].forEach(sec => {
    const imgInp = document.getElementById(`cust${sec}BgImage`);
    if (imgInp) {
      imgInp.addEventListener('input', () => updateSectionBgPreview(sec));
    }

    // Color picker & Hex input two-way sync
    const colInp = document.getElementById(`cust${sec}BgColor`);
    const hexInp = document.getElementById(`cust${sec}BgColorHex`);
    if (colInp && hexInp) {
      colInp.addEventListener('input', () => {
        hexInp.value = colInp.value.toUpperCase();
        updateSectionBgPreview(sec);
      });
      hexInp.addEventListener('input', () => {
        const v = hexInp.value.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
          colInp.value = v;
          updateSectionBgPreview(sec);
        }
      });
    }

    // Swatches
    document.querySelectorAll(`.mini-swatch[data-sec="${sec}"]`).forEach(sw => {
      sw.addEventListener('click', () => {
        const c = sw.dataset.color;
        if (colInp) colInp.value = c;
        if (hexInp) hexInp.value = c.toUpperCase();
        switchSectionBgMode(sec, 'color');
      });
    });
  });

  // Background File Uploads with Auto-Compression
  const setupBgFileUpload = (fileId, textId, sec) => {
    const fileIn = document.getElementById(fileId);
    const textIn = document.getElementById(textId);
    if (!fileIn || !textIn) return;
    fileIn.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        showToast(`Compressing & preparing image for ${sec}...`, 'info');
        const compressed = await compressImageFile(file, 1920, 0.85);
        textIn.value = compressed;
        switchSectionBgMode(sec, 'image');
        showToast(`Background image for ${sec} uploaded & preview updated!`, 'success');
      } catch (err) {
        console.error('Failed to process background image:', err);
        showToast('Failed to process uploaded image file.', 'error');
      }
    });
  };
  setupBgFileUpload('fileHeroBg', 'custHeroBgImage', 'Hero');
  setupBgFileUpload('fileProtoBg', 'custProtoBgImage', 'Proto');
  setupBgFileUpload('fileConnectBg', 'custConnectBgImage', 'Connect');

  // Custom Image Helper for Global Set
  const applyCustomImageToAll = (imageSrc, isUpload = false) => {
    if (!imageSrc || !imageSrc.trim()) {
      showToast('Please enter an image URL or upload a file first.', 'error');
      return;
    }
    const src = imageSrc.trim();

    const gUrlInp = document.getElementById('globalCustomImageUrl');
    const customCard = document.getElementById('cardCustomImagePreset');
    const customThumb = document.getElementById('thumbCustomImagePreset');
    if (gUrlInp && gUrlInp.value !== src) gUrlInp.value = src;

    if (customThumb) {
      customThumb.style.backgroundImage = `url('${src}')`;
      customThumb.innerHTML = '';
    }

    document.querySelectorAll('.bg-preset-card').forEach(c => c.classList.remove('active'));
    if (customCard) customCard.classList.add('active');

    ['Hero', 'Proto', 'Connect'].forEach(sec => {
      const inp = document.getElementById(`cust${sec}BgImage`);
      if (inp) inp.value = src;
      switchSectionBgMode(sec, 'image');
    });

    showToast(isUpload ? 'Custom image uploaded, optimized & applied across all sections!' : 'Applied custom image across all 3 sections!', 'success');
  };

  const btnApplyGlobalImg = document.getElementById('btnApplyGlobalCustomImage');
  const gUrlInp = document.getElementById('globalCustomImageUrl');
  const fileGlobalImg = document.getElementById('fileGlobalCustomImage');
  const customImgCard = document.getElementById('cardCustomImagePreset');

  if (btnApplyGlobalImg && gUrlInp) {
    btnApplyGlobalImg.addEventListener('click', () => {
      applyCustomImageToAll(gUrlInp.value, false);
    });
    gUrlInp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyCustomImageToAll(gUrlInp.value, false);
      }
    });
    gUrlInp.addEventListener('input', () => {
      const val = gUrlInp.value.trim();
      const customThumb = document.getElementById('thumbCustomImagePreset');
      if (customThumb && val) {
        customThumb.style.backgroundImage = `url('${val}')`;
        customThumb.innerHTML = '';
      }
    });
  }

  if (fileGlobalImg) {
    fileGlobalImg.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        showToast('Compressing and preparing custom image...', 'info');
        const compressed = await compressImageFile(file, 1920, 0.85);
        applyCustomImageToAll(compressed, true);
      } catch (err) {
        console.error('Failed to process image:', err);
        showToast('Failed to process uploaded image file.', 'error');
      }
    });
  }

  if (customImgCard) {
    customImgCard.addEventListener('click', () => {
      const currentVal = gUrlInp ? gUrlInp.value.trim() : '';
      if (currentVal) {
        applyCustomImageToAll(currentVal, false);
      } else if (fileGlobalImg) {
        fileGlobalImg.click();
      }
    });
  }

  // 1-Click Global Background Presets (Images & Solid Colors)
  const bgPresetCards = document.querySelectorAll('.bg-preset-card:not(#cardCustomImagePreset)');
  bgPresetCards.forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.bg-preset-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const presetType = card.dataset.presetType || 'image';
      const name = card.dataset.bgName || 'Selected';

      if (presetType === 'image') {
        const src = card.dataset.bgSrc || '';
        ['Hero', 'Proto', 'Connect'].forEach(sec => {
          const inp = document.getElementById(`cust${sec}BgImage`);
          if (inp) inp.value = src;
          switchSectionBgMode(sec, 'image');
        });
        showToast(`Applied 🖼️ Image preset: ${name} across all 3 sections!`, 'success');
      } else {
        const color = card.dataset.bgColor || '#55161C';
        ['Hero', 'Proto', 'Connect'].forEach(sec => {
          const colInp = document.getElementById(`cust${sec}BgColor`);
          const hexInp = document.getElementById(`cust${sec}BgColorHex`);
          if (colInp) colInp.value = color;
          if (hexInp) hexInp.value = color.toUpperCase();
          switchSectionBgMode(sec, 'color');
        });
        const gColor = document.getElementById('globalCustomSolidColor');
        const gHex = document.getElementById('globalCustomSolidHex');
        if (gColor) gColor.value = color;
        if (gHex) gHex.value = color.toUpperCase();
        showToast(`Applied 🎨 Solid Color preset: ${name} across all 3 sections!`, 'success');
      }
    });
  });

  // Custom Solid Color Bar
  const gColor = document.getElementById('globalCustomSolidColor');
  const gHex = document.getElementById('globalCustomSolidHex');
  const btnApplyGlobalCol = document.getElementById('btnApplyGlobalCustomColor');
  if (gColor && gHex) {
    gColor.addEventListener('input', () => {
      gHex.value = gColor.value.toUpperCase();
    });
    gHex.addEventListener('input', () => {
      const v = gHex.value.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
        gColor.value = v;
      }
    });
  }
  if (btnApplyGlobalCol) {
    btnApplyGlobalCol.addEventListener('click', () => {
      const col = (gHex?.value || gColor?.value || '#55161C').trim();
      document.querySelectorAll('.bg-preset-card').forEach(c => c.classList.remove('active'));
      ['Hero', 'Proto', 'Connect'].forEach(sec => {
        const colInp = document.getElementById(`cust${sec}BgColor`);
        const hexInp = document.getElementById(`cust${sec}BgColorHex`);
        if (colInp) colInp.value = col;
        if (hexInp) hexInp.value = col.toUpperCase();
        switchSectionBgMode(sec, 'color');
      });
      showToast(`Applied custom solid color ${col} across all 3 sections!`, 'success');
    });
  }

  // Reset Backgrounds Button
  const btnResetBgs = document.getElementById('btnResetBackgrounds');
  if (btnResetBgs) {
    btnResetBgs.addEventListener('click', () => {
      const def = (window.DEFAULT_PORTFOLIO_DATA && DEFAULT_PORTFOLIO_DATA.customization && DEFAULT_PORTFOLIO_DATA.customization.backgrounds) || {};
      const setInp = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
      const setCh = (id, ch) => { const el = document.getElementById(id); if (el) el.checked = ch; };

      ['Hero', 'Proto', 'Connect'].forEach(sec => {
        const key = (sec === 'Hero' ? 'hero' : sec === 'Proto' ? 'prototyping' : 'connect');
        const sDef = def[key] || {};
        setInp(`cust${sec}BgImage`, sDef.image || 'assets/background.png');
        setInp(`cust${sec}BgColor`, sDef.color || '#55161C');
        setInp(`cust${sec}BgColorHex`, (sDef.color || '#55161C').toUpperCase());
        setCh(`cust${sec}BgParallax`, sDef.parallax !== false);
        switchSectionBgMode(sec, sDef.type || 'image');
      });

      setRangeValue('custHeroBgSpeed', 'badgeHeroBgSpeed', 1.0, 'x');
      setRangeValue('custProtoBgOverlay', 'badgeProtoBgOverlay', 35, '%');
      setRangeValue('custProtoBgSpeed', 'badgeProtoBgSpeed', 1.0, 'x');
      setRangeValue('custConnectBgOverlay', 'badgeConnectBgOverlay', 25, '%');
      setRangeValue('custConnectBgSpeed', 'badgeConnectBgSpeed', 1.0, 'x');

      bgPresetCards.forEach(c => c.classList.toggle('active', c.dataset.bgSrc === 'assets/background.png'));
      showToast('All section backgrounds reset to default sunset clouds.', 'success');
    });
  }

  // Live text inputs to preview
  const inLine1 = document.getElementById('custHeroLine1');
  const inLine2 = document.getElementById('custHeroLine2');
  const inRole = document.getElementById('custHeroRole');
  if (inLine1) inLine1.addEventListener('input', updateHeroPreview);
  if (inLine2) inLine2.addEventListener('input', updateHeroPreview);
  if (inRole) inRole.addEventListener('input', updateHeroPreview);

  // Profile Alignment segmented buttons
  const alignBtns = document.querySelectorAll('#profileAlignGroup .segment-btn');
  alignBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      alignBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentProfileAlign = btn.dataset.align;
    });
  });

  // Layer Ordering radio cards
  const layerCards = [
    { card: document.getElementById('layerCardBack'), val: 'back' },
    { card: document.getElementById('layerCardFront'), val: 'front' },
    { card: document.getElementById('layerCardWave'), val: 'wave-front' }
  ];

  layerCards.forEach(item => {
    if (!item.card) return;
    item.card.addEventListener('click', () => {
      layerCards.forEach(c => c.card.classList.remove('active'));
      item.card.classList.add('active');
      const radio = item.card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      currentProfileLayer = item.val;
    });
  });

  // Master Color Picker & Hex (controls Header BG, Bold Text, and Buttons simultaneously)
  setupColorSync('custColorPrimary', 'custColorPrimaryHex', (hex) => {
    setColorInputVal('custColorHeaderBg', 'custColorHeaderBgHex', hex);
    setColorInputVal('custColorBoldText', 'custColorBoldTextHex', hex);
    setColorInputVal('custColorButtons', 'custColorButtonsHex', hex);
    setColorInputVal('custColorMaroon', 'custColorMaroonHex', hex);
    updateIndividualPreviews();
    presetChips.forEach(c => c.classList.remove('active'));
  });

  // Granular Sub-Color Pickers
  setupColorSync('custColorHeaderBg', 'custColorHeaderBgHex', updateIndividualPreviews);
  setupColorSync('custColorBoldText', 'custColorBoldTextHex', updateIndividualPreviews);
  setupColorSync('custColorButtons', 'custColorButtonsHex', updateIndividualPreviews);

  // Additional Palette Colors bidirectional sync
  setupColorSync('custColorMaroon', 'custColorMaroonHex');
  setupColorSync('custColorMaroonDark', 'custColorMaroonDarkHex');
  setupColorSync('custColorCream', 'custColorCreamHex');
  setupColorSync('custColorGold', 'custColorGoldHex');
  setupColorSync('custColorTextDark', 'custColorTextDarkHex');

  // Theme Preset Chips
  const presetChips = document.querySelectorAll('.preset-chip');
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const themeKey = chip.dataset.theme;
      const theme = THEME_PRESETS[themeKey];
      if (theme) {
        applyColorValues(theme);
        updateHeroPreview();
        saveCustomizationData(false);
        showToast(`Theme updated to ${chip.querySelector('span:last-child').textContent}!`, 'success');
      }
    });
  });

  // Reset Sub-buttons
  const btnResetProfile = document.getElementById('btnResetProfileAdjust');
  if (btnResetProfile) {
    btnResetProfile.addEventListener('click', () => {
      setRangeValue('custProfileScale', 'badgeProfileScale', 100, '%');
      setRangeValue('custProfileOffsetX', 'badgeProfileOffsetX', 0, ' px');
      setRangeValue('custProfileOffsetY', 'badgeProfileOffsetY', 0, ' px');
      alignBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.align === 'center');
      });
      currentProfileAlign = 'center';
      setLayerOrder('back');
      showToast('Profile position & layer reset to defaults.', 'success');
    });
  }

  const btnResetPalette = document.getElementById('btnResetPalette');
  if (btnResetPalette) {
    btnResetPalette.addEventListener('click', () => {
      applyColorValues(THEME_PRESETS.classic);
      presetChips.forEach(c => c.classList.toggle('active', c.dataset.theme === 'classic'));
      updateHeroPreview();
      saveCustomizationData(false);
      showToast('Color palette reset to classic wine & gold.', 'success');
    });
  }

  const btnResetLens = document.getElementById('btnResetLens');
  if (btnResetLens) {
    btnResetLens.addEventListener('click', () => {
      const lensEn = document.getElementById('custLensEnabled');
      const lensTog = document.getElementById('custLensShowToggleBtn');
      if (lensEn) lensEn.checked = true;
      if (lensTog) lensTog.checked = true;
      setRangeValue('custLensSize', 'badgeLensSize', 70, ' px');
      setRangeValue('custLensScale', 'badgeLensScale', 1.65, 'x');
      showToast('Lens settings reset to factory defaults (70px / 1.65x).', 'success');
    });
  }

  // Master Reset Button
  const btnResetMaster = document.getElementById('btnResetCustomization');
  if (btnResetMaster) {
    btnResetMaster.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all appearance and customization settings to default?')) {
        const data = PortfolioData.get();
        data.customization = JSON.parse(JSON.stringify((window.DEFAULT_PORTFOLIO_DATA && DEFAULT_PORTFOLIO_DATA.customization) || {}));
        PortfolioData.save(data);
        loadCustomizationData();
        syncPreviewIframe();
        showToast('All appearance settings reset to default!', 'success');
      }
    });
  }

  // Master Save Button
  const btnSave = document.getElementById('btnSaveCustomization');
  if (btnSave) {
    btnSave.addEventListener('click', () => saveCustomizationData(true));
  }

  // Mobile Screen Restriction Mode Switcher Events
  const radMobileOn = document.getElementById('radMobileNoticeOn');
  const radMobileOff = document.getElementById('radMobileNoticeOff');
  const btnToggleMobileQuick = document.getElementById('btnToggleMobileQuick');
  const btnSaveMobileQuick = document.getElementById('btnSaveMobileQuick');
  const btnQuickToggleMobile = document.getElementById('btnQuickToggleMobile');

  const setMobileRestrictionMode = (enabled, notify = true) => {
    renderMobileRestrictionUI(enabled);
    if (typeof PortfolioData !== 'undefined' && PortfolioData.setMobileRestriction) {
      PortfolioData.setMobileRestriction(enabled);
    } else {
      const data = PortfolioData.get();
      data.customization = data.customization || {};
      data.customization.mobileRestriction = data.customization.mobileRestriction || {};
      data.customization.mobileRestriction.enabled = enabled;
      PortfolioData.save(data);
    }
    syncPreviewIframe();
    if (notify) {
      if (enabled) {
        showToast('Mobile restriction notice TURNED ON (smartphones see laptop notice).', 'success');
      } else {
        showToast('Mobile restriction notice TURNED OFF (smartphones view full site directly).', 'success');
      }
    }
  };

  if (radMobileOn) {
    radMobileOn.addEventListener('change', () => {
      if (radMobileOn.checked) setMobileRestrictionMode(true);
    });
  }
  if (radMobileOff) {
    radMobileOff.addEventListener('change', () => {
      if (radMobileOff.checked) setMobileRestrictionMode(false);
    });
  }
  if (btnToggleMobileQuick) {
    btnToggleMobileQuick.addEventListener('click', () => {
      const isCurrentlyEnabled = (typeof PortfolioData !== 'undefined' && PortfolioData.isMobileRestrictionEnabled)
        ? PortfolioData.isMobileRestrictionEnabled()
        : (document.getElementById('radMobileNoticeOn')?.checked ?? true);
      setMobileRestrictionMode(!isCurrentlyEnabled);
    });
  }
  if (btnQuickToggleMobile) {
    btnQuickToggleMobile.addEventListener('click', () => {
      const isCurrentlyEnabled = (typeof PortfolioData !== 'undefined' && PortfolioData.isMobileRestrictionEnabled)
        ? PortfolioData.isMobileRestrictionEnabled()
        : (document.getElementById('radMobileNoticeOn')?.checked ?? true);
      setMobileRestrictionMode(!isCurrentlyEnabled);
    });
  }
  if (btnSaveMobileQuick) {
    btnSaveMobileQuick.addEventListener('click', () => {
      const current = document.getElementById('radMobileNoticeOn')?.checked ?? true;
      setMobileRestrictionMode(current, true);
    });
  }

  // Mobile Lock Screen Customizer Events
  const custLockScreenImage = document.getElementById('custLockScreenImage');
  const fileLockScreenImage = document.getElementById('fileLockScreenImage');
  const btnUploadLockScreenImage = document.getElementById('btnUploadLockScreenImage');
  const btnResetLockScreenDefault = document.getElementById('btnResetLockScreenDefault');
  const btnPreviewLockScreenModal = document.getElementById('btnPreviewLockScreenModal');
  const btnCloseLockScreenPreview = document.getElementById('btnCloseLockScreenPreview');
  const modalLockScreenPreview = document.getElementById('modalLockScreenPreview');
  const custLockScreenTitle = document.getElementById('custLockScreenTitle');
  const custLockScreenDesc = document.getElementById('custLockScreenDesc');
  const custLockScreenBtnText = document.getElementById('custLockScreenBtnText');

  function triggerLockScreenMockupUpdate() {
    const img = custLockScreenImage?.value.trim() || 'assets/images/restriction_character.png';
    const title = custLockScreenTitle?.value.trim() || 'Best viewed on a larger screen.';
    const desc = custLockScreenDesc?.value.trim() || 'For the full interactive portfolio, open this link on a desktop or tablet.';
    const btn = custLockScreenBtnText?.value.trim() || 'Copy portfolio link';
    updateLockScreenMockup(img, title, desc, btn);
  }

  if (custLockScreenImage) {
    custLockScreenImage.addEventListener('input', triggerLockScreenMockupUpdate);
  }
  if (custLockScreenTitle) {
    custLockScreenTitle.addEventListener('input', triggerLockScreenMockupUpdate);
  }
  if (custLockScreenDesc) {
    custLockScreenDesc.addEventListener('input', triggerLockScreenMockupUpdate);
  }
  if (custLockScreenBtnText) {
    custLockScreenBtnText.addEventListener('input', triggerLockScreenMockupUpdate);
  }

  if (btnUploadLockScreenImage && fileLockScreenImage) {
    btnUploadLockScreenImage.addEventListener('click', () => fileLockScreenImage.click());
    fileLockScreenImage.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const previewImg = document.getElementById('miniLockPreviewImg');
      await handleAdminFileUpload(file, custLockScreenImage, previewImg, 'lock_screen', false);
      triggerLockScreenMockupUpdate();
      saveCustomizationData(false);
      showToast('Lock screen image uploaded & saved live!', 'success');
    });
  }

  // Preset Buttons
  document.querySelectorAll('.btn-preset-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetUrl = btn.getAttribute('data-preset');
      if (presetUrl && custLockScreenImage) {
        custLockScreenImage.value = presetUrl;
        document.querySelectorAll('.btn-preset-thumb').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        triggerLockScreenMockupUpdate();
        saveCustomizationData(false);
        showToast('Lock screen image updated from preset!', 'success');
      }
    });
  });

  // Reset Button
  if (btnResetLockScreenDefault) {
    btnResetLockScreenDefault.addEventListener('click', () => {
      if (custLockScreenImage) custLockScreenImage.value = 'assets/images/restriction_character.png';
      if (custLockScreenTitle) custLockScreenTitle.value = 'Best viewed on a larger screen.';
      if (custLockScreenDesc) custLockScreenDesc.value = 'For the full interactive portfolio, open this link on a desktop or tablet.';
      if (custLockScreenBtnText) custLockScreenBtnText.value = 'Copy portfolio link';
      document.querySelectorAll('.btn-preset-thumb').forEach(b => b.classList.remove('active'));
      triggerLockScreenMockupUpdate();
      saveCustomizationData(false);
      showToast('Lock screen restored to defaults.', 'info');
    });
  }

  // Preview Modal
  if (btnPreviewLockScreenModal && modalLockScreenPreview) {
    btnPreviewLockScreenModal.addEventListener('click', () => {
      triggerLockScreenMockupUpdate();
      modalLockScreenPreview.classList.add('active');
    });
  }
  if (btnCloseLockScreenPreview && modalLockScreenPreview) {
    btnCloseLockScreenPreview.addEventListener('click', () => {
      modalLockScreenPreview.classList.remove('active');
    });
  }
  if (modalLockScreenPreview) {
    modalLockScreenPreview.addEventListener('click', (e) => {
      if (e.target === modalLockScreenPreview) {
        modalLockScreenPreview.classList.remove('active');
      }
    });
  }
}

function updateLockScreenMockup(imgSrc, title, desc, btnText) {
  const miniImg = document.getElementById('miniLockPreviewImg');
  const miniTitle = document.getElementById('miniLockTitlePreview');
  const miniDesc = document.getElementById('miniLockDescPreview');
  const miniBtn = document.getElementById('miniLockBtnPreview');
  
  const modalImg = document.getElementById('previewModalLockImg');
  const modalTitle = document.getElementById('previewModalLockTitle');
  const modalDesc = document.getElementById('previewModalLockDesc');

  const resolved = resolveMediaAdmin(imgSrc || 'assets/images/restriction_character.png');

  if (miniImg) miniImg.src = resolved;
  if (modalImg) modalImg.src = resolved;

  if (miniTitle && title) miniTitle.textContent = title;
  if (modalTitle && title) {
    modalTitle.innerHTML = title.replace(/\./g, '<span style="color: #DE8344;">.</span>');
  }

  if (miniDesc && desc) miniDesc.textContent = desc;
  if (modalDesc && desc) modalDesc.textContent = desc;

  if (miniBtn && btnText) miniBtn.textContent = '📋 ' + btnText;
}

function renderMobileRestrictionUI(isEnabled) {
  const radOn = document.getElementById('radMobileNoticeOn');
  const radOff = document.getElementById('radMobileNoticeOff');
  const lblOn = document.getElementById('lblMobileNoticeOn');
  const lblOff = document.getElementById('lblMobileNoticeOff');
  const badge = document.getElementById('mobileRestrictionBadge');
  const quickBadge = document.getElementById('quickMobileBadge');
  const feedback = document.getElementById('mobileModeFeedback');
  const feedbackIcon = document.getElementById('feedbackIcon');
  const feedbackTitle = document.getElementById('feedbackTitle');
  const feedbackDesc = document.getElementById('feedbackDesc');

  if (radOn) radOn.checked = Boolean(isEnabled);
  if (radOff) radOff.checked = !isEnabled;

  if (lblOn) lblOn.classList.toggle('active', Boolean(isEnabled));
  if (lblOff) lblOff.classList.toggle('active', !isEnabled);

  if (badge) {
    if (isEnabled) {
      badge.textContent = '● NOTICE ON (RESTRICTED)';
      badge.className = 'media-status-badge active';
    } else {
      badge.textContent = '○ NOTICE OFF (MOBILE ALLOWED)';
      badge.className = 'media-status-badge disabled';
    }
  }

  if (quickBadge) {
    if (isEnabled) {
      quickBadge.textContent = 'NOTICE ON';
      quickBadge.className = 'media-status-badge active';
    } else {
      quickBadge.textContent = 'NOTICE OFF';
      quickBadge.className = 'media-status-badge disabled';
    }
  }

  if (feedback) {
    if (isEnabled) {
      feedback.className = 'mobile-mode-feedback is-restricted';
      if (feedbackIcon) feedbackIcon.textContent = '🔒';
      if (feedbackTitle) feedbackTitle.textContent = 'Mobile restriction notice is currently TURNED ON.';
      if (feedbackDesc) feedbackDesc.textContent = 'Smartphones and small screens (< 768px) see the "Best viewed on a larger screen" message. Tablets and laptops can browse freely.';
    } else {
      feedback.className = 'mobile-mode-feedback is-allowed';
      if (feedbackIcon) feedbackIcon.textContent = '📱';
      if (feedbackTitle) feedbackTitle.textContent = 'Mobile restriction notice is currently TURNED OFF.';
      if (feedbackDesc) feedbackDesc.textContent = 'Mobile phones and narrow viewports can access and browse the full website directly without restriction.';
    }
  }
}

function loadCustomizationData() {
  const data = PortfolioData.get();
  const c = data.customization || (window.DEFAULT_PORTFOLIO_DATA && DEFAULT_PORTFOLIO_DATA.customization) || {};
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  // 0. Mobile Screen Display & Restriction Mode
  const mobileResEnabled = (c.mobileRestriction && c.mobileRestriction.enabled !== undefined)
    ? c.mobileRestriction.enabled
    : true;
  renderMobileRestrictionUI(mobileResEnabled);

  // Mobile Lock Screen Customization
  const lockImage = c.mobileRestriction?.image || 'assets/images/restriction_character.png';
  const lockTitle = c.mobileRestriction?.title || 'Best viewed on a larger screen.';
  const lockDesc = c.mobileRestriction?.desc || 'For the full interactive portfolio, open this link on a desktop or tablet.';
  const lockBtnText = c.mobileRestriction?.btnText || 'Copy portfolio link';

  setVal('custLockScreenImage', lockImage);
  setVal('custLockScreenTitle', lockTitle);
  setVal('custLockScreenDesc', lockDesc);
  setVal('custLockScreenBtnText', lockBtnText);

  updateLockScreenMockup(lockImage, lockTitle, lockDesc, lockBtnText);

  // 1. Hero
  const hero = c.hero || {};
  setRangeValue('custHeroTitleSize', 'badgeHeroTitleSize', hero.titleSize ?? 8.0, ' rem');
  setRangeValue('custHeroLineHeight', 'badgeHeroLineHeight', hero.lineHeight ?? 0.88, '');
  setRangeValue('custHeroLetterSpacing', 'badgeHeroLetterSpacing', hero.letterSpacing ?? 0.015, ' em');
  setRangeValue('custHeroRoleSize', 'badgeHeroRoleSize', hero.roleSize ?? 0.88, ' rem');
  setRangeValue('custHeroTaglineSize', 'badgeHeroTaglineSize', hero.taglineSize ?? 2.4, ' rem');

  const inLine1 = document.getElementById('custHeroLine1');
  const inLine2 = document.getElementById('custHeroLine2');
  const inRole = document.getElementById('custHeroRole');
  if (inLine1) inLine1.value = hero.titleLine1 || data.profile?.titleLine1 || 'PAWAN K.';
  if (inLine2) inLine2.value = hero.titleLine2 || data.profile?.titleLine2 || 'KUSHWAHA';
  if (inRole) inRole.value = hero.role || data.profile?.role || 'PRODUCT DESIGNER';

  // 2. Profile Image
  const img = c.profileImg || {};
  setRangeValue('custProfileScale', 'badgeProfileScale', img.scale ?? 100, '%');
  setRangeValue('custProfileOffsetX', 'badgeProfileOffsetX', img.offsetX ?? 0, ' px');
  setRangeValue('custProfileOffsetY', 'badgeProfileOffsetY', img.offsetY ?? 0, ' px');

  currentProfileAlign = img.alignment || 'center';
  document.querySelectorAll('#profileAlignGroup .segment-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.align === currentProfileAlign);
  });

  setLayerOrder(img.layerOrder || 'back');

  // 3. Colors
  const colors = c.colors || {};
  applyColorValues({
    primary: colors.primary || colors.maroon || '#642B2B',
    headerBg: colors.headerBg || colors.primary || '#4F1F1F',
    boldText: colors.boldText || colors.primary || '#5C2828',
    buttons: colors.buttons || colors.primary || '#5C2828',
    maroon: colors.maroon || '#642B2B',
    maroonDark: colors.maroonDark || '#4F1F1F',
    cream: colors.cream || '#FAF9F6',
    gold: colors.gold || '#E5A93C',
    textDark: colors.textDark || '#1F1F1F'
  });

  // Match active preset chip
  document.querySelectorAll('.preset-chip').forEach(chip => {
    const key = chip.dataset.theme;
    const p = THEME_PRESETS[key];
    const isMatch = p && (
      (p.primary && p.primary.toLowerCase() === (colors.primary || '').toLowerCase()) ||
      (p.maroon && p.maroon.toLowerCase() === (colors.maroon || '').toLowerCase())
    );
    chip.classList.toggle('active', Boolean(isMatch));
  });

  // 4. Lens
  const lens = c.lens || {};
  const lensEn = document.getElementById('custLensEnabled');
  const lensTog = document.getElementById('custLensShowToggleBtn');
  if (lensEn) lensEn.checked = lens.enabled !== false;
  if (lensTog) lensTog.checked = lens.showToggleBtn !== false;
  setRangeValue('custLensSize', 'badgeLensSize', lens.size ?? 70, ' px');
  setRangeValue('custLensScale', 'badgeLensScale', lens.scale ?? 1.65, 'x');

  // 4b. Backgrounds & Parallax
  const bgs = c.backgrounds || (window.DEFAULT_PORTFOLIO_DATA && DEFAULT_PORTFOLIO_DATA.customization && DEFAULT_PORTFOLIO_DATA.customization.backgrounds);
  const setCheck = (id, chk) => {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(chk);
  };

  if (bgs) {
    ['Hero', 'Proto', 'Connect'].forEach(sec => {
      const key = (sec === 'Hero' ? 'hero' : sec === 'Proto' ? 'prototyping' : 'connect');
      const sBg = bgs[key] || {};
      const imgVal = sBg.image ?? 'assets/background.png';
      const col = sBg.color || '#55161C';
      const mode = sBg.type || (imgVal ? 'image' : 'color');

      setVal(`cust${sec}BgImage`, imgVal);
      setVal(`cust${sec}BgColor`, col);
      setVal(`cust${sec}BgColorHex`, col.toUpperCase());
      setCheck(`cust${sec}BgParallax`, sBg.parallax !== false);

      switchSectionBgMode(sec, mode);
    });

    if (bgs.hero) {
      setRangeValue('custHeroBgSpeed', 'badgeHeroBgSpeed', bgs.hero.speed ?? 1.0, 'x');
    }
    if (bgs.prototyping) {
      const protoOp = (bgs.prototyping.overlayOpacity > 1 ? bgs.prototyping.overlayOpacity : Math.round((bgs.prototyping.overlayOpacity ?? 0.35) * 100));
      setRangeValue('custProtoBgOverlay', 'badgeProtoBgOverlay', protoOp, '%');
      setRangeValue('custProtoBgSpeed', 'badgeProtoBgSpeed', bgs.prototyping.speed ?? 1.0, 'x');
    }
    if (bgs.connect) {
      const connOp = (bgs.connect.overlayOpacity > 1 ? bgs.connect.overlayOpacity : Math.round((bgs.connect.overlayOpacity ?? 0.25) * 100));
      setRangeValue('custConnectBgOverlay', 'badgeConnectBgOverlay', connOp, '%');
      setRangeValue('custConnectBgSpeed', 'badgeConnectBgSpeed', bgs.connect.speed ?? 1.0, 'x');
    }

    // Restore custom image preset thumbnail & active state if custom image was saved
    const defaultImgPresets = [
      'assets/background.png',
      'assets/images/gallery_peaks.jpg',
      'assets/images/gallery_blue_mountain.jpg',
      'assets/images/gallery_astro.png',
      'assets/images/gallery_forest.jpg',
      'assets/images/connect_moraine_lake.png'
    ];
    const heroImg = bgs.hero?.image;
    if (heroImg && !defaultImgPresets.includes(heroImg)) {
      const gUrlInp = document.getElementById('globalCustomImageUrl');
      const thumb = document.getElementById('thumbCustomImagePreset');
      if (gUrlInp) gUrlInp.value = heroImg;
      if (thumb) {
        thumb.style.backgroundImage = `url('${heroImg}')`;
        thumb.innerHTML = '';
      }
      if (bgs.hero?.type !== 'color' && bgs.prototyping?.image === heroImg && bgs.connect?.image === heroImg) {
        document.querySelectorAll('.bg-preset-card').forEach(c => c.classList.remove('active'));
        const customCard = document.getElementById('cardCustomImagePreset');
        if (customCard) customCard.classList.add('active');
      }
    }
  }

  // 5. Sections
  const sec = c.sections || {};
  setVal('custWorkTitle', sec.workTitle || 'SELECTED WORK');
  setVal('custWorkSubtitle', sec.workSubtitle || 'Ideas transformed into meaningful, functional experiences.');
  setVal('custProtoTitle', sec.protoTitle || 'PROTOTYPING');
  setVal('custProtoQuote', sec.protoQuote || 'Design is not just what it looks like and feels like. Design is how it works.');
  setVal('custGalleryTitle', sec.galleryTitle || 'FIELD NOTES & FRAMES');
  setVal('custGallerySubtitle', sec.gallerySubtitle || 'Visual journal of travels, prototypes, and material inspirations.');
  setVal('custConnectTitle', sec.connectTitle || "LET'S BUILD SOMETHING EXTRAORDINARY");
  setVal('custConnectSubtitle', sec.connectSubtitle || "Have a design challenge or exciting project in mind? Let's connect.");

  updateHeroPreview();
}

function saveCustomizationData(showToastNotification = true) {
  const data = PortfolioData.get();
  if (!data.customization) {
    data.customization = JSON.parse(JSON.stringify((window.DEFAULT_PORTFOLIO_DATA && DEFAULT_PORTFOLIO_DATA.customization) || {}));
  }

  const existingCust = data.customization || {};

  const getStr = (id, def) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : def;
  };

  const primaryCol = getStr('custColorPrimaryHex', existingCust.colors?.primary || '#642B2B');
  const headerBgCol = getStr('custColorHeaderBgHex', existingCust.colors?.headerBg || primaryCol);
  const boldTextCol = getStr('custColorBoldTextHex', existingCust.colors?.boldText || primaryCol);
  const buttonsCol = getStr('custColorButtonsHex', existingCust.colors?.buttons || primaryCol);
  const maroonCol = getStr('custColorMaroonHex', primaryCol);
  const maroonDarkCol = getStr('custColorMaroonDarkHex', headerBgCol);
  const creamCol = getStr('custColorCreamHex', existingCust.colors?.cream || '#FAF9F6');
  const goldCol = getStr('custColorGoldHex', existingCust.colors?.gold || '#E5A93C');
  const textDarkCol = getStr('custColorTextDarkHex', existingCust.colors?.textDark || '#1F1F1F');

  const existingBgs = existingCust.backgrounds || {};

  const isMobileNoticeEnabled = document.getElementById('radMobileNoticeOn')
    ? document.getElementById('radMobileNoticeOn').checked
    : (existingCust.mobileRestriction?.enabled !== false);

  const lockImage = document.getElementById('custLockScreenImage')?.value.trim() || existingCust.mobileRestriction?.image || 'assets/images/restriction_character.png';
  const lockTitle = document.getElementById('custLockScreenTitle')?.value.trim() || existingCust.mobileRestriction?.title || 'Best viewed on a larger screen.';
  const lockDesc = document.getElementById('custLockScreenDesc')?.value.trim() || existingCust.mobileRestriction?.desc || 'For the full interactive portfolio, open this link on a desktop or tablet.';
  const lockBtnText = document.getElementById('custLockScreenBtnText')?.value.trim() || existingCust.mobileRestriction?.btnText || 'Copy portfolio link';

  data.customization = {
    ...existingCust,
    mobileRestriction: {
      ...(existingCust.mobileRestriction || {}),
      enabled: isMobileNoticeEnabled,
      image: lockImage,
      title: lockTitle,
      desc: lockDesc,
      btnText: lockBtnText
    },
    colors: {
      primary: primaryCol,
      headerBg: headerBgCol,
      boldText: boldTextCol,
      buttons: buttonsCol,
      maroon: maroonCol,
      maroonDark: maroonDarkCol,
      cream: creamCol,
      gold: goldCol,
      textDark: textDarkCol
    },
    backgrounds: {
      ...existingBgs,
      hero: {
        ...(existingBgs.hero || {}),
        type: 'color',
        image: null,
        color: headerBgCol
      },
      prototyping: {
        ...(existingBgs.prototyping || {}),
        type: 'color',
        image: null,
        color: headerBgCol
      },
      connect: {
        ...(existingBgs.connect || {}),
        type: 'color',
        image: null,
        color: headerBgCol
      }
    }
  };

  const success = PortfolioData.save(data);
  syncPreviewIframe();
  if (showToastNotification) {
    if (success) {
      showToast('Appearance & Customization saved & synchronized!', 'success');
    } else {
      showToast('Failed to save customization settings.', 'error');
    }
  }
  return success;
}

function saveAllAdminChanges(showNotification = true) {
  const data = PortfolioData.get();

  // If appearance customization inputs are present, sync them into active data object
  if (document.getElementById('custColorPrimaryHex')) {
    saveCustomizationData(false);
  }

  // 1. Hero / Profile Section
  const roleVal = document.getElementById('profRole')?.value.trim();
  const line1Val = document.getElementById('profTitleLine1')?.value.trim();
  const line2Val = document.getElementById('profTitleLine2')?.value.trim();
  const ctaWorkTextVal = document.getElementById('profCtaWorkText')?.value.trim();
  const ctaWorkUrlVal = document.getElementById('profCtaWorkUrl')?.value.trim();
  const ctaStoryTextVal = document.getElementById('profCtaStoryText')?.value.trim();
  const ctaStoryUrlVal = document.getElementById('profCtaStoryUrl')?.value.trim();
  const musicSrcVal = document.getElementById('profMusicSrc')?.value.trim();

  data.profile = {
    ...data.profile,
    role: roleVal || data.profile?.role || 'PRODUCT DESIGNER',
    titleLine1: line1Val || data.profile?.titleLine1 || 'PAWAN K.',
    titleLine2: line2Val || data.profile?.titleLine2 || 'KUSHWAHA',
    ctaWorkText: ctaWorkTextVal || data.profile?.ctaWorkText || 'View My Work',
    ctaWorkUrl: ctaWorkUrlVal || data.profile?.ctaWorkUrl || '#work',
    ctaStoryText: ctaStoryTextVal || data.profile?.ctaStoryText || 'Send an Email',
    ctaStoryUrl: ctaStoryUrlVal || data.profile?.ctaStoryUrl || 'mailto:pawankushwaha1@gmail.com',
    music: {
      ...(data.profile?.music || {}),
      audioSrc: musicSrcVal || data.profile?.music?.audioSrc || 'assets/audio/ambient_lofi.wav'
    }
  };

  data.customization = data.customization || {};
  data.customization.hero = data.customization.hero || {};
  data.customization.hero.titleLine1 = data.profile.titleLine1;
  data.customization.hero.titleLine2 = data.profile.titleLine2;
  data.customization.hero.role = data.profile.role;

  // 4 Hero Cluster Cards
  data.heroCards = data.heroCards || [];
  for (let i = 1; i <= 4; i++) {
    const titleEl = document.getElementById(`heroCardTitle${i}`);
    if (titleEl) {
      const titleVal = titleEl.value.trim() || `Card ${i}`;
      const imgVal = document.getElementById(`heroCardImg${i}`)?.value.trim() || `assets/images/hero_card_${i}.jpg`;
      const vidVal = document.getElementById(`heroCardVid${i}`)?.value.trim() || '';
      const rotVal = parseFloat(document.getElementById(`heroCardRot${i}`)?.value) || 0;
      const linkVal = document.getElementById(`heroCardLink${i}`)?.value.trim() || '#work';
      const mediaTypeVal = document.querySelector(`input[name="heroMediaType${i}"]:checked`)?.value || (vidVal ? 'video' : 'image');
      const isHeroVid = mediaTypeVal === 'video' || (!mediaTypeVal && vidVal && !imgVal);

      if (isHeroVid) {
        try { localStorage.removeItem(`fast_hero_card_${i}`); } catch(e) {}
      } else if (imgVal) {
        if (!imgVal.startsWith('idb://') && !imgVal.startsWith('blob:')) {
          try { localStorage.setItem(`fast_hero_card_${i}`, imgVal); } catch(e) {}
        } else if (imgVal.startsWith('idb://') && window.PortfolioMediaDB) {
          const resolved = window.PortfolioMediaDB.resolveUrlSync(imgVal);
          if (resolved && !resolved.startsWith('idb://') && !resolved.startsWith('blob:')) {
            try { localStorage.setItem(`fast_hero_card_${i}`, resolved); } catch(e) {}
          }
        }
      }

      const existingCard = data.heroCards[i - 1] || {};
      data.heroCards[i - 1] = {
        ...existingCard,
        id: existingCard.id || `hero-card-${i}`,
        title: titleVal,
        alt: titleVal,
        mediaType: mediaTypeVal,
        image: imgVal,
        video: vidVal,
        rotation: rotVal,
        link: linkVal,
        order: i
      };
    }
  }

  // 1.5. About Me & Section Divider (Section 1)
  const aboutHeadline1El = document.getElementById('aboutHeadline1');
  if (aboutHeadline1El) {
    data.about = {
      ...data.about,
      tag: 'ABOUT ME',
      headlineLine1: aboutHeadline1El.value.trim() || data.about?.headlineLine1 || 'I DESIGN TO',
      headlineLine2: document.getElementById('aboutHeadline2')?.value.trim() || data.about?.headlineLine2 || 'MAKE IDEAS',
      headlineLine3: document.getElementById('aboutHeadline3')?.value.trim() || data.about?.headlineLine3 || 'TANGIBLE.',
      bioParagraph1: document.getElementById('aboutBio1')?.value.trim() || data.about?.bioParagraph1 || '',
      bioParagraph2: document.getElementById('aboutBio2')?.value.trim() || data.about?.bioParagraph2 || '',
      statementPhrase: document.getElementById('aboutStatement')?.value.trim() || data.about?.statementPhrase || 'Design. Make. Explore.',
      ctaText: document.getElementById('aboutCtaText')?.value.trim() || data.about?.ctaText || 'MORE ABOUT MY JOURNEY',
      ctaUrl: document.getElementById('aboutCtaUrl')?.value.trim() || data.about?.ctaUrl || 'about.html',
      portraitImage: document.getElementById('aboutPortraitImg')?.value.trim() || data.about?.portraitImage || 'assets/images/hero_card_2.jpg',
      nametagLine1: document.getElementById('aboutNametag1')?.value.trim() || data.about?.nametagLine1 || 'Pawan K.',
      nametagLine2: document.getElementById('aboutNametag2')?.value.trim() || data.about?.nametagLine2 || 'Kushwaha',
      repeatText: document.getElementById('aboutRepeatText')?.value.trim() || data.about?.repeatText || 'Ideas\nDesign\nPrototype\nRepeat.',
      toolsNote: document.getElementById('aboutToolsNote')?.value.trim() || data.about?.toolsNote || 'Tools I use to turn ideas into products.',
      tools: currentAboutTools.length > 0 ? currentAboutTools : (data.about?.tools || []),
      educationTitle: document.getElementById('aboutEduTitle')?.value.trim() || data.about?.educationTitle || 'EDUCATION',
      educationDegree: document.getElementById('aboutEduDegree')?.value.trim() || data.about?.educationDegree || 'B.Des. Industrial & Product Design',
      educationSchool: document.getElementById('aboutEduSchool')?.value.trim() || data.about?.educationSchool || 'Chandigarh University',
      focusTitle: document.getElementById('aboutFocusTitle')?.value.trim() || data.about?.focusTitle || 'FOCUS AREAS',
      focusItem1: document.getElementById('aboutFocusItem1')?.value.trim() || data.about?.focusItem1 || 'Product Design · UI/UX',
      focusItem2: document.getElementById('aboutFocusItem2')?.value.trim() || data.about?.focusItem2 || '3D Modeling · Prototyping',
      focusItem3: document.getElementById('aboutFocusItem3')?.value.trim() || data.about?.focusItem3 || 'User-Centered Design',
      beyondTitle: document.getElementById('aboutBeyondTitle')?.value.trim() || data.about?.beyondTitle || 'BEYOND DESIGN',
      beyondDesc: document.getElementById('aboutBeyondDesc')?.value.trim() || data.about?.beyondDesc || 'Exploring new tools, making physical products, and learning through hands-on experiments.'
    };

    data.sectionDivider = {
      ...data.sectionDivider,
      enabled: true,
      height: parseInt(document.getElementById('aboutDividerHeight')?.value, 10) || data.sectionDivider?.height || 72,
      text1: document.getElementById('aboutDividerText1')?.value.trim() || data.sectionDivider?.text1 || 'SELECTED WORK',
      text2: document.getElementById('aboutDividerText2')?.value.trim() || data.sectionDivider?.text2 || 'INDUSTRIAL & PRODUCT DESIGN',
      text3: document.getElementById('aboutDividerText3')?.value.trim() || data.sectionDivider?.text3 || 'TURNING IDEAS INTO PRODUCTS',
      text4: document.getElementById('aboutDividerText4')?.value.trim() || data.sectionDivider?.text4 || '3D MODELING & PROTOTYPING',
      text5: document.getElementById('aboutDividerText5')?.value.trim() || data.sectionDivider?.text5 || 'PHYSICAL & DIGITAL EXPERIENCES'
    };
  }

  // 2. Section Headers
  data.sections = data.sections || {};
  data.customization.sections = data.customization.sections || {};

  const workT = document.getElementById('workSectionTitle')?.value.trim();
  const workS = document.getElementById('workSectionSubtitle')?.value.trim();
  if (workT) { data.sections.workTitle = workT; data.workTitle = workT; data.customization.sections.workTitle = workT; }
  if (workS) { data.sections.workSubtitle = workS; data.workSubtitle = workS; data.customization.sections.workSubtitle = workS; }

  const protoT = document.getElementById('protoSectionTitle')?.value.trim();
  const protoS = document.getElementById('protoSectionSubtitle')?.value.trim();
  const protoTagline = document.getElementById('protoSectionTagline')?.value.trim();
  if (protoT) { data.sections.protoTitle = protoT; data.protoTitle = protoT; data.customization.sections.protoTitle = protoT; }
  if (protoS) { data.sections.protoSubtitle = protoS; data.protoSubtitle = protoS; data.customization.sections.protoSubtitle = protoS; }
  if (protoTagline) { data.sections.protoTagline = protoTagline; data.protoTagline = protoTagline; data.customization.sections.protoTagline = protoTagline; }

  const gallT = document.getElementById('gallerySectionTitle')?.value.trim();
  const gallS = document.getElementById('gallerySectionSubtitle')?.value.trim();
  const gallTagline = document.getElementById('gallerySectionTagline')?.value.trim();
  if (gallT) { data.sections.galleryTitle = gallT; data.galleryTitle = gallT; data.customization.sections.galleryTitle = gallT; }
  if (gallS) { data.sections.gallerySubtitle = gallS; data.gallerySubtitle = gallS; data.customization.sections.gallerySubtitle = gallS; }
  if (gallTagline) { data.sections.galleryTagline = gallTagline; data.galleryTagline = gallTagline; data.customization.sections.galleryTagline = gallTagline; }

  // 3. Connect & Footer
  const connTitleEl = document.getElementById('connTitle');
  if (connTitleEl) {
    const activeMediaType = document.querySelector('input[name="connMediaType"]:checked')?.value || 'image';
    data.connect = {
      ...data.connect,
      title: connTitleEl.value.trim() || data.connect?.title || "LET'S BUILD SOMETHING EXTRAORDINARY",
      statusBadge: document.getElementById('connStatusBadge')?.value.trim() || data.connect?.statusBadge || 'STUDIO • OPEN TO WORK',
      mediaType: activeMediaType,
      mediaSrc: document.getElementById('connMediaSrc')?.value.trim() || data.connect?.mediaSrc || 'assets/images/footer_media.jpg',
      videoSrc: document.getElementById('connVideoSrc')?.value.trim() || data.connect?.videoSrc || '',
      emailLabel: document.getElementById('connEmailLabel')?.value.trim() || data.connect?.emailLabel || 'Send an Email',
      email: document.getElementById('connEmail')?.value.trim() || data.connect?.email || 'pawankushwaha1@gmail.com',
      resumeLabel: document.getElementById('connResumeLabel')?.value.trim() || data.connect?.resumeLabel || 'Download Resume',
      resumeUrl: document.getElementById('connResumeUrl')?.value.trim() || data.connect?.resumeUrl || 'assets/PORTFOLIO.pdf',
      socials: {
        instagram: document.getElementById('connSocialInstagram')?.value.trim() || data.connect?.socials?.instagram || 'https://instagram.com',
        linkedin: document.getElementById('connSocialLinkedin')?.value.trim() || data.connect?.socials?.linkedin || 'https://linkedin.com',
        behance: document.getElementById('connSocialBehance')?.value.trim() || data.connect?.socials?.behance || 'https://behance.net',
        dribbble: document.getElementById('connSocialDribbble')?.value.trim() || data.connect?.socials?.dribbble || 'https://dribbble.com'
      },
      colophon1: document.getElementById('connColophon1')?.value.trim() || data.connect?.colophon1 || 'PAWAN K. KUSHWAHA • INDUSTRIAL DESIGNER',
      colophon2: document.getElementById('connColophon2')?.value.trim() || data.connect?.colophon2 || 'NEW DELHI, INDIA • 2026'
    };
    data.customization.sections.connectTitle = data.connect.title;
  }

  const success = PortfolioData.save(data, { skipCloudPush: true });
  updateDashboardStats();
  syncPreviewIframe();

  const btnGlobal = document.getElementById('btnGlobalSave');
  let origBtnHtml = '';
  if (showNotification && btnGlobal) {
    origBtnHtml = btnGlobal.innerHTML;
    btnGlobal.disabled = true;
    btnGlobal.style.pointerEvents = 'none';
    btnGlobal.style.opacity = '0.75';
    btnGlobal.innerHTML = '<span>⏳ Publishing to GitHub...</span>';
  }

  const restoreBtn = () => {
    if (btnGlobal && origBtnHtml) {
      btnGlobal.disabled = false;
      btnGlobal.style.pointerEvents = '';
      btnGlobal.style.opacity = '';
      btnGlobal.innerHTML = origBtnHtml;
    }
  };

  if (showNotification) {
    if (success) {
      const cloudCfg = PortfolioData.getCloudSyncConfig ? PortfolioData.getCloudSyncConfig() : null;
      if (cloudCfg && cloudCfg.enabled && cloudCfg.autoPushOnSave) {
        showToast('⏳ Syncing live to GitHub & all devices worldwide...', 'info');
        PortfolioData.pushToCloud(data).then(res => {
          restoreBtn();
          if (res.success) {
            showToast('🌐 Synced to GitHub! All devices & phones will now show your updates.', 'success');
          } else {
            showToast('⚠️ Saved locally, but GitHub sync failed: ' + res.error, 'warning');
          }
        }).catch(err => {
          restoreBtn();
          showToast('⚠️ Saved locally, but sync error: ' + err.message, 'warning');
        });
      } else {
        restoreBtn();
        showToast('Saved to this computer! To update all other devices, export to Netlify or enable Cloud Sync.', 'success');
      }
    } else {
      restoreBtn();
      showToast('Warning: Storage limit exceeded. Please reduce media file size.', 'error');
    }
  }
}
window.saveAllAdminChanges = saveAllAdminChanges;

function initAutoSave() {
  let autoSaveTimer = null;
  const adminApp = document.getElementById('adminApp');
  if (!adminApp) return;

  adminApp.addEventListener('input', (e) => {
    if (e.target.closest('.admin-modal')) return;
    if (e.target.type === 'file' || e.target.type === 'password') return;

    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      saveAllAdminChanges(false);
      const syncStatus = document.getElementById('topbarSyncStatus');
      if (syncStatus) {
        const text = syncStatus.querySelector('.live-status-text');
        if (text) {
          text.textContent = 'AUTO-SYNCED TO SITE';
          setTimeout(() => { text.textContent = 'LINKED TO LIVE SITE'; }, 2000);
        }
      }
    }, 700);
  });
}
