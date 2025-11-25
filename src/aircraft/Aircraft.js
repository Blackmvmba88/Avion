/**
 * Aircraft.js
 * Base aircraft class that combines 3D model, physics, and state management.
 * Provides a clean interface for aircraft simulation.
 */

import * as THREE from 'three';
import { FlightPhysics } from '../physics/FlightPhysics.js';

/**
 * Aircraft class
 * Represents a complete aircraft with visual representation and physics
 */
export class Aircraft {
    /**
     * Create a new Aircraft instance
     * @param {Object} config - Aircraft configuration
     * @param {string} config.name - Aircraft name
     * @param {Object} config.physics - Physics configuration
     * @param {Object} config.visual - Visual configuration
     */
    constructor(config = {}) {
        this.name = config.name || 'Generic Aircraft';
        
        // Initialize physics engine
        this.physics = new FlightPhysics(config.physics || {});
        
        // Create 3D object group
        this.object3D = new THREE.Group();
        this.object3D.name = this.name;
        
        // State
        this.throttle = 0;
        this.controlInputs = {
            pitch: 0,
            roll: 0,
            yaw: 0
        };
        
        // Ground level for collision detection
        this.groundLevel = 0;
        this.isGrounded = true;
        
        // Create the visual model
        this.createModel(config.visual || {});
    }

    /**
     * Create the 3D model for the aircraft
     * Creates a simple stylized aircraft using basic geometry
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

        // Fuselage - elongated ellipsoid shape
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
        
        // Right wing
        const rightWing = new THREE.Mesh(wingGeometry, bodyMaterial);
        rightWing.position.set(0.3, 0, 0.2);
        rightWing.rotation.x = Math.PI / 2;
        this.object3D.add(rightWing);

        // Left wing (mirrored)
        const leftWing = new THREE.Mesh(wingGeometry, bodyMaterial);
        leftWing.position.set(-0.3, 0, 0.2);
        leftWing.rotation.x = Math.PI / 2;
        leftWing.rotation.z = Math.PI;
        this.object3D.add(leftWing);

        // Tail fin (vertical stabilizer)
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

        // Engine nacelle
        const engineGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.8, 16);
        const engine = new THREE.Mesh(engineGeometry, accentMaterial);
        engine.rotation.x = Math.PI / 2;
        engine.position.set(0, -0.3, 1.8);
        this.object3D.add(engine);

        // Apply overall scale
        this.object3D.scale.setScalar(scale);

        // Cast and receive shadows
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
        // Apply control inputs to physics
        this.physics.applyControlInputs(this.controlInputs, deltaTime);
        
        // Update physics simulation
        const debugInfo = this.physics.update({
            position: this.object3D.position,
            orientation: this.object3D.quaternion,
            throttle: this.throttle
        }, deltaTime);
        
        // Get velocity from physics
        const velocity = this.physics.getVelocity();
        
        // Update position based on velocity
        this.object3D.position.add(velocity.clone().multiplyScalar(deltaTime));
        
        // Update orientation based on angular velocity
        const angularVelocity = this.physics.getAngularVelocity();
        const rotationDelta = new THREE.Quaternion();
        
        // Convert angular velocity to quaternion rotation
        const angle = angularVelocity.length() * deltaTime;
        if (angle > 0.0001) {
            const axis = angularVelocity.clone().normalize();
            rotationDelta.setFromAxisAngle(axis, angle);
            this.object3D.quaternion.multiply(rotationDelta);
        }
        
        // Ground collision detection
        if (this.object3D.position.y < this.groundLevel) {
            this.object3D.position.y = this.groundLevel;
            
            // Stop vertical velocity on ground contact
            if (velocity.y < 0) {
                velocity.y = 0;
                this.physics.setVelocity(velocity);
            }
            
            this.isGrounded = true;
        } else {
            this.isGrounded = this.object3D.position.y < this.groundLevel + 0.5;
        }
        
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
     * @returns {number} Current throttle (0-1)
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
     * Reset all control inputs to neutral
     */
    resetControls() {
        this.controlInputs.pitch = 0;
        this.controlInputs.roll = 0;
        this.controlInputs.yaw = 0;
    }

    /**
     * Get the 3D position
     * @returns {THREE.Vector3} Current position
     */
    getPosition() {
        return this.object3D.position.clone();
    }

    /**
     * Set the 3D position
     * @param {THREE.Vector3} position - New position
     */
    setPosition(position) {
        this.object3D.position.copy(position);
    }

    /**
     * Get the 3D orientation as quaternion
     * @returns {THREE.Quaternion} Current orientation
     */
    getOrientation() {
        return this.object3D.quaternion.clone();
    }

    /**
     * Get the forward direction vector
     * @returns {THREE.Vector3} Forward direction (normalized)
     */
    getForwardDirection() {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.object3D.quaternion);
        return forward;
    }

    /**
     * Get the up direction vector
     * @returns {THREE.Vector3} Up direction (normalized)
     */
    getUpDirection() {
        const up = new THREE.Vector3(0, 1, 0);
        up.applyQuaternion(this.object3D.quaternion);
        return up;
    }

    /**
     * Get current airspeed
     * @returns {number} Airspeed in m/s
     */
    getAirspeed() {
        return this.physics.getVelocity().length();
    }

    /**
     * Get current altitude
     * @returns {number} Altitude in meters
     */
    getAltitude() {
        return this.object3D.position.y;
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
    }

    /**
     * Get the Three.js Object3D for adding to scene
     * @returns {THREE.Group} The aircraft's 3D object
     */
    getObject3D() {
        return this.object3D;
    }
}
