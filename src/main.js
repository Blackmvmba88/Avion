/**
 * main.js
 * Entry point for the Avion Flight Simulator.
 * Initializes all systems and runs the main game loop.
 */

import * as THREE from 'three';
import { Renderer } from './rendering/Renderer.js';
import { CameraController } from './rendering/CameraController.js';
import { Aircraft } from './aircraft/Aircraft.js';
import { InputHandler } from './controls/InputHandler.js';
import { Environment } from './environment/Environment.js';
import { HUD } from './utils/HUD.js';

/**
 * FlightSimulator class
 * Main application class that orchestrates all simulator components
 */
class FlightSimulator {
    /**
     * Create a new FlightSimulator instance
     */
    constructor() {
        // Core systems
        this.renderer = null;
        this.cameraController = null;
        this.aircraft = null;
        this.inputHandler = null;
        this.environment = null;
        this.hud = null;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Physics timing
        this.fixedTimeStep = 1 / 60; // 60 Hz physics
        this.accumulator = 0;
        this.maxDeltaTime = 0.1; // Cap to prevent spiral of death
        
        // Debug info
        this.debugInfo = {};
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    /**
     * Initialize the flight simulator
     * @returns {Promise} Resolves when initialization is complete
     */
    async init() {
        console.log('🛫 Initializing Avion Flight Simulator...');
        
        try {
            // Initialize renderer
            this.renderer = new Renderer({
                container: document.body,
                antialias: true,
                shadows: true,
                defaultLighting: false // TimeOfDay system will handle lighting
            });
            this.renderer.addFog({ near: 500, far: 8000 });
            
            // Initialize input handler
            this.inputHandler = new InputHandler();
            
            // Initialize environment
            this.environment = new Environment(this.renderer.getScene());
            
            // Initialize aircraft
            this.aircraft = new Aircraft({
                name: 'Trainer',
                physics: {
                    mass: 1200,
                    wingArea: 16,
                    maxThrust: 25000,
                    dragCoefficient: 0.025,
                    liftCoefficient: 1.2
                },
                visual: {
                    color: 0x3498db,
                    scale: 1.5
                }
            });
            
            // Set initial aircraft position
            this.aircraft.setPosition(new THREE.Vector3(0, 100, 500));
            this.aircraft.physics.setVelocity(new THREE.Vector3(0, 0, -50));
            
            // Add aircraft to scene
            this.renderer.add(this.aircraft.getObject3D());
            
            // Initialize camera controller
            this.cameraController = new CameraController(this.renderer.getCamera(), {
                initialDistance: 30,
                minDistance: 10,
                maxDistance: 100
            });
            this.cameraController.setTarget(this.aircraft.getObject3D());
            
            // Initialize HUD
            this.hud = new HUD({ container: document.body });
            
            // Add event listeners
            document.addEventListener('visibilitychange', this.handleVisibilityChange);
            
            console.log('✅ Initialization complete!');
            
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Start the simulation
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        console.log('🎮 Simulation started');
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Stop the simulation
     */
    stop() {
        this.isRunning = false;
        console.log('⏹️ Simulation stopped');
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        console.log(this.isPaused ? '⏸️ Paused' : '▶️ Resumed');
    }

    /**
     * Handle page visibility changes
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.isPaused = true;
        }
    }

    /**
     * Main game loop
     * @param {number} currentTime - Current timestamp
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, this.maxDeltaTime);
        this.lastTime = currentTime;
        
        // Process input
        this.processInput();
        
        // Update physics with fixed timestep
        if (!this.isPaused) {
            this.accumulator += this.deltaTime;
            
            while (this.accumulator >= this.fixedTimeStep) {
                this.updatePhysics(this.fixedTimeStep);
                this.accumulator -= this.fixedTimeStep;
            }
        }
        
        // Update camera (uses variable timestep for smooth visuals)
        this.updateCamera(this.deltaTime);
        
        // Update HUD
        this.updateHUD();
        
        // Render
        this.renderer.render();
        
        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Process input and apply to aircraft controls
     */
    processInput() {
        // Update input state
        this.inputHandler.update(this.deltaTime);
        
        // Get control inputs
        const flightControls = this.inputHandler.getFlightControls();
        const cameraControls = this.inputHandler.getCameraControls();
        const actions = this.inputHandler.consumeActions();
        
        // Apply flight controls to aircraft
        this.aircraft.setPitch(flightControls.pitch);
        this.aircraft.setRoll(flightControls.roll);
        this.aircraft.setYaw(flightControls.yaw);
        this.aircraft.setThrottle(flightControls.throttle);
        
        // Apply camera controls
        this.cameraController.applyControls(cameraControls, this.deltaTime);
        
        // Handle actions
        if (actions.resetAircraft) {
            this.resetAircraft();
        }
        if (actions.togglePause) {
            this.togglePause();
        }
    }

    /**
     * Update physics simulation
     * @param {number} dt - Fixed timestep
     */
    updatePhysics(dt) {
        // Update aircraft physics and get debug info
        this.debugInfo = this.aircraft.update(dt);
        
        // Update environment with camera position for effects
        const cameraPosition = this.cameraController ? 
            this.cameraController.getPosition() : 
            new THREE.Vector3();
        this.environment.update(dt, cameraPosition);
    }

    /**
     * Update camera position
     * @param {number} dt - Delta time
     */
    updateCamera(dt) {
        this.cameraController.update(dt);
    }

    /**
     * Update HUD display
     */
    updateHUD() {
        // Calculate heading from aircraft forward direction
        const forward = this.aircraft.getForwardDirection();
        const heading = Math.atan2(forward.x, -forward.z) * (180 / Math.PI);
        
        // Calculate pitch and roll from aircraft orientation
        const euler = new THREE.Euler().setFromQuaternion(this.aircraft.getOrientation(), 'YXZ');
        const pitch = THREE.MathUtils.radToDeg(euler.x);
        const roll = THREE.MathUtils.radToDeg(euler.z);
        
        // Get vertical speed from velocity
        const velocity = this.aircraft.physics.getVelocity();
        const verticalSpeed = velocity.y;
        
        this.hud.update({
            altitude: this.aircraft.getAltitude(),
            airspeed: this.aircraft.getAirspeed(),
            throttle: this.aircraft.getThrottle(),
            heading: heading,
            pitch: pitch,
            roll: roll,
            verticalSpeed: verticalSpeed,
            fps: this.renderer.getFPS()
        });
    }

    /**
     * Reset aircraft to initial position
     */
    resetAircraft() {
        console.log('🔄 Resetting aircraft...');
        
        this.aircraft.reset(
            new THREE.Vector3(0, 100, 500),
            new THREE.Quaternion()
        );
        
        // Give initial forward velocity
        this.aircraft.physics.setVelocity(new THREE.Vector3(0, 0, -50));
        
        // Reset input
        this.inputHandler.reset();
        
        // Reset camera
        this.cameraController.resetOrbit();
    }

    /**
     * Cleanup and dispose all resources
     */
    dispose() {
        this.stop();
        
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (this.hud) this.hud.dispose();
        if (this.inputHandler) this.inputHandler.dispose();
        if (this.environment) this.environment.dispose();
        if (this.renderer) this.renderer.dispose();
        
        console.log('🧹 Cleanup complete');
    }
}

// Application entry point
let simulator = null;

/**
 * Initialize and start the application
 */
async function main() {
    // Create loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-family: Arial, sans-serif;
        font-size: 24px;
        color: white;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        z-index: 9999;
    `;
    loadingDiv.textContent = '🛫 Loading Avion Flight Simulator...';
    document.body.appendChild(loadingDiv);
    
    try {
        // Create and initialize simulator
        simulator = new FlightSimulator();
        await simulator.init();
        
        // Remove loading indicator
        loadingDiv.remove();
        
        // Start simulation
        simulator.start();
    } catch (error) {
        loadingDiv.textContent = '❌ Failed to load: ' + error.message;
        loadingDiv.style.color = '#ff6666';
        console.error('Failed to start simulator:', error);
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (simulator) {
        simulator.dispose();
    }
});

export { FlightSimulator };
