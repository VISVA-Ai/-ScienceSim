/**
 * Inclined Plane Simulation
 * ScienceSim - Physics Lab
 *
 * Physics:
 * - F_parallel   = mg·sin(θ) (component of gravity along the plane)
 * - F_normal     = mg·cos(θ) (normal force)
 * - F_friction   = μ·N = μ·mg·cos(θ)
 * - Net force    = mg·sin(θ) − μ·mg·cos(θ) (if > 0, slides down)
 * - a = g·(sin(θ) − μ·cos(θ))
 */

(function () {
    'use strict';

    const state = {
        angle: 30, m: 2.0, mu: 0.20, g: 9.8,
        s: 0, v: 0, a: 0,
        isPlaying: false,
        time: 0,
        canSlide: true
    };

    const container = document.getElementById('canvas-container');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    container.appendChild(canvas);
    let W, H;

    function resize() {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        W = rect.width; H = rect.height;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    // DOM
    const angleSlider = document.getElementById('angle-slider');
    const massSlider = document.getElementById('mass-slider');
    const frictionSlider = document.getElementById('friction-slider');
    const gravitySlider = document.getElementById('gravity-slider');

    angleSlider.addEventListener('input', e => { state.angle = parseFloat(e.target.value); document.getElementById('angle-value').textContent = state.angle + '°'; if (!state.isPlaying) { calcForces(); } });
    massSlider.addEventListener('input', e => { state.m = parseFloat(e.target.value); document.getElementById('mass-value').textContent = state.m.toFixed(1) + ' kg'; if (!state.isPlaying) calcForces(); });
    frictionSlider.addEventListener('input', e => { state.mu = parseFloat(e.target.value); document.getElementById('friction-value').textContent = state.mu.toFixed(2); if (!state.isPlaying) calcForces(); });
    gravitySlider.addEventListener('input', e => { state.g = parseFloat(e.target.value); document.getElementById('gravity-value').textContent = state.g.toFixed(1) + ' m/s²'; if (!state.isPlaying) calcForces(); });

    document.getElementById('play-btn').addEventListener('click', () => {
        if (state.isPlaying) {
            state.isPlaying = false;
            document.getElementById('play-btn').textContent = '▶ Resume';
        } else {
            state.isPlaying = true;
            document.getElementById('play-btn').textContent = '⏸ Pause';
        }
    });
    document.getElementById('reset-btn').addEventListener('click', () => {
        state.isPlaying = false;
        state.s = 0; state.v = 0; state.time = 0;
        document.getElementById('play-btn').textContent = '▶ Release';
        calcForces();
    });

    function calcForces() {
        const rad = state.angle * Math.PI / 180;
        const fg = state.m * state.g * Math.sin(rad);
        const fn = state.m * state.g * Math.cos(rad);
        const ff = state.mu * fn;
        const fnet = Math.max(0, fg - ff);
        state.a = fnet / state.m;
        state.canSlide = fg > ff;

        document.getElementById('data-fg').textContent = fg.toFixed(2) + ' N';
        document.getElementById('data-fn').textContent = fn.toFixed(2) + ' N';
        document.getElementById('data-ff').textContent = ff.toFixed(2) + ' N';
        document.getElementById('data-fnet').textContent = fnet.toFixed(2) + ' N';
        document.getElementById('data-accel').textContent = state.a.toFixed(2) + ' m/s²';
        document.getElementById('data-vel').textContent = state.v.toFixed(2) + ' m/s';
        document.getElementById('data-disp').textContent = state.s.toFixed(2) + ' m';
        document.getElementById('data-status').textContent = state.canSlide ? (state.isPlaying ? 'Sliding' : 'Will slide') : 'Static (friction wins)';
    }

    function update(dt) {
        if (!state.isPlaying) return;
        if (!state.canSlide) return;

        const rad = state.angle * Math.PI / 180;
        const fg = state.m * state.g * Math.sin(rad);
        const fn = state.m * state.g * Math.cos(rad);
        const ff = state.mu * fn;
        const fnet = fg - ff;

        if (fnet <= 0) {
            state.canSlide = false;
            state.a = 0;
            calcForces();
            return;
        }

        state.a = fnet / state.m;
        state.v += state.a * dt;
        state.s += state.v * dt;
        state.time += dt;

        // Stop at bottom of ramp
        const rampLen = Math.min(W, H) * 0.6 / 40; // approximate ramp length in meters
        if (state.s > rampLen * 2) {
            state.s = rampLen * 2;
            state.isPlaying = false;
            document.getElementById('play-btn').textContent = '▶ Release';
        }

        calcForces();
    }

    function render() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const rad = state.angle * Math.PI / 180;
        const cx = W * 0.5, cy = H * 0.65;
        const rampLen = Math.min(W, H) * 0.55;

        // Calculate ramp geometry
        const rampEndX = cx + Math.cos(rad) * rampLen / 2;
        const rampEndY = cy + Math.sin(rad) * rampLen / 2;
        const rampStartX = cx - Math.cos(rad) * rampLen / 2;
        const rampStartY = cy - Math.sin(rad) * rampLen / 2;

        // Draw ramp surface
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rad);

        // Ramp body
        const rampGrad = ctx.createLinearGradient(-rampLen / 2, -5, rampLen / 2, 15);
        rampGrad.addColorStop(0, '#2a2a3a');
        rampGrad.addColorStop(1, '#1a1a24');
        ctx.fillStyle = rampGrad;
        ctx.beginPath();
        ctx.moveTo(-rampLen / 2, 0);
        ctx.lineTo(rampLen / 2, 0);
        ctx.lineTo(rampLen / 2, 20);
        ctx.lineTo(-rampLen / 2, 20);
        ctx.closePath();
        ctx.fill();

        // Ramp surface line
        ctx.strokeStyle = 'rgba(139,92,246,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-rampLen / 2, 0);
        ctx.lineTo(rampLen / 2, 0);
        ctx.stroke();

        // Block position along ramp
        const blockSize = 35 + state.m * 3;
        const blockPos = -rampLen / 2 + 60 + state.s * 40;
        const clampedPos = Math.min(blockPos, rampLen / 2 - blockSize);

        // Block
        const bGrad = ctx.createLinearGradient(clampedPos, -blockSize, clampedPos + blockSize, 0);
        bGrad.addColorStop(0, '#c084fc');
        bGrad.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.roundRect(clampedPos, -blockSize, blockSize, blockSize, 4);
        ctx.fill();

        // Glow on block
        const glow = ctx.createRadialGradient(clampedPos + blockSize / 2, -blockSize / 2, 0, clampedPos + blockSize / 2, -blockSize / 2, blockSize);
        glow.addColorStop(0, 'rgba(139,92,246,0.3)');
        glow.addColorStop(1, 'rgba(139,92,246,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(clampedPos + blockSize / 2, -blockSize / 2, blockSize, 0, Math.PI * 2);
        ctx.fill();

        // Mass label on block
        ctx.fillStyle = '#fff';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${state.m.toFixed(1)} kg`, clampedPos + blockSize / 2, -blockSize / 2 + 4);

        // Force vectors (in rotated frame)
        const blockCX = clampedPos + blockSize / 2;
        const blockCY = -blockSize / 2;
        const forceScale = 3;

        if (state.isPlaying || true) {
            const fg = state.m * state.g * Math.sin(rad);
            const fn = state.m * state.g * Math.cos(rad);
            const ff = state.mu * fn;

            // Gravity component along plane (down the slope = positive x in rotated frame)
            drawForceArrow(blockCX, blockCY, blockCX + fg * forceScale, blockCY, '#ef4444', 'mg·sinθ');

            // Normal force (perpendicular to surface, upward in rotated frame)
            drawForceArrow(blockCX, blockCY, blockCX, blockCY - fn * forceScale, '#3b82f6', 'N');

            // Friction force (up the slope, opposing motion)
            if (state.mu > 0) {
                drawForceArrow(blockCX, blockCY, blockCX - ff * forceScale, blockCY, '#f59e0b', 'f = μN');
            }
        }

        ctx.restore();

        // Angle arc at ground level
        ctx.beginPath();
        ctx.arc(rampEndX, rampEndY, 40, Math.PI, Math.PI + rad, true);
        ctx.strokeStyle = 'rgba(139,92,246,0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '13px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`θ = ${state.angle}°`, rampEndX - 50, rampEndY + 25);

        // Ground line
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, rampEndY);
        ctx.lineTo(W, rampEndY);
        ctx.stroke();

        // Weight vector (straight down from block center, in world coordinates)
        const worldBlockX = cx + Math.cos(rad) * ((-rampLen / 2 + 60 + state.s * 40 + blockSize / 2) > rampLen / 2 - blockSize ? rampLen / 2 - blockSize / 2 : -rampLen / 2 + 60 + state.s * 40 + blockSize / 2);
        const bpClamped = Math.min(-rampLen / 2 + 60 + state.s * 40, rampLen / 2 - blockSize);
        const wbx = cx + Math.cos(rad) * (bpClamped + blockSize / 2) + Math.sin(rad) * (-blockSize / 2);
        const wby = cy + Math.sin(rad) * (bpClamped + blockSize / 2) - Math.cos(rad) * (-blockSize / 2);
        const mg = state.m * state.g;
        drawForceArrowWorld(wbx, wby, wbx, wby + mg * forceScale, '#ff6b6b', 'mg');

        // Legend
        ctx.textAlign = 'left';
        ctx.font = '12px Inter';
        const ly = 20;
        ctx.fillStyle = '#ef4444'; ctx.fillRect(20, ly, 12, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('Gravity (parallel)', 40, ly + 10);
        ctx.fillStyle = '#3b82f6'; ctx.fillRect(20, ly + 20, 12, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('Normal Force', 40, ly + 30);
        ctx.fillStyle = '#f59e0b'; ctx.fillRect(20, ly + 40, 12, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('Friction', 40, ly + 50);
        ctx.fillStyle = '#ff6b6b'; ctx.fillRect(20, ly + 60, 12, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('Weight (mg)', 40, ly + 70);
    }

    function drawForceArrow(fx, fy, tx, ty, color, label) {
        const len = Math.sqrt((tx - fx) ** 2 + (ty - fy) ** 2);
        if (len < 2) return;
        const angle = Math.atan2(ty - fy, tx - fx);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        const hl = 7;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - hl * Math.cos(angle - 0.4), ty - hl * Math.sin(angle - 0.4));
        ctx.lineTo(tx - hl * Math.cos(angle + 0.4), ty - hl * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
        if (label) {
            ctx.fillStyle = color;
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(label, (fx + tx) / 2, (fy + ty) / 2 - 8);
        }
    }

    function drawForceArrowWorld(fx, fy, tx, ty, color, label) {
        const len = Math.sqrt((tx - fx) ** 2 + (ty - fy) ** 2);
        if (len < 2) return;
        const angle = Math.atan2(ty - fy, tx - fx);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);
        const hl = 7;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - hl * Math.cos(angle - 0.4), ty - hl * Math.sin(angle - 0.4));
        ctx.lineTo(tx - hl * Math.cos(angle + 0.4), ty - hl * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
        if (label) {
            ctx.fillStyle = color;
            ctx.font = '10px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(label, tx + 5, ty);
        }
    }

    let lastTime = performance.now();
    function loop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        update(dt);
        render();
        requestAnimationFrame(loop);
    }

    calcForces();
    render();
    requestAnimationFrame(loop);

    const toggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) toggle.addEventListener('click', () => navLinks.classList.toggle('active'));
})();
