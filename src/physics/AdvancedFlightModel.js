/**
 * AdvancedFlightModel.js
 * Enhanced flight physics model with more accurate aerodynamic calculations.
 * Implements detailed lift, drag, thrust, and atmospheric modeling.
 */

import * as THREE from 'three';

/**
 * Advanced physical constants for flight simulation
 */
export const ADVANCED_CONSTANTS = Object.freeze({
    // Atmospheric constants
    GRAVITY: 9.80665,                    // m/s² - Standard gravity
    SEA_LEVEL_DENSITY: 1.225,            // kg/m³ - ISA sea level density
    SEA_LEVEL_PRESSURE: 101325,          // Pa - ISA sea level pressure
    SEA_LEVEL_TEMPERATURE: 288.15,       // K - ISA sea level temperature (15°C)
    SCALE_HEIGHT: 8500,                  // m - Atmospheric scale height
    LAPSE_RATE: 0.0065,                  // K/m - Temperature lapse rate (troposphere)
    GAS_CONSTANT: 287.05,                // J/(kg·K) - Specific gas constant for dry air
    TROPOPAUSE_ALTITUDE: 11000,          // m - Tropopause altitude
    
    // Aerodynamic constants
    LIFT_CURVE_SLOPE: 5.7,               // Per radian - Typical for finite wing
    ZERO_LIFT_ANGLE: -2,                 // degrees - Zero-lift angle of attack
    CRITICAL_ANGLE_OF_ATTACK: 16,        // degrees - Stall angle
    POST_STALL_LIFT_DROP: 0.6,           // Factor of lift reduction after stall
    
    // Reynolds number effects
    REYNOLDS_REFERENCE: 6000000,         // Reference Reynolds number
    REYNOLDS_TRANSITION: 500000          // Laminar-turbulent transition
});

/**
 * AdvancedFlightModel class
 * Provides highly accurate aerodynamic force calculations
 */
export class AdvancedFlightModel {
    /**
     * Create a new AdvancedFlightModel instance
     * @param {Object} config - Aircraft configuration
     */
    constructor(config = {}) {
        // Aircraft specifications
        this.mass = config.mass || 1000;                    // kg
        this.wingArea = config.wingArea || 16;              // m²
        this.wingSpan = config.wingSpan || 10;              // m
        this.aspectRatio = config.aspectRatio || (this.wingSpan * this.wingSpan / this.wingArea);
        this.maxThrust = config.maxThrust || 20000;         // N
        this.baseDragCoefficient = config.dragCoefficient || 0.02;
        this.baseLiftCoefficient = config.liftCoefficient || 1.0;
        this.oswaldEfficiency = config.oswaldEfficiency || 0.8;
        
        // Control surface effectiveness
        this.controlEffectiveness = {
            elevator: config.elevatorEffectiveness || 1.0,
            aileron: config.aileronEffectiveness || 1.0,
            rudder: config.rudderEffectiveness || 1.0
        };
        
        // Moments of inertia (kg·m²)
        this.inertia = {
            Ixx: config.Ixx || this.mass * 2,      // Roll inertia
            Iyy: config.Iyy || this.mass * 5,      // Pitch inertia
            Izz: config.Izz || this.mass * 6       // Yaw inertia
        };
        
        // State vectors
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);
        this.angularAcceleration = new THREE.Vector3(0, 0, 0);
        
        // Force and torque accumulators
        this.forces = new THREE.Vector3(0, 0, 0);
        this.torques = new THREE.Vector3(0, 0, 0);
        
        // Cached calculations
        this._cachedAirDensity = ADVANCED_CONSTANTS.SEA_LEVEL_DENSITY;
        this._cachedDynamicPressure = 0;
        this._cachedAngleOfAttack = 0;
        this._cachedSideslipAngle = 0;
    }

    /**
     * Calculate air density using International Standard Atmosphere model
     * @param {number} altitude - Altitude in meters
     * @returns {number} Air density in kg/m³
     */
    calculateAirDensity(altitude) {
        const h = Math.max(0, altitude);
        
        if (h < ADVANCED_CONSTANTS.TROPOPAUSE_ALTITUDE) {
            // Troposphere - temperature decreases with altitude
            const T = ADVANCED_CONSTANTS.SEA_LEVEL_TEMPERATURE - ADVANCED_CONSTANTS.LAPSE_RATE * h;
            const P = ADVANCED_CONSTANTS.SEA_LEVEL_PRESSURE * 
                Math.pow(T / ADVANCED_CONSTANTS.SEA_LEVEL_TEMPERATURE, 
                    ADVANCED_CONSTANTS.GRAVITY / (ADVANCED_CONSTANTS.LAPSE_RATE * ADVANCED_CONSTANTS.GAS_CONSTANT));
            return P / (ADVANCED_CONSTANTS.GAS_CONSTANT * T);
        } else {
            // Stratosphere - isothermal layer
            const T_trop = ADVANCED_CONSTANTS.SEA_LEVEL_TEMPERATURE - 
                ADVANCED_CONSTANTS.LAPSE_RATE * ADVANCED_CONSTANTS.TROPOPAUSE_ALTITUDE;
            const P_trop = ADVANCED_CONSTANTS.SEA_LEVEL_PRESSURE * 
                Math.pow(T_trop / ADVANCED_CONSTANTS.SEA_LEVEL_TEMPERATURE,
                    ADVANCED_CONSTANTS.GRAVITY / (ADVANCED_CONSTANTS.LAPSE_RATE * ADVANCED_CONSTANTS.GAS_CONSTANT));
            const P = P_trop * Math.exp(-ADVANCED_CONSTANTS.GRAVITY * (h - ADVANCED_CONSTANTS.TROPOPAUSE_ALTITUDE) / 
                (ADVANCED_CONSTANTS.GAS_CONSTANT * T_trop));
            return P / (ADVANCED_CONSTANTS.GAS_CONSTANT * T_trop);
        }
    }

    /**
     * Calculate temperature at altitude
     * @param {number} altitude - Altitude in meters
     * @returns {number} Temperature in Kelvin
     */
    calculateTemperature(altitude) {
        const h = Math.max(0, altitude);
        
        if (h < ADVANCED_CONSTANTS.TROPOPAUSE_ALTITUDE) {
            return ADVANCED_CONSTANTS.SEA_LEVEL_TEMPERATURE - ADVANCED_CONSTANTS.LAPSE_RATE * h;
        } else {
            // Isothermal stratosphere
            return ADVANCED_CONSTANTS.SEA_LEVEL_TEMPERATURE - 
                ADVANCED_CONSTANTS.LAPSE_RATE * ADVANCED_CONSTANTS.TROPOPAUSE_ALTITUDE;
        }
    }

    /**
     * Calculate speed of sound at given altitude
     * @param {number} altitude - Altitude in meters
     * @returns {number} Speed of sound in m/s
     */
    calculateSpeedOfSound(altitude) {
        const temperature = this.calculateTemperature(altitude);
        // Speed of sound = sqrt(gamma * R * T), gamma = 1.4 for air
        return Math.sqrt(1.4 * ADVANCED_CONSTANTS.GAS_CONSTANT * temperature);
    }

    /**
     * Calculate Mach number
     * @param {number} airspeed - True airspeed in m/s
     * @param {number} altitude - Altitude in meters
     * @returns {number} Mach number
     */
    calculateMachNumber(airspeed, altitude) {
        const speedOfSound = this.calculateSpeedOfSound(altitude);
        return airspeed / speedOfSound;
    }

    /**
     * Calculate dynamic pressure (q = 0.5 * ρ * V²)
     * @param {number} airDensity - Air density in kg/m³
     * @param {number} airspeed - Airspeed in m/s
     * @returns {number} Dynamic pressure in Pa
     */
    calculateDynamicPressure(airDensity, airspeed) {
        return 0.5 * airDensity * airspeed * airspeed;
    }

    /**
     * Calculate angle of attack
     * @param {THREE.Vector3} velocity - Velocity vector in body frame
     * @param {THREE.Quaternion} orientation - Aircraft orientation
     * @returns {number} Angle of attack in radians
     */
    calculateAngleOfAttack(velocity, orientation) {
        if (velocity.length() < 0.1) return 0;
        
        // Transform velocity to body frame
        const invOrientation = orientation.clone().invert();
        const bodyVelocity = velocity.clone().applyQuaternion(invOrientation);
        
        // Angle of attack is the angle between velocity and forward axis in the XZ plane
        if (Math.abs(bodyVelocity.z) < 0.001) return 0;
        
        return Math.atan2(-bodyVelocity.y, -bodyVelocity.z);
    }

    /**
     * Calculate sideslip angle (beta)
     * @param {THREE.Vector3} velocity - Velocity vector
     * @param {THREE.Quaternion} orientation - Aircraft orientation
     * @returns {number} Sideslip angle in radians
     */
    calculateSideslipAngle(velocity, orientation) {
        if (velocity.length() < 0.1) return 0;
        
        const invOrientation = orientation.clone().invert();
        const bodyVelocity = velocity.clone().applyQuaternion(invOrientation);
        
        const horizontalSpeed = Math.sqrt(bodyVelocity.x * bodyVelocity.x + bodyVelocity.z * bodyVelocity.z);
        if (horizontalSpeed < 0.001) return 0;
        
        return Math.atan2(bodyVelocity.x, -bodyVelocity.z);
    }

    /**
     * Calculate lift coefficient with improved accuracy
     * Includes linear region, stall, and post-stall behavior
     * @param {number} angleOfAttack - Angle of attack in radians
     * @param {number} machNumber - Mach number
     * @returns {number} Lift coefficient
     */
    calculateLiftCoefficient(angleOfAttack, machNumber = 0) {
        const aoaDegrees = THREE.MathUtils.radToDeg(angleOfAttack);
        const criticalAoA = ADVANCED_CONSTANTS.CRITICAL_ANGLE_OF_ATTACK;
        const zeroLiftAoA = ADVANCED_CONSTANTS.ZERO_LIFT_ANGLE;
        
        // Effective angle of attack from zero-lift line
        const effectiveAoA = aoaDegrees - zeroLiftAoA;
        
        // Prandtl-Glauert compressibility correction (subsonic only)
        let compressibilityFactor = 1.0;
        if (machNumber > 0.3 && machNumber < 0.85) {
            compressibilityFactor = 1.0 / Math.sqrt(1 - machNumber * machNumber);
        }
        
        // Lift curve slope adjusted for aspect ratio
        const AR = this.aspectRatio;
        const _e = this.oswaldEfficiency;
        const clAlpha = ADVANCED_CONSTANTS.LIFT_CURVE_SLOPE / (1 + ADVANCED_CONSTANTS.LIFT_CURVE_SLOPE / (Math.PI * AR));
        
        if (Math.abs(aoaDegrees) < criticalAoA) {
            // Linear region
            const cl = clAlpha * THREE.MathUtils.degToRad(effectiveAoA) * this.baseLiftCoefficient;
            return cl * compressibilityFactor;
        } else {
            // Post-stall region - lift drops but doesn't go to zero
            const maxCl = clAlpha * THREE.MathUtils.degToRad(criticalAoA - zeroLiftAoA) * this.baseLiftCoefficient;
            const stallExcess = Math.abs(aoaDegrees) - criticalAoA;
            const dropFactor = Math.exp(-stallExcess / 10) * ADVANCED_CONSTANTS.POST_STALL_LIFT_DROP;
            return Math.sign(effectiveAoA) * maxCl * dropFactor * compressibilityFactor;
        }
    }

    /**
     * Calculate drag coefficient using improved drag polar
     * @param {number} liftCoefficient - Current lift coefficient
     * @param {number} machNumber - Mach number for compressibility effects
     * @returns {number} Total drag coefficient
     */
    calculateDragCoefficient(liftCoefficient, machNumber = 0) {
        // Parasitic drag
        let cd0 = this.baseDragCoefficient;
        
        // Compressibility drag rise (transonic)
        if (machNumber > 0.6) {
            const dragRise = Math.pow((machNumber - 0.6) / 0.2, 2) * 0.05;
            cd0 += dragRise;
        }
        
        // Induced drag: CDi = CL² / (π * AR * e)
        const AR = this.aspectRatio;
        const e = this.oswaldEfficiency;
        const inducedDrag = (liftCoefficient * liftCoefficient) / (Math.PI * AR * e);
        
        return cd0 + inducedDrag;
    }

    /**
     * Calculate lift force vector
     * @param {number} dynamicPressure - Dynamic pressure in Pa
     * @param {number} liftCoefficient - Lift coefficient
     * @param {THREE.Vector3} velocity - Velocity vector
     * @param {THREE.Quaternion} orientation - Aircraft orientation
     * @returns {THREE.Vector3} Lift force vector in N
     */
    calculateLiftForce(dynamicPressure, liftCoefficient, velocity, orientation) {
        if (velocity.length() < 0.1) {
            return new THREE.Vector3(0, 0, 0);
        }
        
        // Lift direction is perpendicular to velocity in the plane of symmetry
        const _forward = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation);
        const velocityNorm = velocity.clone().normalize();
        
        // Lift is perpendicular to velocity, in the plane containing velocity and aircraft up
        const liftDirection = new THREE.Vector3()
            .crossVectors(velocityNorm, new THREE.Vector3(1, 0, 0).applyQuaternion(orientation))
            .normalize();
        
        // Ensure lift points generally upward relative to aircraft
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(orientation);
        if (liftDirection.dot(up) < 0) {
            liftDirection.negate();
        }
        
        const liftMagnitude = dynamicPressure * this.wingArea * liftCoefficient;
        return liftDirection.multiplyScalar(liftMagnitude);
    }

    /**
     * Calculate drag force vector
     * @param {number} dynamicPressure - Dynamic pressure in Pa
     * @param {number} dragCoefficient - Drag coefficient
     * @param {THREE.Vector3} velocity - Velocity vector
     * @returns {THREE.Vector3} Drag force vector in N
     */
    calculateDragForce(dynamicPressure, dragCoefficient, velocity) {
        if (velocity.length() < 0.01) {
            return new THREE.Vector3(0, 0, 0);
        }
        
        const dragMagnitude = dynamicPressure * this.wingArea * dragCoefficient;
        const dragDirection = velocity.clone().normalize().negate();
        return dragDirection.multiplyScalar(dragMagnitude);
    }

    /**
     * Calculate thrust force
     * @param {number} throttle - Throttle setting (0-1)
     * @param {number} airDensity - Air density for altitude adjustment
     * @param {THREE.Quaternion} orientation - Aircraft orientation
     * @returns {THREE.Vector3} Thrust force vector in N
     */
    calculateThrustForce(throttle, airDensity, orientation) {
        // Thrust decreases with altitude due to reduced air density (for jet engines)
        const densityRatio = airDensity / ADVANCED_CONSTANTS.SEA_LEVEL_DENSITY;
        const thrustFactor = Math.pow(densityRatio, 0.7); // Approximate jet engine behavior
        
        const thrustMagnitude = this.maxThrust * Math.max(0, Math.min(1, throttle)) * thrustFactor;
        const thrustDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation);
        
        return thrustDirection.multiplyScalar(thrustMagnitude);
    }

    /**
     * Calculate gravity force
     * @returns {THREE.Vector3} Gravity force vector in N
     */
    calculateGravityForce() {
        return new THREE.Vector3(0, -ADVANCED_CONSTANTS.GRAVITY * this.mass, 0);
    }

    /**
     * Calculate aerodynamic moments (pitch, roll, yaw)
     * @param {Object} controls - Control inputs { pitch, roll, yaw }
     * @param {number} dynamicPressure - Dynamic pressure in Pa
     * @param {number} angleOfAttack - Angle of attack in radians
     * @param {number} sideslipAngle - Sideslip angle in radians
     * @returns {THREE.Vector3} Torque vector in N·m
     */
    calculateAerodynamicMoments(controls, dynamicPressure, angleOfAttack, sideslipAngle) {
        const { pitch = 0, roll = 0, yaw = 0 } = controls;
        
        // Base moment coefficients
        const momentArm = this.wingSpan / 2;
        const baseMoment = dynamicPressure * this.wingArea * momentArm;
        
        // Pitch moment (elevator)
        const pitchMoment = pitch * baseMoment * 0.1 * this.controlEffectiveness.elevator;
        
        // Roll moment (ailerons)
        const rollMoment = roll * baseMoment * 0.15 * this.controlEffectiveness.aileron;
        
        // Yaw moment (rudder)
        const yawMoment = yaw * baseMoment * 0.05 * this.controlEffectiveness.rudder;
        
        // Stability derivatives - restoring moments
        const pitchStability = -angleOfAttack * baseMoment * 0.02; // Pitch damping
        const yawStability = -sideslipAngle * baseMoment * 0.01;   // Yaw damping
        
        return new THREE.Vector3(
            pitchMoment + pitchStability,
            yawMoment + yawStability,
            rollMoment
        );
    }

    /**
     * Update physics simulation for one frame
     * @param {Object} state - Current aircraft state
     * @param {Object} controls - Control inputs
     * @param {number} deltaTime - Time step in seconds
     * @returns {Object} Updated state and debug info
     */
    update(state, controls = {}, deltaTime) {
        const { position, orientation, throttle = 0 } = state;
        
        // Calculate atmospheric conditions
        const altitude = Math.max(0, position.y);
        const airDensity = this.calculateAirDensity(altitude);
        this._cachedAirDensity = airDensity;
        
        // Calculate airspeed and Mach number
        const airspeed = this.velocity.length();
        const machNumber = this.calculateMachNumber(airspeed, altitude);
        
        // Calculate aerodynamic angles
        const angleOfAttack = this.calculateAngleOfAttack(this.velocity, orientation);
        const sideslipAngle = this.calculateSideslipAngle(this.velocity, orientation);
        this._cachedAngleOfAttack = angleOfAttack;
        this._cachedSideslipAngle = sideslipAngle;
        
        // Calculate dynamic pressure
        const dynamicPressure = this.calculateDynamicPressure(airDensity, airspeed);
        this._cachedDynamicPressure = dynamicPressure;
        
        // Calculate coefficients
        const liftCoefficient = this.calculateLiftCoefficient(angleOfAttack, machNumber);
        const dragCoefficient = this.calculateDragCoefficient(liftCoefficient, machNumber);
        
        // Calculate all forces
        const lift = this.calculateLiftForce(dynamicPressure, liftCoefficient, this.velocity, orientation);
        const drag = this.calculateDragForce(dynamicPressure, dragCoefficient, this.velocity);
        const thrust = this.calculateThrustForce(throttle, airDensity, orientation);
        const gravity = this.calculateGravityForce();
        
        // Sum forces
        this.forces.set(0, 0, 0);
        this.forces.add(lift);
        this.forces.add(drag);
        this.forces.add(thrust);
        this.forces.add(gravity);
        
        // Calculate linear acceleration (F = ma)
        this.acceleration.copy(this.forces).divideScalar(this.mass);
        
        // Update velocity
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        
        // Calculate moments
        const moments = this.calculateAerodynamicMoments(controls, dynamicPressure, angleOfAttack, sideslipAngle);
        this.torques.copy(moments);
        
        // Calculate angular acceleration
        this.angularAcceleration.set(
            this.torques.x / this.inertia.Ixx,
            this.torques.y / this.inertia.Iyy,
            this.torques.z / this.inertia.Izz
        );
        
        // Update angular velocity
        this.angularVelocity.add(this.angularAcceleration.clone().multiplyScalar(deltaTime));
        
        // Apply damping to angular velocity
        this.angularVelocity.multiplyScalar(0.98);
        
        // Return debug info
        return {
            velocity: this.velocity.clone(),
            acceleration: this.acceleration.clone(),
            angularVelocity: this.angularVelocity.clone(),
            forces: {
                lift: lift.clone(),
                drag: drag.clone(),
                thrust: thrust.clone(),
                gravity: gravity.clone(),
                total: this.forces.clone()
            },
            coefficients: {
                lift: liftCoefficient,
                drag: dragCoefficient
            },
            atmosphere: {
                density: airDensity,
                temperature: this.calculateTemperature(altitude),
                speedOfSound: this.calculateSpeedOfSound(altitude)
            },
            airspeed,
            machNumber,
            angleOfAttack: THREE.MathUtils.radToDeg(angleOfAttack),
            sideslipAngle: THREE.MathUtils.radToDeg(sideslipAngle),
            altitude,
            dynamicPressure
        };
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
    }

    /**
     * Get cached air density
     * @returns {number}
     */
    getAirDensity() {
        return this._cachedAirDensity;
    }

    /**
     * Get cached angle of attack
     * @returns {number} In radians
     */
    getAngleOfAttack() {
        return this._cachedAngleOfAttack;
    }

    /**
     * Reset physics state
     */
    reset() {
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
        this.angularAcceleration.set(0, 0, 0);
        this.forces.set(0, 0, 0);
        this.torques.set(0, 0, 0);
    }
}

export default AdvancedFlightModel;
