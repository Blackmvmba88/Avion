/**
 * Optimizer Utility
 * Performance optimization utilities
 */

export class Optimizer {
    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function}
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in ms
     * @returns {Function}
     */
    static debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    /**
     * Optimize rendering based on platform
     * @param {boolean} isMobile - Is mobile device
     * @returns {Object} - Optimized settings
     */
    static getRenderingSettings(isMobile) {
        if (isMobile) {
            return {
                antialias: false,
                shadows: false,
                pixelRatio: Math.min(window.devicePixelRatio, 1.5),
                maxTextureSize: 1024,
                lodBias: 2
            };
        }
        
        return {
            antialias: true,
            shadows: true,
            pixelRatio: Math.min(window.devicePixelRatio, 2),
            maxTextureSize: 2048,
            lodBias: 1
        };
    }
    
    /**
     * Memory optimization - dispose of Three.js resources
     * @param {Object} object - Three.js object
     */
    static disposeObject(object) {
        if (object.geometry) {
            object.geometry.dispose();
        }
        
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => this.disposeMaterial(material));
            } else {
                this.disposeMaterial(object.material);
            }
        }
        
        if (object.texture) {
            object.texture.dispose();
        }
    }
    
    /**
     * Dispose material
     * @param {Object} material - Three.js material
     */
    static disposeMaterial(material) {
        material.dispose();
        
        // Dispose textures
        for (const key of Object.keys(material)) {
            const value = material[key];
            if (value && typeof value === 'object' && 'minFilter' in value) {
                value.dispose();
            }
        }
    }
    
    /**
     * Object pooling utility
     */
    static createPool(factory, initialSize = 10) {
        const pool = {
            objects: [],
            active: new Set(),
            
            acquire() {
                let obj = this.objects.pop();
                if (!obj) {
                    obj = factory();
                }
                this.active.add(obj);
                return obj;
            },
            
            release(obj) {
                if (this.active.has(obj)) {
                    this.active.delete(obj);
                    this.objects.push(obj);
                }
            },
            
            clear() {
                this.objects.length = 0;
                this.active.clear();
            }
        };
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            pool.objects.push(factory());
        }
        
        return pool;
    }
}

export default Optimizer;
