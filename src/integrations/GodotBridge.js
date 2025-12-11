/**
 * Godot Bridge
 * Provides integration between Avion flight simulator and Godot Engine
 * 
 * This bridge allows Godot projects to:
 * - Receive real-time flight physics data
 * - Send control inputs to the flight simulator
 * - Synchronize aircraft state
 * - Access environment and weather data
 */

import { ConnectionManager } from '../utils/ConnectionManager.js';

/**
 * Message types for Godot communication
 */
export const GodotMessageType = {
    // From Avion to Godot
    STATE_UPDATE: 'state_update',
    PHYSICS_UPDATE: 'physics_update',
    AIRCRAFT_UPDATE: 'aircraft_update',
    ENVIRONMENT_UPDATE: 'environment_update',
    EVENT: 'event',
    
    // From Godot to Avion
    CONTROL_INPUT: 'control_input',
    COMMAND: 'command',
    CONFIG_UPDATE: 'config_update',
    
    // Bidirectional
    HANDSHAKE: 'handshake',
    PING: 'ping',
    PONG: 'pong'
};

/**
 * GodotBridge class
 * Manages communication between Avion and Godot Engine
 */
export class GodotBridge {
    constructor(config = {}) {
        this.config = {
            updateRate: 60, // Updates per second
            autoStart: true,
            includePhysics: true,
            includeEnvironment: true,
            ...config
        };
        
        this.connectionManager = null;
        this.updateInterval = null;
        this.isRunning = false;
        this.lastUpdateTime = 0;
        
        // Data sources - to be set by the application
        this.dataSources = {
            aircraft: null,
            physics: null,
            environment: null,
            controls: null
        };
        
        // Event handlers
        this.eventHandlers = new Map();
        this.controlInputCallback = null;
        this.commandCallback = null;
        
        // Statistics
        this.stats = {
            messagesSent: 0,
            messagesReceived: 0,
            lastUpdateTime: 0,
            updateRate: 0
        };
    }
    
    /**
     * Initialize the bridge with a WebSocket server
     * @param {string} serverUrl - WebSocket server URL (e.g., 'ws://localhost:9090')
     * @returns {Promise}
     */
    async initialize(serverUrl) {
        this.connectionManager = new ConnectionManager({
            autoReconnect: true,
            reconnectMaxAttempts: 10
        });
        
        // Set up message handlers
        this.setupMessageHandlers();
        
        // Connect to Godot
        try {
            await this.connectionManager.connect(serverUrl);
            console.log('[GodotBridge] Connected to Godot at', serverUrl);
            
            // Send handshake
            this.sendHandshake();
            
            if (this.config.autoStart) {
                this.start();
            }
            
            return true;
        } catch (error) {
            console.error('[GodotBridge] Failed to connect:', error);
            throw error;
        }
    }
    
    /**
     * Set up message handlers for incoming Godot messages
     */
    setupMessageHandlers() {
        // Handle control inputs from Godot
        this.connectionManager.on(GodotMessageType.CONTROL_INPUT, (data) => {
            this.handleControlInput(data);
        });
        
        // Handle commands from Godot
        this.connectionManager.on(GodotMessageType.COMMAND, (data) => {
            this.handleCommand(data);
        });
        
        // Handle config updates
        this.connectionManager.on(GodotMessageType.CONFIG_UPDATE, (data) => {
            this.handleConfigUpdate(data);
        });
        
        // Handle handshake
        this.connectionManager.on(GodotMessageType.HANDSHAKE, (data) => {
            console.log('[GodotBridge] Handshake received from Godot:', data);
        });
        
        // Handle pong (heartbeat)
        this.connectionManager.on(GodotMessageType.PONG, () => {
            // Connection is alive
        });
    }
    
    /**
     * Send handshake to Godot
     */
    sendHandshake() {
        const handshake = {
            type: 'avion',
            version: '1.0.0',
            capabilities: {
                physics: this.config.includePhysics,
                environment: this.config.includeEnvironment,
                updateRate: this.config.updateRate
            },
            timestamp: Date.now()
        };
        
        this.send(GodotMessageType.HANDSHAKE, handshake);
    }
    
    /**
     * Start sending updates to Godot
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        const interval = 1000 / this.config.updateRate;
        
        this.updateInterval = setInterval(() => {
            this.sendUpdate();
        }, interval);
        
        console.log(`[GodotBridge] Started at ${this.config.updateRate} Hz`);
    }
    
    /**
     * Stop sending updates
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        console.log('[GodotBridge] Stopped');
    }
    
    /**
     * Send update to Godot
     */
    sendUpdate() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;
        
        // Send aircraft state
        if (this.dataSources.aircraft) {
            this.sendAircraftUpdate(this.dataSources.aircraft);
        }
        
        // Send physics data
        if (this.config.includePhysics && this.dataSources.physics) {
            this.sendPhysicsUpdate(this.dataSources.physics);
        }
        
        // Send environment data (less frequently, every 10th update)
        if (this.config.includeEnvironment && 
            this.dataSources.environment && 
            this.stats.messagesSent % 10 === 0) {
            this.sendEnvironmentUpdate(this.dataSources.environment);
        }
        
        // Update statistics
        this.stats.updateRate = 1 / deltaTime;
        this.stats.lastUpdateTime = now;
    }
    
    /**
     * Send aircraft state update
     * @param {Object} aircraft - Aircraft object or state
     */
    sendAircraftUpdate(aircraft) {
        const state = this.serializeAircraftState(aircraft);
        this.send(GodotMessageType.AIRCRAFT_UPDATE, state);
    }
    
    /**
     * Send physics update
     * @param {Object} physics - Physics object or state
     */
    sendPhysicsUpdate(physics) {
        const state = this.serializePhysicsState(physics);
        this.send(GodotMessageType.PHYSICS_UPDATE, state);
    }
    
    /**
     * Send environment update
     * @param {Object} environment - Environment object
     */
    sendEnvironmentUpdate(environment) {
        const state = this.serializeEnvironmentState(environment);
        this.send(GodotMessageType.ENVIRONMENT_UPDATE, state);
    }
    
    /**
     * Send event to Godot
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     */
    sendEvent(eventType, data = {}) {
        this.send(GodotMessageType.EVENT, {
            eventType,
            data,
            timestamp: Date.now()
        });
    }
    
    /**
     * Helper method to extract vector data from object
     * @param {Object} obj - Object containing vector data
     * @param {string} propName - Property name
     * @param {string} methodName - Getter method name
     * @returns {Object} Vector3 object
     */
    extractVector(obj, propName, methodName) {
        const methodGetter = methodName ? obj[methodName]?.() : null;
        return obj[propName] || methodGetter || { x: 0, y: 0, z: 0 };
    }
    
    /**
     * Serialize aircraft state for transmission
     * @param {Object} aircraft - Aircraft object
     * @returns {Object} Serialized state
     */
    serializeAircraftState(aircraft) {
        // Handle different aircraft object structures
        const position = this.extractVector(aircraft, 'position', 'getPosition');
        const velocity = this.extractVector(aircraft, 'velocity', 'getVelocity');
        const rotation = this.extractVector(aircraft, 'rotation', 'getRotation');
        
        return {
            position: {
                x: position.x,
                y: position.y,
                z: position.z
            },
            velocity: {
                x: velocity.x,
                y: velocity.y,
                z: velocity.z
            },
            rotation: {
                pitch: rotation.x || rotation.pitch || 0,
                yaw: rotation.y || rotation.yaw || 0,
                roll: rotation.z || rotation.roll || 0
            },
            speed: aircraft.speed || aircraft.getSpeed?.() || 0,
            altitude: aircraft.altitude || position.y || 0,
            throttle: aircraft.throttle || aircraft.getThrottle?.() || 0,
            timestamp: Date.now()
        };
    }
    
    /**
     * Serialize physics state for transmission
     * @param {Object} physics - Physics object or state
     * @returns {Object} Serialized state
     */
    serializePhysicsState(physics) {
        const state = physics.getState?.() || physics;
        
        return {
            forces: {
                lift: state.lift || 0,
                drag: state.drag || 0,
                thrust: state.thrust || 0,
                weight: state.weight || 0
            },
            angles: {
                attackAngle: state.attackAngle || state.angleOfAttack || 0,
                slipAngle: state.slipAngle || state.sideSlipAngle || 0
            },
            airData: {
                airspeed: state.airspeed || state.speed || 0,
                groundSpeed: state.groundSpeed || 0,
                verticalSpeed: state.verticalSpeed || state.climbRate || 0,
                machNumber: state.machNumber || 0
            },
            status: {
                isStalled: state.isStalled || false,
                isOnGround: state.isOnGround || false,
                gForce: state.gForce || 1.0
            },
            timestamp: Date.now()
        };
    }
    
    /**
     * Serialize environment state for transmission
     * @param {Object} environment - Environment object
     * @returns {Object} Serialized state
     */
    serializeEnvironmentState(environment) {
        return {
            time: {
                timeOfDay: environment.timeOfDay || 12,
                timeSpeed: environment.timeSpeed || 1
            },
            weather: {
                windSpeed: environment.windSpeed || 0,
                windDirection: environment.windDirection || 0,
                cloudDensity: environment.cloudDensity || 0,
                rainIntensity: environment.rainIntensity || 0,
                visibility: environment.visibility || 10000
            },
            atmosphere: {
                temperature: environment.temperature || 15,
                pressure: environment.pressure || 101325,
                density: environment.airDensity || 1.225
            },
            timestamp: Date.now()
        };
    }
    
    /**
     * Handle control input from Godot
     * @param {Object} data - Control input data
     */
    handleControlInput(data) {
        this.stats.messagesReceived++;
        
        if (this.controlInputCallback) {
            this.controlInputCallback(data);
        }
    }
    
    /**
     * Handle command from Godot
     * @param {Object} data - Command data
     */
    handleCommand(data) {
        this.stats.messagesReceived++;
        
        if (this.commandCallback) {
            this.commandCallback(data);
        }
        
        // Handle built-in commands
        switch (data.command) {
            case 'start':
                this.start();
                break;
            case 'stop':
                this.stop();
                break;
            case 'reset':
                this.sendEvent('reset_requested');
                break;
            case 'pause':
                this.sendEvent('pause_requested');
                break;
            case 'resume':
                this.sendEvent('resume_requested');
                break;
        }
    }
    
    /**
     * Handle config update from Godot
     * @param {Object} data - Config data
     */
    handleConfigUpdate(data) {
        if (data.updateRate) {
            this.config.updateRate = data.updateRate;
            if (this.isRunning) {
                this.stop();
                this.start();
            }
        }
        
        if (data.includePhysics !== undefined) {
            this.config.includePhysics = data.includePhysics;
        }
        
        if (data.includeEnvironment !== undefined) {
            this.config.includeEnvironment = data.includeEnvironment;
        }
    }
    
    /**
     * Set data sources for updates
     * @param {Object} sources - Data source objects
     */
    setDataSources(sources) {
        this.dataSources = { ...this.dataSources, ...sources };
    }
    
    /**
     * Set control input callback
     * @param {Function} callback - Callback function for control inputs
     */
    onControlInput(callback) {
        this.controlInputCallback = callback;
    }
    
    /**
     * Set command callback
     * @param {Function} callback - Callback function for commands
     */
    onCommand(callback) {
        this.commandCallback = callback;
    }
    
    /**
     * Send a message to Godot
     * @param {string} type - Message type
     * @param {Object} data - Message data
     */
    send(type, data) {
        if (this.connectionManager && this.connectionManager.send(type, data)) {
            this.stats.messagesSent++;
            return true;
        }
        return false;
    }
    
    /**
     * Disconnect from Godot
     */
    disconnect() {
        this.stop();
        if (this.connectionManager) {
            this.connectionManager.disconnect();
        }
    }
    
    /**
     * Get connection status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            connected: this.connectionManager?.getStatus().connected || false,
            running: this.isRunning,
            stats: { ...this.stats }
        };
    }
}

export default GodotBridge;
