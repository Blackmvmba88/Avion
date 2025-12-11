# Godot Integration Guide

This guide explains how to integrate Avion flight simulator with Godot Engine projects.

## Overview

The Avion-Godot integration allows you to:
- Use Avion's realistic flight physics in your Godot game
- Receive real-time aircraft state, physics data, and environment information
- Send control inputs from Godot to control the aircraft
- Synchronize game state between Avion and Godot

## Architecture

The integration uses WebSocket communication:

```
┌─────────────┐         WebSocket          ┌─────────────┐
│   Avion     │ ◄──────────────────────► │   Godot     │
│ (Web/JS)    │    JSON Messages          │  (GDScript) │
└─────────────┘                            └─────────────┘
```

## Quick Start

### 1. Set up Avion (JavaScript side)

```javascript
import { GodotBridge } from './src/integrations/GodotBridge.js';

// Create the bridge
const godotBridge = new GodotBridge({
    updateRate: 60,           // Updates per second
    includePhysics: true,     // Include physics data
    includeEnvironment: true  // Include environment data
});

// Initialize with WebSocket server URL
await godotBridge.initialize('ws://localhost:9090');

// Set data sources
godotBridge.setDataSources({
    aircraft: yourAircraftObject,
    physics: yourPhysicsObject,
    environment: yourEnvironmentObject
});

// Handle control inputs from Godot
godotBridge.onControlInput((data) => {
    console.log('Control from Godot:', data);
    // Apply controls to your aircraft
    aircraft.setPitch(data.pitch);
    aircraft.setRoll(data.roll);
    aircraft.setYaw(data.yaw);
    aircraft.setThrottle(data.throttle);
});

// Handle commands from Godot
godotBridge.onCommand((data) => {
    console.log('Command from Godot:', data.command);
});
```

### 2. Set up Godot (GDScript side)

```gdscript
# Add the godot_client.gd script to a Node
extends Node

onready var avion_client = preload("res://godot_client.gd").new()

func _ready():
    add_child(avion_client)
    
    # Connect signals
    avion_client.connect("aircraft_state_updated", self, "_on_aircraft_state_updated")
    avion_client.connect("physics_state_updated", self, "_on_physics_state_updated")
    
    # Connect to Avion
    avion_client.server_url = "ws://localhost:9090"
    avion_client.connect_to_avion()

func _process(delta):
    # Send control input to Avion
    var pitch = Input.get_action_strength("pitch_up") - Input.get_action_strength("pitch_down")
    var roll = Input.get_action_strength("roll_right") - Input.get_action_strength("roll_left")
    var yaw = Input.get_action_strength("yaw_right") - Input.get_action_strength("yaw_left")
    var throttle = Input.get_action_strength("throttle_up") * 1.0
    
    if avion_client.connected:
        avion_client.send_control_input(pitch, roll, yaw, throttle)

func _on_aircraft_state_updated(state):
    # Update your Godot aircraft based on Avion state
    var position = Vector3(state.position.x, state.position.y, state.position.z)
    var rotation = Vector3(state.rotation.pitch, state.rotation.yaw, state.rotation.roll)
    
    # Apply to your 3D model
    $Aircraft.translation = position
    $Aircraft.rotation = rotation

func _on_physics_state_updated(state):
    # Use physics data for effects, sounds, etc.
    var airspeed = state.airData.airspeed
    var is_stalled = state.status.isStalled
    
    if is_stalled:
        $StallWarning.play()
```

## Message Protocol

### Message Structure

All messages follow this structure:
```json
{
    "type": "message_type",
    "data": { ... },
    "timestamp": 1234567890
}
```

### Message Types

#### From Avion to Godot

**1. aircraft_update**
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

**2. physics_update**
```json
{
    "type": "physics_update",
    "data": {
        "forces": {
            "lift": 12000,
            "drag": 800,
            "thrust": 5000,
            "weight": 10000
        },
        "angles": {
            "attackAngle": 5.2,
            "slipAngle": 0.1
        },
        "airData": {
            "airspeed": 55,
            "groundSpeed": 50,
            "verticalSpeed": 2.5,
            "machNumber": 0.08
        },
        "status": {
            "isStalled": false,
            "isOnGround": false,
            "gForce": 1.2
        }
    }
}
```

**3. environment_update**
```json
{
    "type": "environment_update",
    "data": {
        "time": {
            "timeOfDay": 14.5,
            "timeSpeed": 1.0
        },
        "weather": {
            "windSpeed": 5,
            "windDirection": 270,
            "cloudDensity": 0.3,
            "rainIntensity": 0.0,
            "visibility": 10000
        },
        "atmosphere": {
            "temperature": 15,
            "pressure": 101325,
            "density": 1.225
        }
    }
}
```

**4. event**
```json
{
    "type": "event",
    "data": {
        "eventType": "touchdown",
        "data": {
            "speed": 45,
            "verticalSpeed": -1.5,
            "quality": "good"
        }
    }
}
```

#### From Godot to Avion

**1. control_input**
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

**2. command**
```json
{
    "type": "command",
    "data": {
        "command": "reset",
        "params": {}
    }
}
```

Available commands:
- `start` - Start the simulation
- `stop` - Stop the simulation
- `reset` - Reset aircraft to initial position
- `pause` - Pause the simulation
- `resume` - Resume the simulation

**3. config_update**
```json
{
    "type": "config_update",
    "data": {
        "updateRate": 30,
        "includePhysics": true,
        "includeEnvironment": false
    }
}
```

#### Bidirectional

**handshake**
```json
{
    "type": "handshake",
    "data": {
        "type": "avion",
        "version": "1.0.0",
        "capabilities": {
            "physics": true,
            "environment": true,
            "updateRate": 60
        }
    }
}
```

## WebSocket Server Setup

You need a WebSocket server to relay messages between Avion (browser) and Godot. Here's a simple Node.js example:

```javascript
// ws-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 9090 });

const clients = new Set();

wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);
    
    ws.on('message', (message) => {
        // Broadcast to all other clients
        clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});

console.log('WebSocket server running on ws://localhost:9090');
```

Run with:
```bash
npm install ws
node ws-server.js
```

## Advanced Usage

### Custom Aircraft Synchronization

```javascript
// Avion side - Custom serialization
godotBridge.sendAircraftUpdate = function(aircraft) {
    const customState = {
        position: aircraft.position,
        velocity: aircraft.velocity,
        rotation: aircraft.rotation,
        fuelLevel: aircraft.fuel.getCurrentLevel(),
        damage: aircraft.damage.getTotalDamage(),
        gear: aircraft.gear.isDeployed()
    };
    this.send(GodotMessageType.AIRCRAFT_UPDATE, customState);
};
```

### Handling Events

```javascript
// Avion side - Send custom events
godotBridge.sendEvent('landing', {
    quality: 'excellent',
    verticalSpeed: -1.2,
    score: 100
});

// Godot side - Receive events
func _on_event_received(event_type, data):
    match event_type:
        "landing":
            print("Landing quality: ", data.quality)
            $Score.add_points(data.score)
        "stall":
            $StallWarning.play()
```

### Performance Optimization

```javascript
// Reduce update rate for better performance
godotBridge.config.updateRate = 30; // 30 Hz instead of 60 Hz

// Disable environment updates if not needed
godotBridge.config.includeEnvironment = false;

// Send updates manually
godotBridge.config.autoStart = false;
godotBridge.sendAircraftUpdate(aircraft);
```

## Troubleshooting

### Connection Issues

1. **Cannot connect to WebSocket server**
   - Ensure WebSocket server is running
   - Check firewall settings
   - Verify the URL matches on both sides

2. **Connection drops frequently**
   - Check network stability
   - Increase reconnection attempts
   - Add error handling

### Performance Issues

1. **High latency**
   - Reduce update rate
   - Optimize message size
   - Use local WebSocket server

2. **Message loss**
   - Implement message acknowledgment
   - Add sequence numbers
   - Use reliable WebSocket implementation

## Examples

See the `/examples` directory for complete examples:
- `avion-godot-basic` - Basic integration example
- `avion-godot-full` - Full-featured integration with all systems

## API Reference

### GodotBridge (JavaScript)

#### Constructor
```javascript
new GodotBridge(config)
```

#### Methods
- `initialize(serverUrl)` - Connect to WebSocket server
- `start()` - Start sending updates
- `stop()` - Stop sending updates
- `setDataSources(sources)` - Set data sources
- `onControlInput(callback)` - Handle control inputs
- `onCommand(callback)` - Handle commands
- `sendEvent(type, data)` - Send custom event
- `disconnect()` - Disconnect from server
- `getStatus()` - Get connection status

### AvionClient (GDScript)

#### Methods
- `connect_to_avion()` - Connect to Avion
- `disconnect_from_avion()` - Disconnect
- `send_control_input(pitch, roll, yaw, throttle)` - Send controls
- `send_command(command, params)` - Send command
- `send_config_update(config)` - Update configuration
- `get_aircraft_position()` - Get aircraft position
- `get_aircraft_velocity()` - Get aircraft velocity
- `get_aircraft_rotation()` - Get aircraft rotation
- `is_stalled()` - Check if aircraft is stalled
- `is_on_ground()` - Check if aircraft is on ground

#### Signals
- `connected_to_avion()` - Emitted when connected
- `disconnected_from_avion()` - Emitted when disconnected
- `aircraft_state_updated(state)` - Aircraft state received
- `physics_state_updated(state)` - Physics state received
- `environment_state_updated(state)` - Environment state received
- `event_received(event_type, data)` - Event received

## License

MIT License - See LICENSE file for details
