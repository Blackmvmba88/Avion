/**
 * AdvancedAircraft.js
 * Aircraft class that uses the IntegratedFlightPhysics for Phase 3 advanced physics.
 * Extends the base Aircraft functionality with:
 * - Advanced aerodynamics (ISA atmosphere model, accurate lift/drag)
 * - Ground effect near the ground
 * - Wind and turbulence effects
 * - Stall and spin dynamics
 * - Landing gear physics
 */

import * as THREE from 'three';
import { IntegratedFlightPhysics, StallWarningLevel, SpinState, GearState, TurbulenceType } from '../physics/IntegratedFlightPhysics.js';

/**
 * AdvancedAircraft class
 * Aircraft with integrated advanced physics systems
 */
export class AdvancedAircraft {
    /**
     * Create a new AdvancedAircraft instance
     * @param {Object} config - Aircraft configuration
     * @param {string} config.name - Aircraft name
     * @param {Object} config.aircraft - Aircraft physics parameters
     * @param {Object} config.wind - Wind configuration
     * @param {Object} config.visual - Visual configuration
     * @param {Function} config.terrainHeightCallback - Function(x, z) returning ground height
     */
    constructor(config = {}) {
        this.name = config.name || 'Advanced Aircraft';

        // Default aircraft configuration
        const defaultAircraft = {
            mass: 1000,
            wingArea: 16,
            wingSpan: 10,
            maxThrust: 20000,
            dragCoefficient: 0.02,
            liftCoefficient: 1.0,
            oswaldEfficiency: 0.8,
            stallAngle: 16,
            stallSpeed: 40
        };

        // Initialize integrated physics
        this.physics = new IntegratedFlightPhysics({
            aircraft: { ...defaultAircraft, ...config.aircraft },
            wind: config.wind || { enabled: true, speed: 0, direction: 0 },
            groundEffect: { enabled: true, ...config.groundEffect },
            stallSpin: { enabled: true, ...config.stallSpin },
            landingGear: { enabled: true, startDown: true, ...config.landingGear },
            terrainHeightCallback: config.terrainHeightCallback || null
        });

        // Create 3D object group
        this.object3D = new THREE.Group();
        this.object3D.name = this.name;

        // Control state
        this.throttle = 0;
        this.controlInputs = {
            pitch: 0,
            roll: 0,
            yaw: 0
        };
        this.brakeInput = 0;
        this.steeringInput = 0;

        // Ground level (can be updated by terrain callback)
        this.groundLevel = 0;

        // Create the visual model
        this.createModel(config.visual || {});

        // Store config for reference
        this.config = { ...defaultAircraft, ...config.aircraft };

        // Debug info from last update
        this._lastDebugInfo = null;
    }

    /**
     * Create the 3D model for the aircraft
     * @param {Object} visualConfig - Visual configuration options
     */
    createModel(visualConfig) {
        const color = visualConfig.color || 0x3498db;
        const scale = visualConfig.scale || 1;

        // Materials
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.3,
            roughness: 0.6
        });

        const accentMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c3e50,
            metalness: 0.4,
            roughness: 0.5
        });

        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0x87ceeb,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.7
        });

        // Fuselage
        const fuselageGeometry = new THREE.CapsuleGeometry(0.5, 3, 8, 16);
        const fuselage = new THREE.Mesh(fuselageGeometry, bodyMaterial);
        fuselage.rotation.x = Math.PI / 2;
        fuselage.position.z = 0;
        this.object3D.add(fuselage);

        // Nose cone
        const noseGeometry = new THREE.ConeGeometry(0.4, 1, 16);
        const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
        nose.rotation.x = -Math.PI / 2;
        nose.position.z = -2.5;
        this.object3D.add(nose);

        // Cockpit
        const cockpitGeometry = new THREE.SphereGeometry(0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpit = new THREE.Mesh(cockpitGeometry, glassMaterial);
        cockpit.position.set(0, 0.4, -1);
        cockpit.scale.set(1, 0.7, 1.5);
        this.object3D.add(cockpit);

        // Main wings
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(4, -0.3);
        wingShape.lineTo(4.2, -0.2);
        wingShape.lineTo(4, 0.1);
        wingShape.lineTo(0, 0.2);
        wingShape.lineTo(0, 0);

        const wingExtrudeSettings = {
            steps: 1,
            depth: 0.1,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 2
        };

        const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);

        const rightWing = new THREE.Mesh(wingGeometry, bodyMaterial);
        rightWing.position.set(0.3, 0, 0.2);
        rightWing.rotation.x = Math.PI / 2;
        this.object3D.add(rightWing);

        const leftWing = new THREE.Mesh(wingGeometry, bodyMaterial);
        leftWing.position.set(-0.3, 0, 0.2);
        leftWing.rotation.x = Math.PI / 2;
        leftWing.rotation.z = Math.PI;
        this.object3D.add(leftWing);

        // Tail fin
        const tailFinShape = new THREE.Shape();
        tailFinShape.moveTo(0, 0);
        tailFinShape.lineTo(0.8, 0);
        tailFinShape.lineTo(0.3, 1.2);
        tailFinShape.lineTo(0, 1);
        tailFinShape.lineTo(0, 0);

        const tailFinExtrudeSettings = {
            steps: 1,
            depth: 0.08,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 1
        };

        const tailFinGeometry = new THREE.ExtrudeGeometry(tailFinShape, tailFinExtrudeSettings);
        const tailFin = new THREE.Mesh(tailFinGeometry, accentMaterial);
        tailFin.position.set(-0.04, 0.3, 2);
        this.object3D.add(tailFin);

        // Horizontal stabilizers
        const stabilizerGeometry = new THREE.BoxGeometry(2.5, 0.08, 0.6);
        const stabilizer = new THREE.Mesh(stabilizerGeometry, accentMaterial);
        stabilizer.position.set(0, 0.1, 2.2);
        this.object3D.add(stabilizer);

        // Engine
        const engineGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.8, 16);
        const engine = new THREE.Mesh(engineGeometry, accentMaterial);
        engine.rotation.x = Math.PI / 2;
        engine.position.set(0, -0.3, 1.8);
        this.object3D.add(engine);

        // Apply scale
        this.object3D.scale.setScalar(scale);

        // Shadows
        this.object3D.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    /**
     * Update aircraft state
     * @param {number} deltaTime - Time step in seconds
     * @returns {Object} Debug information from physics update
     */
    update(deltaTime) {
        // Update brakes and steering
        this.physics.setBrakes(this.brakeInput);
        this.physics.setSteering(this.steeringInput);

        // Update physics simulation
        const debugInfo = this.physics.update({
            position: this.object3D.position,
            orientation: this.object3D.quaternion,
            throttle: this.throttle
        }, this.controlInputs, deltaTime);

        // Get velocity from physics
        const velocity = this.physics.getVelocity();

        // Update position based on velocity
        this.object3D.position.add(velocity.clone().multiplyScalar(deltaTime));

        // Update orientation based on angular velocity
        const angularVelocity = this.physics.getAngularVelocity();
        const angle = angularVelocity.length() * deltaTime;
        if (angle > 0.0001) {
            const axis = angularVelocity.clone().normalize();
            const rotationDelta = new THREE.Quaternion().setFromAxisAngle(axis, angle);
            this.object3D.quaternion.multiply(rotationDelta);
        }

        // Handle ground collision (backup to landing gear)
        if (this.object3D.position.y < this.groundLevel && !this.physics.isOnGround()) {
            this.object3D.position.y = this.groundLevel;
            if (velocity.y < 0) {
                velocity.y = 0;
                this.physics.setVelocity(velocity);
            }
        }

        this._lastDebugInfo = debugInfo;
        return debugInfo;
    }

    /**
     * Set throttle level
     * @param {number} value - Throttle value (0-1)
     */
    setThrottle(value) {
        this.throttle = Math.max(0, Math.min(1, value));
    }

    /**
     * Get current throttle level
     * @returns {number}
     */
    getThrottle() {
        return this.throttle;
    }

    /**
     * Set pitch control input
     * @param {number} value - Pitch input (-1 to 1)
     */
    setPitch(value) {
        this.controlInputs.pitch = Math.max(-1, Math.min(1, value));
    }

    /**
     * Set roll control input
     * @param {number} value - Roll input (-1 to 1)
     */
    setRoll(value) {
        this.controlInputs.roll = Math.max(-1, Math.min(1, value));
    }

    /**
     * Set yaw control input
     * @param {number} value - Yaw input (-1 to 1)
     */
    setYaw(value) {
        this.controlInputs.yaw = Math.max(-1, Math.min(1, value));
    }

    /**
     * Set brake input
     * @param {number} value - Brake input (0-1)
     */
    setBrakes(value) {
        this.brakeInput = Math.max(0, Math.min(1, value));
    }

    /**
     * Set steering input (for nosewheel steering)
     * @param {number} value - Steering input (-1 to 1)
     */
    setSteering(value) {
        this.steeringInput = Math.max(-1, Math.min(1, value));
    }

    /**
     * Reset all control inputs to neutral
     */
    resetControls() {
        this.controlInputs.pitch = 0;
        this.controlInputs.roll = 0;
        this.controlInputs.yaw = 0;
        this.brakeInput = 0;
        this.steeringInput = 0;
    }

    /**
     * Toggle landing gear
     * @returns {boolean} Whether the toggle was successful
     */
    toggleLandingGear() {
        return this.physics.toggleLandingGear(this.getAirspeed());
    }

    /**
     * Toggle parking brake
     */
    toggleParkingBrake() {
        this.physics.toggleParkingBrake();
    }

    /**
     * Get the 3D position
     * @returns {THREE.Vector3}
     */
    getPosition() {
        return this.object3D.position.clone();
    }

    /**
     * Set the 3D position
     * @param {THREE.Vector3} position
     */
    setPosition(position) {
        this.object3D.position.copy(position);
    }

    /**
     * Get the 3D orientation
     * @returns {THREE.Quaternion}
     */
    getOrientation() {
        return this.object3D.quaternion.clone();
    }

    /**
     * Get the forward direction vector
     * @returns {THREE.Vector3}
     */
    getForwardDirection() {
        return new THREE.Vector3(0, 0, -1).applyQuaternion(this.object3D.quaternion);
    }

    /**
     * Get current airspeed
     * @returns {number} Airspeed in m/s
     */
    getAirspeed() {
        return this.physics.getAirspeed();
    }

    /**
     * Get current altitude
     * @returns {number} Altitude in meters
     */
    getAltitude() {
        return this.object3D.position.y;
    }

    /**
     * Check if aircraft is on ground
     * @returns {boolean}
     */
    isOnGround() {
        return this.physics.isOnGround();
    }

    /**
     * Check if aircraft is stalled
     * @returns {boolean}
     */
    isStalled() {
        return this.physics.isStalled();
    }

    /**
     * Get stall warning level
     * @returns {number} StallWarningLevel value
     */
    getStallWarningLevel() {
        return this.physics.getStallWarningLevel();
    }

    /**
     * Get current spin state
     * @returns {string} SpinState value
     */
    getSpinState() {
        return this.physics.getSpinState();
    }

    /**
     * Check if in ground effect
     * @returns {boolean}
     */
    isInGroundEffect() {
        return this.physics.isInGroundEffect(this.object3D.position);
    }

    /**
     * Get ground effect strength
     * @returns {number} Effect strength (0-1)
     */
    getGroundEffectStrength() {
        return this.physics.getGroundEffectStrength(this.object3D.position);
    }

    /**
     * Configure wind settings
     * @param {Object} windConfig - Wind configuration
     */
    setWind(windConfig) {
        this.physics.setWind(windConfig);
    }

    /**
     * Set terrain height callback
     * @param {Function} callback - Function(x, z) returning ground height
     */
    setTerrainHeightCallback(callback) {
        this.physics.setTerrainHeightCallback(callback);
    }

    /**
     * Enable or disable physics systems
     * @param {string} system - System name
     * @param {boolean} enabled - Whether to enable
     */
    setPhysicsSystemEnabled(system, enabled) {
        this.physics.setSystemEnabled(system, enabled);
    }

    /**
     * Force recovery from spin (debug function)
     */
    forceSpinRecovery() {
        this.physics.forceSpinRecovery();
    }

    /**
     * Get last debug info
     * @returns {Object|null}
     */
    getDebugInfo() {
        return this._lastDebugInfo;
    }

    /**
     * Reset aircraft to initial state
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Quaternion} orientation - Starting orientation
     */
    reset(position, orientation) {
        this.object3D.position.copy(position || new THREE.Vector3(0, 100, 0));
        this.object3D.quaternion.copy(orientation || new THREE.Quaternion());
        this.physics.reset();
        this.throttle = 0;
        this.resetControls();
        this._lastDebugInfo = null;
    }

    /**
     * Get the Three.js Object3D for adding to scene
     * @returns {THREE.Group}
     */
    getObject3D() {
        return this.object3D;
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this.object3D.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (child.material.dispose) {
                    child.material.dispose();
                }
            }
        });
    }
}

// Export types for external use
export { StallWarningLevel, SpinState, GearState, TurbulenceType };
export default AdvancedAircraft;
