/**
 * Validator Utility
 * Provides validation functions for configurations and data
 */

export class Validator {
    /**
     * Validate configuration object
     * @param {Object} config - Configuration to validate
     * @param {Object} schema - Validation schema
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    static validateConfig(config, schema) {
        const errors = [];
        
        for (const [key, rules] of Object.entries(schema)) {
            if (rules.required && !(key in config)) {
                errors.push(`Missing required field: ${key}`);
                continue;
            }
            
            if (key in config) {
                const value = config[key];
                
                // Type validation
                if (rules.type && typeof value !== rules.type) {
                    errors.push(`Invalid type for ${key}: expected ${rules.type}, got ${typeof value}`);
                }
                
                // Range validation
                if (rules.min !== undefined && value < rules.min) {
                    errors.push(`Value for ${key} is below minimum: ${value} < ${rules.min}`);
                }
                if (rules.max !== undefined && value > rules.max) {
                    errors.push(`Value for ${key} exceeds maximum: ${value} > ${rules.max}`);
                }
                
                // Enum validation
                if (rules.enum && !rules.enum.includes(value)) {
                    errors.push(`Invalid value for ${key}: ${value} not in [${rules.enum.join(', ')}]`);
                }
                
                // Custom validation function
                if (rules.validator && !rules.validator(value)) {
                    errors.push(`Custom validation failed for ${key}`);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Validate version compatibility
     * @param {string} currentVersion - Current version
     * @param {string} requiredVersion - Required version
     * @returns {boolean}
     */
    static isVersionCompatible(currentVersion, requiredVersion) {
        const current = this.parseVersion(currentVersion);
        const required = this.parseVersion(requiredVersion);
        
        // Major version must match
        if (current.major !== required.major) return false;
        
        // Minor version must be >= required
        if (current.minor < required.minor) return false;
        
        return true;
    }
    
    /**
     * Parse version string
     * @param {string} version - Version string (e.g., "1.2.3")
     * @returns {Object}
     */
    static parseVersion(version) {
        const parts = version.split('.').map(Number);
        return {
            major: parts[0] || 0,
            minor: parts[1] || 0,
            patch: parts[2] || 0
        };
    }
    
    /**
     * Validate network message
     * @param {Object} message - Network message
     * @returns {boolean}
     */
    static validateNetworkMessage(message) {
        return (
            message &&
            typeof message === 'object' &&
            'type' in message &&
            'timestamp' in message &&
            'data' in message
        );
    }
}

export default Validator;
