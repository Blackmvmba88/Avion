/**
 * Time Management
 * Handles time tracking and delta time calculations
 */

export class Time {
    constructor() {
        this.startTime = performance.now();
        this.currentTime = this.startTime;
        this.lastTime = this.startTime;
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.frameCount = 0;
    }
    
    /**
     * Update time values
     * @returns {number} Delta time in seconds
     */
    update() {
        this.currentTime = performance.now();
        this.deltaTime = (this.currentTime - this.lastTime) / 1000;
        this.elapsedTime = (this.currentTime - this.startTime) / 1000;
        this.lastTime = this.currentTime;
        this.frameCount++;
        
        return this.deltaTime;
    }
    
    /**
     * Get current FPS
     * @returns {number} Frames per second
     */
    getFPS() {
        return this.deltaTime > 0 ? 1 / this.deltaTime : 0;
    }
    
    /**
     * Reset time tracking
     */
    reset() {
        this.startTime = performance.now();
        this.currentTime = this.startTime;
        this.lastTime = this.startTime;
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.frameCount = 0;
    }
}

export default Time;
