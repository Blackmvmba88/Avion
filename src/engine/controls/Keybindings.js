/**
 * Keybindings Management
 * Handles configurable key bindings for controls
 */

export class Keybindings {
    constructor() {
        this.bindings = this.getDefaultBindings();
    }
    
    /**
     * Get default key bindings
     * @returns {Object} Default bindings
     */
    getDefaultBindings() {
        return {
            pitchUp: 'w',
            pitchDown: 's',
            rollLeft: 'a',
            rollRight: 'd',
            yawLeft: 'q',
            yawRight: 'e',
            throttleUp: 'Shift',
            throttleDown: 'Control',
            fullThrottle: 'z',
            idleThrottle: 'x',
            pause: 'p',
            reset: 'Backspace',
            toggleHUD: 'h',
            toggleHelp: 'F1',
            screenshot: 'F12',
            menu: 'Escape'
        };
    }
    
    /**
     * Set key binding
     * @param {string} action - Action name
     * @param {string} key - Key code
     */
    setBinding(action, key) {
        this.bindings[action] = key;
    }
    
    /**
     * Get key for action
     * @param {string} action - Action name
     * @returns {string} Key code
     */
    getBinding(action) {
        return this.bindings[action];
    }
    
    /**
     * Check for conflicts
     * @param {string} key - Key to check
     * @returns {Array<string>} Actions bound to this key
     */
    findConflicts(key) {
        const conflicts = [];
        for (const [action, boundKey] of Object.entries(this.bindings)) {
            if (boundKey === key) {
                conflicts.push(action);
            }
        }
        return conflicts;
    }
    
    /**
     * Reset to default bindings
     */
    reset() {
        this.bindings = this.getDefaultBindings();
    }
}

export default Keybindings;
