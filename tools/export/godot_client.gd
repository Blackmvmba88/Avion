# Avion Flight Simulator - Godot Client
# This script provides a WebSocket client to connect to Avion flight simulator
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
export var server_url: String = "ws://localhost:9090"
export var auto_connect: bool = true
export var reconnect_attempts: int = 5

# WebSocket client
var client: WebSocketClient
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
	client = WebSocketClient.new()
	client.connect("connection_closed", self, "_on_connection_closed")
	client.connect("connection_error", self, "_on_connection_error")
	client.connect("connection_established", self, "_on_connection_established")
	client.connect("data_received", self, "_on_data_received")
	
	attempts_left = reconnect_attempts
	
	if auto_connect:
		connect_to_avion()

func _process(delta):
	if client.get_connection_status() != NetworkedMultiplayerPeer.CONNECTION_DISCONNECTED:
		client.poll()
	
	# Handle reconnection
	if not connected and attempts_left > 0 and reconnect_timer > 0:
		reconnect_timer -= delta
		if reconnect_timer <= 0:
			print("[AvionClient] Attempting to reconnect...")
			connect_to_avion()

# Connect to Avion flight simulator
func connect_to_avion():
	print("[AvionClient] Connecting to ", server_url)
	var error = client.connect_to_url(server_url)
	if error != OK:
		print("[AvionClient] Failed to connect: ", error)
		schedule_reconnect()

# Disconnect from Avion
func disconnect_from_avion():
	if connected:
		client.disconnect_from_host()
		connected = false
		emit_signal("disconnected_from_avion")

# Send control input to Avion
# pitch, roll, yaw: -1.0 to 1.0
# throttle: 0.0 to 1.0
func send_control_input(pitch: float, roll: float, yaw: float, throttle: float):
	var data = {
		"pitch": pitch,
		"roll": roll,
		"yaw": yaw,
		"throttle": throttle,
		"timestamp": OS.get_ticks_msec()
	}
	send_message(MessageType.CONTROL_INPUT, data)

# Send command to Avion
func send_command(command: String, params: Dictionary = {}):
	var data = {
		"command": command,
		"params": params,
		"timestamp": OS.get_ticks_msec()
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
		"timestamp": OS.get_ticks_msec()
	}
	
	var json_string = JSON.print(message)
	client.get_peer(1).put_packet(json_string.to_utf8())

# Send handshake to Avion
func send_handshake():
	var data = {
		"type": "godot",
		"version": "1.0.0",
		"engine_version": Engine.get_version_info(),
		"timestamp": OS.get_ticks_msec()
	}
	send_message(MessageType.HANDSHAKE, data)

# WebSocket event handlers
func _on_connection_established(protocol):
	print("[AvionClient] Connected to Avion!")
	connected = true
	attempts_left = reconnect_attempts
	emit_signal("connected_to_avion")
	send_handshake()

func _on_connection_closed(was_clean):
	print("[AvionClient] Disconnected from Avion")
	connected = false
	emit_signal("disconnected_from_avion")
	schedule_reconnect()

func _on_connection_error():
	print("[AvionClient] Connection error")
	connected = false
	schedule_reconnect()

func _on_data_received():
	var packet = client.get_peer(1).get_packet()
	var json_string = packet.get_string_from_utf8()
	
	var parse_result = JSON.parse(json_string)
	if parse_result.error != OK:
		print("[AvionClient] Failed to parse message: ", parse_result.error_string)
		return
	
	var message = parse_result.result
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
			emit_signal("aircraft_state_updated", data)
		
		"physics_update":
			latest_physics_state = data
			emit_signal("physics_state_updated", data)
		
		"environment_update":
			latest_environment_state = data
			emit_signal("environment_state_updated", data)
		
		"event":
			emit_signal("event_received", data.get("eventType", ""), data.get("data", {}))
		
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
