/**
 * Airport.js
 * Generates airport infrastructure including runways, taxiways, and buildings
 */

import * as THREE from 'three';
import { COLORS } from '../utils/constants.js';

/**
 * Airport class
 * Creates a complete airport with configurable runways and facilities
 */
export class Airport {
    /**
     * Create a new Airport
     * @param {THREE.Scene} scene - The scene to add airport objects to
     * @param {Object} config - Airport configuration
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        this.objects = [];
        
        this.position = config.position || new THREE.Vector3(0, 0, 0);
        this.runwayLength = config.runwayLength || 2000;
        this.runwayWidth = config.runwayWidth || 60;
        this.name = config.name || 'Airport';
        this.heading = config.heading || 0; // Runway heading in degrees
    }

    /**
     * Build the complete airport
     */
    build() {
        this.createRunway();
        this.createTaxiways();
        this.createApron();
        this.createTerminal();
        this.createControlTower();
        this.createHangars();
    }

    /**
     * Create the main runway with markings
     */
    createRunway() {
        // Main runway surface
        const runwayGeometry = new THREE.PlaneGeometry(this.runwayWidth, this.runwayLength);
        const runwayMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.RUNWAY_GRAY,
            roughness: 0.8
        });
        
        this.runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
        this.runway.rotation.x = -Math.PI / 2;
        this.runway.rotation.z = THREE.MathUtils.degToRad(this.heading);
        this.runway.position.copy(this.position);
        this.runway.position.y = 0.2;
        this.runway.receiveShadow = true;
        this.scene.add(this.runway);
        this.objects.push(this.runway);
        
        this.createRunwayMarkings();
    }

    /**
     * Create runway markings (centerline, thresholds)
     */
    createRunwayMarkings() {
        const markerMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.MARKER_WHITE,
            roughness: 0.9
        });
        
        // Center line markers
        const markerCount = 30;
        const markerSpacing = this.runwayLength / markerCount;
        
        for (let i = 0; i < markerCount; i++) {
            const markerGeometry = new THREE.PlaneGeometry(1, 15);
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.rotation.x = -Math.PI / 2;
            marker.rotation.z = THREE.MathUtils.degToRad(this.heading);
            
            const localZ = -this.runwayLength / 2 + markerSpacing * i + markerSpacing / 2;
            const offset = new THREE.Vector3(0, 0.3, localZ);
            offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(this.heading));
            
            marker.position.copy(this.position).add(offset);
            this.scene.add(marker);
            this.objects.push(marker);
        }
        
        // Threshold markings at both ends
        for (let side = -1; side <= 1; side += 2) {
            for (let j = 0; j < 4; j++) {
                const thresholdGeometry = new THREE.PlaneGeometry(3, 30);
                const threshold = new THREE.Mesh(thresholdGeometry, markerMaterial);
                threshold.rotation.x = -Math.PI / 2;
                threshold.rotation.z = THREE.MathUtils.degToRad(this.heading);
                
                const localPos = new THREE.Vector3(
                    side * (12 + j * 6),
                    0.3,
                    side * (this.runwayLength / 2 - 25)
                );
                localPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(this.heading));
                
                threshold.position.copy(this.position).add(localPos);
                this.scene.add(threshold);
                this.objects.push(threshold);
            }
        }
    }

    /**
     * Create taxiways connecting runway to apron
     */
    createTaxiways() {
        const taxiwayMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.8
        });
        
        // Parallel taxiway
        const taxiwayGeometry = new THREE.PlaneGeometry(20, this.runwayLength * 0.8);
        const taxiway = new THREE.Mesh(taxiwayGeometry, taxiwayMaterial);
        taxiway.rotation.x = -Math.PI / 2;
        taxiway.rotation.z = THREE.MathUtils.degToRad(this.heading);
        
        const offset = new THREE.Vector3(100, 0.15, 0);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(this.heading));
        taxiway.position.copy(this.position).add(offset);
        
        taxiway.receiveShadow = true;
        this.scene.add(taxiway);
        this.objects.push(taxiway);
    }

    /**
     * Create apron (parking area)
     */
    createApron() {
        const apronMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.7
        });
        
        const apronGeometry = new THREE.PlaneGeometry(200, 150);
        const apron = new THREE.Mesh(apronGeometry, apronMaterial);
        apron.rotation.x = -Math.PI / 2;
        
        const offset = new THREE.Vector3(150, 0.1, 400);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(this.heading));
        apron.position.copy(this.position).add(offset);
        
        apron.receiveShadow = true;
        this.scene.add(apron);
        this.objects.push(apron);
    }

    /**
     * Create terminal building
     */
    createTerminal() {
        const terminalMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.5
        });
        
        const terminalGeometry = new THREE.BoxGeometry(150, 20, 50);
        const terminal = new THREE.Mesh(terminalGeometry, terminalMaterial);
        
        const offset = new THREE.Vector3(200, 10, 500);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(this.heading));
        terminal.position.copy(this.position).add(offset);
        
        terminal.castShadow = true;
        terminal.receiveShadow = true;
        this.scene.add(terminal);
        this.objects.push(terminal);
    }

    /**
     * Create control tower
     */
    createControlTower() {
        const towerMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.BUILDING_GRAY,
            roughness: 0.7
        });
        
        const towerGeometry = new THREE.BoxGeometry(15, 40, 15);
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        
        const offset = new THREE.Vector3(200, 20, 500);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(this.heading));
        tower.position.copy(this.position).add(offset);
        
        tower.castShadow = true;
        tower.receiveShadow = true;
        this.scene.add(tower);
        this.objects.push(tower);
        
        // Tower top (glass observation deck)
        const towerTopGeometry = new THREE.BoxGeometry(20, 10, 20);
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.SKY_BLUE,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.6
        });
        const towerTop = new THREE.Mesh(towerTopGeometry, glassMaterial);
        
        const topOffset = new THREE.Vector3(200, 45, 500);
        topOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(this.heading));
        towerTop.position.copy(this.position).add(topOffset);
        
        this.scene.add(towerTop);
        this.objects.push(towerTop);
    }

    /**
     * Create hangars
     */
    createHangars() {
        const hangarMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.BUILDING_GRAY,
            roughness: 0.7
        });
        
        const hangarGeometry = new THREE.BoxGeometry(80, 25, 100);
        const hangarPositions = [
            { x: 300, z: -200 },
            { x: 300, z: 100 }
        ];
        
        hangarPositions.forEach((pos) => {
            const hangar = new THREE.Mesh(hangarGeometry, hangarMaterial);
            
            const offset = new THREE.Vector3(pos.x, 12.5, pos.z);
            offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(this.heading));
            hangar.position.copy(this.position).add(offset);
            
            hangar.castShadow = true;
            hangar.receiveShadow = true;
            this.scene.add(hangar);
            this.objects.push(hangar);
        });
    }

    /**
     * Dispose of all airport objects
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
