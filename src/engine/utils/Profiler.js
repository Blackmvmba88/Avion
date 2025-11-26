/**
 * Profiler Utility
 * Measures performance of different systems
 */

export class Profiler {
    constructor() {
        this.markers = new Map();
        this.stats = new Map();
    }
    
    /**
     * Begin timing a section
     * @param {string} name - Section name
     */
    begin(name) {
        this.markers.set(name, performance.now());
    }
    
    /**
     * End timing a section
     * @param {string} name - Section name
     */
    end(name) {
        if (!this.markers.has(name)) return;
        
        const start = this.markers.get(name);
        const duration = performance.now() - start;
        
        if (!this.stats.has(name)) {
            this.stats.set(name, {
                count: 0,
                total: 0,
                min: Infinity,
                max: -Infinity,
                average: 0
            });
        }
        
        const stat = this.stats.get(name);
        stat.count++;
        stat.total += duration;
        stat.min = Math.min(stat.min, duration);
        stat.max = Math.max(stat.max, duration);
        stat.average = stat.total / stat.count;
        
        this.markers.delete(name);
    }
    
    /**
     * Get statistics
     * @returns {Object} Performance stats
     */
    getStats() {
        const result = {};
        for (const [name, stat] of this.stats.entries()) {
            result[name] = { ...stat };
        }
        return result;
    }
    
    /**
     * Reset all statistics
     */
    reset() {
        this.markers.clear();
        this.stats.clear();
    }
}

export default Profiler;
