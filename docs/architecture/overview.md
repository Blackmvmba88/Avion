# Architecture Overview

## Avion Engine - System Architecture

Avion is a modular 3D flight simulator built with a clean, scalable architecture that separates concerns into distinct systems.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Application Layer                    │
│                    (main.js, game/)                      │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────┴─────────────────────────────────────┐
│                     Engine Core                          │
│              (engine/core/, Loop, Time)                  │
└─┬──────────┬──────────┬──────────┬──────────┬──────────┘
  │          │          │          │          │
  │          │          │          │          │
┌─▼─────┐ ┌─▼──────┐ ┌─▼────────┐ ┌─▼──────┐ ┌─▼──────┐
│Physics│ │Rendering│ │ Controls │ │Aircraft│ │Environ.│
│System │ │ System  │ │  System  │ │ System │ │ System │
└───────┘ └─────────┘ └──────────┘ └────────┘ └────────┘
```

## Core Principles

### 1. Modularity
Each system is self-contained and communicates through well-defined interfaces.

### 2. Separation of Concerns
- **Physics**: Pure calculations, no rendering
- **Rendering**: Visual representation, no game logic
- **Controls**: Input handling, no simulation logic

### 3. Scalability
The architecture supports:
- Adding new aircraft types
- Expanding environment features
- Implementing new game modes
- Mobile platform optimization

## Module Structure

### Engine Core (`engine/core/`)
- **Engine.js**: Main engine orchestrator
- **Time.js**: Time management and delta time calculation
- **Loop.js**: Game loop with fixed timestep physics

### Physics System (`engine/physics/`)
- **FlightPhysics.js**: Aerodynamic calculations
- **GroundEffect.js**: Ground effect modeling
- **Wind.js**: Wind and turbulence
- **Atmosphere.js**: Air density and atmospheric conditions

### Rendering System (`engine/rendering/`)
- **Renderer.js**: Three.js scene management
- **CameraController.js**: Camera system
- **Shaders/**: Custom shaders for sky, water, atmosphere
- **LOD.js**: Level of detail management

### Controls System (`engine/controls/`)
- **InputHandler.js**: Base input handling
- **TouchControls.js**: Mobile touch interface
- **GamepadControls.js**: Controller support
- **Keybindings.js**: Configurable key mappings

### Aircraft System (`engine/aircraft/`)
- **Aircraft.js**: Base aircraft class
- **AircraftFactory.js**: Aircraft creation and management
- **models/**: Specific aircraft implementations

### Environment System (`engine/environment/`)
- **Environment.js**: Environment orchestrator
- **TerrainGenerator.js**: Procedural terrain
- **Airport.js**: Airport generation
- **Weather.js**: Weather simulation
- **WaterBody.js**: Water rendering
- **TimeOfDay.js**: Day/night cycle
- **Clouds.js**: Cloud system

### Utils (`engine/utils/`)
- **HUD.js**: Heads-up display
- **MathUtils.js**: Math helper functions
- **Logger.js**: Logging system
- **Profiler.js**: Performance profiling

## Data Flow

```
User Input → Controls → Aircraft State → Physics Update
                                              ↓
                                         Position/Rotation
                                              ↓
                                         Rendering
```

## Configuration System

Configuration files in `src/config/` provide:
- Engine settings (physics timestep, rendering quality)
- Aircraft parameters (mass, wing area, drag coefficients)
- Environment settings (terrain, weather, time)
- Mobile-specific optimizations

## Extension Points

The architecture provides clear extension points for:
- Custom aircraft types
- New mission types
- Additional weather conditions
- Custom terrain features
- New control schemes

## Performance Considerations

- Fixed timestep physics (60 Hz) for consistency
- Variable timestep rendering for smooth visuals
- Object pooling for particles and effects
- LOD system for distant objects
- Efficient Three.js scene graph management
