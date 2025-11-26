/**
 * Engine Controls Module Index
 * Exports all control-related components
 */

export { InputHandler } from './InputHandler.js';
export { Keybindings } from './Keybindings.js';

// Touch and gamepad controls will be added
// export { TouchControls } from './TouchControls.js';
// export { GamepadControls } from './GamepadControls.js';

// Re-export default
import { InputHandler } from './InputHandler.js';
export default InputHandler;
