/**
 * Engine Aircraft Module Index
 * Exports all aircraft-related components
 */

export { Aircraft } from './Aircraft.js';
export { AircraftFactory } from './AircraftFactory.js';

// Aircraft models
export { BasicJet } from './models/BasicJet.js';
export { FighterF22 } from './models/FighterF22.js';
export { Cessna172 } from './models/Cessna172.js';

// Re-export default
import { Aircraft } from './Aircraft.js';
export default Aircraft;
