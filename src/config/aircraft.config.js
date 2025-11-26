/**
 * Aircraft Configuration
 * Default parameters for different aircraft types
 */

export const AIRCRAFT_CONFIG = {
    // Basic Jet - Tutorial aircraft
    basicJet: {
        name: 'Basic Jet',
        physics: {
            mass: 5000,                 // kg
            wingArea: 20,               // m²
            wingSpan: 10,               // m
            aspectRatio: 5,             // wingspan² / wingArea
            maxThrust: 50000,           // N
            dragCoefficient: 0.02,      // Parasitic drag
            liftCoefficientSlope: 0.08, // per degree
            liftCoefficientZero: 0.3,
            maxLiftCoefficient: 1.2,
            stallAngle: 15,             // degrees
            oswaldEfficiency: 0.8,
            maxSpeed: 250,              // m/s
            stallSpeed: 40,             // m/s
            climbRate: 20               // m/s
        },
        visual: {
            color: 0x3498db,
            scale: 1.0,
            modelPath: 'models/basicjet.glb'
        },
        controls: {
            pitchAuthority: 1.0,
            rollAuthority: 2.0,
            yawAuthority: 0.5
        }
    },
    
    // Cessna 172 - General aviation
    cessna172: {
        name: 'Cessna 172 Skyhawk',
        physics: {
            mass: 1110,
            wingArea: 16.2,
            wingSpan: 11.0,
            aspectRatio: 7.52,
            maxThrust: 1400,
            dragCoefficient: 0.027,
            liftCoefficientSlope: 0.09,
            liftCoefficientZero: 0.4,
            maxLiftCoefficient: 1.5,
            stallAngle: 16,
            oswaldEfficiency: 0.85,
            maxSpeed: 70,
            stallSpeed: 24,
            climbRate: 4.2
        },
        visual: {
            color: 0xffffff,
            scale: 0.8,
            modelPath: 'models/cessna172.glb'
        },
        controls: {
            pitchAuthority: 0.6,
            rollAuthority: 1.0,
            yawAuthority: 0.4
        },
        features: {
            propellerDriven: true,
            landingGear: true,
            flaps: true
        }
    },
    
    // F-22 Raptor - Fighter jet
    f22: {
        name: 'F-22 Raptor',
        physics: {
            mass: 19700,
            wingArea: 78.04,
            wingSpan: 13.56,
            aspectRatio: 2.36,
            maxThrust: 311200,          // With afterburner
            cruiseThrust: 186720,       // Military power
            dragCoefficient: 0.015,
            liftCoefficientSlope: 0.07,
            liftCoefficientZero: 0.2,
            maxLiftCoefficient: 1.8,
            stallAngle: 20,
            oswaldEfficiency: 0.75,
            maxSpeed: 600,              // ~Mach 1.8
            stallSpeed: 45,
            climbRate: 65
        },
        visual: {
            color: 0x2c3e50,
            scale: 1.5,
            modelPath: 'models/f22.glb'
        },
        controls: {
            pitchAuthority: 1.5,
            rollAuthority: 3.0,
            yawAuthority: 1.0
        },
        features: {
            afterburner: true,
            vectoredThrust: true,
            supercruise: true,
            advancedAvionics: true
        }
    },
    
    // Boeing 747 - Commercial airliner
    boeing747: {
        name: 'Boeing 747-400',
        physics: {
            mass: 178800,               // Empty weight
            wingArea: 511,
            wingSpan: 64.4,
            aspectRatio: 8.1,
            maxThrust: 1120000,         // 4 engines combined
            dragCoefficient: 0.031,
            liftCoefficientSlope: 0.085,
            liftCoefficientZero: 0.35,
            maxLiftCoefficient: 2.0,
            stallAngle: 14,
            oswaldEfficiency: 0.85,
            maxSpeed: 258,              // ~Mach 0.85
            stallSpeed: 75,
            climbRate: 8.5
        },
        visual: {
            color: 0xcccccc,
            scale: 3.0,
            modelPath: 'models/boeing747.glb'
        },
        controls: {
            pitchAuthority: 0.4,
            rollAuthority: 0.3,
            yawAuthority: 0.3
        },
        features: {
            multiEngine: true,
            landingGear: true,
            flaps: true,
            autoThrottle: true
        }
    }
};

export default AIRCRAFT_CONFIG;
