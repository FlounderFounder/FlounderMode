// ============================================================================
// PHRASE GENERATOR - Main Application
// ============================================================================

// ----------------------------------------------------------------------------
// STATE & DATA
// ----------------------------------------------------------------------------

let phrases = [];

// ----------------------------------------------------------------------------
// PHRASE LOADING & DISPLAY
// ----------------------------------------------------------------------------

/**
 * Load phrases from external text file
 */
async function loadPhrases() {
    try {
        const response = await fetch('/scripts/features/fg2-phrases.txt');
        const text = await response.text();
        phrases = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#'));
        
        if (phrases.length === 0) {
            throw new Error('No phrases found in file');
        }
        
        console.log(`Loaded ${phrases.length} phrases`);
    } catch (error) {
        console.error('Error loading phrases:', error);
        phrases = ['Hello!', 'Welcome!', 'Flounder Mode activated!'];
    }
}

/**
 * Get a random phrase
 */
function getRandomPhrase() {
    if (phrases.length === 0) {
        return 'Loading...';
    }
    const randomIndex = Math.floor(Math.random() * phrases.length);
    return phrases[randomIndex];
}

/**
 * Load and display a random phrase
 */
function loadRandomPhrase() {
    const phraseElement = document.getElementById('phrase-text');
    if (phraseElement) {
        phraseElement.textContent = getRandomPhrase();
    }
}

// ----------------------------------------------------------------------------
// WALLPAPER & BACKGROUND
// ----------------------------------------------------------------------------

/**
 * Change wallpaper from dropdown selection
 */
function changeWallpaperFromDropdown(value) {
    const body = document.body;
    const previewContent = document.getElementById('preview-content');
    
    // Get position and color
    const position = document.getElementById('position-select')?.value || 'fill';
    const bgColor = document.getElementById('bg-color-picker')?.value || '#FAFF00';
    
    // Clear existing background styles
    body.style.background = '';
    body.style.backgroundImage = '';
    body.style.backgroundSize = '';
    body.style.backgroundPosition = '';
    body.style.backgroundRepeat = '';
    body.style.backgroundColor = bgColor;
    
    if (previewContent) {
        previewContent.style.background = '';
        previewContent.style.backgroundImage = '';
        previewContent.style.backgroundSize = '';
        previewContent.style.backgroundPosition = '';
        previewContent.style.backgroundRepeat = '';
        previewContent.style.backgroundColor = bgColor;
    }
    
    // Apply wallpaper
    if (value === 'none') {
        body.style.backgroundColor = bgColor;
        if (previewContent) previewContent.style.backgroundColor = bgColor;
    } else if (value === 'default') {
        body.style.backgroundColor = '#FAFF00';
        if (previewContent) previewContent.style.backgroundColor = '#FAFF00';
    } else if (value === 'gradient1') {
        const gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        body.style.background = gradient;
        if (previewContent) previewContent.style.background = gradient;
    } else if (value === 'gradient2') {
        const gradient = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        body.style.background = gradient;
        if (previewContent) previewContent.style.background = gradient;
    } else if (value === 'gradient3') {
        const gradient = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        body.style.background = gradient;
        if (previewContent) previewContent.style.background = gradient;
    } else if (value === 'xp') {
        const gradient = 'linear-gradient(180deg, #0F5BA4 0%, #3C94D9 50%, #0F5BA4 100%)';
        body.style.background = gradient;
        if (previewContent) previewContent.style.background = gradient;
    } else if (value === 'dark') {
        body.style.backgroundColor = '#1a1a1a';
        if (previewContent) previewContent.style.backgroundColor = '#1a1a1a';
    } else {
        // Custom wallpaper image
        // Encode the URL to handle spaces and special characters
        const imageUrl = value.split('/').map(segment => encodeURIComponent(segment)).join('/');
        
        body.style.backgroundImage = `url("${imageUrl}")`;
        if (previewContent) previewContent.style.backgroundImage = `url("${imageUrl}")`;
        
        // Apply position settings
        applyPositionSettings(body, position);
        if (previewContent) applyPositionSettings(previewContent, position);
    }
    
    // Save selection
    localStorage.setItem('selectedWallpaper', value);
    localStorage.setItem('wallpaperPosition', position);
    localStorage.setItem('wallpaperBgColor', bgColor);
    
    // Update selection highlight
    updateWallpaperSelection(value);
}

/**
 * Apply position settings to element
 */
function applyPositionSettings(element, position) {
    switch(position) {
        case 'fill':
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center';
            element.style.backgroundRepeat = 'no-repeat';
            break;
        case 'fit':
            element.style.backgroundSize = 'contain';
            element.style.backgroundPosition = 'center';
            element.style.backgroundRepeat = 'no-repeat';
            break;
        case 'center':
            element.style.backgroundSize = 'auto';
            element.style.backgroundPosition = 'center';
            element.style.backgroundRepeat = 'no-repeat';
            break;
        case 'stretch':
            element.style.backgroundSize = '100% 100%';
            element.style.backgroundPosition = 'center';
            element.style.backgroundRepeat = 'no-repeat';
            break;
        case 'tile':
            element.style.backgroundSize = 'auto';
            element.style.backgroundPosition = 'top left';
            element.style.backgroundRepeat = 'repeat';
            break;
    }
}

/**
 * Change wallpaper position
 */
function changeWallpaperPosition(position) {
    const select = document.getElementById('wallpaper-select');
    if (select && select.value) {
        changeWallpaperFromDropdown(select.value);
    }
}

/**
 * Change background color
 */
function changeBackgroundColor(color) {
    // Sync color picker and input
    const colorPicker = document.getElementById('bg-color-picker');
    const colorInput = document.getElementById('bg-color-input');
    
    if (colorPicker && colorInput) {
        colorPicker.value = color;
        colorInput.value = color;
    }
    
    // Reapply current wallpaper with new color
    const select = document.getElementById('wallpaper-select');
    if (select && select.value) {
        changeWallpaperFromDropdown(select.value);
    }
}

/**
 * Update wallpaper selection highlight
 */
function updateWallpaperSelection(selectedValue) {
    const select = document.getElementById('wallpaper-select');
    if (!select) return;
    
    const options = select.querySelectorAll('option');
    options.forEach(option => {
        option.selected = (option.value === selectedValue);
    });
}

/**
 * Load custom wallpapers from JSON
 */
async function loadCustomWallpapers() {
    try {
        const response = await fetch('/assets/wallpapers/wallpapers.json');
        const wallpapers = await response.json();
        
        const optgroup = document.getElementById('custom-wallpapers-optgroup');
        if (optgroup && wallpapers.length > 0) {
            wallpapers.forEach(wallpaper => {
                const option = document.createElement('option');
                option.value = wallpaper.path;
                option.textContent = wallpaper.name;
                optgroup.appendChild(option);
            });
        }
    } catch (error) {
        console.log('No custom wallpapers found:', error);
    }
}

/**
 * Load saved wallpaper from localStorage
 */
function loadSavedWallpaper() {
    const savedWallpaper = localStorage.getItem('selectedWallpaper');
    const savedPosition = localStorage.getItem('wallpaperPosition') || 'fill';
    const savedBgColor = localStorage.getItem('wallpaperBgColor') || '#FAFF00';
    
    // Set the saved values in the UI
    const wallpaperSelect = document.getElementById('wallpaper-select');
    const positionSelect = document.getElementById('position-select');
    const colorPicker = document.getElementById('bg-color-picker');
    const colorInput = document.getElementById('bg-color-input');
    
    if (positionSelect) positionSelect.value = savedPosition;
    if (colorPicker) colorPicker.value = savedBgColor;
    if (colorInput) colorInput.value = savedBgColor;
    
    if (savedWallpaper && wallpaperSelect) {
        wallpaperSelect.value = savedWallpaper;
        changeWallpaperFromDropdown(savedWallpaper);
    } else {
        // Apply default Bliss wallpaper
        const defaultWallpaper = '/assets/wallpapers/Windows XP/Bliss.jpg';
        changeWallpaperFromDropdown(defaultWallpaper);
        if (wallpaperSelect) {
            wallpaperSelect.value = defaultWallpaper;
        }
    }
}

// ----------------------------------------------------------------------------
// START MENU
// ----------------------------------------------------------------------------

/**
 * Toggle start menu visibility
 */
function toggleMenu() {
    const menu = document.getElementById('start-menu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

/**
 * Load menu items from config
 */
function loadMenuItems() {
    if (typeof CONFIG === 'undefined') {
        console.warn('CONFIG not loaded');
        return;
    }
    
    const menuItems = document.getElementById('start-menu-items');
    if (menuItems && CONFIG.projects) {
        CONFIG.projects.forEach(project => {
            const item = document.createElement('a');
            item.href = project.url;
            item.className = 'start-menu-item';
            item.innerHTML = `
                <div class="start-menu-item-icon">${project.icon}</div>
                <div class="start-menu-item-text">${project.title || project.name || 'Untitled'}</div>
            `;
            menuItems.appendChild(item);
        });
    }
    
    const menuFooter = document.getElementById('start-menu-footer');
    if (menuFooter && CONFIG.social) {
        // Convert social object to array for easier iteration
        Object.entries(CONFIG.social).forEach(([platform, url]) => {
            const link = document.createElement('a');
            link.href = url;
            link.className = 'social-link';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.title = platform.charAt(0).toUpperCase() + platform.slice(1);
            
            // Add appropriate icon based on platform
            const icons = {
                twitter: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
                github: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>'
            };
            link.innerHTML = icons[platform] || '🔗';
            menuFooter.appendChild(link);
        });
    }
}

// ----------------------------------------------------------------------------
// SETTINGS WINDOW
// ----------------------------------------------------------------------------

/**
 * Open settings window
 */
async function openSettings() {
    const settingsWindow = document.getElementById('settings-window');
    if (settingsWindow) {
        settingsWindow.classList.add('active');
    }
}

/**
 * Close settings window
 */
function closeSettings() {
    const settingsWindow = document.getElementById('settings-window');
    if (settingsWindow) {
        settingsWindow.classList.remove('active');
    }
}

// ----------------------------------------------------------------------------
// CLOCK
// ----------------------------------------------------------------------------

/**
 * Update taskbar clock
 */
function updateClock() {
    const clockElement = document.getElementById('taskbar-time');
    if (clockElement) {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        clockElement.textContent = `${hours}:${minutes} ${ampm}`;
    }
}

// ----------------------------------------------------------------------------
// PHRASE SUBMISSION
// ----------------------------------------------------------------------------

/**
 * Get Supabase client
 */
function getSupabaseClient() {
    // Supabase config from supabase-voting.js
    const SUPABASE_URL = 'https://tsnehoknvrxouphrtpik.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzbmVob2tudnJ4b3VwaHJ0cGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1Nzg5MTEsImV4cCI6MjA3NDE1NDkxMX0._405Oa6iDtazAsy6TBrfG_vMHfEIFqW7M4GNKmd2Dxk';
    
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return null;
}

/**
 * Open submit phrase modal
 */
function openSubmitModal() {
    const modal = document.getElementById('submit-window');
    if (modal) {
        modal.classList.remove('hide');
        modal.classList.add('active');
        // Reset form
        const form = document.getElementById('submit-phrase-form');
        if (form) {
            form.reset();
            updateCharCounter('phrase-input', 'phraseCounter', 280);
            updateCharCounter('author-input', 'authorCounter', 50);
        }
    }
}

/**
 * Close submit phrase modal
 */
function closeSubmitModal() {
    const modal = document.getElementById('submit-window');
    if (modal) {
        modal.classList.remove('active');
        modal.classList.add('hide');
    }
}

/**
 * Close success modal
 */
function closeSuccessModal() {
    const modal = document.getElementById('success-window');
    if (modal) {
        modal.classList.remove('active');
        modal.classList.add('hide');
    }
}

/**
 * Submit another phrase
 */
function submitAnother() {
    // Close success modal
    closeSuccessModal();
    // Open submit modal
    openSubmitModal();
}

/**
 * Update character counter
 */
function updateCharCounter(inputId, counterId, maxLength) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    
    if (input && counter) {
        counter.textContent = input.value.length;
        
        // Visual feedback when approaching limit
        if (input.value.length > maxLength * 0.9) {
            counter.style.color = '#d9534f';
            counter.style.fontWeight = 'bold';
        } else {
            counter.style.color = '#666';
            counter.style.fontWeight = 'normal';
        }
    }
}

/**
 * Handle phrase submission
 */
async function handlePhraseSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const phraseInput = document.getElementById('phrase-input');
    const authorInput = document.getElementById('author-input');
    
    if (!phraseInput || !phraseInput.value.trim()) {
        alert('Please enter a phrase!');
        return;
    }
    
    const phrase = phraseInput.value.trim();
    const author = authorInput.value.trim() || 'Anonymous';
    
    // Close modal and show submitting message
    closeSubmitModal();
    showSubmittingMessage();
    
    try {
        // Get Supabase client
        const supabaseClient = getSupabaseClient();
        
        if (!supabaseClient) {
            throw new Error('Supabase not available');
        }
        
        // Insert submission into Supabase
        const { data, error } = await supabaseClient
            .from('phrase_submissions')
            .insert([
                {
                    phrase: phrase,
                    author: author,
                    status: 'pending'
                }
            ]);
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        console.log('Submission successful:', data);
        
        // Show success message
        showSuccessMessage();
        
        // Reset form
        form.reset();
        updateCharCounter('phrase-input', 'phraseCounter', 280);
        updateCharCounter('author-input', 'authorCounter', 50);
        
    } catch (error) {
        console.error('Submission error:', error);
        
        // Show error message
        const successModal = document.getElementById('success-window');
        if (successModal) {
            const successMessage = successModal.querySelector('.success-message');
            if (successMessage) {
                successMessage.innerHTML = `
                    <h3>❌ Oops!</h3>
                    <p>There was an error submitting your observation. Please try again.</p>
                `;
            }
            successModal.classList.add('active');
        }
    }
}

/**
 * Show submitting message
 */
function showSubmittingMessage() {
    const successModal = document.getElementById('success-window');
    if (successModal) {
        const successMessage = successModal.querySelector('.success-message');
        if (successMessage) {
            successMessage.innerHTML = `
                <h3>📤 Submitting...</h3>
                <p>Sending your observation...</p>
            `;
        }
        successModal.classList.remove('hide');
        successModal.classList.add('active');
    }
}

/**
 * Show success message
 */
function showSuccessMessage() {
    const successModal = document.getElementById('success-window');
    if (successModal) {
        const successMessage = successModal.querySelector('.success-message');
        if (successMessage) {
            successMessage.innerHTML = `
                <h3>🎉 Thanks for your submission!</h3>
                <p>Your observation has been sent and will be reviewed. If it makes the cut, it'll be added to the rotation.</p>
                <p>Feel the chaos? Submit another.</p>
            `;
        }
    }
}

// ----------------------------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------------------------

/**
 * Initialize the application
 */
async function init() {
    console.log('Initializing Phrase Generator...');
    
    // Load phrases
    await loadPhrases();
    loadRandomPhrase();
    
    // Load wallpapers and saved settings
    await loadCustomWallpapers();
    loadSavedWallpaper();
    
    // Load menu
    loadMenuItems();
    
    // Set up event listeners
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadRandomPhrase);
    }
    
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', openShareModal);
    }
    
    // Character counters for submission form
    const phraseInput = document.getElementById('phrase-input');
    if (phraseInput) {
        phraseInput.addEventListener('input', () => {
            updateCharCounter('phrase-input', 'phraseCounter', 280);
        });
    }
    
    const authorInput = document.getElementById('author-input');
    if (authorInput) {
        authorInput.addEventListener('input', () => {
            updateCharCounter('author-input', 'authorCounter', 50);
        });
    }
    
    // Start clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Close start menu when clicking outside
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('start-menu');
        const menuBtn = document.querySelector('.menu-btn');
        if (menu && menuBtn && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
            menu.classList.remove('active');
        }
    });
    
    // Close settings when clicking outside
    document.addEventListener('click', (e) => {
        const settingsWindow = document.getElementById('settings-window');
        if (settingsWindow && settingsWindow.classList.contains('active')) {
            if (e.target === settingsWindow) {
                closeSettings();
            }
        }
    });
    
    // Close submit modal when clicking outside
    document.addEventListener('click', (e) => {
        const submitWindow = document.getElementById('submit-window');
        if (submitWindow && submitWindow.classList.contains('active')) {
            if (e.target === submitWindow) {
                closeSubmitModal();
            }
        }
    });
    
    // Close success modal when clicking outside
    document.addEventListener('click', (e) => {
        const successWindow = document.getElementById('success-window');
        if (successWindow && successWindow.classList.contains('active')) {
            if (e.target === successWindow) {
                closeSuccessModal();
            }
        }
    });
    
    console.log('Phrase Generator initialized!');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
