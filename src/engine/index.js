/**
 * Avion Engine - Main Index
 * Central export point for all engine modules
 */

// Core engine
export { Engine } from './core/Engine.js';
export { Time } from './core/Time.js';
export { Loop } from './core/Loop.js';

// Physics
export * from './physics/index.js';

// Rendering
export * from './rendering/index.js';

// Controls
export * from './controls/index.js';

// Aircraft
export * from './aircraft/index.js';

// Environment
export * from './environment/index.js';

// Utils
export * from './utils/index.js';

// Configuration
export { ENGINE_CONFIG } from '../config/engine.config.js';
export { AIRCRAFT_CONFIG } from '../config/aircraft.config.js';
export { ENVIRONMENT_CONFIG } from '../config/environment.config.js';
export { MOBILE_CONFIG } from '../config/mobile.config.js';

// Re-export Engine as default
import { Engine } from './core/Engine.js';
export default Engine;
