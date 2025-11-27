/**
 * DamageModel.js
 * Aircraft damage model with damage types, effects, and structural integrity.
 * Simulates damage from various sources and applies realistic effects to flight.
 */

/**
 * Damage types that can affect aircraft
 */
export const DamageType = Object.freeze({
    COLLISION: 'collision',      // Ground or object collision
    OVERSPEED: 'overspeed',      // Structural damage from excessive speed
    OVERSTRESS: 'overstress',    // G-load structural damage
    ENGINE: 'engine',            // Engine damage
    FUEL_LEAK: 'fuelLeak',       // Fuel system damage
    CONTROL: 'control',          // Control surface damage
    STRUCTURAL: 'structural'     // General structural damage
});

/**
 * Aircraft components that can be damaged
 */
export const DamageComponent = Object.freeze({
    FUSELAGE: 'fuselage',
    LEFT_WING: 'leftWing',
    RIGHT_WING: 'rightWing',
    TAIL: 'tail',
    ENGINE: 'engine',
    LANDING_GEAR: 'landingGear',
    CONTROLS: 'controls',
    FUEL_SYSTEM: 'fuelSystem'
});

/**
 * Damage severity levels
 */
export const DamageSeverity = Object.freeze({
    NONE: 0,
    MINOR: 1,     // <25% damage - minor performance reduction
    MODERATE: 2,   // 25-50% damage - significant performance reduction
    SEVERE: 3,     // 50-75% damage - critical performance reduction
    CRITICAL: 4    // >75% damage - component failure imminent
});

/**
 * DamageModel class
 * Tracks and applies damage to aircraft components.
 */
export class DamageModel {
    /**
     * Create a new DamageModel instance
     * @param {Object} [config] - Configuration options
     * @param {boolean} [config.enabled=true] - Whether damage model is enabled
     * @param {number} [config.maxGLoad=6] - Maximum G-load before overstress damage
     * @param {number} [config.negativeGLimit=-3] - Minimum G-load before overstress
     * @param {number} [config.maxSpeed=250] - Maximum speed (m/s) before overspeed damage
     * @param {number} [config.hardLandingThreshold=5] - Vertical speed (m/s) for hard landing
     * @param {number} [config.crashThreshold=15] - Vertical speed (m/s) for crash
     */
    constructor(config = {}) {
        this.enabled = config.enabled !== false;
        this.maxGLoad = config.maxGLoad || 6;
        this.negativeGLimit = config.negativeGLimit || -3;
        this.maxSpeed = config.maxSpeed || 250;
        this.hardLandingThreshold = config.hardLandingThreshold || 5;
        this.crashThreshold = config.crashThreshold || 15;

        // Component health (0-100%)
        this._componentHealth = {
            [DamageComponent.FUSELAGE]: 100,
            [DamageComponent.LEFT_WING]: 100,
            [DamageComponent.RIGHT_WING]: 100,
            [DamageComponent.TAIL]: 100,
            [DamageComponent.ENGINE]: 100,
            [DamageComponent.LANDING_GEAR]: 100,
            [DamageComponent.CONTROLS]: 100,
            [DamageComponent.FUEL_SYSTEM]: 100
        };

        // Damage event history
        this._damageHistory = [];

        // Listeners for damage events
        this._listeners = new Set();
    }

    /**
     * Get health of a specific component
     * @param {string} component - DamageComponent value
     * @returns {number} Health percentage (0-100)
     */
    getComponentHealth(component) {
        return this._componentHealth[component] ?? 0;
    }

    /**
     * Get overall aircraft health (average of all components)
     * @returns {number} Health percentage (0-100)
     */
    getOverallHealth() {
        const values = Object.values(this._componentHealth);
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    /**
     * Get damage severity for a component
     * @param {string} component - DamageComponent value
     * @returns {number} DamageSeverity value
     */
    getSeverity(component) {
        const health = this.getComponentHealth(component);
        
        if (health >= 100) return DamageSeverity.NONE;
        if (health >= 75) return DamageSeverity.MINOR;
        if (health >= 50) return DamageSeverity.MODERATE;
        if (health >= 25) return DamageSeverity.SEVERE;
        return DamageSeverity.CRITICAL;
    }

    /**
     * Apply damage to a component
     * @param {string} component - DamageComponent value
     * @param {number} amount - Damage amount (0-100)
     * @param {string} type - DamageType value
     * @param {string} [cause] - Description of damage cause
     * @returns {Object} Damage result with old/new health
     */
    applyDamage(component, amount, type, cause = '') {
        if (!this.enabled) {
            return { applied: false, reason: 'Damage model disabled' };
        }

        if (!(component in this._componentHealth)) {
            return { applied: false, reason: 'Unknown component' };
        }

        const oldHealth = this._componentHealth[component];
        const newHealth = Math.max(0, oldHealth - amount);
        this._componentHealth[component] = newHealth;

        const event = {
            timestamp: Date.now(),
            component,
            type,
            amount,
            cause,
            oldHealth,
            newHealth,
            severity: this.getSeverity(component)
        };

        this._damageHistory.push(event);
        this._notifyListeners(event);

        return {
            applied: true,
            oldHealth,
            newHealth,
            severity: event.severity
        };
    }

    /**
     * Repair a component
     * @param {string} component - DamageComponent value
     * @param {number} amount - Repair amount (0-100)
     * @returns {Object} Repair result
     */
    repair(component, amount) {
        if (!(component in this._componentHealth)) {
            return { applied: false, reason: 'Unknown component' };
        }

        const oldHealth = this._componentHealth[component];
        const newHealth = Math.min(100, oldHealth + amount);
        this._componentHealth[component] = newHealth;

        return {
            applied: true,
            oldHealth,
            newHealth
        };
    }

    /**
     * Fully repair all components
     */
    repairAll() {
        for (const component of Object.keys(this._componentHealth)) {
            this._componentHealth[component] = 100;
        }
        this._damageHistory = [];
    }

    /**
     * Update damage model based on flight conditions
     * @param {Object} state - Current flight state
     * @param {number} state.airspeed - Current airspeed (m/s)
     * @param {number} state.loadFactor - Current G-load
     * @param {number} state.verticalSpeed - Vertical speed (m/s)
     * @param {boolean} state.isOnGround - Whether aircraft is on ground
     * @param {number} deltaTime - Time step in seconds
     * @returns {Object} Damage effects to apply
     */
    update(state, deltaTime) {
        if (!this.enabled) {
            return this._createEffectsObject();
        }

        // Check for overspeed damage
        if (state.airspeed > this.maxSpeed) {
            const excess = state.airspeed - this.maxSpeed;
            const damageRate = (excess / this.maxSpeed) * 10 * deltaTime;
            this.applyDamage(DamageComponent.FUSELAGE, damageRate, DamageType.OVERSPEED, 'Structural overspeed');
            this.applyDamage(DamageComponent.LEFT_WING, damageRate * 0.5, DamageType.OVERSPEED, 'Wing stress');
            this.applyDamage(DamageComponent.RIGHT_WING, damageRate * 0.5, DamageType.OVERSPEED, 'Wing stress');
        }

        // Check for G-load damage
        if (state.loadFactor > this.maxGLoad || state.loadFactor < this.negativeGLimit) {
            const excess = state.loadFactor > 0 
                ? Math.max(0, state.loadFactor - this.maxGLoad)
                : Math.max(0, this.negativeGLimit - state.loadFactor);
            const damageRate = excess * 5 * deltaTime;
            this.applyDamage(DamageComponent.FUSELAGE, damageRate, DamageType.OVERSTRESS, `G-load: ${state.loadFactor.toFixed(1)}G`);
            this.applyDamage(DamageComponent.LEFT_WING, damageRate * 0.8, DamageType.OVERSTRESS, 'Wing spar stress');
            this.applyDamage(DamageComponent.RIGHT_WING, damageRate * 0.8, DamageType.OVERSTRESS, 'Wing spar stress');
        }

        // Check for hard landing/crash
        if (state.isOnGround && state.verticalSpeed < -this.hardLandingThreshold) {
            const impactSpeed = Math.abs(state.verticalSpeed);
            
            if (impactSpeed >= this.crashThreshold) {
                // Crash - severe damage to all components
                const damage = Math.min(100, (impactSpeed / this.crashThreshold) * 50);
                this.applyDamage(DamageComponent.LANDING_GEAR, damage, DamageType.COLLISION, 'Crash landing');
                this.applyDamage(DamageComponent.FUSELAGE, damage * 0.7, DamageType.COLLISION, 'Crash impact');
                this.applyDamage(DamageComponent.ENGINE, damage * 0.5, DamageType.COLLISION, 'Crash impact');
            } else {
                // Hard landing - landing gear damage
                const damage = ((impactSpeed - this.hardLandingThreshold) / 
                    (this.crashThreshold - this.hardLandingThreshold)) * 30;
                this.applyDamage(DamageComponent.LANDING_GEAR, damage, DamageType.COLLISION, 'Hard landing');
            }
        }

        return this._calculateEffects();
    }

    /**
     * Calculate damage effects on aircraft performance
     * @returns {Object} Effects to apply
     * @private
     */
    _calculateEffects() {
        const effects = this._createEffectsObject();

        // Engine damage reduces thrust
        effects.thrustMultiplier = this._componentHealth[DamageComponent.ENGINE] / 100;

        // Wing damage reduces lift and increases drag
        const avgWingHealth = (this._componentHealth[DamageComponent.LEFT_WING] + 
            this._componentHealth[DamageComponent.RIGHT_WING]) / 2;
        effects.liftMultiplier = 0.5 + (avgWingHealth / 200);
        effects.dragMultiplier = 2 - (avgWingHealth / 100);

        // Wing asymmetry causes roll
        const wingDifference = this._componentHealth[DamageComponent.LEFT_WING] - 
            this._componentHealth[DamageComponent.RIGHT_WING];
        effects.rollBias = -wingDifference / 100 * 0.3;

        // Tail damage affects pitch and yaw authority
        const tailHealth = this._componentHealth[DamageComponent.TAIL] / 100;
        effects.pitchAuthority = tailHealth;
        effects.yawAuthority = tailHealth;

        // Control damage reduces all control authority
        const controlHealth = this._componentHealth[DamageComponent.CONTROLS] / 100;
        effects.pitchAuthority *= controlHealth;
        effects.rollAuthority = controlHealth;
        effects.yawAuthority *= controlHealth;

        // Fuel system damage causes fuel leak
        effects.fuelLeakRate = (100 - this._componentHealth[DamageComponent.FUEL_SYSTEM]) / 100 * 0.5;

        // Landing gear damage affects ground handling
        effects.landingGearFunctional = this._componentHealth[DamageComponent.LANDING_GEAR] > 25;

        return effects;
    }

    /**
     * Create default effects object
     * @returns {Object}
     * @private
     */
    _createEffectsObject() {
        return {
            thrustMultiplier: 1.0,
            liftMultiplier: 1.0,
            dragMultiplier: 1.0,
            rollBias: 0,
            pitchAuthority: 1.0,
            rollAuthority: 1.0,
            yawAuthority: 1.0,
            fuelLeakRate: 0,
            landingGearFunctional: true
        };
    }

    /**
     * Check if aircraft is destroyed (any critical component at 0)
     * @returns {boolean}
     */
    isDestroyed() {
        const criticalComponents = [
            DamageComponent.FUSELAGE,
            DamageComponent.LEFT_WING,
            DamageComponent.RIGHT_WING,
            DamageComponent.TAIL
        ];

        return criticalComponents.some(comp => this._componentHealth[comp] <= 0);
    }

    /**
     * Get all component health values
     * @returns {Object}
     */
    getAllHealth() {
        return { ...this._componentHealth };
    }

    /**
     * Get damage history
     * @param {number} [limit] - Maximum events to return
     * @returns {Array}
     */
    getHistory(limit) {
        if (limit) {
            return this._damageHistory.slice(-limit);
        }
        return [...this._damageHistory];
    }

    /**
     * Add damage event listener
     * @param {Function} callback - Function(event) called on damage
     */
    addListener(callback) {
        this._listeners.add(callback);
    }

    /**
     * Remove damage event listener
     * @param {Function} callback
     */
    removeListener(callback) {
        this._listeners.delete(callback);
    }

    /**
     * Notify listeners of damage event
     * @param {Object} event - Damage event
     * @private
     */
    _notifyListeners(event) {
        for (const callback of this._listeners) {
            try {
                callback(event);
            } catch (err) {
                console.error('DamageModel: Listener error:', err);
            }
        }
    }

    /**
     * Enable or disable damage model
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Reset damage model to initial state
     */
    reset() {
        this.repairAll();
    }

    /**
     * Get debug information
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            enabled: this.enabled,
            overallHealth: this.getOverallHealth(),
            componentHealth: this.getAllHealth(),
            isDestroyed: this.isDestroyed(),
            effects: this._calculateEffects(),
            recentDamage: this.getHistory(5)
        };
    }
}

export default DamageModel;
