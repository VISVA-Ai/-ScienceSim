/**
 * Gas Laws Simulation
 * ScienceSim - Chemistry Lab
 * 
 * Physics & Chemistry:
 * - PV = nRT
 * - P = nRT / V
 * - Vrms = sqrt(3RT / M) (Particle Speed)
 */

(function () {
    'use strict';

    // ============================================
    // Constants & Configuration
    // ============================================
    const PI = Math.PI;
    const BOX_X = 100;
    const BOX_Y = 100;
    const BOX_MAX_WIDTH = 450;
    const BOX_HEIGHT = 300;
    const PARTICLE_RADIUS = 5;
    const R = 0.0821; // Gas constant in arbitrary units

    const COLORS = {
        primary: 'hsl(220, 90%, 60%)',
        physics: '#8b5cf6',
        chemistry: '#10b981',
        chemistryGlow: '#34d399',
        text: '#ffffff',
        textMuted: '#71717a'
    };

    // ============================================
    // Simulation State
    // ============================================
    const state = {
        // Parameters
        n: 50,          // Amount of substance (particle count)
        V: 1.0,         // Volume (L) - mapped to width
        T: 300,         // Temperature (K)
        
        // Calculated
        P: 1.0,         // Pressure (atm)
        
        // Visuals
        particles: [],
        width: 0,
        height: 0,
        boxWidth: BOX_MAX_WIDTH
    };

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        volumeSlider: document.getElementById('volume-slider'),
        tempSlider: document.getElementById('temp-slider'),
        volumeVal: document.getElementById('volume-value'),
        tempVal: document.getElementById('temp-value'),
        pressureData: document.getElementById('pressure-data'),
        countData: document.getElementById('count-data'),
        pumpBtn: document.getElementById('pump-btn'),
        releaseBtn: document.getElementById('release-btn'),
        resetBtn: document.getElementById('reset-btn'),
        container: document.getElementById('canvas-container')
    };

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    elements.container.appendChild(canvas);

    // ============================================
    // Initialization
    // ============================================
    function init() {
        resize();
        window.addEventListener('resize', resize);
        
        setupParticles(state.n);
        setupEventListeners();
        calculatePressure();
        
        requestAnimationFrame(loop);
    }

    function resize() {
        const rect = elements.container.getBoundingClientRect();
        state.width = rect.width;
        state.height = rect.height;
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = state.width * dpr;
        canvas.height = state.height * dpr;
        canvas.style.width = state.width + 'px';
        canvas.style.height = state.height + 'px';
        ctx.scale(dpr, dpr);
    }

    function setupParticles(count) {
        state.particles = [];
        for (let i = 0; i < count; i++) {
            addParticle();
        }
    }

    function addParticle() {
        // Speed proportional to sqrt(T)
        const speed = Math.sqrt(state.T) * 5;
        const angle = Math.random() * PI * 2;
        
        state.particles.push({
            x: BOX_X + Math.random() * (state.boxWidth - 2 * PARTICLE_RADIUS),
            y: BOX_Y + Math.random() * (BOX_HEIGHT - 2 * PARTICLE_RADIUS),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
    }

    // ============================================
    // Event Listeners
    // ============================================
    function setupEventListeners() {
        elements.volumeSlider.addEventListener('input', (e) => {
            state.V = parseFloat(e.target.value);
            state.boxWidth = state.V * BOX_MAX_WIDTH;
            elements.volumeVal.textContent = state.V.toFixed(2) + ' L';
            
            // Push particles back inside if volume shrinks
            state.particles.forEach(p => {
                if (p.x > BOX_X + state.boxWidth - PARTICLE_RADIUS) {
                    p.x = BOX_X + state.boxWidth - PARTICLE_RADIUS - 1;
                }
            });
            
            calculatePressure();
        });

        elements.tempSlider.addEventListener('input', (e) => {
            state.T = parseInt(e.target.value);
            elements.tempVal.textContent = state.T + ' K';
            
            // Update particle speeds
            const speedScale = Math.sqrt(state.T) * 5;
            state.particles.forEach(p => {
                const currentSpeed = Math.sqrt(p.vx**2 + p.vy**2);
                const ratio = speedScale / currentSpeed;
                p.vx *= ratio;
                p.vy *= ratio;
            });
            
            calculatePressure();
        });

        elements.pumpBtn.addEventListener('click', () => {
            for (let i = 0; i < 10; i++) {
                if (state.particles.length < 200) {
                    addParticle();
                }
            }
            state.n = state.particles.length;
            elements.countData.textContent = state.n;
            calculatePressure();
        });

        elements.releaseBtn.addEventListener('click', () => {
            state.particles.splice(0, 10);
            state.n = state.particles.length;
            elements.countData.textContent = state.n;
            calculatePressure();
        });

        elements.resetBtn.addEventListener('click', () => {
            state.n = 50;
            state.V = 1.0;
            state.T = 300;
            state.boxWidth = BOX_MAX_WIDTH;
            elements.volumeSlider.value = 1.0;
            elements.tempSlider.value = 300;
            elements.volumeVal.textContent = '1.00 L';
            elements.tempVal.textContent = '300 K';
            elements.countData.textContent = '50';
            setupParticles(50);
            calculatePressure();
        });
    }

    function calculatePressure() {
        // P = nRT / V (using simplified units)
        // Adjust constant to make 50 particles at 1L, 300K = 1.0 atm
        const k = 1.0 / (50 * 300 / 1.0);
        state.P = k * (state.n * state.T / state.V);
        elements.pressureData.textContent = state.P.toFixed(2) + ' atm';
    }

    // ============================================
    // Logic
    // ============================================
    function update(dt) {
        state.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Boundaries
            const minX = BOX_X + PARTICLE_RADIUS;
            const maxX = BOX_X + state.boxWidth - PARTICLE_RADIUS;
            const minY = BOX_Y + PARTICLE_RADIUS;
            const maxY = BOX_Y + BOX_HEIGHT - PARTICLE_RADIUS;

            if (p.x < minX || p.x > maxX) {
                p.vx *= -1;
                p.x = Math.max(minX, Math.min(p.x, maxX));
            }
            if (p.y < minY || p.y > maxY) {
                p.vy *= -1;
                p.y = Math.max(minY, Math.min(p.y, maxY));
            }
        });
    }

    // ============================================
    // Rendering
    // ============================================
    function render() {
        ctx.clearRect(0, 0, state.width, state.height);
        
        // Draw Container (Back)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(BOX_X, BOX_Y, state.boxWidth, BOX_HEIGHT);

        // Draw Heat Source (if applicable)
        if (state.T > 400) {
            const heatIntensity = (state.T - 400) / 200;
            const grad = ctx.createLinearGradient(BOX_X, BOX_Y + BOX_HEIGHT, BOX_X, BOX_Y + BOX_HEIGHT + 40);
            grad.addColorStop(0, `rgba(248, 113, 113, ${0.4 * heatIntensity})`);
            grad.addColorStop(1, 'rgba(248, 113, 113, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(BOX_X, BOX_Y + BOX_HEIGHT, state.boxWidth, 40);
        }

        // Draw Container Frame
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 4;
        ctx.strokeRect(BOX_X, BOX_Y, state.boxWidth, BOX_HEIGHT);

        // Draw Piston (Side Wall)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(BOX_X + state.boxWidth - 5, BOX_Y - 10, 10, BOX_HEIGHT + 20);
        
        // Draw Particles
        state.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, PI * 2);
            
            // Color based on temperature
            const r = Math.floor(mapRange(state.T, 100, 600, 100, 255));
            const b = Math.floor(mapRange(state.T, 100, 600, 255, 100));
            ctx.fillStyle = `rgb(${r}, 150, ${b})`;
            
            // Add slight glow for moving fast
            if (state.T > 450) {
                ctx.shadowBlur = 5;
                ctx.shadowColor = `rgb(${r}, 150, ${b})`;
            }
            
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Draw Gauges (Simplified)
        drawPressureGauge();
    }

    function drawPressureGauge() {
        const gx = BOX_X + 50;
        const gy = BOX_Y - 50;
        
        // Dial
        ctx.beginPath();
        ctx.arc(gx, gy, 30, PI, 0);
        ctx.strokeStyle = COLORS.textMuted;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Needle
        const angle = mapRange(state.P, 0, 5, -PI, 0);
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + Math.cos(angle) * 25, gy + Math.sin(angle) * 25);
        ctx.strokeStyle = COLORS.chemistryGlow;
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    function mapRange(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }

    // ============================================
    // Loop
    // ============================================
    let lastTime = performance.now();
    function loop(currentTime) {
        const dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        update(Math.min(dt, 0.05));
        render();

        requestAnimationFrame(loop);
    }

    init();

})();
