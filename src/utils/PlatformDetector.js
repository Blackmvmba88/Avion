/**
 * Platform Detection Utility
 * Detects the current platform and provides platform-specific utilities
 */

export class PlatformDetector {
    constructor() {
        this.userAgent = navigator.userAgent || navigator.vendor || window.opera;
        this.platform = this.detectPlatform();
        this.features = this.detectFeatures();
    }
    
    /**
     * Detect current platform
     * @returns {Object}
     */
    detectPlatform() {
        const ua = this.userAgent.toLowerCase();
        
        return {
            // Mobile detection
            isMobile: this.isMobileDevice(),
            isTablet: this.isTabletDevice(),
            isDesktop: !this.isMobileDevice() && !this.isTabletDevice(),
            
            // OS detection
            isIOS: /iphone|ipad|ipod/.test(ua),
            isAndroid: /android/.test(ua),
            isWindows: /windows/.test(ua),
            isMac: /mac/.test(ua) && !/iphone|ipad|ipod/.test(ua),
            isLinux: /linux/.test(ua) && !/android/.test(ua),
            
            // Browser detection
            isChrome: /chrome/.test(ua) && !/edge/.test(ua),
            isFirefox: /firefox/.test(ua),
            isSafari: /safari/.test(ua) && !/chrome/.test(ua),
            isEdge: /edge/.test(ua),
            
            // Touch support
            hasTouch: this.hasTouchSupport(),
            
            // Screen info
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            
            // Orientation
            orientation: this.getOrientation()
        };
    }
    
    /**
     * Check if mobile device
     * @returns {boolean}
     */
    isMobileDevice() {
        return /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(this.userAgent) ||
               (window.innerWidth <= 768 && 'ontouchstart' in window);
    }
    
    /**
     * Check if tablet device
     * @returns {boolean}
     */
    isTabletDevice() {
        return /ipad|android(?!.*mobile)/i.test(this.userAgent) ||
               (window.innerWidth > 768 && window.innerWidth <= 1024 && 'ontouchstart' in window);
    }
    
    /**
     * Check touch support
     * @returns {boolean}
     */
    hasTouchSupport() {
        return 'ontouchstart' in window ||
               navigator.maxTouchPoints > 0 ||
               navigator.msMaxTouchPoints > 0;
    }
    
    /**
     * Get screen orientation
     * @returns {string}
     */
    getOrientation() {
        if (window.innerWidth > window.innerHeight) {
            return 'landscape';
        }
        return 'portrait';
    }
    
    /**
     * Detect device features and capabilities
     * @returns {Object}
     */
    detectFeatures() {
        return {
            // Graphics
            webgl: this.hasWebGL(),
            webgl2: this.hasWebGL2(),
            
            // Storage
            localStorage: this.hasLocalStorage(),
            sessionStorage: this.hasSessionStorage(),
            indexedDB: this.hasIndexedDB(),
            
            // Network
            webSocket: 'WebSocket' in window,
            webRTC: this.hasWebRTC(),
            
            // Sensors
            deviceMotion: 'DeviceMotionEvent' in window,
            deviceOrientation: 'DeviceOrientationEvent' in window,
            geolocation: 'geolocation' in navigator,
            
            // Media
            webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
            
            // Performance
            performanceAPI: 'performance' in window,
            requestAnimationFrame: 'requestAnimationFrame' in window,
            
            // Battery
            battery: 'getBattery' in navigator
        };
    }
    
    /**
     * Check WebGL support
     * @returns {boolean}
     */
    hasWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check WebGL 2 support
     * @returns {boolean}
     */
    hasWebGL2() {
        try {
            const canvas = document.createElement('canvas');
            return !!canvas.getContext('webgl2');
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check localStorage support
     * @returns {boolean}
     */
    hasLocalStorage() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check sessionStorage support
     * @returns {boolean}
     */
    hasSessionStorage() {
        try {
            const test = '__test__';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check IndexedDB support
     * @returns {boolean}
     */
    hasIndexedDB() {
        return 'indexedDB' in window;
    }
    
    /**
     * Check WebRTC support
     * @returns {boolean}
     */
    hasWebRTC() {
        return 'RTCPeerConnection' in window ||
               'webkitRTCPeerConnection' in window ||
               'mozRTCPeerConnection' in window;
    }
    
    /**
     * Get recommended settings for platform
     * @returns {Object}
     */
    getRecommendedSettings() {
        const { isMobile, isTablet } = this.platform;
        
        if (isMobile) {
            return {
                quality: 'low',
                shadows: false,
                antialiasing: false,
                particleCount: 'low',
                renderDistance: 'short',
                targetFPS: 30
            };
        } else if (isTablet) {
            return {
                quality: 'medium',
                shadows: false,
                antialiasing: true,
                particleCount: 'medium',
                renderDistance: 'medium',
                targetFPS: 45
            };
        } else {
            return {
                quality: 'high',
                shadows: true,
                antialiasing: true,
                particleCount: 'high',
                renderDistance: 'far',
                targetFPS: 60
            };
        }
    }
    
    /**
     * Monitor orientation changes
     * @param {Function} callback
     */
    onOrientationChange(callback) {
        window.addEventListener('orientationchange', () => {
            this.platform.orientation = this.getOrientation();
            callback(this.platform.orientation);
        });
        
        window.addEventListener('resize', () => {
            const newOrientation = this.getOrientation();
            if (newOrientation !== this.platform.orientation) {
                this.platform.orientation = newOrientation;
                callback(this.platform.orientation);
            }
        });
    }
    
    /**
     * Get platform info string
     * @returns {string}
     */
    toString() {
        const { isMobile, isTablet, isDesktop, isIOS, isAndroid, isWindows, isMac } = this.platform;
        
        let os = 'Unknown';
        if (isIOS) os = 'iOS';
        else if (isAndroid) os = 'Android';
        else if (isWindows) os = 'Windows';
        else if (isMac) os = 'macOS';
        
        let device = 'Desktop';
        if (isMobile) device = 'Mobile';
        else if (isTablet) device = 'Tablet';
        
        return `${os} - ${device}`;
    }
}

// Create singleton instance
const platformDetector = new PlatformDetector();

export default platformDetector;
