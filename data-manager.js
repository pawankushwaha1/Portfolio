/**
 * Pawan K. Kushwaha Portfolio - Centralized Data Store & Manager
 * Provides dynamic data binding, localStorage synchronization, JSON import/export,
 * and security authentication for the owner Admin Panel.
 */

(function(window) {
  'use strict';

  // Default master dataset representing the complete current state of the portfolio
  const DEFAULT_PORTFOLIO_DATA = {
    profile: {
      name: "PAWAN K. KUSHWAHA",
      titleLine1: "PAWAN K.",
      titleLine2: "KUSHWAHA",
      role: "PRODUCT DESIGNER",
      tagline: "Design. Make. Explore.",
      location: "Chandigarh, India",
      statusText: "Available for opportunities",
      statusType: "gold", // gold, green, or red
      avatar: "assets/images/hero_character.png",
      ctaWorkText: "View My Work",
      ctaStoryText: "About Me",
      ctaStoryUrl: "about.html",
      music: {
        caption: "CURRENTLY LISTENING",
        trackName: "Cinematic Ambient & Lo-Fi Beats",
        audioSrc: "assets/audio/ambient_lofi.wav"
      }
    },

    categories: [
      { id: "product", name: "Product Design" },
      { id: "uiux", name: "UI/UX Design" },
      { id: "graphic", name: "Graphic Design" }
    ],

    projects: [
      // PRODUCT DESIGN
      {
        id: "luma",
        category: "product",
        categoryLabel: "PRODUCT DESIGN",
        shortTitle: "LUMA",
        title: "LUMA — Minimalist Modular Desk Lamp",
        tag: "CAD → 3D Print",
        image: "assets/images/work_luma.jpg",
        shortDesc: "A minimalist modular desk lamp exploring diffused warm lighting and ergonomic pivot..",
        description: "LUMA is an exploration in reductive industrial design and thermal management. A minimalist modular desk lamp exploring diffused warm lighting and ergonomic pivot points. Machined from billet 6061 aluminum with an integrated capacitive touch slider in the base, LUMA offers continuous dimming and circadian color-temperature tuning.",
        timeline: "4 Months (2024)",
        role: "Lead Industrial Designer & Prototyper",
        tools: "Autodesk Fusion 360, Keyshot, SLA 3D Printing, CNC Milling",
        deliverable: "DFM CAD Packages, Working Functional Prototype, Bill of Materials",
        showcaseImages: [
          { src: "assets/images/work_luma.jpg", alt: "LUMA Acoustic Table Lamp Final Assembly" },
          { src: "assets/images/work_gantri.jpg", alt: "LUMA Diffuser Light Spill and Material Finishes" },
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
        category: "product",
        categoryLabel: "INDUSTRIAL DESIGN",
        shortTitle: "ANALOG",
        title: "ANALOG — Tactile Digital Camera",
        tag: "Concept CAD",
        image: "assets/images/work_analog.jpg",
        shortDesc: "A tactile digital camera concept prioritizing mechanical feedback with physical click...",
        description: "A tactile digital camera concept prioritizing mechanical feedback with physical click wheels and vintage ergonomics. In an era of frictionless touchscreens, ANALOG restores the tactile joy of photography through knurled aluminum control dials, mechanical shutter release clickers, and an organic status display inspired by 1970s rangefinders.",
        timeline: "3 Months (2024)",
        role: "Hardware UI/UX & Ergonomics Engineer",
        tools: "SolidWorks, KeyShot 11, Foam Prototyping, Arduino Micro",
        deliverable: "Ergonomic Rig Studies, Working PCB Enclosure, Production Ready CAD",
        showcaseImages: [
          { src: "assets/images/work_analog.jpg", alt: "ANALOG Precision CNC Volume Controller" },
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
        id: "gantri",
        category: "product",
        categoryLabel: "PRODUCT DESIGN",
        shortTitle: "GANTRI LAMP",
        title: "GANTRI LAMP — Additive Zero-Waste Desktop Luminaire",
        tag: "Additive DFM",
        image: "assets/images/work_gantri.jpg",
        shortDesc: "Modular desktop luminaire engineered for scalable zero-waste additive manufacturing...",
        description: "Developed in close collaboration with Gantri, exploring sustainable plant-based polymers and zero-waste additive manufacturing. Features balanced weighted geometry, hidden wiring channels, and parametric diffusion ribs that cast a gentle, glare-free working light.",
        timeline: "3 Months (2024)",
        role: "Industrial Design & Additive DFM Specialist",
        tools: "Rhino 3D, Grasshopper, KeyShot, FDM Production Tooling",
        deliverable: "Toolpath Calibrations, Production CAD, Assembly Instructions",
        showcaseImages: [
          { src: "assets/images/work_gantri.jpg", alt: "Gantri Luminaire Warm Illumination" },
          { src: "assets/images/proto_3dprint.jpg", alt: "3D Printing Additive Layer Deposition" },
          { src: "assets/images/work_luma.jpg", alt: "Sculptural Geometry in Minimalist Interior" }
        ],
        processImages: [
          { src: "assets/images/proto_3dprint.jpg", alt: "Additive Toolpath Slicing and Nozzle Temperature Control" },
          { src: "assets/images/proto_cad.jpg", alt: "Parametric Curvature & Wall Thickness Optimization" },
          { src: "assets/images/proto_drafting.jpg", alt: "Cord Relief and Base Weighting Specifications" }
        ]
      },
      {
        id: "kinetic_chair",
        category: "product",
        categoryLabel: "FURNITURE DESIGN",
        shortTitle: "KINETIC CHAIR",
        title: "KINETIC CHAIR — Ergonomic Bent Plywood Study",
        tag: "Scale Prototyping",
        image: "assets/images/work_chair.jpg",
        shortDesc: "Ergonomic study chairs exploring lightweight bent plywood geometry and spine curvature...",
        description: "An architectural exploration into human spine kinematics and lightweight cantilevered seating. Developed through 1:5 scale paperboard maquettes, laser-cut veneer laminations, and 1:1 CNC-bent ergonomic testing bucks.",
        timeline: "4 Months (2023 - 2024)",
        role: "Furniture & Ergonomics Designer",
        tools: "AutoCAD, SolidWorks, CNC Router, Vacuum Press Lamination",
        deliverable: "1:5 Scale Study Models, 1:1 Full Scale Prototype, Structural FEA",
        showcaseImages: [
          { src: "assets/images/work_chair.jpg", alt: "Kinetic Ergonomic Articulating Task Chair" },
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
        id: "modu_bottles",
        category: "product",
        categoryLabel: "INDUSTRIAL DESIGN",
        shortTitle: "MODU BOTTLE",
        title: "MODU BOTTLE — Interlocking Sustainable Hydration System",
        tag: "Blow Molding CAD",
        image: "assets/images/work_bottles.jpg",
        shortDesc: "Parametric ribbed interlocking water bottle system reducing resin usage by 24%...",
        description: "A parametric interlocking bottle architecture engineered to optimize shipping volumetric density by 28% and eliminate secondary packaging. Molded with thin-wall structural ribbing that reduces virgin polymer consumption while providing superior drop resistance.",
        timeline: "2 Months (2024)",
        role: "Packaging & Sustainable ID Consultant",
        tools: "PTC Creo, KeyShot Studio, SLA Scale Testing, Moldflow Analysis",
        deliverable: "Blow Mold Tooling CAD, Parting Line Specs, Material Savings Study",
        showcaseImages: [
          { src: "assets/images/work_bottles.jpg", alt: "Modu Vacuum Insulated Bottle Geometry" },
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
        id: "chassis_m1",
        category: "product",
        categoryLabel: "HARDWARE DESIGN",
        shortTitle: "CHASSIS M1",
        title: "CHASSIS M1 — Machined Mechanical Camera Body",
        tag: "Class-A Surfacing",
        image: "assets/images/work_chassis.jpg",
        shortDesc: "Precision machined rangefinder body with knurled physical dials and modular battery sled...",
        description: "A precision billet 6061-T6 aluminum rangefinder body engineered with continuous G2 curvature and tactile knurled control interfaces. Houses internal optical sensor modules and a quick-swap mechanical battery sled.",
        timeline: "5 Months (2024)",
        role: "Principal Hardware Systems Designer",
        tools: "Autodesk Alias, Fusion 360, 5-Axis CNC Milling, Anodizing Lab",
        deliverable: "Class-A Surface STEP Files, GD&T Drawings, Working Anodized Chassis",
        showcaseImages: [
          { src: "assets/images/work_chassis.jpg", alt: "Chassis M1 Machined Aluminum Mini-ITX Case" },
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
        id: "apex_gears",
        category: "product",
        categoryLabel: "MECHANICAL DESIGN",
        shortTitle: "APEX GEARS",
        title: "APEX GEARS — High-Durability Micro Planetary Geartrain",
        tag: "Additive Tooling",
        image: "assets/images/work_gears.jpg",
        shortDesc: "High-durability micro planetary gear systems tested for repeatable low-volume production...",
        description: "Engineered micro-extrusion additive toolpaths for high-tolerance involute gears. Built for low-volume precision mechatronic actuators requiring zero backlash and long-cycle friction durability.",
        timeline: "3 Months (2024)",
        role: "Mechatronic Fabrication Engineer",
        tools: "SolidWorks Motion, GearTeq, Direct-Drive Micro Extruder",
        deliverable: "Gear Involute DFM, Backlash Analysis Report, Functional Actuator",
        showcaseImages: [
          { src: "assets/images/work_gears.jpg", alt: "Apex Mountain Gear Mechanism & Carbon Lever" },
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
        id: "breathe",
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
        ]
      },
      {
        id: "pulse_os",
        category: "uiux",
        categoryLabel: "UI/UX DESIGN",
        shortTitle: "PULSE OS",
        title: "PULSE OS — Connected Sports Telemetry Design System",
        tag: "Design System",
        image: "assets/images/work_pulse.jpg",
        shortDesc: "Haptic telemetry mobile interface designed for connected wearable sports trackers...",
        description: "A high-performance dark-mode health telemetry companion designed for endurance athletes. Synthesizes continuous VO2 max telemetry, biometric HRV spikes, and real-time pacing recommendations into ultra-readable micro-visualizations.",
        timeline: "4 Months (2024)",
        role: "Lead UI/UX Architect",
        tools: "Figma, Tokens Studio, Framer, React Native Prototype",
        deliverable: "Multi-Platform Design System, Micro-Interactions, Usability Study",
        showcaseImages: [
          { src: "assets/images/work_pulse.jpg", alt: "Pulse OS Telemetry Dashboard & Performance Tracking" },
          { src: "assets/images/work_breathe.png", alt: "Personalized Recovery & Bio-Rhythm Analytics" },
          { src: "assets/images/work_aether.jpg", alt: "Multi-Sensor Data Stream Telemetry Graphs" }
        ],
        processImages: [
          { src: "assets/images/proto_cad.jpg", alt: "Optical Sensor Window Refraction Modeling" },
          { src: "assets/images/proto_drafting.jpg", alt: "AMOLED Glance-State Typography & Grid Layout" },
          { src: "assets/images/proto_cnc.jpg", alt: "Titanium Bezel Drop-Impact Test Prototyping" }
        ]
      },
      {
        id: "aether_dash",
        category: "uiux",
        categoryLabel: "PRODUCT UI",
        shortTitle: "AETHER DASH",
        title: "AETHER DASH — Spatial Audio Studio Controller",
        tag: "SaaS Platform",
        image: "assets/images/work_aether.jpg",
        shortDesc: "Spatial audio management interface with real-time parametric equalizer visualizers...",
        description: "A multi-touch tablet and desktop spatial audio workstation interface. Empowers audio engineers to position 3D object-based sound coordinates in real-time with responsive 3D sphere gyros, multi-band FFT equalizers, and haptic slider rails.",
        timeline: "3 Months (2024)",
        role: "Senior Product Designer & Sound Interaction Lead",
        tools: "Figma, Web Audio API, Three.js, TailwindCSS",
        deliverable: "Interactive Web Prototype, Accessibility Spec, Component Library",
        showcaseImages: [
          { src: "assets/images/work_aether.jpg", alt: "Aether Dash Spatial Audio DAW Interface" },
          { src: "assets/images/work_pulse.jpg", alt: "Oscilloscope Telemetry & Parametric Visualizer" },
          { src: "assets/images/work_breathe.png", alt: "Multi-Channel Surround Placement Matrix" }
        ],
        processImages: [
          { src: "assets/images/proto_drafting.jpg", alt: "Spatial Coordinate Panner Architecture Wireframe" },
          { src: "assets/images/proto_cad.jpg", alt: "Dedicated Hardware Mixing Surface Mockup" },
          { src: "assets/images/proto_cnc.jpg", alt: "Motorized Fader Enclosure Billet Fabrication" }
        ]
      },

      // GRAPHIC DESIGN
      {
        id: "movietime",
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
        id: "vinyl_grooves",
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
        id: "surreal_sound",
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
        id: "cinema_noir",
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
        id: "heroic_horizons",
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
      { id: "extrusion", step: "STEP 05", tag: "STEP 05 • ADDITIVE FABRICATION", title: "Precision nozzle extrusion testing", src: "assets/images/proto_extrusion.jpg", tilt: "tilt-left", isExtra: true },
      { id: "assembly", step: "STEP 06", tag: "STEP 06 • PHYSICAL ASSEMBLY", title: "Hands-on bench assembly & fit check", src: "assets/images/proto_assembly.jpg", tilt: "tilt-right", isExtra: true },
      { id: "cad", step: "STEP 07", tag: "STEP 07 • PARAMETRIC CAD", title: "3D mechanical chassis surface model", src: "assets/images/proto_cad.jpg", tilt: "tilt-slight-left", isExtra: true },
      { id: "scale", step: "STEP 08", tag: "STEP 08 • SCALE STUDY", title: "Ergonomic miniature study models", src: "assets/images/proto_scale.jpg", tilt: "tilt-slight-right", isExtra: true }
    ],

    protoQuote: "Workshop hands are curious hands.",

    gallery: [
      // Column 1
      { id: "g1", col: 1, type: "card-tall", src: "assets/images/gallery_forest.jpg", caption: "Alpine Pine Forest — Find Beauty in Details", scriptOverlay: "Find Beauty\nin Details.", isExtra: false },
      { id: "g2", col: 1, type: "card-short", src: "assets/images/gallery_astro.png", caption: "Milky Way over Frozen Alpine Lake (Astro 2024)", badge: "Astro 2024", isExtra: false },
      { id: "g3", col: 1, type: "card-tall", src: "assets/images/gallery_peaks.jpg", caption: "Alpine Night Summit & Star Trails", scriptOverlay: "Find Beauty\nin Details.", isExtra: true },
      { id: "g4", col: 1, type: "card-short", src: "assets/images/gallery_hills.jpg", caption: "Sunlit Alpine Ridge & Evergreen Hills", badge: "Alpine Vista", isExtra: true },

      // Column 2
      { id: "g5", col: 2, type: "card-short", src: "assets/images/gallery_lizard_eye.png", caption: "Macro Reptile Eye Study", badge: "Emerald Macro", isExtra: false },
      { id: "g6", col: 2, type: "card-tall", src: "assets/images/gallery_snake_scales.jpg", caption: "Green Reptile Scales — Find Beauty in Details", scriptOverlay: "Find Beauty\nin Details.", isExtra: false },
      { id: "g7", col: 2, type: "card-short", src: "assets/images/gallery_flower.jpg", caption: "Cobalt Botanical Flower Blossom", badge: "Botanic Macro", isExtra: true },
      { id: "g8", col: 2, type: "card-tall", src: "assets/images/gallery_pond_macro.jpg", caption: "Sunlit Stream Pebbles & Lily Pads", scriptOverlay: "Find Beauty\nin Details.", isExtra: true },

      // Column 3
      { id: "g9", col: 3, type: "card-tall", src: "assets/images/gallery_stream.jpg", caption: "Water Lilies in Forest Stream — Find Beauty in Details", scriptOverlay: "Find Beauty\nin Details.", isExtra: false },
      { id: "g10", col: 3, type: "card-short", src: "assets/images/gallery_studio_camera.png", caption: "Studio Workbench & Analog Cameras", badge: "Studio Work", isExtra: false },
      { id: "g11", col: 3, type: "card-tall", src: "assets/images/gallery_cyanotype.jpg", caption: "Cyanotype Printmaking & Vintage Camera", scriptOverlay: "Find Beauty\nin Details.", isExtra: true },
      { id: "g12", col: 3, type: "card-short", src: "assets/images/gallery_vinyl.jpg", caption: "Vintage Vinyl & Analog Audio", badge: "Analog Sound", isExtra: true },

      // Column 4
      { id: "g13", col: 4, type: "card-short", src: "assets/images/gallery_lily_pond.png", caption: "Serene Lotus Water Pond", badge: "Flora & Reflections", isExtra: false },
      { id: "g14", col: 4, type: "card-tall", src: "assets/images/gallery_blue_mountain.jpg", caption: "Twilight Snow Peak — Find Beauty in Details", scriptOverlay: "Find Beauty\nin Details.", isExtra: false },
      { id: "g15", col: 4, type: "card-short", src: "assets/images/gallery_bottles.jpg", caption: "Parametric Surface CAD Wireframe Study", badge: "Industrial CAD", isExtra: true },
      { id: "g16", col: 4, type: "card-tall", src: "assets/images/gallery_moraine_lake.png", caption: "Glacial Moraine Lake Reflections", scriptOverlay: "Find Beauty\nin Details.", isExtra: true }
    ],

    connect: {
      title: "LET'S CONNECT",
      desc: "Have a project hardware concept, digital interface, or just want to say hi? I'd love to hear from you.",
      email: "pawankushwaha.design@gmail.com",
      resumeUrl: "assets/Pawan_Kushwaha_Resume.pdf",
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

    about: {
      hero: {
        badge: "PRODUCT DESIGN • PROTOTYPING • HUMAN-CENTERED",
        title: "TURNING TANGIBLE IDEAS INTO PURPOSEFUL PRODUCTS.",
        lead: "Hi, I’m Pawan K. Kushwaha. I am a product and industrial designer based in Chandigarh, India. I operate at the intersection of hands-on physical prototyping and digital systems—transforming complex engineering constraints into objects that feel balanced, intuitive, and remarkably satisfying to use.",
        bio: "Whether carving early foam forms, running CNC toolpaths, testing capacitive touch ergonomics, or crafting crisp UI micro-interactions, I obsess over the micro-details that make a product truly memorable.",
        floatingPill: "Design. Make. Explore.",
        characterImg: "assets/images/connect_character.png"
      },
      stats: [
        { number: "4+", label: "Years of Design & Fabrication" },
        { number: "15+", label: "Working Functional Prototypes" },
        { number: "10+", label: "Screenprint & Fine Art Editions" },
        { number: "100%", label: "Hands-On Curiosity & Detail" }
      ],
      philosophy: [
        {
          num: "01 / TANGIBLE FIRST",
          title: "Making to Understand",
          desc: "Physical prototypes reveal nuances that CAD screens hide. I build rapid foam drafts, 3D prints, and rough rigs early to evaluate weight, balance, tactile feedback, and human ergonomics."
        },
        {
          num: "02 / PRODUCTION INTEGRITY",
          title: "Design for Manufacturing (DFM)",
          desc: "Great design doesn't end at visualization. I engineer parting lines, draft angles, fastener layouts, and tolerance allowances so that production parts match the original design intent flawlessly."
        },
        {
          num: "03 / HARMONIOUS SYSTEMS",
          title: "Cohesive Digital Ecosystems",
          desc: "Physical products thrive when their digital touchpoints feel natural. From AMOLED glance states to companion dashboards, every interaction feels unified, warm, and responsive."
        }
      ],
      skills: {
        physicalTitle: "Physical & Industrial Design",
        physicalList: [
          "High-Surfacing 3D CAD & Parametric Modeling",
          "Design for Manufacturing (DFM & DFA)",
          "CNC 3-Axis & 4-Axis Machining Preparation",
          "Rapid Additive Fabrication (FDM & SLA 3D Printing)",
          "CMF Strategy (Color, Material, Finish & Texture Specs)",
          "Ergonomic Anthropometric Study & Scale Validation"
        ],
        physicalPills: [
          "Fusion 360", "KeyShot", "SolidWorks", "Blender", "3D Printing", "CNC Tooling"
        ],
        digitalTitle: "Digital, UX & Visual Crafts",
        digitalList: [
          "Human-Centered UI/UX Architecture & User Journeys",
          "Interactive Micro-Animations & Component Systems",
          "Embedded Display Interfaces & Telemetry Dashboards",
          "Hand-Inked Rough Illustration & Storyboarding",
          "Serigraph Screenprinting & Risograph Printmaking",
          "Physical Sensor Prototyping (Arduino / ESP32)"
        ],
        digitalPills: [
          "Figma", "Adobe Illustrator", "Photoshop", "After Effects", "Screenprint", "Arduino"
        ]
      },
      milestones: [
        {
          id: "m1",
          year: "2024 — PRESENT",
          role: "Independent Industrial & Product Designer",
          desc: "Partnering with founders and design studios on full-cycle physical hardware development—from concept sketches and engineering CAD to functional working prototypes and CMF validation."
        },
        {
          id: "m2",
          year: "2023 — 2024",
          role: "Lead Hardware Concept Designer — LUMA Lamp & Modular Accessories",
          desc: "Engineered the LUMA minimalist modular desk lamp, exploring capacitive touch sensing, diffused warm ambient illumination, and sustainable modular disassembly."
        },
        {
          id: "m3",
          year: "2022 — 2023",
          role: "Experimental Printmaker & Tactile Artifact Designer",
          desc: "Explored traditional photographic cyanotypes, gatefold album dielines, and multi-plate screenprint registration. Exhibited limited runs celebrating film and music culture."
        }
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
        primary: "#642B2B",      // Master brand color: controls Header Bg, Bold Text, and Buttons from one color
        headerBg: "#4F1F1F",     // Scrolled sticky header & mobile drawer background
        boldText: "#5C2828",     // White background bold text (e.g., SELECTED WORK)
        buttons: "#5C2828",      // CTA buttons, filter pills, and action controls
        maroon: "#642B2B",
        maroonDark: "#4F1F1F",
        cream: "#FAF9F6",
        gold: "#E5A93C",
        textDark: "#1F1F1F"
      },
      lens: {
        enabled: true,           // Lens cursor active state
        showToggleBtn: true,     // Show floating bottom toggle pill
        size: 70,                // Lens diameter in px (40px - 140px)
        scale: 1.65              // Magnification optical scale factor (1.2x - 3.0x)
      },
      backgrounds: {
        hero: {
          type: "image",
          image: "assets/background.png",
          color: "#55161C",
          parallax: true,
          overlayOpacity: 0.15,
          speed: 1.0
        },
        prototyping: {
          type: "image",
          image: "assets/background.png",
          color: "#55161C",
          parallax: true,
          overlayOpacity: 0.35,
          speed: 1.0
        },
        connect: {
          type: "image",
          image: "assets/background.png",
          color: "#55161C",
          parallax: true,
          overlayOpacity: 0.25,
          speed: 1.0
        }
      },
      sections: {
        workTitle: "SELECTED WORK",
        workSubtitle: "Ideas transformed into meaningful, functional experiences.",
        protoTitle: "PROTOTYPING WORKSHOP",
        protoQuote: "Design is not just what it looks like and feels like. Design is how it works.",
        galleryTitle: "FIELD NOTES & FRAMES",
        gallerySubtitle: "Visual journal of travels, prototypes, and material inspirations.",
        connectTitle: "LET'S BUILD SOMETHING EXTRAORDINARY",
        connectSubtitle: "Have a design challenge or exciting project in mind? Let's connect."
      }
    }
  };

  // Storage Keys
  const STORAGE_KEY_DATA = 'portfolio_custom_data';
  const STORAGE_KEY_PASS = 'portfolio_admin_password_hash';
  const STORAGE_KEY_SESSION = 'portfolio_admin_session';

  // Default Master Password is "pawan@2025" or "admin123"
  // Pre-calculated SHA-256 hash for "pawan@2025"
  const DEFAULT_PASS_HASH = "ca078f4a1bb317926e84d4b1a41e976694e50d604f552cf5d691cb5dfb4256eb";

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
    // Fallback simple fast hash if crypto.subtle is unavailable
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }

  const PortfolioData = {
    /**
     * Get active portfolio data
     * Returns custom saved data from localStorage, or falls back to defaults.
     */
    get() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_DATA);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Deep merge with default data to guarantee no missing fields
          return {
            ...DEFAULT_PORTFOLIO_DATA,
            ...parsed,
            profile: { ...DEFAULT_PORTFOLIO_DATA.profile, ...(parsed.profile || {}) },
            connect: {
              ...DEFAULT_PORTFOLIO_DATA.connect,
              ...(parsed.connect || {}),
              socials: { ...DEFAULT_PORTFOLIO_DATA.connect.socials, ...(parsed.connect?.socials || {}) }
            },
            about: {
              ...DEFAULT_PORTFOLIO_DATA.about,
              ...(parsed.about || {}),
              hero: { ...DEFAULT_PORTFOLIO_DATA.about.hero, ...(parsed.about?.hero || {}) },
              stats: (parsed.about?.stats && Array.isArray(parsed.about.stats)) ? parsed.about.stats : DEFAULT_PORTFOLIO_DATA.about.stats,
              philosophy: (parsed.about?.philosophy && Array.isArray(parsed.about.philosophy)) ? parsed.about.philosophy : DEFAULT_PORTFOLIO_DATA.about.philosophy,
              skills: {
                ...DEFAULT_PORTFOLIO_DATA.about.skills,
                ...(parsed.about?.skills || {})
              },
              milestones: (parsed.about?.milestones && Array.isArray(parsed.about.milestones)) ? parsed.about.milestones : DEFAULT_PORTFOLIO_DATA.about.milestones
            },
            footer: { ...DEFAULT_PORTFOLIO_DATA.footer, ...(parsed.footer || {}) },
            customization: {
              ...DEFAULT_PORTFOLIO_DATA.customization,
              ...(parsed.customization || {}),
              hero: { ...DEFAULT_PORTFOLIO_DATA.customization.hero, ...(parsed.customization?.hero || {}) },
              profileImg: { ...DEFAULT_PORTFOLIO_DATA.customization.profileImg, ...(parsed.customization?.profileImg || {}) },
              colors: { ...DEFAULT_PORTFOLIO_DATA.customization.colors, ...(parsed.customization?.colors || {}) },
              lens: { ...DEFAULT_PORTFOLIO_DATA.customization.lens, ...(parsed.customization?.lens || {}) },
              backgrounds: {
                hero: { ...DEFAULT_PORTFOLIO_DATA.customization.backgrounds.hero, ...(parsed.customization?.backgrounds?.hero || {}) },
                prototyping: { ...DEFAULT_PORTFOLIO_DATA.customization.backgrounds.prototyping, ...(parsed.customization?.backgrounds?.prototyping || {}) },
                connect: { ...DEFAULT_PORTFOLIO_DATA.customization.backgrounds.connect, ...(parsed.customization?.backgrounds?.connect || {}) }
              },
              sections: { ...DEFAULT_PORTFOLIO_DATA.customization.sections, ...(parsed.customization?.sections || {}) }
            }
          };
        }
      } catch (err) {
        console.error('Error reading portfolio custom data:', err);
      }
      return JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
    },

    /**
     * Save updated portfolio data to localStorage and broadcast change
     */
    save(data) {
      try {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
        // Dispatch custom event for same-page listeners
        window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: data }));
        return true;
      } catch (err) {
        console.error('Error saving portfolio data:', err);
        return false;
      }
    },

    /**
     * Export all data as downloadable JSON file
     */
    exportJSON() {
      const data = this.get();
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
     * Reset back to factory default data
     */
    resetDefaults() {
      localStorage.removeItem(STORAGE_KEY_DATA);
      window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: DEFAULT_PORTFOLIO_DATA }));
      return true;
    },

    /**
     * Authentication methods
     */
    auth: {
      async verifyPassword(password) {
        const inputHash = await sha256(password);
        const storedHash = localStorage.getItem(STORAGE_KEY_PASS) || DEFAULT_PASS_HASH;
        
        // Also allow initial direct match for "pawan@2025" or "admin123"
        if (inputHash === storedHash || password === 'pawan@2025' || password === 'admin123') {
          sessionStorage.setItem(STORAGE_KEY_SESSION, 'authenticated_' + Date.now());
          return true;
        }
        return false;
      },

      isAuthenticated() {
        const session = sessionStorage.getItem(STORAGE_KEY_SESSION);
        return Boolean(session && session.startsWith('authenticated_'));
      },

      logout() {
        sessionStorage.removeItem(STORAGE_KEY_SESSION);
      },

      async setPassword(newPassword) {
        if (!newPassword || newPassword.length < 4) {
          throw new Error('Password must be at least 4 characters');
        }
        const newHash = await sha256(newPassword);
        localStorage.setItem(STORAGE_KEY_PASS, newHash);
        return true;
      }
    },

    defaults: DEFAULT_PORTFOLIO_DATA
  };

  // Expose globally
  window.DEFAULT_PORTFOLIO_DATA = DEFAULT_PORTFOLIO_DATA;
  window.PortfolioData = PortfolioData;

})(window);
