/**
 * Environment.js
 * Creates and manages the flight environment including ground, sky, and reference objects.
 * Provides a base for future terrain and weather systems.
 */

import * as THREE from 'three';
import { COLORS, ENVIRONMENT } from '../utils/constants.js';
import { TerrainGenerator } from './TerrainGenerator.js';
import { Airport } from './Airport.js';
import { WaterBody } from './WaterBody.js';
import { TimeOfDay } from './TimeOfDay.js';
import { Weather } from './Weather.js';

/**
 * Environment class
 * Manages the 3D environment for the flight simulator
 */
export class Environment {
    /**
     * Create a new Environment instance
     * @param {THREE.Scene} scene - The Three.js scene to add objects to
     * @param {Object} config - Environment configuration
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        this.objects = [];
        
        // Configuration
        this.groundSize = config.groundSize || ENVIRONMENT.GROUND_SIZE;
        this.gridDivisions = config.gridDivisions || ENVIRONMENT.GRID_DIVISIONS;
        this.useTerrain = config.useTerrain !== false; // Default to true
        this.useWater = config.useWater !== false; // Default to true
        this.enableDayNightCycle = config.enableDayNightCycle !== false; // Default to true
        this.enableWeather = config.enableWeather !== false; // Default to true
        
        // Systems
        this.terrain = null;
        this.airports = [];
        this.waterBodies = [];
        this.timeOfDay = null;
        this.weather = null;
        
        // Create environment components
        if (this.useTerrain) {
            this.createTerrain();
        } else {
            this.createGround();
        }
        
        this.createSkybox();
        
        // Create water
        if (this.useWater) {
            this.createWater();
        }
        
        // Create airports
        this.createAirports();
        
        // Create reference objects
        this.createReferenceObjects();
        
        // Initialize time of day system
        if (this.enableDayNightCycle) {
            this.initTimeOfDay(config.timeOfDay);
        }
        
        // Initialize weather system
        if (this.enableWeather) {
            this.initWeather(config.weather);
        }
    }

    /**
     * Create terrain with heightmap
     */
    createTerrain() {
        const terrainGenerator = new TerrainGenerator({
            width: this.groundSize,
            depth: this.groundSize,
            segments: 128,
            maxHeight: 300,
            seed: Math.random() * 1000
        });
        
        this.terrain = terrainGenerator.generate();
        this.scene.add(this.terrain);
        this.objects.push(this.terrain);
        
        // Add grid overlay for reference
        const gridHelper = new THREE.GridHelper(
            this.groundSize,
            this.gridDivisions,
            0x444444,
            0x555555
        );
        gridHelper.position.y = 1;
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
        this.objects.push(gridHelper);
    }

    /**
     * Create the ground plane with grid pattern (legacy, used when terrain is disabled)
     */
    createGround() {
        // Main ground plane
        const groundGeometry = new THREE.PlaneGeometry(this.groundSize, this.groundSize);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.GROUND_GREEN,
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = 0;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        this.objects.push(this.ground);
        
        // Grid overlay for reference
        const gridHelper = new THREE.GridHelper(
            this.groundSize,
            this.gridDivisions,
            0x444444,
            0x555555
        );
        gridHelper.position.y = 0.1;
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
        this.objects.push(gridHelper);
    }

    /**
     * Create water bodies
     */
    createWater() {
        // Ocean/sea around the terrain
        const ocean = new WaterBody(this.scene, {
            size: { width: this.groundSize * 1.5, depth: this.groundSize * 1.5 },
            position: new THREE.Vector3(0, -5, 0),
            type: 'ocean'
        });
        ocean.create();
        this.waterBodies.push(ocean);
        
        // Optional: Add a lake
        const lake = new WaterBody(this.scene, {
            size: { width: 800, depth: 600 },
            position: new THREE.Vector3(-2000, 0.5, 2000),
            type: 'lake'
        });
        lake.create();
        this.waterBodies.push(lake);
    }

    /**
     * Create multiple airports with runways
     */
    createAirports() {
        // Main airport at origin
        const mainAirport = new Airport(this.scene, {
            position: new THREE.Vector3(0, 0, 0),
            runwayLength: 2000,
            runwayWidth: 60,
            name: 'Main International',
            heading: 0
        });
        mainAirport.build();
        this.airports.push(mainAirport);
        
        // Secondary airport
        const secondaryAirport = new Airport(this.scene, {
            position: new THREE.Vector3(5000, 0, 3000),
            runwayLength: 1500,
            runwayWidth: 45,
            name: 'Regional Airport',
            heading: 45
        });
        secondaryAirport.build();
        this.airports.push(secondaryAirport);
    }

    /**
     * Initialize time of day system
     * @param {Object} config - Time of day configuration
     */
    initTimeOfDay(config = {}) {
        this.timeOfDay = new TimeOfDay(this.scene, {
            startTime: config.startTime || 12,
            timeSpeed: config.timeSpeed || 100, // 100x real-time for visible cycle
            cycleDuration: config.cycleDuration || 24
        });
    }

    /**
     * Initialize weather system
     * @param {Object} config - Weather configuration
     */
    initWeather(config = {}) {
        this.weather = new Weather(this.scene, {
            cloudDensity: config.cloudDensity || 0.5,
            rainIntensity: config.rainIntensity || 0,
            windSpeed: config.windSpeed || 1
        });
        
        this.weather.createClouds();
        if (config.rainIntensity > 0) {
            this.weather.createRain();
        }
    }

    /**
     * Create a simple gradient skybox
     */
    createSkybox() {
        // Create gradient sky using a large sphere
        const skyGeometry = new THREE.SphereGeometry(15000, 32, 32);
        
        // Custom shader for sky gradient
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.sky);
        this.objects.push(this.sky);
    }

    /**
     * Create reference objects for spatial orientation
     */
    createReferenceObjects() {
        // Trees (simple representation)
        this.createTrees();
    }

    /**
     * Create simple tree representations
     */
    createTrees() {
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.TREE_TRUNK,
            roughness: 0.9
        });
        
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.TREE_FOLIAGE,
            roughness: 0.8
        });
        
        // Create tree cluster function
        const createTree = (x, z) => {
            // Trunk
            const trunkGeometry = new THREE.CylinderGeometry(2, 3, 15, 8);
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(x, 7.5, z);
            trunk.castShadow = true;
            this.scene.add(trunk);
            this.objects.push(trunk);
            
            // Foliage (cone shape)
            const foliageGeometry = new THREE.ConeGeometry(12, 25, 8);
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.set(x, 25, z);
            foliage.castShadow = true;
            this.scene.add(foliage);
            this.objects.push(foliage);
        };
        
        // Place trees in clusters around the airfield
        const treePositions = [
            // Near runway
            { x: -500, z: -800 },
            { x: -550, z: -750 },
            { x: -480, z: -700 },
            { x: -600, z: -850 },
            
            // Opposite side
            { x: 600, z: 800 },
            { x: 650, z: 750 },
            { x: 580, z: 700 },
            { x: 700, z: 850 },
            
            // Side clusters
            { x: -800, z: 200 },
            { x: -850, z: 250 },
            { x: -750, z: 150 },
            
            { x: 800, z: -200 },
            { x: 850, z: -250 },
            { x: 750, z: -150 }
        ];
        
        treePositions.forEach(pos => createTree(pos.x, pos.z));
    }

    /**
     * Update environment (for future animated elements)
     * @param {number} deltaTime - Time step
     * @param {THREE.Vector3} cameraPosition - Camera position for effects
     */
    update(deltaTime, cameraPosition) {
        // Update time of day
        if (this.timeOfDay) {
            this.timeOfDay.update(deltaTime);
            
            // Update sky colors based on time
            if (this.sky && this.sky.material.uniforms) {
                const colors = this.timeOfDay.getSkyColors();
                this.sky.material.uniforms.topColor.value.copy(colors.topColor);
                this.sky.material.uniforms.bottomColor.value.copy(colors.bottomColor);
            }
        }
        
        // Update water animation
        if (this.waterBodies) {
            this.waterBodies.forEach(water => water.update(deltaTime));
        }
        
        // Update weather
        if (this.weather) {
            this.weather.update(deltaTime, cameraPosition);
        }
    }

    /**
     * Set time of day (affects sky colors)
     * @param {number} hour - Hour of day (0-24)
     */
    setTimeOfDay(hour) {
        if (this.timeOfDay) {
            this.timeOfDay.setTime(hour);
        }
    }

    /**
     * Get current time of day
     * @returns {number|null} Current hour (0-24) or null if not enabled
     */
    getTimeOfDay() {
        return this.timeOfDay ? this.timeOfDay.getTime() : null;
    }

    /**
     * Get time string
     * @returns {string|null} Time in HH:MM format or null if not enabled
     */
    getTimeString() {
        return this.timeOfDay ? this.timeOfDay.getTimeString() : null;
    }

    /**
     * Set weather conditions
     * @param {Object} conditions - Weather conditions
     */
    setWeather(conditions) {
        if (this.weather) {
            this.weather.setConditions(conditions);
        }
    }

    /**
     * Dispose of all environment objects
     */
    dispose() {
        // Dispose standard objects
        this.objects.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            this.scene.remove(obj);
        });
        this.objects = [];
        
        // Dispose airports
        if (this.airports) {
            this.airports.forEach(airport => airport.dispose());
            this.airports = [];
        }
        
        // Dispose water bodies
        if (this.waterBodies) {
            this.waterBodies.forEach(water => water.dispose());
            this.waterBodies = [];
        }
        
        // Dispose time of day
        if (this.timeOfDay) {
            this.timeOfDay.dispose();
            this.timeOfDay = null;
        }
        
        // Dispose weather
        if (this.weather) {
            this.weather.dispose();
            this.weather = null;
        }
    }
}
