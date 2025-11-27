import * as THREE from 'three';

/**
 * SceneRenderer - Manages the Three.js scene, camera, and rendering
 */
export class SceneRenderer {
    constructor(container) {
        this.container = container || document.body;

        this.scene = new THREE.Scene();
        this.camera = this.createCamera();
        this.renderer = this.createRenderer();
        this.lights = this.createLights();

        this.setupResizeHandler();
    }

    /**
   * Create the perspective camera
   * @returns {THREE.PerspectiveCamera}
   */
    createCamera() {
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        camera.position.set(0, 5, -20);
        return camera;
    }

    /**
   * Create the WebGL renderer
   * @returns {THREE.WebGLRenderer}
   */
    createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(renderer.domElement);
        return renderer;
    }

    /**
   * Create scene lighting
   * @returns {Object} Object containing light references
   */
    createLights() {
    // Ambient light for overall illumination
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);

        // Directional light (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(100, 200, 100);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 1000;
        sun.shadow.camera.left = -200;
        sun.shadow.camera.right = 200;
        sun.shadow.camera.top = 200;
        sun.shadow.camera.bottom = -200;
        this.scene.add(sun);

        // Hemisphere light for sky/ground color variation
        const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x228b22, 0.3);
        this.scene.add(hemisphere);

        return { ambient, sun, hemisphere };
    }

    /**
   * Setup window resize handler
   */
    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    /**
   * Add an object to the scene
   * @param {THREE.Object3D} object
   */
    add(object) {
        this.scene.add(object);
    }

    /**
   * Remove an object from the scene
   * @param {THREE.Object3D} object
   */
    remove(object) {
        this.scene.remove(object);
    }

    /**
   * Update camera to follow a target
   * @param {Object} targetState - Target state with position and rotation
   * @param {number} distance - Follow distance
   * @param {number} height - Camera height offset
   */
    updateCamera(targetState, distance = 30, height = 10) {
        const { position, rotation } = targetState;

        // Calculate camera position behind and above the aircraft
        const cameraOffset = new THREE.Vector3(
            -Math.sin(rotation.yaw) * distance,
            height,
            -Math.cos(rotation.yaw) * distance
        );

        const targetPosition = new THREE.Vector3(position.x, position.y, position.z);
        const cameraPosition = targetPosition.clone().add(cameraOffset);

        // Smooth camera movement
        this.camera.position.lerp(cameraPosition, 0.1);
        this.camera.lookAt(targetPosition);

        // Update sun position relative to camera for consistent lighting
        this.lights.sun.position.set(
            position.x + 100,
            200,
            position.z + 100
        );
        this.lights.sun.target.position.set(position.x, position.y, position.z);
    }

    /**
   * Render the scene
   */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
   * Get the scene
   * @returns {THREE.Scene}
   */
    getScene() {
        return this.scene;
    }

    /**
   * Get the camera
   * @returns {THREE.PerspectiveCamera}
   */
    getCamera() {
        return this.camera;
    }

    /**
   * Dispose of resources
   */
    dispose() {
        this.renderer.dispose();
    }
}

export default SceneRenderer;
