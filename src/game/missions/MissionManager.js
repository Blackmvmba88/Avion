/**
 * MissionManager.js
 * Manages all missions and mission lifecycle in the flight simulator.
 */

import { Mission, MissionStatus } from './Mission.js';

/**
 * MissionManager class
 * Central manager for all mission-related operations
 */
export class MissionManager {
    /**
     * Create a new MissionManager instance
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.missions = new Map();
        this.activeMission = null;
        this.completedMissions = [];
        this.listeners = new Map();
        
        // Statistics
        this.stats = {
            totalMissionsCompleted: 0,
            totalMissionsFailed: 0,
            totalScore: 0,
            bestScores: new Map()
        };

        // Auto-save progress (can be disabled)
        this.autoSave = config.autoSave !== false;
    }

    /**
     * Register a mission
     * @param {Mission|Object} mission - Mission instance or configuration
     * @returns {Mission}
     */
    registerMission(mission) {
        const missionInstance = mission instanceof Mission 
            ? mission 
            : new Mission(mission);
        
        this.missions.set(missionInstance.id, missionInstance);
        return missionInstance;
    }

    /**
     * Get a mission by ID
     * @param {string} missionId - Mission ID
     * @returns {Mission|null}
     */
    getMission(missionId) {
        return this.missions.get(missionId) || null;
    }

    /**
     * Get all registered missions
     * @returns {Mission[]}
     */
    getAllMissions() {
        return Array.from(this.missions.values());
    }

    /**
     * Get missions by status
     * @param {string} status - Mission status to filter by
     * @returns {Mission[]}
     */
    getMissionsByStatus(status) {
        return this.getAllMissions().filter(m => m.status === status);
    }

    /**
     * Get available missions (not completed)
     * @returns {Mission[]}
     */
    getAvailableMissions() {
        return this.getAllMissions().filter(m => 
            m.status === MissionStatus.PENDING || 
            m.status === MissionStatus.FAILED
        );
    }

    /**
     * Start a mission
     * @param {string} missionId - Mission ID to start
     * @returns {boolean} Success status
     */
    startMission(missionId) {
        // Check if another mission is active
        if (this.activeMission) {
            console.warn('Another mission is already active. Abort or complete it first.');
            return false;
        }

        const mission = this.getMission(missionId);
        if (!mission) {
            console.error(`Mission ${missionId} not found`);
            return false;
        }

        // Reset mission if it was previously attempted
        if (mission.status !== MissionStatus.PENDING) {
            mission.reset();
        }

        // Set up mission callbacks
        mission.onComplete = (m) => this.handleMissionComplete(m);
        mission.onFail = (m, reason) => this.handleMissionFail(m, reason);
        mission.onObjectiveComplete = (obj, m) => this.handleObjectiveComplete(obj, m);

        // Start the mission
        mission.start();
        this.activeMission = mission;

        this.emit('missionStarted', { mission });
        return true;
    }

    /**
     * Update the active mission
     * @param {Object} aircraftState - Current aircraft state
     * @param {number} deltaTime - Time delta in seconds
     */
    update(aircraftState, deltaTime) {
        if (this.activeMission && this.activeMission.status === MissionStatus.ACTIVE) {
            this.activeMission.update(aircraftState, deltaTime);
        }
    }

    /**
     * Abort the current mission
     * @returns {boolean}
     */
    abortMission() {
        if (!this.activeMission) {
            return false;
        }

        this.activeMission.fail('Mission aborted');
        this.activeMission = null;
        return true;
    }

    /**
     * Pause the current mission
     * @returns {boolean}
     */
    pauseMission() {
        if (!this.activeMission) {
            return false;
        }

        this.activeMission.pause();
        this.emit('missionPaused', { mission: this.activeMission });
        return true;
    }

    /**
     * Resume the current mission
     * @returns {boolean}
     */
    resumeMission() {
        if (!this.activeMission) {
            return false;
        }

        this.activeMission.resume();
        this.emit('missionResumed', { mission: this.activeMission });
        return true;
    }

    /**
     * Handle mission completion
     * @param {Mission} mission
     */
    handleMissionComplete(mission) {
        this.stats.totalMissionsCompleted++;
        this.stats.totalScore += mission.score;
        
        // Update best score
        const bestScore = this.stats.bestScores.get(mission.id) || 0;
        if (mission.score > bestScore) {
            this.stats.bestScores.set(mission.id, mission.score);
        }

        this.completedMissions.push({
            id: mission.id,
            completedAt: Date.now(),
            score: mission.score
        });

        this.emit('missionCompleted', { mission, summary: mission.getSummary() });
        this.activeMission = null;
    }

    /**
     * Handle mission failure
     * @param {Mission} mission
     * @param {string} reason
     */
    handleMissionFail(mission, reason) {
        this.stats.totalMissionsFailed++;
        
        this.emit('missionFailed', { mission, reason });
        this.activeMission = null;
    }

    /**
     * Handle objective completion
     * @param {MissionObjective} objective
     * @param {Mission} mission
     */
    handleObjectiveComplete(objective, mission) {
        this.emit('objectiveCompleted', { objective, mission });
    }

    /**
     * Get the active mission
     * @returns {Mission|null}
     */
    getActiveMission() {
        return this.activeMission;
    }

    /**
     * Get mission progress for the active mission
     * @returns {Object|null}
     */
    getProgress() {
        if (!this.activeMission) {
            return null;
        }
        return this.activeMission.getProgress();
    }

    /**
     * Get player statistics
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            bestScores: Object.fromEntries(this.stats.bestScores)
        };
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
     * Export mission data for saving
     * @returns {Object}
     */
    exportData() {
        return {
            stats: this.getStats(),
            completedMissions: this.completedMissions,
            missionStates: this.getAllMissions().map(m => ({
                id: m.id,
                status: m.status,
                score: m.score
            }))
        };
    }

    /**
     * Import mission data from save
     * @param {Object} data - Saved data
     */
    importData(data) {
        if (data.stats) {
            this.stats.totalMissionsCompleted = data.stats.totalMissionsCompleted || 0;
            this.stats.totalMissionsFailed = data.stats.totalMissionsFailed || 0;
            this.stats.totalScore = data.stats.totalScore || 0;
            
            if (data.stats.bestScores) {
                this.stats.bestScores = new Map(Object.entries(data.stats.bestScores));
            }
        }
        
        if (data.completedMissions) {
            this.completedMissions = data.completedMissions;
        }
    }

    /**
     * Reset all mission progress
     */
    reset() {
        this.activeMission = null;
        this.completedMissions = [];
        this.stats = {
            totalMissionsCompleted: 0,
            totalMissionsFailed: 0,
            totalScore: 0,
            bestScores: new Map()
        };
        
        this.missions.forEach(mission => mission.reset());
    }
}

export default MissionManager;
