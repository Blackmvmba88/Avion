/**
 * InputHandler.js
 * Handles keyboard and mouse input for flight controls and camera movement.
 * Provides a clean, configurable interface for input management.
 */

/**
 * Default key bindings for flight controls
 */
const DEFAULT_KEY_BINDINGS = {
    // Flight controls
    pitchUp: 'KeyW',
    pitchDown: 'KeyS',
    rollLeft: 'KeyA',
    rollRight: 'KeyD',
    yawLeft: 'KeyQ',
    yawRight: 'KeyE',
    throttleUp: 'ShiftLeft',
    throttleDown: 'ControlLeft',
    
    // Camera controls
    cameraUp: 'ArrowUp',
    cameraDown: 'ArrowDown',
    cameraLeft: 'ArrowLeft',
    cameraRight: 'ArrowRight',
    cameraZoomIn: 'Equal',
    cameraZoomOut: 'Minus',
    cameraReset: 'KeyR',
    
    // Aircraft controls
    resetAircraft: 'Backspace',
    togglePause: 'KeyP'
};

/**
 * InputHandler class
 * Manages all input from keyboard and mouse
 */
export class InputHandler {
    /**
     * Create a new InputHandler instance
     * @param {Object} config - Configuration options
     * @param {Object} config.keyBindings - Custom key bindings
     * @param {HTMLElement} config.element - DOM element to attach listeners to
     */
    constructor(config = {}) {
        this.keyBindings = { ...DEFAULT_KEY_BINDINGS, ...config.keyBindings };
        this.element = config.element || window;
        
        // Input state
        this.keysPressed = new Set();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.mouseButtons = new Set();
        this.isPointerLocked = false;
        
        // Control state (processed input values)
        this.flightControls = {
            pitch: 0,
            roll: 0,
            yaw: 0,
            throttle: 0
        };
        
        this.cameraControls = {
            horizontal: 0,
            vertical: 0,
            zoom: 0,
            reset: false
        };
        
        this.actions = {
            resetAircraft: false,
            togglePause: false
        };
        
        // Sensitivity settings
        this.sensitivity = {
            keyboard: 1.0,
            mouse: 0.002,
            throttle: 0.5,
            cameraKeyboard: 1.0
        };
        
        // Throttle state for gradual changes
        this.currentThrottle = 0;
        
        // Bind event handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handlePointerLockChange = this.handlePointerLockChange.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        
        // Initialize
        this.attachEventListeners();
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('wheel', this.handleWheel);
        document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    }

    /**
     * Remove all event listeners
     */
    detachEventListeners() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('wheel', this.handleWheel);
        document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        this.keysPressed.add(event.code);
        
        // Handle one-shot actions
        if (event.code === this.keyBindings.resetAircraft) {
            this.actions.resetAircraft = true;
        }
        if (event.code === this.keyBindings.togglePause) {
            this.actions.togglePause = true;
        }
        if (event.code === this.keyBindings.cameraReset) {
            this.cameraControls.reset = true;
        }
        
        // Prevent default for game controls
        if (this.isGameKey(event.code)) {
            event.preventDefault();
        }
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyUp(event) {
        this.keysPressed.delete(event.code);
    }

    /**
     * Handle mouse movement
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseMove(event) {
        if (this.isPointerLocked) {
            this.mouseDelta.x += event.movementX;
            this.mouseDelta.y += event.movementY;
        } else {
            this.mousePosition.x = event.clientX;
            this.mousePosition.y = event.clientY;
        }
    }

    /**
     * Handle mouse button down
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseDown(event) {
        this.mouseButtons.add(event.button);
        
        // Request pointer lock on left click (for camera control)
        if (event.button === 0 && event.target.tagName === 'CANVAS') {
            event.target.requestPointerLock();
        }
    }

    /**
     * Handle mouse button up
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseUp(event) {
        this.mouseButtons.delete(event.button);
    }

    /**
     * Handle mouse wheel
     * @param {WheelEvent} event - Wheel event
     */
    handleWheel(event) {
        this.cameraControls.zoom -= Math.sign(event.deltaY) * 0.5;
        event.preventDefault();
    }

    /**
     * Handle pointer lock change
     */
    handlePointerLockChange() {
        this.isPointerLocked = document.pointerLockElement !== null;
    }

    /**
     * Check if a key code is a game control key
     * @param {string} code - Key code
     * @returns {boolean} True if game key
     */
    isGameKey(code) {
        return Object.values(this.keyBindings).includes(code);
    }

    /**
     * Check if a specific key is currently pressed
     * @param {string} binding - Key binding name
     * @returns {boolean} True if pressed
     */
    isKeyPressed(binding) {
        const keyCode = this.keyBindings[binding];
        return this.keysPressed.has(keyCode);
    }

    /**
     * Update control states based on current input
     * Call this once per frame
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Reset continuous controls
        this.flightControls.pitch = 0;
        this.flightControls.roll = 0;
        this.flightControls.yaw = 0;
        
        // Process keyboard flight controls
        if (this.isKeyPressed('pitchUp')) {
            this.flightControls.pitch = -this.sensitivity.keyboard;
        }
        if (this.isKeyPressed('pitchDown')) {
            this.flightControls.pitch = this.sensitivity.keyboard;
        }
        if (this.isKeyPressed('rollLeft')) {
            this.flightControls.roll = this.sensitivity.keyboard;
        }
        if (this.isKeyPressed('rollRight')) {
            this.flightControls.roll = -this.sensitivity.keyboard;
        }
        if (this.isKeyPressed('yawLeft')) {
            this.flightControls.yaw = this.sensitivity.keyboard;
        }
        if (this.isKeyPressed('yawRight')) {
            this.flightControls.yaw = -this.sensitivity.keyboard;
        }
        
        // Process throttle (gradual change)
        if (this.isKeyPressed('throttleUp')) {
            this.currentThrottle += this.sensitivity.throttle * deltaTime;
        }
        if (this.isKeyPressed('throttleDown')) {
            this.currentThrottle -= this.sensitivity.throttle * deltaTime;
        }
        this.currentThrottle = Math.max(0, Math.min(1, this.currentThrottle));
        this.flightControls.throttle = this.currentThrottle;
        
        // Process camera controls
        this.cameraControls.horizontal = 0;
        this.cameraControls.vertical = 0;
        
        if (this.isKeyPressed('cameraLeft')) {
            this.cameraControls.horizontal = -this.sensitivity.cameraKeyboard;
        }
        if (this.isKeyPressed('cameraRight')) {
            this.cameraControls.horizontal = this.sensitivity.cameraKeyboard;
        }
        if (this.isKeyPressed('cameraUp')) {
            this.cameraControls.vertical = this.sensitivity.cameraKeyboard;
        }
        if (this.isKeyPressed('cameraDown')) {
            this.cameraControls.vertical = -this.sensitivity.cameraKeyboard;
        }
        
        // Process keyboard zoom
        if (this.isKeyPressed('cameraZoomIn')) {
            this.cameraControls.zoom = -1;
        } else if (this.isKeyPressed('cameraZoomOut')) {
            this.cameraControls.zoom = 1;
        }
        
        // Apply mouse movement to camera if pointer locked
        if (this.isPointerLocked) {
            this.cameraControls.horizontal += this.mouseDelta.x * this.sensitivity.mouse;
            this.cameraControls.vertical -= this.mouseDelta.y * this.sensitivity.mouse;
        }
        
        // Reset mouse delta for next frame
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
    }

    /**
     * Get current flight control values
     * @returns {Object} Flight controls (pitch, roll, yaw, throttle)
     */
    getFlightControls() {
        return { ...this.flightControls };
    }

    /**
     * Get current camera control values
     * @returns {Object} Camera controls (horizontal, vertical, zoom, reset)
     */
    getCameraControls() {
        return { ...this.cameraControls };
    }

    /**
     * Get and clear one-shot actions
     * @returns {Object} Actions that were triggered
     */
    consumeActions() {
        const actions = { ...this.actions };
        this.actions.resetAircraft = false;
        this.actions.togglePause = false;
        this.cameraControls.reset = false;
        this.cameraControls.zoom = 0;
        return actions;
    }

    /**
     * Set throttle directly
     * @param {number} value - Throttle value (0-1)
     */
    setThrottle(value) {
        this.currentThrottle = Math.max(0, Math.min(1, value));
    }

    /**
     * Get current throttle value
     * @returns {number} Throttle (0-1)
     */
    getThrottle() {
        return this.currentThrottle;
    }

    /**
     * Set sensitivity values
     * @param {Object} settings - Sensitivity settings
     */
    setSensitivity(settings) {
        this.sensitivity = { ...this.sensitivity, ...settings };
    }

    /**
     * Reset input handler state
     */
    reset() {
        this.keysPressed.clear();
        this.mouseButtons.clear();
        this.mouseDelta = { x: 0, y: 0 };
        this.currentThrottle = 0;
        this.flightControls = { pitch: 0, roll: 0, yaw: 0, throttle: 0 };
        this.cameraControls = { horizontal: 0, vertical: 0, zoom: 0, reset: false };
        this.actions = { resetAircraft: false, togglePause: false };
    }

    /**
     * Cleanup - remove event listeners
     */
    dispose() {
        this.detachEventListeners();
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }
}

export { DEFAULT_KEY_BINDINGS };
