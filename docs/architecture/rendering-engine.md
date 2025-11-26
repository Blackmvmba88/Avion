# Rendering Engine

## Overview

The rendering engine handles all visual aspects using Three.js WebGL renderer.

## Components

### Renderer.js

Main rendering orchestrator:

```javascript
class Renderer {
    constructor(canvas) {
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
        
        this.setupLighting();
        this.setupShadows();
        this.setupPostProcessing();
    }
}
```

#### Features
- WebGL rendering with antialiasing
- Shadow mapping (PCF soft shadows)
- Fog for depth perception
- Skybox or sky shader
- Post-processing effects (optional)

### CameraController.js

Smooth camera system with multiple modes:

#### Chase Camera
```javascript
targetPosition = aircraft.position - aircraft.forward × distance + Vector3.up × height
camera.position = lerp(camera.position, targetPosition, smoothing)
camera.lookAt(aircraft.position + lookAheadOffset)
```

#### Orbit Camera
- Mouse/touch drag to rotate
- Scroll/pinch to zoom
- Maintains target focus

#### Cockpit Camera (Future)
- First-person view from pilot seat
- Instrument panel overlay

### Shaders

#### SkyShader.js

Atmospheric scattering shader for realistic sky:

```glsl
// Rayleigh scattering for sky color
vec3 skyColor = rayleighScattering(viewDir, sunDir);

// Mie scattering for sun glow
vec3 sunGlow = mieScattering(viewDir, sunDir);

finalColor = skyColor + sunGlow;
```

Features:
- Day/night transitions
- Sun position-based colors
- Horizon gradient
- Atmospheric perspective

#### WaterShader.js

Animated water surface:

```glsl
// Wave function
float wave(vec2 pos, float time) {
    return sin(pos.x * frequency + time) * 
           cos(pos.y * frequency + time) * amplitude;
}

// Normal calculation for lighting
vec3 normal = calculateNormal(position, time);

// Fresnel for reflections
float fresnel = pow(1.0 - dot(viewDir, normal), 5.0);

finalColor = mix(waterColor, skyReflection, fresnel);
```

Features:
- Animated waves
- Reflections
- Refraction
- Foam at shorelines

#### AtmosphericScattering.js

Fog and distance effects:

```glsl
float fogFactor = exp(-distance * fogDensity);
finalColor = mix(fogColor, objectColor, fogFactor);
```

### LOD.js

Level of Detail system:

```javascript
class LODManager {
    update(camera) {
        for (const object of this.objects) {
            const distance = camera.position.distanceTo(object.position);
            
            if (distance < near) {
                object.showHighDetail();
            } else if (distance < far) {
                object.showMediumDetail();
            } else {
                object.showLowDetail();
            }
        }
    }
}
```

Reduces polygon count for distant objects:
- Buildings: High (close) → Medium → Billboard (far)
- Trees: Full model → Simple model → Sprite
- Terrain: High resolution → Lower resolution tiles

## Rendering Pipeline

```
1. Update scene graph
2. Frustum culling
3. Sort transparent objects
4. Render shadow maps
5. Render opaque objects
6. Render transparent objects
7. Post-processing
8. UI/HUD overlay
```

## Performance Optimizations

### Batching
- Instanced rendering for repeated objects (trees, buildings)
- Geometry merging for static objects

### Culling
- Frustum culling (built into Three.js)
- Occlusion culling for terrain
- Distance-based culling

### Textures
- Mipmapping for textures
- Texture atlases for UI elements
- Compressed texture formats (on supported devices)

### Shadows
- Shadow map size based on quality settings
- Cascaded shadow maps for large scenes (future)
- Shadow culling for distant objects

## Quality Settings

### Low
- No shadows
- Simple shaders
- Low LOD distances
- Reduced particle counts

### Medium
- Basic shadows
- Standard shaders
- Normal LOD distances
- Standard particle counts

### High
- PCF soft shadows
- Full shader features
- Extended LOD distances
- Maximum particle counts

### Ultra
- High-res shadow maps
- Advanced post-processing
- Extended view distance
- Full effects

## Mobile Optimizations

- Lower default resolution
- Simplified shaders
- Reduced shadow quality
- Aggressive LOD switching
- Lower particle counts
- Disabled post-processing

## Debug Visualization

- Wireframe mode
- Physics debug draw
- Bounding box display
- Performance stats overlay
- Shadow map visualization
