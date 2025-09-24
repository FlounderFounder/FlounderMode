// Bouncing Icon JavaScript (DVD Logo Style)
class MovingIcon {
    constructor() {
        this.icon = null;
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 2, y: 2 }; // Pixels per frame
        this.animationId = null;
        this.clickCount = 0;
        this.iconSize = 70;
        
        this.init();
    }
    
    init() {
        this.createIcon();
        this.setupEventListeners();
        this.startBouncing();
    }
    
    createIcon() {
        console.log('Creating icon element...'); // Debug log
        // Create the icon element
        this.icon = document.createElement('div');
        this.icon.className = 'moving-icon bouncing';
        this.icon.innerHTML = '🎯';
        this.icon.title = 'Click me!';
        
        // Set initial position
        this.setInitialPosition();
        
        // Add click handler
        this.icon.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Icon clicked!'); // Debug log
            this.handleClick();
        });
        
        // Add to body
        document.body.appendChild(this.icon);
        console.log('Icon added to body:', this.icon); // Debug log
    }
    
    setInitialPosition() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Start at a random position within bounds
        this.position.x = Math.random() * (viewportWidth - this.iconSize);
        this.position.y = Math.random() * (viewportHeight - this.iconSize);
        
        // Random initial velocity direction
        this.velocity.x = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2);
        this.velocity.y = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2);
        
        this.updatePosition();
    }
    
    startBouncing() {
        this.animate();
    }
    
    animate() {
        // Update position based on velocity
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        
        // Check for collisions with edges
        this.checkCollisions();
        
        // Update visual position
        this.updatePosition();
        
        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    checkCollisions() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Bounce off left and right edges
        if (this.position.x <= 0) {
            this.position.x = 0;
            this.velocity.x = Math.abs(this.velocity.x);
        } else if (this.position.x >= viewportWidth - this.iconSize) {
            this.position.x = viewportWidth - this.iconSize;
            this.velocity.x = -Math.abs(this.velocity.x);
        }
        
        // Bounce off top and bottom edges
        if (this.position.y <= 0) {
            this.position.y = 0;
            this.velocity.y = Math.abs(this.velocity.y);
        } else if (this.position.y >= viewportHeight - this.iconSize) {
            this.position.y = viewportHeight - this.iconSize;
            this.velocity.y = -Math.abs(this.velocity.y);
        }
    }
    
    updatePosition() {
        this.icon.style.left = this.position.x + 'px';
        this.icon.style.top = this.position.y + 'px';
    }
    
    handleClick() {
        console.log('handleClick called, clickCount:', this.clickCount); // Debug log
        this.clickCount++;
        
        // Add click effect
        this.icon.style.transform = 'scale(0.8)';
        setTimeout(() => {
            this.icon.style.transform = '';
        }, 150);
        
        // Change icon based on click count
        const icons = ['🎯', '🎪', '🎨', '🎭', '🎪', '🎯'];
        this.icon.innerHTML = icons[this.clickCount % icons.length];
        
        // Add some fun effects
        this.addClickEffect();
        
        // Redirect immediately on first click
        console.log('Redirecting to test page...'); // Debug log
        setTimeout(() => {
            window.location.href = '/pages/test-page.html';
        }, 500);
    }
    
    addClickEffect() {
        // Create a burst effect
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = this.position.x + 35 + 'px';
            particle.style.top = this.position.y + 35 + 'px';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][i % 4];
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1001';
            
            document.body.appendChild(particle);
            
            // Animate particle
            const angle = (i / 8) * Math.PI * 2;
            const distance = 50;
            const duration = 600;
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { 
                    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`, 
                    opacity: 0 
                }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                particle.remove();
            };
        }
    }
    
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            // Adjust position if icon goes out of bounds
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            if (this.position.x > viewportWidth - this.iconSize) {
                this.position.x = viewportWidth - this.iconSize;
            }
            if (this.position.y > viewportHeight - this.iconSize) {
                this.position.y = viewportHeight - this.iconSize;
            }
            
            this.updatePosition();
        });
        
        // Pause movement when page is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseMovement();
            } else {
                this.resumeMovement();
            }
        });
    }
    
    pauseMovement() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    resumeMovement() {
        if (!this.animationId) {
            this.animate();
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.icon) {
            this.icon.remove();
        }
        
        // Notify the event manager that this event has ended
        if (window.randomEventManager) {
            window.randomEventManager.endEvent('bouncing-icon');
        }
    }
}

// Initialize the moving icon using the random event manager
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, current path:', window.location.pathname); // Debug log
    // Only create the icon on the main page, not on the test page
    if (!window.location.pathname.includes('test-page.html')) {
        // Register the bouncing icon event with the random event manager
        window.randomEventManager.registerEvent('bouncing-icon', 0.3, () => {
            console.log('Creating moving icon...'); // Debug log
            // Clean up any existing icon first
            if (window.movingIcon) {
                console.log('Cleaning up existing icon...'); // Debug log
                window.movingIcon.destroy();
            }
            // Create a fresh icon instance
            window.movingIcon = new MovingIcon();
            console.log('Moving icon created:', window.movingIcon); // Debug log
            
            // Return the icon instance so the event manager can track it
            return window.movingIcon;
        });
    } else {
        console.log('On test page, not creating icon'); // Debug log
    }
});
