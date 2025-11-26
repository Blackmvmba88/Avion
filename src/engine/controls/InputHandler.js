/**
 * Input Handler
 * Handles keyboard, mouse, and gamepad input
 */

export class InputHandler {
    constructor() {
        this.keys = new Map();
        this.axes = {
            pitch: 0,
            roll: 0,
            yaw: 0,
            throttle: 0
        };
        
        this.setupEventListeners();
    }
    
    /**
     * Set up input event listeners
     */
    setupEventListeners() {
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        // TODO: Add mouse and gamepad listeners
    }
    
    /**
     * Handle key down event
     * @param {KeyboardEvent} event - Keyboard event
     */
    onKeyDown(event) {
        this.keys.set(event.key.toLowerCase(), true);
    }
    
    /**
     * Handle key up event
     * @param {KeyboardEvent} event - Keyboard event
     */
    onKeyUp(event) {
        this.keys.set(event.key.toLowerCase(), false);
    }
    
    /**
     * Check if key is pressed
     * @param {string} key - Key to check
     * @returns {boolean} True if pressed
     */
    isKeyPressed(key) {
        return this.keys.get(key.toLowerCase()) || false;
    }
    
    /**
     * Get axis value
     * @param {string} axis - Axis name (pitch, roll, yaw, throttle)
     * @returns {number} Axis value (-1 to 1, or 0 to 1 for throttle)
     */
    getAxis(axis) {
        return this.axes[axis] || 0;
    }
    
    /**
     * Update input state
     */
    update() {
        // TODO: Update axes based on key states
        // Calculate pitch, roll, yaw from keys
    }
    
    /**
     * Clean up event listeners
     */
    dispose() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }
}

export default InputHandler;
