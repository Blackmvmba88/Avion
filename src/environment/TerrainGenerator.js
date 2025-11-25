/**
 * TerrainGenerator.js
 * Generates terrain with heightmaps using procedural noise
 */

import * as THREE from 'three';

/**
 * Simple Perlin-like noise implementation for terrain generation
 */
class SimplexNoise {
    constructor(seed = 0) {
        this.seed = seed;
        this.perm = this.buildPermutationTable();
    }

    buildPermutationTable() {
        const p = [];
        for (let i = 0; i < 256; i++) {
            p[i] = Math.floor(this.random() * 256);
        }
        return [...p, ...p];
    }

    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }

    noise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const a = this.perm[X] + Y;
        const aa = this.perm[a];
        const ab = this.perm[a + 1];
        const b = this.perm[X + 1] + Y;
        const ba = this.perm[b];
        const bb = this.perm[b + 1];

        return this.lerp(v,
            this.lerp(u, this.grad(this.perm[aa], x, y), this.grad(this.perm[ba], x - 1, y)),
            this.lerp(u, this.grad(this.perm[ab], x, y - 1), this.grad(this.perm[bb], x - 1, y - 1))
        );
    }

    octaveNoise(x, y, octaves = 4, persistence = 0.5) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            total += this.noise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }

        return total / maxValue;
    }
}

/**
 * TerrainGenerator class
 * Generates terrain meshes with height variations
 */
export class TerrainGenerator {
    /**
     * Create a new TerrainGenerator
     * @param {Object} config - Terrain configuration
     */
    constructor(config = {}) {
        this.width = config.width || 10000;
        this.depth = config.depth || 10000;
        this.segments = config.segments || 128;
        this.maxHeight = config.maxHeight || 300;
        this.seed = config.seed || Math.random() * 1000;
        this.noise = new SimplexNoise(this.seed);
    }

    /**
     * Generate a terrain mesh with heightmap
     * @returns {THREE.Mesh} The terrain mesh
     */
    generate() {
        const geometry = new THREE.PlaneGeometry(
            this.width,
            this.depth,
            this.segments,
            this.segments
        );

        const vertices = geometry.attributes.position.array;

        // Apply height based on noise
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 1];

            // Use octave noise for more natural terrain
            const height = this.noise.octaveNoise(
                x / 1000,
                z / 1000,
                5,
                0.5
            ) * this.maxHeight;

            vertices[i + 2] = height;
        }

        // Recalculate normals for proper lighting
        geometry.computeVertexNormals();

        // Create material with vertex colors based on height
        const material = new THREE.MeshStandardMaterial({
            color: 0x3d5c3d,
            roughness: 0.9,
            metalness: 0.0,
            vertexColors: false,
            side: THREE.DoubleSide
        });

        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;

        return terrain;
    }

    /**
     * Get height at a specific world position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {number} Height at position
     */
    getHeightAt(x, z) {
        return this.noise.octaveNoise(x / 1000, z / 1000, 5, 0.5) * this.maxHeight;
    }
}
