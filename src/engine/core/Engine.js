/**
 * Engine Core
 * Main engine orchestrator that manages all subsystems
 */

import { ENGINE_CONFIG } from '../../config/engine.config.js';

export class Engine {
    constructor(config = {}) {
        this.config = { ...ENGINE_CONFIG, ...config };
        this.running = false;
        this.paused = false;
        
        // Initialize subsystems (to be implemented)
        this.renderer = null;
        this.physics = null;
        this.controls = null;
        this.environment = null;
        
        this.eventListeners = new Map();
    }
    
    /**
     * Initialize all engine subsystems
     */
    async initialize() {
        // TODO: Initialize renderer, physics, controls, etc.
        console.log('Engine initializing...');
    }
    
    /**
     * Start the engine main loop
     */
    start() {
        if (this.running) return;
        this.running = true;
        this.emit('start');
    }
    
    /**
     * Stop the engine
     */
    stop() {
        this.running = false;
        this.emit('stop');
    }
    
    /**
     * Pause the simulation
     */
    pause() {
        this.paused = true;
        this.emit('pause');
    }
    
    /**
     * Resume the simulation
     */
    resume() {
        this.paused = false;
        this.emit('resume');
    }
    
    /**
     * Update engine subsystems
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.running || this.paused) return;
        
        // TODO: Update physics, rendering, etc.
        this.emit('update', deltaTime);
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

export default Engine;
