/**
 * InstrumentPanel.js
 * Full cockpit instrument panel for first-person view.
 * Displays flight instruments including attitude indicator, altimeter,
 * airspeed indicator, compass, and more.
 */

/**
 * InstrumentPanel class
 * Creates and manages the cockpit instrument panel display
 */
export class InstrumentPanel {
    /**
     * Create a new InstrumentPanel
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.container = config.container || document.body;
        this.visible = false;
        
        // Panel dimensions
        this.width = config.width || 800;
        this.height = config.height || 400;
        
        // Create the panel
        this.panelElement = null;
        this.canvas = null;
        this.ctx = null;
        
        // Flight data
        this.data = {
            pitch: 0,
            roll: 0,
            heading: 0,
            altitude: 0,
            airspeed: 0,
            verticalSpeed: 0,
            throttle: 0,
            rpm: 0,
            fuelLevel: 100,
            gForce: 1,
            stallWarning: false,
            gearDown: true,
            flapsPosition: 0,
            autopilot: false
        };
        
        // Instrument styles
        this.colors = {
            background: '#1a1a1a',
            bezel: '#333333',
            face: '#0a0a0a',
            markings: '#ffffff',
            pointer: '#ff0000',
            horizon: {
                sky: '#3399ff',
                ground: '#996633'
            },
            warning: '#ff0000',
            caution: '#ffcc00',
            safe: '#00ff00'
        };
        
        this.createPanel();
    }

    /**
     * Create the instrument panel DOM elements
     */
    createPanel() {
        // Main panel container
        this.panelElement = document.createElement('div');
        this.panelElement.id = 'instrument-panel';
        this.panelElement.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: ${this.width}px;
            height: ${this.height}px;
            background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
            border-radius: 10px 10px 0 0;
            border: 2px solid #444;
            border-bottom: none;
            display: none;
            z-index: 2000;
            box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.5);
            font-family: 'Courier New', monospace;
        `;
        
        // Create canvas for instruments
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.cssText = 'width: 100%; height: 100%;';
        this.panelElement.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        
        // Add to container
        this.container.appendChild(this.panelElement);
    }

    /**
     * Show the instrument panel
     */
    show() {
        this.visible = true;
        this.panelElement.style.display = 'block';
        this.render();
    }

    /**
     * Hide the instrument panel
     */
    hide() {
        this.visible = false;
        this.panelElement.style.display = 'none';
    }

    /**
     * Toggle panel visibility
     */
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Update flight data
     * @param {Object} data - Flight data to update
     */
    update(data) {
        this.data = { ...this.data, ...data };
        if (this.visible) {
            this.render();
        }
    }

    /**
     * Render all instruments
     */
    render() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Instrument positions and sizes
        const instrumentSize = 120;
        const spacing = 20;
        const startX = spacing;
        const centerY = this.height / 2;
        
        // Row 1: Main instruments
        this.drawAirspeedIndicator(startX, centerY - instrumentSize/2, instrumentSize);
        this.drawAttitudeIndicator(startX + instrumentSize + spacing, centerY - instrumentSize/2, instrumentSize);
        this.drawAltimeter(startX + (instrumentSize + spacing) * 2, centerY - instrumentSize/2, instrumentSize);
        
        // Row 1 continued: Navigation instruments
        this.drawHeadingIndicator(startX + (instrumentSize + spacing) * 3, centerY - instrumentSize/2, instrumentSize);
        this.drawVerticalSpeedIndicator(startX + (instrumentSize + spacing) * 4, centerY - instrumentSize/2, instrumentSize);
        this.drawRPMGauge(startX + (instrumentSize + spacing) * 5, centerY - instrumentSize/2, instrumentSize);
        
        // Status indicators at bottom
        this.drawStatusPanel(spacing, this.height - 80, this.width - spacing * 2, 70);
        
        // Warning lights at top
        this.drawWarningLights(spacing, 10, this.width - spacing * 2, 40);
    }

    /**
     * Draw airspeed indicator
     */
    drawAirspeedIndicator(x, y, size) {
        this.drawInstrumentBezel(x, y, size, 'AIRSPEED');
        
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size / 2 - 15;
        
        // Draw speed markings
        this.ctx.strokeStyle = this.colors.markings;
        this.ctx.fillStyle = this.colors.markings;
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Speed range: 0-300 knots, 270 degree arc
        const minSpeed = 0;
        const maxSpeed = 300;
        const arcStart = Math.PI * 0.75;
        const arcEnd = Math.PI * 2.25;
        
        for (let speed = minSpeed; speed <= maxSpeed; speed += 20) {
            const angle = arcStart + (speed / maxSpeed) * (arcEnd - arcStart);
            const innerRadius = radius - 10;
            const outerRadius = radius;
            
            // Tick marks
            this.ctx.beginPath();
            this.ctx.moveTo(
                centerX + Math.cos(angle) * innerRadius,
                centerY + Math.sin(angle) * innerRadius
            );
            this.ctx.lineTo(
                centerX + Math.cos(angle) * outerRadius,
                centerY + Math.sin(angle) * outerRadius
            );
            this.ctx.lineWidth = speed % 100 === 0 ? 2 : 1;
            this.ctx.stroke();
            
            // Labels for major marks
            if (speed % 50 === 0) {
                const labelRadius = innerRadius - 12;
                this.ctx.fillText(
                    speed.toString(),
                    centerX + Math.cos(angle) * labelRadius,
                    centerY + Math.sin(angle) * labelRadius
                );
            }
        }
        
        // Draw pointer
        const airspeedKnots = this.data.airspeed * 1.944; // m/s to knots
        const pointerAngle = arcStart + (Math.min(airspeedKnots, maxSpeed) / maxSpeed) * (arcEnd - arcStart);
        this.drawPointer(centerX, centerY, pointerAngle, radius - 20);
        
        // Digital readout
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(Math.round(airspeedKnots) + ' KTS', centerX, centerY + 20);
    }

    /**
     * Draw attitude indicator (artificial horizon)
     */
    drawAttitudeIndicator(x, y, size) {
        this.drawInstrumentBezel(x, y, size, 'ATTITUDE');
        
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size / 2 - 15;
        
        // Save context for clipping
        this.ctx.save();
        
        // Create circular clip
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.clip();
        
        // Calculate horizon offset based on pitch
        const pitchOffset = (this.data.pitch / 90) * radius * 2;
        
        // Apply roll rotation
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(this.data.roll * Math.PI / 180);
        this.ctx.translate(-centerX, -centerY);
        
        // Draw sky
        this.ctx.fillStyle = this.colors.horizon.sky;
        this.ctx.fillRect(x - size, y - size + pitchOffset, size * 3, size);
        
        // Draw ground
        this.ctx.fillStyle = this.colors.horizon.ground;
        this.ctx.fillRect(x - size, centerY + pitchOffset, size * 3, size);
        
        // Draw horizon line
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size, centerY + pitchOffset);
        this.ctx.lineTo(x + size * 2, centerY + pitchOffset);
        this.ctx.stroke();
        
        // Draw pitch ladder
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.font = '8px Arial';
        this.ctx.fillStyle = '#ffffff';
        
        for (let pitch = -30; pitch <= 30; pitch += 10) {
            if (pitch === 0) continue;
            const lineY = centerY + pitchOffset - (pitch / 90) * radius * 2;
            const lineWidth = pitch % 20 === 0 ? 40 : 20;
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - lineWidth / 2, lineY);
            this.ctx.lineTo(centerX + lineWidth / 2, lineY);
            this.ctx.stroke();
            
            if (pitch % 20 === 0) {
                this.ctx.fillText(Math.abs(pitch).toString(), centerX + lineWidth / 2 + 10, lineY);
            }
        }
        
        // Restore context
        this.ctx.restore();
        
        // Draw fixed aircraft symbol
        this.ctx.strokeStyle = '#ffcc00';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        // Left wing
        this.ctx.moveTo(centerX - 35, centerY);
        this.ctx.lineTo(centerX - 15, centerY);
        // Right wing
        this.ctx.moveTo(centerX + 15, centerY);
        this.ctx.lineTo(centerX + 35, centerY);
        // Center dot
        this.ctx.moveTo(centerX + 5, centerY);
        this.ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Roll indicator arc at top
        this.ctx.strokeStyle = this.colors.markings;
        this.ctx.lineWidth = 1;
        const rollArcRadius = radius - 5;
        
        for (let angle of [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]) {
            const rad = (angle - 90) * Math.PI / 180;
            const innerR = rollArcRadius - (angle % 30 === 0 ? 10 : 5);
            
            this.ctx.beginPath();
            this.ctx.moveTo(
                centerX + Math.cos(rad) * innerR,
                centerY + Math.sin(rad) * innerR
            );
            this.ctx.lineTo(
                centerX + Math.cos(rad) * rollArcRadius,
                centerY + Math.sin(rad) * rollArcRadius
            );
            this.ctx.stroke();
        }
        
        // Roll pointer - fixed triangle at top
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - radius + 15);
        this.ctx.lineTo(centerX - 5, centerY - radius + 5);
        this.ctx.lineTo(centerX + 5, centerY - radius + 5);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * Draw altimeter
     */
    drawAltimeter(x, y, size) {
        this.drawInstrumentBezel(x, y, size, 'ALTITUDE');
        
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size / 2 - 15;
        
        // Draw altitude markings (0-10 for 10,000 scale)
        this.ctx.strokeStyle = this.colors.markings;
        this.ctx.fillStyle = this.colors.markings;
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const innerRadius = radius - 10;
            const outerRadius = radius;
            
            this.ctx.beginPath();
            this.ctx.moveTo(
                centerX + Math.cos(angle) * innerRadius,
                centerY + Math.sin(angle) * innerRadius
            );
            this.ctx.lineTo(
                centerX + Math.cos(angle) * outerRadius,
                centerY + Math.sin(angle) * outerRadius
            );
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            const labelRadius = innerRadius - 12;
            this.ctx.fillText(
                i.toString(),
                centerX + Math.cos(angle) * labelRadius,
                centerY + Math.sin(angle) * labelRadius
            );
        }
        
        // Long pointer (100s of feet)
        const altitude = this.data.altitude * 3.281; // meters to feet
        const hundreds = (altitude % 1000) / 1000;
        const longAngle = hundreds * Math.PI * 2 - Math.PI / 2;
        this.drawPointer(centerX, centerY, longAngle, radius - 20, '#ffffff');
        
        // Short pointer (1000s of feet)
        const thousands = (altitude % 10000) / 10000;
        const shortAngle = thousands * Math.PI * 2 - Math.PI / 2;
        this.drawPointer(centerX, centerY, shortAngle, radius - 35, '#ffffff', true);
        
        // Digital readout
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText(Math.round(altitude) + ' FT', centerX, centerY + 25);
    }

    /**
     * Draw heading indicator
     */
    drawHeadingIndicator(x, y, size) {
        this.drawInstrumentBezel(x, y, size, 'HEADING');
        
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size / 2 - 15;
        
        // Save context for rotation
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(-this.data.heading * Math.PI / 180);
        
        // Draw compass rose
        this.ctx.strokeStyle = this.colors.markings;
        this.ctx.fillStyle = this.colors.markings;
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const cardinals = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
        
        for (let heading = 0; heading < 360; heading += 10) {
            const angle = (heading * Math.PI / 180) - Math.PI / 2;
            const isMajor = heading % 30 === 0;
            const innerRadius = isMajor ? radius - 15 : radius - 8;
            
            this.ctx.beginPath();
            this.ctx.moveTo(
                Math.cos(angle) * innerRadius,
                Math.sin(angle) * innerRadius
            );
            this.ctx.lineTo(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius
            );
            this.ctx.lineWidth = isMajor ? 2 : 1;
            this.ctx.stroke();
            
            // Labels
            if (heading % 30 === 0) {
                const labelRadius = radius - 25;
                const label = cardinals[heading] || (heading / 10).toString();
                this.ctx.fillText(
                    label,
                    Math.cos(angle) * labelRadius,
                    Math.sin(angle) * labelRadius
                );
            }
        }
        
        this.ctx.restore();
        
        // Draw fixed lubber line (pointer at top)
        this.ctx.strokeStyle = '#ffcc00';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - radius + 5);
        this.ctx.lineTo(centerX, centerY - radius + 20);
        this.ctx.stroke();
        
        // Digital heading readout
        const heading = ((Math.round(this.data.heading) % 360) + 360) % 360;
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(heading.toString().padStart(3, '0') + '°', centerX, centerY + 25);
    }

    /**
     * Draw vertical speed indicator
     */
    drawVerticalSpeedIndicator(x, y, size) {
        this.drawInstrumentBezel(x, y, size, 'VERT SPEED');
        
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size / 2 - 15;
        
        // Draw VS scale (-2000 to +2000 fpm)
        this.ctx.strokeStyle = this.colors.markings;
        this.ctx.fillStyle = this.colors.markings;
        this.ctx.font = '9px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const values = [-20, -15, -10, -5, 0, 5, 10, 15, 20];
        
        values.forEach((val, i) => {
            const angle = Math.PI * 0.75 + (i / (values.length - 1)) * Math.PI * 1.5;
            const innerRadius = radius - 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(
                centerX + Math.cos(angle) * innerRadius,
                centerY + Math.sin(angle) * innerRadius
            );
            this.ctx.lineTo(
                centerX + Math.cos(angle) * radius,
                centerY + Math.sin(angle) * radius
            );
            this.ctx.lineWidth = Math.abs(val) % 10 === 0 ? 2 : 1;
            this.ctx.stroke();
            
            if (Math.abs(val) % 10 === 0 || val === 0) {
                const labelRadius = innerRadius - 10;
                this.ctx.fillText(
                    val.toString(),
                    centerX + Math.cos(angle) * labelRadius,
                    centerY + Math.sin(angle) * labelRadius
                );
            }
        });
        
        // Convert m/s to hundreds of fpm and clamp
        const vsFpm = this.data.verticalSpeed * 196.85; // m/s to fpm
        const vsValue = Math.max(-2000, Math.min(2000, vsFpm));
        const normalizedVS = (vsValue + 2000) / 4000;
        const pointerAngle = Math.PI * 0.75 + normalizedVS * Math.PI * 1.5;
        
        this.drawPointer(centerX, centerY, pointerAngle, radius - 20);
        
        // Digital readout
        this.ctx.fillStyle = vsFpm >= 0 ? '#00ff00' : '#ff6600';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.fillText(
            (vsFpm >= 0 ? '+' : '') + Math.round(vsFpm) + ' FPM',
            centerX, centerY + 25
        );
    }

    /**
     * Draw RPM/engine gauge
     */
    drawRPMGauge(x, y, size) {
        this.drawInstrumentBezel(x, y, size, 'ENGINE');
        
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size / 2 - 15;
        
        // Draw throttle arc
        this.ctx.strokeStyle = this.colors.markings;
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';
        
        // Background arc
        this.ctx.strokeStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius - 20, Math.PI * 0.75, Math.PI * 2.25);
        this.ctx.stroke();
        
        // Throttle arc (colored by level)
        const throttleAngle = Math.PI * 0.75 + this.data.throttle * Math.PI * 1.5;
        let throttleColor = '#00ff00';
        if (this.data.throttle > 0.9) {
            throttleColor = '#ff6600';
        } else if (this.data.throttle > 0.7) {
            throttleColor = '#ffcc00';
        }
        this.ctx.strokeStyle = throttleColor;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius - 20, Math.PI * 0.75, throttleAngle);
        this.ctx.stroke();
        
        // Throttle percentage
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(Math.round(this.data.throttle * 100) + '%', centerX, centerY - 5);
        
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText('THROTTLE', centerX, centerY + 12);
        
        // Fuel indicator at bottom
        const fuelWidth = 60;
        const fuelHeight = 10;
        const fuelX = centerX - fuelWidth / 2;
        const fuelY = centerY + 30;
        
        // Fuel background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(fuelX, fuelY, fuelWidth, fuelHeight);
        
        // Fuel level
        let fuelColor = '#ff0000';
        if (this.data.fuelLevel > 25) {
            fuelColor = '#00ff00';
        } else if (this.data.fuelLevel > 10) {
            fuelColor = '#ffcc00';
        }
        this.ctx.fillStyle = fuelColor;
        this.ctx.fillRect(fuelX, fuelY, fuelWidth * (this.data.fuelLevel / 100), fuelHeight);
        
        this.ctx.strokeStyle = '#666';
        this.ctx.strokeRect(fuelX, fuelY, fuelWidth, fuelHeight);
        
        this.ctx.fillStyle = '#888888';
        this.ctx.font = '8px Arial';
        this.ctx.fillText('FUEL', centerX, fuelY + fuelHeight + 10);
    }

    /**
     * Draw instrument bezel
     */
    drawInstrumentBezel(x, y, size, label) {
        // Outer bezel
        this.ctx.fillStyle = this.colors.bezel;
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner face
        this.ctx.fillStyle = this.colors.face;
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size/2, size/2 - 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Label
        this.ctx.fillStyle = '#888888';
        this.ctx.font = '8px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, x + size/2, y + size - 5);
    }

    /**
     * Draw a pointer/needle
     */
    drawPointer(cx, cy, angle, length, color = '#ff0000', isShort = false) {
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(angle);
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        
        if (isShort) {
            // Short, wider pointer
            this.ctx.moveTo(0, -length);
            this.ctx.lineTo(-6, 10);
            this.ctx.lineTo(6, 10);
        } else {
            // Long, thin pointer
            this.ctx.moveTo(0, -length);
            this.ctx.lineTo(-3, 15);
            this.ctx.lineTo(3, 15);
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        // Center cap
        this.ctx.fillStyle = '#444';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    /**
     * Draw warning lights panel
     */
    drawWarningLights(x, y, width, height) {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(x, y, width, height);
        
        const lights = [
            { label: 'STALL', active: this.data.stallWarning, color: '#ff0000' },
            { label: 'GEAR', active: this.data.gearDown, color: '#00ff00' },
            { label: 'FLAPS', active: this.data.flapsPosition > 0, color: '#ffcc00' },
            { label: 'A/P', active: this.data.autopilot, color: '#00ffff' },
            { label: 'LOW FUEL', active: this.data.fuelLevel < 20, color: '#ff0000' },
            { label: 'G-LIMIT', active: Math.abs(this.data.gForce) > 4, color: '#ff0000' }
        ];
        
        const lightWidth = 60;
        const lightHeight = 25;
        const spacing = 10;
        const startX = x + (width - (lights.length * (lightWidth + spacing) - spacing)) / 2;
        
        lights.forEach((light, i) => {
            const lx = startX + i * (lightWidth + spacing);
            const ly = y + (height - lightHeight) / 2;
            
            // Light background
            this.ctx.fillStyle = light.active ? light.color : '#333';
            this.ctx.fillRect(lx, ly, lightWidth, lightHeight);
            
            // Border
            this.ctx.strokeStyle = '#666';
            this.ctx.strokeRect(lx, ly, lightWidth, lightHeight);
            
            // Label
            this.ctx.fillStyle = light.active ? '#000' : '#666';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(light.label, lx + lightWidth/2, ly + lightHeight/2);
        });
    }

    /**
     * Draw status panel at bottom
     */
    drawStatusPanel(x, y, width, height) {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(x, y, width, height);
        
        this.ctx.strokeStyle = '#333';
        this.ctx.strokeRect(x, y, width, height);
        
        // G-Force meter
        this.ctx.fillStyle = '#888';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('G-FORCE:', x + 10, y + 20);
        
        const gForce = this.data.gForce.toFixed(1);
        let gColor = '#00ff00';
        if (Math.abs(this.data.gForce) > 4) {
            gColor = '#ff0000';
        } else if (Math.abs(this.data.gForce) > 3) {
            gColor = '#ffcc00';
        }
        this.ctx.fillStyle = gColor;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(gForce + ' G', x + 70, y + 20);
        
        // Flaps indicator
        this.ctx.fillStyle = '#888';
        this.ctx.font = '10px Arial';
        this.ctx.fillText('FLAPS:', x + 150, y + 20);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(Math.round(this.data.flapsPosition) + '°', x + 200, y + 20);
        
        // Navigation info (if available)
        if (this.data.navInfo) {
            this.ctx.fillStyle = '#888';
            this.ctx.font = '10px Arial';
            this.ctx.fillText('NAV:', x + 280, y + 20);
            
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(this.data.navInfo, x + 310, y + 20);
        }
        
        // Time and coordinates
        this.ctx.fillStyle = '#666';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'right';
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
        this.ctx.fillText(timeStr, x + width - 10, y + 20);
        
        // Position
        if (this.data.position) {
            const posStr = `X: ${Math.round(this.data.position.x)} Y: ${Math.round(this.data.position.y)} Z: ${Math.round(this.data.position.z)}`;
            this.ctx.fillText(posStr, x + width - 10, y + 40);
        }
    }

    /**
     * Set panel position
     * @param {string} position - 'bottom', 'top', or 'custom'
     * @param {Object} customPos - Custom position {x, y} for 'custom'
     */
    setPosition(position, customPos = null) {
        if (position === 'bottom') {
            this.panelElement.style.bottom = '0';
            this.panelElement.style.top = 'auto';
            this.panelElement.style.transform = 'translateX(-50%)';
        } else if (position === 'top') {
            this.panelElement.style.top = '0';
            this.panelElement.style.bottom = 'auto';
            this.panelElement.style.transform = 'translateX(-50%)';
            this.panelElement.style.borderRadius = '0 0 10px 10px';
        } else if (customPos) {
            this.panelElement.style.left = customPos.x + 'px';
            this.panelElement.style.top = customPos.y + 'px';
            this.panelElement.style.transform = 'none';
        }
    }

    /**
     * Dispose of the panel
     */
    dispose() {
        if (this.panelElement && this.panelElement.parentNode) {
            this.panelElement.parentNode.removeChild(this.panelElement);
        }
        this.canvas = null;
        this.ctx = null;
    }
}

export default InstrumentPanel;
