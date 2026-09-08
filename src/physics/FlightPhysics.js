/**
 * FlightPhysics.js
 * Core flight physics engine implementing aerodynamic forces.
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
    LIFT_CURVE_SLOPE: 5.7       // CL/rad for a representative finite wing
});

/**
 * FlightPhysics class
 * Calculates and applies aerodynamic forces to aircraft.
 */
export class FlightPhysics {
    /**
     * Create a new FlightPhysics instance.
     *
     * @param {Object} config - Physics configuration
     * @param {number} config.mass - Aircraft mass in kg
     * @param {number} config.wingArea - Wing surface area in m²
     * @param {number} config.wingSpan - Wing span in m
     * @param {number} config.aspectRatio - Wing aspect ratio. Derived from span/area when omitted.
     * @param {number} config.oswaldEfficiency - Oswald span efficiency factor
     * @param {number} config.maxThrust - Maximum sea-level thrust force in N
     * @param {number} config.thrustAltitudeExponent - Density-ratio exponent for thrust lapse
     * @param {number} config.dragCoefficient - Zero-lift/parasitic drag coefficient
     * @param {number} config.liftCoefficient - Lift scale used by the simplified lift curve
     */
    constructor(config = {}) {
        this.mass = config.mass ?? 1000;
        this.wingArea = config.wingArea ?? 16;
        this.wingSpan = config.wingSpan ?? 10;
        this.aspectRatio = config.aspectRatio ?? ((this.wingSpan * this.wingSpan) / this.wingArea);
        this.oswaldEfficiency = config.oswaldEfficiency ?? 0.8;
        this.maxThrust = config.maxThrust ?? 20000;
        this.thrustAltitudeExponent = config.thrustAltitudeExponent ?? 0.7;
        this.baseDragCoefficient = config.dragCoefficient ?? 0.02;
        this.baseLiftCoefficient = config.liftCoefficient ?? 1.0;

        // Defensive bounds keep malformed aircraft profiles from destabilizing the solver.
        this.mass = Math.max(1, this.mass);
        this.wingArea = Math.max(0.01, this.wingArea);
        this.aspectRatio = Math.max(0.1, this.aspectRatio);
        this.oswaldEfficiency = THREE.MathUtils.clamp(this.oswaldEfficiency, 0.1, 1.0);
        this.maxThrust = Math.max(0, this.maxThrust);
        this.thrustAltitudeExponent = Math.max(0, this.thrustAltitudeExponent);

        // State vectors
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);

        // Force accumulators
        this.forces = new THREE.Vector3(0, 0, 0);
        this.torques = new THREE.Vector3(0, 0, 0);
    }

    /**
     * Calculate air density at a given altitude using an exponential atmosphere model.
     * @param {number} altitude - Altitude in meters
     * @returns {number} Air density in kg/m³
     */
    calculateAirDensity(altitude) {
        return CONSTANTS.SEA_LEVEL_DENSITY * Math.exp(-Math.max(0, altitude) / CONSTANTS.SCALE_HEIGHT);
    }

    /**
     * Calculate dynamic pressure (q = 0.5 * ρ * V²)
     */
    calculateDynamicPressure(airDensity, airspeed) {
        return 0.5 * Math.max(0, airDensity) * airspeed * airspeed;
    }

    /**
     * Calculate angle of attack based on velocity and aircraft orientation.
     */
    calculateAngleOfAttack(velocity, orientation) {
        if (velocity.length() < 0.1) return 0;

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(orientation);
        const velocityNorm = velocity.clone().normalize();

        const dot = forward.dot(velocityNorm);
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
        const cross = new THREE.Vector3().crossVectors(forward, velocityNorm);
        const sign = cross.dot(up) > 0 ? 1 : -1;

        return angle * sign;
    }

    /**
     * Calculate lift coefficient based on angle of attack.
     * Uses a simplified lift curve with post-stall decay.
     */
    calculateLiftCoefficient(angleOfAttack) {
        const aoaDegrees = THREE.MathUtils.radToDeg(angleOfAttack);
        const stallAngle = CONSTANTS.MAX_ANGLE_OF_ATTACK;

        if (Math.abs(aoaDegrees) < stallAngle) {
            return this.baseLiftCoefficient * angleOfAttack * CONSTANTS.LIFT_CURVE_SLOPE;
        }

        const stallFactor = Math.exp(-(Math.abs(aoaDegrees) - stallAngle) / 10);
        return Math.sign(angleOfAttack) * this.baseLiftCoefficient * 0.5 * stallFactor;
    }

    /**
     * Calculate drag coefficient using the finite-wing drag polar:
     * CD = CD0 + CL² / (π * AR * e)
     */
    calculateDragCoefficient(liftCoefficient) {
        const inducedDragFactor = 1 / (Math.PI * this.aspectRatio * this.oswaldEfficiency);
        return this.baseDragCoefficient + inducedDragFactor * liftCoefficient * liftCoefficient;
    }

    /** Calculate lift force. */
    calculateLiftForce(dynamicPressure, liftCoefficient, orientation) {
        const liftMagnitude = dynamicPressure * this.wingArea * liftCoefficient;
        const liftDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(orientation);
        return liftDirection.multiplyScalar(liftMagnitude);
    }

    /** Calculate drag force. */
    calculateDragForce(dynamicPressure, dragCoefficient, velocity) {
        if (velocity.length() < 0.01) return new THREE.Vector3(0, 0, 0);

        const dragMagnitude = dynamicPressure * this.wingArea * dragCoefficient;
        const dragDirection = velocity.clone().normalize().negate();
        return dragDirection.multiplyScalar(dragMagnitude);
    }

    /**
     * Return the available-thrust multiplier for the current air density.
     * This is intentionally a simple jet-like lapse model; propulsion-specific
     * engine maps can replace it later without changing the force API.
     */
    calculateThrustFactor(airDensity = CONSTANTS.SEA_LEVEL_DENSITY) {
        const densityRatio = THREE.MathUtils.clamp(
            Math.max(0, airDensity) / CONSTANTS.SEA_LEVEL_DENSITY,
            0,
            1
        );
        return Math.pow(densityRatio, this.thrustAltitudeExponent);
    }

    /** Calculate thrust force. */
    calculateThrustForce(throttle, orientation, airDensity = CONSTANTS.SEA_LEVEL_DENSITY) {
        const commandedThrottle = THREE.MathUtils.clamp(throttle ?? 0, 0, 1);
        const thrustMagnitude = this.maxThrust * commandedThrottle * this.calculateThrustFactor(airDensity);
        const thrustDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation);
        return thrustDirection.multiplyScalar(thrustMagnitude);
    }

    /** Calculate gravity force. */
    calculateGravityForce() {
        return new THREE.Vector3(0, -CONSTANTS.GRAVITY * this.mass, 0);
    }

    /**
     * Update physics simulation for one frame.
     */
    update(state, deltaTime) {
        const { position, orientation, throttle } = state;
        const altitude = Math.max(0, position.y);
        const airDensity = this.calculateAirDensity(altitude);
        const airspeed = this.velocity.length();
        const angleOfAttack = this.calculateAngleOfAttack(this.velocity, orientation);
        const liftCoefficient = this.calculateLiftCoefficient(angleOfAttack);
        const dragCoefficient = this.calculateDragCoefficient(liftCoefficient);
        const dynamicPressure = this.calculateDynamicPressure(airDensity, airspeed);

        const lift = this.calculateLiftForce(dynamicPressure, liftCoefficient, orientation);
        const drag = this.calculateDragForce(dynamicPressure, dragCoefficient, this.velocity);
        const thrust = this.calculateThrustForce(throttle, orientation, airDensity);
        const gravity = this.calculateGravityForce();

        this.forces.set(0, 0, 0);
        this.forces.add(lift);
        this.forces.add(drag);
        this.forces.add(thrust);
        this.forces.add(gravity);

        this.acceleration.copy(this.forces).divideScalar(this.mass);
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        this.angularVelocity.multiplyScalar(0.98);

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
            performance: {
                thrustFactor: this.calculateThrustFactor(airDensity)
            },
            airspeed,
            angleOfAttack: THREE.MathUtils.radToDeg(angleOfAttack),
            airDensity,
            altitude
        };
    }

    /** Apply simplified control inputs to angular velocity. */
    applyControlInputs(controls, deltaTime) {
        const pitchRate = 1.5;
        const rollRate = 2.0;
        const yawRate = 0.8;

        this.angularVelocity.x += controls.pitch * pitchRate * deltaTime;
        this.angularVelocity.z += controls.roll * rollRate * deltaTime;
        this.angularVelocity.y += controls.yaw * yawRate * deltaTime;

        const maxAngularVelocity = 3.0;
        this.angularVelocity.x = THREE.MathUtils.clamp(this.angularVelocity.x, -maxAngularVelocity, maxAngularVelocity);
        this.angularVelocity.y = THREE.MathUtils.clamp(this.angularVelocity.y, -maxAngularVelocity, maxAngularVelocity);
        this.angularVelocity.z = THREE.MathUtils.clamp(this.angularVelocity.z, -maxAngularVelocity, maxAngularVelocity);
    }

    getVelocity() {
        return this.velocity.clone();
    }

    setVelocity(velocity) {
        this.velocity.copy(velocity);
    }

    getAngularVelocity() {
        return this.angularVelocity.clone();
    }

    reset() {
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
        this.forces.set(0, 0, 0);
    }
}

export { CONSTANTS };
