# HUD Layout

## Overview

The Heads-Up Display (HUD) provides essential flight information without obstructing the view. Design follows aviation standards while maintaining game usability.

## Desktop HUD Layout

```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────┐                       ┌─────────────┐  │
│ │   AIRSPEED  │                       │  ALTITUDE   │  │
│ │             │                       │             │  │
│ │    125 kt   │                       │   1,500 ft  │  │
│ │             │                       │             │  │
│ │  [▲▲▲▲▲▲]   │                       │  [▲▲▲▲▲▲]   │  │
│ └─────────────┘                       └─────────────┘  │
│                                                         │
│                                                         │
│                      Center Area                        │
│                   (Clear for view)                      │
│                                                         │
│                                                         │
│ ┌─────────────┐                       ┌─────────────┐  │
│ │  THROTTLE   │                       │  V/S RATE   │  │
│ │             │                       │             │  │
│ │     75%     │                       │  +500 fpm   │  │
│ │  ▓▓▓▓▓▓▓░░  │                       │     ▲       │  │
│ └─────────────┘                       └─────────────┘  │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ HDG: 090°  PITCH: +5°  ROLL: -2°    FPS: 60      │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## HUD Elements

### 1. Airspeed Indicator (Top Left)

```
┌─────────────┐
│  AIRSPEED   │
│             │
│   125 kt    │  ← Current airspeed
│             │
│  [▲▲▲▲▲▲]   │  ← Trend indicator
│             │
│  Vr: 55 kt  │  ← Rotation speed
│  Vs: 47 kt  │  ← Stall speed
└─────────────┘
```

**Features**:
- Large numeric display
- Color coding:
  - 🔴 Red: Below stall speed
  - 🟡 Yellow: Near stall (±10 kt)
  - 🟢 Green: Normal range
  - 🟡 Yellow: Near max speed
  - 🔴 Red: Above Vne (never exceed)
- Trend vector showing acceleration/deceleration

### 2. Altitude Indicator (Top Right)

```
┌─────────────┐
│  ALTITUDE   │
│             │
│  1,500 ft   │  ← Current altitude MSL
│             │
│  [▲▲▲▲▲▲]   │  ← Trend indicator
│             │
│  AGL: 450ft │  ← Height above ground
└─────────────┘
```

**Features**:
- Altitude above mean sea level (MSL)
- Height above ground level (AGL)
- Trend vector
- Color coding near ground:
  - 🔴 Red: < 100 ft AGL
  - 🟡 Yellow: 100-500 ft AGL
  - 🟢 Green: > 500 ft AGL

### 3. Attitude Indicator (Center, optional)

```
        ┌──── 10 ────┐
        │    ▲ 5     │
    ────┼────✈────┼────  ← Pitch ladder
        │    ▼ -5   │
        └──── -10 ───┘
```

**Features**:
- Pitch ladder
- Bank angle indicator
- Aircraft symbol (fixed)
- Horizon line (moves)

### 4. Throttle Indicator (Bottom Left)

```
┌─────────────┐
│  THROTTLE   │
│             │
│     75%     │  ← Current throttle
│  ▓▓▓▓▓▓▓░░  │  ← Visual bar
│             │
│  RPM: 2400  │  ← Engine RPM (if applicable)
└─────────────┘
```

**Features**:
- Percentage display
- Visual bar chart
- Engine RPM for prop aircraft
- Color coding:
  - 🟢 Green: Cruise power (50-75%)
  - 🟡 Yellow: High power (75-90%)
  - 🔴 Red: Maximum power (>90%)

### 5. Vertical Speed (Bottom Right)

```
┌─────────────┐
│   V/S RATE  │
│             │
│  +500 fpm   │  ← Climb rate
│      ▲      │  ← Visual indicator
│   ▓▓▓░      │
│   ▓▓▓░      │
│   ▓▓▓░      │
│   ═══       │  ← Zero line
└─────────────┘
```

**Features**:
- Feet per minute (fpm)
- Visual tape indicator
- Positive (climb) / Negative (descent)
- Color coding for safe descent rates

### 6. Bottom Status Bar

```
┌───────────────────────────────────────────────────────┐
│ HDG: 090°  PITCH: +5°  ROLL: -2°  G: 1.2   FPS: 60   │
└───────────────────────────────────────────────────────┘
```

**Information**:
- **HDG**: Heading (magnetic)
- **PITCH**: Pitch angle
- **ROLL**: Roll angle
- **G**: G-force
- **FPS**: Frame rate (debug)

## Mobile HUD Layout

### Simplified Design

```
┌─────────────────────────┐
│  120kt     500ft    ⏸  │  ← Minimal top bar
├─────────────────────────┤
│                         │
│    (Maximized View)     │
│                         │
│                         │
│                         │
│                         │
│    75%  ↑↓ +200fpm     │  ← Bottom bar
└─────────────────────────┘
```

**Features**:
- Minimal overlay
- Essential info only
- Larger text
- Touch-friendly buttons

## HUD Modes

### 1. Minimal Mode
- Airspeed and altitude only
- For experienced players
- Maximum view clarity

### 2. Standard Mode (Default)
- All primary instruments
- Balanced information/visibility
- Recommended for most users

### 3. Full Mode
- All instruments plus:
  - Compass rose
  - Fuel gauge
  - Navigation aids
  - Warning lights
  - For simulation enthusiasts

### 4. Training Mode
- Extra help for beginners:
  - Target speed indicators
  - Landing guidance
  - Stall warnings (visual)
  - Control input display

## Instrument Details

### Compass Rose (Optional)

```
       N
       ↑
   ╱   │   ╲
  W ─  ✈  ─ E
   ╲   │   ╱
       ↓
       S
```

**Features**:
- Cardinal directions
- Current heading highlighted
- Optional waypoint indicators

### Artificial Horizon (Optional)

```
┌─────────────┐
│  ╱     ╲    │  ← Sky (blue)
│ ─────────   │  ← Horizon line
│  ╲     ╱    │  ← Ground (brown)
│      ✈      │  ← Aircraft
└─────────────┘
```

**Features**:
- Pitch and bank indication
- Ground/sky color coding
- Fixed aircraft symbol

### G-Force Meter (Advanced)

```
┌─────────────┐
│  G-FORCE    │
│             │
│   │ 3.5 │   │
│   ▓▓▓░░     │
│  -1  0  +5  │
└─────────────┘
```

**Features**:
- Current G-load
- Max G indicator
- Warning at structural limits

## Warning Indicators

### Stall Warning
```
┌────────────────┐
│ ⚠️  STALL  ⚠️  │  ← Flashing red
└────────────────┘
```

### Overspeed Warning
```
┌────────────────┐
│ ⚠️ OVERSPEED ⚠️ │  ← Flashing red
└────────────────┘
```

### Altitude Warning
```
┌────────────────┐
│ ⚠️ PULL UP  ⚠️  │  ← Flashing red
└────────────────┘
```

### Low Fuel Warning
```
┌────────────────┐
│ ⚠️ LOW FUEL ⚠️  │  ← Flashing yellow
└────────────────┘
```

## Mission Objectives Display

```
┌───────────────────────────────┐
│  Mission: Landing Challenge   │
│                               │
│  ✅ Reach pattern altitude    │
│  ✅ Align with runway         │
│  ⏳ Land within 500 ft        │
│                               │
│  Time: 2:35                   │
└───────────────────────────────┘
```

## Waypoint Navigation

```
┌───────────────────────────────┐
│  Next Waypoint: ALPHA         │
│                               │
│  Distance: 5.2 nm             │
│  Bearing: 095°                │
│  ETA: 4:23                    │
│                               │
│      ╱                        │
│     ╱  ← 15° right           │
│    ✈                          │
└───────────────────────────────┘
```

## Color Coding Standards

### Speed Ranges
- **🔴 Red**: Dangerous (stall or overspeed)
- **🟡 Yellow**: Caution zone
- **🟢 Green**: Normal operating range
- **⚪ White**: Informational

### Altitude
- **🔴 Red**: < 100 ft AGL (ground proximity)
- **🟡 Yellow**: 100-500 ft AGL
- **🟢 Green**: > 500 ft AGL

### G-Force
- **🟢 Green**: 0-2.5 G (comfortable)
- **🟡 Yellow**: 2.5-4 G (stress)
- **🔴 Red**: > 4 G (structural concern)

## Opacity and Readability

- **Default Opacity**: 70%
- **Active/Warning**: 100%
- **Background**: Semi-transparent dark
- **Text**: High contrast white/light colors
- **Anti-aliasing**: Enabled for smooth text

## Customization Options

Users can customize:
- HUD mode (minimal/standard/full)
- Individual instrument visibility
- Position of instruments
- Opacity level
- Color scheme (for accessibility)
- Font size
- Unit system (kt/mph, ft/m)

## Responsive Design

### Desktop (> 1024px)
- Full HUD with all instruments
- Optimal spacing
- Multiple detail levels

### Tablet (768-1024px)
- Slightly condensed
- Essential instruments
- Larger text

### Mobile (< 768px)
- Minimal HUD
- Top and bottom bars only
- Maximum screen space for view

## Accessibility Features

- **High Contrast Mode**: Enhanced visibility
- **Colorblind Modes**: Alternative color schemes
  - Protanopia
  - Deuteranopia
  - Tritanopia
- **Large Text Mode**: 150% text size
- **Audio Callouts**: Optional voice warnings
- **Customizable Colors**: User-defined color schemes

## Performance Considerations

- **Canvas-based Rendering**: Separate 2D canvas overlay
- **Update Rate**: 60 Hz for smooth animations
- **Culling**: Only update visible elements
- **Text Caching**: Pre-render static text
- **GPU Acceleration**: Use CSS transforms where possible
