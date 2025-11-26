# UI Wireframes

## Main Menu

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                        AVION                            │
│                   Flight Simulator                      │
│                                                         │
│                  ┌─────────────┐                        │
│                  │  Free Flight│                        │
│                  └─────────────┘                        │
│                  ┌─────────────┐                        │
│                  │   Missions  │                        │
│                  └─────────────┘                        │
│                  ┌─────────────┐                        │
│                  │   Settings  │                        │
│                  └─────────────┘                        │
│                  ┌─────────────┐                        │
│                  │    About    │                        │
│                  └─────────────┘                        │
│                                                         │
│                                       v1.0.0            │
└─────────────────────────────────────────────────────────┘
```

## Aircraft Selection

```
┌─────────────────────────────────────────────────────────┐
│  ← Back          Select Aircraft                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │              │  │              │  │              │  │
│  │  Cessna 172  │  │   F-22       │  │  Boeing 747  │  │
│  │              │  │   Raptor     │  │              │  │
│  │  [Preview]   │  │  [Preview]   │  │  [Preview]   │  │
│  │              │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Aircraft: Cessna 172 Skyhawk                    │   │
│  │                                                 │   │
│  │ Max Speed: 135 knots                           │   │
│  │ Stall Speed: 47 knots                          │   │
│  │ Service Ceiling: 14,000 ft                     │   │
│  │ Range: 640 nm                                  │   │
│  │                                                 │   │
│  │ Difficulty: ★☆☆☆☆ (Beginner)                   │   │
│  │                                                 │   │
│  │         ┌──────────┐    ┌──────────┐           │   │
│  │         │   Fly    │    │ Customize│           │   │
│  │         └──────────┘    └──────────┘           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Mission Selection

```
┌─────────────────────────────────────────────────────────┐
│  ← Back             Missions                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Training Missions                                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ✅ 1. First Flight              ★★★     COMPLETE│   │
│  │ ✅ 2. Takeoff & Landing         ★★☆     COMPLETE│   │
│  │ 🔒 3. Basic Navigation          ☆☆☆     LOCKED  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Challenges                                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 📍 1. Crosswind Landing         ☆☆☆     AVAILABLE│   │
│  │ 🔒 2. Emergency Landing          ☆☆☆     LOCKED  │   │
│  │ 🔒 3. Aerobatic Display          ☆☆☆     LOCKED  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Mission: Crosswind Landing                      │   │
│  │                                                 │   │
│  │ Land safely at the airport while dealing with  │   │
│  │ strong crosswinds from the east.               │   │
│  │                                                 │   │
│  │ • Aircraft: Cessna 172                         │   │
│  │ • Location: Mountain Airport                   │   │
│  │ • Weather: Windy (15 kt crosswind)            │   │
│  │ • Duration: ~10 minutes                        │   │
│  │                                                 │   │
│  │                    ┌─────────┐                  │   │
│  │                    │  Start  │                  │   │
│  │                    └─────────┘                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Settings Screen

```
┌─────────────────────────────────────────────────────────┐
│  ← Back             Settings                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Graphics                                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Quality:      [Low] [Med] [High] [Ultra]        │   │
│  │ Shadows:      [On]  [Off]                       │   │
│  │ Antialiasing: [On]  [Off]                       │   │
│  │ View Distance: ▓▓▓▓▓▓▓░░░  (70%)                │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Audio                                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Master Volume:  ▓▓▓▓▓▓▓▓░░  (80%)               │   │
│  │ Engine Sounds:  ▓▓▓▓▓▓▓▓▓░  (90%)               │   │
│  │ Wind Sounds:    ▓▓▓▓▓░░░░░  (50%)               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Controls                                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Sensitivity:    ▓▓▓▓▓▓░░░░  (60%)               │   │
│  │ Invert Pitch:   [On]  [Off]                     │   │
│  │ Controller:     [Keyboard] [Gamepad] [Touch]    │   │
│  │ [Configure Keys]                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│              ┌─────────┐    ┌─────────┐                 │
│              │  Apply  │    │  Reset  │                 │
│              └─────────┘    └─────────┘                 │
└─────────────────────────────────────────────────────────┘
```

## Pause Menu (In-Game)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                      PAUSED                             │
│                                                         │
│                  ┌─────────────┐                        │
│                  │   Resume    │                        │
│                  └─────────────┘                        │
│                  ┌─────────────┐                        │
│                  │   Restart   │                        │
│                  └─────────────┘                        │
│                  ┌─────────────┐                        │
│                  │   Settings  │                        │
│                  └─────────────┘                        │
│                  ┌─────────────┐                        │
│                  │  Main Menu  │                        │
│                  └─────────────┘                        │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Mission Complete

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   MISSION COMPLETE!                     │
│                                                         │
│                      ★ ★ ★                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │  Time:              5:32                        │   │
│  │  Objectives:        3/3 Complete                │   │
│  │  Landing Score:     95/100                      │   │
│  │  Smoothness:        ★★★★☆                       │   │
│  │  Accuracy:          ★★★★★                       │   │
│  │                                                 │   │
│  │  Total Score:       2,850 pts                   │   │
│  │  Best Score:        2,850 pts  🆕 NEW RECORD!   │   │
│  │                                                 │   │
│  │  Achievement Unlocked!                          │   │
│  │  🏆 "Smooth Operator" - Land with score > 90    │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│         ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│         │  Retry   │  │   Next   │  │   Menu   │       │
│         └──────────┘  └──────────┘  └──────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Loading Screen

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                        AVION                            │
│                                                         │
│                   ┌─────────────┐                       │
│                   │   ✈️         │                       │
│                   └─────────────┘                       │
│                                                         │
│              Loading...                                 │
│              ▓▓▓▓▓▓▓▓▓░░░░░  (75%)                      │
│                                                         │
│              Generating terrain...                      │
│                                                         │
│                                                         │
│         Pro Tip: Use throttle to control your speed     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Mobile Layout

### Portrait Mode

```
┌───────────────────┐
│   120 kt  500 ft  │  ← Status bar
├───────────────────┤
│                   │
│                   │
│    Game View      │
│                   │
│                   │
│                   │
│                   │
├─────────┬─────────┤
│         │         │
│ Joystick│Throttle │  ← Touch controls
│ (Pitch/ │ Slider  │
│  Roll)  │         │
│         │ [L][R]  │  ← Yaw buttons
└─────────┴─────────┘
```

### Landscape Mode

```
┌───────────────────────────────────────────┐
│ 120kt  500ft                    ☰  ⏸     │
├───────────────────────────────────────────┤
│                                           │
│                                           │
│           Full Screen Game View           │
│                                           │
│                                           │
├─────────┬─────────────────────┬───────────┤
│         │                     │           │
│Joystick │                     │ Throttle  │
│         │                     │  & Yaw    │
└─────────┴─────────────────────┴───────────┘
```

## UI Color Scheme

### Primary Colors
- **Background**: `#1a1a2e` (Dark Blue)
- **Primary**: `#0f3460` (Medium Blue)
- **Secondary**: `#16213e` (Dark Blue-Gray)
- **Accent**: `#e94560` (Red/Pink)
- **Success**: `#00d9a3` (Teal)
- **Warning**: `#ffa500` (Orange)

### Text Colors
- **Primary Text**: `#ffffff` (White)
- **Secondary Text**: `#a8b2d1` (Light Blue-Gray)
- **Disabled**: `#64748b` (Gray)

### UI Elements
- **Buttons**: Accent color with hover effects
- **Input Fields**: Dark with light border
- **Progress Bars**: Gradient from primary to accent
- **Cards**: Secondary background with subtle shadow

## Typography

- **Headings**: "Orbitron" or "Rajdhani" (Futuristic)
- **Body**: "Roboto" or "Inter" (Clean, readable)
- **Monospace**: "Roboto Mono" (For technical data)

## Animation Principles

1. **Smooth Transitions**: 0.2-0.3s ease-in-out
2. **Button Hover**: Scale up slightly (1.05x)
3. **Page Transitions**: Fade or slide
4. **Loading**: Pulsing or animated progress
5. **Feedback**: Immediate visual response to clicks

## Accessibility

- **Contrast Ratio**: Minimum 4.5:1 for text
- **Focus Indicators**: Clear outline on keyboard navigation
- **Touch Targets**: Minimum 44x44px on mobile
- **Screen Reader**: Semantic HTML and ARIA labels
- **Colorblind Mode**: Alternative color schemes available
