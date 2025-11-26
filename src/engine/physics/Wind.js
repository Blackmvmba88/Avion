/**
 * Wind System
 * Handles wind effects and turbulence
 */

export class Wind {
    constructor(config = {}) {
        this.speed = config.speed || 0;          // m/s
        this.direction = config.direction || 0;   // degrees
        this.variation = config.variation || 0.2;
        this.turbulenceIntensity = config.turbulenceIntensity || 0.1;
    }
    
    /**
     * Get wind velocity vector at position
     * @param {Object} position - {x, y, z}
     * @param {number} time - Current time
     * @returns {Object} {x, y, z} wind velocity
     */
    getWindAt(position, time) {
        // Convert direction to radians
        const rad = this.direction * Math.PI / 180;
        
        // Base wind
        const baseX = Math.cos(rad) * this.speed;
        const baseZ = Math.sin(rad) * this.speed;
        
        // Add turbulence (simplified)
        const turbX = Math.sin(time * 2 + position.x * 0.01) * this.turbulenceIntensity;
        const turbY = Math.sin(time * 3 + position.y * 0.01) * this.turbulenceIntensity;
        const turbZ = Math.sin(time * 2.5 + position.z * 0.01) * this.turbulenceIntensity;
        
        return {
            x: baseX + turbX,
            y: turbY,
            z: baseZ + turbZ
        };
    }
    
    /**
     * Set wind conditions
     * @param {number} speed - Wind speed (m/s)
     * @param {number} direction - Wind direction (degrees)
     */
    setWind(speed, direction) {
        this.speed = speed;
        this.direction = direction;
    }
}

export default Wind;
