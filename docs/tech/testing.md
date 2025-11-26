# Testing Guide

## Testing Strategy

Avion uses a multi-layered testing approach:

1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test system interactions
3. **Performance Tests**: Verify performance targets
4. **Manual Tests**: User experience and gameplay

## Test Framework

We use [Vitest](https://vitest.dev/) for unit and integration testing.

### Installation

```bash
npm install --save-dev vitest
```

### Configuration

`vite.config.js`:
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        environment: 'jsdom',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html']
        }
    }
});
```

## Writing Tests

### Unit Test Example

`tests/physics/FlightPhysics.test.js`:
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { FlightPhysics } from '../../src/engine/physics/FlightPhysics.js';

describe('FlightPhysics', () => {
    let physics;
    
    beforeEach(() => {
        physics = new FlightPhysics();
    });
    
    describe('calculateLift', () => {
        it('should return zero when velocity is zero', () => {
            const lift = physics.calculateLift({
                airDensity: 1.225,
                velocity: 0,
                wingArea: 20,
                liftCoefficient: 1.0
            });
            
            expect(lift).toBe(0);
        });
        
        it('should increase with velocity squared', () => {
            const params = {
                airDensity: 1.225,
                wingArea: 20,
                liftCoefficient: 1.0
            };
            
            const lift1 = physics.calculateLift({ ...params, velocity: 10 });
            const lift2 = physics.calculateLift({ ...params, velocity: 20 });
            
            // Lift should quadruple when velocity doubles
            expect(lift2).toBeCloseTo(lift1 * 4, 1);
        });
        
        it('should throw error for negative velocity', () => {
            expect(() => {
                physics.calculateLift({
                    airDensity: 1.225,
                    velocity: -10,
                    wingArea: 20,
                    liftCoefficient: 1.0
                });
            }).toThrow('Velocity cannot be negative');
        });
    });
    
    describe('getAirDensity', () => {
        it('should return sea level density at altitude 0', () => {
            const density = physics.getAirDensity(0);
            expect(density).toBeCloseTo(1.225, 3);
        });
        
        it('should decrease with altitude', () => {
            const density0 = physics.getAirDensity(0);
            const density1000 = physics.getAirDensity(1000);
            
            expect(density1000).toBeLessThan(density0);
        });
        
        it('should follow exponential atmosphere model', () => {
            const density1000 = physics.getAirDensity(1000);
            const expected = 1.225 * Math.exp(-1000 / 8500);
            
            expect(density1000).toBeCloseTo(expected, 3);
        });
    });
});
```

### Integration Test Example

`tests/engine/Engine.test.js`:
```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Engine } from '../../src/engine/core/Engine.js';

describe('Engine Integration', () => {
    let canvas;
    let engine;
    
    beforeEach(() => {
        // Create mock canvas
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        
        engine = new Engine({ canvas });
    });
    
    afterEach(() => {
        engine.stop();
    });
    
    it('should initialize all subsystems', () => {
        expect(engine.renderer).toBeDefined();
        expect(engine.physics).toBeDefined();
        expect(engine.controls).toBeDefined();
    });
    
    it('should start and stop correctly', () => {
        engine.start();
        expect(engine.running).toBe(true);
        
        engine.stop();
        expect(engine.running).toBe(false);
    });
    
    it('should update physics and rendering', () => {
        const physicsSpy = vi.spyOn(engine.physics, 'update');
        const renderSpy = vi.spyOn(engine.renderer, 'render');
        
        engine.update(1/60);
        
        expect(physicsSpy).toHaveBeenCalled();
        expect(renderSpy).toHaveBeenCalled();
    });
    
    it('should emit events', () => {
        const callback = vi.fn();
        engine.on('update', callback);
        
        engine.update(1/60);
        
        expect(callback).toHaveBeenCalledWith(1/60);
    });
});
```

### Mocking Three.js

`tests/mocks/three.js`:
```javascript
export class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    
    // ... more methods as needed
}

export class Scene {
    constructor() {
        this.children = [];
    }
    
    add(object) {
        this.children.push(object);
    }
    
    remove(object) {
        const index = this.children.indexOf(object);
        if (index > -1) {
            this.children.splice(index, 1);
        }
    }
}

// ... more mocks
```

## Test Organization

```
tests/
├── physics/
│   ├── FlightPhysics.test.js
│   ├── GroundEffect.test.js
│   ├── Wind.test.js
│   └── Atmosphere.test.js
├── rendering/
│   ├── Renderer.test.js
│   ├── CameraController.test.js
│   └── LOD.test.js
├── controls/
│   ├── InputHandler.test.js
│   └── TouchControls.test.js
├── aircraft/
│   ├── Aircraft.test.js
│   └── AircraftFactory.test.js
├── environment/
│   ├── Environment.test.js
│   ├── TerrainGenerator.test.js
│   └── Weather.test.js
├── engine/
│   ├── Engine.test.js
│   └── Loop.test.js
├── mocks/
│   └── three.js
└── helpers/
    └── testUtils.js
```

## Test Helpers

`tests/helpers/testUtils.js`:
```javascript
export function createMockAircraft(overrides = {}) {
    return {
        position: { x: 0, y: 100, z: 0 },
        velocity: { x: 0, y: 0, z: 50 },
        mass: 1000,
        wingArea: 20,
        ...overrides
    };
}

export function createMockEngine() {
    const canvas = document.createElement('canvas');
    return new Engine({ canvas });
}

export function waitForNextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
}

export async function waitForTime(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test FlightPhysics

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run only changed tests
npm test -- --changed

# Run tests matching pattern
npm test -- --grep "calculateLift"
```

### Coverage Reports

```bash
npm test -- --coverage

# View HTML report
open coverage/index.html
```

### Target Coverage

- Core engine: **90%+**
- Physics: **95%+**
- Aircraft: **90%+**
- Rendering: **80%+**
- Controls: **85%+**
- Utilities: **85%+**

## Performance Testing

### Benchmark Example

`tests/performance/PhysicsBenchmark.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import { FlightPhysics } from '../../src/engine/physics/FlightPhysics.js';

describe('Physics Performance', () => {
    it('should complete 1000 physics updates in < 100ms', () => {
        const physics = new FlightPhysics();
        const aircraft = createMockAircraft();
        
        const start = performance.now();
        
        for (let i = 0; i < 1000; i++) {
            physics.update(aircraft, 1/60);
        }
        
        const end = performance.now();
        const duration = end - start;
        
        expect(duration).toBeLessThan(100);
    });
    
    it('should maintain 60 FPS with 100 aircraft', () => {
        const physics = new FlightPhysics();
        const aircraft = Array(100).fill().map(() => createMockAircraft());
        
        const start = performance.now();
        
        aircraft.forEach(ac => {
            physics.update(ac, 1/60);
        });
        
        const end = performance.now();
        const duration = end - start;
        
        // Should complete in less than one frame (16.67ms)
        expect(duration).toBeLessThan(16.67);
    });
});
```

## Visual Regression Testing

For UI changes, capture screenshots:

```javascript
import { chromium } from 'playwright';

describe('Visual Regression', () => {
    it('should match main menu screenshot', async () => {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        
        await page.goto('http://localhost:5173');
        await page.waitForSelector('#main-menu');
        
        const screenshot = await page.screenshot();
        
        // Compare with baseline
        expect(screenshot).toMatchSnapshot();
        
        await browser.close();
    });
});
```

## Manual Testing Checklist

### Basic Flight

- [ ] Aircraft spawns correctly
- [ ] Controls respond appropriately
- [ ] Physics feels realistic
- [ ] Camera follows smoothly
- [ ] HUD displays correct data
- [ ] No visual glitches

### Takeoff

- [ ] Aircraft accelerates on throttle
- [ ] Lifts off at appropriate speed
- [ ] Rotation feels natural
- [ ] Gear animation (if applicable)
- [ ] Sound effects play

### Flight

- [ ] Pitch control works
- [ ] Roll control works
- [ ] Yaw control works
- [ ] Throttle control works
- [ ] Stall behavior is realistic
- [ ] G-forces displayed correctly

### Landing

- [ ] Approach is stable
- [ ] Flare works correctly
- [ ] Touchdown is smooth
- [ ] Ground effect noticeable
- [ ] Brakes work (if applicable)

### Environment

- [ ] Terrain loads correctly
- [ ] Airports visible
- [ ] Day/night cycle works
- [ ] Weather effects display
- [ ] Water renders properly
- [ ] No Z-fighting

### UI/Menus

- [ ] Main menu navigable
- [ ] Settings save correctly
- [ ] Controls rebind properly
- [ ] Mission selection works
- [ ] Pause menu functions
- [ ] Loading screens display

### Performance

- [ ] Maintains target FPS
- [ ] No stuttering
- [ ] No memory leaks
- [ ] Loads in target time
- [ ] Responsive on mobile

### Cross-Browser

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## Continuous Integration

`.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Test-Driven Development (TDD)

When adding new features:

1. **Write test first**
```javascript
it('should calculate ground effect', () => {
    const lift = calculateGroundEffect(altitude, wingspan);
    expect(lift).toBeGreaterThan(1.0);
});
```

2. **Run test (it should fail)**
```bash
npm test -- GroundEffect
```

3. **Implement feature**
```javascript
function calculateGroundEffect(altitude, wingspan) {
    const ratio = altitude / wingspan;
    return 1 / (1 + Math.pow(ratio / 0.15, 2));
}
```

4. **Run test again (it should pass)**

5. **Refactor if needed**

## Debugging Tests

### Using VS Code

`.vscode/launch.json`:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Debug Tests",
            "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
            "args": ["run", "${file}"],
            "console": "integratedTerminal",
            "internalConsoleOptions": "neverOpen"
        }
    ]
}
```

### Console Output

```javascript
it('should debug calculation', () => {
    const result = calculateLift(params);
    console.log('Lift result:', result);
    expect(result).toBeCloseTo(expected, 2);
});
```

### Isolated Tests

```javascript
it.only('should test this specific case', () => {
    // This test runs in isolation
});
```

## Best Practices

1. ✅ **Write tests for all new code**
2. ✅ **Keep tests simple and focused**
3. ✅ **Use descriptive test names**
4. ✅ **Test edge cases**
5. ✅ **Mock external dependencies**
6. ✅ **Avoid testing implementation details**
7. ✅ **Run tests before committing**
8. ✅ **Maintain high coverage**
9. ✅ **Update tests when changing code**
10. ✅ **Review test failures carefully**

## Common Testing Patterns

### Testing Async Code

```javascript
it('should load model asynchronously', async () => {
    const model = await loadModel('aircraft.glb');
    expect(model).toBeDefined();
});
```

### Testing Events

```javascript
it('should emit touchdown event', (done) => {
    aircraft.on('touchdown', (data) => {
        expect(data.speed).toBeLessThan(60);
        done();
    });
    
    aircraft.land();
});
```

### Testing Errors

```javascript
it('should throw on invalid config', () => {
    expect(() => {
        new Aircraft({ mass: -100 });
    }).toThrow('Mass must be positive');
});
```

### Parameterized Tests

```javascript
describe.each([
    [0, 1.225],
    [1000, 1.112],
    [5000, 0.736],
    [10000, 0.413]
])('getAirDensity(%i)', (altitude, expected) => {
    it(`should return ${expected} at ${altitude}m`, () => {
        const density = physics.getAirDensity(altitude);
        expect(density).toBeCloseTo(expected, 3);
    });
});
```

---

**Remember**: Good tests make refactoring safe and enable confident development. Invest time in writing quality tests!
