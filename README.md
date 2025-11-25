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

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
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
