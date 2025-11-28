/**
 * WaypointNavigation.js
 * Manages waypoint-based navigation for the flight simulator.
 */

import * as THREE from 'three';
import { Waypoint } from './Waypoint.js';

/**
 * Flight plan status
 */
export const FlightPlanStatus = {
    INACTIVE: 'inactive',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    SUSPENDED: 'suspended'
};

/**
 * WaypointNavigation class
 * Manages flight plans and waypoint navigation
 */
export class WaypointNavigation {
    /**
     * Create a new WaypointNavigation instance
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.waypoints = [];
        this.currentWaypointIndex = -1;
        this.status = FlightPlanStatus.INACTIVE;
        
        // Navigation settings
        this.autoAdvance = config.autoAdvance !== false;
        this.showPath = config.showPath !== false;
        
        // Scene reference for adding 3D objects
        this.scene = config.scene || null;
        
        // Path visualization
        this.pathLine = null;
        this.pathColor = config.pathColor || 0x00ffff;
        
        // Event listeners
        this.listeners = new Map();
        
        // Statistics
        this.totalDistance = 0;
        this.distanceTraveled = 0;
        this.startTime = null;
    }

    /**
     * Set the scene for adding 3D objects
     * @param {THREE.Scene} scene
     */
    setScene(scene) {
        this.scene = scene;
        
        // Add existing waypoints to scene
        this.waypoints.forEach(wp => {
            const obj = wp.getObject3D();
            if (obj && this.scene) {
                this.scene.add(obj);
            }
        });
        
        // Update path visualization
        if (this.showPath) {
            this.updatePathVisualization();
        }
    }

    /**
     * Add a waypoint to the flight plan
     * @param {Waypoint|Object} waypoint - Waypoint instance or configuration
     * @returns {Waypoint}
     */
    addWaypoint(waypoint) {
        const wp = waypoint instanceof Waypoint ? waypoint : new Waypoint(waypoint);
        this.waypoints.push(wp);
        
        // Add to scene if available
        const obj = wp.getObject3D();
        if (obj && this.scene) {
            this.scene.add(obj);
        }
        
        // Update total distance
        this.calculateTotalDistance();
        
        // Update path visualization
        if (this.showPath) {
            this.updatePathVisualization();
        }
        
        this.emit('waypointAdded', { waypoint: wp, index: this.waypoints.length - 1 });
        return wp;
    }

    /**
     * Insert a waypoint at a specific index
     * @param {Waypoint|Object} waypoint - Waypoint instance or configuration
     * @param {number} index - Index to insert at
     * @returns {Waypoint}
     */
    insertWaypoint(waypoint, index) {
        const wp = waypoint instanceof Waypoint ? waypoint : new Waypoint(waypoint);
        this.waypoints.splice(index, 0, wp);
        
        // Add to scene if available
        const obj = wp.getObject3D();
        if (obj && this.scene) {
            this.scene.add(obj);
        }
        
        // Adjust current waypoint index if necessary
        if (index <= this.currentWaypointIndex) {
            this.currentWaypointIndex++;
        }
        
        this.calculateTotalDistance();
        if (this.showPath) {
            this.updatePathVisualization();
        }
        
        this.emit('waypointInserted', { waypoint: wp, index });
        return wp;
    }

    /**
     * Remove a waypoint by index
     * @param {number} index - Index of waypoint to remove
     * @returns {Waypoint|null}
     */
    removeWaypoint(index) {
        if (index < 0 || index >= this.waypoints.length) {
            return null;
        }
        
        const wp = this.waypoints[index];
        
        // Remove from scene
        const obj = wp.getObject3D();
        if (obj && this.scene) {
            this.scene.remove(obj);
        }
        
        // Dispose resources
        wp.dispose();
        
        // Remove from array
        this.waypoints.splice(index, 1);
        
        // Adjust current waypoint index
        if (index < this.currentWaypointIndex) {
            this.currentWaypointIndex--;
        } else if (index === this.currentWaypointIndex) {
            // Current waypoint was removed, stay at same index (next waypoint)
            if (this.currentWaypointIndex >= this.waypoints.length) {
                this.currentWaypointIndex = this.waypoints.length - 1;
            }
        }
        
        this.calculateTotalDistance();
        if (this.showPath) {
            this.updatePathVisualization();
        }
        
        this.emit('waypointRemoved', { waypoint: wp, index });
        return wp;
    }

    /**
     * Get waypoint by index
     * @param {number} index
     * @returns {Waypoint|null}
     */
    getWaypoint(index) {
        return this.waypoints[index] || null;
    }

    /**
     * Get current target waypoint
     * @returns {Waypoint|null}
     */
    getCurrentWaypoint() {
        return this.waypoints[this.currentWaypointIndex] || null;
    }

    /**
     * Get next waypoint after current
     * @returns {Waypoint|null}
     */
    getNextWaypoint() {
        return this.waypoints[this.currentWaypointIndex + 1] || null;
    }

    /**
     * Get all waypoints
     * @returns {Waypoint[]}
     */
    getAllWaypoints() {
        return [...this.waypoints];
    }

    /**
     * Clear all waypoints
     */
    clearWaypoints() {
        // Remove all from scene and dispose
        this.waypoints.forEach(wp => {
            const obj = wp.getObject3D();
            if (obj && this.scene) {
                this.scene.remove(obj);
            }
            wp.dispose();
        });
        
        this.waypoints = [];
        this.currentWaypointIndex = -1;
        this.status = FlightPlanStatus.INACTIVE;
        this.totalDistance = 0;
        this.distanceTraveled = 0;
        
        // Clear path visualization
        if (this.pathLine && this.scene) {
            this.scene.remove(this.pathLine);
            this.pathLine.geometry.dispose();
            this.pathLine.material.dispose();
            this.pathLine = null;
        }
        
        this.emit('waypointsCleared', {});
    }

    /**
     * Start the flight plan
     * @returns {boolean}
     */
    start() {
        if (this.waypoints.length === 0) {
            return false;
        }
        
        this.status = FlightPlanStatus.ACTIVE;
        this.currentWaypointIndex = 0;
        this.distanceTraveled = 0;
        this.startTime = Date.now();
        
        // Set first waypoint as active
        const firstWp = this.getCurrentWaypoint();
        if (firstWp) {
            firstWp.setActive(true);
        }
        
        this.emit('navigationStarted', { waypoint: firstWp });
        return true;
    }

    /**
     * Suspend navigation
     */
    suspend() {
        if (this.status === FlightPlanStatus.ACTIVE) {
            this.status = FlightPlanStatus.SUSPENDED;
            this.emit('navigationSuspended', {});
        }
    }

    /**
     * Resume navigation
     */
    resume() {
        if (this.status === FlightPlanStatus.SUSPENDED) {
            this.status = FlightPlanStatus.ACTIVE;
            this.emit('navigationResumed', {});
        }
    }

    /**
     * Stop navigation
     */
    stop() {
        this.status = FlightPlanStatus.INACTIVE;
        this.currentWaypointIndex = -1;
        
        // Reset all waypoints
        this.waypoints.forEach(wp => wp.reset());
        
        this.emit('navigationStopped', {});
    }

    /**
     * Advance to the next waypoint
     * @returns {boolean}
     */
    advanceToNextWaypoint() {
        const currentWp = this.getCurrentWaypoint();
        if (currentWp) {
            currentWp.markReached();
        }
        
        this.currentWaypointIndex++;
        
        if (this.currentWaypointIndex >= this.waypoints.length) {
            // Flight plan completed
            this.status = FlightPlanStatus.COMPLETED;
            this.emit('navigationCompleted', { 
                totalTime: (Date.now() - this.startTime) / 1000,
                distanceTraveled: this.distanceTraveled
            });
            return false;
        }
        
        // Set new waypoint as active
        const nextWp = this.getCurrentWaypoint();
        if (nextWp) {
            nextWp.setActive(true);
        }
        
        this.emit('waypointReached', { 
            previous: currentWp, 
            current: nextWp, 
            index: this.currentWaypointIndex 
        });
        
        return true;
    }

    /**
     * Go to specific waypoint (direct-to)
     * @param {number} index - Waypoint index
     * @returns {boolean}
     */
    directTo(index) {
        if (index < 0 || index >= this.waypoints.length) {
            return false;
        }
        
        // Deactivate current waypoint
        const currentWp = this.getCurrentWaypoint();
        if (currentWp) {
            currentWp.setActive(false);
        }
        
        this.currentWaypointIndex = index;
        
        // Activate new waypoint
        const newWp = this.getCurrentWaypoint();
        if (newWp) {
            newWp.setActive(true);
        }
        
        this.emit('directTo', { waypoint: newWp, index });
        return true;
    }

    /**
     * Update navigation state
     * @param {Object} aircraftState - Current aircraft state
     * @param {number} deltaTime - Time delta in seconds
     * @returns {Object} Navigation information
     */
    update(aircraftState, deltaTime) {
        const navInfo = this.getNavigationInfo(aircraftState);
        
        if (this.status !== FlightPlanStatus.ACTIVE) {
            return navInfo;
        }
        
        const currentWp = this.getCurrentWaypoint();
        if (!currentWp) {
            return navInfo;
        }
        
        // Update waypoint visuals
        this.waypoints.forEach(wp => wp.update(deltaTime));
        
        // Check if waypoint reached
        if (this.autoAdvance && currentWp.isInCaptureRadius(aircraftState.position)) {
            this.advanceToNextWaypoint();
        }
        
        // Track distance traveled
        if (this.lastPosition) {
            const dist = new THREE.Vector3(
                aircraftState.position.x - this.lastPosition.x,
                aircraftState.position.y - this.lastPosition.y,
                aircraftState.position.z - this.lastPosition.z
            ).length();
            this.distanceTraveled += dist;
        }
        this.lastPosition = { ...aircraftState.position };
        
        return navInfo;
    }

    /**
     * Get navigation information
     * @param {Object} aircraftState - Current aircraft state
     * @returns {Object}
     */
    getNavigationInfo(aircraftState) {
        const currentWp = this.getCurrentWaypoint();
        const nextWp = this.getNextWaypoint();
        
        const info = {
            status: this.status,
            currentWaypointIndex: this.currentWaypointIndex,
            totalWaypoints: this.waypoints.length,
            currentWaypoint: currentWp ? {
                name: currentWp.name,
                distance: currentWp.getDistanceFrom(aircraftState.position),
                bearing: currentWp.getBearingFrom(aircraftState.position),
                targetAltitude: currentWp.targetAltitude
            } : null,
            nextWaypoint: nextWp ? {
                name: nextWp.name,
                distance: nextWp.getDistanceFrom(aircraftState.position),
                bearing: nextWp.getBearingFrom(aircraftState.position)
            } : null,
            totalDistance: this.totalDistance,
            remainingDistance: this.calculateRemainingDistance(aircraftState.position),
            distanceTraveled: this.distanceTraveled,
            eta: this.calculateETA(aircraftState),
            progress: this.getProgress()
        };
        
        return info;
    }

    /**
     * Calculate total flight plan distance
     */
    calculateTotalDistance() {
        this.totalDistance = 0;
        for (let i = 1; i < this.waypoints.length; i++) {
            this.totalDistance += this.waypoints[i].getDistanceFrom(
                this.waypoints[i - 1].position
            );
        }
    }

    /**
     * Calculate remaining distance to complete flight plan
     * @param {Object} position - Current position
     * @returns {number}
     */
    calculateRemainingDistance(position) {
        if (this.currentWaypointIndex < 0 || this.currentWaypointIndex >= this.waypoints.length) {
            return 0;
        }
        
        // Distance to current waypoint
        let remaining = this.waypoints[this.currentWaypointIndex].getDistanceFrom(position);
        
        // Add distances between remaining waypoints
        for (let i = this.currentWaypointIndex + 1; i < this.waypoints.length; i++) {
            remaining += this.waypoints[i].getDistanceFrom(
                this.waypoints[i - 1].position
            );
        }
        
        return remaining;
    }

    /**
     * Calculate estimated time of arrival
     * @param {Object} aircraftState - Current aircraft state
     * @returns {number|null} ETA in seconds
     */
    calculateETA(aircraftState) {
        const remaining = this.calculateRemainingDistance(aircraftState.position);
        const speed = aircraftState.speed || 0;
        
        if (speed < 1) {
            return null;
        }
        
        return remaining / speed;
    }

    /**
     * Get navigation progress
     * @returns {Object}
     */
    getProgress() {
        const completed = this.waypoints.filter(wp => wp.reached).length;
        return {
            completed,
            total: this.waypoints.length,
            percentage: this.waypoints.length > 0 
                ? (completed / this.waypoints.length) * 100 
                : 0
        };
    }

    /**
     * Update path visualization
     */
    updatePathVisualization() {
        if (!this.scene) return;
        
        // Remove existing path
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
            this.pathLine.geometry.dispose();
            this.pathLine.material.dispose();
        }
        
        if (this.waypoints.length < 2) {
            this.pathLine = null;
            return;
        }
        
        // Create path points
        const points = this.waypoints.map(wp => wp.position.clone());
        
        // Create line geometry
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineDashedMaterial({
            color: this.pathColor,
            dashSize: 50,
            gapSize: 25,
            transparent: true,
            opacity: 0.6
        });
        
        this.pathLine = new THREE.Line(geometry, material);
        this.pathLine.computeLineDistances();
        this.scene.add(this.pathLine);
    }

    /**
     * Toggle path visibility
     * @param {boolean} visible
     */
    setPathVisible(visible) {
        this.showPath = visible;
        if (visible) {
            this.updatePathVisualization();
        } else if (this.pathLine && this.scene) {
            this.scene.remove(this.pathLine);
        }
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data) {
        const listeners = this.listeners.get(event) || [];
        listeners.forEach(callback => callback(data));
    }

    /**
     * Export flight plan data
     * @returns {Object}
     */
    exportFlightPlan() {
        return {
            waypoints: this.waypoints.map(wp => wp.toJSON()),
            totalDistance: this.totalDistance
        };
    }

    /**
     * Import flight plan data
     * @param {Object} data - Flight plan data
     */
    importFlightPlan(data) {
        this.clearWaypoints();
        
        if (data.waypoints) {
            data.waypoints.forEach(wpData => {
                this.addWaypoint(Waypoint.fromJSON(wpData));
            });
        }
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        this.clearWaypoints();
        this.listeners.clear();
    }
}

export default WaypointNavigation;
