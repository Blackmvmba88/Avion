/**
 * AchievementSystem.js
 * Manages achievements and unlockables in the flight simulator.
 */

/**
 * Achievement categories
 */
export const AchievementCategory = {
    FLIGHT: 'flight',
    NAVIGATION: 'navigation',
    MISSIONS: 'missions',
    SKILL: 'skill',
    EXPLORATION: 'exploration',
    MULTIPLAYER: 'multiplayer',
    SECRET: 'secret'
};

/**
 * Achievement rarity levels
 */
export const AchievementRarity = {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
};

/**
 * Achievement class
 * Represents a single achievement
 */
export class Achievement {
    /**
     * Create a new Achievement
     * @param {Object} config - Achievement configuration
     */
    constructor(config = {}) {
        this.id = config.id || `achievement_${Date.now()}`;
        this.name = config.name || 'Unknown Achievement';
        this.description = config.description || '';
        this.category = config.category || AchievementCategory.FLIGHT;
        this.rarity = config.rarity || AchievementRarity.COMMON;
        this.icon = config.icon || '🏆';
        this.points = config.points || 10;
        this.hidden = config.hidden || false;
        
        // Unlock conditions
        this.condition = config.condition || null; // Function that checks if achievement is unlocked
        this.progress = 0;
        this.maxProgress = config.maxProgress || 1;
        this.requiresProgress = config.requiresProgress || false;
        
        // State
        this.unlocked = false;
        this.unlockedAt = null;
        
        // Rewards
        this.rewards = config.rewards || {};
    }

    /**
     * Check if achievement conditions are met
     * @param {Object} context - Game context for checking conditions
     * @returns {boolean}
     */
    checkCondition(context) {
        if (this.unlocked) return false;
        
        if (this.condition && typeof this.condition === 'function') {
            return this.condition(context, this);
        }
        
        if (this.requiresProgress) {
            return this.progress >= this.maxProgress;
        }
        
        return false;
    }

    /**
     * Update progress
     * @param {number} amount - Amount to add to progress
     * @returns {boolean} True if achievement was unlocked
     */
    updateProgress(amount = 1) {
        if (this.unlocked) return false;
        
        this.progress = Math.min(this.maxProgress, this.progress + amount);
        
        if (this.progress >= this.maxProgress) {
            this.unlock();
            return true;
        }
        
        return false;
    }

    /**
     * Set progress directly
     * @param {number} value - New progress value
     * @returns {boolean} True if achievement was unlocked
     */
    setProgress(value) {
        if (this.unlocked) return false;
        
        this.progress = Math.min(this.maxProgress, Math.max(0, value));
        
        if (this.progress >= this.maxProgress) {
            this.unlock();
            return true;
        }
        
        return false;
    }

    /**
     * Get progress percentage
     * @returns {number} Progress from 0 to 100
     */
    getProgressPercentage() {
        return this.maxProgress > 0 ? (this.progress / this.maxProgress) * 100 : 0;
    }

    /**
     * Unlock the achievement
     */
    unlock() {
        if (this.unlocked) return;
        
        this.unlocked = true;
        this.unlockedAt = Date.now();
        this.progress = this.maxProgress;
    }

    /**
     * Reset the achievement
     */
    reset() {
        this.unlocked = false;
        this.unlockedAt = null;
        this.progress = 0;
    }

    /**
     * Get display info (respects hidden state)
     * @returns {Object}
     */
    getDisplayInfo() {
        if (this.hidden && !this.unlocked) {
            return {
                id: this.id,
                name: '???',
                description: 'This achievement is hidden.',
                category: this.category,
                rarity: this.rarity,
                icon: '❓',
                points: '?',
                progress: 0,
                maxProgress: 1,
                unlocked: false,
                hidden: true
            };
        }
        
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            category: this.category,
            rarity: this.rarity,
            icon: this.icon,
            points: this.points,
            progress: this.progress,
            maxProgress: this.maxProgress,
            progressPercentage: this.getProgressPercentage(),
            unlocked: this.unlocked,
            unlockedAt: this.unlockedAt,
            hidden: false
        };
    }

    /**
     * Serialize achievement for saving
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            progress: this.progress,
            unlocked: this.unlocked,
            unlockedAt: this.unlockedAt
        };
    }

    /**
     * Load state from saved data
     * @param {Object} data - Saved achievement data
     */
    fromJSON(data) {
        if (data.progress !== undefined) this.progress = data.progress;
        if (data.unlocked !== undefined) this.unlocked = data.unlocked;
        if (data.unlockedAt !== undefined) this.unlockedAt = data.unlockedAt;
    }
}

/**
 * AchievementSystem class
 * Manages all achievements in the game
 */
export class AchievementSystem {
    /**
     * Create a new AchievementSystem
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.achievements = new Map();
        this.listeners = new Map();
        
        // Statistics
        this.stats = {
            totalPoints: 0,
            unlockedCount: 0,
            totalCount: 0
        };
        
        // Recent unlocks (for notifications)
        this.recentUnlocks = [];
        this.maxRecentUnlocks = 5;
        
        // Initialize default achievements if provided
        if (config.achievements) {
            config.achievements.forEach(a => this.registerAchievement(a));
        }
    }

    /**
     * Register an achievement
     * @param {Achievement|Object} achievement - Achievement instance or config
     * @returns {Achievement}
     */
    registerAchievement(achievement) {
        const ach = achievement instanceof Achievement 
            ? achievement 
            : new Achievement(achievement);
        
        this.achievements.set(ach.id, ach);
        this.updateStats();
        
        return ach;
    }

    /**
     * Get an achievement by ID
     * @param {string} achievementId - Achievement ID
     * @returns {Achievement|null}
     */
    getAchievement(achievementId) {
        return this.achievements.get(achievementId) || null;
    }

    /**
     * Get all achievements
     * @returns {Achievement[]}
     */
    getAllAchievements() {
        return Array.from(this.achievements.values());
    }

    /**
     * Get achievements by category
     * @param {string} category - Achievement category
     * @returns {Achievement[]}
     */
    getByCategory(category) {
        return this.getAllAchievements().filter(a => a.category === category);
    }

    /**
     * Get unlocked achievements
     * @returns {Achievement[]}
     */
    getUnlocked() {
        return this.getAllAchievements().filter(a => a.unlocked);
    }

    /**
     * Get locked achievements
     * @returns {Achievement[]}
     */
    getLocked() {
        return this.getAllAchievements().filter(a => !a.unlocked);
    }

    /**
     * Check all achievements against current context
     * @param {Object} context - Game context for checking conditions
     * @returns {Achievement[]} Newly unlocked achievements
     */
    checkAll(context) {
        const newlyUnlocked = [];
        
        this.achievements.forEach(achievement => {
            if (achievement.checkCondition(context)) {
                achievement.unlock();
                newlyUnlocked.push(achievement);
                this.addRecentUnlock(achievement);
                this.emit('achievementUnlocked', { achievement });
            }
        });
        
        if (newlyUnlocked.length > 0) {
            this.updateStats();
        }
        
        return newlyUnlocked;
    }

    /**
     * Check a specific achievement
     * @param {string} achievementId - Achievement ID
     * @param {Object} context - Game context
     * @returns {boolean} True if unlocked
     */
    check(achievementId, context) {
        const achievement = this.getAchievement(achievementId);
        if (!achievement) return false;
        
        if (achievement.checkCondition(context)) {
            achievement.unlock();
            this.addRecentUnlock(achievement);
            this.updateStats();
            this.emit('achievementUnlocked', { achievement });
            return true;
        }
        
        return false;
    }

    /**
     * Update progress for an achievement
     * @param {string} achievementId - Achievement ID
     * @param {number} amount - Amount to add
     * @returns {boolean} True if achievement was unlocked
     */
    updateProgress(achievementId, amount = 1) {
        const achievement = this.getAchievement(achievementId);
        if (!achievement) return false;
        
        const unlocked = achievement.updateProgress(amount);
        
        if (unlocked) {
            this.addRecentUnlock(achievement);
            this.updateStats();
            this.emit('achievementUnlocked', { achievement });
        } else {
            this.emit('progressUpdated', { achievement });
        }
        
        return unlocked;
    }

    /**
     * Unlock an achievement directly
     * @param {string} achievementId - Achievement ID
     * @returns {boolean}
     */
    unlock(achievementId) {
        const achievement = this.getAchievement(achievementId);
        if (!achievement || achievement.unlocked) return false;
        
        achievement.unlock();
        this.addRecentUnlock(achievement);
        this.updateStats();
        this.emit('achievementUnlocked', { achievement });
        
        return true;
    }

    /**
     * Add to recent unlocks list
     * @param {Achievement} achievement
     */
    addRecentUnlock(achievement) {
        this.recentUnlocks.unshift({
            achievement: achievement.getDisplayInfo(),
            timestamp: Date.now()
        });
        
        if (this.recentUnlocks.length > this.maxRecentUnlocks) {
            this.recentUnlocks.pop();
        }
    }

    /**
     * Get recent unlocks
     * @returns {Array}
     */
    getRecentUnlocks() {
        return [...this.recentUnlocks];
    }

    /**
     * Clear recent unlocks
     */
    clearRecentUnlocks() {
        this.recentUnlocks = [];
    }

    /**
     * Update statistics
     */
    updateStats() {
        this.stats.totalCount = this.achievements.size;
        this.stats.unlockedCount = this.getUnlocked().length;
        this.stats.totalPoints = this.getUnlocked().reduce((sum, a) => sum + a.points, 0);
    }

    /**
     * Get statistics
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            completionPercentage: this.stats.totalCount > 0 
                ? (this.stats.unlockedCount / this.stats.totalCount) * 100 
                : 0
        };
    }

    /**
     * Reset all achievements
     */
    resetAll() {
        this.achievements.forEach(a => a.reset());
        this.recentUnlocks = [];
        this.updateStats();
        this.emit('reset', {});
    }

    /**
     * Export achievement data for saving
     * @returns {Object}
     */
    exportData() {
        const achievementData = {};
        this.achievements.forEach((achievement, id) => {
            achievementData[id] = achievement.toJSON();
        });
        
        return {
            achievements: achievementData,
            stats: this.stats
        };
    }

    /**
     * Import achievement data from save
     * @param {Object} data - Saved data
     */
    importData(data) {
        if (data.achievements) {
            Object.entries(data.achievements).forEach(([id, achData]) => {
                const achievement = this.getAchievement(id);
                if (achievement) {
                    achievement.fromJSON(achData);
                }
            });
        }
        
        this.updateStats();
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
}

export default AchievementSystem;
