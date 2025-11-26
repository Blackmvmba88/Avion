/**
 * FlightDynamics - Handles basic flight physics calculations
 * Simulates lift, drag, thrust, and gravity forces
 */
export class FlightDynamics {
  constructor() {
    // Physical constants
    this.gravity = 9.81; // m/s^2
    this.airDensity = 1.225; // kg/m^3 at sea level

    // Aircraft state
    this.position = { x: 0, y: 100, z: 0 };
    this.velocity = { x: 0, y: 0, z: 50 }; // Start with forward velocity
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.rotation = { pitch: 0, yaw: 0, roll: 0 };
    this.angularVelocity = { pitch: 0, yaw: 0, roll: 0 };
  }

  /**
   * Calculate lift force based on velocity and angle of attack
   * @param {number} wingArea - Wing area in m^2
   * @param {number} liftCoefficient - Lift coefficient (depends on angle of attack)
   * @returns {number} Lift force in Newtons
   */
  calculateLift(wingArea = 20, liftCoefficient = 0.5) {
    const speed = this.getSpeed();
    return 0.5 * this.airDensity * speed * speed * wingArea * liftCoefficient;
  }

  /**
   * Calculate drag force
   * @param {number} dragArea - Effective drag area
   * @param {number} dragCoefficient - Drag coefficient
   * @returns {number} Drag force in Newtons
   */
  calculateDrag(dragArea = 5, dragCoefficient = 0.02) {
    const speed = this.getSpeed();
    return 0.5 * this.airDensity * speed * speed * dragArea * dragCoefficient;
  }

  /**
   * Get current speed magnitude
   * @returns {number} Speed in m/s
   */
  getSpeed() {
    return Math.sqrt(
      this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2
    );
  }

  /**
   * Update physics simulation
   * @param {number} deltaTime - Time step in seconds
   * @param {Object} controls - Control inputs { throttle, pitch, roll, yaw }
   * @param {Object} aircraftConfig - Aircraft configuration
   */
  update(deltaTime, controls = {}, aircraftConfig = {}) {
    const { throttle = 0, pitch = 0, roll = 0, yaw = 0 } = controls;
    const { mass = 5000, maxThrust = 50000 } = aircraftConfig;

    // Calculate forces
    const thrust = throttle * maxThrust;
    const lift = this.calculateLift();
    const drag = this.calculateDrag();
    const weight = mass * this.gravity;

    // Calculate acceleration based on forces and rotation
    const forwardAngle = this.rotation.yaw;
    const pitchAngle = this.rotation.pitch;

    // Simplified force application
    this.acceleration.x =
      ((thrust - drag) * Math.sin(forwardAngle)) / mass +
      (lift * Math.sin(this.rotation.roll)) / mass;
    this.acceleration.y = (lift * Math.cos(this.rotation.roll) - weight) / mass;
    this.acceleration.z = ((thrust - drag) * Math.cos(forwardAngle)) / mass;

    // Update angular velocity based on control inputs
    const turnRate = 1.0;
    this.angularVelocity.pitch = pitch * turnRate;
    this.angularVelocity.yaw = yaw * turnRate;
    this.angularVelocity.roll = roll * turnRate;

    // Update rotation
    this.rotation.pitch += this.angularVelocity.pitch * deltaTime;
    this.rotation.yaw += this.angularVelocity.yaw * deltaTime;
    this.rotation.roll += this.angularVelocity.roll * deltaTime;

    // Clamp pitch to prevent flipping
    this.rotation.pitch = Math.max(
      -Math.PI / 3,
      Math.min(Math.PI / 3, this.rotation.pitch)
    );

    // Update velocity
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.velocity.z += this.acceleration.z * deltaTime;

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Ground collision check
    if (this.position.y < 0) {
      this.position.y = 0;
      this.velocity.y = Math.max(0, this.velocity.y);
    }
  }

  /**
   * Get the current state for rendering
   * @returns {Object} Current position and rotation state
   */
  getState() {
    return {
      position: { ...this.position },
      rotation: { ...this.rotation },
      velocity: { ...this.velocity },
      speed: this.getSpeed(),
    };
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.position = { x: 0, y: 100, z: 0 };
    this.velocity = { x: 0, y: 0, z: 50 };
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.rotation = { pitch: 0, yaw: 0, roll: 0 };
    this.angularVelocity = { pitch: 0, yaw: 0, roll: 0 };
  }
}

export default FlightDynamics;
