/**
 * ScoreManager.js
 * Manages scoring, points, and leaderboards in the flight simulator.
 */

/* global setTimeout, clearTimeout */

/**
 * Score event types
 */
export const ScoreEventType = {
    MISSION_COMPLETE: 'mission_complete',
    OBJECTIVE_COMPLETE: 'objective_complete',
    WAYPOINT_REACHED: 'waypoint_reached',
    LANDING: 'landing',
    TAKEOFF: 'takeoff',
    STUNT: 'stunt',
    TIME_BONUS: 'time_bonus',
    ACCURACY_BONUS: 'accuracy_bonus',
    ACHIEVEMENT: 'achievement',
    MULTIPLIER: 'multiplier',
    PENALTY: 'penalty'
};

/**
 * Score entry for history tracking
 */
export class ScoreEntry {
    /**
     * Create a new ScoreEntry
     * @param {Object} config - Entry configuration
     */
    constructor(config = {}) {
        this.type = config.type || ScoreEventType.MISSION_COMPLETE;
        this.points = config.points || 0;
        this.description = config.description || '';
        this.timestamp = config.timestamp || Date.now();
        this.multiplier = config.multiplier || 1;
        this.metadata = config.metadata || {};
    }

    /**
     * Get total points including multiplier
     * @returns {number}
     */
    getTotalPoints() {
        return Math.round(this.points * this.multiplier);
    }
}

/**
 * Session statistics
 */
export class SessionStats {
    constructor() {
        this.reset();
    }

    reset() {
        this.startTime = Date.now();
        this.flightTime = 0;
        this.distanceTraveled = 0;
        this.maxAltitude = 0;
        this.maxSpeed = 0;
        this.landings = 0;
        this.takeoffs = 0;
        this.waypointsReached = 0;
        this.missionsCompleted = 0;
        this.crashes = 0;
        this.stallRecoveries = 0;
    }

    /**
     * Update stats from flight data
     * @param {Object} flightData - Current flight data
     * @param {number} deltaTime - Time delta in seconds
     */
    update(flightData, deltaTime) {
        this.flightTime += deltaTime;
        
        if (flightData.altitude > this.maxAltitude) {
            this.maxAltitude = flightData.altitude;
        }
        
        if (flightData.speed > this.maxSpeed) {
            this.maxSpeed = flightData.speed;
        }
    }

    /**
     * Get session duration in seconds
     * @returns {number}
     */
    getSessionDuration() {
        return (Date.now() - this.startTime) / 1000;
    }

    /**
     * Get formatted stats
     * @returns {Object}
     */
    getSummary() {
        return {
            flightTime: this.flightTime,
            flightTimeFormatted: this.formatTime(this.flightTime),
            distanceTraveled: this.distanceTraveled,
            maxAltitude: Math.round(this.maxAltitude),
            maxSpeed: Math.round(this.maxSpeed),
            landings: this.landings,
            takeoffs: this.takeoffs,
            waypointsReached: this.waypointsReached,
            missionsCompleted: this.missionsCompleted,
            crashes: this.crashes,
            stallRecoveries: this.stallRecoveries,
            sessionDuration: this.getSessionDuration()
        };
    }

    /**
     * Format time in HH:MM:SS
     * @param {number} seconds
     * @returns {string}
     */
    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}

/**
 * ScoreManager class
 * Manages all scoring aspects of the game
 */
export class ScoreManager {
    /**
     * Create a new ScoreManager
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        // Current session
        this.currentScore = 0;
        this.currentMultiplier = 1;
        this.baseMultiplier = 1;
        this.multiplierExpiry = null;
        
        // History
        this.scoreHistory = [];
        this.maxHistorySize = config.maxHistorySize || 100;
        
        // Session stats
        this.sessionStats = new SessionStats();
        
        // Lifetime stats
        this.lifetimeStats = {
            totalScore: 0,
            highScore: 0,
            totalFlightTime: 0,
            totalDistance: 0,
            totalMissions: 0,
            totalLandings: 0,
            gamesPlayed: 0
        };
        
        // Scoring configuration
        this.scoreConfig = {
            [ScoreEventType.MISSION_COMPLETE]: { base: 1000, label: 'Mission Complete' },
            [ScoreEventType.OBJECTIVE_COMPLETE]: { base: 200, label: 'Objective Complete' },
            [ScoreEventType.WAYPOINT_REACHED]: { base: 100, label: 'Waypoint Reached' },
            [ScoreEventType.LANDING]: { base: 500, label: 'Landing' },
            [ScoreEventType.TAKEOFF]: { base: 100, label: 'Takeoff' },
            [ScoreEventType.STUNT]: { base: 300, label: 'Stunt Performed' },
            [ScoreEventType.TIME_BONUS]: { base: 50, label: 'Time Bonus' },
            [ScoreEventType.ACCURACY_BONUS]: { base: 100, label: 'Accuracy Bonus' },
            [ScoreEventType.ACHIEVEMENT]: { base: 500, label: 'Achievement' },
            [ScoreEventType.MULTIPLIER]: { base: 0, label: 'Multiplier' },
            [ScoreEventType.PENALTY]: { base: -100, label: 'Penalty' }
        };
        
        // Event listeners
        this.listeners = new Map();
        
        // Combo system
        this.combo = 0;
        this.comboTimer = null;
        this.comboTimeout = config.comboTimeout || 5000; // 5 seconds
    }

    /**
     * Add score
     * @param {string} type - Score event type
     * @param {Object} options - Score options
     * @returns {ScoreEntry}
     */
    addScore(type, options = {}) {
        const config = this.scoreConfig[type] || { base: 0, label: 'Unknown' };
        const basePoints = options.points !== undefined ? options.points : config.base;
        
        // Apply multiplier
        const multiplier = options.multiplier !== undefined ? options.multiplier : this.currentMultiplier;
        
        const entry = new ScoreEntry({
            type,
            points: basePoints,
            description: options.description || config.label,
            multiplier,
            metadata: options.metadata || {}
        });
        
        const totalPoints = entry.getTotalPoints();
        this.currentScore += totalPoints;
        
        // Add to history
        this.scoreHistory.unshift(entry);
        if (this.scoreHistory.length > this.maxHistorySize) {
            this.scoreHistory.pop();
        }
        
        // Update combo
        if (totalPoints > 0) {
            this.incrementCombo();
        }
        
        // Update lifetime stats
        this.lifetimeStats.totalScore += Math.max(0, totalPoints);
        if (this.currentScore > this.lifetimeStats.highScore) {
            this.lifetimeStats.highScore = this.currentScore;
        }
        
        this.emit('scoreAdded', { entry, totalPoints, currentScore: this.currentScore });
        
        return entry;
    }

    /**
     * Add points directly (convenience method)
     * @param {number} points - Points to add
     * @param {string} description - Description
     * @returns {ScoreEntry}
     */
    addPoints(points, description = '') {
        return this.addScore(points >= 0 ? ScoreEventType.OBJECTIVE_COMPLETE : ScoreEventType.PENALTY, {
            points: Math.abs(points) * (points >= 0 ? 1 : -1),
            description
        });
    }

    /**
     * Apply a penalty
     * @param {number} points - Penalty points (positive number)
     * @param {string} reason - Penalty reason
     * @returns {ScoreEntry}
     */
    applyPenalty(points, reason = 'Penalty') {
        this.resetCombo();
        return this.addScore(ScoreEventType.PENALTY, {
            points: -Math.abs(points),
            description: reason
        });
    }

    /**
     * Set score multiplier
     * @param {number} multiplier - New multiplier
     * @param {number} duration - Duration in milliseconds (0 for permanent)
     */
    setMultiplier(multiplier, duration = 0) {
        this.currentMultiplier = multiplier;
        
        if (duration > 0) {
            if (this.multiplierExpiry) {
                clearTimeout(this.multiplierExpiry);
            }
            this.multiplierExpiry = setTimeout(() => {
                this.currentMultiplier = this.baseMultiplier;
                this.emit('multiplierExpired', {});
            }, duration);
        }
        
        this.emit('multiplierChanged', { multiplier, duration });
    }

    /**
     * Increment combo
     */
    incrementCombo() {
        this.combo++;
        
        // Clear existing timer
        if (this.comboTimer) {
            clearTimeout(this.comboTimer);
        }
        
        // Set new timer
        this.comboTimer = setTimeout(() => {
            this.resetCombo();
        }, this.comboTimeout);
        
        // Apply combo bonus multiplier at certain thresholds
        if (this.combo >= 10) {
            this.currentMultiplier = Math.min(3, 1 + (this.combo - 10) * 0.1);
        }
        
        this.emit('comboUpdated', { combo: this.combo });
    }

    /**
     * Reset combo
     */
    resetCombo() {
        if (this.combo > 0) {
            const finalCombo = this.combo;
            this.combo = 0;
            this.currentMultiplier = this.baseMultiplier;
            
            if (this.comboTimer) {
                clearTimeout(this.comboTimer);
                this.comboTimer = null;
            }
            
            this.emit('comboReset', { finalCombo });
        }
    }

    /**
     * Get current score
     * @returns {number}
     */
    getScore() {
        return this.currentScore;
    }

    /**
     * Get current multiplier
     * @returns {number}
     */
    getMultiplier() {
        return this.currentMultiplier;
    }

    /**
     * Get combo count
     * @returns {number}
     */
    getCombo() {
        return this.combo;
    }

    /**
     * Get score history
     * @param {number} limit - Number of entries to return
     * @returns {ScoreEntry[]}
     */
    getHistory(limit = 10) {
        return this.scoreHistory.slice(0, limit);
    }

    /**
     * Update session stats
     * @param {Object} flightData - Current flight data
     * @param {number} deltaTime - Time delta in seconds
     */
    updateSessionStats(flightData, deltaTime) {
        this.sessionStats.update(flightData, deltaTime);
    }

    /**
     * Record a landing
     * @param {Object} landingData - Landing quality data
     */
    recordLanding(landingData = {}) {
        this.sessionStats.landings++;
        this.lifetimeStats.totalLandings++;
        
        // Calculate landing score based on quality
        let points = this.scoreConfig[ScoreEventType.LANDING].base;
        let description = 'Landing';
        
        if (landingData.quality) {
            switch (landingData.quality) {
                case 'perfect':
                    points *= 2;
                    description = 'Perfect Landing!';
                    break;
                case 'good':
                    points *= 1.5;
                    description = 'Good Landing';
                    break;
                case 'rough':
                    points *= 0.5;
                    description = 'Rough Landing';
                    break;
            }
        }
        
        return this.addScore(ScoreEventType.LANDING, { points, description, metadata: landingData });
    }

    /**
     * Record a takeoff
     */
    recordTakeoff() {
        this.sessionStats.takeoffs++;
        return this.addScore(ScoreEventType.TAKEOFF, {});
    }

    /**
     * Record waypoint reached
     * @param {Object} waypointData - Waypoint data
     */
    recordWaypoint(waypointData = {}) {
        this.sessionStats.waypointsReached++;
        return this.addScore(ScoreEventType.WAYPOINT_REACHED, {
            description: waypointData.name ? `Reached ${waypointData.name}` : 'Waypoint Reached',
            metadata: waypointData
        });
    }

    /**
     * Record mission completion
     * @param {Object} missionData - Mission data
     */
    recordMissionComplete(missionData = {}) {
        this.sessionStats.missionsCompleted++;
        this.lifetimeStats.totalMissions++;
        
        let points = this.scoreConfig[ScoreEventType.MISSION_COMPLETE].base;
        
        // Bonus for difficulty
        if (missionData.difficulty) {
            points *= (1 + (missionData.difficulty - 1) * 0.25);
        }
        
        // Add mission score
        if (missionData.score) {
            points += missionData.score;
        }
        
        return this.addScore(ScoreEventType.MISSION_COMPLETE, {
            points,
            description: missionData.name ? `Completed: ${missionData.name}` : 'Mission Complete',
            metadata: missionData
        });
    }

    /**
     * Record a crash
     */
    recordCrash() {
        this.sessionStats.crashes++;
        this.resetCombo();
        this.applyPenalty(500, 'Aircraft Crashed');
    }

    /**
     * Get session summary
     * @returns {Object}
     */
    getSessionSummary() {
        return {
            score: this.currentScore,
            multiplier: this.currentMultiplier,
            combo: this.combo,
            stats: this.sessionStats.getSummary(),
            recentScores: this.getHistory(5)
        };
    }

    /**
     * Get lifetime stats
     * @returns {Object}
     */
    getLifetimeStats() {
        return { ...this.lifetimeStats };
    }

    /**
     * End session and update lifetime stats
     * @returns {Object} Session summary
     */
    endSession() {
        const summary = this.getSessionSummary();
        
        // Update lifetime stats
        this.lifetimeStats.totalFlightTime += this.sessionStats.flightTime;
        this.lifetimeStats.totalDistance += this.sessionStats.distanceTraveled;
        this.lifetimeStats.gamesPlayed++;
        
        this.emit('sessionEnded', { summary });
        
        return summary;
    }

    /**
     * Reset current session
     */
    resetSession() {
        this.currentScore = 0;
        this.currentMultiplier = this.baseMultiplier;
        this.combo = 0;
        this.scoreHistory = [];
        this.sessionStats.reset();
        
        if (this.comboTimer) {
            clearTimeout(this.comboTimer);
            this.comboTimer = null;
        }
        
        if (this.multiplierExpiry) {
            clearTimeout(this.multiplierExpiry);
            this.multiplierExpiry = null;
        }
        
        this.emit('sessionReset', {});
    }

    /**
     * Export data for saving
     * @returns {Object}
     */
    exportData() {
        return {
            lifetimeStats: this.lifetimeStats
        };
    }

    /**
     * Import data from save
     * @param {Object} data - Saved data
     */
    importData(data) {
        if (data.lifetimeStats) {
            this.lifetimeStats = { ...this.lifetimeStats, ...data.lifetimeStats };
        }
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data) {
        const listeners = this.listeners.get(event) || [];
        listeners.forEach(callback => callback(data));
    }

    /**
     * Dispose of resources
     */
    dispose() {
        if (this.comboTimer) {
            clearTimeout(this.comboTimer);
        }
        if (this.multiplierExpiry) {
            clearTimeout(this.multiplierExpiry);
        }
        this.listeners.clear();
    }
}

export default ScoreManager;
