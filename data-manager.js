/**
 * Pawan K. Kushwaha Portfolio - Centralized Data Store
 * Provides data models, projects, hero cards, prototypes, and settings.
 */

(function(window) {
  'use strict';

  // Hero Overlapping Cards Initial Configuration
  const INITIAL_HERO_CARDS = [
    { id: 'hero-card-1', title: 'Guy Smiling Portrait', alt: 'Design portrait illustration', image: 'assets/images/hero_card_1.jpg', video: '', link: '#work', rotation: -11, zIndex: 1, width: 220, height: 280, shadow: 'medium', desktopPos: 'left', tabletPos: 'left', mobilePos: 'center', visible: true, order: 1 },
    { id: 'hero-card-2', title: 'Red Character Card', alt: 'Creative character illustration on red', image: 'assets/images/hero_card_2.jpg', video: '', link: '#work', rotation: 7, zIndex: 2, width: 220, height: 280, shadow: 'medium', desktopPos: 'left-center', tabletPos: 'left-center', mobilePos: 'center', visible: true, order: 2 },
    { id: 'hero-card-3', title: 'Blue Flower Macro', alt: 'Blue organic macro botanical study', image: 'assets/images/hero_card_3.jpg', video: '', link: '#gallery', rotation: -3, zIndex: 3, width: 220, height: 280, shadow: 'medium', desktopPos: 'center', tabletPos: 'center', mobilePos: 'center', visible: true, order: 3 },
    { id: 'hero-card-4', title: 'Character with Glasses', alt: 'Portrait illustration with glasses on soft pink', image: 'assets/images/hero_card_4.jpg', video: '', link: '#prototyping', rotation: 11, zIndex: 4, width: 220, height: 280, shadow: 'medium', desktopPos: 'right', tabletPos: 'right', mobilePos: 'center', visible: true, order: 4 }
  ];

  // Navigation Initial Configuration
  const INITIAL_NAVIGATION = {
    logoText: 'Pawan.',
    logoImage: '',
    logoWidth: 120,
    showLogoDesktop: true,
    showLogoMobile: true,
    resumeLabel: 'Resume',
    resumeUrl: 'assets/PORTFOLIO.pdf',
    resumeIcon: 'arrow-up-right',
    showResume: true,
    items: [
      { id: 'nav-work', label: 'Work', url: '#work', visible: true, order: 1, openInNewTab: false },
      { id: 'nav-proto', label: 'Prototyping', url: '#prototyping', visible: true, order: 2, openInNewTab: false },
      { id: 'nav-gallery', label: 'Gallery', url: '#gallery', visible: true, order: 3, openInNewTab: false },
      { id: 'nav-connect', label: 'Connect', url: '#connect', visible: true, order: 4, openInNewTab: false }
    ]
  };

  // Animation Initial Configuration
  const INITIAL_ANIMATION = {
    oneScrollOneAction: true,
    transitionDuration: 800,
    transitionEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    cardEntrance: 'fade-up',
    cardStaggerDelay: 90,
    heroIdleFloat: true,
    cardTiltHover: true
  };

  // SEO Initial Configuration
  const INITIAL_SEO = {
    siteTitle: 'Pawan K. Kushwaha | Product Designer & Industrial Design Portfolio',
    metaDescription: 'Industrial & Product Designer portfolio of Pawan K. Kushwaha. Ergonomic furniture, precision CAD hardware, mechatronics, and tactile experiences.',
    keywords: 'Product Designer, Industrial Design, CAD, Ergonomics, Furniture Design, Prototyping, UI/UX, Portfolio',
    canonicalUrl: 'https://pawankushwaha.design',
    ogTitle: 'Pawan K. Kushwaha — Product Designer',
    ogDescription: 'Ideas transformed into meaningful, functional experiences.',
    ogImage: 'assets/images/hero_card_1.jpg'
  };

  // Helper to generate blocks from project data
  function generateDefaultBlocks(project) {
    if (!project) return [];
    const blocks = [];
    
    // Overview / Brief Block
    blocks.push({
      id: 'blk-' + Date.now() + '-1',
      type: 'paragraph',
      heading: 'Project Overview',
      content: project.description || project.shortDesc || '',
      visible: true
    });

    // Specifications / Details Grid Block
    blocks.push({
      id: 'blk-' + Date.now() + '-2',
      type: 'specification',
      heading: 'Project Parameters & Scope',
      specs: [
        { label: 'Role', value: project.role || 'Lead Industrial Designer' },
        { label: 'Timeline', value: project.timeline || '3 Months' },
        { label: 'Tools', value: project.tools || 'SolidWorks, Keyshot, CNC, 3D Printing' },
        { label: 'Deliverable', value: project.deliverable || 'Working Prototypes & Production CAD' }
      ],
      visible: true
    });

    // Primary Showcase Gallery Block
    if (project.showcaseImages && project.showcaseImages.length > 0) {
      blocks.push({
        id: 'blk-' + Date.now() + '-3',
        type: 'gallery',
        heading: 'Showcase Gallery & Visuals',
        images: project.showcaseImages.map(img => typeof img === 'string' ? img : (img.src || img.url)),
        layout: 'grid-3',
        visible: true
      });
    }

    // Process & Fabrication Block
    if (project.processImages && project.processImages.length > 0) {
      blocks.push({
        id: 'blk-' + Date.now() + '-4',
        type: 'process-step',
        heading: 'Fabrication & Prototyping Process',
        stepNumber: '02',
        title: 'Precision Bench Refinement',
        description: 'Iterative mockups and tolerance checks validating physical ergonomics and toolpaths.',
        images: project.processImages.map(img => typeof img === 'string' ? img : (img.src || img.url)),
        visible: true
      });
    }

    // Call to action block
    blocks.push({
      id: 'blk-' + Date.now() + '-5',
      type: 'cta',
      title: 'Interested in this project?',
      subtitle: 'Open for detailed design walkthroughs and technical specifications.',
      buttonLabel: 'Back to Selected Work',
      buttonUrl: 'index.html#work',
      visible: true
    });

    return blocks;
  }

  // Helper to generate horizontal sections/slides from project data
  function generateDefaultSections(project) {
    if (!project) return [];
    
    // Build slide pool strictly from showcaseImages if available
    let pool = [];
    if (Array.isArray(project.showcaseImages) && project.showcaseImages.length > 0) {
      pool = project.showcaseImages.map(img => typeof img === 'string' ? img : (img.src || img.url)).filter(Boolean);
    } else if (project.image) {
      pool = [project.image];
    }

    if (pool.length === 0) {
      pool = ['assets/images/hero_clouds_bg.png'];
    }

    // Deduplicate while preserving order
    const uniquePool = [];
    pool.forEach(src => {
      if (src && !uniquePool.some(existing => {
        const cleanA = String(existing).replace(/^[./\\]+/, '').toLowerCase();
        const cleanB = String(src).replace(/^[./\\]+/, '').toLowerCase();
        return cleanA === cleanB;
      })) {
        uniquePool.push(src);
      }
    });
    pool = uniquePool.length > 0 ? uniquePool : pool;

    const firstItem = pool[0];
    const firstIsVid = typeof firstItem === 'string' && (firstItem.includes('.mp4') || firstItem.includes('.webm') || firstItem.startsWith('data:video/'));

    const sections = [];
    sections.push({
      id: 'sec-overview-' + (project.id || Date.now()),
      navTitle: 'Overview',
      title: project.title || 'Project Overview',
      subtitle: project.shortDesc || project.description || '',
      image: firstIsVid ? '' : firstItem,
      video: firstIsVid ? firstItem : '',
      mediaType: firstIsVid ? 'video' : 'image',
      isVisible: true
    });

    for (let i = 1; i < pool.length; i++) {
      const mediaItem = pool[i];
      const isVid = typeof mediaItem === 'string' && (mediaItem.includes('.mp4') || mediaItem.includes('.webm') || mediaItem.startsWith('data:video/'));
      sections.push({
        id: `sec-${i + 1}-` + (project.id || Date.now()),
        navTitle: `Visual 0${i + 1}`,
        title: project.title || '',
        image: isVid ? '' : mediaItem,
        video: isVid ? mediaItem : '',
        mediaType: isVid ? 'video' : 'image',
        isVisible: true
      });
    }
    return sections;
  }

  // Storage Keys
  const STORAGE_KEY_DATA = 'portfolio_custom_data';
  const STORAGE_KEY_PASS = 'portfolio_admin_password_hash';
  const STORAGE_KEY_PASS_UPDATED = 'portfolio_admin_password_updated_at';
  const STORAGE_KEY_RECOVERY = 'portfolio_admin_recovery_key_hash';
  const STORAGE_KEY_RECOVERY_CREATED = 'portfolio_admin_recovery_created_at';
  const STORAGE_KEY_LOCKOUT = 'portfolio_admin_lockout_state';
  const STORAGE_KEY_SECURITY_CONFIG = 'portfolio_admin_security_config';
  const STORAGE_KEY_AUDIT_LOG = 'portfolio_admin_audit_log';
  const STORAGE_KEY_SESSION = 'portfolio_admin_session';
  const STORAGE_KEY_CLOUD_SYNC = 'portfolio_cloud_sync_config';

  // Default Master Passwords: "pawan@2025" or "admin123"
  const DEFAULT_PASS_HASH = "827b13c9e66248fb84481ff36ad5fad1249f67e9171c106f902e971ada62ce5d"; // sha256("pawan@2025")
  const DEFAULT_PASS_HASH_ALT = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"; // sha256("admin123")
  const DEFAULT_PASS_HASH_LEGACY = "ca078f4a1bb317926e84d4b1a41e976694e50d604f552cf5d691cb5dfb4256eb";

  /**
   * Helper: compute SHA-256 hash of a string
   */
  async function sha256(message) {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback simple checksum
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      hash = ((hash << 5) - hash) + message.charCodeAt(i);
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }

  /**
   * Helper: Normalize JSONBin URL or bin ID into clean API endpoint
   */
  function normalizeJsonBinUrl(url) {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (/^[a-f0-9]{24}$/i.test(trimmed)) {
      return `https://api.jsonbin.io/v3/b/${trimmed}`;
    }
    const match = trimmed.match(/jsonbin\.io\/(?:v3\/b\/|app\/bins\/|b\/)?([a-f0-9]{24})/i);
    if (match) {
      return `https://api.jsonbin.io/v3/b/${match[1]}`;
    }
    return trimmed.replace(/\/latest\/?$/i, '').replace(/\/$/, '');
  }

  // Extract base dataset from current data-manager.js
  const DEFAULT_PORTFOLIO_DATA = {
    version: "2026.09.27",
    profile: {
      name: "PAWAN K. KUSHWAHA",
      titleLine1: "PAWAN K.",
      titleLine2: "KUSHWAHA",
      role: "PRODUCT DESIGNER",
      tagline: "Design. Make. Explore.",
      bio: "I'm an Industrial & Product Designer who loves turning ideas into meaningful products and experiences. I design at the intersection of function, simplicity and human needs.",
      location: "Chandigarh, India",
      statusText: "Available for opportunities",
      statusType: "green", // gold, green, or red
      avatar: "assets/images/hero_character.png",
      ctaWorkText: "View My Work",
      ctaStoryText: "Send an Email",
      ctaStoryUrl: "mailto:pawankushwaha1@gmail.com",
      stats: [
        { value: "4+", label: "Years of\nDesign Journey" },
        { value: "20+", label: "Projects\nDesigned" },
        { value: "∞", label: "Still Curious\nStill Creating" }
      ],
      music: {
        caption: "CURRENTLY LISTENING",
        trackName: "Cinematic Ambient & Lo-Fi Beats",
        audioSrc: "assets/audio/ambient_lofi.wav"
      }
    },

    about: {
      tag: "ABOUT ME",
      headlineLine1: "I DESIGN TO",
      headlineLine2: "MAKE IDEAS",
      headlineLine3: "TANGIBLE.",
      bioParagraph1: "I’m Pawan K. Kushwaha, a designer curious about how things work, how people interact with them, and how thoughtful design can make everyday experiences better.",
      bioParagraph2: "From sketching and 3D modeling to prototyping and testing, I enjoy turning early ideas into practical solutions. I believe good design begins with understanding people and grows through curiosity, experimentation, and iteration.",
      statementPhrase: "Design. Make. Explore.",
      ctaText: "MORE ABOUT MY JOURNEY",
      ctaUrl: "about.html",
      portraitImage: "assets/images/hero_card_2.jpg",
      nametagLine1: "Pawan K.",
      nametagLine2: "Kushwaha",
      repeatText: "Ideas\nDesign\nPrototype\nRepeat.",
      toolsNote: "Tools I use to turn ideas into products.",
      tools: [
        { id: "tool-fusion", name: "Autodesk Fusion 360", type: "preset", preset: "fusion", customImage: "", badgeText: "F", bgColor: "", textColor: "", visible: true },
        { id: "tool-figma", name: "Figma", type: "preset", preset: "figma", customImage: "", badgeText: "", bgColor: "", textColor: "", visible: true },
        { id: "tool-ps", name: "Adobe Photoshop", type: "preset", preset: "ps", customImage: "", badgeText: "Ps", bgColor: "", textColor: "", visible: true },
        { id: "tool-ai", name: "Adobe Illustrator", type: "preset", preset: "ai", customImage: "", badgeText: "Ai", bgColor: "", textColor: "", visible: true },
        { id: "tool-sketch", name: "Digital Sketching & Rendering", type: "preset", preset: "sketch", customImage: "", badgeText: "", bgColor: "", textColor: "", visible: true },
        { id: "tool-cad", name: "3D CAD & Prototyping", type: "preset", preset: "cad", customImage: "", badgeText: "", bgColor: "", textColor: "", visible: true }
      ],
      educationTitle: "EDUCATION",
      educationDegree: "B.Des. Industrial & Product Design",
      educationSchool: "Chandigarh University",
      focusTitle: "FOCUS AREAS",
      focusItem1: "Product Design · UI/UX",
      focusItem2: "3D Modeling · Prototyping",
      focusItem3: "User-Centered Design",
      beyondTitle: "BEYOND DESIGN",
      beyondDesc: "Exploring new tools, making physical products, and learning through hands-on experiments."
    },

    sectionDivider: {
      enabled: true,
      height: 72,
      text1: "SELECTED WORK",
      text2: "INDUSTRIAL & PRODUCT DESIGN",
      text3: "TURNING IDEAS INTO PRODUCTS",
      text4: "3D MODELING & PROTOTYPING",
      text5: "PHYSICAL & DIGITAL EXPERIENCES"
    },

    categories: [
      { id: "product", name: "Product Design" },
      { id: "uiux", name: "UI/UX Design" },
      { id: "graphic", name: "Graphic Design" }
    ],

    projects: [
      // PRODUCT DESIGN
      {
        id: "kinetic-chair",
        slug: "kinetic-chair",
        route: "/projects/kinetic-chair",
        alias: ["kinetic_chair"],
        category: "product",
        categoryLabel: "FURNITURE DESIGN",
        shortTitle: "KINETIC CHAIR",
        title: "KINETIC CHAIR",
        tag: "Scale Prototyping",
        image: "assets/images/work_chair.jpg",
        shortDesc: "Ergonomic study chairs exploring lightweight bent plywood geometry and spine curvature...",
        description: "Kinetic Chair is an ergonomic furniture concept exploring how a lightweight bent-plywood structure can support the body through controlled curvature and minimal material use.\n\nThe project focuses on developing a chair that balances ergonomics, structural efficiency, comfort, and visual simplicity. The design process explores body posture, seating geometry, material behavior, and the relationship between form and manufacturing.",
        desc1: "Ergonomic study chairs exploring lightweight bent plywood geometry and spine curvature...",
        desc2: "The project focuses on developing a chair that balances ergonomics, structural efficiency, comfort, and visual simplicity. The design process explores body posture, seating geometry, material behavior, and the relationship between form and manufacturing.",
        features: [
          { label: "Ergonomic seating", icon: "chair" },
          { label: "Spine supporting", icon: "spine" },
          { label: "Lightweight structure", icon: "layers" },
          { label: "Material efficient", icon: "material" },
          { label: "Plywood construction", icon: "armchair" },
          { label: "Prototype & testing", icon: "testing" }
        ],
        projectBrief: "An ergonomic chair concept exploring lightweight bent-plywood geometry and spine-supporting curvature.",
        timeline: "4 Months (2023 - 2024)",
        role: "Furniture & Ergonomics Designer",
        tools: "AutoCAD, SolidWorks, CNC Router, Vacuum Press Lamination",
        deliverable: "1:5 Scale Study Models, 1:1 Full Scale Prototype, Structural FEA",
        showcaseImages: [
          { src: "assets/images/card_kinetic_showcase.jpg", alt: "Kinetic Ergonomic Articulating Task Chair" },
          { src: "assets/images/proto_assembly.jpg", alt: "Spine Articulation Joint Hardware Prototyping" },
          { src: "assets/images/proto_cad.jpg", alt: "Finite Element Analysis Stress Modeling" }
        ],
        processImages: [
          { src: "assets/images/proto_assembly.jpg", alt: "Ball-and-Socket Vertebral Joint Assembly" },
          { src: "assets/images/proto_cad.jpg", alt: "Dynamic Lumbar Load Finite Element Simulation" },
          { src: "assets/images/proto_drafting.jpg", alt: "Gas-Lift Cylinder & Dual-Pivot Linkage Blueprints" }
        ]
      },
      {
        id: "luma",
        slug: "luma",
        route: "/projects/luma",
        alias: [],
        category: "product",
        categoryLabel: "LIGHTING DESIGN",
        shortTitle: "LUMA",
        title: "LUMA — Minimalist Modular Desk Lamp",
        tag: "Design",
        image: "assets/images/card_luma.jpg",
        shortDesc: "A minimalist modular desk lamp exploring diffused warm lighting and ergonomic pivot points.",
        description: "LUMA is an exploration in reductive industrial design and thermal management. A minimalist modular desk lamp exploring diffused warm lighting and ergonomic pivot points. Machined from billet 6061 aluminum with an integrated capacitive touch slider in the base, LUMA offers continuous dimming and circadian color-temperature tuning.",
        desc1: "LUMA is an exploration in reductive industrial design and thermal management, creating a minimalist modular desk luminaire with intuitive touch controls.",
        desc2: "Machined from billet 6061 aluminum with an integrated capacitive slider in the base, LUMA offers continuous circadian color-temperature tuning and glare-free illumination.",
        features: [
          { label: "Circadian tuning", icon: "chair" },
          { label: "Capacitive touch", icon: "spine" },
          { label: "Billet aluminum", icon: "layers" },
          { label: "Thermal heat-sink", icon: "material" },
          { label: "Glare-free optic", icon: "armchair" },
          { label: "DFM CNC milled", icon: "testing" }
        ],
        projectBrief: "A minimalist modular desk lamp exploring diffused warm lighting, CNC aluminum housing, and ergonomic pivot points.",
        timeline: "4 Months (2024)",
        role: "Lead Industrial Designer & Prototyper",
        tools: "Autodesk Fusion 360, Keyshot, SLA 3D Printing, CNC Milling",
        deliverable: "DFM CAD Packages, Working Functional Prototype, Bill of Materials",
        showcaseImages: [
          { src: "assets/images/card_luma.jpg", alt: "LUMA Acoustic Table Lamp Final Assembly" },
          { src: "assets/images/card_gantri.jpg", alt: "LUMA Diffuser Light Spill and Material Finishes" },
          { src: "assets/images/proto_cad.jpg", alt: "CAD Mechanical Tolerances & LED Thermal Path" }
        ],
        processImages: [
          { src: "assets/images/proto_cad.jpg", alt: "Thermal Heat-Sink Finite Element Analysis" },
          { src: "assets/images/proto_drafting.jpg", alt: "Acoustic Felt Damping Chamber Schematics" },
          { src: "assets/images/proto_cnc.jpg", alt: "Precision CNC Machined Aluminum Base" }
        ]
      },
      {
        id: "analog",
        slug: "analog",
        route: "/projects/analog",
        alias: [],
        category: "product",
        categoryLabel: "HARDWARE DESIGN",
        shortTitle: "ANALOG",
        title: "ANALOG — Tactile Digital Camera",
        tag: "Concept CAD",
        image: "assets/images/card_analog.jpg",
        shortDesc: "A tactile digital camera concept prioritizing mechanical feedback with physical click wheels and vintage ergonomics.",
        description: "A tactile digital camera concept prioritizing mechanical feedback with physical click wheels and vintage ergonomics. In an era of frictionless touchscreens, ANALOG restores the tactile joy of photography through knurled aluminum control dials, mechanical shutter release clickers, and an organic status display inspired by 1970s rangefinders.",
        desc1: "ANALOG is a tactile digital camera concept prioritizing mechanical feedback with physical knurled dials and vintage rangefinder ergonomics.",
        desc2: "In an era of frictionless touchscreens, ANALOG restores the tactile joy of photography through stepped magnetic detents, mechanical shutter release, and an organic status display.",
        features: [
          { label: "Knurled dial controls", icon: "chair" },
          { label: "Stepped detents", icon: "spine" },
          { label: "Billet 6061 chassis", icon: "layers" },
          { label: "Mechanical shutter", icon: "material" },
          { label: "OLED status gauge", icon: "armchair" },
          { label: "Functional prototype", icon: "testing" }
        ],
        projectBrief: "A tactile digital camera concept prioritizing mechanical feedback with physical click wheels and vintage ergonomics.",
        timeline: "3 Months (2024)",
        role: "Hardware UI/UX & Ergonomics Engineer",
        tools: "SolidWorks, KeyShot 11, Foam Prototyping, Arduino Micro",
        deliverable: "Ergonomic Rig Studies, Working PCB Enclosure, Production Ready CAD",
        showcaseImages: [
          { src: "assets/images/card_analog.jpg", alt: "ANALOG Precision CNC Volume Controller" },
          { src: "assets/images/proto_cnc.jpg", alt: "Precision Multi-Axis CNC Milling Process" },
          { src: "assets/images/proto_drafting.jpg", alt: "Rotary Encoder Mechanical Tolerance Blueprint" }
        ],
        processImages: [
          { src: "assets/images/proto_cnc.jpg", alt: "5-Axis CNC Toolpath Milling Setup" },
          { src: "assets/images/proto_drafting.jpg", alt: "Stepped Magnetic Detent Tolerance Blueprint" },
          { src: "assets/images/proto_assembly.jpg", alt: "Bearing Alignment and Shaft Press-Fit" }
        ]
      },
      {
        id: "gantt-lamp",
        slug: "gantt-lamp",
        route: "/projects/gantt-lamp",
        alias: ["gantri"],
        category: "product",
        categoryLabel: "ADDITIVE DESIGN",
        shortTitle: "GANTRI LAMP",
        title: "GANTRI LAMP — Additive Zero-Waste Desktop Luminaire",
        tag: "Additive DFM",
        image: "assets/images/card_gantri.jpg",
        shortDesc: "Modular desktop luminaire engineered for scalable zero-waste additive manufacturing with plant-based polymers.",
        description: "Developed in close collaboration with Gantri, exploring sustainable plant-based polymers and zero-waste additive manufacturing. Features balanced weighted geometry, hidden wiring channels, and parametric diffusion ribs that cast a gentle, glare-free working light.",
        desc1: "Developed in close collaboration with Gantri, exploring sustainable plant-based polymers and zero-waste additive manufacturing for modern desktop luminaires.",
        desc2: "Features balanced weighted geometry, hidden internal wiring channels, and parametric diffusion ribs that cast a gentle, glare-free working light.",
        features: [
          { label: "Plant-based polymer", icon: "chair" },
          { label: "Zero-waste additive", icon: "spine" },
          { label: "Internal cable path", icon: "layers" },
          { label: "Parametric ribs", icon: "material" },
          { label: "Weighted stability", icon: "armchair" },
          { label: "Production tooling", icon: "testing" }
        ],
        projectBrief: "Modular desktop luminaire engineered for scalable zero-waste additive manufacturing with plant-based polymers.",
        timeline: "3 Months (2024)",
        role: "Industrial Design & Additive DFM Specialist",
        tools: "Rhino 3D, Grasshopper, KeyShot, FDM Production Tooling",
        deliverable: "Toolpath Calibrations, Production CAD, Assembly Instructions",
        showcaseImages: [
          { src: "assets/images/card_gantri.jpg", alt: "Gantri Luminaire Warm Illumination" },
          { src: "assets/images/proto_3dprint.jpg", alt: "3D Printing Additive Layer Deposition" },
          { src: "assets/images/card_luma.jpg", alt: "Sculptural Geometry in Minimalist Interior" }
        ],
        processImages: [
          { src: "assets/images/proto_3dprint.jpg", alt: "Additive Toolpath Slicing and Nozzle Temperature Control" },
          { src: "assets/images/proto_cad.jpg", alt: "Parametric Curvature & Wall Thickness Optimization" },
          { src: "assets/images/proto_drafting.jpg", alt: "Cord Relief and Base Weighting Specifications" }
        ]
      },
      {
        id: "modu-bottle",
        slug: "modu-bottle",
        route: "/projects/modu-bottle",
        alias: ["modu_bottles"],
        category: "product",
        categoryLabel: "SUSTAINABLE DESIGN",
        shortTitle: "MODU BOTTLE",
        title: "MODU BOTTLE — Interlocking Sustainable Hydration System",
        tag: "Blow Molding CAD",
        image: "assets/images/card_modu.jpg",
        shortDesc: "Parametric ribbed interlocking water bottle system reducing resin usage by 24% and optimizing logistics volume.",
        description: "A parametric interlocking bottle architecture engineered to optimize shipping volumetric density by 28% and eliminate secondary packaging. Molded with thin-wall structural ribbing that reduces virgin polymer consumption while providing superior drop resistance.",
        desc1: "A parametric interlocking bottle architecture engineered to optimize shipping volumetric density by 28% and eliminate secondary packaging.",
        desc2: "Molded with thin-wall structural ribbing that reduces virgin polymer consumption while providing superior drop resistance and modular flavor pod docking.",
        features: [
          { label: "Interlocking form", icon: "chair" },
          { label: "28% space saving", icon: "spine" },
          { label: "Thin-wall ribbing", icon: "layers" },
          { label: "24% resin reduced", icon: "material" },
          { label: "Modular dock caps", icon: "armchair" },
          { label: "Blow mold tooling", icon: "testing" }
        ],
        projectBrief: "Parametric ribbed interlocking water bottle system reducing resin usage by 24% and optimizing logistics volume.",
        timeline: "2 Months (2024)",
        role: "Packaging & Sustainable ID Consultant",
        tools: "PTC Creo, KeyShot Studio, SLA Scale Testing, Moldflow Analysis",
        deliverable: "Blow Mold Tooling CAD, Parting Line Specs, Material Savings Study",
        showcaseImages: [
          { src: "assets/images/card_modu.jpg", alt: "Modu Vacuum Insulated Bottle Geometry" },
          { src: "assets/images/gallery_bottles.jpg", alt: "Matte Powder-Coat Finishes in Studio Light" },
          { src: "assets/images/proto_extrusion.jpg", alt: "Extrusion Tooling & Threaded Cap Prototyping" }
        ],
        processImages: [
          { src: "assets/images/proto_extrusion.jpg", alt: "Deep-Draw Stainless Steel Tooling & Thread Precision" },
          { src: "assets/images/proto_drafting.jpg", alt: "Double-Wall Vacuum Insulation Seal Tolerances" },
          { src: "assets/images/proto_cad.jpg", alt: "Modular Magnetic Flavor Pod Docking CAD" }
        ]
      },
      {
        id: "chassis-m1",
        slug: "chassis-m1",
        route: "/projects/chassis-m1",
        alias: ["chassis_m1"],
        category: "product",
        categoryLabel: "PRECISION HARDWARE",
        shortTitle: "CHASSIS M1",
        title: "CHASSIS M1 — Machined Mechanical Camera Body",
        tag: "Class-A Surfacing",
        image: "assets/images/card_chassis.jpg",
        shortDesc: "Precision machined rangefinder body with knurled physical dials and modular battery sled.",
        description: "A precision billet 6061-T6 aluminum rangefinder body engineered with continuous G2 curvature and tactile knurled control interfaces. Houses internal optical sensor modules and a quick-swap mechanical battery sled.",
        desc1: "A precision billet 6061-T6 aluminum rangefinder body engineered with continuous G2 curvature and tactile knurled control interfaces.",
        desc2: "Houses internal optical sensor modules and a quick-swap mechanical battery sled, finished with sandblasted hard-anodized treatment.",
        features: [
          { label: "Continuous G2 curves", icon: "chair" },
          { label: "6061-T6 aluminum", icon: "spine" },
          { label: "Tactile knurling", icon: "layers" },
          { label: "Modular battery sled", icon: "material" },
          { label: "Hard-anodized coat", icon: "armchair" },
          { label: "5-axis CNC DFM", icon: "testing" }
        ],
        projectBrief: "Precision machined rangefinder body with knurled physical dials and modular quick-swap battery sled.",
        timeline: "5 Months (2024)",
        role: "Principal Hardware Systems Designer",
        tools: "Autodesk Alias, Fusion 360, 5-Axis CNC Milling, Anodizing Lab",
        deliverable: "Class-A Surface STEP Files, GD&T Drawings, Working Anodized Chassis",
        showcaseImages: [
          { src: "assets/images/card_chassis.jpg", alt: "Chassis M1 Machined Aluminum Mini-ITX Case" },
          { src: "assets/images/proto_cnc.jpg", alt: "Beveled Chamfer CNC Milling and Sandblasting" },
          { src: "assets/images/proto_scale.jpg", alt: "Component Tolerance and Airflow Validation" }
        ],
        processImages: [
          { src: "assets/images/proto_cnc.jpg", alt: "Extruded 6061 Billet Machining Operation" },
          { src: "assets/images/proto_drafting.jpg", alt: "SFX Power Supply & GPU PCIe 4.0 Riser Blueprint" },
          { src: "assets/images/proto_assembly.jpg", alt: "Sandblasted Matte Hard-Anodized Surface Finish" }
        ]
      },
      {
        id: "apex-gears",
        slug: "apex-gears",
        route: "/projects/apex-gears",
        alias: ["apex_gears"],
        category: "product",
        categoryLabel: "MECHATRONIC DESIGN",
        shortTitle: "APEX GEARS",
        title: "APEX GEARS — High-Durability Micro Planetary Geartrain",
        tag: "Additive Tooling",
        image: "assets/images/card_apex.jpg",
        shortDesc: "High-durability micro planetary gear systems tested for repeatable low-volume production and mechatronic actuation.",
        description: "Engineered micro-extrusion additive toolpaths for high-tolerance involute gears. Built for low-volume precision mechatronic actuators requiring zero backlash and long-cycle friction durability.",
        desc1: "High-durability micro planetary gear systems tested for repeatable low-volume production and zero backlash in robotic applications.",
        desc2: "Engineered micro-extrusion additive toolpaths for high-tolerance involute gears, delivering long-cycle friction durability and optimal load distribution.",
        features: [
          { label: "Zero-backlash teeth", icon: "chair" },
          { label: "Micro planetary set", icon: "spine" },
          { label: "Carbon prepreg arms", icon: "layers" },
          { label: "Low friction mesh", icon: "material" },
          { label: "Ceramic bearings", icon: "armchair" },
          { label: "Finite element FEA", icon: "testing" }
        ],
        projectBrief: "High-durability micro planetary gear systems tested for repeatable low-volume production and mechatronic actuation.",
        timeline: "3 Months (2024)",
        role: "Mechatronic Fabrication Engineer",
        tools: "SolidWorks Motion, GearTeq, Direct-Drive Micro Extruder",
        deliverable: "Gear Involute DFM, Backlash Analysis Report, Functional Actuator",
        showcaseImages: [
          { src: "assets/images/card_apex.jpg", alt: "Apex Mountain Gear Mechanism & Carbon Lever" },
          { src: "assets/images/proto_drafting.jpg", alt: "Indexing Pawl Tooth Engagement Engineering Draft" },
          { src: "assets/images/proto_cad.jpg", alt: "High-Impact Stress Finite Element Simulation" }
        ],
        processImages: [
          { src: "assets/images/proto_drafting.jpg", alt: "Ratchet Cam Indexing Step Profile Blueprint" },
          { src: "assets/images/proto_cad.jpg", alt: "Carbon Prepreg Compression Mold Cavity Analysis" },
          { src: "assets/images/proto_assembly.jpg", alt: "Sealed Ceramic Bearing Clean-Room Assembly" }
        ]
      },

      // UI/UX DESIGN
      {
        id: "wellness-journey",
        slug: "wellness-journey",
        route: "/projects/wellness-journey",
        alias: ["wellness"],
        category: "uiux",
        categoryLabel: "PRODUCT DESIGN",
        shortTitle: "WELLNESS JOURNEY",
        title: "WELLNESS JOURNEY",
        tag: "Interactive Spatial",
        image: "assets/images/showcase_wellness_1.png",
        focalPoint: "center center",
        shortDesc: "An interactive floor game to help children learn healthy habits through play, movement, and social interaction.",
        description: "An interactive floor game to help children learn healthy habits through play, movement, and social interaction.",
        features: [
          { label: "Physical Activity", icon: "activity" },
          { label: "Food Awareness", icon: "food" },
          { label: "Group Interaction", icon: "group" },
          { label: "Easy to Understand", icon: "book" }
        ],
        timeline: "4 Months (2024)",
        role: "Spatial UX & Systems Architect",
        tools: "Figma, Unity 3D, TouchDesigner, Depth Sensors, C#",
        deliverable: "Spatial Interactive Prototype, Floor Matrix Calibration Spec, Design System",
        showcaseImages: [
          { src: "assets/images/wellness_journey_cover.jpg", alt: "Wellness Journey - Interactive Floor Game" },
          { src: "assets/images/showcase_wellness_1.png", alt: "Wellness Journey - Interactive Starscape Floor Projection" },
          { src: "assets/images/showcase_wellness_2.png", alt: "Wellness Journey - Biomimetic Sensor Details" },
          { src: "assets/images/showcase_wellness_3.png", alt: "Wellness Journey - Biophilic Environmental Visuals" }
        ],
        processImages: [
          { src: "assets/images/proto_cad.jpg", alt: "CAD Floor Sensor Matrix Topology" },
          { src: "assets/images/proto_drafting.jpg", alt: "Optical Throw Ratio & Projection Geometry Blueprint" },
          { src: "assets/images/proto_assembly.jpg", alt: "Sensor Enclosure Prototyping & Assembly" }
        ]
      },
      {
        id: "skytrack",
        slug: "skytrack",
        route: "/projects/skytrack",
        alias: [],
        category: "uiux",
        categoryLabel: "UI/UX DESIGN",
        shortTitle: "SkyTrack",
        title: "SkyTrack — A Smarter Way to Travel",
        tag: "Travel Platform",
        image: "assets/images/hero_clouds_bg.png",
        shortDesc: "A seamless travel booking experience for the next generation of explorers.",
        description: "SkyTrack revolutionizes the travel lifecycle with predictive trip orchestration, automated flight re-accommodation, and biophilic UI design inspired by high-altitude atmospheric horizons. Built from ground up to reduce cognitive fatigue for frequent globe-trotters.",
        timeline: "6 Months (2024)",
        role: "Lead Product & Systems Designer",
        tools: "Figma, Framer, Swift, Mapbox GL, Design Systems",
        deliverable: "Multi-Platform Mobile Application, Design Tokens, Micro-Interactions",
        showcaseImages: [
          { src: "assets/images/hero_clouds_bg.png", alt: "SkyTrack Atmospheric Horizon Interface" },
          { src: "assets/images/work_breathe.png", alt: "SkyTrack Mobile Itinerary Screen" },
          { src: "assets/images/work_pulse.jpg", alt: "SkyTrack Real-Time Flight Telemetry" }
        ],
        processImages: [
          { src: "assets/images/proto_drafting.jpg", alt: "Passenger Journey Flow & State Architecture" },
          { src: "assets/images/proto_cad.jpg", alt: "Glanceable Widget Grid Spec" },
          { src: "assets/images/proto_assembly.jpg", alt: "Live Prototype User Testing Rig" }
        ],
        verticalImages: [
          { src: "assets/images/work_breathe.png", alt: "SkyTrack Mobile Navigation Flow", isVideo: false, mediaType: "image" },
          { src: "assets/images/showcase_wellness_1.png", alt: "SkyTrack Boarding & Flight Card", isVideo: false, mediaType: "image" },
          { src: "assets/images/card_apex.jpg", alt: "SkyTrack Real-Time Flight Telemetry", isVideo: false, mediaType: "image" }
        ]
      },
      {
        id: "breathe",
        slug: "breathe",
        route: "/projects/breathe",
        alias: [],
        category: "uiux",
        categoryLabel: "UI/UX DESIGN",
        shortTitle: "BREATHE",
        title: "BREATHE — Mindful Living & Alpine Meditation App",
        tag: "Figma Prototype",
        image: "assets/images/work_breathe.png",
        shortDesc: "A mindful living and alpine meditation app designed with calm typography and..",
        description: "A mindful living and alpine meditation app designed with calm typography and serene pacing. BREATHE synchronizes breathing cadences with subtle linear resonant haptic pulses. By pairing a pebble-sized pocket stone with an iOS companion, users regulate stress without gazing at glowing screens.",
        timeline: "5 Months (2023 - 2024)",
        role: "Product Designer & Interaction Architect",
        tools: "Figma, Principle, Swift / CoreHaptics, Soft-Touch Silicone Overmolding",
        deliverable: "Complete Design System, BLE Communication Specs, High-Fi Prototype",
        showcaseImages: [
          { src: "assets/images/work_breathe.png", alt: "Breathe Meditation Mobile Application Experience" },
          { src: "assets/images/work_pulse.jpg", alt: "Biometric Heart Rate & Respiratory Biofeedback" },
          { src: "assets/images/work_aether.jpg", alt: "Ambient Soundscape Mixing & Haptic Feedback" }
        ],
        processImages: [
          { src: "assets/images/proto_drafting.jpg", alt: "User Journey Wireframes & Breath Timing Cadence" },
          { src: "assets/images/proto_cad.jpg", alt: "Wearable Haptic Transducer Housing Layout" },
          { src: "assets/images/proto_assembly.jpg", alt: "Usability Testing Rig & Heart-Rate Telemetry Log" }
        ],
        verticalImages: [
          { src: "assets/images/work_breathe.png", alt: "Breathe Mobile Pacing Guide", isVideo: false, mediaType: "image" },
          { src: "assets/images/showcase_wellness_2.png", alt: "Breathe Real-Time Heart Cadence", isVideo: false, mediaType: "image" },
          { src: "assets/images/showcase_wellness_3.png", alt: "Breathe Soundscape Sensory Feedback", isVideo: false, mediaType: "image" }
        ]
      },

      // GRAPHIC DESIGN
      {
        id: "movie-time",
        slug: "movie-time",
        route: "/projects/movie-time",
        alias: ["movietime"],
        category: "graphic",
        categoryLabel: "GRAPHIC DESIGN",
        shortTitle: "MOVIE TIME",
        title: "MOVIE TIME — Retro-Inspired Cinematic Poster Series",
        tag: "Risograph Print",
        image: "assets/images/work_movietime.jpg",
        shortDesc: "Retro-inspired cinematic poster series honoring classic storytelling with textured...",
        description: "Retro-inspired cinematic poster series honoring classic storytelling with textured risograph print aesthetics, vivid color harmonies, and timeless graphic composition. Curated cinema discovery platform with interactive community reviews and personalized recommendations.",
        timeline: "3 Months (2023)",
        role: "Full-Stack Product Designer",
        tools: "Figma, React, TailwindCSS, TMDB API, Framer Motion",
        deliverable: "Responsive Web Application, User Journey Maps, Micro-Interactions",
        showcaseImages: [
          { src: "assets/images/work_movietime.jpg", alt: "Movie Time Gallery Exhibition of Screenprints" },
          { src: "assets/images/work_cinema_reel.jpg", alt: "Kinetic Film Strip Typography & Halftone Texture" },
          { src: "assets/images/work_avengers_poster.jpg", alt: "Blockbuster Multi-Figure Composite Screenprint" }
        ],
        processImages: [
          { src: "assets/images/proto_drafting.jpg", alt: "Halftone Color Separation & Spot Plate Alignment" },
          { src: "assets/images/proto_illustration.jpg", alt: "Hand-Inked Rough Typography Studies" },
          { src: "assets/images/gallery_cyanotype.jpg", alt: "Experimental UV Exposure on Heavyweight Cotton Stock" }
        ]
      },
      {
        id: "vinyl-grooves",
        slug: "vinyl-grooves",
        route: "/projects/vinyl-grooves",
        alias: ["vinyl_grooves"],
        category: "graphic",
        categoryLabel: "GRAPHIC DESIGN",
        shortTitle: "VINYL GROOVES",
        title: "VINYL GROOVES — Geometric Music Identity & Album Packaging",
        tag: "Album Packaging",
        image: "assets/images/work_vinyl_poster.jpg",
        shortDesc: "Minimalist typography and geometric piano-key layout celebrating vinyl culture...",
        description: "A striking minimalist record packaging identity exploring the intersection of radial analog grooves and linear piano keys. Features die-cut center sleeves, matte debossed letterpress typography, and custom gatefold art.",
        timeline: "2 Months (2023)",
        role: "Graphic Designer & Art Director",
        tools: "Adobe Illustrator, Photoshop, InDesign, Spot UV Screen Printing",
        deliverable: "12-Inch Gatefold Sleeve, Disc Label Typography, Press Kit",
        showcaseImages: [
          { src: "assets/images/work_vinyl_poster.jpg", alt: "Vinyl Grooves Piano-Key Geometric Gatefold" },
          { src: "assets/images/work_surreal_audio.jpg", alt: "Surreal Sound Center-Label Vintage Pressing" },
          { src: "assets/images/gallery_vinyl.jpg", alt: "Macro 180g Vinyl Micro-Grooves & Spindle Detail" }
        ],
        processImages: [
          { src: "assets/images/proto_drafting.jpg", alt: "Dieline Geometry & Foil-Stamp Embossing Specs" },
          { src: "assets/images/proto_illustration.jpg", alt: "Constructivist Radial Composition Sketches" },
          { src: "assets/images/gallery_cyanotype.jpg", alt: "Matte Varnish Test Pressing Sample Evaluation" }
        ]
      },
      {
        id: "surreal-audio",
        slug: "surreal-audio",
        route: "/projects/surreal-audio",
        alias: ["surreal_sound"],
        category: "graphic",
        categoryLabel: "BRAND IDENTITY",
        shortTitle: "SURREAL AUDIO",
        title: "SURREAL AUDIO — Conceptual Analog Sound Identity",
        tag: "Editorial Print",
        image: "assets/images/work_surreal_audio.jpg",
        shortDesc: "Conceptual album cover artwork merging analog disc pressings with vintage tailoring...",
        description: "An editorial artwork series celebrating tactile vinyl culture and analog warmth. Blends surrealist collage with bespoke serif typography, honoring heritage recording studios and independent vinyl pressing plants.",
        timeline: "2 Months (2024)",
        role: "Brand Identity Designer",
        tools: "Adobe Photoshop, Scanography, Mixed Media Collage",
        deliverable: "Brand Identity Guidelines, Vinyl Jacket Series, Poster Run",
        showcaseImages: [
          { src: "assets/images/work_surreal_audio.jpg", alt: "Surreal Sound Conceptual Center Label" },
          { src: "assets/images/work_vinyl_poster.jpg", alt: "Monochrome Gatefold Inner Sleeve Packaging" },
          { src: "assets/images/gallery_vinyl.jpg", alt: "High-Fidelity Audiophile Grooves Under Studio Light" }
        ],
        processImages: [
          { src: "assets/images/proto_drafting.jpg", alt: "Center Label Diameter & Spindle Die Cut Blueprint" },
          { src: "assets/images/proto_illustration.jpg", alt: "Surrealist Eye & Acoustic Waveform Exploration" },
          { src: "assets/images/gallery_cyanotype.jpg", alt: "Monochrome Archival Print Proofing" }
        ]
      },
      {
        id: "cinema-noir",
        slug: "cinema-noir",
        route: "/projects/cinema-noir",
        alias: ["cinema_noir"],
        category: "graphic",
        categoryLabel: "POSTER DESIGN",
        shortTitle: "CINEMA NOIR",
        title: "CINEMA NOIR — 35mm Independent Film Festival Identity",
        tag: "Screen Print",
        image: "assets/images/work_cinema_reel.jpg",
        shortDesc: "Dynamic 35mm film reel identity celebrating indie cinema festivals and motion picture heritage...",
        description: "Dynamic typographic and motion branding for an international independent cinema festival. Utilizes kinetic 35mm celluloid film loops, silver-foil stamped program guides, and high-contrast duotone silkscreen posters.",
        timeline: "3 Months (2023)",
        role: "Visual Designer & Identity Lead",
        tools: "Illustrator, After Effects, Silkscreen Hand Printing",
        deliverable: "Festival Identity System, Screen-Printed Poster Suite, Trailer Motion",
        showcaseImages: [
          { src: "assets/images/work_cinema_reel.jpg", alt: "Cinema Noir 35mm Celluloid Film Graphic" },
          { src: "assets/images/work_movietime.jpg", alt: "Festival Exhibition Hall Poster Installation" },
          { src: "assets/images/work_avengers_poster.jpg", alt: "Dramatic Character Lighting & Print Finishes" }
        ],
        processImages: [
          { src: "assets/images/proto_drafting.jpg", alt: "Sprocket Hole Grid System & Kinetic Type Layout" },
          { src: "assets/images/proto_illustration.jpg", alt: "High-Contrast Chiaroscuro Storyboarding" },
          { src: "assets/images/gallery_cyanotype.jpg", alt: "Analog Film Bleed & Grain Texture Captures" }
        ]
      },
      {
        id: "heroic-horizons",
        slug: "heroic-horizons",
        route: "/projects/heroic-horizons",
        alias: ["heroic_horizons"],
        category: "graphic",
        categoryLabel: "POSTER ART",
        shortTitle: "HEROIC HORIZONS",
        title: "HEROIC HORIZONS — Cinematic Blockbuster Art & Layout",
        tag: "Cinematic Layout",
        image: "assets/images/work_avengers_poster.jpg",
        shortDesc: "Complex multi-figure blockbuster composition with dramatic lighting and distressed typography...",
        description: "Complex multi-figure character orchestration and atmospheric lighting design celebrating modern cinematic epics. Explores dramatic depth hierarchies, particle destruction overlays, and distressed risograph type lockups.",
        timeline: "2 Months (2023)",
        role: "Key Art Illustrator & Compositor",
        tools: "Photoshop, Cinema 4D, Custom Brushes, Large Format Offset",
        deliverable: "Bus Shelter Key Art, Collector's Edition Foil Print, Promo Assets",
        showcaseImages: [
          { src: "assets/images/work_avengers_poster.jpg", alt: "Heroic Horizons Blockbuster Screenprint" },
          { src: "assets/images/work_cinema_reel.jpg", alt: "Film Strip Framing & Typography" },
          { src: "assets/images/work_movietime.jpg", alt: "Gallery Exhibition Lighting & Print Textures" }
        ],
        processImages: [
          { src: "assets/images/proto_drafting.jpg", alt: "Multi-Plate CMYK + Metallic Spot Ink Registration" },
          { src: "assets/images/proto_illustration.jpg", alt: "Anatomical Dynamic Posing & Lighting Roughs" },
          { src: "assets/images/gallery_cyanotype.jpg", alt: "Serigraph Screen Mesh Density & Squeegee Proofing" }
        ]
      }
    ],

    prototypes: [
      { id: "drafting", step: "STEP 01", tag: "STEP 01 • IDEATION", title: "Technical drafting & pencil dimensions", src: "assets/images/proto_drafting.jpg", tilt: "tilt-left", isExtra: false },
      { id: "3dprint", step: "STEP 02", tag: "STEP 02 • RAPID PROTOTYPING", title: "White resin mechanical joint test", src: "assets/images/proto_3dprint.jpg", tilt: "tilt-right", isExtra: false },
      { id: "cnc", step: "STEP 03", tag: "STEP 03 • PRECISION MILLING", title: "Spindle machining billet components", src: "assets/images/proto_cnc.jpg", tilt: "tilt-slight-left", isExtra: false },
      { id: "illustration", step: "STEP 04", tag: "STEP 04 • SCALE VERIFICATION", title: "Sketch, Model, Make, Test, Repeat.", src: "assets/images/proto_illustration.jpg", tilt: "tilt-slight-right", isExtra: false },
      { id: "extrusion", step: "STEP 05", tag: "STEP 05 • ADDITIVE FABRICATION", title: "Precision nozzle extrusion testing", src: "assets/images/proto_extrusion.jpg", tilt: "tilt-left", isExtra: false },
      { id: "assembly", step: "STEP 06", tag: "STEP 06 • PHYSICAL ASSEMBLY", title: "Hands-on bench assembly & fit check", src: "assets/images/proto_assembly.jpg", tilt: "tilt-right", isExtra: false }
    ],

    protoTagline: "Design. Make. Explore.",
    galleryTagline: "Design. Make. Explore.",
    protoQuote: "Workshop hands are curious hands.",

    gallery: [
      // Column 1 (Left) - Alternating Tall, Square, Tall, Square
      { id: "g1", col: 1, row: 1, type: "card-tall", src: "assets/images/gallery_forest.jpg", caption: "Alpine Pine Forest Mountain Landscape", isExtra: false },
      { id: "g2", col: 1, row: 2, type: "card-square", src: "assets/images/gallery_bottles.jpg", caption: "Industrial Design CAD Wireframe Bottles", isExtra: false },
      { id: "g3", col: 1, row: 3, type: "card-tall", src: "assets/images/gallery_peaks.jpg", caption: "Alpine Night Summit & Star Trails", isExtra: false },
      { id: "g4", col: 1, row: 4, type: "card-square", src: "assets/images/gallery_hills.jpg", caption: "Sunlit Alpine Ridge & Evergreen Hills", isExtra: false },

      // Column 2 (Center) - Alternating Square, Tall, Square, Tall
      { id: "g5", col: 2, row: 1, type: "card-square", src: "assets/images/gallery_astro.png", caption: "Milky Way over Frozen Alpine Lake (Astro 2024)", isExtra: false },
      { id: "g6", col: 2, row: 2, type: "card-tall", src: "assets/images/gallery_snake_scales.jpg", caption: "Macro Iridescent Green Scales Pattern", isExtra: false },
      { id: "g7", col: 2, row: 3, type: "card-square", src: "assets/images/gallery_vinyl.jpg", caption: "Vintage Vinyl & Analog Audio", isExtra: false },
      { id: "g8", col: 2, row: 4, type: "card-tall", src: "assets/images/gallery_flower.jpg", caption: "Cobalt Botanical Flower Blossom Macro", isExtra: false },

      // Column 3 (Right) - Alternating Tall, Square, Tall, Square
      { id: "g9", col: 3, row: 1, type: "card-tall", src: "assets/images/gallery_stream.jpg", caption: "Water Lilies & Sunlit Forest Stream", isExtra: false },
      { id: "g10", col: 3, row: 2, type: "card-square", src: "assets/images/gallery_studio_camera.png", caption: "Studio Workbench & Vintage Cameras", isExtra: false },
      { id: "g11", col: 3, row: 3, type: "card-tall", src: "assets/images/gallery_cyanotype.jpg", caption: "Cyanotype Printmaking & Vintage Camera", isExtra: false },
      { id: "g12", col: 3, row: 4, type: "card-square", src: "assets/images/gallery_moraine_lake.png", caption: "Glacial Moraine Lake Reflections", isExtra: false }
    ],

    connect: {
      title: "LET'S BUILD SOMETHING EXTRAORDINARY",
      desc: "I'm always open to new opportunities, exciting projects and meaningful collaborations. If you have an idea, a project or just want to say hello — let's talk!",
      email: "pawankushwaha1@gmail.com",
      resumeUrl: "assets/PORTFOLIO.pdf",
      mediaType: "image",
      mediaSrc: "assets/images/footer_media.jpg",
      videoSrc: "",
      socials: {
        instagram: "https://instagram.com",
        linkedin: "https://linkedin.com",
        behance: "https://behance.net",
        dribbble: "https://dribbble.com",
        twitter: "https://twitter.com",
        youtube: "https://youtube.com",
        github: "https://github.com"
      },
      badges: [
        { text: "Open for Collabs", icon: "👋", delay: "0.2s" },
        { text: "Let's Build Something Great", icon: "⚡", delay: "2s" }
      ]
    },

    footer: {
      copyright: "© 2026 Pawan Kumar Kushwaha",
      tagline: "Design with curiosity."
    },

    customization: {
      hero: {
        titleSize: 8.8,          // Rem units (slider range 4.0 - 11.0rem, default 8.8)
        lineHeight: 0.86,        // Line height ratio (range 0.70 - 1.30)
        letterSpacing: 0.02,     // Em units (range -0.02 - 0.12em)
        roleSize: 0.88,          // Rem units (range 0.60 - 1.40rem)
        taglineSize: 2.4,        // Rem units (range 1.5 - 3.5rem)
        titleLine1: "PAWAN K.",
        titleLine2: "KUSHWAHA"
      },
      profileImg: {
        scale: 100,              // Percentage (range 50% - 150%)
        offsetX: 0,              // Pixels (range -150px to +150px)
        offsetY: 0,              // Pixels (range -150px to +150px)
        alignment: "center",     // "left", "center", "right"
        layerOrder: "back"       // "back" (behind text, z-index: 1), "front" (in front of text, z-index: 5), "wave-front" (in front of text and wave, z-index: 15)
      },
      colors: {
        primary: "#13294A",      // Master brand color: controls Header Bg, Bold Text, and Buttons from one color
        headerBg: "#13294A",     // Scrolled sticky header & mobile drawer background
        boldText: "#13294A",     // White background bold text (e.g., SELECTED WORK)
        buttons: "#13294A",      // CTA buttons, filter pills, and action controls
        maroon: "#13294A",
        maroonDark: "#0D1C33",
        cream: "#FAF9F6",
        gold: "#E5A93C",
        textDark: "#1F1F1F"
      },
      mobileRestriction: {
        enabled: true, // When true (default): restricts phones & screens < 768px, directing them to laptop/tablet. When false: shows full website directly on mobile.
        image: "assets/images/restriction_character.png",
        title: "Best viewed on a larger screen.",
        desc: "For the full interactive portfolio, open this link on a desktop or tablet.",
        btnText: "Copy portfolio link",
        contactEmail: "pawankushwaha1@gmail.com"
      },
      lens: {
        enabled: false,          // Lens cursor hidden until explicitly requested to appear
        showToggleBtn: false,    // Floating bottom toggle pill hidden
        size: 70,                // Lens diameter in px (40px - 140px)
        scale: 1.65              // Magnification optical scale factor (1.2x - 3.0x)
      },
      backgrounds: {
        hero: {
          type: "color",
          image: null,
          color: "#13294A",
          parallax: false,
          overlayOpacity: 0,
          speed: 1.0
        },
        prototyping: {
          type: "color",
          image: null,
          color: "#13294A",
          parallax: false,
          overlayOpacity: 0,
          speed: 1.0
        },
        connect: {
          type: "color",
          image: null,
          color: "#13294A",
          parallax: false,
          overlayOpacity: 0,
          speed: 1.0
        }
      },
      sections: {
        workTitle: "SELECTED WORK",
        workSubtitle: "Ideas transformed into meaningful, functional experiences.",
        protoTitle: "PROTOTYPING",
        protoSubtitle: "Things I've drafted, 3D printed, CNC machined, and iterated with hands-on curiosity.",
        protoTagline: "Design. Make. Explore.",
        protoQuote: "Design is not just what it looks like and feels like. Design is how it works.",
        galleryTitle: "FIELD NOTES & FRAMES",
        gallerySubtitle: "Visual journal of travels, prototypes, and material inspirations.",
        galleryTagline: "Design. Make. Explore.",
        connectTitle: "LET'S BUILD SOMETHING EXTRAORDINARY",
        connectSubtitle: "I'm always open to new opportunities, exciting projects and meaningful collaborations. If you have an idea, a project or just want to say hello — let's talk!"
      },
      categoryFilters: {
        enabled: true,
        suffix: "Projects",
        productName: "Product Design",
        uiuxName: "UI/UX Design",
        graphicName: "Graphic Design"
      },
      projectPage: {
        backBtnText: "Back To Work",
        coverBtnText: "View research",
        returnBtnText: "Return to Cover",
        autoHideSeconds: 3,
        transitionSpeed: 850,
        showCoverTitle: true,
        coverTitle: true,
        wavesAnimation: true,
        viewResearch: true,
        showViewResearch: true,
        showShowcaseHeader: true,
        showcaseHeaderTitle: "VISUAL SHOWCASE",
        showcaseHeaderSubtitle: "Form, ergonomics, and production detail studies.",
        showcaseHeaderTag: "DESIGN ARCHITECTURE 16:9 SHOWCASE",
        showVerticalSection: true,
        verticalSectionTitle: "VERTICAL STUDIES",
        verticalSectionSubtitle: "Mobile interactions, vertical prototyping, and tactile ergonomics.",
        verticalSectionTag: "MOBILE INTERFACE 9:16 SHOWCASE"
      }
    }
  };



  // Enhance DEFAULT_PORTFOLIO_DATA with schemas
  DEFAULT_PORTFOLIO_DATA.heroCards = INITIAL_HERO_CARDS;
  DEFAULT_PORTFOLIO_DATA.navigation = INITIAL_NAVIGATION;
  DEFAULT_PORTFOLIO_DATA.animation = INITIAL_ANIMATION;
  DEFAULT_PORTFOLIO_DATA.seo = INITIAL_SEO;

  // Standardize projects to have status, slug, featured, contentBlocks
  DEFAULT_PORTFOLIO_DATA.projects = DEFAULT_PORTFOLIO_DATA.projects.map((p, idx) => ({
    ...p,
    status: p.status || 'published',
    slug: p.slug || p.id,
    featured: p.featured !== undefined ? p.featured : (idx < 3),
    order: p.order !== undefined ? p.order : (idx + 1),
    shortDescription: p.shortDesc || p.description,
    createdAt: p.createdAt || '2026-09-01',
    updatedAt: p.updatedAt || '2026-09-27',
    publishedAt: p.publishedAt || '2026-09-27',
    contentBlocks: (p.contentBlocks && p.contentBlocks.length > 0) ? p.contentBlocks : generateDefaultBlocks(p),
    sections: (p.sections && p.sections.length > 0) ? p.sections : generateDefaultSections(p)
  }));

  // =========================================================================
  // PERSISTENT INDEXEDDB MEDIA ENGINE FOR LARGE IMAGES & VIDEOS
  // Solves browser localStorage 5MB quota limitation completely.
  // Supports gigabytes of HD video clips, renders, and photographs.
  // =========================================================================
  const IDB_NAME = 'PortfolioMediaDB';
  const IDB_VERSION = 1;
  const IDB_STORE = 'media';
  let _idbInstance = null;
  let _idbPreloadPromise = null;
  let _idbPreloadDone = false;
  const _mediaUrlCache = new Map();

  function getIDB() {
    if (_idbInstance) return Promise.resolve(_idbInstance);
    return new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      try {
        const req = indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE, { keyPath: 'key' });
          }
        };
        req.onsuccess = (e) => {
          _idbInstance = e.target.result;
          resolve(_idbInstance);
        };
        req.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  }

  function _makeFastThumbnailDataUrl(blobOrFile, maxDim = 900, quality = 0.80) {
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
        reader.readAsDataURL(blobOrFile);
      } catch(err) {
        resolve(null);
      }
    });
  }

  const PortfolioMediaDB = {
    async saveMedia(key, fileOrBlob) {
      if (!key || !fileOrBlob) return false;
      const db = await getIDB();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction([IDB_STORE], 'readwrite');
          const store = tx.objectStore(IDB_STORE);
          const mime = fileOrBlob.type || 'application/octet-stream';
          store.put({
            key: key,
            data: fileOrBlob,
            mimeType: mime,
            updatedAt: Date.now()
          });
          tx.oncomplete = () => {
            if (_mediaUrlCache.has(key)) {
              try { URL.revokeObjectURL(_mediaUrlCache.get(key)); } catch(e) {}
            }
            if (fileOrBlob instanceof Blob) {
              const url = URL.createObjectURL(fileOrBlob);
              _mediaUrlCache.set(key, url);
            } else if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:')) {
              _mediaUrlCache.set(key, fileOrBlob);
            }
            try {
              const m = key.match(/hero_card_(\d)/);
              if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:')) {
                localStorage.setItem(`fast_media_${key}`, fileOrBlob);
                if (m) localStorage.setItem(`fast_hero_card_${m[1]}`, fileOrBlob);
              } else if (fileOrBlob instanceof Blob) {
                if (m) {
                  _makeFastThumbnailDataUrl(fileOrBlob, 900, 0.80).then((thumbUrl) => {
                    if (thumbUrl) {
                      try { localStorage.setItem(`fast_hero_card_${m[1]}`, thumbUrl); } catch(_) {}
                    }
                  });
                }
                if (fileOrBlob.size < 400000) {
                  const r = new FileReader();
                  r.onload = (re) => {
                    try {
                      localStorage.setItem(`fast_media_${key}`, re.target.result);
                    } catch(_) {}
                  };
                  r.readAsDataURL(fileOrBlob);
                }
              }
            } catch(_) {}
            resolve(true);
          };
          tx.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    },

    async getMedia(key) {
      if (!key) return null;
      const db = await getIDB();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction([IDB_STORE], 'readonly');
          const store = tx.objectStore(IDB_STORE);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    },

    async getMediaUrl(key) {
      if (!key) return '';
      if (_mediaUrlCache.has(key)) return _mediaUrlCache.get(key);
      const record = await this.getMedia(key);
      if (!record || !record.data) return '';
      let blob = record.data;
      if (!(blob instanceof Blob)) {
        if (typeof blob === 'string' && blob.startsWith('data:')) {
          try {
            const parts = blob.split(',');
            const mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while(n--) u8arr[n] = bstr.charCodeAt(n);
            blob = new Blob([u8arr], { type: mime });
          } catch(e) {
            return blob;
          }
        } else {
          return '';
        }
      }
      const url = URL.createObjectURL(blob);
      _mediaUrlCache.set(key, url);
      return url;
    },

    resolveUrlSync(src) {
      if (!src || typeof src !== 'string') return src || '';
      if (!src.startsWith('idb://')) return src;
      const key = src.replace(/^idb:\/\//, '');
      if (_mediaUrlCache.has(key)) {
        return _mediaUrlCache.get(key);
      }
      try {
        const m = key.match(/hero_card_(\d)/);
        const fast = localStorage.getItem(`fast_media_${key}`) || (m ? localStorage.getItem(`fast_hero_card_${m[1]}`) : null);
        if (fast) {
          _mediaUrlCache.set(key, fast);
          return fast;
        }
      } catch(_) {}
      // Trigger async fetch and automatically populate any elements using this src
      this.getMediaUrl(key).then(resolvedUrl => {
        if (resolvedUrl && typeof document !== 'undefined') {
          const elements = document.querySelectorAll(`[src="${src}"], [data-src="${src}"], [data-idb-src="${src}"]`);
          elements.forEach(el => {
            if (el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'SOURCE') {
              el.src = resolvedUrl;
              if (el.tagName === 'VIDEO' && el.autoplay) {
                el.muted = true;
                el.play().catch(() => {});
              }
            } else if (el.style && el.style.backgroundImage && el.style.backgroundImage.includes(src)) {
              el.style.backgroundImage = `url('${resolvedUrl}')`;
            }
          });
        }
      });
      return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
    },

    async storeFile(file, keyPrefix = 'media') {
      if (!file) return '';
      const key = `${keyPrefix}_${Date.now()}`;
      const saved = await this.saveMedia(key, file);
      if (saved) {
        return `idb://${key}`;
      }
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    },

    isReady() {
      return _idbPreloadDone;
    },

    waitForReady(timeoutMs = 600) {
      if (_idbPreloadDone) return Promise.resolve(true);
      if (!_idbPreloadPromise) this.preloadAll();
      return Promise.race([
        _idbPreloadPromise,
        new Promise(r => setTimeout(() => r(false), timeoutMs))
      ]);
    },

    preloadAll() {
      if (_idbPreloadPromise) return _idbPreloadPromise;
      _idbPreloadPromise = (async () => {
        const db = await getIDB();
        if (!db) {
          _idbPreloadDone = true;
          return false;
        }
        return new Promise((resolve) => {
          try {
            const tx = db.transaction([IDB_STORE], 'readonly');
            const store = tx.objectStore(IDB_STORE);
            const req = store.openCursor();
            req.onsuccess = (e) => {
              const cursor = e.target.result;
              if (cursor) {
                const val = cursor.value;
                if (val && val.key && val.data && !_mediaUrlCache.has(val.key)) {
                  try {
                    if (val.data instanceof Blob) {
                      _mediaUrlCache.set(val.key, URL.createObjectURL(val.data));
                    } else if (typeof val.data === 'string' && val.data.startsWith('data:')) {
                      _mediaUrlCache.set(val.key, val.data);
                    }
                    try {
                      const m = val.key.match(/hero_card_(\d)/);
                      if (m) {
                        if (typeof val.data === 'string' && val.data.startsWith('data:')) {
                          localStorage.setItem('fast_hero_card_' + m[1], val.data);
                        } else if (val.data instanceof Blob && !localStorage.getItem('fast_hero_card_' + m[1])) {
                          _makeFastThumbnailDataUrl(val.data, 900, 0.80).then((thumbUrl) => {
                            if (thumbUrl) {
                              try { localStorage.setItem('fast_hero_card_' + m[1], thumbUrl); } catch(_) {}
                            }
                          });
                        }
                      }
                    } catch(err) {}
                  } catch(err) {}
                }
                cursor.continue();
              } else {
                _idbPreloadDone = true;
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('portfolioMediaReady'));
                }
                resolve(true);
              }
            };
            req.onerror = () => {
              _idbPreloadDone = true;
              resolve(false);
            };
          } catch (e) {
            _idbPreloadDone = true;
            resolve(false);
          }
        });
      })();
      return _idbPreloadPromise;
    },

    async compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.88) {
      if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        return file;
      }
      if (file.size < 350 * 1024) return file;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > maxWidth || height > maxHeight) {
              if (width / height > maxWidth / maxHeight) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob && blob.size < file.size) {
                resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
              } else {
                resolve(file);
              }
            }, 'image/jpeg', quality);
          };
          img.onerror = () => resolve(file);
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
      });
    }
  };

  // Start preloading immediately in background
  PortfolioMediaDB.preloadAll();

  // Expose globally
  window.PortfolioMediaDB = PortfolioMediaDB;

  const PortfolioData = {
    generateDefaultSections: generateDefaultSections,
    generateDefaultBlocks: generateDefaultBlocks,

    /**
     * Get active published portfolio data (Synchronous for zero-delay hydration)
     */
    get() {
      try {
        let saved = null;
        try {
          saved = localStorage.getItem(STORAGE_KEY_DATA);
        } catch (e) {}
        if (!saved && typeof sessionStorage !== 'undefined') {
          try { saved = sessionStorage.getItem(STORAGE_KEY_DATA); } catch (e) {}
        }
        if (!saved && window._activePortfolioData) {
          try { saved = JSON.stringify(window._activePortfolioData); } catch (e) {}
        }
        if (saved) {
          const parsed = JSON.parse(saved);
          const rawProjects = (parsed.projects && Array.isArray(parsed.projects))
            ? parsed.projects
            : DEFAULT_PORTFOLIO_DATA.projects;
          
          const SLUG_MAP = {
            'kinetic_chair': 'kinetic-chair',
            'gantri': 'gantt-lamp',
            'modu_bottles': 'modu-bottle',
            'chassis_m1': 'chassis-m1',
            'apex_gears': 'apex-gears',
            'wellness': 'wellness-journey',
            'movietime': 'movie-time',
            'vinyl_grooves': 'vinyl-grooves',
            'surreal_sound': 'surreal-audio',
            'cinema_noir': 'cinema-noir',
            'heroic_horizons': 'heroic-horizons'
          };

          const projectsWithBlocks = rawProjects.map(p => {
            const canonicalSlug = SLUG_MAP[p.id] || p.slug || p.id.replace(/_/g, '-');
            const canonicalId = canonicalSlug;
            const canonicalRoute = `/projects/${canonicalSlug}`;
            const aliasList = Array.isArray(p.alias) ? [...p.alias] : [];
            if (p.id && p.id !== canonicalId && !aliasList.includes(p.id)) {
              aliasList.push(p.id);
            }
            return {
              ...p,
              id: canonicalId,
              slug: canonicalSlug,
              route: canonicalRoute,
              alias: aliasList,
              status: p.status || 'published',
              image: (p.image && p.image.includes('thumb_lizard.jpg')) ? 'assets/images/work_chair.jpg' : (p.image || ''),
              featured: p.featured !== undefined ? p.featured : true,
              desc1: p.desc1 || (p.content && p.content.desc1) || (p.description ? p.description.split('\n\n')[0] : '') || p.shortDesc || '',
              desc2: p.desc2 || (p.content && p.content.desc2) || (p.description && p.description.includes('\n\n') ? p.description.split('\n\n')[1] : '') || '',
              projectBrief: p.projectBrief || (p.content && p.content.brief) || p.brief || p.desc1 || '',
              brief: p.projectBrief || (p.content && p.content.brief) || p.brief || p.desc1 || '',
              features: (Array.isArray(p.features) && p.features.length > 0) ? p.features : (p.content && Array.isArray(p.content.features) ? p.content.features : (p.features || [])),
              content: {
                timeline: p.timeline || '',
                role: p.role || '',
                tools: p.tools || '',
                deliverable: p.deliverable || '',
                showcaseImages: p.showcaseImages || [],
                processImages: p.processImages || [],
                verticalImages: p.verticalImages || [],
                ...(p.content || {}),
                brief: p.projectBrief || (p.content && p.content.brief) || p.brief || p.shortDesc || '',
                desc1: p.desc1 || (p.content && p.content.desc1) || p.shortDesc || '',
                desc2: p.desc2 || (p.content && p.content.desc2) || '',
                features: (Array.isArray(p.features) && p.features.length > 0) ? p.features : (p.content && Array.isArray(p.content.features) ? p.content.features : (p.features || []))
              },
              sections: (p.sections && Array.isArray(p.sections) && p.sections.length > 0)
                ? p.sections
                : generateDefaultSections(p),
              contentBlocks: (p.contentBlocks && Array.isArray(p.contentBlocks) && p.contentBlocks.length > 0)
                ? p.contentBlocks
                : generateDefaultBlocks(p)
            };
          });

          const profileData = { ...DEFAULT_PORTFOLIO_DATA.profile, ...(parsed.profile || {}) };
          if (profileData.ctaStoryText === "Read About" || profileData.ctaStoryText === "read about") {
            profileData.ctaStoryText = "Send an Email";
          }
          if (profileData.ctaStoryUrl === "about.html" || !profileData.ctaStoryUrl) {
            profileData.ctaStoryUrl = "mailto:pawankushwaha1@gmail.com";
          }

          return {
            ...DEFAULT_PORTFOLIO_DATA,
            ...parsed,
            projects: projectsWithBlocks,
            heroCards: (parsed.heroCards && Array.isArray(parsed.heroCards) && parsed.heroCards.length > 0) ? parsed.heroCards : DEFAULT_PORTFOLIO_DATA.heroCards,
            prototypes: (parsed.prototypes && Array.isArray(parsed.prototypes)) ? parsed.prototypes : DEFAULT_PORTFOLIO_DATA.prototypes,
            gallery: (parsed.gallery && Array.isArray(parsed.gallery) && parsed.gallery.length === 12) ? parsed.gallery : DEFAULT_PORTFOLIO_DATA.gallery,
            navigation: { ...DEFAULT_PORTFOLIO_DATA.navigation, ...(parsed.navigation || {}) },
            animation: { ...DEFAULT_PORTFOLIO_DATA.animation, ...(parsed.animation || {}) },
            seo: { ...DEFAULT_PORTFOLIO_DATA.seo, ...(parsed.seo || {}) },
            profile: profileData,
            about: (function() {
              const ab = { ...DEFAULT_PORTFOLIO_DATA.about, ...(parsed.about || {}) };
              if (!ab.tools || !Array.isArray(ab.tools) || ab.tools.length === 0 || (ab.tools.length === 6 && (ab.tools[4]?.id === 'tool-blender' || ab.tools[4]?.preset === 'blender' || ab.tools[0]?.customImage === 'assets/images/tool_fusion.png'))) {
                ab.tools = DEFAULT_PORTFOLIO_DATA.about.tools;
              }
              return ab;
            })(),
            sectionDivider: { ...DEFAULT_PORTFOLIO_DATA.sectionDivider, ...(parsed.sectionDivider || {}) },
            categories: (function() {
              const cats = (parsed.categories && Array.isArray(parsed.categories)) ? parsed.categories : DEFAULT_PORTFOLIO_DATA.categories;
              const cf = parsed.customization?.categoryFilters;
              if (cf) {
                return cats.map(c => {
                  if (c.id === 'product' && cf.productName) return { ...c, name: cf.productName };
                  if (c.id === 'uiux' && cf.uiuxName) return { ...c, name: cf.uiuxName };
                  if (c.id === 'graphic' && cf.graphicName) return { ...c, name: cf.graphicName };
                  return c;
                });
              }
              return cats;
            })(),
            sections: {
              ...DEFAULT_PORTFOLIO_DATA.sections,
              ...(parsed.sections || {})
            },
            connect: {
              ...DEFAULT_PORTFOLIO_DATA.connect,
              ...(parsed.connect || {}),
              socials: { ...DEFAULT_PORTFOLIO_DATA.connect.socials, ...(parsed.connect?.socials || {}) }
            },
            footer: { ...DEFAULT_PORTFOLIO_DATA.footer, ...(parsed.footer || {}) },
            customization: {
              ...DEFAULT_PORTFOLIO_DATA.customization,
              ...(parsed.customization || {}),
              hero: { ...DEFAULT_PORTFOLIO_DATA.customization.hero, ...(parsed.customization?.hero || {}) },
              colors: { ...DEFAULT_PORTFOLIO_DATA.customization.colors, ...(parsed.customization?.colors || {}) },
              mobileRestriction: { ...DEFAULT_PORTFOLIO_DATA.customization.mobileRestriction, ...(parsed.customization?.mobileRestriction || {}) },
              backgrounds: { ...DEFAULT_PORTFOLIO_DATA.customization.backgrounds, ...(parsed.customization?.backgrounds || {}) },
              sections: { ...DEFAULT_PORTFOLIO_DATA.customization.sections, ...(parsed.customization?.sections || {}) },
              categoryFilters: { ...DEFAULT_PORTFOLIO_DATA.customization.categoryFilters, ...(parsed.customization?.categoryFilters || {}) },
              projectPage: (function() {
                const pp = { ...DEFAULT_PORTFOLIO_DATA.customization.projectPage, ...(parsed.customization?.projectPage || {}) };
                if (pp.coverTitleSet === undefined && parsed.customization?.projectPage?.showCoverTitle === false) {
                  pp.showCoverTitle = true;
                  pp.coverTitle = true;
                }
                return pp;
              })()
            }
          };
        }
      } catch (err) {
        console.error('Error reading portfolio custom data:', err);
      }
      const base = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
      base.projects = base.projects.map(p => ({
        ...p,
        content: p.content || {
          brief: p.projectBrief || p.shortDesc || '',
          desc1: p.desc1 || p.shortDesc || '',
          desc2: p.desc2 || '',
          features: p.features || [],
          timeline: p.timeline || '',
          role: p.role || '',
          tools: p.tools || '',
          deliverable: p.deliverable || '',
          showcaseImages: p.showcaseImages || [],
          processImages: p.processImages || [],
          verticalImages: p.verticalImages || []
        }
      }));
      return base;
    },

    /**
     * Save active data with multi-channel persistence and broadcasting
     */
    save(data, options = {}) {
      try {
        if (!data || typeof data !== 'object') {
          console.error('PortfolioData.save: invalid data object provided');
          return false;
        }

        data.updatedAt = new Date().toISOString();
        window._activePortfolioData = data;

        // Auto-migrate oversized Base64 media (> 64KB) to IndexedDB to guarantee localStorage quota safety
        try {
          const checkAndMigrate = (obj, path) => {
            if (!obj || typeof obj !== 'object') return;
            for (const k of Object.keys(obj)) {
              const val = obj[k];
              if (typeof val === 'string' && val.startsWith('data:') && val.length > 65536) {
                const mediaKey = `media_auto_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                PortfolioMediaDB.saveMedia(mediaKey, val);
                obj[k] = `idb://${mediaKey}`;
              } else if (val && typeof val === 'object') {
                checkAndMigrate(val, path + '.' + k);
              }
            }
          };
          checkAndMigrate(data, 'root');
        } catch (mErr) {
          console.warn('Media auto-migration notice:', mErr);
        }

        const serialized = JSON.stringify(data);

        // 1. Primary Persistent Storage (localStorage)
        let lsSuccess = false;
        try {
          localStorage.setItem(STORAGE_KEY_DATA, serialized);
          lsSuccess = true;
        } catch (lsErr) {
          console.warn('localStorage save warning (quota or restricted):', lsErr);
          try {
            // Free up stale cache keys if localStorage is near quota
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const k = localStorage.key(i);
              if (k && (k.startsWith('fast_media_') || k.startsWith('fast_hero_card_') || k.startsWith('portfolio_cache_'))) {
                localStorage.removeItem(k);
              }
            }
            // Second pass: migrate any remaining data: URIs over 10KB
            const stripped = JSON.parse(serialized);
            const deepMigrate = (obj) => {
              if (!obj || typeof obj !== 'object') return;
              for (const k of Object.keys(obj)) {
                if (typeof obj[k] === 'string' && obj[k].startsWith('data:')) {
                  const mediaKey = `media_auto_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                  PortfolioMediaDB.saveMedia(mediaKey, obj[k]);
                  obj[k] = `idb://${mediaKey}`;
                } else if (typeof obj[k] === 'object') {
                  deepMigrate(obj[k]);
                }
              }
            };
            deepMigrate(stripped);
            localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(stripped));
            lsSuccess = true;
          } catch(stripErr) {
            console.warn('localStorage secondary save note:', stripErr);
          }
        }

        // 2. Secondary Session Storage (sessionStorage)
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(STORAGE_KEY_DATA, serialized);
          }
        } catch (e) {}

        // 3. Dispatch in current window
        window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: data }));

        // 4. Multi-tab BroadcastChannel push
        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const bc = new BroadcastChannel('portfolio_sync_channel');
            bc.postMessage({ type: 'PORTFOLIO_DATA_UPDATED', data: data, updatedAt: data.updatedAt });
            bc.close();
          } catch (e) {}
        }

        // 5. PostMessage to any iframes (e.g. In-Admin Live Preview) or window.opener
        try {
          const iframes = document.querySelectorAll('iframe');
          iframes.forEach(fr => {
            try {
              fr.contentWindow?.postMessage({ type: 'PORTFOLIO_DATA_UPDATED', data: data }, '*');
            } catch (e) {}
          });
          if (window.opener && window.opener !== window) {
            window.opener.postMessage({ type: 'PORTFOLIO_DATA_UPDATED', data: data }, '*');
          }
        } catch (e) {}

        // 6. Multi-Device Cloud Sync Push (if enabled)
        if (!options || !options.skipCloudPush) {
          try {
            const cloudCfg = this.getCloudSyncConfig();
            if (cloudCfg && cloudCfg.enabled && cloudCfg.autoPushOnSave) {
              this.pushToCloud(data).catch((pErr) => {
                console.warn('Auto cloud push notice:', pErr);
              });
            }
          } catch (e) {}
        }

        return true;
      } catch (err) {
        console.error('Error saving portfolio data:', err);
        return false;
      }
    },

    /**
     * Check if the mobile screen restriction notice is enabled
     */
    isMobileRestrictionEnabled() {
      const data = this.get();
      return data?.customization?.mobileRestriction?.enabled !== false;
    },

    /**
     * Get mobile restriction configuration object
     */
    getMobileRestrictionConfig() {
      const data = this.get();
      return {
        ...DEFAULT_PORTFOLIO_DATA.customization.mobileRestriction,
        ...(data?.customization?.mobileRestriction || {})
      };
    },

    /**
     * Turn mobile screen restriction ON or OFF
     * @param {boolean} enabled - true to show restriction notice on mobile; false to show full website
     */
    setMobileRestriction(enabled) {
      const data = this.get();
      data.customization = data.customization || {};
      data.customization.mobileRestriction = data.customization.mobileRestriction || {};
      data.customization.mobileRestriction.enabled = Boolean(enabled);
      const res = this.save(data);
      try {
        window.dispatchEvent(new CustomEvent('portfolio-data-updated', { detail: { mobileRestriction: data.customization.mobileRestriction } }));
      } catch (e) {}
      return res;
    },

    /**
     * Update lock screen illustration image
     * @param {string} imageUrl - path or base64 or URL to image
     */
    setMobileRestrictionImage(imageUrl) {
      const data = this.get();
      data.customization = data.customization || {};
      data.customization.mobileRestriction = data.customization.mobileRestriction || {};
      data.customization.mobileRestriction.image = imageUrl || 'assets/images/restriction_character.png';
      const res = this.save(data);
      try {
        window.dispatchEvent(new CustomEvent('portfolio-data-updated', { detail: { mobileRestriction: data.customization.mobileRestriction } }));
      } catch (e) {}
      return res;
    },

    /**
     * Update full mobile restriction configuration
     */
    setMobileRestrictionConfig(config) {
      const data = this.get();
      data.customization = data.customization || {};
      data.customization.mobileRestriction = {
        ...(data.customization.mobileRestriction || {}),
        ...config
      };
      const res = this.save(data);
      try {
        window.dispatchEvent(new CustomEvent('portfolio-data-updated', { detail: { mobileRestriction: data.customization.mobileRestriction } }));
      } catch (e) {}
      return res;
    },

    /**
     * Reset back to factory default data
     */
    resetDefaults() {
      try {
        localStorage.removeItem(STORAGE_KEY_DATA);
        window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: DEFAULT_PORTFOLIO_DATA }));
        return true;
      } catch (e) {
        return false;
      }
    },

    /**
     * Resolve all local idb:// media references into self-contained portable Data URLs
     * Guarantees that exported JSON or cloud-synced datasets work across any device worldwide
     */
    getPortableData(targetData) {
      const raw = targetData || this.get();
      const clone = JSON.parse(JSON.stringify(raw));
      
      const resolveIdbRef = (val) => {
        if (typeof val !== 'string' || !val.startsWith('idb://')) return val;
        const key = val.replace('idb://', '');
        if (window.PortfolioMediaDB && typeof window.PortfolioMediaDB.resolveUrlSync === 'function') {
          const resolved = window.PortfolioMediaDB.resolveUrlSync(val);
          if (resolved && !resolved.startsWith('idb://') && !resolved.startsWith('blob:')) {
            return resolved;
          }
        }
        try {
          const m = key.match(/hero_card_(\d)/);
          if (m) {
            const fast = localStorage.getItem('fast_hero_card_' + m[1]);
            if (fast && !fast.startsWith('idb://') && !fast.startsWith('blob:')) {
              return fast;
            }
          }
          const fastMedia = localStorage.getItem('fast_media_' + key);
          if (fastMedia && !fastMedia.startsWith('idb://') && !fastMedia.startsWith('blob:')) {
            return fastMedia;
          }
        } catch(e) {}
        return val;
      };

      const deepResolve = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        for (const k of Object.keys(obj)) {
          if (typeof obj[k] === 'string' && obj[k].startsWith('idb://')) {
            obj[k] = resolveIdbRef(obj[k]);
          } else if (typeof obj[k] === 'object') {
            deepResolve(obj[k]);
          }
        }
      };

      deepResolve(clone);

      // Automatically slim down redundant and empty fields so payload stays well under cloud limits (42 KB instead of 102 KB)
      if (clone.projects && Array.isArray(clone.projects)) {
        clone.projects.forEach(p => {
          delete p.contentBlocks;
          delete p.sections;
          delete p.content;
          delete p.blocks;
          if (Array.isArray(p.alias) && p.alias.length === 0) delete p.alias;
          if (!p.focalPoint) delete p.focalPoint;
          if (p.shortDescription && p.shortDescription === p.shortDesc) delete p.shortDescription;
          if (!p.publishedAt) delete p.publishedAt;
          if (p.desc1 === p.shortDesc) delete p.desc1;
          if (p.features && p.features.length === 0) delete p.features;
        });
      }

      clone.updatedAt = new Date().toISOString();
      return clone;
    },

    /**
     * Asynchronously resolve all local idb:// media references into self-contained portable Base64 Data URLs
     * Reads directly from IndexedDB so exported files or cloud commits are 100% self-contained across all devices
     */
    async getPortableDataAsync(targetData) {
      const raw = targetData || this.get();
      const clone = JSON.parse(JSON.stringify(raw));

      const blobToDataUrl = (blob) => {
        return new Promise((resolve) => {
          if (!blob) return resolve('');
          if (typeof blob === 'string') return resolve(blob);
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(blob);
        });
      };

      const resolveIdbRefAsync = async (val) => {
        if (typeof val !== 'string' || !val.startsWith('idb://')) return val;
        const key = val.replace(/^idb:\/\//, '');

        // 1. Check fast localStorage cache first
        try {
          const fast = localStorage.getItem(`fast_media_${key}`);
          if (fast && fast.startsWith('data:')) return fast;
          const m = key.match(/hero_card_(\d)/);
          if (m) {
            const fastHc = localStorage.getItem(`fast_hero_card_${m[1]}`);
            if (fastHc && fastHc.startsWith('data:')) return fastHc;
          }
        } catch(e) {}

        // 2. Query IndexedDB directly for original media record
        if (window.PortfolioMediaDB && typeof window.PortfolioMediaDB.getMedia === 'function') {
          try {
            const record = await window.PortfolioMediaDB.getMedia(key);
            if (record && record.data) {
              if (typeof record.data === 'string' && record.data.startsWith('data:')) {
                return record.data;
              } else if (record.data instanceof Blob) {
                const dataUrl = await blobToDataUrl(record.data);
                if (dataUrl) return dataUrl;
              }
            }
          } catch(e) {}
        }

        return val;
      };

      const deepResolveAsync = async (obj) => {
        if (!obj || typeof obj !== 'object') return;
        for (const k of Object.keys(obj)) {
          if (typeof obj[k] === 'string' && obj[k].startsWith('idb://')) {
            obj[k] = await resolveIdbRefAsync(obj[k]);
          } else if (typeof obj[k] === 'object') {
            await deepResolveAsync(obj[k]);
          }
        }
      };

      await deepResolveAsync(clone);

      // Automatically slim down redundant and empty fields so payload stays compact
      if (clone.projects && Array.isArray(clone.projects)) {
        clone.projects.forEach(p => {
          delete p.contentBlocks;
          delete p.sections;
          delete p.content;
          delete p.blocks;
          if (Array.isArray(p.alias) && p.alias.length === 0) delete p.alias;
          if (!p.focalPoint) delete p.focalPoint;
          if (p.shortDescription && p.shortDescription === p.shortDesc) delete p.shortDescription;
          if (!p.publishedAt) delete p.publishedAt;
          if (p.desc1 === p.shortDesc) delete p.desc1;
          if (p.features && p.features.length === 0) delete p.features;
        });
      }

      clone.updatedAt = new Date().toISOString();
      return clone;
    },

    /**
     * Compress all base64 data URLs in a portable dataset to keep payload well under 100KB for JSONBin
     */
    async compressPortableMedia(obj, maxDim = 480, quality = 0.55) {
      if (!obj || typeof obj !== 'object') return obj;

      const compressDataUrl = (dataUrl) => {
        return new Promise((resolve) => {
          if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/') || typeof document === 'undefined') {
            return resolve(dataUrl);
          }
          if (dataUrl.length < 18000) return resolve(dataUrl);
          try {
            const img = new Image();
            img.onload = () => {
              try {
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                  if (w > h) {
                    h = Math.round((h * maxDim) / w);
                    w = maxDim;
                  } else {
                    w = Math.round((w * maxDim) / h);
                    h = maxDim;
                  }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL('image/jpeg', quality);
                resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
              } catch(e) {
                resolve(dataUrl);
              }
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
          } catch(e) {
            resolve(dataUrl);
          }
        });
      };

      const recurse = async (item) => {
        if (!item || typeof item !== 'object') return;
        for (const k of Object.keys(item)) {
          if (typeof item[k] === 'string' && item[k].startsWith('data:image/')) {
            item[k] = await compressDataUrl(item[k]);
          } else if (typeof item[k] === 'object') {
            await recurse(item[k]);
          }
        }
      };

      await recurse(obj);
      return obj;
    },

    /**
     * Export all data as downloadable JSON file with resolved portable media
     */
    async exportJSON() {
      const data = await this.getPortableDataAsync();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    /**
     * Download clean portfolio-data.json ready to drop into repository root for Netlify
     */
    async exportNetlifyDataJSON() {
      const data = await this.getPortableDataAsync();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    /**
     * Get multi-device cloud synchronization configuration
     */
    getCloudSyncConfig() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_CLOUD_SYNC);
        if (raw) return JSON.parse(raw);
      } catch(e) {}
      return {
        enabled: false,
        provider: 'github',
        endpointUrl: '',
        apiKey: '',
        githubRepo: 'pawankushwaha1/Portfolio',
        githubToken: '',
        githubBranch: 'main',
        githubPath: 'portfolio-data.json',
        autoPushOnSave: true,
        lastSyncTime: null
      };
    },

    /**
     * Save multi-device cloud synchronization configuration
     */
    saveCloudSyncConfig(cfg) {
      try {
        localStorage.setItem(STORAGE_KEY_CLOUD_SYNC, JSON.stringify(cfg));
        window.dispatchEvent(new CustomEvent('portfolioCloudConfigUpdated', { detail: cfg }));
        return true;
      } catch(e) {
        return false;
      }
    },

    /**
     * Mutex state for cloud sync pushes
     */
    _isPushing: false,
    _pushQueue: null,
    _activePushPromise: null,

    /**
     * Push active dataset to configured Cloud Database (GitHub Auto-Deploy, JSONBin, or REST API)
     * Protected by mutex queue to prevent racing concurrent commits
     */
    async pushToCloud(data) {
      if (this._isPushing) {
        console.log('[CloudSync] A push is already in progress. Queuing request...');
        if (!this._pushQueue) {
          this._pushQueue = (async () => {
            try {
              await this._activePushPromise;
            } catch(e) {}
            this._pushQueue = null;
            return await this.pushToCloud(data);
          })();
        }
        return await this._pushQueue;
      }

      this._isPushing = true;
      this._activePushPromise = (async () => {
        try {
          return await this._executePushToCloud(data);
        } finally {
          this._isPushing = false;
        }
      })();

      return await this._activePushPromise;
    },

    /**
     * Internal implementation of cloud push with auto-retry and SHA reconciliation
     */
    async _executePushToCloud(data) {
      const cfg = this.getCloudSyncConfig();
      if (!cfg || !cfg.enabled) {
        return { success: false, error: 'Cloud sync is disabled. Enable it in the Cloud Sync tab.' };
      }

      // Crucial: Resolve all local idb:// media references to self-contained Base64 Data URLs so other devices render them
      const portable = await this.getPortableDataAsync(data || this.get());

      // 1. GitHub Direct Commit (Triggers Netlify Auto-Deploy)
      if (cfg.provider === 'github') {
        if (!cfg.githubRepo) {
          return { success: false, error: 'GitHub repository is missing (e.g. pawankushwaha1/Portfolio).' };
        }
        if (!cfg.githubToken) {
          return { success: false, error: 'Personal Access Token (PAT) is required to push to GitHub. Generate one with repo scope at github.com/settings/tokens.' };
        }
        try {
          const path = cfg.githubPath || 'portfolio-data.json';
          const branch = cfg.githubBranch || 'main';
          const cleanRepo = cfg.githubRepo.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/^\/+|\/+$/g, '');
          const jsonStr = JSON.stringify(portable, null, 2);

          // Chunked, stack-safe Unicode Base64 encoding for payloads of any size
          let b64Content;
          if (typeof TextEncoder !== 'undefined') {
            const bytes = new TextEncoder().encode(jsonStr);
            let binary = '';
            const len = bytes.byteLength;
            const chunkSize = 0x8000;
            for (let i = 0; i < len; i += chunkSize) {
              binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)));
            }
            b64Content = btoa(binary);
          } else {
            b64Content = btoa(unescape(encodeURIComponent(jsonStr)));
          }

          const authHeader = (cfg.githubToken.startsWith('ghp_') ? `token ${cfg.githubToken}` : `Bearer ${cfg.githubToken}`);

          // Robust SHA retrieval using cache-busting timestamp (no forbidden CORS headers)
          const getLatestSha = async () => {
            try {
              const checkRes = await fetch(`https://api.github.com/repos/${cleanRepo}/contents/${path}?ref=${encodeURIComponent(branch)}&t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                  'Authorization': authHeader,
                  'Accept': 'application/vnd.github.v3+json'
                }
              });
              if (checkRes.ok || checkRes.status === 200) {
                const fileData = await checkRes.json();
                return fileData.sha || null;
              }
            } catch(e) {}
            return null;
          };

          // Secondary tree lookup if contents endpoint fails
          const getShaFromTree = async () => {
            try {
              const treeRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/trees/${encodeURIComponent(branch)}?t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                  'Authorization': authHeader,
                  'Accept': 'application/vnd.github.v3+json'
                }
              });
              if (treeRes.ok) {
                const treeData = await treeRes.json();
                if (treeData && Array.isArray(treeData.tree)) {
                  const entry = treeData.tree.find(item => item.path === path);
                  if (entry && entry.sha) return entry.sha;
                }
              }
            } catch(e) {}
            return null;
          };

          const commitFile = async (currentSha) => {
            const putBody = {
              message: `Update portfolio content via Admin Panel`,
              content: b64Content,
              branch: branch
            };
            if (currentSha) putBody.sha = currentSha;

            return await fetch(`https://api.github.com/repos/${cleanRepo}/contents/${path}`, {
              method: 'PUT',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
              },
              body: JSON.stringify(putBody)
            });
          };

          let putRes = null;
          let lastErrText = '';

          // Retry loop: up to 3 attempts with fresh SHA fetching on 409 Conflict or 422
          for (let attempt = 1; attempt <= 3; attempt++) {
            let sha = await getLatestSha();
            if (!sha) sha = await getShaFromTree();

            putRes = await commitFile(sha);

            if (putRes.ok) {
              break; // Commit successful!
            }

            lastErrText = await putRes.text();
            console.warn(`[GitHub Push] Attempt ${attempt} returned status ${putRes.status}:`, lastErrText);

            if ((putRes.status === 409 || putRes.status === 422) && attempt < 3) {
              // Wait for GitHub's git ref cache to settle before fetching new SHA and retrying
              await new Promise(r => setTimeout(r, 600 * attempt));
              continue;
            } else {
              break;
            }
          }

          if (!putRes || !putRes.ok) {
            let parsedMsg = lastErrText;
            try {
              const errJson = JSON.parse(lastErrText);
              if (errJson && errJson.message) parsedMsg = errJson.message.replace(/\n+/g, ' ');
            } catch(e) {}
            throw new Error(`GitHub error (${putRes ? putRes.status : 'network'}): ${parsedMsg}`);
          }

          cfg.lastSyncTime = new Date().toISOString();
          this.saveCloudSyncConfig(cfg);
          window.dispatchEvent(new CustomEvent('portfolioCloudSyncSuccess', { detail: { provider: 'github', timestamp: cfg.lastSyncTime } }));
          return { success: true, provider: 'github', timestamp: cfg.lastSyncTime };
        } catch(ghErr) {
          return { success: false, error: ghErr.message };
        }
      }

      // 2. Generic REST / JSONBin.io Endpoint Push
      if (cfg.endpointUrl) {
        try {
          let targetUrl = cfg.endpointUrl;
          const isJsonBin = (cfg.provider === 'jsonbin' || targetUrl.includes('jsonbin.io'));
          if (isJsonBin) {
            targetUrl = normalizeJsonBinUrl(targetUrl);
            await this.compressPortableMedia(portable, 480, 0.55);
          }

          const payloadStr = JSON.stringify(portable);
          const payloadSize = (typeof Blob !== 'undefined') ? new Blob([payloadStr]).size : payloadStr.length;

          if (isJsonBin && payloadSize > 98000) {
            return {
              success: false,
              error: `Payload size (${(payloadSize / 1024).toFixed(1)} KB) exceeds JSONBin free tier limit of 100 KB. Switch Provider to "GitHub Auto-Deploy" (100 MB limit) or use Option A (1-Click Netlify download).`
            };
          }

          const headers = {
            'Content-Type': 'application/json'
          };
          if (cfg.apiKey) {
            headers['X-Master-Key'] = cfg.apiKey;
            headers['X-Access-Key'] = cfg.apiKey;
            headers['Authorization'] = `Bearer ${cfg.apiKey}`;
          }

          const res = await fetch(targetUrl, {
            method: 'PUT',
            headers: headers,
            body: payloadStr
          });

          if (!res.ok) {
            let errText = await res.text();
            try {
              const errJson = JSON.parse(errText);
              if (errJson && errJson.message) {
                if (errJson.message.includes('100kb') || res.status === 403) {
                  errText = 'JSONBin free tier limit (100 KB) exceeded. Please switch Provider to "GitHub Auto-Deploy" for 100 MB limit, or use Option A.';
                } else {
                  errText = errJson.message;
                }
              }
            } catch(e) {}
            throw new Error(`Cloud endpoint returned status ${res.status}: ${errText}`);
          }

          cfg.lastSyncTime = new Date().toISOString();
          this.saveCloudSyncConfig(cfg);
          window.dispatchEvent(new CustomEvent('portfolioCloudSyncSuccess', { detail: { provider: cfg.provider || 'cloud', timestamp: cfg.lastSyncTime } }));
          return { success: true, provider: cfg.provider || 'cloud', timestamp: cfg.lastSyncTime };
        } catch(restErr) {
          return { success: false, error: restErr.message };
        }
      }

      return { success: false, error: 'Incomplete cloud sync configuration. Please check your settings.' };
    },

    /**
     * Load published portfolio data from server (portfolio-data.json) or Cloud Database
     * Automatically synchronizes fresh devices, phones, and tablets with the latest published edits
     */
    async loadRemoteData() {
      try {
        const cloudCfg = this.getCloudSyncConfig();
        let remoteData = null;
        let source = null;

        // 1. Try GitHub Direct Raw (Instant worldwide CDN sync for all phones, tablets & devices)
        const targetRepo = (cloudCfg && cloudCfg.githubRepo) ? cloudCfg.githubRepo : 'pawankushwaha1/Portfolio';
        const targetBranch = (cloudCfg && cloudCfg.githubBranch) ? cloudCfg.githubBranch : 'main';
        const targetPath = (cloudCfg && cloudCfg.githubPath) ? cloudCfg.githubPath : 'portfolio-data.json';
        const cleanRepo = targetRepo.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/^\/+|\/+$/g, '');

        if (cleanRepo) {
          try {
            const ghRawUrl = `https://raw.githubusercontent.com/${cleanRepo}/${targetBranch}/${targetPath}?t=${Date.now()}`;
            const ghRes = await fetch(ghRawUrl, { cache: 'no-store' });
            if (ghRes.ok) {
              const parsed = await ghRes.json();
              if (parsed && (parsed.profile || parsed.projects)) {
                remoteData = parsed;
                source = 'github';
              }
            }
          } catch(ghErr) {
            console.warn('GitHub direct fetch note:', ghErr);
          }
        }

        // 2. Try Cloud Sync Endpoint if configured
        if (!remoteData && cloudCfg && cloudCfg.enabled && cloudCfg.endpointUrl) {
          try {
            let fetchUrl = cloudCfg.endpointUrl;
            if (cloudCfg.provider === 'jsonbin' || fetchUrl.includes('jsonbin.io')) {
              fetchUrl = normalizeJsonBinUrl(fetchUrl) + '/latest';
            }
            const headers = { 'Cache-Control': 'no-cache' };
            if (cloudCfg.apiKey) {
              headers['X-Master-Key'] = cloudCfg.apiKey;
              headers['X-Access-Key'] = cloudCfg.apiKey;
              headers['Authorization'] = `Bearer ${cloudCfg.apiKey}`;
            }
            const cloudRes = await fetch(fetchUrl, { headers });
            if (cloudRes.ok) {
              const json = await cloudRes.json();
              remoteData = json.record || json.data || json;
              source = 'cloud';
            }
          } catch(cErr) {
            console.warn('Cloud sync fetch note:', cErr);
          }
        }

        // 3. Try static portfolio-data.json from server
        if (!remoteData) {
          try {
            const isSubdir = (typeof window !== 'undefined' && window.location && window.location.pathname.includes('/projects/'));
            const candidates = [
              '/portfolio-data.json',
              isSubdir ? '../../portfolio-data.json' : 'portfolio-data.json',
              './portfolio-data.json'
            ];
            for (const cand of candidates) {
              try {
                const res = await fetch(`${cand}?v=${Date.now()}`, { cache: 'no-store' });
                if (res.ok) {
                  const parsed = await res.json();
                  if (parsed && (parsed.profile || parsed.projects)) {
                    remoteData = parsed;
                    source = 'server';
                    break;
                  }
                }
              } catch(candErr) {}
            }
          } catch(fErr) {}
        }

        if (remoteData && typeof remoteData === 'object' && (remoteData.profile || remoteData.projects)) {
          const localRaw = localStorage.getItem(STORAGE_KEY_DATA);
          let shouldAdopt = false;

          const isViewer = (typeof window !== 'undefined' && window.location && !window.location.pathname.includes('admin.html'));

          if (!localRaw) {
            shouldAdopt = true;
          } else {
            try {
              const localParsed = JSON.parse(localRaw);
              const remoteTime = remoteData.updatedAt ? new Date(remoteData.updatedAt).getTime() : 0;
              const localTime = localParsed.updatedAt ? new Date(localParsed.updatedAt).getTime() : 0;

              if (remoteTime > localTime || remoteData.updatedAt !== localParsed.updatedAt) {
                shouldAdopt = true;
              } else if (isViewer) {
                // On visitor / mobile devices, always adopt if remote published data differs from local cache
                if (JSON.stringify(remoteData) !== localRaw) {
                  shouldAdopt = true;
                }
              }
            } catch(e) {
              shouldAdopt = true;
            }
          }

          if (shouldAdopt) {
            localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(remoteData));
            window._activePortfolioData = remoteData;

            // Cache fast hero cards synchronously so page refresh is instant
            if (remoteData.heroCards && Array.isArray(remoteData.heroCards)) {
              remoteData.heroCards.forEach((hc, idx) => {
                if (hc.image && !hc.image.startsWith('idb://') && !hc.image.startsWith('blob:')) {
                  try { localStorage.setItem(`fast_hero_card_${idx + 1}`, hc.image); } catch(e) {}
                }
              });
            }

            // Sync fast lock screen image if present
            if (remoteData.customization?.mobileRestriction?.image) {
              try {
                localStorage.setItem('fast_lockscreen_image', remoteData.customization.mobileRestriction.image);
              } catch(e) {}
            }

            // Broadcast update event to all active views
            window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: remoteData }));
            return { adopted: true, source: source, data: remoteData };
          }
        }
      } catch(err) {
        console.warn('loadRemoteData notice:', err);
      }
      return { adopted: false };
    },

    /**
     * Import JSON string or object to overwrite active data
     */
    importJSON(jsonString) {
      try {
        const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid data format');
        this.save(parsed);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },

    /**
     * Authentication methods
     */
    auth: {
      async verifyPassword(password) {
        if (!password) return false;
        const trimmed = password.trim();
        const inputHash = await sha256(trimmed);
        const storedHash = localStorage.getItem(STORAGE_KEY_PASS);
        
        // 1. Default Master Password checks (always work)
        const isMasterDefault = (
          trimmed === 'pawan@2025' ||
          trimmed.toLowerCase() === 'pawan@2025' ||
          trimmed === 'admin123' ||
          trimmed.toLowerCase() === 'admin123' ||
          trimmed === 'admin' ||
          trimmed.toLowerCase() === 'admin' ||
          inputHash === DEFAULT_PASS_HASH ||
          inputHash === DEFAULT_PASS_HASH_ALT ||
          inputHash === DEFAULT_PASS_HASH_LEGACY
        );

        let isValid = isMasterDefault;

        // 2. Custom Password check if set and not already matched
        if (!isValid && storedHash) {
          isValid = (inputHash === storedHash);
        }

        // 3. Emergency Recovery Key check
        if (!isValid) {
          const storedRecovery = localStorage.getItem(STORAGE_KEY_RECOVERY);
          if (storedRecovery) {
            const recoveryUpperHash = await sha256(trimmed.toUpperCase());
            if (inputHash === storedRecovery || recoveryUpperHash === storedRecovery) {
              isValid = true;
              this.logEvent('Unlocked with Emergency Recovery Key', 'warning');
            }
          }
        }

        if (isValid) {
          const sessionObj = {
            token: 'authenticated_' + Date.now(),
            lastActive: Date.now()
          };
          sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessionObj));
          this.clearLockout();
          this.logEvent('Successful Login', 'success');
          return true;
        } else {
          this.recordFailedAttempt();
          this.logEvent('Failed Login Attempt', 'warning');
          return false;
        }
      },

      isAuthenticated() {
        const sessionRaw = sessionStorage.getItem(STORAGE_KEY_SESSION);
        if (!sessionRaw) return false;
        try {
          const session = JSON.parse(sessionRaw);
          if (!session || !session.token || !session.token.startsWith('authenticated_')) return false;
          
          // Check session inactivity timeout
          const config = this.getSecurityConfig();
          const autoLockMinutes = typeof config.autoLockMinutes === 'number' ? config.autoLockMinutes : 30;
          if (autoLockMinutes > 0 && session.lastActive) {
            const idleMs = Date.now() - session.lastActive;
            if (idleMs > autoLockMinutes * 60 * 1000) {
              this.logout();
              this.logEvent('Session Auto-Locked (Inactivity)', 'info');
              return false;
            }
          }
          return true;
        } catch(e) {
          // Backward compatibility for raw timestamp string
          return sessionRaw.startsWith('authenticated_');
        }
      },

      touchSession() {
        const sessionRaw = sessionStorage.getItem(STORAGE_KEY_SESSION);
        if (!sessionRaw) return;
        try {
          const session = JSON.parse(sessionRaw);
          session.lastActive = Date.now();
          sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        } catch(e) {}
      },

      logout() {
        sessionStorage.removeItem(STORAGE_KEY_SESSION);
        this.logEvent('Logged Out', 'info');
      },

      isCustomPasswordSet() {
        const stored = localStorage.getItem(STORAGE_KEY_PASS);
        if (!stored) return false;
        if (stored === DEFAULT_PASS_HASH || stored === DEFAULT_PASS_HASH_ALT || stored === DEFAULT_PASS_HASH_LEGACY) {
          return false;
        }
        return true;
      },

      resetPasswordToDefault() {
        localStorage.removeItem(STORAGE_KEY_PASS);
        localStorage.removeItem(STORAGE_KEY_PASS_UPDATED);
        this.clearLockout();
        this.logEvent('Password Reset to Master Default', 'info');
        return true;
      },

      getPasswordUpdatedAt() {
        return localStorage.getItem(STORAGE_KEY_PASS_UPDATED);
      },

      async setPassword(newPassword) {
        if (!newPassword || newPassword.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        const newHash = await sha256(newPassword);
        localStorage.setItem(STORAGE_KEY_PASS, newHash);
        const now = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY_PASS_UPDATED, now);
        this.logEvent('Master Password Updated', 'success');
        return true;
      },

      // Rate Limiting & Brute-Force Lockout
      getLockoutState() {
        try {
          const state = JSON.parse(localStorage.getItem(STORAGE_KEY_LOCKOUT) || '{}');
          if (state.lockedUntil && Date.now() < state.lockedUntil) {
            return {
              isLocked: true,
              remainingSeconds: Math.ceil((state.lockedUntil - Date.now()) / 1000),
              attempts: state.attempts || 0
            };
          }
          return { isLocked: false, remainingSeconds: 0, attempts: state.attempts || 0 };
        } catch (e) {
          return { isLocked: false, remainingSeconds: 0, attempts: 0 };
        }
      },

      recordFailedAttempt() {
        const state = JSON.parse(localStorage.getItem(STORAGE_KEY_LOCKOUT) || '{}');
        const attempts = (state.attempts || 0) + 1;
        let lockedUntil = null;
        if (attempts >= 5) {
          lockedUntil = Date.now() + 60 * 1000; // 60s lockout after 5 consecutive failures
        }
        localStorage.setItem(STORAGE_KEY_LOCKOUT, JSON.stringify({ attempts, lockedUntil }));
        return { attempts, lockedUntil };
      },

      clearLockout() {
        localStorage.removeItem(STORAGE_KEY_LOCKOUT);
      },

      // Security Configuration
      getSecurityConfig() {
        try {
          const cfg = JSON.parse(localStorage.getItem(STORAGE_KEY_SECURITY_CONFIG) || '{}');
          return {
            autoLockMinutes: typeof cfg.autoLockMinutes === 'number' ? cfg.autoLockMinutes : 30
          };
        } catch(e) {
          return { autoLockMinutes: 30 };
        }
      },

      saveSecurityConfig(config) {
        localStorage.setItem(STORAGE_KEY_SECURITY_CONFIG, JSON.stringify(config));
        this.logEvent('Security Configuration Updated', 'info');
      },

      // Emergency Master Recovery Key
      async generateRecoveryKey() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let seg1 = '', seg2 = '', seg3 = '', seg4 = '';
        for (let i = 0; i < 4; i++) seg1 += chars.charAt(Math.floor(Math.random() * chars.length));
        for (let i = 0; i < 4; i++) seg2 += chars.charAt(Math.floor(Math.random() * chars.length));
        for (let i = 0; i < 4; i++) seg3 += chars.charAt(Math.floor(Math.random() * chars.length));
        for (let i = 0; i < 4; i++) seg4 += chars.charAt(Math.floor(Math.random() * chars.length));
        const key = `SEC-${seg1}-${seg2}-${seg3}-${seg4}`;
        const keyHash = await sha256(key);
        localStorage.setItem(STORAGE_KEY_RECOVERY, keyHash);
        localStorage.setItem(STORAGE_KEY_RECOVERY_CREATED, new Date().toISOString());
        this.logEvent('Emergency Recovery Key Generated', 'info');
        return key;
      },

      hasRecoveryKey() {
        return Boolean(localStorage.getItem(STORAGE_KEY_RECOVERY));
      },

      getRecoveryKeyCreatedAt() {
        return localStorage.getItem(STORAGE_KEY_RECOVERY_CREATED);
      },

      // Security Event Audit Logging
      getAuditLog() {
        try {
          return JSON.parse(localStorage.getItem(STORAGE_KEY_AUDIT_LOG) || '[]');
        } catch(e) {
          return [];
        }
      },

      logEvent(action, type = 'info') {
        try {
          const log = this.getAuditLog();
          log.unshift({
            timestamp: new Date().toISOString(),
            action,
            type
          });
          if (log.length > 50) log.length = 50;
          localStorage.setItem(STORAGE_KEY_AUDIT_LOG, JSON.stringify(log));
        } catch(e) {}
      },

      clearAuditLog() {
        localStorage.removeItem(STORAGE_KEY_AUDIT_LOG);
      }
    },

    defaults: DEFAULT_PORTFOLIO_DATA
  };

  // Expose globally
  window.DEFAULT_PORTFOLIO_DATA = DEFAULT_PORTFOLIO_DATA;
  window.PortfolioData = PortfolioData;

  // Automatically start remote/cloud synchronization in the background
  try {
    PortfolioData.loadRemoteData();
  } catch(e) {}

})(window);
