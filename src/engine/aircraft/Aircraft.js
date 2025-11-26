/**
 * Aircraft - Base Aircraft Class
 * Represents an aircraft with physics and rendering
 */

import { AIRCRAFT_CONFIG } from '../../config/aircraft.config.js';

export class Aircraft {
    constructor(config = {}) {
        this.name = config.name || 'Aircraft';
        this.physics = config.physics || {};
        this.visual = config.visual || {};
        
        // State
        this.position = { x: 0, y: 100, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.angularVelocity = { x: 0, y: 0, z: 0 };
        
        // Controls
        this.throttle = 0;
        this.controlInputs = {
            pitch: 0,
            roll: 0,
            yaw: 0
        };
        
        // TODO: Create 3D mesh
        // this.mesh = this.createMesh();
    }
    
    /**
     * Update aircraft physics and rendering
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // TODO: Update physics
        // TODO: Update visual representation
    }
    
    /**
     * Set throttle level
     * @param {number} value - Throttle (0-1)
     */
    setThrottle(value) {
        this.throttle = Math.max(0, Math.min(1, value));
    }
    
    /**
     * Set control input
     * @param {string} axis - Control axis (pitch, roll, yaw)
     * @param {number} value - Input value (-1 to 1)
     */
    setControlInput(axis, value) {
        if (this.controlInputs.hasOwnProperty(axis)) {
            this.controlInputs[axis] = Math.max(-1, Math.min(1, value));
        }
    }
    
    /**
     * Reset aircraft to initial state
     */
    reset() {
        this.position = { x: 0, y: 100, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.throttle = 0;
        this.controlInputs = { pitch: 0, roll: 0, yaw: 0 };
    }
}

export default Aircraft;
