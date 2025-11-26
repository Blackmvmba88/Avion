import * as THREE from 'three';

/**
 * BasicPlane - Creates a simple aircraft 3D model using Three.js primitives
 */
export class BasicPlane {
  constructor() {
    this.config = {
      mass: 5000, // kg
      maxThrust: 50000, // N
      wingArea: 20, // m^2
      dragCoefficient: 0.02,
    };

    this.group = this.createModel();
  }

  /**
   * Create the 3D model of the aircraft
   * @returns {THREE.Group} The aircraft 3D group
   */
  createModel() {
    const group = new THREE.Group();

    // Fuselage (main body)
    const fuselageGeometry = new THREE.CylinderGeometry(0.5, 0.3, 8, 8);
    const fuselageMaterial = new THREE.MeshPhongMaterial({ color: 0x4488cc });
    const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.rotation.x = Math.PI / 2;
    group.add(fuselage);

    // Nose cone
    const noseGeometry = new THREE.ConeGeometry(0.3, 1.5, 8);
    const noseMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = 4.75;
    group.add(nose);

    // Main wings
    const wingGeometry = new THREE.BoxGeometry(12, 0.1, 2);
    const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x4488cc });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.z = -0.5;
    group.add(wings);

    // Horizontal stabilizer (tail wings)
    const stabilizerGeometry = new THREE.BoxGeometry(4, 0.08, 0.8);
    const stabilizerMaterial = new THREE.MeshPhongMaterial({ color: 0x4488cc });
    const stabilizer = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial);
    stabilizer.position.z = -3.5;
    group.add(stabilizer);

    // Vertical stabilizer (tail fin)
    const finGeometry = new THREE.BoxGeometry(0.1, 1.5, 1);
    const finMaterial = new THREE.MeshPhongMaterial({ color: 0x4488cc });
    const fin = new THREE.Mesh(finGeometry, finMaterial);
    fin.position.set(0, 0.75, -3.5);
    group.add(fin);

    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.4, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshPhongMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.7,
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.3, 2);
    group.add(cockpit);

    // Engine exhausts
    const exhaustGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.5, 6);
    const exhaustMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

    const exhaustLeft = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaustLeft.rotation.x = Math.PI / 2;
    exhaustLeft.position.set(-1.5, 0, -4.25);
    group.add(exhaustLeft);

    const exhaustRight = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaustRight.rotation.x = Math.PI / 2;
    exhaustRight.position.set(1.5, 0, -4.25);
    group.add(exhaustRight);

    // Add shadows
    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return group;
  }

  /**
   * Get the 3D group for adding to scene
   * @returns {THREE.Group}
   */
  getObject3D() {
    return this.group;
  }

  /**
   * Get aircraft configuration for physics
   * @returns {Object}
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update aircraft position and rotation
   * @param {Object} state - Physics state { position, rotation }
   */
  updateFromState(state) {
    const { position, rotation } = state;

    this.group.position.set(position.x, position.y, position.z);
    this.group.rotation.set(rotation.pitch, rotation.yaw, rotation.roll);
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
  }
}

export default BasicPlane;
