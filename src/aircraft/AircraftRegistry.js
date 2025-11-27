/**
 * AircraftRegistry.js
 * Registry for managing multiple aircraft type definitions.
 * Provides a centralized store for aircraft configurations that can be
 * extended with custom aircraft types.
 */

import { AIRCRAFT_CONFIG } from '../config/aircraft.config.js';

/**
 * Default aircraft type definitions based on the config file
 */
const DEFAULT_AIRCRAFT_TYPES = Object.freeze({
    BASIC_JET: 'basicJet',
    CESSNA_172: 'cessna172',
    F22: 'f22',
    BOEING_747: 'boeing747'
});

/**
 * AircraftRegistry class
 * Manages aircraft type definitions and provides access to aircraft configurations.
 */
export class AircraftRegistry {
    /**
     * Create a new AircraftRegistry instance
     */
    constructor() {
        // Internal storage for aircraft configurations
        this._registry = new Map();
        
        // Load default aircraft configurations
        this._loadDefaults();
    }

    /**
     * Load default aircraft configurations from config file
     * @private
     */
    _loadDefaults() {
        for (const [typeId, config] of Object.entries(AIRCRAFT_CONFIG)) {
            this._registry.set(typeId, {
                ...config,
                id: typeId,
                isCustom: false
            });
        }
    }

    /**
     * Register a new aircraft type
     * @param {string} typeId - Unique identifier for the aircraft type
     * @param {Object} config - Aircraft configuration
     * @param {string} config.name - Display name of the aircraft
     * @param {Object} config.physics - Physics parameters
     * @param {Object} config.visual - Visual configuration
     * @param {Object} config.controls - Control authority settings
     * @param {Object} [config.features] - Optional features
     * @returns {boolean} True if registration was successful
     */
    register(typeId, config) {
        if (!typeId || typeof typeId !== 'string') {
            console.error('AircraftRegistry: Invalid type ID');
            return false;
        }

        if (this._registry.has(typeId)) {
            console.warn(`AircraftRegistry: Overwriting existing aircraft type '${typeId}'`);
        }

        // Validate required fields
        if (!config.name || !config.physics) {
            console.error('AircraftRegistry: Configuration must include name and physics');
            return false;
        }

        this._registry.set(typeId, {
            ...config,
            id: typeId,
            isCustom: true
        });

        return true;
    }

    /**
     * Unregister an aircraft type
     * @param {string} typeId - Type identifier to remove
     * @returns {boolean} True if removal was successful
     */
    unregister(typeId) {
        if (!this._registry.has(typeId)) {
            console.warn(`AircraftRegistry: Aircraft type '${typeId}' not found`);
            return false;
        }

        const config = this._registry.get(typeId);
        if (!config.isCustom) {
            console.warn(`AircraftRegistry: Cannot unregister default aircraft type '${typeId}'`);
            return false;
        }

        this._registry.delete(typeId);
        return true;
    }

    /**
     * Get aircraft configuration by type ID
     * @param {string} typeId - Type identifier
     * @returns {Object|null} Aircraft configuration or null if not found
     */
    get(typeId) {
        const config = this._registry.get(typeId);
        if (!config) {
            console.warn(`AircraftRegistry: Aircraft type '${typeId}' not found`);
            return null;
        }
        return { ...config };
    }

    /**
     * Check if an aircraft type exists
     * @param {string} typeId - Type identifier
     * @returns {boolean}
     */
    has(typeId) {
        return this._registry.has(typeId);
    }

    /**
     * Get all registered aircraft type IDs
     * @returns {string[]}
     */
    getTypeIds() {
        return Array.from(this._registry.keys());
    }

    /**
     * Get all registered aircraft configurations
     * @returns {Object[]}
     */
    getAll() {
        return Array.from(this._registry.values()).map(config => ({ ...config }));
    }

    /**
     * Get only custom (user-registered) aircraft types
     * @returns {Object[]}
     */
    getCustomTypes() {
        return this.getAll().filter(config => config.isCustom);
    }

    /**
     * Get only default (built-in) aircraft types
     * @returns {Object[]}
     */
    getDefaultTypes() {
        return this.getAll().filter(config => !config.isCustom);
    }

    /**
     * Clear all custom aircraft types (keep defaults)
     */
    clearCustomTypes() {
        for (const [typeId, config] of this._registry.entries()) {
            if (config.isCustom) {
                this._registry.delete(typeId);
            }
        }
    }

    /**
     * Reset registry to default state
     */
    reset() {
        this._registry.clear();
        this._loadDefaults();
    }

    /**
     * Get the number of registered aircraft types
     * @returns {number}
     */
    get size() {
        return this._registry.size;
    }
}

// Export default types enum
export { DEFAULT_AIRCRAFT_TYPES };

// Singleton instance for global use
export const aircraftRegistry = new AircraftRegistry();

export default AircraftRegistry;
