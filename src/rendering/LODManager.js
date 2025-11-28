/**
 * LODManager.js
 * Level of Detail management for rendering performance optimization.
 * 
 * Manages object complexity based on distance from camera,
 * reducing polygon count for distant objects to improve frame rate.
 */

import * as THREE from 'three';

/**
 * LOD level definitions
 */
export const LOD_LEVELS = Object.freeze({
    HIGH: 0,      // Full detail - close to camera
    MEDIUM: 1,    // Reduced detail - medium distance
    LOW: 2,       // Minimal detail - far from camera
    CULLED: 3     // Not rendered - beyond view distance
});

/**
 * Default distance thresholds for LOD transitions
 */
export const DEFAULT_LOD_DISTANCES = Object.freeze({
    HIGH_TO_MEDIUM: 100,    // Distance to switch from high to medium
    MEDIUM_TO_LOW: 250,     // Distance to switch from medium to low
    LOW_TO_CULLED: 1000     // Distance to cull object entirely
});

/**
 * LODManager class
 * Manages level of detail switching for scene objects
 */
export class LODManager {
    /**
     * Create a new LODManager
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.distances = {
            ...DEFAULT_LOD_DISTANCES,
            ...(config.distances || {})
        };
        
        // Registered LOD objects
        this._objects = new Map();
        
        // Camera reference for distance calculations
        this._camera = null;
        
        // Performance metrics
        this._stats = {
            highDetailCount: 0,
            mediumDetailCount: 0,
            lowDetailCount: 0,
            culledCount: 0,
            lastUpdateTime: 0
        };
        
        // Update frequency (every N frames)
        this._updateFrequency = config.updateFrequency || 2;
        this._frameCounter = 0;
        
        // Hysteresis to prevent rapid LOD switching
        this._hysteresis = config.hysteresis || 5;
    }

    /**
     * Set the camera for distance calculations
     * @param {THREE.Camera} camera
     */
    setCamera(camera) {
        this._camera = camera;
    }

    /**
     * Register an object with LOD levels
     * @param {string} id - Unique identifier for the object
     * @param {Object} lodLevels - LOD level objects { high, medium, low }
     * @param {THREE.Object3D} parent - Parent object to add LOD group to
     * @returns {THREE.LOD} The created LOD object
     */
    registerObject(id, lodLevels, parent = null) {
        const lod = new THREE.LOD();
        
        if (lodLevels.high) {
            lod.addLevel(lodLevels.high, 0);
        }
        if (lodLevels.medium) {
            lod.addLevel(lodLevels.medium, this.distances.HIGH_TO_MEDIUM);
        }
        if (lodLevels.low) {
            lod.addLevel(lodLevels.low, this.distances.MEDIUM_TO_LOW);
        }
        
        this._objects.set(id, {
            lod,
            currentLevel: LOD_LEVELS.HIGH,
            lastSwitchTime: 0
        });
        
        if (parent) {
            parent.add(lod);
        }
        
        return lod;
    }

    /**
     * Unregister an object
     * @param {string} id - Object identifier
     */
    unregisterObject(id) {
        const entry = this._objects.get(id);
        if (entry) {
            entry.lod.parent?.remove(entry.lod);
            this._objects.delete(id);
        }
    }

    /**
     * Create a simplified version of a mesh for LOD
     * @param {THREE.Mesh} originalMesh - Original high-detail mesh
     * @param {number} reductionFactor - Factor to reduce geometry (0.5 = half vertices)
     * @returns {THREE.Mesh} Simplified mesh
     */
    static createSimplifiedMesh(originalMesh, reductionFactor = 0.5) {
        // Clone the mesh
        const simplified = originalMesh.clone();
        
        // If geometry is BufferGeometry, we can simplify it
        // Note: Full mesh simplification would require a library like simplify-modifier
        // This is a placeholder that creates a bounding box approximation for very low LOD
        if (reductionFactor <= 0.1) {
            const boundingBox = new THREE.Box3().setFromObject(originalMesh);
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            
            const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            simplified.geometry = boxGeometry;
        }
        
        return simplified;
    }

    /**
     * Calculate distance from camera to object
     * @param {THREE.Object3D} object
     * @returns {number} Distance in world units
     */
    getDistanceToCamera(object) {
        if (!this._camera) return 0;
        
        const objectPos = new THREE.Vector3();
        object.getWorldPosition(objectPos);
        
        const cameraPos = new THREE.Vector3();
        this._camera.getWorldPosition(cameraPos);
        
        return objectPos.distanceTo(cameraPos);
    }

    /**
     * Determine LOD level for a given distance
     * @param {number} distance
     * @param {number} currentLevel - Current LOD level for hysteresis
     * @returns {number} LOD level
     */
    getLODLevel(distance, currentLevel = LOD_LEVELS.HIGH) {
        const hyst = this._hysteresis;
        
        // Apply hysteresis based on current level to prevent flickering
        if (currentLevel === LOD_LEVELS.HIGH) {
            if (distance > this.distances.HIGH_TO_MEDIUM + hyst) {
                return LOD_LEVELS.MEDIUM;
            }
        } else if (currentLevel === LOD_LEVELS.MEDIUM) {
            if (distance < this.distances.HIGH_TO_MEDIUM - hyst) {
                return LOD_LEVELS.HIGH;
            }
            if (distance > this.distances.MEDIUM_TO_LOW + hyst) {
                return LOD_LEVELS.LOW;
            }
        } else if (currentLevel === LOD_LEVELS.LOW) {
            if (distance < this.distances.MEDIUM_TO_LOW - hyst) {
                return LOD_LEVELS.MEDIUM;
            }
            if (distance > this.distances.LOW_TO_CULLED + hyst) {
                return LOD_LEVELS.CULLED;
            }
        } else if (currentLevel === LOD_LEVELS.CULLED) {
            if (distance < this.distances.LOW_TO_CULLED - hyst) {
                return LOD_LEVELS.LOW;
            }
        }
        
        return currentLevel;
    }

    /**
     * Update all LOD objects based on camera distance
     * Should be called each frame
     */
    update() {
        this._frameCounter++;
        
        // Only update every N frames for performance
        if (this._frameCounter % this._updateFrequency !== 0) {
            return;
        }
        
        if (!this._camera) return;
        
        const startTime = performance.now();
        
        // Reset stats
        this._stats.highDetailCount = 0;
        this._stats.mediumDetailCount = 0;
        this._stats.lowDetailCount = 0;
        this._stats.culledCount = 0;
        
        // Update each registered object
        for (const [_id, entry] of this._objects) {
            const distance = this.getDistanceToCamera(entry.lod);
            const newLevel = this.getLODLevel(distance, entry.currentLevel);
            
            if (newLevel !== entry.currentLevel) {
                entry.currentLevel = newLevel;
                entry.lastSwitchTime = performance.now();
            }
            
            // Update visibility for culled objects
            entry.lod.visible = newLevel !== LOD_LEVELS.CULLED;
            
            // Update Three.js LOD (it handles the actual switching)
            entry.lod.update(this._camera);
            
            // Update stats
            switch (newLevel) {
                case LOD_LEVELS.HIGH:
                    this._stats.highDetailCount++;
                    break;
                case LOD_LEVELS.MEDIUM:
                    this._stats.mediumDetailCount++;
                    break;
                case LOD_LEVELS.LOW:
                    this._stats.lowDetailCount++;
                    break;
                case LOD_LEVELS.CULLED:
                    this._stats.culledCount++;
                    break;
            }
        }
        
        this._stats.lastUpdateTime = performance.now() - startTime;
    }

    /**
     * Set distance thresholds
     * @param {Object} distances - New distance values
     */
    setDistances(distances) {
        this.distances = { ...this.distances, ...distances };
    }

    /**
     * Get current statistics
     * @returns {Object} LOD statistics
     */
    getStats() {
        return { ...this._stats, totalObjects: this._objects.size };
    }

    /**
     * Get number of registered objects
     * @returns {number}
     */
    getObjectCount() {
        return this._objects.size;
    }

    /**
     * Force update of all LOD levels (ignoring frame skip)
     */
    forceUpdate() {
        const saved = this._updateFrequency;
        this._updateFrequency = 1;
        this._frameCounter = 0;
        this.update();
        this._updateFrequency = saved;
    }

    /**
     * Clear all registered objects
     */
    clear() {
        for (const [_id, entry] of this._objects) {
            entry.lod.parent?.remove(entry.lod);
        }
        this._objects.clear();
    }

    /**
     * Dispose of the LOD manager and clean up resources
     */
    dispose() {
        this.clear();
        this._camera = null;
    }
}

export default LODManager;
