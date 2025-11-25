/**
 * Renderer.js
 * Main rendering setup and management for the flight simulator.
 * Handles Three.js scene, renderer, lighting, and render loop.
 */

import * as THREE from 'three';

/**
 * Renderer class
 * Manages the Three.js WebGL renderer and scene
 */
export class Renderer {
    /**
     * Create a new Renderer instance
     * @param {Object} config - Renderer configuration
     * @param {HTMLElement} config.container - DOM element to render into
     * @param {boolean} config.antialias - Enable antialiasing
     * @param {boolean} config.shadows - Enable shadows
     */
    constructor(config = {}) {
        this.container = config.container || document.body;
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            60,                                                    // FOV
            window.innerWidth / window.innerHeight,               // Aspect ratio
            0.1,                                                  // Near plane
            50000                                                 // Far plane
        );
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: config.antialias !== false,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable shadows
        if (config.shadows !== false) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        // Tone mapping for better colors
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Add canvas to container
        this.container.appendChild(this.renderer.domElement);
        
        // Setup default lighting
        this.setupLighting();
        
        // Handle window resize
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        
        // Render stats
        this.frameCount = 0;
        this.lastFPSUpdate = performance.now();
        this.fps = 0;
    }

    /**
     * Setup scene lighting
     */
    setupLighting() {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Hemisphere light for sky/ground color gradient
        const hemisphereLight = new THREE.HemisphereLight(
            0x87ceeb,  // Sky color
            0x556b2f,  // Ground color
            0.6
        );
        this.scene.add(hemisphereLight);
        
        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(100, 200, 100);
        sunLight.castShadow = true;
        
        // Shadow configuration
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -200;
        sunLight.shadow.camera.right = 200;
        sunLight.shadow.camera.top = 200;
        sunLight.shadow.camera.bottom = -200;
        sunLight.shadow.bias = -0.0001;
        
        this.scene.add(sunLight);
        this.sunLight = sunLight;
    }

    /**
     * Add fog to the scene
     * @param {Object} config - Fog configuration
     */
    addFog(config = {}) {
        const color = config.color || 0x87ceeb;
        const near = config.near || 100;
        const far = config.far || 10000;
        
        this.scene.fog = new THREE.Fog(color, near, far);
    }

    /**
     * Add an object to the scene
     * @param {THREE.Object3D} object - Object to add
     */
    add(object) {
        this.scene.add(object);
    }

    /**
     * Remove an object from the scene
     * @param {THREE.Object3D} object - Object to remove
     */
    remove(object) {
        this.scene.remove(object);
    }

    /**
     * Render the scene
     */
    render() {
        this.renderer.render(this.scene, this.camera);
        
        // Update FPS counter
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFPSUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }

    /**
     * Get the Three.js camera
     * @returns {THREE.PerspectiveCamera} The camera
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Get the Three.js scene
     * @returns {THREE.Scene} The scene
     */
    getScene() {
        return this.scene;
    }

    /**
     * Get the WebGL renderer
     * @returns {THREE.WebGLRenderer} The renderer
     */
    getRenderer() {
        return this.renderer;
    }

    /**
     * Get current FPS
     * @returns {number} Frames per second
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Set background color
     * @param {number|string} color - Color value
     */
    setBackgroundColor(color) {
        this.scene.background = new THREE.Color(color);
    }

    /**
     * Update sun position (for time-of-day effects)
     * @param {THREE.Vector3} position - New sun position
     */
    setSunPosition(position) {
        if (this.sunLight) {
            this.sunLight.position.copy(position);
        }
    }

    /**
     * Cleanup and dispose resources
     */
    dispose() {
        window.removeEventListener('resize', this.handleResize);
        
        // Dispose of all scene objects
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        this.renderer.dispose();
        
        // Remove canvas from DOM
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }
}
