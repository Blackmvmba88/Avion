/**
 * SettingsManager.js
 * Manages user preferences and settings with persistence.
 */

/**
 * Settings categories
 */
export const SettingsCategory = {
    AUDIO: 'audio',
    GRAPHICS: 'graphics',
    CONTROLS: 'controls',
    GAMEPLAY: 'gameplay',
    ACCESSIBILITY: 'accessibility'
};

/**
 * Default settings configuration
 */
export const DEFAULT_SETTINGS = {
    audio: {
        masterVolume: 1.0,
        engineVolume: 0.7,
        environmentVolume: 0.5,
        effectsVolume: 0.8,
        uiVolume: 0.6,
        musicVolume: 0.5,
        enabled: true
    },
    graphics: {
        quality: 'high', // 'low', 'medium', 'high', 'ultra'
        resolution: 1.0, // 0.5 - 2.0
        shadows: true,
        antialiasing: true,
        particles: true,
        particleQuality: 'high',
        fogEnabled: true,
        fogDensity: 0.5,
        targetFPS: 60,
        vsync: true,
        fullscreen: false
    },
    controls: {
        sensitivity: {
            pitch: 1.0,
            roll: 1.0,
            yaw: 1.0,
            camera: 1.0
        },
        invertPitch: false,
        invertRoll: false,
        mouseEnabled: true,
        touchEnabled: true,
        keyBindings: {
            pitchUp: ['KeyW', 'ArrowUp'],
            pitchDown: ['KeyS', 'ArrowDown'],
            rollLeft: ['KeyA', 'ArrowLeft'],
            rollRight: ['KeyD', 'ArrowRight'],
            yawLeft: ['KeyQ'],
            yawRight: ['KeyE'],
            throttleUp: ['ShiftLeft', 'ShiftRight'],
            throttleDown: ['ControlLeft', 'ControlRight'],
            reset: ['KeyR'],
            pause: ['KeyP', 'Escape'],
            toggleHUD: ['KeyH'],
            toggleCockpit: ['KeyC'],
            toggleGear: ['KeyG'],
            toggleFlaps: ['KeyF']
        }
    },
    gameplay: {
        difficulty: 'normal', // 'easy', 'normal', 'realistic'
        units: 'metric', // 'metric', 'imperial'
        hudEnabled: true,
        cockpitView: false,
        autoPilotAssist: false,
        stallWarnings: true,
        crashDamage: true,
        weatherEffects: true,
        tutorialHints: true,
        language: 'auto' // 'auto', 'en', 'es', 'fr', 'de', 'pt'
    },
    accessibility: {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        screenReaderHints: false,
        colorBlindMode: 'none', // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
        subtitles: false
    }
};

/**
 * SettingsManager class
 * Handles loading, saving, and applying settings
 */
export class SettingsManager {
    /**
     * Create a new SettingsManager
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.storageKey = config.storageKey || 'avion_settings';
        this.autoSave = config.autoSave ?? true;
        this.settings = this.deepClone(DEFAULT_SETTINGS);
        this.eventListeners = new Map();
        
        // Load saved settings
        this.load();
    }

    /**
     * Deep clone an object
     * @param {Object} obj
     * @returns {Object}
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Deep merge two objects
     * @param {Object} target
     * @param {Object} source
     * @returns {Object}
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Load settings from local storage
     * @returns {boolean} Success status
     */
    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to handle new settings
                this.settings = this.deepMerge(DEFAULT_SETTINGS, parsed);
                this.emit('loaded', this.settings);
                return true;
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
        
        return false;
    }

    /**
     * Save settings to local storage
     * @returns {boolean} Success status
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            this.emit('saved', this.settings);
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    /**
     * Get all settings
     * @returns {Object}
     */
    getAll() {
        return this.deepClone(this.settings);
    }

    /**
     * Get settings for a specific category
     * @param {string} category
     * @returns {Object|undefined}
     */
    getCategory(category) {
        return this.settings[category] ? this.deepClone(this.settings[category]) : undefined;
    }

    /**
     * Get a specific setting value
     * @param {string} path - Dot-separated path (e.g., 'audio.masterVolume')
     * @returns {*}
     */
    get(path) {
        const parts = path.split('.');
        let current = this.settings;
        
        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }
        
        return current;
    }

    /**
     * Set a specific setting value
     * @param {string} path - Dot-separated path
     * @param {*} value - New value
     * @returns {boolean} Success status
     */
    set(path, value) {
        const parts = path.split('.');
        let current = this.settings;
        
        // Navigate to parent
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        
        const lastPart = parts[parts.length - 1];
        const oldValue = current[lastPart];
        current[lastPart] = value;
        
        // Emit change event
        this.emit('changed', { path, oldValue, newValue: value });
        this.emit(`changed:${path}`, { oldValue, newValue: value });
        
        // Auto-save if enabled
        if (this.autoSave) {
            this.save();
        }
        
        return true;
    }

    /**
     * Set multiple settings at once
     * @param {Object} settings - Object with paths as keys
     */
    setMultiple(settings) {
        for (const [path, value] of Object.entries(settings)) {
            this.set(path, value);
        }
    }

    /**
     * Update an entire category
     * @param {string} category
     * @param {Object} values
     */
    updateCategory(category, values) {
        if (!this.settings[category]) {
            this.settings[category] = {};
        }
        
        this.settings[category] = this.deepMerge(this.settings[category], values);
        
        this.emit('categoryChanged', { category, values: this.settings[category] });
        
        if (this.autoSave) {
            this.save();
        }
    }

    /**
     * Reset a specific category to defaults
     * @param {string} category
     */
    resetCategory(category) {
        if (DEFAULT_SETTINGS[category]) {
            this.settings[category] = this.deepClone(DEFAULT_SETTINGS[category]);
            this.emit('categoryReset', { category });
            
            if (this.autoSave) {
                this.save();
            }
        }
    }

    /**
     * Reset all settings to defaults
     */
    resetAll() {
        this.settings = this.deepClone(DEFAULT_SETTINGS);
        this.emit('reset');
        
        if (this.autoSave) {
            this.save();
        }
    }

    /**
     * Export settings as JSON string
     * @returns {string}
     */
    export() {
        return JSON.stringify(this.settings, null, 2);
    }

    /**
     * Import settings from JSON string
     * @param {string} json
     * @returns {boolean} Success status
     */
    import(json) {
        try {
            const parsed = JSON.parse(json);
            this.settings = this.deepMerge(DEFAULT_SETTINGS, parsed);
            this.emit('imported', this.settings);
            
            if (this.autoSave) {
                this.save();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }

    /**
     * Validate a setting value
     * @param {string} path
     * @param {*} value
     * @returns {Object} { valid: boolean, message?: string }
     */
    validate(path, value) {
        // Volume validation (0-1)
        if (path.includes('Volume')) {
            if (typeof value !== 'number' || value < 0 || value > 1) {
                return { valid: false, message: 'Volume must be between 0 and 1' };
            }
        }
        
        // Sensitivity validation (0.1-3)
        if (path.includes('sensitivity')) {
            if (typeof value !== 'number' || value < 0.1 || value > 3) {
                return { valid: false, message: 'Sensitivity must be between 0.1 and 3' };
            }
        }
        
        // Quality validation
        if (path === 'graphics.quality') {
            const validQualities = ['low', 'medium', 'high', 'ultra'];
            if (!validQualities.includes(value)) {
                return { valid: false, message: 'Invalid quality setting' };
            }
        }
        
        // Difficulty validation
        if (path === 'gameplay.difficulty') {
            const validDifficulties = ['easy', 'normal', 'realistic'];
            if (!validDifficulties.includes(value)) {
                return { valid: false, message: 'Invalid difficulty setting' };
            }
        }
        
        return { valid: true };
    }

    /**
     * Get setting metadata (for UI generation)
     * @param {string} path
     * @returns {Object}
     */
    getMetadata(path) {
        const metadata = {
            'audio.masterVolume': { type: 'slider', min: 0, max: 1, step: 0.05, label: 'Master Volume' },
            'audio.engineVolume': { type: 'slider', min: 0, max: 1, step: 0.05, label: 'Engine Volume' },
            'audio.environmentVolume': { type: 'slider', min: 0, max: 1, step: 0.05, label: 'Environment Volume' },
            'audio.effectsVolume': { type: 'slider', min: 0, max: 1, step: 0.05, label: 'Effects Volume' },
            'audio.enabled': { type: 'toggle', label: 'Sound Enabled' },
            
            'graphics.quality': { type: 'select', options: ['low', 'medium', 'high', 'ultra'], label: 'Quality' },
            'graphics.shadows': { type: 'toggle', label: 'Shadows' },
            'graphics.antialiasing': { type: 'toggle', label: 'Anti-aliasing' },
            'graphics.particles': { type: 'toggle', label: 'Particles' },
            'graphics.fullscreen': { type: 'toggle', label: 'Fullscreen' },
            'graphics.targetFPS': { type: 'select', options: [30, 60, 120, 144], label: 'Target FPS' },
            
            'controls.sensitivity.pitch': { type: 'slider', min: 0.1, max: 3, step: 0.1, label: 'Pitch Sensitivity' },
            'controls.sensitivity.roll': { type: 'slider', min: 0.1, max: 3, step: 0.1, label: 'Roll Sensitivity' },
            'controls.sensitivity.yaw': { type: 'slider', min: 0.1, max: 3, step: 0.1, label: 'Yaw Sensitivity' },
            'controls.invertPitch': { type: 'toggle', label: 'Invert Pitch' },
            'controls.invertRoll': { type: 'toggle', label: 'Invert Roll' },
            
            'gameplay.difficulty': { type: 'select', options: ['easy', 'normal', 'realistic'], label: 'Difficulty' },
            'gameplay.units': { type: 'select', options: ['metric', 'imperial'], label: 'Units' },
            'gameplay.hudEnabled': { type: 'toggle', label: 'Show HUD' },
            'gameplay.stallWarnings': { type: 'toggle', label: 'Stall Warnings' },
            'gameplay.crashDamage': { type: 'toggle', label: 'Crash Damage' }
        };
        
        return metadata[path] || { type: 'unknown' };
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
}

// Export singleton instance
const settingsManager = new SettingsManager();
export default settingsManager;
