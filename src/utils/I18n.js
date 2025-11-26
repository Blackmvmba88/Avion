/**
 * Internationalization (i18n) System
 * Manages translations and language switching
 */

export class I18n {
    constructor() {
        this.currentLocale = 'en';
        this.translations = {};
        this.fallbackLocale = 'en';
    }
    
    /**
     * Set current locale
     * @param {string} locale - Locale code (e.g., 'en', 'es', 'fr')
     */
    setLocale(locale) {
        if (this.translations[locale]) {
            this.currentLocale = locale;
            this.notifyListeners();
            return true;
        }
        console.warn(`Locale ${locale} not found, keeping ${this.currentLocale}`);
        return false;
    }
    
    /**
     * Get current locale
     * @returns {string}
     */
    getLocale() {
        return this.currentLocale;
    }
    
    /**
     * Add translations for a locale
     * @param {string} locale - Locale code
     * @param {Object} translations - Translation object
     */
    addTranslations(locale, translations) {
        this.translations[locale] = {
            ...this.translations[locale],
            ...translations
        };
    }
    
    /**
     * Get translation
     * @param {string} key - Translation key (supports dot notation)
     * @param {Object} params - Interpolation parameters
     * @returns {string}
     */
    t(key, params = {}) {
        let translation = this.getNestedTranslation(this.currentLocale, key);
        
        // Fallback to default locale
        if (!translation && this.currentLocale !== this.fallbackLocale) {
            translation = this.getNestedTranslation(this.fallbackLocale, key);
        }
        
        // Return key if no translation found
        if (!translation) {
            console.warn(`Translation not found for key: ${key}`);
            return key;
        }
        
        // Interpolate parameters
        return this.interpolate(translation, params);
    }
    
    /**
     * Get nested translation by key
     * @param {string} locale - Locale code
     * @param {string} key - Translation key
     * @returns {string|null}
     */
    getNestedTranslation(locale, key) {
        const keys = key.split('.');
        let value = this.translations[locale];
        
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return typeof value === 'string' ? value : null;
    }
    
    /**
     * Interpolate parameters into translation
     * @param {string} translation - Translation string
     * @param {Object} params - Parameters
     * @returns {string}
     */
    interpolate(translation, params) {
        return translation.replace(/\{(\w+)\}/g, (match, key) => {
            if (params[key] !== undefined) {
                // Note: Values are not HTML-escaped by default
                // If rendering to HTML, use escapeHtml() or textContent instead of innerHTML
                return params[key];
            }
            return match;
        });
    }
    
    /**
     * Escape HTML characters to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Get translation with HTML-escaped parameters
     * @param {string} key - Translation key
     * @param {Object} params - Interpolation parameters (will be HTML-escaped)
     * @returns {string}
     */
    tSafe(key, params = {}) {
        const escapedParams = {};
        for (const [k, v] of Object.entries(params)) {
            escapedParams[k] = this.escapeHtml(String(v));
        }
        return this.t(key, escapedParams);
    }
    
    /**
     * Get available locales
     * @returns {Array}
     */
    getAvailableLocales() {
        return Object.keys(this.translations);
    }
    
    /**
     * Add locale change listener
     * @param {Function} callback
     */
    onLocaleChange(callback) {
        if (!this.listeners) {
            this.listeners = [];
        }
        this.listeners.push(callback);
    }
    
    /**
     * Notify listeners of locale change
     */
    notifyListeners() {
        if (this.listeners) {
            this.listeners.forEach(callback => callback(this.currentLocale));
        }
    }
    
    /**
     * Detect browser locale
     * @returns {string}
     */
    detectBrowserLocale() {
        const browserLang = navigator.language || navigator.userLanguage;
        const locale = browserLang.split('-')[0]; // Get language code only
        return this.translations[locale] ? locale : this.fallbackLocale;
    }
}

// Create singleton instance
const i18n = new I18n();

export default i18n;
