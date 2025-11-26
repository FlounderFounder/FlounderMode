// ============================================================================
// PNG CUSTOMIZATION SETTINGS
// ============================================================================

const PNG_CONFIG = {
    // Font options
    fonts: [
        { name: 'Arial Black', value: "'Arial Black', 'Arial', sans-serif" },
        { name: 'Impact', value: "'Impact', sans-serif" },
        { name: 'Helvetica', value: "'Helvetica', 'Arial', sans-serif" },
        { name: 'Georgia', value: "'Georgia', serif" },
        { name: 'Times New Roman', value: "'Times New Roman', serif" },
        { name: 'Courier', value: "'Courier New', monospace" }
    ],
    
    // Gradient directions
    gradientDirections: [
        { name: 'Top to Bottom', value: 'to bottom' },
        { name: 'Bottom to Top', value: 'to top' },
        { name: 'Left to Right', value: 'to right' },
        { name: 'Right to Left', value: 'to left' },
        { name: 'Diagonal ↘', value: '135deg' },
        { name: 'Diagonal ↙', value: '45deg' },
        { name: 'Diagonal ↗', value: '225deg' },
        { name: 'Diagonal ↖', value: '315deg' }
    ],
    
    // Wallpapers (loaded from wallpapers.json)
    wallpapers: [],
    
    // Logo positions
    logoPositions: [
        { name: 'Top Left', value: 'top-left' },
        { name: 'Top Right', value: 'top-right' },
        { name: 'Bottom Left', value: 'bottom-left' },
        { name: 'Bottom Right', value: 'bottom-right' }
    ],
    
    // Logo options (loaded from logos.json)
    logos: [],
    
    // Default settings
    defaults: {
        fontFamily: "'Arial Black', 'Arial', sans-serif",
        fontSize: 48,
        textColor: '#000000',
        backgroundColor: '#FFFFFF',
        backgroundImage: '',
        gradientColor1: '#667eea',
        gradientColor2: '#764ba2',
        gradientDirection: '135deg',
        backgroundType: 'color', // 'color', 'gradient', or 'image'
        textAlign: 'center',
        logoPosition: 'bottom-right',
        logo: '/assets/logos/menacingly_red.png', // Default logo selection
        textBoxColor: '#FFFFFF', // Text box background color when using image backgrounds
        textBoxOpacity: 1.0 // Text box opacity (0.0 to 1.0)
    },
    
    // Get all background images (wallpapers only)
    getAllBackgroundImages() {
        return this.wallpapers.map(wp => ({
            name: wp.name,
            value: wp.path
        }));
    }
};

// Load wallpapers from JSON
async function loadWallpapers() {
    try {
        const response = await fetch('/assets/wallpapers/wallpapers.json');
        const wallpapers = await response.json();
        PNG_CONFIG.wallpapers = wallpapers;
        console.log(`Loaded ${wallpapers.length} wallpapers`);
        
        // Trigger event to notify share modal wallpapers are loaded
        window.dispatchEvent(new Event('wallpapers-loaded'));
    } catch (error) {
        console.error('Failed to load wallpapers:', error);
        PNG_CONFIG.wallpapers = [];
    }
}

// Load logos from JSON
async function loadLogos() {
    try {
        const response = await fetch('/assets/logos/logos.json');
        const logos = await response.json();
        PNG_CONFIG.logos = logos;
        console.log(`Loaded ${logos.length} logos`);
        
        // Trigger event to notify share modal logos are loaded
        window.dispatchEvent(new Event('logos-loaded'));
    } catch (error) {
        console.error('Failed to load logos:', error);
        PNG_CONFIG.logos = [];
    }
}

// Auto-load wallpapers and logos
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadWallpapers();
        loadLogos();
    });
} else {
    loadWallpapers();
    loadLogos();
}


