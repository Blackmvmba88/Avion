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
- **Environment**: Ground, sky, runway, buildings, trees
- Extensible for terrain systems

#### Utils Module (`/utils`)
Utility classes:
- **HUD**: On-screen flight information display

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

### Phase 2: Enhanced Environment (Planned)
- [ ] Terrain system with heightmaps
- [ ] Multiple airports/runways
- [ ] Water bodies
- [ ] Day/night cycle
- [ ] Basic weather (clouds, rain)

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
// In Environment.js, add new methods like:
createMountains() {
    // Add mountain geometry
}
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
