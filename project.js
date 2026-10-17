/**
 * Project Details Page Script
 * Immersive Image-First Presentation with Smooth Horizontal Scroll Animation
 * Reference Match: Exact Visual Hierarchy, 01/06 HUD, and Full Case Study Modal
 */

(function () {
  'use strict';

  // Fallback projects if data-manager is not yet loaded
  const fallbackShowcases = {
    wellness: {
      id: 'wellness',
      category: 'uiux',
      categoryLabel: 'UI/UX DESIGN',
      shortTitle: 'WELLNESS JOURNEY',
      title: 'WELLNESS JOURNEY — Interactive Floor Game Design',
      tag: 'Interactive Spatial',
      image: 'assets/images/showcase_wellness_1.png',
      shortDesc: 'An immersive spatial gaming experience integrating responsive pressure-sensitive floor tiles...',
      description: 'Wellness Journey is an interactive spatial gaming installation engineered to encourage playful rehabilitation and cardiovascular activity. Combining high-resolution dynamic floor projection mapping with real-time biometric tracking, users navigate constellations and organic terrain via full-body movement.',
      timeline: '4 Months (2024)',
      role: 'Spatial UX & Systems Architect',
      tools: 'Figma, Unity 3D, TouchDesigner, Depth Sensors, C#',
      deliverable: 'Spatial Interactive Prototype, Floor Matrix Calibration Spec, Design System',
      showcaseImages: [
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
    skytrack: {
      id: 'skytrack',
      category: 'uiux',
      categoryLabel: 'UI/UX DESIGN',
      shortTitle: 'SkyTrack',
      title: 'SkyTrack — A Smarter Way to Travel',
      tag: 'Travel Platform',
      image: 'assets/images/hero_clouds_bg.png',
      shortDesc: 'A seamless travel booking experience for the next generation of explorers.',
      description: 'SkyTrack revolutionizes the travel lifecycle with predictive trip orchestration, automated flight re-accommodation, and biophilic UI design inspired by high-altitude atmospheric horizons. Built from ground up to reduce cognitive fatigue for frequent globe-trotters.',
      timeline: '6 Months (2024)',
      role: 'Lead Product & Systems Designer',
      tools: 'Figma, Framer, Swift, Mapbox GL, Design Systems',
      deliverable: 'Multi-Platform Mobile Application, Design Tokens, Micro-Interactions',
      showcaseImages: [
        { src: 'assets/images/hero_clouds_bg.png', alt: 'SkyTrack Atmospheric Horizon Interface' },
        { src: 'assets/images/work_breathe.png', alt: 'SkyTrack Mobile Itinerary Screen' },
        { src: 'assets/images/work_pulse.jpg', alt: 'SkyTrack Real-Time Flight Telemetry' }
      ],
      processImages: [
        { src: 'assets/images/proto_drafting.jpg', alt: 'Passenger Journey Flow & State Architecture' },
        { src: 'assets/images/proto_cad.jpg', alt: 'Glanceable Widget Grid Spec' },
        { src: 'assets/images/proto_assembly.jpg', alt: 'Live Prototype User Testing Rig' }
      ]
    }
  };

  let isProjectPageHydrated = false;
  let lastProjectSyncTime = null;

  async function startProjectPage() {
    if (window.PortfolioData && typeof window.PortfolioData.loadRemoteData === 'function') {
      window.PortfolioData.loadRemoteData();
    }
    if (window.PortfolioMediaDB && typeof window.PortfolioMediaDB.waitForReady === 'function') {
      await window.PortfolioMediaDB.waitForReady(600);
    }
    initProjectPage();
    isProjectPageHydrated = true;
    document.documentElement.classList.add('portfolio-hydrated');
    try {
      if (window.PortfolioData) {
        const d = PortfolioData.get();
        if (d && d.updatedAt) lastProjectSyncTime = d.updatedAt;
      }
    } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    startProjectPage();
  });

  window.addEventListener('portfolioMediaReady', () => {
    if (!isProjectPageHydrated) {
      initProjectPage();
      isProjectPageHydrated = true;
      document.documentElement.classList.add('portfolio-hydrated');
    }
  });

  let isResearchView = false;

  function resolveMediaUrl(src) {
    if (!src) return '';
    if (src.startsWith('idb://')) {
      return (window.PortfolioMediaDB && window.PortfolioMediaDB.resolveUrlSync(src)) || src;
    }
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')) {
      return src;
    }
    const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
    const isInsideResearchDir = path.includes('/projects/') && path.includes('/research');
    const isInsideProjectsDir = path.includes('/projects/') || path.includes('\\projects\\');

    if (isInsideResearchDir && !src.startsWith('../')) {
      return '../../../' + src;
    }
    if (isInsideProjectsDir && !src.startsWith('../')) {
      return '../../' + src;
    }
    return src;
  }

  function getResearchUrl(project) {
    const slug = (project && (project.slug || project.id)) || 'luma';
    const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';

    if (path.includes('project.html') || path.includes('project-research.html')) {
      return `project-research.html?id=${encodeURIComponent(slug)}`;
    }

    if (path.includes('/projects/')) {
      return 'research.html';
    }

    return `project-research.html?id=${encodeURIComponent(slug)}`;
  }

  function getMainProjectUrl(project) {
    const slug = (project && (project.slug || project.id)) || 'luma';
    const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';

    if (path.includes('/projects/') && path.includes('/research/')) {
      return '../index.html';
    }

    if (path.includes('/projects/') && (path.endsWith('research.html') || path.includes('/research.html'))) {
      return 'index.html';
    }

    if (path.includes('/projects/')) {
      return 'index.html';
    }

    return `project.html?id=${encodeURIComponent(slug)}`;
  }

  function checkIsViewResearchEnabled(project) {
    if (project && project.viewResearch !== undefined && project.viewResearch !== null) {
      return Boolean(project.viewResearch);
    }
    if (project && project.showViewResearch !== undefined && project.showViewResearch !== null) {
      return Boolean(project.showViewResearch);
    }
    if (window.PortfolioData && typeof window.PortfolioData.get === 'function') {
      const d = window.PortfolioData.get();
      if (d?.customization?.projectPage?.viewResearch !== undefined && d?.customization?.projectPage?.viewResearch !== null) {
        return Boolean(d.customization.projectPage.viewResearch);
      }
      if (d?.customization?.projectPage?.showViewResearch !== undefined && d?.customization?.projectPage?.showViewResearch !== null) {
        return Boolean(d.customization.projectPage.showViewResearch);
      }
    }
    return true;
  }

  function checkIsCoverTitleEnabled(project) {
    if (project && project.showCoverTitle !== undefined && project.showCoverTitle !== null) {
      return Boolean(project.showCoverTitle);
    }
    if (project && project.coverTitle !== undefined && project.coverTitle !== null) {
      return Boolean(project.coverTitle);
    }
    if (window.PortfolioData && typeof window.PortfolioData.get === 'function') {
      const d = window.PortfolioData.get();
      if (d?.customization?.projectPage?.showCoverTitle !== undefined && d?.customization?.projectPage?.showCoverTitle !== null) {
        return Boolean(d.customization.projectPage.showCoverTitle);
      }
      if (d?.customization?.projectPage?.coverTitle !== undefined && d?.customization?.projectPage?.coverTitle !== null) {
        return Boolean(d.customization.projectPage.coverTitle);
      }
    }
    return true;
  }

  function checkIsShowcaseHeaderEnabled(project) {
    if (project && project.showShowcaseHeader !== undefined && project.showShowcaseHeader !== null) {
      return Boolean(project.showShowcaseHeader);
    }
    if (window.PortfolioData && typeof window.PortfolioData.get === 'function') {
      const d = window.PortfolioData.get();
      if (d?.customization?.projectPage?.showShowcaseHeader !== undefined && d?.customization?.projectPage?.showShowcaseHeader !== null) {
        return Boolean(d.customization.projectPage.showShowcaseHeader);
      }
    }
    return true;
  }

  function checkIsVerticalSectionEnabled(project) {
    if (project && project.showVerticalSection !== undefined && project.showVerticalSection !== null) {
      return Boolean(project.showVerticalSection);
    }
    if (window.PortfolioData && typeof window.PortfolioData.get === 'function') {
      const d = window.PortfolioData.get();
      if (d?.customization?.projectPage?.showVerticalSection !== undefined && d?.customization?.projectPage?.showVerticalSection !== null) {
        return Boolean(d.customization.projectPage.showVerticalSection);
      }
    }
    return true;
  }

  function resolveCategoryDisplayName(catKey, customLabel) {
    if (window.PortfolioData && typeof window.PortfolioData.get === 'function') {
      const d = window.PortfolioData.get();
      const cf = d?.customization?.categoryFilters;
      if (cf) {
        if (catKey === 'product' && cf.productName) return cf.productName.toUpperCase();
        if (catKey === 'uiux' && cf.uiuxName) return cf.uiuxName.toUpperCase();
        if (catKey === 'graphic' && cf.graphicName) return cf.graphicName.toUpperCase();
      }
    }
    if (customLabel) return customLabel.toUpperCase();
    if (catKey === 'uiux') return 'UI/UX DESIGN';
    if (catKey === 'graphic') return 'GRAPHIC DESIGN';
    return 'PRODUCT DESIGN';
  }

  function initProjectPage() {
    // 1. Get Project ID or Slug from URL query, pathname, body dataset, or hash
    const urlParams = new URLSearchParams(window.location.search);
    let projectId = urlParams.get('id') || urlParams.get('slug');

    // Detect whether current page is Research Mode
    isResearchView = (function() {
      if (document.body && document.body.dataset && document.body.dataset.pageView === 'research') return true;
      const path = (window.location.pathname || '').toLowerCase();
      if (path.includes('/research') || path.endsWith('research.html')) return true;
      const v = urlParams.get('view') || urlParams.get('mode') || urlParams.get('tab');
      return v === 'research' || v === 'process';
    })();

    if (!projectId && window.location.pathname) {
      const match = window.location.pathname.match(/\/projects\/([^\/\.]+)/i);
      if (match && match[1]) {
        projectId = match[1];
      }
    }

    if (!projectId && document.body && document.body.dataset && document.body.dataset.projectId) {
      projectId = document.body.dataset.projectId;
    }

    if (!projectId && window.location.hash) {
      const cleanHash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
      if (cleanHash && cleanHash !== 'work' && cleanHash !== 'gallery') {
        projectId = cleanHash;
      }
    }

    if (!projectId) {
      projectId = 'kinetic-chair';
    }

    // 2. Fetch Project Data from PortfolioData or Fallback
    let project = null;
    if (window.PortfolioData && typeof window.PortfolioData.get === 'function') {
      const data = window.PortfolioData.get();
      if (data && data.projects) {
        project = data.projects.find(p => 
          p.slug === projectId || 
          p.id === projectId || 
          (Array.isArray(p.alias) && p.alias.includes(projectId))
        );
      }
    }

    if (!project) {
      project = fallbackShowcases[projectId] || fallbackShowcases[projectId.replace(/-/g, '_')];
    }

    // If project still not found, construct full dynamic project info from slug so navigation NEVER fails
    if (!project) {
      const formattedTitle = projectId
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      project = {
        id: projectId,
        slug: projectId,
        route: `/projects/${projectId}`,
        title: formattedTitle,
        shortTitle: formattedTitle,
        category: 'product',
        categoryLabel: 'DESIGN PROJECT',
        tag: 'Case Study',
        image: 'assets/images/hero_clouds_bg.png',
        shortDesc: `${formattedTitle} - In-depth design study and engineering case study.`,
        description: `${formattedTitle} explores functional form, ergonomic refinement, and production methodologies through iterative modeling, material analysis, and rapid prototyping.`,
        timeline: '2024',
        role: 'Lead Designer & Engineer',
        tools: 'CAD, Prototyping, Design Systems',
        deliverable: 'Complete Production Architecture & Physical Prototype',
        showcaseImages: [
          { src: 'assets/images/hero_clouds_bg.png', alt: formattedTitle }
        ],
        processImages: [
          { src: 'assets/images/proto_drafting.jpg', alt: 'Technical Drafting' }
        ]
      };
    }

    const backBtn = document.getElementById('projectBackBtn');
    if (backBtn) {
      const path = (window.location.pathname || '').toLowerCase();
      let returnBase = 'index.html';
      if (path.includes('/projects/') && path.includes('/research/')) {
        returnBase = '../../../index.html';
      } else if (path.includes('/projects/') || path.includes('\\projects\\') || path.includes('projects/')) {
        returnBase = '../../index.html';
      } else {
        returnBase = 'index.html';
      }
      const returnSlug = (project && (project.slug || project.id)) || projectId;
      backBtn.href = `${returnBase}?project=${encodeURIComponent(returnSlug)}`;
      backBtn.setAttribute('aria-label', 'Back to Work');
      backBtn.innerHTML = '<span class="pill-arrow"><svg class="back-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg><span class="desktop-arrow">&larr;</span></span> <span class="back-btn-text">Back to Work</span>';

      backBtn.addEventListener('click', () => {
        try {
          sessionStorage.setItem('selected_work_return_slug', returnSlug);
        } catch (e) {}
      });
    }

    // Check whether View Research is enabled (per-project or globally)
    const isViewResearchEnabled = checkIsViewResearchEnabled(project);

    if (!isViewResearchEnabled) {
      document.documentElement.classList.add('view-research-off');
      document.body.classList.add('view-research-off');
    } else {
      document.documentElement.classList.remove('view-research-off');
      document.body.classList.remove('view-research-off');
    }

    // Check whether Cover Title is enabled (per-project or globally)
    const isCoverTitleEnabled = checkIsCoverTitleEnabled(project);

    if (!isCoverTitleEnabled) {
      document.documentElement.classList.add('cover-title-off');
      document.body.classList.add('cover-title-off');
    } else {
      document.documentElement.classList.remove('cover-title-off');
      document.body.classList.remove('cover-title-off');
    }

    // Check whether Visual Showcase Header is enabled (per-project or globally)
    const isShowcaseHeaderEnabled = checkIsShowcaseHeaderEnabled(project);

    if (!isShowcaseHeaderEnabled) {
      document.documentElement.classList.add('showcase-header-off');
      document.body.classList.add('showcase-header-off');
      const gallerySec = document.getElementById('projectGallerySection');
      if (gallerySec) gallerySec.classList.add('no-showcase-header');
    } else {
      document.documentElement.classList.remove('showcase-header-off');
      document.body.classList.remove('showcase-header-off');
      const gallerySec = document.getElementById('projectGallerySection');
      if (gallerySec) gallerySec.classList.remove('no-showcase-header');
    }

    const topResearchBtn = document.getElementById('projectTopResearchBtn');
    const topRightBar = document.getElementById('projectTopRightBar');
    if (!isResearchView) {
      if (!isViewResearchEnabled) {
        if (topResearchBtn) topResearchBtn.style.display = 'none';
        if (topRightBar) topRightBar.style.display = 'none';
      } else {
        if (topResearchBtn) {
          topResearchBtn.style.display = '';
          topResearchBtn.href = getResearchUrl(project);
          topResearchBtn.setAttribute('aria-label', 'View research');
          topResearchBtn.innerHTML = '<span class="cta-text-full">View research</span><span class="cta-text-short">Research</span> <span class="pill-arrow">&rarr;</span>';
        }
        if (topRightBar) topRightBar.style.display = '';
      }
    } else {
      if (!isViewResearchEnabled) {
        window.location.replace(getMainProjectUrl(project));
        return;
      }
      if (topResearchBtn) {
        topResearchBtn.style.display = '';
        topResearchBtn.href = getMainProjectUrl(project);
        topResearchBtn.setAttribute('aria-label', 'Project Overview');
        topResearchBtn.innerHTML = '<span class="pill-arrow">&larr;</span> <span class="cta-text-full">Project Overview</span><span class="cta-text-short">Overview</span>';
      }
      if (topRightBar) topRightBar.style.display = '';
    }

    // Ensure project has sections aligned with configured showcase media
    let sections = [];
    if (!isResearchView && Array.isArray(project.showcaseImages) && project.showcaseImages.length > 0) {
      if (window.PortfolioData && typeof window.PortfolioData.generateDefaultSections === 'function') {
        sections = window.PortfolioData.generateDefaultSections(project);
      }
    }
    if (sections.length === 0) {
      sections = (project.sections && Array.isArray(project.sections) && project.sections.length > 0)
        ? project.sections.filter(s => s.isVisible !== false)
        : [];
      if (sections.length === 0 && window.PortfolioData && typeof window.PortfolioData.generateDefaultSections === 'function') {
        sections = window.PortfolioData.generateDefaultSections(project);
      }
    }

    if (isResearchView) {
      document.body.classList.add('project-research-mode');
      const procImages = Array.isArray(project.processImages) ? project.processImages : [];
      const rawProcPool = procImages.map(img => typeof img === 'string' ? img : (img.src || img.url)).filter(Boolean);
      const procPool = [];
      rawProcPool.forEach(src => {
        if (!procPool.some(existing => {
          const cleanA = String(existing).replace(/^[./\\]+/, '').toLowerCase();
          const cleanB = String(src).replace(/^[./\\]+/, '').toLowerCase();
          return cleanA === cleanB;
        })) {
          procPool.push(src);
        }
      });
      
      const firstProc = procPool[0];
      const firstIsVid = typeof firstProc === 'string' && (firstProc.includes('.mp4') || firstProc.includes('.webm') || firstProc.startsWith('data:video/'));

      sections = [
        {
          id: `sec-research-overview-${project.id || Date.now()}`,
          navTitle: 'Research Overview',
          title: project.shortTitle || project.title || 'Research Overview',
          subtitle: 'Research, Ergonomics & Prototyping Studies',
          image: firstIsVid ? '' : (firstProc || 'assets/images/hero_clouds_bg.png'),
          video: firstIsVid ? firstProc : '',
          mediaType: firstIsVid ? 'video' : 'image',
          isVisible: true
        }
      ];

      for (let i = 1; i < procPool.length; i++) {
        const item = procPool[i];
        const isVid = typeof item === 'string' && (item.includes('.mp4') || item.includes('.webm') || item.startsWith('data:video/'));
        sections.push({
          id: `sec-research-${i + 1}-${project.id || Date.now()}`,
          navTitle: `Study 0${i + 1}`,
          title: project.title || '',
          image: isVid ? '' : item,
          video: isVid ? item : '',
          mediaType: isVid ? 'video' : 'image',
          isVisible: true
        });
      }
    }

    // 3. Set Document Title & Headline
    const projTitle = project.title || project.shortTitle || 'Project Details';
    document.title = isResearchView ? `${projTitle} — Research | Pawan K. Kushwaha` : `${projTitle} | Pawan K. Kushwaha`;

    // 4. Render Project Hero Stage & Sections
    renderHorizontalTrack(project, sections);

    // 5. Render Project Detail Flow (Overview, Specs, Visuals, Process, Next Project)
    renderProjectDetailFlow(project, sections);

    // 6. Setup Smooth Vertical Scroll & Navigation Engine
    initLenis();
    setupScrollEngine(sections);
    setupScrollPrompts();
    initHeaderScroll();
    setupTopControlsAutoHide();

    // 7. Hydrate Custom Appearance, Parallax & Lens
    hydrateCustomization();
    initParallaxAndLens();
    initFirstPageDistortion(project);
  }

  /**
   * Render Horizontal Track Slides based on 12 Layout Types
   */
  function renderHorizontalTrack(project, sections) {
    const wrapper = document.getElementById('projectHeroStage') || document.getElementById('projectHorizontalWrapper');
    const track = document.getElementById('projectSlidesTrack');
    if (!wrapper || !track) return;

    // Keep track empty and populate slides
    track.innerHTML = '';
    const isCoverTitleEnabled = checkIsCoverTitleEnabled(project);

    sections.forEach((sec, idx) => {
      const slide = document.createElement('section');
      // Initially slide 0 is active, other slides are inactive
      slide.className = `project-slide-panel ${idx === 0 ? 'slide-active' : ''}`;
      if (idx === 0 && !isCoverTitleEnabled) {
        slide.classList.add('no-cover-title', 'cover-title-off');
      }
      slide.id = `slide-${idx}`;
      slide.setAttribute('data-slide-index', String(idx));
      slide.setAttribute('aria-label', sec.navTitle || `Section ${idx + 1}`);

      slide.innerHTML = buildSlideMarkup(project, sec, idx);
      track.appendChild(slide);
    });

    // Ensure all slide background videos are muted and playing cleanly
    track.querySelectorAll('video.slide-bg-video').forEach(vid => {
      vid.muted = true;
      vid.defaultMuted = true;
      vid.playsInline = true;
      vid.setAttribute('muted', '');
      vid.setAttribute('autoplay', '');
      vid.setAttribute('loop', '');
      vid.setAttribute('playsinline', '');
      vid.play().catch(() => {});
    });
  }

  /**
   * Generate Markup for a Slide
   * Slide 01: Project Title + Optical Liquid Distortion Mesh
   * Slides 02+: Pure, unblurred visual layers (100vw × 100vh) without text
   * All Slides: Black layers (.slide-overlay-gradient) completely removed
   */
  function buildSlideMarkup(project, sec, idx) {
    const isViewResearchEnabled = checkIsViewResearchEnabled(project);
    const isCoverTitleEnabled = checkIsCoverTitleEnabled(project);
    // 1. Gather all candidate images from section and project collections
    // to guarantee each slide displays a unique, high-resolution visual.
    const projectPool = [];
    if (sec.image) projectPool.push(sec.image);
    if (Array.isArray(sec.images)) {
      sec.images.forEach(img => {
        if (img && typeof img === 'string' && !projectPool.includes(img)) projectPool.push(img);
      });
    }
    const relevantImages = isResearchView ? project.processImages : project.showcaseImages;
    if (Array.isArray(relevantImages)) {
      relevantImages.forEach(item => {
        const src = typeof item === 'string' ? item : (item && (item.src || item.url));
        if (src && !projectPool.includes(src)) projectPool.push(src);
      });
    }
    if (projectPool.length === 0 && project.image) {
      projectPool.push(project.image);
    }

    let bgImage = sec.image || (sec.images && sec.images[0]);
    if (!bgImage && projectPool.length > 0) {
      bgImage = projectPool[idx % projectPool.length];
    }
    if (!bgImage) {
      bgImage = 'assets/images/hero_clouds_bg.png';
    }

    // Slide video only if section explicitly specifies video (card demo video is only for project cards & thumbnails, not reference case study slides)
    const isSlideVideo = Boolean(
      (sec.mediaType === 'video' && sec.video) ||
      (sec.video && (!sec.mediaType || sec.mediaType !== 'image'))
    );
    const videoSrc = isSlideVideo ? sec.video : '';

    // 2. Render pure full-screen media layer matching the main screen (NO black layer)
    const mobileThumbSrc = (idx === 0 && (project.mobileImage || project.mobileThumbnail)) ? (project.mobileImage || project.mobileThumbnail) : '';
    const mediaMarkup = videoSrc
      ? `<video class="slide-bg-video" autoplay muted loop playsinline src="${escapeHtml(resolveMediaUrl(videoSrc))}"></video>`
      : (mobileThumbSrc
          ? `<div class="slide-bg-layer desktop-bg-layer" style="background-image: url('${escapeHtml(resolveMediaUrl(bgImage))}');" aria-hidden="true"></div>
             <div class="slide-bg-layer mobile-bg-layer" style="background-image: url('${escapeHtml(resolveMediaUrl(mobileThumbSrc))}');" aria-hidden="true"></div>`
          : `<div class="slide-bg-layer" style="background-image: url('${escapeHtml(resolveMediaUrl(bgImage))}');" aria-hidden="true"></div>`
        );

    // 3. First Page (Slide 0): Project Title Block & Refraction Distortion Mesh
    if (idx === 0) {
      if (isResearchView) {
        const cat = `${sec.category || project.categoryLabel || 'PRODUCT DESIGN'} • RESEARCH &amp; PROCESS`;
        const mainTitle = sec.title || project.shortTitle || project.title || 'Research Overview';
        const subTitle = 'Design Investigation, Ergonomics &amp; Prototyping Studies';
        const bodyText = project.projectBrief || project.description || project.shortDesc || '';
        const backUrl = getMainProjectUrl(project);

        return `
          ${mediaMarkup}
          <div class="hero-distortion-mesh" aria-hidden="true"></div>
          <div class="slide-container">
            <div class="hero-typography-block"${!isCoverTitleEnabled ? ' style="display:none !important;"' : ''}>
              <span class="hero-cat-pill">${cat}</span>
              <h1 class="hero-main-title">${escapeHtml(mainTitle)}</h1>
              <h2 class="hero-subtitle">${subTitle}</h2>
              ${bodyText ? `<p class="hero-description">${escapeHtml(bodyText)}</p>` : ''}
              <a href="${escapeHtml(backUrl)}" class="project-pill-btn hero-view-process-btn hero-view-back-btn" id="heroViewProjectBtn" aria-label="Project Overview">
                <span class="pill-arrow">&larr;</span>
                <span>Project Overview</span>
              </a>
            </div>
          </div>
        `;
      } else {
        const cat = sec.category || (project.category ? resolveCategoryDisplayName(project.category, project.categoryLabel) : (project.categoryLabel || 'PRODUCT DESIGN'));
        const mainTitle = project.title || project.shortTitle || sec.title || 'Project Showcase';
        const subTitle = sec.subtitle || (project.title && project.title.includes('—') ? project.title.split('—')[1].trim() : (project.tag || ''));
        const bodyText = sec.body || project.shortDesc || project.description || '';
        const researchUrl = getResearchUrl(project);

        return `
          ${mediaMarkup}
          <div class="hero-distortion-mesh" aria-hidden="true"></div>
          <div class="slide-container">
            <div class="hero-typography-block"${!isCoverTitleEnabled ? ' style="display:none !important;"' : ''}>
              <span class="hero-cat-pill">${escapeHtml(cat)}</span>
              <h1 class="hero-main-title">${escapeHtml(mainTitle)}</h1>
              ${subTitle ? `<h2 class="hero-subtitle">${escapeHtml(subTitle)}</h2>` : ''}
              ${bodyText ? `<p class="hero-description">${escapeHtml(bodyText)}</p>` : ''}
              ${isViewResearchEnabled ? `
              <a href="${escapeHtml(researchUrl)}" class="project-pill-btn hero-view-process-btn" id="heroViewProcessBtn" aria-label="View research">
                <span>View research</span>
                <span class="pill-arrow">&rarr;</span>
              </a>
              ` : ''}
            </div>
          </div>
        `;
      }
    }

    // 4. Subsequent project slides: Clean, pure, vibrant visuals without text and without black layers
    return `
      ${mediaMarkup}
    `;
  }

  let currentActiveIndex = 0;
  let isTransitioning = false;
  let allSectionsCount = 0;

  /**
   * Jump or glide directly to a specific slide index with cinematic physical easing
   * Current slide: slight horizontal movement, subtle scale-down (0.94), fade
   * Next slide: enters physically from screen edge, scales 98% -> 100%, fades in
   */
  function goToSlide(targetIndex, forcedDirection = null) {
    if (allSectionsCount <= 1 || isTransitioning) return;
    if (targetIndex === currentActiveIndex) return;

    const clampedIndex = Math.max(0, Math.min(targetIndex, allSectionsCount - 1));
    if (clampedIndex === currentActiveIndex) return;

    const direction = forcedDirection || (clampedIndex > currentActiveIndex ? 'forward' : 'reverse');
    const currentSlide = document.getElementById(`slide-${currentActiveIndex}`);
    const nextSlide = document.getElementById(`slide-${clampedIndex}`);
    if (!currentSlide || !nextSlide) return;

    isTransitioning = true;

    // 1. Update Top-Right "View Full Project" CTA button state
    updateViewFullBtnState(clampedIndex);

    // 2. Setup physical enter/exit positions
    if (direction === 'forward') {
      // Next slide enters from right side
      nextSlide.className = 'project-slide-panel slide-enter-right';
      // Current slide exits to left with subtle scale-down
      currentSlide.className = 'project-slide-panel slide-exit-left';
    } else {
      // Previous slide enters from left side
      nextSlide.className = 'project-slide-panel slide-enter-left';
      // Current slide exits to right with subtle scale-down
      currentSlide.className = 'project-slide-panel slide-exit-right';
    }

    // Force browser reflow so transform transition executes reliably
    void nextSlide.offsetWidth;

    // 2. Smoothly animate target slide into active viewport position
    window.requestAnimationFrame(() => {
      nextSlide.className = 'project-slide-panel slide-active';
    });

    // 3. Finalize classes after cinematic transition duration
    let speed = 850;
    if (window.PortfolioData && typeof window.PortfolioData.get === 'function') {
      const d = window.PortfolioData.get();
      if (d && d.customization && d.customization.projectPage && d.customization.projectPage.transitionSpeed) {
        speed = parseInt(d.customization.projectPage.transitionSpeed, 10) || 850;
      }
    }

    setTimeout(() => {
      currentSlide.className = 'project-slide-panel';
      nextSlide.className = 'project-slide-panel slide-active';
      currentActiveIndex = clampedIndex;
      isTransitioning = false;
      const targetVid = nextSlide.querySelector('video.slide-bg-video');
      if (targetVid) {
        targetVid.muted = true;
        targetVid.defaultMuted = true;
        targetVid.play().catch(() => {});
      }
    }, speed);
  }

  function updateViewFullBtnState(clampedIndex) {
    const topResearchBtn = document.getElementById('projectTopResearchBtn');
    if (topResearchBtn && !isResearchView) {
      topResearchBtn.setAttribute('aria-label', 'View research');
    }
  }

  // Backward compatibility alias
  function scrollToSlide(slideIndex) {
    goToSlide(slideIndex);
  }

  let lenisInstance = null;

  /**
   * Initialize Lenis Smooth Scrolling for Project Page
   */
  function initLenis() {
    if (typeof window.Lenis === 'undefined') return null;
    try {
      const lenis = new window.Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 0.95,
        smoothTouch: false,
        touchMultiplier: 1.5,
        infinite: false
      });
      window.lenis = lenis;
      lenisInstance = lenis;

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      return lenis;
    } catch (err) {
      console.warn('Could not initialize Lenis smooth scroll:', err);
      return null;
    }
  }

  /**
   * Render Project Detail Case Study Flow (Normal Vertical Scroll Content)
   */
  function renderProjectDetailFlow(project, sections) {
    const mainTitle = project.title || project.shortTitle || 'Project Showcase';
    const cat = project.category ? resolveCategoryDisplayName(project.category, project.categoryLabel) : (project.categoryLabel || 'PRODUCT DESIGN');
    const desc = project.description || project.shortDesc || '';
    const role = project.role || 'Lead Industrial & Systems Designer';
    const timeline = project.timeline || '3 Months (2024)';
    const tools = project.tools || 'SolidWorks, KeyShot, CNC, 3D Printing';
    const deliverable = project.deliverable || 'Working Prototypes, Production Architecture & Spec';

    // 1. Overview & Specs
    const catTag = document.getElementById('pflowCategoryTag');
    if (catTag) catTag.textContent = cat;

    const titleEl = document.getElementById('pflowMainTitle');
    if (titleEl) titleEl.textContent = mainTitle;

    const bodyContainer = document.getElementById('pflowBodyContainer');
    if (bodyContainer && desc) {
      const paras = desc.split('\n\n').filter(Boolean);
      bodyContainer.innerHTML = paras.map(p => `<p class="pflow-body-text">${escapeHtml(p)}</p>`).join('');
    }

    const specRole = document.getElementById('specRole');
    if (specRole) specRole.textContent = role;
    const specTimeline = document.getElementById('specTimeline');
    if (specTimeline) specTimeline.textContent = timeline;
    const specTools = document.getElementById('specTools');
    if (specTools) specTools.textContent = tools;
    const specDeliverable = document.getElementById('specDeliverable');
    if (specDeliverable) specDeliverable.textContent = deliverable;

    // Update Header Text & Badge
    const pflowSectionTitle = document.getElementById('pflowSectionTitle');
    const pflowSectionSubtitle = document.getElementById('pflowSectionSubtitle');
    const pflowSectionTag = document.getElementById('pflowSectionTag');
    const pflowHeaderRow = document.querySelector('.pflow-header-row') || document.querySelector('.gallery-header-row');

    const isShowcaseHeaderEnabled = checkIsShowcaseHeaderEnabled(project);
    if (!isShowcaseHeaderEnabled) {
      if (pflowHeaderRow) pflowHeaderRow.style.display = 'none';
    } else {
      if (pflowHeaderRow) pflowHeaderRow.style.display = '';
    }

    if (isResearchView) {
      if (pflowSectionTitle) pflowSectionTitle.textContent = project.researchHeaderTitle || 'RESEARCH & PROCESS SHOWCASE';
      if (pflowSectionSubtitle) pflowSectionSubtitle.textContent = project.researchHeaderSubtitle || 'Iterative benchmarking, CAD topology, and hands-on assembly.';
      if (pflowSectionTag) pflowSectionTag.textContent = project.researchHeaderTag || 'RESEARCH STUDIES 16:9 SHOWCASE';
    } else {
      const globalCust = (window.PortfolioData && typeof window.PortfolioData.get === 'function') ? window.PortfolioData.get()?.customization?.projectPage : {};
      const customTitle = (project.showcaseHeaderTitle && project.showcaseHeaderTitle.trim()) || globalCust?.showcaseHeaderTitle || 'VISUAL SHOWCASE';
      const customSubtitle = (project.showcaseHeaderSubtitle && project.showcaseHeaderSubtitle.trim()) || globalCust?.showcaseHeaderSubtitle || 'Form, ergonomics, and production detail studies.';
      const customTag = (project.showcaseHeaderTag && project.showcaseHeaderTag.trim()) || globalCust?.showcaseHeaderTag || 'DESIGN ARCHITECTURE 16:9 SHOWCASE';

      if (pflowSectionTitle) pflowSectionTitle.textContent = customTitle;
      if (pflowSectionSubtitle) pflowSectionSubtitle.textContent = customSubtitle;
      if (pflowSectionTag) pflowSectionTag.textContent = customTag;
    }

    // 2. Showcase Images Stack
    const gallerySection = document.getElementById('projectGallerySection');
    const galleryStack = document.getElementById('pflowGalleryStack');
    if (galleryStack) {
      galleryStack.innerHTML = '';
      const pool = [];
      const imageList = isResearchView
        ? (Array.isArray(project.processImages) && project.processImages.length > 0 ? project.processImages : [])
        : (Array.isArray(project.showcaseImages) && project.showcaseImages.length > 0 ? project.showcaseImages : []);

      function isSameMedia(a, b) {
        if (!a || !b) return false;
        if (a === b) return true;
        const cleanA = String(a).replace(/^[./\\]+/, '').toLowerCase();
        const cleanB = String(b).replace(/^[./\\]+/, '').toLowerCase();
        return cleanA === cleanB;
      }

      if (Array.isArray(imageList) && imageList.length > 0) {
        imageList.forEach(img => {
          const src = typeof img === 'string' ? img : (img.src || img.url);
          const alt = typeof img === 'string' ? mainTitle : (img.alt || img.title || mainTitle);
          const isVid = (typeof img === 'object' && Boolean(img.isVideo || img.mediaType === 'video')) ||
            (typeof src === 'string' && (src.includes('.mp4') || src.includes('.webm') || src.startsWith('data:video/')));
          if (src && !pool.some(x => isSameMedia(x.src, src))) pool.push({ src, alt, isVideo: isVid });
        });
      } else if (!isResearchView && Array.isArray(sections)) {
        // Fallback ONLY when no showcase/process images were configured
        sections.forEach(s => {
          const sMedia = s.video || s.image;
          if (sMedia && !pool.some(x => isSameMedia(x.src, sMedia))) {
            pool.push({ src: sMedia, alt: s.title || mainTitle, isVideo: Boolean(s.video) });
          }
        });
      }

      const firstSec = sections && sections[0];
      const heroCoverSrc = (firstSec ? (firstSec.video || firstSec.image) : (pool[0] && pool[0].src)) || '';
      const thumbImgSrc = project.image || '';
      const thumbVidSrc = project.video || project.videoUrl || '';

      const displayPool = pool.filter((item, idx) => {
        // Exclude the hero cover and thumbnail visual so it is never displayed twice on the page
        if (heroCoverSrc && isSameMedia(item.src, heroCoverSrc)) return false;
        if (idx === 0) return false;
        if (thumbImgSrc && isSameMedia(item.src, thumbImgSrc)) return false;
        if (thumbVidSrc && isSameMedia(item.src, thumbVidSrc)) return false;
        return true;
      });

      if (displayPool.length === 0) {
        if (gallerySection) gallerySection.style.display = 'none';
      } else {
        if (gallerySection) gallerySection.style.display = '';
        displayPool.forEach((item) => {
          const itemEl = document.createElement('div');
          itemEl.className = 'pflow-gallery-item';
          const isVid = Boolean(item.isVideo || (typeof item.src === 'string' && (item.src.includes('.mp4') || item.src.includes('.webm') || item.src.startsWith('data:video/'))));
          if (isVid) {
            itemEl.innerHTML = `
              <video class="pflow-gallery-video" autoplay muted loop playsinline src="${escapeHtml(resolveMediaUrl(item.src))}"></video>
            `;
            const v = itemEl.querySelector('video');
            if (v) {
              v.muted = true;
              v.defaultMuted = true;
              v.playsInline = true;
              v.setAttribute('muted', '');
              v.setAttribute('autoplay', '');
              v.setAttribute('loop', '');
              v.setAttribute('playsinline', '');
              v.play().catch(() => {});
            }
          } else {
            itemEl.innerHTML = `
              <img src="${escapeHtml(resolveMediaUrl(item.src))}" alt="${escapeHtml(item.alt)}" loading="lazy">
            `;
          }
          galleryStack.appendChild(itemEl);
        });
      }
    }

    // 2.5 Vertical 9:16 Showcase (2 Columns per Row)
    const verticalSection = document.getElementById('projectVerticalSection');
    const verticalGrid = document.getElementById('pflowVerticalGrid');
    const isVerticalEnabled = checkIsVerticalSectionEnabled(project);

    if (verticalSection && !isVerticalEnabled) {
      verticalSection.style.display = 'none';
    } else if (verticalSection && verticalGrid) {
      const pflowVerticalTitle = document.getElementById('pflowVerticalTitle');
      const pflowVerticalSubtitle = document.getElementById('pflowVerticalSubtitle');
      const pflowVerticalTag = document.getElementById('pflowVerticalTag');

      const globalCust = (window.PortfolioData && typeof window.PortfolioData.get === 'function') ? window.PortfolioData.get()?.customization?.projectPage : {};
      const customVertTitle = (project.verticalSectionTitle && project.verticalSectionTitle.trim()) || globalCust?.verticalSectionTitle || 'VERTICAL STUDIES';
      const customVertSubtitle = (project.verticalSectionSubtitle && project.verticalSectionSubtitle.trim()) || globalCust?.verticalSectionSubtitle || 'Mobile interactions, vertical prototyping, and tactile ergonomics.';
      const customVertTag = (project.verticalSectionTag && project.verticalSectionTag.trim()) || globalCust?.verticalSectionTag || 'MOBILE INTERFACE 9:16 SHOWCASE';

      if (pflowVerticalTitle) pflowVerticalTitle.textContent = customVertTitle;
      if (pflowVerticalSubtitle) pflowVerticalSubtitle.textContent = customVertSubtitle;
      if (pflowVerticalTag) pflowVerticalTag.textContent = customVertTag;

      verticalGrid.innerHTML = '';
      const vPool = [];
      const vImageList = Array.isArray(project.verticalImages) ? project.verticalImages : [];

      vImageList.forEach((img, idx) => {
        const src = typeof img === 'string' ? img : (img.src || img.url);
        const alt = typeof img === 'string' ? `${mainTitle} Mobile Study ${idx + 1}` : (img.alt || img.title || `${mainTitle} Mobile Study ${idx + 1}`);
        const isVid = (typeof img === 'object' && Boolean(img.isVideo || img.mediaType === 'video')) ||
          (typeof src === 'string' && (src.includes('.mp4') || src.includes('.webm') || src.startsWith('data:video/')));
        if (src) vPool.push({ src, alt, isVideo: isVid });
      });

      if (vPool.length === 0) {
        verticalSection.style.display = 'none';
      } else {
        verticalSection.style.display = '';
        vPool.forEach((item) => {
          const itemEl = document.createElement('div');
          itemEl.className = 'pflow-vertical-item';
          const isVid = Boolean(item.isVideo || (typeof item.src === 'string' && (item.src.includes('.mp4') || item.src.includes('.webm') || item.src.startsWith('data:video/'))));
          if (isVid) {
            itemEl.innerHTML = `
              <video class="pflow-vertical-video" autoplay muted loop playsinline src="${escapeHtml(resolveMediaUrl(item.src))}"></video>
            `;
            const v = itemEl.querySelector('video');
            if (v) {
              v.muted = true;
              v.defaultMuted = true;
              v.playsInline = true;
              v.setAttribute('muted', '');
              v.setAttribute('autoplay', '');
              v.setAttribute('loop', '');
              v.setAttribute('playsinline', '');
              v.play().catch(() => {});
            }
          } else {
            itemEl.innerHTML = `
              <img src="${escapeHtml(resolveMediaUrl(item.src))}" alt="${escapeHtml(item.alt)}" loading="lazy">
            `;
          }
          verticalGrid.appendChild(itemEl);
        });
      }
    }

    // 3. Prototyping & Process Grid
    const processGrid = document.getElementById('pflowProcessGrid');
    const processSec = document.getElementById('projectProcessSection');
    if (processGrid) {
      processGrid.innerHTML = '';
      const procList = Array.isArray(project.processImages) ? project.processImages : [];
      if (procList.length > 0) {
        if (processSec) processSec.style.display = '';
        procList.forEach((item, idx) => {
          const src = typeof item === 'string' ? item : (item.src || item.url);
          const title = typeof item === 'string' ? `Process Step 0${idx + 1}` : (item.alt || item.title || `Phase 0${idx + 1}`);
          const isProcVid = (typeof item === 'object' && Boolean(item.isVideo || item.mediaType === 'video')) ||
            (typeof src === 'string' && (src.includes('.mp4') || src.includes('.webm') || src.startsWith('data:video/')));
          const card = document.createElement('div');
          card.className = 'pflow-process-card';
          card.innerHTML = `
            <div class="pflow-process-img-wrap">
              <span class="pflow-process-step-badge">STEP 0${idx + 1}</span>
              ${isProcVid
                ? `<video class="pflow-process-video" autoplay muted loop playsinline src="${escapeHtml(resolveMediaUrl(src))}"></video>`
                : `<img src="${escapeHtml(resolveMediaUrl(src))}" alt="${escapeHtml(title)}" loading="lazy">`
              }
            </div>
            <div class="pflow-process-content">
              <h4 class="pflow-process-title">${escapeHtml(title)}</h4>
              <p class="pflow-process-desc">Physical fabrication and precision dimensional validation.</p>
            </div>
          `;
          if (isProcVid) {
            const v = card.querySelector('video');
            if (v) {
              v.muted = true;
              v.defaultMuted = true;
              v.playsInline = true;
              v.setAttribute('muted', '');
              v.setAttribute('autoplay', '');
              v.setAttribute('loop', '');
              v.setAttribute('playsinline', '');
              v.play().catch(() => {});
            }
          }
          processGrid.appendChild(card);
        });
      } else {
        if (processSec) processSec.style.display = 'none';
      }
    }
  }

  /**
   * Setup Smooth Navigation & Unblocked Scroll Engine
   * Normal vertical scroll passes through cleanly; horizontal gestures slide hero deck
   */
  function setupScrollEngine(sections) {
    const totalSlides = sections.length;
    allSectionsCount = totalSlides;

    if (totalSlides === 0) return;

    // 1. Mouse Wheel & Trackpad Gesture:
    // Only capture horizontal swipes for slide deck; NEVER block vertical scrolling!
    let hAccumulator = 0;
    let hResetTimer = null;

    window.addEventListener('wheel', (e) => {
      // If user is scrolled down into case study, don't hijack anything
      if (window.scrollY > 80) return;

      // Only respond to deliberate horizontal swipe gestures (e.g. trackpad left/right)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 2.5 && Math.abs(e.deltaX) > 20) {
        if (isTransitioning) return;
        hAccumulator += e.deltaX;
        clearTimeout(hResetTimer);
        hResetTimer = setTimeout(() => { hAccumulator = 0; }, 180);

        if (Math.abs(hAccumulator) >= 40) {
          if (hAccumulator > 0 && currentActiveIndex < totalSlides - 1) {
            goToSlide(currentActiveIndex + 1, 'forward');
          } else if (hAccumulator < 0 && currentActiveIndex > 0) {
            goToSlide(currentActiveIndex - 1, 'reverse');
          }
          hAccumulator = 0;
        }
      }
    }, { passive: true });

    // 2. Keyboard Navigation: Left/Right for hero slides; Up/Down for normal page scrolling
    window.addEventListener('keydown', (e) => {
      if (window.scrollY > 100) return; // In case study, use standard page keys
      if (e.key === 'ArrowRight') {
        if (currentActiveIndex < totalSlides - 1) {
          e.preventDefault();
          goToSlide(currentActiveIndex + 1, 'forward');
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentActiveIndex > 0) {
          e.preventDefault();
          goToSlide(currentActiveIndex - 1, 'reverse');
        }
      }
    });

    // 3. Touch Swipe Navigation on Hero Cover (horizontal swipes only)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (window.scrollY > 80) return;
      if (e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const timeDiff = Date.now() - touchStartTime;

        // If swipe was predominantly horizontal, navigate slides
        if (Math.abs(deltaX) > Math.abs(deltaY) * 1.8 && Math.abs(deltaX) > 40 && timeDiff < 700) {
          if (deltaX < 0 && currentActiveIndex < totalSlides - 1) {
            goToSlide(currentActiveIndex + 1, 'forward');
          } else if (deltaX > 0 && currentActiveIndex > 0) {
            goToSlide(currentActiveIndex - 1, 'reverse');
          }
        }
      }
    }, { passive: true });

    // 4. Window Resize Re-alignment
    window.addEventListener('resize', () => {
      const activeSlide = document.getElementById(`slide-${currentActiveIndex}`);
      if (activeSlide && !activeSlide.classList.contains('slide-active')) {
        activeSlide.className = 'project-slide-panel slide-active';
      }
    });
  }

  // Backward-compatible alias
  window.goToSlide = goToSlide;

  /**
   * Setup Click Navigation for Scroll Down Pill & Top-Right CTA
   */
  function setupScrollPrompts() {
    const heroViewProcessBtn = document.getElementById('heroViewProcessBtn');
    if (heroViewProcessBtn) {
      heroViewProcessBtn.addEventListener('click', (e) => {
        const href = heroViewProcessBtn.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          window.location.href = href;
        }
      });
    }

    const heroViewProjectBtn = document.getElementById('heroViewProjectBtn');
    if (heroViewProjectBtn) {
      heroViewProjectBtn.addEventListener('click', (e) => {
        const href = heroViewProjectBtn.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          window.location.href = href;
        }
      });
    }
  }

  /**
   * Navbar Header Scroll Transition on Project Page
   * Toggles frosted glass background, blur, border and elevation dynamically on scroll
   */
  function initHeaderScroll() {
    const header = document.getElementById('siteHeader');
    if (!header) return;

    function onScroll(y) {
      const scrollY = (typeof y === 'number') ? y : (window.scrollY || window.pageYOffset || 0);
      if (scrollY > 20) {
        header.classList.add('header-scrolled');
        header.classList.add('scrolled');
        header.classList.add('header-light-theme');
      } else {
        header.classList.remove('header-scrolled');
        header.classList.remove('scrolled');
        header.classList.remove('header-light-theme');
      }
    }

    window.addEventListener('scroll', () => onScroll(), { passive: true });
    if (lenisInstance) {
      lenisInstance.on('scroll', (e) => {
        const y = (e && typeof e.scroll === 'number') ? e.scroll : window.scrollY;
        onScroll(y);
      });
    }
    onScroll();
  }

  /**
   * Auto-hide both Top-Left ("Back to Work") and Top-Right ("View research") CTA buttons
   * after 3 seconds of inactivity.
   * During scrolling, CTA buttons are strictly hidden (never displayed while scrolling).
   * Reappears only when user deliberately hovers near the top edge (<= 90px) while not scrolling.
   */
  function setupTopControlsAutoHide() {
    const leftBar = document.getElementById('projectTopLeftBar');
    const rightBar = document.getElementById('projectTopRightBar');
    const controlsContainer = document.getElementById('projectTopControls');
    if (!leftBar && !rightBar && !controlsContainer) return;

    const autoHideSec = 3;

    let hideTimer = null;
    let isMouseNearTop = false;
    let isScrolling = false;
    let scrollStopTimer = null;

    function showControls() {
      if (isScrolling) return; // Strictly suppressed during scrolling
      if (leftBar) leftBar.classList.remove('controls-hidden');
      if (rightBar) rightBar.classList.remove('controls-hidden');
    }

    function hideControls() {
      if (window.innerWidth > 860 && leftBar) leftBar.classList.add('controls-hidden');
      if (rightBar) rightBar.classList.add('controls-hidden');
    }

    function resetTimer() {
      clearTimeout(hideTimer);
      if (isScrolling) {
        hideControls();
        return;
      }
      showControls();
      if (!isMouseNearTop) {
        hideTimer = setTimeout(() => {
          if (!isMouseNearTop) {
            hideControls();
          }
        }, autoHideSec * 1000);
      }
    }

    // Auto-hide starts after 3 seconds on page load
    resetTimer();

    // When user is scrolling, strictly HIDE the CTA buttons and never show them
    function onScrollActivity() {
      isScrolling = true;
      isMouseNearTop = false;
      clearTimeout(hideTimer);
      hideControls();

      clearTimeout(scrollStopTimer);
      scrollStopTimer = setTimeout(() => {
        isScrolling = false;
      }, 250);
    }

    window.addEventListener('scroll', onScrollActivity, { passive: true });
    window.addEventListener('wheel', onScrollActivity, { passive: true });
    window.addEventListener('touchmove', onScrollActivity, { passive: true });

    if (lenisInstance) {
      lenisInstance.on('scroll', onScrollActivity);
    }

    // Mouse movement detection: hover near top (<= 90px) restores buttons ONLY when not scrolling
    window.addEventListener('mousemove', (e) => {
      if (isScrolling) return;
      if (e.clientX === 0 && e.clientY === 0) return;

      if (e.clientY <= 90) {
        isMouseNearTop = true;
        showControls();
        clearTimeout(hideTimer);
      } else if (isMouseNearTop) {
        isMouseNearTop = false;
        resetTimer();
      }
    }, { passive: true });

    // Hover directly on button bars or controls keeps them visible indefinitely when not scrolling
    [leftBar, rightBar, controlsContainer].forEach(bar => {
      if (!bar) return;
      bar.addEventListener('mouseenter', () => {
        if (isScrolling) return;
        isMouseNearTop = true;
        showControls();
        clearTimeout(hideTimer);
      });
      bar.addEventListener('mouseleave', () => {
        isMouseNearTop = false;
        resetTimer();
      });
    });

    // Touch device support
    window.addEventListener('touchstart', (e) => {
      if (isScrolling) return;
      if (e.touches && e.touches[0] && e.touches[0].clientY <= 110) {
        isMouseNearTop = true;
        showControls();
        clearTimeout(hideTimer);
      } else {
        isMouseNearTop = false;
        resetTimer();
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isMouseNearTop = false;
      resetTimer();
    }, { passive: true });
  }

  /**
   * Connect and Appearance Customization Hydration
   */
  function hydrateCustomization() {
    if (!window.PortfolioData) return;
    const data = window.PortfolioData.get();
    if (!data) return;

    // Apply colors and theme tokens
    if (data.customization) {
      const cust = data.customization;
      const root = document.documentElement;
      if (cust.colors) {
        const primary = cust.colors.primary || cust.colors.maroon || '#13294A';
        const headerBg = cust.colors.headerBg || cust.colors.maroonDark || primary;
        const boldText = cust.colors.boldText || primary;
        const buttons = cust.colors.buttons || primary;
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
        root.style.setProperty('--connect-bg-color', headerBg);

        const connectSec = document.getElementById('connect');
        if (connectSec) connectSec.style.backgroundColor = headerBg;
        const bgLayer = document.getElementById('connectBgLayer');
        if (bgLayer) bgLayer.style.backgroundColor = headerBg;
      }

      // Hydrate Connect Background
      if (cust.backgrounds && cust.backgrounds.connect) {
        const bgLayer = document.getElementById('connectBgLayer');
        const connectSec = document.getElementById('connect');
        const cBg = cust.backgrounds.connect;
        const isColor = cBg.type === 'color' || (!cBg.image && cBg.color);
        const colorVal = cBg.color || (cust.colors && cust.colors.headerBg) || '#13294A';

        if (isColor) {
          root.style.setProperty('--connect-bg-color', colorVal);
          root.style.setProperty('--connect-bg-image', 'none');
          if (connectSec) connectSec.style.backgroundColor = colorVal;
          if (bgLayer) {
            bgLayer.style.backgroundImage = 'none';
            bgLayer.style.backgroundColor = colorVal;
          }
        } else if (cBg.image) {
          root.style.setProperty('--connect-bg-image', `url('${cBg.image}')`);
          root.style.setProperty('--connect-bg-color', 'transparent');
          if (bgLayer) {
            bgLayer.style.backgroundImage = `url('${cBg.image}')`;
            bgLayer.style.backgroundColor = 'transparent';
          }
        }
      }

      // Hydrate Project Page Controls
      if (cust.projectPage && cust.projectPage.backBtnText) {
        const backBtn = document.getElementById('projectBackBtn');
        if (backBtn) {
          const arrow = backBtn.querySelector('.pill-arrow');
          const defaultArrowHtml = '<span class="pill-arrow"><svg class="back-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg><span class="desktop-arrow">&larr;</span></span>';
          backBtn.innerHTML = `${arrow ? arrow.outerHTML : defaultArrowHtml} <span class="back-btn-text">${escapeHtml(cust.projectPage.backBtnText)}</span>`;
        }
      }
    }

    // Hydrate Connect Info
    if (data.connect) {
      const targetEmailText = document.getElementById('targetEmailText');
      if (targetEmailText && data.connect.email) {
        targetEmailText.textContent = data.connect.email;
      }
      const resumeBtn = document.getElementById('downloadResumeBtn');
      if (resumeBtn && data.connect.resumeUrl) {
        resumeBtn.href = data.connect.resumeUrl;
      }
    }
  }

  /**
   * Initialize Parallax and Unified Glass Lens
   */
  function initParallaxAndLens() {
    if (window.PortfolioComponents) {
      if (window.PortfolioComponents.Lens) {
        window.PortfolioComponents.Lens.init();
      }
      if (window.PortfolioComponents.Navbar) {
        window.PortfolioComponents.Navbar.init();
      }
      if (window.PortfolioComponents.ConnectParallax) {
        window.PortfolioComponents.ConnectParallax.init();
      }
    }

    // Contact modal & open/close buttons
    const contactModal = document.getElementById('contactModal');
    const closeContactModal = document.getElementById('closeContactModal');
    const shootEmailBtn = document.getElementById('shootEmailBtn');

    if (shootEmailBtn && contactModal) {
      shootEmailBtn.addEventListener('click', (e) => {
        e.preventDefault();
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
    }

    // Direct email copy button
    const copyEmailBtn = document.getElementById('copyEmailBtn');
    const copyEmailLabel = document.getElementById('copyEmailLabel');
    if (copyEmailBtn && copyEmailLabel) {
      copyEmailBtn.addEventListener('click', () => {
        const email = document.getElementById('targetEmailText')?.textContent || 'pawankushwaha1@gmail.com';
        navigator.clipboard.writeText(email).then(() => {
          copyEmailLabel.textContent = 'Copied!';
          setTimeout(() => { copyEmailLabel.textContent = 'Copy'; }, 2000);
        }).catch(() => {});
      });
    }

    // Quick inquiry form
    const inquiryForm = document.getElementById('quickInquiryForm');
    if (inquiryForm) {
      inquiryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const subj = encodeURIComponent(document.getElementById('inqSubject')?.value || '');
        const body = encodeURIComponent(document.getElementById('inqBody')?.value || '');
        const email = document.getElementById('targetEmailText')?.textContent || 'pawankushwaha1@gmail.com';
        window.location.href = `mailto:${email}?subject=${subj}&body=${body}`;
      });
    }
  }

  /**
   * First Page Dynamic Optical Liquid Wave Displacement Distortion Engine
   * Animated SVG feDisplacementMap + feTurbulence with interactive cursor physics
   */
  let _heroDistortionRaf = null;

  function initFirstPageDistortion(project) {
    const turbulence = document.getElementById('heroTurbulence');
    const displacement = document.getElementById('heroDisplacement');
    const slide0 = document.getElementById('slide-0');
    if (!slide0) return;

    // Check whether waves animation is enabled (per-project or globally)
    const isWavesEnabled = (function() {
      if (project && project.wavesAnimation !== undefined && project.wavesAnimation !== null) {
        return Boolean(project.wavesAnimation);
      }
      if (window.PortfolioData && typeof window.PortfolioData.get === 'function') {
        const d = window.PortfolioData.get();
        if (d?.customization?.projectPage?.wavesAnimation !== undefined) {
          return Boolean(d.customization.projectPage.wavesAnimation);
        }
        if (d?.customization?.projectPage?.enableWavesAnimation !== undefined) {
          return Boolean(d.customization.projectPage.enableWavesAnimation);
        }
      }
      return true;
    })();

    const bgLayer = slide0.querySelector('.slide-bg-layer');
    const bgVideo = slide0.querySelector('.slide-bg-video');
    const mesh = slide0.querySelector('.hero-distortion-mesh');

    if (!isWavesEnabled) {
      document.documentElement.classList.add('waves-animation-off');
      document.body.classList.add('waves-animation-off');
      slide0.classList.add('no-waves');
      slide0.querySelectorAll('.slide-bg-layer').forEach(layer => {
        layer.style.filter = 'none';
        layer.style.transform = 'none';
      });
      if (bgVideo) {
        bgVideo.style.filter = 'none';
        bgVideo.style.transform = 'none';
      }
      if (mesh) {
        mesh.style.display = 'none';
      }
      if (_heroDistortionRaf) {
        cancelAnimationFrame(_heroDistortionRaf);
        _heroDistortionRaf = null;
      }
      return;
    }

    // Waves are active
    document.documentElement.classList.remove('waves-animation-off');
    document.body.classList.remove('waves-animation-off');
    slide0.classList.remove('no-waves');
    slide0.querySelectorAll('.slide-bg-layer').forEach(layer => {
      layer.style.filter = '';
      layer.style.transform = '';
    });
    if (bgVideo) {
      bgVideo.style.filter = '';
      bgVideo.style.transform = '';
    }
    if (mesh) {
      mesh.style.display = '';
    }

    if (!turbulence || !displacement) return;

    if (_heroDistortionRaf) {
      cancelAnimationFrame(_heroDistortionRaf);
      _heroDistortionRaf = null;
    }

    let targetScale = 6;
    let currentScale = 6;
    const baseScale = 6;
    let lastX = 0;
    let lastY = 0;
    let lastTime = performance.now();
    let timeOffset = 0;

    // Interactive mouse movement physics
    window.addEventListener('mousemove', (e) => {
      if (currentActiveIndex !== 0) return;

      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const velocity = (dist / dt) * 16; // Normalized px per frame

      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;

      // Update cursor position for caustic optical refraction highlight
      slide0.style.setProperty('--mouse-x', `${(e.clientX / window.innerWidth * 100).toFixed(1)}%`);
      slide0.style.setProperty('--mouse-y', `${(e.clientY / window.innerHeight * 100).toFixed(1)}%`);

      // Fluid displacement wave reaction based on cursor speed
      targetScale = Math.min(36, baseScale + velocity * 1.25);
    }, { passive: true });

    // Touch support for tablets & mobiles
    window.addEventListener('touchmove', (e) => {
      if (currentActiveIndex !== 0 || !e.touches[0]) return;
      const t = e.touches[0];
      slide0.style.setProperty('--mouse-x', `${(t.clientX / window.innerWidth * 100).toFixed(1)}%`);
      slide0.style.setProperty('--mouse-y', `${(t.clientY / window.innerHeight * 100).toFixed(1)}%`);
      targetScale = 24;
    }, { passive: true });

    window.addEventListener('touchend', () => {
      targetScale = baseScale;
    }, { passive: true });

    // Continuous 60fps organic breathing & displacement loop
    function animateDistortion() {
      if (currentActiveIndex === 0) {
        timeOffset += 0.009;

        // Smoothly interpolate currentScale towards targetScale
        currentScale += (targetScale - currentScale) * 0.085;
        // Ease targetScale back towards baseScale
        targetScale += (baseScale - targetScale) * 0.04;

        // Subtle fluid turbulence modulation
        const freqX = (0.013 + Math.sin(timeOffset * 0.9) * 0.003).toFixed(4);
        const freqY = (0.017 + Math.cos(timeOffset * 0.7) * 0.003).toFixed(4);

        turbulence.setAttribute('baseFrequency', `${freqX} ${freqY}`);
        displacement.setAttribute('scale', currentScale.toFixed(2));
      }

      _heroDistortionRaf = requestAnimationFrame(animateDistortion);
    }

    _heroDistortionRaf = requestAnimationFrame(animateDistortion);
  }


  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Live cross-tab and in-tab synchronization with admin updates
  function checkAndSyncProjectData() {
    try {
      if (window.PortfolioData) {
        const d = PortfolioData.get();
        if (d && d.updatedAt && d.updatedAt !== lastProjectSyncTime) {
          lastProjectSyncTime = d.updatedAt;
          initProjectPage();
        }
      }
    } catch(e) {}
  }

  window.addEventListener('portfolioDataUpdated', () => {
    checkAndSyncProjectData();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === 'portfolio_custom_data') {
      checkAndSyncProjectData();
    }
  });

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('portfolio_sync_channel');
      bc.onmessage = (msg) => {
        if (msg.data && msg.data.type === 'PORTFOLIO_DATA_UPDATED') {
          checkAndSyncProjectData();
        }
      };
    } catch(e) {}
  }

  window.addEventListener('focus', checkAndSyncProjectData);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkAndSyncProjectData();
    }
  });

  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'PORTFOLIO_DATA_UPDATED') {
      checkAndSyncProjectData();
    }
  });

  setInterval(checkAndSyncProjectData, 1000);

})();
