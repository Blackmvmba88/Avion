/**
 * ParticleSystem.js
 * GPU-optimized particle system for exhaust, contrails, and other visual effects.
 * Uses Three.js Points and BufferGeometry for efficient rendering.
 */

import * as THREE from 'three';

/**
 * Particle effect types
 */
export const ParticleType = {
    EXHAUST: 'exhaust',
    CONTRAIL: 'contrail',
    SMOKE: 'smoke',
    FIRE: 'fire',
    DEBRIS: 'debris',
    EXPLOSION: 'explosion'
};

/**
 * Single particle data structure
 */
class Particle {
    constructor() {
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.color = new THREE.Color(1, 1, 1);
        this.size = 1;
        this.life = 0;
        this.maxLife = 1;
        this.alpha = 1;
        this.active = false;
    }

    reset() {
        this.position.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
        this.color.setRGB(1, 1, 1);
        this.size = 1;
        this.life = 0;
        this.maxLife = 1;
        this.alpha = 1;
        this.active = false;
    }
}

/**
 * ParticleEmitter configuration
 */
export class EmitterConfig {
    constructor(options = {}) {
        this.type = options.type || ParticleType.EXHAUST;
        this.maxParticles = options.maxParticles || 1000;
        this.emissionRate = options.emissionRate || 50; // particles per second
        this.lifetime = options.lifetime || 2.0; // seconds
        this.lifetimeVariance = options.lifetimeVariance || 0.2;
        
        // Size
        this.startSize = options.startSize || 0.5;
        this.endSize = options.endSize || 2.0;
        this.sizeVariance = options.sizeVariance || 0.2;
        
        // Velocity
        this.velocity = options.velocity || new THREE.Vector3(0, 0, -5);
        this.velocityVariance = options.velocityVariance || new THREE.Vector3(1, 1, 1);
        this.inheritVelocity = options.inheritVelocity ?? 0.3;
        
        // Color
        this.startColor = options.startColor || new THREE.Color(1, 0.8, 0.4);
        this.endColor = options.endColor || new THREE.Color(0.3, 0.3, 0.3);
        
        // Alpha
        this.startAlpha = options.startAlpha ?? 1.0;
        this.endAlpha = options.endAlpha ?? 0.0;
        
        // Physics
        this.gravity = options.gravity ?? 0;
        this.drag = options.drag ?? 0.1;
        
        // Spawn area
        this.spawnRadius = options.spawnRadius ?? 0.1;
        
        // Enabled
        this.enabled = options.enabled ?? true;
    }
}

/**
 * ParticleEmitter class
 * Emits particles from a point in space
 */
export class ParticleEmitter {
    /**
     * Create a new ParticleEmitter
     * @param {EmitterConfig} config - Emitter configuration
     */
    constructor(config = new EmitterConfig()) {
        this.config = config;
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.parentVelocity = new THREE.Vector3();
        
        // Particle pool
        this.particles = [];
        this.activeCount = 0;
        
        // Emission timing
        this.emissionAccumulator = 0;
        
        // Initialize particle pool
        for (let i = 0; i < config.maxParticles; i++) {
            this.particles.push(new Particle());
        }
        
        // Three.js objects
        this.geometry = null;
        this.material = null;
        this.points = null;
        
        this.createMesh();
    }

    /**
     * Create the Three.js mesh for particles
     */
    createMesh() {
        // Create buffer geometry
        this.geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(this.config.maxParticles * 3);
        const colors = new Float32Array(this.config.maxParticles * 4);
        const sizes = new Float32Array(this.config.maxParticles);
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create shader material for particles
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: this.createParticleTexture() }
            },
            vertexShader: `
                attribute float size;
                attribute vec4 color;
                varying vec4 vColor;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec4 vColor;
                
                void main() {
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    gl_FragColor = vec4(vColor.rgb, vColor.a * texColor.a);
                    if (gl_FragColor.a < 0.01) discard;
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });
        
        this.points = new THREE.Points(this.geometry, this.material);
        this.points.frustumCulled = false;
    }

    /**
     * Create a circular particle texture
     * @returns {THREE.Texture}
     */
    createParticleTexture() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(
            size / 2, size / 2, 0,
            size / 2, size / 2, size / 2
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    /**
     * Get an inactive particle from the pool
     * @returns {Particle|null}
     */
    getParticle() {
        for (const particle of this.particles) {
            if (!particle.active) {
                return particle;
            }
        }
        return null;
    }

    /**
     * Emit a single particle
     */
    emitParticle() {
        const particle = this.getParticle();
        if (!particle) return;
        
        const config = this.config;
        
        // Random spawn position within radius
        const spawnOffset = new THREE.Vector3(
            (Math.random() - 0.5) * config.spawnRadius * 2,
            (Math.random() - 0.5) * config.spawnRadius * 2,
            (Math.random() - 0.5) * config.spawnRadius * 2
        );
        
        particle.position.copy(this.position).add(spawnOffset);
        
        // Calculate velocity in emitter's local space
        const localVelocity = config.velocity.clone();
        localVelocity.x += (Math.random() - 0.5) * config.velocityVariance.x * 2;
        localVelocity.y += (Math.random() - 0.5) * config.velocityVariance.y * 2;
        localVelocity.z += (Math.random() - 0.5) * config.velocityVariance.z * 2;
        
        // Apply rotation to velocity
        localVelocity.applyEuler(this.rotation);
        
        // Add inherited velocity from parent
        const inherited = this.parentVelocity.clone().multiplyScalar(config.inheritVelocity);
        particle.velocity.copy(localVelocity).add(inherited);
        
        // Lifetime with variance
        particle.maxLife = config.lifetime + (Math.random() - 0.5) * config.lifetimeVariance * 2;
        particle.life = particle.maxLife;
        
        // Size with variance
        particle.size = config.startSize + (Math.random() - 0.5) * config.sizeVariance * 2;
        
        // Color
        particle.color.copy(config.startColor);
        
        // Alpha
        particle.alpha = config.startAlpha;
        
        particle.active = true;
        this.activeCount++;
    }

    /**
     * Update all particles
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.config.enabled) {
            // Still update existing particles even when disabled
            this.updateParticles(deltaTime);
            this.updateGeometry();
            return;
        }
        
        // Emit new particles
        this.emissionAccumulator += deltaTime;
        const particlesToEmit = Math.floor(this.emissionAccumulator * this.config.emissionRate);
        
        if (particlesToEmit > 0) {
            this.emissionAccumulator -= particlesToEmit / this.config.emissionRate;
            
            for (let i = 0; i < particlesToEmit; i++) {
                this.emitParticle();
            }
        }
        
        // Update existing particles
        this.updateParticles(deltaTime);
        
        // Update geometry buffers
        this.updateGeometry();
    }

    /**
     * Update individual particles
     * @param {number} deltaTime
     */
    updateParticles(deltaTime) {
        const config = this.config;
        
        for (const particle of this.particles) {
            if (!particle.active) continue;
            
            // Update life
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                particle.active = false;
                this.activeCount--;
                continue;
            }
            
            // Life progress (0 = just spawned, 1 = about to die)
            const lifeProgress = 1 - (particle.life / particle.maxLife);
            
            // Apply gravity
            particle.velocity.y -= config.gravity * deltaTime;
            
            // Apply drag
            const drag = 1 - config.drag * deltaTime;
            particle.velocity.multiplyScalar(drag);
            
            // Update position
            particle.position.add(
                particle.velocity.clone().multiplyScalar(deltaTime)
            );
            
            // Interpolate size
            particle.size = THREE.MathUtils.lerp(
                config.startSize,
                config.endSize,
                lifeProgress
            );
            
            // Interpolate color
            particle.color.lerpColors(
                config.startColor,
                config.endColor,
                lifeProgress
            );
            
            // Interpolate alpha
            particle.alpha = THREE.MathUtils.lerp(
                config.startAlpha,
                config.endAlpha,
                lifeProgress
            );
        }
    }

    /**
     * Update Three.js buffer geometry
     */
    updateGeometry() {
        const positions = this.geometry.attributes.position.array;
        const colors = this.geometry.attributes.color.array;
        const sizes = this.geometry.attributes.size.array;
        
        let index = 0;
        
        for (const particle of this.particles) {
            if (particle.active) {
                // Position
                positions[index * 3] = particle.position.x;
                positions[index * 3 + 1] = particle.position.y;
                positions[index * 3 + 2] = particle.position.z;
                
                // Color with alpha
                colors[index * 4] = particle.color.r;
                colors[index * 4 + 1] = particle.color.g;
                colors[index * 4 + 2] = particle.color.b;
                colors[index * 4 + 3] = particle.alpha;
                
                // Size
                sizes[index] = particle.size;
                
                index++;
            }
        }
        
        // Clear remaining positions (move off-screen)
        for (let i = index; i < this.config.maxParticles; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = -10000;
            positions[i * 3 + 2] = 0;
            sizes[i] = 0;
        }
        
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
    }

    /**
     * Get the Three.js object for scene addition
     * @returns {THREE.Points}
     */
    getObject3D() {
        return this.points;
    }

    /**
     * Set emitter position
     * @param {THREE.Vector3} position
     */
    setPosition(position) {
        this.position.copy(position);
    }

    /**
     * Set emitter rotation
     * @param {THREE.Euler} rotation
     */
    setRotation(rotation) {
        this.rotation.copy(rotation);
    }

    /**
     * Set parent velocity for inheritance
     * @param {THREE.Vector3} velocity
     */
    setParentVelocity(velocity) {
        this.parentVelocity.copy(velocity);
    }

    /**
     * Set emission rate
     * @param {number} rate - Particles per second
     */
    setEmissionRate(rate) {
        this.config.emissionRate = rate;
    }

    /**
     * Enable or disable emission
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
    }

    /**
     * Burst emit multiple particles at once
     * @param {number} count - Number of particles to emit
     */
    burst(count) {
        for (let i = 0; i < count; i++) {
            this.emitParticle();
        }
    }

    /**
     * Clear all particles
     */
    clear() {
        for (const particle of this.particles) {
            particle.active = false;
        }
        this.activeCount = 0;
        this.updateGeometry();
    }

    /**
     * Dispose of resources
     */
    dispose() {
        if (this.geometry) {
            this.geometry.dispose();
        }
        if (this.material) {
            this.material.dispose();
            if (this.material.uniforms.pointTexture.value) {
                this.material.uniforms.pointTexture.value.dispose();
            }
        }
    }
}

/**
 * ParticleSystem class
 * Manages multiple particle emitters for aircraft effects
 */
export class ParticleSystem {
    /**
     * Create a new ParticleSystem
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            enabled: config.enabled ?? true,
            quality: config.quality || 'high', // 'low', 'medium', 'high'
            ...config
        };
        
        this.emitters = new Map();
        this.group = new THREE.Group();
        
        // Quality settings
        this.qualitySettings = {
            low: { particleMultiplier: 0.25, emissionMultiplier: 0.25 },
            medium: { particleMultiplier: 0.5, emissionMultiplier: 0.5 },
            high: { particleMultiplier: 1.0, emissionMultiplier: 1.0 }
        };
    }

    /**
     * Create default exhaust emitters for aircraft
     * @param {THREE.Vector3[]} exhaustPositions - Local positions of exhausts
     * @returns {ParticleEmitter[]}
     */
    createExhaustEmitters(exhaustPositions = []) {
        const emitters = [];
        const quality = this.qualitySettings[this.config.quality];
        
        for (let i = 0; i < exhaustPositions.length; i++) {
            const config = new EmitterConfig({
                type: ParticleType.EXHAUST,
                maxParticles: Math.floor(200 * quality.particleMultiplier),
                emissionRate: 30 * quality.emissionMultiplier,
                lifetime: 0.5,
                lifetimeVariance: 0.1,
                startSize: 0.3,
                endSize: 1.5,
                velocity: new THREE.Vector3(0, 0, -15),
                velocityVariance: new THREE.Vector3(2, 2, 3),
                inheritVelocity: 0.5,
                startColor: new THREE.Color(1, 0.6, 0.2),
                endColor: new THREE.Color(0.5, 0.5, 0.5),
                startAlpha: 0.8,
                endAlpha: 0.0,
                gravity: -0.5,
                drag: 0.2,
                spawnRadius: 0.1
            });
            
            const emitter = new ParticleEmitter(config);
            emitter.localPosition = exhaustPositions[i].clone();
            
            this.emitters.set(`exhaust_${i}`, emitter);
            this.group.add(emitter.getObject3D());
            emitters.push(emitter);
        }
        
        return emitters;
    }

    /**
     * Create contrail emitters for wingtips
     * @param {THREE.Vector3[]} wingtipPositions - Local positions of wingtips
     * @returns {ParticleEmitter[]}
     */
    createContrailEmitters(wingtipPositions = []) {
        const emitters = [];
        const quality = this.qualitySettings[this.config.quality];
        
        for (let i = 0; i < wingtipPositions.length; i++) {
            const config = new EmitterConfig({
                type: ParticleType.CONTRAIL,
                maxParticles: Math.floor(500 * quality.particleMultiplier),
                emissionRate: 50 * quality.emissionMultiplier,
                lifetime: 5.0,
                lifetimeVariance: 0.5,
                startSize: 0.5,
                endSize: 8.0,
                velocity: new THREE.Vector3(0, 0, 0),
                velocityVariance: new THREE.Vector3(0.2, 0.2, 0.2),
                inheritVelocity: 0.9,
                startColor: new THREE.Color(1, 1, 1),
                endColor: new THREE.Color(1, 1, 1),
                startAlpha: 0.4,
                endAlpha: 0.0,
                gravity: 0,
                drag: 0.05,
                spawnRadius: 0.05,
                enabled: false // Disabled by default, enabled at altitude
            });
            
            const emitter = new ParticleEmitter(config);
            emitter.localPosition = wingtipPositions[i].clone();
            
            this.emitters.set(`contrail_${i}`, emitter);
            this.group.add(emitter.getObject3D());
            emitters.push(emitter);
        }
        
        return emitters;
    }

    /**
     * Create a smoke emitter for damage effects
     * @param {THREE.Vector3} position - Local position
     * @returns {ParticleEmitter}
     */
    createSmokeEmitter(position = new THREE.Vector3()) {
        const quality = this.qualitySettings[this.config.quality];
        
        const config = new EmitterConfig({
            type: ParticleType.SMOKE,
            maxParticles: Math.floor(300 * quality.particleMultiplier),
            emissionRate: 20 * quality.emissionMultiplier,
            lifetime: 3.0,
            startSize: 0.5,
            endSize: 5.0,
            velocity: new THREE.Vector3(0, 2, 0),
            velocityVariance: new THREE.Vector3(1, 0.5, 1),
            inheritVelocity: 0.3,
            startColor: new THREE.Color(0.2, 0.2, 0.2),
            endColor: new THREE.Color(0.1, 0.1, 0.1),
            startAlpha: 0.6,
            endAlpha: 0.0,
            gravity: -1,
            drag: 0.1,
            enabled: false
        });
        
        const emitter = new ParticleEmitter(config);
        emitter.localPosition = position.clone();
        
        const id = `smoke_${this.emitters.size}`;
        this.emitters.set(id, emitter);
        this.group.add(emitter.getObject3D());
        
        return emitter;
    }

    /**
     * Update particle system based on aircraft state
     * @param {number} deltaTime - Time since last update
     * @param {Object} state - Aircraft state
     */
    update(deltaTime, state = {}) {
        if (!this.config.enabled) return;
        
        const {
            position = new THREE.Vector3(),
            rotation = new THREE.Euler(),
            velocity = new THREE.Vector3(),
            throttle = 0,
            altitude = 0,
            airspeed = 0,
            damaged = false
        } = state;
        
        // Update emitter positions and states
        for (const [name, emitter] of this.emitters) {
            // Calculate world position from local position
            if (emitter.localPosition) {
                const worldPos = emitter.localPosition.clone();
                worldPos.applyEuler(rotation);
                worldPos.add(position);
                emitter.setPosition(worldPos);
            } else {
                emitter.setPosition(position);
            }
            
            emitter.setRotation(rotation);
            emitter.setParentVelocity(velocity);
            
            // Update exhaust based on throttle
            if (name.startsWith('exhaust_')) {
                const emissionRate = 20 + throttle * 60;
                emitter.setEmissionRate(emissionRate);
                
                // Adjust color based on throttle
                const intensity = 0.3 + throttle * 0.7;
                emitter.config.startColor.setRGB(
                    intensity,
                    intensity * 0.6,
                    intensity * 0.2
                );
            }
            
            // Update contrails based on altitude and speed
            if (name.startsWith('contrail_')) {
                // Contrails form above ~8000m and at sufficient speed
                const contrailAltitude = 8000;
                const contrailSpeed = 80; // m/s
                
                const shouldEmit = altitude > contrailAltitude && airspeed > contrailSpeed;
                emitter.setEnabled(shouldEmit);
                
                if (shouldEmit) {
                    // Intensity based on altitude
                    const altitudeFactor = Math.min((altitude - contrailAltitude) / 2000, 1);
                    emitter.config.startAlpha = 0.2 + altitudeFactor * 0.4;
                }
            }
            
            // Update smoke for damage
            if (name.startsWith('smoke_')) {
                emitter.setEnabled(damaged);
            }
            
            // Update particles
            emitter.update(deltaTime);
        }
    }

    /**
     * Get the Three.js group for scene addition
     * @returns {THREE.Group}
     */
    getObject3D() {
        return this.group;
    }

    /**
     * Get emitter by name
     * @param {string} name
     * @returns {ParticleEmitter|undefined}
     */
    getEmitter(name) {
        return this.emitters.get(name);
    }

    /**
     * Set quality level
     * @param {string} quality - 'low', 'medium', or 'high'
     */
    setQuality(quality) {
        this.config.quality = quality;
        // Note: Existing emitters won't be updated, only new ones
    }

    /**
     * Enable or disable the entire system
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        
        if (!enabled) {
            // Clear all particles when disabled
            for (const emitter of this.emitters.values()) {
                emitter.setEnabled(false);
                emitter.clear();
            }
        }
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        for (const emitter of this.emitters.values()) {
            emitter.dispose();
        }
        this.emitters.clear();
    }
}

export default ParticleSystem;
