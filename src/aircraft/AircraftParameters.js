/**
 * AircraftParameters.js
 * Customizable aircraft parameters system with validation.
 * Allows runtime modification of aircraft properties within safe ranges.
 */

/**
 * Parameter bounds for validation
 */
export const PARAMETER_BOUNDS = Object.freeze({
    mass: { min: 100, max: 500000, unit: 'kg', description: 'Aircraft empty weight' },
    wingArea: { min: 5, max: 1000, unit: 'm²', description: 'Total wing surface area' },
    wingSpan: { min: 3, max: 100, unit: 'm', description: 'Wingspan' },
    maxThrust: { min: 500, max: 2000000, unit: 'N', description: 'Maximum engine thrust' },
    dragCoefficient: { min: 0.005, max: 0.2, unit: '', description: 'Parasitic drag coefficient' },
    liftCoefficientSlope: { min: 0.01, max: 0.2, unit: 'per degree', description: 'Lift curve slope' },
    liftCoefficientZero: { min: 0, max: 1, unit: '', description: 'Zero-AoA lift coefficient' },
    maxLiftCoefficient: { min: 0.5, max: 3.0, unit: '', description: 'Maximum lift coefficient' },
    stallAngle: { min: 8, max: 30, unit: 'degrees', description: 'Stall angle of attack' },
    oswaldEfficiency: { min: 0.5, max: 1.0, unit: '', description: 'Oswald efficiency factor' },
    maxSpeed: { min: 30, max: 1000, unit: 'm/s', description: 'Maximum level flight speed' },
    stallSpeed: { min: 15, max: 150, unit: 'm/s', description: 'Stall speed in level flight' },
    climbRate: { min: 1, max: 150, unit: 'm/s', description: 'Maximum rate of climb' },
    pitchAuthority: { min: 0.1, max: 3.0, unit: '', description: 'Pitch control effectiveness' },
    rollAuthority: { min: 0.1, max: 5.0, unit: '', description: 'Roll control effectiveness' },
    yawAuthority: { min: 0.1, max: 2.0, unit: '', description: 'Yaw control effectiveness' }
});

/**
 * Result of parameter validation
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the value is valid
 * @property {string} [error] - Error message if invalid
 * @property {number} [clampedValue] - Value clamped to valid range
 */

/**
 * AircraftParameters class
 * Manages and validates customizable aircraft parameters.
 */
export class AircraftParameters {
    /**
     * Create a new AircraftParameters instance
     * @param {Object} [initialParams] - Initial parameter values
     */
    constructor(initialParams = {}) {
        // Default parameters
        this._params = {
            mass: 1000,
            wingArea: 16,
            wingSpan: 10,
            maxThrust: 20000,
            dragCoefficient: 0.02,
            liftCoefficientSlope: 0.08,
            liftCoefficientZero: 0.3,
            maxLiftCoefficient: 1.2,
            stallAngle: 15,
            oswaldEfficiency: 0.8,
            maxSpeed: 250,
            stallSpeed: 40,
            climbRate: 20,
            pitchAuthority: 1.0,
            rollAuthority: 2.0,
            yawAuthority: 0.5
        };

        // Change listeners
        this._listeners = new Set();

        // Apply initial parameters
        if (initialParams && typeof initialParams === 'object') {
            this.setMultiple(initialParams);
        }
    }

    /**
     * Validate a single parameter value
     * @param {string} name - Parameter name
     * @param {number} value - Parameter value
     * @returns {ValidationResult}
     */
    static validate(name, value) {
        const bounds = PARAMETER_BOUNDS[name];
        
        if (!bounds) {
            return {
                valid: false,
                error: `Unknown parameter: ${name}`
            };
        }

        if (typeof value !== 'number' || isNaN(value)) {
            return {
                valid: false,
                error: `Parameter '${name}' must be a number`
            };
        }

        if (value < bounds.min || value > bounds.max) {
            return {
                valid: false,
                error: `Parameter '${name}' must be between ${bounds.min} and ${bounds.max}${bounds.unit ? ' ' + bounds.unit : ''}`,
                clampedValue: Math.max(bounds.min, Math.min(bounds.max, value))
            };
        }

        return { valid: true };
    }

    /**
     * Get a parameter value
     * @param {string} name - Parameter name
     * @returns {number|undefined}
     */
    get(name) {
        return this._params[name];
    }

    /**
     * Set a parameter value with validation
     * @param {string} name - Parameter name
     * @param {number} value - Parameter value
     * @param {boolean} [clamp=false] - Whether to clamp invalid values instead of rejecting
     * @returns {boolean} True if set successfully
     */
    set(name, value, clamp = false) {
        const result = AircraftParameters.validate(name, value);

        if (!result.valid) {
            if (clamp && result.clampedValue !== undefined) {
                this._params[name] = result.clampedValue;
                this._notifyListeners(name, result.clampedValue);
                return true;
            }
            console.warn(`AircraftParameters: ${result.error}`);
            return false;
        }

        const oldValue = this._params[name];
        this._params[name] = value;
        
        if (oldValue !== value) {
            this._notifyListeners(name, value);
        }
        
        return true;
    }

    /**
     * Set multiple parameters at once
     * @param {Object} params - Object with parameter names and values
     * @param {boolean} [clamp=false] - Whether to clamp invalid values
     * @returns {Object} Object with results for each parameter
     */
    setMultiple(params, clamp = false) {
        const results = {};
        
        for (const [name, value] of Object.entries(params)) {
            results[name] = this.set(name, value, clamp);
        }
        
        return results;
    }

    /**
     * Get all parameters
     * @returns {Object}
     */
    getAll() {
        return { ...this._params };
    }

    /**
     * Get physics parameters formatted for aircraft creation
     * @returns {Object}
     */
    getPhysicsParams() {
        return {
            mass: this._params.mass,
            wingArea: this._params.wingArea,
            wingSpan: this._params.wingSpan,
            maxThrust: this._params.maxThrust,
            dragCoefficient: this._params.dragCoefficient,
            liftCoefficientSlope: this._params.liftCoefficientSlope,
            liftCoefficientZero: this._params.liftCoefficientZero,
            maxLiftCoefficient: this._params.maxLiftCoefficient,
            stallAngle: this._params.stallAngle,
            oswaldEfficiency: this._params.oswaldEfficiency,
            maxSpeed: this._params.maxSpeed,
            stallSpeed: this._params.stallSpeed,
            climbRate: this._params.climbRate
        };
    }

    /**
     * Get control parameters formatted for aircraft creation
     * @returns {Object}
     */
    getControlParams() {
        return {
            pitchAuthority: this._params.pitchAuthority,
            rollAuthority: this._params.rollAuthority,
            yawAuthority: this._params.yawAuthority
        };
    }

    /**
     * Reset parameters to defaults
     * @param {string} [name] - Optional specific parameter to reset
     */
    reset(name) {
        if (name) {
            const defaults = new AircraftParameters();
            if (name in defaults._params) {
                this._params[name] = defaults._params[name];
                this._notifyListeners(name, this._params[name]);
            }
        } else {
            const defaults = new AircraftParameters();
            this._params = { ...defaults._params };
            this._notifyListeners(null, this._params);
        }
    }

    /**
     * Calculate derived parameters
     * @returns {Object} Computed values based on current parameters
     */
    getDerivedParams() {
        const aspectRatio = (this._params.wingSpan ** 2) / this._params.wingArea;
        const wingLoading = this._params.mass / this._params.wingArea;
        const thrustToWeight = this._params.maxThrust / (this._params.mass * 9.81);
        
        return {
            aspectRatio,
            wingLoading,
            thrustToWeight,
            thrustToWeightRatio: thrustToWeight.toFixed(2)
        };
    }

    /**
     * Add a change listener
     * @param {Function} callback - Function(name, value) called on parameter change
     */
    addListener(callback) {
        this._listeners.add(callback);
    }

    /**
     * Remove a change listener
     * @param {Function} callback - Previously added callback
     */
    removeListener(callback) {
        this._listeners.delete(callback);
    }

    /**
     * Notify listeners of parameter change
     * @param {string|null} name - Changed parameter name (null for full reset)
     * @param {number|Object} value - New value
     * @private
     */
    _notifyListeners(name, value) {
        for (const callback of this._listeners) {
            try {
                callback(name, value);
            } catch (err) {
                console.error('AircraftParameters: Listener error:', err);
            }
        }
    }

    /**
     * Export parameters to JSON string
     * @returns {string}
     */
    toJSON() {
        return JSON.stringify(this._params);
    }

    /**
     * Import parameters from JSON string
     * @param {string} json - JSON string with parameters
     * @param {boolean} [clamp=true] - Whether to clamp invalid values
     * @returns {boolean} True if import was successful
     */
    fromJSON(json, clamp = true) {
        try {
            const params = JSON.parse(json);
            this.setMultiple(params, clamp);
            return true;
        } catch (err) {
            console.error('AircraftParameters: Invalid JSON:', err);
            return false;
        }
    }

    /**
     * Get parameter info including bounds and description
     * @param {string} name - Parameter name
     * @returns {Object|null}
     */
    static getParamInfo(name) {
        const bounds = PARAMETER_BOUNDS[name];
        if (!bounds) return null;
        
        return {
            name,
            ...bounds
        };
    }

    /**
     * Get all available parameter names
     * @returns {string[]}
     */
    static getParamNames() {
        return Object.keys(PARAMETER_BOUNDS);
    }
}

export default AircraftParameters;
