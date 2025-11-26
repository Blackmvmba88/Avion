/**
 * Engine Configuration
 * Core engine settings for physics, rendering, and performance
 */

export const ENGINE_CONFIG = {
    // Physics settings
    physics: {
        gravity: 9.81,              // m/s²
        timestep: 1/60,             // Fixed timestep (60 Hz)
        maxSubSteps: 3,             // Maximum physics sub-steps per frame
        airDensitySeaLevel: 1.225,  // kg/m³
        scaleHeight: 8500           // m (for exponential atmosphere)
    },
    
    // Rendering settings
    rendering: {
        antialias: true,
        shadowsEnabled: true,
        shadowMapSize: 2048,
        maxPixelRatio: 2,
        fogEnabled: true,
        fogNear: 100,
        fogFar: 2000,
        fogColor: 0x87CEEB
    },
    
    // Performance settings
    performance: {
        targetFPS: 60,
        adaptiveQuality: true,
        minFPSThreshold: 30,
        qualityAdjustmentInterval: 5000  // ms
    },
    
    // Quality presets
    quality: {
        low: {
            shadowMapSize: 512,
            maxPixelRatio: 1,
            antialias: false,
            shadowsEnabled: false,
            lodDistances: { near: 50, medium: 100, far: 200 }
        },
        medium: {
            shadowMapSize: 1024,
            maxPixelRatio: 1.5,
            antialias: true,
            shadowsEnabled: true,
            lodDistances: { near: 100, medium: 250, far: 500 }
        },
        high: {
            shadowMapSize: 2048,
            maxPixelRatio: 2,
            antialias: true,
            shadowsEnabled: true,
            lodDistances: { near: 200, medium: 500, far: 1000 }
        },
        ultra: {
            shadowMapSize: 4096,
            maxPixelRatio: 2,
            antialias: true,
            shadowsEnabled: true,
            lodDistances: { near: 300, medium: 800, far: 1500 }
        }
    },
    
    // Debug settings
    debug: {
        showFPS: true,
        showPhysicsDebug: false,
        showBoundingBoxes: false,
        logPerformance: false
    }
};

export default ENGINE_CONFIG;
