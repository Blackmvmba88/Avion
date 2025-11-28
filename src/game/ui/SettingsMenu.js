/**
 * SettingsMenu.js
 * Visual settings menu component for in-game configuration.
 */

import settingsManager from './SettingsManager.js';

/**
 * SettingsMenu class
 * Creates and manages the visual settings menu
 */
export class SettingsMenu {
    /**
     * Create a new SettingsMenu
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.container = config.container || document.body;
        this.settingsManager = config.settingsManager || settingsManager;
        this.visible = false;
        this.currentTab = 'audio';
        
        // DOM elements
        this.menuElement = null;
        this.overlayElement = null;
        this.contentElement = null;
        
        // Callbacks
        this.onClose = config.onClose || null;
        this.onChange = config.onChange || null;
        
        // Create the menu
        this.createMenu();
        this.bindEvents();
    }

    /**
     * Create the menu DOM structure
     */
    createMenu() {
        // Overlay
        this.overlayElement = document.createElement('div');
        this.overlayElement.id = 'settings-overlay';
        this.overlayElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            z-index: 9999;
            backdrop-filter: blur(4px);
        `;
        
        // Menu container
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'settings-menu';
        this.menuElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 700px;
            max-width: 90vw;
            max-height: 80vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 12px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
            display: none;
            z-index: 10000;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #ffffff;
            overflow: hidden;
        `;
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 20px 25px;
            background: rgba(0, 0, 0, 0.3);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const title = document.createElement('h2');
        title.textContent = 'Settings';
        title.style.cssText = 'margin: 0; font-size: 24px; font-weight: 600;';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.id = 'settings-close-btn';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: #fff;
            font-size: 30px;
            cursor: pointer;
            padding: 0 10px;
            opacity: 0.7;
            transition: opacity 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseout = () => closeBtn.style.opacity = '0.7';
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Tab navigation
        const tabNav = document.createElement('div');
        tabNav.id = 'settings-tabs';
        tabNav.style.cssText = `
            display: flex;
            background: rgba(0, 0, 0, 0.2);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const tabs = [
            { id: 'audio', label: '🔊 Audio', icon: '🔊' },
            { id: 'graphics', label: '🎮 Graphics', icon: '🎮' },
            { id: 'controls', label: '⌨️ Controls', icon: '⌨️' },
            { id: 'gameplay', label: '🎯 Gameplay', icon: '🎯' }
        ];
        
        tabs.forEach(tab => {
            const tabBtn = document.createElement('button');
            tabBtn.className = 'settings-tab';
            tabBtn.dataset.tab = tab.id;
            tabBtn.textContent = tab.label;
            tabBtn.style.cssText = `
                flex: 1;
                padding: 15px;
                background: ${tab.id === this.currentTab ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
                border: none;
                border-bottom: ${tab.id === this.currentTab ? '2px solid #4CAF50' : '2px solid transparent'};
                color: ${tab.id === this.currentTab ? '#fff' : 'rgba(255, 255, 255, 0.6)'};
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            `;
            tabNav.appendChild(tabBtn);
        });
        
        // Content area
        this.contentElement = document.createElement('div');
        this.contentElement.id = 'settings-content';
        this.contentElement.style.cssText = `
            padding: 25px;
            max-height: 400px;
            overflow-y: auto;
        `;
        
        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 15px 25px;
            background: rgba(0, 0, 0, 0.3);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
        `;
        
        const resetBtn = document.createElement('button');
        resetBtn.id = 'settings-reset-btn';
        resetBtn.textContent = 'Reset to Defaults';
        resetBtn.style.cssText = `
            padding: 10px 20px;
            background: #ff5722;
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        `;
        resetBtn.onmouseover = () => resetBtn.style.background = '#e64a19';
        resetBtn.onmouseout = () => resetBtn.style.background = '#ff5722';
        
        const applyBtn = document.createElement('button');
        applyBtn.id = 'settings-apply-btn';
        applyBtn.textContent = 'Apply & Close';
        applyBtn.style.cssText = `
            padding: 10px 30px;
            background: #4CAF50;
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        `;
        applyBtn.onmouseover = () => applyBtn.style.background = '#43a047';
        applyBtn.onmouseout = () => applyBtn.style.background = '#4CAF50';
        
        footer.appendChild(resetBtn);
        footer.appendChild(applyBtn);
        
        // Assemble menu
        this.menuElement.appendChild(header);
        this.menuElement.appendChild(tabNav);
        this.menuElement.appendChild(this.contentElement);
        this.menuElement.appendChild(footer);
        
        // Add to container
        this.container.appendChild(this.overlayElement);
        this.container.appendChild(this.menuElement);
        
        // Render initial content
        this.renderContent();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Close button
        document.getElementById('settings-close-btn').addEventListener('click', () => this.hide());
        
        // Overlay click
        this.overlayElement.addEventListener('click', () => this.hide());
        
        // Tab switching
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
        
        // Reset button
        document.getElementById('settings-reset-btn').addEventListener('click', () => this.resetCurrentTab());
        
        // Apply button
        document.getElementById('settings-apply-btn').addEventListener('click', () => {
            this.settingsManager.save();
            this.hide();
        });
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.visible) {
                this.hide();
            }
        });
    }

    /**
     * Switch active tab
     * @param {string} tabId
     */
    switchTab(tabId) {
        this.currentTab = tabId;
        
        // Update tab styles
        document.querySelectorAll('.settings-tab').forEach(tab => {
            const isActive = tab.dataset.tab === tabId;
            tab.style.background = isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent';
            tab.style.borderBottom = isActive ? '2px solid #4CAF50' : '2px solid transparent';
            tab.style.color = isActive ? '#fff' : 'rgba(255, 255, 255, 0.6)';
        });
        
        this.renderContent();
    }

    /**
     * Render content for current tab
     */
    renderContent() {
        this.contentElement.innerHTML = '';
        
        switch (this.currentTab) {
            case 'audio':
                this.renderAudioSettings();
                break;
            case 'graphics':
                this.renderGraphicsSettings();
                break;
            case 'controls':
                this.renderControlsSettings();
                break;
            case 'gameplay':
                this.renderGameplaySettings();
                break;
        }
    }

    /**
     * Create a setting control element
     * @param {Object} options
     * @returns {HTMLElement}
     */
    createControl(options) {
        const { path, label, type, value, min, max, step, choices } = options;
        
        const container = document.createElement('div');
        container.className = 'setting-item';
        container.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        `;
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.cssText = 'font-size: 14px; color: rgba(255, 255, 255, 0.9);';
        
        let controlEl;
        
        switch (type) {
            case 'slider':
                controlEl = this.createSlider(path, value, min, max, step);
                break;
            case 'toggle':
                controlEl = this.createToggle(path, value);
                break;
            case 'select':
                controlEl = this.createSelect(path, value, choices);
                break;
            default:
                controlEl = document.createElement('span');
        }
        
        container.appendChild(labelEl);
        container.appendChild(controlEl);
        
        return container;
    }

    /**
     * Create a slider control
     */
    createSlider(path, value, min = 0, max = 1, step = 0.05) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; align-items: center; gap: 10px;';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        slider.style.cssText = `
            width: 120px;
            accent-color: #4CAF50;
        `;
        
        const valueLabel = document.createElement('span');
        valueLabel.textContent = this.formatValue(value, path);
        valueLabel.style.cssText = `
            min-width: 50px;
            text-align: right;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.7);
        `;
        
        slider.addEventListener('input', () => {
            const newValue = parseFloat(slider.value);
            valueLabel.textContent = this.formatValue(newValue, path);
            this.settingsManager.set(path, newValue);
            if (this.onChange) this.onChange(path, newValue);
        });
        
        wrapper.appendChild(slider);
        wrapper.appendChild(valueLabel);
        
        return wrapper;
    }

    /**
     * Create a toggle control
     */
    createToggle(path, value) {
        const toggle = document.createElement('label');
        toggle.style.cssText = `
            position: relative;
            display: inline-block;
            width: 50px;
            height: 26px;
        `;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = value;
        checkbox.style.cssText = 'opacity: 0; width: 0; height: 0;';
        
        const slider = document.createElement('span');
        slider.style.cssText = `
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: ${value ? '#4CAF50' : '#555'};
            transition: 0.3s;
            border-radius: 26px;
        `;
        
        const circle = document.createElement('span');
        circle.style.cssText = `
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: ${value ? '26px' : '3px'};
            bottom: 3px;
            background-color: white;
            transition: 0.3s;
            border-radius: 50%;
        `;
        slider.appendChild(circle);
        
        checkbox.addEventListener('change', () => {
            const newValue = checkbox.checked;
            slider.style.backgroundColor = newValue ? '#4CAF50' : '#555';
            circle.style.left = newValue ? '26px' : '3px';
            this.settingsManager.set(path, newValue);
            if (this.onChange) this.onChange(path, newValue);
        });
        
        toggle.appendChild(checkbox);
        toggle.appendChild(slider);
        
        return toggle;
    }

    /**
     * Create a select control
     */
    createSelect(path, value, choices) {
        const select = document.createElement('select');
        select.style.cssText = `
            padding: 8px 15px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: white;
            font-size: 13px;
            cursor: pointer;
        `;
        
        choices.forEach(choice => {
            const option = document.createElement('option');
            option.value = choice;
            option.textContent = typeof choice === 'string' 
                ? choice.charAt(0).toUpperCase() + choice.slice(1) 
                : choice;
            option.selected = choice === value;
            option.style.cssText = 'background: #1a1a2e; color: white;';
            select.appendChild(option);
        });
        
        select.addEventListener('change', () => {
            let newValue = select.value;
            // Convert numeric strings back to numbers
            if (!isNaN(newValue) && newValue !== '') {
                newValue = parseFloat(newValue);
            }
            this.settingsManager.set(path, newValue);
            if (this.onChange) this.onChange(path, newValue);
        });
        
        return select;
    }

    /**
     * Format a value for display
     */
    formatValue(value, path) {
        if (path.includes('Volume')) {
            return Math.round(value * 100) + '%';
        }
        if (path.includes('sensitivity')) {
            return value.toFixed(1) + 'x';
        }
        if (path.includes('resolution')) {
            return Math.round(value * 100) + '%';
        }
        return typeof value === 'number' ? value.toFixed(2) : value;
    }

    /**
     * Render audio settings
     */
    renderAudioSettings() {
        const settings = this.settingsManager.getCategory('audio');
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'audio.enabled',
                label: 'Sound Enabled',
                type: 'toggle',
                value: settings.enabled
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'audio.masterVolume',
                label: 'Master Volume',
                type: 'slider',
                value: settings.masterVolume,
                min: 0, max: 1, step: 0.05
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'audio.engineVolume',
                label: 'Engine Volume',
                type: 'slider',
                value: settings.engineVolume,
                min: 0, max: 1, step: 0.05
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'audio.environmentVolume',
                label: 'Environment Volume',
                type: 'slider',
                value: settings.environmentVolume,
                min: 0, max: 1, step: 0.05
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'audio.effectsVolume',
                label: 'Effects Volume',
                type: 'slider',
                value: settings.effectsVolume,
                min: 0, max: 1, step: 0.05
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'audio.uiVolume',
                label: 'UI Volume',
                type: 'slider',
                value: settings.uiVolume,
                min: 0, max: 1, step: 0.05
            })
        );
    }

    /**
     * Render graphics settings
     */
    renderGraphicsSettings() {
        const settings = this.settingsManager.getCategory('graphics');
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'graphics.quality',
                label: 'Quality Preset',
                type: 'select',
                value: settings.quality,
                choices: ['low', 'medium', 'high', 'ultra']
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'graphics.targetFPS',
                label: 'Target FPS',
                type: 'select',
                value: settings.targetFPS,
                choices: [30, 60, 120, 144]
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'graphics.shadows',
                label: 'Shadows',
                type: 'toggle',
                value: settings.shadows
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'graphics.antialiasing',
                label: 'Anti-aliasing',
                type: 'toggle',
                value: settings.antialiasing
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'graphics.particles',
                label: 'Particle Effects',
                type: 'toggle',
                value: settings.particles
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'graphics.fogEnabled',
                label: 'Fog',
                type: 'toggle',
                value: settings.fogEnabled
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'graphics.fullscreen',
                label: 'Fullscreen',
                type: 'toggle',
                value: settings.fullscreen
            })
        );
    }

    /**
     * Render controls settings
     */
    renderControlsSettings() {
        const settings = this.settingsManager.getCategory('controls');
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'controls.sensitivity.pitch',
                label: 'Pitch Sensitivity',
                type: 'slider',
                value: settings.sensitivity.pitch,
                min: 0.1, max: 3, step: 0.1
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'controls.sensitivity.roll',
                label: 'Roll Sensitivity',
                type: 'slider',
                value: settings.sensitivity.roll,
                min: 0.1, max: 3, step: 0.1
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'controls.sensitivity.yaw',
                label: 'Yaw Sensitivity',
                type: 'slider',
                value: settings.sensitivity.yaw,
                min: 0.1, max: 3, step: 0.1
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'controls.sensitivity.camera',
                label: 'Camera Sensitivity',
                type: 'slider',
                value: settings.sensitivity.camera,
                min: 0.1, max: 3, step: 0.1
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'controls.invertPitch',
                label: 'Invert Pitch',
                type: 'toggle',
                value: settings.invertPitch
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'controls.invertRoll',
                label: 'Invert Roll',
                type: 'toggle',
                value: settings.invertRoll
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'controls.mouseEnabled',
                label: 'Mouse Control',
                type: 'toggle',
                value: settings.mouseEnabled
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'controls.touchEnabled',
                label: 'Touch Control',
                type: 'toggle',
                value: settings.touchEnabled
            })
        );
    }

    /**
     * Render gameplay settings
     */
    renderGameplaySettings() {
        const settings = this.settingsManager.getCategory('gameplay');
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'gameplay.difficulty',
                label: 'Difficulty',
                type: 'select',
                value: settings.difficulty,
                choices: ['easy', 'normal', 'realistic']
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'gameplay.units',
                label: 'Units',
                type: 'select',
                value: settings.units,
                choices: ['metric', 'imperial']
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'gameplay.hudEnabled',
                label: 'Show HUD',
                type: 'toggle',
                value: settings.hudEnabled
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'gameplay.cockpitView',
                label: 'Cockpit View',
                type: 'toggle',
                value: settings.cockpitView
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'gameplay.stallWarnings',
                label: 'Stall Warnings',
                type: 'toggle',
                value: settings.stallWarnings
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'gameplay.crashDamage',
                label: 'Crash Damage',
                type: 'toggle',
                value: settings.crashDamage
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'gameplay.weatherEffects',
                label: 'Weather Effects',
                type: 'toggle',
                value: settings.weatherEffects
            })
        );
        
        this.contentElement.appendChild(
            this.createControl({
                path: 'gameplay.tutorialHints',
                label: 'Tutorial Hints',
                type: 'toggle',
                value: settings.tutorialHints
            })
        );
    }

    /**
     * Reset current tab to defaults
     */
    resetCurrentTab() {
        if (window.confirm(`Reset ${this.currentTab} settings to defaults?`)) {
            this.settingsManager.resetCategory(this.currentTab);
            this.renderContent();
        }
    }

    /**
     * Show the settings menu
     */
    show() {
        this.visible = true;
        this.overlayElement.style.display = 'block';
        this.menuElement.style.display = 'block';
        this.renderContent();
    }

    /**
     * Hide the settings menu
     */
    hide() {
        this.visible = false;
        this.overlayElement.style.display = 'none';
        this.menuElement.style.display = 'none';
        
        if (this.onClose) {
            this.onClose();
        }
    }

    /**
     * Toggle menu visibility
     */
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Check if menu is visible
     * @returns {boolean}
     */
    isVisible() {
        return this.visible;
    }

    /**
     * Dispose of the menu
     */
    dispose() {
        if (this.menuElement?.parentNode) {
            this.menuElement.parentNode.removeChild(this.menuElement);
        }
        if (this.overlayElement?.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
        }
    }
}

export default SettingsMenu;
