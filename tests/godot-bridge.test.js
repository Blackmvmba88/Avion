/**
 * GodotBridge Integration Tests
 * Basic tests to verify the GodotBridge functionality
 */

import { GodotBridge, GodotMessageType } from '../src/integrations/GodotBridge.js';

/**
 * Test: GodotBridge instantiation
 */
function testGodotBridgeCreation() {
    console.log('Test: GodotBridge creation...');
    
    const bridge = new GodotBridge({
        updateRate: 30,
        autoStart: false,
        includePhysics: true,
        includeEnvironment: false
    });
    
    if (!bridge) {
        throw new Error('Failed to create GodotBridge');
    }
    
    if (bridge.config.updateRate !== 30) {
        throw new Error('Config not properly set');
    }
    
    console.log('✓ GodotBridge created successfully');
}

/**
 * Test: Aircraft state serialization
 */
function testAircraftStateSerialization() {
    console.log('Test: Aircraft state serialization...');
    
    const bridge = new GodotBridge();
    
    // Mock aircraft object
    const mockAircraft = {
        position: { x: 100, y: 200, z: 300 },
        velocity: { x: 50, y: 10, z: 5 },
        rotation: { x: 5, y: 90, z: 10 },
        speed: 55,
        altitude: 200,
        throttle: 0.75
    };
    
    const serialized = bridge.serializeAircraftState(mockAircraft);
    
    if (!serialized.position || !serialized.velocity || !serialized.rotation) {
        throw new Error('Serialization failed - missing data');
    }
    
    if (serialized.position.x !== 100 || serialized.position.y !== 200) {
        throw new Error('Position not correctly serialized');
    }
    
    if (serialized.speed !== 55) {
        throw new Error('Speed not correctly serialized');
    }
    
    console.log('✓ Aircraft state serialization works correctly');
}

/**
 * Test: Physics state serialization
 */
function testPhysicsStateSerialization() {
    console.log('Test: Physics state serialization...');
    
    const bridge = new GodotBridge();
    
    // Mock physics object with getState method
    const mockPhysics = {
        getState: () => ({
            lift: 12000,
            drag: 800,
            thrust: 5000,
            weight: 10000,
            airspeed: 55,
            isStalled: false,
            isOnGround: false,
            gForce: 1.2
        })
    };
    
    const serialized = bridge.serializePhysicsState(mockPhysics);
    
    if (!serialized.forces || !serialized.airData || !serialized.status) {
        throw new Error('Physics serialization failed - missing sections');
    }
    
    if (serialized.forces.lift !== 12000) {
        throw new Error('Lift force not correctly serialized');
    }
    
    if (serialized.status.isStalled !== false) {
        throw new Error('Stall status not correctly serialized');
    }
    
    console.log('✓ Physics state serialization works correctly');
}

/**
 * Test: Environment state serialization
 */
function testEnvironmentStateSerialization() {
    console.log('Test: Environment state serialization...');
    
    const bridge = new GodotBridge();
    
    // Mock environment object
    const mockEnvironment = {
        timeOfDay: 14.5,
        windSpeed: 10,
        windDirection: 270,
        temperature: 20,
        pressure: 101325,
        airDensity: 1.225
    };
    
    const serialized = bridge.serializeEnvironmentState(mockEnvironment);
    
    if (!serialized.time || !serialized.weather || !serialized.atmosphere) {
        throw new Error('Environment serialization failed - missing sections');
    }
    
    if (serialized.time.timeOfDay !== 14.5) {
        throw new Error('Time of day not correctly serialized');
    }
    
    if (serialized.weather.windSpeed !== 10) {
        throw new Error('Wind speed not correctly serialized');
    }
    
    console.log('✓ Environment state serialization works correctly');
}

/**
 * Test: Data sources
 */
function testDataSources() {
    console.log('Test: Setting data sources...');
    
    const bridge = new GodotBridge();
    
    const mockAircraft = { name: 'TestAircraft' };
    const mockPhysics = { name: 'TestPhysics' };
    
    bridge.setDataSources({
        aircraft: mockAircraft,
        physics: mockPhysics
    });
    
    if (bridge.dataSources.aircraft !== mockAircraft) {
        throw new Error('Aircraft data source not set correctly');
    }
    
    if (bridge.dataSources.physics !== mockPhysics) {
        throw new Error('Physics data source not set correctly');
    }
    
    console.log('✓ Data sources set correctly');
}

/**
 * Test: Callbacks
 */
function testCallbacks() {
    console.log('Test: Callback registration...');
    
    const bridge = new GodotBridge();
    
    let controlInputReceived = false;
    let commandReceived = false;
    
    bridge.onControlInput((data) => {
        controlInputReceived = true;
    });
    
    bridge.onCommand((data) => {
        commandReceived = true;
    });
    
    // Simulate receiving control input
    bridge.handleControlInput({ pitch: 0.5 });
    
    if (!controlInputReceived) {
        throw new Error('Control input callback not triggered');
    }
    
    // Simulate receiving command
    bridge.handleCommand({ command: 'test' });
    
    if (!commandReceived) {
        throw new Error('Command callback not triggered');
    }
    
    console.log('✓ Callbacks work correctly');
}

/**
 * Test: Message types
 */
function testMessageTypes() {
    console.log('Test: Message types defined...');
    
    if (!GodotMessageType.AIRCRAFT_UPDATE) {
        throw new Error('AIRCRAFT_UPDATE message type not defined');
    }
    
    if (!GodotMessageType.CONTROL_INPUT) {
        throw new Error('CONTROL_INPUT message type not defined');
    }
    
    if (!GodotMessageType.HANDSHAKE) {
        throw new Error('HANDSHAKE message type not defined');
    }
    
    console.log('✓ All message types are defined');
}

/**
 * Test: Status reporting
 */
function testStatusReporting() {
    console.log('Test: Status reporting...');
    
    const bridge = new GodotBridge();
    const status = bridge.getStatus();
    
    if (typeof status.connected !== 'boolean') {
        throw new Error('Status should include connected boolean');
    }
    
    if (typeof status.running !== 'boolean') {
        throw new Error('Status should include running boolean');
    }
    
    if (!status.stats) {
        throw new Error('Status should include stats object');
    }
    
    console.log('✓ Status reporting works correctly');
}

/**
 * Run all tests
 */
function runTests() {
    console.log('\n=== Running GodotBridge Tests ===\n');
    
    const tests = [
        testGodotBridgeCreation,
        testAircraftStateSerialization,
        testPhysicsStateSerialization,
        testEnvironmentStateSerialization,
        testDataSources,
        testCallbacks,
        testMessageTypes,
        testStatusReporting
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            test();
            passed++;
        } catch (error) {
            console.error(`✗ Test failed: ${error.message}`);
            failed++;
        }
    }
    
    console.log(`\n=== Test Results ===`);
    console.log(`Passed: ${passed}/${tests.length}`);
    console.log(`Failed: ${failed}/${tests.length}`);
    
    if (failed > 0) {
        process.exit(1);
    }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}

export { runTests };
