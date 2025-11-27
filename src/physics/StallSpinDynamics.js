/**
 * StallSpinDynamics.js
 * Implements stall and spin physics for realistic aircraft behavior
 * at high angles of attack and low airspeeds.
 */

import * as THREE from 'three';

/**
 * Stall and spin constants
 */
const STALL_CONSTANTS = Object.freeze({
    // Critical angles (degrees)
    STALL_ONSET_ANGLE: 12,           // Buffet begins
    STALL_CRITICAL_ANGLE: 16,        // Full stall
    DEEP_STALL_ANGLE: 25,            // Deep stall region
    
    // Post-stall lift characteristics
    POST_STALL_LIFT_SLOPE: -0.05,    // Lift curve slope after stall
    MINIMUM_LIFT_COEFFICIENT: 0.3,    // Minimum CL in deep stall
    
    // Spin entry parameters
    SPIN_ENTRY_YAW_RATE: 0.5,        // rad/s - yaw rate threshold for spin entry
    SPIN_ENTRY_ROLL_RATE: 0.3,       // rad/s - roll rate threshold
    SPIN_SUSCEPTIBILITY: 0.5,        // 0-1 - how easily aircraft enters spin
    
    // Spin characteristics
    SPIN_ROTATION_RATE: 2.5,         // rad/s - typical spin rotation rate
    SPIN_PITCH_ATTITUDE: -40,        // degrees - nose-down pitch in spin
    SPIN_DESCENT_RATE: 50,           // m/s - typical descent rate in spin
    
    // Recovery parameters
    RECOVERY_TIME_MIN: 2.0,          // seconds - minimum recovery time
    RECOVERY_YAW_THRESHOLD: 0.2,     // rad/s - yaw rate threshold for recovery
    ANTI_SPIN_EFFECTIVENESS: 0.8     // Effectiveness of opposite controls
});

/**
 * Stall warning levels
 */
export const StallWarningLevel = Object.freeze({
    NONE: 0,
    APPROACHING: 1,    // Within 3 degrees of stall
    BUFFET: 2,         // Aerodynamic buffet begins
    STALL: 3,          // Full stall
    DEEP_STALL: 4      // Deep stall, limited recovery authority
});

/**
 * Spin states
 */
export const SpinState = Object.freeze({
    NONE: 'none',
    INCIPIENT: 'incipient',     // Entering spin
    DEVELOPED: 'developed',     // Fully developed spin
    RECOVERING: 'recovering'    // Recovery in progress
});

/**
 * StallSpinDynamics class
 * Handles stall warnings, post-stall aerodynamics, and spin behavior
 */
export class StallSpinDynamics {
    /**
     * Create a new StallSpinDynamics instance
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        // Aircraft-specific stall parameters
        this.stallAngle = config.stallAngle || STALL_CONSTANTS.STALL_CRITICAL_ANGLE;
        this.stallOnsetAngle = config.stallOnsetAngle || STALL_CONSTANTS.STALL_ONSET_ANGLE;
        this.stallSpeed = config.stallSpeed || 40;  // m/s - stall speed at 1g
        
        // Wing characteristics affecting spin behavior
        this.wingDropTendency = config.wingDropTendency || 0.3;  // 0-1
        this.spinResistance = config.spinResistance || 0.5;      // 0-1
        
        // State tracking
        this._stallWarningLevel = StallWarningLevel.NONE;
        this._spinState = SpinState.NONE;
        this._spinDirection = 0;  // +1 for right, -1 for left
        this._spinRotations = 0;
        this._recoveryTimer = 0;
        this._isStalled = false;
        this._buffetIntensity = 0;
        
        // Cached calculations
        this._cachedAngleOfAttack = 0;
        this._cachedAirspeed = 0;
        this._cachedLoadFactor = 1;
    }

    /**
     * Calculate effective stall angle based on load factor and configuration
     * @param {number} loadFactor - Current g-load (1 = level flight)
     * @param {Object} config - Aircraft configuration (flaps, etc.)
     * @returns {number} Effective stall angle in degrees
     */
    calculateEffectiveStallAngle(loadFactor, config = {}) {
        // Base stall angle
        let effectiveAngle = this.stallAngle;
        
        // Stall angle decreases with increased load factor (bank turns)
        if (loadFactor > 1) {
            effectiveAngle *= 1 / Math.sqrt(loadFactor);
        }
        
        // Flaps increase stall angle (if implemented)
        if (config.flapsDeployed) {
            effectiveAngle += config.flapStallIncrease || 4;
        }
        
        return effectiveAngle;
    }

    /**
     * Calculate stall speed at current load factor
     * @param {number} loadFactor - Current g-load
     * @returns {number} Stall speed in m/s
     */
    calculateStallSpeed(loadFactor) {
        // Vs_g = Vs_1 * sqrt(n)
        return this.stallSpeed * Math.sqrt(Math.abs(loadFactor));
    }

    /**
     * Determine stall warning level
     * @param {number} angleOfAttack - Current AoA in degrees
     * @param {number} airspeed - Current airspeed in m/s
     * @param {number} loadFactor - Current load factor
     * @returns {number} StallWarningLevel
     */
    getStallWarning(angleOfAttack, airspeed, loadFactor) {
        const effectiveStallAngle = this.calculateEffectiveStallAngle(loadFactor);
        const currentStallSpeed = this.calculateStallSpeed(loadFactor);
        
        // Check angle of attack
        const aoaMargin = effectiveStallAngle - Math.abs(angleOfAttack);
        
        // Check airspeed margin
        const speedMargin = airspeed - currentStallSpeed;
        const speedMarginPercent = speedMargin / currentStallSpeed;
        
        // Deep stall check
        if (Math.abs(angleOfAttack) > STALL_CONSTANTS.DEEP_STALL_ANGLE) {
            return StallWarningLevel.DEEP_STALL;
        }
        
        // Full stall check
        if (Math.abs(angleOfAttack) >= effectiveStallAngle || speedMarginPercent < 0.05) {
            return StallWarningLevel.STALL;
        }
        
        // Buffet range (approaching stall)
        if (aoaMargin < 4 || speedMarginPercent < 0.15) {
            return StallWarningLevel.BUFFET;
        }
        
        // Approaching stall warning
        if (aoaMargin < 6 || speedMarginPercent < 0.25) {
            return StallWarningLevel.APPROACHING;
        }
        
        return StallWarningLevel.NONE;
    }

    /**
     * Calculate buffet intensity for stick shaker / visual effects
     * @param {number} warningLevel - Current stall warning level
     * @param {number} angleOfAttack - Current AoA in degrees
     * @returns {number} Buffet intensity (0-1)
     */
    calculateBuffetIntensity(warningLevel, angleOfAttack) {
        if (warningLevel < StallWarningLevel.BUFFET) {
            return 0;
        }
        
        const stallAngle = this.stallAngle;
        const excess = Math.abs(angleOfAttack) - (stallAngle - 4);
        const normalized = Math.max(0, Math.min(1, excess / 8));
        
        // Add some randomness for realism
        const randomFactor = 0.8 + Math.random() * 0.4;
        
        return normalized * randomFactor;
    }

    /**
     * Check if aircraft should enter spin
     * @param {Object} state - Current flight state
     * @returns {boolean}
     */
    shouldEnterSpin(state) {
        if (this._spinState !== SpinState.NONE) {
            return false; // Already in spin
        }
        
        if (this._stallWarningLevel < StallWarningLevel.STALL) {
            return false; // Not stalled
        }
        
        const { angularVelocity, controlInputs } = state;
        
        // Check yaw rate
        const yawRate = Math.abs(angularVelocity.y);
        const rollRate = Math.abs(angularVelocity.z);
        
        // Asymmetric stall with yaw can induce spin
        if (yawRate > STALL_CONSTANTS.SPIN_ENTRY_YAW_RATE * (1 - this.spinResistance)) {
            return true;
        }
        
        // Pro-spin control inputs while stalled
        if (this._isStalled && controlInputs) {
            const proSpinYaw = Math.abs(controlInputs.yaw) > 0.5;
            const proSpinRoll = Math.abs(controlInputs.roll) > 0.3;
            
            if ((proSpinYaw || proSpinRoll) && rollRate > STALL_CONSTANTS.SPIN_ENTRY_ROLL_RATE) {
                return Math.random() < STALL_CONSTANTS.SPIN_SUSCEPTIBILITY * this.wingDropTendency;
            }
        }
        
        return false;
    }

    /**
     * Calculate post-stall lift coefficient
     * @param {number} angleOfAttack - Angle of attack in degrees
     * @param {number} baseLiftCoefficient - Pre-stall maximum CL
     * @returns {number} Post-stall lift coefficient
     */
    calculatePostStallLift(angleOfAttack, baseLiftCoefficient) {
        const stallAngle = this.stallAngle;
        const aoaAbs = Math.abs(angleOfAttack);
        
        if (aoaAbs <= stallAngle) {
            // Not stalled
            return null;
        }
        
        const excess = aoaAbs - stallAngle;
        
        // Lift drops after stall
        let cl = baseLiftCoefficient * (1 - STALL_CONSTANTS.POST_STALL_LIFT_SLOPE * excess);
        
        // Ensure minimum lift
        cl = Math.max(STALL_CONSTANTS.MINIMUM_LIFT_COEFFICIENT, cl);
        
        return cl * Math.sign(angleOfAttack);
    }

    /**
     * Calculate post-stall drag increase
     * @param {number} angleOfAttack - Angle of attack in degrees
     * @param {number} baseDragCoefficient - Normal drag coefficient
     * @returns {number} Modified drag coefficient
     */
    calculatePostStallDrag(angleOfAttack, baseDragCoefficient) {
        const stallAngle = this.stallAngle;
        const aoaAbs = Math.abs(angleOfAttack);
        
        if (aoaAbs <= stallAngle) {
            return baseDragCoefficient;
        }
        
        const excess = aoaAbs - stallAngle;
        
        // Drag increases significantly post-stall
        const dragIncrease = 1 + 0.1 * excess;
        
        return baseDragCoefficient * dragIncrease;
    }

    /**
     * Calculate wing drop moment during asymmetric stall
     * @param {number} angleOfAttack - Angle of attack in degrees
     * @param {number} sideslipAngle - Sideslip angle in degrees
     * @param {number} dynamicPressure - Dynamic pressure in Pa
     * @param {number} wingArea - Wing area in m²
     * @param {number} wingSpan - Wing span in m
     * @returns {THREE.Vector3} Wing drop moment
     */
    calculateWingDropMoment(angleOfAttack, sideslipAngle, dynamicPressure, wingArea, wingSpan) {
        if (this._stallWarningLevel < StallWarningLevel.STALL) {
            return new THREE.Vector3(0, 0, 0);
        }
        
        // Wing drop tendency based on sideslip and random asymmetry
        const asymmetry = this.wingDropTendency * (sideslipAngle / 10 + (Math.random() - 0.5) * 0.2);
        
        const momentArm = wingSpan / 2;
        const rollMoment = dynamicPressure * wingArea * momentArm * 0.01 * asymmetry;
        
        return new THREE.Vector3(0, 0, rollMoment);
    }

    /**
     * Update spin state and calculate spin forces
     * @param {Object} state - Current flight state
     * @param {number} deltaTime - Time step in seconds
     * @returns {Object} Spin forces and moments
     */
    updateSpinState(state, deltaTime) {
        const { position, velocity, angularVelocity, orientation, controlInputs = {} } = state;
        
        const result = {
            forces: new THREE.Vector3(0, 0, 0),
            moments: new THREE.Vector3(0, 0, 0),
            spinState: this._spinState,
            spinDirection: this._spinDirection,
            spinRotations: this._spinRotations
        };
        
        // Check for spin entry
        if (this._spinState === SpinState.NONE && this.shouldEnterSpin(state)) {
            this._spinState = SpinState.INCIPIENT;
            this._spinDirection = angularVelocity.y > 0 ? 1 : -1;
            this._spinRotations = 0;
        }
        
        // Update based on current spin state
        switch (this._spinState) {
            case SpinState.INCIPIENT:
                this._updateIncipientSpin(result, state, deltaTime);
                break;
                
            case SpinState.DEVELOPED:
                this._updateDevelopedSpin(result, state, deltaTime);
                break;
                
            case SpinState.RECOVERING:
                this._updateSpinRecovery(result, state, deltaTime);
                break;
        }
        
        // Check for recovery
        if (this._spinState !== SpinState.NONE && this._checkSpinRecovery(state, controlInputs)) {
            if (this._spinState !== SpinState.RECOVERING) {
                this._spinState = SpinState.RECOVERING;
                this._recoveryTimer = 0;
            }
        }
        
        return result;
    }

    /**
     * Update incipient spin phase
     * @private
     */
    _updateIncipientSpin(result, state, deltaTime) {
        // Build up to developed spin
        const buildupRate = 1.0 / 1.5; // Takes 1.5 seconds to develop
        this._spinRotations += STALL_CONSTANTS.SPIN_ROTATION_RATE * 0.5 * deltaTime / (2 * Math.PI);
        
        if (this._spinRotations > 0.5) { // After half rotation
            this._spinState = SpinState.DEVELOPED;
        }
        
        // Apply spin-inducing moments
        const spinMoment = STALL_CONSTANTS.SPIN_ROTATION_RATE * this._spinDirection;
        result.moments.y = spinMoment * 100; // Scale for aircraft inertia
        
        // Nose-down pitching moment
        result.moments.x = -500;
        
        // Descent force
        result.forces.y = -state.mass * 9.81 * 0.5;
    }

    /**
     * Update developed spin
     * @private
     */
    _updateDevelopedSpin(result, state, deltaTime) {
        // Maintain spin
        this._spinRotations += STALL_CONSTANTS.SPIN_ROTATION_RATE * deltaTime / (2 * Math.PI);
        
        // Consistent spin rate
        result.moments.y = STALL_CONSTANTS.SPIN_ROTATION_RATE * this._spinDirection * 50;
        
        // Maintain steep pitch attitude
        const pitchTarget = THREE.MathUtils.degToRad(STALL_CONSTANTS.SPIN_PITCH_ATTITUDE);
        const euler = new THREE.Euler().setFromQuaternion(state.orientation);
        const pitchError = pitchTarget - euler.x;
        result.moments.x = pitchError * 200;
        
        // High drag descent
        result.forces.y = -STALL_CONSTANTS.SPIN_DESCENT_RATE * state.mass * 2;
    }

    /**
     * Update spin recovery
     * @private
     */
    _updateSpinRecovery(result, state, deltaTime) {
        this._recoveryTimer += deltaTime;
        
        // Reduce spin rate
        const recoveryProgress = this._recoveryTimer / STALL_CONSTANTS.RECOVERY_TIME_MIN;
        
        // Anti-spin moment
        result.moments.y = -this._spinDirection * STALL_CONSTANTS.SPIN_ROTATION_RATE * 
            STALL_CONSTANTS.ANTI_SPIN_EFFECTIVENESS * 50 * (1 - recoveryProgress * 0.5);
        
        // Pitch up toward normal flight
        result.moments.x = 300;
        
        // Check if recovery complete
        if (recoveryProgress >= 1 && Math.abs(state.angularVelocity.y) < STALL_CONSTANTS.RECOVERY_YAW_THRESHOLD) {
            this._spinState = SpinState.NONE;
            this._spinRotations = 0;
        }
    }

    /**
     * Check if spin recovery conditions are met
     * @private
     */
    _checkSpinRecovery(state, controlInputs) {
        if (this._spinState === SpinState.NONE) return false;
        
        // Recovery inputs: opposite rudder, neutral/forward stick
        const antiSpinRudder = controlInputs.yaw * this._spinDirection < -0.5;
        const forwardStick = controlInputs.pitch > 0;
        
        // Airspeed increasing (nose-down recovery)
        const recoveringAirspeed = this._cachedAirspeed > this.stallSpeed * 1.2;
        
        return (antiSpinRudder && forwardStick) || recoveringAirspeed;
    }

    /**
     * Main update function
     * @param {Object} state - Current flight state
     * @param {number} deltaTime - Time step in seconds
     * @returns {Object} Modified aerodynamic coefficients and forces
     */
    update(state, deltaTime) {
        const { angleOfAttack, airspeed, loadFactor = 1, angularVelocity, orientation, controlInputs } = state;
        
        // Cache values
        this._cachedAngleOfAttack = angleOfAttack;
        this._cachedAirspeed = airspeed;
        this._cachedLoadFactor = loadFactor;
        
        // Update stall warning
        this._stallWarningLevel = this.getStallWarning(angleOfAttack, airspeed, loadFactor);
        this._isStalled = this._stallWarningLevel >= StallWarningLevel.STALL;
        
        // Calculate buffet
        this._buffetIntensity = this.calculateBuffetIntensity(this._stallWarningLevel, angleOfAttack);
        
        // Update spin state
        const spinResult = this.updateSpinState(state, deltaTime);
        
        return {
            stallWarningLevel: this._stallWarningLevel,
            isStalled: this._isStalled,
            buffetIntensity: this._buffetIntensity,
            spinState: this._spinState,
            spinDirection: this._spinDirection,
            spinRotations: this._spinRotations,
            spinForces: spinResult.forces,
            spinMoments: spinResult.moments,
            effectiveStallAngle: this.calculateEffectiveStallAngle(loadFactor),
            stallSpeed: this.calculateStallSpeed(loadFactor)
        };
    }

    /**
     * Get stall warning level
     * @returns {number}
     */
    getStallWarningLevel() {
        return this._stallWarningLevel;
    }

    /**
     * Check if currently stalled
     * @returns {boolean}
     */
    isStalled() {
        return this._isStalled;
    }

    /**
     * Get buffet intensity
     * @returns {number}
     */
    getBuffetIntensity() {
        return this._buffetIntensity;
    }

    /**
     * Get current spin state
     * @returns {string}
     */
    getSpinState() {
        return this._spinState;
    }

    /**
     * Get number of spin rotations
     * @returns {number}
     */
    getSpinRotations() {
        return this._spinRotations;
    }

    /**
     * Force exit from spin (cheat/debug function)
     */
    forceExitSpin() {
        this._spinState = SpinState.NONE;
        this._spinRotations = 0;
        this._spinDirection = 0;
    }

    /**
     * Reset all state
     */
    reset() {
        this._stallWarningLevel = StallWarningLevel.NONE;
        this._spinState = SpinState.NONE;
        this._spinDirection = 0;
        this._spinRotations = 0;
        this._recoveryTimer = 0;
        this._isStalled = false;
        this._buffetIntensity = 0;
    }
}

export { STALL_CONSTANTS };
export default StallSpinDynamics;
