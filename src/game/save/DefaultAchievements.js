/**
 * DefaultAchievements.js
 * Default achievements for the flight simulator.
 */

import { AchievementCategory, AchievementRarity } from './AchievementSystem.js';

/**
 * Create default achievements
 * @returns {Array} Array of achievement configurations
 */
export function createDefaultAchievements() {
    return [
        // Flight achievements
        {
            id: 'first_flight',
            name: 'First Flight',
            description: 'Take off for the first time.',
            category: AchievementCategory.FLIGHT,
            rarity: AchievementRarity.COMMON,
            icon: '🛫',
            points: 10,
            condition: (ctx) => ctx.stats?.takeoffs >= 1
        },
        {
            id: 'frequent_flyer',
            name: 'Frequent Flyer',
            description: 'Complete 10 takeoffs.',
            category: AchievementCategory.FLIGHT,
            rarity: AchievementRarity.UNCOMMON,
            icon: '✈️',
            points: 50,
            requiresProgress: true,
            maxProgress: 10
        },
        {
            id: 'sky_high',
            name: 'Sky High',
            description: 'Reach an altitude of 5000 meters.',
            category: AchievementCategory.FLIGHT,
            rarity: AchievementRarity.UNCOMMON,
            icon: '🌤️',
            points: 100,
            condition: (ctx) => ctx.altitude >= 5000
        },
        {
            id: 'touching_space',
            name: 'Touching Space',
            description: 'Reach an altitude of 15000 meters.',
            category: AchievementCategory.FLIGHT,
            rarity: AchievementRarity.RARE,
            icon: '🚀',
            points: 300,
            condition: (ctx) => ctx.altitude >= 15000
        },
        {
            id: 'speed_demon',
            name: 'Speed Demon',
            description: 'Exceed 500 m/s airspeed.',
            category: AchievementCategory.FLIGHT,
            rarity: AchievementRarity.RARE,
            icon: '💨',
            points: 200,
            condition: (ctx) => ctx.speed >= 500
        },
        {
            id: 'marathon_pilot',
            name: 'Marathon Pilot',
            description: 'Fly for a total of 1 hour.',
            category: AchievementCategory.FLIGHT,
            rarity: AchievementRarity.UNCOMMON,
            icon: '⏱️',
            points: 150,
            requiresProgress: true,
            maxProgress: 3600 // seconds
        },
        {
            id: 'endurance_expert',
            name: 'Endurance Expert',
            description: 'Fly for a total of 10 hours.',
            category: AchievementCategory.FLIGHT,
            rarity: AchievementRarity.EPIC,
            icon: '🏅',
            points: 500,
            requiresProgress: true,
            maxProgress: 36000 // seconds
        },

        // Navigation achievements
        {
            id: 'navigator',
            name: 'Navigator',
            description: 'Reach your first waypoint.',
            category: AchievementCategory.NAVIGATION,
            rarity: AchievementRarity.COMMON,
            icon: '🧭',
            points: 20,
            condition: (ctx) => ctx.stats?.waypointsReached >= 1
        },
        {
            id: 'pathfinder',
            name: 'Pathfinder',
            description: 'Reach 50 waypoints.',
            category: AchievementCategory.NAVIGATION,
            rarity: AchievementRarity.RARE,
            icon: '🗺️',
            points: 200,
            requiresProgress: true,
            maxProgress: 50
        },
        {
            id: 'world_traveler',
            name: 'World Traveler',
            description: 'Travel a total distance of 1000 km.',
            category: AchievementCategory.NAVIGATION,
            rarity: AchievementRarity.EPIC,
            icon: '🌍',
            points: 400,
            requiresProgress: true,
            maxProgress: 1000000 // meters
        },

        // Mission achievements
        {
            id: 'mission_accomplished',
            name: 'Mission Accomplished',
            description: 'Complete your first mission.',
            category: AchievementCategory.MISSIONS,
            rarity: AchievementRarity.COMMON,
            icon: '✅',
            points: 50,
            condition: (ctx) => ctx.stats?.missionsCompleted >= 1
        },
        {
            id: 'mission_master',
            name: 'Mission Master',
            description: 'Complete 10 missions.',
            category: AchievementCategory.MISSIONS,
            rarity: AchievementRarity.UNCOMMON,
            icon: '🎖️',
            points: 200,
            requiresProgress: true,
            maxProgress: 10
        },
        {
            id: 'perfectionist',
            name: 'Perfectionist',
            description: 'Complete a mission without any penalties.',
            category: AchievementCategory.MISSIONS,
            rarity: AchievementRarity.RARE,
            icon: '💎',
            points: 300,
            condition: (ctx) => ctx.missionPerfect === true
        },

        // Skill achievements
        {
            id: 'smooth_landing',
            name: 'Smooth Landing',
            description: 'Perform your first landing.',
            category: AchievementCategory.SKILL,
            rarity: AchievementRarity.COMMON,
            icon: '🛬',
            points: 30,
            condition: (ctx) => ctx.stats?.landings >= 1
        },
        {
            id: 'butter_landing',
            name: 'Butter Landing',
            description: 'Perform a perfect landing.',
            category: AchievementCategory.SKILL,
            rarity: AchievementRarity.RARE,
            icon: '🧈',
            points: 250,
            condition: (ctx) => ctx.landingQuality === 'perfect'
        },
        {
            id: 'stall_recovery',
            name: 'Stall Recovery',
            description: 'Successfully recover from a stall.',
            category: AchievementCategory.SKILL,
            rarity: AchievementRarity.UNCOMMON,
            icon: '↩️',
            points: 100,
            condition: (ctx) => ctx.stats?.stallRecoveries >= 1
        },
        {
            id: 'ace_pilot',
            name: 'Ace Pilot',
            description: 'Achieve a combo of 20 or more.',
            category: AchievementCategory.SKILL,
            rarity: AchievementRarity.RARE,
            icon: '⭐',
            points: 200,
            condition: (ctx) => ctx.combo >= 20
        },
        {
            id: 'high_scorer',
            name: 'High Scorer',
            description: 'Score 10,000 points in a single session.',
            category: AchievementCategory.SKILL,
            rarity: AchievementRarity.UNCOMMON,
            icon: '🏆',
            points: 150,
            condition: (ctx) => ctx.sessionScore >= 10000
        },
        {
            id: 'legend',
            name: 'Legend',
            description: 'Score 100,000 points in a single session.',
            category: AchievementCategory.SKILL,
            rarity: AchievementRarity.LEGENDARY,
            icon: '👑',
            points: 1000,
            condition: (ctx) => ctx.sessionScore >= 100000
        },

        // Exploration achievements
        {
            id: 'low_flyer',
            name: 'Low Flyer',
            description: 'Fly below 50 meters for 30 seconds.',
            category: AchievementCategory.EXPLORATION,
            rarity: AchievementRarity.UNCOMMON,
            icon: '🌾',
            points: 100,
            requiresProgress: true,
            maxProgress: 30
        },
        {
            id: 'inverted_pilot',
            name: 'Inverted Pilot',
            description: 'Fly inverted (upside down) for 10 seconds.',
            category: AchievementCategory.EXPLORATION,
            rarity: AchievementRarity.RARE,
            icon: '🙃',
            points: 200,
            requiresProgress: true,
            maxProgress: 10
        },

        // Multiplayer achievements
        {
            id: 'social_pilot',
            name: 'Social Pilot',
            description: 'Join a multiplayer session.',
            category: AchievementCategory.MULTIPLAYER,
            rarity: AchievementRarity.COMMON,
            icon: '👥',
            points: 50,
            condition: (ctx) => ctx.multiplayerJoined === true
        },
        {
            id: 'host_master',
            name: 'Host Master',
            description: 'Host a multiplayer session with 4+ players.',
            category: AchievementCategory.MULTIPLAYER,
            rarity: AchievementRarity.RARE,
            icon: '🎯',
            points: 200,
            condition: (ctx) => ctx.isHost && ctx.playerCount >= 4
        },

        // Secret achievements
        {
            id: 'secret_barrel_roll',
            name: 'Do a Barrel Roll!',
            description: 'Perform a full barrel roll.',
            category: AchievementCategory.SECRET,
            rarity: AchievementRarity.EPIC,
            icon: '🌀',
            points: 500,
            hidden: true,
            condition: (ctx) => ctx.barrelRoll === true
        },
        {
            id: 'secret_altitude',
            name: 'Near Space',
            description: 'Reach the edge of space at 25,000 meters.',
            category: AchievementCategory.SECRET,
            rarity: AchievementRarity.LEGENDARY,
            icon: '🌌',
            points: 1000,
            hidden: true,
            condition: (ctx) => ctx.altitude >= 25000
        }
    ];
}

export default { createDefaultAchievements };
