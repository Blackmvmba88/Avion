/**
 * Environment Configuration
 * Settings for terrain, weather, time of day, and world generation
 */

export const ENVIRONMENT_CONFIG = {
    // Terrain settings
    terrain: {
        enabled: true,
        size: 5000,                 // meters
        segments: 100,              // subdivision
        heightScale: 100,           // max height variation
        textureResolution: 2048,
        usePerlinNoise: true,
        seed: 12345,
        octaves: 4,
        persistence: 0.5,
        lacunarity: 2.0
    },
    
    // Airport settings
    airports: [
        {
            name: 'Main Airport',
            position: { x: 0, y: 0, z: 0 },
            runwayLength: 2500,     // meters
            runwayWidth: 45,        // meters
            heading: 90,            // degrees
            elevation: 0,           // meters MSL
            taxiways: true,
            terminal: true,
            controlTower: true,
            lights: true
        },
        {
            name: 'Mountain Airport',
            position: { x: 2000, y: 100, z: 2000 },
            runwayLength: 1200,
            runwayWidth: 30,
            heading: 180,
            elevation: 100,
            taxiways: false,
            terminal: false,
            controlTower: false,
            lights: true
        }
    ],
    
    // Weather settings
    weather: {
        enabled: true,
        cloudDensity: 0.5,          // 0-1
        rainIntensity: 0.0,         // 0-1
        windSpeed: 2,               // m/s
        windDirection: 90,          // degrees
        windVariation: 0.2,         // ±20%
        turbulenceIntensity: 0.1,   // 0-1
        visibility: 10000           // meters
    },
    
    // Time of day settings
    timeOfDay: {
        enabled: true,
        startTime: 12,              // Hour (0-24)
        timeSpeed: 1,               // 1x real-time
        cycleDuration: 1440,        // minutes (24 hours)
        sunIntensity: 1.0,
        moonIntensity: 0.3,
        ambientIntensity: 0.4,
        transitionDuration: 2       // minutes for sunrise/sunset
    },
    
    // Water settings
    water: {
        enabled: true,
        bodies: [
            {
                name: 'Lake',
                position: { x: 1000, y: 0, z: 1000 },
                size: { x: 500, y: 500 },
                waveHeight: 0.5,
                waveFrequency: 0.1,
                color: 0x1e88e5,
                opacity: 0.8
            }
        ]
    },
    
    // Sky settings
    sky: {
        enabled: true,
        type: 'shader',             // 'shader' or 'skybox'
        sunPosition: null,          // Auto-calculated from time
        skyColor: 0x87CEEB,
        horizonColor: 0xffffff,
        groundColor: 0x8B7355,
        turbidity: 2,
        rayleigh: 1,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.8
    },
    
    // Objects and decorations
    objects: {
        trees: {
            enabled: true,
            count: 500,
            distribution: 'random',  // 'random' or 'clusters'
            minDistance: 10,
            types: ['pine', 'oak', 'birch']
        },
        buildings: {
            enabled: true,
            count: 50,
            nearAirports: true,
            maxHeight: 50,
            types: ['residential', 'commercial', 'industrial']
        },
        rocks: {
            enabled: true,
            count: 200,
            onlyInMountains: true
        }
    },
    
    // Lighting
    lighting: {
        ambient: {
            color: 0x404040,
            intensity: 0.4
        },
        directional: {
            color: 0xffffff,
            intensity: 1.0,
            castShadow: true
        },
        hemisphere: {
            skyColor: 0xffffbb,
            groundColor: 0x080820,
            intensity: 0.3
        }
    }
};

export default ENVIRONMENT_CONFIG;
