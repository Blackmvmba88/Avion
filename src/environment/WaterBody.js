/**
 * WaterBody.js
 * Creates water surfaces with reflection and shader effects
 */

import * as THREE from 'three';

/**
 * WaterBody class
 * Creates realistic water surfaces for oceans, lakes, and rivers
 */
export class WaterBody {
    /**
     * Create a new WaterBody
     * @param {THREE.Scene} scene - The scene to add water to
     * @param {Object} config - Water configuration
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        this.objects = [];
        
        this.size = config.size || { width: 10000, depth: 10000 };
        this.position = config.position || new THREE.Vector3(0, 0, 0);
        this.type = config.type || 'ocean'; // ocean, lake, river
        this.time = 0;
    }

    /**
     * Create the water surface
     */
    create() {
        const geometry = new THREE.PlaneGeometry(
            this.size.width,
            this.size.depth,
            64,
            64
        );

        // Create water shader material
        const waterMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterColor: { value: new THREE.Color(0x0077be) },
                foamColor: { value: new THREE.Color(0xffffff) },
                opacity: { value: 0.8 }
            },
            vertexShader: `
                uniform float time;
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Create wave motion
                    vec3 pos = position;
                    float wave1 = sin(pos.x * 0.01 + time * 0.5) * 2.0;
                    float wave2 = cos(pos.y * 0.015 + time * 0.3) * 1.5;
                    pos.z += wave1 + wave2;
                    
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 waterColor;
                uniform vec3 foamColor;
                uniform float opacity;
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUv;

                void main() {
                    // Simple water color with fresnel-like effect
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.0);
                    
                    vec3 color = mix(waterColor, foamColor, fresnel * 0.3);
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.water = new THREE.Mesh(geometry, waterMaterial);
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.copy(this.position);
        this.water.receiveShadow = true;
        
        this.scene.add(this.water);
        this.objects.push(this.water);

        return this.water;
    }

    /**
     * Update water animation
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        if (!this.water) return;
        
        this.time += deltaTime;
        if (this.water.material.uniforms) {
            this.water.material.uniforms.time.value = this.time;
        }
    }

    /**
     * Dispose of all water objects
     */
    dispose() {
        this.objects.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
            this.scene.remove(obj);
        });
        this.objects = [];
    }
}
