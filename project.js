/**
 * Project Details Page Script
 * Dynamically renders project showcases and handles interactions.
 */

const projectShowcases = {
  wellness: {
    title: 'WELLNESS JOURNEY - Interactive Floor Game Design',
    images: [
      { src: 'assets/images/showcase_wellness_1.png', alt: 'Wellness Journey - Interactive Starscape Floor Projection' },
      { src: 'assets/images/showcase_wellness_2.png', alt: 'Wellness Journey - Biomimetic Sensor Details' },
      { src: 'assets/images/showcase_wellness_3.png', alt: 'Wellness Journey - Biophilic Environmental Visuals' }
    ],
    processImages: [
      { src: 'assets/images/proto_cad.jpg', alt: 'CAD Floor Sensor Matrix Topology' },
      { src: 'assets/images/proto_drafting.jpg', alt: 'Optical Throw Ratio & Projection Geometry Blueprint' },
      { src: 'assets/images/proto_assembly.jpg', alt: 'Sensor Enclosure Prototyping & Assembly' }
    ]
  },
  luma: {
    title: 'LUMA - Acoustic Desktop Luminaire & Hardware Interface',
    images: [
      { src: 'assets/images/work_luma.jpg', alt: 'LUMA Acoustic Table Lamp Final Assembly' },
      { src: 'assets/images/work_gantri.jpg', alt: 'LUMA Diffuser Light Spill and Material Finishes' },
      { src: 'assets/images/proto_cad.jpg', alt: 'CAD Mechanical Tolerances & LED Thermal Path' }
    ],
    processImages: [
      { src: 'assets/images/proto_cad.jpg', alt: 'Thermal Heat-Sink Finite Element Analysis' },
      { src: 'assets/images/proto_drafting.jpg', alt: 'Acoustic Felt Damping Chamber Schematics' },
      { src: 'assets/images/proto_cnc.jpg', alt: 'Precision CNC Machined Aluminum Base' }
    ]
  },
  analog: {
    title: 'ANALOG - CNC Billet Desktop Volume Controller',
    images: [
      { src: 'assets/images/work_analog.jpg', alt: 'ANALOG Precision CNC Volume Controller' },
      { src: 'assets/images/proto_cnc.jpg', alt: 'Precision Multi-Axis CNC Milling Process' },
      { src: 'assets/images/proto_drafting.jpg', alt: 'Rotary Encoder Mechanical Tolerance Blueprint' }
    ],
    processImages: [
      { src: 'assets/images/proto_cnc.jpg', alt: '5-Axis CNC Toolpath Milling Setup' },
      { src: 'assets/images/proto_drafting.jpg', alt: 'Stepped Magnetic Detent Tolerance Blueprint' },
      { src: 'assets/images/proto_assembly.jpg', alt: 'Bearing Alignment and Shaft Press-Fit' }
    ]
  },
  gantri: {
    title: 'GANTRI - Additive Plant-Polymer Table Luminaire',
    images: [
      { src: 'assets/images/work_gantri.jpg', alt: 'Gantri Luminaire Warm Illumination' },
      { src: 'assets/images/proto_3dprint.jpg', alt: '3D Printing Additive Layer Deposition' },
      { src: 'assets/images/work_luma.jpg', alt: 'Sculptural Geometry in Minimalist Interior' }
    ],
    processImages: [
      { src: 'assets/images/proto_3dprint.jpg', alt: 'Additive Toolpath Slicing and Nozzle Temperature Control' },
      { src: 'assets/images/proto_cad.jpg', alt: 'Parametric Curvature & Wall Thickness Optimization' },
      { src: 'assets/images/proto_drafting.jpg', alt: 'Cord Relief and Base Weighting Specifications' }
    ]
  },
  kinetic_chair: {
    title: 'KINETIC CHAIR - Articulating Dynamic Ergonomic Seating',
    images: [
      { src: 'assets/images/work_chair.jpg', alt: 'Kinetic Ergonomic Articulating Task Chair' },
      { src: 'assets/images/proto_assembly.jpg', alt: 'Spine Articulation Joint Hardware Prototyping' },
      { src: 'assets/images/proto_cad.jpg', alt: 'Finite Element Analysis Stress Modeling' }
    ],
    processImages: [
      { src: 'assets/images/proto_assembly.jpg', alt: 'Ball-and-Socket Vertebral Joint Assembly' },
      { src: 'assets/images/proto_cad.jpg', alt: 'Dynamic Lumbar Load Finite Element Simulation' },
      { src: 'assets/images/proto_drafting.jpg', alt: 'Gas-Lift Cylinder & Dual-Pivot Linkage Blueprints' }
    ]
  },
  modu_bottles: {
    title: 'MODU BOTTLES - Double-Wall Modular Hydration System',
    images: [
      { src: 'assets/images/work_bottles.jpg', alt: 'Modu Vacuum Insulated Bottle Geometry' },
      { src: 'assets/images/gallery_bottles.jpg', alt: 'Matte Powder-Coat Finishes in Studio Light' },
      { src: 'assets/images/proto_extrusion.jpg', alt: 'Extrusion Tooling & Threaded Cap Prototyping' }
    ],
    processImages: [
      { src: 'assets/images/proto_extrusion.jpg', alt: 'Deep-Draw Stainless Steel Tooling & Thread Precision' },
      { src: 'assets/images/proto_drafting.jpg', alt: 'Double-Wall Vacuum Insulation Seal Tolerances' },
      { src: 'assets/images/proto_cad.jpg', alt: 'Modular Magnetic Flavor Pod Docking CAD' }
    ]
  },
  chassis_m1: {
    title: 'CHASSIS M1 - Compact Anodized Mini-ITX Hardware Enclosure',
    images: [
      { src: 'assets/images/work_chassis.jpg', alt: 'Chassis M1 Machined Aluminum Mini-ITX Case' },
      { src: 'assets/images/proto_cnc.jpg', alt: 'Beveled Chamfer CNC Milling and Sandblasting' },
      { src: 'assets/images/proto_scale.jpg', alt: 'Component Tolerance and Airflow Validation' }
    ],
    processImages: [
      { src: 'assets/images/proto_cnc.jpg', alt: 'Extruded 6061 Billet Machining Operation' },
      { src: 'assets/images/proto_drafting.jpg', alt: 'SFX Power Supply & GPU PCIe 4.0 Riser Blueprint' },
      { src: 'assets/images/proto_assembly.jpg', alt: 'Sandblasted Matte Hard-Anodized Surface Finish' }
    ]
  },
  apex_gears: {
    title: 'APEX GEARS - Carbon-Reinforced Mountain Cycling Shifters',
    images: [
      { src: 'assets/images/work_gears.jpg', alt: 'Apex Mountain Gear Mechanism & Carbon Lever' },
      { src: 'assets/images/proto_drafting.jpg', alt: 'Indexing Pawl Tooth Engagement Engineering Draft' },
      { src: 'assets/images/proto_cad.jpg', alt: 'High-Impact Stress Finite Element Simulation' }
    ],
    processImages: [
      { src: 'assets/images/proto_drafting.jpg', alt: 'Ratchet Cam Indexing Step Profile Blueprint' },
      { src: 'assets/images/proto_cad.jpg', alt: 'Carbon Prepreg Compression Mold Cavity Analysis' },
      { src: 'assets/images/proto_assembly.jpg', alt: 'Sealed Ceramic Bearing Clean-Room Assembly' }
    ]
  },
  breathe: {
    title: 'BREATHE - Mindful Living & Alpine Meditation Platform',
    images: [
      { src: 'assets/images/work_breathe.png', alt: 'Breathe Meditation Mobile Application Experience' },
      { src: 'assets/images/work_pulse.jpg', alt: 'Biometric Heart Rate & Respiratory Biofeedback' },
      { src: 'assets/images/work_aether.jpg', alt: 'Ambient Soundscape Mixing & Haptic Feedback' }
    ],
    processImages: [
      { src: 'assets/images/proto_drafting.jpg', alt: 'User Journey Wireframes & Breath Timing Cadence' },
      { src: 'assets/images/proto_cad.jpg', alt: 'Wearable Haptic Transducer Housing Layout' },
      { src: 'assets/images/proto_assembly.jpg', alt: 'Usability Testing Rig & Heart-Rate Telemetry Log' }
    ]
  },
  pulse_os: {
    title: 'PULSE OS - Haptic Telemetry Connected Sports Interface',
    images: [
      { src: 'assets/images/work_pulse.jpg', alt: 'Pulse OS Telemetry Dashboard & Performance Tracking' },
      { src: 'assets/images/work_breathe.png', alt: 'Personalized Recovery & Bio-Rhythm Analytics' },
      { src: 'assets/images/work_aether.jpg', alt: 'Multi-Sensor Data Stream Telemetry Graphs' }
    ],
    processImages: [
      { src: 'assets/images/proto_cad.jpg', alt: 'Optical Sensor Window Refraction Modeling' },
      { src: 'assets/images/proto_drafting.jpg', alt: 'AMOLED Glance-State Typography & Grid Layout' },
      { src: 'assets/images/proto_cnc.jpg', alt: 'Titanium Bezel Drop-Impact Test Prototyping' }
    ]
  },
  aether_dash: {
    title: 'AETHER DASH - Spatial Audio Parametric Management DAW',
    images: [
      { src: 'assets/images/work_aether.jpg', alt: 'Aether Dash Spatial Audio DAW Interface' },
      { src: 'assets/images/work_pulse.jpg', alt: 'Oscilloscope Telemetry & Parametric Visualizer' },
      { src: 'assets/images/work_breathe.png', alt: 'Multi-Channel Surround Placement Matrix' }
    ],
    processImages: [
      { src: 'assets/images/proto_drafting.jpg', alt: 'Spatial Coordinate Panner Architecture Wireframe' },
      { src: 'assets/images/proto_cad.jpg', alt: 'Dedicated Hardware Mixing Surface Mockup' },
      { src: 'assets/images/proto_cnc.jpg', alt: 'Motorized Fader Enclosure Billet Fabrication' }
    ]
  },
  movietime: {
    title: 'MOVIE TIME - Retro-Inspired Textured Screenprint Poster Series',
    images: [
      { src: 'assets/images/work_movietime.jpg', alt: 'Movie Time Gallery Exhibition of Screenprints' },
      { src: 'assets/images/work_cinema_reel.jpg', alt: 'Kinetic Film Strip Typography & Halftone Texture' },
      { src: 'assets/images/work_avengers_poster.jpg', alt: 'Blockbuster Multi-Figure Composite Screenprint' }
    ],
    processImages: [
      { src: 'assets/images/proto_drafting.jpg', alt: 'Halftone Color Separation & Spot Plate Alignment' },
      { src: 'assets/images/proto_illustration.jpg', alt: 'Hand-Inked Rough Typography Studies' },
      { src: 'assets/images/gallery_cyanotype.jpg', alt: 'Experimental UV Exposure on Heavyweight Cotton Stock' }
    ]
  },
  vinyl_grooves: {
    title: 'VINYL GROOVES - Minimalist Geometric Vinyl Record Packaging',
    images: [
      { src: 'assets/images/work_vinyl_poster.jpg', alt: 'Vinyl Grooves Piano-Key Geometric Gatefold' },
      { src: 'assets/images/work_surreal_audio.jpg', alt: 'Surreal Sound Center-Label Vintage Pressing' },
      { src: 'assets/images/gallery_vinyl.jpg', alt: 'Macro 180g Vinyl Micro-Grooves & Spindle Detail' }
    ],
    processImages: [
      { src: 'assets/images/proto_drafting.jpg', alt: 'Dieline Geometry & Foil-Stamp Embossing Specs' },
      { src: 'assets/images/proto_illustration.jpg', alt: 'Constructivist Radial Composition Sketches' },
      { src: 'assets/images/gallery_cyanotype.jpg', alt: 'Matte Varnish Test Pressing Sample Evaluation' }
    ]
  },
  surreal_sound: {
    title: 'SURREAL AUDIO - Vintage Disc Pressing & Conceptual Identity',
    images: [
      { src: 'assets/images/work_surreal_audio.jpg', alt: 'Surreal Sound Conceptual Center Label' },
      { src: 'assets/images/work_vinyl_poster.jpg', alt: 'Monochrome Gatefold Inner Sleeve Packaging' },
      { src: 'assets/images/gallery_vinyl.jpg', alt: 'High-Fidelity Audiophile Grooves Under Studio Light' }
    ],
    processImages: [
      { src: 'assets/images/proto_drafting.jpg', alt: 'Center Label Diameter & Spindle Die Cut Blueprint' },
      { src: 'assets/images/proto_illustration.jpg', alt: 'Surrealist Eye & Acoustic Waveform Exploration' },
      { src: 'assets/images/gallery_cyanotype.jpg', alt: 'Monochrome Archival Print Proofing' }
    ]
  },
  cinema_noir: {
    title: 'CINEMA NOIR - 35mm Motion Picture Festival Visual Identity',
    images: [
      { src: 'assets/images/work_cinema_reel.jpg', alt: 'Cinema Noir 35mm Celluloid Film Graphic' },
      { src: 'assets/images/work_movietime.jpg', alt: 'Festival Exhibition Hall Poster Installation' },
      { src: 'assets/images/work_avengers_poster.jpg', alt: 'Dramatic Character Lighting & Print Finishes' }
    ],
    processImages: [
      { src: 'assets/images/proto_drafting.jpg', alt: 'Sprocket Hole Grid System & Kinetic Type Layout' },
      { src: 'assets/images/proto_illustration.jpg', alt: 'High-Contrast Chiaroscuro Storyboarding' },
      { src: 'assets/images/gallery_cyanotype.jpg', alt: 'Analog Film Bleed & Grain Texture Captures' }
    ]
  },
  heroic_horizons: {
    title: 'HEROIC HORIZONS - Cinematic Composite Screenprint Series',
    images: [
      { src: 'assets/images/work_avengers_poster.jpg', alt: 'Heroic Horizons Blockbuster Screenprint' },
      { src: 'assets/images/work_cinema_reel.jpg', alt: 'Film Strip Framing & Typography' },
      { src: 'assets/images/work_movietime.jpg', alt: 'Gallery Exhibition Lighting & Print Textures' }
    ],
    processImages: [
      { src: 'assets/images/proto_drafting.jpg', alt: 'Multi-Plate CMYK + Metallic Spot Ink Registration' },
      { src: 'assets/images/proto_illustration.jpg', alt: 'Anatomical Dynamic Posing & Lighting Roughs' },
      { src: 'assets/images/gallery_cyanotype.jpg', alt: 'Serigraph Screen Mesh Density & Squeegee Proofing' }
    ]
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. Parse URL Parameter
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  // Determine which project data to render (check PortfolioData first, then fallback to local showcases)
  let currentProject = null;
  if (window.PortfolioData) {
    const data = PortfolioData.get();
    const found = (data.projects || []).find(p => p.id === projectId);
    if (found) {
      currentProject = {
        title: found.title || found.shortTitle,
        images: (found.showcaseImages && found.showcaseImages.length > 0) ? found.showcaseImages : [{ src: found.image, alt: found.shortTitle }],
        processImages: (found.processImages && found.processImages.length > 0) ? found.processImages : found.showcaseImages
      };
    }
  }

  if (!currentProject) {
    currentProject = (projectId && projectShowcases[projectId]) 
      ? projectShowcases[projectId] 
      : projectShowcases.wellness;
  }

  // 2. Set Page Title & Headline
  const headlineEl = document.getElementById('projectHeadline');
  if (headlineEl && currentProject.title) {
    headlineEl.textContent = currentProject.title;
    document.title = `${currentProject.title} | Pawan K. Kushwaha`;
  }

  // 3. Render Showcase Images
  const stackContainer = document.getElementById('projectShowcaseStack');

  function renderImages(imageList) {
    if (!stackContainer) return;
    stackContainer.innerHTML = '';

    imageList.forEach((imgObj, idx) => {
      const frame = document.createElement('div');
      frame.className = 'project-img-frame';

      const img = document.createElement('img');
      img.src = imgObj.src;
      img.alt = imgObj.alt;
      img.className = 'project-showcase-img';
      img.loading = 'eager';

      frame.appendChild(img);
      stackContainer.appendChild(frame);
    });
  }

  // Initial render with main overview images
  renderImages(currentProject.images);

  // 4. View Pills: Overview vs Process Toggle
  const btnOverview = document.getElementById('btnOverview');
  const btnProcess = document.getElementById('btnProcess');

  if (btnOverview && btnProcess) {
    btnOverview.addEventListener('click', () => {
      if (btnOverview.classList.contains('active')) return;
      btnOverview.classList.add('active');
      btnOverview.setAttribute('aria-selected', 'true');
      btnProcess.classList.remove('active');
      btnProcess.setAttribute('aria-selected', 'false');

      renderImages(currentProject.images);
    });

    btnProcess.addEventListener('click', () => {
      if (btnProcess.classList.contains('active')) return;
      btnProcess.classList.add('active');
      btnProcess.setAttribute('aria-selected', 'true');
      btnOverview.classList.remove('active');
      btnOverview.setAttribute('aria-selected', 'false');

      const processList = currentProject.processImages || currentProject.images;
      renderImages(processList);
    });
  }

  // 5. Back to Work Button Navigation
  const backBtn = document.getElementById('backToWorkBtn');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // If user came from index.html, history.back() returns smoothly, else fallback to index.html#work
      if (document.referrer && document.referrer.includes('index.html')) {
        window.history.back();
      } else {
        window.location.href = 'index.html#work';
      }
    });
  }

  // 6. Sticky Header Scroll Shadow
  const header = document.getElementById('siteHeader');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // 7. Mobile Drawer Toggle
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });

    const mobileLinks = mobileDrawer.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 8. Contact Modal Handlers
  const shootEmailBtn = document.getElementById('shootEmailBtn');
  const contactModal = document.getElementById('contactModal');
  const closeContactModal = document.getElementById('closeContactModal');
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  const copyEmailLabel = document.getElementById('copyEmailLabel');
  const targetEmailText = document.getElementById('targetEmailText');

  if (shootEmailBtn && contactModal) {
    shootEmailBtn.addEventListener('click', () => {
      contactModal.classList.add('active');
      contactModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeContactModal && contactModal) {
    closeContactModal.addEventListener('click', () => {
      contactModal.classList.remove('active');
      contactModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });

    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        contactModal.classList.remove('active');
        contactModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
  }

      if (copyEmailBtn && targetEmailText && copyEmailLabel) {
    copyEmailBtn.addEventListener('click', () => {
      const email = targetEmailText.textContent.trim();
      navigator.clipboard.writeText(email).then(() => {
        copyEmailLabel.textContent = 'Copied!';
        setTimeout(() => {
          copyEmailLabel.textContent = 'Copy';
        }, 2000);
      }).catch(() => {
        copyEmailLabel.textContent = 'Copied!';
      });
    });
  }

  // 9. Initialize Pure Glass Magnifying Lens Cursor
  initMagnifierCursor();
});

/* ==========================================================================
   PURE OPTICAL GLASS LENS CURSOR (WHOLE WEBSITE SYNC)
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
  const mainContent = document.querySelector('.project-detail-main') || document.querySelector('main');
  const footer = document.getElementById('connect') || document.querySelector('footer');

  if (!cursor || !zoomContent) return;

  let scale = 1.65;
  let lensRadius = 35; // 70px diameter compact pure glass lens
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

  function cleanClone(node) {
    if (!node) return;
    node.removeAttribute('id');
    node.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    node.querySelectorAll('audio, video, script, iframe, .magnifier-cursor, .magnifier-toggle-btn, .modal-overlay, .lightbox-overlay').forEach(el => el.remove());
    node.querySelectorAll('a, button, input, textarea, select').forEach(el => {
      el.setAttribute('tabindex', '-1');
      el.setAttribute('aria-hidden', 'true');
    });

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

  function buildMirror() {
    zoomContent.innerHTML = '';
    const mirrorWrapper = document.createElement('div');
    mirrorWrapper.className = 'magnifier-mirror-wrapper';
    mirrorWrapper.style.width = document.documentElement.scrollWidth + 'px';
    mirrorWrapper.style.minHeight = document.documentElement.scrollHeight + 'px';
    mirrorWrapper.style.position = 'relative';
    mirrorWrapper.style.pointerEvents = 'none';
    mirrorWrapper.style.backgroundColor = 'var(--color-white)';

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
    if (footer && (!mainContent || !mainContent.contains(footer))) {
      const fClone = footer.cloneNode(true);
      cleanClone(fClone);
      mirrorWrapper.appendChild(fClone);
    }

    zoomContent.appendChild(mirrorWrapper);
  }

  // Re-build mirror when overview/process tabs switch
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

  window.addEventListener('load', () => {
    setTimeout(buildMirror, 300);
  });

  window.addEventListener('resize', () => {
    buildMirror();
    scheduleRender();
  });

  function render() {
    rafPending = false;
    if (!isEnabled) return;

    cursor.style.transform = `translate3d(${currentClientX - lensRadius}px, ${currentClientY - lensRadius}px, 0)`;

    if (hClone) {
      hClone.style.transform = `translate3d(0, ${window.scrollY}px, 0)`;
      if (header && header.classList.contains('scrolled')) {
        hClone.classList.add('scrolled');
      } else {
        hClone.classList.remove('scrolled');
      }
    }

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

  window.addEventListener('scroll', () => {
    currentPageX = currentClientX + window.scrollX;
    currentPageY = currentClientY + window.scrollY;
    scheduleRender();
  }, { passive: true });

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
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }
    if (e.key === 'm' || e.key === 'M') {
      toggleMagnifier();
    }
  });

  // Admin Shortcut: Ctrl + Shift + A
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      window.location.href = 'admin.html';
    }
  });

  // Hydrate Connect, Footer & Custom Appearance on Project Page
  function hydrateProjectPageCustomization() {
    if (!window.PortfolioData) return;
    const data = PortfolioData.get();
    if (!data) return;

    // Apply colors and lens tokens
    if (data.customization) {
      const cust = data.customization;
      const root = document.documentElement;
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
      if (cust.lens) {
        if (cust.lens.size) root.style.setProperty('--lens-size', `${cust.lens.size}px`);
        if (window.updateMagnifierConfig) window.updateMagnifierConfig(cust.lens);
      }

      // Hydrate Connect Background & Overlay
      if (cust.backgrounds && cust.backgrounds.connect) {
        const bgLayer = document.getElementById('connectBgLayer');
        const connectSec = document.getElementById('connect') || document.querySelector('.connect-section');
        const cBg = cust.backgrounds.connect;
        const isColor = cBg.type === 'color' || (!cBg.image && cBg.color);
        const colorVal = cBg.color || '#55161C';
        if (isColor) {
          root.style.setProperty('--connect-bg-color', colorVal);
          root.style.setProperty('--connect-bg-image', 'none');
        } else if (cBg.image) {
          root.style.setProperty('--connect-bg-image', `url('${cBg.image}')`);
          root.style.setProperty('--connect-bg-color', 'transparent');
        }
        if (connectSec && isColor) {
          connectSec.style.backgroundColor = colorVal;
        }
        if (bgLayer) {
          if (!isColor && cBg.image && cBg.image.trim() !== '') {
            bgLayer.style.backgroundImage = `url('${cBg.image}')`;
            bgLayer.style.backgroundColor = 'transparent';
          } else {
            bgLayer.style.backgroundImage = 'none';
            bgLayer.style.backgroundColor = colorVal;
          }
        }
        if (typeof cBg.overlayOpacity === 'number') {
          const op = (cBg.overlayOpacity > 1 ? cBg.overlayOpacity / 100 : cBg.overlayOpacity);
          root.style.setProperty('--connect-overlay-opacity', op);
        }
      }
    }

    if (data.connect) {
      const emailLink = document.querySelector('.direct-email-link');
      if (emailLink && data.connect.email) {
        emailLink.href = `mailto:${data.connect.email}`;
        emailLink.textContent = data.connect.email;
      }
      const targetEmailText = document.getElementById('targetEmailText');
      if (targetEmailText && data.connect.email) {
        targetEmailText.textContent = data.connect.email;
      }
      const inquiryForm = document.getElementById('quickInquiryForm');
      if (inquiryForm && data.connect.email) {
        inquiryForm.onsubmit = function(event) {
          event.preventDefault();
          alert('Thank you! Your message has been prepared in your mail client.');
          const subj = encodeURIComponent(document.getElementById('inqSubject')?.value || '');
          const body = encodeURIComponent(document.getElementById('inqBody')?.value || '');
          window.location.href = `mailto:${data.connect.email}?subject=${subj}&body=${body}`;
        };
      }
      const resumeBtn = document.getElementById('downloadResumeBtn');
      if (resumeBtn && data.connect.resumeUrl) {
        resumeBtn.href = data.connect.resumeUrl;
      }
      const avatarImg = document.querySelector('.connect-character-img');
      if (avatarImg && data.profile?.avatar) {
        avatarImg.src = data.profile.avatar;
      }

      const s = data.connect.socials || data.profile?.social || {};
      const ig = document.querySelector('.social-circle-btn[aria-label="Instagram"]');
      const li = document.querySelector('.social-circle-btn[aria-label="LinkedIn"]');
      const be = document.querySelector('.social-circle-btn[aria-label="Behance"]');
      const db = document.querySelector('.social-circle-btn[aria-label="Dribbble"]');

      if (ig && s.instagram) ig.href = s.instagram;
      if (li && s.linkedin) li.href = s.linkedin;
      if (be && s.behance) be.href = s.behance;
      if (db && s.dribbble) db.href = s.dribbble;
    }
    if (data.footer) {
      const copyEl = document.querySelector('.footer-copy');
      if (copyEl && data.footer.copyright) copyEl.textContent = data.footer.copyright;
      const tagEl = document.querySelector('.footer-tagline');
      if (tagEl && data.footer.tagline) tagEl.textContent = data.footer.tagline;
    }
  }

  // Connect Section Parallax Movement
  function initProjectConnectParallax() {
    const connectLayer = document.getElementById('connectBgLayer');
    if (!connectLayer) return;

    let cachedBg = null;
    function refreshBgConfig() {
      try {
        if (window.PortfolioData) {
          cachedBg = PortfolioData.get()?.customization?.backgrounds?.connect || null;
        }
      } catch (_) {}
    }
    refreshBgConfig();
    window.addEventListener('portfolioDataUpdated', refreshBgConfig);
    window.addEventListener('storage', (e) => {
      if (e.key === 'portfolio_custom_data') refreshBgConfig();
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      connectLayer.style.transform = 'none';
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

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

    function animateConnectLayer(timestamp) {
      const isColor = cachedBg && (cachedBg.type === 'color' || (!cachedBg.image && cachedBg.color));
      const parallaxDisabled = cachedBg && cachedBg.parallax === false;

      if (isColor || parallaxDisabled) {
        connectLayer.style.transform = 'none';
      } else {
        const elapsed = timestamp * 0.001;
        const ambientX = Math.sin(elapsed * 0.8) * 5;
        const ambientY = Math.cos(elapsed * 0.6) * 3;

        currentX += (targetX + ambientX - currentX) * 0.08;
        currentY += (targetY + ambientY - currentY) * 0.08;

        const speed = (cachedBg && typeof cachedBg.speed === 'number') ? cachedBg.speed : 1.0;
        const x = (currentX * speed).toFixed(2);
        const y = (currentY * speed).toFixed(2);
        connectLayer.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.04)`;
      }

      requestAnimationFrame(animateConnectLayer);
    }

    requestAnimationFrame(animateConnectLayer);
  }

  // Smooth entrance animation for unified Let's Connect & Footer
  function initProjectScrollAnimation() {
    const connContainer = document.querySelector('#connect .section-container');
    if (!connContainer) return;

    connContainer.style.opacity = '0';
    connContainer.style.transform = 'translateY(22px)';
    connContainer.style.transition = 'opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)';

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
    }, { rootMargin: '80px 0px 40px 0px', threshold: 0.02 });

    observer.observe(connContainer);

    // Failsafe visibility
    setTimeout(() => {
      const r = connContainer.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh + 100) {
        connContainer.style.opacity = '1';
        connContainer.style.transform = '';
      }
    }, 250);
  }

  hydrateProjectPageCustomization();
  initProjectConnectParallax();
  initProjectScrollAnimation();

  window.addEventListener('portfolioDataUpdated', hydrateProjectPageCustomization);
  window.addEventListener('storage', (e) => {
    if (e.key === 'portfolio_custom_data') {
      hydrateProjectPageCustomization();
    }
  });
}
