/**
 * Engine Physics Module Index
 * Exports all physics-related components
 */

export { GroundEffect } from './GroundEffect.js';
export { Wind } from './Wind.js';
export { Atmosphere } from './Atmosphere.js';

// Re-export main physics classes from the root physics module
export { FlightDynamics } from '../../physics/FlightDynamics.js';
export { FlightPhysics, CONSTANTS } from '../../physics/FlightPhysics.js';
export { AdvancedFlightModel, ADVANCED_CONSTANTS } from '../../physics/AdvancedFlightModel.js';
export { WindSystem, TurbulenceType, WIND_CONSTANTS } from '../../physics/WindSystem.js';
export { StallSpinDynamics, StallWarningLevel, SpinState, STALL_CONSTANTS } from '../../physics/StallSpinDynamics.js';
export { LandingGear, GearState, GEAR_CONSTANTS } from '../../physics/LandingGear.js';
export { GroundEffect as AdvancedGroundEffect, GROUND_EFFECT_CONSTANTS } from '../../physics/GroundEffect.js';
export { IFlightModel, FlightModelFidelity } from '../../physics/IFlightModel.js';

// Re-export default
import { FlightDynamics } from '../../physics/FlightDynamics.js';
export default FlightDynamics;
