# Avion Flight Simulator - Godot 4.x Client
# This script provides a WebSocket client to connect to Avion flight simulator
# 
# COMPATIBILITY: Written for Godot 4.x
# For Godot 3.x, use godot_client.gd instead
# 
# Usage:
# 1. Add this script to a Node in your Godot project
# 2. Set the server_url to match your Avion WebSocket server
# 3. Connect to the signals to receive flight data
# 4. Call send_control_input() to send controls to the simulator

extends Node

# Signals
signal connected_to_avion()
signal disconnected_from_avion()
signal aircraft_state_updated(state)
signal physics_state_updated(state)
signal environment_state_updated(state)
signal event_received(event_type, data)

# Configuration
@export var server_url: String = "ws://localhost:9090"
@export var auto_connect: bool = true
@export var reconnect_attempts: int = 5

# WebSocket client
var socket: WebSocketPeer
var connected: bool = false
var reconnect_timer: float = 0
var attempts_left: int = 0

# Message types (must match Avion GodotMessageType)
enum MessageType {
	STATE_UPDATE,
	PHYSICS_UPDATE,
	AIRCRAFT_UPDATE,
	ENVIRONMENT_UPDATE,
	EVENT,
	CONTROL_INPUT,
	COMMAND,
	CONFIG_UPDATE,
	HANDSHAKE,
	PING,
	PONG
}

var message_type_strings = {
	MessageType.STATE_UPDATE: "state_update",
	MessageType.PHYSICS_UPDATE: "physics_update",
	MessageType.AIRCRAFT_UPDATE: "aircraft_update",
	MessageType.ENVIRONMENT_UPDATE: "environment_update",
	MessageType.EVENT: "event",
	MessageType.CONTROL_INPUT: "control_input",
	MessageType.COMMAND: "command",
	MessageType.CONFIG_UPDATE: "config_update",
	MessageType.HANDSHAKE: "handshake",
	MessageType.PING: "ping",
	MessageType.PONG: "pong"
}

# Latest received data
var latest_aircraft_state: Dictionary = {}
var latest_physics_state: Dictionary = {}
var latest_environment_state: Dictionary = {}

func _ready():
	socket = WebSocketPeer.new()
	attempts_left = reconnect_attempts
	
	if auto_connect:
		connect_to_avion()

func _process(delta):
	if socket.get_ready_state() != WebSocketPeer.STATE_CLOSED:
		socket.poll()
		
		# Check connection state
		var state = socket.get_ready_state()
		
		if state == WebSocketPeer.STATE_OPEN:
			if not connected:
				_on_connection_established()
			
			# Receive messages
			while socket.get_available_packet_count() > 0:
				var packet = socket.get_packet()
				_on_data_received(packet)
		
		elif state == WebSocketPeer.STATE_CLOSED:
			if connected:
				_on_connection_closed()
	
	# Handle reconnection
	if not connected and attempts_left > 0 and reconnect_timer > 0:
		reconnect_timer -= delta
		if reconnect_timer <= 0:
			print("[AvionClient] Attempting to reconnect...")
			connect_to_avion()

# Connect to Avion flight simulator
func connect_to_avion():
	print("[AvionClient] Connecting to ", server_url)
	var error = socket.connect_to_url(server_url)
	if error != OK:
		print("[AvionClient] Failed to connect: ", error)
		schedule_reconnect()

# Disconnect from Avion
func disconnect_from_avion():
	if connected:
		socket.close()
		connected = false
		disconnected_from_avion.emit()

# Send control input to Avion
# pitch, roll, yaw: -1.0 to 1.0
# throttle: 0.0 to 1.0
func send_control_input(pitch: float, roll: float, yaw: float, throttle: float):
	var data = {
		"pitch": pitch,
		"roll": roll,
		"yaw": yaw,
		"throttle": throttle,
		"timestamp": Time.get_ticks_msec()
	}
	send_message(MessageType.CONTROL_INPUT, data)

# Send command to Avion
func send_command(command: String, params: Dictionary = {}):
	var data = {
		"command": command,
		"params": params,
		"timestamp": Time.get_ticks_msec()
	}
	send_message(MessageType.COMMAND, data)

# Send config update to Avion
func send_config_update(config: Dictionary):
	send_message(MessageType.CONFIG_UPDATE, config)

# Send a message to Avion
func send_message(type: int, data: Dictionary):
	if not connected:
		print("[AvionClient] Cannot send message: not connected")
		return
	
	var message = {
		"type": message_type_strings[type],
		"data": data,
		"timestamp": Time.get_ticks_msec()
	}
	
	var json_string = JSON.stringify(message)
	var error = socket.send_text(json_string)
	
	if error != OK:
		print("[AvionClient] Error sending message: ", error)

# Send handshake to Avion
func send_handshake():
	var data = {
		"type": "godot",
		"version": "1.0.0",
		"engine_version": Engine.get_version_info(),
		"timestamp": Time.get_ticks_msec()
	}
	send_message(MessageType.HANDSHAKE, data)

# WebSocket event handlers
func _on_connection_established():
	print("[AvionClient] Connected to Avion!")
	connected = true
	attempts_left = reconnect_attempts
	connected_to_avion.emit()
	send_handshake()

func _on_connection_closed():
	print("[AvionClient] Disconnected from Avion")
	connected = false
	disconnected_from_avion.emit()
	schedule_reconnect()

func _on_data_received(packet: PackedByteArray):
	var json_string = packet.get_string_from_utf8()
	
	var json = JSON.new()
	var error = json.parse(json_string)
	
	if error != OK:
		print("[AvionClient] Failed to parse message: ", json.get_error_message())
		return
	
	var message = json.get_data()
	handle_message(message)

# Handle incoming message from Avion
func handle_message(message: Dictionary):
	if not message.has("type") or not message.has("data"):
		return
	
	var type = message["type"]
	var data = message["data"]
	
	match type:
		"aircraft_update":
			latest_aircraft_state = data
			aircraft_state_updated.emit(data)
		
		"physics_update":
			latest_physics_state = data
			physics_state_updated.emit(data)
		
		"environment_update":
			latest_environment_state = data
			environment_state_updated.emit(data)
		
		"event":
			event_received.emit(data.get("eventType", ""), data.get("data", {}))
		
		"handshake":
			print("[AvionClient] Handshake received: ", data)
		
		"ping":
			# Respond to ping with pong
			send_message(MessageType.PONG, {})

# Schedule reconnection attempt
func schedule_reconnect():
	if attempts_left > 0:
		attempts_left -= 1
		reconnect_timer = 2.0  # Wait 2 seconds before reconnecting
		print("[AvionClient] Reconnecting in 2 seconds... (", attempts_left, " attempts left)")

# Get latest aircraft state
func get_aircraft_position() -> Vector3:
	if latest_aircraft_state.has("position"):
		var pos = latest_aircraft_state["position"]
		return Vector3(pos["x"], pos["y"], pos["z"])
	return Vector3.ZERO

func get_aircraft_velocity() -> Vector3:
	if latest_aircraft_state.has("velocity"):
		var vel = latest_aircraft_state["velocity"]
		return Vector3(vel["x"], vel["y"], vel["z"])
	return Vector3.ZERO

func get_aircraft_rotation() -> Vector3:
	if latest_aircraft_state.has("rotation"):
		var rot = latest_aircraft_state["rotation"]
		return Vector3(rot["pitch"], rot["yaw"], rot["roll"])
	return Vector3.ZERO

func get_aircraft_speed() -> float:
	return latest_aircraft_state.get("speed", 0.0)

func get_aircraft_altitude() -> float:
	return latest_aircraft_state.get("altitude", 0.0)

func get_aircraft_throttle() -> float:
	return latest_aircraft_state.get("throttle", 0.0)

# Get latest physics state
func get_physics_forces() -> Dictionary:
	return latest_physics_state.get("forces", {})

func get_physics_airdata() -> Dictionary:
	return latest_physics_state.get("airData", {})

func get_physics_status() -> Dictionary:
	return latest_physics_state.get("status", {})

func is_stalled() -> bool:
	var status = get_physics_status()
	return status.get("isStalled", false)

func is_on_ground() -> bool:
	var status = get_physics_status()
	return status.get("isOnGround", false)

# Cleanup
func _exit_tree():
	if connected:
		disconnect_from_avion()
