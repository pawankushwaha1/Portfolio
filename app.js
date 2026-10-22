/**
 * Pawan K. Kushwaha Portfolio - Interactive Scripts
 * Handles animations, audio synthesis, lightbox, filtering, and modals
 */

// Global navigation reload detector: ensures refreshing anywhere on the site always lands at Hero section
function isPageReloadNavigation() {
  try {
    if (typeof performance !== 'undefined') {
      if (typeof performance.getEntriesByType === 'function') {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries && navEntries.length > 0) {
          return navEntries[0].type === 'reload';
        }
      }
      if (performance.navigation && performance.navigation.type === 1) {
        return true;
      }
    }
  } catch (e) {}
  return false;
}
window.isPageReloadNavigation = isPageReloadNavigation;

// Guarantee manual scroll restoration so browsers do not remember scroll positions on reload
if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
  try {
    history.scrollRestoration = 'manual';
  } catch (e) {}
}

// Global detection of return-to-work navigation from project pages
let initialReturnSlug = null;
try {
  const urlParams = new URLSearchParams(window.location.search);
  initialReturnSlug = urlParams.get('project') || urlParams.get('card') || urlParams.get('id');
} catch (e) {}

const isReturnToWorkNavigation = Boolean(initialReturnSlug && !isPageReloadNavigation());
if (isReturnToWorkNavigation && typeof document !== 'undefined' && document.documentElement) {
  document.documentElement.style.scrollBehavior = 'auto';
  document.documentElement.classList.add('navigating-to-work');
}

// Immediate reset on reload: clear return slug, clean URL hash/query, and force scroll to top before render
if (isPageReloadNavigation()) {
  try {
    sessionStorage.removeItem('selected_work_return_slug');
  } catch (e) {}
  if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {}
  }
  try {
    window.scrollTo(0, 0);
  } catch (e) {}
}

let isAppHydrated = false;
let lastKnownSyncTime = null;

function checkAndSyncAppData() {
  try {
    if (window.PortfolioData) {
      const d = PortfolioData.get();
      if (d && d.updatedAt && d.updatedAt !== lastKnownSyncTime) {
        lastKnownSyncTime = d.updatedAt;
        hydratePortfolioFromData();
      }
    }
  } catch(e) {}
}

function hydrateHeroCardsFast() {
  try {
    const pData = (window.PortfolioData && typeof window.PortfolioData.get === 'function') ? window.PortfolioData.get() : null;
    for (let i = 1; i <= 4; i++) {
      const cardEl = document.querySelector(`.hero-card-${i}`) || document.querySelector(`.hero-card[data-index="${i}"]`);
      if (cardEl) {
        const hc = pData?.heroCards?.[i - 1];
        if (hc && (hc.mediaType === 'video' || (!hc.mediaType && hc.video && !hc.image))) {
          continue; // Card is configured for video, do not force stale image
        }
        const img = cardEl.querySelector('img');
        const fast = localStorage.getItem(`fast_hero_card_${i}`);
        if (img && fast && !fast.startsWith('idb://')) {
          if (img.src !== fast && !img.src.endsWith(fast)) {
            img.src = fast;
          }
        }
      }
    }
  } catch(e) {}
}

async function startApp() {
  // 1. Immediately hydrate hero cards from synchronous cache with zero delay
  hydrateHeroCardsFast();

  // Wait for IndexedDB media cache only on fresh loads; bypass when returning to work to render instantly
  if (!isReturnToWorkNavigation && window.PortfolioMediaDB && typeof window.PortfolioMediaDB.waitForReady === 'function') {
    const hasFastCache = localStorage.getItem('fast_hero_card_1');
    if (!hasFastCache) {
      await window.PortfolioMediaDB.waitForReady(300);
    }
  }

  // Initialize UI interactive components
  initSmoothScroll();
  initNavbar();
  initNormalScrollEngine();
  initAboutAnimations();
  initHeroCardsAnimation();
  initHeroMobileGyro();
  initHeroCardsHover();
  initSectionParallax();
  initSpotifyWidget();
  initMagnifierCursor();
  initWorkFilter();
  initWorkShowcaseSlider();
  initGalleryLightbox();
  initGallerySlider();
  initContactModal();
  initPrototypesModal();
  initProtoSlider();
  initScrollAnimations();

  // Single authoritative hydration with preloaded media cache
  hydratePortfolioFromData();
  isAppHydrated = true;
  document.documentElement.classList.add('portfolio-hydrated');

  try {
    if (window.PortfolioData) {
      const d = PortfolioData.get();
      if (d && d.updatedAt) lastKnownSyncTime = d.updatedAt;
    }
  } catch(e) {}

  // Automatically fetch remote/server/cloud portfolio data so other devices stay synchronized
  if (window.PortfolioData && typeof window.PortfolioData.loadRemoteData === 'function') {
    window.PortfolioData.loadRemoteData().then(res => {
      if (res && res.adopted) {
        hydrateHeroCardsFast();
        hydratePortfolioFromData();
      }
    }).catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.PortfolioMediaDB && typeof window.PortfolioMediaDB.waitForReady === 'function') {
    await window.PortfolioMediaDB.waitForReady(800);
  }
  startApp();

  // Listen for IndexedDB preloading completion to re-hydrate any late-arriving media
  window.addEventListener('portfolioMediaReady', () => {
    hydrateHeroCardsFast();
    hydratePortfolioFromData();
  });

  // 1. Listen for live updates in same window
  window.addEventListener('portfolioDataUpdated', () => {
    if (window.PortfolioMediaDB && typeof window.PortfolioMediaDB.preloadAll === 'function') {
      window.PortfolioMediaDB.preloadAll().then(() => hydratePortfolioFromData()).catch(() => hydratePortfolioFromData());
    } else {
      hydratePortfolioFromData();
    }
  });

  // 2. Cross-tab storage event
  window.addEventListener('storage', (e) => {
    if (e.key === 'portfolio_custom_data') {
      if (window.PortfolioMediaDB && typeof window.PortfolioMediaDB.preloadAll === 'function') {
        window.PortfolioMediaDB.preloadAll().then(() => hydratePortfolioFromData()).catch(() => hydratePortfolioFromData());
      } else {
        hydratePortfolioFromData();
      }
    }
  });

  // 3. Multi-tab BroadcastChannel push
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('portfolio_sync_channel');
      bc.onmessage = (msg) => {
        if (msg.data && msg.data.type === 'PORTFOLIO_DATA_UPDATED') {
          if (window.PortfolioMediaDB && typeof window.PortfolioMediaDB.preloadAll === 'function') {
            window.PortfolioMediaDB.preloadAll().then(() => hydratePortfolioFromData()).catch(() => hydratePortfolioFromData());
          } else {
            hydratePortfolioFromData();
          }
        }
      };
    } catch(e) {}
  }

  // 4. In-tab focus & visibility restoration - only when data actually changed
  window.addEventListener('focus', checkAndSyncAppData);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkAndSyncAppData();
    }
  });

  // 5. PostMessage from admin panel or embedded iframe
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'PORTFOLIO_DATA_UPDATED') {
      hydratePortfolioFromData();
    }
  });

  // 6. 1000ms Heartbeat Sync (works even on file:// where cross-tab events may be restricted)
  setInterval(checkAndSyncAppData, 1000);
});

window.addEventListener('load', () => {
  if (isPageReloadNavigation()) {
    window.scrollTo(0, 0);
    if (window.lenis) {
      try {
        window.lenis.scrollTo(0, { immediate: true });
      } catch (e) {}
    }
    if (typeof window.portfolioGoToSection === 'function') {
      window.portfolioGoToSection(0, true);
    }
    if (typeof window.portfolioUpdateActiveStates === 'function') {
      window.portfolioUpdateActiveStates(0);
    }
  }
});

window.addEventListener('pageshow', (e) => {
  if (isPageReloadNavigation()) {
    window.scrollTo(0, 0);
    if (window.lenis) {
      try {
        window.lenis.scrollTo(0, { immediate: true });
      } catch (e) {}
    }
  }
});

/* ==========================================================================
   0. SMOOTH SCROLL ENGINE (LENIS LUXURY INERTIAL SCROLLING)
   ========================================================================== */
let lenisInstance = null;

function initSmoothScroll() {
  if (typeof window.Lenis === 'undefined') return null;

  try {
    const lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 0.92,
      smoothTouch: false, // Keep iOS/Android native swipe momentum
      touchMultiplier: 1.5,
      infinite: false,
    });

    window.lenis = lenis;
    lenisInstance = lenis;

    if (isPageReloadNavigation()) {
      try {
        lenis.scrollTo(0, { immediate: true });
      } catch (err) {}
    } else if (isReturnToWorkNavigation) {
      try {
        lenis.stop();
      } catch (err) {}
    }

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
window.initSmoothScroll = initSmoothScroll;

/* ==========================================================================
   1. NAVBAR & MOBILE DRAWER
   ========================================================================== */
function initNavbar() {
  const header = document.getElementById('siteHeader');
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  // Sticky header class on scroll (throttled with rAF for 60fps/120fps performance)
  let navScrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!navScrollTicking) {
      window.requestAnimationFrame(() => {
        if (header) {
          if (window.scrollY > 30) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
        }
        navScrollTicking = false;
      });
      navScrollTicking = true;
    }
  }, { passive: true });

  // Header remains permanently visible at the top
  function showHeader() {
    if (header) header.classList.remove('header-hidden');
  }

  window.showHeaderBriefly = showHeader;
  showHeader();

  // Mobile menu toggle
  if (toggleBtn && !toggleBtn.dataset.bound) {
    toggleBtn.dataset.bound = 'true';
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', !isExpanded);
      toggleBtn.classList.toggle('active');
      drawer.classList.toggle('open');
      if (drawer.classList.contains('open')) {
        header.classList.add('drawer-open');
      } else {
        header.classList.remove('drawer-open');
      }
    });
  }

  // Close drawer on link click
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.classList.remove('active');
      drawer.classList.remove('open');
      header.classList.remove('drawer-open');
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
      header.classList.remove('drawer-open');
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
    { id: 'about', href: '#about' },
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
   1b. SELECTED WORK CATEGORY STEPPING & VERTICAL CURTAIN ENGINE
   "when i scroll in SELECTED WORK, when i come from hero section to SELECTED WORK show product design, when scroll then show ui/ux design, then scroll show graphic design, then scroll from graphic design then go PROTOTYPING"
   ========================================================================== */
const WORK_CATEGORIES = ['product', 'uiux', 'graphic'];
let activeWorkCategory = 'product';
window.activeWorkCategory = activeWorkCategory;
window.WORK_CATEGORIES = WORK_CATEGORIES;
let isWorkCategoryTransitioning = false;

function setWorkCategory(category, animate = true, startAtEnd = false) {
  if (!WORK_CATEGORIES.includes(category)) return;
  activeWorkCategory = category;
  window.activeWorkCategory = activeWorkCategory;

  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(p => {
    const isCur = p.dataset.category === category;
    p.classList.toggle('active', isCur);
    p.setAttribute('aria-selected', isCur ? 'true' : 'false');
  });

  let targetCard = 0;
  if (typeof window.getCategoryStartIndex === 'function') {
    targetCard = window.getCategoryStartIndex(category, startAtEnd);
  } else {
    if (category === 'product') targetCard = startAtEnd ? 6 : 0;
    else if (category === 'uiux') targetCard = startAtEnd ? 9 : 7;
    else if (category === 'graphic') targetCard = startAtEnd ? 14 : 10;
  }

  if (typeof window.scrollWorkToCard === 'function') {
    window.scrollWorkToCard(targetCard);
  }
}
window.setWorkCategory = setWorkCategory;

function initNormalScrollEngine() {
  const panels = Array.from(document.querySelectorAll('.curtain-panel'));
  const hudRail = document.getElementById('heroHudRail');
  const hudCurrent = document.getElementById('hudCurrent');
  const hudDots = Array.from(document.querySelectorAll('.hud-dot'));
  const header = document.getElementById('siteHeader');

  if (panels.length === 0) return;

  const sectionsConfig = [
    { id: 'hero', index: '01', theme: 'dark', title: 'Home' },
    { id: 'about', index: '02', theme: 'light', title: 'About Me' },
    { id: 'work', index: '03', theme: 'light', title: 'Selected Work' },
    { id: 'prototyping', index: '04', theme: 'dark', title: 'Prototyping' },
    { id: 'gallery', index: '05', theme: 'light', title: 'Gallery' },
    { id: 'connect', index: '06', theme: 'dark', title: 'Connect' }
  ];

  const sectionIdMap = {
    'hero': 0,
    'about': 1,
    'work': 2,
    'prototyping': 3,
    'gallery': 4,
    'connect': 5
  };
  window.portfolioSectionIdMap = sectionIdMap;

  let currentIndex = 0;

  function updateActiveStates(idx) {
    if (idx < 0 || idx >= sectionsConfig.length) return;
    currentIndex = idx;
    window.portfolioCurrentIndex = idx;
    const config = sectionsConfig[idx];
    if (!config) return;

    // 1. Mark panels
    panels.forEach((panel, pIdx) => {
      const isActive = pIdx === idx;
      panel.classList.toggle('is-active', isActive);
    });

    // 2. HUD Rail counter and active dot
    if (hudCurrent) hudCurrent.textContent = config.index;
    hudDots.forEach(dot => {
      const dotSec = dot.dataset.section;
      dot.classList.toggle('active', dotSec === config.id);
    });

    // 3. Adaptive light/dark theme for HUD Rail and Header
    if (hudRail) {
      hudRail.classList.toggle('hud-light-theme', config.theme === 'light');
    }
    if (header) {
      header.classList.toggle('header-light-theme', config.theme === 'light');
    }

    // 4. Desktop and Mobile navigation links active highlight
    const navHref = `#${config.id}`;
    document.querySelectorAll('.desktop-nav .nav-link, .mobile-nav-link').forEach(link => {
      const matches = link.getAttribute('href') === navHref;
      link.classList.toggle('active', matches);
    });

    // 5. Update URL hash without causing native scroll jump, keeping URL query clean
    if (window.location.hash !== navHref && history.replaceState) {
      history.replaceState(null, '', window.location.pathname + navHref);
    }
  }

  // Native scroll handler to update active state, header blur, and theme
  let scrollTicking = false;
  function handleScroll() {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;

        // Toggle header scrolled background blur
        if (header) {
          header.classList.toggle('header-scrolled', scrollY > 20);
        }

        // Update pinned horizontal card scroll progressions
        if (typeof window.updateWorkOnScroll === 'function') {
          window.updateWorkOnScroll(scrollY);
        }
        if (typeof window.updateProtoOnScroll === 'function') {
          window.updateProtoOnScroll(scrollY);
        }
        if (typeof window.updateGalleryOnScroll === 'function') {
          window.updateGalleryOnScroll(scrollY);
        }

        // Determine which section is currently on screen
        const probeY = scrollY + Math.min(window.innerHeight * 0.4, 250);
        let activeIdx = 0;
        for (let i = 0; i < panels.length; i++) {
          const p = panels[i];
          const top = p.offsetTop;
          const bottom = top + p.offsetHeight;
          if (probeY >= top && probeY < bottom) {
            activeIdx = i;
            break;
          } else if (probeY >= top) {
            activeIdx = i;
          }
        }

        updateActiveStates(activeIdx);
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  if (window.lenis) {
    window.lenis.on('scroll', () => {
      handleScroll();
    });
  }

  window.addEventListener('resize', () => {
    if (typeof window.updateWorkTrackHeights === 'function') window.updateWorkTrackHeights();
    if (typeof window.updateProtoTrackHeights === 'function') window.updateProtoTrackHeights();
    if (typeof window.updateGalleryTrackHeights === 'function') window.updateGalleryTrackHeights();
  });
  handleScroll();

  function goToSection(targetIdx, instant = false) {
    const clamped = Math.max(0, Math.min(targetIdx, sectionsConfig.length - 1));
    const targetSection = panels[clamped];
    if (targetSection) {
      if (instant) {
        if (window.lenis) {
          window.lenis.scrollTo(targetSection, { immediate: true });
        } else {
          targetSection.scrollIntoView({ behavior: 'auto' });
        }
      } else {
        if (window.lenis) {
          window.lenis.scrollTo(targetSection, { duration: 1.15 });
        } else {
          targetSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }

  window.portfolioGoToSection = goToSection;
  window.goToSection = goToSection;
  window.portfolioGetCurrentIndex = () => currentIndex;
  window.portfolioUpdateActiveStates = updateActiveStates;

  // Initialize view based on reload status, initial URL hash, or default to top (Hero)
  const isReload = isPageReloadNavigation();
  const initialHash = (window.location.hash || '').replace('#', '');
  let returnProjectSlug = null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    returnProjectSlug = urlParams.get('project') || urlParams.get('card') || urlParams.get('id');
  } catch (e) {}
  if (!returnProjectSlug && !isReload) {
    try {
      returnProjectSlug = sessionStorage.getItem('selected_work_return_slug');
    } catch (e) {}
  }

  if (isReload) {
    // On any page refresh, ALWAYS reset to the Hero section (top of screen)
    if (window.history && window.history.replaceState) {
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch (e) {}
    }
    try {
      sessionStorage.removeItem('selected_work_return_slug');
    } catch (e) {}
    window.scrollTo(0, 0);
    goToSection(0, true);
    updateActiveStates(0);
  } else if (isReturnToWorkNavigation || (initialHash === 'work')) {
    // Immediately lock active states and theme to Selected Work section
    currentIndex = sectionIdMap['work'];
    updateActiveStates(sectionIdMap['work']);
  } else if (initialHash && sectionIdMap[initialHash] !== undefined) {
    setTimeout(() => {
      goToSection(sectionIdMap[initialHash], true);
    }, 120);
  } else {
    // Fresh landing: ensure starting at Hero
    window.scrollTo(0, 0);
    goToSection(0, true);
    updateActiveStates(0);
  }

  // HUD dots click
  hudDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const dotSec = dot.dataset.section;
      const targetIdx = sectionsConfig.findIndex(s => s.id === dotSec);
      if (targetIdx !== -1) {
        goToSection(targetIdx);
      }
    });
  });

  // Nav links click
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      const targetId = href.replace('#', '');
      if (sectionIdMap[targetId] !== undefined) {
        e.preventDefault();
        goToSection(sectionIdMap[targetId]);

        // Close mobile drawer if open
        const drawer = document.getElementById('mobileDrawer');
        const toggle = document.getElementById('mobileMenuToggle');
        if (drawer && drawer.classList.contains('open')) {
          drawer.classList.remove('open');
          if (toggle) {
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
          }
        }
      }
    });
  });

  // Logo click -> scroll to top
  const logo = document.querySelector('.logo-script');
  if (logo) {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.lenis) {
        window.lenis.scrollTo(0, { duration: 1.15 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Hero scroll indicator
  const scrollIndicator = document.querySelector('.hero-scroll-indicator');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', (e) => {
      e.preventDefault();
      goToSection(1);
    });
  }

  // Pull-to-refresh prevention only at the very top of document
}

/* ==========================================================================
   1b. HERO OVERLAPPING CARDS ANIMATION ENGINE
   ========================================================================== */
function initHeroCardsAnimation() {
  const heroSection = document.getElementById('hero') || document.querySelector('.hero-section');
  if (!heroSection) return;

  function triggerAnimation() {
    if (!heroSection.classList.contains('hero-animated')) {
      requestAnimationFrame(() => {
        heroSection.classList.add('hero-animated');
      });
    }
  }

  // If already at hero on load
  if (heroSection.classList.contains('is-active') || window.scrollY < 300) {
    triggerAnimation();
  }

  // IntersectionObserver to guarantee triggering when hero is in view
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          triggerAnimation();
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 });
    observer.observe(heroSection);
  } else {
    setTimeout(triggerAnimation, 100);
  }
}
window.initHeroCardsAnimation = initHeroCardsAnimation;

/* ==========================================================================
   1b-ii. HERO SECTION MOBILE GYROSCOPE & 3D TILT ENGINE (Only for Hero Cards)
   ========================================================================== */
function initHeroMobileGyro() {
  const cluster = document.getElementById('heroCardsCluster');
  const heroSection = document.getElementById('hero') || document.querySelector('.hero-section');
  if (!cluster || !heroSection) return;

  // Respect user preference for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let targetGamma = 0; // roll: left/right tilt (-90 to +90)
  let targetBeta = 0;  // pitch: forward/backward tilt (-180 to +180)
  let currentGamma = 0;
  let currentBeta = 0;
  let centerGamma = null;
  let centerBeta = null;
  let hasGyro = false;
  let isRunning = false;
  let animId = null;

  // Smooth LERP frame tick (60fps/120fps)
  function tick() {
    if (!isRunning) return;

    // Only compute & update when Hero section is active on screen
    const isHeroActive = heroSection.classList.contains('is-active') ||
                         (!heroSection.classList.contains('is-above') && !heroSection.classList.contains('is-below'));

    if (isHeroActive) {
      // 0.08 smoothing factor gives organic weight and dampens hand tremor / rapid cursor flick
      currentGamma += (targetGamma - currentGamma) * 0.08;
      currentBeta += (targetBeta - currentBeta) * 0.08;

      let isMoving = true;
      if (!hasGyro && targetGamma === 0 && targetBeta === 0 &&
          Math.abs(currentGamma) < 0.03 && Math.abs(currentBeta) < 0.03) {
        currentGamma = 0;
        currentBeta = 0;
        isMoving = false;
      }

      // Rotation angles for 3D perspective tilt (amplified for high-impact visual depth)
      const rotY = (currentGamma * 0.75).toFixed(2);  // ~ -18deg to +18deg
      const rotX = (-currentBeta * 0.65).toFixed(2);  // ~ -14deg to +14deg

      // Layer translation offsets (depth parallax)
      const px = (currentGamma * 1.35).toFixed(2);   // ~ -32px to +32px
      const py = (currentBeta * 1.15).toFixed(2);    // ~ -25px to +25px

      cluster.style.setProperty('--gyro-rx', `${rotX}deg`);
      cluster.style.setProperty('--gyro-ry', `${rotY}deg`);
      cluster.style.setProperty('--gyro-px', `${px}px`);
      cluster.style.setProperty('--gyro-py', `${py}px`);

      if (!isMoving && !isTouching) {
        stopLoop();
        return;
      }
    }

    animId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (!isRunning) {
      isRunning = true;
      animId = requestAnimationFrame(tick);
    }
  }

  function stopLoop() {
    isRunning = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  // Gyro orientation event handler
  function handleOrientation(e) {
    if (e.gamma === null || e.beta === null) return;
    hasGyro = true;

    // Auto-calibrate natural resting angle on initial readings
    if (centerGamma === null || centerBeta === null) {
      centerGamma = e.gamma;
      centerBeta = e.beta;
    } else {
      // Gentle drift adaptation if user shifts hand position
      centerGamma += (e.gamma - centerGamma) * 0.003;
      centerBeta += (e.beta - centerBeta) * 0.003;
    }

    // Delta relative to resting posture, clamped to comfortable range
    const dGamma = Math.max(-28, Math.min(28, e.gamma - centerGamma));
    const dBeta = Math.max(-25, Math.min(25, e.beta - centerBeta));

    targetGamma = dGamma;
    targetBeta = dBeta;

    startLoop();
  }

  // Accelerometer fallback (runs on browsers where orientation is restricted)
  function handleMotion(e) {
    if (hasGyro) return;
    const acc = e.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null) return;

    const gx = acc.x;
    const gy = acc.y;

    if (centerGamma === null || centerBeta === null) {
      centerGamma = -gx * 3.5;
      centerBeta = (gy - 6.5) * 3.5;
    } else {
      centerGamma += (-gx * 3.5 - centerGamma) * 0.003;
      centerBeta += ((gy - 6.5) * 3.5 - centerBeta) * 0.003;
    }

    const dGamma = Math.max(-28, Math.min(28, -gx * 3.5 - centerGamma));
    const dBeta = Math.max(-25, Math.min(25, (gy - 6.5) * 3.5 - centerBeta));

    targetGamma = dGamma;
    targetBeta = dBeta;
    startLoop();
  }

  // Touch fallback / interactive drag on cards (works on touch devices & simulators)
  let touchStartX = 0;
  let touchStartY = 0;
  let isTouching = false;

  heroSection.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isTouching = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      startLoop();
    }
  }, { passive: true });

  heroSection.addEventListener('touchmove', (e) => {
    if (!isTouching || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    // Map screen touch displacement to simulated tilt (-28 to +28)
    targetGamma = Math.max(-28, Math.min(28, dx * 0.25));
    targetBeta = Math.max(-25, Math.min(25, dy * 0.25));
  }, { passive: true });

  const endTouch = () => {
    isTouching = false;
    if (!hasGyro) {
      // Smoothly return to center if no hardware gyro active
      targetGamma = 0;
      targetBeta = 0;
    }
  };
  heroSection.addEventListener('touchend', endTouch, { passive: true });
  heroSection.addEventListener('touchcancel', endTouch, { passive: true });

  // Cursor movement drives gyroscope 3D tilt & parallax animation on desktop
  heroSection.addEventListener('mousemove', (e) => {
    if (hasGyro) return;
    const rect = heroSection.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Relative offset from hero center: -0.5 to +0.5
    const nx = ((e.clientX - rect.left) / rect.width) - 0.5;
    const ny = ((e.clientY - rect.top) / rect.height) - 0.5;

    // Map to simulated gyroscope roll (gamma) and pitch (beta)
    targetGamma = Math.max(-24, Math.min(24, nx * 44));
    targetBeta = Math.max(-20, Math.min(20, ny * 36));

    startLoop();
  }, { passive: true });

  heroSection.addEventListener('mouseleave', () => {
    if (!hasGyro) {
      targetGamma = 0;
      targetBeta = 0;
      startLoop();
    }
  }, { passive: true });

  // Unconditionally attach deviceorientation and devicemotion listeners
  try {
    window.addEventListener('deviceorientation', handleOrientation, true);
    window.addEventListener('devicemotion', handleMotion, true);
  } catch (err) {}

  // iOS 13+ permission request on first user gesture
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    const requestIosGyro = () => {
      DeviceOrientationEvent.requestPermission().then(state => {
        if (state === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      }).catch(() => {});
      window.removeEventListener('touchend', requestIosGyro);
    };
    window.addEventListener('touchend', requestIosGyro, { once: true, passive: true });
  }

  // Developer / test helper to simulate gyro angles
  window.simulateHeroGyro = (gamma, beta) => {
    handleOrientation({ gamma, beta });
  };

  // Performance: Pause when page is hidden / tab switched
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
    } else {
      startLoop();
    }
  });

  // Start the render loop initially
  startLoop();
}
window.initHeroMobileGyro = initHeroMobileGyro;

/* ==========================================================================
   1b-iii. HERO CARDS SMOOTH CURSOR-HOVER PARALLAX & MAGNETIC RESPONSE
   ========================================================================== */
function initHeroCardsHover() {
  const cluster = document.getElementById('heroCardsCluster');
  const heroSection = document.getElementById('hero') || document.querySelector('.hero-section');
  if (!cluster || !heroSection) return;

  // Respect user preference for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cardDefs = [
    { selector: '.hero-card-1', baseX: -215, baseY: 6, baseRot: -5, mult: 0.55 },
    { selector: '.hero-card-2', baseX: -75, baseY: -14, baseRot: 4, mult: 0.70 },
    { selector: '.hero-card-3', baseX: 65, baseY: -20, baseRot: -2, mult: 0.85 },
    { selector: '.hero-card-4', baseX: 205, baseY: 12, baseRot: 4, mult: 1.00 }
  ];

  const cards = cardDefs.map(def => {
    const el = cluster.querySelector(def.selector);
    const customRotVal = (el && el.dataset.customRot !== undefined) ? parseFloat(el.dataset.customRot) : NaN;
    const baseRot = (!isNaN(customRotVal)) ? customRotVal : def.baseRot;
    return {
      el,
      baseX: def.baseX,
      baseY: def.baseY,
      baseRot: baseRot,
      mult: def.mult,
      currentX: 0,
      currentY: 0,
      currentRot: 0,
      targetX: 0,
      targetY: 0,
      targetRot: 0,
      isReady: false
    };
  }).filter(c => c.el !== null);

  if (cards.length === 0) return;

  // Gracefully transition cards from CSS entrance animation to script hover transforms
  function makeReady(card) {
    if (!card.isReady) {
      card.isReady = true;
      card.el.style.animation = 'none';
      card.el.style.transform = `translate3d(${card.baseX}px, ${card.baseY}px, 0px) rotate(${card.baseRot}deg)`;
    }
  }

  cards.forEach(card => {
    card.el.addEventListener('animationend', (e) => {
      if (e.animationName && e.animationName.startsWith('heroCardSettle')) {
        makeReady(card);
      }
    });
  });

  // Fallback timer ensures cards are ready after entrance animation completes
  setTimeout(() => {
    cards.forEach(c => makeReady(c));
  }, 1450);

  const SMOOTHING_FACTOR = 0.075;
  let isRunning = false;
  let animId = null;

  function tick() {
    if (!isRunning) return;

    let hasActiveMotion = false;

    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const dx = c.targetX - c.currentX;
      const dy = c.targetY - c.currentY;
      const dr = c.targetRot - c.currentRot;

      // Smooth interpolation with natural inertia and clean settling
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(dr) < 0.02) {
        c.currentX = c.targetX;
        c.currentY = c.targetY;
        c.currentRot = c.targetRot;
      } else {
        c.currentX += dx * SMOOTHING_FACTOR;
        c.currentY += dy * SMOOTHING_FACTOR;
        c.currentRot += dr * SMOOTHING_FACTOR;
        hasActiveMotion = true;
      }

      if (c.isReady) {
        const finalX = c.baseX + c.currentX;
        const finalY = c.baseY + c.currentY;
        const finalRot = c.baseRot + c.currentRot;
        c.el.style.transform = `translate3d(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px, 0px) rotate(${finalRot.toFixed(2)}deg)`;
      }
    }

    if (hasActiveMotion) {
      animId = requestAnimationFrame(tick);
    } else {
      isRunning = false;
      animId = null;
    }
  }

  function startLoop() {
    if (!isRunning) {
      isRunning = true;
      animId = requestAnimationFrame(tick);
    }
  }

  function stopLoop() {
    isRunning = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function handleMouseMove(e) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const rect = cluster.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Buffer allows continuous, organic motion as the cursor crosses between cards
    const halfW = (rect.width / 2) + 60;
    const halfH = (rect.height / 2) + 60;

    const normX = Math.max(-1, Math.min(1, (e.clientX - centerX) / halfW));
    const normY = Math.max(-1, Math.min(1, (e.clientY - centerY) / halfH));

    // Subtle magnetic attraction: 4-9px max movement, 1-2.5deg max rotation
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      c.targetX = normX * 8.5 * c.mult;
      c.targetY = normY * 6.5 * c.mult;
      c.targetRot = (normX * 1.8 + normY * 0.6) * c.mult;
    }

    startLoop();
  }

  function handleMouseLeave() {
    // Return all cards smoothly to their exact initial positions
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      c.targetX = 0;
      c.targetY = 0;
      c.targetRot = 0;
    }
    startLoop();
  }

  cluster.addEventListener('mousemove', handleMouseMove, { passive: true });
  cluster.addEventListener('mouseleave', handleMouseLeave, { passive: true });
  heroSection.addEventListener('mouseleave', handleMouseLeave, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
    }
  });
}
window.initHeroCardsHover = initHeroCardsHover;

/* ==========================================================================
   1c. SECTION BACKGROUNDS (Parallax Removed)
   ========================================================================== */
function initSectionParallax() {
  const heroLayer = document.getElementById('heroCloudsLayer');
  const protoLayer = document.getElementById('protoBgLayer');
  const connectLayer = document.getElementById('connectBgLayer');
  if (heroLayer) heroLayer.style.transform = 'none';
  if (protoLayer) protoLayer.style.transform = 'none';
  if (connectLayer) connectLayer.style.transform = 'none';
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
   (Linked through unified PortfolioComponents.Lens across all pages)
   ========================================================================== */
function initMagnifierCursor() {
  if (window.PortfolioComponents && window.PortfolioComponents.Lens) {
    window.PortfolioComponents.Lens.init();
  }
}

/* ==========================================================================
   3. SELECTED WORK FILTERING
   ========================================================================== */
function initWorkFilter() {
  const filterPills = document.querySelectorAll('.filter-pill');

  filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const filterValue = pill.dataset.category;

      // Provide immediate visual state feedback on click
      filterPills.forEach(p => {
        const isCur = (p === pill);
        p.classList.toggle('active', isCur);
        p.setAttribute('aria-selected', isCur ? 'true' : 'false');
      });
      window.activeWorkCategory = filterValue;

      let targetCard = 0;
      if (typeof window.getCategoryStartIndex === 'function') {
        targetCard = window.getCategoryStartIndex(filterValue);
      } else {
        if (filterValue === 'product') targetCard = 0;
        else if (filterValue === 'uiux') targetCard = 7;
        else if (filterValue === 'graphic') targetCard = 10;
      }
      if (typeof window.scrollWorkToCard === 'function') {
        window.scrollWorkToCard(targetCard);
      }
    });
  });
}

/* ==========================================================================
   3a. ONE SCREEN ONE CARD SHOWCASE SLIDER
   ========================================================================== */
function getFeatureSvg(iconType, label = '') {
  const norm = ((iconType || '') + ' ' + (label || '')).toLowerCase();

  // Testing & Prototyping (check early to avoid matching 'type' inside 'prototype')
  if (norm.includes('test') || norm.includes('prototype') || norm.includes('benchmark')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
  }

  // Graphic Design: Typography (use word boundary or typography to avoid "prototype")
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
  // Graphic Design: Guidelines / Identity / Book / Learning
  if (norm.includes('guideline') || norm.includes('identity') || norm.includes('book') || norm.includes('understand') || norm.includes('learn')) {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
  }

  // Physical / Activity / Runner / Sport
  if (norm.includes('run') || norm.includes('physical') || norm.includes('sport') || norm.includes('movement') || (norm.includes('activity') && !norm.includes('telemetry'))) {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="17" cy="4" r="2"/><path d="m15 8-4.5 4.5-3-2L3 13.5"/><path d="m10.5 12.5 3 3.5v6"/><path d="m7.5 10.5-2 11.5"/></svg>`;
  }

  // Food / Nutrition / Apple / Diet
  if (norm.includes('food') || norm.includes('apple') || norm.includes('nutrition') || norm.includes('diet') || norm.includes('health')) {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c.5 2-1 4-2 5"/><path d="M12 7c-1.5-1.5-4-1.5-5.5 0-2 2-2 6 0 9 1.5 2.2 4 4 5.5 4s4-1.8 5.5-4c2-3 2-7 0-9-1.5-1.5-4-1.5-5.5 0z"/></svg>`;
  }

  // Group / Social / Community / People
  if (norm.includes('group') || norm.includes('social') || norm.includes('team') || norm.includes('people') || norm.includes('community')) {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  }

  // UI/UX: Flow
  if (norm.includes('flow') || norm.includes('user')) {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>`;
  }
  // UI/UX: Telemetry / Activity
  if (norm.includes('telemetry') || norm.includes('pulse')) {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;
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

  // Lightweight structure / Layers / Structural geometry
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

function getProjectNavUrl(pr) {
  if (!pr) return 'projects/kinetic-chair/index.html';
  const slug = pr.slug || pr.id || 'kinetic-chair';
  const cleanSlug = String(slug).toLowerCase().replace(/_/g, '-');
  const knownStaticSlugs = [
    'kinetic-chair', 'luma', 'modu-bottle', 'skytrack',
    'movie-time', 'vinyl-grooves', 'surreal-audio', 'wellness-journey'
  ];
  if (knownStaticSlugs.includes(cleanSlug)) {
    return `projects/${cleanSlug}/index.html`;
  }
  return `project.html?id=${encodeURIComponent(slug)}`;
}

function navigateToProject(target) {
  if (!target) return;
  let slug = target;
  let pr = null;

  if (typeof target === 'object' && target !== null) {
    pr = target;
    slug = target.slug || target.id;
  } else if (typeof target === 'string') {
    if (target.startsWith('/projects/')) {
      slug = target.replace(/^\/projects\//, '').replace(/\/index\.html$/, '').replace(/\/$/, '');
    } else {
      slug = target;
    }
  }

  // Lookup in PortfolioData
  if (window.PortfolioData && typeof window.PortfolioData.getProject === 'function') {
    const found = window.PortfolioData.getProject(slug);
    if (found) {
      pr = found;
      slug = found.slug || found.id;
    }
  } else if (window.PortfolioData && typeof window.PortfolioData.get === 'function') {
    const all = window.PortfolioData.get().projects || [];
    const found = all.find(p => p.slug === slug || p.id === slug || (Array.isArray(p.alias) && p.alias.includes(slug)));
    if (found) {
      pr = found;
      slug = found.slug || found.id;
    }
  }

  try {
    sessionStorage.setItem('selected_work_return_slug', slug);
  } catch (e) {}

  const destination = getProjectNavUrl(pr || { slug });
  window.location.assign(destination);
}
window.navigateToProject = navigateToProject;

function buildProjectCardHtml(pr) {
  const customData = (typeof PortfolioData !== 'undefined' ? PortfolioData.get() : null) || window._activePortfolioData;
  const cf = customData?.customization?.categoryFilters;
  let categoryLabel = '';
  if (pr.category === 'product' && cf?.productName) {
    categoryLabel = cf.productName.toUpperCase();
  } else if (pr.category === 'uiux' && cf?.uiuxName) {
    categoryLabel = cf.uiuxName.toUpperCase();
  } else if (pr.category === 'graphic' && cf?.graphicName) {
    categoryLabel = cf.graphicName.toUpperCase();
  } else {
    categoryLabel = pr.categoryLabel || (pr.category === 'product' ? 'PRODUCT DESIGN' : pr.category === 'uiux' ? 'UI/UX DESIGN' : 'GRAPHIC DESIGN');
  }
  const title = pr.shortTitle || pr.title;
  
  let desc = pr.shortDesc || pr.desc1 || '';
  if (!desc && pr.description) {
    const parts = pr.description.split('\n\n');
    desc = parts[0] || pr.description;
  }
  if (!desc) {
    desc = pr.projectBrief || (pr.content && pr.content.brief) || pr.brief || '';
  }

  // Project highlights (up to 4 items)
  let features = (Array.isArray(pr.features) && pr.features.length > 0)
    ? pr.features
    : ((pr.content && Array.isArray(pr.content.features) && pr.content.features.length > 0)
      ? pr.content.features
      : null);

  if (!features || features.length === 0) {
    if (pr.id === 'kinetic_chair' || pr.id === 'kinetic-chair') {
      features = [
        { label: "Ergonomic seating", icon: "chair" },
        { label: "Spine supporting", icon: "spine" },
        { label: "Lightweight structure", icon: "layers" },
        { label: "Material efficient", icon: "material" }
      ];
    } else if (pr.id === 'wellness-journey' || pr.id === 'wellness') {
      features = [
        { label: "Physical Activity", icon: "activity" },
        { label: "Food Awareness", icon: "food" },
        { label: "Group Interaction", icon: "group" },
        { label: "Easy to Understand", icon: "book" }
      ];
    } else if (pr.category === 'product') {
      features = [
        { label: "Precision engineering", icon: "chair" },
        { label: "Ergonomic geometry", icon: "spine" },
        { label: "Lightweight structure", icon: "layers" },
        { label: "Material efficient", icon: "material" }
      ];
    } else if (pr.category === 'uiux') {
      features = [
        { label: "User-centric flow", icon: "flow" },
        { label: "Adaptive telemetry", icon: "telemetry" },
        { label: "Design system tokens", icon: "tokens" },
        { label: "Micro-interactions", icon: "interactions" }
      ];
    } else {
      features = [
        { label: "Typographic hierarchy", icon: "type" },
        { label: "Vector composition", icon: "vector" },
        { label: "Foil & print finishes", icon: "foil" },
        { label: "High contrast duotone", icon: "contrast" }
      ];
    }
  }

  const validHighlights = (features || []).filter(f => f && f.label && f.label.trim() !== '').slice(0, 4);

  const highlightsHtml = validHighlights.length > 0
    ? `
      <div class="sw-card-highlights">
        ${validHighlights.map(f => `
          <div class="sw-highlight-item">
            <div class="sw-highlight-icon">
              ${getFeatureSvg(f.icon, f.label)}
            </div>
            <span class="sw-highlight-label">${f.label}</span>
          </div>
        `).join('')}
      </div>
    `
    : '';

  const resolveMedia = (src) => (window.PortfolioMediaDB ? window.PortfolioMediaDB.resolveUrlSync(src) : src) || '';
  const isMediaVidCheck = (item) => (window.PortfolioData && typeof window.PortfolioData.isMediaVideo === 'function')
    ? window.PortfolioData.isMediaVideo(item)
    : Boolean(item && (typeof item === 'object' ? (item.isVideo || item.mediaType === 'video') : (/\.(mp4|webm|mov|m4v|ogv|ogg)($|\?|#)/i.test(String(item)) || String(item).includes('/video/upload/'))));

  const firstShowcase = pr.showcaseImages && pr.showcaseImages[0];
  const firstShowcaseSrc = typeof firstShowcase === 'string' ? firstShowcase : (firstShowcase?.src || firstShowcase?.url || '');
  const firstShowcaseIsVid = firstShowcase && (firstShowcase.isVideo || firstShowcase.mediaType === 'video' || isMediaVidCheck(firstShowcaseSrc));

  const rawImageSrc = (!firstShowcaseIsVid && firstShowcaseSrc) || pr.image || 'assets/images/card_kinetic_showcase.jpg';
  const imageSrc = resolveMedia(rawImageSrc);
  const rawMobileImageSrc = pr.mobileImage || pr.mobileThumbnail || '';
  const mobileImageSrc = rawMobileImageSrc ? resolveMedia(rawMobileImageSrc) : '';
  const slug = pr.slug || pr.id;
  const navUrl = getProjectNavUrl(pr);
  const route = pr.route || navUrl;
  const rawProjVid = pr.video || pr.videoUrl || (firstShowcaseIsVid ? firstShowcaseSrc : '') || '';
  const projVid = resolveMedia(rawProjVid);
  const isVideo = Boolean(
    (pr.mediaType === 'video' && projVid) ||
    (projVid && (!pr.mediaType || pr.mediaType !== 'image')) ||
    isMediaVidCheck(projVid)
  );
  const focalPoint = pr.focalPoint || pr.imageFocalPoint || 'center center';

  return `
    <a href="${navUrl}" target="_self" class="sw-project-card" data-category="${pr.category}" data-id="${slug}" data-slug="${slug}" data-route="${route}" aria-label="View project ${title}">
      <!-- Full-Bleed Media Layer -->
      <div class="sw-card-bg">
        ${isVideo
          ? (mobileImageSrc
              ? `<video class="sw-card-bg-media sw-card-desktop-media" src="${projVid}" autoplay muted loop playsinline webkit-playsinline style="object-position: ${focalPoint};" onerror="this.style.display='none';"></video>
                 <img class="sw-card-bg-media sw-card-mobile-media" src="${mobileImageSrc}" alt="${title}" loading="eager" style="object-position: ${focalPoint};" onerror="this.src='${imageSrc}'">`
              : `<video class="sw-card-bg-media" src="${projVid}" autoplay muted loop playsinline webkit-playsinline style="object-position: ${focalPoint};" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';"></video>
                 <img class="sw-card-bg-media" src="${imageSrc}" alt="${title}" loading="eager" style="display:none; object-position: ${focalPoint};" onerror="this.src='assets/images/card_kinetic_showcase.jpg'">`
            )
          : (mobileImageSrc
              ? `<picture class="sw-card-picture">
                   <source media="(max-width: 768px)" srcset="${mobileImageSrc}">
                   <img class="sw-card-bg-media" src="${imageSrc}" alt="${title}" loading="eager" style="object-position: ${focalPoint};" onerror="this.src='assets/images/card_kinetic_showcase.jpg'">
                 </picture>`
              : `<img class="sw-card-bg-media" src="${imageSrc}" alt="${title}" loading="eager" style="object-position: ${focalPoint};" onerror="this.src='assets/images/card_kinetic_showcase.jpg'">`
            )
        }
      </div>

      <!-- Cinematic Gradient Overlay -->
      <div class="sw-card-overlay" aria-hidden="true"></div>

      <!-- Integrated Card Information & CTA -->
      <div class="sw-card-body">
        <div class="sw-card-content">
          <div class="sw-card-category-pill sw-card-category">${categoryLabel}</div>
          <h3 class="sw-card-title">${title}</h3>
          ${desc ? `<p class="sw-card-desc">${desc}</p>` : ''}
          ${highlightsHtml}
        </div>

        <div class="sw-card-cta sw-view-btn" data-project="${slug}" data-slug="${slug}" data-route="${route}" aria-hidden="true">
          <div class="sw-cta-circle sw-view-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </div>
          <span class="sw-cta-label sw-view-text">VIEW PROJECT</span>
        </div>
      </div>
    </a>
  `;
}

function initWorkShowcaseSlider() {
  const container = document.getElementById('swShowcaseContainer');
  const slider = document.getElementById('swShowcaseSlider');
  const prevBtn = document.getElementById('swPrevBtn');
  const nextBtn = document.getElementById('swNextBtn');
  const currNum = document.getElementById('swCounterCurr');
  const totalNum = document.getElementById('swCounterTotal');

  if (!container || !slider) return;

  let currentIndex = 0;
  let currentFloatIndex = 0;
  let allProjects = (window.PortfolioData && window.PortfolioData.get()?.projects) || [];

  function getAllSequentialProjects() {
    if (!allProjects || allProjects.length === 0) return [];
    const products = allProjects.filter(p => p.category === 'product');
    const uiux = allProjects.filter(p => p.category === 'uiux');
    const graphic = allProjects.filter(p => p.category === 'graphic');
    const others = allProjects.filter(p => !['product', 'uiux', 'graphic'].includes(p.category));
    return [...products, ...uiux, ...graphic, ...others];
  }

  function getCategoryBoundaries(list) {
    let pCount = 0, uCount = 0, gCount = 0;
    list.forEach(p => {
      if (p.category === 'product') pCount++;
      else if (p.category === 'uiux') uCount++;
      else if (p.category === 'graphic') gCount++;
    });
    return {
      product: { start: 0, count: pCount },
      uiux: { start: pCount, count: uCount },
      graphic: { start: pCount + uCount, count: gCount }
    };
  }

  window.getCategoryStartIndex = (category, startAtEnd = false) => {
    const list = getAllSequentialProjects();
    const bounds = getCategoryBoundaries(list);
    const catBound = bounds[category] || bounds.product;
    if (startAtEnd) {
      return Math.max(0, catBound.start + catBound.count - 1);
    }
    return catBound.start;
  };

  function renderSlides() {
    const list = getAllSequentialProjects();
    if (list.length === 0) return;

    slider.innerHTML = list.map(pr => buildProjectCardHtml(pr)).join('');
    updateWorkTrackHeight();
    updateWorkOnScroll(window.scrollY);

    const cards = slider.querySelectorAll('.sw-project-card');
    cards.forEach(card => {
      card.style.cursor = 'pointer';
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
    });

    slider.querySelectorAll('video').forEach(vid => {
      vid.preload = 'auto';
      vid.muted = true;
      vid.defaultMuted = true;
      vid.playsInline = true;
      vid.setAttribute('muted', '');
      vid.setAttribute('autoplay', '');
      vid.setAttribute('loop', '');
      vid.setAttribute('playsinline', '');
      vid.setAttribute('preload', 'auto');
      const p = vid.play();
      if (p !== undefined) {
        p.catch(() => {
          vid.addEventListener('canplay', () => { vid.play().catch(() => {}); }, { once: true });
        });
      }
    });
  }

  let currentMobileWorkIndex = 0;

  function setMobileWorkCard(targetIdx, animate = true) {
    const list = getAllSequentialProjects();
    const count = list.length || 1;
    const clamped = Math.max(0, Math.min(count - 1, targetIdx));
    currentMobileWorkIndex = clamped;
    currentIndex = clamped;
    currentFloatIndex = clamped;

    function getWorkCardGap() {
      const style = window.getComputedStyle(slider);
      const gapStr = style.gap || style.columnGap;
      const parsed = parseFloat(gapStr);
      return isNaN(parsed) ? 22 : parsed;
    }
    const cardGap = getWorkCardGap();
    slider.style.transition = animate ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
    slider.style.transform = `translateX(calc(-${(clamped * 100)}% - ${(clamped * cardGap)}px))`;

    const bounds = getCategoryBoundaries(list);
    let activeCat = 'product';
    let currInCat = 1;
    let totalInCat = bounds.product.count || 1;

    if (clamped >= bounds.graphic.start) {
      activeCat = 'graphic';
      currInCat = clamped - bounds.graphic.start + 1;
      totalInCat = bounds.graphic.count || 1;
    } else if (clamped >= bounds.uiux.start) {
      activeCat = 'uiux';
      currInCat = clamped - bounds.uiux.start + 1;
      totalInCat = bounds.uiux.count || 1;
    } else {
      activeCat = 'product';
      currInCat = clamped - bounds.product.start + 1;
      totalInCat = bounds.product.count || 1;
    }

    if (currNum) currNum.textContent = String(currInCat).padStart(2, '0');
    if (totalNum) totalNum.textContent = String(totalInCat).padStart(2, '0');

    const activePr = list[clamped] || list[0];
    if (activePr) {
      const activeSlug = activePr.slug || activePr.id;
      const activeRoute = activePr.route || `/projects/${activeSlug}`;
      window.activeSelectedWorkProject = activePr;
      window.activeSelectedWorkSlug = activeSlug;
      window.activeSelectedWorkRoute = activeRoute;
      if (container) {
        container.dataset.activeProject = activeSlug;
        container.dataset.activeRoute = activeRoute;
      }
    }

    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(p => {
      const isCur = p.dataset.category === activeCat;
      p.classList.toggle('active', isCur);
      p.setAttribute('aria-selected', isCur ? 'true' : 'false');
    });
    window.activeWorkCategory = activeCat;

    if (prevBtn) prevBtn.disabled = (clamped === 0);
    if (nextBtn) nextBtn.disabled = (clamped >= count - 1);
  }
  window.setMobileWorkCard = setMobileWorkCard;

  function updateWorkTrackHeight() {
    const workSection = document.getElementById('work');
    if (!workSection) return;
    const isMobile = window.innerWidth <= 860;
    if (isMobile) {
      workSection.style.height = 'auto';
      return;
    }
    const list = getAllSequentialProjects();
    const count = list.length || 15;
    const scrollPerCard = Math.max(500, Math.min(800, window.innerHeight * 0.8));
    const totalWorkScrollDist = Math.max(0, (count - 1) * scrollPerCard);
    workSection.style.height = (window.innerHeight + totalWorkScrollDist) + 'px';
  }
  window.updateWorkTrackHeights = updateWorkTrackHeight;

  function updateWorkOnScroll(scrollY) {
    const workSection = document.getElementById('work');
    if (!workSection) return;
    // On mobile devices, card horizontal sliding is decoupled from vertical page scroll
    if (window.innerWidth <= 860) return;

    const list = getAllSequentialProjects();
    const count = list.length || 1;
    if (count <= 1) return;

    const workTop = workSection.offsetTop;
    const workHeight = workSection.offsetHeight;
    const totalWorkScrollDist = workHeight - window.innerHeight;

    if (totalWorkScrollDist > 0) {
      let floatIdx = 0;
      if (scrollY <= workTop) {
        floatIdx = 0;
      } else if (scrollY >= workTop + totalWorkScrollDist) {
        floatIdx = count - 1;
      } else {
        const p = (scrollY - workTop) / totalWorkScrollDist;
        floatIdx = p * (count - 1);
      }
      currentFloatIndex = floatIdx;
      const roundedIdx = Math.max(0, Math.min(count - 1, Math.round(floatIdx)));
      currentIndex = roundedIdx;

      function getWorkCardGap() {
        const style = window.getComputedStyle(slider);
        const gapStr = style.gap || style.columnGap;
        const parsed = parseFloat(gapStr);
        return isNaN(parsed) ? (window.innerWidth <= 860 ? 22 : (window.innerWidth <= 1080 ? 28 : 36)) : parsed;
      }
      const cardGap = getWorkCardGap();
      slider.style.transition = 'none';
      slider.style.transform = `translateX(calc(-${(floatIdx * 100).toFixed(4)}% - ${(floatIdx * cardGap).toFixed(2)}px))`;

      const bounds = getCategoryBoundaries(list);
      let activeCat = 'product';
      let currInCat = 1;
      let totalInCat = bounds.product.count || 1;

      if (roundedIdx >= bounds.graphic.start) {
        activeCat = 'graphic';
        currInCat = roundedIdx - bounds.graphic.start + 1;
        totalInCat = bounds.graphic.count || 1;
      } else if (roundedIdx >= bounds.uiux.start) {
        activeCat = 'uiux';
        currInCat = roundedIdx - bounds.uiux.start + 1;
        totalInCat = bounds.uiux.count || 1;
      } else {
        activeCat = 'product';
        currInCat = roundedIdx - bounds.product.start + 1;
        totalInCat = bounds.product.count || 1;
      }

      if (currNum) currNum.textContent = String(currInCat).padStart(2, '0');
      if (totalNum) totalNum.textContent = String(totalInCat).padStart(2, '0');

      const activePr = list[roundedIdx] || list[0];
      if (activePr) {
        const activeSlug = activePr.slug || activePr.id;
        const activeRoute = activePr.route || `/projects/${activeSlug}`;
        window.activeSelectedWorkProject = activePr;
        window.activeSelectedWorkSlug = activeSlug;
        window.activeSelectedWorkRoute = activeRoute;
        if (container) {
          container.dataset.activeProject = activeSlug;
          container.dataset.activeRoute = activeRoute;
        }
      }

      const filterPills = document.querySelectorAll('.filter-pill');
      filterPills.forEach(p => {
        const isCur = p.dataset.category === activeCat;
        p.classList.toggle('active', isCur);
        p.setAttribute('aria-selected', isCur ? 'true' : 'false');
      });
      window.activeWorkCategory = activeCat;

      if (prevBtn) prevBtn.disabled = (roundedIdx === 0);
      if (nextBtn) nextBtn.disabled = (roundedIdx >= count - 1);
    }
  }
  window.updateWorkOnScroll = updateWorkOnScroll;

  function scrollWorkToCard(targetIdx, instant = false) {
    const workSection = document.getElementById('work');
    if (!workSection) return;
    const list = getAllSequentialProjects();
    const count = list.length || 1;
    if (count <= 1) return;
    const clamped = Math.max(0, Math.min(count - 1, targetIdx));

    if (window.innerWidth <= 860) {
      setMobileWorkCard(clamped, !instant);
      if (instant) {
        const workTop = workSection.offsetTop;
        if ('scrollRestoration' in history) {
          try { history.scrollRestoration = 'manual'; } catch (e) {}
        }
        if (window.lenis) {
          try {
            window.lenis.scrollTo(workTop, { immediate: true, force: true });
            window.lenis.scroll = workTop;
            window.lenis.animatedScroll = workTop;
            window.lenis.targetScroll = workTop;
            window.lenis.start();
          } catch(e) {}
        }
        window.scrollTo({ top: workTop, behavior: 'instant' });
        window.scrollTo(0, workTop);
        document.documentElement.scrollTop = workTop;
        document.body.scrollTop = workTop;
        if (typeof window.portfolioUpdateActiveStates === 'function') {
          const wIdx = (window.portfolioSectionIdMap && window.portfolioSectionIdMap['work'] !== undefined) ? window.portfolioSectionIdMap['work'] : 2;
          window.portfolioUpdateActiveStates(wIdx);
        }
        document.documentElement.classList.remove('navigating-to-work');
        document.documentElement.style.scrollBehavior = '';
      }
      return;
    }

    const workTop = workSection.offsetTop;
    const totalWorkScrollDist = workSection.offsetHeight - window.innerHeight;
    const targetScrollY = workTop + (clamped / (count - 1)) * totalWorkScrollDist;

    if (instant) {
      if ('scrollRestoration' in history) {
        try { history.scrollRestoration = 'manual'; } catch (e) {}
      }
      if (window.lenis) {
        try {
          window.lenis.scrollTo(targetScrollY, { immediate: true, force: true });
          window.lenis.scroll = targetScrollY;
          window.lenis.animatedScroll = targetScrollY;
          window.lenis.targetScroll = targetScrollY;
          window.lenis.start();
        } catch(e) {}
      }
      window.scrollTo({ top: targetScrollY, behavior: 'instant' });
      window.scrollTo(0, targetScrollY);
      document.documentElement.scrollTop = targetScrollY;
      document.body.scrollTop = targetScrollY;
      updateWorkOnScroll(targetScrollY);
      if (typeof window.portfolioUpdateActiveStates === 'function') {
        const wIdx = (window.portfolioSectionIdMap && window.portfolioSectionIdMap['work'] !== undefined) ? window.portfolioSectionIdMap['work'] : 2;
        window.portfolioUpdateActiveStates(wIdx);
      }
      document.documentElement.classList.remove('navigating-to-work');
      document.documentElement.style.scrollBehavior = '';
    } else {
      if (window.lenis) {
        window.lenis.scrollTo(targetScrollY, { duration: 0.95 });
      } else {
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      }
    }
  }
  window.scrollWorkToCard = scrollWorkToCard;

  function next() {
    const count = getAllSequentialProjects().length;
    const isMobile = window.innerWidth <= 860;
    const cur = isMobile ? currentMobileWorkIndex : Math.round(currentFloatIndex);
    if (cur < count - 1) {
      if (isMobile) {
        setMobileWorkCard(cur + 1, true);
      } else {
        scrollWorkToCard(cur + 1);
      }
      return true;
    }
    return false;
  }

  function prev() {
    const count = getAllSequentialProjects().length;
    const isMobile = window.innerWidth <= 860;
    const cur = isMobile ? currentMobileWorkIndex : Math.round(currentFloatIndex);
    if (cur > 0) {
      if (isMobile) {
        setMobileWorkCard(cur - 1, true);
      } else {
        scrollWorkToCard(cur - 1);
      }
      return true;
    }
    return false;
  }

  function goToIndex(idx) {
    if (window.innerWidth <= 860) {
      setMobileWorkCard(idx, true);
    } else {
      scrollWorkToCard(idx);
    }
  }

  if (nextBtn) nextBtn.addEventListener('click', next);
  if (prevBtn) prevBtn.addEventListener('click', prev);

  window.addEventListener('resize', () => {
    updateWorkTrackHeight();
    if (window.innerWidth <= 860) {
      setMobileWorkCard(currentMobileWorkIndex, false);
    } else {
      updateWorkOnScroll(window.scrollY);
    }
  });

  // Keyboard navigation when work section is active
  window.addEventListener('keydown', (e) => {
    const workPanel = document.getElementById('work');
    if (!workPanel || !workPanel.classList.contains('is-active')) return;
    if (e.key === 'ArrowRight') {
      next();
    } else if (e.key === 'ArrowLeft') {
      prev();
    }
  });

  // Touch swipe gestures with swipe-vs-tap discrimination and interactive drag
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isTouchHorizontal = false;
  let hasDecidedDirection = false;
  let isSwiping = false;

  container.addEventListener('touchstart', (e) => {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    touchStartTime = Date.now();
    isTouchHorizontal = false;
    hasDecidedDirection = false;
    isSwiping = false;
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    if (window.innerWidth > 860) return;

    const curX = e.changedTouches[0].clientX;
    const curY = e.changedTouches[0].clientY;
    const diffX = curX - touchStartX;
    const diffY = curY - touchStartY;

    if (!hasDecidedDirection) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        hasDecidedDirection = true;
        isTouchHorizontal = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isTouchHorizontal) {
      isSwiping = true;
      const list = getAllSequentialProjects();
      const count = list.length || 1;
      const style = window.getComputedStyle(slider);
      const gapStr = style.gap || style.columnGap;
      const parsedGap = parseFloat(gapStr);
      const cardGap = isNaN(parsedGap) ? 22 : parsedGap;
      const containerW = container.offsetWidth || window.innerWidth;
      const baseOffsetPx = - (currentMobileWorkIndex * (containerW + cardGap));

      let offsetDelta = diffX;
      if ((currentMobileWorkIndex === 0 && diffX > 0) || (currentMobileWorkIndex === count - 1 && diffX < 0)) {
        offsetDelta = diffX * 0.28;
      }

      slider.style.transition = 'none';
      slider.style.transform = `translateX(${baseOffsetPx + offsetDelta}px)`;
    }
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    if (window.innerWidth > 860) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;
      if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        isSwiping = true;
        if (diffX > 0) next();
        else prev();
        setTimeout(() => {
          isSwiping = false;
        }, 300);
      }
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const elapsed = Math.max(1, Date.now() - touchStartTime);
    const velocityX = Math.abs(diffX) / elapsed;

    if (isTouchHorizontal || (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY))) {
      isSwiping = true;
      const count = getAllSequentialProjects().length;
      const threshold = 40;
      const isFlick = velocityX > 0.3 && Math.abs(diffX) > 20;

      if ((diffX < -threshold || (diffX < -20 && isFlick)) && currentMobileWorkIndex < count - 1) {
        setMobileWorkCard(currentMobileWorkIndex + 1, true);
      } else if ((diffX > threshold || (diffX > 20 && isFlick)) && currentMobileWorkIndex > 0) {
        setMobileWorkCard(currentMobileWorkIndex - 1, true);
      } else {
        setMobileWorkCard(currentMobileWorkIndex, true);
      }

      setTimeout(() => {
        isSwiping = false;
      }, 300);
    }
  }, { passive: true });

  // Mouse drag support for desktop responsive emulation
  let isWorkMouseDragging = false;
  container.addEventListener('mousedown', (e) => {
    if (window.innerWidth > 860) return;
    if (e.button !== 0) return;
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    touchStartTime = Date.now();
    isTouchHorizontal = false;
    hasDecidedDirection = false;
    isWorkMouseDragging = true;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isWorkMouseDragging || window.innerWidth > 860) return;
    const curX = e.clientX;
    const curY = e.clientY;
    const diffX = curX - touchStartX;
    const diffY = curY - touchStartY;

    if (!hasDecidedDirection) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        hasDecidedDirection = true;
        isTouchHorizontal = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isTouchHorizontal) {
      isSwiping = true;
      const list = getAllSequentialProjects();
      const count = list.length || 1;
      const style = window.getComputedStyle(slider);
      const gapStr = style.gap || style.columnGap;
      const parsedGap = parseFloat(gapStr);
      const cardGap = isNaN(parsedGap) ? 22 : parsedGap;
      const containerW = container.offsetWidth || window.innerWidth;
      const baseOffsetPx = - (currentMobileWorkIndex * (containerW + cardGap));

      let offsetDelta = diffX;
      if ((currentMobileWorkIndex === 0 && diffX > 0) || (currentMobileWorkIndex === count - 1 && diffX < 0)) {
        offsetDelta = diffX * 0.28;
      }

      slider.style.transition = 'none';
      slider.style.transform = `translateX(${baseOffsetPx + offsetDelta}px)`;
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (!isWorkMouseDragging) return;
    isWorkMouseDragging = false;
    if (window.innerWidth > 860) return;

    const diffX = e.clientX - touchStartX;
    const diffY = e.clientY - touchStartY;
    const elapsed = Math.max(1, Date.now() - touchStartTime);
    const velocityX = Math.abs(diffX) / elapsed;

    if (isTouchHorizontal || (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY))) {
      isSwiping = true;
      const count = getAllSequentialProjects().length;
      const threshold = 40;
      const isFlick = velocityX > 0.3 && Math.abs(diffX) > 20;

      if ((diffX < -threshold || (diffX < -20 && isFlick)) && currentMobileWorkIndex < count - 1) {
        setMobileWorkCard(currentMobileWorkIndex + 1, true);
      } else if ((diffX > threshold || (diffX > 20 && isFlick)) && currentMobileWorkIndex > 0) {
        setMobileWorkCard(currentMobileWorkIndex - 1, true);
      } else {
        setMobileWorkCard(currentMobileWorkIndex, true);
      }

      setTimeout(() => {
        isSwiping = false;
      }, 300);
    }
  });

  let lastRestoredReturnSlug = initialReturnSlug;

  function checkAndRestoreReturnProject(explicitSlug) {
    if (isPageReloadNavigation()) {
      try {
        sessionStorage.removeItem('selected_work_return_slug');
      } catch (e) {}
      return false;
    }

    // Only restore if returning from a project (URL has project/card/id query param or explicitSlug was provided)
    let slug = explicitSlug || initialReturnSlug;
    if (!slug) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        slug = urlParams.get('project') || urlParams.get('card') || urlParams.get('id');
      } catch (e) {}
    }

    if (!slug) {
      // Not a return-to-work navigation: clear any stale session item and exit
      try {
        sessionStorage.removeItem('selected_work_return_slug');
      } catch (e) {}
      return false;
    }
    lastRestoredReturnSlug = slug;

    const list = getAllSequentialProjects();
    const cleanSlug = String(slug).trim().toLowerCase();
    const normSlug = cleanSlug.replace(/[-_]/g, '');

    let targetIdx = list.findIndex(p => {
      const pSlug = (p.slug || '').toLowerCase();
      const pId = (p.id || '').toLowerCase();
      return pSlug === cleanSlug || pId === cleanSlug;
    });

    if (targetIdx === -1) {
      targetIdx = list.findIndex(p => {
        const pSlug = (p.slug || '').toLowerCase().replace(/[-_]/g, '');
        const pId = (p.id || '').toLowerCase().replace(/[-_]/g, '');
        return pSlug === normSlug || pId === normSlug;
      });
    }

    if (targetIdx === -1) {
      targetIdx = list.findIndex(p => {
        if (Array.isArray(p.alias)) {
          return p.alias.some(a => String(a).toLowerCase().replace(/[-_]/g, '') === normSlug);
        }
        return false;
      });
    }

    if (targetIdx !== -1) {
      scrollWorkToCard(targetIdx, true);

      // Re-apply at 30ms and 120ms to guarantee precision across all font and layout rendering phases
      setTimeout(() => {
        scrollWorkToCard(targetIdx, true);
      }, 30);

      setTimeout(() => {
        scrollWorkToCard(targetIdx, true);
        if (window.history && window.history.replaceState) {
          try {
            window.history.replaceState(null, '', window.location.pathname + '#work');
          } catch (e) {}
        }
        try {
          sessionStorage.removeItem('selected_work_return_slug');
        } catch (e) {}
      }, 120);

      return true;
    }
    return false;
  }

  window.workShowcaseSlider = {
    setCategory: (cat, startAtEnd = false) => {
      if (typeof window.getCategoryStartIndex === 'function') {
        const targetIdx = window.getCategoryStartIndex(cat, startAtEnd);
        scrollWorkToCard(targetIdx);
      }
    },
    setProjects: (projects) => {
      allProjects = projects;
      renderSlides();
      if (initialReturnSlug) {
        checkAndRestoreReturnProject(initialReturnSlug);
      }
    },
    next,
    prev,
    goToIndex,
    goToSlug: (slug, instant = false) => {
      const list = getAllSequentialProjects();
      const cleanSlug = String(slug || '').trim().toLowerCase();
      const normSlug = cleanSlug.replace(/[-_]/g, '');
      const idx = list.findIndex(p => {
        const pSlug = (p.slug || '').toLowerCase();
        const pId = (p.id || '').toLowerCase();
        return pSlug === cleanSlug || pId === cleanSlug || pSlug.replace(/[-_]/g, '') === normSlug || pId.replace(/[-_]/g, '') === normSlug;
      });
      if (idx !== -1) {
        scrollWorkToCard(idx, instant);
        return true;
      }
      return false;
    },
    restoreReturnProject: checkAndRestoreReturnProject,
    canNext: () => {
      const count = getAllSequentialProjects().length;
      return currentIndex < count - 1;
    },
    canPrev: () => {
      return currentIndex > 0;
    },
    getCurrentIndex: () => currentIndex,
    getTotalCount: () => getAllSequentialProjects().length,
    getCurrentCategory: () => window.activeWorkCategory || 'product'
  };

  // Delegated click on slider: guarantees ANY card click/tap opens the project page reliably
  slider.addEventListener('click', (e) => {
    if (isSwiping) {
      e.preventDefault();
      return;
    }
    const card = e.target.closest('.sw-project-card');
    if (!card) return;

    const targetSlug = card.dataset.slug || card.dataset.id;
    const targetRoute = card.dataset.route;
    if (!targetSlug && !targetRoute) return;

    // Save target card slug before navigation
    try {
      sessionStorage.setItem('selected_work_return_slug', targetSlug || targetRoute);
    } catch (err) {}

    // Allow opening in new tab when modifier keys or middle mouse button are used
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
      return;
    }

    e.preventDefault();
    navigateToProject(targetSlug || targetRoute);
  });

  // Delegated keyboard navigation on slider
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.sw-project-card');
      if (card) {
        const targetSlug = card.dataset.slug || card.dataset.id;
        const targetRoute = card.dataset.route;
        if (targetSlug || targetRoute) {
          try {
            sessionStorage.setItem('selected_work_return_slug', targetSlug || targetRoute);
          } catch (err) {}
          e.preventDefault();
          navigateToProject(targetSlug || targetRoute);
        }
      }
    }
  });

  renderSlides();
  if (window.innerWidth <= 860) {
    setMobileWorkCard(0, false);
  }
  checkAndRestoreReturnProject();
}
/* ==========================================================================
   5. FULLSCREEN GALLERY LIGHTBOX (IMAGE & VIDEO COMPATIBLE)
   ========================================================================== */
let isGalleryLightboxBound = false;
let galleryLightboxCurrentIndex = 0;

function getGalleryLightboxItems() {
  const galleryCards = document.querySelectorAll('#gallery .gallery-card');
  return Array.from(galleryCards).map(card => {
    const vidEl = card.querySelector('video');
    const imgEl = card.querySelector('img');
    const rawSrc = card.dataset.src || vidEl?.src || imgEl?.src || '';
    const isVideo = card.dataset.mediaType === 'video' || Boolean(vidEl) || /\.(mp4|webm|mov|ogg)($|\?)/i.test(rawSrc);
    const caption = card.dataset.caption || imgEl?.alt || '';
    return {
      src: rawSrc,
      caption,
      isVideo
    };
  });
}

function showGalleryLightboxItem(index) {
  const lightbox = document.getElementById('galleryLightbox');
  const imgEl = document.getElementById('lightboxImg');
  const videoEl = document.getElementById('lightboxVideo');
  const captionEl = document.getElementById('lightboxCaption');
  const counterEl = document.getElementById('lightboxCounter');
  if (!lightbox) return;

  const items = getGalleryLightboxItems();
  if (items.length === 0) return;

  if (index < 0) index = items.length - 1;
  if (index >= items.length) index = 0;
  galleryLightboxCurrentIndex = index;

  const item = items[index];

  if (item.isVideo) {
    if (imgEl) {
      imgEl.style.display = 'none';
      imgEl.src = '';
    }
    if (videoEl) {
      videoEl.style.display = 'block';
      if (videoEl.src !== item.src) {
        videoEl.src = item.src;
      }
      videoEl.currentTime = 0;
      videoEl.play().catch(() => {});
    }
  } else {
    if (videoEl) {
      videoEl.pause();
      videoEl.style.display = 'none';
      videoEl.src = '';
    }
    if (imgEl) {
      imgEl.style.display = 'block';
      imgEl.src = item.src;
      imgEl.alt = item.caption;
    }
  }

  if (captionEl) captionEl.textContent = item.caption || 'Studio capture / Field note';
  if (counterEl) counterEl.textContent = `${index + 1} / ${items.length}`;
}

function closeGalleryLightbox() {
  const lightbox = document.getElementById('galleryLightbox');
  const videoEl = document.getElementById('lightboxVideo');
  if (lightbox) {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
  }
  if (videoEl) {
    videoEl.pause();
    videoEl.src = '';
  }
  document.body.style.overflow = '';
  if (window.lenis) window.lenis.start();
}

function initGalleryLightbox() {
  const lightbox = document.getElementById('galleryLightbox');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  const gallerySec = document.getElementById('gallery');

  if (!lightbox) return;

  const counterEl = document.getElementById('lightboxCounter');
  const items = getGalleryLightboxItems();
  if (counterEl && items.length > 0) {
    counterEl.textContent = `1 / ${items.length}`;
  }

  if (!isGalleryLightboxBound) {
    isGalleryLightboxBound = true;

    if (closeBtn) closeBtn.addEventListener('click', closeGalleryLightbox);

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showGalleryLightboxItem(galleryLightboxCurrentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showGalleryLightboxItem(galleryLightboxCurrentIndex + 1);
      });
    }

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-center') || e.target.classList.contains('lightbox-img-wrapper')) {
        closeGalleryLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeGalleryLightbox();
      if (e.key === 'ArrowLeft') showGalleryLightboxItem(galleryLightboxCurrentIndex - 1);
      if (e.key === 'ArrowRight') showGalleryLightboxItem(galleryLightboxCurrentIndex + 1);
    });

    // Note: Gallery card click-to-open lightbox disabled per user request
    // Gallery frames remain clean, interactive inline visual elements on the page.
  }
}
window.initGalleryLightbox = initGalleryLightbox;
window.showGalleryLightboxItem = showGalleryLightboxItem;
window.closeGalleryLightbox = closeGalleryLightbox;

/* ==========================================================================
   5b. GALLERY NORMAL SCROLLING ENGINE (FIELD NOTES & FRAMES)
   Single section like Prototyping with normal vertical scrolling and 3-column bento layout.
   ========================================================================== */
let galleryActivePage = 0;
window.galleryActivePage = 0;
let isGalleryTransitioning = false;
window.isGalleryTransitioning = false;
let galleryMobileFrame = 0;
window.galleryMobileFrame = 0;
let galleryMobilePair = 0;
window.galleryMobilePair = 0;

function setGalleryFrame(targetFrame, animate = true) {
  galleryMobileFrame = targetFrame || 0;
  window.galleryMobileFrame = galleryMobileFrame;
}
window.setGalleryFrame = setGalleryFrame;
window.setGalleryPair = (targetPair) => setGalleryFrame(targetPair * 2);
window.getGalleryMobileFrame = () => galleryMobileFrame;
window.getGalleryMobilePair = () => galleryMobilePair;

function setGalleryPage(pageIdx, animate = true) {
  galleryActivePage = (pageIdx === 1) ? 1 : 0;
  window.galleryActivePage = galleryActivePage;
}
window.setGalleryPage = setGalleryPage;

function initGallerySlider() {
  const gallerySection = document.getElementById('gallery');
  if (gallerySection) {
    gallerySection.style.height = 'auto';
  }

  function updateGalleryTrackHeight() {
    const gal = document.getElementById('gallery');
    if (gal) gal.style.height = 'auto';
  }
  window.updateGalleryTrackHeights = updateGalleryTrackHeight;
  window.updateGalleryOnScroll = function() {};

  window.galleryMobileSlider = {
    next: () => false,
    prev: () => false,
    goToFrame: () => {},
    getCurrentFrame: () => 0,
    canNext: () => false,
    canPrev: () => false,
    reset: () => {}
  };
}

/* ==========================================================================
   6. CONTACT MODAL & EMAIL DRAWER
   (Linked through unified PortfolioComponents.ContactModal)
   ========================================================================== */
function initContactModal() {
  if (window.PortfolioComponents && window.PortfolioComponents.ContactModal) {
    window.PortfolioComponents.ContactModal.init();
  }
}

/* ==========================================================================
   7. PROTOTYPES WORKSHOP & EXPANDABLE CARDS
   ========================================================================== */
function initPrototypesModal() {
  const viewBtn = document.getElementById('viewPrototypesBtn');
  const polaroids = document.querySelectorAll('.polaroid-card');
  const extraCards = document.querySelectorAll('.polaroid-card.extra-card');

  let isExpanded = false;

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

  // Polaroid cards interactive hover tilt (-2deg to +2deg)
  polaroids.forEach((card, index) => {
    card.addEventListener('mouseenter', () => {
      if (window.innerWidth <= 860) return;
      const initialAngle = (index % 2 === 0) ? -2 : 2;
      card.style.transform = `rotate(${initialAngle}deg) translateY(-8px) scale(1.03)`;
    });

    card.addEventListener('mousemove', (e) => {
      if (window.innerWidth <= 860) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const xRatio = Math.max(0, Math.min(1, x / rect.width));
      // Subtle sweep from -2deg on the left edge to +2deg on the right edge
      const angle = -2 + (xRatio * 4);
      card.style.transform = `rotate(${angle.toFixed(1)}deg) translateY(-8px) scale(1.03)`;
    });

    card.addEventListener('mouseleave', () => {
      if (window.innerWidth <= 860) return;
      // Revert to CSS class resting angle
      card.style.transform = '';
    });
  });
}

/* ==========================================================================
   7b. PROTOTYPING HORIZONTAL SLIDER & PINNED SCROLL CONTROLLER
   (Matching Selected Work and Field Notes & Frames Architecture)
   ========================================================================== */
let protoActivePage = 0;
let isProtoTransitioning = false;

function setProtoPage(pageIdx, animate = true) {
  protoActivePage = (pageIdx === 1) ? 1 : 0;
  window.protoActivePage = protoActivePage;
}
window.setProtoPage = setProtoPage;

function initProtoSlider() {
  const protoSection = document.getElementById('prototyping');
  if (protoSection) {
    protoSection.style.height = 'auto';
  }

  function updateProtoTrackHeight() {
    const protoSection = document.getElementById('prototyping');
    if (!protoSection) return;
    protoSection.style.height = 'auto';
  }
  window.updateProtoTrackHeights = updateProtoTrackHeight;

  function updateProtoOnScroll(scrollY) {
    // Normal vertical document scrolling — no horizontal translation needed
  }
  window.updateProtoOnScroll = updateProtoOnScroll;

  updateProtoTrackHeight();
}
window.initProtoSlider = initProtoSlider;

/* ==========================================================================
   7b. ABOUT ME SECTION REVEAL ANIMATIONS
   ========================================================================== */
function initAboutAnimations() {
  const aboutSection = document.getElementById('about');
  if (!aboutSection) return;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    aboutSection.classList.add('is-in-view');
    return;
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          aboutSection.classList.add('is-in-view');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });
    observer.observe(aboutSection);
  } else {
    aboutSection.classList.add('is-in-view');
  }
}

/* ==========================================================================
   8. SCROLL-DRIVEN ENTRANCE ANIMATIONS
   ========================================================================== */
function initScrollAnimations() {
  if (document.documentElement.classList.contains('horizontal-scroll-enabled')) {
    // In horizontal scroll mode, entrance and active animations are driven cleanly by
    // horizontal panel active states and CSS transitions without hiding elements inline
    return;
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

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
    { selector: '#work .section-header-flex, #work .category-filter-row', stagger: 0.08 },
    { selector: '#work .work-page-product .work-card', stagger: 0.06 },
    { selector: '#prototyping .proto-header', stagger: 0 },
    { selector: '#prototyping .proto-page-1 .proto-card, #prototyping .polaroid-card', stagger: 0.06 },
    { selector: '#gallery .gallery-header-row', stagger: 0 },
    { selector: '#gallery .gallery-page-1 .gallery-card', stagger: 0.05 },
    // Merged Let's Connect & Footer: whole container enters as ONE unified block with 0s delay
    { selector: '#connect .section-container', stagger: 0 }
  ];

  const allAnimated = [];

  sectionConfigs.forEach(sec => {
    const items = document.querySelectorAll(sec.selector);
    items.forEach((el, idx) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      const delay = (idx * sec.stagger).toFixed(3);
      el.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`;
      observer.observe(el);
      allAnimated.push(el);
    });
  });

  // Failsafe visibility check to guarantee all elements in viewport are always visible
  const checkVisibility = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    allAnimated.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < vh + 100 && r.bottom > -100 && r.left < vw + 100 && r.right > -100) {
        el.style.opacity = '1';
        el.style.transform = '';
      }
    });
  };
  window.checkScrollAnimationsVisibility = checkVisibility;
  window.addEventListener('scroll', checkVisibility, { passive: true });
  // Initial check on load
  setTimeout(checkVisibility, 200);
}

/* ==========================================================================
   9. DYNAMIC HYDRATION FROM CENTRAL DATA STORE
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
      const primary = cust.colors.primary || cust.colors.maroon || '#13294A';
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

      // Section backgrounds match theme headerBg
      root.style.setProperty('--hero-bg-color', headerBg);
      root.style.setProperty('--proto-bg-color', headerBg);
      root.style.setProperty('--connect-bg-color', headerBg);

      const heroSec = document.getElementById('hero') || document.querySelector('.hero-section');
      if (heroSec) heroSec.style.backgroundColor = headerBg;
      const heroCloudsLayer = document.getElementById('heroCloudsLayer');
      if (heroCloudsLayer) heroCloudsLayer.style.backgroundColor = headerBg;

      const protoSec = document.getElementById('prototyping') || document.querySelector('.prototyping-section');
      if (protoSec) protoSec.style.backgroundColor = headerBg;
      const protoLayer = document.getElementById('protoBgLayer');
      if (protoLayer) protoLayer.style.backgroundColor = headerBg;

      const connectSec = document.getElementById('connect') || document.querySelector('.connect-section');
      if (connectSec) connectSec.style.backgroundColor = headerBg;
      const connectLayer = document.getElementById('connectBgLayer');
      if (connectLayer) connectLayer.style.backgroundColor = headerBg;
    }

    // B. Hero Typography Tokens & Text
    if (cust.hero) {
      if (cust.hero.titleSize && window.innerWidth > 768) {
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
        const roleEl = document.querySelector('.hero-role-text') || document.querySelector('.hero-role');
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
        bgs.hero.type = 'color';
        bgs.hero.image = null;
        const heroCloudsLayer = document.getElementById('heroCloudsLayer');
        const heroSec = document.getElementById('hero') || document.querySelector('.hero-section');
        const colorVal = bgs.hero.color || (cust.colors && cust.colors.headerBg) || '#13294A';
        root.style.setProperty('--hero-bg-color', colorVal);
        root.style.setProperty('--hero-bg-image', 'none');
        if (heroSec) {
          heroSec.style.backgroundColor = colorVal;
        }
        if (heroCloudsLayer) {
          heroCloudsLayer.style.backgroundImage = 'none';
          heroCloudsLayer.style.backgroundColor = colorVal;
        }
      }
      // Prototyping Background
      if (bgs.prototyping) {
        const protoLayer = document.getElementById('protoBgLayer');
        const protoSec = document.getElementById('prototyping') || document.querySelector('.prototyping-section');
        const isColor = bgs.prototyping.type === 'color' || (!bgs.prototyping.image && bgs.prototyping.color);
        const colorVal = bgs.prototyping.color || (cust.colors && cust.colors.headerBg) || '#13294A';
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
        const connectSec = document.getElementById('connect') || document.querySelector('.connect-section');
        const colorVal = bgs.connect.color || (cust.colors && cust.colors.headerBg) || '#13294A';
        root.style.setProperty('--connect-bg-color', colorVal);
        root.style.setProperty('--connect-bg-image', 'none');
        if (connectSec) {
          connectSec.style.backgroundColor = colorVal;
        }
      }
    }

    // E. Section Titles & Subtitles handled in Unified Section Sync below
  }

  // 1. Profile & Hero Section
  const p = data.profile;
  const custHero = (data.customization && data.customization.hero) || {};
  if (p || custHero) {
    const profRole = (p && p.role) || custHero.role;
    const profLine1 = (p && p.titleLine1) || custHero.titleLine1;
    const profLine2 = (p && p.titleLine2) || custHero.titleLine2;

    const titleLine1 = document.querySelector('.hero-title .title-line:nth-child(1)');
    const titleLine2 = document.querySelector('.hero-title .title-line:nth-child(2)');
    if (titleLine1 && profLine1) titleLine1.textContent = profLine1;
    if (titleLine2 && profLine2) titleLine2.textContent = profLine2;

    const roleEl = document.querySelector('.hero-role-text') || document.querySelector('.hero-role');
    if (roleEl && profRole) roleEl.textContent = profRole;

    const taglineEl = document.querySelector('.hero-tagline');
    if (taglineEl && p && p.tagline) taglineEl.textContent = p.tagline;

    const narrativeEl = document.querySelector('.hero-narrative');
    if (narrativeEl && p && p.bio) narrativeEl.textContent = p.bio;

    const locEl = document.querySelector('.hero-location-pill span') || document.querySelector('.hero-location span');
    if (locEl && p && p.location) locEl.textContent = p.location;

    const statusTextEl = document.querySelector('.status-text');
    if (statusTextEl && p && p.statusText) statusTextEl.textContent = p.statusText;

    const statusDotEl = document.querySelector('.status-dot');
    if (statusDotEl && p && p.statusType) {
      statusDotEl.className = `status-dot status-dot-${p.statusType}`;
    }

    // Hero Primary CTA (View My Work)
    const ctaWorkBtn = document.querySelector('.btn-hero-white') || document.querySelector('.btn-white');
    if (ctaWorkBtn && p) {
      if (p.ctaWorkText) {
        const textSpan = ctaWorkBtn.querySelector('span');
        if (textSpan) textSpan.textContent = p.ctaWorkText;
        else ctaWorkBtn.textContent = p.ctaWorkText;
      }
      if (p.ctaWorkUrl) {
        ctaWorkBtn.href = p.ctaWorkUrl;
      }
    }

    // Hero Secondary CTA (Send an Email)
    const emailCtaBtn = document.getElementById('heroEmailBtn') || document.getElementById('heroAboutBtn') || document.getElementById('heroReadStoryBtn');
    if (emailCtaBtn && p) {
      if (p.ctaStoryText) {
        const textSpan = emailCtaBtn.querySelector('span');
        if (textSpan) textSpan.textContent = p.ctaStoryText;
        else emailCtaBtn.textContent = p.ctaStoryText;
      }
      if (p.ctaStoryUrl) {
        emailCtaBtn.href = p.ctaStoryUrl;
      }
    }

    if (p && p.stats && Array.isArray(p.stats) && p.stats.length >= 3) {
      const statNums = document.querySelectorAll('.hero-stats-row .stat-num');
      const statLbls = document.querySelectorAll('.hero-stats-row .stat-lbl');
      p.stats.forEach((st, idx) => {
        if (statNums[idx] && st.value) statNums[idx].textContent = st.value;
        if (statLbls[idx] && st.label) statLbls[idx].innerHTML = st.label.replace(/\n/g, '<br>');
      });
    }

    const heroAvatar = document.querySelector('.hero-character-img');
    if (heroAvatar && p && p.avatar) heroAvatar.src = p.avatar;

    const connectAvatar = document.querySelector('.connect-character-img');
    if (connectAvatar && p && p.avatar) connectAvatar.src = p.avatar;

    if (p && p.music) {
      const musicCaption = document.querySelector('.music-caption');
      if (musicCaption && p.music.caption) musicCaption.textContent = p.music.caption;

      const musicTrack = document.querySelector('.music-track-name');
      if (musicTrack && p.music.trackName) musicTrack.textContent = p.music.trackName;

      const audioEl = document.getElementById('heroBgAudio');
      if (audioEl && p.music.audioSrc) {
        if (!audioEl.src.endsWith(p.music.audioSrc)) {
          audioEl.src = p.music.audioSrc;
        }
      }
    }
  }

  // 1b. Hero Overlapping Cards Cluster (Images, Videos, Alt, Links, Rotation)
  if (data.heroCards && Array.isArray(data.heroCards)) {
    const resolveMedia = (src) => (window.PortfolioMediaDB ? window.PortfolioMediaDB.resolveUrlSync(src) : src) || '';
    data.heroCards.forEach((hc, idx) => {
      const cardEl = document.querySelector(`.hero-card-${idx + 1}`) || document.querySelector(`.hero-card[data-index="${idx + 1}"]`);
      if (cardEl) {
        const inner = cardEl.querySelector('.hero-card-inner');
        if (inner) {
          const hcVideo = resolveMedia(hc.video);
          const hcImage = resolveMedia(hc.image);
          const isVideo = Boolean(
            (hc.mediaType === 'video' && hcVideo) ||
            (hcVideo && (!hc.mediaType || hc.mediaType !== 'image'))
          );
          if (isVideo) {
            let vid = inner.querySelector('video');
            const img = inner.querySelector('img');
            if (!vid) {
              vid = document.createElement('video');
              vid.className = 'hero-card-video';
              vid.autoplay = true;
              vid.muted = true;
              vid.loop = true;
              vid.playsInline = true;
              vid.defaultMuted = true;
              vid.preload = 'auto';
              vid.setAttribute('autoplay', '');
              vid.setAttribute('muted', '');
              vid.setAttribute('loop', '');
              vid.setAttribute('playsinline', '');
              vid.setAttribute('preload', 'auto');
              vid.style.width = '100%';
              vid.style.height = '100%';
              vid.style.objectFit = 'cover';
              vid.style.borderRadius = '28px';
              vid.style.display = 'block';
            try { localStorage.removeItem(`fast_hero_card_${idx + 1}`); } catch(e) {}
              vid.style.pointerEvents = 'none';
              inner.prepend(vid);
            }
            vid.muted = true;
            vid.defaultMuted = true;
            vid.playsInline = true;
            vid.setAttribute('muted', '');
            vid.setAttribute('autoplay', '');
            vid.setAttribute('loop', '');
            vid.setAttribute('playsinline', '');
            if (vid.src !== hcVideo && !vid.src.endsWith(hcVideo)) {
              vid.src = hcVideo;
            }
            vid.style.display = 'block';
            try { localStorage.removeItem(`fast_hero_card_${idx + 1}`); } catch(e) {}
            vid.onerror = () => {
              vid.style.display = 'none';
              if (img) img.style.display = 'block';
            };
            const tryPlay = () => {
              const p = vid.play();
              if (p !== undefined) {
                p.catch(() => {
                  vid.addEventListener('canplay', () => { vid.play().catch(() => {}); }, { once: true });
                });
              }
            };
            tryPlay();
            if (vid.readyState >= 2) {
              if (img) img.style.display = 'none';
            } else {
              vid.addEventListener('loadeddata', () => {
                if (img) img.style.display = 'none';
              }, { once: true });
            }
          } else if (hcImage || hc.image) {
            const vid = inner.querySelector('video');
            if (vid) {
              try { vid.pause(); } catch(e) {}
              vid.style.display = 'none';
            }
            const img = inner.querySelector('img');
            if (img) {
              const targetSrc = hcImage || hc.image;
              if (targetSrc && !targetSrc.startsWith('idb://')) {
                if (img.src !== targetSrc && !img.src.endsWith(targetSrc)) {
                  if (img.src.startsWith('data:') && targetSrc.startsWith('blob:')) {
                    const probe = new Image();
                    probe.onload = () => { img.src = targetSrc; };
                    probe.src = targetSrc;
                  } else {
                    img.src = targetSrc;
                  }
                }
                if (!targetSrc.startsWith('blob:')) {
                  try {
                    localStorage.setItem(`fast_hero_card_${idx + 1}`, targetSrc);
                  } catch(e) {}
                }
              }
              img.alt = hc.alt || hc.title || '';
              img.style.display = 'block';
            }
          }
        }

        // Click navigation to link
        if (hc.link) {
          cardEl.style.cursor = 'pointer';
          cardEl.setAttribute('role', 'link');
          cardEl.title = hc.title || `Navigate to ${hc.link}`;
          cardEl.onclick = (e) => {
            if (hc.link.startsWith('#')) {
              const target = document.querySelector(hc.link);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                return;
              }
            }
            window.location.href = hc.link;
          };
        }

        // Custom tilt rotation
        if (hc.rotation !== undefined) {
          cardEl.dataset.customRot = hc.rotation;
          cardEl.style.setProperty('--base-rot', `${hc.rotation}deg`);
        }
      }
    });
  }

  // 1c. About Me Section (#about)
  const aboutSec = document.getElementById('about');
  if (aboutSec && data.about) {
    const ab = data.about;
    const tagEl = aboutSec.querySelector('.about-tag-label');
    if (tagEl && ab.tag) tagEl.textContent = ab.tag;

    const hl1 = aboutSec.querySelector('.about-head-line-1');
    if (hl1 && ab.headlineLine1) hl1.textContent = ab.headlineLine1;

    const hl2 = aboutSec.querySelector('.about-head-highlight');
    if (hl2 && ab.headlineLine2) hl2.textContent = ab.headlineLine2;

    const hl3 = aboutSec.querySelector('.about-tangible-text');
    if (hl3 && ab.headlineLine3) hl3.textContent = ab.headlineLine3;

    const bioPs = aboutSec.querySelectorAll('.about-bio-text p');
    if (bioPs && bioPs.length >= 2) {
      if (ab.bioParagraph1) {
        bioPs[0].innerHTML = ab.bioParagraph1;
      }
      if (ab.bioParagraph2) {
        bioPs[1].innerHTML = ab.bioParagraph2;
      }
    }

    const phraseEl = aboutSec.querySelector('.about-handwritten-phrase');
    if (phraseEl && ab.statementPhrase) phraseEl.textContent = ab.statementPhrase;

    const ctaLink = aboutSec.querySelector('.about-journey-cta');
    const ctaText = aboutSec.querySelector('.about-cta-text');
    if (ctaText && ab.ctaText) ctaText.textContent = ab.ctaText;
    if (ctaLink && ab.ctaUrl) ctaLink.href = ab.ctaUrl;

    const portraitImg = aboutSec.querySelector('.about-portrait-img');
    if (portraitImg && ab.portraitImage) {
      const resolvedPortrait = (window.PortfolioMediaDB ? window.PortfolioMediaDB.resolveUrlSync(ab.portraitImage) : ab.portraitImage) || ab.portraitImage;
      portraitImg.src = resolvedPortrait;
    }

    const nametagLines = aboutSec.querySelectorAll('.about-nametag .about-nametag-line');
    if (nametagLines && nametagLines.length >= 2) {
      if (ab.nametagLine1) nametagLines[0].textContent = ab.nametagLine1;
      if (ab.nametagLine2) nametagLines[1].textContent = ab.nametagLine2;
    }

    const repeatContainer = aboutSec.querySelector('.about-repeat-text');
    if (repeatContainer && ab.repeatText) {
      const lines = ab.repeatText.split('\n').filter(Boolean);
      repeatContainer.innerHTML = lines.map(l => `<span>${l}</span>`).join('');
    }

    const toolsNote = aboutSec.querySelector('.about-tools-note-text');
    if (toolsNote && ab.toolsNote) {
      const parts = ab.toolsNote.split('\n');
      if (parts.length > 1) {
        toolsNote.innerHTML = parts.map(p => `<span>${p}</span>`).join('');
      } else {
        toolsNote.textContent = ab.toolsNote;
      }
    }

    // 1c. Software & Tool Stack Icons Row
    const toolsRow = aboutSec.querySelector('.about-tools-row');
    if (toolsRow && Array.isArray(ab.tools) && ab.tools.length > 0) {
      toolsRow.innerHTML = ab.tools
        .filter(t => t.visible !== false)
        .map(t => {
          const title = (t.name || 'Tool').replace(/"/g, '&quot;');
          const rawCustomImg = t.customImage || '';
          let customImg = rawCustomImg;
          if (rawCustomImg.startsWith('idb://') && window.PortfolioMediaDB) {
            customImg = window.PortfolioMediaDB.resolveUrlSync(rawCustomImg);
          }
          const bgStyle = t.bgColor ? `background: ${t.bgColor};` : '';
          const textStyle = t.textColor ? `color: ${t.textColor};` : '';
          const combinedStyle = [bgStyle, textStyle].filter(Boolean).join(' ');
          const styleAttr = combinedStyle ? ` style="${combinedStyle}"` : '';

          const isImageMode = t.type === 'custom-image' || t.preset === 'custom-image' || (!!rawCustomImg && t.type !== 'preset');
          if (isImageMode && rawCustomImg) {
            const isContain = t.fit === 'contain';
            const imgFitStyle = isContain ? 'max-width:24px;max-height:24px;object-fit:contain;' : 'width:100%;height:100%;object-fit:cover;border-radius:inherit;';
            const idbAttrs = rawCustomImg.startsWith('idb://') ? ` data-idb-src="${rawCustomImg}" data-src="${rawCustomImg}"` : '';
            return `<div class="about-tool-tile tool-custom ${isContain ? 'fit-contain' : ''}" title="${title}" aria-label="${title}"${styleAttr}><img src="${customImg || rawCustomImg}"${idbAttrs} alt="${title}" style="${imgFitStyle}display:block;" onerror="this.style.opacity='0.6'" /></div>`;
          }

          const preset = (t.preset || 'custom-badge').toLowerCase();
          switch (preset) {
            case 'fusion':
              return `<div class="about-tool-tile tool-fusion" title="${title}" aria-label="${title}"${styleAttr}><span class="tool-f-letter">F</span><span class="tool-f-sub">360</span></div>`;
            case 'figma':
              return `<div class="about-tool-tile tool-figma" title="${title}" aria-label="${title}"${styleAttr}><svg width="20" height="20" viewBox="0 0 38 57" fill="none" aria-hidden="true"><path d="M19 28.5C13.7533 28.5 9.5 24.2467 9.5 19C9.5 13.7533 13.7533 9.5 19 9.5H28.5V28.5H19Z" fill="#F24E1E"/><path d="M28.5 0H19C13.7533 0 9.5 4.25329 9.5 9.5H19C24.2467 9.5 28.5 5.24671 28.5 0Z" fill="#FF7262"/><path d="M28.5 0V19C28.5 24.2467 24.2467 28.5 19 28.5V0H28.5Z" fill="#A259FF"/><path d="M9.5 38C9.5 32.7533 13.7533 28.5 19 28.5V47.5C13.7533 47.5 9.5 43.2467 9.5 38Z" fill="#0ACF83"/><path d="M28.5 28.5C28.5 33.7467 24.2467 38 19 38C13.7533 38 9.5 33.7467 9.5 28.5C9.5 23.2533 13.7533 19 19 19C24.2467 19 28.5 23.2533 28.5 28.5Z" fill="#1ABCFE"/></svg></div>`;
            case 'ps':
              return `<div class="about-tool-tile tool-ps" title="${title}" aria-label="${title}"${styleAttr}><span class="tool-adobe-text">Ps</span></div>`;
            case 'ai':
              return `<div class="about-tool-tile tool-ai" title="${title}" aria-label="${title}"${styleAttr}><span class="tool-adobe-text">Ai</span></div>`;
            case 'sketch':
              return `<div class="about-tool-tile tool-sketch" title="${title}" aria-label="${title}"${styleAttr}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${t.textColor || '#FFFFFF'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>`;
            case 'cad':
              return `<div class="about-tool-tile tool-cad" title="${title}" aria-label="${title}"${styleAttr}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${t.textColor || '#FFFFFF'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>`;
            case 'solidworks':
              return `<div class="about-tool-tile tool-solidworks" title="${title}" aria-label="${title}"${styleAttr}><span class="tool-adobe-text" style="color:${t.textColor || '#FFFFFF'};font-size:14px;font-weight:900;">SW</span></div>`;
            case 'blender':
              return `<div class="about-tool-tile tool-blender" title="${title}" aria-label="${title}"${styleAttr}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.5" fill="${t.textColor || '#EA7600'}"/><path d="M12 2C8 2 6 5 6 8c0 3 2 5 6 5s6-2 6-5c0-3-2-6-6-6z" stroke="${t.textColor || '#EA7600'}" stroke-width="1.8" fill="none"/><path d="M5 19c2 2 5 3 7 3s5-1 7-3" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/></svg></div>`;
            case 'rhino':
              return `<div class="about-tool-tile tool-rhino" title="${title}" aria-label="${title}"${styleAttr}><span class="tool-adobe-text" style="color:${t.textColor || '#FFFFFF'};font-size:14px;font-weight:900;">Rh</span></div>`;
            case 'keyshot':
              return `<div class="about-tool-tile tool-keyshot" title="${title}" aria-label="${title}"${styleAttr}><span class="tool-adobe-text" style="color:${t.textColor || '#29B6F6'};font-size:14px;font-weight:900;">KS</span></div>`;
            case 'ae':
              return `<div class="about-tool-tile tool-ae" title="${title}" aria-label="${title}"${styleAttr}><span class="tool-adobe-text" style="color:${t.textColor || '#D291FF'};">Ae</span></div>`;
            case 'pr':
              return `<div class="about-tool-tile tool-pr" title="${title}" aria-label="${title}"${styleAttr}><span class="tool-adobe-text" style="color:${t.textColor || '#E099FF'};">Pr</span></div>`;
            case 'custom-badge':
            default:
              const badge = (t.badgeText || (t.name ? t.name.slice(0, 3).toUpperCase() : '3D')).replace(/</g, '&lt;');
              return `<div class="about-tool-tile tool-custom" title="${title}" aria-label="${title}"${styleAttr}><span class="tool-adobe-text" style="color:${t.textColor || '#FFFFFF'};font-size:13px;font-weight:900;">${badge}</span></div>`;
          }
        })
        .join('');

      // Asynchronously resolve and populate any idb:// images that may not have been preloaded
      ab.tools.forEach(t => {
        if (t.customImage && t.customImage.startsWith('idb://') && window.PortfolioMediaDB) {
          const key = t.customImage.replace(/^idb:\/\//, '');
          window.PortfolioMediaDB.getMediaUrl(key).then(resolved => {
            if (resolved) {
              const img = toolsRow.querySelector(`img[data-idb-src="${t.customImage}"]`);
              if (img) img.src = resolved;
            }
          });
        }
      });
    }

    // Info cards
    const cards = aboutSec.querySelectorAll('.about-col-cards .about-info-card');
    if (cards && cards.length >= 3) {
      // Card 1: Education
      const c1Title = cards[0].querySelector('.about-card-title');
      const c1Main = cards[0].querySelector('.about-card-main-text');
      const c1Sub = cards[0].querySelector('.about-card-sub-text');
      if (c1Title && ab.educationTitle) c1Title.textContent = ab.educationTitle;
      if (c1Main && ab.educationDegree) c1Main.textContent = ab.educationDegree;
      if (c1Sub && ab.educationSchool) c1Sub.textContent = ab.educationSchool;

      // Card 2: Focus Areas
      const c2Title = cards[1].querySelector('.about-card-title');
      const c2Spans = cards[1].querySelectorAll('.about-focus-list span');
      if (c2Title && ab.focusTitle) c2Title.textContent = ab.focusTitle;
      if (c2Spans && c2Spans.length >= 3) {
        if (ab.focusItem1) c2Spans[0].textContent = ab.focusItem1;
        if (ab.focusItem2) c2Spans[1].textContent = ab.focusItem2;
        if (ab.focusItem3) c2Spans[2].textContent = ab.focusItem3;
      }

      // Card 3: Beyond Design
      const c3Title = cards[2].querySelector('.about-card-title');
      const c3Desc = cards[2].querySelector('.about-card-desc');
      if (c3Title && ab.beyondTitle) c3Title.textContent = ab.beyondTitle;
      if (c3Desc && ab.beyondDesc) c3Desc.textContent = ab.beyondDesc;
    }
  }

  // 1d. Section Divider Ribbon (.about-work-divider)
  const dividerEl = document.querySelector('.about-work-divider');
  if (dividerEl && data.sectionDivider) {
    const sDiv = data.sectionDivider;
    if (sDiv.enabled === false) {
      dividerEl.style.display = 'none';
    } else {
      dividerEl.style.display = '';
      if (sDiv.height) {
        dividerEl.style.height = `${sDiv.height}px`;
      }
      const texts = [sDiv.text1, sDiv.text2, sDiv.text3, sDiv.text4, sDiv.text5].filter(Boolean);
      if (texts.length > 0) {
        const marqueeContents = dividerEl.querySelectorAll('.divider-marquee-content');
        const marqueeHtml = texts.map(t => `<span class="divider-text-item">${t}</span><span class="divider-star" aria-hidden="true">✦</span>`).join('');
        marqueeContents.forEach(mc => {
          mc.innerHTML = marqueeHtml;
        });
      }
    }
  }

  // 2. Selected Work / Projects
  if (data.projects && Array.isArray(data.projects)) {
    // Check Category Filters ON/OFF toggle
    const cf = data.customization?.categoryFilters || {};
    const isFiltersEnabled = cf.enabled !== false;
    document.body.classList.toggle('no-category-filters', !isFiltersEnabled);
    const filterPillsContainer = document.querySelector('.filter-pills') || document.getElementById('workCategoryFilters');
    if (filterPillsContainer) {
      filterPillsContainer.style.display = isFiltersEnabled ? '' : 'none';
    }

    // Category names and suffix
    const suffix = (cf.suffix !== undefined ? cf.suffix : 'Projects').trim();
    const prodName = cf.productName || (data.categories?.find(c => c.id === 'product')?.name) || 'Product Design';
    const uiuxName = cf.uiuxName || (data.categories?.find(c => c.id === 'uiux')?.name) || 'UI/UX Design';
    const graphName = cf.graphicName || (data.categories?.find(c => c.id === 'graphic')?.name) || 'Graphic Design';

    // Update category pill badges and labels
    const prodCount = data.projects.filter(pr => pr.category === 'product').length;
    const uiuxCount = data.projects.filter(pr => pr.category === 'uiux').length;
    const graphCount = data.projects.filter(pr => pr.category === 'graphic').length;

    function updatePillItem(catId, name, count) {
      const pill = document.querySelector(`.filter-pill[data-category="${catId}"]`);
      if (!pill) return;
      let labelEl = pill.querySelector('.pill-label');
      if (labelEl) {
        labelEl.textContent = name;
      } else {
        const badgeEl = pill.querySelector('.pill-badge');
        for (let node of Array.from(pill.childNodes)) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = name + ' ';
            break;
          }
        }
      }
      let badge = pill.querySelector('.pill-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'pill-badge';
        pill.appendChild(badge);
      }
      badge.textContent = suffix ? `${count} ${suffix}` : `${count}`;
    }

    updatePillItem('product', prodName, prodCount);
    updatePillItem('uiux', uiuxName, uiuxCount);
    updatePillItem('graphic', graphName, graphCount);

    const productBadge = document.getElementById('productBadgeCount');
    const uiuxBadge = document.getElementById('uiuxBadgeCount');
    const graphicBadge = document.getElementById('graphicBadgeCount');

    if (productBadge) productBadge.textContent = suffix ? `${prodCount} ${suffix}` : `${prodCount}`;
    if (uiuxBadge) uiuxBadge.textContent = suffix ? `${uiuxCount} ${suffix}` : `${uiuxCount}`;
    if (graphicBadge) graphicBadge.textContent = suffix ? `${graphCount} ${suffix}` : `${graphCount}`;

    // Update category label on all existing project cards in DOM
    const allCards = document.querySelectorAll('.sw-project-card');
    allCards.forEach(card => {
      const cat = card.dataset.category;
      const catSpan = card.querySelector('.sw-card-category');
      if (catSpan && cat) {
        if (cat === 'product' && prodName) catSpan.textContent = prodName.toUpperCase();
        else if (cat === 'uiux' && uiuxName) catSpan.textContent = uiuxName.toUpperCase();
        else if (cat === 'graphic' && graphName) catSpan.textContent = graphName.toUpperCase();
      }
    });

    // Update showcase slider with live projects
    const showcaseSlider = document.getElementById('swShowcaseSlider');
    if (showcaseSlider && window.workShowcaseSlider) {
      window.workShowcaseSlider.setProjects(data.projects);
    }
  }

  // 3. Prototyping Section (3-column responsive grid with normal scrolling)
  if (data.prototypes && Array.isArray(data.prototypes)) {
    const resolveMedia = (src) => (window.PortfolioMediaDB ? window.PortfolioMediaDB.resolveUrlSync(src) : src) || '';

    const makeProtoCard = (pt, idx) => {
      const card = document.createElement('div');
      card.className = 'proto-card';
      card.setAttribute('data-proto', pt.id || `proto-${idx}`);

      const ptVideo = resolveMedia(pt.video);
      const ptSrc = resolveMedia(pt.src);
      const isVideo = Boolean(
        (pt.mediaType === 'video' && ptVideo) ||
        (!pt.mediaType && ptVideo && !ptSrc) ||
        (ptVideo && (window.PortfolioData?.isMediaVideo ? window.PortfolioData.isMediaVideo(ptVideo) : /\.(mp4|webm|mov|m4v|ogv)($|\?|#)/i.test(ptVideo)))
      );
      const mediaTag = isVideo
        ? `<video src="${ptVideo}" autoplay muted loop playsinline webkit-playsinline></video>`
        : `<img src="${ptSrc || 'assets/images/proto_drafting.jpg'}" alt="${pt.title || ''}" loading="lazy" onerror="this.src='assets/images/proto_drafting.jpg'">`;

      const categoryText = pt.category || pt.tag || `STEP 0${idx + 1} \u2022 RAPID PROTOTYPING`;
      const captionText = pt.title || pt.caption || '';

      card.innerHTML = `
        <div class="proto-photo">
          ${mediaTag}
        </div>
        <div class="proto-card-info">
          <span class="proto-card-category">${categoryText}</span>
          <h4 class="proto-card-caption">${captionText}</h4>
        </div>
      `;

      if (isVideo) {
        const v = card.querySelector('video');
        if (v) {
          v.muted = true;
          v.defaultMuted = true;
          v.playsInline = true;
          v.play().catch(() => {});
        }
      }
      return card;
    };

    const protoGrid = document.getElementById('protoCardsGrid') || document.querySelector('.proto-cards-grid');
    if (protoGrid) {
      protoGrid.innerHTML = '';
      const items = (data.prototypes && data.prototypes.length >= 6) ? data.prototypes.slice(0, 6) : (data.prototypes || []);
      items.forEach((pt, idx) => protoGrid.appendChild(makeProtoCard(pt, idx)));
      if (typeof initProtoSlider === 'function') {
        initProtoSlider();
      }
    }

    const quoteEl = document.querySelector('.proto-quote');
    if (quoteEl && data.protoQuote) {
      quoteEl.textContent = `"${data.protoQuote.replace(/^"|"$/g, '')}"`;
    }
  }

  // 4. Field Notes & Frames (Gallery) - 3 Columns with Alternating 9:16 and 1:1 Cards
  if (data.gallery && Array.isArray(data.gallery)) {
    const galleryCols = document.querySelectorAll('#galleryMasonryGrid .gallery-col, #gallery .gallery-col');
    if (galleryCols.length === 3) {
      const resolveMedia = (src) => (window.PortfolioMediaDB ? window.PortfolioMediaDB.resolveUrlSync(src) : src) || '';
      galleryCols.forEach(c => c.innerHTML = '');

      const itemsToRender = data.gallery.slice(0, 12);
      itemsToRender.forEach((g, idx) => {
        let colIdx = 0;
        if (g.col && g.col >= 1 && g.col <= 3) {
          colIdx = g.col - 1;
        } else {
          colIdx = Math.floor(idx / 4) % 3;
        }

        const colEl = galleryCols[colIdx];
        if (!colEl) return;

        const rowIdx = colEl.children.length;
        // Col 1 (colIdx 0): Tall, Square, Tall, Square
        // Col 2 (colIdx 1): Square, Tall, Square, Tall
        // Col 3 (colIdx 2): Tall, Square, Tall, Square
        let isTall = false;
        if (colIdx === 1) {
          isTall = (rowIdx % 2 === 1);
        } else {
          isTall = (rowIdx % 2 === 0);
        }

        let cardTypeClass = isTall ? 'card-tall' : 'card-square';
        if (g.type === 'card-tall') cardTypeClass = 'card-tall';
        else if (g.type === 'card-square' || g.type === 'card-short') cardTypeClass = 'card-square';

        const card = document.createElement('div');
        card.className = `gallery-card ${cardTypeClass}`;
        const orderNum = (rowIdx * 3) + (colIdx + 1);
        card.style.order = String(orderNum);
        const gVideo = resolveMedia(g.video);
        const gSrc = resolveMedia(g.src);
        const isVideo = Boolean(
          (g.mediaType === 'video') ||
          (!g.mediaType && gVideo && !gSrc) ||
          (gVideo && !gSrc) ||
          (window.PortfolioData?.isMediaVideo ? (window.PortfolioData.isMediaVideo(gVideo) || window.PortfolioData.isMediaVideo(gSrc)) : (/\.(mp4|webm|mov|ogg|m4v)($|\?|#)/i.test(gVideo || gSrc) || String(gVideo || gSrc).includes('/video/upload/')))
        );
        const mediaSource = isVideo ? (gVideo || gSrc) : (gSrc || 'assets/images/gallery_forest.jpg');
        card.dataset.caption = g.caption || '';
        card.dataset.src = mediaSource;
        if (isVideo) card.dataset.mediaType = 'video';

        const mediaTag = isVideo
          ? `<video src="${mediaSource}" autoplay muted loop playsinline webkit-playsinline onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';"></video>
             <img src="${gSrc || 'assets/images/gallery_forest.jpg'}" alt="${g.caption || ''}" loading="lazy" style="display:none;" onerror="this.src='assets/images/gallery_forest.jpg'">`
          : `<img src="${mediaSource}" alt="${g.caption || ''}" loading="lazy" onerror="this.src='assets/images/gallery_forest.jpg'">`;

        card.innerHTML = mediaTag;
        if (isVideo) {
          const v = card.querySelector('video');
          if (v) {
            v.muted = true;
            v.defaultMuted = true;
            v.playsInline = true;
            v.play().catch(() => {});
          }
        }
        colEl.appendChild(card);
      });

      initGalleryLightbox();
      const counterEl = document.getElementById('lightboxCounter');
      if (counterEl) {
        counterEl.textContent = `1 / ${itemsToRender.length}`;
      }
    }
  }

  // 5. Connect & Footer
  if (data.connect) {
    const c = data.connect;
    const resolveMedia = (src) => (window.PortfolioMediaDB ? window.PortfolioMediaDB.resolveUrlSync(src) : src) || '';
    const titleEl = document.querySelector('.connect-title, #connect .connect-title');
    if (titleEl && c.title) titleEl.textContent = c.title;

    const descEl = document.querySelector('.connect-desc, #connect .connect-desc');
    if (descEl && c.desc) descEl.textContent = c.desc;

    const mediaImg = document.getElementById('connectMediaImg');
    const mediaVideo = document.getElementById('connectMediaVideo');
    const connVid = resolveMedia(c.videoSrc);
    const connImg = resolveMedia(c.mediaSrc);
    if (c.mediaType === 'video' && connVid && mediaVideo) {
      const sourceEl = mediaVideo.querySelector('source');
      if (sourceEl) sourceEl.src = connVid;
      if (mediaVideo.src !== connVid && !mediaVideo.src.endsWith(connVid)) {
        mediaVideo.src = connVid;
        try { mediaVideo.load(); } catch(e) {}
      }
      mediaVideo.muted = true;
      mediaVideo.defaultMuted = true;
      mediaVideo.playsInline = true;
      mediaVideo.setAttribute('playsinline', '');
      mediaVideo.setAttribute('webkit-playsinline', '');
      mediaVideo.style.display = 'block';
      try { mediaVideo.play().catch(() => {}); } catch(e) {}
      if (mediaImg) mediaImg.style.display = 'none';
    } else if (mediaImg && connImg) {
      mediaImg.src = connImg;
      mediaImg.style.display = 'block';
      if (mediaVideo) {
        try { mediaVideo.pause(); } catch(e) {}
        mediaVideo.style.display = 'none';
      }
    }

    const shootEmailBtn = document.getElementById('shootEmailBtn');
    if (shootEmailBtn) {
      if (c.email) shootEmailBtn.href = `mailto:${c.email}`;
      const shootBtnText = shootEmailBtn.querySelector('span');
      if (shootBtnText && c.emailLabel) shootBtnText.textContent = c.emailLabel;
    }

    const emailLink = document.querySelector('.direct-email-link');
    if (emailLink && c.email) {
      emailLink.href = `mailto:${c.email}`;
      emailLink.textContent = c.email;
    }

    const resumeBtn = document.getElementById('downloadResumeBtn');
    if (resumeBtn) {
      if (c.resumeUrl) resumeBtn.href = c.resumeUrl;
      const resumeBtnText = resumeBtn.querySelector('span');
      if (resumeBtnText && c.resumeLabel) resumeBtnText.textContent = c.resumeLabel;
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

    const statusBadge = document.querySelector('.connect-status-badge');
    if (statusBadge && c.statusBadge) {
      statusBadge.innerHTML = `<span class="status-pulse-dot"></span> ${c.statusBadge}`;
    }

    const colophonEl = document.getElementById('connectStudioColophon');
    if (colophonEl && (c.colophon1 || c.colophon2)) {
      const line1 = c.colophon1 || 'PAWAN K. KUSHWAHA • INDUSTRIAL DESIGNER';
      const line2 = c.colophon2 || 'NEW DELHI, INDIA • 2026';
      colophonEl.innerHTML = `
        ${line1}<br>
        <span>${line2}</span>
        <div><a href="admin.html" class="admin-entry-link" title="Owner Admin Control Center (Ctrl+Shift+A)" style="opacity: 0.35; color: inherit; text-decoration: none; font-size: 10px; letter-spacing: 0.08em; display: inline-block; margin-top: 6px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='0.35'">• ADMIN CONTROL</a></div>
      `;
    }
  }

  // Unified Section Titles & Subtitles Synchronization
  const secTitles = data.sections || (data.customization && data.customization.sections) || {};
  const workTitleEl = document.querySelector('#work .sw-title, #work .section-title, .sw-title');
  if (workTitleEl && (secTitles.workTitle || data.workTitle)) {
    workTitleEl.textContent = secTitles.workTitle || data.workTitle;
  }

  const workSubEl = document.querySelector('#work .sw-subtitle, #work .section-subtitle, .sw-subtitle');
  if (workSubEl && (secTitles.workSubtitle || data.workSubtitle)) {
    workSubEl.textContent = secTitles.workSubtitle || data.workSubtitle;
  }

  const protoTitleEl = document.querySelector('#prototyping .section-title, .proto-header .section-title');
  if (protoTitleEl && (secTitles.protoTitle || data.protoTitle)) {
    protoTitleEl.textContent = secTitles.protoTitle || data.protoTitle;
  }

  const protoSubEl = document.querySelector('#prototyping .section-subtitle, .proto-header .section-subtitle');
  if (protoSubEl && (secTitles.protoSubtitle || data.protoSubtitle)) {
    protoSubEl.textContent = secTitles.protoSubtitle || data.protoSubtitle;
  }

  const protoTaglineEl = document.querySelector('#prototyping .proto-tagline, .proto-header .proto-tagline');
  if (protoTaglineEl && (secTitles.protoTagline || data.protoTagline || data.sections?.protoTagline)) {
    protoTaglineEl.textContent = secTitles.protoTagline || data.protoTagline || data.sections?.protoTagline;
  }

  const galleryTitleEl = document.querySelector('#gallery .section-title, .gallery-section .section-title');
  if (galleryTitleEl && (secTitles.galleryTitle || data.galleryTitle)) {
    galleryTitleEl.textContent = secTitles.galleryTitle || data.galleryTitle;
  }

  const gallerySubEl = document.querySelector('#gallery .section-subtitle, .gallery-section .section-subtitle');
  if (gallerySubEl && (secTitles.gallerySubtitle || data.gallerySubtitle)) {
    gallerySubEl.textContent = secTitles.gallerySubtitle || data.gallerySubtitle;
  }

  const galleryTaglineEl = document.querySelector('#gallery .gallery-tagline, .gallery-header-row .gallery-tagline');
  if (galleryTaglineEl && (secTitles.galleryTagline || data.galleryTagline || data.sections?.galleryTagline)) {
    galleryTaglineEl.textContent = secTitles.galleryTagline || data.galleryTagline || data.sections?.galleryTagline;
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

// Owner shortcut: Ctrl + Shift + A (or Cmd + Shift + A) to open Admin Control Center
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
    window.location.href = 'admin.html';
  }
});

