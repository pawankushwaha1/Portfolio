/**
 * Pawan K. Kushwaha Portfolio - Interactive Scripts
 * Handles animations, audio synthesis, lightbox, filtering, and modals
 */

document.addEventListener('DOMContentLoaded', () => {
  hydratePortfolioFromData();
  initNavbar();
  initSectionParallax();
  initSpotifyWidget();
  initMagnifierCursor();
  initWorkFilter();
  initWorkHoverTilt();
  initProjectModal();
  initGalleryLightbox();
  initGalleryViewAll();
  initContactModal();
  initPrototypesModal();
  initScrollAnimations();
  initAdminShortcut();

  // Listen for live updates from Admin Panel (same-window or another tab)
  window.addEventListener('portfolioDataUpdated', () => {
    hydratePortfolioFromData();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === 'portfolio_custom_data') {
      hydratePortfolioFromData();
    }
  });
});

/* ==========================================================================
   1. NAVBAR & MOBILE DRAWER
   ========================================================================== */
function initNavbar() {
  const header = document.getElementById('siteHeader');
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  // Sticky header class on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
    toggleBtn.classList.toggle('active');
    drawer.classList.toggle('open');
  });

  // Close drawer on link click
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.classList.remove('active');
      drawer.classList.remove('open');
    });
  });

  // Close drawer when clicking outside
  document.addEventListener('click', (e) => {
    if (drawer.classList.contains('open') && 
        !drawer.contains(e.target) && 
        !toggleBtn.contains(e.target)) {
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.classList.remove('active');
      drawer.classList.remove('open');
    }
  });

  // Logo interactive -2deg to +2deg hover tilt
  const logo = document.querySelector('.logo-script');
  if (logo) {
    logo.addEventListener('mouseenter', () => {
      logo.style.transform = 'rotate(-2deg) scale(1.06)';
    });

    logo.addEventListener('mousemove', (e) => {
      const rect = logo.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const xRatio = Math.max(0, Math.min(1, x / rect.width));
      // Continuous smooth sweep from -2deg on the left to +2deg on the right
      const angle = -2 + (xRatio * 4);
      logo.style.transform = `rotate(${angle.toFixed(1)}deg) scale(1.06)`;
    });

    logo.addEventListener('mouseleave', () => {
      logo.style.transform = '';
    });
  }

  // Active nav link highlight on scroll
  const navSections = [
    { id: 'work', href: '#work' },
    { id: 'prototyping', href: '#prototyping' },
    { id: 'gallery', href: '#gallery' },
    { id: 'connect', href: '#connect' }
  ];

  function updateActiveNav() {
    const scrollPos = window.scrollY + 140;
    let currentId = '';
    
    if (window.scrollY > 200) {
      navSections.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            currentId = id;
          }
        }
      });
    }

    navSections.forEach(({ id, href }) => {
      const deskLink = document.querySelector(`.desktop-nav a[href="${href}"]`);
      const mobLink = document.querySelector(`.mobile-nav-links a[href="${href}"]`);
      if (id === currentId) {
        deskLink?.classList.add('active');
        mobLink?.classList.add('active');
      } else {
        deskLink?.classList.remove('active');
        mobLink?.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();
}

/* ==========================================================================
   1b. SECTION BACKGROUNDS INTERACTIVE PARALLAX (HERO, PROTOTYPING, CONNECT)
   ========================================================================== */
function initSectionParallax() {
  const heroLayer = document.getElementById('heroCloudsLayer');
  const protoLayer = document.getElementById('protoBgLayer');
  const connectLayer = document.getElementById('connectBgLayer');

  const layers = [
    { el: heroLayer, key: 'hero' },
    { el: protoLayer, key: 'prototyping' },
    { el: connectLayer, key: 'connect' }
  ].filter(item => item.el !== null);

  if (layers.length === 0) return;

  // Respect accessibility preference for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    layers.forEach(item => item.el.style.transform = 'none');
    return;
  }

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let lastTimestamp = 0;

  // Cached background configuration to avoid parsing localStorage on every animation frame
  let cachedBgs = window.PortfolioData ? PortfolioData.get()?.customization?.backgrounds : null;
  const refreshBgConfig = () => {
    if (window.PortfolioData) {
      cachedBgs = PortfolioData.get()?.customization?.backgrounds;
    }
  };
  window.addEventListener('portfolioDataUpdated', refreshBgConfig);
  window.addEventListener('storage', refreshBgConfig);

  // Track cursor position across the window
  window.addEventListener('mousemove', (e) => {
    const normX = (e.clientX / window.innerWidth - 0.5) * 2;
    const normY = (e.clientY / window.innerHeight - 0.5) * 2;
    targetX = normX * 38;
    targetY = normY * 10;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
  });

  // Silky smooth LERP update loop with ambient breathing drift
  function animateLayers(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const elapsed = timestamp * 0.001;

    // Gentle ambient floating wave (even when cursor is stationary)
    const ambientX = Math.sin(elapsed * 0.8) * 5;
    const ambientY = Math.cos(elapsed * 0.6) * 3;

    currentX += (targetX + ambientX - currentX) * 0.08;
    currentY += (targetY + ambientY - currentY) * 0.08;

    layers.forEach(item => {
      const cfg = cachedBgs ? cachedBgs[item.key] : null;
      const isColor = cfg && (cfg.type === 'color' || (!cfg.image && cfg.color));

      // Don't animate parallax on solid color backdrops
      if (isColor || (cfg && cfg.parallax === false)) {
        item.el.style.transform = 'none';
      } else {
        const speed = (cfg && typeof cfg.speed === 'number') ? cfg.speed : 1.0;
        const x = (currentX * speed).toFixed(2);
        const y = (currentY * speed).toFixed(2);
        item.el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.04)`;
      }
    });

    requestAnimationFrame(animateLayers);
  }

  requestAnimationFrame(animateLayers);
}

/* ==========================================================================
   2. HERO MUSIC PLAYER (REAL AUDIO PLAY & PAUSE WITH VINYL ANIMATION)
   ========================================================================== */
function initSpotifyWidget() {
  const widget = document.getElementById('musicPlayerWidget') || document.getElementById('spotifyWidget');
  const audio = document.getElementById('heroBgAudio');
  const vinylDisc = document.getElementById('vinylDisc');
  const playIcon = document.getElementById('vinylPlayIcon');
  if (!widget) return;

  let isPlaying = false;
  let audioCtx = null;
  let synthGain = null;
  let synthOscs = [];

  // Toggle play / pause
  function toggleMusic() {
    isPlaying = !isPlaying;

    if (isPlaying) {
      startPlayback();
    } else {
      pausePlayback();
    }
  }

  function startPlayback() {
    isPlaying = true;
    widget.classList.add('playing');
    if (vinylDisc) vinylDisc.classList.add('spinning');
    if (playIcon) playIcon.innerHTML = '&#10074;&#10074;'; // Pause symbol

    // Try HTML5 Audio first
    if (audio) {
      audio.play().then(() => {
        // Playing successfully via native audio
      }).catch(err => {
        console.log('Native audio play restricted or failed, falling back to Web Audio synth:', err);
        playFallbackSynth();
      });
    } else {
      playFallbackSynth();
    }
  }

  function pausePlayback() {
    isPlaying = false;
    widget.classList.remove('playing');
    if (vinylDisc) vinylDisc.classList.remove('spinning');
    if (playIcon) playIcon.innerHTML = '&#9654;'; // Play symbol

    if (audio) {
      try { audio.pause(); } catch(e) {}
    }
    stopFallbackSynth();
  }

  // Click & Keyboard Enter/Space activation
  widget.addEventListener('click', toggleMusic);
  widget.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMusic();
    }
  });

  // Polyphonic Lo-Fi Synth Fallback (C minor 7th ambient chord: C3, Eb3, G3, Bb3)
  function playFallbackSynth() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!audioCtx) {
        audioCtx = new AudioCtxClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      synthGain = audioCtx.createGain();
      synthGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      synthGain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.6);
      synthGain.connect(audioCtx.destination);

      const chordFreqs = [130.81, 155.56, 196.00, 233.08]; // Cm7
      synthOscs = chordFreqs.map(freq => {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.connect(synthGain);
        osc.start();
        return osc;
      });
    } catch(e) {
      console.log('Web Audio failed:', e);
    }
  }

  function stopFallbackSynth() {
    if (synthGain && audioCtx) {
      try {
        synthGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
        setTimeout(() => {
          synthOscs.forEach(osc => {
            try { osc.stop(); } catch(e) {}
          });
          synthOscs = [];
        }, 300);
      } catch(e) {}
    }
  }
}

/* ==========================================================================
   2b. REALISTIC MAGNIFYING GLASS CURSOR & LIVE OPTICAL MAGNIFICATION
   ========================================================================== */
function initMagnifierCursor() {
  // Disable only on small mobile screens
  if (window.innerWidth <= 600) {
    return;
  }

  const cursor = document.getElementById('magnifierCursor');
  const zoomContent = document.getElementById('magnifierZoomContent');
  const toggleBtn = document.getElementById('magnifierToggleBtn');
  const statusText = document.getElementById('magnifierStatusText');
  const header = document.getElementById('siteHeader');
  const mainContent = document.getElementById('mainContent') || document.querySelector('main');
  const footer = document.querySelector('footer');

  if (!cursor || !zoomContent) return;

  let scale = 1.65;
  let lensRadius = 35; // Half of 70px compact pure glass lens
  let isEnabled = localStorage.getItem('portfolio_lens_enabled') !== 'false';
  let isMoving = false;
  let rafPending = false;
  let currentClientX = window.innerWidth / 2;
  let currentClientY = window.innerHeight / 2;
  let currentPageX = currentClientX + window.scrollX;
  let currentPageY = currentClientY + window.scrollY;
  let hClone = null;

  // Read initial custom lens settings from central data store
  if (window.PortfolioData) {
    const d = PortfolioData.get();
    if (d && d.customization && d.customization.lens) {
      const l = d.customization.lens;
      if (l.size) lensRadius = l.size / 2;
      if (l.scale) scale = l.scale;
      if (l.enabled === false) isEnabled = false;
      if (l.showToggleBtn === false && toggleBtn) {
        toggleBtn.style.display = 'none';
      }
    }
  }

  if (!isEnabled) {
    cursor.classList.add('disabled');
    if (toggleBtn) {
      toggleBtn.classList.add('off');
      if (statusText) statusText.textContent = 'OFF';
    }
  }

  // Clean clone: strip IDs, media, inputs, and ensure all animated cards are fully visible
  function cleanClone(node) {
    if (!node) return;
    node.removeAttribute('id');
    node.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    node.querySelectorAll('audio, video, script, iframe, .magnifier-cursor, .magnifier-toggle-btn, .modal-overlay, .lightbox-overlay').forEach(el => el.remove());
    node.querySelectorAll('a, button, input, textarea, select').forEach(el => {
      el.setAttribute('tabindex', '-1');
      el.setAttribute('aria-hidden', 'true');
    });

    // Reset entrance animation styles in the mirror so all cards are visible and aligned
    node.querySelectorAll('*').forEach(el => {
      if (el.style) {
        if (el.style.opacity === '0') {
          el.style.opacity = '1';
        }
        if (el.style.transform && el.style.transform.includes('translateY')) {
          el.style.transform = 'none';
        }
        if (el.style.transition) {
          el.style.transition = 'none';
        }
        if (el.style.visibility === 'hidden') {
          el.style.visibility = 'visible';
        }
      }
    });

    node.setAttribute('aria-hidden', 'true');
    node.style.pointerEvents = 'none';
  }

  // Build the live page mirror inside the magnifying glass lens
  function buildMirror() {
    zoomContent.innerHTML = '';
    const mirrorWrapper = document.createElement('div');
    mirrorWrapper.className = 'magnifier-mirror-wrapper';
    mirrorWrapper.style.width = document.documentElement.scrollWidth + 'px';
    mirrorWrapper.style.minHeight = document.documentElement.scrollHeight + 'px';
    mirrorWrapper.style.position = 'relative';
    mirrorWrapper.style.pointerEvents = 'none';
    mirrorWrapper.style.backgroundColor = 'var(--color-maroon)';

    if (header) {
      hClone = header.cloneNode(true);
      cleanClone(hClone);
      hClone.style.position = 'absolute';
      hClone.style.top = '0px';
      hClone.style.left = '0px';
      hClone.style.width = '100%';
      hClone.style.zIndex = '1000';
      mirrorWrapper.appendChild(hClone);
    }
    if (mainContent) {
      const mClone = mainContent.cloneNode(true);
      cleanClone(mClone);
      mirrorWrapper.appendChild(mClone);
    }
    // Only clone standalone footer if it is not already inside mainContent
    if (footer && (!mainContent || !mainContent.contains(footer))) {
      const fClone = footer.cloneNode(true);
      cleanClone(fClone);
      mirrorWrapper.appendChild(fClone);
    }

    zoomContent.appendChild(mirrorWrapper);
  }

  // Expose sync helper globally so filter pills or modals can trigger mirror refresh
  window.syncMagnifierMirror = function() {
    if (!isEnabled) return;
    buildMirror();
  };

  // Expose config update helper for real-time admin updates
  window.updateMagnifierConfig = function(lensConfig) {
    if (!lensConfig) return;
    if (lensConfig.size) {
      lensRadius = lensConfig.size / 2;
    }
    if (lensConfig.scale) {
      scale = lensConfig.scale;
    }
    if (lensConfig.enabled !== undefined) {
      isEnabled = Boolean(lensConfig.enabled);
      if (!isEnabled) {
        cursor.classList.add('disabled');
        if (toggleBtn) {
          toggleBtn.classList.add('off');
          if (statusText) statusText.textContent = 'OFF';
        }
      } else {
        cursor.classList.remove('disabled');
        if (toggleBtn) {
          toggleBtn.classList.remove('off');
          if (statusText) statusText.textContent = 'ON';
        }
      }
    }
    if (lensConfig.showToggleBtn !== undefined && toggleBtn) {
      toggleBtn.style.display = lensConfig.showToggleBtn ? '' : 'none';
    }
    scheduleRender();
  };

  buildMirror();

  // Re-sync mirror after all images, fonts, and assets have settled
  window.addEventListener('load', () => {
    setTimeout(buildMirror, 300);
  });

  window.addEventListener('resize', () => {
    buildMirror();
    scheduleRender();
  });

  // Update lens position & live optical magnification
  function render() {
    rafPending = false;
    if (!isEnabled) return;

    // Center lens over mouse pointer (hotspot at lens center)
    cursor.style.transform = `translate3d(${currentClientX - lensRadius}px, ${currentClientY - lensRadius}px, 0)`;

    // Keep cloned header aligned with the real sticky viewport header
    if (hClone) {
      hClone.style.transform = `translate3d(0, ${window.scrollY}px, 0)`;
      if (header && header.classList.contains('scrolled')) {
        hClone.classList.add('scrolled');
      } else {
        hClone.classList.remove('scrolled');
      }
    }

    // Optical Zoom Formula:
    // Focal point (pageX, pageY) is enlarged by 'scale' and aligned at (lensRadius, lensRadius)
    const tx = lensRadius - (currentPageX * scale);
    const ty = lensRadius - (currentPageY * scale);
    zoomContent.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
  }

  function scheduleRender() {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(render);
    }
  }

  // Mouse movement listener
  window.addEventListener('mousemove', (e) => {
    currentClientX = e.clientX;
    currentClientY = e.clientY;
    currentPageX = e.pageX;
    currentPageY = e.pageY;

    if (!isMoving && isEnabled) {
      isMoving = true;
      cursor.classList.add('active');
    }

    scheduleRender();
  }, { passive: true });

  // Scroll listener: keep magnification focal point accurately aligned
  window.addEventListener('scroll', () => {
    currentPageX = currentClientX + window.scrollX;
    currentPageY = currentClientY + window.scrollY;
    scheduleRender();
  }, { passive: true });

  // Hide magnifier when cursor exits window
  document.addEventListener('mouseleave', () => {
    cursor.classList.remove('active');
    isMoving = false;
  });

  document.addEventListener('mouseenter', (e) => {
    if (isEnabled) {
      if (e.clientX !== undefined) {
        currentClientX = e.clientX;
        currentClientY = e.clientY;
        currentPageX = currentClientX + window.scrollX;
        currentPageY = currentClientY + window.scrollY;
      }
      cursor.classList.add('active');
      isMoving = true;
      scheduleRender();
    }
  });

  // Toggle Functionality (Click Button or press 'M' key)
  function toggleMagnifier() {
    isEnabled = !isEnabled;
    if (isEnabled) {
      cursor.classList.remove('disabled');
      cursor.classList.add('active');
      if (toggleBtn) {
        toggleBtn.classList.remove('off');
        if (statusText) statusText.textContent = 'ON';
      }
      buildMirror();
      scheduleRender();
    } else {
      cursor.classList.remove('active');
      cursor.classList.add('disabled');
      if (toggleBtn) {
        toggleBtn.classList.add('off');
        if (statusText) statusText.textContent = 'OFF';
      }
    }
    try {
      localStorage.setItem('portfolio_lens_enabled', isEnabled ? 'true' : 'false');
    } catch(e) {}
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleMagnifier);
  }

  window.addEventListener('keydown', (e) => {
    // Avoid triggering when user is typing in form inputs or textareas
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }
    if (e.key === 'm' || e.key === 'M') {
      toggleMagnifier();
    }
  });
}

/* ==========================================================================
   3. SELECTED WORK FILTERING
   ========================================================================== */
function initWorkFilter() {
  const filterPills = document.querySelectorAll('.filter-pill');
  const workCards = document.querySelectorAll('.work-card');

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      // Update active pill
      filterPills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');

      const filterValue = pill.dataset.category;

      // Filter work cards with smooth opacity transition
      workCards.forEach(card => {
        const cardCategories = card.dataset.category.split(' ');
        if (filterValue === 'all' || cardCategories.includes(filterValue)) {
          card.classList.remove('hidden');
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = '';
          }, 30);
        } else {
          card.classList.add('hidden');
        }
      });

      if (window.syncMagnifierMirror) {
        setTimeout(window.syncMagnifierMirror, 80);
      }
    });
  });
}

/* ==========================================================================
   3b. SELECTED WORK HOVER TILT (-2deg to +2deg)
   ========================================================================== */
function initWorkHoverTilt() {
  const workCards = document.querySelectorAll('.work-card');

  workCards.forEach((card, index) => {
    // Dynamic hover tilt: odd cards tilt to -2deg, even cards tilt to +2deg
    card.addEventListener('mouseenter', () => {
      const initialAngle = (index % 2 === 0) ? -2 : 2;
      card.style.transform = `rotate(${initialAngle}deg) translateY(-8px) scale(1.02)`;
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const xRatio = Math.max(0, Math.min(1, x / rect.width));
      // Subtle sweep from -2deg on the left edge to +2deg on the right edge
      const angle = -2 + (xRatio * 4);
      card.style.transform = `rotate(${angle.toFixed(1)}deg) translateY(-8px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      // Revert to CSS resting state
      card.style.transform = '';
    });
  });
}

/* ==========================================================================
   4. PROJECT CASE STUDY MODAL
   ========================================================================== */
const projectData = {
  // --- PRODUCT DESIGN (7 Projects) ---
  luma: {
    title: "LUMA — Minimalist Modular Desk Lamp",
    tag: "CAD → 3D Print",
    category: "PRODUCT DESIGN",
    image: "assets/images/work_luma.jpg",
    description: "LUMA is an exploration in reductive industrial design and thermal management. A minimalist modular desk lamp exploring diffused warm lighting and ergonomic pivot points. Machined from billet 6061 aluminum with an integrated capacitive touch slider in the base, LUMA offers continuous dimming and circadian color-temperature tuning.",
    timeline: "4 Months (2024)",
    role: "Lead Industrial Designer & Prototyper",
    tools: "Autodesk Fusion 360, Keyshot, SLA 3D Printing, CNC Milling",
    deliverable: "DFM CAD Packages, Working Functional Prototype, Bill of Materials"
  },
  analog: {
    title: "ANALOG — Tactile Digital Camera",
    tag: "Concept CAD",
    category: "INDUSTRIAL DESIGN",
    image: "assets/images/work_analog.jpg",
    description: "A tactile digital camera concept prioritizing mechanical feedback with physical click wheels and vintage ergonomics. In an era of frictionless touchscreens, ANALOG restores the tactile joy of photography through knurled aluminum control dials, mechanical shutter release clickers, and an organic status display inspired by 1970s rangefinders.",
    timeline: "3 Months (2024)",
    role: "Hardware UI/UX & Ergonomics Engineer",
    tools: "SolidWorks, KeyShot 11, Foam Prototyping, Arduino Micro",
    deliverable: "Ergonomic Rig Studies, Working PCB Enclosure, Production Ready CAD"
  },
  gantri: {
    title: "GANTRI LAMP — Additive Zero-Waste Desktop Luminaire",
    tag: "Additive DFM",
    category: "PRODUCT DESIGN",
    image: "assets/images/work_gantri.jpg",
    description: "Developed in close collaboration with Gantri, exploring sustainable plant-based polymers and zero-waste additive manufacturing. Features balanced weighted geometry, hidden wiring channels, and parametric diffusion ribs that cast a gentle, glare-free working light.",
    timeline: "3 Months (2024)",
    role: "Industrial Design & Additive DFM Specialist",
    tools: "Rhino 3D, Grasshopper, KeyShot, FDM Production Tooling",
    deliverable: "Toolpath Calibrations, Production CAD, Assembly Instructions"
  },
  kinetic_chair: {
    title: "KINETIC CHAIR — Ergonomic Bent Plywood Study",
    tag: "Scale Prototyping",
    category: "FURNITURE DESIGN",
    image: "assets/images/work_chair.jpg",
    description: "An architectural exploration into human spine kinematics and lightweight cantilevered seating. Developed through 1:5 scale paperboard maquettes, laser-cut veneer laminations, and 1:1 CNC-bent ergonomic testing bucks.",
    timeline: "4 Months (2023 - 2024)",
    role: "Furniture & Ergonomics Designer",
    tools: "AutoCAD, SolidWorks, CNC Router, Vacuum Press Lamination",
    deliverable: "1:5 Scale Study Models, 1:1 Full Scale Prototype, Structural FEA"
  },
  modu_bottles: {
    title: "MODU BOTTLE — Interlocking Sustainable Hydration System",
    tag: "Blow Molding CAD",
    category: "INDUSTRIAL DESIGN",
    image: "assets/images/work_bottles.jpg",
    description: "A parametric interlocking bottle architecture engineered to optimize shipping volumetric density by 28% and eliminate secondary packaging. Molded with thin-wall structural ribbing that reduces virgin polymer consumption while providing superior drop resistance.",
    timeline: "2 Months (2024)",
    role: "Packaging & Sustainable ID Consultant",
    tools: "PTC Creo, KeyShot Studio, SLA Scale Testing, Moldflow Analysis",
    deliverable: "Blow Mold Tooling CAD, Parting Line Specs, Material Savings Study"
  },
  chassis_m1: {
    title: "CHASSIS M1 — Machined Mechanical Camera Body",
    tag: "Class-A Surfacing",
    category: "HARDWARE DESIGN",
    image: "assets/images/work_chassis.jpg",
    description: "A precision billet 6061-T6 aluminum rangefinder body engineered with continuous G2 curvature and tactile knurled control interfaces. Houses internal optical sensor modules and a quick-swap mechanical battery sled.",
    timeline: "5 Months (2024)",
    role: "Principal Hardware Systems Designer",
    tools: "Autodesk Alias, Fusion 360, 5-Axis CNC Milling, Anodizing Lab",
    deliverable: "Class-A Surface STEP Files, GD&T Drawings, Working Anodized Chassis"
  },
  apex_gears: {
    title: "APEX GEARS — High-Durability Micro Planetary Geartrain",
    tag: "Additive Tooling",
    category: "MECHANICAL DESIGN",
    image: "assets/images/work_gears.jpg",
    description: "Engineered micro-extrusion additive toolpaths for high-tolerance involute gears. Built for low-volume precision mechatronic actuators requiring zero backlash and long-cycle friction durability.",
    timeline: "3 Months (2024)",
    role: "Mechatronic Fabrication Engineer",
    tools: "SolidWorks Motion, GearTeq, Direct-Drive Micro Extruder",
    deliverable: "Gear Involute DFM, Backlash Analysis Report, Functional Actuator"
  },

  // --- UI/UX DESIGN (3 Projects) ---
  breathe: {
    title: "BREATHE — Mindful Living & Alpine Meditation App",
    tag: "Figma Prototype",
    category: "UI/UX DESIGN",
    image: "assets/images/work_breathe.png",
    description: "A mindful living and alpine meditation app designed with calm typography and serene pacing. BREATHE synchronizes breathing cadences with subtle linear resonant haptic pulses. By pairing a pebble-sized pocket stone with an iOS companion, users regulate stress without gazing at glowing screens.",
    timeline: "5 Months (2023 - 2024)",
    role: "Product Designer & Interaction Architect",
    tools: "Figma, Principle, Swift / CoreHaptics, Soft-Touch Silicone Overmolding",
    deliverable: "Complete Design System, BLE Communication Specs, High-Fi Prototype"
  },
  pulse_os: {
    title: "PULSE OS — Connected Sports Telemetry Design System",
    tag: "Design System",
    category: "UI/UX DESIGN",
    image: "assets/images/work_pulse.jpg",
    description: "A high-performance dark-mode health telemetry companion designed for endurance athletes. Synthesizes continuous VO2 max telemetry, biometric HRV spikes, and real-time pacing recommendations into ultra-readable micro-visualizations.",
    timeline: "4 Months (2024)",
    role: "Lead UI/UX Architect",
    tools: "Figma, Tokens Studio, Framer, React Native Prototype",
    deliverable: "Multi-Platform Design System, Micro-Interactions, Usability Study"
  },
  aether_dash: {
    title: "AETHER DASH — Spatial Audio Studio Controller",
    tag: "SaaS Platform",
    category: "PRODUCT UI",
    image: "assets/images/work_aether.jpg",
    description: "A multi-touch tablet and desktop spatial audio workstation interface. Empowers audio engineers to position 3D object-based sound coordinates in real-time with responsive 3D sphere gyros, multi-band FFT equalizers, and haptic slider rails.",
    timeline: "3 Months (2024)",
    role: "Senior Product Designer & Sound Interaction Lead",
    tools: "Figma, Web Audio API, Three.js, TailwindCSS",
    deliverable: "Interactive Web Prototype, Accessibility Spec, Component Library"
  },

  // --- GRAPHIC DESIGN (5 Projects) ---
  movietime: {
    title: "MOVIE TIME — Retro-Inspired Cinematic Poster Series",
    tag: "Risograph Print",
    category: "GRAPHIC DESIGN",
    image: "assets/images/work_movietime.jpg",
    description: "Retro-inspired cinematic poster series honoring classic storytelling with textured risograph print aesthetics, vivid color harmonies, and timeless graphic composition. Curated cinema discovery platform with interactive community reviews and personalized recommendations.",
    timeline: "3 Months (2023)",
    role: "Full-Stack Product Designer",
    tools: "Figma, React, TailwindCSS, TMDB API, Framer Motion",
    deliverable: "Responsive Web Application, User Journey Maps, Micro-Interactions"
  },
  vinyl_grooves: {
    title: "VINYL GROOVES — Geometric Music Identity & Album Packaging",
    tag: "Album Packaging",
    category: "GRAPHIC DESIGN",
    image: "assets/images/work_vinyl_poster.jpg",
    description: "A striking minimalist record packaging identity exploring the intersection of radial analog grooves and linear piano keys. Features die-cut center sleeves, matte debossed letterpress typography, and custom gatefold art.",
    timeline: "2 Months (2023)",
    role: "Graphic Designer & Art Director",
    tools: "Adobe Illustrator, Photoshop, InDesign, Spot UV Screen Printing",
    deliverable: "12-Inch Gatefold Sleeve, Disc Label Typography, Press Kit"
  },
  surreal_sound: {
    title: "SURREAL AUDIO — Conceptual Analog Sound Identity",
    tag: "Editorial Print",
    category: "BRAND IDENTITY",
    image: "assets/images/work_surreal_audio.jpg",
    description: "An editorial artwork series celebrating tactile vinyl culture and analog warmth. Blends surrealist collage with bespoke serif typography, honoring heritage recording studios and independent vinyl pressing plants.",
    timeline: "2 Months (2024)",
    role: "Brand Identity Designer",
    tools: "Adobe Photoshop, Scanography, Mixed Media Collage",
    deliverable: "Brand Identity Guidelines, Vinyl Jacket Series, Poster Run"
  },
  cinema_noir: {
    title: "CINEMA NOIR — 35mm Independent Film Festival Identity",
    tag: "Screen Print",
    category: "POSTER DESIGN",
    image: "assets/images/work_cinema_reel.jpg",
    description: "Dynamic typographic and motion branding for an international independent cinema festival. Utilizes kinetic 35mm celluloid film loops, silver-foil stamped program guides, and high-contrast duotone silkscreen posters.",
    timeline: "3 Months (2023)",
    role: "Visual Designer & Identity Lead",
    tools: "Illustrator, After Effects, Silkscreen Hand Printing",
    deliverable: "Festival Identity System, Screen-Printed Poster Suite, Trailer Motion"
  },
  heroic_horizons: {
    title: "HEROIC HORIZONS — Cinematic Blockbuster Art & Layout",
    tag: "Cinematic Layout",
    category: "POSTER ART",
    image: "assets/images/work_avengers_poster.jpg",
    description: "Complex multi-figure character orchestration and atmospheric lighting design celebrating modern cinematic epics. Explores dramatic depth hierarchies, particle destruction overlays, and distressed risograph type lockups.",
    timeline: "2 Months (2023)",
    role: "Key Art Illustrator & Compositor",
    tools: "Photoshop, Cinema 4D, Custom Brushes, Large Format Offset",
    deliverable: "Bus Shelter Key Art, Collector's Edition Foil Print, Promo Assets"
  }
};

function initProjectModal() {
  const cards = document.querySelectorAll('.work-card');
  const triggerBtns = document.querySelectorAll('[data-project]');

  function navigateToProject(id) {
    if (!id) return;
    window.location.href = `project.html?id=${encodeURIComponent(id)}`;
  }

  cards.forEach(card => {
    card.style.cursor = 'pointer';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'link');

    card.addEventListener('click', (e) => {
      const id = card.dataset.id;
      navigateToProject(id);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = card.dataset.id;
        navigateToProject(id);
      }
    });
  });

  triggerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.project;
      navigateToProject(id);
    });
  });
}

/* ==========================================================================
   5. FULLSCREEN GALLERY LIGHTBOX
   ========================================================================== */
function initGalleryLightbox() {
  const lightbox = document.getElementById('galleryLightbox');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  const imgEl = document.getElementById('lightboxImg');
  const captionEl = document.getElementById('lightboxCaption');
  const counterEl = document.getElementById('lightboxCounter');
  const galleryCards = document.querySelectorAll('.gallery-card');

  const galleryItems = Array.from(galleryCards).map(card => ({
    src: card.dataset.src,
    caption: card.dataset.caption
  }));

  let currentIndex = 0;

  function showImage(index) {
    if (index < 0) index = galleryItems.length - 1;
    if (index >= galleryItems.length) index = 0;
    currentIndex = index;

    imgEl.src = galleryItems[currentIndex].src;
    imgEl.alt = galleryItems[currentIndex].caption;
    captionEl.textContent = galleryItems[currentIndex].caption;
    counterEl.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
  }

  galleryCards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      showImage(idx);
      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showImage(currentIndex - 1);
  });
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showImage(currentIndex + 1);
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-center')) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
  });
}

/* ==========================================================================
   5b. GALLERY VIEW ALL IN-PLACE EXPANSION
   ========================================================================== */
function initGalleryViewAll() {
  const viewBtn = document.getElementById('galleryViewAllBtn');
  const extraCards = document.querySelectorAll('.gallery-card.extra-gallery-card');

  let isExpanded = false;

  if (viewBtn) {
    viewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      isExpanded = !isExpanded;

      if (isExpanded) {
        extraCards.forEach((card, i) => {
          card.classList.add('is-visible');
          card.style.opacity = '0';
          card.style.transform = 'translateY(24px)';
          card.style.transition = `opacity 0.4s ease ${i * 0.05}s, transform 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) ${i * 0.05}s`;

          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 30 + i * 50);

          setTimeout(() => {
            card.style.transition = '';
            card.style.transform = '';
          }, 450 + i * 50);
        });

        viewBtn.innerHTML = `<span>Show Less</span> <span class="btn-arrow">&uarr;</span>`;
        viewBtn.setAttribute('aria-expanded', 'true');
      } else {
        extraCards.forEach((card) => {
          card.classList.remove('is-visible');
          card.style.opacity = '';
          card.style.transform = '';
          card.style.transition = '';
        });

        viewBtn.innerHTML = `<span>View All</span> <span class="btn-arrow">&rarr;</span>`;
        viewBtn.setAttribute('aria-expanded', 'false');

        // Smooth scroll back to top of gallery section
        const gallerySection = document.getElementById('gallery');
        if (gallerySection) {
          gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }
}

/* ==========================================================================
   6. CONTACT MODAL & EMAIL DRAWER
   ========================================================================== */
function initContactModal() {
  const contactModal = document.getElementById('contactModal');
  const closeContactBtn = document.getElementById('closeContactModal');
  const shootEmailBtn = document.getElementById('shootEmailBtn');
  const contactForm = document.getElementById('contactForm');
  const downloadResumeBtn = document.getElementById('downloadResumeBtn');

  function openContactModal(e) {
    if (e) e.preventDefault();
    contactModal.classList.add('active');
    contactModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeContactModal() {
    contactModal.classList.remove('active');
    contactModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (shootEmailBtn) shootEmailBtn.addEventListener('click', openContactModal);
  if (closeContactBtn) closeContactBtn.addEventListener('click', closeContactModal);

  contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) closeContactModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal.classList.contains('active')) {
      closeContactModal();
    }
  });

  // Contact form submission feedback
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const sendBtn = document.getElementById('sendMessageBtn');
      sendBtn.innerHTML = `<span>Message Sent Successfully! &check;</span>`;
      sendBtn.style.backgroundColor = '#1DB954';
      setTimeout(() => {
        closeContactModal();
        contactForm.reset();
        sendBtn.innerHTML = `<span>Send Message</span> <span class="btn-arrow">&rarr;</span>`;
        sendBtn.style.backgroundColor = '';
      }, 1500);
    });
  }

  // Resume download feedback
  if (downloadResumeBtn) {
    downloadResumeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Downloading Pawan K. Kushwaha - Product Design Resume (PDF)...');
    });
  }
}

/* ==========================================================================
   7. PROTOTYPES WORKSHOP & EXPANDABLE CARDS
   ========================================================================== */
function initPrototypesModal() {
  const protoModal = document.getElementById('prototypesModal');
  const viewBtn = document.getElementById('viewPrototypesBtn');
  const closeBtn = document.getElementById('closePrototypesModal');
  const polaroids = document.querySelectorAll('.polaroid-card');
  const extraCards = document.querySelectorAll('.polaroid-card.extra-card');

  let isExpanded = false;

  function openProtoModal() {
    if (!protoModal) return;
    protoModal.classList.add('active');
    protoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeProtoModal() {
    if (!protoModal) return;
    protoModal.classList.remove('active');
    protoModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Toggle more prototype cards in the same section on "View All" click
  if (viewBtn) {
    viewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      isExpanded = !isExpanded;

      if (isExpanded) {
        extraCards.forEach((card, i) => {
          card.classList.add('is-visible');
          card.style.opacity = '0';
          card.style.transform = 'translateY(24px)';
          card.style.transition = `opacity 0.4s ease ${i * 0.08}s, transform 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) ${i * 0.08}s`;
          
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = ''; // revert to CSS resting angle so tilt classes & hover work!
          }, 40 + i * 80);

          setTimeout(() => {
            card.style.transition = '';
          }, 500 + i * 80);
        });

        viewBtn.innerHTML = `<span>Show Less</span> <span class="btn-arrow">&uarr;</span>`;
        viewBtn.setAttribute('aria-expanded', 'true');
      } else {
        extraCards.forEach((card) => {
          card.classList.remove('is-visible');
          card.style.opacity = '';
          card.style.transform = '';
          card.style.transition = '';
        });

        viewBtn.innerHTML = `<span>View All</span> <span class="btn-arrow">&rarr;</span>`;
        viewBtn.setAttribute('aria-expanded', 'false');

        // Smooth scroll back to prototyping section
        const protoSection = document.getElementById('prototyping');
        if (protoSection) {
          protoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeProtoModal);

  // Polaroid cards click to open workshop modal and interactive hover tilt (-2deg to +2deg)
  polaroids.forEach((card, index) => {
    card.addEventListener('click', openProtoModal);

    // Dynamic hover tilt: tilts slightly between -2deg and +2deg
    card.addEventListener('mouseenter', () => {
      const initialAngle = (index % 2 === 0) ? -2 : 2;
      card.style.transform = `rotate(${initialAngle}deg) translateY(-8px) scale(1.03)`;
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const xRatio = Math.max(0, Math.min(1, x / rect.width));
      // Subtle sweep from -2deg on the left edge to +2deg on the right edge
      const angle = -2 + (xRatio * 4);
      card.style.transform = `rotate(${angle.toFixed(1)}deg) translateY(-8px) scale(1.03)`;
    });

    card.addEventListener('mouseleave', () => {
      // Revert to CSS class resting angle
      card.style.transform = '';
    });
  });

  if (protoModal) {
    protoModal.addEventListener('click', (e) => {
      if (e.target === protoModal) closeProtoModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && protoModal && protoModal.classList.contains('active')) {
      closeProtoModal();
    }
  });
}

/* ==========================================================================
   8. SCROLL-DRIVEN ENTRANCE ANIMATIONS
   ========================================================================== */
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '80px 0px 40px 0px',
    threshold: 0.02
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = '';
        setTimeout(() => {
          entry.target.style.transition = '';
        }, 650);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Group elements section by section so each section's entrance starts immediately at 0s
  const sectionConfigs = [
    { selector: '#work .work-card:not(.hidden)', stagger: 0.07 },
    { selector: '#prototyping .polaroid-card:not(.extra-card)', stagger: 0.07 },
    { selector: '#gallery .gallery-card:not(.extra-gallery-card)', stagger: 0.05 },
    // Merged Let's Connect & Footer: whole container enters as ONE unified block with 0s delay
    { selector: '#connect .section-container', stagger: 0 }
  ];

  const allAnimated = [];

  sectionConfigs.forEach(sec => {
    const items = document.querySelectorAll(sec.selector);
    items.forEach((el, idx) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      const delay = (idx * sec.stagger).toFixed(3);
      el.style.transition = `opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`;
      observer.observe(el);
      allAnimated.push(el);
    });
  });

  // Failsafe scroll listener to guarantee all elements in viewport are always visible
  const checkVisibility = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    allAnimated.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < vh + 100 && r.bottom > -100) {
        el.style.opacity = '1';
        el.style.transform = '';
      }
    });
  };
  window.addEventListener('scroll', checkVisibility, { passive: true });
  // Initial check on load
  setTimeout(checkVisibility, 200);
}

/* ==========================================================================
   9. DYNAMIC HYDRATION FROM CENTRAL DATA STORE (ADMIN PANEL SYNC)
   ========================================================================== */
function hydratePortfolioFromData() {
  if (!window.PortfolioData) return;
  const data = PortfolioData.get();
  if (!data) return;

  // 0. Dynamic Appearance & Customization (CSS Tokens, Typography, Profile Image, Layering, Lens)
  const cust = data.customization;
  if (cust) {
    const root = document.documentElement;

    // A. Brand Color Tokens
    if (cust.colors) {
      const primary = cust.colors.primary || cust.colors.maroon || '#642B2B';
      const headerBg = cust.colors.headerBg || cust.colors.maroonDark || primary;
      const boldText = cust.colors.boldText || cust.colors.maroon || primary;
      const buttons = cust.colors.buttons || cust.colors.maroon || primary;
      const cream = cust.colors.cream || '#FAF9F6';
      const gold = cust.colors.gold || '#E5A93C';
      const textDark = cust.colors.textDark || '#1F1F1F';

      root.style.setProperty('--primary-theme-color', primary);
      root.style.setProperty('--header-bg-color', headerBg);
      root.style.setProperty('--bold-heading-color', boldText);
      root.style.setProperty('--btn-theme-color', buttons);
      root.style.setProperty('--color-maroon', primary);
      root.style.setProperty('--color-maroon-dark', headerBg);
      root.style.setProperty('--color-cream', cream);
      root.style.setProperty('--color-gold', gold);
      root.style.setProperty('--color-text-dark', textDark);
    }

    // B. Hero Typography Tokens & Text
    if (cust.hero) {
      if (cust.hero.titleSize) {
        root.style.setProperty('--hero-title-size', `${cust.hero.titleSize}rem`);
      }
      if (cust.hero.lineHeight) {
        root.style.setProperty('--hero-line-height', cust.hero.lineHeight);
      }
      if (cust.hero.letterSpacing !== undefined) {
        root.style.setProperty('--hero-letter-spacing', `${cust.hero.letterSpacing}em`);
      }
      if (cust.hero.roleSize) {
        root.style.setProperty('--hero-role-size', `${cust.hero.roleSize}rem`);
      }
      if (cust.hero.taglineSize) {
        root.style.setProperty('--hero-tagline-size', `${cust.hero.taglineSize}rem`);
      }
      if (cust.hero.titleLine1) {
        const titleLine1 = document.querySelector('.hero-title .title-line:nth-child(1)');
        if (titleLine1) titleLine1.textContent = cust.hero.titleLine1;
      }
      if (cust.hero.titleLine2) {
        const titleLine2 = document.querySelector('.hero-title .title-line:nth-child(2)');
        if (titleLine2) titleLine2.textContent = cust.hero.titleLine2;
      }
      if (cust.hero.role) {
        const roleEl = document.querySelector('.hero-role');
        if (roleEl) roleEl.textContent = cust.hero.role;
      }
    }

    // C. Profile Picture Adjustment, Alignment & Layer Ordering (Bring to Front vs Back)
    if (cust.profileImg) {
      const img = cust.profileImg;
      const scale = (img.scale !== undefined ? img.scale : 100) / 100;
      const offsetX = img.offsetX || 0;
      const offsetY = img.offsetY || 0;
      const align = img.alignment || 'center';
      
      // Layer ordering: back = 1 (behind text), front = 5 (in front of text), wave-front = 15 (over wave)
      let zIndex = 1;
      if (img.layerOrder === 'front') zIndex = 5;
      else if (img.layerOrder === 'wave-front') zIndex = 15;

      root.style.setProperty('--profile-scale', scale);
      root.style.setProperty('--profile-offset-x', `${offsetX}px`);
      root.style.setProperty('--profile-offset-y', `${offsetY}px`);
      root.style.setProperty('--profile-align', align);
      root.style.setProperty('--profile-z-index', zIndex);
    }

    // D. Magnifying Lens Optics & Controls
    if (cust.lens) {
      const lens = cust.lens;
      if (lens.size) {
        root.style.setProperty('--lens-size', `${lens.size}px`);
      }
      if (window.updateMagnifierConfig) {
        window.updateMagnifierConfig(lens);
      }
    }

    // D2. Section Backgrounds & Parallax Configuration (Hero, Prototyping, Connect)
    if (cust.backgrounds) {
      const bgs = cust.backgrounds;
      // Hero Background
      if (bgs.hero) {
        const heroLayer = document.getElementById('heroCloudsLayer');
        const heroSec = document.getElementById('hero') || document.querySelector('.hero-section');
        const isColor = bgs.hero.type === 'color' || (!bgs.hero.image && bgs.hero.color);
        const colorVal = bgs.hero.color || '#55161C';
        if (isColor) {
          root.style.setProperty('--hero-bg-color', colorVal);
          root.style.setProperty('--hero-bg-image', 'none');
        } else if (bgs.hero.image) {
          root.style.setProperty('--hero-bg-image', `url('${bgs.hero.image}')`);
          root.style.setProperty('--hero-bg-color', 'transparent');
        }
        if (heroSec && isColor) {
          heroSec.style.backgroundColor = colorVal;
        }
        if (heroLayer) {
          if (!isColor && bgs.hero.image) {
            heroLayer.style.backgroundImage = `url('${bgs.hero.image}')`;
            heroLayer.style.backgroundColor = 'transparent';
            heroLayer.style.display = 'block';
          } else {
            heroLayer.style.backgroundImage = 'none';
            heroLayer.style.backgroundColor = colorVal;
            heroLayer.style.display = 'block';
          }
        }
      }
      // Prototyping Background
      if (bgs.prototyping) {
        const protoLayer = document.getElementById('protoBgLayer');
        const protoSec = document.getElementById('prototyping') || document.querySelector('.prototyping-section');
        const isColor = bgs.prototyping.type === 'color' || (!bgs.prototyping.image && bgs.prototyping.color);
        const colorVal = bgs.prototyping.color || '#55161C';
        if (isColor) {
          root.style.setProperty('--proto-bg-color', colorVal);
          root.style.setProperty('--proto-bg-image', 'none');
        } else if (bgs.prototyping.image) {
          root.style.setProperty('--proto-bg-image', `url('${bgs.prototyping.image}')`);
          root.style.setProperty('--proto-bg-color', 'transparent');
        }
        if (protoSec && isColor) {
          protoSec.style.backgroundColor = colorVal;
        }
        if (protoLayer) {
          if (!isColor && bgs.prototyping.image) {
            protoLayer.style.backgroundImage = `url('${bgs.prototyping.image}')`;
            protoLayer.style.backgroundColor = 'transparent';
            protoLayer.style.display = 'block';
          } else {
            protoLayer.style.backgroundImage = 'none';
            protoLayer.style.backgroundColor = colorVal;
            protoLayer.style.display = 'block';
          }
        }
        if (bgs.prototyping.overlayOpacity !== undefined) {
          const op = (bgs.prototyping.overlayOpacity > 1 ? bgs.prototyping.overlayOpacity / 100 : bgs.prototyping.overlayOpacity);
          root.style.setProperty('--proto-overlay-opacity', op);
        }
      }
      // Connect Background
      if (bgs.connect) {
        const connectLayer = document.getElementById('connectBgLayer');
        const connectSec = document.getElementById('connect') || document.querySelector('.connect-section');
        const isColor = bgs.connect.type === 'color' || (!bgs.connect.image && bgs.connect.color);
        const colorVal = bgs.connect.color || '#55161C';
        if (isColor) {
          root.style.setProperty('--connect-bg-color', colorVal);
          root.style.setProperty('--connect-bg-image', 'none');
        } else if (bgs.connect.image) {
          root.style.setProperty('--connect-bg-image', `url('${bgs.connect.image}')`);
          root.style.setProperty('--connect-bg-color', 'transparent');
        }
        if (connectSec && isColor) {
          connectSec.style.backgroundColor = colorVal;
        }
        if (connectLayer) {
          if (!isColor && bgs.connect.image) {
            connectLayer.style.backgroundImage = `url('${bgs.connect.image}')`;
            connectLayer.style.backgroundColor = 'transparent';
            connectLayer.style.display = 'block';
          } else {
            connectLayer.style.backgroundImage = 'none';
            connectLayer.style.backgroundColor = colorVal;
            connectLayer.style.display = 'block';
          }
        }
        if (bgs.connect.overlayOpacity !== undefined) {
          const op = (bgs.connect.overlayOpacity > 1 ? bgs.connect.overlayOpacity / 100 : bgs.connect.overlayOpacity);
          root.style.setProperty('--connect-overlay-opacity', op);
        }
      }
    }

    // E. Section Titles & Subtitles
    if (cust.sections) {
      const sec = cust.sections;
      const workTitle = document.querySelector('.work-section .section-title');
      if (workTitle && sec.workTitle) workTitle.textContent = sec.workTitle;

      const workSub = document.querySelector('.work-section .section-subtitle');
      if (workSub && sec.workSubtitle) workSub.textContent = sec.workSubtitle;

      const protoTitle = document.querySelector('.proto-section .section-title');
      if (protoTitle && sec.protoTitle) protoTitle.textContent = sec.protoTitle;

      const protoQuote = document.querySelector('.proto-quote');
      if (protoQuote && sec.protoQuote) protoQuote.textContent = `"${sec.protoQuote.replace(/^"|"$/g, '')}"`;

      const galleryTitle = document.querySelector('.gallery-section .section-title');
      if (galleryTitle && sec.galleryTitle) galleryTitle.textContent = sec.galleryTitle;

      const gallerySub = document.querySelector('.gallery-section .section-subtitle');
      if (gallerySub && sec.gallerySubtitle) gallerySub.textContent = sec.gallerySubtitle;

      const connectTitle = document.querySelector('.connect-title');
      if (connectTitle && sec.connectTitle) connectTitle.textContent = sec.connectTitle;

      const connectSub = document.querySelector('.connect-desc');
      if (connectSub && sec.connectSubtitle) connectSub.textContent = sec.connectSubtitle;
    }
  }

  // 1. Profile & Hero Section
  const p = data.profile;
  if (p) {
    const titleLine1 = document.querySelector('.hero-title .title-line:nth-child(1)');
    const titleLine2 = document.querySelector('.hero-title .title-line:nth-child(2)');
    if (titleLine1 && p.titleLine1) titleLine1.textContent = p.titleLine1;
    if (titleLine2 && p.titleLine2) titleLine2.textContent = p.titleLine2;

    const roleEl = document.querySelector('.hero-role');
    if (roleEl && p.role) roleEl.textContent = p.role;

    const taglineEl = document.querySelector('.hero-tagline');
    if (taglineEl && p.tagline) taglineEl.textContent = p.tagline;

    const locEl = document.querySelector('.hero-location span');
    if (locEl && p.location) locEl.textContent = p.location;

    const statusTextEl = document.querySelector('.status-text');
    if (statusTextEl && p.statusText) statusTextEl.textContent = p.statusText;

    const statusDotEl = document.querySelector('.status-dot');
    if (statusDotEl && p.statusType) {
      statusDotEl.className = `status-dot status-dot-${p.statusType}`;
    }

    const heroAvatar = document.querySelector('.hero-character-img');
    if (heroAvatar && p.avatar) heroAvatar.src = p.avatar;

    const connectAvatar = document.querySelector('.connect-character-img');
    if (connectAvatar && p.avatar) connectAvatar.src = p.avatar;

    if (p.music) {
      const musicCaption = document.querySelector('.music-caption');
      if (musicCaption && p.music.caption) musicCaption.textContent = p.music.caption;

      const musicTrack = document.querySelector('.music-track-name');
      if (musicTrack && p.music.trackName) musicTrack.textContent = p.music.trackName;

      const audioEl = document.getElementById('heroBgAudio');
      if (audioEl && p.music.audioSrc) audioEl.src = p.music.audioSrc;
    }

    const aboutBtn = document.getElementById('heroAboutBtn') || document.getElementById('heroReadStoryBtn');
    if (aboutBtn) {
      if (p.ctaStoryText) aboutBtn.textContent = p.ctaStoryText;
      if (p.ctaStoryUrl) aboutBtn.href = p.ctaStoryUrl;
    }
  }

  // 2. Selected Work / Projects
  if (data.projects && Array.isArray(data.projects)) {
    // Synchronize global projectData dictionary for modal clicks
    data.projects.forEach(pr => {
      projectData[pr.id] = {
        title: pr.title || pr.shortTitle,
        tag: pr.tag,
        category: pr.categoryLabel || pr.category.toUpperCase(),
        image: pr.image,
        description: pr.description || pr.shortDesc,
        timeline: pr.timeline,
        role: pr.role,
        tools: pr.tools,
        deliverable: pr.deliverable
      };
    });

    // Update category pill badges
    const prodCount = data.projects.filter(pr => pr.category === 'product').length;
    const uiuxCount = data.projects.filter(pr => pr.category === 'uiux').length;
    const graphCount = data.projects.filter(pr => pr.category === 'graphic').length;

    const prodPill = document.querySelector('.filter-pill[data-category="product"] .pill-badge');
    if (prodPill) prodPill.textContent = `${prodCount} Projects`;

    const uiuxPill = document.querySelector('.filter-pill[data-category="uiux"] .pill-badge');
    if (uiuxPill) uiuxPill.textContent = `${uiuxCount} Projects`;

    const graphPill = document.querySelector('.filter-pill[data-category="graphic"] .pill-badge');
    if (graphPill) graphPill.textContent = `${graphCount} Projects`;

    // Re-render project cards if custom changes exist
    const workGrid = document.getElementById('workGrid');
    if (workGrid) {
      const activeFilter = document.querySelector('.filter-pill.active')?.dataset.category || 'product';
      workGrid.innerHTML = '';

      data.projects.forEach(pr => {
        const isHidden = (activeFilter !== 'all' && pr.category !== activeFilter);
        const card = document.createElement('article');
        card.className = `work-card ${isHidden ? 'hidden' : ''}`;
        card.dataset.category = pr.category;
        card.dataset.id = pr.id;
        card.setAttribute('role', 'link');
        card.setAttribute('tabindex', '0');
        card.innerHTML = `
          <div class="card-media">
            <img src="${pr.image || 'assets/images/work_luma.jpg'}" alt="${pr.shortTitle || pr.title}" loading="lazy" onerror="this.src='assets/images/work_luma.jpg'">
            <span class="card-pill-tag">${pr.tag || 'Design'}</span>
          </div>
          <div class="card-body">
            <span class="card-category-label">${pr.categoryLabel || pr.category.toUpperCase()}</span>
            <h3 class="card-title">${pr.shortTitle || pr.title}</h3>
            <p class="card-desc">${pr.shortDesc || pr.description || ''}</p>
          </div>
        `;
        workGrid.appendChild(card);
      });

      // Re-attach card hover tilts & click navigation
      initWorkHoverTilt();
      initProjectModal();
    }
  }

  // 3. Prototyping Workshop
  if (data.prototypes && Array.isArray(data.prototypes)) {
    const protoGrid = document.querySelector('.polaroid-grid');
    if (protoGrid) {
      protoGrid.innerHTML = '';
      data.prototypes.forEach(pt => {
        const card = document.createElement('div');
        card.className = `polaroid-card ${pt.tilt || 'tilt-left'} ${pt.isExtra ? 'extra-card' : ''}`;
        card.dataset.proto = pt.id;
        card.innerHTML = `
          <div class="masking-tape"></div>
          <div class="polaroid-photo">
            <img src="${pt.src}" alt="${pt.title}" loading="lazy" onerror="this.src='assets/images/proto_drafting.jpg'">
          </div>
          <div class="polaroid-caption">
            <span class="proto-tag">${pt.tag}</span>
            <h4 class="proto-caption-title">${pt.title}</h4>
          </div>
        `;
        protoGrid.appendChild(card);
      });
      initPrototypesModal();
    }

    const quoteEl = document.querySelector('.proto-quote');
    if (quoteEl && data.protoQuote) {
      quoteEl.textContent = `"${data.protoQuote.replace(/^"|"$/g, '')}"`;
    }
  }

  // 4. Gallery
  if (data.gallery && Array.isArray(data.gallery)) {
    const cols = document.querySelectorAll('.gallery-grid .gallery-col');
    if (cols.length === 4) {
      cols.forEach(c => c.innerHTML = '');
      data.gallery.forEach(g => {
        const colIdx = Math.max(0, Math.min(3, (g.col || 1) - 1));
        const card = document.createElement('div');
        card.className = `gallery-card ${g.type || 'card-short'} ${g.isExtra ? 'extra-gallery-card' : ''}`;
        card.dataset.caption = g.caption;
        card.dataset.src = g.src;

        let overlayHtml = '';
        if (g.scriptOverlay) {
          overlayHtml = `<div class="gallery-script-overlay">${g.scriptOverlay.replace(/\n/g, '<br>')}</div>`;
        } else if (g.badge) {
          overlayHtml = `<span class="gallery-badge">${g.badge}</span>`;
        }

        card.innerHTML = `
          <img src="${g.src}" alt="${g.caption}" loading="lazy" onerror="this.src='assets/images/gallery_forest.jpg'">
          ${overlayHtml}
          <div class="gallery-hover-scrim">
            <span class="zoom-icon">&#x2922;</span>
          </div>
        `;
        cols[colIdx].appendChild(card);
      });
      initGalleryLightbox();
    }
  }

  // 5. Connect & Footer
  if (data.connect) {
    const c = data.connect;
    const titleEl = document.querySelector('.connect-title');
    if (titleEl && c.title) titleEl.textContent = c.title;

    const descEl = document.querySelector('.connect-desc');
    if (descEl && c.desc) descEl.textContent = c.desc;

    const emailLink = document.querySelector('.direct-email-link');
    if (emailLink && c.email) {
      emailLink.href = `mailto:${c.email}`;
      emailLink.textContent = c.email;
    }

    const resumeBtn = document.getElementById('downloadResumeBtn');
    if (resumeBtn && c.resumeUrl) {
      resumeBtn.href = c.resumeUrl;
    }

    if (c.socials) {
      const ig = document.querySelector('a[aria-label="Instagram"]');
      if (ig && c.socials.instagram) ig.href = c.socials.instagram;
      const tw = document.querySelector('a[aria-label="Twitter / X"]');
      if (tw && c.socials.twitter) tw.href = c.socials.twitter;
      const yt = document.querySelector('a[aria-label="YouTube"]');
      if (yt && c.socials.youtube) yt.href = c.socials.youtube;
      const li = document.querySelector('a[aria-label="LinkedIn"]');
      if (li && c.socials.linkedin) li.href = c.socials.linkedin;
      const be = document.querySelector('a[aria-label="Behance"]');
      if (be && c.socials.behance) be.href = c.socials.behance;
      const db = document.querySelector('a[aria-label="Dribbble"]');
      if (db && c.socials.dribbble) db.href = c.socials.dribbble;
      const gh = document.querySelector('a[aria-label="GitHub"]');
      if (gh && c.socials.github) gh.href = c.socials.github;
    }
  }

  if (data.footer) {
    const copyEl = document.querySelector('.footer-copy');
    if (copyEl && data.footer.copyright) copyEl.textContent = data.footer.copyright;
    const tagEl = document.querySelector('.footer-tagline');
    if (tagEl && data.footer.tagline) tagEl.textContent = data.footer.tagline;
  }

  // 6. Refresh Optical Magnifying Glass Mirror
  if (window.syncMagnifierMirror) {
    setTimeout(window.syncMagnifierMirror, 120);
  }
}

/* ==========================================================================
   10. SECRET OWNER SHORTCUT: Ctrl + Shift + A
   ========================================================================== */
function initAdminShortcut() {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      window.location.href = 'admin.html';
    }
  });
}
