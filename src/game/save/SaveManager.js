/**
 * SaveManager.js
 * Handles saving and loading game state, including flight data,
 * achievements, and user progress.
 */

/**
 * Save slot structure
 */
export class SaveSlot {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || 'Unnamed Save';
        this.timestamp = data.timestamp || Date.now();
        this.version = data.version || '1.0.0';
        this.playtime = data.playtime || 0;
        this.thumbnail = data.thumbnail || null;
        
        // Game state
        this.aircraft = data.aircraft || null;
        this.position = data.position || null;
        this.velocity = data.velocity || null;
        this.rotation = data.rotation || null;
        this.throttle = data.throttle || 0.5;
        this.fuel = data.fuel || 100;
        
        // Progress
        this.score = data.score || 0;
        this.achievements = data.achievements || [];
        this.missions = data.missions || {};
        this.statistics = data.statistics || {};
    }

    generateId() {
        return 'save_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            timestamp: this.timestamp,
            version: this.version,
            playtime: this.playtime,
            thumbnail: this.thumbnail,
            aircraft: this.aircraft,
            position: this.position,
            velocity: this.velocity,
            rotation: this.rotation,
            throttle: this.throttle,
            fuel: this.fuel,
            score: this.score,
            achievements: this.achievements,
            missions: this.missions,
            statistics: this.statistics
        };
    }
}

/**
 * Auto-save configuration
 */
export const AutoSaveConfig = {
    ENABLED: true,
    INTERVAL: 60000, // 1 minute
    MAX_AUTO_SAVES: 3,
    SLOT_PREFIX: 'autosave_'
};

/**
 * SaveManager class
 * Manages game save/load operations with multiple slots
 */
export class SaveManager {
    /**
     * Create a new SaveManager
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.storageKey = config.storageKey || 'avion_saves';
        this.maxSlots = config.maxSlots || 10;
        this.autoSaveEnabled = config.autoSaveEnabled ?? AutoSaveConfig.ENABLED;
        this.autoSaveInterval = config.autoSaveInterval || AutoSaveConfig.INTERVAL;
        this.currentVersion = config.version || '1.0.0';
        
        this.saves = new Map();
        this.autoSaveTimer = null;
        this.eventListeners = new Map();
        
        // Load existing saves
        this.loadSaveList();
    }

    /**
     * Load the list of saves from storage
     */
    loadSaveList() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            
            if (stored) {
                const parsed = JSON.parse(stored);
                
                for (const [id, data] of Object.entries(parsed)) {
                    this.saves.set(id, new SaveSlot(data));
                }
            }
        } catch (error) {
            console.error('Failed to load save list:', error);
        }
    }

    /**
     * Persist saves to storage
     */
    persistSaves() {
        try {
            const data = {};
            
            for (const [id, slot] of this.saves) {
                data[id] = slot.toJSON();
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to persist saves:', error);
            return false;
        }
    }

    /**
     * Create a new save
     * @param {Object} gameState - Current game state to save
     * @param {string} name - Save name
     * @returns {SaveSlot|null}
     */
    save(gameState, name = null) {
        if (this.saves.size >= this.maxSlots) {
            this.emit('error', { message: 'Maximum save slots reached' });
            return null;
        }
        
        const slot = new SaveSlot({
            name: name || `Save ${this.saves.size + 1}`,
            version: this.currentVersion,
            ...gameState
        });
        
        this.saves.set(slot.id, slot);
        this.persistSaves();
        
        this.emit('saved', { slot });
        return slot;
    }

    /**
     * Update an existing save
     * @param {string} slotId - Save slot ID
     * @param {Object} gameState - Game state to save
     * @returns {SaveSlot|null}
     */
    updateSave(slotId, gameState) {
        const existingSlot = this.saves.get(slotId);
        
        if (!existingSlot) {
            this.emit('error', { message: 'Save slot not found' });
            return null;
        }
        
        // Update slot with new data
        Object.assign(existingSlot, {
            ...gameState,
            timestamp: Date.now(),
            version: this.currentVersion
        });
        
        this.persistSaves();
        this.emit('updated', { slot: existingSlot });
        
        return existingSlot;
    }

    /**
     * Load a save
     * @param {string} slotId - Save slot ID
     * @returns {SaveSlot|null}
     */
    load(slotId) {
        const slot = this.saves.get(slotId);
        
        if (!slot) {
            this.emit('error', { message: 'Save slot not found' });
            return null;
        }
        
        // Check version compatibility
        if (slot.version !== this.currentVersion) {
            // Attempt migration
            const migrated = this.migrateSave(slot);
            if (!migrated) {
                this.emit('warning', { 
                    message: 'Save from different version, some data may be incompatible' 
                });
            }
        }
        
        this.emit('loaded', { slot });
        return slot;
    }

    /**
     * Delete a save
     * @param {string} slotId - Save slot ID
     * @returns {boolean}
     */
    delete(slotId) {
        const slot = this.saves.get(slotId);
        
        if (!slot) {
            return false;
        }
        
        this.saves.delete(slotId);
        this.persistSaves();
        
        this.emit('deleted', { slotId });
        return true;
    }

    /**
     * Rename a save
     * @param {string} slotId - Save slot ID
     * @param {string} newName - New name
     * @returns {boolean}
     */
    rename(slotId, newName) {
        const slot = this.saves.get(slotId);
        
        if (!slot) {
            return false;
        }
        
        slot.name = newName;
        this.persistSaves();
        
        this.emit('renamed', { slot, newName });
        return true;
    }

    /**
     * Get all saves
     * @returns {SaveSlot[]}
     */
    getAllSaves() {
        return Array.from(this.saves.values()).sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get saves by type (manual or auto)
     * @param {string} type - 'manual' or 'auto'
     * @returns {SaveSlot[]}
     */
    getSavesByType(type) {
        const saves = this.getAllSaves();
        
        if (type === 'auto') {
            return saves.filter(s => s.id.startsWith(AutoSaveConfig.SLOT_PREFIX));
        } else {
            return saves.filter(s => !s.id.startsWith(AutoSaveConfig.SLOT_PREFIX));
        }
    }

    /**
     * Create an auto-save
     * @param {Object} gameState - Current game state
     * @returns {SaveSlot|null}
     */
    autoSave(gameState) {
        if (!this.autoSaveEnabled) return null;
        
        // Get existing auto-saves
        const autoSaves = this.getSavesByType('auto');
        
        // Remove oldest if at max
        if (autoSaves.length >= AutoSaveConfig.MAX_AUTO_SAVES) {
            const oldest = autoSaves[autoSaves.length - 1];
            this.delete(oldest.id);
        }
        
        // Create new auto-save
        const slot = new SaveSlot({
            id: AutoSaveConfig.SLOT_PREFIX + Date.now(),
            name: `Auto-save ${new Date().toLocaleString()}`,
            version: this.currentVersion,
            ...gameState
        });
        
        this.saves.set(slot.id, slot);
        this.persistSaves();
        
        this.emit('autoSaved', { slot });
        return slot;
    }

    /**
     * Start auto-save timer
     * @param {Function} getGameState - Function that returns current game state
     */
    startAutoSave(getGameState) {
        if (this.autoSaveTimer) {
            this.stopAutoSave();
        }
        
        this.autoSaveTimer = setInterval(() => {
            if (this.autoSaveEnabled && getGameState) {
                const state = getGameState();
                this.autoSave(state);
            }
        }, this.autoSaveInterval);
    }

    /**
     * Stop auto-save timer
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * Migrate save to current version
     * @param {SaveSlot} slot
     * @returns {boolean}
     */
    migrateSave(slot) {
        // Version migration logic
        // Migration functions are stored for future use when save format changes
        const _migrations = {
            '0.9.0_to_1.0.0': (data) => {
                // Example migration
                if (!data.statistics) {
                    data.statistics = {};
                }
                return data;
            }
        };
        
        // Apply relevant migrations
        // This is simplified; a real implementation would track versions
        try {
            slot.version = this.currentVersion;
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Export save to JSON file
     * @param {string} slotId - Save slot ID
     * @returns {string|null} JSON string
     */
    exportSave(slotId) {
        const slot = this.saves.get(slotId);
        
        if (!slot) {
            return null;
        }
        
        return JSON.stringify(slot.toJSON(), null, 2);
    }

    /**
     * Export all saves
     * @returns {string}
     */
    exportAllSaves() {
        const data = {};
        
        for (const [id, slot] of this.saves) {
            data[id] = slot.toJSON();
        }
        
        return JSON.stringify(data, null, 2);
    }

    /**
     * Import save from JSON
     * @param {string} json - JSON string
     * @returns {SaveSlot|null}
     */
    importSave(json) {
        try {
            const data = JSON.parse(json);
            
            // Validate basic structure
            if (!data.id && !data.name) {
                throw new Error('Invalid save format');
            }
            
            // Generate new ID to avoid conflicts
            const slot = new SaveSlot({
                ...data,
                id: 'import_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                timestamp: Date.now()
            });
            
            this.saves.set(slot.id, slot);
            this.persistSaves();
            
            this.emit('imported', { slot });
            return slot;
        } catch (error) {
            console.error('Failed to import save:', error);
            this.emit('error', { message: 'Failed to import save: ' + error.message });
            return null;
        }
    }

    /**
     * Trigger file download for export
     * @param {string} slotId - Save slot ID (null for all)
     */
    downloadSave(slotId = null) {
        const json = slotId ? this.exportSave(slotId) : this.exportAllSaves();
        
        if (!json) return;
        
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = slotId 
            ? `avion_save_${slotId}.json`
            : 'avion_saves_all.json';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Create file input for import
     * @returns {Promise<SaveSlot|null>}
     */
    uploadSave() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) {
                    resolve(null);
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const slot = this.importSave(event.target.result);
                    resolve(slot);
                };
                reader.onerror = () => resolve(null);
                reader.readAsText(file);
            };
            
            input.click();
        });
    }

    /**
     * Get storage usage information
     * @returns {Object}
     */
    getStorageInfo() {
        const data = localStorage.getItem(this.storageKey) || '';
        const size = new Blob([data]).size;
        
        return {
            usedBytes: size,
            usedKB: (size / 1024).toFixed(2),
            saveCount: this.saves.size,
            maxSlots: this.maxSlots
        };
    }

    /**
     * Clear all saves
     */
    clearAll() {
        this.saves.clear();
        localStorage.removeItem(this.storageKey);
        this.emit('cleared');
    }

    /**
     * Set auto-save enabled state
     * @param {boolean} enabled
     */
    setAutoSaveEnabled(enabled) {
        this.autoSaveEnabled = enabled;
        
        if (!enabled) {
            this.stopAutoSave();
        }
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.eventListeners.has(event)) return;
        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.eventListeners.has(event)) return;
        this.eventListeners.get(event).forEach(callback => callback(data));
    }

    /**
     * Dispose of the manager
     */
    dispose() {
        this.stopAutoSave();
        this.eventListeners.clear();
    }
}

// Export singleton instance
const saveManager = new SaveManager();
export default saveManager;
