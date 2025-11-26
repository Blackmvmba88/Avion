/**
 * Ground Effect Physics
 * Simulates increased lift and reduced drag near the ground
 */

export class GroundEffect {
    /**
     * Calculate ground effect factor
     * @param {number} altitude - Height above ground (m)
     * @param {number} wingspan - Aircraft wingspan (m)
     * @returns {Object} {liftIncrease, dragReduction}
     */
    static calculate(altitude, wingspan) {
        if (altitude > wingspan * 2) {
            return { liftIncrease: 0, dragReduction: 0 };
        }
        
        const heightRatio = altitude / wingspan;
        const factor = 1 / (1 + Math.pow(heightRatio / 0.15, 2));
        
        return {
            liftIncrease: factor * 0.25,      // Up to 25% lift increase
            dragReduction: factor * 0.15      // Up to 15% drag reduction
        };
    }
}

export default GroundEffect;
