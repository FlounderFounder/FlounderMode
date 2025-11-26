// ============================================================================
// 2025 TECH CONFESSIONS SHARE - PNG Export & Social Sharing (html2canvas approach)
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
    logoPosition: PNG_CONFIG.defaults.logoPosition,
    textBoxColor: PNG_CONFIG.defaults.textBoxColor,
    textBoxOpacity: PNG_CONFIG.defaults.textBoxOpacity
};

// Canvas caching
let cachedCanvas = null;
let cachedBlob = null;
let cacheKey = null;

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Get cache key based on current state
 */
function getCacheKey() {
    return JSON.stringify({
        phrase: currentPhrase,
        customization: customization
    });
}

/**
 * Invalidate cache
 */
function invalidateCache() {
    cachedCanvas = null;
    cachedBlob = null;
    cacheKey = null;
}

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
    
    // Text box color (for image backgrounds)
    const textBoxColor = document.getElementById('text-box-color');
    const textBoxColorHex = document.getElementById('text-box-color-hex');
    if (textBoxColor) textBoxColor.addEventListener('input', (e) => {
        customization.textBoxColor = e.target.value;
        if (textBoxColorHex) textBoxColorHex.value = e.target.value;
        updatePreview();
    });
    if (textBoxColorHex) textBoxColorHex.addEventListener('input', (e) => {
        const value = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            customization.textBoxColor = value;
            if (textBoxColor) textBoxColor.value = value;
            updatePreview();
        }
    });
    
    // Text box opacity
    const textBoxOpacity = document.getElementById('text-box-opacity');
    const textBoxOpacityValue = document.getElementById('text-box-opacity-value');
    if (textBoxOpacity) textBoxOpacity.addEventListener('input', (e) => {
        customization.textBoxOpacity = parseFloat(e.target.value);
        if (textBoxOpacityValue) textBoxOpacityValue.textContent = Math.round(e.target.value * 100) + '%';
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
    const newPhrase = phraseElement ? phraseElement.textContent : '';
    
    // Invalidate cache if phrase changed
    if (newPhrase !== currentPhrase) {
        currentPhrase = newPhrase;
        invalidateCache();
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
        logoPosition: PNG_CONFIG.defaults.logoPosition,
        textBoxColor: PNG_CONFIG.defaults.textBoxColor,
        textBoxOpacity: PNG_CONFIG.defaults.textBoxOpacity
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
    
    const textBoxColor = document.getElementById('text-box-color');
    const textBoxColorHex = document.getElementById('text-box-color-hex');
    if (textBoxColor) textBoxColor.value = customization.textBoxColor;
    if (textBoxColorHex) textBoxColorHex.value = customization.textBoxColor;
    
    const textBoxOpacity = document.getElementById('text-box-opacity');
    const textBoxOpacityValue = document.getElementById('text-box-opacity-value');
    if (textBoxOpacity) textBoxOpacity.value = customization.textBoxOpacity;
    if (textBoxOpacityValue) textBoxOpacityValue.textContent = Math.round(customization.textBoxOpacity * 100) + '%';
    
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
    
    // Invalidate cache when preview updates (customization changed)
    invalidateCache();
    
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
    const logoSize = Math.round(200 * scaleFactor); // 100px in preview, 200px in export
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
        // Convert hex to rgba with opacity
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        const bgColorWithOpacity = hexToRgba(customization.textBoxColor, customization.textBoxOpacity);
        
        textWrapperStyle = `
            background: ${bgColorWithOpacity};
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
 * Generate or get cached canvas and blob
 */
async function getCanvasAndBlob() {
    const key = getCacheKey();
    
    // Return cached version if available
    if (cachedCanvas && cachedBlob && cacheKey === key) {
        return { canvas: cachedCanvas, blob: cachedBlob };
    }
    
    // Show loading state
    const shareBtn = document.querySelector('.share-image-btn');
    const downloadBtn = document.querySelector('.download-image-btn');
    if (shareBtn) {
        shareBtn.disabled = true;
        shareBtn.textContent = 'Generating...';
    }
    if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Generating...';
    }
    
    try {
        // Generate new canvas
        const preview = createExportPreview();
        document.body.appendChild(preview);
        
        const canvas = await html2canvas(preview, {
            backgroundColor: null,
            scale: 2,
            logging: false
        });
        
        document.body.removeChild(preview);
        
        // Convert to blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });
        
        // Cache the results
        cachedCanvas = canvas;
        cachedBlob = blob;
        cacheKey = key;
        
        return { canvas, blob };
    } finally {
        // Restore button states
        if (shareBtn) {
            shareBtn.disabled = false;
            shareBtn.textContent = '📤 Share Image';
        }
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.textContent = '💾 Download PNG';
        }
    }
}

/**
 * Share image using Web Share API
 */
async function shareImage() {
    try {
        const { blob } = await getCanvasAndBlob();
        
        // Create file for sharing
        const file = new File([blob], `2025-tech-confessions-${Date.now()}.png`, { type: 'image/png' });
        
        // Check if Web Share API is supported with files
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Check this out!',
                text: currentPhrase
            });
            showToast('Shared successfully!');
        } else {
            // Fallback to download
            showToast('Share not supported. Downloading instead...');
            setTimeout(() => downloadPNG(), 500);
        }
    } catch (error) {
        // User cancelled or error occurred
        if (error.name !== 'AbortError') {
            console.error('Share failed:', error);
            showToast('Share failed. Try downloading instead.');
        }
    }
}

/**
 * Download PNG
 */
async function downloadPNG() {
    try {
        const { canvas } = await getCanvasAndBlob();
        
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `2025-tech-confessions-${Date.now()}.png`;
        a.click();
        
        showToast('Image downloaded!');
    } catch (error) {
        console.error('Download failed:', error);
        showToast('Download failed. Please try again.');
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
    let logoStyles = `position: absolute; width: 200px; height: auto; z-index: 10;`;
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
        // Convert hex to rgba with opacity
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        const bgColorWithOpacity = hexToRgba(customization.textBoxColor, customization.textBoxOpacity);
        
        textWrapperStyle = `
            background: ${bgColorWithOpacity};
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
    
    // Simple two-button layout
    container.innerHTML = `
        <button class="share-image-btn primary-share-btn" onclick="shareImage()" title="Share Image">
            📤 Share Image
        </button>
        <button class="download-image-btn secondary-share-btn" onclick="downloadPNG()" title="Download PNG">
            💾 Download PNG
        </button>
    `;
}


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
window.shareImage = shareImage;

console.log('2025 Tech Confessions Share module loaded');
