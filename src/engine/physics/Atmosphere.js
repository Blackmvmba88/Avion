/**
 * Atmosphere Model
 * Calculates air density and temperature based on altitude
 */

export class Atmosphere {
    constructor() {
        this.seaLevelDensity = 1.225;      // kg/m³
        this.scaleHeight = 8500;            // m
        this.seaLevelTemp = 288.15;        // K (15°C)
        this.lapseRate = 0.0065;           // K/m
    }
    
    /**
     * Get air density at altitude
     * @param {number} altitude - Altitude in meters
     * @returns {number} Air density in kg/m³
     */
    getDensity(altitude) {
        return this.seaLevelDensity * Math.exp(-altitude / this.scaleHeight);
    }
    
    /**
     * Get temperature at altitude
     * @param {number} altitude - Altitude in meters
     * @returns {number} Temperature in Kelvin
     */
    getTemperature(altitude) {
        return this.seaLevelTemp - this.lapseRate * altitude;
    }
    
    /**
     * Get pressure at altitude
     * @param {number} altitude - Altitude in meters
     * @returns {number} Pressure in Pa
     */
    getPressure(altitude) {
        const temp = this.getTemperature(altitude);
        const tempRatio = temp / this.seaLevelTemp;
        return 101325 * Math.pow(tempRatio, 5.255);
    }
}

export default Atmosphere;
