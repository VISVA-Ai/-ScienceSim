/**
 * pH Scale Simulation
 * ScienceSim - Chemistry Lab
 * 
 * Chemistry:
 * - pH = -log10[H3O+]
 * - pOH = 14 - pH
 * - [H3O+][OH-] = 1e-14
 * - Dilution: C1V1 = C2V2
 */

(function () {
    'use strict';

    // ============================================
    // Constants & Configuration
    // ============================================
    const PI = Math.PI;
    const ION_COUNT_MAX = 200; // Max visual particles
    const BEAKER_WIDTH = 300;
    const BEAKER_HEIGHT = 400;

    // ============================================
    // Simulation State
    // ============================================
    const state = {
        basePH: 7.0,
        dilution: 1.0, // Factor of volume
        currentPH: 7.0,
        
        // Concentrations
        h3oConc: 1e-7,
        ohConc: 1e-7,

        // Visuals
        particles: [],
        width: 0,
        height: 0,
        liquidColor: 'rgba(52, 211, 153, 0.3)'
    };

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        substanceSelect: document.getElementById('substance-select'),
        dilutionSlider: document.getElementById('dilution-slider'),
        dilutionVal: document.getElementById('dilution-value'),
        hConcDisplay: document.getElementById('h-conc'),
        ohConcDisplay: document.getElementById('oh-conc'),
        phValDisplay: document.getElementById('ph-val'),
        phCategory: document.getElementById('ph-category'),
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
        
        setupEventListeners();
        updateSimulation();
        
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

    // ============================================
    // Event Listeners
    // ============================================
    function setupEventListeners() {
        elements.substanceSelect.addEventListener('change', (e) => {
            state.basePH = parseFloat(e.target.value);
            updateSimulation();
        });

        elements.dilutionSlider.addEventListener('input', (e) => {
            state.dilution = parseFloat(e.target.value);
            elements.dilutionVal.textContent = state.dilution.toFixed(2) + 'x';
            updateSimulation();
        });

        elements.resetBtn.addEventListener('click', () => {
            elements.substanceSelect.value = "7.0";
            state.basePH = 7.0;
            state.dilution = 1.0;
            elements.dilutionSlider.value = 1.0;
            elements.dilutionVal.textContent = '1.00x';
            updateSimulation();
        });
    }

    // ============================================
    // Logic
    // ============================================
    function updateSimulation() {
        // Calculate [H3O+] for initial substance
        const baseH3O = Math.pow(10, -state.basePH);
        
        // Dilution: [H+]_new = [H+]_base / dilution
        // This is a simplification for educational purposes
        let currentH3O = baseH3O / state.dilution;
        
        // Auto-ionization of water takes over at high dilution
        // Kw = [H+][OH-] = 1e-14
        // For pH < 7, minimum [H+] is 1e-7 (at 25C)
        // For pH > 7, minimum [OH-] is 1e-7
        
        if (state.basePH < 7) {
            currentH3O = Math.max(currentH3O, 1e-7);
        } else if (state.basePH > 7) {
            // [OH-] = 10^-(14-pH)
            let baseOH = Math.pow(10, -(14 - state.basePH));
            let currentOH = baseOH / state.dilution;
            currentOH = Math.max(currentOH, 1e-7);
            currentH3O = 1e-14 / currentOH;
        } else {
            currentH3O = 1e-7;
        }

        state.h3oConc = currentH3O;
        state.ohConc = 1e-14 / currentH3O;
        state.currentPH = -Math.log10(state.h3oConc);

        // Update color
        state.liquidColor = getPHColor(state.currentPH);

        // Update UI
        updateUI();
        
        // Update Particles
        syncParticles();
    }

    function getPHColor(ph) {
        // Simple pH color scale
        // Acid (0-6): Red-Yellow
        // Neutral (7): Green
        // Base (8-14): Blue-Purple
        
        let h;
        if (ph < 7) {
            // 0 -> 0 (Red), 7 -> 120 (Green)
            h = (ph / 7) * 120;
        } else {
            // 7 -> 120 (Green), 14 -> 280 (Purple)
            h = 120 + ((ph - 7) / 7) * 160;
        }
        
        return `hsla(${h}, 70%, 50%, 0.4)`;
    }

    function updateUI() {
        elements.phValDisplay.textContent = state.currentPH.toFixed(2);
        elements.hConcDisplay.textContent = state.h3oConc.toExponential(2);
        elements.ohConcDisplay.textContent = state.ohConc.toExponential(2);
        
        let category = 'Neutral';
        let color = '#34d399';
        
        if (state.currentPH < 6.5) {
            category = 'Acidic';
            color = '#f87171';
        } else if (state.currentPH > 7.5) {
            category = 'Basic';
            color = '#60a5fa';
        }
        
        elements.phCategory.textContent = category;
        elements.phCategory.style.color = color;
        elements.phValDisplay.style.color = getPHColor(state.currentPH).replace('0.4', '1');
    }

    function syncParticles() {
        // We want to show more H3O+ when acidic, more OH- when basic
        // But since concentrations vary by 14 orders of magnitude, we use a log scale
        
        // Target counts
        const hCount = Math.floor(Math.max(0, (7 - state.currentPH) * 20));
        const ohCount = Math.floor(Math.max(0, (state.currentPH - 7) * 20));
        const neutralCount = 20; // Constant water molecules

        const totalTarget = hCount + ohCount + neutralCount;
        
        // For simplicity, just reset particles and add new ones
        // or add/remove to match target
        state.particles = [];
        
        // Add H3O+ (Red)
        for (let i = 0; i < hCount; i++) addParticle('h3o');
        // Add OH- (Blue)
        for (let i = 0; i < ohCount; i++) addParticle('oh');
        // Add H2O (White/Gray)
        for (let i = 0; i < neutralCount; i++) addParticle('h2o');
    }

    function addParticle(type) {
        state.particles.push({
            type,
            x: Math.random() * BEAKER_WIDTH,
            y: Math.random() * BEAKER_HEIGHT,
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            r: type === 'h2o' ? 4 : 6
        });
    }

    function updateParticles(dt) {
        state.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Bounce off beaker walls
            if (p.x < 0 || p.x > BEAKER_WIDTH) p.vx *= -1;
            if (p.y < 0 || p.y > BEAKER_HEIGHT) p.vy *= -1;
            
            p.x = Math.max(0, Math.min(p.x, BEAKER_WIDTH));
            p.y = Math.max(0, Math.min(p.y, BEAKER_HEIGHT));
        });
    }

    // ============================================
    // Rendering
    // ============================================
    function render() {
        ctx.clearRect(0, 0, state.width, state.height);
        
        const centerX = state.width / 2;
        const centerY = state.height / 2 + 50;
        
        ctx.save();
        ctx.translate(centerX - BEAKER_WIDTH/2, centerY - BEAKER_HEIGHT);

        // Draw Beaker Back
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, BEAKER_HEIGHT);
        ctx.lineTo(BEAKER_WIDTH, BEAKER_HEIGHT);
        ctx.lineTo(BEAKER_WIDTH, 0);
        ctx.stroke();

        // Draw Liquid
        const fillHeight = BEAKER_HEIGHT * 0.8;
        ctx.fillStyle = state.liquidColor;
        ctx.fillRect(0, BEAKER_HEIGHT - fillHeight, BEAKER_WIDTH, fillHeight);
        
        // Draw Liquid Surface Glow
        ctx.strokeStyle = state.liquidColor.replace('0.4', '0.8');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, BEAKER_HEIGHT - fillHeight);
        ctx.lineTo(BEAKER_WIDTH, BEAKER_HEIGHT - fillHeight);
        ctx.stroke();

        // Draw Particles
        state.particles.forEach(p => {
            // Only draw particles within the liquid
            if (p.y > (BEAKER_HEIGHT - fillHeight)) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, PI * 2);
                
                if (p.type === 'h3o') {
                    ctx.fillStyle = '#f87171';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#f87171';
                } else if (p.type === 'oh') {
                    ctx.fillStyle = '#60a5fa';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#60a5fa';
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.shadowBlur = 0;
                }
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });

        // Draw Beaker Front Glass Reflection
        const grad = ctx.createLinearGradient(0, 0, BEAKER_WIDTH, 0);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.1, 'rgba(255, 255, 255, 0.05)');
        grad.addColorStop(0.2, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, BEAKER_WIDTH, BEAKER_HEIGHT);

        ctx.restore();
    }

    // ============================================
    // Loop
    // ============================================
    let lastTime = performance.now();
    function loop(currentTime) {
        const dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        updateParticles(Math.min(dt, 0.05));
        render();

        requestAnimationFrame(loop);
    }

    init();

})();
