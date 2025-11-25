import * as THREE from 'three';

/**
 * Sky - Creates a sky dome with gradient colors
 */
export class Sky {
  constructor() {
    this.mesh = this.createSky();
  }

  /**
   * Create the sky dome
   * @returns {THREE.Mesh}
   */
  createSky() {
    const geometry = new THREE.SphereGeometry(5000, 32, 32);

    // Create gradient shader material for sky
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 vWorldPosition;
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `;

    const uniforms = {
      topColor: { value: new THREE.Color(0x0077ff) },
      bottomColor: { value: new THREE.Color(0xaaddff) },
      offset: { value: 400 },
      exponent: { value: 0.6 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.BackSide,
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Get the mesh for adding to scene
   * @returns {THREE.Mesh}
   */
  getObject3D() {
    return this.mesh;
  }

  /**
   * Update sky position to follow camera
   * @param {THREE.Vector3} position
   */
  updatePosition(position) {
    this.mesh.position.set(position.x, 0, position.z);
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

export default Sky;
