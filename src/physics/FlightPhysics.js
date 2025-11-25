/**
 * FlightPhysics.js
 * Core flight physics engine implementing realistic aerodynamic forces.
 * Handles lift, drag, thrust, gravity, air density, and angle of attack calculations.
 */

import * as THREE from 'three';

/**
 * Physical constants for flight simulation
 */
const CONSTANTS = Object.freeze({
    GRAVITY: 9.81,              // m/s² - Earth's gravitational acceleration
    SEA_LEVEL_DENSITY: 1.225,   // kg/m³ - Air density at sea level
    SCALE_HEIGHT: 8500,         // m - Atmospheric scale height
    MAX_ANGLE_OF_ATTACK: 25,    // degrees - Maximum effective angle of attack
    LIFT_CURVE_SLOPE: 5.7       // Lift curve slope (approximately 2π ≈ 6.28, using 5.7 for realistic wing)
});

/**
 * FlightPhysics class
 * Calculates and applies aerodynamic forces to aircraft.
 */
export class FlightPhysics {
    /**
     * Create a new FlightPhysics instance
     * @param {Object} config - Physics configuration
     * @param {number} config.mass - Aircraft mass in kg
     * @param {number} config.wingArea - Wing surface area in m²
     * @param {number} config.maxThrust - Maximum thrust force in N
     * @param {number} config.dragCoefficient - Base drag coefficient
     * @param {number} config.liftCoefficient - Base lift coefficient
     */
    constructor(config = {}) {
        this.mass = config.mass || 1000;           // kg
        this.wingArea = config.wingArea || 16;     // m²
        this.maxThrust = config.maxThrust || 20000; // N
        this.baseDragCoefficient = config.dragCoefficient || 0.02;
        this.baseLiftCoefficient = config.liftCoefficient || 1.0;
        
        // State vectors
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);
        
        // Force accumulators
        this.forces = new THREE.Vector3(0, 0, 0);
        this.torques = new THREE.Vector3(0, 0, 0);
    }

    /**
     * Calculate air density at a given altitude using barometric formula
     * @param {number} altitude - Altitude in meters
     * @returns {number} Air density in kg/m³
     */
    calculateAirDensity(altitude) {
        // Exponential atmosphere model
        return CONSTANTS.SEA_LEVEL_DENSITY * Math.exp(-altitude / CONSTANTS.SCALE_HEIGHT);
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
     * Calculate angle of attack based on velocity and aircraft orientation
     * @param {THREE.Vector3} velocity - Velocity vector
     * @param {THREE.Quaternion} orientation - Aircraft orientation quaternion
     * @returns {number} Angle of attack in radians
     */
    calculateAngleOfAttack(velocity, orientation) {
        if (velocity.length() < 0.1) return 0;
        
        // Get aircraft forward and up vectors
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(orientation);
        
        // Normalize velocity
        const velocityNorm = velocity.clone().normalize();
        
        // Calculate angle between forward vector and velocity
        const dot = forward.dot(velocityNorm);
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
        
        // Determine sign based on up vector
        const cross = new THREE.Vector3().crossVectors(forward, velocityNorm);
        const sign = cross.dot(up) > 0 ? 1 : -1;
        
        return angle * sign;
    }

    /**
     * Calculate lift coefficient based on angle of attack
     * Uses simplified lift curve with stall modeling
     * @param {number} angleOfAttack - Angle of attack in radians
     * @returns {number} Lift coefficient
     */
    calculateLiftCoefficient(angleOfAttack) {
        const aoaDegrees = THREE.MathUtils.radToDeg(angleOfAttack);
        const stallAngle = CONSTANTS.MAX_ANGLE_OF_ATTACK;
        
        // Linear lift increase until stall angle
        if (Math.abs(aoaDegrees) < stallAngle) {
            // Lift curve slope (CL per radian) - typically around 5.7 for finite wings
            return this.baseLiftCoefficient * angleOfAttack * CONSTANTS.LIFT_CURVE_SLOPE;
        } else {
            // Post-stall behavior - lift drops off
            const stallFactor = Math.exp(-(Math.abs(aoaDegrees) - stallAngle) / 10);
            return Math.sign(angleOfAttack) * this.baseLiftCoefficient * 0.5 * stallFactor;
        }
    }

    /**
     * Calculate drag coefficient using drag polar equation
     * @param {number} liftCoefficient - Current lift coefficient
     * @returns {number} Total drag coefficient
     */
    calculateDragCoefficient(liftCoefficient) {
        // Drag polar: CD = CD0 + CL²/(π * AR * e)
        // Simplified with aspect ratio AR = 8 and efficiency e = 0.8
        const inducedDragFactor = 0.05;
        return this.baseDragCoefficient + inducedDragFactor * liftCoefficient * liftCoefficient;
    }

    /**
     * Calculate lift force
     * @param {number} dynamicPressure - Dynamic pressure in Pa
     * @param {number} liftCoefficient - Lift coefficient
     * @param {THREE.Quaternion} orientation - Aircraft orientation
     * @returns {THREE.Vector3} Lift force vector in N
     */
    calculateLiftForce(dynamicPressure, liftCoefficient, orientation) {
        // Lift acts perpendicular to velocity in the plane of the wing
        const liftMagnitude = dynamicPressure * this.wingArea * liftCoefficient;
        
        // Lift direction is aircraft's up vector
        const liftDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(orientation);
        
        return liftDirection.multiplyScalar(liftMagnitude);
    }

    /**
     * Calculate drag force
     * @param {number} dynamicPressure - Dynamic pressure in Pa
     * @param {number} dragCoefficient - Drag coefficient
     * @param {THREE.Vector3} velocity - Velocity vector
     * @returns {THREE.Vector3} Drag force vector in N
     */
    calculateDragForce(dynamicPressure, dragCoefficient, velocity) {
        if (velocity.length() < 0.01) return new THREE.Vector3(0, 0, 0);
        
        // Drag acts opposite to velocity direction
        const dragMagnitude = dynamicPressure * this.wingArea * dragCoefficient;
        const dragDirection = velocity.clone().normalize().negate();
        
        return dragDirection.multiplyScalar(dragMagnitude);
    }

    /**
     * Calculate thrust force
     * @param {number} throttle - Throttle setting (0-1)
     * @param {THREE.Quaternion} orientation - Aircraft orientation
     * @returns {THREE.Vector3} Thrust force vector in N
     */
    calculateThrustForce(throttle, orientation) {
        // Thrust acts along aircraft's forward axis
        const thrustMagnitude = this.maxThrust * Math.max(0, Math.min(1, throttle));
        const thrustDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation);
        
        return thrustDirection.multiplyScalar(thrustMagnitude);
    }

    /**
     * Calculate gravity force
     * @returns {THREE.Vector3} Gravity force vector in N
     */
    calculateGravityForce() {
        return new THREE.Vector3(0, -CONSTANTS.GRAVITY * this.mass, 0);
    }

    /**
     * Update physics simulation for one frame
     * @param {Object} state - Current aircraft state
     * @param {THREE.Vector3} state.position - Aircraft position
     * @param {THREE.Quaternion} state.orientation - Aircraft orientation quaternion
     * @param {number} state.throttle - Throttle setting (0-1)
     * @param {number} deltaTime - Time step in seconds
     * @returns {Object} Updated velocity and forces for debugging
     */
    update(state, deltaTime) {
        const { position, orientation, throttle } = state;
        
        // Calculate altitude for air density
        const altitude = Math.max(0, position.y);
        const airDensity = this.calculateAirDensity(altitude);
        
        // Calculate airspeed
        const airspeed = this.velocity.length();
        
        // Calculate angle of attack
        const angleOfAttack = this.calculateAngleOfAttack(this.velocity, orientation);
        
        // Calculate coefficients
        const liftCoefficient = this.calculateLiftCoefficient(angleOfAttack);
        const dragCoefficient = this.calculateDragCoefficient(liftCoefficient);
        
        // Calculate dynamic pressure
        const dynamicPressure = this.calculateDynamicPressure(airDensity, airspeed);
        
        // Calculate all forces
        const lift = this.calculateLiftForce(dynamicPressure, liftCoefficient, orientation);
        const drag = this.calculateDragForce(dynamicPressure, dragCoefficient, this.velocity);
        const thrust = this.calculateThrustForce(throttle, orientation);
        const gravity = this.calculateGravityForce();
        
        // Sum all forces
        this.forces.set(0, 0, 0);
        this.forces.add(lift);
        this.forces.add(drag);
        this.forces.add(thrust);
        this.forces.add(gravity);
        
        // Calculate acceleration (F = ma)
        this.acceleration.copy(this.forces).divideScalar(this.mass);
        
        // Update velocity using semi-implicit Euler integration
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        
        // Apply air resistance damping to angular velocity
        this.angularVelocity.multiplyScalar(0.98);
        
        // Return debug info
        return {
            velocity: this.velocity.clone(),
            acceleration: this.acceleration.clone(),
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
            airspeed,
            angleOfAttack: THREE.MathUtils.radToDeg(angleOfAttack),
            airDensity,
            altitude
        };
    }

    /**
     * Apply control inputs to angular velocity
     * @param {Object} controls - Control inputs
     * @param {number} controls.pitch - Pitch input (-1 to 1)
     * @param {number} controls.roll - Roll input (-1 to 1)
     * @param {number} controls.yaw - Yaw input (-1 to 1)
     * @param {number} deltaTime - Time step in seconds
     */
    applyControlInputs(controls, deltaTime) {
        const pitchRate = 1.5;  // rad/s
        const rollRate = 2.0;   // rad/s
        const yawRate = 0.8;    // rad/s
        
        // Apply control moments (simplified model)
        this.angularVelocity.x += controls.pitch * pitchRate * deltaTime;
        this.angularVelocity.z += controls.roll * rollRate * deltaTime;
        this.angularVelocity.y += controls.yaw * yawRate * deltaTime;
        
        // Clamp angular velocities
        const maxAngularVelocity = 3.0;
        this.angularVelocity.x = THREE.MathUtils.clamp(this.angularVelocity.x, -maxAngularVelocity, maxAngularVelocity);
        this.angularVelocity.y = THREE.MathUtils.clamp(this.angularVelocity.y, -maxAngularVelocity, maxAngularVelocity);
        this.angularVelocity.z = THREE.MathUtils.clamp(this.angularVelocity.z, -maxAngularVelocity, maxAngularVelocity);
    }

    /**
     * Get the current velocity vector
     * @returns {THREE.Vector3} Current velocity
     */
    getVelocity() {
        return this.velocity.clone();
    }

    /**
     * Set the velocity vector
     * @param {THREE.Vector3} velocity - New velocity
     */
    setVelocity(velocity) {
        this.velocity.copy(velocity);
    }

    /**
     * Get angular velocity
     * @returns {THREE.Vector3} Current angular velocity
     */
    getAngularVelocity() {
        return this.angularVelocity.clone();
    }

    /**
     * Reset physics state
     */
    reset() {
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
        this.forces.set(0, 0, 0);
    }
}

export { CONSTANTS };
