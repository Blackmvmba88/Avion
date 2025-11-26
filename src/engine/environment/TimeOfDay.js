/**
 * Time of Day System
 * Manages day/night cycle and sun positioning
 */

export class TimeOfDay {
    constructor(config = {}) {
        this.time = config.startTime || 12;
        this.timeSpeed = config.timeSpeed || 1;
        this.cycleDuration = config.cycleDuration || 1440;
    }
    
    /**
     * Update time of day
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        this.time += (deltaTime / 60) * this.timeSpeed;
        if (this.time >= 24) this.time -= 24;
        
        // TODO: Update sun position
        // TODO: Update sky colors
        // TODO: Update ambient lighting
    }
    
    /**
     * Get sun position
     * @returns {Object} {x, y, z} Sun position
     */
    getSunPosition() {
        const angle = (this.time / 24) * Math.PI * 2 - Math.PI / 2;
        return {
            x: Math.cos(angle) * 1000,
            y: Math.sin(angle) * 1000,
            z: 0
        };
    }
    
    /**
     * Set time of day
     * @param {number} hour - Hour (0-24)
     */
    setTime(hour) {
        this.time = Math.max(0, Math.min(24, hour));
    }
}

export default TimeOfDay;
