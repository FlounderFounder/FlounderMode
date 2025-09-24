// Global Random Event Manager
class RandomEventManager {
    constructor() {
        this.activeEvents = new Set();
        this.eventQueue = [];
        this.isProcessing = false;
    }
    
    // Register a new random event
    registerEvent(eventName, probability, eventFunction) {
        console.log(`Registering event: ${eventName} with probability: ${probability}`);
        
        // Check if we can trigger this event
        if (this.canTriggerEvent()) {
            const shouldTrigger = Math.random() < probability;
            console.log(`Event ${eventName} random chance: ${shouldTrigger}`);
            
            if (shouldTrigger) {
                this.triggerEvent(eventName, eventFunction);
            }
        } else {
            console.log(`Event ${eventName} queued - another event is active`);
            this.eventQueue.push({ name: eventName, probability, function: eventFunction });
        }
    }
    
    // Check if we can trigger a new event
    canTriggerEvent() {
        return this.activeEvents.size === 0;
    }
    
    // Trigger an event
    triggerEvent(eventName, eventFunction) {
        console.log(`Triggering event: ${eventName}`);
        this.activeEvents.add(eventName);
        
        try {
            const result = eventFunction();
            
            // If the function returns a promise or has a cleanup method
            if (result && typeof result.then === 'function') {
                result.finally(() => {
                    this.endEvent(eventName);
                });
            } else if (result && typeof result.destroy === 'function') {
                // Store the destroy method for later cleanup
                this.eventCleanup.set(eventName, result.destroy);
            }
        } catch (error) {
            console.error(`Error in event ${eventName}:`, error);
            this.endEvent(eventName);
        }
    }
    
    // End an event
    endEvent(eventName) {
        console.log(`Ending event: ${eventName}`);
        this.activeEvents.delete(eventName);
        
        // Process queued events
        this.processQueue();
    }
    
    // Process the event queue
    processQueue() {
        if (this.isProcessing || this.eventQueue.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        
        // Wait a bit before processing the next event
        setTimeout(() => {
            if (this.canTriggerEvent() && this.eventQueue.length > 0) {
                const nextEvent = this.eventQueue.shift();
                console.log(`Processing queued event: ${nextEvent.name}`);
                this.registerEvent(nextEvent.name, nextEvent.probability, nextEvent.function);
            }
            this.isProcessing = false;
        }, 1000); // 1 second delay between events
    }
    
    // Get current status
    getStatus() {
        return {
            activeEvents: Array.from(this.activeEvents),
            queuedEvents: this.eventQueue.length,
            canTrigger: this.canTriggerEvent()
        };
    }
    
    // Force end all events (for testing)
    endAllEvents() {
        console.log('Force ending all events');
        this.activeEvents.clear();
        this.eventQueue = [];
    }
}

// Create global instance
window.randomEventManager = new RandomEventManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RandomEventManager;
}

