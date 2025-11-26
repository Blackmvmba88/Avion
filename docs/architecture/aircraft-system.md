# Aircraft System

## Overview

The aircraft system handles aircraft models, physics integration, and state management.

## Components

### Aircraft.js

Base aircraft class:

```javascript
class Aircraft {
    constructor(config) {
        this.name = config.name || 'Generic Aircraft';
        this.physics = config.physics;
        this.visual = config.visual;
        
        // State
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.angularVelocity = new THREE.Vector3();
        
        // Controls
        this.throttle = 0;
        this.controlInputs = {
            pitch: 0,
            roll: 0,
            yaw: 0
        };
        
        // Create 3D model
        this.mesh = this.createMesh();
        
        // Initialize physics parameters
        this.initPhysics();
    }
    
    update(deltaTime) {
        this.updatePhysics(deltaTime);
        this.updateVisuals();
    }
    
    updatePhysics(deltaTime) {
        // Calculate forces
        const forces = this.calculateForces();
        
        // Apply forces
        const acceleration = forces.divideScalar(this.physics.mass);
        this.velocity.add(acceleration.multiplyScalar(deltaTime));
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Update rotation
        this.updateRotation(deltaTime);
    }
    
    calculateForces() {
        const lift = this.calculateLift();
        const drag = this.calculateDrag();
        const thrust = this.calculateThrust();
        const weight = this.calculateWeight();
        
        return lift.add(drag).add(thrust).add(weight);
    }
}
```

### AircraftFactory.js

Factory for creating different aircraft types:

```javascript
class AircraftFactory {
    static create(type, config = {}) {
        switch (type) {
            case 'basicjet':
                return new BasicJet(config);
            case 'f22':
                return new FighterF22(config);
            case 'cessna172':
                return new Cessna172(config);
            default:
                return new Aircraft(config);
        }
    }
    
    static getAvailableTypes() {
        return ['basicjet', 'f22', 'cessna172'];
    }
}
```

## Aircraft Models

### BasicJet.js

Simple jet for tutorials:

```javascript
class BasicJet extends Aircraft {
    constructor(config) {
        super({
            name: 'Basic Jet',
            physics: {
                mass: 5000,           // kg
                wingArea: 20,         // m²
                wingSpan: 10,         // m
                maxThrust: 50000,     // N
                dragCoefficient: 0.02,
                liftCoefficient: 0.6,
                maxSpeed: 250,        // m/s
                stallSpeed: 40,       // m/s
                aspectRatio: 5,
                oswaldEfficiency: 0.8
            },
            visual: {
                color: 0x3498db,
                scale: 1.0
            },
            ...config
        });
    }
}
```

### FighterF22.js

High-performance fighter jet:

```javascript
class FighterF22 extends Aircraft {
    constructor(config) {
        super({
            name: 'F-22 Raptor',
            physics: {
                mass: 19700,          // kg (empty weight)
                wingArea: 78.04,      // m²
                wingSpan: 13.56,      // m
                maxThrust: 311200,    // N (with afterburner)
                dragCoefficient: 0.015,
                liftCoefficient: 0.9,
                maxSpeed: 600,        // m/s (~Mach 1.8)
                stallSpeed: 45,       // m/s
                aspectRatio: 2.36,
                oswaldEfficiency: 0.75,
                supercruise: true,
                afterburner: true,
                vectoredThrust: true
            },
            visual: {
                color: 0x2c3e50,
                scale: 1.5
            },
            ...config
        });
    }
    
    // Special capabilities
    enableAfterburner() {
        this.physics.currentThrust = this.physics.maxThrust;
    }
    
    disableAfterburner() {
        this.physics.currentThrust = this.physics.maxThrust * 0.6;
    }
}
```

### Cessna172.js

Light general aviation aircraft:

```javascript
class Cessna172 extends Aircraft {
    constructor(config) {
        super({
            name: 'Cessna 172 Skyhawk',
            physics: {
                mass: 1110,           // kg
                wingArea: 16.2,       // m²
                wingSpan: 11.0,       // m
                maxThrust: 1400,      // N
                dragCoefficient: 0.027,
                liftCoefficient: 1.2,
                maxSpeed: 70,         // m/s (~135 knots)
                stallSpeed: 24,       // m/s (~47 knots)
                aspectRatio: 7.52,
                oswaldEfficiency: 0.85,
                propellerDriven: true
            },
            visual: {
                color: 0xffffff,
                scale: 0.8
            },
            ...config
        });
    }
}
```

## Aircraft State

Each aircraft maintains:

```javascript
{
    // Position and orientation
    position: Vector3,
    rotation: Euler,
    velocity: Vector3,
    angularVelocity: Vector3,
    
    // Physics state
    airspeed: Number,
    altitude: Number,
    angleOfAttack: Number,
    sideSlip: Number,
    
    // Control state
    throttle: Number (0-1),
    controlInputs: {
        pitch: Number (-1 to 1),
        roll: Number (-1 to 1),
        yaw: Number (-1 to 1)
    },
    
    // Systems
    fuel: Number,
    engineRunning: Boolean,
    gearDown: Boolean,
    flapsPosition: Number (0-1),
    
    // Performance
    gForce: Number,
    verticalSpeed: Number
}
```

## Flight Dynamics

### Stability

Aircraft are configured for different stability characteristics:

- **Cessna172**: Stable, self-correcting
- **BasicJet**: Neutral stability, responsive
- **F-22**: Relaxed stability, highly maneuverable

### Control Surfaces

Effects of control inputs:

```javascript
// Pitch (elevator)
pitchRate = pitchInput × pitchAuthority × (airspeed / maxSpeed)

// Roll (ailerons)
rollRate = rollInput × rollAuthority × (airspeed / maxSpeed)

// Yaw (rudder)
yawRate = yawInput × yawAuthority × (airspeed / maxSpeed)
```

### Stall Behavior

When airspeed < stallSpeed or angle of attack exceeds critical angle:

```javascript
if (this.isStalled()) {
    this.liftCoefficient *= 0.3;  // Reduced lift
    this.dragCoefficient *= 2.0;  // Increased drag
    this.applyStallTorque();       // Nose drop
}
```

## Damage System (Future)

```javascript
class DamageModel {
    constructor() {
        this.components = {
            leftWing: { health: 100, critical: false },
            rightWing: { health: 100, critical: false },
            engine: { health: 100, critical: false },
            fuselage: { health: 100, critical: false }
        };
    }
    
    applyDamage(component, amount) {
        this.components[component].health -= amount;
        
        if (this.components[component].health <= 0) {
            this.components[component].critical = true;
            this.applyComponentFailure(component);
        }
    }
    
    applyComponentFailure(component) {
        switch (component) {
            case 'engine':
                this.aircraft.thrust = 0;
                break;
            case 'leftWing':
                this.aircraft.rollAuthority *= 0.5;
                this.aircraft.liftCoefficient *= 0.7;
                break;
            // ...
        }
    }
}
```

## Custom Aircraft

Create custom aircraft by extending the base class:

```javascript
class CustomAircraft extends Aircraft {
    constructor(config) {
        super({
            name: 'My Custom Aircraft',
            physics: {
                // Your physics parameters
            },
            visual: {
                // Your visual configuration
            },
            ...config
        });
    }
    
    // Override or add methods
    calculateLift() {
        // Custom lift calculation
        return super.calculateLift().multiplyScalar(1.2);
    }
}
```

## Testing

Aircraft testing checklist:
- [ ] Takeoff at various weights
- [ ] Cruise at different altitudes
- [ ] Stall recovery
- [ ] Landing at different speeds
- [ ] Maximum G-force limits
- [ ] Control authority at low speed
- [ ] Control authority at high speed
