/**
 * Example: Using New Features
 * This file demonstrates how to use the new optimization, i18n, 
 * connectivity, multiplatform, and backward compatibility features
 */

import AppInitializer from '../utils/AppInitializer.js';
import i18n from '../utils/I18n.js';
import { ConnectionManager } from '../utils/ConnectionManager.js';
import platformDetector from '../utils/PlatformDetector.js';
import { Optimizer } from '../utils/Optimizer.js';
import { Validator } from '../utils/Validator.js';
import versionManager from '../utils/VersionManager.js';

/**
 * Example 1: Initialize Application with All Features
 */
export async function exampleFullInitialization() {
    console.log('=== Example 1: Full Initialization ===');
    
    const initializer = new AppInitializer();
    const result = await initializer.initialize({
        locale: 'en',  // Can be 'en', 'es', 'fr', 'de', 'pt', or omit for auto-detect
        config: {
            graphics: {
                quality: 'high',
                shadows: true
            }
        }
    });
    
    console.log('Initialization result:', result);
    return result;
}

/**
 * Example 2: Using i18n for UI Text
 */
export function exampleI18nUsage() {
    console.log('\n=== Example 2: i18n Usage ===');
    
    // Get translated text
    console.log('Altitude (EN):', i18n.t('hud.altitude'));
    
    // Switch to Spanish
    i18n.setLocale('es');
    console.log('Altitude (ES):', i18n.t('hud.altitude'));
    
    // Switch to French
    i18n.setLocale('fr');
    console.log('Altitude (FR):', i18n.t('hud.altitude'));
    
    // With interpolation
    i18n.setLocale('en');
    const message = i18n.t('network.connecting');
    console.log('Network message:', message);
    
    // Listen for language changes
    i18n.onLocaleChange((locale) => {
        console.log(`Language changed to: ${locale}`);
    });
}

/**
 * Example 3: Platform Detection and Optimization
 */
export function examplePlatformDetection() {
    console.log('\n=== Example 3: Platform Detection ===');
    
    const platform = platformDetector.platform;
    
    console.log('Device type:', platform.isMobile ? 'Mobile' : 
        platform.isTablet ? 'Tablet' : 'Desktop');
    console.log('Operating System:', platformDetector.toString());
    console.log('Has touch support:', platform.hasTouch);
    console.log('Screen size:', `${platform.screenWidth}x${platform.screenHeight}`);
    console.log('Pixel ratio:', platform.pixelRatio);
    
    // Get recommended settings
    const recommended = platformDetector.getRecommendedSettings();
    console.log('Recommended settings:', recommended);
    
    // Get rendering settings
    const renderSettings = Optimizer.getRenderingSettings(platform.isMobile);
    console.log('Render settings:', renderSettings);
}

/**
 * Example 4: Configuration Validation
 */
export function exampleValidation() {
    console.log('\n=== Example 4: Configuration Validation ===');
    
    const schema = {
        quality: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'ultra'],
            required: true
        },
        shadows: {
            type: 'boolean',
            required: true
        },
        renderDistance: {
            type: 'number',
            min: 100,
            max: 5000
        }
    };
    
    // Valid config
    const validConfig = {
        quality: 'high',
        shadows: true,
        renderDistance: 2000
    };
    
    const result1 = Validator.validateConfig(validConfig, schema);
    console.log('Valid config result:', result1);
    
    // Invalid config
    const invalidConfig = {
        quality: 'extreme',  // Not in enum
        shadows: 'yes',      // Wrong type
        renderDistance: 10   // Below minimum
    };
    
    const result2 = Validator.validateConfig(invalidConfig, schema);
    console.log('Invalid config result:', result2);
}

/**
 * Example 5: Performance Optimization
 */
export function exampleOptimization() {
    console.log('\n=== Example 5: Performance Optimization ===');
    
    // Throttle - limits function calls
    let throttleCount = 0;
    const throttledFunction = Optimizer.throttle(() => {
        throttleCount++;
        console.log('Throttled function called:', throttleCount);
    }, 1000);
    
    // This would be called many times, but throttle limits it
    for (let i = 0; i < 10; i++) {
        throttledFunction();
    }
    
    // Debounce - delays function until calls stop
    let debounceCount = 0;
    const debouncedFunction = Optimizer.debounce(() => {
        debounceCount++;
        console.log('Debounced function called:', debounceCount);
    }, 500);
    
    // Call multiple times, but only last one executes after delay
    for (let i = 0; i < 5; i++) {
        debouncedFunction();
    }
    
    // Object pooling
    class Particle {
        constructor() {
            this.x = 0;
            this.y = 0;
            this.active = false;
        }
        reset(x, y) {
            this.x = x;
            this.y = y;
            this.active = true;
        }
    }
    
    const particlePool = Optimizer.createPool(() => new Particle(), 10);
    console.log('Created particle pool with 10 objects');
    
    // Acquire particles
    const particle1 = particlePool.acquire();
    const particle2 = particlePool.acquire();
    console.log('Acquired 2 particles from pool');
    
    // Release particles back to pool
    particlePool.release(particle1);
    particlePool.release(particle2);
    console.log('Released particles back to pool');
}

/**
 * Example 6: Network Connectivity (requires server)
 */
export async function exampleNetworkConnectivity() {
    console.log('\n=== Example 6: Network Connectivity ===');
    
    const connection = new ConnectionManager();
    
    // Listen for connection status changes
    connection.onConnectionChange((status, data) => {
        console.log('Connection status:', status, data);
    });
    
    // Listen for specific message types
    connection.on('player_update', (data) => {
        console.log('Player update received:', data);
    });
    
    try {
        // This would connect to a real server
        // await connection.connect('ws://localhost:8080');
        console.log('Note: Connection example requires a WebSocket server');
        console.log('Server URL would be: ws://localhost:8080');
        
        // Send a message (when connected)
        // connection.send('player_update', {
        //     position: { x: 0, y: 100, z: 0 },
        //     rotation: { x: 0, y: 0, z: 0 },
        //     velocity: { x: 0, y: 0, z: 50 }
        // });
        
    } catch (error) {
        console.log('Connection would be established here with a server');
    }
    
    return connection;
}

/**
 * Example 7: Version Management
 */
export function exampleVersionManagement() {
    console.log('\n=== Example 7: Version Management ===');
    
    // Example old save data
    const oldSaveData = {
        __version: '0.5.0',
        playerName: 'Pilot',
        aircraftType: 'basic',
        score: 1000
    };
    
    console.log('Old save data:', oldSaveData);
    
    // In real app, this would migrate to current version
    console.log('Migration would convert from', oldSaveData.__version, 'to 1.0.0');
    
    // Version comparison
    const comparison = versionManager.compareVersions('1.0.0', '0.5.0');
    console.log('Version comparison (1.0.0 vs 0.5.0):', comparison > 0 ? 'Newer' : 'Older');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  Avion Flight Simulator - New Features Examples       ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    try {
        // Initialize everything first
        await exampleFullInitialization();
        
        // Run other examples
        exampleI18nUsage();
        examplePlatformDetection();
        exampleValidation();
        exampleOptimization();
        await exampleNetworkConnectivity();
        exampleVersionManagement();
        
        console.log('\n✅ All examples completed successfully!');
        
    } catch (error) {
        console.error('❌ Error running examples:', error);
    }
}

// Export for use in other modules
export default {
    exampleFullInitialization,
    exampleI18nUsage,
    examplePlatformDetection,
    exampleValidation,
    exampleOptimization,
    exampleNetworkConnectivity,
    exampleVersionManagement,
    runAllExamples
};
