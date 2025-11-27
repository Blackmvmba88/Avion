/**
 * Game Loop
 * Fixed timestep game loop with variable rendering
 */

export class Loop {
    constructor(config = {}) {
        this.fixedTimestep = config.fixedTimestep || 1/60;
        this.maxSubSteps = config.maxSubSteps || 3;
        
        this.accumulator = 0;
        this.lastTime = performance.now();
        this.animationFrameId = null;
        this.running = false;
        
        this.updateCallback = null;
        this.renderCallback = null;
    }
    
    /**
     * Set update callback (fixed timestep)
     * @param {Function} callback - Called with (deltaTime)
     */
    setUpdateCallback(callback) {
        this.updateCallback = callback;
    }
    
    /**
     * Set render callback (variable timestep)
     * @param {Function} callback - Called with (alpha) for interpolation
     */
    setRenderCallback(callback) {
        this.renderCallback = callback;
    }
    
    /**
     * Start the game loop
     */
    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.tick();
    }
    
    /**
     * Stop the game loop
     */
    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * Main loop tick
     */
    tick = () => {
        if (!this.running) return;
        
        const currentTime = performance.now();
        let deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Limit deltaTime to prevent spiral of death
        if (deltaTime > 0.25) deltaTime = 0.25;
        
        this.accumulator += deltaTime;
        
        // Fixed timestep updates
        let steps = 0;
        while (this.accumulator >= this.fixedTimestep && steps < this.maxSubSteps) {
            if (this.updateCallback) {
                this.updateCallback(this.fixedTimestep);
            }
            this.accumulator -= this.fixedTimestep;
            steps++;
        }
        
        // Render with interpolation
        const alpha = this.accumulator / this.fixedTimestep;
        if (this.renderCallback) {
            this.renderCallback(alpha);
        }
        
        this.animationFrameId = requestAnimationFrame(this.tick);
    };
}

export default Loop;
