/**
 * IntegratedFlightPhysics.js
 * Combines all advanced physics systems (Phase 3) into a unified flight physics engine.
 * Integrates:
 * - AdvancedFlightModel (accurate aerodynamics)
 * - GroundEffect (near-ground lift/drag modifications)
 * - WindSystem (wind and turbulence)
 * - StallSpinDynamics (stall warnings and spin behavior)
 * - LandingGear (wheel physics and ground contact)
 */

import * as THREE from 'three';
import { AdvancedFlightModel, ADVANCED_CONSTANTS } from './AdvancedFlightModel.js';
import { GroundEffect } from './GroundEffect.js';
import { WindSystem, TurbulenceType } from './WindSystem.js';
import { StallSpinDynamics, StallWarningLevel, SpinState } from './StallSpinDynamics.js';
import { LandingGear, GearState } from './LandingGear.js';

/**
 * Constants for integrated physics calculations
 */
const INTEGRATED_CONSTANTS = Object.freeze({
    // Default induced drag ratio when lift coefficient is very low
    // At low CL, induced drag is typically about 50% of total drag for general aviation
    DEFAULT_INDUCED_DRAG_RATIO: 0.5,

    // Moment of inertia multipliers for simplified calculation
    // These represent typical ratios of moment of inertia to mass for light aircraft
    // Ixx (roll) ≈ mass × 2 (narrow fuselage, wings provide most inertia)
    // Iyy (pitch) ≈ mass × 6 (length of fuselage dominates)
    // Izz (yaw) ≈ mass × 5 (combination of fuselage and wing span)
    INERTIA_ROLL_FACTOR: 2,
    INERTIA_PITCH_FACTOR: 6,
    INERTIA_YAW_FACTOR: 5
});

/**
 * Configuration options for IntegratedFlightPhysics
 * @typedef {Object} IntegratedPhysicsConfig
 * @property {Object} aircraft - Aircraft parameters
 * @property {Object} wind - Wind system configuration
 * @property {Object} groundEffect - Ground effect configuration
 * @property {Object} stallSpin - Stall/spin dynamics configuration
 * @property {Object} landingGear - Landing gear configuration
 * @property {Function} terrainHeightCallback - Function(x, z) returning ground height
 */

/**
 * IntegratedFlightPhysics class
 * Provides a unified interface to all advanced physics systems
 */
export class IntegratedFlightPhysics {
    /**
     * Create a new IntegratedFlightPhysics instance
     * @param {IntegratedPhysicsConfig} config - Configuration options
     */
    constructor(config = {}) {
        // Aircraft configuration with defaults
        const aircraftConfig = {
            mass: 1000,
            wingArea: 16,
            wingSpan: 10,
            maxThrust: 20000,
            dragCoefficient: 0.02,
            liftCoefficient: 1.0,
            oswaldEfficiency: 0.8,
            stallAngle: 16,
            stallSpeed: 40,
            ...config.aircraft
        };

        // Initialize AdvancedFlightModel
        this.flightModel = new AdvancedFlightModel(aircraftConfig);

        // Initialize GroundEffect
        this.groundEffect = new GroundEffect({
            wingSpan: aircraftConfig.wingSpan,
            enabled: config.groundEffect?.enabled !== false,
            terrainHeightCallback: config.terrainHeightCallback || null
        });

        // Initialize WindSystem
        this.windSystem = new WindSystem({
            windSpeed: config.wind?.speed || 0,
            windDirection: config.wind?.direction || 0,
            turbulenceType: config.wind?.turbulenceType || TurbulenceType.NONE,
            turbulenceIntensity: config.wind?.turbulenceIntensity || 0,
            gustEnabled: config.wind?.gustEnabled || false,
            gustIntensity: config.wind?.gustIntensity || 0,
            thermalsEnabled: config.wind?.thermalsEnabled || false,
            ...config.wind
        });

        // Initialize StallSpinDynamics
        this.stallSpin = new StallSpinDynamics({
            stallAngle: aircraftConfig.stallAngle,
            stallSpeed: aircraftConfig.stallSpeed,
            wingDropTendency: config.stallSpin?.wingDropTendency || 0.3,
            spinResistance: config.stallSpin?.spinResistance || 0.5,
            ...config.stallSpin
        });

        // Initialize LandingGear
        this.landingGear = new LandingGear({
            startDown: config.landingGear?.startDown !== false,
            terrainHeightCallback: config.terrainHeightCallback || null,
            struts: config.landingGear?.struts,
            ...config.landingGear
        });

        // Store configuration
        this.config = aircraftConfig;
        this.terrainHeightCallback = config.terrainHeightCallback || null;

        // State vectors (exposed for external access)
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);

        // Enable/disable flags for individual systems
        this.systemsEnabled = {
            advancedAerodynamics: true,
            groundEffect: config.groundEffect?.enabled !== false,
            wind: config.wind?.enabled !== false,
            stallSpin: config.stallSpin?.enabled !== false,
            landingGear: config.landingGear?.enabled !== false
        };

        // Debug info storage
        this._lastDebugInfo = null;
    }

    /**
     * Set terrain height callback for ground-based calculations
     * @param {Function} callback - Function(x, z) returning ground height
     */
    setTerrainHeightCallback(callback) {
        this.terrainHeightCallback = callback;
        this.groundEffect.setTerrainHeightCallback(callback);
        this.landingGear.setTerrainHeightCallback(callback);
    }

    /**
     * Enable or disable individual physics systems
     * @param {string} system - System name: 'advancedAerodynamics', 'groundEffect', 'wind', 'stallSpin', 'landingGear'
     * @param {boolean} enabled - Whether to enable the system
     */
    setSystemEnabled(system, enabled) {
        if (system in this.systemsEnabled) {
            this.systemsEnabled[system] = enabled;

            if (system === 'groundEffect') {
                this.groundEffect.setEnabled(enabled);
            }
        }
    }

    /**
     * Calculate load factor (g-load) from current lift and weight
     * Load factor n = L / W where L is lift and W is weight
     * @param {THREE.Vector3} liftForce - Lift force vector
     * @returns {number} Load factor (1.0 = level flight)
     * @private
     */
    _calculateLoadFactor(liftForce) {
        const weight = this.config.mass * ADVANCED_CONSTANTS.GRAVITY;
        const liftMagnitude = liftForce.length();
        return weight > 0 ? liftMagnitude / weight : 1.0;
    }

    /**
     * Update all physics systems for one frame
     * @param {Object} state - Current aircraft state
     * @param {THREE.Vector3} state.position - Aircraft position
     * @param {THREE.Quaternion} state.orientation - Aircraft orientation
     * @param {number} state.throttle - Throttle setting (0-1)
     * @param {Object} controls - Control inputs { pitch, roll, yaw }
     * @param {number} deltaTime - Time step in seconds
     * @returns {Object} Updated state and debug info
     */
    update(state, controls = {}, deltaTime) {
        const { position, orientation, throttle = 0 } = state;

        // Clamp deltaTime to prevent instabilities
        const dt = Math.min(deltaTime, 0.1);

        // Get altitude for atmospheric calculations
        const altitude = Math.max(0, position.y);

        // Update wind system
        if (this.systemsEnabled.wind) {
            this.windSystem.update(dt, position);
        }

        // Calculate wind-adjusted velocity (true airspeed)
        let trueAirVelocity = this.velocity.clone();
        if (this.systemsEnabled.wind) {
            const wind = this.windSystem.getWindAtPosition(position);
            trueAirVelocity = this.velocity.clone().sub(wind);
        }

        // Calculate airspeed
        const airspeed = trueAirVelocity.length();

        // Calculate aerodynamic angles
        const angleOfAttack = this.flightModel.calculateAngleOfAttack(trueAirVelocity, orientation);
        const sideslipAngle = this.flightModel.calculateSideslipAngle(trueAirVelocity, orientation);
        const aoaDegrees = THREE.MathUtils.radToDeg(angleOfAttack);

        // Calculate atmospheric properties
        const airDensity = this.flightModel.calculateAirDensity(altitude);
        const machNumber = this.flightModel.calculateMachNumber(airspeed, altitude);
        const dynamicPressure = this.flightModel.calculateDynamicPressure(airDensity, airspeed);

        // Calculate aerodynamic coefficients
        let liftCoefficient = this.flightModel.calculateLiftCoefficient(angleOfAttack, machNumber);
        let dragCoefficient = this.flightModel.calculateDragCoefficient(liftCoefficient, machNumber);

        // Calculate preliminary lift for load factor estimation
        const preliminaryLift = this.flightModel.calculateLiftForce(dynamicPressure, liftCoefficient, trueAirVelocity, orientation);
        const loadFactor = this._calculateLoadFactor(preliminaryLift);

        // Update stall/spin dynamics with calculated load factor
        let stallSpinResult = null;
        if (this.systemsEnabled.stallSpin) {
            stallSpinResult = this.stallSpin.update({
                angleOfAttack: aoaDegrees,
                airspeed,
                loadFactor,
                angularVelocity: this.angularVelocity,
                orientation,
                controlInputs: controls
            }, dt);

            // Apply post-stall modifications to lift
            if (stallSpinResult.isStalled) {
                const postStallLift = this.stallSpin.calculatePostStallLift(aoaDegrees, liftCoefficient);
                if (postStallLift !== null) {
                    liftCoefficient = postStallLift;
                }
                dragCoefficient = this.stallSpin.calculatePostStallDrag(aoaDegrees, dragCoefficient);
            }
        }

        // Calculate base aerodynamic forces
        let lift = this.flightModel.calculateLiftForce(dynamicPressure, liftCoefficient, trueAirVelocity, orientation);
        let drag = this.flightModel.calculateDragForce(dynamicPressure, dragCoefficient, trueAirVelocity);
        const thrust = this.flightModel.calculateThrustForce(throttle, airDensity, orientation);
        const gravity = this.flightModel.calculateGravityForce();

        // Apply ground effect modifications
        let groundEffectResult = null;
        if (this.systemsEnabled.groundEffect && this.groundEffect.isInGroundEffect(position)) {
            // Calculate induced drag ratio for ground effect
            // Use constant when lift coefficient is very low to avoid division issues
            const inducedDragRatio = Math.abs(liftCoefficient) > 0.01 ?
                (liftCoefficient * liftCoefficient) / (Math.PI * this.flightModel.aspectRatio * this.flightModel.oswaldEfficiency * dragCoefficient) :
                INTEGRATED_CONSTANTS.DEFAULT_INDUCED_DRAG_RATIO;

            groundEffectResult = this.groundEffect.applyGroundEffect({
                position,
                liftForce: lift,
                dragForce: drag,
                inducedDragRatio: Math.min(1, inducedDragRatio)
            });

            lift = groundEffectResult.liftForce;
            drag = groundEffectResult.dragForce;

            // Add cushion force for landing flare
            const cushionForce = this.groundEffect.getCushionForce(
                position,
                this.velocity,
                this.config.wingArea,
                airDensity
            );
            lift.add(cushionForce);
        }

        // Sum all forces
        const totalForce = new THREE.Vector3();
        totalForce.add(lift);
        totalForce.add(drag);
        totalForce.add(thrust);
        totalForce.add(gravity);

        // Add wind forces (gusts and turbulence create sudden accelerations)
        if (this.systemsEnabled.wind) {
            const windForce = this.windSystem.getWindForce(position, this.config.mass);
            totalForce.add(windForce);
        }

        // Add spin forces if in spin
        if (stallSpinResult && stallSpinResult.spinState !== SpinState.NONE) {
            totalForce.add(stallSpinResult.spinForces);
        }

        // Update landing gear and get ground forces
        let gearResult = null;
        if (this.systemsEnabled.landingGear) {
            gearResult = this.landingGear.update({
                position,
                orientation,
                velocity: this.velocity,
                mass: this.config.mass
            }, dt);

            // Add landing gear forces
            totalForce.add(gearResult.force);
        }

        // Calculate linear acceleration (F = ma)
        const acceleration = totalForce.clone().divideScalar(this.config.mass);

        // Update velocity
        this.velocity.add(acceleration.clone().multiplyScalar(dt));

        // Calculate aerodynamic moments
        let moments = this.flightModel.calculateAerodynamicMoments(
            controls,
            dynamicPressure,
            angleOfAttack,
            sideslipAngle
        );

        // Add spin moments if in spin
        if (stallSpinResult && stallSpinResult.spinState !== SpinState.NONE) {
            moments.add(stallSpinResult.spinMoments);
        }

        // Add landing gear torques
        if (gearResult) {
            moments.add(gearResult.torque);
        }

        // Add wing drop moment during stall
        if (stallSpinResult && stallSpinResult.isStalled && this.systemsEnabled.stallSpin) {
            const wingDropMoment = this.stallSpin.calculateWingDropMoment(
                aoaDegrees,
                THREE.MathUtils.radToDeg(sideslipAngle),
                dynamicPressure,
                this.config.wingArea,
                this.config.wingSpan
            );
            moments.add(wingDropMoment);
        }

        // Calculate angular acceleration using moment of inertia approximations
        // These use simplified factors based on typical light aircraft properties
        const angularAcceleration = new THREE.Vector3(
            moments.x / (this.config.mass * INTEGRATED_CONSTANTS.INERTIA_ROLL_FACTOR),
            moments.y / (this.config.mass * INTEGRATED_CONSTANTS.INERTIA_PITCH_FACTOR),
            moments.z / (this.config.mass * INTEGRATED_CONSTANTS.INERTIA_YAW_FACTOR)
        );

        // Update angular velocity
        this.angularVelocity.add(angularAcceleration.clone().multiplyScalar(dt));

        // Apply damping to angular velocity
        this.angularVelocity.multiplyScalar(0.98);

        // Sync internal flight model state
        this.flightModel.velocity.copy(this.velocity);
        this.flightModel.angularVelocity.copy(this.angularVelocity);

        // Build debug info
        const debugInfo = {
            velocity: this.velocity.clone(),
            acceleration: acceleration.clone(),
            angularVelocity: this.angularVelocity.clone(),
            forces: {
                lift: lift.clone(),
                drag: drag.clone(),
                thrust: thrust.clone(),
                gravity: gravity.clone(),
                total: totalForce.clone()
            },
            coefficients: {
                lift: liftCoefficient,
                drag: dragCoefficient
            },
            atmosphere: {
                density: airDensity,
                temperature: this.flightModel.calculateTemperature(altitude),
                speedOfSound: this.flightModel.calculateSpeedOfSound(altitude)
            },
            airspeed,
            machNumber,
            angleOfAttack: aoaDegrees,
            sideslipAngle: THREE.MathUtils.radToDeg(sideslipAngle),
            altitude,
            dynamicPressure,
            loadFactor,

            // Wind info
            wind: this.systemsEnabled.wind ? {
                ...this.windSystem.getWindInfo(),
                currentWind: this.windSystem.getWindAtPosition(position)
            } : null,

            // Ground effect info
            groundEffect: groundEffectResult ? groundEffectResult.debug : null,

            // Stall/spin info
            stallSpin: stallSpinResult ? {
                warningLevel: stallSpinResult.stallWarningLevel,
                warningLevelName: Object.keys(StallWarningLevel).find(
                    key => StallWarningLevel[key] === stallSpinResult.stallWarningLevel
                ),
                isStalled: stallSpinResult.isStalled,
                buffetIntensity: stallSpinResult.buffetIntensity,
                spinState: stallSpinResult.spinState,
                spinDirection: stallSpinResult.spinDirection,
                spinRotations: stallSpinResult.spinRotations,
                effectiveStallAngle: stallSpinResult.effectiveStallAngle,
                stallSpeed: stallSpinResult.stallSpeed
            } : null,

            // Landing gear info
            landingGear: gearResult ? {
                state: gearResult.gearState,
                deploymentProgress: gearResult.deploymentProgress,
                anyWheelOnGround: gearResult.anyWheelOnGround,
                allWheelsOnGround: gearResult.allWheelsOnGround,
                strutStates: gearResult.strutStates
            } : null
        };

        this._lastDebugInfo = debugInfo;
        return debugInfo;
    }

    /**
     * Get current velocity
     * @returns {THREE.Vector3}
     */
    getVelocity() {
        return this.velocity.clone();
    }

    /**
     * Set velocity
     * @param {THREE.Vector3} velocity
     */
    setVelocity(velocity) {
        this.velocity.copy(velocity);
        this.flightModel.velocity.copy(velocity);
    }

    /**
     * Get angular velocity
     * @returns {THREE.Vector3}
     */
    getAngularVelocity() {
        return this.angularVelocity.clone();
    }

    /**
     * Set angular velocity
     * @param {THREE.Vector3} angularVelocity
     */
    setAngularVelocity(angularVelocity) {
        this.angularVelocity.copy(angularVelocity);
        this.flightModel.angularVelocity.copy(angularVelocity);
    }

    /**
     * Get current airspeed
     * @returns {number} Airspeed in m/s
     */
    getAirspeed() {
        return this.velocity.length();
    }

    /**
     * Configure wind settings
     * @param {Object} windConfig - Wind configuration
     */
    setWind(windConfig) {
        if (windConfig.speed !== undefined || windConfig.direction !== undefined) {
            this.windSystem.setWind(
                windConfig.speed ?? this.windSystem.baseWindSpeed,
                windConfig.direction ?? this.windSystem.baseWindDirection
            );
        }
        if (windConfig.turbulenceType !== undefined || windConfig.turbulenceIntensity !== undefined) {
            this.windSystem.setTurbulence(
                windConfig.turbulenceType ?? this.windSystem.turbulenceType,
                windConfig.turbulenceIntensity ?? this.windSystem.turbulenceIntensity
            );
        }
        if (windConfig.gustEnabled !== undefined) {
            this.windSystem.setGusts(windConfig.gustEnabled, windConfig.gustIntensity);
        }
    }

    /**
     * Toggle landing gear
     * @param {number} airspeed - Current airspeed for safety check
     * @returns {boolean} Whether the toggle was successful
     */
    toggleLandingGear(airspeed) {
        return this.landingGear.toggleGear(airspeed);
    }

    /**
     * Set landing gear brakes
     * @param {number} input - Brake input (0-1)
     */
    setBrakes(input) {
        this.landingGear.setBrakes(input);
    }

    /**
     * Set landing gear steering
     * @param {number} input - Steering input (-1 to 1)
     */
    setSteering(input) {
        this.landingGear.setSteering(input);
    }

    /**
     * Toggle parking brake
     */
    toggleParkingBrake() {
        this.landingGear.toggleParkingBrake();
    }

    /**
     * Check if aircraft is on ground
     * @returns {boolean}
     */
    isOnGround() {
        return this.systemsEnabled.landingGear && this.landingGear.isOnGround();
    }

    /**
     * Get current stall warning level
     * @returns {number} StallWarningLevel value
     */
    getStallWarningLevel() {
        return this.stallSpin.getStallWarningLevel();
    }

    /**
     * Check if aircraft is stalled
     * @returns {boolean}
     */
    isStalled() {
        return this.stallSpin.isStalled();
    }

    /**
     * Get current spin state
     * @returns {string} SpinState value
     */
    getSpinState() {
        return this.stallSpin.getSpinState();
    }

    /**
     * Force recovery from spin (debug/cheat function)
     */
    forceSpinRecovery() {
        this.stallSpin.forceExitSpin();
    }

    /**
     * Check if in ground effect
     * @param {THREE.Vector3} position - Aircraft position
     * @returns {boolean}
     */
    isInGroundEffect(position) {
        return this.groundEffect.isInGroundEffect(position);
    }

    /**
     * Get ground effect strength at position
     * @param {THREE.Vector3} position - Aircraft position
     * @returns {number} Effect strength (0-1)
     */
    getGroundEffectStrength(position) {
        const height = this.groundEffect.calculateHeightAboveGround(position);
        return this.groundEffect.calculateEffectStrength(height);
    }

    /**
     * Get last debug info from update
     * @returns {Object|null}
     */
    getDebugInfo() {
        return this._lastDebugInfo;
    }

    /**
     * Reset all physics systems to initial state
     */
    reset() {
        this.velocity.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
        this.flightModel.reset();
        this.windSystem.reset();
        this.stallSpin.reset();
        this.landingGear.reset();
        this._lastDebugInfo = null;
    }
}

// Export types and constants for external use
export { TurbulenceType, StallWarningLevel, SpinState, GearState, ADVANCED_CONSTANTS };
export default IntegratedFlightPhysics;
