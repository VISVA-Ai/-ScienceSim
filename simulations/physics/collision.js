/**
 * Elastic Collision Simulation
 * ScienceSim - Physics Lab
 *
 * Physics (1D Elastic Collision):
 * - Conservation of Momentum:  m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'
 * - Conservation of KE:        ½m₁v₁² + ½m₂v₂² = ½m₁v₁'² + ½m₂v₂'²
 * - v₁' = ((m₁-m₂)v₁ + 2m₂v₂) / (m₁+m₂)
 * - v₂' = ((m₂-m₁)v₂ + 2m₁v₁) / (m₁+m₂)
 */

(function () {
    'use strict';

    const SCALE = 40; // pixels per meter
    const MIN_RADIUS = 20;

    const state = {
        m1: 2.0, m2: 3.0,
        v1: 5.0, v2: -3.0,
        v1f: 0, v2f: 0,
        x1: 0, x2: 0,
        startX1: 0, startX2: 0,
        isPlaying: false,
        hasCollided: false,
        time: 0,
        trail1: [], trail2: []
    };

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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // DOM
    const mass1Slider = document.getElementById('mass1-slider');
    const vel1Slider = document.getElementById('vel1-slider');
    const mass2Slider = document.getElementById('mass2-slider');
    const vel2Slider = document.getElementById('vel2-slider');
    const mass1Value = document.getElementById('mass1-value');
    const vel1Value = document.getElementById('vel1-value');
    const mass2Value = document.getElementById('mass2-value');
    const vel2Value = document.getElementById('vel2-value');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const dataMomentum = document.getElementById('data-momentum');
    const dataKE = document.getElementById('data-ke');
    const dataV1f = document.getElementById('data-v1f');
    const dataV2f = document.getElementById('data-v2f');
    const dataStatus = document.getElementById('data-status');

    function getRadius(m) {
        return MIN_RADIUS + m * 3;
    }

    function setupPositions() {
        const r1 = getRadius(state.m1);
        const r2 = getRadius(state.m2);
        state.x1 = width * 0.25;
        state.x2 = width * 0.75;
        state.startX1 = state.x1;
        state.startX2 = state.x2;
    }

    // Events
    mass1Slider.addEventListener('input', (e) => {
        state.m1 = parseFloat(e.target.value);
        mass1Value.textContent = state.m1.toFixed(1) + ' kg';
        if (!state.isPlaying) { setupPositions(); render(); }
    });
    vel1Slider.addEventListener('input', (e) => {
        state.v1 = parseFloat(e.target.value);
        vel1Value.textContent = state.v1.toFixed(1) + ' m/s';
    });
    mass2Slider.addEventListener('input', (e) => {
        state.m2 = parseFloat(e.target.value);
        mass2Value.textContent = state.m2.toFixed(1) + ' kg';
        if (!state.isPlaying) { setupPositions(); render(); }
    });
    vel2Slider.addEventListener('input', (e) => {
        state.v2 = parseFloat(e.target.value);
        vel2Value.textContent = state.v2.toFixed(1) + ' m/s';
    });

    startBtn.addEventListener('click', () => {
        if (state.isPlaying) {
            state.isPlaying = false;
            startBtn.textContent = '▶ Resume';
        } else {
            if (state.hasCollided && state.time > 5) {
                resetSim();
            }
            state.isPlaying = true;
            startBtn.textContent = '⏸ Pause';
        }
    });
    resetBtn.addEventListener('click', resetSim);

    function resetSim() {
        state.isPlaying = false;
        state.hasCollided = false;
        state.time = 0;
        state.v1f = 0;
        state.v2f = 0;
        state.trail1 = [];
        state.trail2 = [];
        setupPositions();
        startBtn.textContent = '▶ Start';
        dataStatus.textContent = 'Ready';
        dataV1f.textContent = '— m/s';
        dataV2f.textContent = '— m/s';
        render();
    }

    function calculateFinalVelocities() {
        const { m1, m2, v1, v2 } = state;
        state.v1f = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
        state.v2f = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
    }

    function update(dt) {
        if (!state.isPlaying) return;
        state.time += dt;

        const r1 = getRadius(state.m1);
        const r2 = getRadius(state.m2);

        if (!state.hasCollided) {
            // Move with initial velocities
            state.x1 += state.v1 * SCALE * dt;
            state.x2 += state.v2 * SCALE * dt;

            // Check collision
            const dist = Math.abs(state.x2 - state.x1);
            if (dist <= r1 + r2) {
                state.hasCollided = true;
                calculateFinalVelocities();
                dataStatus.textContent = 'Collided!';
                dataV1f.textContent = state.v1f.toFixed(2) + ' m/s';
                dataV2f.textContent = state.v2f.toFixed(2) + ' m/s';
            }
        } else {
            // Move with final velocities
            state.x1 += state.v1f * SCALE * dt;
            state.x2 += state.v2f * SCALE * dt;
        }

        // Record trails
        state.trail1.push({ x: state.x1, y: height / 2 });
        state.trail2.push({ x: state.x2, y: height / 2 });
        if (state.trail1.length > 200) state.trail1.shift();
        if (state.trail2.length > 200) state.trail2.shift();

        updateData();
    }

    function updateData() {
        const cv1 = state.hasCollided ? state.v1f : state.v1;
        const cv2 = state.hasCollided ? state.v2f : state.v2;
        const momentum = state.m1 * cv1 + state.m2 * cv2;
        const ke = 0.5 * state.m1 * cv1 * cv1 + 0.5 * state.m2 * cv2 * cv2;
        dataMomentum.textContent = momentum.toFixed(2) + ' kg·m/s';
        dataKE.textContent = ke.toFixed(2) + ' J';
    }

    function render() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        const centerY = height / 2;

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 50) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 50) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        // Center line (floor)
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, centerY + 60);
        ctx.lineTo(width, centerY + 60);
        ctx.stroke();

        // Trails
        drawTrail(state.trail1, 'rgba(59, 130, 246, 0.3)');
        drawTrail(state.trail2, 'rgba(16, 185, 129, 0.3)');

        // Velocity arrows (before collision)
        if (!state.hasCollided && !state.isPlaying) {
            drawVelocityArrow(state.x1, centerY, state.v1, '#3b82f6');
            drawVelocityArrow(state.x2, centerY, state.v2, '#10b981');
        }

        // Velocity arrows (current)
        if (state.isPlaying || state.hasCollided) {
            const cv1 = state.hasCollided ? state.v1f : state.v1;
            const cv2 = state.hasCollided ? state.v2f : state.v2;
            drawVelocityArrow(state.x1, centerY, cv1, '#3b82f6');
            drawVelocityArrow(state.x2, centerY, cv2, '#10b981');
        }

        // Object 1
        drawBall(state.x1, centerY, getRadius(state.m1), '#3b82f6', '#60a5fa', `m₁=${state.m1.toFixed(1)}`);
        // Object 2
        drawBall(state.x2, centerY, getRadius(state.m2), '#10b981', '#34d399', `m₂=${state.m2.toFixed(1)}`);

        // Collision flash
        if (state.hasCollided && state.time < 0.3) {
            const r1 = getRadius(state.m1);
            const flashX = (state.x1 + state.x2) / 2;
            const alpha = 1 - state.time / 0.3;
            const grad = ctx.createRadialGradient(flashX, centerY, 0, flashX, centerY, 80);
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(flashX, centerY, 80, 0, Math.PI * 2);
            ctx.fill();
        }

        // Legend
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px Inter';
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(width - 150, 20, 12, 12);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('Object 1', width - 130, 30);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(width - 150, 40, 12, 12);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('Object 2', width - 130, 50);
    }

    function drawTrail(trail, color) {
        if (trail.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    function drawBall(x, y, r, color1, color2, label) {
        // Glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
        glow.addColorStop(0, color1.replace(')', ', 0.4)').replace('rgb', 'rgba'));
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Ball
        const grad = ctx.createRadialGradient(x - r / 3, y - r / 3, 0, x, y, r);
        grad.addColorStop(0, color2);
        grad.addColorStop(1, color1);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(x - r / 4, y - r / 4, r / 4, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + r + 18);
    }

    function drawVelocityArrow(x, y, v, color) {
        if (Math.abs(v) < 0.1) return;
        const len = v * 15;
        const toX = x + len;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 40);
        ctx.lineTo(toX, y - 40);
        ctx.stroke();

        const headLen = 8;
        const angle = v > 0 ? 0 : Math.PI;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(toX, y - 40);
        ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), y - 40 - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), y - 40 - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${v.toFixed(1)} m/s`, (x + toX) / 2, y - 48);
    }

    let lastTime = performance.now();
    function gameLoop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        update(dt);
        render();
        requestAnimationFrame(gameLoop);
    }

    setupPositions();
    updateData();
    render();
    requestAnimationFrame(gameLoop);

    // Mobile nav
    const toggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
        toggle.addEventListener('click', () => navLinks.classList.toggle('active'));
    }
})();
