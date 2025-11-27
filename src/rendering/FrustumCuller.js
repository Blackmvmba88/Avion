/**
 * FrustumCuller.js
 * View frustum culling utility for rendering performance.
 * 
 * Efficiently determines which objects are within the camera's view
 * to avoid rendering objects that won't be visible.
 */

import * as THREE from 'three';

/**
 * Culling result types
 */
export const CullResult = Object.freeze({
    VISIBLE: 'visible',
    CULLED: 'culled',
    PARTIAL: 'partial'  // Object intersects frustum boundary
});

/**
 * FrustumCuller class
 * Provides efficient frustum culling for scene objects
 */
export class FrustumCuller {
    /**
     * Create a new FrustumCuller
     * @param {THREE.Camera} camera - The camera to use for frustum calculations
     */
    constructor(camera = null) {
        this._camera = camera;
        this._frustum = new THREE.Frustum();
        this._projScreenMatrix = new THREE.Matrix4();
        
        // Cache for bounding boxes
        this._boundingBoxCache = new Map();
        
        // Statistics
        this._stats = {
            testedCount: 0,
            visibleCount: 0,
            culledCount: 0,
            lastUpdateTime: 0
        };
        
        // Update frequency control
        this._needsUpdate = true;
    }

    /**
     * Set the camera for frustum calculations
     * @param {THREE.Camera} camera
     */
    setCamera(camera) {
        this._camera = camera;
        this._needsUpdate = true;
    }

    /**
     * Update the frustum from the current camera
     * Call this after camera has been updated
     */
    update() {
        if (!this._camera) return;
        
        this._projScreenMatrix.multiplyMatrices(
            this._camera.projectionMatrix,
            this._camera.matrixWorldInverse
        );
        this._frustum.setFromProjectionMatrix(this._projScreenMatrix);
        this._needsUpdate = false;
    }

    /**
     * Test if a point is inside the frustum
     * @param {THREE.Vector3} point - Point to test
     * @returns {boolean}
     */
    containsPoint(point) {
        if (this._needsUpdate) this.update();
        return this._frustum.containsPoint(point);
    }

    /**
     * Test if an object is visible (any part inside frustum)
     * @param {THREE.Object3D} object - Object to test
     * @param {boolean} useCache - Whether to use cached bounding box
     * @returns {CullResult}
     */
    testObject(object, useCache = true) {
        if (this._needsUpdate) this.update();
        
        // Get or compute bounding box
        let boundingBox;
        if (useCache && this._boundingBoxCache.has(object.uuid)) {
            boundingBox = this._boundingBoxCache.get(object.uuid);
        } else {
            boundingBox = new THREE.Box3().setFromObject(object);
            if (useCache) {
                this._boundingBoxCache.set(object.uuid, boundingBox);
            }
        }
        
        // Empty or invalid bounding box
        if (boundingBox.isEmpty()) {
            return CullResult.VISIBLE;
        }
        
        // Test against frustum
        if (this._frustum.intersectsBox(boundingBox)) {
            // Further test to see if fully contained or partial
            // For performance, we just return VISIBLE for any intersection
            return CullResult.VISIBLE;
        }
        
        return CullResult.CULLED;
    }

    /**
     * Test if a bounding sphere is visible
     * @param {THREE.Sphere} sphere - Sphere to test
     * @returns {boolean}
     */
    testSphere(sphere) {
        if (this._needsUpdate) this.update();
        return this._frustum.intersectsSphere(sphere);
    }

    /**
     * Test if a bounding box is visible
     * @param {THREE.Box3} box - Box to test
     * @returns {boolean}
     */
    testBox(box) {
        if (this._needsUpdate) this.update();
        return this._frustum.intersectsBox(box);
    }

    /**
     * Process an array of objects, setting visibility based on frustum test
     * @param {THREE.Object3D[]} objects - Array of objects to process
     * @param {boolean} useCache - Whether to use cached bounding boxes
     * @returns {Object} Statistics { visible, culled, time }
     */
    cullObjects(objects, useCache = true) {
        if (this._needsUpdate) this.update();
        
        const startTime = performance.now();
        let visibleCount = 0;
        let culledCount = 0;
        
        for (const object of objects) {
            const result = this.testObject(object, useCache);
            
            if (result === CullResult.CULLED) {
                object.visible = false;
                culledCount++;
            } else {
                object.visible = true;
                visibleCount++;
            }
        }
        
        const endTime = performance.now();
        
        this._stats = {
            testedCount: objects.length,
            visibleCount,
            culledCount,
            lastUpdateTime: endTime - startTime
        };
        
        return this._stats;
    }

    /**
     * Process scene children recursively, culling based on frustum
     * @param {THREE.Scene} scene - Scene to process
     * @param {Object} options - Options { maxDepth, skipTypes }
     * @returns {Object} Statistics
     */
    cullScene(scene, options = {}) {
        const {
            maxDepth = 3,
            skipTypes = ['Light', 'Camera', 'Audio']
        } = options;
        
        if (this._needsUpdate) this.update();
        
        const startTime = performance.now();
        let visibleCount = 0;
        let culledCount = 0;
        let testedCount = 0;
        
        const processNode = (node, depth) => {
            if (depth > maxDepth) return;
            
            // Skip certain object types
            if (skipTypes.some(type => node.constructor.name === type)) {
                return;
            }
            
            // Only test objects with geometry
            if (node.geometry || node.children.length > 0) {
                testedCount++;
                
                const result = this.testObject(node, true);
                
                if (result === CullResult.CULLED) {
                    node.visible = false;
                    culledCount++;
                    return; // Don't process children of culled objects
                } else {
                    node.visible = true;
                    visibleCount++;
                }
            }
            
            // Process children
            for (const child of node.children) {
                processNode(child, depth + 1);
            }
        };
        
        for (const child of scene.children) {
            processNode(child, 0);
        }
        
        const endTime = performance.now();
        
        this._stats = {
            testedCount,
            visibleCount,
            culledCount,
            lastUpdateTime: endTime - startTime
        };
        
        return this._stats;
    }

    /**
     * Invalidate cached bounding box for an object
     * Call this when object geometry changes
     * @param {THREE.Object3D} object
     */
    invalidateCache(object) {
        this._boundingBoxCache.delete(object.uuid);
    }

    /**
     * Clear all cached bounding boxes
     */
    clearCache() {
        this._boundingBoxCache.clear();
    }

    /**
     * Mark frustum as needing update
     * Call this after camera moves
     */
    markDirty() {
        this._needsUpdate = true;
    }

    /**
     * Get current statistics
     * @returns {Object}
     */
    getStats() {
        return { ...this._stats };
    }

    /**
     * Get the underlying Three.js frustum
     * @returns {THREE.Frustum}
     */
    getFrustum() {
        if (this._needsUpdate) this.update();
        return this._frustum;
    }

    /**
     * Dispose of the culler and clean up resources
     */
    dispose() {
        this._boundingBoxCache.clear();
        this._camera = null;
    }
}

export default FrustumCuller;
