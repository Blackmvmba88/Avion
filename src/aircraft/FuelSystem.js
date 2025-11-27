/**
 * FuelSystem.js
 * Aircraft fuel system with tank management, consumption, and weight effects.
 * Simulates realistic fuel behavior including tank priority and consumption rates.
 */

/**
 * Fuel types and their properties
 */
export const FuelType = Object.freeze({
    AVGAS: {
        name: 'AVGAS 100LL',
        density: 0.72,         // kg/liter
        energyDensity: 43.5    // MJ/kg
    },
    JET_A: {
        name: 'Jet A',
        density: 0.804,
        energyDensity: 43.0
    },
    JET_A1: {
        name: 'Jet A-1',
        density: 0.804,
        energyDensity: 43.2
    }
});

/**
 * Tank positions for fuel distribution
 */
export const TankPosition = Object.freeze({
    CENTER: 'center',
    LEFT_WING: 'leftWing',
    RIGHT_WING: 'rightWing',
    LEFT_AUX: 'leftAux',
    RIGHT_AUX: 'rightAux',
    EXTERNAL: 'external'
});

/**
 * FuelTank class
 * Represents a single fuel tank with capacity and current level.
 */
export class FuelTank {
    /**
     * Create a new FuelTank
     * @param {Object} config - Tank configuration
     * @param {string} config.position - TankPosition value
     * @param {number} config.capacity - Tank capacity in liters
     * @param {number} [config.initialLevel] - Initial fuel level in liters
     * @param {number} [config.priority=1] - Draw priority (lower = drawn first)
     * @param {boolean} [config.isExternal=false] - Whether tank is external (droppable)
     */
    constructor(config) {
        this.position = config.position;
        this.capacity = config.capacity;
        this.currentLevel = config.initialLevel ?? config.capacity;
        this.priority = config.priority ?? 1;
        this.isExternal = config.isExternal ?? false;
        this.isUsable = true;
    }

    /**
     * Get current fuel level
     * @returns {number} Fuel level in liters
     */
    getLevel() {
        return this.currentLevel;
    }

    /**
     * Get fill percentage
     * @returns {number} Percentage (0-100)
     */
    getPercentage() {
        return (this.currentLevel / this.capacity) * 100;
    }

    /**
     * Draw fuel from tank
     * @param {number} amount - Amount to draw in liters
     * @returns {number} Amount actually drawn
     */
    draw(amount) {
        if (!this.isUsable) return 0;
        
        const drawn = Math.min(amount, this.currentLevel);
        this.currentLevel -= drawn;
        return drawn;
    }

    /**
     * Add fuel to tank
     * @param {number} amount - Amount to add in liters
     * @returns {number} Amount actually added
     */
    add(amount) {
        const space = this.capacity - this.currentLevel;
        const added = Math.min(amount, space);
        this.currentLevel += added;
        return added;
    }

    /**
     * Check if tank is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.currentLevel <= 0;
    }

    /**
     * Check if tank is full
     * @returns {boolean}
     */
    isFull() {
        return this.currentLevel >= this.capacity;
    }
}

/**
 * FuelSystem class
 * Manages multiple fuel tanks and fuel consumption.
 */
export class FuelSystem {
    /**
     * Create a new FuelSystem
     * @param {Object} [config] - Configuration options
     * @param {string} [config.fuelType='JET_A'] - Fuel type key
     * @param {number} [config.baseConsumptionRate=0.5] - Base consumption in liters/second at full throttle
     * @param {Array} [config.tanks] - Array of tank configurations
     */
    constructor(config = {}) {
        // Fuel type configuration
        this.fuelType = FuelType[config.fuelType] || FuelType.JET_A;
        
        // Base consumption rate (liters per second at 100% throttle, sea level)
        this.baseConsumptionRate = config.baseConsumptionRate ?? 0.5;
        
        // Fuel tanks
        this._tanks = new Map();
        
        // Initialize tanks from config or use defaults
        if (config.tanks && config.tanks.length > 0) {
            for (const tankConfig of config.tanks) {
                this.addTank(tankConfig);
            }
        } else {
            // Default configuration: center tank + wing tanks
            this.addTank({ position: TankPosition.CENTER, capacity: 200, priority: 1 });
            this.addTank({ position: TankPosition.LEFT_WING, capacity: 150, priority: 2 });
            this.addTank({ position: TankPosition.RIGHT_WING, capacity: 150, priority: 2 });
        }
        
        // Consumption tracking
        this._totalConsumed = 0;
        this._consumptionHistory = [];
        
        // Emergency fuel level threshold
        this.emergencyLevel = config.emergencyLevel ?? 50; // liters
        this.lowFuelLevel = config.lowFuelLevel ?? 100; // liters
        
        // Listeners
        this._listeners = new Set();
    }

    /**
     * Add a fuel tank
     * @param {Object} config - Tank configuration
     * @returns {FuelTank}
     */
    addTank(config) {
        const tank = new FuelTank(config);
        this._tanks.set(config.position, tank);
        return tank;
    }

    /**
     * Remove a fuel tank (for droppable external tanks)
     * @param {string} position - Tank position
     * @returns {boolean} True if removed
     */
    removeTank(position) {
        const tank = this._tanks.get(position);
        if (tank && tank.isExternal) {
            this._tanks.delete(position);
            this._notifyListeners({ type: 'tankDropped', position });
            return true;
        }
        return false;
    }

    /**
     * Get a specific tank
     * @param {string} position - Tank position
     * @returns {FuelTank|undefined}
     */
    getTank(position) {
        return this._tanks.get(position);
    }

    /**
     * Get all tanks
     * @returns {FuelTank[]}
     */
    getAllTanks() {
        return Array.from(this._tanks.values());
    }

    /**
     * Get total fuel capacity
     * @returns {number} Total capacity in liters
     */
    getTotalCapacity() {
        let total = 0;
        for (const tank of this._tanks.values()) {
            total += tank.capacity;
        }
        return total;
    }

    /**
     * Get current total fuel level
     * @returns {number} Total fuel in liters
     */
    getTotalFuel() {
        let total = 0;
        for (const tank of this._tanks.values()) {
            total += tank.currentLevel;
        }
        return total;
    }

    /**
     * Get total fuel weight
     * @returns {number} Fuel weight in kg
     */
    getFuelWeight() {
        return this.getTotalFuel() * this.fuelType.density;
    }

    /**
     * Get fuel percentage
     * @returns {number} Percentage (0-100)
     */
    getFuelPercentage() {
        const capacity = this.getTotalCapacity();
        if (capacity <= 0) return 0;
        return (this.getTotalFuel() / capacity) * 100;
    }

    /**
     * Consume fuel based on current throttle and conditions
     * @param {Object} state - Current state
     * @param {number} state.throttle - Throttle setting (0-1)
     * @param {number} state.altitude - Altitude in meters
     * @param {number} state.airspeed - Airspeed in m/s
     * @param {number} deltaTime - Time step in seconds
     * @returns {Object} Consumption result
     */
    consumeFuel(state, deltaTime) {
        // Calculate consumption rate
        const consumptionRate = this._calculateConsumptionRate(state);
        const fuelNeeded = consumptionRate * deltaTime;
        
        // Draw fuel from tanks by priority
        const fuelDrawn = this._drawFuel(fuelNeeded);
        
        // Track consumption
        this._totalConsumed += fuelDrawn;
        this._consumptionHistory.push({
            timestamp: Date.now(),
            amount: fuelDrawn,
            throttle: state.throttle
        });
        
        // Keep history limited
        if (this._consumptionHistory.length > 1000) {
            this._consumptionHistory = this._consumptionHistory.slice(-500);
        }
        
        // Check fuel warnings
        const totalFuel = this.getTotalFuel();
        const warnings = this._checkWarnings(totalFuel);
        
        // Notify listeners if warnings changed
        if (warnings.length > 0) {
            this._notifyListeners({ type: 'warnings', warnings });
        }
        
        return {
            consumed: fuelDrawn,
            rate: consumptionRate,
            remaining: totalFuel,
            weight: this.getFuelWeight(),
            percentage: this.getFuelPercentage(),
            engineRunning: fuelDrawn >= fuelNeeded * 0.9,
            warnings
        };
    }

    /**
     * Calculate fuel consumption rate based on conditions
     * @param {Object} state - Current state
     * @returns {number} Consumption rate in liters/second
     * @private
     */
    _calculateConsumptionRate(state) {
        // Base consumption scaled by throttle
        let rate = this.baseConsumptionRate * state.throttle;
        
        // Altitude factor - higher altitude = more efficient (up to a point)
        const altitudeFactor = state.altitude < 10000 
            ? 1.0 - (state.altitude / 10000) * 0.2  // 20% improvement up to 10km
            : 0.8;  // Cap at 20% improvement
        rate *= altitudeFactor;
        
        // Afterburner simulation - very high throttle = much higher consumption
        if (state.throttle > 0.9) {
            rate *= 1 + (state.throttle - 0.9) * 10; // Up to 2x consumption
        }
        
        return Math.max(0, rate);
    }

    /**
     * Draw fuel from tanks by priority
     * @param {number} amount - Amount to draw in liters
     * @returns {number} Amount actually drawn
     * @private
     */
    _drawFuel(amount) {
        let remaining = amount;
        
        // Sort tanks by priority
        const sortedTanks = this.getAllTanks()
            .filter(tank => tank.isUsable && !tank.isEmpty())
            .sort((a, b) => a.priority - b.priority);
        
        for (const tank of sortedTanks) {
            if (remaining <= 0) break;
            const drawn = tank.draw(remaining);
            remaining -= drawn;
        }
        
        return amount - remaining;
    }

    /**
     * Check for fuel warnings
     * @param {number} totalFuel - Current total fuel
     * @returns {string[]} Array of warning types
     * @private
     */
    _checkWarnings(totalFuel) {
        const warnings = [];
        
        if (totalFuel <= 0) {
            warnings.push('FUEL_EXHAUSTED');
        } else if (totalFuel <= this.emergencyLevel) {
            warnings.push('FUEL_EMERGENCY');
        } else if (totalFuel <= this.lowFuelLevel) {
            warnings.push('FUEL_LOW');
        }
        
        // Check for tank imbalance
        const leftWing = this._tanks.get(TankPosition.LEFT_WING);
        const rightWing = this._tanks.get(TankPosition.RIGHT_WING);
        if (leftWing && rightWing) {
            const imbalance = Math.abs(leftWing.currentLevel - rightWing.currentLevel);
            if (imbalance > 20) {
                warnings.push('FUEL_IMBALANCE');
            }
        }
        
        return warnings;
    }

    /**
     * Refuel tanks
     * @param {number} amount - Amount to add in liters
     * @param {string} [targetPosition] - Specific tank to fill, or null for all
     * @returns {number} Amount actually added
     */
    refuel(amount, targetPosition = null) {
        if (targetPosition) {
            const tank = this._tanks.get(targetPosition);
            if (tank) {
                return tank.add(amount);
            }
            return 0;
        }
        
        // Fill all tanks proportionally
        let remaining = amount;
        const tanks = this.getAllTanks().filter(t => !t.isFull());
        
        while (remaining > 0 && tanks.length > 0) {
            const perTank = remaining / tanks.length;
            for (let i = tanks.length - 1; i >= 0; i--) {
                const added = tanks[i].add(perTank);
                remaining -= added;
                if (tanks[i].isFull()) {
                    tanks.splice(i, 1);
                }
            }
        }
        
        return amount - remaining;
    }

    /**
     * Full refuel to capacity
     * @returns {number} Amount added
     */
    refuelFull() {
        const needed = this.getTotalCapacity() - this.getTotalFuel();
        return this.refuel(needed);
    }

    /**
     * Calculate range based on current fuel and consumption rate
     * @param {Object} state - Current flight state
     * @returns {Object} Range estimates
     */
    calculateRange(state) {
        const currentFuel = this.getTotalFuel();
        const consumptionRate = this._calculateConsumptionRate(state);
        
        if (consumptionRate <= 0 || state.airspeed <= 0) {
            return {
                endurance: Infinity,
                range: Infinity
            };
        }
        
        // Endurance in seconds
        const endurance = currentFuel / consumptionRate;
        
        // Range in meters
        const range = endurance * state.airspeed;
        
        return {
            endurance,                    // seconds
            enduranceMinutes: endurance / 60,
            range,                        // meters
            rangeKm: range / 1000,
            consumptionRate,              // liters/second
            consumptionPerHour: consumptionRate * 3600
        };
    }

    /**
     * Get fuel imbalance between wing tanks
     * @returns {number} Imbalance in liters (positive = left heavy)
     */
    getWingImbalance() {
        const left = this._tanks.get(TankPosition.LEFT_WING);
        const right = this._tanks.get(TankPosition.RIGHT_WING);
        
        if (!left || !right) return 0;
        return left.currentLevel - right.currentLevel;
    }

    /**
     * Transfer fuel between tanks
     * @param {string} fromPosition - Source tank position
     * @param {string} toPosition - Destination tank position
     * @param {number} amount - Amount to transfer in liters
     * @returns {number} Amount actually transferred
     */
    transfer(fromPosition, toPosition, amount) {
        const fromTank = this._tanks.get(fromPosition);
        const toTank = this._tanks.get(toPosition);
        
        if (!fromTank || !toTank) return 0;
        
        const drawn = fromTank.draw(amount);
        const added = toTank.add(drawn);
        
        // Return any excess
        if (drawn > added) {
            fromTank.add(drawn - added);
        }
        
        return added;
    }

    /**
     * Add fuel event listener
     * @param {Function} callback
     */
    addListener(callback) {
        this._listeners.add(callback);
    }

    /**
     * Remove fuel event listener
     * @param {Function} callback
     */
    removeListener(callback) {
        this._listeners.delete(callback);
    }

    /**
     * Notify listeners
     * @param {Object} event
     * @private
     */
    _notifyListeners(event) {
        for (const callback of this._listeners) {
            try {
                callback(event);
            } catch (err) {
                console.error('FuelSystem: Listener error:', err);
            }
        }
    }

    /**
     * Get average consumption rate over recent history
     * @param {number} [sampleCount=100] - Number of samples to average
     * @returns {number} Average consumption rate in liters/second
     */
    getAverageConsumptionRate(sampleCount = 100) {
        if (this._consumptionHistory.length === 0) return 0;
        
        const samples = this._consumptionHistory.slice(-sampleCount);
        const totalConsumed = samples.reduce((sum, s) => sum + s.amount, 0);
        
        // Calculate time span
        if (samples.length < 2) return 0;
        const timeSpan = (samples[samples.length - 1].timestamp - samples[0].timestamp) / 1000;
        
        if (timeSpan <= 0) return 0;
        return totalConsumed / timeSpan;
    }

    /**
     * Reset fuel system
     * @param {boolean} [refillTanks=true] - Whether to refill all tanks
     */
    reset(refillTanks = true) {
        this._totalConsumed = 0;
        this._consumptionHistory = [];
        
        if (refillTanks) {
            this.refuelFull();
        }
    }

    /**
     * Get debug information
     * @returns {Object}
     */
    getDebugInfo() {
        const tanks = {};
        for (const [position, tank] of this._tanks) {
            tanks[position] = {
                level: tank.currentLevel,
                capacity: tank.capacity,
                percentage: tank.getPercentage(),
                priority: tank.priority
            };
        }
        
        return {
            fuelType: this.fuelType.name,
            totalFuel: this.getTotalFuel(),
            totalCapacity: this.getTotalCapacity(),
            percentage: this.getFuelPercentage(),
            weight: this.getFuelWeight(),
            totalConsumed: this._totalConsumed,
            avgConsumptionRate: this.getAverageConsumptionRate(),
            wingImbalance: this.getWingImbalance(),
            tanks
        };
    }
}

export default FuelSystem;
