/**
 * English Translations
 */

export const en = {
    common: {
        loading: 'Loading...',
        error: 'Error',
        ok: 'OK',
        cancel: 'Cancel',
        save: 'Save',
        reset: 'Reset',
        close: 'Close'
    },
    
    hud: {
        altitude: 'Altitude',
        speed: 'Speed',
        throttle: 'Throttle',
        heading: 'Heading',
        pitch: 'Pitch',
        roll: 'Roll',
        fps: 'FPS',
        stall: 'STALL WARNING'
    },
    
    controls: {
        pitchUp: 'Pitch Up',
        pitchDown: 'Pitch Down',
        rollLeft: 'Roll Left',
        rollRight: 'Roll Right',
        yawLeft: 'Yaw Left',
        yawRight: 'Yaw Right',
        increaseThrottle: 'Increase Throttle',
        decreaseThrottle: 'Decrease Throttle',
        pause: 'Pause',
        resetCamera: 'Reset Camera',
        resetAircraft: 'Reset Aircraft'
    },
    
    menu: {
        resume: 'Resume',
        settings: 'Settings',
        controls: 'Controls',
        graphics: 'Graphics',
        audio: 'Audio',
        language: 'Language',
        mainMenu: 'Main Menu',
        quit: 'Quit'
    },
    
    settings: {
        quality: {
            title: 'Graphics Quality',
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            ultra: 'Ultra'
        },
        shadows: 'Shadows',
        antialiasing: 'Anti-aliasing',
        postProcessing: 'Post Processing',
        fov: 'Field of View',
        sensitivity: 'Mouse Sensitivity'
    },
    
    game: {
        paused: 'Paused',
        crashed: 'Aircraft Crashed',
        landing: 'Landing',
        takeoff: 'Taking Off',
        flying: 'Flying'
    },
    
    network: {
        connecting: 'Connecting to server...',
        connected: 'Connected',
        disconnected: 'Disconnected',
        reconnecting: 'Reconnecting...',
        connectionLost: 'Connection lost',
        connectionError: 'Connection error'
    },

    // Phase 5: Gameplay Features translations
    missions: {
        title: 'Missions',
        available: 'Available Missions',
        active: 'Active Mission',
        completed: 'Completed',
        failed: 'Failed',
        pending: 'Pending',
        objective: 'Objective',
        objectives: 'Objectives',
        progress: 'Progress',
        timeRemaining: 'Time Remaining',
        start: 'Start Mission',
        abort: 'Abort Mission',
        retry: 'Retry',
        complete: 'Mission Complete!',
        failedMessage: 'Mission Failed',
        difficulty: 'Difficulty',
        rewards: 'Rewards',
        score: 'Score'
    },

    navigation: {
        title: 'Navigation',
        waypoint: 'Waypoint',
        waypoints: 'Waypoints',
        distance: 'Distance',
        bearing: 'Bearing',
        eta: 'ETA',
        next: 'Next Waypoint',
        current: 'Current Waypoint',
        reached: 'Waypoint Reached',
        flightPlan: 'Flight Plan',
        clearRoute: 'Clear Route',
        addWaypoint: 'Add Waypoint',
        removeWaypoint: 'Remove Waypoint',
        directTo: 'Direct To'
    },

    instruments: {
        title: 'Instruments',
        airspeed: 'Airspeed',
        altitude: 'Altitude',
        verticalSpeed: 'Vertical Speed',
        attitude: 'Attitude',
        compass: 'Compass',
        engine: 'Engine',
        fuel: 'Fuel',
        gForce: 'G-Force',
        flaps: 'Flaps',
        gear: 'Landing Gear',
        autopilot: 'Autopilot'
    },

    multiplayer: {
        title: 'Multiplayer',
        lobby: 'Lobby',
        room: 'Room',
        players: 'Players',
        host: 'Host',
        join: 'Join',
        leave: 'Leave',
        create: 'Create Room',
        kick: 'Kick Player',
        chat: 'Chat',
        ready: 'Ready',
        start: 'Start Game',
        waiting: 'Waiting for players...',
        playerJoined: '{name} joined',
        playerLeft: '{name} left',
        youAreHost: 'You are the host',
        kicked: 'You were kicked from the room'
    },

    achievements: {
        title: 'Achievements',
        unlocked: 'Unlocked!',
        locked: 'Locked',
        progress: 'Progress',
        points: 'Points',
        category: 'Category',
        rarity: {
            common: 'Common',
            uncommon: 'Uncommon',
            rare: 'Rare',
            epic: 'Epic',
            legendary: 'Legendary'
        },
        categories: {
            flight: 'Flight',
            navigation: 'Navigation',
            missions: 'Missions',
            skill: 'Skill',
            exploration: 'Exploration',
            multiplayer: 'Multiplayer',
            secret: 'Secret'
        }
    },

    scoring: {
        title: 'Score',
        current: 'Current Score',
        highScore: 'High Score',
        multiplier: 'Multiplier',
        combo: 'Combo',
        points: 'Points',
        bonus: 'Bonus',
        penalty: 'Penalty',
        total: 'Total',
        session: 'Session Stats',
        lifetime: 'Lifetime Stats'
    }
};

export default en;
