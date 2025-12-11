# Avion Export Tools

This directory contains tools for exporting and integrating Avion flight simulator with external platforms.

## Godot Integration

### Files

- **`godot_client.gd`** - GDScript client for Godot 3.x to connect to Avion
- **`godot_client_v4.gd`** - GDScript client for Godot 4.x (uses WebSocketPeer)
- **`ws-server.js`** - WebSocket relay server for Avion-Godot communication

### Quick Start

#### 1. Start the WebSocket Server

```bash
cd tools/export
npm install ws
node ws-server.js
```

The server will run on `ws://localhost:9090` by default.

#### 2. Set up Avion

```javascript
import { GodotBridge } from './src/integrations/GodotBridge.js';

const bridge = new GodotBridge();
await bridge.initialize('ws://localhost:9090');

bridge.setDataSources({
    aircraft: yourAircraftObject,
    physics: yourPhysicsObject,
    environment: yourEnvironmentObject
});
```

#### 3. Set up Godot

1. Copy the appropriate client to your Godot project:
   - `godot_client.gd` for Godot 3.x
   - `godot_client_v4.gd` for Godot 4.x
2. Add it as a script to a Node in your scene
3. Connect to Avion:

```gdscript
extends Node

onready var avion = $AvionClient

func _ready():
    avion.server_url = "ws://localhost:9090"
    avion.connect_to_avion()
    avion.connect("aircraft_state_updated", self, "_on_state_update")

func _on_state_update(state):
    print("Aircraft altitude: ", state.altitude)
```

### Documentation

See [docs/integrations/godot-integration.md](../../docs/integrations/godot-integration.md) for complete documentation.

## WebSocket Server Options

```bash
# Run on default port (9090)
node ws-server.js

# Run on custom port
node ws-server.js 8080
```

### Features

- ✅ Automatic message relaying between clients
- ✅ Connection health monitoring (ping/pong)
- ✅ Statistics reporting
- ✅ Graceful shutdown
- ✅ Error handling

## Testing the Integration

### Test WebSocket Server

```bash
# Terminal 1: Start the server
node ws-server.js

# Terminal 2: Test with wscat (npm install -g wscat)
wscat -c ws://localhost:9090

# Send a test message
{"type":"test","data":{"message":"hello"}}
```

### Test with Avion and Godot

1. Start WebSocket server
2. Open Avion in browser
3. Run Godot project
4. Both should connect and exchange messages

## Troubleshooting

### "Cannot find module 'ws'"

Install the WebSocket library:
```bash
npm install ws
```

### Connection refused

- Check if the WebSocket server is running
- Verify the port is not in use: `lsof -i :9090`
- Check firewall settings

### Messages not relaying

- Check server logs for errors
- Verify both clients are connected
- Ensure JSON message format is correct

## Future Integrations

Planned integrations:
- Unity (C# client)
- Unreal Engine (Blueprint/C++ client)
- Python (for AI/ML training)
- REST API for general integration

## License

MIT License - See [LICENSE](../../LICENSE) file for details
