/**
 * Compatibility Configuration
 * Defines compatibility rules and feature flags
 */

export const COMPATIBILITY_CONFIG = {
    // Current version
    version: '1.0.0',
    
    // Minimum compatible version
    minVersion: '0.5.0',
    
    // Feature flags for backward compatibility
    features: {
        // Legacy features
        legacyPhysics: {
            enabled: true,
            minVersion: '0.1.0',
            deprecatedIn: '1.0.0',
            removedIn: '2.0.0'
        },
        legacyControls: {
            enabled: true,
            minVersion: '0.1.0',
            deprecatedIn: '0.5.0',
            removedIn: '1.0.0'
        },
        
        // New features
        advancedPhysics: {
            enabled: true,
            minVersion: '1.0.0'
        },
        multiplayer: {
            enabled: false,
            minVersion: '1.0.0',
            experimental: true
        },
        i18n: {
            enabled: true,
            minVersion: '1.0.0'
        }
    },
    
    // Data format versions
    dataFormats: {
        saveFile: {
            current: '1.0',
            supported: ['0.5', '0.9', '1.0']
        },
        config: {
            current: '1.0',
            supported: ['0.8', '1.0']
        },
        replay: {
            current: '1.0',
            supported: ['1.0']
        }
    },
    
    // API versions
    api: {
        current: 'v1',
        supported: ['v1'],
        deprecated: []
    },
    
    // Breaking changes
    breakingChanges: [
        {
            version: '1.0.0',
            changes: [
                'Physics engine rewrite',
                'New control system',
                'Updated save file format'
            ],
            migrationAvailable: true
        }
    ],
    
    // Deprecation notices
    deprecations: {
        'old-physics-api': {
            since: '0.8.0',
            removeIn: '2.0.0',
            alternative: 'new-physics-api'
        },
        'legacy-input-handler': {
            since: '0.5.0',
            removeIn: '1.5.0',
            alternative: 'InputHandler class'
        }
    }
};

export default COMPATIBILITY_CONFIG;
