/**
 * Connection Manager
 * Manages network connections with automatic reconnection
 */

import NETWORK_CONFIG from '../config/network.config.js';

export class ConnectionManager {
    constructor(config = {}) {
        this.config = { ...NETWORK_CONFIG.connection, ...config };
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        this.listeners = new Map();
        this.connectionListeners = [];
    }
    
    /**
     * Connect to server
     * @param {string} url - WebSocket URL
     * @returns {Promise}
     */
    connect(url) {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(url);
                
                this.socket.onopen = () => {
                    this.connected = true;
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    this.notifyConnectionChange('connected');
                    resolve();
                };
                
                this.socket.onclose = () => {
                    this.handleDisconnect();
                };
                
                this.socket.onerror = (error) => {
                    this.notifyConnectionChange('error', error);
                    reject(error);
                };
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            this.stopHeartbeat();
            this.socket.close();
            this.socket = null;
            this.connected = false;
            this.notifyConnectionChange('disconnected');
        }
    }
    
    /**
     * Handle disconnection
     */
    handleDisconnect() {
        this.connected = false;
        this.stopHeartbeat();
        this.notifyConnectionChange('disconnected');
        
        if (this.config.autoReconnect && 
            this.reconnectAttempts < this.config.reconnectMaxAttempts) {
            this.attemptReconnect();
        }
    }
    
    /**
     * Attempt to reconnect
     */
    attemptReconnect() {
        this.reconnectAttempts++;
        const delay = this.config.reconnectInterval * 
                     Math.pow(this.config.reconnectBackoff, this.reconnectAttempts - 1);
        
        this.notifyConnectionChange('reconnecting', { attempt: this.reconnectAttempts });
        
        this.reconnectTimer = setTimeout(() => {
            this.connect(this.socket.url).catch(() => {
                // Will retry if attempts remain
            });
        }, delay);
    }
    
    /**
     * Send message
     * @param {string} type - Message type
     * @param {Object} data - Message data
     */
    send(type, data = {}) {
        if (!this.connected || !this.socket) {
            console.warn('Cannot send message: not connected');
            return false;
        }
        
        const message = {
            type,
            data,
            timestamp: Date.now()
        };
        
        try {
            this.socket.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }
    
    /**
     * Handle incoming message
     * @param {string} rawData - Raw message data
     */
    handleMessage(rawData) {
        try {
            const message = JSON.parse(rawData);
            
            if (message.type === 'pong') {
                // Heartbeat response
                return;
            }
            
            // Notify listeners for this message type
            const listeners = this.listeners.get(message.type) || [];
            listeners.forEach(callback => callback(message.data));
            
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }
    
    /**
     * Add message listener
     * @param {string} type - Message type
     * @param {Function} callback - Callback function
     */
    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
    }
    
    /**
     * Remove message listener
     * @param {string} type - Message type
     * @param {Function} callback - Callback function
     */
    off(type, callback) {
        const listeners = this.listeners.get(type);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Add connection status listener
     * @param {Function} callback
     */
    onConnectionChange(callback) {
        this.connectionListeners.push(callback);
    }
    
    /**
     * Notify connection status change
     * @param {string} status
     * @param {Object} data
     */
    notifyConnectionChange(status, data = {}) {
        this.connectionListeners.forEach(callback => {
            callback(status, data);
        });
    }
    
    /**
     * Start heartbeat
     */
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.connected) {
                this.send('ping');
            }
        }, this.config.heartbeatInterval);
    }
    
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    
    /**
     * Get connection status
     * @returns {Object}
     */
    getStatus() {
        return {
            connected: this.connected,
            reconnectAttempts: this.reconnectAttempts,
            socketReady: this.socket?.readyState === WebSocket.OPEN
        };
    }
}

export default ConnectionManager;
