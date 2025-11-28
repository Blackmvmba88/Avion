/**
 * TouchControls.js
 * Mobile touch control system with virtual joysticks and buttons
 * for flight control on touch devices.
 */

/**
 * Touch control zones
 */
export const TouchZone = {
    LEFT_STICK: 'leftStick',
    RIGHT_STICK: 'rightStick',
    THROTTLE: 'throttle',
    BUTTONS: 'buttons'
};

/**
 * Virtual button definitions
 */
export const VirtualButton = {
    GEAR: 'gear',
    FLAPS_UP: 'flapsUp',
    FLAPS_DOWN: 'flapsDown',
    BRAKE: 'brake',
    RESET: 'reset',
    PAUSE: 'pause',
    CAMERA: 'camera',
    COCKPIT: 'cockpit'
};

/**
 * Joystick class
 * Handles a single virtual joystick
 */
class VirtualJoystick {
    constructor(config = {}) {
        this.id = config.id || 'joystick';
        this.container = config.container;
        this.position = config.position || 'left'; // 'left' or 'right'
        this.size = config.size || 120;
        this.innerSize = config.innerSize || 50;
        this.deadzone = config.deadzone || 0.1;
        this.color = config.color || 'rgba(255, 255, 255, 0.3)';
        this.activeColor = config.activeColor || 'rgba(255, 255, 255, 0.6)';
        
        // State
        this.active = false;
        this.touchId = null;
        this.center = { x: 0, y: 0 };
        this.current = { x: 0, y: 0 };
        this.value = { x: 0, y: 0 };
        
        // DOM elements
        this.baseElement = null;
        this.stickElement = null;
        
        this.createElements();
    }

    createElements() {
        // Base circle
        this.baseElement = document.createElement('div');
        this.baseElement.className = `virtual-joystick-base ${this.position}`;
        this.baseElement.style.cssText = `
            position: fixed;
            ${this.position}: 30px;
            bottom: 30px;
            width: ${this.size}px;
            height: ${this.size}px;
            background: ${this.color};
            border: 2px solid rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            touch-action: none;
            z-index: 5000;
            display: none;
        `;
        
        // Stick/knob
        this.stickElement = document.createElement('div');
        this.stickElement.className = 'virtual-joystick-stick';
        this.stickElement.style.cssText = `
            position: absolute;
            width: ${this.innerSize}px;
            height: ${this.innerSize}px;
            background: ${this.activeColor};
            border: 2px solid white;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            transition: background 0.1s;
        `;
        
        this.baseElement.appendChild(this.stickElement);
        this.container.appendChild(this.baseElement);
    }

    show() {
        this.baseElement.style.display = 'block';
    }

    hide() {
        this.baseElement.style.display = 'none';
    }

    handleTouchStart(touch) {
        const rect = this.baseElement.getBoundingClientRect();
        this.center.x = rect.left + rect.width / 2;
        this.center.y = rect.top + rect.height / 2;
        
        this.active = true;
        this.touchId = touch.identifier;
        this.handleTouchMove(touch);
        
        this.baseElement.style.borderColor = 'rgba(255, 255, 255, 0.8)';
    }

    handleTouchMove(touch) {
        if (!this.active) return;
        
        const dx = touch.clientX - this.center.x;
        const dy = touch.clientY - this.center.y;
        
        // Clamp to joystick radius
        const maxRadius = this.size / 2 - this.innerSize / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const clampedDistance = Math.min(distance, maxRadius);
        const angle = Math.atan2(dy, dx);
        
        const clampedX = Math.cos(angle) * clampedDistance;
        const clampedY = Math.sin(angle) * clampedDistance;
        
        // Update stick position
        this.stickElement.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
        
        // Calculate normalized value (-1 to 1)
        this.value.x = clampedX / maxRadius;
        this.value.y = clampedY / maxRadius;
        
        // Apply deadzone
        if (Math.abs(this.value.x) < this.deadzone) this.value.x = 0;
        if (Math.abs(this.value.y) < this.deadzone) this.value.y = 0;
    }

    handleTouchEnd() {
        this.active = false;
        this.touchId = null;
        this.value = { x: 0, y: 0 };
        
        // Reset stick position
        this.stickElement.style.transform = 'translate(-50%, -50%)';
        this.baseElement.style.borderColor = 'rgba(255, 255, 255, 0.4)';
    }

    getValue() {
        return { ...this.value };
    }

    isActive() {
        return this.active;
    }

    dispose() {
        if (this.baseElement?.parentNode) {
            this.baseElement.parentNode.removeChild(this.baseElement);
        }
    }
}

/**
 * ThrottleSlider class
 * Handles the throttle control slider
 */
class ThrottleSlider {
    constructor(config = {}) {
        this.container = config.container;
        this.height = config.height || 200;
        this.width = config.width || 50;
        
        // State
        this.active = false;
        this.touchId = null;
        this.value = config.initialValue || 0.5;
        
        // DOM elements
        this.sliderElement = null;
        this.fillElement = null;
        this.handleElement = null;
        this.labelElement = null;
        
        this.createElements();
    }

    createElements() {
        // Main container
        this.sliderElement = document.createElement('div');
        this.sliderElement.className = 'throttle-slider';
        this.sliderElement.style.cssText = `
            position: fixed;
            left: 170px;
            bottom: 30px;
            width: ${this.width}px;
            height: ${this.height}px;
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid rgba(255, 255, 255, 0.4);
            border-radius: 25px;
            touch-action: none;
            z-index: 5000;
            display: none;
        `;
        
        // Fill bar
        this.fillElement = document.createElement('div');
        this.fillElement.style.cssText = `
            position: absolute;
            bottom: 5px;
            left: 5px;
            right: 5px;
            height: ${this.value * (this.height - 10)}px;
            background: linear-gradient(to top, #4CAF50, #8BC34A);
            border-radius: 20px;
            transition: height 0.1s;
        `;
        
        // Handle
        this.handleElement = document.createElement('div');
        this.handleElement.style.cssText = `
            position: absolute;
            left: 50%;
            bottom: ${this.value * (this.height - 30) + 5}px;
            transform: translateX(-50%);
            width: 40px;
            height: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            transition: bottom 0.1s;
        `;
        
        // Label
        this.labelElement = document.createElement('div');
        this.labelElement.style.cssText = `
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 12px;
            font-family: monospace;
        `;
        this.updateLabel();
        
        this.sliderElement.appendChild(this.fillElement);
        this.sliderElement.appendChild(this.handleElement);
        this.sliderElement.appendChild(this.labelElement);
        this.container.appendChild(this.sliderElement);
    }

    show() {
        this.sliderElement.style.display = 'block';
    }

    hide() {
        this.sliderElement.style.display = 'none';
    }

    handleTouchStart(touch) {
        this.active = true;
        this.touchId = touch.identifier;
        this.handleTouchMove(touch);
    }

    handleTouchMove(touch) {
        if (!this.active) return;
        
        const rect = this.sliderElement.getBoundingClientRect();
        const relativeY = rect.bottom - touch.clientY;
        const normalizedY = Math.max(0, Math.min(1, relativeY / rect.height));
        
        this.value = normalizedY;
        this.updateVisuals();
    }

    handleTouchEnd() {
        this.active = false;
        this.touchId = null;
    }

    updateVisuals() {
        const fillHeight = this.value * (this.height - 10);
        this.fillElement.style.height = `${fillHeight}px`;
        
        const handleBottom = this.value * (this.height - 30) + 5;
        this.handleElement.style.bottom = `${handleBottom}px`;
        
        this.updateLabel();
    }

    updateLabel() {
        this.labelElement.textContent = `THR ${Math.round(this.value * 100)}%`;
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = Math.max(0, Math.min(1, value));
        this.updateVisuals();
    }

    dispose() {
        if (this.sliderElement?.parentNode) {
            this.sliderElement.parentNode.removeChild(this.sliderElement);
        }
    }
}

/**
 * TouchControls class
 * Main touch control system manager
 */
export class TouchControls {
    /**
     * Create a new TouchControls instance
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            enabled: config.enabled ?? true,
            showOnMobile: config.showOnMobile ?? true,
            joystickDeadzone: config.joystickDeadzone ?? 0.1,
            throttleSensitivity: config.throttleSensitivity ?? 1.0,
            hapticFeedback: config.hapticFeedback ?? true,
            ...config
        };
        
        this.container = config.container || document.body;
        
        // Components
        this.leftJoystick = null;
        this.rightJoystick = null;
        this.throttleSlider = null;
        this.buttons = new Map();
        this.buttonElements = new Map();
        
        // State
        this.enabled = this.config.enabled;
        this.visible = false;
        this.controlState = {
            pitch: 0,
            roll: 0,
            yaw: 0,
            throttle: 0.5,
            buttons: {}
        };
        
        // Touch tracking
        this.activeTouches = new Map();
        
        // Event callbacks
        this.onControlChange = config.onControlChange || null;
        this.onButtonPress = config.onButtonPress || null;
        
        // Bind methods
        this.boundHandleTouchStart = this.handleTouchStart.bind(this);
        this.boundHandleTouchMove = this.handleTouchMove.bind(this);
        this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
        
        this.createControls();
        this.bindEvents();
    }

    /**
     * Create all control elements
     */
    createControls() {
        // Control container
        this.controlContainer = document.createElement('div');
        this.controlContainer.id = 'touch-controls';
        this.controlContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 4999;
            display: none;
        `;
        this.container.appendChild(this.controlContainer);
        
        // Inner container for controls (allows pointer events)
        this.innerContainer = document.createElement('div');
        this.innerContainer.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            pointer-events: auto;
        `;
        this.controlContainer.appendChild(this.innerContainer);
        
        // Left joystick (pitch/roll)
        this.leftJoystick = new VirtualJoystick({
            id: 'left-joystick',
            container: this.innerContainer,
            position: 'left',
            size: 120,
            deadzone: this.config.joystickDeadzone
        });
        
        // Right joystick (yaw/camera)
        this.rightJoystick = new VirtualJoystick({
            id: 'right-joystick',
            container: this.innerContainer,
            position: 'right',
            size: 120,
            deadzone: this.config.joystickDeadzone
        });
        
        // Throttle slider
        this.throttleSlider = new ThrottleSlider({
            container: this.innerContainer,
            initialValue: 0.5
        });
        
        // Create action buttons
        this.createButtons();
    }

    /**
     * Create action buttons
     */
    createButtons() {
        const buttonConfigs = [
            { id: VirtualButton.GEAR, label: 'GEAR', x: 'right', y: 200 },
            { id: VirtualButton.FLAPS_UP, label: 'F▲', x: 'right', y: 260 },
            { id: VirtualButton.FLAPS_DOWN, label: 'F▼', x: 'right', y: 320 },
            { id: VirtualButton.BRAKE, label: 'BRK', x: 'left', y: 200 },
            { id: VirtualButton.PAUSE, label: '⏸', x: 'center', y: 20, isTop: true },
            { id: VirtualButton.CAMERA, label: '📷', x: 'center-left', y: 20, isTop: true },
            { id: VirtualButton.RESET, label: '↺', x: 'center-right', y: 20, isTop: true }
        ];
        
        buttonConfigs.forEach(config => {
            const button = document.createElement('button');
            button.id = `touch-btn-${config.id}`;
            button.className = 'touch-button';
            button.textContent = config.label;
            
            let positionStyle = '';
            if (config.isTop) {
                if (config.x === 'center') {
                    positionStyle = `top: ${config.y}px; left: 50%; transform: translateX(-50%);`;
                } else if (config.x === 'center-left') {
                    positionStyle = `top: ${config.y}px; left: calc(50% - 70px); transform: translateX(-50%);`;
                } else if (config.x === 'center-right') {
                    positionStyle = `top: ${config.y}px; left: calc(50% + 70px); transform: translateX(-50%);`;
                }
            } else {
                positionStyle = `${config.x}: 170px; bottom: ${config.y}px;`;
            }
            
            button.style.cssText = `
                position: fixed;
                ${positionStyle}
                width: 50px;
                height: 50px;
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.5);
                border-radius: 12px;
                color: white;
                font-size: 14px;
                font-weight: bold;
                touch-action: manipulation;
                z-index: 5001;
                display: none;
                pointer-events: auto;
            `;
            
            this.innerContainer.appendChild(button);
            this.buttonElements.set(config.id, button);
            this.buttons.set(config.id, { pressed: false, element: button });
        });
    }

    /**
     * Bind touch event listeners
     */
    bindEvents() {
        this.innerContainer.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
        this.innerContainer.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
        this.innerContainer.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false });
        this.innerContainer.addEventListener('touchcancel', this.boundHandleTouchEnd, { passive: false });
        
        // Button events
        this.buttonElements.forEach((element, id) => {
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleButtonPress(id, true);
            });
            
            element.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleButtonPress(id, false);
            });
        });
    }

    /**
     * Handle touch start
     * @param {TouchEvent} e
     */
    handleTouchStart(e) {
        if (!this.enabled) return;
        e.preventDefault();
        
        for (const touch of e.changedTouches) {
            const target = this.getTouchTarget(touch);
            
            if (target === 'leftJoystick') {
                this.leftJoystick.handleTouchStart(touch);
            } else if (target === 'rightJoystick') {
                this.rightJoystick.handleTouchStart(touch);
            } else if (target === 'throttle') {
                this.throttleSlider.handleTouchStart(touch);
            }
            
            this.activeTouches.set(touch.identifier, target);
        }
        
        this.triggerHaptic('light');
    }

    /**
     * Handle touch move
     * @param {TouchEvent} e
     */
    handleTouchMove(e) {
        if (!this.enabled) return;
        e.preventDefault();
        
        for (const touch of e.changedTouches) {
            const target = this.activeTouches.get(touch.identifier);
            
            if (target === 'leftJoystick') {
                this.leftJoystick.handleTouchMove(touch);
            } else if (target === 'rightJoystick') {
                this.rightJoystick.handleTouchMove(touch);
            } else if (target === 'throttle') {
                this.throttleSlider.handleTouchMove(touch);
            }
        }
        
        this.updateControlState();
    }

    /**
     * Handle touch end
     * @param {TouchEvent} e
     */
    handleTouchEnd(e) {
        if (!this.enabled) return;
        e.preventDefault();
        
        for (const touch of e.changedTouches) {
            const target = this.activeTouches.get(touch.identifier);
            
            if (target === 'leftJoystick') {
                this.leftJoystick.handleTouchEnd();
            } else if (target === 'rightJoystick') {
                this.rightJoystick.handleTouchEnd();
            } else if (target === 'throttle') {
                this.throttleSlider.handleTouchEnd();
            }
            
            this.activeTouches.delete(touch.identifier);
        }
        
        this.updateControlState();
    }

    /**
     * Determine which control a touch is targeting
     * @param {Touch} touch
     * @returns {string|null}
     */
    getTouchTarget(touch) {
        const leftRect = this.leftJoystick.baseElement.getBoundingClientRect();
        const rightRect = this.rightJoystick.baseElement.getBoundingClientRect();
        const throttleRect = this.throttleSlider.sliderElement.getBoundingClientRect();
        
        if (this.isPointInRect(touch.clientX, touch.clientY, leftRect)) {
            return 'leftJoystick';
        }
        if (this.isPointInRect(touch.clientX, touch.clientY, rightRect)) {
            return 'rightJoystick';
        }
        if (this.isPointInRect(touch.clientX, touch.clientY, throttleRect)) {
            return 'throttle';
        }
        
        return null;
    }

    /**
     * Check if a point is in a rectangle
     */
    isPointInRect(x, y, rect) {
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    /**
     * Handle button press/release
     * @param {string} buttonId
     * @param {boolean} pressed
     */
    handleButtonPress(buttonId, pressed) {
        const button = this.buttons.get(buttonId);
        if (!button) return;
        
        button.pressed = pressed;
        this.controlState.buttons[buttonId] = pressed;
        
        // Visual feedback
        button.element.style.background = pressed 
            ? 'rgba(76, 175, 80, 0.5)' 
            : 'rgba(255, 255, 255, 0.2)';
        
        if (pressed) {
            this.triggerHaptic('medium');
        }
        
        if (this.onButtonPress) {
            this.onButtonPress(buttonId, pressed);
        }
    }

    /**
     * Update control state from joysticks and throttle
     */
    updateControlState() {
        const left = this.leftJoystick.getValue();
        const right = this.rightJoystick.getValue();
        
        // Left joystick: pitch (y) and roll (x)
        this.controlState.pitch = -left.y; // Inverted Y for intuitive control
        this.controlState.roll = left.x;
        
        // Right joystick: yaw (x)
        this.controlState.yaw = right.x;
        
        // Throttle
        this.controlState.throttle = this.throttleSlider.getValue();
        
        if (this.onControlChange) {
            this.onControlChange(this.getControls());
        }
    }

    /**
     * Get current control state
     * @returns {Object}
     */
    getControls() {
        return { ...this.controlState };
    }

    /**
     * Trigger haptic feedback
     * @param {string} type - 'light', 'medium', 'heavy'
     */
    triggerHaptic(type = 'light') {
        if (!this.config.hapticFeedback) return;
        
        if ('vibrate' in navigator) {
            const durations = {
                light: 10,
                medium: 25,
                heavy: 50
            };
            navigator.vibrate(durations[type] || 10);
        }
    }

    /**
     * Show touch controls
     */
    show() {
        if (this.visible) return;
        
        this.visible = true;
        this.controlContainer.style.display = 'block';
        this.leftJoystick.show();
        this.rightJoystick.show();
        this.throttleSlider.show();
        
        this.buttonElements.forEach(element => {
            element.style.display = 'flex';
            element.style.justifyContent = 'center';
            element.style.alignItems = 'center';
        });
    }

    /**
     * Hide touch controls
     */
    hide() {
        if (!this.visible) return;
        
        this.visible = false;
        this.controlContainer.style.display = 'none';
        this.leftJoystick.hide();
        this.rightJoystick.hide();
        this.throttleSlider.hide();
        
        this.buttonElements.forEach(element => {
            element.style.display = 'none';
        });
    }

    /**
     * Toggle visibility
     */
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Check if controls are visible
     * @returns {boolean}
     */
    isVisible() {
        return this.visible;
    }

    /**
     * Enable touch controls
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable touch controls
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Check if a device supports touch
     * Includes legacy IE support (msMaxTouchPoints) and coarse pointer detection
     * @returns {boolean}
     */
    static isTouchDevice() {
        // Primary touch detection methods
        const hasTouch = 'ontouchstart' in window || 
                        navigator.maxTouchPoints > 0 ||
                        navigator.msMaxTouchPoints > 0;
        
        // Additional check using media query for coarse pointer (touch screens)
        const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;
        
        return hasTouch || hasCoarsePointer;
    }

    /**
     * Check if touch is the primary input method (vs hybrid devices)
     * @returns {boolean}
     */
    static isPrimaryTouchDevice() {
        // Check if the primary pointer is coarse (touch) vs fine (mouse)
        return window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        this.innerContainer.removeEventListener('touchstart', this.boundHandleTouchStart);
        this.innerContainer.removeEventListener('touchmove', this.boundHandleTouchMove);
        this.innerContainer.removeEventListener('touchend', this.boundHandleTouchEnd);
        this.innerContainer.removeEventListener('touchcancel', this.boundHandleTouchEnd);
        
        this.leftJoystick?.dispose();
        this.rightJoystick?.dispose();
        this.throttleSlider?.dispose();
        
        this.buttonElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        if (this.controlContainer?.parentNode) {
            this.controlContainer.parentNode.removeChild(this.controlContainer);
        }
    }
}

export default TouchControls;
