/**
 * TimeOfDay.js
 * Manages day/night cycle with automatic time progression
 */

import * as THREE from 'three';

/**
 * TimeOfDay class
 * Handles time progression and lighting changes for day/night cycle
 */
export class TimeOfDay {
    /**
     * Create a new TimeOfDay system
     * @param {THREE.Scene} scene - The scene to apply lighting to
     * @param {Object} config - Time configuration
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        
        // Time settings (in hours, 0-24)
        this.currentTime = config.startTime || 12; // Start at noon
        this.timeSpeed = config.timeSpeed || 1; // 1 = real-time, higher = faster
        this.cycleDuration = config.cycleDuration || 24; // Full cycle in real minutes
        
        // Lighting
        this.sun = null;
        this.moon = null;
        this.ambientLight = null;
        this.sunLight = null;
        
        this.setupLighting();
    }

    /**
     * Setup sun and moon lights
     */
    setupLighting() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);

        // Sun (directional light)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.camera.left = -1000;
        this.sunLight.shadow.camera.right = 1000;
        this.sunLight.shadow.camera.top = 1000;
        this.sunLight.shadow.camera.bottom = -1000;
        this.sunLight.shadow.camera.near = 0.1;
        this.sunLight.shadow.camera.far = 5000;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.scene.add(this.sunLight);

        // Moon light (weaker directional light)
        this.moon = new THREE.DirectionalLight(0x8888ff, 0.2);
        this.scene.add(this.moon);

        // Initial position
        this.updateLighting();
    }

    /**
     * Update time and lighting
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Progress time based on speed and cycle duration
        // Convert cycle duration from minutes to seconds, then to hours per second
        const hoursPerSecond = (24 / (this.cycleDuration * 60)) * this.timeSpeed;
        this.currentTime += hoursPerSecond * deltaTime;
        
        // Wrap time to 24-hour cycle
        if (this.currentTime >= 24) {
            this.currentTime -= 24;
        }

        this.updateLighting();
    }

    /**
     * Update sun/moon positions and lighting based on time
     */
    updateLighting() {
        // Calculate sun angle (0 = midnight, 12 = noon)
        const sunAngle = (this.currentTime / 24) * Math.PI * 2 - Math.PI / 2;
        
        // Sun position
        const sunDistance = 2000;
        const sunX = Math.cos(sunAngle) * sunDistance;
        const sunY = Math.sin(sunAngle) * sunDistance;
        this.sunLight.position.set(sunX, sunY, 0);

        // Moon position (opposite to sun)
        const moonX = -sunX;
        const moonY = -sunY;
        this.moon.position.set(moonX, moonY, 0);

        // Adjust lighting intensity based on time of day
        const dayFactor = this.getDayFactor();
        
        // Sun intensity (brightest at noon, dim at sunrise/sunset)
        this.sunLight.intensity = Math.max(0, dayFactor) * 1.2;
        
        // Ambient light (darker at night)
        this.ambientLight.intensity = 0.2 + dayFactor * 0.3;
        
        // Sun color (warmer at sunrise/sunset)
        if (dayFactor > 0.7) {
            // Day
            this.sunLight.color.setHex(0xffffff);
        } else if (dayFactor > 0.2) {
            // Sunrise/Sunset
            this.sunLight.color.setHex(0xffaa66);
        } else {
            // Night
            this.sunLight.color.setHex(0x666699);
        }

        // Moon is visible at night
        this.moon.intensity = Math.max(0, 0.3 * (1 - dayFactor));
    }

    /**
     * Get day factor (0 = night, 1 = day)
     * @returns {number} Day factor from 0 to 1
     */
    getDayFactor() {
        // Smooth transition using sine wave
        const angle = (this.currentTime / 24) * Math.PI * 2 - Math.PI / 2;
        return Math.max(0, Math.sin(angle));
    }

    /**
     * Get sky colors based on time of day
     * @returns {Object} Sky color configuration
     */
    getSkyColors() {
        const dayFactor = this.getDayFactor();
        
        // Day colors
        const dayTop = new THREE.Color(0x0077ff);
        const dayBottom = new THREE.Color(0xffffff);
        
        // Sunset colors
        const sunsetTop = new THREE.Color(0xff6600);
        const sunsetBottom = new THREE.Color(0xff9966);
        
        // Night colors
        const nightTop = new THREE.Color(0x000033);
        const nightBottom = new THREE.Color(0x000066);

        let topColor, bottomColor;

        if (dayFactor > 0.7) {
            // Full day
            topColor = dayTop;
            bottomColor = dayBottom;
        } else if (dayFactor > 0.3) {
            // Transition to/from sunset
            const sunsetFactor = (dayFactor - 0.3) / 0.4;
            topColor = new THREE.Color().lerpColors(sunsetTop, dayTop, sunsetFactor);
            bottomColor = new THREE.Color().lerpColors(sunsetBottom, dayBottom, sunsetFactor);
        } else if (dayFactor > 0.1) {
            // Sunset/sunrise
            const sunsetFactor = (dayFactor - 0.1) / 0.2;
            topColor = new THREE.Color().lerpColors(nightTop, sunsetTop, sunsetFactor);
            bottomColor = new THREE.Color().lerpColors(nightBottom, sunsetBottom, sunsetFactor);
        } else {
            // Night
            topColor = nightTop;
            bottomColor = nightBottom;
        }

        return { topColor, bottomColor };
    }

    /**
     * Set time of day manually
     * @param {number} hour - Hour (0-24)
     */
    setTime(hour) {
        this.currentTime = hour % 24;
        this.updateLighting();
    }

    /**
     * Get current time
     * @returns {number} Current hour (0-24)
     */
    getTime() {
        return this.currentTime;
    }

    /**
     * Get formatted time string
     * @returns {string} Time in HH:MM format
     */
    getTimeString() {
        const hours = Math.floor(this.currentTime);
        const minutes = Math.floor((this.currentTime - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    /**
     * Dispose of lighting
     */
    dispose() {
        if (this.sunLight) this.scene.remove(this.sunLight);
        if (this.moon) this.scene.remove(this.moon);
        if (this.ambientLight) this.scene.remove(this.ambientLight);
    }
}
