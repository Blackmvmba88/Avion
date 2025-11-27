import * as THREE from 'three';

/**
 * Terrain - Creates a simple ground plane with grid
 */
export class Terrain {
    constructor() {
        this.group = this.createTerrain();
    }

    /**
   * Create the terrain
   * @returns {THREE.Group}
   */
    createTerrain() {
        const group = new THREE.Group();

        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(10000, 10000);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x228b22, // Forest green
            side: THREE.DoubleSide,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        group.add(ground);

        // Grid helper for visual reference
        const gridHelper = new THREE.GridHelper(10000, 100, 0x444444, 0x666666);
        gridHelper.position.y = 0.1;
        group.add(gridHelper);

        // Add some simple trees (cones) for visual reference
        const treeCount = 100;
        for (let i = 0; i < treeCount; i++) {
            const tree = this.createTree();
            tree.position.set(
                (Math.random() - 0.5) * 2000,
                0,
                (Math.random() - 0.5) * 2000
            );
            group.add(tree);
        }

        return group;
    }

    /**
   * Create a simple tree model
   * @returns {THREE.Group}
   */
    createTree() {
        const tree = new THREE.Group();

        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(2, 3, 20, 6);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 10;
        trunk.castShadow = true;
        tree.add(trunk);

        // Foliage (cone)
        const foliageGeometry = new THREE.ConeGeometry(15, 40, 8);
        const foliageMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 40;
        foliage.castShadow = true;
        tree.add(foliage);

        // Random scale variation
        const scale = 0.5 + Math.random() * 1;
        tree.scale.set(scale, scale, scale);

        return tree;
    }

    /**
   * Get the group for adding to scene
   * @returns {THREE.Group}
   */
    getObject3D() {
        return this.group;
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

export default Terrain;
