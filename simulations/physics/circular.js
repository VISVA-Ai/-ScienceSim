/**
 * Circular Motion Simulation
 * ScienceSim - Physics Lab
 *
 * Physics (Uniform Circular Motion):
 * - v = ω·r
 * - aᶜ = v²/r = ω²·r  (centripetal acceleration, directed inward)
 * - Fᶜ = m·aᶜ = m·ω²·r (centripetal force)
 * - T = 2π/ω, f = 1/T
 */

(function () {
    'use strict';

    const PX_PER_M = 60;

    const state = {
        m: 1.0, r: 2.0, omega: 3.0,
        theta: 0,
        isPlaying: false,
        time: 0,
        trail: []
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
    const massSlider = document.getElementById('mass-slider');
    const radiusSlider = document.getElementById('radius-slider');
    const omegaSlider = document.getElementById('omega-slider');
    const massVal = document.getElementById('mass-value');
    const radiusVal = document.getElementById('radius-value');
    const omegaVal = document.getElementById('omega-value');
    const playBtn = document.getElementById('play-btn');
    const resetBtn = document.getElementById('reset-btn');

    massSlider.addEventListener('input', e => { state.m = parseFloat(e.target.value); massVal.textContent = state.m.toFixed(1) + ' kg'; updateData(); });
    radiusSlider.addEventListener('input', e => { state.r = parseFloat(e.target.value); radiusVal.textContent = state.r.toFixed(1) + ' m'; state.trail = []; updateData(); });
    omegaSlider.addEventListener('input', e => { state.omega = parseFloat(e.target.value); omegaVal.textContent = state.omega.toFixed(1) + ' rad/s'; updateData(); });

    playBtn.addEventListener('click', () => {
        state.isPlaying = !state.isPlaying;
        playBtn.textContent = state.isPlaying ? '⏸ Pause' : '▶ Play';
    });
    resetBtn.addEventListener('click', () => {
        state.isPlaying = false;
        state.theta = 0;
        state.time = 0;
        state.trail = [];
        playBtn.textContent = '▶ Play';
        updateData();
    });

    function update(dt) {
        if (!state.isPlaying) return;
        state.theta += state.omega * dt;
        if (state.theta > Math.PI * 2) state.theta -= Math.PI * 2;
        state.time += dt;

        const cx = W / 2, cy = H / 2;
        const px = cx + Math.cos(state.theta) * state.r * PX_PER_M;
        const py = cy + Math.sin(state.theta) * state.r * PX_PER_M;
        state.trail.push({ x: px, y: py });
        if (state.trail.length > 300) state.trail.shift();

        updateData();
    }

    function updateData() {
        const v = state.omega * state.r;
        const ac = state.omega * state.omega * state.r;
        const fc = state.m * ac;
        const T = (2 * Math.PI) / state.omega;
        const f = 1 / T;
        const thetaDeg = ((state.theta * 180 / Math.PI) % 360).toFixed(1);

        document.getElementById('data-v').textContent = v.toFixed(2) + ' m/s';
        document.getElementById('data-ac').textContent = ac.toFixed(2) + ' m/s²';
        document.getElementById('data-fc').textContent = fc.toFixed(2) + ' N';
        document.getElementById('data-period').textContent = T.toFixed(3) + ' s';
        document.getElementById('data-freq').textContent = f.toFixed(3) + ' Hz';
        document.getElementById('data-theta').textContent = thetaDeg + '°';
    }

    function render() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2, cy = H / 2;
        const rPx = state.r * PX_PER_M;

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Orbit circle
        ctx.beginPath();
        ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(139,92,246,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dashed orbit with scale markers
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const mx = cx + Math.cos(a) * rPx;
            const my = cy + Math.sin(a) * rPx;
            ctx.beginPath();
            ctx.arc(mx, my, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fill();
        }

        // Radius label
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`r = ${state.r.toFixed(1)} m`, cx + rPx / 2, cy - 8);

        // Trail
        if (state.trail.length > 2) {
            ctx.beginPath();
            ctx.moveTo(state.trail[0].x, state.trail[0].y);
            for (let i = 1; i < state.trail.length; i++) {
                ctx.lineTo(state.trail[i].x, state.trail[i].y);
            }
            const tGrad = ctx.createLinearGradient(cx - rPx, cy, cx + rPx, cy);
            tGrad.addColorStop(0, '#8b5cf6');
            tGrad.addColorStop(1, '#c084fc');
            ctx.strokeStyle = tGrad;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Object position
        const px = cx + Math.cos(state.theta) * rPx;
        const py = cy + Math.sin(state.theta) * rPx;

        // Radius line (from center to object)
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center point
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Centripetal acceleration vector (inward)
        if (state.isPlaying) {
            const ac = state.omega * state.omega * state.r;
            const acScale = Math.min(ac * 3, 80);
            const acX = px - Math.cos(state.theta) * acScale;
            const acY = py - Math.sin(state.theta) * acScale;
            drawArrow(px, py, acX, acY, '#ef4444', 'aᶜ');

            // Velocity vector (tangent, perpendicular to radius)
            const v = state.omega * state.r;
            const vScale = Math.min(v * 8, 80);
            const vAngle = state.theta + Math.PI / 2;
            const vX = px + Math.cos(vAngle) * vScale;
            const vY = py + Math.sin(vAngle) * vScale;
            drawArrow(px, py, vX, vY, '#10b981', 'v');
        }

        // Object (ball)
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 30);
        glow.addColorStop(0, 'rgba(139,92,246,0.5)');
        glow.addColorStop(1, 'rgba(139,92,246,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, 30, 0, Math.PI * 2);
        ctx.fill();

        const ballGrad = ctx.createRadialGradient(px - 4, py - 4, 0, px, py, 14);
        ballGrad.addColorStop(0, '#c084fc');
        ballGrad.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(px - 4, py - 4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Angle arc
        if (state.theta > 0.05) {
            const arcR = 30;
            ctx.beginPath();
            ctx.arc(cx, cy, arcR, 0, state.theta);
            ctx.strokeStyle = 'rgba(139,92,246,0.4)';
            ctx.lineWidth = 3;
            ctx.stroke();
            const midA = state.theta / 2;
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '11px Inter';
            ctx.fillText('θ', cx + Math.cos(midA) * (arcR + 12), cy + Math.sin(midA) * (arcR + 12));
        }

        // Legend
        ctx.font = '12px Inter';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#10b981';
        ctx.fillRect(20, 20, 12, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('Velocity (tangent)', 40, 30);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(20, 40, 12, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('Centripetal Accel (inward)', 40, 50);
    }

    function drawArrow(fx, fy, tx, ty, color, label) {
        const dx = tx - fx, dy = ty - fy;
        const angle = Math.atan2(dy, dx);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        const hl = 8;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - hl * Math.cos(angle - Math.PI / 6), ty - hl * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(tx - hl * Math.cos(angle + Math.PI / 6), ty - hl * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        if (label) {
            ctx.fillStyle = color;
            ctx.font = '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(label, (fx + tx) / 2 + 10, (fy + ty) / 2 - 8);
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

    updateData();
    render();
    requestAnimationFrame(loop);

    const toggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) toggle.addEventListener('click', () => navLinks.classList.toggle('active'));
})();
