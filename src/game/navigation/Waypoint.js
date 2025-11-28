/**
 * Waypoint.js
 * Represents a navigation waypoint in 3D space.
 */

import * as THREE from 'three';

/**
 * Waypoint types enumeration
 */
export const WaypointType = {
    STANDARD: 'standard',
    CHECKPOINT: 'checkpoint',
    AIRPORT: 'airport',
    VOR: 'vor',           // VHF Omnidirectional Range
    NDB: 'ndb',           // Non-Directional Beacon
    INTERSECTION: 'intersection',
    USER: 'user'
};

/**
 * Waypoint class
 * Represents a single navigation waypoint
 */
export class Waypoint {
    /**
     * Create a new Waypoint
     * @param {Object} config - Waypoint configuration
     */
    constructor(config = {}) {
        this.id = config.id || `wp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        this.name = config.name || 'Unnamed Waypoint';
        this.type = config.type || WaypointType.STANDARD;
        
        // Position in 3D space
        this.position = new THREE.Vector3(
            config.x || config.position?.x || 0,
            config.y || config.position?.y || 0,
            config.z || config.position?.z || 0
        );
        
        // Altitude constraints
        this.minAltitude = config.minAltitude || null;
        this.maxAltitude = config.maxAltitude || null;
        this.targetAltitude = config.targetAltitude || config.y || config.position?.y || null;
        
        // Speed constraints
        this.maxSpeed = config.maxSpeed || null;
        this.targetSpeed = config.targetSpeed || null;
        
        // Radius for waypoint capture
        this.captureRadius = config.captureRadius || 100; // meters
        
        // Visual properties
        this.color = config.color || this.getDefaultColor();
        this.visible = config.visible !== false;
        this.showLabel = config.showLabel !== false;
        
        // State
        this.reached = false;
        this.active = false;
        
        // 3D representation
        this.object3D = null;
        this.label = null;
        
        // Create 3D marker if visible
        if (this.visible) {
            this.createVisual();
        }
    }

    /**
     * Get default color based on waypoint type
     * @returns {number}
     */
    getDefaultColor() {
        const colors = {
            [WaypointType.STANDARD]: 0x00ff00,      // Green
            [WaypointType.CHECKPOINT]: 0xffff00,    // Yellow
            [WaypointType.AIRPORT]: 0x0000ff,       // Blue
            [WaypointType.VOR]: 0xff00ff,           // Magenta
            [WaypointType.NDB]: 0x00ffff,           // Cyan
            [WaypointType.INTERSECTION]: 0xffffff,  // White
            [WaypointType.USER]: 0xff8800           // Orange
        };
        return colors[this.type] || 0x00ff00;
    }

    /**
     * Create visual representation of the waypoint
     */
    createVisual() {
        this.object3D = new THREE.Group();
        
        // Main marker - vertical beacon
        const beaconGeometry = new THREE.CylinderGeometry(5, 15, 50, 8);
        const beaconMaterial = new THREE.MeshBasicMaterial({ 
            color: this.color,
            transparent: true,
            opacity: 0.7
        });
        const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beacon.position.y = 25;
        this.object3D.add(beacon);
        
        // Ring at target altitude
        const ringGeometry = new THREE.RingGeometry(this.captureRadius * 0.8, this.captureRadius, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: this.color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        this.object3D.add(ring);
        
        // Vertical line extending upward
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 1000, 0)
        ]);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: this.color,
            transparent: true,
            opacity: 0.3
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.object3D.add(line);
        
        // Position the group
        this.object3D.position.copy(this.position);
        
        // Create label sprite
        if (this.showLabel) {
            this.createLabel();
        }
    }

    /**
     * Create text label for the waypoint
     */
    createLabel() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = `#${this.color.toString(16).padStart(6, '0')}`;
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.name, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        this.label = new THREE.Sprite(spriteMaterial);
        this.label.scale.set(100, 25, 1);
        this.label.position.set(0, 80, 0);
        
        this.object3D.add(this.label);
    }

    /**
     * Get the 3D object for adding to scene
     * @returns {THREE.Group|null}
     */
    getObject3D() {
        return this.object3D;
    }

    /**
     * Calculate distance from a position to this waypoint
     * @param {THREE.Vector3|Object} position - Position to measure from
     * @returns {number} Distance in meters
     */
    getDistanceFrom(position) {
        const pos = position instanceof THREE.Vector3 
            ? position 
            : new THREE.Vector3(position.x, position.y, position.z);
        return pos.distanceTo(this.position);
    }

    /**
     * Calculate horizontal distance (ignoring altitude)
     * @param {THREE.Vector3|Object} position - Position to measure from
     * @returns {number} Distance in meters
     */
    getHorizontalDistanceFrom(position) {
        const dx = (position.x || 0) - this.position.x;
        const dz = (position.z || 0) - this.position.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * Calculate bearing to this waypoint from a position
     * @param {Object} position - Position to measure from
     * @returns {number} Bearing in degrees (0-360)
     */
    getBearingFrom(position) {
        const dx = this.position.x - (position.x || 0);
        const dz = this.position.z - (position.z || 0);
        let bearing = Math.atan2(dx, dz) * (180 / Math.PI);
        if (bearing < 0) bearing += 360;
        return bearing;
    }

    /**
     * Check if a position is within capture radius
     * @param {Object} position - Position to check
     * @returns {boolean}
     */
    isInCaptureRadius(position) {
        return this.getDistanceFrom(position) <= this.captureRadius;
    }

    /**
     * Mark waypoint as reached
     */
    markReached() {
        this.reached = true;
        this.active = false;
        this.updateVisual();
    }

    /**
     * Set waypoint as active (current target)
     */
    setActive(isActive) {
        this.active = isActive;
        this.updateVisual();
    }

    /**
     * Update visual representation based on state
     */
    updateVisual() {
        if (!this.object3D) return;
        
        const mesh = this.object3D.children[0];
        if (mesh && mesh.material) {
            if (this.reached) {
                mesh.material.color.setHex(0x888888);
                mesh.material.opacity = 0.3;
            } else if (this.active) {
                mesh.material.color.setHex(this.color);
                mesh.material.opacity = 1.0;
            } else {
                mesh.material.color.setHex(this.color);
                mesh.material.opacity = 0.7;
            }
        }
    }

    /**
     * Update the waypoint (animation, etc.)
     * @param {number} _deltaTime - Time delta in seconds (unused, kept for API consistency)
     */
    update(_deltaTime) {
        if (this.object3D && this.active) {
            // Pulse effect for active waypoint
            const time = Date.now() * 0.002;
            const scale = 1 + Math.sin(time) * 0.1;
            this.object3D.children[0].scale.set(scale, 1, scale);
        }
    }

    /**
     * Reset the waypoint state
     */
    reset() {
        this.reached = false;
        this.active = false;
        this.updateVisual();
    }

    /**
     * Dispose of 3D resources
     */
    dispose() {
        if (this.object3D) {
            this.object3D.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        }
    }

    /**
     * Get waypoint data for serialization
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            position: {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            },
            minAltitude: this.minAltitude,
            maxAltitude: this.maxAltitude,
            targetAltitude: this.targetAltitude,
            maxSpeed: this.maxSpeed,
            targetSpeed: this.targetSpeed,
            captureRadius: this.captureRadius
        };
    }

    /**
     * Create waypoint from JSON data
     * @param {Object} data - Waypoint data
     * @returns {Waypoint}
     */
    static fromJSON(data) {
        return new Waypoint(data);
    }
}

export default Waypoint;
