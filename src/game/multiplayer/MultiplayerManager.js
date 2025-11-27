/**
 * MultiplayerManager.js
 * Manages multiplayer game sessions and player synchronization.
 * Built on top of the existing ConnectionManager.
 */

import { ConnectionManager } from '../../utils/ConnectionManager.js';

/**
 * Player state for multiplayer
 */
export class PlayerState {
    /**
     * Create a new PlayerState
     * @param {Object} config - Player configuration
     */
    constructor(config = {}) {
        this.id = config.id || `player_${Date.now()}`;
        this.name = config.name || 'Unknown Pilot';
        this.isLocal = config.isLocal || false;
        this.isHost = config.isHost || false;
        
        // Aircraft state
        this.position = config.position || { x: 0, y: 100, z: 0 };
        this.rotation = config.rotation || { pitch: 0, roll: 0, yaw: 0 };
        this.velocity = config.velocity || { x: 0, y: 0, z: 0 };
        this.speed = config.speed || 0;
        this.throttle = config.throttle || 0;
        
        // Aircraft info
        this.aircraftType = config.aircraftType || 'basicJet';
        this.color = config.color || 0x00ff00;
        
        // Status
        this.connected = true;
        this.lastUpdate = Date.now();
        
        // Interpolation data
        this.targetPosition = { ...this.position };
        this.targetRotation = { ...this.rotation };
        this.interpolationFactor = 0;
    }

    /**
     * Update state from network data
     * @param {Object} data - State data from network
     */
    updateFromNetwork(data) {
        // Store current as starting point for interpolation
        this.position = { ...this.targetPosition };
        this.rotation = { ...this.targetRotation };
        
        // Set new targets
        if (data.position) this.targetPosition = { ...data.position };
        if (data.rotation) this.targetRotation = { ...data.rotation };
        if (data.velocity) this.velocity = { ...data.velocity };
        if (data.speed !== undefined) this.speed = data.speed;
        if (data.throttle !== undefined) this.throttle = data.throttle;
        
        this.lastUpdate = Date.now();
        this.interpolationFactor = 0;
    }

    /**
     * Interpolate state for smooth rendering
     * @param {number} deltaTime - Time delta in seconds
     * @param {number} interpolationSpeed - Speed of interpolation
     */
    interpolate(deltaTime, interpolationSpeed = 10) {
        this.interpolationFactor = Math.min(1, this.interpolationFactor + deltaTime * interpolationSpeed);
        
        const t = this.interpolationFactor;
        
        // Lerp position
        this.position.x = this.position.x + (this.targetPosition.x - this.position.x) * t;
        this.position.y = this.position.y + (this.targetPosition.y - this.position.y) * t;
        this.position.z = this.position.z + (this.targetPosition.z - this.position.z) * t;
        
        // Lerp rotation (simple lerp, could use slerp for quaternions)
        this.rotation.pitch = this.rotation.pitch + (this.targetRotation.pitch - this.rotation.pitch) * t;
        this.rotation.roll = this.rotation.roll + (this.targetRotation.roll - this.rotation.roll) * t;
        this.rotation.yaw = this.rotation.yaw + (this.targetRotation.yaw - this.rotation.yaw) * t;
    }

    /**
     * Check if player is stale (hasn't sent updates)
     * @param {number} timeout - Timeout in milliseconds
     * @returns {boolean}
     */
    isStale(timeout = 5000) {
        return Date.now() - this.lastUpdate > timeout;
    }

    /**
     * Get serializable state for network transmission
     * @returns {Object}
     */
    toNetworkState() {
        return {
            id: this.id,
            name: this.name,
            position: this.position,
            rotation: this.rotation,
            velocity: this.velocity,
            speed: this.speed,
            throttle: this.throttle,
            aircraftType: this.aircraftType,
            color: this.color
        };
    }
}

/**
 * Room/session state
 */
export const RoomState = {
    LOBBY: 'lobby',
    PLAYING: 'playing',
    PAUSED: 'paused',
    ENDED: 'ended'
};

/**
 * Message types for multiplayer
 */
export const MultiplayerMessageType = {
    JOIN: 'mp_join',
    LEAVE: 'mp_leave',
    PLAYER_UPDATE: 'mp_player_update',
    PLAYER_LIST: 'mp_player_list',
    CHAT: 'mp_chat',
    ROOM_STATE: 'mp_room_state',
    START_GAME: 'mp_start_game',
    END_GAME: 'mp_end_game',
    SYNC_REQUEST: 'mp_sync_request',
    SYNC_RESPONSE: 'mp_sync_response',
    KICK: 'mp_kick',
    HOST_TRANSFER: 'mp_host_transfer'
};

/**
 * MultiplayerManager class
 * Manages multiplayer game sessions
 */
export class MultiplayerManager {
    /**
     * Create a new MultiplayerManager
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.connection = new ConnectionManager(config.connection || {});
        
        // Local player
        this.localPlayer = null;
        
        // Remote players
        this.players = new Map();
        
        // Room state
        this.roomId = null;
        this.roomState = RoomState.LOBBY;
        this.isHost = false;
        this.maxPlayers = config.maxPlayers || 16;
        
        // Update settings
        this.updateRate = config.updateRate || 20; // Updates per second
        this.updateInterval = 1000 / this.updateRate;
        this.lastUpdateTime = 0;
        
        // Event listeners
        this.listeners = new Map();
        
        // Setup connection handlers
        this.setupConnectionHandlers();
    }

    /**
     * Setup connection message handlers
     */
    setupConnectionHandlers() {
        this.connection.on(MultiplayerMessageType.PLAYER_UPDATE, (data) => {
            this.handlePlayerUpdate(data);
        });
        
        this.connection.on(MultiplayerMessageType.PLAYER_LIST, (data) => {
            this.handlePlayerList(data);
        });
        
        this.connection.on(MultiplayerMessageType.JOIN, (data) => {
            this.handlePlayerJoin(data);
        });
        
        this.connection.on(MultiplayerMessageType.LEAVE, (data) => {
            this.handlePlayerLeave(data);
        });
        
        this.connection.on(MultiplayerMessageType.CHAT, (data) => {
            this.emit('chat', data);
        });
        
        this.connection.on(MultiplayerMessageType.ROOM_STATE, (data) => {
            this.handleRoomStateChange(data);
        });
        
        this.connection.on(MultiplayerMessageType.KICK, (data) => {
            this.handleKick(data);
        });
        
        this.connection.on(MultiplayerMessageType.HOST_TRANSFER, (data) => {
            this.handleHostTransfer(data);
        });
        
        // Connection status
        this.connection.onConnectionChange((status, data) => {
            this.emit('connectionChange', { status, ...data });
            
            if (status === 'disconnected') {
                this.handleDisconnect();
            }
        });
    }

    /**
     * Connect to multiplayer server
     * @param {string} serverUrl - Server WebSocket URL
     * @param {Object} playerInfo - Local player information
     * @returns {Promise}
     */
    async connect(serverUrl, playerInfo = {}) {
        // Create local player
        this.localPlayer = new PlayerState({
            ...playerInfo,
            isLocal: true
        });
        
        // Connect to server
        await this.connection.connect(serverUrl);
        
        this.emit('connected', { player: this.localPlayer });
        return this.localPlayer;
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.roomId) {
            this.leaveRoom();
        }
        this.connection.disconnect();
        this.players.clear();
        this.localPlayer = null;
        this.emit('disconnected', {});
    }

    /**
     * Join a room
     * @param {string} roomId - Room ID to join
     * @returns {boolean}
     */
    joinRoom(roomId) {
        if (!this.localPlayer) {
            console.error('Not connected to server');
            return false;
        }
        
        this.roomId = roomId;
        
        this.connection.send(MultiplayerMessageType.JOIN, {
            roomId,
            player: this.localPlayer.toNetworkState()
        });
        
        return true;
    }

    /**
     * Leave current room
     */
    leaveRoom() {
        if (!this.roomId) return;
        
        this.connection.send(MultiplayerMessageType.LEAVE, {
            roomId: this.roomId,
            playerId: this.localPlayer?.id
        });
        
        this.roomId = null;
        this.players.clear();
        this.roomState = RoomState.LOBBY;
        this.emit('leftRoom', {});
    }

    /**
     * Create a new room (become host)
     * @param {string} roomId - Room ID to create
     * @param {Object} roomConfig - Room configuration
     * @returns {boolean}
     */
    createRoom(roomId, roomConfig = {}) {
        if (!this.localPlayer) {
            console.error('Not connected to server');
            return false;
        }
        
        this.roomId = roomId;
        this.isHost = true;
        this.localPlayer.isHost = true;
        
        this.connection.send(MultiplayerMessageType.JOIN, {
            roomId,
            player: this.localPlayer.toNetworkState(),
            createRoom: true,
            roomConfig
        });
        
        return true;
    }

    /**
     * Update local player state and broadcast
     * @param {Object} state - Local player state
     * @param {number} currentTime - Current timestamp
     */
    updateLocalPlayer(state, currentTime = Date.now()) {
        if (!this.localPlayer || !this.roomId) return;
        
        // Update local state
        if (state.position) this.localPlayer.position = { ...state.position };
        if (state.rotation) this.localPlayer.rotation = { ...state.rotation };
        if (state.velocity) this.localPlayer.velocity = { ...state.velocity };
        if (state.speed !== undefined) this.localPlayer.speed = state.speed;
        if (state.throttle !== undefined) this.localPlayer.throttle = state.throttle;
        
        // Rate limit updates
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        this.lastUpdateTime = currentTime;
        
        // Send to server
        this.connection.send(MultiplayerMessageType.PLAYER_UPDATE, {
            roomId: this.roomId,
            ...this.localPlayer.toNetworkState()
        });
    }

    /**
     * Update all remote players (interpolation)
     * @param {number} deltaTime - Time delta in seconds
     */
    updateRemotePlayers(deltaTime) {
        const staleTimeout = 5000;
        const stalePlayers = [];
        
        this.players.forEach((player, id) => {
            if (player.isStale(staleTimeout)) {
                stalePlayers.push(id);
            } else {
                player.interpolate(deltaTime);
            }
        });
        
        // Remove stale players
        stalePlayers.forEach(id => {
            this.players.delete(id);
            this.emit('playerTimeout', { playerId: id });
        });
    }

    /**
     * Handle incoming player update
     * @param {Object} data - Player update data
     */
    handlePlayerUpdate(data) {
        if (data.id === this.localPlayer?.id) return;
        
        let player = this.players.get(data.id);
        
        if (!player) {
            // New player
            player = new PlayerState({
                ...data,
                isLocal: false
            });
            this.players.set(data.id, player);
            this.emit('playerJoined', { player });
        } else {
            player.updateFromNetwork(data);
        }
    }

    /**
     * Handle player list sync
     * @param {Object} data - Player list data
     */
    handlePlayerList(data) {
        if (!data.players) return;
        
        data.players.forEach(playerData => {
            if (playerData.id === this.localPlayer?.id) return;
            
            if (!this.players.has(playerData.id)) {
                const player = new PlayerState({
                    ...playerData,
                    isLocal: false
                });
                this.players.set(playerData.id, player);
            }
        });
        
        this.emit('playerListUpdated', { players: Array.from(this.players.values()) });
    }

    /**
     * Handle player join
     * @param {Object} data - Join data
     */
    handlePlayerJoin(data) {
        if (data.player && data.player.id !== this.localPlayer?.id) {
            const player = new PlayerState({
                ...data.player,
                isLocal: false
            });
            this.players.set(player.id, player);
            this.emit('playerJoined', { player });
        }
        
        // If we joined successfully
        if (data.success && data.roomId === this.roomId) {
            this.emit('joinedRoom', { roomId: this.roomId });
        }
    }

    /**
     * Handle player leave
     * @param {Object} data - Leave data
     */
    handlePlayerLeave(data) {
        if (this.players.has(data.playerId)) {
            const player = this.players.get(data.playerId);
            this.players.delete(data.playerId);
            this.emit('playerLeft', { player, playerId: data.playerId });
        }
    }

    /**
     * Handle room state change
     * @param {Object} data - Room state data
     */
    handleRoomStateChange(data) {
        this.roomState = data.state;
        this.emit('roomStateChanged', { state: this.roomState });
    }

    /**
     * Handle being kicked from room
     * @param {Object} data - Kick data
     */
    handleKick(data) {
        if (data.playerId === this.localPlayer?.id) {
            this.roomId = null;
            this.players.clear();
            this.emit('kicked', { reason: data.reason });
        }
    }

    /**
     * Handle host transfer
     * @param {Object} data - Host transfer data
     */
    handleHostTransfer(data) {
        if (data.newHostId === this.localPlayer?.id) {
            this.isHost = true;
            this.localPlayer.isHost = true;
            this.emit('becameHost', {});
        } else {
            this.isHost = false;
            if (this.localPlayer) this.localPlayer.isHost = false;
        }
    }

    /**
     * Handle disconnect
     */
    handleDisconnect() {
        this.roomId = null;
        this.players.clear();
        this.roomState = RoomState.LOBBY;
        this.isHost = false;
    }

    /**
     * Send chat message
     * @param {string} message - Chat message
     */
    sendChat(message) {
        if (!this.roomId || !this.localPlayer) return;
        
        this.connection.send(MultiplayerMessageType.CHAT, {
            roomId: this.roomId,
            playerId: this.localPlayer.id,
            playerName: this.localPlayer.name,
            message,
            timestamp: Date.now()
        });
    }

    /**
     * Start the game (host only)
     */
    startGame() {
        if (!this.isHost || !this.roomId) return;
        
        this.connection.send(MultiplayerMessageType.START_GAME, {
            roomId: this.roomId
        });
    }

    /**
     * End the game (host only)
     */
    endGame() {
        if (!this.isHost || !this.roomId) return;
        
        this.connection.send(MultiplayerMessageType.END_GAME, {
            roomId: this.roomId
        });
    }

    /**
     * Kick a player (host only)
     * @param {string} playerId - Player to kick
     * @param {string} reason - Kick reason
     */
    kickPlayer(playerId, reason = '') {
        if (!this.isHost || !this.roomId) return;
        
        this.connection.send(MultiplayerMessageType.KICK, {
            roomId: this.roomId,
            playerId,
            reason
        });
    }

    /**
     * Get all players including local
     * @returns {PlayerState[]}
     */
    getAllPlayers() {
        const all = Array.from(this.players.values());
        if (this.localPlayer) {
            all.unshift(this.localPlayer);
        }
        return all;
    }

    /**
     * Get remote players only
     * @returns {PlayerState[]}
     */
    getRemotePlayers() {
        return Array.from(this.players.values());
    }

    /**
     * Get player by ID
     * @param {string} playerId - Player ID
     * @returns {PlayerState|null}
     */
    getPlayer(playerId) {
        if (playerId === this.localPlayer?.id) {
            return this.localPlayer;
        }
        return this.players.get(playerId) || null;
    }

    /**
     * Get connection status
     * @returns {Object}
     */
    getStatus() {
        return {
            connected: this.connection.getStatus().connected,
            roomId: this.roomId,
            roomState: this.roomState,
            isHost: this.isHost,
            playerCount: this.players.size + (this.localPlayer ? 1 : 0),
            localPlayerId: this.localPlayer?.id
        };
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data) {
        const listeners = this.listeners.get(event) || [];
        listeners.forEach(callback => callback(data));
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this.disconnect();
        this.listeners.clear();
    }
}

export default MultiplayerManager;
