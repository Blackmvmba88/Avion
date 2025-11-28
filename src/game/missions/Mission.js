/**
 * Mission.js
 * Base class for all missions in the flight simulator.
 * Defines the structure and lifecycle for mission gameplay.
 */

/**
 * Mission status enumeration
 */
export const MissionStatus = {
    PENDING: 'pending',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PAUSED: 'paused'
};

/**
 * Mission objective types
 */
export const ObjectiveType = {
    REACH_WAYPOINT: 'reach_waypoint',
    REACH_ALTITUDE: 'reach_altitude',
    MAINTAIN_SPEED: 'maintain_speed',
    LAND_AT_AIRPORT: 'land_at_airport',
    TAKEOFF: 'takeoff',
    FLY_THROUGH: 'fly_through',
    SURVIVE_TIME: 'survive_time',
    COLLECT_ITEM: 'collect_item'
};

/**
 * Mission objective class
 */
export class MissionObjective {
    /**
     * Create a new mission objective
     * @param {Object} config - Objective configuration
     */
    constructor(config = {}) {
        this.id = config.id || `obj_${Date.now()}`;
        this.type = config.type || ObjectiveType.REACH_WAYPOINT;
        this.description = config.description || '';
        this.target = config.target || null;
        this.tolerance = config.tolerance || 50; // Distance tolerance in meters
        this.completed = false;
        this.failed = false;
        this.progress = 0; // 0-100%
        this.timeLimit = config.timeLimit || null; // Optional time limit in seconds
        this.startTime = null;
        this.optional = config.optional || false;
        this.rewards = config.rewards || { score: 100 };
    }

    /**
     * Start tracking this objective
     */
    start() {
        this.startTime = Date.now();
    }

    /**
     * Check if objective is timed out
     * @returns {boolean}
     */
    isTimedOut() {
        if (!this.timeLimit || !this.startTime) return false;
        const elapsed = (Date.now() - this.startTime) / 1000;
        return elapsed > this.timeLimit;
    }

    /**
     * Get remaining time
     * @returns {number|null} Remaining time in seconds or null if no limit
     */
    getRemainingTime() {
        if (!this.timeLimit || !this.startTime) return null;
        const elapsed = (Date.now() - this.startTime) / 1000;
        return Math.max(0, this.timeLimit - elapsed);
    }

    /**
     * Mark objective as completed
     */
    complete() {
        this.completed = true;
        this.progress = 100;
    }

    /**
     * Mark objective as failed
     */
    fail() {
        this.failed = true;
    }

    /**
     * Reset the objective
     */
    reset() {
        this.completed = false;
        this.failed = false;
        this.progress = 0;
        this.startTime = null;
    }
}

/**
 * Mission class
 * Base class for all missions
 */
export class Mission {
    /**
     * Create a new mission
     * @param {Object} config - Mission configuration
     */
    constructor(config = {}) {
        this.id = config.id || `mission_${Date.now()}`;
        this.name = config.name || 'Unnamed Mission';
        this.description = config.description || '';
        this.difficulty = config.difficulty || 1; // 1-5 scale
        this.status = MissionStatus.PENDING;
        this.objectives = [];
        this.currentObjectiveIndex = 0;
        this.startTime = null;
        this.endTime = null;
        this.score = 0;
        this.bonuses = [];
        
        // Mission parameters
        this.startPosition = config.startPosition || { x: 0, y: 100, z: 0 };
        this.startRotation = config.startRotation || { pitch: 0, roll: 0, yaw: 0 };
        this.timeLimit = config.timeLimit || null; // Total mission time limit
        this.weather = config.weather || { clear: true };
        this.timeOfDay = config.timeOfDay || 12; // 0-24 hours
        
        // Callbacks
        this.onComplete = config.onComplete || null;
        this.onFail = config.onFail || null;
        this.onObjectiveComplete = config.onObjectiveComplete || null;
        
        // Initialize objectives if provided
        if (config.objectives) {
            config.objectives.forEach(obj => this.addObjective(obj));
        }
    }

    /**
     * Add an objective to the mission
     * @param {Object|MissionObjective} objective - Objective configuration or instance
     * @returns {MissionObjective}
     */
    addObjective(objective) {
        const obj = objective instanceof MissionObjective 
            ? objective 
            : new MissionObjective(objective);
        this.objectives.push(obj);
        return obj;
    }

    /**
     * Get the current active objective
     * @returns {MissionObjective|null}
     */
    getCurrentObjective() {
        return this.objectives[this.currentObjectiveIndex] || null;
    }

    /**
     * Get all objectives
     * @returns {MissionObjective[]}
     */
    getObjectives() {
        return this.objectives;
    }

    /**
     * Start the mission
     */
    start() {
        this.status = MissionStatus.ACTIVE;
        this.startTime = Date.now();
        this.currentObjectiveIndex = 0;
        
        // Start first objective
        const firstObjective = this.getCurrentObjective();
        if (firstObjective) {
            firstObjective.start();
        }
    }

    /**
     * Pause the mission
     */
    pause() {
        if (this.status === MissionStatus.ACTIVE) {
            this.status = MissionStatus.PAUSED;
        }
    }

    /**
     * Resume the mission
     */
    resume() {
        if (this.status === MissionStatus.PAUSED) {
            this.status = MissionStatus.ACTIVE;
        }
    }

    /**
     * Update mission state
     * @param {Object} aircraftState - Current aircraft state
     * @param {number} _deltaTime - Time delta in seconds (unused, kept for API consistency)
     */
    update(aircraftState, _deltaTime) {
        if (this.status !== MissionStatus.ACTIVE) return;

        // Check total time limit
        if (this.timeLimit) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            if (elapsed > this.timeLimit) {
                this.fail('Time limit exceeded');
                return;
            }
        }

        // Check current objective
        const currentObjective = this.getCurrentObjective();
        if (!currentObjective) {
            this.complete();
            return;
        }

        // Check objective timeout
        if (currentObjective.isTimedOut()) {
            if (!currentObjective.optional) {
                this.fail(`Objective "${currentObjective.description}" timed out`);
                return;
            } else {
                currentObjective.fail();
                this.advanceObjective();
            }
        }

        // Check objective completion
        const completed = this.checkObjective(currentObjective, aircraftState);
        if (completed) {
            this.completeObjective(currentObjective);
        }
    }

    /**
     * Check if an objective is completed
     * @param {MissionObjective} objective - The objective to check
     * @param {Object} aircraftState - Current aircraft state
     * @returns {boolean}
     */
    checkObjective(objective, aircraftState) {
        const pos = aircraftState.position;
        const target = objective.target;

        switch (objective.type) {
            case ObjectiveType.REACH_WAYPOINT: {
                if (!target || !target.position) return false;
                const dist = Math.sqrt(
                    Math.pow(pos.x - target.position.x, 2) +
                    Math.pow(pos.y - target.position.y, 2) +
                    Math.pow(pos.z - target.position.z, 2)
                );
                objective.progress = Math.min(100, (1 - dist / 1000) * 100);
                return dist < objective.tolerance;
            }

            case ObjectiveType.REACH_ALTITUDE: {
                if (!target || target.altitude === undefined) return false;
                const altDiff = Math.abs(pos.y - target.altitude);
                objective.progress = Math.min(100, (1 - altDiff / target.altitude) * 100);
                return altDiff < objective.tolerance;
            }

            case ObjectiveType.MAINTAIN_SPEED: {
                if (!target || target.speed === undefined) return false;
                const speed = aircraftState.speed || 0;
                const speedDiff = Math.abs(speed - target.speed);
                return speedDiff < objective.tolerance;
            }

            case ObjectiveType.LAND_AT_AIRPORT: {
                // Check if aircraft is on ground and speed is low
                const onGround = pos.y < 5;
                const lowSpeed = (aircraftState.speed || 0) < 10;
                if (target && target.position) {
                    const landDist = Math.sqrt(
                        Math.pow(pos.x - target.position.x, 2) +
                        Math.pow(pos.z - target.position.z, 2)
                    );
                    return onGround && lowSpeed && landDist < objective.tolerance;
                }
                return onGround && lowSpeed;
            }

            case ObjectiveType.TAKEOFF:
                return pos.y > (target?.altitude || 50);

            case ObjectiveType.FLY_THROUGH: {
                if (!target || !target.position) return false;
                const flyDist = Math.sqrt(
                    Math.pow(pos.x - target.position.x, 2) +
                    Math.pow(pos.y - target.position.y, 2) +
                    Math.pow(pos.z - target.position.z, 2)
                );
                return flyDist < objective.tolerance;
            }

            case ObjectiveType.SURVIVE_TIME: {
                if (!objective.startTime || !target?.duration) return false;
                const elapsed = (Date.now() - objective.startTime) / 1000;
                objective.progress = Math.min(100, (elapsed / target.duration) * 100);
                return elapsed >= target.duration;
            }

            default:
                return false;
        }
    }

    /**
     * Complete the current objective
     * @param {MissionObjective} objective
     */
    completeObjective(objective) {
        objective.complete();
        this.score += objective.rewards.score || 0;

        if (this.onObjectiveComplete) {
            this.onObjectiveComplete(objective, this);
        }

        this.advanceObjective();
    }

    /**
     * Advance to the next objective
     */
    advanceObjective() {
        this.currentObjectiveIndex++;
        const nextObjective = this.getCurrentObjective();
        
        if (nextObjective) {
            nextObjective.start();
        } else {
            // All objectives completed
            this.complete();
        }
    }

    /**
     * Complete the mission
     */
    complete() {
        this.status = MissionStatus.COMPLETED;
        this.endTime = Date.now();
        
        // Calculate time bonus
        if (this.timeLimit) {
            const elapsed = (this.endTime - this.startTime) / 1000;
            const timeBonus = Math.max(0, Math.floor((this.timeLimit - elapsed) * 10));
            this.score += timeBonus;
            this.bonuses.push({ type: 'time', amount: timeBonus });
        }

        if (this.onComplete) {
            this.onComplete(this);
        }
    }

    /**
     * Fail the mission
     * @param {string} reason - Failure reason
     */
    fail(reason = '') {
        this.status = MissionStatus.FAILED;
        this.endTime = Date.now();
        this.failReason = reason;

        if (this.onFail) {
            this.onFail(this, reason);
        }
    }

    /**
     * Reset the mission
     */
    reset() {
        this.status = MissionStatus.PENDING;
        this.currentObjectiveIndex = 0;
        this.startTime = null;
        this.endTime = null;
        this.score = 0;
        this.bonuses = [];
        this.failReason = null;
        
        this.objectives.forEach(obj => obj.reset());
    }

    /**
     * Get mission progress
     * @returns {Object} Progress information
     */
    getProgress() {
        const completedCount = this.objectives.filter(o => o.completed).length;
        return {
            completed: completedCount,
            total: this.objectives.length,
            percentage: this.objectives.length > 0 
                ? (completedCount / this.objectives.length) * 100 
                : 0,
            currentObjective: this.getCurrentObjective(),
            score: this.score,
            elapsedTime: this.startTime ? (Date.now() - this.startTime) / 1000 : 0
        };
    }

    /**
     * Get mission summary
     * @returns {Object}
     */
    getSummary() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            difficulty: this.difficulty,
            status: this.status,
            score: this.score,
            bonuses: this.bonuses,
            objectives: this.objectives.map(o => ({
                id: o.id,
                description: o.description,
                completed: o.completed,
                failed: o.failed
            })),
            startTime: this.startTime,
            endTime: this.endTime,
            elapsedTime: this.startTime && this.endTime 
                ? (this.endTime - this.startTime) / 1000 
                : null
        };
    }
}

export default Mission;
