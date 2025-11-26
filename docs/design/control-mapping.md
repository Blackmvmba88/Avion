# Control Mapping

## Overview

This document defines the control schemes for different input methods: keyboard, gamepad, and touch (mobile).

## Keyboard Controls

### Primary Flight Controls

| Action | Key | Alternative | Description |
|--------|-----|-------------|-------------|
| **Pitch Up** | W | ↑ | Pull stick back |
| **Pitch Down** | S | ↓ | Push stick forward |
| **Roll Left** | A | ← | Roll left |
| **Roll Right** | D | → | Roll right |
| **Yaw Left** | Q | | Rudder left |
| **Yaw Right** | E | | Rudder right |
| **Increase Throttle** | Shift | = | Add power |
| **Decrease Throttle** | Ctrl | - | Reduce power |
| **Full Throttle** | Z | | 100% power |
| **Idle Throttle** | X | | 0% power |

### Camera Controls

| Action | Key | Alternative | Description |
|--------|-----|-------------|-------------|
| **Camera Pan Left** | Numpad 4 | J | Look left |
| **Camera Pan Right** | Numpad 6 | L | Look right |
| **Camera Pan Up** | Numpad 8 | I | Look up |
| **Camera Pan Down** | Numpad 2 | K | Look down |
| **Zoom In** | + | Mouse Wheel Up | Zoom camera |
| **Zoom Out** | - | Mouse Wheel Down | Zoom out |
| **Reset Camera** | R | Numpad 5 | Reset to default |
| **Free Look** | Mouse Hold | | Click and drag |
| **Cycle Camera** | C | | Change view mode |
| **Cockpit View** | V | F1 | First-person |
| **Chase View** | B | F2 | Third-person |
| **Orbit View** | N | F3 | Free orbit |

### System Controls

| Action | Key | Description |
|--------|-----|-------------|
| **Pause** | P | Pause/Unpause |
| **Reset Aircraft** | Backspace | Reset to start |
| **Toggle HUD** | H | Show/hide HUD |
| **Toggle Help** | F1 | Show controls |
| **Screenshot** | F12 | Capture screen |
| **Menu** | Esc | Open menu |

### Advanced Controls

| Action | Key | Description |
|--------|-----|-------------|
| **Landing Gear** | G | Gear up/down |
| **Flaps Up** | [ | Retract flaps |
| **Flaps Down** | ] | Extend flaps |
| **Air Brakes** | / | Speed brakes |
| **Autopilot** | A | Toggle AP |
| **Trim Nose Up** | Home | Trim up |
| **Trim Nose Down** | End | Trim down |

## Gamepad Controls (Xbox/PlayStation)

### Layout Diagram

```
         ┌─────┐
    LB   │     │   RB        ← Triggers/Bumpers
    ────────────────────
    │         │         │
    │    LT  │ RT      │    ← Analog Triggers
    │         │         │
    │ LS      │      RS │   ← Analog Sticks
    │  ↻      │      ↻  │
    │         │         │
    │  D-Pad  │  ABXY   │   ← Buttons
    │         │         │
    └─────────────────────┘
```

### Control Mapping

| Input | Action | Description |
|-------|--------|-------------|
| **Left Stick X** | Roll | Aileron control |
| **Left Stick Y** | Pitch | Elevator control |
| **Right Stick X** | Yaw | Rudder control |
| **Right Stick Y** | Camera | Camera pitch |
| **LT (Left Trigger)** | Decrease Throttle | Analog throttle down |
| **RT (Right Trigger)** | Increase Throttle | Analog throttle up |
| **LB (Left Bumper)** | Previous Camera | Cycle views backward |
| **RB (Right Bumper)** | Next Camera | Cycle views forward |
| **D-Pad Up** | Trim Up | Pitch trim up |
| **D-Pad Down** | Trim Down | Pitch trim down |
| **D-Pad Left** | Flaps Up | Retract flaps |
| **D-Pad Right** | Flaps Down | Extend flaps |
| **A (Cross)** | Landing Gear | Toggle gear |
| **B (Circle)** | Air Brakes | Toggle brakes |
| **X (Square)** | Autopilot | Toggle AP |
| **Y (Triangle)** | Cockpit View | Toggle view |
| **Start** | Pause | Pause menu |
| **Select (Back)** | Reset | Reset aircraft |
| **L3 (L Stick Press)** | Center Camera | Reset camera |
| **R3 (R Stick Press)** | Toggle HUD | Show/hide HUD |

### Sensitivity Settings

```javascript
const gamepadConfig = {
    sticks: {
        deadzone: 0.15,      // 15% deadzone
        sensitivity: 1.0,     // 100% sensitivity
        exponential: 1.2      // Slight curve for precision
    },
    triggers: {
        deadzone: 0.05,      // 5% deadzone
        sensitivity: 1.0
    }
};
```

## Touch Controls (Mobile)

### Layout

```
┌─────────────────────────┐
│  Airspeed    Altitude   │  ← Status
├─────────────────────────┤
│                         │
│                         │
│     Game View           │
│                         │
│                         │
├──────────┬──────────────┤
│          │              │
│ Virtual  │   Throttle   │
│ Joystick │   Slider     │
│    ↻     │   ║║║║║║     │
│          │   ▓▓▓▓▓▓     │
│          │              │
│          │ [L]     [R]  │  ← Yaw
└──────────┴──────────────┘
```

### Controls

#### Virtual Joystick (Left)
- **Center**: Neutral position
- **Drag Up**: Pitch up
- **Drag Down**: Pitch down
- **Drag Left**: Roll left
- **Drag Right**: Roll right
- **Returns to center** when released

#### Throttle Slider (Right)
- **Slide Up**: Increase throttle
- **Slide Down**: Decrease throttle
- **Tap Top**: Full throttle
- **Tap Bottom**: Idle throttle

#### Yaw Buttons (Right Bottom)
- **[L] Button**: Yaw left
- **[R] Button**: Yaw right

#### Touch Gestures
- **Pinch**: Zoom camera
- **Two-finger Drag**: Pan camera
- **Double Tap**: Reset camera
- **Three-finger Tap**: Toggle HUD

### Gyroscope Controls (Optional)

When enabled:
- **Tilt Device Left/Right**: Roll
- **Tilt Device Forward/Back**: Pitch
- **Combine with virtual joystick** for fine control

```javascript
const gyroConfig = {
    enabled: false,          // Off by default
    sensitivity: 0.5,        // 50% sensitivity
    smoothing: 0.2,          // 20% smoothing
    invertPitch: false,
    invertRoll: false
};
```

## Alternative Control Schemes

### Scheme 1: "Classic" (Current Default)
- WASD for pitch and roll
- QE for yaw
- Shift/Ctrl for throttle

### Scheme 2: "Flight Sim"
- Arrow keys for pitch and roll
- AZ for throttle
- QE for yaw
- More traditional sim controls

### Scheme 3: "Arcade"
- WASD for pitch and roll
- Mouse for yaw
- Space to increase throttle
- Shift to decrease
- Simplified for casual play

### Scheme 4: "Custom"
- Fully rebindable keys
- User-defined mappings
- Saved to local storage

## Key Binding UI

### Rebind Interface

```
┌───────────────────────────────────┐
│         Control Settings          │
├───────────────────────────────────┤
│                                   │
│  Pitch Up:        [  W  ] [Edit] │
│  Pitch Down:      [  S  ] [Edit] │
│  Roll Left:       [  A  ] [Edit] │
│  Roll Right:      [  D  ] [Edit] │
│  Yaw Left:        [  Q  ] [Edit] │
│  Yaw Right:       [  E  ] [Edit] │
│  ...                              │
│                                   │
│  ┌─────────┐    ┌──────────────┐ │
│  │  Reset  │    │ Save Changes │ │
│  └─────────┘    └──────────────┘ │
└───────────────────────────────────┘
```

### Rebinding Process
1. Click [Edit] button
2. Dialog: "Press key for Pitch Up"
3. User presses new key
4. System checks for conflicts
5. If conflict, offer to swap or cancel
6. Confirm and save

## Conflict Resolution

When two actions are mapped to the same key:

```
┌───────────────────────────────────┐
│     Key Conflict Detected         │
├───────────────────────────────────┤
│                                   │
│  Key 'W' is already used for:    │
│  "Pitch Up"                       │
│                                   │
│  Do you want to:                  │
│                                   │
│  ⚪ Swap bindings                 │
│  ⚪ Remove old binding             │
│  ⚪ Cancel                         │
│                                   │
│         ┌────────┐                │
│         │   OK   │                │
│         └────────┘                │
└───────────────────────────────────┘
```

## Input Sensitivity

### Keyboard
- **Digital input**: On/off only
- **Ramping**: Smooth transition to target
- **Ramp time**: 0.2 seconds

### Gamepad
- **Analog input**: 0-100% range
- **Deadzone**: Ignore small inputs
- **Exponential curve**: Fine control at center
- **Max rate**: Full deflection at edges

### Touch
- **Virtual joystick**: Proportional to drag distance
- **Maximum range**: 50 pixels from center
- **Visual feedback**: Joystick moves with finger
- **Haptic feedback**: Vibrate on boundary

## Sensitivity Settings

```javascript
const sensitivityConfig = {
    keyboard: {
        pitchRate: 50,       // deg/s
        rollRate: 120,       // deg/s
        yawRate: 30,         // deg/s
        throttleRate: 0.5    // %/s
    },
    gamepad: {
        pitchSensitivity: 1.0,
        rollSensitivity: 1.0,
        yawSensitivity: 0.8,
        throttleSensitivity: 1.0,
        exponential: 1.2
    },
    touch: {
        joystickSensitivity: 1.0,
        throttleSensitivity: 1.0
    }
};
```

## Accessibility Options

### Input Assistance
- **Auto-level**: Automatically level wings when no input
- **Simplified controls**: Reduced control axes
- **Hold to activate**: Hold instead of toggle
- **One-button mode**: Automated flight with single button

### Keyboard Accessibility
- **One-handed mode**: All controls on one side
- **Sticky keys**: Press sequentially instead of simultaneously
- **Toggle modifiers**: Shift/Ctrl toggle instead of hold
- **Macro buttons**: Combine multiple actions

### Visual Feedback
- **Show key presses**: On-screen display of inputs
- **Control hints**: Highlight available controls
- **Tutorial overlays**: Interactive learning

## Input Priority

When multiple input methods are active:

1. **Gamepad** (if connected and active)
2. **Touch** (on mobile devices)
3. **Keyboard** (default fallback)

User can override in settings.

## Context-Sensitive Controls

### Ground Operations
- Throttle affects taxi speed
- Rudder for ground steering
- Brakes more effective

### Flight
- All controls active
- Aerodynamic effects
- Speed affects control authority

### Menu/Pause
- Flight controls disabled
- UI navigation controls active
- Escape/pause always active

## Quick Reference Card

```
┌─────────────────────────────────────┐
│        QUICK REFERENCE              │
├─────────────────────────────────────┤
│  Flight:                            │
│    WASD - Pitch & Roll              │
│    QE - Yaw                         │
│    Shift/Ctrl - Throttle            │
│                                     │
│  Camera:                            │
│    Mouse - Look around              │
│    +/- - Zoom                       │
│    R - Reset                        │
│    C - Change view                  │
│                                     │
│  System:                            │
│    P - Pause                        │
│    Esc - Menu                       │
│    H - Toggle HUD                   │
│                                     │
│  Press F1 for full controls         │
└─────────────────────────────────────┘
```

## Testing Controls

All control schemes should be tested for:
- ✅ Responsiveness (< 16ms latency)
- ✅ Accuracy (precise control)
- ✅ Comfort (natural feel)
- ✅ Accessibility (multiple options)
- ✅ Conflict resolution
- ✅ Customization
- ✅ Cross-platform consistency
