/**
 * Cessna 172 Skyhawk
 * Light general aviation training aircraft
 */

import { AIRCRAFT_CONFIG } from '../../../config/aircraft.config.js';

export class Cessna172 {
    constructor(config = {}) {
        const baseConfig = AIRCRAFT_CONFIG.cessna172;
        this.config = {
            ...baseConfig,
            ...config,
            physics: { ...baseConfig.physics, ...config.physics },
            visual: { ...baseConfig.visual, ...config.visual }
        };
        
        this.flapsPosition = 0;  // 0-1
        this.gearDown = true;
        
        // TODO: Initialize aircraft systems
    }
    
    setFlaps(position) {
        this.flapsPosition = Math.max(0, Math.min(1, position));
        // TODO: Update aerodynamics
    }
    
    toggleGear() {
        this.gearDown = !this.gearDown;
        // TODO: Animate gear
    }
    
    update(deltaTime) {
        // TODO: Update aircraft
    }
}

export default Cessna172;
