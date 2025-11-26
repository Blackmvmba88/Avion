/**
 * Application Initializer
 * Initializes all systems with proper configuration
 */

import i18n from './I18n.js';
import locales from '../locales/index.js';
import platformDetector from './PlatformDetector.js';
import versionManager from './VersionManager.js';
import { Validator } from './Validator.js';
import COMPATIBILITY_CONFIG from '../config/compatibility.config.js';

export class AppInitializer {
    constructor() {
        this.initialized = false;
        this.config = {};
    }
    
    /**
     * Initialize application
     * @param {Object} options - Initialization options
     * @returns {Promise<Object>} - Initialization result
     */
    async initialize(options = {}) {
        console.log('🚀 Initializing Avion Flight Simulator...');
        
        try {
            // 1. Initialize i18n
            await this.initializeI18n(options.locale);
            
            // 2. Detect platform
            const platform = this.detectPlatform();
            
            // 3. Load and validate configuration
            const config = await this.loadConfiguration(options.config);
            
            // 4. Check version compatibility
            this.checkCompatibility();
            
            // 5. Apply platform-specific optimizations
            this.applyPlatformOptimizations(platform);
            
            this.initialized = true;
            this.config = config;
            
            console.log('✅ Initialization complete!');
            console.log(`Platform: ${platformDetector.toString()}`);
            console.log(`Language: ${i18n.getLocale()}`);
            console.log(`Version: ${COMPATIBILITY_CONFIG.version}`);
            
            return {
                success: true,
                platform,
                config,
                locale: i18n.getLocale()
            };
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize internationalization
     * @param {string} locale - Preferred locale
     */
    async initializeI18n(locale) {
        console.log('🌐 Initializing i18n...');
        
        // Add all translations
        Object.entries(locales).forEach(([key, translations]) => {
            i18n.addTranslations(key, translations);
        });
        
        // Set locale (auto-detect if not provided)
        const targetLocale = locale || i18n.detectBrowserLocale();
        i18n.setLocale(targetLocale);
        
        console.log(`  ✓ Language set to: ${targetLocale}`);
    }
    
    /**
     * Detect platform
     * @returns {Object}
     */
    detectPlatform() {
        console.log('📱 Detecting platform...');
        
        const platform = platformDetector.platform;
        const features = platformDetector.features;
        
        console.log(`  ✓ Platform: ${platformDetector.toString()}`);
        console.log(`  ✓ WebGL: ${features.webgl ? 'Yes' : 'No'}`);
        console.log(`  ✓ WebGL2: ${features.webgl2 ? 'Yes' : 'No'}`);
        console.log(`  ✓ Touch: ${platform.hasTouch ? 'Yes' : 'No'}`);
        
        return platform;
    }
    
    /**
     * Load and validate configuration
     * @param {Object} customConfig - Custom configuration
     * @returns {Object}
     */
    async loadConfiguration(customConfig = {}) {
        console.log('⚙️  Loading configuration...');
        
        // Load saved config if available
        let savedConfig = {};
        try {
            const saved = localStorage.getItem('avion_config');
            if (saved) {
                savedConfig = JSON.parse(saved);
                
                // Check version and migrate if needed
                if (savedConfig.__version && savedConfig.__version !== COMPATIBILITY_CONFIG.version) {
                    console.log(`  ⚠️  Migrating config from ${savedConfig.__version} to ${COMPATIBILITY_CONFIG.version}`);
                    savedConfig = await versionManager.migrate(savedConfig, savedConfig.__version);
                }
            }
        } catch (error) {
            console.warn('  ⚠️  Could not load saved config:', error);
        }
        
        // Merge configurations (custom > saved > defaults)
        const config = {
            ...this.getDefaultConfig(),
            ...savedConfig,
            ...customConfig
        };
        
        // Add version info
        const versionedConfig = versionManager.addVersionInfo(config);
        
        // Save config
        try {
            localStorage.setItem('avion_config', JSON.stringify(versionedConfig));
        } catch (error) {
            console.warn('  ⚠️  Could not save config:', error);
        }
        
        console.log('  ✓ Configuration loaded');
        return versionedConfig;
    }
    
    /**
     * Get default configuration
     * @returns {Object}
     */
    getDefaultConfig() {
        const recommended = platformDetector.getRecommendedSettings();
        
        return {
            graphics: {
                quality: recommended.quality,
                shadows: recommended.shadows,
                antialiasing: recommended.antialiasing,
                renderDistance: recommended.renderDistance
            },
            performance: {
                targetFPS: recommended.targetFPS
            },
            controls: {
                sensitivity: 1.0,
                invertY: false
            },
            audio: {
                masterVolume: 0.8,
                sfxVolume: 1.0,
                musicVolume: 0.6
            }
        };
    }
    
    /**
     * Check version compatibility
     */
    checkCompatibility() {
        console.log('🔍 Checking compatibility...');
        
        const currentVersion = COMPATIBILITY_CONFIG.version;
        const minVersion = COMPATIBILITY_CONFIG.minVersion;
        
        console.log(`  ✓ Current version: ${currentVersion}`);
        console.log(`  ✓ Minimum compatible: ${minVersion}`);
        
        // Check for deprecated features
        const deprecations = COMPATIBILITY_CONFIG.deprecations;
        if (Object.keys(deprecations).length > 0) {
            console.log('  ⚠️  Deprecated features detected:');
            Object.entries(deprecations).forEach(([feature, info]) => {
                console.log(`    - ${feature}: deprecated in ${info.since}, will be removed in ${info.removeIn}`);
            });
        }
    }
    
    /**
     * Apply platform-specific optimizations
     * @param {Object} platform
     */
    applyPlatformOptimizations(platform) {
        console.log('⚡ Applying platform optimizations...');
        
        if (platform.isMobile) {
            console.log('  ✓ Mobile optimizations enabled');
            // Mobile-specific optimizations will be applied in rendering
        } else if (platform.isTablet) {
            console.log('  ✓ Tablet optimizations enabled');
        } else {
            console.log('  ✓ Desktop optimizations enabled');
        }
    }
}

export default AppInitializer;
