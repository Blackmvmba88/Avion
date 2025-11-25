/**
 * HUD.js
 * Heads-Up Display for flight information.
 * Displays altitude, airspeed, throttle, and other flight data.
 */

/**
 * HUD class
 * Creates and manages the on-screen flight information display
 */
export class HUD {
    /**
     * Create a new HUD instance
     * @param {Object} config - HUD configuration
     */
    constructor(config = {}) {
        this.container = config.container || document.body;
        this.visible = true;
        
        // Create HUD elements
        this.createHUDElements();
        
        // Data to display
        this.data = {
            altitude: 0,
            airspeed: 0,
            throttle: 0,
            heading: 0,
            pitch: 0,
            roll: 0,
            fps: 0,
            verticalSpeed: 0
        };
    }

    /**
     * Create all HUD DOM elements
     */
    createHUDElements() {
        // Main HUD container
        this.hudElement = document.createElement('div');
        this.hudElement.id = 'flight-hud';
        this.hudElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            font-family: 'Courier New', monospace;
            color: #00ff00;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            z-index: 1000;
        `;
        
        // Left panel (altitude, vertical speed)
        this.leftPanel = document.createElement('div');
        this.leftPanel.style.cssText = `
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.5);
            padding: 15px;
            border-radius: 5px;
            border: 1px solid rgba(0,255,0,0.3);
        `;
        
        // Right panel (airspeed)
        this.rightPanel = document.createElement('div');
        this.rightPanel.style.cssText = `
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.5);
            padding: 15px;
            border-radius: 5px;
            border: 1px solid rgba(0,255,0,0.3);
        `;
        
        // Top panel (heading)
        this.topPanel = document.createElement('div');
        this.topPanel.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.5);
            padding: 10px 20px;
            border-radius: 5px;
            border: 1px solid rgba(0,255,0,0.3);
        `;
        
        // Bottom panel (throttle, controls)
        this.bottomPanel = document.createElement('div');
        this.bottomPanel.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.5);
            padding: 15px;
            border-radius: 5px;
            border: 1px solid rgba(0,255,0,0.3);
            text-align: center;
        `;
        
        // FPS counter (top right)
        this.fpsElement = document.createElement('div');
        this.fpsElement.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 12px;
            color: #ffff00;
        `;
        
        // Controls help (bottom left)
        this.controlsHelp = document.createElement('div');
        this.controlsHelp.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0,0,0,0.7);
            padding: 10px;
            border-radius: 5px;
            font-size: 11px;
            color: #aaaaaa;
            line-height: 1.6;
        `;
        this.controlsHelp.innerHTML = `
            <strong style="color:#00ff00">Controls:</strong><br>
            W/S - Pitch<br>
            A/D - Roll<br>
            Q/E - Yaw<br>
            Shift/Ctrl - Throttle<br>
            Arrows - Camera<br>
            Mouse - Look (click)<br>
            R - Reset Camera<br>
            Backspace - Reset Aircraft
        `;
        
        // Add elements to HUD container
        this.hudElement.appendChild(this.leftPanel);
        this.hudElement.appendChild(this.rightPanel);
        this.hudElement.appendChild(this.topPanel);
        this.hudElement.appendChild(this.bottomPanel);
        this.hudElement.appendChild(this.fpsElement);
        this.hudElement.appendChild(this.controlsHelp);
        
        // Add HUD to container
        this.container.appendChild(this.hudElement);
    }

    /**
     * Update HUD with new data
     * @param {Object} data - Flight data
     */
    update(data) {
        this.data = { ...this.data, ...data };
        this.render();
    }

    /**
     * Render the HUD with current data
     */
    render() {
        if (!this.visible) return;
        
        // Left panel - Altitude
        this.leftPanel.innerHTML = `
            <div style="font-size: 14px; margin-bottom: 10px;">ALT</div>
            <div style="font-size: 24px; font-weight: bold;">
                ${Math.round(this.data.altitude)}
            </div>
            <div style="font-size: 12px; color: #00cc00;">meters</div>
            <div style="margin-top: 15px; font-size: 12px;">
                VS: ${this.data.verticalSpeed > 0 ? '+' : ''}${Math.round(this.data.verticalSpeed)} m/s
            </div>
        `;
        
        // Right panel - Airspeed
        const airspeedKnots = Math.round(this.data.airspeed * 1.944);
        this.rightPanel.innerHTML = `
            <div style="font-size: 14px; margin-bottom: 10px;">IAS</div>
            <div style="font-size: 24px; font-weight: bold;">
                ${airspeedKnots}
            </div>
            <div style="font-size: 12px; color: #00cc00;">knots</div>
            <div style="margin-top: 15px; font-size: 12px;">
                ${Math.round(this.data.airspeed)} m/s
            </div>
        `;
        
        // Top panel - Heading
        const heading = ((Math.round(this.data.heading) % 360) + 360) % 360;
        const headingStr = heading.toString().padStart(3, '0');
        this.topPanel.innerHTML = `
            <div style="font-size: 20px; font-weight: bold;">${headingStr}°</div>
        `;
        
        // Bottom panel - Throttle and attitude
        const throttlePercent = Math.round(this.data.throttle * 100);
        
        this.bottomPanel.innerHTML = `
            <div style="margin-bottom: 10px;">
                <span style="font-size: 14px;">THROTTLE: </span>
                <span style="font-size: 18px; font-weight: bold;">${throttlePercent}%</span>
            </div>
            <div style="width: 200px; height: 10px; background: #333; border-radius: 5px; overflow: hidden;">
                <div style="width: ${throttlePercent}%; height: 100%; background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);"></div>
            </div>
            <div style="margin-top: 10px; font-size: 12px;">
                Pitch: ${Math.round(this.data.pitch)}° | Roll: ${Math.round(this.data.roll)}°
            </div>
        `;
        
        // FPS
        this.fpsElement.textContent = `FPS: ${this.data.fps}`;
    }

    /**
     * Show the HUD
     */
    show() {
        this.visible = true;
        this.hudElement.style.display = 'block';
    }

    /**
     * Hide the HUD
     */
    hide() {
        this.visible = false;
        this.hudElement.style.display = 'none';
    }

    /**
     * Toggle HUD visibility
     */
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Dispose of HUD elements
     */
    dispose() {
        if (this.hudElement && this.hudElement.parentNode) {
            this.hudElement.parentNode.removeChild(this.hudElement);
        }
    }
}
