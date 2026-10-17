/**
 * Pawan K. Kushwaha Portfolio - Unified Components Engine
 * Consolidates all shared interactive components into a single linked system:
 * 1. PortfolioComponents.Lens (Home-Lens, Project-Lens with universal optical mirroring)
 * 2. PortfolioComponents.Navbar (Sticky header scroll shadow & mobile drawer)
 * 3. PortfolioComponents.ContactModal (Contact dialog, clipboard copy, form feedback)
 * 4. PortfolioComponents.ConnectParallax (Connect section background parallax layer)
 */

(function(window, document) {
  'use strict';

  const PortfolioComponents = {
    // =========================================================================
    // 1. UNIFIED OPTICAL MAGNIFIER LENS CURSOR
    // =========================================================================
    Lens: {
      initialized: false,
      isEnabled: false,
      scale: 1.65,
      lensRadius: 35, // 70px compact glass lens
      cursor: null,
      zoomContent: null,
      toggleBtn: null,
      statusText: null,
      header: null,
      mainContent: null,
      footer: null,
      hClone: null,
      currentClientX: 0,
      currentClientY: 0,
      currentPageX: 0,
      currentPageY: 0,
      isMoving: false,
      rafPending: false,

      init() {
        if (this.initialized) return;

        // Disable on small mobile touchscreens (<= 600px)
        if (window.innerWidth <= 600) return;

        this.cursor = document.getElementById('magnifierCursor');
        this.zoomContent = document.getElementById('magnifierZoomContent');
        this.toggleBtn = document.getElementById('magnifierToggleBtn');
        this.statusText = document.getElementById('magnifierStatusText');
        this.header = document.getElementById('siteHeader');
        this.mainContent = document.querySelector('main') ||
                           document.getElementById('mainContent') ||
                           document.querySelector('.project-detail-main');
        this.footer = document.querySelector('footer');

        if (!this.cursor || !this.zoomContent) return;

        // Lens is hidden until explicitly requested to appear
        this.isEnabled = false;
        try {
          localStorage.setItem('portfolio_lens_enabled', 'false');
        } catch(e) {}

        // Apply visual and functional state
        this.applyStateUI();

        // Build live optical mirror if enabled
        if (this.isEnabled) {
          this.buildMirror();
        }

        // Event listeners
        this.bindEvents();

        this.initialized = true;

        // Expose global helpers for page scripts
        window.syncMagnifierMirror = () => this.syncMirror();
        window.updateMagnifierConfig = (cfg) => this.updateConfig(cfg);
        window.appearLens = () => {
          window.isLensRequestedToAppear = true;
          this.setLensEnabled(true);
        };
        window.hideLens = () => {
          window.isLensRequestedToAppear = false;
          this.setLensEnabled(false);
        };
      },

      syncFromDataStore() {
        if (window.PortfolioData) {
          const d = PortfolioData.get();
          if (d && d.customization && d.customization.lens) {
            const l = d.customization.lens;
            if (l.size) {
              this.lensRadius = l.size / 2;
              document.documentElement.style.setProperty('--lens-size', `${l.size}px`);
            }
            if (l.scale) this.scale = l.scale;
            // Only update enabled if localStorage hasn't recorded an explicit user choice
            const saved = localStorage.getItem('portfolio_lens_enabled');
            if (saved === null && l.enabled !== undefined) {
              this.isEnabled = Boolean(l.enabled);
            }
            if (l.showToggleBtn === false && this.toggleBtn) {
              this.toggleBtn.style.display = 'none';
            } else if (this.toggleBtn) {
              this.toggleBtn.style.display = '';
            }
          }
        }
      },

      setLensEnabled(enabled, source = 'user') {
        this.isEnabled = Boolean(enabled);
        try {
          localStorage.setItem('portfolio_lens_enabled', this.isEnabled ? 'true' : 'false');
        } catch(e) {}

        // Keep PortfolioData in sync across site
        if (source === 'user' || source === 'storage') {
          if (window.PortfolioData) {
            try {
              const d = PortfolioData.get();
              if (d && d.customization && d.customization.lens) {
                if (d.customization.lens.enabled !== this.isEnabled) {
                  d.customization.lens.enabled = this.isEnabled;
                  PortfolioData.save(d);
                }
              }
            } catch(e) {}
          }
        }

        this.applyStateUI();

        if (this.isEnabled) {
          this.buildMirror();
          this.scheduleRender();
        } else {
          this.isMoving = false;
          if (this.cursor) {
            this.cursor.classList.remove('active');
            this.cursor.classList.add('disabled');
            this.cursor.style.display = 'none';
          }
        }

        if (source !== 'broadcast') {
          window.dispatchEvent(new CustomEvent('portfolioLensToggled', { detail: { enabled: this.isEnabled } }));
        }
      },

      applyStateUI() {
        if (this.cursor) {
          if (!this.isEnabled) {
            this.cursor.classList.remove('active');
            this.cursor.classList.add('disabled');
            this.cursor.style.display = 'none';
          } else {
            this.cursor.classList.remove('disabled');
            this.cursor.style.display = '';
          }
        }

        if (this.toggleBtn) {
          if (!this.isEnabled) {
            this.toggleBtn.classList.add('off');
            this.toggleBtn.setAttribute('aria-pressed', 'false');
            if (this.statusText) this.statusText.textContent = 'OFF';
          } else {
            this.toggleBtn.classList.remove('off');
            this.toggleBtn.setAttribute('aria-pressed', 'true');
            if (this.statusText) this.statusText.textContent = 'ON';
          }
        }

        // Apply HTML root class for instant global CSS styling & cursor hiding
        if (this.isEnabled) {
          document.documentElement.classList.remove('lens-off');
          document.documentElement.classList.add('lens-active');
        } else {
          document.documentElement.classList.add('lens-off');
          document.documentElement.classList.remove('lens-active');
        }
      },

      cleanClone(node) {
        if (!node) return;
        node.removeAttribute('id');
        node.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        node.querySelectorAll('audio, video, script, iframe, .magnifier-cursor, .magnifier-toggle-btn, .modal-overlay, .lightbox-overlay').forEach(el => el.remove());
        node.querySelectorAll('a, button, input, textarea, select').forEach(el => {
          el.setAttribute('tabindex', '-1');
          el.setAttribute('aria-hidden', 'true');
        });

        // Ensure all animated cards/sections in mirror are fully visible and properly laid out
        node.querySelectorAll('*').forEach(el => {
          if (el.style) {
            if (el.style.opacity === '0') el.style.opacity = '1';
            if (el.style.transform && el.style.transform.includes('translateY')) el.style.transform = 'none';
            if (el.style.transition) el.style.transition = 'none';
            if (el.style.visibility === 'hidden') el.style.visibility = 'visible';
          }
        });

        node.setAttribute('aria-hidden', 'true');
        node.style.pointerEvents = 'none';
      },

      buildMirror() {
        if (!this.zoomContent || !this.isEnabled) return;
        this.zoomContent.innerHTML = '';

        const mirrorWrapper = document.createElement('div');
        mirrorWrapper.className = 'magnifier-mirror-wrapper';
        mirrorWrapper.style.width = document.documentElement.scrollWidth + 'px';
        mirrorWrapper.style.minHeight = document.documentElement.scrollHeight + 'px';
        mirrorWrapper.style.position = 'relative';
        mirrorWrapper.style.pointerEvents = 'none';
        mirrorWrapper.style.backgroundColor = 'var(--color-maroon, #13294A)';

        if (this.header) {
          this.hClone = this.header.cloneNode(true);
          this.cleanClone(this.hClone);
          this.hClone.style.position = 'absolute';
          this.hClone.style.top = '0px';
          this.hClone.style.left = '0px';
          this.hClone.style.width = '100%';
          this.hClone.style.zIndex = '1000';
          mirrorWrapper.appendChild(this.hClone);
        }

        if (this.mainContent) {
          const mClone = this.mainContent.cloneNode(true);
          this.cleanClone(mClone);
          mirrorWrapper.appendChild(mClone);
        }

        if (this.footer && (!this.mainContent || !this.mainContent.contains(this.footer))) {
          const fClone = this.footer.cloneNode(true);
          this.cleanClone(fClone);
          mirrorWrapper.appendChild(fClone);
        }

        this.zoomContent.appendChild(mirrorWrapper);
      },

      syncMirror() {
        if (!this.isEnabled) return;
        this.buildMirror();
      },

      updateConfig(cfg) {
        if (!cfg) return;
        if (cfg.size) {
          this.lensRadius = cfg.size / 2;
          document.documentElement.style.setProperty('--lens-size', `${cfg.size}px`);
        }
        if (cfg.scale) this.scale = cfg.scale;
        if (window.isLensRequestedToAppear) {
          if (cfg.enabled !== undefined) {
            this.setLensEnabled(cfg.enabled, 'config');
          }
          if (cfg.showToggleBtn !== undefined && this.toggleBtn) {
            this.toggleBtn.style.display = cfg.showToggleBtn ? '' : 'none';
          }
          if (this.isEnabled) {
            this.buildMirror();
            this.scheduleRender();
          }
        } else {
          this.setLensEnabled(false, 'config');
          if (this.toggleBtn) this.toggleBtn.style.display = 'none';
        }
      },

      toggle() {
        this.setLensEnabled(!this.isEnabled, 'user');
      },

      render() {
        this.rafPending = false;
        if (!this.isEnabled || !this.cursor || !this.zoomContent) return;

        // Center lens hotspot on cursor
        this.cursor.style.transform = `translate3d(${this.currentClientX - this.lensRadius}px, ${this.currentClientY - this.lensRadius}px, 0)`;

        // Keep cloned header aligned with sticky viewport
        if (this.hClone) {
          this.hClone.style.transform = `translate3d(0, ${window.scrollY}px, 0)`;
          if (this.header && this.header.classList.contains('scrolled')) {
            this.hClone.classList.add('scrolled');
          } else {
            this.hClone.classList.remove('scrolled');
          }
        }

        // Optical Zoom Formula
        const tx = this.lensRadius - (this.currentPageX * this.scale);
        const ty = this.lensRadius - (this.currentPageY * this.scale);
        this.zoomContent.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${this.scale})`;
      },

      scheduleRender() {
        if (!this.rafPending && this.isEnabled) {
          this.rafPending = true;
          requestAnimationFrame(() => this.render());
        }
      },

      bindEvents() {
        this.currentClientX = window.innerWidth / 2;
        this.currentClientY = window.innerHeight / 2;
        this.currentPageX = this.currentClientX + window.scrollX;
        this.currentPageY = this.currentClientY + window.scrollY;

        window.addEventListener('mousemove', (e) => {
          this.currentClientX = e.clientX;
          this.currentClientY = e.clientY;
          this.currentPageX = e.pageX;
          this.currentPageY = e.pageY;

          if (!this.isEnabled) return;

          if (!this.isMoving && this.cursor) {
            this.isMoving = true;
            this.cursor.classList.add('active');
          }

          this.scheduleRender();
        }, { passive: true });

        window.addEventListener('scroll', () => {
          this.currentPageX = this.currentClientX + window.scrollX;
          this.currentPageY = this.currentClientY + window.scrollY;
          if (this.isEnabled) {
            this.scheduleRender();
          }
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
          if (this.cursor) this.cursor.classList.remove('active');
          this.isMoving = false;
        });

        document.addEventListener('mouseenter', (e) => {
          if (this.isEnabled && this.cursor) {
            if (e.clientX !== undefined) {
              this.currentClientX = e.clientX;
              this.currentClientY = e.clientY;
              this.currentPageX = e.clientX + window.scrollX;
              this.currentPageY = e.clientY + window.scrollY;
            }
            this.cursor.classList.add('active');
            this.isMoving = true;
            this.scheduleRender();
          }
        });

        // Toggle button click
        if (this.toggleBtn) {
          this.toggleBtn.addEventListener('click', () => this.toggle());
        }

        // 'M' shortcut toggle
        window.addEventListener('keydown', (e) => {
          if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
          if (e.key === 'm' || e.key === 'M') {
            this.toggle();
          }
        });

        // Cross-tab & cross-page synchronization via localStorage
        window.addEventListener('storage', (e) => {
          if (e.key === 'portfolio_lens_enabled') {
            const newState = e.newValue !== 'false';
            if (this.isEnabled !== newState) {
              this.setLensEnabled(newState, 'broadcast');
            }
          }
          if (e.key === 'portfolio_master_data' || e.key === 'portfolio_custom_data') {
            try {
              const parsed = JSON.parse(e.newValue);
              if (parsed && parsed.customization && parsed.customization.lens) {
                const l = parsed.customization.lens;
                if (l.enabled !== undefined && l.enabled !== this.isEnabled) {
                  this.setLensEnabled(l.enabled, 'broadcast');
                }
                if (l.size) {
                  this.lensRadius = l.size / 2;
                  document.documentElement.style.setProperty('--lens-size', `${l.size}px`);
                }
                if (l.scale) this.scale = l.scale;
                if (l.showToggleBtn !== undefined && this.toggleBtn) {
                  this.toggleBtn.style.display = l.showToggleBtn ? '' : 'none';
                }
              }
            } catch(_) {}
          }
        });

        // Same-window custom event listener
        window.addEventListener('portfolioLensToggled', (e) => {
          if (e.detail && e.detail.enabled !== undefined && e.detail.enabled !== this.isEnabled) {
            this.setLensEnabled(e.detail.enabled, 'broadcast');
          }
        });

        window.addEventListener('load', () => {
          setTimeout(() => {
            if (this.isEnabled) this.buildMirror();
          }, 300);
        });

        window.addEventListener('resize', () => {
          if (this.isEnabled) {
            this.buildMirror();
            this.scheduleRender();
          }
        });
      }
    },

    // =========================================================================
    // 2. UNIFIED NAVBAR & MOBILE DRAWER
    // =========================================================================
    Navbar: {
      initialized: false,

      init() {
        if (this.initialized) return;
        this.initialized = true;

        const header = document.getElementById('siteHeader');
        const toggleBtn = document.getElementById('mobileMenuToggle');
        const drawer = document.getElementById('mobileDrawer');
        const mobileLinks = document.querySelectorAll('.mobile-nav-link');

        // Sticky header scroll elevation
        if (header) {
          const updateScrollState = () => {
            const scrollY = window.scrollY || window.pageYOffset || 0;
            if (scrollY > 20) {
              header.classList.add('scrolled');
              header.classList.add('header-scrolled');
            } else {
              header.classList.remove('scrolled');
              header.classList.remove('header-scrolled');
            }
          };
          window.addEventListener('scroll', updateScrollState, { passive: true });
          updateScrollState();
        }

        // Mobile drawer toggle
        if (toggleBtn && drawer && !toggleBtn.dataset.bound) {
          toggleBtn.dataset.bound = 'true';
          toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = drawer.classList.contains('open');
            if (isOpen) {
              drawer.classList.remove('open');
              toggleBtn.classList.remove('active');
              toggleBtn.setAttribute('aria-expanded', 'false');
            } else {
              drawer.classList.add('open');
              toggleBtn.classList.add('active');
              toggleBtn.setAttribute('aria-expanded', 'true');
            }
          });

          // Close on clicking any drawer navigation link
          mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
              drawer.classList.remove('open');
              toggleBtn.classList.remove('active');
              toggleBtn.setAttribute('aria-expanded', 'false');
            });
          });

          // Close on outside click
          document.addEventListener('click', (e) => {
            if (drawer.classList.contains('open') && !drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
              drawer.classList.remove('open');
              toggleBtn.classList.remove('active');
              toggleBtn.setAttribute('aria-expanded', 'false');
            }
          });

          // Close on Escape key
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && drawer.classList.contains('open')) {
              drawer.classList.remove('open');
              toggleBtn.classList.remove('active');
              toggleBtn.setAttribute('aria-expanded', 'false');
            }
          });
        }

        this.initialized = true;
      }
    },

    // =========================================================================
    // 3. UNIFIED CONTACT MODAL & FEEDBACK
    // =========================================================================
    ContactModal: {
      initialized: false,

      init() {
        if (this.initialized) return;

        const modal = document.getElementById('contactModal');
        const closeBtn = document.getElementById('closeContactModal');
        const contactForm = document.getElementById('contactForm') || document.getElementById('quickInquiryForm');
        const copyBtn = document.getElementById('copyEmailBtn');
        const copyLabel = document.getElementById('copyEmailLabel');
        const targetEmailText = document.getElementById('targetEmailText');
        const resumeBtn = document.getElementById('downloadResumeBtn');

        if (!modal) return;

        const openModal = (e) => {
          if (e) e.preventDefault();
          modal.classList.add('active');
          modal.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
          if (window.lenis) window.lenis.stop();
        };

        const closeModal = () => {
          modal.classList.remove('active');
          modal.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
          if (window.lenis) window.lenis.start();
        };

        this.open = openModal;
        this.close = closeModal;

        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
          }
        });

        // Email copy to clipboard
        if (copyBtn && targetEmailText && copyLabel) {
          copyBtn.addEventListener('click', () => {
            const email = targetEmailText.textContent.trim();
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(email).then(() => {
                copyLabel.textContent = 'Copied!';
                setTimeout(() => { copyLabel.textContent = 'Copy'; }, 2000);
              }).catch(() => {
                copyLabel.textContent = 'Copied!';
              });
            } else {
              copyLabel.textContent = 'Copied!';
              setTimeout(() => { copyLabel.textContent = 'Copy'; }, 2000);
            }
          });
        }

        // Contact form feedback
        if (contactForm) {
          contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const sendBtn = document.getElementById('sendMessageBtn') || contactForm.querySelector('button[type="submit"]');
            const originalHTML = sendBtn ? sendBtn.innerHTML : 'Send Message';

            if (sendBtn) {
              sendBtn.innerHTML = `<span>Message Sent Successfully! &check;</span>`;
              sendBtn.style.backgroundColor = '#1DB954';
              sendBtn.disabled = true;
            }

            setTimeout(() => {
              contactForm.reset();
              if (sendBtn) {
                sendBtn.innerHTML = originalHTML;
                sendBtn.style.backgroundColor = '';
                sendBtn.disabled = false;
              }
              closeModal();
            }, 1500);
          });
        }

        // Resume download simulation
        if (resumeBtn) {
          resumeBtn.addEventListener('click', (e) => {
            const href = resumeBtn.getAttribute('href');
            if (!href || href === '#resume' || href.startsWith('mailto:')) {
              e.preventDefault();
              alert('Opening Pawan K. Kushwaha - Product Design Resume (PDF)...');
            }
          });
        }

        this.initialized = true;
      }
    },

    // =========================================================================
    // 4. UNIFIED CONNECT PARALLAX ENGINE (Parallax Removed)
    // =========================================================================
    ConnectParallax: {
      initialized: false,
      init() {
        const layer = document.getElementById('connectBgLayer');
        if (layer) layer.style.transform = 'none';
        this.initialized = true;
      }
    },

    // =========================================================================
    // 5. UNIFIED DEVICE RESTRICTION ENGINE (Smartphones & Mobile Desktop Mode)
    // Directs smartphone visitors to open the portfolio on Laptops, Desktops, or Tablets
    // =========================================================================
    DeviceRestriction: {
      initialized: false,

      isPhoneDevice() {
        try {
          var ua = (navigator.userAgent || '').toLowerCase();
          var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
          var screenW = window.screen ? (window.screen.width || 0) : 0;
          var screenH = window.screen ? (window.screen.height || 0) : 0;
          var screenMin = (screenW > 0 && screenH > 0) ? Math.min(screenW, screenH) : 0;
          var innerW = window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 0;
          var innerH = window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 0;
          var viewMin = (innerW > 0 && innerH > 0) ? Math.min(innerW, innerH) : 0;

          // iPad / iPadOS (reports as Macintosh with touch, or contains ipad)
          var isIPad = (/macintosh/i.test(ua) && isTouch && screenMin >= 600) || /ipad/i.test(ua);
          if (isIPad) return false;

          // Tablets / Touch Laptops (screenMin >= 600 and not standard mobile phone UA)
          var isMobileUa = /iphone|ipod|blackberry|iemobile|opera mini|windows phone/i.test(ua) || 
                           (/android/i.test(ua) && /mobile/i.test(ua));
          if (isTouch && screenMin >= 600 && !isMobileUa) {
            return false;
          }

          // 1. Mobile phone in regular mode
          if (isMobileUa) return true;

          // 2. Mobile phone in "Desktop Mode" (Touch enabled + screen physical short edge < 560px)
          if (isTouch && screenMin > 0 && screenMin < 560) return true;

          // 3. Landscape mobile phones (Touch enabled or orientation landscape with short dimension <= 480px)
          if (viewMin > 0 && viewMin <= 480 && (isTouch || innerW > innerH)) return true;

          // 4. Mobile screen sizes (Inspect responsive or narrow viewport < 768px)
          if (innerW > 0 && innerW < 768) return true;

          return false;
        } catch(e) {
          return false;
        }
      },

      ensureScreenDOM() {
        var prefix = (window.location.pathname.indexOf('/projects/') !== -1) ? 
          (window.location.pathname.indexOf('/research/') !== -1 ? '../../../' : '../../') : '';
        var config = (typeof PortfolioData !== 'undefined' && PortfolioData.getMobileRestrictionConfig) 
          ? PortfolioData.getMobileRestrictionConfig()
          : ((typeof PortfolioData !== 'undefined' && PortfolioData.get) ? (PortfolioData.get()?.customization?.mobileRestriction || {}) : {});
        
        var rawImage = config.image || 'assets/images/restriction_character.png';
        var imageSrc = rawImage;
        if (imageSrc.startsWith('idb://') && window.PortfolioMediaDB) {
          imageSrc = window.PortfolioMediaDB.resolveUrlSync(imageSrc) || imageSrc;
        } else if (!imageSrc.startsWith('data:') && !imageSrc.startsWith('http://') && !imageSrc.startsWith('https://') && !imageSrc.startsWith('/')) {
          imageSrc = prefix + imageSrc;
        }

        var el = document.getElementById('deviceRestrictionScreen');
        if (el) {
          var charImg = el.querySelector('#restrictionCharacterImg');
          if (charImg && charImg.getAttribute('data-raw-src') !== rawImage) {
            charImg.src = imageSrc;
            charImg.setAttribute('data-raw-src', rawImage);
          }
          return;
        }

        el = document.createElement('div');
        el.id = 'deviceRestrictionScreen';
        el.className = 'device-restriction-screen';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.setAttribute('aria-labelledby', 'restrictionTitle');
        el.innerHTML = `
          <div class="restriction-card">
            <div class="restriction-brand">
              <img src="${prefix}assets/images/restriction_logo.png" alt="Pawan Product Designer" class="restriction-brand-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div style="display:none; flex-direction:column; align-items:center;">
                <span class="logo-script restriction-brand-logo">Pawan.</span>
                <div class="restriction-role">PRODUCT DESIGNER</div>
              </div>
            </div>

            <div class="restriction-illustration" aria-hidden="true">
              <img src="${imageSrc}" data-raw-src="${rawImage}" alt="Pawan working at design desk illustration" class="restriction-character-img" id="restrictionCharacterImg" onerror="this.onerror=null; this.src='${prefix}assets/images/hero_character.png';">
            </div>

            <div class="restriction-title-wrap">
              <img src="${prefix}assets/images/restriction_arrow.png" alt="" class="restriction-arrow-img" aria-hidden="true" onerror="this.style.display='none';">
              <h1 id="restrictionTitle" class="restriction-title">
                Best viewed on a<br>larger screen<span class="title-dot">.</span>
              </h1>
            </div>

            <p class="restriction-desc">
              For the full interactive portfolio,<br>open this link on a desktop or tablet.
            </p>

            <div class="restriction-action-box">
              <button type="button" id="copyPortfolioLinkBtn" class="btn-copy-portfolio" aria-label="Copy portfolio link to clipboard">
                <span class="btn-copy-icon">
                  <svg viewBox="0 0 24 24" fill="none" class="copy-svg" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="4" width="12" height="15" rx="2.5" stroke="currentColor" stroke-width="2.2"/>
                    <path d="M4 8.5V18C4 19.3807 5.11929 20.5 6.5 20.5H15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                  </svg>
                </span>
                <span id="copyPortfolioLinkText">Copy portfolio link</span>
              </button>
            </div>

            <div class="restriction-contact-hint">
              <span>Need to connect directly?</span>
              <a href="mailto:pawankushwaha1@gmail.com" class="restriction-email-link">pawankushwaha1@gmail.com &rarr;</a>
            </div>
          </div>
        `;
        document.body.appendChild(el);
      },

      bindEvents() {
        var copyBtn = document.getElementById('copyPortfolioLinkBtn');
        var copyText = document.getElementById('copyPortfolioLinkText');
        if (copyBtn && !copyBtn._hasBind) {
          copyBtn._hasBind = true;
          copyBtn.addEventListener('click', function() {
            var cleanUrl = window.location.href;
            var performSuccess = function() {
              if (copyText) copyText.textContent = '✓ Link Copied to Clipboard!';
              copyBtn.classList.add('copied');
              if (navigator.vibrate) { try { navigator.vibrate(50); } catch(e) {} }
              setTimeout(function() {
                if (copyText) copyText.textContent = 'Copy portfolio link';
                copyBtn.classList.remove('copied');
              }, 3000);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(cleanUrl).then(performSuccess).catch(function() {
                var tempInput = document.createElement('input');
                tempInput.value = cleanUrl;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                performSuccess();
              });
            } else {
              var tempInput = document.createElement('input');
              tempInput.value = cleanUrl;
              document.body.appendChild(tempInput);
              tempInput.select();
              document.execCommand('copy');
              document.body.removeChild(tempInput);
              performSuccess();
            }
          });
        }
      },

      isEnabled() {
        try {
          if (typeof PortfolioData !== 'undefined' && PortfolioData.isMobileRestrictionEnabled) {
            return PortfolioData.isMobileRestrictionEnabled();
          }
          if (typeof PortfolioData !== 'undefined' && PortfolioData.get) {
            var data = PortfolioData.get();
            if (data && data.customization && data.customization.mobileRestriction) {
              return data.customization.mobileRestriction.enabled !== false;
            }
          }
          var raw = localStorage.getItem('portfolio_custom_data');
          if (raw) {
            var p = JSON.parse(raw);
            if (p && p.customization && p.customization.mobileRestriction) {
              return p.customization.mobileRestriction.enabled !== false;
            }
          }
        } catch(e) {}
        return true;
      },

      update() {
        var isRestrictionOn = this.isEnabled();
        var root = document.documentElement;

        if (!isRestrictionOn) {
          // Restriction turned OFF: Website is allowed directly on mobile
          root.classList.remove('device-restricted');
          root.classList.add('mobile-allowed');
          var screenEl = document.getElementById('deviceRestrictionScreen');
          if (screenEl) {
            screenEl.style.display = 'none';
          }
          return;
        }

        // Restriction turned ON:
        root.classList.remove('mobile-allowed');
        var shouldRestrict = this.isPhoneDevice();
        if (shouldRestrict) {
          root.classList.add('device-restricted');
          this.ensureScreenDOM();
          var screenEl = document.getElementById('deviceRestrictionScreen');
          if (screenEl) {
            screenEl.style.display = '';
          }
          this.bindEvents();
        } else {
          root.classList.remove('device-restricted');
          var screenEl = document.getElementById('deviceRestrictionScreen');
          if (screenEl) {
            screenEl.style.display = 'none';
          }
        }
      },

      init() {
        this.update();
        var self = this;
        var resizeTimer = null;
        window.addEventListener('resize', function() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function() {
            self.update();
          }, 100);
        });
        window.addEventListener('orientationchange', function() {
          setTimeout(function() {
            self.update();
          }, 120);
        });
        window.addEventListener('portfolio-data-updated', function() {
          self.update();
        });
        window.addEventListener('portfolioDataUpdated', function() {
          self.update();
        });
        window.addEventListener('storage', function(e) {
          if (e.key === 'portfolio_custom_data') {
            self.update();
          }
        });
        this.initialized = true;
      }
    },

    // Initialize all shared components
    initAll() {
      this.DeviceRestriction.init();
      this.Navbar.init();
      this.Lens.init();
      this.ContactModal.init();
      this.ConnectParallax.init();
    }
  };

  // Auto-init on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PortfolioComponents.initAll());
  } else {
    PortfolioComponents.initAll();
  }

  window.PortfolioComponents = PortfolioComponents;

})(window, document);
