# Performance Guide

## Performance Targets

### Desktop
- **Target FPS**: 60 FPS constant
- **Frame Time**: < 16.67ms
- **Memory Usage**: < 500 MB
- **Load Time**: < 3 seconds
- **Physics Update**: 16.67ms (60 Hz)

### Mobile
- **Target FPS**: 30-60 FPS (adaptive)
- **Frame Time**: < 33ms
- **Memory Usage**: < 200 MB
- **Load Time**: < 5 seconds
- **Physics Update**: 33ms (30 Hz)

## Performance Monitoring

### Built-in Profiler

```javascript
import { Profiler } from './engine/utils/Profiler.js';

const profiler = new Profiler();

// Start profiling
profiler.begin('physics');
updatePhysics(deltaTime);
profiler.end('physics');

// Get results
const stats = profiler.getStats();
console.log(`Physics: ${stats.physics.average}ms`);
```

### Chrome DevTools

1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Interact with the simulator
5. Stop recording
6. Analyze flame chart

### Key Metrics to Monitor

- **FPS**: Frames per second
- **Frame Time**: Time per frame
- **Draw Calls**: Number of draw calls
- **Triangles**: Polygon count
- **Texture Memory**: GPU memory usage
- **JS Heap**: JavaScript memory
- **Physics Time**: Physics calculation time
- **Render Time**: Rendering time

## Optimization Strategies

### JavaScript Performance

#### 1. Object Pooling

Reuse objects instead of creating new ones:

```javascript
class ParticlePool {
    constructor(size) {
        this.pool = Array(size).fill(null).map(() => new Particle());
        this.available = [...this.pool];
    }
    
    acquire() {
        return this.available.pop() || new Particle();
    }
    
    release(particle) {
        particle.reset();
        this.available.push(particle);
    }
}

// Usage
const pool = new ParticlePool(1000);
const particle = pool.acquire();
// ... use particle
pool.release(particle);
```

#### 2. Avoid Allocations in Hot Paths

```javascript
// ❌ Bad: Creates new Vector3 every frame
function update() {
    const force = new THREE.Vector3(0, -9.81 * mass, 0);
    velocity.add(force);
}

// ✅ Good: Reuse vector
const gravityForce = new THREE.Vector3();
function update() {
    gravityForce.set(0, -9.81 * mass, 0);
    velocity.add(gravityForce);
}
```

#### 3. Cache Calculations

```javascript
// ❌ Bad: Recalculate every time
function calculateLift() {
    const airspeed = this.velocity.length();
    const lift = 0.5 * density * airspeed * airspeed * wingArea * CL;
    return lift;
}

// ✅ Good: Cache airspeed
class Aircraft {
    update(deltaTime) {
        this._airspeed = this.velocity.length(); // Calculate once
        this.lift = this.calculateLift();
        this.drag = this.calculateDrag();
    }
    
    calculateLift() {
        return 0.5 * density * this._airspeed * this._airspeed * wingArea * CL;
    }
}
```

#### 4. Use TypedArrays for Large Datasets

```javascript
// For terrain vertices
const vertices = new Float32Array(count * 3);
const normals = new Float32Array(count * 3);
const uvs = new Float32Array(count * 2);
```

### Three.js Performance

#### 1. Geometry Optimization

```javascript
// ❌ Bad: High poly count
const sphere = new THREE.SphereGeometry(1, 64, 64);

// ✅ Good: Appropriate detail
const sphere = new THREE.SphereGeometry(1, 16, 16);
```

#### 2. Material Optimization

```javascript
// ❌ Bad: Unique materials for each object
objects.forEach(obj => {
    obj.material = new THREE.MeshStandardMaterial({ color: obj.color });
});

// ✅ Good: Shared materials
const materials = {
    tree: new THREE.MeshLambertMaterial({ color: 0x228b22 }),
    building: new THREE.MeshStandardMaterial({ color: 0xcccccc })
};

objects.forEach(obj => {
    obj.material = materials[obj.type];
});
```

#### 3. Instanced Rendering

```javascript
// For repeated objects (trees, buildings)
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

const matrix = new THREE.Matrix4();
for (let i = 0; i < count; i++) {
    matrix.setPosition(positions[i]);
    instancedMesh.setMatrixAt(i, matrix);
}
```

#### 4. LOD (Level of Detail)

```javascript
const lod = new THREE.LOD();

// High detail (close)
const highDetail = new THREE.Mesh(highPolyGeometry, material);
lod.addLevel(highDetail, 0);

// Medium detail
const mediumDetail = new THREE.Mesh(mediumPolyGeometry, material);
lod.addLevel(mediumDetail, 50);

// Low detail (far)
const lowDetail = new THREE.Mesh(lowPolyGeometry, material);
lod.addLevel(lowDetail, 200);

scene.add(lod);
```

#### 5. Frustum Culling

Three.js does this automatically, but ensure:
- Objects have correct bounding boxes
- Large objects are split into smaller chunks
- Use `object.frustumCulled = true` (default)

#### 6. Texture Optimization

```javascript
// Use mipmaps
texture.generateMipmaps = true;
texture.minFilter = THREE.LinearMipmapLinearFilter;

// Compress textures when possible
// Use texture atlases to reduce draw calls

// Set appropriate size
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
```

### Physics Performance

#### 1. Fixed Timestep

```javascript
const PHYSICS_TIMESTEP = 1/60;
let accumulator = 0;

function gameLoop(deltaTime) {
    accumulator += deltaTime;
    
    while (accumulator >= PHYSICS_TIMESTEP) {
        updatePhysics(PHYSICS_TIMESTEP);
        accumulator -= PHYSICS_TIMESTEP;
    }
    
    render();
}
```

#### 2. Spatial Partitioning

```javascript
// For collision detection
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }
    
    insert(object) {
        const cell = this.getCell(object.position);
        if (!this.cells.has(cell)) {
            this.cells.set(cell, []);
        }
        this.cells.get(cell).push(object);
    }
    
    getNearby(position, radius) {
        // Only check objects in nearby cells
        const nearby = [];
        // ... implementation
        return nearby;
    }
}
```

#### 3. Simplify Calculations

```javascript
// Use lookup tables for expensive calculations
const liftCoefficientTable = [];
for (let i = 0; i <= 180; i++) {
    liftCoefficientTable[i] = calculateLiftCoefficient(i * Math.PI / 180);
}

function getLiftCoefficient(angleOfAttack) {
    const index = Math.round(angleOfAttack * 180 / Math.PI);
    return liftCoefficientTable[index];
}
```

### Rendering Performance

#### 1. Shadow Optimization

```javascript
// Reduce shadow map size on low settings
const shadowMapSize = quality === 'low' ? 512 :
                     quality === 'medium' ? 1024 :
                     quality === 'high' ? 2048 : 4096;

light.shadow.mapSize.set(shadowMapSize, shadowMapSize);

// Limit shadow casting objects
light.shadow.camera.far = 500; // Don't cast shadows beyond this
```

#### 2. Reduce Draw Calls

```javascript
// Merge static geometries
const geometries = [];
staticObjects.forEach(obj => {
    geometries.push(obj.geometry);
});
const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
const mergedMesh = new THREE.Mesh(mergedGeometry, material);
```

#### 3. Occlusion Culling

```javascript
// Don't render objects behind terrain
function isVisible(object, camera, terrain) {
    const cameraToObject = object.position.clone().sub(camera.position);
    const terrainHeight = terrain.getHeightAt(object.position.x, object.position.z);
    return object.position.y > terrainHeight;
}
```

## Memory Management

### 1. Dispose Unused Resources

```javascript
function removeObject(object) {
    // Dispose geometry
    if (object.geometry) {
        object.geometry.dispose();
    }
    
    // Dispose material(s)
    if (object.material) {
        if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
        } else {
            object.material.dispose();
        }
    }
    
    // Dispose textures
    if (object.material?.map) {
        object.material.map.dispose();
    }
    
    // Remove from scene
    scene.remove(object);
}
```

### 2. Texture Management

```javascript
class TextureManager {
    constructor() {
        this.cache = new Map();
    }
    
    load(path) {
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }
        
        const texture = textureLoader.load(path);
        this.cache.set(path, texture);
        return texture;
    }
    
    dispose(path) {
        const texture = this.cache.get(path);
        if (texture) {
            texture.dispose();
            this.cache.delete(path);
        }
    }
}
```

### 3. Memory Leak Prevention

```javascript
// Remove event listeners
function cleanup() {
    window.removeEventListener('resize', onResize);
    document.removeEventListener('keydown', onKeyDown);
    
    // Cancel animation frame
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Dispose Three.js resources
    renderer.dispose();
    scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
    });
}
```

## Performance Testing

### Benchmark Script

```javascript
class PerformanceBenchmark {
    constructor() {
        this.results = [];
    }
    
    async run(name, fn, iterations = 1000) {
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await fn();
            const end = performance.now();
            times.push(end - start);
        }
        
        const avg = times.reduce((a, b) => a + b) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        
        this.results.push({ name, avg, min, max });
    }
    
    report() {
        console.table(this.results);
    }
}

// Usage
const benchmark = new PerformanceBenchmark();
await benchmark.run('Physics Update', () => updatePhysics(1/60));
await benchmark.run('Render', () => renderer.render(scene, camera));
benchmark.report();
```

### Performance Budget

| System | Budget | Warning | Critical |
|--------|--------|---------|----------|
| Physics | 5ms | 8ms | 10ms |
| Rendering | 8ms | 12ms | 15ms |
| Game Logic | 2ms | 4ms | 5ms |
| Total | 16ms | 20ms | 25ms |

### Continuous Monitoring

```javascript
class PerformanceMonitor {
    constructor() {
        this.samples = [];
        this.maxSamples = 60;
    }
    
    update(deltaTime) {
        const fps = 1 / deltaTime;
        this.samples.push(fps);
        
        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }
        
        // Alert if performance drops
        const avgFps = this.getAverageFPS();
        if (avgFps < 30) {
            console.warn('Low FPS detected:', avgFps);
            this.reduceQuality();
        }
    }
    
    getAverageFPS() {
        return this.samples.reduce((a, b) => a + b) / this.samples.length;
    }
    
    reduceQuality() {
        // Automatically reduce quality settings
    }
}
```

## Mobile-Specific Optimizations

### 1. Resolution Scaling

```javascript
const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
renderer.setPixelRatio(pixelRatio);
```

### 2. Simplified Shaders

```javascript
const material = isMobile
    ? new THREE.MeshBasicMaterial({ color: 0x3498db })
    : new THREE.MeshStandardMaterial({ color: 0x3498db });
```

### 3. Reduced Particle Count

```javascript
const particleCount = isMobile ? 100 : 1000;
```

### 4. Disable Features

```javascript
if (isMobile) {
    renderer.shadowMap.enabled = false;
    scene.fog = null;
    // Reduce LOD distances
}
```

## Profiling Checklist

- [ ] Check FPS in different scenarios
- [ ] Monitor memory usage over time
- [ ] Measure physics update time
- [ ] Measure render time
- [ ] Count draw calls
- [ ] Check texture memory
- [ ] Test on low-end devices
- [ ] Test on mobile devices
- [ ] Profile with Chrome DevTools
- [ ] Check for memory leaks
- [ ] Verify LOD is working
- [ ] Confirm frustum culling
- [ ] Check instanced rendering

## Common Performance Issues

### Issue: Low FPS
**Causes**:
- Too many draw calls
- High polygon count
- Expensive shaders
- No LOD system

**Solutions**:
- Batch geometries
- Use instanced rendering
- Implement LOD
- Simplify shaders

### Issue: Stuttering
**Causes**:
- Garbage collection
- Object allocations in game loop
- Physics spikes

**Solutions**:
- Object pooling
- Cache calculations
- Fixed timestep physics

### Issue: High Memory Usage
**Causes**:
- Texture leaks
- Undisposed objects
- Large terrain data

**Solutions**:
- Dispose resources
- Use texture atlases
- Stream terrain data

### Issue: Slow Loading
**Causes**:
- Large assets
- Synchronous loading
- No compression

**Solutions**:
- Compress textures
- Async loading
- Progressive loading
- Show loading screen

## Performance Best Practices Summary

1. ✅ Use object pooling
2. ✅ Cache calculations
3. ✅ Implement LOD
4. ✅ Use instanced rendering
5. ✅ Dispose unused resources
6. ✅ Fixed timestep physics
7. ✅ Profile regularly
8. ✅ Test on target devices
9. ✅ Monitor FPS and memory
10. ✅ Optimize for mobile
