/**
 * Math Utilities
 * Common mathematical operations and helpers
 */

export class MathUtils {
    /**
     * Clamp value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    /**
     * Linear interpolation
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * Smooth interpolation (smoothstep)
     * @param {number} edge0 - Lower edge
     * @param {number} edge1 - Upper edge
     * @param {number} x - Value to interpolate
     * @returns {number} Smoothed value
     */
    static smoothstep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }
    
    /**
     * Convert degrees to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     */
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }
    
    /**
     * Convert radians to degrees
     * @param {number} radians - Angle in radians
     * @returns {number} Angle in degrees
     */
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }
    
    /**
     * Map value from one range to another
     * @param {number} value - Input value
     * @param {number} inMin - Input range minimum
     * @param {number} inMax - Input range maximum
     * @param {number} outMin - Output range minimum
     * @param {number} outMax - Output range maximum
     * @returns {number} Mapped value
     */
    static map(value, inMin, inMax, inMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
    
    /**
     * Normalize angle to 0-360 range
     * @param {number} angle - Angle in degrees
     * @returns {number} Normalized angle
     */
    static normalizeAngle(angle) {
        angle = angle % 360;
        if (angle < 0) angle += 360;
        return angle;
    }
    
    /**
     * Get shortest angle difference
     * @param {number} from - Start angle
     * @param {number} to - End angle
     * @returns {number} Shortest angular difference
     */
    static angleDifference(from, to) {
        let diff = to - from;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        return diff;
    }
}

export default MathUtils;
