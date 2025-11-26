# API Documentation

## Core Engine API

### Engine Class

Main engine orchestrator that manages all subsystems.

```javascript
import { Engine } from './engine/core/Engine.js';

const engine = new Engine(config);
```

#### Constructor

```javascript
new Engine(config: EngineConfig): Engine
```

**Parameters**:
- `config` (EngineConfig): Engine configuration object

**Example**:
```javascript
const engine = new Engine({
    canvas: document.getElementById('canvas'),
    physicsHz: 60,
    quality: 'high'
});
```

#### Methods

##### `start()`
Starts the engine main loop.

```javascript
engine.start(): void
```

##### `stop()`
Stops the engine and releases resources.

```javascript
engine.stop(): void
```

##### `pause()`
Pauses the simulation.

```javascript
engine.pause(): void
```

##### `resume()`
Resumes the simulation.

```javascript
engine.resume(): void
```

##### `update(deltaTime)`
Updates all subsystems. Called automatically by game loop.

```javascript
engine.update(deltaTime: number): void
```

---

## Physics API

### FlightPhysics Class

Handles aerodynamic calculations.

```javascript
import { FlightPhysics } from './engine/physics/FlightPhysics.js';

const physics = new FlightPhysics(config);
```

#### Methods

##### `calculateLift(params)`
Calculates lift force.

```javascript
physics.calculateLift(params: LiftParams): number
```

**Parameters**:
```javascript
interface LiftParams {
    airDensity: number;      // kg/m³
    velocity: number;        // m/s
    wingArea: number;        // m²
    liftCoefficient: number; // dimensionless
}
```

**Returns**: Lift force in Newtons

**Example**:
```javascript
const lift = physics.calculateLift({
    airDensity: 1.225,
    velocity: 50,
    wingArea: 20,
    liftCoefficient: 1.0
});
// lift = 30625 N
```

##### `calculateDrag(params)`
Calculates drag force.

```javascript
physics.calculateDrag(params: DragParams): number
```

**Parameters**:
```javascript
interface DragParams {
    airDensity: number;      // kg/m³
    velocity: number;        // m/s
    area: number;            // m²
    dragCoefficient: number; // dimensionless
}
```

**Returns**: Drag force in Newtons

##### `getAirDensity(altitude)`
Gets air density at given altitude.

```javascript
physics.getAirDensity(altitude: number): number
```

**Parameters**:
- `altitude` (number): Altitude in meters

**Returns**: Air density in kg/m³

**Example**:
```javascript
const density = physics.getAirDensity(1000);
// density ≈ 1.112 kg/m³
```

---

## Aircraft API

### Aircraft Class

Represents an aircraft with physics and visual components.

```javascript
import { Aircraft } from './engine/aircraft/Aircraft.js';

const aircraft = new Aircraft(config);
```

#### Constructor

```javascript
new Aircraft(config: AircraftConfig): Aircraft
```

**Config Interface**:
```javascript
interface AircraftConfig {
    name: string;
    physics: {
        mass: number;              // kg
        wingArea: number;          // m²
        wingSpan: number;          // m
        maxThrust: number;         // N
        dragCoefficient: number;
        liftCoefficient: number;
        maxSpeed: number;          // m/s
        stallSpeed: number;        // m/s
    };
    visual: {
        color: number;             // hex color
        scale: number;
    };
}
```

#### Properties

##### `position`
Current position in 3D space.

```javascript
aircraft.position: THREE.Vector3
```

##### `velocity`
Current velocity vector.

```javascript
aircraft.velocity: THREE.Vector3
```

##### `rotation`
Current rotation (Euler angles).

```javascript
aircraft.rotation: THREE.Euler
```

##### `throttle`
Throttle setting (0-1).

```javascript
aircraft.throttle: number
```

#### Methods

##### `update(deltaTime)`
Updates aircraft physics and visuals.

```javascript
aircraft.update(deltaTime: number): void
```

##### `setThrottle(value)`
Sets throttle level.

```javascript
aircraft.setThrottle(value: number): void
```

**Parameters**:
- `value` (number): Throttle from 0 to 1

##### `setControlInput(axis, value)`
Sets control input.

```javascript
aircraft.setControlInput(axis: 'pitch' | 'roll' | 'yaw', value: number): void
```

**Parameters**:
- `axis`: Control axis
- `value`: Input from -1 to 1

**Example**:
```javascript
aircraft.setControlInput('pitch', 0.5);  // Pitch up
aircraft.setControlInput('roll', -0.3);  // Roll left
```

##### `reset()`
Resets aircraft to initial state.

```javascript
aircraft.reset(): void
```

---

## Rendering API

### Renderer Class

Manages Three.js rendering.

```javascript
import { Renderer } from './engine/rendering/Renderer.js';

const renderer = new Renderer(canvas, config);
```

#### Constructor

```javascript
new Renderer(canvas: HTMLCanvasElement, config: RendererConfig): Renderer
```

#### Properties

##### `scene`
Three.js scene object.

```javascript
renderer.scene: THREE.Scene
```

##### `camera`
Three.js camera object.

```javascript
renderer.camera: THREE.PerspectiveCamera
```

#### Methods

##### `render()`
Renders the scene.

```javascript
renderer.render(): void
```

##### `resize(width, height)`
Resizes renderer.

```javascript
renderer.resize(width: number, height: number): void
```

##### `setQuality(quality)`
Sets rendering quality.

```javascript
renderer.setQuality(quality: 'low' | 'medium' | 'high' | 'ultra'): void
```

---

## Environment API

### Environment Class

Manages the game world.

```javascript
import { Environment } from './engine/environment/Environment.js';

const environment = new Environment(scene, config);
```

#### Methods

##### `setTimeOfDay(hour)`
Sets time of day.

```javascript
environment.setTimeOfDay(hour: number): void
```

**Parameters**:
- `hour` (number): Hour of day (0-24)

**Example**:
```javascript
environment.setTimeOfDay(6);   // Dawn
environment.setTimeOfDay(12);  // Noon
environment.setTimeOfDay(18);  // Dusk
```

##### `setWeather(conditions)`
Sets weather conditions.

```javascript
environment.setWeather(conditions: WeatherConditions): void
```

**Parameters**:
```javascript
interface WeatherConditions {
    cloudDensity: number;  // 0-1
    rainIntensity: number; // 0-1
    windSpeed: number;     // m/s
    windDirection: number; // degrees
}
```

**Example**:
```javascript
environment.setWeather({
    cloudDensity: 0.7,
    rainIntensity: 0.3,
    windSpeed: 5,
    windDirection: 90
});
```

---

## Input API

### InputHandler Class

Handles all input devices.

```javascript
import { InputHandler } from './engine/controls/InputHandler.js';

const input = new InputHandler();
```

#### Methods

##### `getAxis(axis)`
Gets current axis value.

```javascript
input.getAxis(axis: string): number
```

**Parameters**:
- `axis`: Axis name ('pitch', 'roll', 'yaw', 'throttle')

**Returns**: Value from -1 to 1 (or 0 to 1 for throttle)

**Example**:
```javascript
const pitch = input.getAxis('pitch');
const roll = input.getAxis('roll');
```

##### `isKeyPressed(key)`
Checks if key is pressed.

```javascript
input.isKeyPressed(key: string): boolean
```

##### `setKeyBinding(action, key)`
Sets key binding.

```javascript
input.setKeyBinding(action: string, key: string): void
```

**Example**:
```javascript
input.setKeyBinding('pitchUp', 'w');
input.setKeyBinding('pitchDown', 's');
```

---

## HUD API

### HUD Class

Manages heads-up display.

```javascript
import { HUD } from './engine/utils/HUD.js';

const hud = new HUD(container);
```

#### Methods

##### `update(data)`
Updates HUD display.

```javascript
hud.update(data: HUDData): void
```

**Parameters**:
```javascript
interface HUDData {
    airspeed: number;      // knots
    altitude: number;      // feet
    heading: number;       // degrees
    verticalSpeed: number; // fpm
    throttle: number;      // 0-1
    gForce: number;
}
```

**Example**:
```javascript
hud.update({
    airspeed: 120,
    altitude: 1500,
    heading: 90,
    verticalSpeed: 500,
    throttle: 0.75,
    gForce: 1.2
});
```

##### `setMode(mode)`
Sets HUD display mode.

```javascript
hud.setMode(mode: 'minimal' | 'standard' | 'full'): void
```

##### `show()` / `hide()`
Shows or hides HUD.

```javascript
hud.show(): void
hud.hide(): void
```

---

## Configuration API

### Config Objects

#### EngineConfig

```javascript
interface EngineConfig {
    canvas: HTMLCanvasElement;
    physicsHz?: number;        // Default: 60
    quality?: string;          // Default: 'high'
    enableShadows?: boolean;   // Default: true
    enableFog?: boolean;       // Default: true
}
```

#### AircraftConfig

See Aircraft API section.

#### EnvironmentConfig

```javascript
interface EnvironmentConfig {
    terrain?: {
        size: number;
        heightScale: number;
        textureResolution: number;
    };
    airports?: Array<AirportConfig>;
    weather?: WeatherConditions;
    timeOfDay?: {
        startTime: number;
        timeSpeed: number;
    };
}
```

---

## Events API

### Event System

Subscribe to engine events.

```javascript
engine.on(event: string, callback: Function): void
engine.off(event: string, callback: Function): void
engine.emit(event: string, data: any): void
```

#### Available Events

- `'start'` - Engine started
- `'stop'` - Engine stopped
- `'pause'` - Engine paused
- `'resume'` - Engine resumed
- `'update'` - Frame update (emitted every frame)
- `'crash'` - Aircraft crashed
- `'stall'` - Aircraft stalled
- `'touchdown'` - Aircraft landed

**Example**:
```javascript
engine.on('touchdown', (data) => {
    console.log('Landed!', data);
});

engine.on('stall', () => {
    console.warn('STALL!');
});
```

---

## Utility Functions

### MathUtils

```javascript
import { MathUtils } from './engine/utils/MathUtils.js';
```

#### `clamp(value, min, max)`
Clamps value between min and max.

```javascript
MathUtils.clamp(value: number, min: number, max: number): number
```

#### `lerp(a, b, t)`
Linear interpolation.

```javascript
MathUtils.lerp(a: number, b: number, t: number): number
```

#### `smoothstep(edge0, edge1, x)`
Smooth interpolation.

```javascript
MathUtils.smoothstep(edge0: number, edge1: number, x: number): number
```

#### `degToRad(degrees)`
Converts degrees to radians.

```javascript
MathUtils.degToRad(degrees: number): number
```

#### `radToDeg(radians)`
Converts radians to degrees.

```javascript
MathUtils.radToDeg(radians: number): number
```

---

## TypeScript Definitions

Full TypeScript definitions are available in `types/index.d.ts`.

```typescript
declare module 'avion' {
    export class Engine {
        constructor(config: EngineConfig);
        start(): void;
        stop(): void;
        // ...
    }
    
    export interface EngineConfig {
        canvas: HTMLCanvasElement;
        physicsHz?: number;
        quality?: 'low' | 'medium' | 'high' | 'ultra';
    }
    
    // ... more definitions
}
```

---

## Error Handling

### Error Types

```javascript
// Configuration error
class ConfigError extends Error {}

// Physics calculation error
class PhysicsError extends Error {}

// Resource loading error
class LoadError extends Error {}
```

### Error Handling Example

```javascript
try {
    const engine = new Engine(config);
    engine.start();
} catch (error) {
    if (error instanceof ConfigError) {
        console.error('Configuration error:', error.message);
    } else if (error instanceof LoadError) {
        console.error('Failed to load resources:', error.message);
    } else {
        console.error('Unknown error:', error);
    }
}
```

---

## Complete Example

```javascript
import { Engine } from './engine/core/Engine.js';
import { AircraftFactory } from './engine/aircraft/AircraftFactory.js';

// Create engine
const engine = new Engine({
    canvas: document.getElementById('canvas'),
    quality: 'high'
});

// Create aircraft
const aircraft = AircraftFactory.create('cessna172');
engine.addAircraft(aircraft);

// Set up event listeners
engine.on('touchdown', (data) => {
    console.log(`Landed at ${data.speed} kt`);
});

// Handle controls
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'w':
            aircraft.setControlInput('pitch', 1);
            break;
        case 's':
            aircraft.setControlInput('pitch', -1);
            break;
        // ... more controls
    }
});

// Start engine
engine.start();
```

---

For more examples, see the `/examples` directory in the repository.
