import { FlightDynamics } from './physics/index.js';
import { SceneRenderer } from './rendering/index.js';
import { InputHandler } from './controls/index.js';
import { BasicPlane } from './aircraft/index.js';
import { Sky, Terrain } from './environment/index.js';

/**
 * FlightSimulator - Main application class that combines all modules
 */
class FlightSimulator {
    constructor() {
        this.renderer = null;
        this.physics = null;
        this.controls = null;
        this.aircraft = null;
        this.sky = null;
        this.terrain = null;

        this.lastTime = 0;
        this.isRunning = false;

        this.init();
    }

    /**
   * Initialize all simulator components
   */
    init() {
    // Create UI overlay
        this.createUI();

        // Initialize rendering
        this.renderer = new SceneRenderer(document.getElementById('game-container'));

        // Initialize physics
        this.physics = new FlightDynamics();

        // Initialize controls
        this.controls = new InputHandler();

        // Create aircraft
        this.aircraft = new BasicPlane();
        this.renderer.add(this.aircraft.getObject3D());

        // Create environment
        this.sky = new Sky();
        this.renderer.add(this.sky.getObject3D());

        this.terrain = new Terrain();
        this.renderer.add(this.terrain.getObject3D());

        // Start the simulation
        this.start();
    }

    /**
   * Create the UI overlay with controls info and HUD
   */
    createUI() {
    // Game container
        const container = document.createElement('div');
        container.id = 'game-container';
        container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%;';
        document.body.appendChild(container);

        // HUD overlay
        const hud = document.createElement('div');
        hud.id = 'hud';
        hud.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      color: white;
      font-family: monospace;
      font-size: 14px;
      background: rgba(0, 0, 0, 0.5);
      padding: 15px;
      border-radius: 5px;
      z-index: 100;
    `;
        hud.innerHTML = `
      <div id="speed">Speed: 0 m/s</div>
      <div id="altitude">Altitude: 0 m</div>
      <div id="throttle">Throttle: 50%</div>
    `;
        document.body.appendChild(hud);

        // Controls info
        const controlsInfo = document.createElement('div');
        controlsInfo.id = 'controls-info';
        controlsInfo.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      color: white;
      font-family: monospace;
      font-size: 12px;
      background: rgba(0, 0, 0, 0.5);
      padding: 15px;
      border-radius: 5px;
      z-index: 100;
    `;
        controlsInfo.innerHTML = `
      <strong>Controls:</strong><br>
      W/S or ↑/↓: Pitch<br>
      A/D or ←/→: Roll<br>
      Q/E: Yaw<br>
      Shift: Throttle Up<br>
      Ctrl: Throttle Down<br>
      R: Reset
    `;
        document.body.appendChild(controlsInfo);

        // Title
        const title = document.createElement('div');
        title.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      z-index: 100;
    `;
        title.textContent = 'Avion Flight Simulator';
        document.body.appendChild(title);
    }

    /**
   * Update the HUD display
   * @param {Object} state - Current physics state
   * @param {Object} controlState - Current control state
   */
    updateHUD(state, controlState) {
        document.getElementById('speed').textContent = `Speed: ${state.speed.toFixed(1)} m/s`;
        document.getElementById('altitude').textContent = `Altitude: ${state.position.y.toFixed(1)} m`;
        document.getElementById('throttle').textContent = `Throttle: ${(controlState.throttle * 100).toFixed(0)}%`;
    }

    /**
   * Start the simulation loop
   */
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animate();
    }

    /**
   * Stop the simulation
   */
    stop() {
        this.isRunning = false;
    }

    /**
   * Main animation loop
   */
    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        // Cap delta time to prevent large jumps
        const clampedDelta = Math.min(deltaTime, 0.1);

        // Update controls
        this.controls.update();
        const controlState = this.controls.getControls();

        // Handle reset
        if (controlState.reset) {
            this.physics.reset();
        }

        // Update physics
        this.physics.update(clampedDelta, controlState, this.aircraft.getConfig());
        const physicsState = this.physics.getState();

        // Update aircraft model
        this.aircraft.updateFromState(physicsState);

        // Update sky position
        this.sky.updatePosition(physicsState.position);

        // Update camera
        this.renderer.updateCamera(physicsState);

        // Update HUD
        this.updateHUD(physicsState, controlState);

        // Render scene
        this.renderer.render();
    }

    /**
   * Clean up resources
   */
    dispose() {
        this.stop();
        this.renderer.dispose();
        this.aircraft.dispose();
        this.sky.dispose();
        this.terrain.dispose();
        this.controls.dispose();
    }
}

// Initialize the simulator when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.simulator = new FlightSimulator();
});

export default FlightSimulator;
