/**
 * Pawan K. Kushwaha Portfolio - Admin Control Center Engine
 * Handles authentication, dynamic CRUD updates across all sections,
 * live localStorage persistence, and JSON backup/restore.
 */

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initTabs();
  initProfileManager();
  initAboutManager();
  initCustomizationManager();
  initProjectsManager();
  initPrototypingManager();
  initGalleryManager();
  initConnectManager();
  initSecurityManager();
  initBackupManager();
  initModalCloseHandlers();
});

/* ==========================================================================
   1. AUTHENTICATION & LOGIN GATE
   ========================================================================== */
function initAuth() {
  const authOverlay = document.getElementById('authOverlay');
  const adminApp = document.getElementById('adminApp');
  const authForm = document.getElementById('authForm');
  const passInput = document.getElementById('authPasswordInput');
  const errorMsg = document.getElementById('authErrorMsg');
  const btnLogout = document.getElementById('btnLogout');

  // Check existing session
  if (window.PortfolioData && PortfolioData.auth.isAuthenticated()) {
    authOverlay.classList.add('hidden');
    adminApp.classList.remove('hidden');
    refreshAllPanels();
  } else {
    authOverlay.classList.remove('hidden');
    adminApp.classList.add('hidden');
  }

  // Handle unlock submission
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = passInput.value.trim();
      errorMsg.classList.remove('visible');

      const isValid = await PortfolioData.auth.verifyPassword(password);
      if (isValid) {
        authOverlay.classList.add('hidden');
        adminApp.classList.remove('hidden');
        passInput.value = '';
        refreshAllPanels();
        showToast('Welcome to Owner Control Center!', 'success');
      } else {
        errorMsg.classList.add('visible');
        passInput.classList.add('shake');
        setTimeout(() => passInput.classList.remove('shake'), 500);
        passInput.focus();
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
      showToast('Logged out successfully.', 'success');
    });
  }
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

  // Quick action jumps
  const btnQuickAdd = document.getElementById('btnQuickAddProject');
  const btnQuickProfile = document.getElementById('btnQuickProfile');
  const btnQuickAbout = document.getElementById('btnQuickAbout');
  const btnQuickExport = document.getElementById('btnQuickExport');

  if (btnQuickAdd) {
    btnQuickAdd.addEventListener('click', () => {
      window.switchTab('projects');
      document.getElementById('btnOpenNewProjectModal').click();
    });
  }

  if (btnQuickAbout) {
    btnQuickAbout.addEventListener('click', () => {
      window.switchTab('about');
    });
  }

  if (btnQuickProfile) {
    btnQuickProfile.addEventListener('click', () => {
      window.switchTab('profile');
    });
  }

  if (btnQuickExport) {
    btnQuickExport.addEventListener('click', () => {
      PortfolioData.exportJSON();
      showToast('Backup JSON downloaded successfully!', 'success');
    });
  }

  const btnQuickCustomization = document.getElementById('btnQuickCustomization');
  if (btnQuickCustomization) {
    btnQuickCustomization.addEventListener('click', () => {
      window.switchTab('customization');
    });
  }
}

function refreshAllPanels() {
  updateDashboardStats();
  loadProfileData();
  loadAboutData();
  loadCustomizationData();
  renderProjectsTable();
  renderPrototypingGrid();
  renderGalleryGrid();
  loadConnectData();
}

function updateDashboardStats() {
  const data = PortfolioData.get();
  
  const statProj = document.getElementById('statProjects');
  const statProto = document.getElementById('statPrototypes');
  const statGallery = document.getElementById('statGallery');
  const statMilestones = document.getElementById('statMilestones');
  const sideProj = document.getElementById('sidebarProjectCount');
  const sideProto = document.getElementById('sidebarProtoCount');
  const sideGallery = document.getElementById('sidebarGalleryCount');
  const sideAbout = document.getElementById('sidebarAboutCount');

  if (statProj) statProj.textContent = (data.projects || []).length;
  if (sideProj) sideProj.textContent = (data.projects || []).length;
  if (statProto) statProto.textContent = (data.prototypes || []).length;
  if (sideProto) sideProto.textContent = (data.prototypes || []).length;
  if (statGallery) statGallery.textContent = (data.gallery || []).length;
  if (sideGallery) sideGallery.textContent = (data.gallery || []).length;
  
  const milestoneCount = (data.about?.milestones || []).length;
  if (statMilestones) statMilestones.textContent = milestoneCount;
  if (sideAbout) sideAbout.textContent = milestoneCount;
}

/* ==========================================================================
   3. PROFILE & HERO SECTION MANAGER
   ========================================================================== */
function initProfileManager() {
  const avatarInput = document.getElementById('profAvatar');
  const avatarPreview = document.getElementById('profAvatarPreview');
  const btnSave = document.getElementById('btnSaveProfile');

  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener('input', () => {
      avatarPreview.src = avatarInput.value || 'assets/images/connect_character.png';
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const data = PortfolioData.get();

      data.profile = {
        ...data.profile,
        name: document.getElementById('profName').value.trim(),
        role: document.getElementById('profRole').value.trim(),
        titleLine1: document.getElementById('profTitleLine1').value.trim(),
        titleLine2: document.getElementById('profTitleLine2').value.trim(),
        tagline: document.getElementById('profTagline').value.trim(),
        location: document.getElementById('profLocation').value.trim(),
        statusText: document.getElementById('profStatusText').value.trim(),
        statusType: document.getElementById('profStatusType').value,
        avatar: document.getElementById('profAvatar').value.trim(),
        music: {
          caption: document.getElementById('profMusicCaption').value.trim(),
          trackName: document.getElementById('profMusicTrack').value.trim(),
          audioSrc: document.getElementById('profMusicSrc').value.trim()
        }
      };

      PortfolioData.save(data);
      showToast('Profile & Hero settings saved successfully!', 'success');
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

  setVal('profName', p.name);
  setVal('profRole', p.role);
  setVal('profTitleLine1', p.titleLine1);
  setVal('profTitleLine2', p.titleLine2);
  setVal('profTagline', p.tagline);
  setVal('profLocation', p.location);
  setVal('profStatusText', p.statusText);
  setVal('profStatusType', p.statusType || 'gold');
  setVal('profAvatar', p.avatar);
  setVal('profMusicCaption', m.caption);
  setVal('profMusicTrack', m.trackName);
  setVal('profMusicSrc', m.audioSrc);

  const preview = document.getElementById('profAvatarPreview');
  if (preview && p.avatar) preview.src = p.avatar;
}

/* ==========================================================================
   3.5. ABOUT PAGE MANAGER
   ========================================================================== */
function initAboutManager() {
  const heroImgInput = document.getElementById('aboutHeroImg');
  const heroImgPreview = document.getElementById('aboutHeroImgPreview');
  const heroImgUpload = document.getElementById('fileAboutHeroUpload');
  const btnSaveAbout = document.getElementById('btnSaveAbout');
  const btnAddMilestone = document.getElementById('btnOpenNewMilestoneModal');
  const btnSaveMilestone = document.getElementById('btnSaveMilestoneRecord');

  if (heroImgInput && heroImgPreview) {
    heroImgInput.addEventListener('input', () => {
      heroImgPreview.src = heroImgInput.value || 'assets/images/connect_character.png';
    });
  }

  if (heroImgUpload && heroImgInput && heroImgPreview) {
    heroImgUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        heroImgInput.value = dataUrl;
        heroImgPreview.src = dataUrl;
        showToast('About portrait image uploaded!', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnSaveAbout) {
    btnSaveAbout.addEventListener('click', saveAboutData);
  }

  if (btnAddMilestone) {
    btnAddMilestone.addEventListener('click', () => {
      openMilestoneModal();
    });
  }

  if (btnSaveMilestone) {
    btnSaveMilestone.addEventListener('click', saveMilestoneRecord);
  }
}

function loadAboutData() {
  const data = PortfolioData.get();
  const ab = data.about || {};
  const hero = ab.hero || {};
  const stats = ab.stats || [];
  const phil = ab.philosophy || [];
  const skills = ab.skills || {};

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  // 1. Hero Story
  setVal('aboutHeroBadge', hero.badge);
  setVal('aboutHeroTitle', hero.title);
  setVal('aboutHeroLead', hero.lead);
  setVal('aboutHeroBio', hero.bio);
  setVal('aboutHeroPill', hero.floatingPill);
  setVal('aboutHeroImg', hero.characterImg);
  const preview = document.getElementById('aboutHeroImgPreview');
  if (preview && hero.characterImg) preview.src = hero.characterImg;

  // 2. Stats
  setVal('aboutStatNum1', stats[0]?.number);
  setVal('aboutStatLabel1', stats[0]?.label);
  setVal('aboutStatNum2', stats[1]?.number);
  setVal('aboutStatLabel2', stats[1]?.label);
  setVal('aboutStatNum3', stats[2]?.number);
  setVal('aboutStatLabel3', stats[2]?.label);
  setVal('aboutStatNum4', stats[3]?.number);
  setVal('aboutStatLabel4', stats[3]?.label);

  // 3. Philosophy
  setVal('aboutPhilNum1', phil[0]?.num);
  setVal('aboutPhilTitle1', phil[0]?.title);
  setVal('aboutPhilDesc1', phil[0]?.desc);
  setVal('aboutPhilNum2', phil[1]?.num);
  setVal('aboutPhilTitle2', phil[1]?.title);
  setVal('aboutPhilDesc2', phil[1]?.desc);
  setVal('aboutPhilNum3', phil[2]?.num);
  setVal('aboutPhilTitle3', phil[2]?.title);
  setVal('aboutPhilDesc3', phil[2]?.desc);

  // 4. Skills
  setVal('aboutSkillsPhysicalTitle', skills.physicalTitle || '⚙️ Physical & Industrial Design');
  setVal('aboutSkillsPhysicalList', (skills.physicalList || []).join('\n'));
  setVal('aboutSkillsPhysicalPills', (skills.physicalPills || []).join(', '));
  setVal('aboutSkillsDigitalTitle', skills.digitalTitle || '✨ Digital, UX & Visual Crafts');
  setVal('aboutSkillsDigitalList', (skills.digitalList || []).join('\n'));
  setVal('aboutSkillsDigitalPills', (skills.digitalPills || []).join(', '));

  // 5. Milestones
  renderMilestonesList();
}

function saveAboutData() {
  const data = PortfolioData.get();
  data.about = data.about || {};

  const getVal = (id) => document.getElementById(id)?.value.trim() || '';

  const parseLines = (text) => text.split('\n').map(s => s.trim()).filter(Boolean);
  const parsePills = (text) => text.split(',').map(s => s.trim()).filter(Boolean);

  data.about.hero = {
    badge: getVal('aboutHeroBadge') || 'PRODUCT DESIGN • PROTOTYPING • HUMAN-CENTERED',
    title: getVal('aboutHeroTitle') || 'TURNING TANGIBLE IDEAS INTO PURPOSEFUL PRODUCTS.',
    lead: getVal('aboutHeroLead'),
    bio: getVal('aboutHeroBio'),
    floatingPill: getVal('aboutHeroPill') || 'Design. Make. Explore.',
    characterImg: getVal('aboutHeroImg') || 'assets/images/connect_character.png'
  };

  data.about.stats = [
    { number: getVal('aboutStatNum1') || '4+', label: getVal('aboutStatLabel1') || 'Years of Design & Fabrication' },
    { number: getVal('aboutStatNum2') || '15+', label: getVal('aboutStatLabel2') || 'Working Functional Prototypes' },
    { number: getVal('aboutStatNum3') || '10+', label: getVal('aboutStatLabel3') || 'Screenprint & Fine Art Editions' },
    { number: getVal('aboutStatNum4') || '100%', label: getVal('aboutStatLabel4') || 'Hands-On Curiosity & Detail' }
  ];

  data.about.philosophy = [
    { num: getVal('aboutPhilNum1') || '01 / TANGIBLE FIRST', title: getVal('aboutPhilTitle1') || 'Making to Understand', desc: getVal('aboutPhilDesc1') },
    { num: getVal('aboutPhilNum2') || '02 / PRODUCTION INTEGRITY', title: getVal('aboutPhilTitle2') || 'Design for Manufacturing (DFM)', desc: getVal('aboutPhilDesc2') },
    { num: getVal('aboutPhilNum3') || '03 / HARMONIOUS SYSTEMS', title: getVal('aboutPhilTitle3') || 'Cohesive Digital Ecosystems', desc: getVal('aboutPhilDesc3') }
  ];

  data.about.skills = {
    physicalTitle: getVal('aboutSkillsPhysicalTitle') || '⚙️ Physical & Industrial Design',
    physicalList: parseLines(document.getElementById('aboutSkillsPhysicalList')?.value || ''),
    physicalPills: parsePills(document.getElementById('aboutSkillsPhysicalPills')?.value || ''),
    digitalTitle: getVal('aboutSkillsDigitalTitle') || '✨ Digital, UX & Visual Crafts',
    digitalList: parseLines(document.getElementById('aboutSkillsDigitalList')?.value || ''),
    digitalPills: parsePills(document.getElementById('aboutSkillsDigitalPills')?.value || '')
  };

  PortfolioData.save(data);
  updateDashboardStats();
  showToast('About page settings saved successfully! 💾', 'success');
}

function renderMilestonesList() {
  const container = document.getElementById('milestonesAdminList');
  if (!container) return;

  const data = PortfolioData.get();
  const milestones = data.about?.milestones || [];
  container.innerHTML = '';

  if (milestones.length === 0) {
    container.innerHTML = '<div class="dynamic-images-empty">No milestones added yet. Click "+ Add Milestone" above to add career milestones.</div>';
    return;
  }

  milestones.forEach((m, idx) => {
    const isFirst = (idx === 0);
    const isLast = (idx === milestones.length - 1);
    const item = document.createElement('div');
    item.className = 'milestone-admin-item';
    item.innerHTML = `
      <div class="milestone-order-col">
        <button type="button" class="btn-reorder" onclick="moveMilestone(${idx}, 'up')" ${isFirst ? 'disabled' : ''} title="Move Up">▲</button>
        <button type="button" class="btn-reorder" onclick="moveMilestone(${idx}, 'down')" ${isLast ? 'disabled' : ''} title="Move Down">▼</button>
      </div>
      <div class="milestone-body">
        <span class="milestone-year-badge">${m.year || 'YEAR'}</span>
        <h4 class="milestone-role-title">${m.role || 'Milestone Title'}</h4>
        <p class="milestone-desc-text">${m.desc || ''}</p>
      </div>
      <div class="milestone-actions">
        <button type="button" class="btn-outline-admin" style="padding: 6px 12px; font-size: 12.5px;" onclick="editMilestone('${m.id}')">Edit ✏️</button>
        <button type="button" class="btn-danger" style="padding: 6px 12px; font-size: 12.5px;" onclick="deleteMilestone('${m.id}')">Delete 🗑️</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function openMilestoneModal(milestoneToEdit = null) {
  const modal = document.getElementById('modalMilestone');
  const heading = document.getElementById('modalMilestoneHeading');
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  if (milestoneToEdit) {
    heading.textContent = 'Edit Career Milestone';
    setVal('editMilestoneId', milestoneToEdit.id);
    setVal('fieldMilestoneYear', milestoneToEdit.year);
    setVal('fieldMilestoneRole', milestoneToEdit.role);
    setVal('fieldMilestoneDesc', milestoneToEdit.desc);
  } else {
    heading.textContent = 'Add Career Milestone';
    setVal('editMilestoneId', '');
    setVal('fieldMilestoneYear', '2025 — PRESENT');
    setVal('fieldMilestoneRole', '');
    setVal('fieldMilestoneDesc', '');
  }

  if (modal) modal.classList.add('active');
}

function saveMilestoneRecord() {
  const editId = document.getElementById('editMilestoneId').value.trim();
  const year = document.getElementById('fieldMilestoneYear').value.trim();
  const role = document.getElementById('fieldMilestoneRole').value.trim();
  const desc = document.getElementById('fieldMilestoneDesc').value.trim();

  if (!year || !role) {
    alert('Please enter both Year and Role/Title for this milestone.');
    return;
  }

  const data = PortfolioData.get();
  data.about = data.about || {};
  data.about.milestones = data.about.milestones || [];

  if (editId) {
    const idx = data.about.milestones.findIndex(m => m.id === editId);
    if (idx !== -1) {
      data.about.milestones[idx] = { id: editId, year, role, desc };
    }
  } else {
    const newId = 'm_' + Date.now();
    data.about.milestones.push({ id: newId, year, role, desc });
  }

  PortfolioData.save(data);
  document.getElementById('modalMilestone')?.classList.remove('active');
  renderMilestonesList();
  updateDashboardStats();
  showToast('Milestone saved successfully!', 'success');
}

window.editMilestone = function(id) {
  const data = PortfolioData.get();
  const m = (data.about?.milestones || []).find(item => item.id === id);
  if (m) openMilestoneModal(m);
};

window.deleteMilestone = function(id) {
  if (!confirm('Are you sure you want to delete this career milestone?')) return;
  const data = PortfolioData.get();
  if (data.about?.milestones) {
    data.about.milestones = data.about.milestones.filter(m => m.id !== id);
    PortfolioData.save(data);
    renderMilestonesList();
    updateDashboardStats();
    showToast('Milestone deleted.', 'success');
  }
};

window.moveMilestone = function(index, dir) {
  const data = PortfolioData.get();
  const list = data.about?.milestones;
  if (!list || list.length < 2) return;

  const targetIdx = dir === 'up' ? index - 1 : index + 1;
  if (targetIdx < 0 || targetIdx >= list.length) return;

  const temp = list[index];
  list[index] = list[targetIdx];
  list[targetIdx] = temp;

  PortfolioData.save(data);
  renderMilestonesList();
  showToast('Milestone order updated!', 'success');
};

/* ==========================================================================
   4. SELECTED WORK & PROJECTS MANAGER
   ========================================================================== */
function initProjectsManager() {
  const btnOpenModal = document.getElementById('btnOpenNewProjectModal');
  const filterSelect = document.getElementById('projectCategoryFilter');
  const btnSaveProject = document.getElementById('btnSaveProjectRecord');
  const thumbInput = document.getElementById('fieldProjImage');
  const thumbPreview = document.getElementById('fieldProjThumbPreview');
  const thumbFileUpload = document.getElementById('fileProjThumbUpload');

  if (thumbInput && thumbPreview) {
    thumbInput.addEventListener('input', () => {
      thumbPreview.src = thumbInput.value || 'assets/images/work_luma.jpg';
    });
  }

  // Card thumbnail file upload
  if (thumbFileUpload && thumbInput && thumbPreview) {
    thumbFileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        thumbInput.value = dataUrl;
        thumbPreview.src = dataUrl;
        showToast('Card thumbnail image uploaded!', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  // Add Overview Image button
  const btnAddOverview = document.getElementById('btnAddOverviewImg');
  if (btnAddOverview) {
    btnAddOverview.addEventListener('click', () => {
      addDynamicImageCard('overviewImagesContainer', '', '', 'assets/images/work_luma.jpg', 'Overview');
      const container = document.getElementById('overviewImagesContainer');
      const inputs = container?.querySelectorAll('.dynamic-img-url');
      if (inputs && inputs.length > 0) {
        inputs[inputs.length - 1].focus();
      }
    });
  }

  // Add Process Image button
  const btnAddProcess = document.getElementById('btnAddProcessImg');
  if (btnAddProcess) {
    btnAddProcess.addEventListener('click', () => {
      addDynamicImageCard('processImagesContainer', '', '', 'assets/images/proto_cad.jpg', 'Process');
      const container = document.getElementById('processImagesContainer');
      const inputs = container?.querySelectorAll('.dynamic-img-url');
      if (inputs && inputs.length > 0) {
        inputs[inputs.length - 1].focus();
      }
    });
  }

  const searchInput = document.getElementById('projectSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', renderProjectsTable);
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', renderProjectsTable);
  }

  if (btnOpenModal) {
    btnOpenModal.addEventListener('click', () => {
      openProjectModal(); // Open empty modal for creation
    });
  }

  if (btnSaveProject) {
    btnSaveProject.addEventListener('click', saveProjectRecord);
  }
}

// Dynamic multi-image card builder for Overview & Process galleries
function addDynamicImageCard(containerId, src = '', alt = '', defaultPlaceholder = 'assets/images/work_luma.jpg', labelPrefix = 'Image') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const emptyNotice = container.querySelector('.dynamic-images-empty');
  if (emptyNotice) emptyNotice.remove();

  const card = document.createElement('div');
  card.className = 'dynamic-img-card';

  const currentSrc = src || '';
  const currentAlt = alt || '';
  const displaySrc = currentSrc || defaultPlaceholder;

  card.innerHTML = `
    <div class="dynamic-img-thumb-wrap">
      <img src="${displaySrc}" alt="Preview" class="dynamic-img-preview" onerror="this.src='${defaultPlaceholder}'">
    </div>
    <div class="dynamic-img-content">
      <div class="dynamic-img-url-row">
        <input type="text" class="form-input form-input-sm dynamic-img-url" placeholder="Image URL / file path (e.g. assets/images/...)" value="${currentSrc}">
        <label class="btn-sm-upload" title="Upload local image">
          📁 Upload
          <input type="file" accept="image/*" class="dynamic-img-file-input" style="display:none;">
        </label>
        <button type="button" class="btn-remove-img" title="Remove image">&times;</button>
      </div>
      <input type="text" class="form-input form-input-sm dynamic-img-alt" placeholder="Alt text / caption (e.g. ${labelPrefix} Angle Detail)" value="${currentAlt}">
    </div>
  `;

  const imgEl = card.querySelector('.dynamic-img-preview');
  const urlInput = card.querySelector('.dynamic-img-url');
  const fileInput = card.querySelector('.dynamic-img-file-input');
  const removeBtn = card.querySelector('.btn-remove-img');

  urlInput.addEventListener('input', () => {
    imgEl.src = urlInput.value.trim() || defaultPlaceholder;
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      urlInput.value = dataUrl;
      imgEl.src = dataUrl;
      showToast(`${labelPrefix} image uploaded successfully!`, 'success');
    };
    reader.readAsDataURL(file);
  });

  removeBtn.addEventListener('click', () => {
    card.remove();
    updateDynamicImageCounters();
  });

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
    overviewBadge.textContent = cards.length === 1 ? '1 Image' : `${cards.length} Images`;
    if (cards.length === 0 && !overviewContainer.querySelector('.dynamic-images-empty')) {
      overviewContainer.innerHTML = '<div class="dynamic-images-empty">No overview images added yet. Click "+ Add Overview Image" to add images.</div>';
    }
  }

  if (processContainer && processBadge) {
    const cards = processContainer.querySelectorAll('.dynamic-img-card');
    processBadge.textContent = cards.length === 1 ? '1 Image' : `${cards.length} Images`;
    if (cards.length === 0 && !processContainer.querySelector('.dynamic-images-empty')) {
      processContainer.innerHTML = '<div class="dynamic-images-empty">No process images added yet. Click "+ Add Process Image" to add images.</div>';
    }
  }
}

function getImagesFromContainer(containerId, fallbackTitle = 'Project', defaultType = 'Image') {
  const container = document.getElementById(containerId);
  if (!container) return [];
  const cards = container.querySelectorAll('.dynamic-img-card');
  const result = [];

  cards.forEach((card, idx) => {
    const url = card.querySelector('.dynamic-img-url')?.value.trim();
    let alt = card.querySelector('.dynamic-img-alt')?.value.trim();
    if (url) {
      if (!alt) {
        alt = `${fallbackTitle} ${defaultType} ${idx + 1}`;
      }
      result.push({ src: url, alt: alt });
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
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--color-text-muted);">No projects found matching your criteria.</td></tr>`;
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
        <img src="${p.image || 'assets/images/work_luma.jpg'}" alt="${p.shortTitle}" class="table-thumb" onerror="this.src='assets/images/work_luma.jpg'">
      </td>
      <td>
        <div class="table-title">${p.title || p.shortTitle}</div>
        <div style="font-size: 12px; color: var(--color-text-muted);">Slug: <code>${p.id}</code></div>
      </td>
      <td>
        <span class="table-category-pill ${p.category}">${p.category.toUpperCase()}</span>
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

function openProjectModal(projectToEdit = null) {
  const modal = document.getElementById('modalProject');
  const heading = document.getElementById('modalProjectHeading');
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  if (projectToEdit) {
    heading.textContent = `Edit Project: ${projectToEdit.shortTitle || projectToEdit.title}`;
    setVal('editProjectId', projectToEdit.id);
    setVal('fieldProjSlug', projectToEdit.id);
    document.getElementById('fieldProjSlug').readOnly = true; // Slug immutable during edit
    setVal('fieldProjCategory', projectToEdit.category || 'product');
    setVal('fieldProjShortTitle', projectToEdit.shortTitle || '');
    setVal('fieldProjTitle', projectToEdit.title || '');
    setVal('fieldProjTag', projectToEdit.tag || '');
    setVal('fieldProjImage', projectToEdit.image || '');
    setVal('fieldProjShortDesc', projectToEdit.shortDesc || '');
    setVal('fieldProjDesc', projectToEdit.description || '');
    setVal('fieldProjTimeline', projectToEdit.timeline || '');
    setVal('fieldProjRole', projectToEdit.role || '');
    setVal('fieldProjTools', projectToEdit.tools || '');
    setVal('fieldProjDeliverables', projectToEdit.deliverable || '');

    const preview = document.getElementById('fieldProjThumbPreview');
    if (preview && projectToEdit.image) preview.src = projectToEdit.image;

    // Populate dynamic showcase images (Overview)
    const overviewContainer = document.getElementById('overviewImagesContainer');
    const processContainer = document.getElementById('processImagesContainer');
    if (overviewContainer) overviewContainer.innerHTML = '';
    if (processContainer) processContainer.innerHTML = '';

    const showcases = projectToEdit.showcaseImages || [];
    if (showcases.length > 0) {
      showcases.forEach((item, idx) => {
        addDynamicImageCard('overviewImagesContainer', item.src || '', item.alt || `${projectToEdit.shortTitle || 'Project'} Overview ${idx + 1}`, 'assets/images/work_luma.jpg', 'Overview');
      });
    } else if (projectToEdit.image) {
      addDynamicImageCard('overviewImagesContainer', projectToEdit.image, projectToEdit.shortTitle || 'Overview', 'assets/images/work_luma.jpg', 'Overview');
    } else {
      addDynamicImageCard('overviewImagesContainer', 'assets/images/work_luma.jpg', 'Overview 1', 'assets/images/work_luma.jpg', 'Overview');
    }

    // Populate dynamic process images (Process)
    const processes = projectToEdit.processImages || [];
    if (processes.length > 0) {
      processes.forEach((item, idx) => {
        addDynamicImageCard('processImagesContainer', item.src || '', item.alt || `${projectToEdit.shortTitle || 'Project'} Process ${idx + 1}`, 'assets/images/proto_cad.jpg', 'Process');
      });
    } else {
      addDynamicImageCard('processImagesContainer', 'assets/images/proto_cad.jpg', 'Process 1', 'assets/images/proto_cad.jpg', 'Process');
    }

    updateDynamicImageCounters();

  } else {
    heading.textContent = 'Add New Project';
    setVal('editProjectId', '');
    setVal('fieldProjSlug', '');
    document.getElementById('fieldProjSlug').readOnly = false;
    setVal('fieldProjCategory', 'product');
    setVal('fieldProjShortTitle', '');
    setVal('fieldProjTitle', '');
    setVal('fieldProjTag', 'CAD → 3D Print');
    setVal('fieldProjImage', 'assets/images/work_luma.jpg');
    setVal('fieldProjShortDesc', '');
    setVal('fieldProjDesc', '');
    setVal('fieldProjTimeline', '3 Months (2025)');
    setVal('fieldProjRole', 'Lead Industrial Designer');
    setVal('fieldProjTools', 'Fusion 360, KeyShot, Figma');
    setVal('fieldProjDeliverables', 'Working Prototype, Production Ready CAD');

    const preview = document.getElementById('fieldProjThumbPreview');
    if (preview) preview.src = 'assets/images/work_luma.jpg';

    const overviewContainer = document.getElementById('overviewImagesContainer');
    const processContainer = document.getElementById('processImagesContainer');
    if (overviewContainer) overviewContainer.innerHTML = '';
    if (processContainer) processContainer.innerHTML = '';

    // Default template image rows for new project
    addDynamicImageCard('overviewImagesContainer', 'assets/images/work_luma.jpg', 'Overview 1', 'assets/images/work_luma.jpg', 'Overview');
    addDynamicImageCard('overviewImagesContainer', 'assets/images/work_gantri.jpg', 'Overview 2', 'assets/images/work_gantri.jpg', 'Overview');
    addDynamicImageCard('overviewImagesContainer', 'assets/images/proto_cad.jpg', 'Overview 3', 'assets/images/proto_cad.jpg', 'Overview');

    addDynamicImageCard('processImagesContainer', 'assets/images/proto_cad.jpg', 'Process 1', 'assets/images/proto_cad.jpg', 'Process');
    addDynamicImageCard('processImagesContainer', 'assets/images/proto_drafting.jpg', 'Process 2', 'assets/images/proto_drafting.jpg', 'Process');
    addDynamicImageCard('processImagesContainer', 'assets/images/proto_cnc.jpg', 'Process 3', 'assets/images/proto_cnc.jpg', 'Process');

    updateDynamicImageCounters();
  }

  modal.classList.add('active');
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

  // Check duplicate slug if creating new
  if (!editId) {
    const exists = data.projects.some(p => p.id === slug);
    if (exists) {
      alert(`A project with ID "${slug}" already exists. Please choose a different slug.`);
      return;
    }
  }

  const category = document.getElementById('fieldProjCategory').value;
  const categoryLabels = {
    product: 'PRODUCT DESIGN',
    uiux: 'UI/UX DESIGN',
    graphic: 'GRAPHIC DESIGN'
  };

  const showcaseImages = getImagesFromContainer('overviewImagesContainer', shortTitle, 'Overview');
  const processImages = getImagesFromContainer('processImagesContainer', shortTitle, 'Process');
  const fallbackMainImg = document.getElementById('fieldProjImage').value.trim() || 'assets/images/work_luma.jpg';

  const projectRecord = {
    id: editId || slug,
    category: category,
    categoryLabel: categoryLabels[category] || category.toUpperCase(),
    shortTitle: shortTitle,
    title: title || shortTitle,
    tag: document.getElementById('fieldProjTag').value.trim(),
    image: fallbackMainImg,
    shortDesc: document.getElementById('fieldProjShortDesc').value.trim(),
    description: document.getElementById('fieldProjDesc').value.trim(),
    timeline: document.getElementById('fieldProjTimeline').value.trim(),
    role: document.getElementById('fieldProjRole').value.trim(),
    tools: document.getElementById('fieldProjTools').value.trim(),
    deliverable: document.getElementById('fieldProjDeliverables').value.trim(),
    showcaseImages: showcaseImages.length > 0 ? showcaseImages : [
      { src: fallbackMainImg, alt: `${shortTitle} Overview 1` }
    ],
    processImages: processImages.length > 0 ? processImages : (
      showcaseImages.length > 0 ? showcaseImages : [
        { src: fallbackMainImg, alt: `${shortTitle} Process 1` }
      ]
    )
  };

  if (editId) {
    const idx = data.projects.findIndex(p => p.id === editId);
    if (idx !== -1) {
      data.projects[idx] = projectRecord;
    }
  } else {
    data.projects.push(projectRecord);
  }

  PortfolioData.save(data);
  document.getElementById('modalProject').classList.remove('active');
  renderProjectsTable();
  updateDashboardStats();
  showToast(`Project "${shortTitle}" saved successfully!`, 'success');
}

window.editProject = function(id) {
  const data = PortfolioData.get();
  const proj = (data.projects || []).find(p => p.id === id);
  if (proj) openProjectModal(proj);
};

window.deleteProject = function(id) {
  if (!confirm(`Are you sure you want to delete project "${id}"? This action cannot be undone.`)) {
    return;
  }
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
   5. PROTOTYPING WORKSHOP MANAGER
   ========================================================================== */
function initPrototypingManager() {
  const btnSaveQuote = document.getElementById('btnSaveProtoQuote');
  const btnOpenModal = document.getElementById('btnOpenNewProtoModal');
  const btnSaveProto = document.getElementById('btnSaveProtoRecord');
  const srcInput = document.getElementById('fieldProtoSrc');
  const preview = document.getElementById('fieldProtoPreview');
  const fileUpload = document.getElementById('fileProtoUpload');

  if (srcInput && preview) {
    srcInput.addEventListener('input', () => {
      preview.src = srcInput.value || 'assets/images/proto_drafting.jpg';
    });
  }

  if (fileUpload && srcInput && preview) {
    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        srcInput.value = evt.target.result;
        preview.src = evt.target.result;
        showToast('Polaroid image uploaded!', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnSaveQuote) {
    btnSaveQuote.addEventListener('click', () => {
      const data = PortfolioData.get();
      data.protoQuote = document.getElementById('protoQuoteInput').value.trim();
      PortfolioData.save(data);
      showToast('Workshop quote updated!', 'success');
    });
  }

  if (btnOpenModal) {
    btnOpenModal.addEventListener('click', () => openProtoModal());
  }

  if (btnSaveProto) {
    btnSaveProto.addEventListener('click', saveProtoRecord);
  }
}

function renderPrototypingGrid() {
  const grid = document.getElementById('protoGrid');
  const quoteInput = document.getElementById('protoQuoteInput');
  if (!grid) return;

  const data = PortfolioData.get();
  const protos = data.prototypes || [];
  if (quoteInput) quoteInput.value = data.protoQuote || 'Workshop hands are curious hands.';

  grid.innerHTML = '';
  protos.forEach((p, index) => {
    const isFirst = (index === 0);
    const isLast = (index === protos.length - 1);
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
      <img src="${p.src}" alt="${p.title}" class="proto-admin-thumb" onerror="this.src='assets/images/proto_drafting.jpg'">
      <div>
        <div style="font-size: 11.5px; font-weight: 700; color: var(--color-gold);">${p.tag}</div>
        <div class="proto-admin-card-title">${p.title}</div>
        <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">
          ${p.isExtra ? '📌 Extra (Show on View All)' : '⭐ Initial 4 Cards'} • ${p.tilt}
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
    heading.textContent = `Edit Step: ${protoToEdit.step || protoToEdit.tag}`;
    setVal('editProtoId', protoToEdit.id);
    setVal('fieldProtoTag', protoToEdit.tag);
    setVal('fieldProtoTitle', protoToEdit.title);
    setVal('fieldProtoSrc', protoToEdit.src);
    setVal('fieldProtoTilt', protoToEdit.tilt || 'tilt-left');
    document.getElementById('fieldProtoIsExtra').checked = Boolean(protoToEdit.isExtra);
    const prev = document.getElementById('fieldProtoPreview');
    if (prev) prev.src = protoToEdit.src;
  } else {
    heading.textContent = 'Add Prototyping Step';
    const data = PortfolioData.get();
    const nextNum = (data.prototypes || []).length + 1;
    const padNum = String(nextNum).padStart(2, '0');
    setVal('editProtoId', '');
    setVal('fieldProtoTag', `STEP ${padNum} • RAPID PROTOTYPING`);
    setVal('fieldProtoTitle', 'New fabrication & assembly test');
    setVal('fieldProtoSrc', 'assets/images/proto_drafting.jpg');
    setVal('fieldProtoTilt', 'tilt-left');
    document.getElementById('fieldProtoIsExtra').checked = true;
  }

  modal.classList.add('active');
}

function saveProtoRecord() {
  const editId = document.getElementById('editProtoId').value.trim();
  const tag = document.getElementById('fieldProtoTag').value.trim();
  const title = document.getElementById('fieldProtoTitle').value.trim();
  const src = document.getElementById('fieldProtoSrc').value.trim() || 'assets/images/proto_drafting.jpg';
  const tilt = document.getElementById('fieldProtoTilt').value;
  const isExtra = document.getElementById('fieldProtoIsExtra').checked;

  const data = PortfolioData.get();
  data.prototypes = data.prototypes || [];

  const id = editId || ('proto_' + Date.now());
  const stepMatch = tag.match(/STEP\s*\d+/i);
  const step = stepMatch ? stepMatch[0].toUpperCase() : `STEP ${data.prototypes.length + 1}`;

  const protoObj = { id, step, tag, title, src, tilt, isExtra };

  if (editId) {
    const idx = data.prototypes.findIndex(p => p.id === editId);
    if (idx !== -1) data.prototypes[idx] = protoObj;
  } else {
    data.prototypes.push(protoObj);
  }

  PortfolioData.save(data);
  document.getElementById('modalProto').classList.remove('active');
  renderPrototypingGrid();
  updateDashboardStats();
  showToast('Prototyping step saved!', 'success');
}

window.editProto = function(id) {
  const data = PortfolioData.get();
  const proto = (data.prototypes || []).find(p => p.id === id);
  if (proto) openProtoModal(proto);
};

window.deleteProto = function(id) {
  if (!confirm('Are you sure you want to delete this prototyping polaroid?')) return;
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
   6. GALLERY & PHOTOGRAPHY MANAGER
   ========================================================================== */
function initGalleryManager() {
  const filterSelect = document.getElementById('galleryColFilter');
  const btnOpenModal = document.getElementById('btnOpenNewGalleryModal');
  const btnSaveGallery = document.getElementById('btnSaveGalleryRecord');
  const srcInput = document.getElementById('fieldGallerySrc');
  const preview = document.getElementById('fieldGalleryPreview');
  const fileUpload = document.getElementById('fileGalleryUpload');

  if (srcInput && preview) {
    srcInput.addEventListener('input', () => {
      preview.src = srcInput.value || 'assets/images/gallery_forest.jpg';
    });
  }

  if (fileUpload && srcInput && preview) {
    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        srcInput.value = evt.target.result;
        preview.src = evt.target.result;
        showToast('Gallery photo uploaded!', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  if (filterSelect) filterSelect.addEventListener('change', renderGalleryGrid);
  if (btnOpenModal) btnOpenModal.addEventListener('click', () => openGalleryModal());
  if (btnSaveGallery) btnSaveGallery.addEventListener('click', saveGalleryRecord);
}

function renderGalleryGrid() {
  const grid = document.getElementById('galleryGrid');
  const colFilter = document.getElementById('galleryColFilter')?.value || 'all';
  if (!grid) return;

  const data = PortfolioData.get();
  const items = data.gallery || [];

  const filtered = colFilter === 'all' 
    ? items 
    : items.filter(g => String(g.col) === String(colFilter));

  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color: var(--color-text-muted); padding: 20px;">No photos in this column.</p>';
    return;
  }

  filtered.forEach((g, index) => {
    const isFirst = (index === 0);
    const isLast = (index === filtered.length - 1);
    const card = document.createElement('div');
    card.className = 'gallery-admin-card';
    card.innerHTML = `
      <div class="card-reorder-bar">
        <span>Order #${index + 1} (Col ${g.col})</span>
        <div class="card-reorder-actions">
          <button type="button" class="btn-reorder-sm" onclick="moveGallery('${g.id}', 'up')" ${isFirst ? 'disabled' : ''} title="Move Up">▲</button>
          <button type="button" class="btn-reorder-sm" onclick="moveGallery('${g.id}', 'down')" ${isLast ? 'disabled' : ''} title="Move Down">▼</button>
        </div>
      </div>
      <img src="${g.src}" alt="${g.caption}" class="gallery-admin-thumb" onerror="this.src='assets/images/gallery_forest.jpg'">
      <div>
        <div style="font-size: 11.5px; font-weight: 700; color: var(--color-gold);">
          Column ${g.col} • ${g.type === 'card-tall' ? 'Tall (Portrait)' : 'Short (Landscape)'}
        </div>
        <div class="proto-admin-card-title">${g.caption}</div>
        <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">
          ${g.scriptOverlay ? '✍️ Script: ' + g.scriptOverlay.replace('\n', ' ') : (g.badge ? '🏷️ Badge: ' + g.badge : 'No badge')}
          • ${g.isExtra ? '📌 Extra' : '⭐ Initial'}
        </div>
      </div>
      <div style="display: flex; gap: 8px; margin-top: auto; border-top: 1px solid var(--color-cream-border); padding-top: 10px;">
        <button class="btn-outline-admin" style="padding: 6px 12px; font-size: 12.5px; flex: 1;" onclick="editGallery('${g.id}')">Edit ✏️</button>
        <button class="btn-danger" style="padding: 6px 12px; font-size: 12.5px;" onclick="deleteGallery('${g.id}')">Delete 🗑️</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openGalleryModal(itemToEdit = null) {
  const modal = document.getElementById('modalGallery');
  const heading = document.getElementById('modalGalleryHeading');
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  if (itemToEdit) {
    heading.textContent = 'Edit Gallery Photo';
    setVal('editGalleryId', itemToEdit.id);
    setVal('fieldGallerySrc', itemToEdit.src);
    setVal('fieldGalleryCaption', itemToEdit.caption);
    setVal('fieldGalleryCol', itemToEdit.col || '1');
    setVal('fieldGalleryType', itemToEdit.type || 'card-short');
    setVal('fieldGalleryBadge', itemToEdit.scriptOverlay || itemToEdit.badge || '');
    document.getElementById('fieldGalleryIsScript').checked = Boolean(itemToEdit.scriptOverlay);
    document.getElementById('fieldGalleryIsExtra').checked = Boolean(itemToEdit.isExtra);
    const prev = document.getElementById('fieldGalleryPreview');
    if (prev) prev.src = itemToEdit.src;
  } else {
    heading.textContent = 'Add Gallery Photo';
    setVal('editGalleryId', '');
    setVal('fieldGallerySrc', 'assets/images/gallery_forest.jpg');
    setVal('fieldGalleryCaption', 'New Visual Experiment / Studio Capture');
    setVal('fieldGalleryCol', '1');
    setVal('fieldGalleryType', 'card-short');
    setVal('fieldGalleryBadge', 'Visual Study');
    document.getElementById('fieldGalleryIsScript').checked = false;
    document.getElementById('fieldGalleryIsExtra').checked = true;
  }

  modal.classList.add('active');
}

function saveGalleryRecord() {
  const editId = document.getElementById('editGalleryId').value.trim();
  const src = document.getElementById('fieldGallerySrc').value.trim() || 'assets/images/gallery_forest.jpg';
  const caption = document.getElementById('fieldGalleryCaption').value.trim();
  const col = parseInt(document.getElementById('fieldGalleryCol').value, 10) || 1;
  const type = document.getElementById('fieldGalleryType').value;
  const badgeText = document.getElementById('fieldGalleryBadge').value.trim();
  const isScript = document.getElementById('fieldGalleryIsScript').checked;
  const isExtra = document.getElementById('fieldGalleryIsExtra').checked;

  const data = PortfolioData.get();
  data.gallery = data.gallery || [];

  const id = editId || ('g_' + Date.now());
  const item = {
    id,
    col,
    type,
    src,
    caption,
    isExtra
  };

  if (isScript) {
    item.scriptOverlay = badgeText || 'Find Beauty\nin Details.';
  } else if (badgeText) {
    item.badge = badgeText;
  }

  if (editId) {
    const idx = data.gallery.findIndex(g => g.id === editId);
    if (idx !== -1) data.gallery[idx] = item;
  } else {
    data.gallery.push(item);
  }

  PortfolioData.save(data);
  document.getElementById('modalGallery').classList.remove('active');
  renderGalleryGrid();
  updateDashboardStats();
  showToast('Gallery photo saved!', 'success');
}

window.editGallery = function(id) {
  const data = PortfolioData.get();
  const item = (data.gallery || []).find(g => g.id === id);
  if (item) openGalleryModal(item);
};

window.deleteGallery = function(id) {
  if (!confirm('Are you sure you want to delete this gallery photo?')) return;
  const data = PortfolioData.get();
  data.gallery = (data.gallery || []).filter(g => g.id !== id);
  PortfolioData.save(data);
  renderGalleryGrid();
  updateDashboardStats();
  showToast('Photo deleted.', 'success');
};

window.moveGallery = function(id, dir) {
  const data = PortfolioData.get();
  const list = data.gallery;
  if (!list || list.length < 2) return;

  const idx = list.findIndex(g => g.id === id);
  if (idx === -1) return;

  const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= list.length) return;

  const temp = list[idx];
  list[idx] = list[targetIdx];
  list[targetIdx] = temp;

  PortfolioData.save(data);
  renderGalleryGrid();
  showToast('Gallery photo order updated!', 'success');
};

/* ==========================================================================
   7. CONNECT & FOOTER MANAGER
   ========================================================================== */
function initConnectManager() {
  const btnSave = document.getElementById('btnSaveConnect');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const data = PortfolioData.get();

      data.connect = {
        ...data.connect,
        title: document.getElementById('connTitle').value.trim(),
        email: document.getElementById('connEmail').value.trim(),
        desc: document.getElementById('connDesc').value.trim(),
        resumeUrl: document.getElementById('connResumeUrl').value.trim(),
        socials: {
          instagram: document.getElementById('connSocialInstagram').value.trim(),
          linkedin: document.getElementById('connSocialLinkedin').value.trim(),
          behance: document.getElementById('connSocialBehance').value.trim(),
          dribbble: document.getElementById('connSocialDribbble').value.trim(),
          github: document.getElementById('connSocialGithub').value.trim(),
          twitter: document.getElementById('connSocialTwitter').value.trim(),
          youtube: document.getElementById('connSocialYoutube').value.trim()
        }
      };

      data.footer = {
        ...data.footer,
        copyright: document.getElementById('footerCopy').value.trim(),
        tagline: document.getElementById('footerTagline').value.trim()
      };

      PortfolioData.save(data);
      showToast('Connect & Footer info saved!', 'success');
    });
  }
}

function loadConnectData() {
  const data = PortfolioData.get();
  const c = data.connect || {};
  const s = c.socials || {};
  const f = data.footer || {};

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  setVal('connTitle', c.title);
  setVal('connEmail', c.email);
  setVal('connDesc', c.desc);
  setVal('connResumeUrl', c.resumeUrl);
  setVal('connSocialInstagram', s.instagram);
  setVal('connSocialLinkedin', s.linkedin);
  setVal('connSocialBehance', s.behance);
  setVal('connSocialDribbble', s.dribbble);
  setVal('connSocialGithub', s.github);
  setVal('connSocialTwitter', s.twitter);
  setVal('connSocialYoutube', s.youtube);
  setVal('footerCopy', f.copyright);
  setVal('footerTagline', f.tagline);
}

/* ==========================================================================
   8. SECURITY & PASSWORD MANAGER
   ========================================================================== */
function initSecurityManager() {
  const form = document.getElementById('changePassForm');
  const curPass = document.getElementById('currentPassInput');
  const newPass = document.getElementById('newPassInput');
  const confirmPass = document.getElementById('confirmPassInput');
  const errorEl = document.getElementById('passErrorMsg');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      errorEl.classList.remove('visible');

      const isCurrentValid = await PortfolioData.auth.verifyPassword(curPass.value.trim());
      if (!isCurrentValid) {
        errorEl.textContent = 'Current master password incorrect.';
        errorEl.classList.add('visible');
        return;
      }

      if (newPass.value !== confirmPass.value) {
        errorEl.textContent = 'New passwords do not match.';
        errorEl.classList.add('visible');
        return;
      }

      if (newPass.value.length < 4) {
        errorEl.textContent = 'New password must be at least 4 characters long.';
        errorEl.classList.add('visible');
        return;
      }

      await PortfolioData.auth.setPassword(newPass.value);
      form.reset();
      showToast('Master password updated successfully!', 'success');
    });
  }
}

/* ==========================================================================
   9. BACKUP & EXPORT MANAGER
   ========================================================================== */
function initBackupManager() {
  const btnExport = document.getElementById('btnExportJSON');
  const btnTriggerImport = document.getElementById('btnTriggerImport');
  const fileInput = document.getElementById('importFileInput');
  const btnReset = document.getElementById('btnResetDefaults');

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      PortfolioData.exportJSON();
      showToast('Site data exported successfully!', 'success');
    });
  }

  if (btnTriggerImport && fileInput) {
    btnTriggerImport.addEventListener('click', () => fileInput.click());

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
      const confirmed = confirm('WARNING: Are you sure you want to reset all portfolio data back to original defaults? Any custom content will be replaced.');
      if (confirmed) {
        PortfolioData.resetDefaults();
        refreshAllPanels();
        showToast('Website reset to factory defaults.', 'success');
      }
    });
  }
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
   11. APPEARANCE & CUSTOMIZATION ENGINE
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
