# Avion

A basic flight simulator with modular architecture built using Three.js.

## Features

- 3D aircraft with realistic flight physics
- Sky dome with gradient shader
- Terrain with trees and grid
- Keyboard controls for flight
- HUD with speed, altitude, and throttle display
- Follow camera system

## Project Structure

```
src/
├── physics/          # Flight dynamics and physics calculations
│   ├── FlightDynamics.js
│   └── index.js
├── rendering/        # Three.js scene and rendering
│   ├── SceneRenderer.js
│   └── index.js
├── controls/         # User input handling
│   ├── InputHandler.js
│   └── index.js
├── aircraft/         # Aircraft models
│   ├── BasicPlane.js
│   └── index.js
├── environment/      # Environment elements (sky, terrain)
│   ├── Sky.js
│   ├── Terrain.js
│   └── index.js
└── main.js          # Main entry point
```

- **🌐 Internationalization (i18n)**
  - Support for 5 languages: English, Spanish, French, German, Portuguese
  - Auto-detect browser language
  - Easy language switching
  - Fully translatable UI

- **📱 Multiplatform Support**
  - Automatic platform detection (Desktop, Mobile, Tablet)
  - Platform-specific optimizations
  - Touch control support
  - Responsive UI adaptation
  - OS detection (iOS, Android, Windows, macOS, Linux)

- **🔌 Connectivity Infrastructure**
  - WebSocket support for multiplayer
  - Automatic reconnection with exponential backoff
  - Message type system
  - Connection status monitoring
  - Heartbeat/ping-pong mechanism

- **🎮 Godot Engine Integration**
  - Real-time WebSocket communication with Godot
  - Bidirectional data exchange (aircraft state, physics, controls)
  - GDScript client for easy Godot integration
  - Support for custom events and commands
  - Configurable update rates and data filtering

- **🔄 Backward Compatibility**
  - Version management system
  - Automatic data migration
  - Feature flags
  - Deprecation tracking
  - Breaking change documentation

- **⚡ Optimization & Validation**
  - Configuration validation
  - Performance utilities (throttle, debounce, pooling)
  - Platform-optimized rendering settings
  - Memory management helpers

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run build
npm run preview
```

## 🎯 Controls

| Control | Key |
|---------|-----|
| **Pitch Up** | W |
| **Pitch Down** | S |
| **Roll Left** | A |
| **Roll Right** | D |
| **Yaw Left** | Q |
| **Yaw Right** | E |
| **Increase Throttle** | Shift |
| **Decrease Throttle** | Ctrl |
| **Camera Pan** | Arrow Keys |
| **Camera Zoom** | +/- or Mouse Wheel |
| **Mouse Look** | Click on canvas |
| **Reset Camera** | R |
| **Reset Aircraft** | Backspace |
| **Pause** | P |

## 🏗️ Architecture

The simulator follows a modular architecture designed for scalability and maintainability:

```
src/
├── main.js              # Application entry point and game loop
├── physics/
│   ├── index.js         # Physics module exports
│   └── FlightPhysics.js # Aerodynamic force calculations
├── rendering/
│   ├── index.js         # Rendering module exports
│   ├── Renderer.js      # Three.js scene and renderer setup
│   └── CameraController.js # Camera follow and control system
├── controls/
│   ├── index.js         # Controls module exports
│   └── InputHandler.js  # Keyboard and mouse input handling
├── aircraft/
│   ├── index.js         # Aircraft module exports
│   └── Aircraft.js      # Aircraft model and state management
├── environment/
│   ├── index.js         # Environment module exports
│   └── Environment.js   # World objects (runway, buildings, sky)
└── utils/
    ├── index.js         # Utils module exports
    └── HUD.js           # Heads-up display
```

### Module Descriptions

#### Physics Module (`/physics`)
Handles all aerodynamic calculations including:
- **Lift Force**: Based on wing area, air density, airspeed, and lift coefficient
- **Drag Force**: Calculated using drag polar equation with induced drag
- **Thrust Force**: Engine output based on throttle setting
- **Air Density**: Exponential atmosphere model varying with altitude
- **Angle of Attack**: Calculated from velocity and aircraft orientation
- **Gravity**: Constant downward force based on mass

#### Rendering Module (`/rendering`)
Manages 3D visualization:
- **Renderer**: Three.js WebGL setup, lighting, shadows, fog
- **CameraController**: Smooth camera follow with user orbit control

#### Controls Module (`/controls`)
Handles all user input:
- **InputHandler**: Keyboard and mouse event processing
- Configurable key bindings
- Sensitivity settings

#### Aircraft Module (`/aircraft`)
Aircraft model and behavior:
- **Aircraft**: 3D model generation, physics integration, state management
- Modular design for adding new aircraft types

#### Environment Module (`/environment`)
World building:
- **Environment**: Manages all environmental systems
- **TerrainGenerator**: Procedural terrain with heightmaps using Perlin noise
- **Airport**: Modular airport generation with runways, taxiways, and buildings
- **WaterBody**: Animated water surfaces with shader effects
- **TimeOfDay**: Dynamic day/night cycle with sun/moon positioning
- **Weather**: Cloud generation and rain particle effects

#### Utils Module (`/utils`)
Utility classes:
- **HUD**: On-screen flight information display
- **I18n**: Internationalization system with 5 languages
- **PlatformDetector**: Platform and feature detection
- **Optimizer**: Performance optimization utilities (throttle, debounce, pooling)
- **Validator**: Configuration and data validation
- **ConnectionManager**: Network connectivity with auto-reconnection
- **VersionManager**: Version compatibility and data migration
- **AppInitializer**: Unified application initialization system

#### Locales Module (`/locales`)
Translation files:
- **en**: English translations
- **es**: Spanish translations
- **fr**: French translations
- **de**: German translations
- **pt**: Portuguese translations

#### Config Module (`/config`)
Configuration files:
- **network.config.js**: Network and connectivity settings
- **compatibility.config.js**: Version compatibility and feature flags
- **mobile.config.js**: Mobile platform optimizations
- **engine.config.js**: Core engine configuration
- **aircraft.config.js**: Aircraft parameters
- **environment.config.js**: Environment settings

## 🆕 New Features (v1.0)

### Internationalization (i18n)
The simulator now supports 5 languages with easy switching:

```javascript
import i18n from './utils/I18n.js';

// Set language
i18n.setLocale('es'); // Spanish

// Get translated text
const text = i18n.t('hud.altitude'); // "Altitud"
```

**Supported Languages:**
- 🇬🇧 English (en)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇵🇹 Portuguese (pt)

### Multiplatform Support
Automatic detection and optimization for different platforms:

```javascript
import platformDetector from './utils/PlatformDetector.js';

// Detect platform
const platform = platformDetector.platform;
console.log(platform.isMobile); // true/false
console.log(platform.isIOS);    // true/false

// Get recommended settings
const settings = platformDetector.getRecommendedSettings();
```

### Connectivity
Ready for multiplayer with WebSocket support:

```javascript
import { ConnectionManager } from './utils/ConnectionManager.js';

const connection = new ConnectionManager();
await connection.connect('ws://server.com');

// Send/receive messages
connection.send('player_update', data);
connection.on('state_sync', (data) => { ... });
```

### Backward Compatibility
Version management ensures smooth upgrades:

```javascript
import versionManager from './utils/VersionManager.js';

// Automatically migrate old save data
const migrated = await versionManager.migrate(oldData, '0.5.0');
```

### Performance Optimization
Built-in utilities for optimal performance:

```javascript
import { Optimizer } from './utils/Optimizer.js';

// Throttle expensive operations
const throttled = Optimizer.throttle(updateFn, 100);

// Object pooling
const pool = Optimizer.createPool(() => new Particle(), 100);
```

### Godot Engine Integration
Seamlessly integrate Avion's flight physics with Godot Engine:

```javascript
import { GodotBridge } from './integrations/GodotBridge.js';

// Create bridge and connect to Godot
const godotBridge = new GodotBridge({
    updateRate: 60,           // Updates per second
    includePhysics: true,     // Send physics data
    includeEnvironment: true  // Send environment data
});

await godotBridge.initialize('ws://localhost:9090');

// Set data sources
godotBridge.setDataSources({
    aircraft: yourAircraftObject,
    physics: yourPhysicsObject,
    environment: yourEnvironmentObject
});

// Handle control inputs from Godot
godotBridge.onControlInput((data) => {
    aircraft.setPitch(data.pitch);
    aircraft.setRoll(data.roll);
    aircraft.setThrottle(data.throttle);
});
```

**Features:**
- Real-time WebSocket communication
- Bidirectional data exchange (state, physics, controls)
- GDScript client for Godot projects
- Configurable update rates
- Custom event system

See [Godot Integration Guide](docs/integrations/godot-integration.md) for complete documentation.

For detailed documentation, see [NEW_FEATURES.md](docs/NEW_FEATURES.md)

### Advanced Physics (Phase 3)
The simulator includes integrated advanced physics for realistic flight behavior:

```javascript
import { AdvancedAircraft } from './aircraft/AdvancedAircraft.js';
import { TurbulenceType } from './physics/IntegratedFlightPhysics.js';

// Create an aircraft with advanced physics
const aircraft = new AdvancedAircraft({
    name: 'MyJet',
    aircraft: {
        mass: 2000,
        wingArea: 20,
        wingSpan: 12,
        maxThrust: 30000,
        stallAngle: 18,
        stallSpeed: 45
    },
    wind: {
        enabled: true,
        speed: 10,
        direction: 270, // from west
        turbulenceType: TurbulenceType.LIGHT,
        gustEnabled: true
    }
});

// Check flight status
console.log(aircraft.isStalled());        // Stall detection
console.log(aircraft.isInGroundEffect()); // Ground effect status
console.log(aircraft.isOnGround());       // Landing gear contact

// Control landing gear and brakes
aircraft.toggleLandingGear();
aircraft.setBrakes(0.5);
aircraft.toggleParkingBrake();
```

**Available Physics Systems:**
- **AdvancedFlightModel**: ISA atmosphere, Mach number effects, accurate lift/drag polar
- **GroundEffect**: Increased lift and reduced induced drag when close to ground
- **WindSystem**: Steady wind, gusts, turbulence, thermals, and wind shear
- **StallSpinDynamics**: Stall warnings, buffet, wing drop, and spin entry/recovery
- **LandingGear**: Spring-damper suspension, wheel brakes, nosewheel steering

### Aircraft Expansion (Phase 4)
The simulator includes a complete aircraft expansion system for managing multiple aircraft types:

```javascript
import { 
    AircraftFactory, 
    aircraftRegistry, 
    AircraftParameters,
    DamageModel,
    FuelSystem 
} from './aircraft/index.js';

// Create aircraft from registered types
const cessna = AircraftFactory.create('cessna172');
const f22 = AircraftFactory.create('f22');

// List available aircraft types
const types = AircraftFactory.getAvailableTypes();
console.log(types); // [{id: 'basicJet', name: 'Basic Jet'}, ...]

// Customize aircraft parameters
const params = new AircraftParameters({
    mass: 1200,
    wingArea: 18,
    maxThrust: 25000
});
console.log(params.getDerivedParams()); // aspectRatio, wingLoading, etc.

// Aircraft damage model
const damage = new DamageModel({ maxGLoad: 6, maxSpeed: 250 });
damage.applyDamage('leftWing', 25, 'collision', 'Bird strike');
const effects = damage.update({ airspeed: 200, loadFactor: 2, isOnGround: false }, 0.016);
console.log(effects.liftMultiplier); // Reduced lift from damage

// Fuel system
const fuel = new FuelSystem({ 
    fuelType: 'JET_A',
    baseConsumptionRate: 0.5 
});
fuel.consumeFuel({ throttle: 0.8, altitude: 5000, airspeed: 150 }, 0.016);
console.log(fuel.calculateRange({ throttle: 0.7, airspeed: 120 })); // range, endurance
```

**Available Systems:**
- **AircraftRegistry**: Centralized store for aircraft type definitions
- **AircraftFactory**: Factory pattern for creating aircraft instances
- **AircraftParameters**: Customizable parameters with validation and bounds
- **DamageModel**: Component-based damage tracking with performance effects
- **FuelSystem**: Multi-tank fuel management with consumption modeling

### Gameplay Features (Phase 5)
The simulator now includes comprehensive gameplay features for missions, navigation, and multiplayer:

```javascript
import { 
    MissionManager, 
    createSampleMissions,
    WaypointNavigation, 
    Waypoint,
    InstrumentPanel,
    MultiplayerManager,
    AchievementSystem,
    ScoreManager,
    createDefaultAchievements
} from './game/index.js';

// Mission System
const missionManager = new MissionManager();
createSampleMissions().forEach(m => missionManager.registerMission(m));

// Start a mission
missionManager.startMission('mission_01_takeoff');
missionManager.on('missionCompleted', ({ mission }) => {
    console.log(`Completed: ${mission.name} with score ${mission.score}`);
});

// Waypoint Navigation
const navigation = new WaypointNavigation();
navigation.addWaypoint({ name: 'Alpha', x: 1000, y: 500, z: 0 });
navigation.addWaypoint({ name: 'Bravo', x: 2000, y: 500, z: 1000 });
navigation.start();

// Instrument Panel (Cockpit View)
const instruments = new InstrumentPanel();
instruments.show();
instruments.update({
    pitch: 5, roll: 0, heading: 90,
    altitude: 3000, airspeed: 150, throttle: 0.7
});

// Multiplayer
const multiplayer = new MultiplayerManager();
await multiplayer.connect('ws://server.com', { name: 'Pilot1' });
multiplayer.joinRoom('room123');
multiplayer.on('playerJoined', ({ player }) => console.log(`${player.name} joined!`));

// Achievements
const achievements = new AchievementSystem({ 
    achievements: createDefaultAchievements() 
});
achievements.on('achievementUnlocked', ({ achievement }) => {
    console.log(`Unlocked: ${achievement.name}!`);
});

// Scoring
const scoring = new ScoreManager();
scoring.recordLanding({ quality: 'perfect' });
scoring.on('scoreAdded', ({ totalPoints }) => console.log(`+${totalPoints} points!`));
```

**Available Systems:**
- **MissionManager**: Mission lifecycle, objectives, and progress tracking
- **Mission**: Individual missions with multiple objectives and scoring
- **WaypointNavigation**: Flight plan management with 3D waypoint markers
- **Waypoint**: Individual navigation points with capture radius
- **InstrumentPanel**: Full cockpit instrument display (attitude, altitude, airspeed, etc.)
- **MultiplayerManager**: Room-based multiplayer with player synchronization
- **AchievementSystem**: Achievements with categories, rarity, and progress tracking
- **ScoreManager**: Points, combos, multipliers, and session statistics

### Polish Features (Phase 6)
The simulator now includes complete polish features for a fully-featured experience:

```javascript
import { AudioManager, AudioType } from './audio/index.js';
import { ParticleSystem, ParticleType } from './effects/index.js';
import { SettingsMenu, SaveManager } from './game/index.js';
import { TouchControls } from './mobile/index.js';

// Audio System
const audio = new AudioManager({
    masterVolume: 1.0,
    engineVolume: 0.7,
    enabled: true
});
await audio.initialize();
audio.startEngineSound();
audio.startWindSound();
audio.update({ throttle: 0.8, airspeed: 150 });

// Particle Effects
const particles = new ParticleSystem({ quality: 'high' });
particles.createExhaustEmitters([
    new THREE.Vector3(-1.5, 0, -4),
    new THREE.Vector3(1.5, 0, -4)
]);
particles.createContrailEmitters([
    new THREE.Vector3(-6, 0, -0.5),
    new THREE.Vector3(6, 0, -0.5)
]);
scene.add(particles.getObject3D());
particles.update(deltaTime, { position, rotation, velocity, throttle, altitude });

// Settings Menu
const settingsMenu = new SettingsMenu({
    onChange: (path, value) => {
        console.log(`Setting ${path} changed to ${value}`);
    }
});
settingsMenu.show();

// Save/Load
const saves = new SaveManager();
saves.save({ position, velocity, throttle }, 'My Save');
const loaded = saves.load(slotId);
saves.autoSave(gameState);

// Mobile Touch Controls
if (TouchControls.isTouchDevice()) {
    const touch = new TouchControls({
        onControlChange: (controls) => {
            // { pitch, roll, yaw, throttle, buttons }
        },
        onButtonPress: (buttonId, pressed) => {
            console.log(`Button ${buttonId}: ${pressed}`);
        }
    });
    touch.show();
}
```

**Available Systems:**
- **AudioManager**: Engine sounds, wind, effects using Web Audio API
- **ParticleSystem**: GPU-optimized exhaust, contrails, smoke effects
- **SettingsManager**: Persistent user preferences with categories
- **SettingsMenu**: Visual settings UI with tabs and controls
- **SaveManager**: Game state persistence with auto-save support
- **TouchControls**: Virtual joysticks and buttons for mobile

## 📐 Physics Model

### Lift Equation
```
L = 0.5 × ρ × V² × S × CL
```
Where:
- ρ = Air density (kg/m³)
- V = Airspeed (m/s)
- S = Wing area (m²)
- CL = Lift coefficient (varies with angle of attack)

### Drag Equation
```
D = 0.5 × ρ × V² × S × CD
CD = CD0 + CL²/(π × AR × e)
```
Where:
- CD0 = Parasitic drag coefficient
- AR = Aspect ratio
- e = Oswald efficiency factor

### Air Density Model
```
ρ(h) = ρ0 × e^(-h/H)
```
Where:
- ρ0 = Sea level density (1.225 kg/m³)
- h = Altitude (m)
- H = Scale height (8500 m)

## 🗺️ Roadmap

### Phase 1: Core Foundation ✅
- [x] Project structure and build system
- [x] Basic flight physics (lift, drag, thrust, gravity)
- [x] Simple aircraft model
- [x] Camera follow system
- [x] Input handling
- [x] Basic HUD

### Phase 2: Enhanced Environment ✅
- [x] Terrain system with heightmaps
- [x] Multiple airports/runways
- [x] Water bodies
- [x] Day/night cycle
- [x] Basic weather (clouds, rain)

### Phase 3: Advanced Physics ✅
- [x] More accurate flight model (ISA atmosphere, Mach effects, aspect ratio)
- [x] Ground effect (increased lift, reduced drag near ground)
- [x] Wind and turbulence (gusts, thermals, wind shear)
- [x] Stall and spin dynamics (stall warnings, buffet, spin recovery)
- [x] Landing gear physics (suspension, braking, steering)

### Phase 4: Aircraft Expansion ✅
- [x] Multiple aircraft types (AircraftRegistry, AircraftFactory)
- [x] Customizable aircraft parameters (AircraftParameters)
- [x] Aircraft damage model (DamageModel)
- [x] Fuel system (FuelSystem)

### Phase 5: Gameplay Features ✅
- [x] Mission system (MissionManager, Mission, Objectives)
- [x] Waypoint navigation (WaypointNavigation, Waypoint with 3D markers)
- [x] Instrument panel (cockpit view with flight instruments)
- [x] Multiplayer support (MultiplayerManager, PlayerState, Rooms)
- [x] Achievements and scoring (AchievementSystem, ScoreManager)

### Phase 6: Polish ✅
- [x] Sound effects and engine audio (AudioManager)
- [x] Particle effects (exhaust, contrails) (ParticleSystem)
- [x] Settings menu (SettingsManager, SettingsMenu)
- [x] Save/load functionality (SaveManager)
- [x] Mobile touch controls (TouchControls)

## 🛠️ Development

### Code Style
- ES6+ JavaScript with modules
- Well-commented code with JSDoc
- Consistent naming conventions
- Modular, single-responsibility classes

### Adding New Features

**New Aircraft Type:**
```javascript
import { Aircraft } from './aircraft/Aircraft.js';

const fighterJet = new Aircraft({
    name: 'Fighter',
    physics: {
        mass: 8000,
        wingArea: 25,
        maxThrust: 80000,
        dragCoefficient: 0.015,
        liftCoefficient: 0.8
    },
    visual: {
        color: 0x333333,
        scale: 2.0
    }
});
```

This will start a development server at `http://localhost:3000`.

### Build

```bash
npm run build
```

## Controls

| Key | Action |
|-----|--------|
| W / ↑ | Pitch down (nose down) |
| S / ↓ | Pitch up (nose up) |
| A / ← | Roll left |
| D / → | Roll right |
| Q | Yaw left |
| E | Yaw right |
| Shift | Increase throttle |
| Ctrl | Decrease throttle |
| R | Reset position |

## Technologies

- [Three.js](https://threejs.org/) - 3D graphics library
- [Vite](https://vitejs.dev/) - Build tool and development server

## License

MIT
