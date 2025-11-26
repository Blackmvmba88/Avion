/**
 * Network Configuration
 * Configuration for connectivity and multiplayer features
 */

export const NETWORK_CONFIG = {
    // Server settings
    server: {
        url: process.env.SERVER_URL || 'ws://localhost:8080',
        apiUrl: process.env.API_URL || 'http://localhost:8080/api',
        timeout: 10000,
        maxRetries: 3
    },
    
    // Connection settings
    connection: {
        autoReconnect: true,
        reconnectInterval: 3000,
        reconnectMaxAttempts: 5,
        reconnectBackoff: 1.5,
        heartbeatInterval: 30000,
        connectionTimeout: 15000
    },
    
    // Synchronization
    sync: {
        enabled: true,
        updateRate: 20,              // Updates per second
        interpolation: true,
        interpolationDelay: 100,     // ms
        extrapolation: false,
        snapshotBuffer: 5,
        compressionEnabled: true
    },
    
    // Multiplayer
    multiplayer: {
        maxPlayers: 16,
        playerUpdateRate: 10,        // Hz
        positionPrecision: 2,        // decimal places
        rotationPrecision: 3,
        velocityPrecision: 1,
        sendEmptyUpdates: false
    },
    
    // Protocols
    protocols: {
        websocket: {
            enabled: true,
            binary: true,
            compression: 'permessage-deflate'
        },
        webrtc: {
            enabled: false,          // For peer-to-peer
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        }
    },
    
    // Message types
    messageTypes: {
        CONNECT: 'connect',
        DISCONNECT: 'disconnect',
        JOIN: 'join',
        LEAVE: 'leave',
        UPDATE: 'update',
        STATE_SYNC: 'state_sync',
        PLAYER_UPDATE: 'player_update',
        CHAT: 'chat',
        PING: 'ping',
        PONG: 'pong'
    },
    
    // Security
    security: {
        requireAuth: false,
        tokenRefreshInterval: 300000, // 5 minutes
        encryptData: false
    },
    
    // Bandwidth optimization
    bandwidth: {
        limitEnabled: true,
        maxBytesPerSecond: 100000,   // 100 KB/s
        priorityQueue: true,
        throttleUpdates: true
    }
};

export default NETWORK_CONFIG;
