# Code Style Guide

## Overview

Consistent code style makes the project more maintainable and easier to contribute to. This guide outlines the conventions used in Avion.

## General Principles

1. **Readability First**: Code is read more than written
2. **Consistency**: Follow existing patterns
3. **Simplicity**: Keep it simple and clear
4. **DRY**: Don't Repeat Yourself (but don't over-abstract)
5. **Comments**: Explain *why*, not *what*

## JavaScript Style

### ES6+ Features

Use modern JavaScript features:

```javascript
// ✅ Good: Use const/let
const maxSpeed = 250;
let currentSpeed = 0;

// ❌ Bad: Don't use var
var maxSpeed = 250;

// ✅ Good: Arrow functions for callbacks
items.map(item => item.value);

// ✅ Good: Template literals
console.log(`Speed: ${speed} m/s`);

// ✅ Good: Destructuring
const { x, y, z } = position;

// ✅ Good: Spread operator
const newState = { ...oldState, speed: 100 };

// ✅ Good: Optional chaining
const value = obj?.prop?.value;

// ✅ Good: Nullish coalescing
const speed = config.speed ?? 50;
```

### Naming Conventions

```javascript
// Classes: PascalCase
class FlightPhysics {}
class AircraftController {}

// Functions and variables: camelCase
function calculateLift() {}
const airDensity = 1.225;

// Constants: UPPER_SNAKE_CASE
const MAX_ALTITUDE = 10000;
const GRAVITY = 9.81;

// Private properties: leading underscore
class Engine {
    _internalState = null;
    
    _privateMethod() {}
}

// Boolean variables: is/has/should prefix
const isFlying = true;
const hasLanded = false;
const shouldUpdate = true;
```

### Function Structure

```javascript
// ✅ Good: Clear, single responsibility
function calculateLift(airDensity, velocity, wingArea, coefficient) {
    return 0.5 * airDensity * velocity * velocity * wingArea * coefficient;
}

// ✅ Good: Use default parameters
function createAircraft(config = {}) {
    const name = config.name || 'Default Aircraft';
    // ...
}

// ✅ Good: Early returns
function processInput(input) {
    if (!input) return null;
    if (!input.isValid) return null;
    
    return input.process();
}

// ❌ Bad: Nested conditionals
function processInput(input) {
    if (input) {
        if (input.isValid) {
            return input.process();
        }
    }
    return null;
}
```

### Class Structure

```javascript
class Aircraft {
    // Static properties first
    static DEFAULT_CONFIG = {};
    
    // Constructor
    constructor(config) {
        // Public properties
        this.name = config.name;
        this.position = new Vector3();
        
        // Private properties
        this._velocity = new Vector3();
    }
    
    // Public methods
    update(deltaTime) {
        this._updatePhysics(deltaTime);
        this._updateVisuals();
    }
    
    // Getters/Setters
    get speed() {
        return this._velocity.length();
    }
    
    set throttle(value) {
        this._throttle = Math.max(0, Math.min(1, value));
    }
    
    // Private methods (last)
    _updatePhysics(deltaTime) {
        // ...
    }
    
    _updateVisuals() {
        // ...
    }
}
```

### Async/Await

```javascript
// ✅ Good: Use async/await
async function loadAssets() {
    try {
        const model = await loader.loadModel('aircraft.glb');
        const texture = await loader.loadTexture('skin.png');
        return { model, texture };
    } catch (error) {
        console.error('Failed to load assets:', error);
        throw error;
    }
}

// ❌ Bad: Promise chains (unless necessary)
function loadAssets() {
    return loader.loadModel('aircraft.glb')
        .then(model => loader.loadTexture('skin.png')
            .then(texture => ({ model, texture })))
        .catch(error => {
            console.error('Failed to load assets:', error);
            throw error;
        });
}
```

## File Organization

### File Structure

```javascript
// 1. Imports (grouped)
import * as THREE from 'three';
import { Vector3, Euler } from 'three';

import { FlightPhysics } from './physics/FlightPhysics.js';
import { CONFIG } from '../config/engine.config.js';

// 2. Constants
const GRAVITY = 9.81;
const MAX_SPEED = 250;

// 3. Helper functions (if needed)
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// 4. Main class/function
export class Aircraft {
    // ...
}

// 5. Default export (if applicable)
export default Aircraft;
```

### File Naming

```
// Classes: PascalCase
FlightPhysics.js
AircraftController.js

// Utilities: camelCase
mathUtils.js
constants.js

// Configs: lowercase with extension
engine.config.js
aircraft.config.js

// Tests: same as source with .test
FlightPhysics.test.js
```

## Comments and Documentation

### JSDoc Comments

```javascript
/**
 * Calculates aerodynamic drag force
 * 
 * @param {number} airDensity - Air density in kg/m³
 * @param {number} velocity - Velocity in m/s
 * @param {number} area - Reference area in m²
 * @param {number} dragCoefficient - Coefficient of drag
 * @returns {number} Drag force in Newtons
 * 
 * @example
 * const drag = calculateDrag(1.225, 50, 20, 0.02);
 * console.log(drag); // 6125
 */
function calculateDrag(airDensity, velocity, area, dragCoefficient) {
    return 0.5 * airDensity * velocity * velocity * area * dragCoefficient;
}
```

### Inline Comments

```javascript
// ✅ Good: Explain why
// Use exponential atmosphere model for realistic density variation
const density = SEA_LEVEL_DENSITY * Math.exp(-altitude / SCALE_HEIGHT);

// ❌ Bad: State the obvious
// Set speed to 100
const speed = 100;

// ✅ Good: Clarify complex logic
// Account for ground effect: lift increases near ground due to
// reduced downwash and increased pressure under wings
if (altitude < wingspan) {
    const groundEffectFactor = 1.0 + (wingspan - altitude) / wingspan * 0.25;
    lift *= groundEffectFactor;
}
```

### TODO Comments

```javascript
// TODO: Implement ground effect calculation
// FIXME: Handle edge case when velocity is zero
// HACK: Temporary solution until proper collision detection
// NOTE: This assumes constant air density
```

## Three.js Conventions

### Object Creation

```javascript
// ✅ Good: Reuse geometry and materials
class Environment {
    constructor() {
        this.treeGeometry = new THREE.ConeGeometry(1, 3, 8);
        this.treeMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    }
    
    addTree(position) {
        const tree = new THREE.Mesh(this.treeGeometry, this.treeMaterial);
        tree.position.copy(position);
        this.scene.add(tree);
    }
}

// ❌ Bad: Create new geometry/material each time
addTree(position) {
    const geometry = new THREE.ConeGeometry(1, 3, 8);
    const material = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const tree = new THREE.Mesh(geometry, material);
    tree.position.copy(position);
    this.scene.add(tree);
}
```

### Vector Operations

```javascript
// ✅ Good: Chain operations, reuse vectors
const result = new THREE.Vector3();
result.copy(velocity)
      .normalize()
      .multiplyScalar(speed);

// ✅ Good: Clone when needed
const newPosition = oldPosition.clone().add(velocity);

// ❌ Bad: Allocate unnecessary vectors
const normalized = velocity.normalize(); // This modifies velocity!
const result = normalized.multiplyScalar(speed);
```

## Error Handling

```javascript
// ✅ Good: Validate inputs
function setAltitude(altitude) {
    if (typeof altitude !== 'number') {
        throw new TypeError('Altitude must be a number');
    }
    if (altitude < 0) {
        throw new RangeError('Altitude cannot be negative');
    }
    this._altitude = altitude;
}

// ✅ Good: Handle errors gracefully
async function loadModel(path) {
    try {
        const model = await loader.load(path);
        return model;
    } catch (error) {
        console.error(`Failed to load model: ${path}`, error);
        return this.getDefaultModel();
    }
}

// ✅ Good: Use optional chaining
const value = config?.physics?.gravity ?? 9.81;
```

## Performance Considerations

```javascript
// ✅ Good: Cache frequently accessed properties
class Aircraft {
    update(deltaTime) {
        const { position, velocity } = this;
        const speed = velocity.length(); // Calculate once
        
        // Use cached values
        this.lift = this.calculateLift(speed);
        this.drag = this.calculateDrag(speed);
    }
}

// ❌ Bad: Repeated calculations
class Aircraft {
    update(deltaTime) {
        this.lift = this.calculateLift(this.velocity.length());
        this.drag = this.calculateDrag(this.velocity.length());
        // velocity.length() called twice!
    }
}

// ✅ Good: Object pooling for frequently created objects
class ParticlePool {
    constructor(size) {
        this.pool = Array(size).fill().map(() => new Particle());
        this.available = [...this.pool];
    }
    
    get() {
        return this.available.pop() || new Particle();
    }
    
    release(particle) {
        particle.reset();
        this.available.push(particle);
    }
}
```

## Testing Style

```javascript
import { describe, it, expect, beforeEach } from 'vitest';

describe('FlightPhysics', () => {
    let physics;
    
    beforeEach(() => {
        physics = new FlightPhysics();
    });
    
    describe('calculateLift', () => {
        it('should return zero when velocity is zero', () => {
            const lift = physics.calculateLift(0);
            expect(lift).toBe(0);
        });
        
        it('should increase with velocity squared', () => {
            const lift1 = physics.calculateLift(10);
            const lift2 = physics.calculateLift(20);
            expect(lift2).toBeCloseTo(lift1 * 4, 2);
        });
        
        it('should throw error for negative velocity', () => {
            expect(() => physics.calculateLift(-10))
                .toThrow('Velocity cannot be negative');
        });
    });
});
```

## Git Commit Style

See [Contributing Guide](./contributing.md#commit-message-format) for commit message format.

## Tools and Linting

### ESLint Configuration

```json
{
    "extends": ["eslint:recommended"],
    "parserOptions": {
        "ecmaVersion": 2022,
        "sourceType": "module"
    },
    "rules": {
        "indent": ["error", 4],
        "quotes": ["error", "single"],
        "semi": ["error", "always"],
        "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
        "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
}
```

### Running Linter

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

## Editor Setup

### VS Code

Recommended extensions:
- ESLint
- Prettier
- JavaScript (ES6) code snippets

Settings (`.vscode/settings.json`):
```json
{
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "javascript.updateImportsOnFileMove.enabled": "always"
}
```

---

**Remember: These are guidelines, not rigid rules. Use your best judgment and prioritize code readability and maintainability.**
