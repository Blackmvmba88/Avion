/**
 * WebSocket Relay Server for Avion-Godot Integration
 * 
 * This simple WebSocket server relays messages between:
 * - Avion flight simulator (running in browser)
 * - Godot Engine (running GDScript client)
 * 
 * Usage:
 *   npm install ws
 *   node ws-server.js [port]
 */

const WebSocket = require('ws');

// Configuration
const PORT = process.argv[2] || 9090;
const PING_INTERVAL = 30000; // 30 seconds

// Create WebSocket server
const wss = new WebSocket.Server({ 
    port: PORT,
    perMessageDeflate: false // Disable compression for lower latency
});

// Connected clients
const clients = new Set();

// Statistics
const stats = {
    totalConnections: 0,
    messagesRelayed: 0,
    startTime: Date.now()
};

console.log(`
╔══════════════════════════════════════════════════════════╗
║  Avion-Godot WebSocket Relay Server                     ║
║  Running on ws://localhost:${PORT}                       ║
╚══════════════════════════════════════════════════════════╝
`);

// Handle new connections
wss.on('connection', (ws, req) => {
    const clientId = `client-${stats.totalConnections++}`;
    const clientIP = req.socket.remoteAddress;
    
    console.log(`[${new Date().toISOString()}] ✓ ${clientId} connected from ${clientIP}`);
    console.log(`   Active connections: ${clients.size + 1}`);
    
    // Add to client set
    clients.add(ws);
    ws.clientId = clientId;
    ws.isAlive = true;
    
    // Handle ping/pong for connection health
    ws.on('pong', () => {
        ws.isAlive = true;
    });
    
    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            // Parse message to validate JSON
            const data = JSON.parse(message);
            
            // Log message type for debugging
            if (data.type && data.type !== 'ping' && data.type !== 'pong') {
                console.log(`[${clientId}] → ${data.type}`);
            }
            
            // Relay to all other clients
            let relayed = 0;
            clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    try {
                        client.send(message);
                        relayed++;
                    } catch (error) {
                        console.error(`[${clientId}] Error sending to client:`, error.message);
                    }
                }
            });
            
            if (relayed > 0) {
                stats.messagesRelayed++;
            }
            
        } catch (error) {
            console.error(`[${clientId}] Invalid message format:`, error.message);
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        clients.delete(ws);
        console.log(`[${new Date().toISOString()}] ✗ ${clientId} disconnected`);
        console.log(`   Active connections: ${clients.size}`);
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error(`[${clientId}] Error:`, error.message);
    });
});

// Periodic ping to detect dead connections
const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log(`[${ws.clientId}] Connection timeout - terminating`);
            return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
    });
}, PING_INTERVAL);

// Handle server errors
wss.on('error', (error) => {
    console.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down server...');
    
    // Close all client connections
    clients.forEach((ws) => {
        ws.close();
    });
    
    // Clear ping interval
    clearInterval(pingInterval);
    
    // Close server
    wss.close(() => {
        const uptime = (Date.now() - stats.startTime) / 1000;
        console.log('\nServer Statistics:');
        console.log(`  Total connections: ${stats.totalConnections}`);
        console.log(`  Messages relayed: ${stats.messagesRelayed}`);
        console.log(`  Uptime: ${uptime.toFixed(2)}s`);
        console.log('\n✓ Server shut down gracefully\n');
        process.exit(0);
    });
});

// Display statistics every 60 seconds
setInterval(() => {
    const uptime = (Date.now() - stats.startTime) / 1000;
    console.log(`\n--- Statistics ---`);
    console.log(`  Active connections: ${clients.size}`);
    console.log(`  Total connections: ${stats.totalConnections}`);
    console.log(`  Messages relayed: ${stats.messagesRelayed}`);
    console.log(`  Uptime: ${uptime.toFixed(2)}s`);
    console.log(`  Messages/sec: ${(stats.messagesRelayed / uptime).toFixed(2)}`);
    console.log('------------------\n');
}, 60000);
