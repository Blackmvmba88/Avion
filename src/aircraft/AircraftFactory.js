/**
 * AircraftFactory.js
 * Factory for creating aircraft instances based on registered types.
 * Supports both basic Aircraft and AdvancedAircraft with full physics.
 */

import { Aircraft } from './Aircraft.js';
import { AdvancedAircraft } from './AdvancedAircraft.js';
import { aircraftRegistry } from './AircraftRegistry.js';

/**
 * Aircraft creation modes
 */
export const AircraftMode = Object.freeze({
    BASIC: 'basic',
    ADVANCED: 'advanced'
});

/**
 * AircraftFactory class
 * Creates aircraft instances from registered type configurations.
 */
export class AircraftFactory {
    /**
     * Create an aircraft instance from a registered type
     * @param {string} typeId - Registered aircraft type ID
     * @param {Object} [options] - Additional options
     * @param {string} [options.mode='advanced'] - 'basic' or 'advanced' physics mode
     * @param {Object} [options.overrides] - Override specific configuration values
     * @param {Object} [options.wind] - Wind configuration for advanced mode
     * @param {Function} [options.terrainHeightCallback] - Terrain height callback for advanced mode
     * @returns {Aircraft|AdvancedAircraft|null} Aircraft instance or null if type not found
     */
    static create(typeId, options = {}) {
        const config = aircraftRegistry.get(typeId);
        if (!config) {
            console.error(`AircraftFactory: Unknown aircraft type '${typeId}'`);
            return null;
        }

        return AircraftFactory.createFromConfig(config, options);
    }

    /**
     * Create an aircraft instance from a configuration object
     * @param {Object} config - Aircraft configuration
     * @param {Object} [options] - Additional options
     * @param {string} [options.mode='advanced'] - 'basic' or 'advanced' physics mode
     * @param {Object} [options.overrides] - Override specific configuration values
     * @param {Object} [options.wind] - Wind configuration for advanced mode
     * @param {Function} [options.terrainHeightCallback] - Terrain height callback for advanced mode
     * @returns {Aircraft|AdvancedAircraft} Aircraft instance
     */
    static createFromConfig(config, options = {}) {
        const mode = options.mode || AircraftMode.ADVANCED;
        const overrides = options.overrides || {};

        // Merge configuration with overrides
        const mergedConfig = AircraftFactory._mergeConfig(config, overrides);

        if (mode === AircraftMode.BASIC) {
            return AircraftFactory._createBasicAircraft(mergedConfig);
        } else {
            return AircraftFactory._createAdvancedAircraft(mergedConfig, options);
        }
    }

    /**
     * Create a basic aircraft (simpler physics)
     * @param {Object} config - Merged configuration
     * @returns {Aircraft}
     * @private
     */
    static _createBasicAircraft(config) {
        return new Aircraft({
            name: config.name,
            physics: {
                mass: config.physics.mass,
                wingArea: config.physics.wingArea,
                maxThrust: config.physics.maxThrust,
                dragCoefficient: config.physics.dragCoefficient,
                liftCoefficient: config.physics.liftCoefficientZero || 1.0
            },
            visual: config.visual || {}
        });
    }

    /**
     * Create an advanced aircraft (full physics simulation)
     * @param {Object} config - Merged configuration
     * @param {Object} options - Additional options
     * @returns {AdvancedAircraft}
     * @private
     */
    static _createAdvancedAircraft(config, options) {
        return new AdvancedAircraft({
            name: config.name,
            aircraft: {
                mass: config.physics.mass,
                wingArea: config.physics.wingArea,
                wingSpan: config.physics.wingSpan,
                maxThrust: config.physics.maxThrust,
                dragCoefficient: config.physics.dragCoefficient,
                liftCoefficient: config.physics.maxLiftCoefficient || 1.0,
                oswaldEfficiency: config.physics.oswaldEfficiency,
                stallAngle: config.physics.stallAngle,
                stallSpeed: config.physics.stallSpeed
            },
            visual: config.visual || {},
            wind: options.wind || { enabled: true, speed: 0, direction: 0 },
            terrainHeightCallback: options.terrainHeightCallback || null
        });
    }

    /**
     * Merge base configuration with overrides (deep merge)
     * @param {Object} base - Base configuration
     * @param {Object} overrides - Override values
     * @returns {Object} Merged configuration
     * @private
     */
    static _mergeConfig(base, overrides) {
        const result = { ...base };

        for (const key of Object.keys(overrides)) {
            if (overrides[key] !== null && typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
                result[key] = AircraftFactory._mergeConfig(result[key] || {}, overrides[key]);
            } else {
                result[key] = overrides[key];
            }
        }

        return result;
    }

    /**
     * Create multiple aircraft instances
     * @param {Array<{typeId: string, options?: Object}>} specs - Array of aircraft specifications
     * @returns {Array<Aircraft|AdvancedAircraft>} Array of aircraft instances
     */
    static createMultiple(specs) {
        return specs.map(spec => AircraftFactory.create(spec.typeId, spec.options)).filter(a => a !== null);
    }

    /**
     * Get list of available aircraft types
     * @returns {Array<{id: string, name: string}>}
     */
    static getAvailableTypes() {
        return aircraftRegistry.getAll().map(config => ({
            id: config.id,
            name: config.name,
            isCustom: config.isCustom
        }));
    }

    /**
     * Register a custom aircraft type and create an instance
     * @param {string} typeId - Unique type identifier
     * @param {Object} config - Aircraft configuration
     * @param {Object} [options] - Creation options
     * @returns {Aircraft|AdvancedAircraft|null} Aircraft instance or null if registration failed
     */
    static registerAndCreate(typeId, config, options = {}) {
        if (!aircraftRegistry.register(typeId, config)) {
            return null;
        }
        return AircraftFactory.create(typeId, options);
    }
}

export default AircraftFactory;
