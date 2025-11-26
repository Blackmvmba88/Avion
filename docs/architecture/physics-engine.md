# Physics Engine

## Overview

The physics engine simulates realistic flight dynamics using simplified aerodynamic equations suitable for a game environment.

## Core Components

### FlightPhysics.js

Main physics calculator handling:

#### 1. Forces

**Lift Force**
```javascript
L = 0.5 × ρ × V² × S × CL
```
- ρ: Air density (kg/m³)
- V: Airspeed (m/s)
- S: Wing area (m²)
- CL: Lift coefficient (function of angle of attack)

**Drag Force**
```javascript
D = 0.5 × ρ × V² × S × CD
CD = CD0 + CL²/(π × AR × e)
```
- CD0: Parasitic drag coefficient
- AR: Aspect ratio
- e: Oswald efficiency factor

**Thrust Force**
```javascript
T = maxThrust × throttle
```

**Weight**
```javascript
W = mass × gravity
```

#### 2. Angle of Attack

Calculated from velocity vector and aircraft orientation:
```javascript
α = atan2(velocity.y, velocity.xz_magnitude)
```

#### 3. Lift Coefficient

Modeled with stall behavior:
```javascript
CL = CL0 + CLα × α  (for α < stallAngle)
CL = stallCL        (for α >= stallAngle)
```

### GroundEffect.js

Simulates increased lift and reduced drag near the ground:

```javascript
heightRatio = altitude / wingspan
groundEffectFactor = 1 / (1 + (heightRatio / 0.15)²)
liftIncrease = groundEffectFactor × 0.25
dragReduction = groundEffectFactor × 0.15
```

### Wind.js

Handles wind effects:
- Constant wind fields
- Turbulence (random gusts)
- Wind shear with altitude
- Crosswind effects on landing

### Atmosphere.js

Air density variation with altitude:

```javascript
ρ(h) = ρ0 × exp(-h / H)
```
- ρ0: Sea level density (1.225 kg/m³)
- h: Altitude (m)
- H: Scale height (8500 m)

Temperature variation:
```javascript
T(h) = T0 - lapse_rate × h
```
- T0: Sea level temperature (288.15 K)
- lapse_rate: 0.0065 K/m

## Integration

### Fixed Timestep

Physics runs at fixed 60 Hz regardless of frame rate:

```javascript
const PHYSICS_TIMESTEP = 1/60; // seconds

while (accumulator >= PHYSICS_TIMESTEP) {
    updatePhysics(PHYSICS_TIMESTEP);
    accumulator -= PHYSICS_TIMESTEP;
}
```

### State Updates

1. Calculate forces (lift, drag, thrust, weight)
2. Apply forces to get acceleration
3. Integrate acceleration to get velocity
4. Integrate velocity to get position
5. Update rotation based on control inputs

## Aircraft State

```javascript
{
    position: Vector3,
    velocity: Vector3,
    rotation: Euler,
    angularVelocity: Vector3,
    mass: Number,
    throttle: Number,
    controlInputs: {
        pitch: Number,
        roll: Number,
        yaw: Number
    }
}
```

## Performance Optimizations

- Pre-computed constants (wing area, aspect ratio)
- Lookup tables for lift/drag coefficients
- Efficient vector operations
- Minimal object allocations per frame

## Future Enhancements

- [ ] Propeller effects
- [ ] Compressibility at high speeds
- [ ] Spin dynamics
- [ ] Landing gear physics
- [ ] Fuel weight reduction
- [ ] Engine failure scenarios
