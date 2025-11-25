/**
 * InputHandler - Manages keyboard input for flight controls
 */
export class InputHandler {
  constructor() {
    this.keys = {};
    this.controls = {
      throttle: 0.5, // 0 to 1
      pitch: 0, // -1 to 1
      roll: 0, // -1 to 1
      yaw: 0, // -1 to 1
    };

    this.setupEventListeners();
  }

  /**
   * Setup keyboard event listeners
   */
  setupEventListeners() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  /**
   * Handle key down events
   * @param {KeyboardEvent} event
   */
  onKeyDown(event) {
    this.keys[event.code] = true;
    event.preventDefault();
  }

  /**
   * Handle key up events
   * @param {KeyboardEvent} event
   */
  onKeyUp(event) {
    this.keys[event.code] = false;
    event.preventDefault();
  }

  /**
   * Update control values based on current key states
   */
  update() {
    // Pitch control (W/S or ArrowUp/ArrowDown)
    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      this.controls.pitch = -1; // Nose down
    } else if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      this.controls.pitch = 1; // Nose up
    } else {
      this.controls.pitch = 0;
    }

    // Roll control (A/D or ArrowLeft/ArrowRight)
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      this.controls.roll = -1; // Roll left
    } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      this.controls.roll = 1; // Roll right
    } else {
      this.controls.roll = 0;
    }

    // Yaw control (Q/E)
    if (this.keys['KeyQ']) {
      this.controls.yaw = -1; // Yaw left
    } else if (this.keys['KeyE']) {
      this.controls.yaw = 1; // Yaw right
    } else {
      this.controls.yaw = 0;
    }

    // Throttle control (Shift to increase, Control to decrease)
    if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
      this.controls.throttle = Math.min(1, this.controls.throttle + 0.01);
    }
    if (this.keys['ControlLeft'] || this.keys['ControlRight']) {
      this.controls.throttle = Math.max(0, this.controls.throttle - 0.01);
    }

    // Reset (R key)
    if (this.keys['KeyR']) {
      this.controls.reset = true;
    } else {
      this.controls.reset = false;
    }
  }

  /**
   * Get current control state
   * @returns {Object} Current control values
   */
  getControls() {
    return { ...this.controls };
  }

  /**
   * Dispose of event listeners
   */
  dispose() {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
  }
}

export default InputHandler;
