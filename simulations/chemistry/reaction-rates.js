/**
 * Reaction Rates Simulation
 * ScienceSim - Chemistry Lab
 * 
 * Simulates particle collisions and reactions based on kinetic theory.
 */

(function () {
    'use strict';

    // ============================================
    // Constants
    // ============================================
    const ACTIVATION_ENERGY = 20; // threshold velocity squared sum?? Simplified.
    const PARTICLE_RADIUS = 4;

    // Colors
    const COLOR_REACTANT_A = '#3b82f6'; // Blue
    const COLOR_REACTANT_B = '#a855f7'; // Purple (unused for simple A->B)
    const COLOR_PRODUCT = '#10b981';    // Green (Emerald)

    // ============================================
    // State
    // ============================================
    const state = {
        temperature: 300, // Kelvin (simulated unit)
        concentration: 50, // Number of particles

        isPlaying: false,
        time: 0,

        particles: [],

        productsCount: 0,
        initialCount: 0,
        reactionRate: 0,
        lastProductsCount: 0
    };

    class Particle {
        constructor(x, y, speed) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.isProduct = false;
        }

        update(dt, width, height) {
            this.x += this.vx * dt * 60; // Normalize speed
            this.y += this.vy * dt * 60;

            // Wall collisions
            if (this.x < PARTICLE_RADIUS) { this.x = PARTICLE_RADIUS; this.vx *= -1; }
            if (this.x > width - PARTICLE_RADIUS) { this.x = width - PARTICLE_RADIUS; this.vx *= -1; }
            if (this.y < PARTICLE_RADIUS) { this.y = PARTICLE_RADIUS; this.vy *= -1; }
            if (this.y > height - PARTICLE_RADIUS) { this.y = height - PARTICLE_RADIUS; this.vy *= -1; }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, PARTICLE_RADIUS, 0, Math.PI * 2);

            // Glow and Color
            if (this.isProduct) {
                ctx.fillStyle = COLOR_PRODUCT;
                ctx.shadowColor = COLOR_PRODUCT;
            } else {
                ctx.fillStyle = COLOR_REACTANT_A;
                ctx.shadowColor = COLOR_REACTANT_A;
            }
            ctx.shadowBlur = 5;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset
        }
    }

    // ============================================
    // Canvas Setup
    // ============================================
    const container = document.getElementById('canvas-container');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    let width, height;

    function resizeCanvas() {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        width = rect.width;
        height = rect.height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.scale(dpr, dpr);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ============================================
    // DOM Elements
    // ============================================
    const tempSlider = document.getElementById('temp-slider');
    const concSlider = document.getElementById('conc-slider');
    const tempValue = document.getElementById('temp-value');
    const concValue = document.getElementById('conc-value');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');

    const dataTime = document.getElementById('data-time');
    const dataReactants = document.getElementById('data-reactants');
    const dataProducts = document.getElementById('data-products');
    const dataRate = document.getElementById('data-rate');

    // ============================================
    // Event Listeners
    // ============================================
    tempSlider.addEventListener('input', (e) => {
        state.temperature = parseInt(e.target.value);
        tempValue.textContent = `${state.temperature} K`;
        if (!state.isPlaying) reset(); // Reset if changing parameters while stopped
    });

    concSlider.addEventListener('input', (e) => {
        state.concentration = parseInt(e.target.value);
        concValue.textContent = state.concentration;
        if (!state.isPlaying) reset();
    });

    startBtn.addEventListener('click', togglePlay);
    resetBtn.addEventListener('click', reset);

    // ============================================
    // Simulation Logic
    // ============================================

    function initParticles() {
        state.particles = [];
        state.productsCount = 0;
        state.initialCount = state.concentration;
        state.lastProductsCount = 0;

        // Speed relates to sqrt(Temperature) in Kinetic Theory
        // scale factor for visibility
        const baseSpeed = Math.sqrt(state.temperature) / 5;

        for (let i = 0; i < state.concentration; i++) {
            const x = Math.random() * (width - 2 * PARTICLE_RADIUS) + PARTICLE_RADIUS;
            const y = Math.random() * (height - 2 * PARTICLE_RADIUS) + PARTICLE_RADIUS;

            // Random variation in speed (Maxwell-Boltzmann like distribution - simplified)
            const speed = baseSpeed * (0.5 + Math.random());

            state.particles.push(new Particle(x, y, speed));
        }
    }

    function checkCollisions() {
        // Simple O(N^2) collision detection for now
        for (let i = 0; i < state.particles.length; i++) {
            for (let j = i + 1; j < state.particles.length; j++) {
                const p1 = state.particles[i];
                const p2 = state.particles[j];

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distSq = dx * dx + dy * dy;
                const minDist = PARTICLE_RADIUS * 2;

                if (distSq < minDist * minDist) {
                    // Collision!
                    // Elastic collision physics (simplified direction swap for visuals)
                    const tempVx = p1.vx;
                    const tempVy = p1.vy;
                    p1.vx = p2.vx;
                    p1.vy = p2.vy;
                    p2.vx = tempVx;
                    p2.vy = tempVy;

                    // Separate particles to avoid sticking
                    const angle = Math.atan2(dy, dx);
                    const overlap = minDist - Math.sqrt(distSq);
                    const moveX = Math.cos(angle) * overlap / 2;
                    const moveY = Math.sin(angle) * overlap / 2;
                    p1.x -= moveX;
                    p1.y -= moveY;
                    p2.x += moveX;
                    p2.y += moveY;

                    // Reaction Logic
                    // If collisions happen with high energy (Temperature proxy here), reaction can occur
                    // And only if at least one is a reactant. Here we model A + A -> Product (or A -> B via collision)
                    // Let's say A + A -> 2 Products (autocatalytic style or simple conversion)
                    // Or simpler: If Reactant hits any other particle with high energy, it turns to Product.

                    // Activation check: Probability increases with Temperature
                    // This is a statistical simulation
                    const reactionProb = (state.temperature - 100) / 2000; // 0.0 at 100K, 0.45 at 1000K

                    if (Math.random() < reactionProb) {
                        if (!p1.isProduct) { p1.isProduct = true; state.productsCount++; }
                        if (!p2.isProduct) { p2.isProduct = true; state.productsCount++; }
                    }
                }
            }
        }
    }

    function update(dt) {
        if (!state.isPlaying) return;

        state.time += dt;

        // Update rate calculation (products per second approx)
        if (state.time % 0.5 < dt) { // check every ~0.5s
            const deltaP = state.productsCount - state.lastProductsCount;
            state.reactionRate = deltaP / 0.5; // rate per sec
            state.lastProductsCount = state.productsCount;
        }

        // Move particles
        state.particles.forEach(p => p.update(dt, width, height));

        // Collisions and Reactions
        checkCollisions();

        updateDataDisplay();
    }

    function draw() {
        // Clear
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        // Draw Container Box
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, width, height);

        // Draw Particles
        state.particles.forEach(p => p.draw(ctx));
    }

    function updateDataDisplay() {
        dataTime.textContent = state.time.toFixed(1) + ' s';

        const reactantsLeft = state.initialCount - state.productsCount;
        const rPercent = ((reactantsLeft / state.initialCount) * 100).toFixed(0);
        const pPercent = ((state.productsCount / state.initialCount) * 100).toFixed(0);

        dataReactants.textContent = `${reactantsLeft} (${rPercent}%)`;
        dataProducts.textContent = `${state.productsCount} (${pPercent}%)`;
        dataRate.textContent = state.reactionRate.toFixed(1) + ' /s';

        if (state.productsCount === state.initialCount) {
            state.isPlaying = false;
            startBtn.textContent = 'Reaction Complete';
        }
    }

    // ============================================
    // Control Functions
    // ============================================
    function togglePlay() {
        if (state.isPlaying) {
            state.isPlaying = false;
            startBtn.textContent = '▶ Resume';
        } else {
            if (state.particles.length === 0 || state.productsCount === state.initialCount) {
                initParticles();
                state.time = 0;
            }
            state.isPlaying = true;
            startBtn.textContent = '⏸ Pause';
        }
    }

    function reset() {
        state.isPlaying = false;
        state.time = 0;
        state.productsCount = 0;
        state.reactionRate = 0;
        initParticles();
        draw(); // draw initial state
        updateDataDisplay();
        startBtn.textContent = '⚗️ Start Reaction';
    }

    // ============================================
    // Animation Loop
    // ============================================
    let lastTime = performance.now();
    function loop(currentTime) {
        const dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        const cappedDt = Math.min(dt, 0.1);

        update(cappedDt);
        draw();

        requestAnimationFrame(loop);
    }

    // ============================================
    // Init
    // ============================================

    // Resize observer to handle canvas resizing
    // We already attached listener, but need to re-init particles if size changes significantly?
    // For now, simple resize is fine.

    initParticles();
    draw(); // Initial draw
    requestAnimationFrame(loop);

})();
