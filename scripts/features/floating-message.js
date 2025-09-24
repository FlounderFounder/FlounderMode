// Example Random Event: Floating Message
class FloatingMessage {
    constructor(message) {
        this.message = message;
        this.element = null;
        this.duration = 3000; // 3 seconds
        this.createMessage();
    }
    
    createMessage() {
        // Create the floating message element
        this.element = document.createElement('div');
        this.element.className = 'floating-message';
        this.element.textContent = this.message;
        
        // Style the message
        this.element.style.position = 'fixed';
        this.element.style.top = '20px';
        this.element.style.left = '50%';
        this.element.style.transform = 'translateX(-50%)';
        this.element.style.background = 'rgba(0, 0, 0, 0.8)';
        this.element.style.color = 'white';
        this.element.style.padding = '12px 24px';
        this.element.style.borderRadius = '8px';
        this.element.style.fontFamily = 'Roboto Mono, monospace';
        this.element.style.fontSize = '14px';
        this.element.style.fontWeight = 'bold';
        this.element.style.zIndex = '2000';
        this.element.style.pointerEvents = 'none';
        this.element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        
        // Add to body
        document.body.appendChild(this.element);
        
        // Animate in
        this.element.animate([
            { opacity: 0, transform: 'translateX(-50%) translateY(-20px)' },
            { opacity: 1, transform: 'translateX(-50%) translateY(0px)' }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
        
        // Auto-remove after duration
        setTimeout(() => {
            this.destroy();
        }, this.duration);
    }
    
    destroy() {
        if (this.element) {
            // Animate out
            this.element.animate([
                { opacity: 1, transform: 'translateX(-50%) translateY(0px)' },
                { opacity: 0, transform: 'translateX(-50%) translateY(-20px)' }
            ], {
                duration: 300,
                easing: 'ease-in'
            }).onfinish = () => {
                this.element.remove();
            };
        }
        
        // Notify the event manager that this event has ended
        if (window.randomEventManager) {
            window.randomEventManager.endEvent('floating-message');
        }
    }
}

// Register the floating message event
document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('test-page.html')) {
        const messages = [
            '🎉 Welcome to Floundermode!',
            '💡 Did you know you can contribute terms?',
            '🌟 Check out our latest definitions!',
            '🚀 Thanks for visiting!',
            '📚 Learn something new today!'
        ];
        
        window.randomEventManager.registerEvent('floating-message', 0.2, () => {
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            return new FloatingMessage(randomMessage);
        });
    }
});
