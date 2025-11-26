/**
 * Basic Jet Aircraft
 * Simple jet aircraft for tutorials and training
 */

import { AIRCRAFT_CONFIG } from '../../../config/aircraft.config.js';

export class BasicJet {
    constructor(config = {}) {
        const baseConfig = AIRCRAFT_CONFIG.basicJet;
        this.config = {
            ...baseConfig,
            ...config,
            physics: { ...baseConfig.physics, ...config.physics },
            visual: { ...baseConfig.visual, ...config.visual }
        };
        
        // TODO: Initialize aircraft systems
    }
    
    update(deltaTime) {
        // TODO: Update aircraft
    }
}

export default BasicJet;
