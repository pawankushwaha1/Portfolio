const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.resolve(__dirname, '../admin.html');
let content = fs.readFileSync(adminHtmlPath, 'utf8');

const tabStartMarker = '<!-- TAB: APPEARANCE & CUSTOMIZATION -->';
const tabEndMarker = '<!-- TAB 2: HERO SECTION -->';

const startIndex = content.indexOf(tabStartMarker);
const endIndex = content.indexOf(tabEndMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found!');
  process.exit(1);
}

const cleanTabCustomization = `<!-- TAB: APPEARANCE & CUSTOMIZATION -->
        <section class="tab-panel" id="tab-customization">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">APPEARANCE &amp; CUSTOMIZATION</h2>
              <p class="panel-desc">Choose a master theme color to change header background, bold text ("SELECTED WORK"), and buttons all at once, or apply 1-click curated design themes.</p>
            </div>
            <div class="panel-actions">
              <button class="btn-primary" id="btnSaveCustomization">Save Customization 💾</button>
            </div>
          </div>

          <!-- COLOR PALETTE & INSTANT THEME PRESETS -->
          <div class="card-box" id="cardColorPalette">
            <div class="card-box-header">
              <div>
                <h3 class="card-box-title">COLOR PALETTE &amp; INSTANT THEME PRESETS</h3>
                <p class="card-box-desc">Choose a master theme color to change header background, bold text ("SELECTED WORK"), and buttons all at once, or apply 1-click curated design themes.</p>
              </div>
              <button type="button" class="btn-sm-outline" id="btnResetPalette">Reset Colors ↺</button>
            </div>

            <!-- 1-Click Theme Preset Chips -->
            <div class="theme-presets-bar">
              <span class="presets-title">PRESETS:</span>
              <button type="button" class="preset-chip active" data-theme="classic">
                <span class="preset-swatches">
                  <span style="background: #642B2B;"></span>
                  <span style="background: #4F1F1F;"></span>
                  <span style="background: #E5A93C;"></span>
                  <span style="background: #FAF9F6;"></span>
                </span>
                <span>Classic Wine &amp; Gold</span>
              </button>
              <button type="button" class="preset-chip" data-theme="obsidian">
                <span class="preset-swatches">
                  <span style="background: #141416;"></span>
                  <span style="background: #0A0A0C;"></span>
                  <span style="background: #F5A623;"></span>
                  <span style="background: #F8F8FA;"></span>
                </span>
                <span>Obsidian Luxury</span>
              </button>
              <button type="button" class="preset-chip" data-theme="emerald">
                <span class="preset-swatches">
                  <span style="background: #183D2D;"></span>
                  <span style="background: #0E261C;"></span>
                  <span style="background: #D4AF37;"></span>
                  <span style="background: #F4F8F5;"></span>
                </span>
                <span>Emerald Prestige</span>
              </button>
              <button type="button" class="preset-chip" data-theme="indigo">
                <span class="preset-swatches">
                  <span style="background: #1E293B;"></span>
                  <span style="background: #0F172A;"></span>
                  <span style="background: #E28743;"></span>
                  <span style="background: #F8FAFC;"></span>
                </span>
                <span>Royal Indigo</span>
              </button>
              <button type="button" class="preset-chip" data-theme="espresso">
                <span class="preset-swatches">
                  <span style="background: #3B2A1E;"></span>
                  <span style="background: #261B13;"></span>
                  <span style="background: #C89666;"></span>
                  <span style="background: #FAF6F0;"></span>
                </span>
                <span>Espresso Minimal</span>
              </button>
              <button type="button" class="preset-chip" data-theme="crimson">
                <span class="preset-swatches">
                  <span style="background: #781818;"></span>
                  <span style="background: #551010;"></span>
                  <span style="background: #E5A93C;"></span>
                  <span style="background: #FAF9F6;"></span>
                </span>
                <span>Crimson Ember</span>
              </button>
            </div>

            <!-- Master 1-Color Controller Banner -->
            <div class="master-theme-card">
              <div class="master-theme-header">
                <div>
                  <h4 class="master-theme-title">🎯 Master Theme Color (1-Color Controller)</h4>
                  <p class="master-theme-desc">Changing this single color automatically updates the <strong>Header Background Color</strong>, <strong>White Background Bold Text</strong> (e.g., <em>SELECTED WORK</em>), and <strong>Buttons Color</strong> across your portfolio simultaneously.</p>
                </div>
                <div class="master-theme-picker-box">
                  <input type="color" id="custColorPrimary" class="color-input-circle master-circle" value="#642B2B">
                  <input type="text" id="custColorPrimaryHex" class="form-input hex-input master-hex" value="#642B2B" maxlength="7">
                </div>
              </div>
              
              <!-- Live Visual Preview of the 3 Affected Elements -->
              <div class="master-sync-preview-grid">
                <div class="sync-preview-item" id="previewHeaderItem">
                  <span class="sync-preview-label">1. HEADER BACKGROUND</span>
                  <div class="mini-header-preview" id="syncHeaderSample">
                    <span class="mini-logo">Pawan.</span>
                    <span class="mini-nav">Work • Prototyping</span>
                  </div>
                </div>
                <div class="sync-preview-item" id="previewBoldTextItem">
                  <span class="sync-preview-label">2. BOLD TEXT ON WHITE CANVAS</span>
                  <div class="mini-text-preview">
                    <span class="mini-bold-title" id="syncBoldTextSample">SELECTED WORK</span>
                  </div>
                </div>
                <div class="sync-preview-item" id="previewButtonsItem">
                  <span class="sync-preview-label">3. BUTTONS &amp; FILTER PILLS</span>
                  <div class="mini-btn-preview">
                    <span class="mini-sample-btn" id="syncBtnSample">ALL (4) ✓</span>
                    <span class="mini-sample-btn-sec" id="syncBtnSecSample"></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="color-palette-grid">
              <div class="color-picker-card">
                <label class="color-picker-label">Header Background Color</label>
                <div class="color-picker-row">
                  <input type="color" id="custColorHeaderBg" class="color-input-circle" value="#4F1F1F">
                  <input type="text" id="custColorHeaderBgHex" class="form-input hex-input" value="#4F1F1F" maxlength="7">
                </div>
                <span class="field-hint">Sticky navbar background, mobile drawer fill</span>
              </div>

              <div class="color-picker-card">
                <label class="color-picker-label">White Background Bold Text</label>
                <div class="color-picker-row">
                  <input type="color" id="custColorBoldText" class="color-input-circle" value="#5C2828">
                  <input type="text" id="custColorBoldTextHex" class="form-input hex-input" value="#5C2828" maxlength="7">
                </div>
                <span class="field-hint">Titles like "SELECTED WORK", headings on light canvas</span>
              </div>

              <div class="color-picker-card">
                <label class="color-picker-label">Buttons &amp; Filter Pills Color</label>
                <div class="color-picker-row">
                  <input type="color" id="custColorButtons" class="color-input-circle" value="#5C2828">
                  <input type="text" id="custColorButtonsHex" class="form-input hex-input" value="#5C2828" maxlength="7">
                </div>
                <span class="field-hint">Work filters, back buttons, modal CTAs</span>
              </div>

              <div class="color-picker-card">
                <label class="color-picker-label">Accent Gold (Status Dot)</label>
                <div class="color-picker-row">
                  <input type="color" id="custColorGold" class="color-input-circle" value="#E5A93C">
                  <input type="text" id="custColorGoldHex" class="form-input hex-input" value="#E5A93C" maxlength="7">
                </div>
                <span class="field-hint">Pulsing availability indicator, highlight accents</span>
              </div>

              <div class="color-picker-card">
                <label class="color-picker-label">Body Text (Dark Gray)</label>
                <div class="color-picker-row">
                  <input type="color" id="custColorTextDark" class="color-input-circle" value="#1F1F1F">
                  <input type="text" id="custColorTextDarkHex" class="form-input hex-input" value="#1F1F1F" maxlength="7">
                </div>
                <span class="field-hint">Paragraph descriptions and body typography</span>
              </div>

              <!-- Hidden inputs for backward compatibility -->
              <input type="hidden" id="custColorMaroon" value="#642B2B">
              <input type="hidden" id="custColorMaroonHex" value="#642B2B">
              <input type="hidden" id="custColorMaroonDark" value="#4F1F1F">
              <input type="hidden" id="custColorMaroonDarkHex" value="#4F1F1F">
              <input type="hidden" id="custColorCream" value="#FAF9F6">
              <input type="hidden" id="custColorCreamHex" value="#FAF9F6">
            </div>
          </div>
        </section>

        `;

content = content.substring(0, startIndex) + cleanTabCustomization + content.substring(endIndex);
fs.writeFileSync(adminHtmlPath, content, 'utf8');
console.log('Successfully updated admin.html with clean Appearance & Customization tab!');
