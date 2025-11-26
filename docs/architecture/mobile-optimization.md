# Mobile Optimization

## Overview

Mobile optimization ensures smooth performance on smartphones and tablets with limited resources.

## Strategy

### 1. Adaptive Quality Settings

Automatically detect device capabilities and adjust settings:

```javascript
class MobileDetector {
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    static getDeviceCapabilities() {
        const gpu = this.detectGPU();
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 2;
        
        if (gpu === 'high' && memory >= 6 && cores >= 6) {
            return 'high';
        } else if (gpu === 'medium' && memory >= 3 && cores >= 4) {
            return 'medium';
        } else {
            return 'low';
        }
    }
}
```

### 2. Performance Switch

```javascript
class PerformanceSwitch {
    constructor() {
        this.quality = 'auto';
        this.targetFPS = 60;
        this.currentFPS = 60;
        this.adjustmentInterval = 5000; // 5 seconds
    }
    
    update(deltaTime) {
        this.currentFPS = 1 / deltaTime;
        
        if (this.quality === 'auto') {
            this.autoAdjustQuality();
        }
    }
    
    autoAdjustQuality() {
        if (this.currentFPS < 30) {
            this.decreaseQuality();
        } else if (this.currentFPS > 55) {
            this.increaseQuality();
        }
    }
}
```

## Mobile-Specific Optimizations

### Rendering

**Resolution Scaling**
```javascript
const mobileConfig = {
    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
    maxTextureSize: 1024,
    shadowMapSize: 512,
    antialias: false
};
```

**Simplified Shaders**
```javascript
// Desktop: Complex atmospheric scattering
// Mobile: Simple gradient sky

const skyShader = isMobile ? SimpleSkyShader : AtmosphericScatteringShader;
```

**Reduced Draw Calls**
- Instanced rendering for all repeated objects
- Geometry merging for static elements
- Sprite billboards instead of 3D models for distant objects

**LOD Distances**
```javascript
const LODConfig = {
    mobile: {
        near: 50,
        medium: 100,
        far: 200
    },
    desktop: {
        near: 200,
        medium: 500,
        far: 1000
    }
};
```

### Physics

**Simplified Calculations**
```javascript
if (isMobile) {
    // Skip ground effect calculation
    // Use simplified wind model
    // Reduce collision check frequency
}
```

**Lower Update Rate**
```javascript
const physicsHz = isMobile ? 30 : 60;
```

### Assets

**Texture Compression**
- Use ASTC or ETC2 formats on mobile
- Reduce texture resolution (2048 → 512)
- Fewer texture channels

**Model Complexity**
- Lower poly count (50% of desktop)
- Simplified collision meshes
- Remove non-essential details

**Audio**
- Compressed audio formats (MP3 instead of WAV)
- Fewer simultaneous sounds
- Lower sample rates

## Touch Controls

### MobileInputAdapter.js

```javascript
class MobileInputAdapter {
    constructor() {
        this.touchControls = new TouchControls();
        this.gyroscope = new GyroscopeControls();
        
        this.setupTouchZones();
    }
    
    setupTouchZones() {
        // Left side: Virtual joystick for pitch/roll
        this.leftJoystick = new VirtualJoystick({
            zone: 'left-half',
            mode: 'static'
        });
        
        // Right side: Throttle and yaw
        this.rightControls = new ThrottleYawControl({
            zone: 'right-half'
        });
    }
}
```

### Virtual Joystick

```javascript
class VirtualJoystick {
    constructor(config) {
        this.zone = config.zone;
        this.position = new THREE.Vector2();
        this.active = false;
        
        this.setupEventListeners();
    }
    
    onTouchStart(event) {
        this.active = true;
        this.startPosition = this.getTouchPosition(event);
    }
    
    onTouchMove(event) {
        if (!this.active) return;
        
        const current = this.getTouchPosition(event);
        const delta = current.sub(this.startPosition);
        
        // Normalize to -1 to 1 range
        this.position.x = Math.max(-1, Math.min(1, delta.x / 50));
        this.position.y = Math.max(-1, Math.min(1, delta.y / 50));
    }
    
    getInput() {
        return {
            pitch: this.position.y,
            roll: this.position.x
        };
    }
}
```

### Gyroscope Controls

```javascript
class GyroscopeControls {
    constructor() {
        this.enabled = false;
        this.setupGyroscope();
    }
    
    setupGyroscope() {
        if ('DeviceOrientationEvent' in window) {
            window.addEventListener('deviceorientation', (event) => {
                this.handleOrientation(event);
            });
        }
    }
    
    handleOrientation(event) {
        if (!this.enabled) return;
        
        // Convert device orientation to control inputs
        this.roll = event.gamma / 90;   // -1 to 1
        this.pitch = event.beta / 90;   // -1 to 1
    }
}
```

### Mobile HUD

```javascript
class MobileHUD {
    constructor() {
        // Simplified HUD for mobile
        this.elements = {
            airspeed: this.createBigText('left-top'),
            altitude: this.createBigText('right-top'),
            throttle: this.createSlider('right-middle')
        };
        
        // Larger touch targets
        this.buttonSize = 60; // pixels
    }
    
    createBigText(position) {
        return {
            fontSize: '24px',
            fontWeight: 'bold',
            position: position
        };
    }
}
```

## Mobile-Specific UI

### Control Layout

```
┌─────────────────────────────┐
│  Speed: 120   Alt: 500     │
├──────────────┬──────────────┤
│              │              │
│   Joystick   │   Throttle   │
│   (Pitch/    │   Slider     │
│    Roll)     │              │
│              │   Yaw        │
│              │   Buttons    │
└──────────────┴──────────────┘
```

### Settings Menu

Mobile-specific options:
- [ ] Touch sensitivity
- [ ] Enable/disable gyroscope
- [ ] Visual quality (auto, low, medium, high)
- [ ] Haptic feedback
- [ ] Button size
- [ ] HUD opacity

## Battery Optimization

### Power Saving Mode

```javascript
class PowerManager {
    constructor() {
        this.powerSaveMode = false;
        this.monitorBattery();
    }
    
    async monitorBattery() {
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            
            battery.addEventListener('levelchange', () => {
                if (battery.level < 0.2 && !battery.charging) {
                    this.enablePowerSaveMode();
                }
            });
        }
    }
    
    enablePowerSaveMode() {
        this.powerSaveMode = true;
        // Reduce frame rate to 30 FPS
        // Lower quality settings
        // Disable particles
        // Reduce draw distance
    }
}
```

## Testing Checklist

- [ ] Performance on low-end devices (2-3 years old)
- [ ] Touch controls responsiveness
- [ ] Battery drain rate
- [ ] Memory usage (< 200 MB)
- [ ] Loading time (< 5 seconds on 4G)
- [ ] Screen orientation handling
- [ ] Interruption handling (phone calls, notifications)
- [ ] Offline functionality
- [ ] App backgrounding/foregrounding

## Platform-Specific Features

### iOS

```javascript
// Prevent elastic scrolling
document.body.style.overflow = 'hidden';

// Request motion permissions (iOS 13+)
if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission();
}

// Handle notch on iPhone X+
const safeArea = getComputedStyle(document.documentElement)
    .getPropertyValue('--safe-area-inset-top');
```

### Android

```javascript
// Full screen mode
if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
}

// Prevent system gestures interference
window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault(); // Prevent pinch-to-zoom
    }
}, { passive: false });
```

## Future Enhancements

- [ ] Progressive Web App (PWA) support
- [ ] Offline mode with service workers
- [ ] Cloud save synchronization
- [ ] In-app purchases for mobile stores
- [ ] Social features (leaderboards, multiplayer)
- [ ] Adaptive streaming for assets
