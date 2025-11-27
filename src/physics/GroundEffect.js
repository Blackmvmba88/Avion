/**
 * GroundEffect.js
 * Implements ground effect physics - the increased lift and reduced drag
 * that occurs when an aircraft flies close to the ground.
 * 
 * Ground effect becomes significant when altitude is less than one wingspan.
 */

import * as THREE from 'three';

/**
 * Ground effect constants
 */
const GROUND_EFFECT_CONSTANTS = Object.freeze({
    // Ground effect becomes significant below this ratio of altitude/wingspan
    MAX_HEIGHT_RATIO: 1.0,
    
    // Maximum lift increase factor at ground level
    MAX_LIFT_INCREASE: 0.25,    // 25% increase in lift
    
    // Maximum drag reduction factor at ground level
    MAX_DRAG_REDUCTION: 0.5,    // 50% reduction in induced drag
    
    // Transition smoothness factor
    SMOOTHNESS: 2.0
});

/**
 * GroundEffect class
 * Calculates ground effect modifications to lift and drag
 */
export class GroundEffect {
    /**
     * Create a new GroundEffect instance
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.wingSpan = config.wingSpan || 10;              // m
        this.enabled = config.enabled !== false;
        this.terrainHeightCallback = config.terrainHeightCallback || null;
        
        // Cached values for debugging
        this._cachedEffectStrength = 0;
        this._cachedHeightAboveGround = 0;
    }

    /**
     * Calculate height above ground
     * Takes into account terrain if a terrain callback is provided
     * @param {THREE.Vector3} position - Aircraft position
     * @returns {number} Height above ground in meters
     */
    calculateHeightAboveGround(position) {
        let groundHeight = 0;
        
        if (this.terrainHeightCallback) {
            groundHeight = this.terrainHeightCallback(position.x, position.z);
        }
        
        const heightAboveGround = Math.max(0, position.y - groundHeight);
        this._cachedHeightAboveGround = heightAboveGround;
        return heightAboveGround;
    }

    /**
     * Calculate ground effect strength
     * Returns a value from 0 (no effect) to 1 (maximum effect)
     * @param {number} heightAboveGround - Height above ground in meters
     * @returns {number} Ground effect strength (0-1)
     */
    calculateEffectStrength(heightAboveGround) {
        if (!this.enabled) return 0;
        
        const heightRatio = heightAboveGround / this.wingSpan;
        
        if (heightRatio >= GROUND_EFFECT_CONSTANTS.MAX_HEIGHT_RATIO) {
            this._cachedEffectStrength = 0;
            return 0;
        }
        
        // Smooth transition using exponential curve
        // Based on Prandtl's ground effect formula
        const effect = 1 - Math.pow(heightRatio / GROUND_EFFECT_CONSTANTS.MAX_HEIGHT_RATIO, 
            GROUND_EFFECT_CONSTANTS.SMOOTHNESS);
        
        this._cachedEffectStrength = effect;
        return effect;
    }

    /**
     * Calculate lift coefficient modifier due to ground effect
     * @param {number} effectStrength - Ground effect strength (0-1)
     * @param {number} baseLiftCoefficient - Base lift coefficient
     * @returns {number} Modified lift coefficient
     */
    modifyLiftCoefficient(effectStrength, baseLiftCoefficient) {
        const liftIncrease = 1 + (effectStrength * GROUND_EFFECT_CONSTANTS.MAX_LIFT_INCREASE);
        return baseLiftCoefficient * liftIncrease;
    }

    /**
     * Calculate drag coefficient modifier due to ground effect
     * Ground effect primarily reduces induced drag
     * @param {number} effectStrength - Ground effect strength (0-1)
     * @param {number} inducedDrag - Induced drag coefficient
     * @returns {number} Modified induced drag coefficient
     */
    modifyInducedDrag(effectStrength, inducedDrag) {
        const dragReduction = 1 - (effectStrength * GROUND_EFFECT_CONSTANTS.MAX_DRAG_REDUCTION);
        return inducedDrag * dragReduction;
    }

    /**
     * Apply ground effect to aerodynamic forces
     * @param {Object} params - Parameters
     * @param {THREE.Vector3} params.position - Aircraft position
     * @param {THREE.Vector3} params.liftForce - Original lift force
     * @param {THREE.Vector3} params.dragForce - Original drag force
     * @param {number} params.inducedDragRatio - Ratio of induced drag to total drag
     * @returns {Object} Modified forces and debug info
     */
    applyGroundEffect(params) {
        const { position, liftForce, dragForce, inducedDragRatio = 0.5 } = params;
        
        // Calculate height and effect strength
        const heightAboveGround = this.calculateHeightAboveGround(position);
        const effectStrength = this.calculateEffectStrength(heightAboveGround);
        
        // Create modified force copies
        const modifiedLift = liftForce.clone();
        const modifiedDrag = dragForce.clone();
        
        if (effectStrength > 0) {
            // Increase lift
            const liftMultiplier = 1 + (effectStrength * GROUND_EFFECT_CONSTANTS.MAX_LIFT_INCREASE);
            modifiedLift.multiplyScalar(liftMultiplier);
            
            // Reduce induced drag (only the induced portion)
            const inducedDragReduction = effectStrength * GROUND_EFFECT_CONSTANTS.MAX_DRAG_REDUCTION * inducedDragRatio;
            const dragMultiplier = 1 - inducedDragReduction;
            modifiedDrag.multiplyScalar(dragMultiplier);
        }
        
        return {
            liftForce: modifiedLift,
            dragForce: modifiedDrag,
            debug: {
                heightAboveGround,
                heightRatio: heightAboveGround / this.wingSpan,
                effectStrength,
                liftIncrease: effectStrength * GROUND_EFFECT_CONSTANTS.MAX_LIFT_INCREASE,
                dragReduction: effectStrength * GROUND_EFFECT_CONSTANTS.MAX_DRAG_REDUCTION * inducedDragRatio,
                isInGroundEffect: effectStrength > 0
            }
        };
    }

    /**
     * Get cushion effect for landing
     * Returns additional upward force when very close to ground
     * This simulates the "cushion" effect felt during flare
     * @param {THREE.Vector3} position - Aircraft position
     * @param {THREE.Vector3} velocity - Aircraft velocity
     * @param {number} wingArea - Wing area in m²
     * @param {number} airDensity - Air density in kg/m³
     * @returns {THREE.Vector3} Cushion force vector
     */
    getCushionForce(position, velocity, wingArea, airDensity) {
        const heightAboveGround = this.calculateHeightAboveGround(position);
        
        // Cushion effect only significant very close to ground
        if (heightAboveGround > this.wingSpan * 0.3) {
            return new THREE.Vector3(0, 0, 0);
        }
        
        // Calculate vertical velocity component
        const verticalVelocity = velocity.y;
        
        // Only apply cushion force when descending
        if (verticalVelocity >= 0) {
            return new THREE.Vector3(0, 0, 0);
        }
        
        // Calculate cushion strength based on height and descent rate
        const heightFactor = 1 - (heightAboveGround / (this.wingSpan * 0.3));
        const velocityFactor = Math.abs(verticalVelocity) / 10; // Normalize to typical descent rate
        
        // Dynamic pressure contribution
        const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        const dynamicPressure = 0.5 * airDensity * horizontalSpeed * horizontalSpeed;
        
        // Cushion force magnitude
        const cushionMagnitude = dynamicPressure * wingArea * 0.1 * heightFactor * Math.min(1, velocityFactor);
        
        return new THREE.Vector3(0, cushionMagnitude, 0);
    }

    /**
     * Check if aircraft is in ground effect zone
     * @param {THREE.Vector3} position - Aircraft position
     * @returns {boolean}
     */
    isInGroundEffect(position) {
        const heightAboveGround = this.calculateHeightAboveGround(position);
        return heightAboveGround < this.wingSpan * GROUND_EFFECT_CONSTANTS.MAX_HEIGHT_RATIO;
    }

    /**
     * Get current effect strength (cached from last calculation)
     * @returns {number}
     */
    getEffectStrength() {
        return this._cachedEffectStrength;
    }

    /**
     * Get current height above ground (cached from last calculation)
     * @returns {number}
     */
    getHeightAboveGround() {
        return this._cachedHeightAboveGround;
    }

    /**
     * Set terrain height callback
     * @param {Function} callback - Function(x, z) returning ground height
     */
    setTerrainHeightCallback(callback) {
        this.terrainHeightCallback = callback;
    }

    /**
     * Set wingspan for ground effect calculation
     * @param {number} wingspan - Wingspan in meters
     */
    setWingSpan(wingspan) {
        this.wingSpan = wingspan;
    }

    /**
     * Enable or disable ground effect
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

export { GROUND_EFFECT_CONSTANTS };
export default GroundEffect;
