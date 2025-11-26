# Environment System

## Overview

The environment system creates and manages the game world including terrain, airports, weather, and time of day.

## Components

### Environment.js

Main orchestrator that coordinates all environmental systems:

```javascript
class Environment {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        
        this.terrain = new TerrainGenerator(config.terrain);
        this.airports = [];
        this.weather = new Weather(config.weather);
        this.timeOfDay = new TimeOfDay(config.timeOfDay);
        this.waterBodies = [];
        
        this.initialize();
    }
    
    update(deltaTime) {
        this.timeOfDay.update(deltaTime);
        this.weather.update(deltaTime);
        this.updateLighting();
    }
}
```

### TerrainGenerator.js

Procedural terrain generation using height maps:

```javascript
class TerrainGenerator {
    generate() {
        const geometry = new THREE.PlaneGeometry(
            size, size, segments, segments
        );
        
        // Apply height map
        for (let i = 0; i < vertices.length; i++) {
            const x = vertices[i].x;
            const z = vertices[i].z;
            vertices[i].y = this.getHeight(x, z);
        }
        
        geometry.computeVertexNormals();
        return new THREE.Mesh(geometry, material);
    }
    
    getHeight(x, z) {
        // Perlin noise or height map lookup
        return perlinNoise(x / scale, z / scale) * amplitude;
    }
}
```

Features:
- Perlin noise-based height generation
- Texture splatting based on height/slope
- Grass, rock, snow layers
- Collision detection

### Airport.js

Modular airport generation:

```javascript
class Airport {
    constructor(scene, config) {
        this.position = config.position;
        this.runwayLength = config.runwayLength || 2000;
        this.runwayWidth = config.runwayWidth || 45;
        this.heading = config.heading || 0;
    }
    
    build() {
        this.createRunway();
        this.createTaxiways();
        this.createMarkings();
        this.createLights();
        this.createTerminal();
        this.createControlTower();
    }
}
```

Components:
- **Runways**: Configurable length, width, heading
- **Taxiways**: Connecting paths
- **Markings**: Runway numbers, centerlines, threshold markers
- **Lights**: Approach lights, runway edge lights
- **Buildings**: Terminal, control tower, hangars

### Weather.js

Dynamic weather simulation:

```javascript
class Weather {
    constructor(config) {
        this.clouds = new Clouds(config.cloudDensity);
        this.rain = new RainParticles(config.rainIntensity);
        this.wind = new Wind(config.windSpeed, config.windDirection);
    }
    
    update(deltaTime) {
        this.clouds.update(deltaTime);
        this.rain.update(deltaTime);
        this.updateVisibility();
    }
    
    setConditions(conditions) {
        this.clouds.setDensity(conditions.cloudDensity);
        this.rain.setIntensity(conditions.rainIntensity);
        this.wind.setSpeed(conditions.windSpeed);
    }
}
```

Weather types:
- Clear
- Partly cloudy
- Overcast
- Light rain
- Heavy rain
- Thunderstorm (future)
- Fog (future)

### WaterBody.js

Water rendering with reflections:

```javascript
class WaterBody {
    constructor(position, size) {
        this.mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(size.x, size.y, 100, 100),
            waterShaderMaterial
        );
        
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.copy(position);
    }
    
    update(time) {
        this.material.uniforms.time.value = time;
    }
}
```

Features:
- Animated waves
- Reflections (sky, environment)
- Refraction effects
- Shoreline foam
- Adjustable wave height and frequency

### TimeOfDay.js

Day/night cycle simulation:

```javascript
class TimeOfDay {
    constructor(config) {
        this.time = config.startTime || 12; // Hour of day (0-24)
        this.timeSpeed = config.timeSpeed || 1; // Time multiplier
        this.cycleDuration = config.cycleDuration || 1440; // Minutes
    }
    
    update(deltaTime) {
        this.time += (deltaTime / 60) * this.timeSpeed;
        if (this.time >= 24) this.time -= 24;
        
        this.updateSunPosition();
        this.updateSkyColors();
        this.updateAmbientLight();
    }
    
    getSunPosition() {
        const angle = (this.time / 24) * Math.PI * 2 - Math.PI / 2;
        return new THREE.Vector3(
            Math.cos(angle) * 1000,
            Math.sin(angle) * 1000,
            0
        );
    }
}
```

Features:
- Configurable time progression
- Sun/moon positioning
- Sky color transitions (dawn, day, dusk, night)
- Dynamic lighting adjustments
- Shadow direction based on sun position

### Clouds.js

Volumetric cloud system:

```javascript
class Clouds {
    constructor(density) {
        this.cloudParticles = [];
        this.density = density;
        this.generate();
    }
    
    generate() {
        const cloudTexture = this.loadCloudTexture();
        const cloudMaterial = new THREE.SpriteMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.6
        });
        
        for (let i = 0; i < this.density * 50; i++) {
            const sprite = new THREE.Sprite(cloudMaterial);
            sprite.position.set(
                Math.random() * 1000 - 500,
                200 + Math.random() * 100,
                Math.random() * 1000 - 500
            );
            sprite.scale.set(50, 30, 1);
            this.cloudParticles.push(sprite);
        }
    }
    
    update(deltaTime) {
        // Animate clouds drifting
        for (const cloud of this.cloudParticles) {
            cloud.position.x += windSpeed * deltaTime;
        }
    }
}
```

## Configuration Example

```javascript
const environmentConfig = {
    terrain: {
        size: 5000,
        heightScale: 100,
        textureResolution: 2048,
        usePerlinNoise: true
    },
    airports: [
        {
            position: { x: 0, y: 0, z: 0 },
            runwayLength: 2500,
            runwayWidth: 45,
            heading: 90,
            name: 'Main Airport'
        }
    ],
    weather: {
        cloudDensity: 0.5,
        rainIntensity: 0.0,
        windSpeed: 2,
        windDirection: 90,
        visibility: 10000
    },
    timeOfDay: {
        startTime: 12,
        timeSpeed: 100,
        cycleDuration: 24
    },
    water: {
        enabled: true,
        bodies: [
            { position: { x: 1000, y: 0, z: 1000 }, size: { x: 500, y: 500 } }
        ]
    }
};
```

## Performance Considerations

- Terrain LOD for distant areas
- Cloud particle count based on quality settings
- Rain particles only when visible
- Occlusion culling for airports/buildings
- Distance-based object activation/deactivation
