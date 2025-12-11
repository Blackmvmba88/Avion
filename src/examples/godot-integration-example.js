/**
 * Godot Integration Example
 * 
 * This example demonstrates how to integrate Avion flight simulator with Godot Engine
 * using the GodotBridge class.
 */

import { GodotBridge } from '../integrations/GodotBridge.js';
import { FlightDynamics } from '../physics/index.js';
import { BasicPlane } from '../aircraft/index.js';

/**
 * Example: Basic Godot Integration
 */
export async function basicGodotIntegration() {
    // Create the Godot bridge
    const godotBridge = new GodotBridge({
        updateRate: 60,           // Send updates at 60 Hz
        includePhysics: true,     // Include physics data
        includeEnvironment: true, // Include environment data
        autoStart: true           // Start automatically after connection
    });
    
    // Initialize connection to WebSocket server
    try {
        await godotBridge.initialize('ws://localhost:9090');
        console.log('✓ Connected to Godot via WebSocket');
    } catch (error) {
        console.error('✗ Failed to connect to Godot:', error);
        return;
    }
    
    // Create aircraft and physics objects
    const aircraft = new BasicPlane();
    const physics = new FlightDynamics();
    
    // Set data sources for the bridge
    godotBridge.setDataSources({
        aircraft: aircraft,
        physics: physics,
        environment: {
            timeOfDay: 12,
            windSpeed: 5,
            windDirection: 270,
            temperature: 15,
            pressure: 101325,
            airDensity: 1.225
        }
    });
    
    // Handle control inputs from Godot
    godotBridge.onControlInput((data) => {
        console.log('Received control input from Godot:', data);
        
        // Apply controls to aircraft
        // These values should be in range [-1, 1] for pitch/roll/yaw
        // and [0, 1] for throttle
        if (data.pitch !== undefined) {
            // Apply pitch control
        }
        if (data.roll !== undefined) {
            // Apply roll control
        }
        if (data.yaw !== undefined) {
            // Apply yaw control
        }
        if (data.throttle !== undefined) {
            // Apply throttle control
        }
    });
    
    // Handle commands from Godot
    godotBridge.onCommand((data) => {
        console.log('Received command from Godot:', data.command);
        
        switch (data.command) {
            case 'reset':
                physics.reset();
                break;
            case 'pause':
                // Pause simulation
                break;
            case 'resume':
                // Resume simulation
                break;
        }
    });
    
    // Send custom events to Godot
    godotBridge.sendEvent('simulation_started', {
        timestamp: Date.now()
    });
    
    return godotBridge;
}

/**
 * Example: Advanced Godot Integration with Custom Data
 */
export async function advancedGodotIntegration(aircraftInstance, physicsInstance, environmentInstance) {
    const godotBridge = new GodotBridge({
        updateRate: 30, // Lower update rate for better performance
        includePhysics: true,
        includeEnvironment: false, // Environment updates handled manually
        autoStart: false // Manual control of updates
    });
    
    await godotBridge.initialize('ws://localhost:9090');
    
    // Set data sources
    godotBridge.setDataSources({
        aircraft: aircraftInstance,
        physics: physicsInstance,
        environment: environmentInstance
    });
    
    // Custom aircraft state serialization
    const originalSerialize = godotBridge.serializeAircraftState.bind(godotBridge);
    godotBridge.serializeAircraftState = function(aircraft) {
        const baseState = originalSerialize(aircraft);
        
        // Add custom data
        return {
            ...baseState,
            fuel: aircraft.fuel?.getCurrentLevel() || 100,
            damage: aircraft.damage?.getTotalDamage() || 0,
            landingGear: aircraft.gear?.isDeployed() || false,
            flaps: aircraft.flaps?.getPosition() || 0,
            custom: {
                myCustomData: 'example'
            }
        };
    };
    
    // Manual update control
    let updateCounter = 0;
    setInterval(() => {
        // Send aircraft update
        godotBridge.sendAircraftUpdate(aircraftInstance);
        
        // Send physics update
        godotBridge.sendPhysicsUpdate(physicsInstance);
        
        // Send environment update every 10th frame
        if (updateCounter % 10 === 0) {
            godotBridge.sendEnvironmentUpdate(environmentInstance);
        }
        
        updateCounter++;
    }, 1000 / 30); // 30 Hz
    
    // Listen for specific events
    godotBridge.onControlInput((data) => {
        // Handle controls with smoothing
        const smoothFactor = 0.1;
        
        if (data.pitch !== undefined) {
            aircraftInstance.targetPitch = data.pitch;
            aircraftInstance.currentPitch += (data.pitch - aircraftInstance.currentPitch) * smoothFactor;
        }
    });
    
    // Send game events to Godot
    const sendGameEvent = (eventType, data) => {
        godotBridge.sendEvent(eventType, data);
    };
    
    // Example: Send landing event
    if (aircraftInstance.isOnGround()) {
        sendGameEvent('touchdown', {
            speed: aircraftInstance.speed,
            verticalSpeed: physicsInstance.verticalSpeed,
            quality: calculateLandingQuality(physicsInstance),
            timestamp: Date.now()
        });
    }
    
    // Example: Send stall warning
    if (physicsInstance.isStalled()) {
        sendGameEvent('stall_warning', {
            altitude: aircraftInstance.altitude,
            airspeed: physicsInstance.airspeed,
            timestamp: Date.now()
        });
    }
    
    return godotBridge;
}

/**
 * Helper function to calculate landing quality
 */
function calculateLandingQuality(physics) {
    const verticalSpeed = Math.abs(physics.verticalSpeed || 0);
    
    if (verticalSpeed < 1.0) return 'excellent';
    if (verticalSpeed < 2.0) return 'good';
    if (verticalSpeed < 3.0) return 'fair';
    return 'poor';
}

/**
 * Example: Monitoring Godot Bridge Status
 */
export function monitorGodotBridge(godotBridge) {
    setInterval(() => {
        const status = godotBridge.getStatus();
        
        console.log('Godot Bridge Status:', {
            connected: status.connected,
            running: status.running,
            messagesSent: status.stats.messagesSent,
            messagesReceived: status.stats.messagesReceived,
            updateRate: status.stats.updateRate.toFixed(2) + ' Hz'
        });
        
        if (!status.connected) {
            console.warn('⚠ Not connected to Godot');
        }
    }, 5000); // Check every 5 seconds
}

/**
 * Example: Cleanup on page unload
 */
export function setupGodotBridgeCleanup(godotBridge) {
    window.addEventListener('beforeunload', () => {
        console.log('Disconnecting from Godot...');
        godotBridge.disconnect();
    });
}

// Export all examples
export default {
    basicGodotIntegration,
    advancedGodotIntegration,
    monitorGodotBridge,
    setupGodotBridgeCleanup
};
