/**
 * LandingGear.js
 * Implements landing gear physics including deployment, ground contact,
 * wheel dynamics, braking, and steering.
 */

import * as THREE from 'three';

/**
 * Landing gear constants
 */
const GEAR_CONSTANTS = Object.freeze({
    // Deployment
    DEPLOYMENT_TIME: 3.0,           // seconds to extend/retract
    
    // Suspension
    SPRING_CONSTANT: 50000,         // N/m
    DAMPING_COEFFICIENT: 8000,      // N·s/m
    MAX_COMPRESSION: 0.5,           // meters
    PRELOAD: 0.1,                   // meters - initial compression
    
    // Wheels
    WHEEL_FRICTION_STATIC: 0.8,     // Dry concrete
    WHEEL_FRICTION_KINETIC: 0.6,    // Rolling
    WHEEL_FRICTION_WET: 0.4,        // Wet surface
    ROLLING_RESISTANCE: 0.015,      // Rolling resistance coefficient
    
    // Braking
    MAX_BRAKE_FORCE_COEFFICIENT: 0.8,
    BRAKE_FADE_TEMPERATURE: 300,    // °C - brake fade starts
    BRAKE_FAIL_TEMPERATURE: 500,    // °C - brake failure
    
    // Steering
    MAX_STEERING_ANGLE: 60,         // degrees
    STEERING_RATE: 90,              // degrees per second
    CASTERING_DAMPING: 0.95,        // Nosewheel castering damping
    
    // Speed limits
    MAX_TAXI_SPEED: 15,             // m/s
    GEAR_RETRACT_SPEED: 100,        // m/s - max speed for gear operation
    TIRE_SPEED_LIMIT: 120           // m/s - tire failure speed
});

/**
 * Gear deployment states
 */
export const GearState = Object.freeze({
    UP: 'up',
    DOWN: 'down',
    DEPLOYING: 'deploying',
    RETRACTING: 'retracting',
    FAILED: 'failed'
});

/**
 * Individual gear strut class
 */
class GearStrut {
    /**
     * Create a gear strut
     * @param {Object} config - Strut configuration
     */
    constructor(config = {}) {
        // Position relative to aircraft CG
        this.position = new THREE.Vector3(
            config.x || 0,
            config.y || -2,
            config.z || 0
        );
        
        // Strut properties
        this.length = config.length || 2;                    // m
        this.compression = 0;                                 // m
        this.compressionVelocity = 0;                        // m/s
        
        // Wheel properties
        this.wheelRadius = config.wheelRadius || 0.3;        // m
        this.wheelRotation = 0;                              // radians
        this.wheelRPM = 0;
        this.isSteerable = config.isSteerable || false;
        this.hasBrake = config.hasBrake !== false;
        this.steeringAngle = 0;                              // radians
        
        // State
        this.isOnGround = false;
        this.groundContactPoint = new THREE.Vector3();
        this.normalForce = 0;
        this.frictionForce = new THREE.Vector3();
        
        // Brake state
        this.brakeApplication = 0;                           // 0-1
        this.brakeTemperature = 20;                          // °C ambient
        
        // Weight distribution factor (for multi-wheel systems)
        this.weightFactor = config.weightFactor || 1.0;
    }

    /**
     * Update strut physics
     * @param {Object} params - Update parameters
     * @returns {Object} Forces and state
     */
    update(params) {
        const { 
            aircraftPosition, 
            aircraftOrientation, 
            aircraftVelocity,
            groundHeight,
            deltaTime,
            mass,
            steeringInput,
            brakeInput
        } = params;
        
        // Calculate world position of strut base
        const worldPosition = this.position.clone()
            .applyQuaternion(aircraftOrientation)
            .add(aircraftPosition);
        
        // Calculate ground contact point (bottom of wheel)
        const strutDown = new THREE.Vector3(0, -1, 0).applyQuaternion(aircraftOrientation);
        const wheelBottom = worldPosition.clone()
            .add(strutDown.clone().multiplyScalar(this.length - this.compression + this.wheelRadius));
        
        // Check ground contact
        const heightAboveGround = wheelBottom.y - groundHeight;
        this.isOnGround = heightAboveGround <= 0;
        
        const result = {
            force: new THREE.Vector3(),
            torque: new THREE.Vector3(),
            isOnGround: this.isOnGround
        };
        
        if (!this.isOnGround) {
            // Airborne - decompress strut
            this.compression = Math.max(0, this.compression - deltaTime * 0.5);
            this.compressionVelocity = 0;
            this.normalForce = 0;
            this.wheelRPM = Math.max(0, this.wheelRPM * 0.99); // Wheels slow down
            return result;
        }
        
        // Ground contact - calculate forces
        this.groundContactPoint.copy(wheelBottom);
        this.groundContactPoint.y = groundHeight;
        
        // Calculate strut compression
        const penetration = -heightAboveGround;
        const newCompression = Math.min(GEAR_CONSTANTS.MAX_COMPRESSION, 
            GEAR_CONSTANTS.PRELOAD + penetration);
        
        // Compression velocity
        this.compressionVelocity = (newCompression - this.compression) / deltaTime;
        this.compression = newCompression;
        
        // Spring-damper force (normal force)
        const springForce = GEAR_CONSTANTS.SPRING_CONSTANT * this.compression;
        const damperForce = GEAR_CONSTANTS.DAMPING_COEFFICIENT * this.compressionVelocity;
        this.normalForce = Math.max(0, springForce + damperForce) * this.weightFactor;
        
        // Apply normal force in world up direction (opposing gravity)
        result.force.y = this.normalForce;
        
        // Calculate friction forces
        const frictionResult = this._calculateFriction(
            aircraftVelocity,
            aircraftOrientation,
            steeringInput,
            brakeInput,
            deltaTime
        );
        
        result.force.add(frictionResult.force);
        result.torque.add(frictionResult.torque);
        
        // Update wheel rotation
        const groundSpeed = new THREE.Vector3(aircraftVelocity.x, 0, aircraftVelocity.z).length();
        this.wheelRPM = (groundSpeed / (2 * Math.PI * this.wheelRadius)) * 60;
        this.wheelRotation += (groundSpeed / this.wheelRadius) * deltaTime;
        
        // Update brake temperature
        this._updateBrakeTemperature(brakeInput, groundSpeed, deltaTime);
        
        return result;
    }

    /**
     * Calculate friction forces
     * @private
     */
    _calculateFriction(velocity, orientation, steeringInput, brakeInput, deltaTime) {
        const result = {
            force: new THREE.Vector3(),
            torque: new THREE.Vector3()
        };
        
        if (this.normalForce <= 0) return result;
        
        // Get ground velocity (horizontal plane)
        const groundVelocity = new THREE.Vector3(velocity.x, 0, velocity.z);
        const speed = groundVelocity.length();
        
        if (speed < 0.01) {
            // Nearly stationary - static friction (prevents sliding)
            return result;
        }
        
        // Get wheel direction in world space
        let wheelForward = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation);
        
        // Apply steering if this is a steerable gear
        if (this.isSteerable) {
            this.steeringAngle = steeringInput * THREE.MathUtils.degToRad(GEAR_CONSTANTS.MAX_STEERING_ANGLE);
            const steerRotation = new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(0, 1, 0), this.steeringAngle
            );
            wheelForward.applyQuaternion(steerRotation);
        }
        
        wheelForward.y = 0;
        wheelForward.normalize();
        
        const wheelRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), wheelForward);
        
        // Decompose velocity into longitudinal and lateral components
        const velocityDir = groundVelocity.clone().normalize();
        const longitudinalSpeed = groundVelocity.dot(wheelForward);
        const lateralSpeed = groundVelocity.dot(wheelRight);
        
        // Calculate friction coefficients
        let frictionCoeff = GEAR_CONSTANTS.WHEEL_FRICTION_KINETIC;
        
        // Rolling resistance
        const rollingResistance = GEAR_CONSTANTS.ROLLING_RESISTANCE * this.normalForce;
        const rollingForce = wheelForward.clone().multiplyScalar(
            -Math.sign(longitudinalSpeed) * rollingResistance
        );
        result.force.add(rollingForce);
        
        // Braking force (longitudinal)
        if (this.hasBrake && brakeInput > 0) {
            const brakeEffectiveness = this._getBrakeEffectiveness();
            const maxBrakeForce = GEAR_CONSTANTS.MAX_BRAKE_FORCE_COEFFICIENT * 
                this.normalForce * brakeInput * brakeEffectiveness;
            
            // Apply brake force opposite to direction of travel
            const brakeForce = Math.min(maxBrakeForce, Math.abs(longitudinalSpeed) * 1000);
            result.force.add(wheelForward.clone().multiplyScalar(
                -Math.sign(longitudinalSpeed) * brakeForce
            ));
        }
        
        // Lateral friction (prevents sideways sliding)
        const maxLateralFriction = frictionCoeff * this.normalForce;
        const lateralFriction = Math.min(maxLateralFriction, Math.abs(lateralSpeed) * 500);
        result.force.add(wheelRight.clone().multiplyScalar(
            -Math.sign(lateralSpeed) * lateralFriction
        ));
        
        // Steering torque (yaw moment from nosewheel steering)
        if (this.isSteerable && Math.abs(this.steeringAngle) > 0.01) {
            const steeringTorque = lateralFriction * this.position.z * 0.5;
            result.torque.y = steeringTorque * Math.sign(this.steeringAngle);
        }
        
        return result;
    }

    /**
     * Get brake effectiveness based on temperature
     * @private
     */
    _getBrakeEffectiveness() {
        if (this.brakeTemperature < GEAR_CONSTANTS.BRAKE_FADE_TEMPERATURE) {
            return 1.0;
        }
        if (this.brakeTemperature >= GEAR_CONSTANTS.BRAKE_FAIL_TEMPERATURE) {
            return 0.1; // Brake failure
        }
        // Linear fade between fade and fail temperatures
        const fadeRange = GEAR_CONSTANTS.BRAKE_FAIL_TEMPERATURE - GEAR_CONSTANTS.BRAKE_FADE_TEMPERATURE;
        const fadeAmount = (this.brakeTemperature - GEAR_CONSTANTS.BRAKE_FADE_TEMPERATURE) / fadeRange;
        return 1.0 - (fadeAmount * 0.9);
    }

    /**
     * Update brake temperature
     * @private
     */
    _updateBrakeTemperature(brakeInput, groundSpeed, deltaTime) {
        // Heat generation from braking
        const heatGeneration = brakeInput * groundSpeed * 0.5; // Simplified model
        
        // Cooling (ambient + airflow)
        const cooling = (this.brakeTemperature - 20) * 0.01 + groundSpeed * 0.02;
        
        this.brakeTemperature += (heatGeneration - cooling) * deltaTime;
        this.brakeTemperature = Math.max(20, this.brakeTemperature); // Don't go below ambient
    }
}

/**
 * LandingGear class
 * Manages complete landing gear system
 */
export class LandingGear {
    /**
     * Create a new LandingGear instance
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        // Gear state
        this._gearState = config.startDown !== false ? GearState.DOWN : GearState.UP;
        this._deploymentProgress = this._gearState === GearState.DOWN ? 1 : 0;
        
        // Gear struts configuration
        this._struts = [];
        this._setupStruts(config);
        
        // Terrain callback for ground height
        this.terrainHeightCallback = config.terrainHeightCallback || null;
        
        // Control state
        this._steeringInput = 0;
        this._brakeInput = 0;
        this._parkingBrake = false;
        
        // Computed values
        this._anyWheelOnGround = false;
        this._allWheelsOnGround = false;
        this._totalNormalForce = 0;
    }

    /**
     * Setup gear struts based on configuration
     * @private
     */
    _setupStruts(config) {
        if (config.struts) {
            // Use provided strut configuration
            for (const strutConfig of config.struts) {
                this._struts.push(new GearStrut(strutConfig));
            }
        } else {
            // Default tricycle gear configuration
            // Nose gear
            this._struts.push(new GearStrut({
                x: 0,
                y: -1.5,
                z: -4,
                length: 1.5,
                wheelRadius: 0.25,
                isSteerable: true,
                hasBrake: false,
                weightFactor: 0.1
            }));
            
            // Left main gear
            this._struts.push(new GearStrut({
                x: -2,
                y: -1.5,
                z: 0,
                length: 1.8,
                wheelRadius: 0.35,
                isSteerable: false,
                hasBrake: true,
                weightFactor: 0.45
            }));
            
            // Right main gear
            this._struts.push(new GearStrut({
                x: 2,
                y: -1.5,
                z: 0,
                length: 1.8,
                wheelRadius: 0.35,
                isSteerable: false,
                hasBrake: true,
                weightFactor: 0.45
            }));
        }
    }

    /**
     * Get ground height at position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {number} Ground height
     * @private
     */
    _getGroundHeight(x, z) {
        if (this.terrainHeightCallback) {
            return this.terrainHeightCallback(x, z);
        }
        return 0;
    }

    /**
     * Toggle gear up/down
     * @param {number} airspeed - Current airspeed for safety check
     * @returns {boolean} Whether the toggle was successful
     */
    toggleGear(airspeed = 0) {
        // Safety check - don't retract gear above safe speed
        if (this._gearState === GearState.DOWN && airspeed > GEAR_CONSTANTS.GEAR_RETRACT_SPEED) {
            console.warn('Cannot retract gear above safe speed');
            return false;
        }
        
        // Safety check - don't retract if wheels on ground
        if (this._gearState === GearState.DOWN && this._anyWheelOnGround) {
            console.warn('Cannot retract gear while on ground');
            return false;
        }
        
        if (this._gearState === GearState.DOWN || this._gearState === GearState.DEPLOYING) {
            this._gearState = GearState.RETRACTING;
        } else if (this._gearState === GearState.UP || this._gearState === GearState.RETRACTING) {
            this._gearState = GearState.DEPLOYING;
        }
        
        return true;
    }

    /**
     * Set gear state directly (for initialization)
     * @param {string} state - GearState value
     */
    setGearState(state) {
        this._gearState = state;
        this._deploymentProgress = state === GearState.DOWN ? 1 : 0;
    }

    /**
     * Set steering input
     * @param {number} input - Steering input (-1 to 1)
     */
    setSteering(input) {
        this._steeringInput = Math.max(-1, Math.min(1, input));
    }

    /**
     * Set brake input
     * @param {number} input - Brake input (0 to 1)
     */
    setBrakes(input) {
        this._brakeInput = Math.max(0, Math.min(1, input));
    }

    /**
     * Toggle parking brake
     */
    toggleParkingBrake() {
        this._parkingBrake = !this._parkingBrake;
    }

    /**
     * Set parking brake state
     * @param {boolean} engaged
     */
    setParkingBrake(engaged) {
        this._parkingBrake = engaged;
    }

    /**
     * Update landing gear system
     * @param {Object} state - Aircraft state
     * @param {number} deltaTime - Time step in seconds
     * @returns {Object} Forces and torques from landing gear
     */
    update(state, deltaTime) {
        const { position, orientation, velocity, mass } = state;
        
        const result = {
            force: new THREE.Vector3(),
            torque: new THREE.Vector3(),
            gearState: this._gearState,
            deploymentProgress: this._deploymentProgress,
            anyWheelOnGround: false,
            allWheelsOnGround: true,
            strutStates: []
        };
        
        // Update gear deployment
        this._updateDeployment(deltaTime);
        
        // If gear is not deployed, no ground forces
        if (this._deploymentProgress < 1) {
            result.allWheelsOnGround = false;
            this._anyWheelOnGround = false;
            this._allWheelsOnGround = false;
            return result;
        }
        
        // Effective brake input (including parking brake)
        const effectiveBrake = this._parkingBrake ? 1.0 : this._brakeInput;
        
        // Update each strut
        this._totalNormalForce = 0;
        
        for (const strut of this._struts) {
            // Get ground height at strut position
            const strutWorldPos = strut.position.clone()
                .applyQuaternion(orientation)
                .add(position);
            const groundHeight = this._getGroundHeight(strutWorldPos.x, strutWorldPos.z);
            
            const strutResult = strut.update({
                aircraftPosition: position,
                aircraftOrientation: orientation,
                aircraftVelocity: velocity,
                groundHeight,
                deltaTime,
                mass,
                steeringInput: this._steeringInput,
                brakeInput: effectiveBrake
            });
            
            // Accumulate forces
            result.force.add(strutResult.force);
            result.torque.add(strutResult.torque);
            
            // Track ground contact
            if (strutResult.isOnGround) {
                result.anyWheelOnGround = true;
            } else {
                result.allWheelsOnGround = false;
            }
            
            this._totalNormalForce += strut.normalForce;
            
            // Store strut state for debugging/display
            result.strutStates.push({
                position: strut.position.clone(),
                compression: strut.compression,
                normalForce: strut.normalForce,
                isOnGround: strut.isOnGround,
                wheelRPM: strut.wheelRPM,
                brakeTemperature: strut.brakeTemperature,
                steeringAngle: strut.steeringAngle
            });
        }
        
        // Calculate torque from off-center forces
        // (This is simplified - proper implementation would use moment arms)
        
        this._anyWheelOnGround = result.anyWheelOnGround;
        this._allWheelsOnGround = result.allWheelsOnGround;
        
        return result;
    }

    /**
     * Update gear deployment animation
     * @private
     */
    _updateDeployment(deltaTime) {
        const deployRate = 1 / GEAR_CONSTANTS.DEPLOYMENT_TIME;
        
        switch (this._gearState) {
            case GearState.DEPLOYING:
                this._deploymentProgress += deployRate * deltaTime;
                if (this._deploymentProgress >= 1) {
                    this._deploymentProgress = 1;
                    this._gearState = GearState.DOWN;
                }
                break;
                
            case GearState.RETRACTING:
                this._deploymentProgress -= deployRate * deltaTime;
                if (this._deploymentProgress <= 0) {
                    this._deploymentProgress = 0;
                    this._gearState = GearState.UP;
                }
                break;
        }
    }

    /**
     * Check if any wheel is touching ground
     * @returns {boolean}
     */
    isOnGround() {
        return this._anyWheelOnGround;
    }

    /**
     * Check if all wheels are on ground
     * @returns {boolean}
     */
    isFullyOnGround() {
        return this._allWheelsOnGround;
    }

    /**
     * Get gear deployment state
     * @returns {string}
     */
    getGearState() {
        return this._gearState;
    }

    /**
     * Get deployment progress (0-1)
     * @returns {number}
     */
    getDeploymentProgress() {
        return this._deploymentProgress;
    }

    /**
     * Check if gear is down and locked
     * @returns {boolean}
     */
    isGearDownAndLocked() {
        return this._gearState === GearState.DOWN && this._deploymentProgress === 1;
    }

    /**
     * Get total normal force on all struts
     * @returns {number}
     */
    getTotalNormalForce() {
        return this._totalNormalForce;
    }

    /**
     * Get brake temperatures
     * @returns {Array<number>}
     */
    getBrakeTemperatures() {
        return this._struts.map(strut => strut.brakeTemperature);
    }

    /**
     * Check if parking brake is engaged
     * @returns {boolean}
     */
    isParkingBrakeEngaged() {
        return this._parkingBrake;
    }

    /**
     * Set terrain height callback
     * @param {Function} callback - Function(x, z) returning ground height
     */
    setTerrainHeightCallback(callback) {
        this.terrainHeightCallback = callback;
    }

    /**
     * Get strut information
     * @returns {Array}
     */
    getStrutInfo() {
        return this._struts.map(strut => ({
            position: strut.position.clone(),
            length: strut.length,
            compression: strut.compression,
            wheelRadius: strut.wheelRadius,
            isOnGround: strut.isOnGround,
            normalForce: strut.normalForce,
            wheelRPM: strut.wheelRPM,
            isSteerable: strut.isSteerable,
            steeringAngle: THREE.MathUtils.radToDeg(strut.steeringAngle),
            brakeTemperature: strut.brakeTemperature
        }));
    }

    /**
     * Reset landing gear to initial state
     */
    reset() {
        this._gearState = GearState.DOWN;
        this._deploymentProgress = 1;
        this._steeringInput = 0;
        this._brakeInput = 0;
        this._parkingBrake = false;
        
        for (const strut of this._struts) {
            strut.compression = 0;
            strut.compressionVelocity = 0;
            strut.wheelRPM = 0;
            strut.steeringAngle = 0;
            strut.brakeTemperature = 20;
            strut.isOnGround = false;
            strut.normalForce = 0;
        }
    }
}

export { GEAR_CONSTANTS, GearStrut };
export default LandingGear;
