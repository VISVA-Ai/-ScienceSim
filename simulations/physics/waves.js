/**
 * Wave Motion Simulation
 * ScienceSim - Physics Lab
 * 
 * Physics:
 * - y(x, t) = A * sin(k*x - ω*t + φ)
 * - k = 2π / λ (Wavenumber)
 * - ω = 2π * f (Angular Frequency)
 * - v = f * λ (Wave Speed)
 * - Pulse: A * exp(-(x - v*t)² / 2σ²)
 */

(function () {
    'use strict';

    // ============================================
    // Constants & Configuration
    // ============================================
    const PI = Math.PI;
    const NUM_PARTICLES = 80;
    const PARTICLE_SPACING = 15;
    const MARGIN_LEFT = 50;

    const COLORS = {
        primary: 'hsl(220, 90%, 60%)',
        physics: '#8b5cf6',
        physicsGlow: '#a78bfa',
        text: '#ffffff',
        textMuted: '#71717a'
    };

    // ============================================
    // Simulation State
    // ============================================
    const state = {
        // Wave Types: 'transverse', 'longitudinal'
        type: 'transverse',
        mode: 'continuous', // 'continuous', 'pulse'
        
        // Parameters
        A: 40,          // Amplitude (px)
        f: 1.5,         // Frequency (Hz)
        lambda: 200,    // Wavelength (px)
        damping: 0.02,  // Damping factor
        
        // Physics variables calculated from params
        k: 0,
        omega: 0,
        v: 0,
        
        // Animation
        time: 0,
        pulseStartTime: 0,
        isPlaying: true,
        
        // Particles
        particles: [],
        width: 0,
        height: 0
    };

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        transverseBtn: document.getElementById('transverse-btn'),
        longitudinalBtn: document.getElementById('longitudinal-btn'),
        ampSlider: document.getElementById('amp-slider'),
        freqSlider: document.getElementById('freq-slider'),
        waveSlider: document.getElementById('wave-slider'),
        dampingSlider: document.getElementById('damping-slider'),
        ampVal: document.getElementById('amp-value'),
        freqVal: document.getElementById('freq-value'),
        waveVal: document.getElementById('wave-value'),
        dampingVal: document.getElementById('damping-value'),
        playPauseBtn: document.getElementById('play-pause-btn'),
        pulseBtn: document.getElementById('pulse-btn'),
        vData: document.getElementById('v-data'),
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
        
        setupParticles();
        setupEventListeners();
        calculateWaveParams();
        
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

    function setupParticles() {
        state.particles = [];
        for (let i = 0; i < NUM_PARTICLES; i++) {
            state.particles.push({
                baseX: MARGIN_LEFT + i * PARTICLE_SPACING,
                baseY: 0, // Set in resize or loop
                x: 0,
                y: 0
            });
        }
    }

    // ============================================
    // Event Listeners
    // ============================================
    function setupEventListeners() {
        elements.transverseBtn.addEventListener('click', () => {
            state.type = 'transverse';
            elements.transverseBtn.className = 'sim-btn sim-btn-primary';
            elements.longitudinalBtn.className = 'sim-btn sim-btn-secondary';
        });

        elements.longitudinalBtn.addEventListener('click', () => {
            state.type = 'longitudinal';
            elements.longitudinalBtn.className = 'sim-btn sim-btn-primary';
            elements.transverseBtn.className = 'sim-btn sim-btn-secondary';
        });

        elements.ampSlider.addEventListener('input', (e) => {
            state.A = parseFloat(e.target.value);
            elements.ampVal.textContent = state.A + ' px';
        });

        elements.freqSlider.addEventListener('input', (e) => {
            state.f = parseFloat(e.target.value);
            elements.freqVal.textContent = state.f.toFixed(1) + ' Hz';
            calculateWaveParams();
        });

        elements.waveSlider.addEventListener('input', (e) => {
            state.lambda = parseFloat(e.target.value);
            elements.waveVal.textContent = state.lambda + ' px';
            calculateWaveParams();
        });

        elements.dampingSlider.addEventListener('input', (e) => {
            state.damping = parseFloat(e.target.value);
            elements.dampingVal.textContent = state.damping.toFixed(2);
        });

        elements.playPauseBtn.addEventListener('click', () => {
            state.isPlaying = !state.isPlaying;
            elements.playPauseBtn.innerHTML = state.isPlaying ? '<span>⏸ Pause</span>' : '<span>▶ Play</span>';
            if (state.isPlaying) state.mode = 'continuous';
        });

        elements.pulseBtn.addEventListener('click', () => {
            state.mode = 'pulse';
            state.pulseStartTime = state.time;
            state.isPlaying = true;
            elements.playPauseBtn.innerHTML = '<span>⏸ Pause</span>';
        });
    }

    function calculateWaveParams() {
        state.k = (2 * PI) / state.lambda;
        state.omega = 2 * PI * state.f;
        state.v = state.f * state.lambda;
        elements.vData.textContent = state.v.toFixed(0) + ' px/s';
    }

    // ============================================
    // Logic
    // ============================================
    function update(dt) {
        if (!state.isPlaying) return;
        
        state.time += dt;

        const centerY = state.height / 2;

        state.particles.forEach((p, i) => {
            const x = p.baseX - MARGIN_LEFT;
            let offset = 0;

            if (state.mode === 'continuous') {
                // Harmonic Wave: A * sin(k*x - omega*t) * damping_factor
                const dampingFactor = Math.exp(-state.damping * (x / PARTICLE_SPACING));
                offset = state.A * Math.sin(state.k * x - state.omega * state.time) * dampingFactor;
            } else {
                // Gaussian Pulse: A * exp(-(x - v*(t-t0))² / 2*sigma²)
                const sigma = 40;
                const dist = x - state.v * (state.time - state.pulseStartTime);
                const dampingFactor = Math.exp(-state.damping * (x / PARTICLE_SPACING));
                offset = state.A * Math.exp(-(dist * dist) / (2 * sigma * sigma)) * dampingFactor;
                
                // Switch back to continuous if pulse is gone
                if (i === NUM_PARTICLES - 1 && dist > 200) {
                    state.mode = 'continuous';
                    state.isPlaying = false;
                    elements.playPauseBtn.innerHTML = '<span>▶ Play</span>';
                }
            }

            if (state.type === 'transverse') {
                p.x = p.baseX;
                p.y = centerY + offset;
            } else {
                p.x = p.baseX + offset;
                p.y = centerY;
            }
            
            p.displacement = offset;
        });
    }

    // ============================================
    // Rendering
    // ============================================
    function render() {
        ctx.clearRect(0, 0, state.width, state.height);
        
        // Draw Grid / Axis
        const centerY = state.height / 2;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(state.width, centerY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.stroke();

        // Draw Waves
        if (state.type === 'transverse') {
            drawTransverse();
        } else {
            drawLongitudinal();
        }
    }

    function drawTransverse() {
        // Draw Connecting Line
        ctx.beginPath();
        state.particles.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Beads
        state.particles.forEach((p) => {
            const dispRatio = Math.abs(p.displacement / state.A);
            
            // Glow
            ctx.shadowBlur = 10 * dispRatio;
            ctx.shadowColor = COLORS.physicsGlow;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4 + 2 * dispRatio, 0, PI * 2);
            ctx.fillStyle = dispRatio > 0.1 ? COLORS.physicsGlow : COLORS.textMuted;
            ctx.fill();
        });
        ctx.shadowBlur = 0;
    }

    function drawLongitudinal() {
        // longitudinal waves are better shown with more vertical height to beads
        state.particles.forEach((p) => {
            const dispRatio = Math.abs(p.displacement / state.A);
            
            // Draw a vertical bar or thick bead to show density
            ctx.beginPath();
            ctx.rect(p.x - 2, p.y - 20, 4, 40);
            
            // Highlight based on displacement
            const colorVal = Math.floor(255 * dispRatio);
            ctx.fillStyle = `rgba(167, 139, 250, ${0.3 + 0.7 * dispRatio})`;
            ctx.fill();
            
            // Draw central bead
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, PI * 2);
            ctx.fillStyle = COLORS.text;
            ctx.fill();
        });
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
