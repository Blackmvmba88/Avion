/**
 * Aircraft Factory
 * Creates aircraft instances based on type
 */

import { AIRCRAFT_CONFIG } from '../../config/aircraft.config.js';

export class AircraftFactory {
    /**
     * Create an aircraft of the specified type
     * @param {string} type - Aircraft type (basicjet, cessna172, f22, boeing747)
     * @param {Object} overrides - Configuration overrides
     * @returns {Aircraft} Aircraft instance
     */
    static create(type, overrides = {}) {
        const config = AIRCRAFT_CONFIG[type];
        
        if (!config) {
            throw new Error(`Unknown aircraft type: ${type}`);
        }
        
        // Merge configuration with overrides
        const finalConfig = {
            ...config,
            ...overrides,
            physics: { ...config.physics, ...overrides.physics },
            visual: { ...config.visual, ...overrides.visual }
        };
        
        // TODO: Return actual Aircraft instance
        // return new Aircraft(finalConfig);
        return finalConfig;
    }
    
    /**
     * Get list of available aircraft types
     * @returns {Array<string>} Aircraft type identifiers
     */
    static getAvailableTypes() {
        return Object.keys(AIRCRAFT_CONFIG);
    }
    
    /**
     * Get configuration for aircraft type
     * @param {string} type - Aircraft type
     * @returns {Object} Aircraft configuration
     */
    static getConfig(type) {
        return AIRCRAFT_CONFIG[type];
    }
}

export default AircraftFactory;
