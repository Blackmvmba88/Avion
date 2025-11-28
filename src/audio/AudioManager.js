/**
 * AudioManager.js
 * Handles all game audio including engine sounds, environmental audio,
 * and sound effects using Web Audio API.
 */

/**
 * Audio types enum
 */
export const AudioType = {
    ENGINE: 'engine',
    WIND: 'wind',
    STALL_WARNING: 'stallWarning',
    GEAR: 'gear',
    FLAPS: 'flaps',
    TOUCHDOWN: 'touchdown',
    EXPLOSION: 'explosion',
    UI: 'ui'
};

/**
 * AudioManager class
 * Manages all game audio using Web Audio API
 */
export class AudioManager {
    /**
     * Create a new AudioManager
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            masterVolume: config.masterVolume ?? 1.0,
            engineVolume: config.engineVolume ?? 0.7,
            environmentVolume: config.environmentVolume ?? 0.5,
            effectsVolume: config.effectsVolume ?? 0.8,
            uiVolume: config.uiVolume ?? 0.6,
            enabled: config.enabled ?? true,
            ...config
        };

        this.audioContext = null;
        this.masterGain = null;
        this.channelGains = {};
        this.sounds = new Map();
        this.activeSounds = new Map();
        this.initialized = false;
        
        // Engine sound state
        this.engineState = {
            oscillator: null,
            gainNode: null,
            filterNode: null,
            baseFrequency: 80,
            throttle: 0,
            rpm: 0
        };
        
        // Wind sound state
        this.windState = {
            noiseNode: null,
            gainNode: null,
            filterNode: null,
            airspeed: 0
        };

        this.eventListeners = new Map();
    }

    /**
     * Initialize the audio system (must be called after user interaction)
     * @returns {Promise<boolean>}
     */
    async initialize() {
        if (this.initialized) return true;
        
        try {
            // Create audio context
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('Web Audio API not supported');
                return false;
            }
            
            this.audioContext = new AudioContextClass();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.config.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // Create channel gain nodes
            this.channelGains = {
                engine: this.createChannelGain(this.config.engineVolume),
                environment: this.createChannelGain(this.config.environmentVolume),
                effects: this.createChannelGain(this.config.effectsVolume),
                ui: this.createChannelGain(this.config.uiVolume)
            };
            
            // Resume context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.initialized = true;
            this.emit('initialized');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            return false;
        }
    }

    /**
     * Create a channel gain node
     * @param {number} volume - Initial volume
     * @returns {GainNode}
     */
    createChannelGain(volume) {
        const gain = this.audioContext.createGain();
        gain.gain.value = volume;
        gain.connect(this.masterGain);
        return gain;
    }

    /**
     * Start engine sound
     */
    startEngineSound() {
        if (!this.initialized || !this.config.enabled) return;
        if (this.engineState.oscillator) return; // Already running
        
        const ctx = this.audioContext;
        
        // Create oscillator for engine base tone
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = this.engineState.baseFrequency;
        
        // Create filter for engine character
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        filter.Q.value = 5;
        
        // Create gain for engine volume
        const gain = ctx.createGain();
        gain.gain.value = 0;
        
        // Create additional harmonics
        const harmonic1 = ctx.createOscillator();
        harmonic1.type = 'sine';
        harmonic1.frequency.value = this.engineState.baseFrequency * 2;
        
        const harmonic1Gain = ctx.createGain();
        harmonic1Gain.gain.value = 0.3;
        
        // Connect nodes
        oscillator.connect(filter);
        harmonic1.connect(harmonic1Gain);
        harmonic1Gain.connect(filter);
        filter.connect(gain);
        gain.connect(this.channelGains.engine);
        
        // Start oscillators
        oscillator.start();
        harmonic1.start();
        
        // Store references
        this.engineState.oscillator = oscillator;
        this.engineState.harmonic1 = harmonic1;
        this.engineState.filterNode = filter;
        this.engineState.gainNode = gain;
        
        this.emit('engineStart');
    }

    /**
     * Stop engine sound
     */
    stopEngineSound() {
        if (!this.engineState.oscillator) return;
        
        // Fade out
        if (this.engineState.gainNode) {
            this.engineState.gainNode.gain.linearRampToValueAtTime(
                0,
                this.audioContext.currentTime + 0.5
            );
        }
        
        // Stop after fade
        setTimeout(() => {
            if (this.engineState.oscillator) {
                this.engineState.oscillator.stop();
                this.engineState.oscillator = null;
            }
            if (this.engineState.harmonic1) {
                this.engineState.harmonic1.stop();
                this.engineState.harmonic1 = null;
            }
            this.engineState.filterNode = null;
            this.engineState.gainNode = null;
        }, 500);
        
        this.emit('engineStop');
    }

    /**
     * Update engine sound based on throttle and RPM
     * @param {number} throttle - Throttle value 0-1
     * @param {number} rpm - Engine RPM (optional)
     */
    updateEngineSound(throttle, rpm = null) {
        if (!this.engineState.oscillator) return;
        
        this.engineState.throttle = throttle;
        this.engineState.rpm = rpm;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        // Calculate frequency based on throttle (idle to max)
        const minFreq = this.engineState.baseFrequency; // Idle frequency
        const maxFreq = this.engineState.baseFrequency * 4; // Max throttle frequency
        const targetFreq = minFreq + (maxFreq - minFreq) * throttle;
        
        // Update oscillator frequency smoothly
        this.engineState.oscillator.frequency.linearRampToValueAtTime(
            targetFreq,
            currentTime + 0.1
        );
        
        // Update harmonic
        if (this.engineState.harmonic1) {
            this.engineState.harmonic1.frequency.linearRampToValueAtTime(
                targetFreq * 2,
                currentTime + 0.1
            );
        }
        
        // Update filter (higher cutoff at higher throttle)
        if (this.engineState.filterNode) {
            const filterFreq = 200 + throttle * 800;
            this.engineState.filterNode.frequency.linearRampToValueAtTime(
                filterFreq,
                currentTime + 0.1
            );
        }
        
        // Update volume (louder at higher throttle)
        if (this.engineState.gainNode) {
            const volume = 0.1 + throttle * 0.4;
            this.engineState.gainNode.gain.linearRampToValueAtTime(
                volume,
                currentTime + 0.1
            );
        }
    }

    /**
     * Start wind sound
     */
    startWindSound() {
        if (!this.initialized || !this.config.enabled) return;
        if (this.windState.noiseNode) return;
        
        const ctx = this.audioContext;
        
        // Create noise buffer for wind
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        
        // Generate pink noise (more natural sounding)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
        
        // Create buffer source
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        noiseNode.loop = true;
        
        // Create filter for wind character
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 200;
        filter.Q.value = 0.5;
        
        // Create gain for wind volume
        const gain = ctx.createGain();
        gain.gain.value = 0;
        
        // Connect nodes
        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.channelGains.environment);
        
        // Start
        noiseNode.start();
        
        // Store references
        this.windState.noiseNode = noiseNode;
        this.windState.filterNode = filter;
        this.windState.gainNode = gain;
    }

    /**
     * Stop wind sound
     */
    stopWindSound() {
        if (!this.windState.noiseNode) return;
        
        // Fade out
        if (this.windState.gainNode) {
            this.windState.gainNode.gain.linearRampToValueAtTime(
                0,
                this.audioContext.currentTime + 0.3
            );
        }
        
        setTimeout(() => {
            if (this.windState.noiseNode) {
                this.windState.noiseNode.stop();
                this.windState.noiseNode = null;
            }
            this.windState.filterNode = null;
            this.windState.gainNode = null;
        }, 300);
    }

    /**
     * Update wind sound based on airspeed
     * @param {number} airspeed - Airspeed in m/s
     */
    updateWindSound(airspeed) {
        if (!this.windState.noiseNode) return;
        
        this.windState.airspeed = airspeed;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        // Normalize airspeed (0-200 m/s typical range)
        const normalizedSpeed = Math.min(airspeed / 200, 1);
        
        // Update filter frequency (higher pitch at higher speed)
        if (this.windState.filterNode) {
            const filterFreq = 100 + normalizedSpeed * 1000;
            this.windState.filterNode.frequency.linearRampToValueAtTime(
                filterFreq,
                currentTime + 0.2
            );
            this.windState.filterNode.Q.linearRampToValueAtTime(
                0.5 + normalizedSpeed * 2,
                currentTime + 0.2
            );
        }
        
        // Update volume (louder at higher speed)
        if (this.windState.gainNode) {
            const volume = normalizedSpeed * 0.3;
            this.windState.gainNode.gain.linearRampToValueAtTime(
                volume,
                currentTime + 0.2
            );
        }
    }

    /**
     * Play a one-shot sound effect
     * @param {string} type - Sound type from AudioType
     * @param {Object} options - Playback options
     */
    playEffect(type, options = {}) {
        if (!this.initialized || !this.config.enabled) return;
        
        // Generate synthetic sound effects
        switch (type) {
            case AudioType.STALL_WARNING:
                this.playStallWarning();
                break;
            case AudioType.GEAR:
                this.playGearSound(options.down);
                break;
            case AudioType.TOUCHDOWN:
                this.playTouchdownSound(options.impact);
                break;
            case AudioType.UI:
                this.playUISound(options.volume, options.pitch);
                break;
            default:
                console.warn(`Unknown sound effect: ${type}`);
        }
    }

    /**
     * Play stall warning sound
     */
    playStallWarning() {
        if (!this.initialized) return;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        // Create oscillator for warning tone
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 800;
        
        const gain = ctx.createGain();
        gain.gain.value = 0;
        
        // Beeping pattern
        gain.gain.setValueAtTime(0.3, currentTime);
        gain.gain.setValueAtTime(0, currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, currentTime + 0.2);
        gain.gain.setValueAtTime(0, currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, currentTime + 0.4);
        gain.gain.setValueAtTime(0, currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.channelGains.effects);
        
        osc.start(currentTime);
        osc.stop(currentTime + 0.6);
    }

    /**
     * Play landing gear sound
     * @param {boolean} down - True if gear going down
     */
    playGearSound(down = true) {
        if (!this.initialized) return;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        // Hydraulic sound (filtered noise with pitch change)
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = down ? 0.8 : 1.2;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        
        const gain = ctx.createGain();
        gain.gain.value = 0.4;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.channelGains.effects);
        
        source.start(currentTime);
    }

    /**
     * Play touchdown sound
     * @param {number} impact - Impact intensity 0-1
     */
    playTouchdownSound(impact = 0.5) {
        if (!this.initialized) return;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        // Thump sound (low frequency burst)
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 60;
        osc.frequency.exponentialRampToValueAtTime(30, currentTime + 0.2);
        
        const gain = ctx.createGain();
        gain.gain.value = impact * 0.5;
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.channelGains.effects);
        
        osc.start(currentTime);
        osc.stop(currentTime + 0.3);
        
        // Tire squeal for harder landings
        if (impact > 0.5) {
            const squeal = ctx.createOscillator();
            squeal.type = 'sawtooth';
            squeal.frequency.value = 2000 + Math.random() * 1000;
            
            const squealGain = ctx.createGain();
            squealGain.gain.value = (impact - 0.5) * 0.2;
            squealGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
            
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1500;
            
            squeal.connect(filter);
            filter.connect(squealGain);
            squealGain.connect(this.channelGains.effects);
            
            squeal.start(currentTime);
            squeal.stop(currentTime + 0.15);
        }
    }

    /**
     * Play UI sound
     * @param {number} volume - Volume 0-1
     * @param {number} pitch - Pitch multiplier
     */
    playUISound(volume = 0.5, pitch = 1.0) {
        if (!this.initialized) return;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 440 * pitch;
        
        const gain = ctx.createGain();
        gain.gain.value = volume * 0.3;
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.channelGains.ui);
        
        osc.start(currentTime);
        osc.stop(currentTime + 0.1);
    }

    /**
     * Set master volume
     * @param {number} volume - Volume 0-1
     */
    setMasterVolume(volume) {
        this.config.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(
                this.config.masterVolume,
                this.audioContext.currentTime + 0.05
            );
        }
    }

    /**
     * Set channel volume
     * @param {string} channel - Channel name
     * @param {number} volume - Volume 0-1
     */
    setChannelVolume(channel, volume) {
        const normalizedVolume = Math.max(0, Math.min(1, volume));
        
        switch (channel) {
            case 'engine':
                this.config.engineVolume = normalizedVolume;
                break;
            case 'environment':
                this.config.environmentVolume = normalizedVolume;
                break;
            case 'effects':
                this.config.effectsVolume = normalizedVolume;
                break;
            case 'ui':
                this.config.uiVolume = normalizedVolume;
                break;
        }
        
        if (this.channelGains[channel]) {
            this.channelGains[channel].gain.linearRampToValueAtTime(
                normalizedVolume,
                this.audioContext.currentTime + 0.05
            );
        }
    }

    /**
     * Enable or disable audio
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        
        if (enabled) {
            if (this.audioContext?.state === 'suspended') {
                this.audioContext.resume();
            }
        } else {
            this.stopEngineSound();
            this.stopWindSound();
        }
        
        this.emit('enabledChanged', enabled);
    }

    /**
     * Update audio based on flight state
     * @param {Object} state - Flight state
     */
    update(state) {
        if (!this.initialized || !this.config.enabled) return;
        
        const {
            throttle = 0,
            airspeed = 0,
            stallWarning = false,
            gearDown = true,
            isOnGround = false
        } = state;
        
        // Update engine sound
        this.updateEngineSound(throttle);
        
        // Update wind sound
        this.updateWindSound(airspeed);
        
        // Store previous state for change detection
        if (this._previousState) {
            // Stall warning trigger
            if (stallWarning && !this._previousState.stallWarning) {
                this.playEffect(AudioType.STALL_WARNING);
            }
            
            // Gear change
            if (gearDown !== this._previousState.gearDown) {
                this.playEffect(AudioType.GEAR, { down: gearDown });
            }
            
            // Touchdown detection
            if (isOnGround && !this._previousState.isOnGround) {
                const verticalSpeed = Math.abs(state.verticalSpeed || 0);
                const impact = Math.min(verticalSpeed / 10, 1);
                this.playEffect(AudioType.TOUCHDOWN, { impact });
            }
        }
        
        this._previousState = { ...state };
    }

    /**
     * Get current audio configuration
     * @returns {Object}
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.eventListeners.has(event)) return;
        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.eventListeners.has(event)) return;
        this.eventListeners.get(event).forEach(callback => callback(data));
    }

    /**
     * Dispose of all audio resources
     */
    dispose() {
        this.stopEngineSound();
        this.stopWindSound();
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.initialized = false;
        this.eventListeners.clear();
    }
}

export default AudioManager;
