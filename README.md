# Avion - Flight Simulator

A modular 3D flight simulator built with Three.js featuring realistic flight physics, intuitive controls, and a scalable architecture ready for future expansion.

![Flight Simulator](https://img.shields.io/badge/Status-Active%20Development-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![Three.js](https://img.shields.io/badge/Three.js-v0.160-orange)

## 🎮 Features

- **Realistic Flight Physics**
  - Lift, drag, and thrust calculations
  - Air density variations with altitude
  - Angle of attack modeling with stall behavior
  - Gravity and ground collision detection

- **3D Graphics**
  - Stylized aircraft model
  - Environment with runway, buildings, and trees
  - Dynamic sky with gradient shader
  - Shadow mapping and fog effects

- **Camera System**
  - Smooth chase camera with lag
  - User-controlled orbit and zoom
  - Multiple view modes (chase, orbit)

- **HUD Display**
  - Altitude and airspeed indicators
  - Throttle gauge
  - Heading, pitch, and roll display
  - FPS counter

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
# Clone the repository
git clone https://github.com/your-username/avion.git
cd avion

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser at `http://localhost:5173` to start flying!

### Build for Production

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

For detailed documentation, see [NEW_FEATURES.md](docs/NEW_FEATURES.md)

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

### Phase 3: Advanced Physics (Planned)
- [ ] More accurate flight model
- [ ] Ground effect
- [ ] Wind and turbulence
- [ ] Stall and spin dynamics
- [ ] Landing gear physics

### Phase 4: Aircraft Expansion (Planned)
- [ ] Multiple aircraft types
- [ ] Customizable aircraft parameters
- [ ] Aircraft damage model
- [ ] Fuel system

### Phase 5: Gameplay Features (Planned)
- [ ] Mission system
- [ ] Waypoint navigation
- [ ] Instrument panel (cockpit view)
- [ ] Multiplayer support
- [ ] Achievements and scoring

### Phase 6: Polish (Planned)
- [ ] Sound effects and engine audio
- [ ] Particle effects (exhaust, contrails)
- [ ] Settings menu
- [ ] Save/load functionality
- [ ] Mobile touch controls

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

**Custom Environment Objects:**
```javascript
import { Environment } from './environment/Environment.js';

// Create environment with custom configuration
const environment = new Environment(scene, {
    useTerrain: true,
    useWater: true,
    enableDayNightCycle: true,
    enableWeather: true,
    timeOfDay: {
        startTime: 6,      // Start at 6 AM
        timeSpeed: 100,    // 100x real-time
        cycleDuration: 24  // 24 minutes for full cycle
    },
    weather: {
        cloudDensity: 0.7, // 0-1
        rainIntensity: 0.3, // 0-1
        windSpeed: 2
    }
});

// Control time of day
environment.setTimeOfDay(18); // Set to 6 PM (sunset)

// Change weather
environment.setWeather({
    cloudDensity: 0.9,
    rainIntensity: 0.6,
    windSpeed: 3
});
```

**Adding Custom Airports:**
```javascript
import { Airport } from './environment/Airport.js';

const customAirport = new Airport(scene, {
    position: new THREE.Vector3(1000, 0, 1000),
    runwayLength: 2500,
    runwayWidth: 60,
    name: 'Custom Airport',
    heading: 90  // Runway heading in degrees
});
customAirport.build();
```

### Performance Considerations
- Fixed timestep physics (60 Hz) for consistency
- Variable timestep rendering for smooth visuals
- Efficient Three.js object management
- Shadow map optimization

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) - 3D graphics library
- [Vite](https://vitejs.dev/) - Build tool
- Flight dynamics references from NASA and aviation literature
