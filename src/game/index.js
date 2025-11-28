/**
 * Game Module Index
 * Exports game-specific components
 * Phase 5: Gameplay Features
 */

// Mission System
export { 
    Mission, 
    MissionObjective, 
    MissionStatus, 
    ObjectiveType 
} from './missions/index.js';
export { MissionManager } from './missions/index.js';
export { createSampleMissions } from './missions/index.js';

// Waypoint Navigation
export { 
    Waypoint, 
    WaypointType 
} from './navigation/index.js';
export { 
    WaypointNavigation, 
    FlightPlanStatus 
} from './navigation/index.js';

// UI Components
export { InstrumentPanel } from './ui/index.js';

// Multiplayer
export { 
    MultiplayerManager, 
    PlayerState, 
    RoomState, 
    MultiplayerMessageType 
} from './multiplayer/index.js';

// Achievements and Scoring
export { 
    AchievementSystem, 
    Achievement, 
    AchievementCategory, 
    AchievementRarity 
} from './save/index.js';
export { 
    ScoreManager, 
    ScoreEntry, 
    SessionStats, 
    ScoreEventType 
} from './save/index.js';
export { createDefaultAchievements } from './save/index.js';

export default {};
