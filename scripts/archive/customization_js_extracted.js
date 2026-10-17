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
    primary: "#1A1A1E",
    headerBg: "#0D0D11",
    boldText: "#1A1A1E",
    buttons: "#1A1A1E",
    maroon: "#141416",
    maroonDark: "#0A0A0C",
    cream: "#F8F8FA",
    gold: "#F5A623",
    textDark: "#1A1A1A"
  },
  emerald: {
    primary: "#143D2B",
    headerBg: "#0C291C",
    boldText: "#143D2B",
    buttons: "#143D2B",
    maroon: "#183D2D",
    maroonDark: "#0E261C",
    cream: "#F4F8F5",
    gold: "#D4AF37",
    textDark: "#14221B"
  },
  indigo: {
    primary: "#1E2A4A",
    headerBg: "#111A33",
    boldText: "#1E2A4A",
    buttons: "#1E2A4A",
    maroon: "#1E293B",
    maroonDark: "#0F172A",
    cream: "#F8FAFC",
    gold: "#E28743",
    textDark: "#0F172A"
  },
  espresso: {
    primary: "#3B2518",
    headerBg: "#24160E",
    boldText: "#3B2518",
    buttons: "#3B2518",
    maroon: "#3B2A1E",
    maroonDark: "#261B13",
    cream: "#FAF6F0",
    gold: "#C89666",
    textDark: "#2B1D14"
  },
  crimson: {
    primary: "#8B0000",
    headerBg: "#5C0000",
    boldText: "#8B0000",
    buttons: "#8B0000",
    maroon: "#8B0000",
    maroonDark: "#5C0000",
    cream: "#FFF5F5",
    gold: "#FFD700",
    textDark: "#2D0A0A"
  }
};

let currentProfileAlign = 'center';
let currentProfileLayer = 'back';

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

  // Background Section Preview Live Sync
  const updateSectionBgPreview = (sec) => {
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
  };

  const switchSectionBgMode = (sec, mode) => {
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
  };

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

  // Lightweight Canvas Image Compressor (Guarantees fast loading & avoids localStorage quota overflow)
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

  // Custom Image Helper for Global Set 1
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
      const def = DEFAULT_PORTFOLIO_DATA.customization.backgrounds;
      const setInp = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
      const setCh = (id, ch) => { const el = document.getElementById(id); if (el) el.checked = ch; };

      ['Hero', 'Proto', 'Connect'].forEach(sec => {
        const key = (sec === 'Hero' ? 'hero' : sec === 'Proto' ? 'prototyping' : 'connect');
        const sDef = def[key];
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
        showToast(`Applied ${chip.querySelector('span:last-child').textContent} palette!`, 'success');
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
        data.customization = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA.customization));
        PortfolioData.save(data);
        loadCustomizationData();
        showToast('All appearance settings reset to default!', 'success');
      }
    });
  }

  // Master Save Button
  const btnSave = document.getElementById('btnSaveCustomization');
  if (btnSave) {
    btnSave.addEventListener('click', saveCustomizationData);
  }
}

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

  hex.addEventListener('input', () => {
    let val = hex.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      picker.value = val;
      if (typeof onSync === 'function') onSync(val);
      updateHeroPreview();
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

function loadCustomizationData() {
  const data = PortfolioData.get();
  const c = data.customization || DEFAULT_PORTFOLIO_DATA.customization;

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
  const bgs = c.backgrounds || DEFAULT_PORTFOLIO_DATA.customization.backgrounds;
  const setCheck = (id, chk) => {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(chk);
  };

  if (bgs) {
    ['Hero', 'Proto', 'Connect'].forEach(sec => {
      const key = (sec === 'Hero' ? 'hero' : sec === 'Proto' ? 'prototyping' : 'connect');
      const sBg = bgs[key] || {};
      const img = sBg.image ?? 'assets/background.png';
      const col = sBg.color || '#55161C';
      const mode = sBg.type || (img ? 'image' : 'color');

      setVal(`cust${sec}BgImage`, img);
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
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  setVal('custWorkTitle', sec.workTitle || 'SELECTED WORK');
  setVal('custWorkSubtitle', sec.workSubtitle || 'Ideas transformed into meaningful, functional experiences.');
  setVal('custProtoTitle', sec.protoTitle || 'PROTOTYPING WORKSHOP');
  setVal('custProtoQuote', sec.protoQuote || 'Design is not just what it looks like and feels like. Design is how it works.');
  setVal('custGalleryTitle', sec.galleryTitle || 'FIELD NOTES & FRAMES');
  setVal('custGallerySubtitle', sec.gallerySubtitle || 'Visual journal of travels, prototypes, and material inspirations.');
  setVal('custConnectTitle', sec.connectTitle || "LET'S BUILD SOMETHING EXTRAORDINARY");
  setVal('custConnectSubtitle', sec.connectSubtitle || "Have a design challenge or exciting project in mind? Let's connect.");

  updateHeroPreview();
}

function saveCustomizationData() {
  const data = PortfolioData.get();
  if (!data.customization) {
    data.customization = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA.customization));
  }

  const getNum = (id, def) => {
    const val = parseFloat(document.getElementById(id)?.value);
    return isNaN(val) ? def : val;
  };
  const getStr = (id, def) => document.getElementById(id)?.value.trim() || def;
  const getCheck = (id, def) => {
    const el = document.getElementById(id);
    return el ? el.checked : def;
  };

  data.customization = {
    hero: {
      titleSize: getNum('custHeroTitleSize', 8.0),
      lineHeight: getNum('custHeroLineHeight', 0.88),
      letterSpacing: getNum('custHeroLetterSpacing', 0.015),
      roleSize: getNum('custHeroRoleSize', 0.88),
      taglineSize: getNum('custHeroTaglineSize', 2.4),
      titleLine1: getStr('custHeroLine1', 'PAWAN K.'),
      titleLine2: getStr('custHeroLine2', 'KUSHWAHA'),
      role: getStr('custHeroRole', 'PRODUCT DESIGNER')
    },
    profileImg: {
      scale: getNum('custProfileScale', 100),
      offsetX: getNum('custProfileOffsetX', 0),
      offsetY: getNum('custProfileOffsetY', 0),
      alignment: currentProfileAlign,
      layerOrder: currentProfileLayer
    },
    colors: {
      primary: getStr('custColorPrimaryHex', '#642B2B'),
      headerBg: getStr('custColorHeaderBgHex', '#4F1F1F'),
      boldText: getStr('custColorBoldTextHex', '#5C2828'),
      buttons: getStr('custColorButtonsHex', '#5C2828'),
      maroon: getStr('custColorMaroonHex', getStr('custColorPrimaryHex', '#642B2B')),
      maroonDark: getStr('custColorMaroonDarkHex', '#4F1F1F'),
      cream: getStr('custColorCreamHex', '#FAF9F6'),
      gold: getStr('custColorGoldHex', '#E5A93C'),
      textDark: getStr('custColorTextDarkHex', '#1F1F1F')
    },
    lens: {
      enabled: getCheck('custLensEnabled', true),
      showToggleBtn: getCheck('custLensShowToggleBtn', true),
      size: getNum('custLensSize', 70),
      scale: getNum('custLensScale', 1.65)
    },
    backgrounds: {
      hero: {
        type: getStr('custHeroBgType', 'image'),
        image: getStr('custHeroBgImage', 'assets/background.png'),
        color: getStr('custHeroBgColor', '#55161C'),
        parallax: getCheck('custHeroBgParallax', true),
        speed: getNum('custHeroBgSpeed', 1.0)
      },
      prototyping: {
        type: getStr('custProtoBgType', 'image'),
        image: getStr('custProtoBgImage', 'assets/background.png'),
        color: getStr('custProtoBgColor', '#55161C'),
        parallax: getCheck('custProtoBgParallax', true),
        overlayOpacity: getNum('custProtoBgOverlay', 35) / 100,
        speed: getNum('custProtoBgSpeed', 1.0)
      },
      connect: {
        type: getStr('custConnectBgType', 'image'),
        image: getStr('custConnectBgImage', 'assets/background.png'),
        color: getStr('custConnectBgColor', '#55161C'),
        parallax: getCheck('custConnectBgParallax', true),
        overlayOpacity: getNum('custConnectBgOverlay', 25) / 100,
        speed: getNum('custConnectBgSpeed', 1.0)
      }
    },
    sections: {
      workTitle: getStr('custWorkTitle', 'SELECTED WORK'),
      workSubtitle: getStr('custWorkSubtitle', 'Ideas transformed into meaningful, functional experiences.'),
      protoTitle: getStr('custProtoTitle', 'PROTOTYPING WORKSHOP'),
      protoQuote: getStr('custProtoQuote', 'Design is not just what it looks like and feels like. Design is how it works.'),
      galleryTitle: getStr('custGalleryTitle', 'FIELD NOTES & FRAMES'),
      gallerySubtitle: getStr('custGallerySubtitle', 'Visual journal of travels, prototypes, and material inspirations.'),
      connectTitle: getStr('custConnectTitle', "LET'S BUILD SOMETHING EXTRAORDINARY"),
      connectSubtitle: getStr('custConnectSubtitle', "Have a design challenge or exciting project in mind? Let's connect.")
    }
  };

  // Sync title and role to profile block as well
  if (data.profile) {
    data.profile.titleLine1 = data.customization.hero.titleLine1;
    data.profile.titleLine2 = data.customization.hero.titleLine2;
    data.profile.name = `${data.customization.hero.titleLine1} ${data.customization.hero.titleLine2}`.trim();
    data.profile.role = data.customization.hero.role;
  }

  const success = PortfolioData.save(data);
  if (success) {
    showToast('Appearance & Customization saved & synchronized!', 'success');
  } else {
    showToast('Failed to save customization settings.', 'error');
  }
}