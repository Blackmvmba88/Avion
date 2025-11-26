/**
 * Mobile Configuration
 * Mobile-specific optimizations and settings
 */

export const MOBILE_CONFIG = {
    // Detection
    detection: {
        autoDetect: true,
        userAgentCheck: true,
        touchCheck: true,
        screenSizeThreshold: 768    // pixels
    },
    
    // Performance
    performance: {
        targetFPS: 30,
        adaptiveQuality: true,
        aggressiveOptimization: true,
        maxPixelRatio: 1.5,
        physicsHz: 30,              // Lower physics rate
        reducedParticles: true,
        simplifiedShaders: true
    },
    
    // Rendering
    rendering: {
        shadowsEnabled: false,
        antialias: false,
        postProcessing: false,
        maxTextureSize: 1024,
        shadowMapSize: 512,
        fogDensity: 0.5,
        lodDistances: {
            near: 30,
            medium: 80,
            far: 150
        }
    },
    
    // Touch controls
    controls: {
        joystick: {
            enabled: true,
            position: 'left',       // 'left' or 'right'
            size: 100,              // pixels
            deadzone: 0.15,
            sensitivity: 1.0,
            opacity: 0.6,
            color: 0x3498db
        },
        throttle: {
            enabled: true,
            position: 'right',
            type: 'slider',         // 'slider' or 'buttons'
            height: 200,
            sensitivity: 1.0,
            opacity: 0.6
        },
        yaw: {
            enabled: true,
            type: 'buttons',        // 'buttons' or 'swipe'
            size: 60,
            position: 'right-bottom'
        },
        gyroscope: {
            enabled: false,         // Off by default
            sensitivity: 0.5,
            smoothing: 0.2,
            invertPitch: false,
            invertRoll: false
        }
    },
    
    // UI adjustments
    ui: {
        hud: {
            mode: 'minimal',        // 'minimal', 'standard', 'full'
            fontSize: 18,           // pixels
            opacity: 0.8,
            position: {
                speed: 'top-left',
                altitude: 'top-right',
                throttle: 'bottom-right',
                status: 'bottom'
            }
        },
        menu: {
            fontSize: 20,
            buttonSize: 60,         // pixels (touch-friendly)
            spacing: 20
        },
        buttons: {
            minSize: 44,            // Apple HIG minimum
            padding: 12,
            fontSize: 16
        }
    },
    
    // Assets
    assets: {
        textureCompression: true,
        reducedQuality: true,
        modelSimplification: true,
        audioCompression: true,
        maxTextureSize: 512,
        maxModelComplexity: 1000    // triangles
    },
    
    // Battery optimization
    battery: {
        monitorLevel: true,
        lowBatteryThreshold: 0.2,   // 20%
        powerSaveMode: {
            enabled: false,         // Auto-enable at low battery
            targetFPS: 20,
            disableEffects: true,
            reduceQuality: true
        }
    },
    
    // Memory management
    memory: {
        maxUsage: 200,              // MB
        aggressiveGC: true,
        unloadUnusedAssets: true,
        cacheLimit: 50              // MB
    },
    
    // Network
    network: {
        preloadAssets: false,       // Don't preload on mobile data
        wifiOnlyDownloads: true,
        compressionEnabled: true,
        maxConcurrentRequests: 2
    },
    
    // Platform-specific
    ios: {
        preventElasticScroll: true,
        requestMotionPermission: true,
        handleNotch: true,
        disableCallout: true
    },
    android: {
        fullscreen: true,
        preventSystemGestures: true,
        hardwareAcceleration: true
    }
};

export default MOBILE_CONFIG;
