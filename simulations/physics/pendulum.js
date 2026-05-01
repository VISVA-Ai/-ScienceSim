/**
 * Simple Pendulum Simulation
 * ScienceSim - Physics Lab
 * 
 * Physics:
 * - θ'' = -(g/L) sin(θ) - damping * θ'
 * - PE = m * g * L * (1 - cos(θ))
 * - KE = 0.5 * m * (L * θ')²
 * - T ≈ 2π * sqrt(L/g)
 */

(function () {
    'use strict';

    // ============================================
    // Constants & Configuration
    // ============================================
    const PI = Math.PI;
    const METERS_TO_PIXELS = 150; // Scale: 1m = 150px
    const BOB_RADIUS = 15;
    const PIVOT_Y = 100; // Pixels from top

    // Colors from design system
    const COLORS = {
        primary: 'hsl(220, 90%, 60%)',
        physics: '#8b5cf6',
        chemistry: '#10b981',
        text: '#ffffff',
        textMuted: '#71717a',
        background: '#0a0a0f',
        grid: 'rgba(255, 255, 255, 0.05)'
    };

    // ============================================
    // Simulation State
    // ============================================
    const state = {
        // Parameters
        L: 1.5,          // Length (m)
        g: 9.8,          // Gravity (m/s²)
        m: 1.0,          // Mass (kg)
        damping: 0.05,   // Damping coefficient

        // Motion State
        theta: PI / 4,   // Angle (rad)
        omega: 0,        // Angular velocity (rad/s)
        alpha: 0,        // Angular acceleration (rad/s²)
        
        // UI State
        isPlaying: false,
        isDragging: false,
        
        // Data
        time: 0,
        ke: 0,
        pe: 0,
        totalEnergy: 0,
        lastPeriod: 0,
        peaks: [], // For measuring period
        
        // Dimensions
        width: 0,
        height: 0
    };

    // ============================================
    // Initialization
    // ============================================
    const container = document.getElementById('canvas-container');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    // DOM Elements
    const elements = {
        lengthSlider: document.getElementById('length-slider'),
        gravitySlider: document.getElementById('gravity-slider'),
        massSlider: document.getElementById('mass-slider'),
        dampingSlider: document.getElementById('damping-slider'),
        lengthVal: document.getElementById('length-value'),
        gravityVal: document.getElementById('gravity-value'),
        massVal: document.getElementById('mass-value'),
        dampingVal: document.getElementById('damping-value'),
        playPauseBtn: document.getElementById('play-pause-btn'),
        resetBtn: document.getElementById('reset-btn'),
        periodData: document.getElementById('period-data'),
        angleData: document.getElementById('angle-data'),
        omegaData: document.getElementById('omega-data'),
        keBar: document.getElementById('ke-bar'),
        peBar: document.getElementById('pe-bar')
    };

    function init() {
        resize();
        window.addEventListener('resize', resize);
        
        setupEventListeners();
        calculateEnergy();
        updateUI();
        
        requestAnimationFrame(loop);
    }

    function resize() {
        const rect = container.getBoundingClientRect();
        state.width = rect.width;
        state.height = rect.height;
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = state.width * dpr;
        canvas.height = state.height * dpr;
        canvas.style.width = state.width + 'px';
        canvas.style.height = state.height + 'px';
        ctx.scale(dpr, dpr);
    }

    // ============================================
    // Event Listeners
    // ============================================
    function setupEventListeners() {
        // Parameter Sliders
        elements.lengthSlider.addEventListener('input', (e) => {
            state.L = parseFloat(e.target.value);
            elements.lengthVal.textContent = state.L.toFixed(1) + ' m';
            if (!state.isPlaying) resetPeaks();
        });

        elements.gravitySlider.addEventListener('input', (e) => {
            state.g = parseFloat(e.target.value);
            elements.gravityVal.textContent = state.g.toFixed(1) + ' m/s²';
            if (!state.isPlaying) resetPeaks();
        });

        elements.massSlider.addEventListener('input', (e) => {
            state.m = parseFloat(e.target.value);
            elements.massVal.textContent = state.m.toFixed(1) + ' kg';
        });

        elements.dampingSlider.addEventListener('input', (e) => {
            state.damping = parseFloat(e.target.value);
            elements.dampingVal.textContent = state.damping.toFixed(2);
        });

        // Controls
        elements.playPauseBtn.addEventListener('click', () => {
            state.isPlaying = !state.isPlaying;
            elements.playPauseBtn.innerHTML = state.isPlaying ? '<span>⏸ Pause</span>' : '<span>▶ Play</span>';
        });

        elements.resetBtn.addEventListener('click', () => {
            state.isPlaying = false;
            state.theta = PI / 4;
            state.omega = 0;
            state.alpha = 0;
            state.time = 0;
            state.lastPeriod = 0;
            resetPeaks();
            elements.playPauseBtn.innerHTML = '<span>▶ Play</span>';
            updateUI();
        });

        // Interaction (Grabbing the bob)
        canvas.addEventListener('mousedown', onStartDrag);
        canvas.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', onEndDrag);
        
        canvas.addEventListener('touchstart', (e) => onStartDrag(e.touches[0]));
        canvas.addEventListener('touchmove', (e) => onDrag(e.touches[0]));
        window.addEventListener('touchend', onEndDrag);
    }

    function onStartDrag(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const pivotX = state.width / 2;
        const bobX = pivotX + Math.sin(state.theta) * state.L * METERS_TO_PIXELS;
        const bobY = PIVOT_Y + Math.cos(state.theta) * state.L * METERS_TO_PIXELS;
        
        const dist = Math.sqrt((mouseX - bobX)**2 + (mouseY - bobY)**2);
        if (dist < BOB_RADIUS * 2) {
            state.isDragging = true;
            state.isPlaying = false;
            elements.playPauseBtn.innerHTML = '<span>▶ Play</span>';
        }
    }

    function onDrag(e) {
        if (!state.isDragging) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const pivotX = state.width / 2;
        const dx = mouseX - pivotX;
        const dy = mouseY - PIVOT_Y;
        
        state.theta = Math.atan2(dx, dy);
        state.omega = 0; // Hold still while dragging
        resetPeaks();
    }

    function onEndDrag() {
        state.isDragging = false;
    }

    function resetPeaks() {
        state.peaks = [];
        state.lastPeriod = 0;
    }

    // ============================================
    // Physics Logic
    // ============================================
    function update(dt) {
        if (!state.isPlaying || state.isDragging) return;

        // Integration using Euler-Cromer (semi-implicit Euler)
        // More stable for oscillating systems
        state.alpha = -(state.g / state.L) * Math.sin(state.theta) - (state.damping * state.omega);
        state.omega += state.alpha * dt;
        state.theta += state.omega * dt;
        
        state.time += dt;

        calculateEnergy();
        measurePeriod(dt);
    }

    function calculateEnergy() {
        // Potential Energy (referenced to lowest point)
        state.pe = state.m * state.g * state.L * (1 - Math.cos(state.theta));
        
        // Kinetic Energy
        const velocity = state.L * state.omega;
        state.ke = 0.5 * state.m * velocity * velocity;
        
        state.totalEnergy = state.ke + state.pe;
    }

    function measurePeriod(dt) {
        // Detect peaks to calculate period
        // Peak is when omega crosses 0 (velocity changes direction)
        const previousOmega = state.omega - state.alpha * dt;
        if (previousOmega > 0 && state.omega <= 0 || previousOmega < 0 && state.omega >= 0) {
            state.peaks.push(state.time);
            if (state.peaks.length >= 3) {
                // Time between two peaks of the same direction is one period
                // Time between any two consecutive peaks is half a period
                const p1 = state.peaks[state.peaks.length - 1];
                const p2 = state.peaks[state.peaks.length - 3];
                state.lastPeriod = p1 - p2;
            }
        }
    }

    // ============================================
    // Rendering
    // ============================================
    function render() {
        ctx.clearRect(0, 0, state.width, state.height);
        
        const pivotX = state.width / 2;
        const bobX = pivotX + Math.sin(state.theta) * state.L * METERS_TO_PIXELS;
        const bobY = PIVOT_Y + Math.cos(state.theta) * state.L * METERS_TO_PIXELS;

        // Draw Grid
        drawGridLine();

        // Draw String
        ctx.beginPath();
        ctx.moveTo(pivotX, PIVOT_Y);
        ctx.lineTo(bobX, bobY);
        ctx.strokeStyle = COLORS.textMuted;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Angle Arc
        drawAngleArc(pivotX, PIVOT_Y);

        // Draw Bob
        drawBob(bobX, bobY);

        // Draw Pivot
        ctx.beginPath();
        ctx.arc(pivotX, PIVOT_Y, 5, 0, PI * 2);
        ctx.fillStyle = COLORS.text;
        ctx.fill();

        // Draw Forces (Visual enhancement)
        if (state.isPlaying) {
            drawVectors(bobX, bobY);
        }
    }

    function drawGridLine() {
        ctx.beginPath();
        ctx.moveTo(0, PIVOT_Y);
        ctx.lineTo(state.width, PIVOT_Y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Vertical dashed center line
        ctx.beginPath();
        ctx.moveTo(state.width / 2, PIVOT_Y);
        ctx.lineTo(state.width / 2, state.height);
        ctx.stroke();
    }

    function drawAngleArc(px, py) {
        const radius = 40;
        ctx.beginPath();
        ctx.arc(px, py, radius, PI/2, PI/2 + state.theta, state.theta < 0);
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.lineWidth = 15;
        ctx.stroke();
        
        // Text label for angle
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        const angleDeg = (state.theta * 180 / PI).toFixed(1);
        ctx.fillText(`${angleDeg}°`, px + Math.sin(state.theta/2) * (radius+10), py + Math.cos(state.theta/2) * (radius+10));
    }

    function drawBob(x, y) {
        // Shadow/Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, BOB_RADIUS * 2);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, BOB_RADIUS * 2, 0, PI * 2);
        ctx.fill();

        // Main Bob
        const bobGrad = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, BOB_RADIUS);
        bobGrad.addColorStop(0, '#c084fc');
        bobGrad.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = bobGrad;
        ctx.beginPath();
        ctx.arc(x, y, BOB_RADIUS, 0, PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.beginPath();
        ctx.arc(x - 4, y - 4, 3, 0, PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
    }

    function drawVectors(x, y) {
        const vScale = 30;
        // Gravity Vector
        drawArrow(ctx, x, y, x, y + state.m * 10, '#ff4444', 6);
        
        // Velocity Vector
        const vx = Math.cos(state.theta) * state.omega * state.L * vScale;
        const vy = -Math.sin(state.theta) * state.omega * state.L * vScale;
        drawArrow(ctx, x, y, x + vx, y + vy, '#10b981', 6);
    }

    function drawArrow(ctx, fromX, fromY, toX, toY, color, headLength) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle - PI / 6), toY - headLength * Math.sin(angle - PI / 6));
        ctx.lineTo(toX - headLength * Math.cos(angle + PI / 6), toY - headLength * Math.sin(angle + PI / 6));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    // ============================================
    // UI Updates
    // ============================================
    function updateUI() {
        elements.angleData.textContent = (state.theta * 180 / PI).toFixed(2) + '°';
        elements.omegaData.textContent = state.omega.toFixed(2) + ' rad/s';
        elements.periodData.textContent = state.lastPeriod > 0 ? state.lastPeriod.toFixed(3) + ' s' : '... s';
        
        // Energy Bars
        // Normalize against max possible energy approx (mgh at start angle)
        const maxE = state.m * state.g * state.L * 2; // Loose upper bound
        const keH = (state.ke / maxE) * 100;
        const peH = (state.pe / maxE) * 100;
        
        elements.keBar.style.height = Math.min(100, keH) + '%';
        elements.peBar.style.height = Math.min(100, peH) + '%';
    }

    // ============================================
    // Loop
    // ============================================
    let lastTime = performance.now();
    function loop(currentTime) {
        const dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // Cap dt to avoid large jumps
        const cappedDt = Math.min(dt, 0.05);
        
        // Simple sub-stepping for smoother physics
        const steps = 5;
        for (let i = 0; i < steps; i++) {
            update(cappedDt / steps);
        }

        render();
        updateUI();

        requestAnimationFrame(loop);
    }

    init();

})();
