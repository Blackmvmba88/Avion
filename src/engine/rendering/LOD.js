/**
 * LOD (Level of Detail) Manager
 * Manages level of detail for objects based on distance
 */

export class LOD {
    constructor(config = {}) {
        this.near = config.near || 200;
        this.medium = config.medium || 500;
        this.far = config.far || 1000;
        
        this.objects = [];
    }
    
    /**
     * Register object for LOD management
     * @param {Object} object - Object with LOD levels
     */
    register(object) {
        this.objects.push(object);
    }
    
    /**
     * Update LOD for all objects based on camera position
     * @param {Object} camera - Three.js camera
     */
    update(camera) {
        for (const object of this.objects) {
            const distance = camera.position.distanceTo(object.position);
            
            if (distance < this.near) {
                object.showHighDetail?.();
            } else if (distance < this.medium) {
                object.showMediumDetail?.();
            } else if (distance < this.far) {
                object.showLowDetail?.();
            } else {
                object.hide?.();
            }
        }
    }
    
    /**
     * Set LOD distances
     * @param {Object} distances - {near, medium, far}
     */
    setDistances(distances) {
        this.near = distances.near || this.near;
        this.medium = distances.medium || this.medium;
        this.far = distances.far || this.far;
    }
}

export default LOD;
