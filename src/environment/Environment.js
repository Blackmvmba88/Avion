/**
 * Environment.js
 * Creates and manages the flight environment including ground, sky, and reference objects.
 * Provides a base for future terrain and weather systems.
 */

import * as THREE from 'three';
import { COLORS, ENVIRONMENT } from '../utils/constants.js';

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
        
        // Create environment components
        this.createGround();
        this.createSkybox();
        this.createReferenceObjects();
    }

    /**
     * Create the ground plane with grid pattern
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
        // Runway
        this.createRunway();
        
        // Reference buildings/structures
        this.createReferenceBuildings();
        
        // Trees (simple representation)
        this.createTrees();
    }

    /**
     * Create a runway
     */
    createRunway() {
        // Main runway surface
        const runwayLength = 2000;
        const runwayWidth = 60;
        
        const runwayGeometry = new THREE.PlaneGeometry(runwayWidth, runwayLength);
        const runwayMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.RUNWAY_GRAY,
            roughness: 0.8
        });
        
        this.runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
        this.runway.rotation.x = -Math.PI / 2;
        this.runway.position.set(0, 0.2, 0);
        this.runway.receiveShadow = true;
        this.scene.add(this.runway);
        this.objects.push(this.runway);
        
        // Runway markings
        const markerMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.MARKER_WHITE,
            roughness: 0.9
        });
        
        // Center line markers
        const markerCount = 30;
        const markerSpacing = runwayLength / markerCount;
        
        for (let i = 0; i < markerCount; i++) {
            const markerGeometry = new THREE.PlaneGeometry(1, 15);
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.rotation.x = -Math.PI / 2;
            marker.position.set(
                0,
                0.3,
                -runwayLength / 2 + markerSpacing * i + markerSpacing / 2
            );
            this.scene.add(marker);
            this.objects.push(marker);
        }
        
        // Threshold markings
        for (let side = -1; side <= 1; side += 2) {
            for (let j = 0; j < 4; j++) {
                const thresholdGeometry = new THREE.PlaneGeometry(3, 30);
                const threshold = new THREE.Mesh(thresholdGeometry, markerMaterial);
                threshold.rotation.x = -Math.PI / 2;
                threshold.position.set(
                    side * (12 + j * 6),
                    0.3,
                    side * (runwayLength / 2 - 25)
                );
                this.scene.add(threshold);
                this.objects.push(threshold);
            }
        }
    }

    /**
     * Create reference buildings
     */
    createReferenceBuildings() {
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.BUILDING_GRAY,
            roughness: 0.7
        });
        
        // Control tower
        const towerGeometry = new THREE.BoxGeometry(15, 40, 15);
        const tower = new THREE.Mesh(towerGeometry, buildingMaterial);
        tower.position.set(200, 20, 500);
        tower.castShadow = true;
        tower.receiveShadow = true;
        this.scene.add(tower);
        this.objects.push(tower);
        
        // Tower top (glass)
        const towerTopGeometry = new THREE.BoxGeometry(20, 10, 20);
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.SKY_BLUE,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.6
        });
        const towerTop = new THREE.Mesh(towerTopGeometry, glassMaterial);
        towerTop.position.set(200, 45, 500);
        this.scene.add(towerTop);
        this.objects.push(towerTop);
        
        // Hangars
        const hangarGeometry = new THREE.BoxGeometry(80, 25, 100);
        const hangarPositions = [
            { x: 300, z: -200 },
            { x: 300, z: 100 },
            { x: -300, z: -100 }
        ];
        
        hangarPositions.forEach((pos) => {
            const hangar = new THREE.Mesh(hangarGeometry, buildingMaterial);
            hangar.position.set(pos.x, 12.5, pos.z);
            hangar.castShadow = true;
            hangar.receiveShadow = true;
            this.scene.add(hangar);
            this.objects.push(hangar);
        });
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
     */
    update(deltaTime) {
        // Future: animate clouds, wind effects, time of day, etc.
    }

    /**
     * Set time of day (affects sky colors)
     * @param {number} hour - Hour of day (0-24)
     */
    setTimeOfDay(hour) {
        if (!this.sky) return;
        
        // Simple day/night color interpolation
        const uniforms = this.sky.material.uniforms;
        
        if (hour >= 6 && hour < 18) {
            // Daytime
            uniforms.topColor.value.setHex(0x0077ff);
            uniforms.bottomColor.value.setHex(0xffffff);
        } else if (hour >= 18 && hour < 20) {
            // Sunset
            uniforms.topColor.value.setHex(0xff6600);
            uniforms.bottomColor.value.setHex(0xff9966);
        } else {
            // Night
            uniforms.topColor.value.setHex(0x000033);
            uniforms.bottomColor.value.setHex(0x000066);
        }
    }

    /**
     * Dispose of all environment objects
     */
    dispose() {
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
    }
}
