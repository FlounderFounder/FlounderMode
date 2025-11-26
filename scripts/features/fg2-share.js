// ============================================================================
// FG2 SHARE - PNG Export & Social Sharing (html2canvas approach)
// ============================================================================

// State
let currentPhrase = '';
let customization = {
    fontFamily: PNG_CONFIG.defaults.fontFamily,
    fontSize: PNG_CONFIG.defaults.fontSize,
    textColor: PNG_CONFIG.defaults.textColor,
    backgroundColor: PNG_CONFIG.defaults.backgroundColor,
    backgroundImage: PNG_CONFIG.defaults.backgroundImage,
    gradientColor1: PNG_CONFIG.defaults.gradientColor1,
    gradientColor2: PNG_CONFIG.defaults.gradientColor2,
    gradientDirection: PNG_CONFIG.defaults.gradientDirection,
    backgroundType: PNG_CONFIG.defaults.backgroundType, // 'color', 'gradient', or 'image'
    textAlign: PNG_CONFIG.defaults.textAlign,
    logo: PNG_CONFIG.defaults.logo,
    logoPosition: PNG_CONFIG.defaults.logoPosition
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize share modal
 */
function initShareModal() {
    // Populate dropdowns
    populateFontSelect();
    populateBackgroundImageSelect();
    populateGradientDirectionSelect();
    populateLogoImageSelect();
    populateLogoPositionSelect();
    
    // Set up event listeners
    setupShareEventListeners();
    setupTabs();
    
    // Build share buttons
    buildShareButtons();
    
    console.log('Share modal initialized');
}

/**
 * Set up XP-style tabs
 */
function setupTabs() {
    const tabs = document.querySelectorAll('.xp-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Remove active class from all tabs and contents
            document.querySelectorAll('.xp-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const content = document.querySelector(`.tab-content[data-content="${targetTab}"]`);
            if (content) {
                content.classList.add('active');
            }
        });
    });
    
    // Add window resize listener to maintain preview aspect ratio
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (document.getElementById('share-modal')?.classList.contains('active')) {
                updatePreview();
            }
        }, 100);
    });
}

/**
 * Populate font select
 */
function populateFontSelect() {
    const select = document.getElementById('font-select');
    if (!select) return;
    
    PNG_CONFIG.fonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font.value;
        option.textContent = font.name;
        select.appendChild(option);
    });
    
    select.value = customization.fontFamily;
}

/**
 * Populate background image select
 */
function populateBackgroundImageSelect() {
    const select = document.getElementById('background-image-select');
    if (!select) return;
    
    // Add "None" option
    select.innerHTML = '<option value="">None</option>';
    
    const images = PNG_CONFIG.getAllBackgroundImages();
    images.forEach(img => {
        const option = document.createElement('option');
        option.value = img.value;
        option.textContent = img.name;
        select.appendChild(option);
    });
    
    select.value = customization.backgroundImage;
}

/**
 * Populate gradient direction select
 */
function populateGradientDirectionSelect() {
    const select = document.getElementById('gradient-direction');
    if (!select) return;
    
    PNG_CONFIG.gradientDirections.forEach(dir => {
        const option = document.createElement('option');
        option.value = dir.value;
        option.textContent = dir.name;
        select.appendChild(option);
    });
    
    select.value = customization.gradientDirection;
}

/**
 * Populate logo image select
 */
function populateLogoImageSelect() {
    const select = document.getElementById('logo-select');
    if (!select) return;
    
    // Clear existing options
    select.innerHTML = '';
    
    PNG_CONFIG.logos.forEach(logo => {
        const option = document.createElement('option');
        option.value = logo.path;
        option.textContent = logo.name;
        select.appendChild(option);
    });
    
    select.value = customization.logo;
}

/**
 * Populate logo position select
 */
function populateLogoPositionSelect() {
    const select = document.getElementById('logo-position-select');
    if (!select) return;
    
    PNG_CONFIG.logoPositions.forEach(pos => {
        const option = document.createElement('option');
        option.value = pos.value;
        option.textContent = pos.name;
        select.appendChild(option);
    });
    
    select.value = customization.logoPosition;
}

/**
 * Set up event listeners
 */
function setupShareEventListeners() {
    // Font select
    const fontSelect = document.getElementById('font-select');
    if (fontSelect) fontSelect.addEventListener('change', (e) => {
        customization.fontFamily = e.target.value;
        updatePreview();
    });
    
    // Font size
    const fontSize = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    if (fontSize) fontSize.addEventListener('input', (e) => {
        customization.fontSize = parseInt(e.target.value);
        if (fontSizeValue) fontSizeValue.textContent = e.target.value + 'px';
        updatePreview();
    });
    
    // Text color
    const textColor = document.getElementById('text-color');
    const textColorHex = document.getElementById('text-color-hex');
    if (textColor) textColor.addEventListener('input', (e) => {
        customization.textColor = e.target.value;
        if (textColorHex) textColorHex.value = e.target.value;
        updatePreview();
    });
    if (textColorHex) textColorHex.addEventListener('input', (e) => {
        customization.textColor = e.target.value;
        if (textColor) textColor.value = e.target.value;
        updatePreview();
    });
    
    // Background color picker (sets priority to 'color')
    const bgColor = document.getElementById('bg-color');
    const bgColorHex = document.getElementById('bg-color-hex');
    if (bgColor) bgColor.addEventListener('input', (e) => {
        customization.backgroundColor = e.target.value;
        customization.backgroundType = 'color';
        if (bgColorHex) bgColorHex.value = e.target.value;
        updatePreview();
    });
    if (bgColorHex) bgColorHex.addEventListener('input', (e) => {
        const value = e.target.value;
        // Validate hex color
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            customization.backgroundColor = value;
            customization.backgroundType = 'color';
            if (bgColor) bgColor.value = value;
            updatePreview();
        }
    });
    
    // Gradient color pickers (sets priority to 'gradient')
    const gradientColor1 = document.getElementById('gradient-color1');
    const gradientColor2 = document.getElementById('gradient-color2');
    if (gradientColor1) gradientColor1.addEventListener('input', (e) => {
        customization.gradientColor1 = e.target.value;
        customization.backgroundType = 'gradient';
        updatePreview();
    });
    if (gradientColor2) gradientColor2.addEventListener('input', (e) => {
        customization.gradientColor2 = e.target.value;
        customization.backgroundType = 'gradient';
        updatePreview();
    });
    
    // Gradient direction (sets priority to 'gradient')
    const gradientDirection = document.getElementById('gradient-direction');
    if (gradientDirection) gradientDirection.addEventListener('change', (e) => {
        customization.gradientDirection = e.target.value;
        customization.backgroundType = 'gradient';
        updatePreview();
    });
    
    // Background image select (sets priority to 'image')
    const backgroundImageSelect = document.getElementById('background-image-select');
    if (backgroundImageSelect) backgroundImageSelect.addEventListener('change', (e) => {
        customization.backgroundImage = e.target.value;
        if (e.target.value) {
            customization.backgroundType = 'image';
        } else {
            // If "None" is selected, revert to color
            customization.backgroundType = 'color';
        }
        updatePreview();
    });
    
    // Listen for wallpapers loaded event
    window.addEventListener('wallpapers-loaded', () => {
        populateBackgroundImageSelect();
    });
    
    // Listen for logos loaded event
    window.addEventListener('logos-loaded', () => {
        populateLogoImageSelect();
    });
    
    // Text align buttons
    document.querySelectorAll('.align-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            customization.textAlign = btn.dataset.align;
            updatePreview();
        });
    });
    
    // Logo selection
    const logoSelect = document.getElementById('logo-select');
    if (logoSelect) logoSelect.addEventListener('change', (e) => {
        customization.logo = e.target.value;
        updatePreview();
    });
    
    // Logo position
    const logoPositionSelect = document.getElementById('logo-position-select');
    if (logoPositionSelect) logoPositionSelect.addEventListener('change', (e) => {
        customization.logoPosition = e.target.value;
        updatePreview();
    });
    
    // Reset button
    const resetBtn = document.getElementById('reset-customization');
    if (resetBtn) resetBtn.addEventListener('click', resetCustomization);
    
    // Close button
    const closeBtn = document.getElementById('close-share-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeShareModal);
    
    // Click outside to close
    const modal = document.getElementById('share-modal');
    if (modal) modal.addEventListener('click', (e) => {
        if (e.target === modal) closeShareModal();
    });
}

// ============================================================================
// MODAL CONTROL
// ============================================================================

/**
 * Open share modal
 */
function openShareModal() {
    const phraseElement = document.getElementById('phrase-text');
    if (phraseElement) {
        currentPhrase = phraseElement.textContent;
    }
    
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.add('active');
        updatePreview();
    }
}

/**
 * Close share modal
 */
function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Reset customization to defaults
 */
function resetCustomization() {
    customization = {
        fontFamily: PNG_CONFIG.defaults.fontFamily,
        fontSize: PNG_CONFIG.defaults.fontSize,
        textColor: PNG_CONFIG.defaults.textColor,
        backgroundColor: PNG_CONFIG.defaults.backgroundColor,
        backgroundImage: PNG_CONFIG.defaults.backgroundImage,
        gradientColor1: PNG_CONFIG.defaults.gradientColor1,
        gradientColor2: PNG_CONFIG.defaults.gradientColor2,
        gradientDirection: PNG_CONFIG.defaults.gradientDirection,
        backgroundType: PNG_CONFIG.defaults.backgroundType,
        textAlign: PNG_CONFIG.defaults.textAlign,
        logo: PNG_CONFIG.defaults.logo,
        logoPosition: PNG_CONFIG.defaults.logoPosition
    };
    
    // Update UI
    const fontSelect = document.getElementById('font-select');
    if (fontSelect) fontSelect.value = customization.fontFamily;
    
    const fontSize = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    if (fontSize) fontSize.value = customization.fontSize;
    if (fontSizeValue) fontSizeValue.textContent = customization.fontSize + 'px';
    
    const textColor = document.getElementById('text-color');
    const textColorHex = document.getElementById('text-color-hex');
    if (textColor) textColor.value = customization.textColor;
    if (textColorHex) textColorHex.value = customization.textColor;
    
    const bgColor = document.getElementById('bg-color');
    const bgColorHex = document.getElementById('bg-color-hex');
    if (bgColor) bgColor.value = customization.backgroundColor;
    if (bgColorHex) bgColorHex.value = customization.backgroundColor;
    
    const gradientColor1 = document.getElementById('gradient-color1');
    const gradientColor2 = document.getElementById('gradient-color2');
    const gradientDirection = document.getElementById('gradient-direction');
    if (gradientColor1) gradientColor1.value = customization.gradientColor1;
    if (gradientColor2) gradientColor2.value = customization.gradientColor2;
    if (gradientDirection) gradientDirection.value = customization.gradientDirection;
    
    const backgroundImageSelect = document.getElementById('background-image-select');
    if (backgroundImageSelect) backgroundImageSelect.value = customization.backgroundImage;
    
    const logoSelect = document.getElementById('logo-select');
    if (logoSelect) logoSelect.value = customization.logo;
    
    const logoPositionSelect = document.getElementById('logo-position-select');
    if (logoPositionSelect) logoPositionSelect.value = customization.logoPosition;
    
    // Reset align buttons
    document.querySelectorAll('.align-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.align === 'center');
    });
    
    updatePreview();
}

// ============================================================================
// PREVIEW
// ============================================================================

/**
 * Update preview
 */
function updatePreview() {
    const container = document.getElementById('preview-container');
    if (!container) return;
    
    // Always render at fixed preview size, then scale with CSS
    const previewWidth = 600;
    const previewHeight = 400;
    const exportWidth = 1200;
    const exportHeight = 800;
    const scaleFactor = previewWidth / exportWidth; // 0.5
    
    // Calculate scale to fit container while maintaining aspect ratio
    const containerWidth = container.clientWidth - 30;
    const containerHeight = container.clientHeight - 30;
    const scaleX = containerWidth / previewWidth;
    const scaleY = containerHeight / previewHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Never scale up beyond 1
    
    // Logo position styles (scaled proportionally)
    const logoSize = Math.round(150 * scaleFactor); // 75px in preview, 150px in export
    const logoOffset = Math.round(30 * scaleFactor); // 15px in preview, 30px in export
    let logoStyles = `position: absolute; width: ${logoSize}px; height: auto; z-index: 10; transition: 0.3s;`;
    switch(customization.logoPosition) {
        case 'top-left':
            logoStyles += ` top: ${logoOffset}px; left: ${logoOffset}px;`;
            break;
        case 'top-right':
            logoStyles += ` top: ${logoOffset}px; right: ${logoOffset}px;`;
            break;
        case 'bottom-left':
            logoStyles += ` bottom: ${logoOffset}px; left: ${logoOffset}px;`;
            break;
        case 'bottom-right':
        default:
            logoStyles += ` bottom: ${logoOffset}px; right: ${logoOffset}px;`;
            break;
    }
    
    // Scale all dimensions proportionally
    const padding = Math.round(80 * scaleFactor); // 40px in preview, 80px in export
    const borderWidth = Math.round(6 * scaleFactor); // 3px in preview, 6px in export
    const shadowOffset = Math.round(10 * scaleFactor); // 5px in preview, 10px in export
    const previewFontSize = Math.round(customization.fontSize * scaleFactor);
    
    // Handle background based on priority
    let backgroundStyle = '';
    let hasBackgroundImage = false;
    if (customization.backgroundType === 'image' && customization.backgroundImage) {
        // Use background image
        backgroundStyle = `background: url('${customization.backgroundImage}') center/cover no-repeat;`;
        hasBackgroundImage = true;
    } else if (customization.backgroundType === 'gradient') {
        // Use gradient
        const gradient = `linear-gradient(${customization.gradientDirection}, ${customization.gradientColor1}, ${customization.gradientColor2})`;
        backgroundStyle = `background: ${gradient};`;
    } else {
        // Use solid color (default)
        backgroundStyle = `background: ${customization.backgroundColor};`;
    }
    
    // Text box styling for background images (neobrutalist box)
    const textBoxPadding = Math.round(20 * scaleFactor); // 10px in preview, 20px in export
    const textBoxBorder = Math.round(3 * scaleFactor); // 1.5px in preview, 3px in export
    const textBoxShadow = Math.round(6 * scaleFactor); // 3px in preview, 6px in export
    
    let textWrapperStyle = '';
    if (hasBackgroundImage) {
        textWrapperStyle = `
            background: #FFFFFF;
            border: ${textBoxBorder}px solid #000;
            box-shadow: ${textBoxShadow}px ${textBoxShadow}px 0 #000;
            padding: ${textBoxPadding}px;
            max-width: 80%;
        `;
    } else {
        textWrapperStyle = `
            width: 100%;
        `;
    }
    
    container.innerHTML = `
        <div id="live-preview" style="
            width: ${previewWidth}px;
            height: ${previewHeight}px;
            padding: ${padding}px;
            ${backgroundStyle}
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: ${customization.fontFamily};
            box-sizing: border-box;
            position: relative;
            border: ${borderWidth}px solid #000;
            box-shadow: ${shadowOffset}px ${shadowOffset}px 0 #000;
            transform: scale(${scale});
            transform-origin: center center;
        ">
            <div style="${textWrapperStyle}">
                <div id="preview-text" style="
                    font-size: ${previewFontSize}px;
                    line-height: 1.5;
                    color: ${customization.textColor};
                    font-weight: 900;
                    text-align: ${customization.textAlign};
                ">${currentPhrase}</div>
            </div>
            <img id="preview-logo" src="${customization.logo}" style="${logoStyles}">
        </div>
    `;
}

// ============================================================================
// DOWNLOAD & SHARING
// ============================================================================

/**
 * Download PNG
 */
async function downloadPNG() {
    const preview = createExportPreview();
    document.body.appendChild(preview);
    
    try {
        const canvas = await html2canvas(preview, {
            backgroundColor: null,
            scale: 2,
            logging: false
        });
        
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `fg2-phrase-${Date.now()}.png`;
        a.click();
        
        showToast('Image downloaded!');
    } catch (error) {
        console.error('Download failed:', error);
        showToast('Download failed. Please try again.');
    } finally {
        document.body.removeChild(preview);
    }
}

/**
 * Create export preview (full size for export)
 */
function createExportPreview() {
    const exportDiv = document.createElement('div');
    exportDiv.style.position = 'fixed';
    exportDiv.style.left = '-9999px';
    exportDiv.style.top = '-9999px';
    
    // Logo position styles
    let logoStyles = `position: absolute; width: 150px; height: auto; z-index: 10;`;
    switch(customization.logoPosition) {
        case 'top-left':
            logoStyles += ' top: 30px; left: 30px;';
            break;
        case 'top-right':
            logoStyles += ' top: 30px; right: 30px;';
            break;
        case 'bottom-left':
            logoStyles += ' bottom: 30px; left: 30px;';
            break;
        case 'bottom-right':
        default:
            logoStyles += ' bottom: 30px; right: 30px;';
            break;
    }
    
    // Handle background based on priority
    let exportBackgroundStyle = '';
    let hasBackgroundImage = false;
    if (customization.backgroundType === 'image' && customization.backgroundImage) {
        // Use background image
        exportBackgroundStyle = `background: url('${customization.backgroundImage}') center/cover no-repeat;`;
        hasBackgroundImage = true;
    } else if (customization.backgroundType === 'gradient') {
        // Use gradient
        const gradient = `linear-gradient(${customization.gradientDirection}, ${customization.gradientColor1}, ${customization.gradientColor2})`;
        exportBackgroundStyle = `background: ${gradient};`;
    } else {
        // Use solid color (default)
        exportBackgroundStyle = `background: ${customization.backgroundColor};`;
    }
    
    // Text box styling for background images (neobrutalist box)
    let textWrapperStyle = '';
    if (hasBackgroundImage) {
        textWrapperStyle = `
            background: #FFFFFF;
            border: 3px solid #000;
            box-shadow: 6px 6px 0 #000;
            padding: 20px;
            max-width: 80%;
        `;
    } else {
        textWrapperStyle = `
            width: 100%;
        `;
    }
    
    exportDiv.innerHTML = `
        <div style="
            width: 1200px;
            height: 800px;
            padding: 80px;
            ${exportBackgroundStyle}
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: ${customization.fontFamily};
            box-sizing: border-box;
            position: relative;
            border: 6px solid #000;
            box-shadow: 10px 10px 0 #000;
        ">
            <div style="${textWrapperStyle}">
                <div style="
                    font-size: ${customization.fontSize}px;
                    line-height: 1.5;
                    color: ${customization.textColor};
                    font-weight: 900;
                    text-align: ${customization.textAlign};
                ">${currentPhrase}</div>
            </div>
            <img src="${customization.logo}" style="${logoStyles}">
        </div>
    `;
    
    return exportDiv;
}

/**
 * Build share buttons
 */
function buildShareButtons() {
    const container = document.querySelector('.share-options');
    if (!container) return;
    
    const buttons = [
        { icon: 'download', label: 'Download', onclick: 'downloadPNG()' },
        { icon: 'linkedin', label: 'LinkedIn', onclick: 'shareToLinkedIn()' },
        { icon: 'twitter', label: 'X', onclick: 'shareToTwitter()' },
        { icon: 'facebook', label: 'Facebook', onclick: 'shareToFacebook()' },
        { icon: 'bluesky', label: 'Bluesky', onclick: 'shareToBluesky()' },
        { icon: 'whatsapp', label: 'WhatsApp', onclick: 'shareToWhatsApp()' },
        { icon: 'messenger', label: 'Messenger', onclick: 'shareToMessenger()' },
        { icon: 'instagram', label: 'Instagram', onclick: 'shareToInstagram()' },
        { icon: 'embed', label: 'Embed', onclick: 'getEmbedCode()', class: 'embed-btn' }
    ];
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `share-option-btn ${btn.class || ''}`;
        button.setAttribute('onclick', btn.onclick);
        button.setAttribute('title', btn.label);
        button.innerHTML = getIcon(btn.icon);
        container.appendChild(button);
    });
}

/**
 * Get SVG icon
 */
function getIcon(name) {
    const icons = {
        download: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
        linkedin: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
        twitter: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
        facebook: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
        bluesky: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.038.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.018.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/></svg>',
        whatsapp: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
        messenger: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.084 0 11.536c0 3.627 1.813 6.863 4.65 8.978V24l3.371-1.85c.9.25 1.853.386 2.839.386 6.627 0 12-5.084 12-11.536S18.627 0 12 0zm1.2 15.536l-3.075-3.279-6 3.279 6.6-7.003 3.15 3.279 5.925-3.279-6.6 7.003z"/></svg>',
        instagram: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
        embed: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>'
    };
    
    return icons[name] || '';
}

// Share functions
function shareToLinkedIn() { showToast('Download and share on LinkedIn!'); setTimeout(downloadPNG, 500); }
function shareToTwitter() { showToast('Download and share on X!'); setTimeout(downloadPNG, 500); }
function shareToFacebook() { showToast('Download and share on Facebook!'); setTimeout(downloadPNG, 500); }
function shareToBluesky() { showToast('Download and share on Bluesky!'); setTimeout(downloadPNG, 500); }
function shareToWhatsApp() { showToast('Download and share on WhatsApp!'); setTimeout(downloadPNG, 500); }
function shareToMessenger() { showToast('Download and share on Messenger!'); setTimeout(downloadPNG, 500); }
function shareToInstagram() { showToast('Download and share on Instagram!'); setTimeout(downloadPNG, 500); }
function getEmbedCode() { showToast('Embed functionality coming soon!'); }

/**
 * Show toast notification
 */
function showToast(message) {
    const existing = document.querySelector('.share-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'share-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
}

// ============================================================================
// AUTO-INIT
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShareModal);
} else {
    initShareModal();
}

// Export functions
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.downloadPNG = downloadPNG;
window.shareToLinkedIn = shareToLinkedIn;
window.shareToTwitter = shareToTwitter;
window.shareToFacebook = shareToFacebook;
window.shareToBluesky = shareToBluesky;
window.shareToWhatsApp = shareToWhatsApp;
window.shareToMessenger = shareToMessenger;
window.shareToInstagram = shareToInstagram;
window.getEmbedCode = getEmbedCode;

console.log('FG2 Share module loaded');
