/**
 * SampleMissions.js
 * Sample missions for the flight simulator demonstrating the mission system.
 */

import { Mission, ObjectiveType } from './Mission.js';

/**
 * Create sample missions for the game
 * @returns {Mission[]}
 */
export function createSampleMissions() {
    const missions = [];

    // Mission 1: Basic Takeoff
    const takeoffMission = new Mission({
        id: 'mission_01_takeoff',
        name: 'First Flight',
        description: 'Take off from the runway and reach a safe altitude.',
        difficulty: 1,
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: { pitch: 0, roll: 0, yaw: 0 },
        timeLimit: 300, // 5 minutes
        objectives: [
            {
                id: 'obj_takeoff',
                type: ObjectiveType.TAKEOFF,
                description: 'Take off from the runway',
                target: { altitude: 50 },
                rewards: { score: 100 }
            },
            {
                id: 'obj_altitude',
                type: ObjectiveType.REACH_ALTITUDE,
                description: 'Climb to 500 meters',
                target: { altitude: 500 },
                tolerance: 50,
                rewards: { score: 200 }
            }
        ]
    });
    missions.push(takeoffMission);

    // Mission 2: Waypoint Navigation
    const waypointMission = new Mission({
        id: 'mission_02_navigation',
        name: 'Navigation Training',
        description: 'Practice waypoint navigation by flying through a series of checkpoints.',
        difficulty: 2,
        startPosition: { x: 0, y: 200, z: 0 },
        startRotation: { pitch: 0, roll: 0, yaw: 0 },
        timeLimit: 600, // 10 minutes
        objectives: [
            {
                id: 'obj_wp1',
                type: ObjectiveType.FLY_THROUGH,
                description: 'Fly through checkpoint Alpha',
                target: { position: { x: 1000, y: 200, z: 0 } },
                tolerance: 100,
                rewards: { score: 150 }
            },
            {
                id: 'obj_wp2',
                type: ObjectiveType.FLY_THROUGH,
                description: 'Fly through checkpoint Bravo',
                target: { position: { x: 1000, y: 300, z: 1000 } },
                tolerance: 100,
                rewards: { score: 150 }
            },
            {
                id: 'obj_wp3',
                type: ObjectiveType.FLY_THROUGH,
                description: 'Fly through checkpoint Charlie',
                target: { position: { x: 0, y: 400, z: 1000 } },
                tolerance: 100,
                rewards: { score: 150 }
            },
            {
                id: 'obj_return',
                type: ObjectiveType.REACH_WAYPOINT,
                description: 'Return to starting area',
                target: { position: { x: 0, y: 200, z: 0 } },
                tolerance: 200,
                rewards: { score: 200 }
            }
        ]
    });
    missions.push(waypointMission);

    // Mission 3: Landing Practice
    const landingMission = new Mission({
        id: 'mission_03_landing',
        name: 'Landing Practice',
        description: 'Practice landing your aircraft at the designated runway.',
        difficulty: 3,
        startPosition: { x: -2000, y: 300, z: 0 },
        startRotation: { pitch: 0, roll: 0, yaw: 90 * (Math.PI / 180) },
        timeLimit: 480, // 8 minutes
        objectives: [
            {
                id: 'obj_approach',
                type: ObjectiveType.REACH_WAYPOINT,
                description: 'Reach the approach waypoint',
                target: { position: { x: -500, y: 100, z: 0 } },
                tolerance: 150,
                rewards: { score: 100 }
            },
            {
                id: 'obj_land',
                type: ObjectiveType.LAND_AT_AIRPORT,
                description: 'Land safely on the runway',
                target: { position: { x: 0, y: 0, z: 0 } },
                tolerance: 50,
                rewards: { score: 500 }
            }
        ]
    });
    missions.push(landingMission);

    // Mission 4: Altitude Challenge
    const altitudeMission = new Mission({
        id: 'mission_04_altitude',
        name: 'Altitude Challenge',
        description: 'Test your climbing skills by reaching various altitudes.',
        difficulty: 2,
        startPosition: { x: 0, y: 100, z: 0 },
        timeLimit: 420, // 7 minutes
        objectives: [
            {
                id: 'obj_alt1',
                type: ObjectiveType.REACH_ALTITUDE,
                description: 'Climb to 1000 meters',
                target: { altitude: 1000 },
                tolerance: 100,
                rewards: { score: 200 }
            },
            {
                id: 'obj_alt2',
                type: ObjectiveType.REACH_ALTITUDE,
                description: 'Climb to 2000 meters',
                target: { altitude: 2000 },
                tolerance: 100,
                rewards: { score: 300 }
            },
            {
                id: 'obj_alt3',
                type: ObjectiveType.REACH_ALTITUDE,
                description: 'Reach maximum altitude of 3000 meters',
                target: { altitude: 3000 },
                tolerance: 150,
                rewards: { score: 500 }
            }
        ]
    });
    missions.push(altitudeMission);

    // Mission 5: Survival Flight
    const survivalMission = new Mission({
        id: 'mission_05_survival',
        name: 'Survival Flight',
        description: 'Keep flying for as long as possible without crashing.',
        difficulty: 1,
        startPosition: { x: 0, y: 200, z: 0 },
        objectives: [
            {
                id: 'obj_survive_30',
                type: ObjectiveType.SURVIVE_TIME,
                description: 'Fly for 30 seconds',
                target: { duration: 30 },
                rewards: { score: 100 }
            },
            {
                id: 'obj_survive_60',
                type: ObjectiveType.SURVIVE_TIME,
                description: 'Fly for 1 minute',
                target: { duration: 60 },
                rewards: { score: 200 }
            },
            {
                id: 'obj_survive_120',
                type: ObjectiveType.SURVIVE_TIME,
                description: 'Fly for 2 minutes',
                target: { duration: 120 },
                rewards: { score: 300 }
            },
            {
                id: 'obj_survive_180',
                type: ObjectiveType.SURVIVE_TIME,
                description: 'Fly for 3 minutes',
                target: { duration: 180 },
                rewards: { score: 500 },
                optional: true
            }
        ]
    });
    missions.push(survivalMission);

    // Mission 6: Circuit Training
    const circuitMission = new Mission({
        id: 'mission_06_circuit',
        name: 'Circuit Training',
        description: 'Complete a standard traffic pattern around the airfield.',
        difficulty: 3,
        startPosition: { x: 0, y: 50, z: 0 },
        timeLimit: 600,
        objectives: [
            {
                id: 'obj_takeoff',
                type: ObjectiveType.TAKEOFF,
                description: 'Take off',
                target: { altitude: 100 },
                rewards: { score: 100 }
            },
            {
                id: 'obj_crosswind',
                type: ObjectiveType.REACH_WAYPOINT,
                description: 'Turn to crosswind leg',
                target: { position: { x: 500, y: 300, z: 500 } },
                tolerance: 150,
                rewards: { score: 150 }
            },
            {
                id: 'obj_downwind',
                type: ObjectiveType.REACH_WAYPOINT,
                description: 'Fly downwind leg',
                target: { position: { x: 500, y: 300, z: -500 } },
                tolerance: 150,
                rewards: { score: 150 }
            },
            {
                id: 'obj_base',
                type: ObjectiveType.REACH_WAYPOINT,
                description: 'Turn to base leg',
                target: { position: { x: -200, y: 200, z: -500 } },
                tolerance: 150,
                rewards: { score: 150 }
            },
            {
                id: 'obj_final',
                type: ObjectiveType.REACH_WAYPOINT,
                description: 'Turn to final approach',
                target: { position: { x: -500, y: 100, z: 0 } },
                tolerance: 150,
                rewards: { score: 150 }
            },
            {
                id: 'obj_landing',
                type: ObjectiveType.LAND_AT_AIRPORT,
                description: 'Land on runway',
                target: { position: { x: 0, y: 0, z: 0 } },
                tolerance: 75,
                rewards: { score: 400 }
            }
        ]
    });
    missions.push(circuitMission);

    return missions;
}

export default { createSampleMissions };
