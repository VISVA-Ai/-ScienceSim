/**
 * Projectile Motion Simulation
 * ScienceSim - Physics Lab
 * 
 * Physics:
 * - vₓ = v₀ · cos(θ)
 * - vᵧ = v₀ · sin(θ) - g·t
 * - x = v₀ · cos(θ) · t
 * - y = v₀ · sin(θ) · t - ½g·t²
 */

(function () {
    'use strict';

    // ============================================
    // Constants
    // ============================================
    const SCALE = 3; // pixels per meter
    const GROUND_HEIGHT = 80; // pixels from bottom
    const CANNON_WIDTH = 60;
    const CANNON_HEIGHT = 20;
    const BALL_RADIUS = 8;

    // ============================================
    // State
    // ============================================
    const state = {
        // Parameters
        initialSpeed: 50,      // m/s
        launchAngle: 45,       // degrees
        gravity: 9.8,          // m/s²

        // Simulation state
        isPlaying: false,
        time: 0,

        // Projectile position (meters)
        x: 0,
        y: 0,

        // Velocity components (m/s)
        vx: 0,
        vy: 0,

        // Tracking
        trajectory: [],
        maxHeight: 0,
        range: 0,
        hasLanded: false,

        // Camera
        cameraX: 0,
        cameraY: 0
    };

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
    const speedSlider = document.getElementById('speed-slider');
    const angleSlider = document.getElementById('angle-slider');
    const gravitySlider = document.getElementById('gravity-slider');
    const speedValue = document.getElementById('speed-value');
    const angleValue = document.getElementById('angle-value');
    const gravityValue = document.getElementById('gravity-value');
    const launchBtn = document.getElementById('launch-btn');
    const resetBtn = document.getElementById('reset-btn');

    // Data displays
    const dataTime = document.getElementById('data-time');
    const dataX = document.getElementById('data-x');
    const dataY = document.getElementById('data-y');
    const dataVelocity = document.getElementById('data-velocity');
    const dataMaxHeight = document.getElementById('data-max-height');
    const dataRange = document.getElementById('data-range');

    // ============================================
    // Event Listeners
    // ============================================
    speedSlider.addEventListener('input', (e) => {
        state.initialSpeed = parseFloat(e.target.value);
        speedValue.textContent = `${state.initialSpeed} m/s`;
        if (!state.isPlaying) drawPrediction();
    });

    angleSlider.addEventListener('input', (e) => {
        state.launchAngle = parseFloat(e.target.value);
        angleValue.textContent = `${state.launchAngle}°`;
        if (!state.isPlaying) drawPrediction();
    });

    gravitySlider.addEventListener('input', (e) => {
        state.gravity = parseFloat(e.target.value);
        gravityValue.textContent = `${state.gravity.toFixed(1)} m/s²`;
        if (!state.isPlaying) drawPrediction();
    });

    launchBtn.addEventListener('click', launch);
    resetBtn.addEventListener('click', reset);

    // ============================================
    // Physics Functions
    // ============================================
    function degToRad(deg) {
        return deg * (Math.PI / 180);
    }

    function calculateInitialVelocities() {
        const angleRad = degToRad(state.launchAngle);
        state.vx = state.initialSpeed * Math.cos(angleRad);
        state.vy = state.initialSpeed * Math.sin(angleRad);
    }

    function predictTrajectory() {
        const angleRad = degToRad(state.launchAngle);
        const vx = state.initialSpeed * Math.cos(angleRad);
        const vy = state.initialSpeed * Math.sin(angleRad);

        // Time of flight: t = 2 * vy / g
        const totalTime = (2 * vy) / state.gravity;

        const points = [];
        const steps = 100;

        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * totalTime;
            const x = vx * t;
            const y = vy * t - 0.5 * state.gravity * t * t;

            if (y >= 0) {
                points.push({ x, y });
            }
        }

        return points;
    }

    function update(dt) {
        if (!state.isPlaying || state.hasLanded) return;

        // Update time
        state.time += dt;

        // Calculate position using kinematic equations
        const angleRad = degToRad(state.launchAngle);
        const v0x = state.initialSpeed * Math.cos(angleRad);
        const v0y = state.initialSpeed * Math.sin(angleRad);

        state.x = v0x * state.time;
        state.y = v0y * state.time - 0.5 * state.gravity * state.time * state.time;

        // Update velocity
        state.vx = v0x;
        state.vy = v0y - state.gravity * state.time;

        // Track trajectory
        state.trajectory.push({ x: state.x, y: state.y });

        // Track max height
        if (state.y > state.maxHeight) {
            state.maxHeight = state.y;
        }

        // Ground collision
        if (state.y <= 0 && state.time > 0) {
            state.y = 0;
            state.hasLanded = true;
            state.range = state.x;
            state.isPlaying = false;
            launchBtn.textContent = '🚀 Launch';
        }

        // Update camera to follow projectile
        updateCamera();

        // Update data display
        updateDataDisplay();
    }

    function updateCamera() {
        const targetX = Math.max(0, state.x * SCALE - width / 3);
        const targetY = Math.max(0, state.y * SCALE - height / 2);

        // Smooth camera follow
        state.cameraX += (targetX - state.cameraX) * 0.1;
        state.cameraY += (targetY - state.cameraY) * 0.1;
    }

    // ============================================
    // Rendering
    // ============================================
    function render() {
        // Clear canvas
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        // Save context for camera transform
        ctx.save();
        ctx.translate(-state.cameraX, state.cameraY);

        // Draw grid
        drawGrid();

        // Draw ground
        drawGround();

        // Draw trajectory prediction (when not playing)
        if (!state.isPlaying && !state.hasLanded) {
            drawTrajectoryPrediction();
        }

        // Draw actual trajectory
        drawTrajectory();

        // Draw cannon
        drawCannon();

        // Draw projectile
        if (state.isPlaying || state.hasLanded) {
            drawProjectile();
        }

        // Draw velocity vectors
        if (state.isPlaying && !state.hasLanded) {
            drawVelocityVectors();
        }

        ctx.restore();

        // Draw UI overlay (not affected by camera)
        drawUIOverlay();
    }

    function drawGrid() {
        const gridSpacing = 50 * SCALE; // 50 meters
        const startX = Math.floor(state.cameraX / gridSpacing) * gridSpacing;
        const startY = Math.floor(-state.cameraY / gridSpacing) * gridSpacing;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = startX; x < startX + width + gridSpacing * 2; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height + state.cameraY);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < height + state.cameraY; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(startX, height - GROUND_HEIGHT - y);
            ctx.lineTo(startX + width + gridSpacing, height - GROUND_HEIGHT - y);
            ctx.stroke();
        }

        // Draw distance markers
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '12px Inter';
        for (let x = 0; x < startX + width + gridSpacing * 2; x += gridSpacing) {
            const meters = Math.round(x / SCALE);
            ctx.fillText(`${meters}m`, x + 5, height - GROUND_HEIGHT + 20);
        }
    }

    function drawGround() {
        const groundY = height - GROUND_HEIGHT;

        // Ground gradient
        const gradient = ctx.createLinearGradient(0, groundY, 0, height);
        gradient.addColorStop(0, '#1a1a24');
        gradient.addColorStop(1, '#0a0a0f');

        ctx.fillStyle = gradient;
        ctx.fillRect(state.cameraX, groundY, width + 100, GROUND_HEIGHT);

        // Ground line
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(state.cameraX, groundY);
        ctx.lineTo(state.cameraX + width + 100, groundY);
        ctx.stroke();
    }

    function drawCannon() {
        const cannonX = 40;
        const groundY = height - GROUND_HEIGHT;
        const angleRad = degToRad(state.launchAngle);

        ctx.save();
        ctx.translate(cannonX, groundY);
        ctx.rotate(-angleRad);

        // Cannon barrel
        const gradient = ctx.createLinearGradient(0, -CANNON_HEIGHT / 2, CANNON_WIDTH, CANNON_HEIGHT / 2);
        gradient.addColorStop(0, '#4a4a5a');
        gradient.addColorStop(0.5, '#6a6a7a');
        gradient.addColorStop(1, '#3a3a4a');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(0, -CANNON_HEIGHT / 2, CANNON_WIDTH, CANNON_HEIGHT, 4);
        ctx.fill();

        // Barrel opening
        ctx.fillStyle = '#2a2a3a';
        ctx.beginPath();
        ctx.arc(CANNON_WIDTH, 0, CANNON_HEIGHT / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Cannon base
        ctx.fillStyle = '#3a3a4a';
        ctx.beginPath();
        ctx.arc(cannonX, groundY, 25, Math.PI, 0);
        ctx.fill();
    }

    function drawTrajectoryPrediction() {
        const points = predictTrajectory();
        if (points.length < 2) return;

        const groundY = height - GROUND_HEIGHT;
        const cannonX = 40;

        ctx.beginPath();
        ctx.moveTo(cannonX + points[0].x * SCALE, groundY - points[0].y * SCALE);

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(cannonX + points[i].x * SCALE, groundY - points[i].y * SCALE);
        }

        ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw predicted landing point
        const lastPoint = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(cannonX + lastPoint.x * SCALE, groundY, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.fill();
    }

    function drawTrajectory() {
        if (state.trajectory.length < 2) return;

        const groundY = height - GROUND_HEIGHT;
        const cannonX = 40;

        ctx.beginPath();
        ctx.moveTo(
            cannonX + state.trajectory[0].x * SCALE,
            groundY - state.trajectory[0].y * SCALE
        );

        for (let i = 1; i < state.trajectory.length; i++) {
            ctx.lineTo(
                cannonX + state.trajectory[i].x * SCALE,
                groundY - state.trajectory[i].y * SCALE
            );
        }

        // Gradient stroke
        const gradient = ctx.createLinearGradient(
            cannonX, groundY,
            cannonX + state.x * SCALE, groundY - state.maxHeight * SCALE
        );
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(1, '#c084fc');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    function drawProjectile() {
        const groundY = height - GROUND_HEIGHT;
        const cannonX = 40;
        const screenX = cannonX + state.x * SCALE;
        const screenY = groundY - state.y * SCALE;

        // Glow effect
        const glowGradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, BALL_RADIUS * 3
        );
        glowGradient.addColorStop(0, 'rgba(139, 92, 246, 0.6)');
        glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, BALL_RADIUS * 3, 0, Math.PI * 2);
        ctx.fill();

        // Ball
        const ballGradient = ctx.createRadialGradient(
            screenX - BALL_RADIUS / 3, screenY - BALL_RADIUS / 3, 0,
            screenX, screenY, BALL_RADIUS
        );
        ballGradient.addColorStop(0, '#c084fc');
        ballGradient.addColorStop(1, '#8b5cf6');

        ctx.fillStyle = ballGradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX - 2, screenY - 2, BALL_RADIUS / 3, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawVelocityVectors() {
        const groundY = height - GROUND_HEIGHT;
        const cannonX = 40;
        const screenX = cannonX + state.x * SCALE;
        const screenY = groundY - state.y * SCALE;

        const vectorScale = 2;

        // Total velocity vector
        const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
        const angle = Math.atan2(state.vy, state.vx);

        drawArrow(
            ctx, screenX, screenY,
            screenX + state.vx * vectorScale,
            screenY - state.vy * vectorScale,
            '#10b981', 8
        );

        // X component (dashed)
        ctx.setLineDash([4, 4]);
        drawArrow(
            ctx, screenX, screenY,
            screenX + state.vx * vectorScale, screenY,
            'rgba(59, 130, 246, 0.7)', 6
        );

        // Y component (dashed)
        drawArrow(
            ctx, screenX + state.vx * vectorScale, screenY,
            screenX + state.vx * vectorScale, screenY - state.vy * vectorScale,
            'rgba(59, 130, 246, 0.7)', 6
        );
        ctx.setLineDash([]);
    }

    function drawArrow(ctx, fromX, fromY, toX, toY, color, headLength) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    }

    function drawUIOverlay() {
        // Draw legend
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px Inter';

        // Velocity legend
        ctx.fillStyle = '#10b981';
        ctx.fillRect(width - 150, 20, 12, 12);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('Velocity Vector', width - 130, 30);

        ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
        ctx.fillRect(width - 150, 40, 12, 12);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('Components (vₓ, vᵧ)', width - 130, 50);
    }

    function drawPrediction() {
        render();
    }

    function updateDataDisplay() {
        const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);

        dataTime.textContent = state.time.toFixed(2) + ' s';
        dataX.textContent = state.x.toFixed(2) + ' m';
        dataY.textContent = Math.max(0, state.y).toFixed(2) + ' m';
        dataVelocity.textContent = speed.toFixed(2) + ' m/s';

        if (state.hasLanded) {
            dataMaxHeight.textContent = state.maxHeight.toFixed(2) + ' m';
            dataRange.textContent = state.range.toFixed(2) + ' m';
        } else if (state.maxHeight > 0) {
            dataMaxHeight.textContent = state.maxHeight.toFixed(2) + ' m';
        }
    }

    // ============================================
    // Simulation Controls
    // ============================================
    function launch() {
        if (state.isPlaying) {
            // Pause
            state.isPlaying = false;
            launchBtn.textContent = '🚀 Resume';
        } else if (state.hasLanded) {
            // Already landed, reset first
            reset();
            startLaunch();
        } else if (state.time > 0) {
            // Resume
            state.isPlaying = true;
            launchBtn.textContent = '⏸ Pause';
        } else {
            // Fresh launch
            startLaunch();
        }
    }

    function startLaunch() {
        state.isPlaying = true;
        state.time = 0;
        state.x = 0;
        state.y = 0;
        state.trajectory = [];
        state.maxHeight = 0;
        state.hasLanded = false;
        calculateInitialVelocities();
        launchBtn.textContent = '⏸ Pause';
    }

    function reset() {
        state.isPlaying = false;
        state.time = 0;
        state.x = 0;
        state.y = 0;
        state.vx = 0;
        state.vy = 0;
        state.trajectory = [];
        state.maxHeight = 0;
        state.range = 0;
        state.hasLanded = false;
        state.cameraX = 0;
        state.cameraY = 0;

        launchBtn.textContent = '🚀 Launch';

        // Reset data display
        dataTime.textContent = '0.00 s';
        dataX.textContent = '0.00 m';
        dataY.textContent = '0.00 m';
        dataVelocity.textContent = '0.00 m/s';
        dataMaxHeight.textContent = '— m';
        dataRange.textContent = '— m';

        render();
    }

    // ============================================
    // Animation Loop
    // ============================================
    let lastTime = performance.now();

    function gameLoop(currentTime) {
        const dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // Cap delta time
        const cappedDt = Math.min(dt, 0.1);

        update(cappedDt);
        render();

        requestAnimationFrame(gameLoop);
    }

    // ============================================
    // Initialize
    // ============================================
    function init() {
        // Set initial slider values
        speedValue.textContent = `${state.initialSpeed} m/s`;
        angleValue.textContent = `${state.launchAngle}°`;
        gravityValue.textContent = `${state.gravity.toFixed(1)} m/s²`;

        // Initial render
        render();

        // Start animation loop
        requestAnimationFrame(gameLoop);
    }

    // Initialize mobile nav
    const toggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    init();
})();
