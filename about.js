/**
 * Pawan K. Kushwaha Portfolio - About Me Page Scripts
 * Handles navigation, mobile drawer, lens cursor, contact modal, and data hydration
 */

document.addEventListener('DOMContentLoaded', () => {
  hydrateAboutPage();
  initAboutNavbar();
  initAboutParallax();
  initAboutMagnifier();
  initAboutContactModal();
  initAboutScrollAnimations();

  window.addEventListener('portfolioDataUpdated', hydrateAboutPage);
  window.addEventListener('storage', (e) => {
    if (e.key === 'portfolio_custom_data') hydrateAboutPage();
  });
});

/* ==========================================================================
   1. NAVBAR & MOBILE DRAWER
   ========================================================================== */
function initAboutNavbar() {
  const header = document.getElementById('siteHeader');
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', !isExpanded);
      toggleBtn.classList.toggle('active');
      drawer.classList.toggle('open');
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.classList.remove('active');
        drawer.classList.remove('open');
      });
    });

    document.addEventListener('click', (e) => {
      if (drawer.classList.contains('open') && !drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.classList.remove('active');
        drawer.classList.remove('open');
      }
    });
  }

  // Logo tilt hover
  const logo = document.querySelector('.logo-script');
  if (logo) {
    logo.addEventListener('mouseenter', () => {
      logo.style.transform = 'rotate(-2deg) scale(1.06)';
    });
    logo.addEventListener('mousemove', (e) => {
      const rect = logo.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const xRatio = Math.max(0, Math.min(1, x / rect.width));
      const angle = -2 + (xRatio * 4);
      logo.style.transform = `rotate(${angle.toFixed(1)}deg) scale(1.06)`;
    });
    logo.addEventListener('mouseleave', () => {
      logo.style.transform = '';
    });
  }
}

/* ==========================================================================
   2. FOOTER PARALLAX
   ========================================================================== */
function initAboutParallax() {
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

  function animate(timestamp) {
    const isColor = cachedBg && (cachedBg.type === 'color' || (!cachedBg.image && cachedBg.color));
    const parallaxDisabled = cachedBg && cachedBg.parallax === false;
    if (isColor || parallaxDisabled) {
      connectLayer.style.transform = 'none';
    } else {
      const speed = (cachedBg && typeof cachedBg.speed === 'number') ? cachedBg.speed : 1.0;
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      connectLayer.style.transform = `translate3d(${(currentX * speed).toFixed(2)}px, ${(currentY * speed).toFixed(2)}px, 0)`;
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

/* ==========================================================================
   3. MAGNIFIER LENS CURSOR
   ========================================================================== */
function initAboutMagnifier() {
  const cursor = document.getElementById('magnifierCursor');
  const zoomContent = document.getElementById('magnifierZoomContent');
  const toggleBtn = document.getElementById('magnifierToggleBtn');
  const statusText = document.getElementById('magnifierStatusText');

  if (!cursor || !zoomContent) return;

  let isEnabled = localStorage.getItem('portfolio_lens_enabled') !== 'false';
  let isMouseInside = false;
  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;

  function updateStatusUI() {
    if (statusText) statusText.textContent = isEnabled ? 'ON' : 'OFF';
    if (toggleBtn) {
      toggleBtn.classList.toggle('off', !isEnabled);
      toggleBtn.setAttribute('aria-pressed', isEnabled);
    }
    cursor.style.display = isEnabled && isMouseInside ? 'block' : 'none';
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isEnabled = !isEnabled;
      localStorage.setItem('portfolio_lens_enabled', isEnabled);
      updateStatusUI();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      isEnabled = !isEnabled;
      localStorage.setItem('portfolio_lens_enabled', isEnabled);
      updateStatusUI();
    }
  });

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!isMouseInside && isEnabled) {
      isMouseInside = true;
      cursor.style.display = 'block';
    }
  });

  document.addEventListener('mouseleave', () => {
    isMouseInside = false;
    cursor.style.display = 'none';
  });

  function renderLens() {
    if (isEnabled && isMouseInside) {
      currentX += (mouseX - currentX) * 0.25;
      currentY += (mouseY - currentY) * 0.25;

      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      const zoomLevel = 1.35;
      const originX = (mouseX / window.innerWidth) * 100;
      const originY = (mouseY / window.innerHeight) * 100;
      zoomContent.style.transformOrigin = `${originX}% ${originY}%`;
      zoomContent.style.transform = `scale(${zoomLevel})`;
    }
    requestAnimationFrame(renderLens);
  }
  requestAnimationFrame(renderLens);
  updateStatusUI();
}

/* ==========================================================================
   4. CONTACT MODAL (EXACTLY MATCHING HOME PAGE)
   ========================================================================== */
function initAboutContactModal() {
  const contactModal = document.getElementById('contactModal');
  const closeContactBtn = document.getElementById('closeContactModal');
  const shootEmailBtn = document.getElementById('shootEmailBtn');
  const contactForm = document.getElementById('contactForm');

  function openContactModal(e) {
    if (e) e.preventDefault();
    if (!contactModal) return;
    contactModal.classList.add('active');
    contactModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeContactModal() {
    if (!contactModal) return;
    contactModal.classList.remove('active');
    contactModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (shootEmailBtn) shootEmailBtn.addEventListener('click', openContactModal);
  if (closeContactBtn) closeContactBtn.addEventListener('click', closeContactModal);

  // Close on backdrop click
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        closeContactModal();
      }
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal && contactModal.classList.contains('active')) {
      closeContactModal();
    }
  });

  // Handle Contact Form Submit (Simulated Feedback)
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const sendBtn = document.getElementById('sendMessageBtn');
      const originalText = sendBtn ? sendBtn.innerHTML : 'Send Message';
      if (sendBtn) {
        sendBtn.innerHTML = '<span>Sending...</span>';
        sendBtn.disabled = true;
      }

      setTimeout(() => {
        if (sendBtn) {
          sendBtn.innerHTML = '<span>Message Sent! ✓</span>';
          sendBtn.style.backgroundColor = '#2E7D32';
        }

        setTimeout(() => {
          contactForm.reset();
          if (sendBtn) {
            sendBtn.innerHTML = originalText;
            sendBtn.disabled = false;
            sendBtn.style.backgroundColor = '';
          }
          closeContactModal();
        }, 1400);
      }, 700);
    });
  }
}

/* ==========================================================================
   5. ENTRANCE SCROLL ANIMATION (MATCHING HOME & PROJECT)
   ========================================================================== */
function initAboutScrollAnimations() {
  const connectSec = document.querySelector('#connect .section-container');
  if (connectSec) {
    connectSec.style.opacity = '0';
    connectSec.style.transform = 'translateY(22px)';
    connectSec.style.transition = 'opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)';
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    observer.observe(connectSec);
  }
}

/* ==========================================================================
   6. DATA HYDRATION FROM PORTFOLIODATA
   ========================================================================== */
function hydrateAboutPage() {
  if (!window.PortfolioData) return;
  const data = PortfolioData.get();
  if (!data) return;

  const root = document.documentElement;

  // Customization tokens
  if (data.customization) {
    const cust = data.customization;
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
    if (cust.backgrounds && cust.backgrounds.connect) {
      const connectLayer = document.getElementById('connectBgLayer');
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
      if (connectLayer) {
        if (!isColor && cBg.image) {
          connectLayer.style.backgroundImage = `url('${cBg.image}')`;
          connectLayer.style.backgroundColor = 'transparent';
        } else {
          connectLayer.style.backgroundImage = 'none';
          connectLayer.style.backgroundColor = colorVal;
        }
      }
      if (cBg.overlayOpacity !== undefined) {
        const op = (cBg.overlayOpacity > 1 ? cBg.overlayOpacity / 100 : cBg.overlayOpacity);
        root.style.setProperty('--connect-overlay-opacity', op);
      }
    }
  }

  // Profile & Connect data
  if (data.profile) {
    const p = data.profile;
    const aboutAvatars = document.querySelectorAll('.about-character-img, .connect-character-img');
    if (p.avatar) {
      aboutAvatars.forEach(img => img.src = p.avatar);
    }
  }

  if (data.connect) {
    const c = data.connect;
    const connTitle = document.querySelector('.connect-title');
    const connDesc = document.querySelector('.connect-desc');
    const resumeBtn = document.getElementById('downloadResumeBtn');

    if (connTitle && c.title) connTitle.textContent = c.title;
    if (connDesc && c.desc) connDesc.textContent = c.desc;
    if (resumeBtn && c.resumeUrl) resumeBtn.href = c.resumeUrl;

    const s = c.socials || data.profile?.social || {};
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

  // Complete About Page Hydration
  if (data.about) {
    const ab = data.about;

    // 1. Hero Story & Visual
    if (ab.hero) {
      const h = ab.hero;
      const badgeEl = document.querySelector('.about-hero-text .about-tag-badge');
      if (badgeEl && h.badge) badgeEl.textContent = h.badge;

      const titleEl = document.querySelector('.about-hero-title');
      if (titleEl && h.title) titleEl.textContent = h.title;

      const leadEl = document.querySelector('.about-hero-lead');
      if (leadEl && h.lead) leadEl.innerHTML = h.lead;

      const bioEl = document.querySelector('.about-hero-text p:nth-of-type(2)');
      if (bioEl && h.bio) bioEl.textContent = h.bio;

      const pillEl = document.querySelector('.about-floating-pill');
      if (pillEl && h.floatingPill) pillEl.textContent = h.floatingPill;

      const charImg = document.querySelector('.about-character-img');
      if (charImg && h.characterImg) charImg.src = h.characterImg;
    }

    // 2. Quick Highlights / Metrics
    if (ab.stats && Array.isArray(ab.stats)) {
      const statItems = document.querySelectorAll('.about-quick-stats .about-stat-item');
      ab.stats.forEach((st, idx) => {
        if (statItems[idx]) {
          const numEl = statItems[idx].querySelector('.about-stat-number');
          const lblEl = statItems[idx].querySelector('.about-stat-label');
          if (numEl && st.number) numEl.textContent = st.number;
          if (lblEl && st.label) lblEl.textContent = st.label;
        }
      });
    }

    // 3. Core Philosophy & Principles
    if (ab.philosophy && Array.isArray(ab.philosophy)) {
      const philCards = document.querySelectorAll('.about-philosophy-grid .about-philosophy-card');
      ab.philosophy.forEach((ph, idx) => {
        if (philCards[idx]) {
          const numEl = philCards[idx].querySelector('.about-philosophy-num');
          const titleEl = philCards[idx].querySelector('h3');
          const descEl = philCards[idx].querySelector('p');
          if (numEl && ph.num) numEl.textContent = ph.num;
          if (titleEl && ph.title) titleEl.textContent = ph.title;
          if (descEl && ph.desc) descEl.textContent = ph.desc;
        }
      });
    }

    // 4. Capabilities & Toolkit
    if (ab.skills) {
      const sk = ab.skills;
      const col1 = document.querySelector('.about-skills-layout .about-skill-col:nth-child(1)');
      if (col1) {
        if (sk.physicalTitle) {
          const h3 = col1.querySelector('h3');
          if (h3) h3.textContent = sk.physicalTitle;
        }
        if (sk.physicalList && Array.isArray(sk.physicalList)) {
          const ul = col1.querySelector('.about-skill-list');
          if (ul) {
            ul.innerHTML = sk.physicalList.map(item => `<li>${item}</li>`).join('');
          }
        }
        if (sk.physicalPills && Array.isArray(sk.physicalPills)) {
          const cluster = col1.querySelector('.about-pill-cluster');
          if (cluster) {
            cluster.innerHTML = sk.physicalPills.map(pill => `<span class="about-pill">${pill}</span>`).join('');
          }
        }
      }

      const col2 = document.querySelector('.about-skills-layout .about-skill-col:nth-child(2)');
      if (col2) {
        if (sk.digitalTitle) {
          const h3 = col2.querySelector('h3');
          if (h3) h3.textContent = sk.digitalTitle;
        }
        if (sk.digitalList && Array.isArray(sk.digitalList)) {
          const ul = col2.querySelector('.about-skill-list');
          if (ul) {
            ul.innerHTML = sk.digitalList.map(item => `<li>${item}</li>`).join('');
          }
        }
        if (sk.digitalPills && Array.isArray(sk.digitalPills)) {
          const cluster = col2.querySelector('.about-pill-cluster');
          if (cluster) {
            cluster.innerHTML = sk.digitalPills.map(pill => `<span class="about-pill">${pill}</span>`).join('');
          }
        }
      }
    }

    // 5. Background & Milestones
    if (ab.milestones && Array.isArray(ab.milestones)) {
      const wrap = document.querySelector('.about-timeline-wrap');
      if (wrap) {
        wrap.innerHTML = ab.milestones.map(m => `
          <div class="about-timeline-item">
            <div class="about-timeline-year">${m.year || 'YEAR'}</div>
            <div>
              <div class="about-timeline-role">${m.role || ''}</div>
              <div class="about-timeline-desc">${m.desc || ''}</div>
            </div>
          </div>
        `).join('');
      }
    }
  }
}
