/**
 * WindSystem.js
 * Implements wind and turbulence simulation for realistic atmospheric effects.
 * Includes steady wind, gusts, and turbulence modeling.
 */

import * as THREE from 'three';

/**
 * Wind system constants
 */
const WIND_CONSTANTS = Object.freeze({
    // Turbulence intensity levels (standard deviation as fraction of mean wind)
    TURBULENCE_LIGHT: 0.1,
    TURBULENCE_MODERATE: 0.25,
    TURBULENCE_SEVERE: 0.5,
    
    // Gust parameters
    GUST_DURATION_MIN: 1.0,        // seconds
    GUST_DURATION_MAX: 5.0,        // seconds
    GUST_FREQUENCY_BASE: 0.05,     // Base probability per second
    
    // Thermal parameters
    THERMAL_STRENGTH_BASE: 3.0,    // m/s upward velocity
    THERMAL_RADIUS: 200,           // meters
    
    // Wind shear layer height
    WIND_SHEAR_HEIGHT: 300,        // meters - below this, wind varies with altitude
    
    // Atmospheric boundary layer
    BOUNDARY_LAYER_HEIGHT: 1000    // meters
});

/**
 * Turbulence types enumeration
 */
export const TurbulenceType = Object.freeze({
    NONE: 'none',
    LIGHT: 'light',
    MODERATE: 'moderate',
    SEVERE: 'severe',
    CLEAR_AIR: 'clear_air',
    MECHANICAL: 'mechanical',
    CONVECTIVE: 'convective'
});

/**
 * WindSystem class
 * Manages wind, gusts, turbulence, and thermal effects
 */
export class WindSystem {
    /**
     * Create a new WindSystem instance
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        // Base wind configuration
        this.baseWindSpeed = config.windSpeed || 5;                  // m/s
        this.baseWindDirection = config.windDirection || 0;          // degrees (0 = from north)
        this.windVariation = config.windVariation || 0.2;            // ±20% variation
        
        // Turbulence settings
        this.turbulenceType = config.turbulenceType || TurbulenceType.LIGHT;
        this.turbulenceIntensity = config.turbulenceIntensity || 0.1; // 0-1
        
        // Gust settings
        this.gustEnabled = config.gustEnabled !== false;
        this.gustIntensity = config.gustIntensity || 1.0;
        
        // Thermal settings
        this.thermalsEnabled = config.thermalsEnabled || false;
        this.thermalStrength = config.thermalStrength || 1.0;
        
        // Current state
        this._currentWind = new THREE.Vector3();
        this._turbulenceOffset = new THREE.Vector3();
        this._gustForce = new THREE.Vector3();
        this._thermalForce = new THREE.Vector3();
        
        // Timing
        this._time = 0;
        this._gustTimer = 0;
        this._gustDuration = 0;
        this._gustActive = false;
        this._gustDirection = new THREE.Vector3();
        this._gustSpeed = 0;
        
        // Perlin noise simulation (using sine combinations)
        this._noiseSeeds = {
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            z: Math.random() * 1000
        };
        
        // Thermal locations (procedurally generated)
        this._thermals = [];
        
        // Initialize wind vector
        this._updateBaseWind();
    }

    /**
     * Update base wind vector from speed and direction
     * @private
     */
    _updateBaseWind() {
        const dirRad = THREE.MathUtils.degToRad(this.baseWindDirection);
        this._currentWind.set(
            this.baseWindSpeed * Math.sin(dirRad),
            0,
            this.baseWindSpeed * Math.cos(dirRad)
        );
    }

    /**
     * Generate pseudo-random noise value using multiple sine waves
     * @param {number} t - Time parameter
     * @param {number} seed - Seed for variation
     * @returns {number} Noise value between -1 and 1
     * @private
     */
    _noise(t, seed) {
        // Combine multiple frequencies for natural-looking turbulence
        return (
            Math.sin(t * 0.7 + seed) * 0.5 +
            Math.sin(t * 1.3 + seed * 1.5) * 0.3 +
            Math.sin(t * 2.9 + seed * 0.7) * 0.15 +
            Math.sin(t * 5.1 + seed * 2.3) * 0.05
        );
    }

    /**
     * Calculate turbulence offset based on current settings
     * @param {number} deltaTime - Time step in seconds
     * @returns {THREE.Vector3} Turbulence velocity offset
     * @private
     */
    _calculateTurbulence(_deltaTime) {
        if (this.turbulenceType === TurbulenceType.NONE) {
            this._turbulenceOffset.set(0, 0, 0);
            return this._turbulenceOffset;
        }
        
        // Get intensity multiplier based on turbulence type
        let intensityMultiplier;
        switch (this.turbulenceType) {
            case TurbulenceType.LIGHT:
                intensityMultiplier = WIND_CONSTANTS.TURBULENCE_LIGHT;
                break;
            case TurbulenceType.MODERATE:
                intensityMultiplier = WIND_CONSTANTS.TURBULENCE_MODERATE;
                break;
            case TurbulenceType.SEVERE:
                intensityMultiplier = WIND_CONSTANTS.TURBULENCE_SEVERE;
                break;
            default:
                intensityMultiplier = WIND_CONSTANTS.TURBULENCE_LIGHT;
        }
        
        const magnitude = this.baseWindSpeed * intensityMultiplier * this.turbulenceIntensity;
        
        // Generate turbulence using noise functions
        this._turbulenceOffset.set(
            this._noise(this._time, this._noiseSeeds.x) * magnitude,
            this._noise(this._time, this._noiseSeeds.y) * magnitude * 0.5, // Less vertical
            this._noise(this._time, this._noiseSeeds.z) * magnitude
        );
        
        return this._turbulenceOffset;
    }

    /**
     * Update gust state and force
     * @param {number} deltaTime - Time step in seconds
     * @private
     */
    _updateGusts(deltaTime) {
        if (!this.gustEnabled) {
            this._gustForce.set(0, 0, 0);
            return;
        }
        
        if (this._gustActive) {
            // Update active gust
            this._gustTimer += deltaTime;
            
            if (this._gustTimer >= this._gustDuration) {
                // End gust
                this._gustActive = false;
                this._gustForce.set(0, 0, 0);
            } else {
                // Calculate gust strength with smooth envelope
                const progress = this._gustTimer / this._gustDuration;
                const envelope = Math.sin(progress * Math.PI); // Smooth rise and fall
                
                this._gustForce.copy(this._gustDirection)
                    .multiplyScalar(this._gustSpeed * envelope);
            }
        } else {
            // Check if new gust should start
            const gustProbability = WIND_CONSTANTS.GUST_FREQUENCY_BASE * this.gustIntensity * deltaTime;
            
            if (Math.random() < gustProbability) {
                // Start new gust
                this._gustActive = true;
                this._gustTimer = 0;
                this._gustDuration = WIND_CONSTANTS.GUST_DURATION_MIN + 
                    Math.random() * (WIND_CONSTANTS.GUST_DURATION_MAX - WIND_CONSTANTS.GUST_DURATION_MIN);
                
                // Random gust direction (biased toward wind direction)
                const randomAngle = (Math.random() - 0.5) * Math.PI * 0.5;
                const gustDir = THREE.MathUtils.degToRad(this.baseWindDirection) + randomAngle;
                
                this._gustDirection.set(
                    Math.sin(gustDir),
                    (Math.random() - 0.5) * 0.3, // Slight vertical component
                    Math.cos(gustDir)
                ).normalize();
                
                // Gust speed (50-150% of base wind)
                this._gustSpeed = this.baseWindSpeed * (0.5 + Math.random() * 1.0) * this.gustIntensity;
            }
        }
    }

    /**
     * Calculate wind variation with altitude (wind shear)
     * @param {number} altitude - Altitude in meters
     * @returns {number} Wind speed multiplier
     */
    calculateWindShear(altitude) {
        if (altitude <= 0) return 0.5; // Surface friction reduces wind
        
        if (altitude < WIND_CONSTANTS.WIND_SHEAR_HEIGHT) {
            // Logarithmic wind profile in boundary layer
            const z0 = 0.03; // Roughness length (grass terrain)
            const multiplier = Math.log(altitude / z0) / Math.log(WIND_CONSTANTS.WIND_SHEAR_HEIGHT / z0);
            return 0.5 + 0.5 * Math.max(0, Math.min(1, multiplier));
        }
        
        return 1.0; // Above boundary layer, full wind
    }

    /**
     * Calculate thermal updraft at position
     * @param {THREE.Vector3} position - Aircraft position
     * @returns {THREE.Vector3} Thermal velocity contribution
     * @private
     */
    _calculateThermal(position) {
        if (!this.thermalsEnabled || this._thermals.length === 0) {
            this._thermalForce.set(0, 0, 0);
            return this._thermalForce;
        }
        
        this._thermalForce.set(0, 0, 0);
        
        for (const thermal of this._thermals) {
            const dx = position.x - thermal.x;
            const dz = position.z - thermal.z;
            const horizontalDist = Math.sqrt(dx * dx + dz * dz);
            
            if (horizontalDist < thermal.radius) {
                // Inside thermal - calculate updraft strength
                const distRatio = horizontalDist / thermal.radius;
                
                // Gaussian-like profile with sink at edges
                let strength;
                if (distRatio < 0.5) {
                    // Core - strong updraft
                    strength = thermal.strength * (1 - distRatio * 2);
                } else {
                    // Edge - weakening and eventually sink
                    strength = thermal.strength * (1 - distRatio * 2) * 0.5;
                }
                
                // Altitude factor - thermals weaken at higher altitude
                const altFactor = Math.max(0, 1 - position.y / 2000);
                
                this._thermalForce.y += strength * altFactor * this.thermalStrength;
            }
        }
        
        return this._thermalForce;
    }

    /**
     * Update wind system
     * @param {number} deltaTime - Time step in seconds
     * @param {THREE.Vector3} position - Aircraft position (optional, for position-dependent effects)
     */
    update(deltaTime, position = null) {
        this._time += deltaTime;
        
        // Update turbulence
        this._calculateTurbulence(deltaTime);
        
        // Update gusts
        this._updateGusts(deltaTime);
        
        // Update thermals if position provided
        if (position) {
            this._calculateThermal(position);
        }
    }

    /**
     * Get total wind velocity at a given position and altitude
     * @param {THREE.Vector3} position - Position in world coordinates
     * @returns {THREE.Vector3} Wind velocity vector in m/s
     */
    getWindAtPosition(position) {
        const result = new THREE.Vector3();
        
        // Base wind with altitude variation
        const windShearMultiplier = this.calculateWindShear(position.y);
        result.copy(this._currentWind).multiplyScalar(windShearMultiplier);
        
        // Add turbulence
        result.add(this._turbulenceOffset);
        
        // Add gusts
        result.add(this._gustForce);
        
        // Add thermals
        result.add(this._thermalForce);
        
        return result;
    }

    /**
     * Get wind velocity to subtract from airspeed calculation
     * @param {THREE.Vector3} position - Aircraft position
     * @param {THREE.Vector3} groundVelocity - Aircraft velocity relative to ground
     * @returns {THREE.Vector3} True airspeed velocity
     */
    getTrueAirspeed(position, groundVelocity) {
        const wind = this.getWindAtPosition(position);
        return groundVelocity.clone().sub(wind);
    }

    /**
     * Get wind force on aircraft
     * @param {THREE.Vector3} position - Aircraft position
     * @param {number} mass - Aircraft mass in kg
     * @returns {THREE.Vector3} Force vector in N (approximation)
     */
    getWindForce(position, mass) {
        // This is a simplified model - actual force depends on aerodynamics
        const _wind = this.getWindAtPosition(position);
        
        // Add sudden changes as impulse forces
        const gustComponent = this._gustForce.clone();
        const turbulenceComponent = this._turbulenceOffset.clone();
        
        // Scale by a factor representing aircraft response
        const forceFactor = mass * 0.1;
        
        return gustComponent.add(turbulenceComponent).multiplyScalar(forceFactor);
    }

    /**
     * Add a thermal at specified location
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {number} strength - Thermal strength in m/s
     * @param {number} radius - Thermal radius in meters
     */
    addThermal(x, z, strength = WIND_CONSTANTS.THERMAL_STRENGTH_BASE, radius = WIND_CONSTANTS.THERMAL_RADIUS) {
        this._thermals.push({ x, z, strength, radius });
    }

    /**
     * Generate random thermals in an area
     * @param {number} count - Number of thermals
     * @param {number} areaSize - Size of area in meters
     */
    generateThermals(count, areaSize = 5000) {
        this._thermals = [];
        for (let i = 0; i < count; i++) {
            this.addThermal(
                (Math.random() - 0.5) * areaSize,
                (Math.random() - 0.5) * areaSize,
                WIND_CONSTANTS.THERMAL_STRENGTH_BASE * (0.5 + Math.random()),
                WIND_CONSTANTS.THERMAL_RADIUS * (0.5 + Math.random())
            );
        }
    }

    /**
     * Clear all thermals
     */
    clearThermals() {
        this._thermals = [];
    }

    /**
     * Set wind parameters
     * @param {number} speed - Wind speed in m/s
     * @param {number} direction - Wind direction in degrees (0 = from north)
     */
    setWind(speed, direction) {
        this.baseWindSpeed = Math.max(0, speed);
        this.baseWindDirection = direction % 360;
        this._updateBaseWind();
    }

    /**
     * Set turbulence parameters
     * @param {string} type - Turbulence type from TurbulenceType enum
     * @param {number} intensity - Intensity multiplier (0-1)
     */
    setTurbulence(type, intensity = 1.0) {
        this.turbulenceType = type;
        this.turbulenceIntensity = Math.max(0, Math.min(1, intensity));
    }

    /**
     * Enable or disable gusts
     * @param {boolean} enabled
     * @param {number} intensity - Gust intensity multiplier
     */
    setGusts(enabled, intensity = 1.0) {
        this.gustEnabled = enabled;
        this.gustIntensity = Math.max(0, intensity);
    }

    /**
     * Enable or disable thermals
     * @param {boolean} enabled
     * @param {number} strength - Thermal strength multiplier
     */
    setThermals(enabled, strength = 1.0) {
        this.thermalsEnabled = enabled;
        this.thermalStrength = strength;
    }

    /**
     * Get current wind speed and direction
     * @returns {Object} { speed, direction }
     */
    getWindInfo() {
        return {
            speed: this.baseWindSpeed,
            direction: this.baseWindDirection,
            turbulenceType: this.turbulenceType,
            turbulenceIntensity: this.turbulenceIntensity,
            gustActive: this._gustActive
        };
    }

    /**
     * Get current turbulence magnitude
     * @returns {number}
     */
    getTurbulenceMagnitude() {
        return this._turbulenceOffset.length();
    }

    /**
     * Check if a gust is currently active
     * @returns {boolean}
     */
    isGustActive() {
        return this._gustActive;
    }

    /**
     * Reset wind system to initial state
     */
    reset() {
        this._time = 0;
        this._gustActive = false;
        this._gustTimer = 0;
        this._gustForce.set(0, 0, 0);
        this._turbulenceOffset.set(0, 0, 0);
        this._thermalForce.set(0, 0, 0);
    }
}

export { WIND_CONSTANTS };
export default WindSystem;
