/**
 * constants.js
 * Shared constants used across the flight simulator.
 */

/**
 * Color palette for the simulator
 */
export const COLORS = Object.freeze({
    SKY_BLUE: 0x87ceeb,
    GROUND_GREEN: 0x3d5c3d,
    RUNWAY_GRAY: 0x333333,
    MARKER_WHITE: 0xffffff,
    BUILDING_GRAY: 0x888888,
    TREE_TRUNK: 0x8B4513,
    TREE_FOLIAGE: 0x228B22,
    AIRCRAFT_BLUE: 0x3498db,
    ACCENT_DARK: 0x2c3e50
});

/**
 * Environment settings
 */
export const ENVIRONMENT = Object.freeze({
    FOG_NEAR: 500,
    FOG_FAR: 8000,
    GROUND_SIZE: 20000,
    GRID_DIVISIONS: 200
});
