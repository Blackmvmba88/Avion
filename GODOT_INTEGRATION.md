# Godot Integration for Avion Flight Simulator

## Overview

This document provides a comprehensive overview of the Godot Engine integration for Avion flight simulator. The integration enables seamless communication between Avion (JavaScript/Web) and Godot Engine projects via WebSocket.

## 🎯 Features

- **Real-time Communication**: WebSocket-based bidirectional data exchange
- **Aircraft State Synchronization**: Position, velocity, rotation, speed, altitude, throttle
- **Physics Data Streaming**: Forces, angles, air data, stall/ground status
- **Environment Data**: Time of day, weather, atmosphere conditions
- **Control Input**: Send control inputs from Godot to Avion
- **Event System**: Custom events between platforms
- **Configurable Update Rates**: Adjustable from 1 Hz to 60 Hz
- **Automatic Reconnection**: With exponential backoff
- **Heartbeat Monitoring**: Connection health checking
- **Version Compatibility**: Support for both Godot 3.x and 4.x

## 📁 Files Added

### Core Integration
- `src/integrations/GodotBridge.js` - Main bridge class for WebSocket communication
- `src/integrations/index.js` - Module exports

### Client Implementations
- `tools/export/godot_client.gd` - Godot 3.x client (WebSocketClient)
- `tools/export/godot_client_v4.gd` - Godot 4.x client (WebSocketPeer)
- `tools/export/ws-server.js` - WebSocket relay server (Node.js)
- `tools/export/package.json` - NPM package configuration for server

### Documentation
- `docs/integrations/godot-integration.md` - Complete integration guide
- `tools/export/README.md` - Quick start guide

### Examples & Tests
- `src/examples/godot-integration-example.js` - Integration usage examples
- `src/examples/godot-demo.html` - Interactive HTML demo
- `tests/godot-bridge.test.js` - Comprehensive unit tests (8/8 passing)

### Documentation Updates
- `README.md` - Updated with Godot integration section

## 🚀 Quick Start

### 1. Start the WebSocket Server

```bash
cd tools/export
npm install
npm start
```

The server will run on `ws://localhost:9090`

### 2. Set up Avion (JavaScript)

```javascript
import { GodotBridge } from './src/integrations/GodotBridge.js';

const bridge = new GodotBridge({
    updateRate: 60,
    includePhysics: true,
    includeEnvironment: true
});

await bridge.initialize('ws://localhost:9090');

bridge.setDataSources({
    aircraft: yourAircraftObject,
    physics: yourPhysicsObject,
    environment: yourEnvironmentObject
});

bridge.onControlInput((data) => {
    // Handle controls from Godot
    aircraft.setPitch(data.pitch);
    aircraft.setRoll(data.roll);
    aircraft.setThrottle(data.throttle);
});
```

### 3. Set up Godot

**For Godot 3.x:**
```gdscript
extends Node

var avion_client = preload("res://godot_client.gd").new()

func _ready():
    add_child(avion_client)
    avion_client.server_url = "ws://localhost:9090"
    avion_client.connect("aircraft_state_updated", self, "_on_state_update")
    avion_client.connect_to_avion()

func _on_state_update(state):
    print("Altitude: ", state.altitude)
```

**For Godot 4.x:**
```gdscript
extends Node

var avion_client = preload("res://godot_client_v4.gd").new()

func _ready():
    add_child(avion_client)
    avion_client.server_url = "ws://localhost:9090"
    avion_client.aircraft_state_updated.connect(_on_state_update)
    avion_client.connect_to_avion()

func _on_state_update(state):
    print("Altitude: ", state.altitude)
```

## 📊 Data Flow

```
┌─────────────────┐                    ┌──────────────────┐                    ┌─────────────────┐
│  Avion (Web)    │                    │  WebSocket       │                    │  Godot Engine   │
│  Flight Sim     │◄──────────────────►│  Relay Server    │◄──────────────────►│  Game Project   │
│                 │   JSON Messages    │  (Node.js)       │   JSON Messages    │                 │
└─────────────────┘                    └──────────────────┘                    └─────────────────┘
        │                                                                               │
        ├─ Aircraft State ──────────────────────────────────────────────────────────►  │
        ├─ Physics Data ────────────────────────────────────────────────────────────►  │
        ├─ Environment Data ────────────────────────────────────────────────────────►  │
        ├─ Events ──────────────────────────────────────────────────────────────────►  │
        │                                                                               │
        │  ◄─────────────────────────────────────────────────────────── Control Inputs─┤
        │  ◄───────────────────────────────────────────────────────────── Commands ────┤
        │  ◄────────────────────────────────────────────────────────── Config Updates ─┤
```

## 🔌 Message Protocol

### Aircraft Update (Avion → Godot)
```json
{
    "type": "aircraft_update",
    "data": {
        "position": { "x": 0, "y": 100, "z": 0 },
        "velocity": { "x": 50, "y": 0, "z": 0 },
        "rotation": { "pitch": 5, "yaw": 90, "roll": 10 },
        "speed": 50,
        "altitude": 100,
        "throttle": 0.75
    }
}
```

### Control Input (Godot → Avion)
```json
{
    "type": "control_input",
    "data": {
        "pitch": 0.5,
        "roll": -0.3,
        "yaw": 0.0,
        "throttle": 0.75
    }
}
```

See [docs/integrations/godot-integration.md](docs/integrations/godot-integration.md) for complete protocol documentation.

## 🧪 Testing

All integration components have been tested:

```bash
# Run unit tests
node tests/godot-bridge.test.js

# Test results: 8/8 passing
✓ GodotBridge created successfully
✓ Aircraft state serialization works correctly
✓ Physics state serialization works correctly
✓ Environment state serialization works correctly
✓ Data sources set correctly
✓ Callbacks work correctly
✓ All message types are defined
✓ Status reporting works correctly
```

### Interactive Demo

Open `src/examples/godot-demo.html` in a browser (served via `npm run dev`) to test the integration with a visual interface.

## 🔒 Security

- ✅ No security vulnerabilities detected (CodeQL scan: 0 alerts)
- ✅ All code passes ESLint validation
- ✅ Input validation on all data serialization
- ✅ Proper error handling and connection management
- ✅ No hardcoded credentials or sensitive data

## 📚 Documentation

Complete documentation is available:

- **Integration Guide**: [docs/integrations/godot-integration.md](docs/integrations/godot-integration.md)
  - Setup instructions
  - Message protocol
  - API reference
  - Troubleshooting
  - Advanced usage examples

- **Quick Start**: [tools/export/README.md](tools/export/README.md)
  - Server setup
  - Basic examples
  - Testing guide

- **Examples**: [src/examples/godot-integration-example.js](src/examples/godot-integration-example.js)
  - Basic integration
  - Advanced customization
  - Monitoring and cleanup

## 🎮 Use Cases

1. **Flight Training Simulator**
   - Use Avion's physics in Godot for realistic flight training
   - Add custom UI and scoring in Godot
   - Leverage Avion's advanced physics calculations

2. **Arcade Flight Game**
   - Use Godot for gameplay and graphics
   - Use Avion for realistic flight physics
   - Customize aircraft parameters in real-time

3. **Multi-platform Flight Sim**
   - Run Avion physics on a server
   - Connect multiple Godot clients
   - Synchronized multiplayer experience

4. **Physics Visualization**
   - Display flight data from Avion in Godot
   - Create custom instruments and HUD
   - Educational and training purposes

## 🛠️ Configuration Options

### GodotBridge Configuration

```javascript
{
    updateRate: 60,           // Updates per second (1-60)
    autoStart: true,          // Start automatically after connection
    includePhysics: true,     // Include physics data in updates
    includeEnvironment: true  // Include environment data in updates
}
```

### WebSocket Server Configuration

```bash
# Default port
node ws-server.js

# Custom port
node ws-server.js 8080
```

## 🔧 Troubleshooting

### Connection Issues
- Ensure WebSocket server is running
- Check firewall settings
- Verify URL matches on both sides

### Performance Issues
- Reduce update rate (e.g., 30 Hz instead of 60 Hz)
- Disable environment updates if not needed
- Use local WebSocket server

See full troubleshooting guide in [docs/integrations/godot-integration.md](docs/integrations/godot-integration.md)

## 🚦 Status

**Implementation Status**: ✅ Complete

- [x] Core GodotBridge class
- [x] Data serialization (aircraft, physics, environment)
- [x] Godot 3.x client (GDScript)
- [x] Godot 4.x client (GDScript)
- [x] WebSocket relay server
- [x] Complete documentation
- [x] Unit tests (8/8 passing)
- [x] Interactive demo
- [x] Code review addressed
- [x] Security scan passed

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](docs/contributing/contributing.md) for guidelines.

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- See documentation in `docs/integrations/`
- Check examples in `src/examples/`

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Tested With**: Godot 3.x and 4.x, Node.js 18+
