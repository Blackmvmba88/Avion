/**
 * IFlightModel.js
 * Abstract interface for flight physics models.
 * Provides a common API that all flight models should implement.
 * 
 * This allows the simulator to switch between different fidelity levels
 * (basic, standard, advanced) without changing the main simulation code.
 */

import * as THREE from 'three';

/**
 * Flight model fidelity levels
 */
export const FlightModelFidelity = Object.freeze({
    BASIC: 'basic',       // Simplified physics for beginners
    STANDARD: 'standard', // Balanced realism and playability
    ADVANCED: 'advanced'  // Full aerodynamic simulation
});

/**
 * IFlightModel - Abstract base class for flight physics models
 * All flight models should extend this class and implement its methods.
 */
export class IFlightModel {
    /**
     * Create a new flight model
     * @param {Object} config - Model configuration
     */
    constructor(config = {}) {
        if (new.target === IFlightModel) {
            throw new Error('IFlightModel is an abstract class and cannot be instantiated directly');
        }
        
        this.config = config;
        this.fidelity = config.fidelity || FlightModelFidelity.STANDARD;
        
        // State vectors (all flight models must maintain these)
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);
        this.forces = new THREE.Vector3(0, 0, 0);
    }

    /**
     * Update physics simulation for one frame
     * @param {Object} state - Current aircraft state
     * @param {THREE.Vector3} state.position - Aircraft position
     * @param {THREE.Quaternion} state.orientation - Aircraft orientation
     * @param {number} state.throttle - Throttle setting (0-1)
     * @param {Object} controls - Control inputs { pitch, roll, yaw }
     * @param {number} deltaTime - Time step in seconds
     * @returns {Object} Updated state and debug info
     */
    update(state, controls, deltaTime) {
        throw new Error('update() must be implemented by subclass');
    }

    /**
     * Calculate air density at altitude
     * @param {number} altitude - Altitude in meters
     * @returns {number} Air density in kg/m³
     */
    calculateAirDensity(altitude) {
        throw new Error('calculateAirDensity() must be implemented by subclass');
    }

    /**
     * Calculate lift force
     * @param {Object} params - Calculation parameters
     * @returns {THREE.Vector3} Lift force vector
     */
    calculateLiftForce(params) {
        throw new Error('calculateLiftForce() must be implemented by subclass');
    }

    /**
     * Calculate drag force
     * @param {Object} params - Calculation parameters
     * @returns {THREE.Vector3} Drag force vector
     */
    calculateDragForce(params) {
        throw new Error('calculateDragForce() must be implemented by subclass');
    }

    /**
     * Calculate thrust force
     * @param {number} throttle - Throttle setting (0-1)
     * @param {THREE.Quaternion} orientation - Aircraft orientation
     * @returns {THREE.Vector3} Thrust force vector
     */
    calculateThrustForce(throttle, orientation) {
        throw new Error('calculateThrustForce() must be implemented by subclass');
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
     * Get current airspeed
     * @returns {number}
     */
    getAirspeed() {
        return this.velocity.length();
    }

    /**
     * Reset physics state to initial values
     */
    reset() {
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
        this.forces.set(0, 0, 0);
    }

    /**
     * Get model fidelity level
     * @returns {string}
     */
    getFidelity() {
        return this.fidelity;
    }
}

export default IFlightModel;
