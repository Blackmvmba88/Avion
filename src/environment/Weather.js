/**
 * Weather.js
 * Manages weather effects including clouds and rain
 */

import * as THREE from 'three';

/**
 * Weather class
 * Creates and manages weather effects like clouds and rain
 */
export class Weather {
    /**
     * Create a new Weather system
     * @param {THREE.Scene} scene - The scene to add weather effects to
     * @param {Object} config - Weather configuration
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        this.objects = [];
        
        this.cloudDensity = config.cloudDensity || 0.5; // 0-1
        this.rainIntensity = config.rainIntensity || 0; // 0-1
        this.windSpeed = config.windSpeed || 1;
        
        this.clouds = [];
        this.rainParticles = null;
        this.time = 0;
    }

    /**
     * Create cloud system
     */
    createClouds() {
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
            roughness: 1.0,
            metalness: 0.0
        });

        const cloudCount = Math.floor(20 * this.cloudDensity);
        
        for (let i = 0; i < cloudCount; i++) {
            // Create cloud group with multiple spheres for volume
            const cloud = new THREE.Group();
            
            const puffCount = 5 + Math.floor(Math.random() * 5);
            for (let j = 0; j < puffCount; j++) {
                const puffSize = 50 + Math.random() * 50;
                const puffGeometry = new THREE.SphereGeometry(puffSize, 8, 8);
                const puff = new THREE.Mesh(puffGeometry, cloudMaterial);
                
                puff.position.set(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 100
                );
                
                cloud.add(puff);
            }
            
            // Position cloud in the sky
            cloud.position.set(
                (Math.random() - 0.5) * 8000,
                500 + Math.random() * 300,
                (Math.random() - 0.5) * 8000
            );
            
            // Random velocity for cloud movement
            cloud.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * this.windSpeed,
                0,
                (Math.random() - 0.5) * this.windSpeed
            );
            
            this.scene.add(cloud);
            this.clouds.push(cloud);
            this.objects.push(cloud);
        }
    }

    /**
     * Create rain particle system
     */
    createRain() {
        if (this.rainIntensity <= 0) return;

        const particleCount = Math.floor(5000 * this.rainIntensity);
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 1] = Math.random() * 1000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
            
            velocities[i] = 50 + Math.random() * 50;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

        const material = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 2,
            transparent: true,
            opacity: 0.6
        });

        this.rainParticles = new THREE.Points(geometry, material);
        this.scene.add(this.rainParticles);
        this.objects.push(this.rainParticles);
    }

    /**
     * Update weather effects
     * @param {number} deltaTime - Time since last update
     * @param {THREE.Vector3} cameraPosition - Camera position for particle tracking
     */
    update(deltaTime, cameraPosition) {
        this.time += deltaTime;

        // Update clouds
        this.updateClouds(deltaTime);

        // Update rain
        if (this.rainParticles) {
            this.updateRain(deltaTime, cameraPosition);
        }
    }

    /**
     * Update cloud positions
     * @param {number} deltaTime - Time since last update
     */
    updateClouds(deltaTime) {
        this.clouds.forEach(cloud => {
            // Move cloud
            cloud.position.add(
                cloud.userData.velocity.clone().multiplyScalar(deltaTime)
            );

            // Wrap around if cloud goes too far
            if (cloud.position.x > 4000) cloud.position.x = -4000;
            if (cloud.position.x < -4000) cloud.position.x = 4000;
            if (cloud.position.z > 4000) cloud.position.z = -4000;
            if (cloud.position.z < -4000) cloud.position.z = 4000;
        });
    }

    /**
     * Update rain particles
     * @param {number} deltaTime - Time since last update
     * @param {THREE.Vector3} cameraPosition - Camera position
     */
    updateRain(deltaTime, cameraPosition) {
        const positions = this.rainParticles.geometry.attributes.position.array;
        const velocities = this.rainParticles.geometry.attributes.velocity.array;

        for (let i = 0; i < positions.length; i += 3) {
            // Move particle down
            positions[i + 1] -= velocities[i / 3] * deltaTime;

            // Reset particle if it hits the ground
            if (positions[i + 1] < 0) {
                positions[i] = (Math.random() - 0.5) * 2000 + cameraPosition.x;
                positions[i + 1] = 800 + Math.random() * 200;
                positions[i + 2] = (Math.random() - 0.5) * 2000 + cameraPosition.z;
            }
        }

        this.rainParticles.geometry.attributes.position.needsUpdate = true;

        // Follow camera
        if (cameraPosition) {
            this.rainParticles.position.x = cameraPosition.x;
            this.rainParticles.position.z = cameraPosition.z;
        }
    }

    /**
     * Set weather conditions
     * @param {Object} conditions - Weather conditions
     */
    setConditions(conditions) {
        if (conditions.cloudDensity !== undefined) {
            this.cloudDensity = conditions.cloudDensity;
        }
        if (conditions.rainIntensity !== undefined) {
            this.rainIntensity = conditions.rainIntensity;
        }
        if (conditions.windSpeed !== undefined) {
            this.windSpeed = conditions.windSpeed;
        }

        // Recreate weather effects
        this.clear();
        this.createClouds();
        this.createRain();
    }

    /**
     * Clear all weather effects
     */
    clear() {
        this.objects.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            // Dispose cloud children
            if (obj.children) {
                obj.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
            this.scene.remove(obj);
        });
        this.objects = [];
        this.clouds = [];
        this.rainParticles = null;
    }

    /**
     * Dispose of all weather effects
     */
    dispose() {
        this.clear();
    }
}
