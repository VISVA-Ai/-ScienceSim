/**
 * Spring Oscillation (SHM) Simulation
 * ScienceSim - Physics Lab
 *
 * Physics:
 * - F = -kx  (Hooke's Law)
 * - a = -(k/m)x - (b/m)v  (with damping)
 * - ω = √(k/m), T = 2π/ω
 * - PE = ½kx², KE = ½mv²
 */

(function () {
    'use strict';

    const PIXELS_PER_METER = 60;
    const SPRING_COILS = 12;
    const BLOCK_SIZE = 50;

    const state = {
        k: 20, m: 1.0, A: 2.0, b: 0.0,
        x: 2.0, v: 0, a: 0,
        time: 0, isPlaying: false,
        pe: 0, ke: 0,
        xHistory: []
    };

    const container = document.getElementById('canvas-container');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    container.appendChild(canvas);
    let W, H;

    function resize() {
        const r = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        W = r.width; H = r.height;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    // DOM
    const kSlider = document.getElementById('k-slider');
    const massSlider = document.getElementById('mass-slider');
    const dispSlider = document.getElementById('disp-slider');
    const dampSlider = document.getElementById('damp-slider');
    const kVal = document.getElementById('k-value');
    const massVal = document.getElementById('mass-value');
    const dispVal = document.getElementById('disp-value');
    const dampVal = document.getElementById('damp-value');
    const playBtn = document.getElementById('play-btn');
    const resetBtn = document.getElementById('reset-btn');

    kSlider.addEventListener('input', e => { state.k = parseFloat(e.target.value); kVal.textContent = state.k.toFixed(1) + ' N/m'; if (!state.isPlaying) resetState(); });
    massSlider.addEventListener('input', e => { state.m = parseFloat(e.target.value); massVal.textContent = state.m.toFixed(1) + ' kg'; if (!state.isPlaying) resetState(); });
    dispSlider.addEventListener('input', e => { state.A = parseFloat(e.target.value); dispVal.textContent = state.A.toFixed(1) + ' m'; if (!state.isPlaying) { state.x = state.A; updateData(); } });
    dampSlider.addEventListener('input', e => { state.b = parseFloat(e.target.value); dampVal.textContent = state.b.toFixed(2); });

    playBtn.addEventListener('click', () => {
        state.isPlaying = !state.isPlaying;
        playBtn.textContent = state.isPlaying ? '⏸ Pause' : '▶ Play';
    });
    resetBtn.addEventListener('click', resetState);

    function resetState() {
        state.isPlaying = false;
        state.x = state.A;
        state.v = 0;
        state.a = 0;
        state.time = 0;
        state.xHistory = [];
        playBtn.textContent = '▶ Play';
        updateData();
    }

    function update(dt) {
        if (!state.isPlaying) return;
        // Euler-Cromer for stability
        const steps = 8;
        const subDt = dt / steps;
        for (let i = 0; i < steps; i++) {
            state.a = -(state.k / state.m) * state.x - (state.b / state.m) * state.v;
            state.v += state.a * subDt;
            state.x += state.v * subDt;
        }
        state.time += dt;
        state.xHistory.push({ t: state.time, x: state.x });
        if (state.xHistory.length > 400) state.xHistory.shift();
        updateData();
    }

    function updateData() {
        state.pe = 0.5 * state.k * state.x * state.x;
        state.ke = 0.5 * state.m * state.v * state.v;
        const omega = Math.sqrt(state.k / state.m);
        const period = (2 * Math.PI) / omega;

        document.getElementById('data-x').textContent = state.x.toFixed(2) + ' m';
        document.getElementById('data-v').textContent = state.v.toFixed(2) + ' m/s';
        document.getElementById('data-a').textContent = state.a.toFixed(2) + ' m/s²';
        document.getElementById('data-pe').textContent = state.pe.toFixed(2) + ' J';
        document.getElementById('data-ke').textContent = state.ke.toFixed(2) + ' J';
        document.getElementById('data-period').textContent = period.toFixed(3) + ' s';
    }

    function render() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const anchorX = 80;
        const centerY = H * 0.35;
        const eqX = W * 0.45;
        const blockX = eqX + state.x * PIXELS_PER_METER;

        // Equilibrium line
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(eqX, centerY - 60);
        ctx.lineTo(eqX, centerY + 60);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('x = 0', eqX, centerY + 75);

        // Wall
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(anchorX - 20, centerY - 50, 20, 100);
        ctx.strokeStyle = 'rgba(139,92,246,0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(anchorX - 20, centerY - 50, 20, 100);

        // Spring
        drawSpring(anchorX, centerY, blockX - BLOCK_SIZE / 2, centerY);

        // Block
        const bx = blockX - BLOCK_SIZE / 2;
        const by = centerY - BLOCK_SIZE / 2;
        const grad = ctx.createLinearGradient(bx, by, bx + BLOCK_SIZE, by + BLOCK_SIZE);
        grad.addColorStop(0, '#c084fc');
        grad.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(bx, by, BLOCK_SIZE, BLOCK_SIZE, 6);
        ctx.fill();

        // Glow
        const glow = ctx.createRadialGradient(blockX, centerY, 0, blockX, centerY, BLOCK_SIZE);
        glow.addColorStop(0, 'rgba(139,92,246,0.3)');
        glow.addColorStop(1, 'rgba(139,92,246,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(blockX, centerY, BLOCK_SIZE, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${state.m.toFixed(1)} kg`, blockX, centerY + 5);

        // Force arrow
        if (state.isPlaying && Math.abs(state.x) > 0.05) {
            const forceLen = -state.k * state.x * 2;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(blockX, centerY + BLOCK_SIZE / 2 + 15);
            ctx.lineTo(blockX + forceLen, centerY + BLOCK_SIZE / 2 + 15);
            ctx.stroke();
            // arrowhead
            const ah = forceLen > 0 ? 0 : Math.PI;
            const tx = blockX + forceLen;
            const ty = centerY + BLOCK_SIZE / 2 + 15;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - 8 * Math.cos(ah - Math.PI / 6), ty - 8 * Math.sin(ah - Math.PI / 6));
            ctx.lineTo(tx - 8 * Math.cos(ah + Math.PI / 6), ty - 8 * Math.sin(ah + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ef4444';
            ctx.font = '11px Inter';
            ctx.fillText('F = -kx', blockX + forceLen / 2, centerY + BLOCK_SIZE / 2 + 10);
        }

        // Energy bars
        const totalE = 0.5 * state.k * state.A * state.A;
        const barW = 30, barMaxH = 120, barX = W - 120, barY = H * 0.35 + 60;
        // PE bar
        const peH = totalE > 0 ? (state.pe / totalE) * barMaxH : 0;
        ctx.fillStyle = 'rgba(139,92,246,0.2)';
        ctx.fillRect(barX, barY - barMaxH, barW, barMaxH);
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(barX, barY - peH, barW, peH);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('PE', barX + barW / 2, barY + 15);

        // KE bar
        const keH = totalE > 0 ? (state.ke / totalE) * barMaxH : 0;
        ctx.fillStyle = 'rgba(16,185,129,0.2)';
        ctx.fillRect(barX + 45, barY - barMaxH, barW, barMaxH);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(barX + 45, barY - keH, barW, keH);
        ctx.fillText('KE', barX + 45 + barW / 2, barY + 15);

        // Phase plot (x vs t)
        if (state.xHistory.length > 2) {
            const graphX = 60, graphY = H * 0.65, graphW = W - 120, graphH = H * 0.25;
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(graphX, graphY, graphW, graphH);

            // Axis label
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Displacement vs Time', graphX + graphW / 2, graphY - 8);
            ctx.fillText('0', graphX - 12, graphY + graphH / 2 + 4);

            // Zero line
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath();
            ctx.moveTo(graphX, graphY + graphH / 2);
            ctx.lineTo(graphX + graphW, graphY + graphH / 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Plot
            const maxA = Math.max(state.A, 2);
            ctx.beginPath();
            const hist = state.xHistory;
            const tSpan = Math.max(hist[hist.length - 1].t - hist[0].t, 1);
            for (let i = 0; i < hist.length; i++) {
                const px = graphX + ((hist[i].t - hist[0].t) / tSpan) * graphW;
                const py = graphY + graphH / 2 - (hist[i].x / maxA) * (graphH / 2 * 0.9);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    function drawSpring(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const len = Math.abs(dx);
        const coilWidth = 15;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const segLen = len / (SPRING_COILS * 2);
        for (let i = 0; i < SPRING_COILS * 2; i++) {
            const px = x1 + (i + 1) * segLen;
            const py = y1 + (i % 2 === 0 ? -coilWidth : coilWidth);
            ctx.lineTo(px, py);
        }
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    let lastTime = performance.now();
    function loop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        update(dt);
        render();
        requestAnimationFrame(loop);
    }

    resetState();
    render();
    requestAnimationFrame(loop);

    const toggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) toggle.addEventListener('click', () => navLinks.classList.toggle('active'));
})();
