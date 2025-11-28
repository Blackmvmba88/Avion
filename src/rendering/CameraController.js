/**
 * CameraController.js
 * Third-person camera follow system with smooth movement and user control.
 * Supports orbit, zoom, and chase camera modes.
 */

import * as THREE from 'three';

/**
 * Camera controller modes
 */
export const CAMERA_MODES = {
    CHASE: 'chase',      // Camera follows behind aircraft
    ORBIT: 'orbit',      // User-controlled orbit around aircraft
    COCKPIT: 'cockpit'   // First-person cockpit view (future)
};

/**
 * CameraController class
 * Manages camera positioning relative to a target
 */
export class CameraController {
    /**
     * Create a new CameraController instance
     * @param {THREE.Camera} camera - The Three.js camera to control
     * @param {Object} config - Configuration options
     */
    constructor(camera, config = {}) {
        this.camera = camera;
        
        // Camera offset in target's local space
        this.defaultOffset = new THREE.Vector3(0, 8, 25);
        this.currentOffset = this.defaultOffset.clone();
        
        // Orbit angles (used for manual control)
        this.orbitAngle = {
            horizontal: 0,  // Rotation around Y axis (radians)
            vertical: 0.2   // Rotation around X axis (radians)
        };
        
        // Zoom settings
        this.minDistance = config.minDistance || 10;
        this.maxDistance = config.maxDistance || 100;
        this.currentDistance = config.initialDistance || 25;
        
        // Smoothing settings
        this.positionSmoothing = config.positionSmoothing || 0.05;
        this.lookAtSmoothing = config.lookAtSmoothing || 0.1;
        
        // Look-ahead distance (how far ahead of target to look)
        this.lookAheadDistance = config.lookAheadDistance || 5;
        
        // Current mode
        this.mode = CAMERA_MODES.CHASE;
        
        // Target tracking
        this.target = null;
        this.targetPosition = new THREE.Vector3();
        this.targetQuaternion = new THREE.Quaternion();
        
        // Internal state
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
    }

    /**
     * Set the target to follow
     * @param {Object} target - Object with position and quaternion properties
     */
    setTarget(target) {
        this.target = target;
        if (target) {
            // Initialize positions
            this.targetPosition.copy(target.position);
            this.targetQuaternion.copy(target.quaternion);
            this.updateCameraPosition(1); // Instant update
        }
    }

    /**
     * Set camera mode
     * @param {string} mode - Camera mode from CAMERA_MODES
     */
    setMode(mode) {
        if (Object.values(CAMERA_MODES).includes(mode)) {
            this.mode = mode;
        }
    }

    /**
     * Apply user camera controls
     * @param {Object} controls - Camera control inputs
     * @param {number} controls.horizontal - Horizontal rotation input
     * @param {number} controls.vertical - Vertical rotation input
     * @param {number} controls.zoom - Zoom input
     * @param {boolean} controls.reset - Reset camera to default
     * @param {number} deltaTime - Time step
     */
    applyControls(controls, deltaTime) {
        // Handle reset
        if (controls.reset) {
            this.resetOrbit();
            return;
        }
        
        // Apply orbital rotation
        const rotationSpeed = 2.0;
        this.orbitAngle.horizontal += controls.horizontal * rotationSpeed * deltaTime;
        this.orbitAngle.vertical += controls.vertical * rotationSpeed * deltaTime;
        
        // Clamp vertical angle to prevent flipping
        this.orbitAngle.vertical = THREE.MathUtils.clamp(
            this.orbitAngle.vertical,
            -Math.PI / 3,  // Max look down
            Math.PI / 2.5  // Max look up
        );
        
        // Apply zoom
        const zoomSpeed = 20;
        this.currentDistance += controls.zoom * zoomSpeed * deltaTime;
        this.currentDistance = THREE.MathUtils.clamp(
            this.currentDistance,
            this.minDistance,
            this.maxDistance
        );
    }

    /**
     * Reset orbit angles to default
     */
    resetOrbit() {
        this.orbitAngle.horizontal = 0;
        this.orbitAngle.vertical = 0.2;
        this.currentDistance = 25;
    }

    /**
     * Calculate the desired camera position based on mode
     * @returns {THREE.Vector3} Desired camera position
     */
    calculateDesiredPosition() {
        if (!this.target) {
            return this.camera.position.clone();
        }
        
        const targetPos = this.target.position;
        const targetQuat = this.target.quaternion;
        
        let desiredPosition = new THREE.Vector3();
        
        switch (this.mode) {
            case CAMERA_MODES.CHASE: {
                // Chase mode: camera follows behind aircraft with user orbit control
                const offset = new THREE.Vector3(0, 0, this.currentDistance);
                
                // Apply user orbit rotation
                offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.orbitAngle.vertical);
                offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.orbitAngle.horizontal);
                
                // Apply aircraft orientation (blended for smoother follow)
                offset.applyQuaternion(targetQuat);
                
                // Add vertical offset based on orbit angle
                const heightOffset = Math.sin(this.orbitAngle.vertical) * this.currentDistance * 0.3;
                
                desiredPosition.copy(targetPos).add(offset);
                desiredPosition.y += heightOffset + 3; // Base height offset
                break;
            }
                
            case CAMERA_MODES.ORBIT: {
                // Pure orbit mode: camera orbits around fixed point
                const orbitOffset = new THREE.Vector3();
                orbitOffset.x = Math.sin(this.orbitAngle.horizontal) * this.currentDistance;
                orbitOffset.z = Math.cos(this.orbitAngle.horizontal) * this.currentDistance;
                orbitOffset.y = Math.sin(this.orbitAngle.vertical) * this.currentDistance;
                
                desiredPosition.copy(targetPos).add(orbitOffset);
                break;
            }
                
            case CAMERA_MODES.COCKPIT: {
                // Cockpit mode: camera inside aircraft
                const cockpitOffset = new THREE.Vector3(0, 0.5, -1.5);
                cockpitOffset.applyQuaternion(targetQuat);
                desiredPosition.copy(targetPos).add(cockpitOffset);
                break;
            }
        }
        
        return desiredPosition;
    }

    /**
     * Update camera position with smoothing
     * @param {number} deltaTime - Time step (use 1 for instant update)
     */
    updateCameraPosition(deltaTime) {
        if (!this.target) return;
        
        const desiredPosition = this.calculateDesiredPosition();
        
        // Smooth interpolation
        const smoothFactor = 1 - Math.pow(this.positionSmoothing, deltaTime * 60);
        
        this.currentPosition.lerp(desiredPosition, smoothFactor);
        this.camera.position.copy(this.currentPosition);
        
        // Calculate look-at point (slightly ahead of aircraft)
        const lookAhead = new THREE.Vector3(0, 0, -this.lookAheadDistance);
        lookAhead.applyQuaternion(this.target.quaternion);
        const targetLookAt = this.target.position.clone().add(lookAhead);
        
        // Smooth look-at
        const lookAtSmoothFactor = 1 - Math.pow(this.lookAtSmoothing, deltaTime * 60);
        this.currentLookAt.lerp(targetLookAt, lookAtSmoothFactor);
        
        this.camera.lookAt(this.currentLookAt);
    }

    /**
     * Main update method - call once per frame
     * @param {number} deltaTime - Time step in seconds
     */
    update(deltaTime) {
        if (!this.target) return;
        
        // Update target tracking
        this.targetPosition.copy(this.target.position);
        this.targetQuaternion.copy(this.target.quaternion);
        
        // Update camera position
        this.updateCameraPosition(deltaTime);
    }

    /**
     * Set zoom distance directly
     * @param {number} distance - Camera distance
     */
    setDistance(distance) {
        this.currentDistance = THREE.MathUtils.clamp(distance, this.minDistance, this.maxDistance);
    }

    /**
     * Get current camera distance
     * @returns {number} Current distance from target
     */
    getDistance() {
        return this.currentDistance;
    }

    /**
     * Set smoothing values
     * @param {Object} settings - Smoothing settings
     */
    setSmoothing(settings) {
        if (settings.position !== undefined) {
            this.positionSmoothing = settings.position;
        }
        if (settings.lookAt !== undefined) {
            this.lookAtSmoothing = settings.lookAt;
        }
    }

    /**
     * Get current camera position
     * @returns {THREE.Vector3} Camera position
     */
    getPosition() {
        return this.camera.position.clone();
    }
}
