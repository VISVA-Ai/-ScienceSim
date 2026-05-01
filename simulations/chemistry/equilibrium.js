/**
 * Chemical Equilibrium Simulation
 * ScienceSim - Chemistry Lab
 *
 * Chemistry (Le Chatelier's Principle):
 * - Reaction: A + B ⇌ C (exothermic forward)
 * - Kc = [C] / ([A][B])
 * - If Q < Kc → reaction shifts forward (produces more C)
 * - If Q > Kc → reaction shifts reverse (produces more A, B)
 * - Temperature effect: ↑T → ↓Kc for exothermic (shifts left)
 * - Particle-based visualization
 */

(function () {
    'use strict';

    const state = {
        A: 1.0, B: 1.0, C: 0.0,
        T: 300, // Kelvin
        isPlaying: false,
        time: 0,
        history: [],
        particles: []
    };

    function getKc(T) {
        // Exothermic: Kc decreases with temperature
        // Kc ≈ 4.0 at 300K using Van't Hoff-like behavior
        const Kref = 4.0;
        const Tref = 300;
        const dH = -50000; // J/mol (exothermic)
        const R = 8.314;
        return Kref * Math.exp((dH / R) * (1 / T - 1 / Tref));
    }

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

    // Initialize particles
    function initParticles() {
        state.particles = [];
        const area = { x: 40, y: 40, w: W - 80, h: H * 0.45 };
        const totalA = Math.round(state.A * 15);
        const totalB = Math.round(state.B * 15);
        const totalC = Math.round(state.C * 15);

        for (let i = 0; i < totalA; i++) addParticle('A', area);
        for (let i = 0; i < totalB; i++) addParticle('B', area);
        for (let i = 0; i < totalC; i++) addParticle('C', area);
    }

    function addParticle(type, area) {
        if (!area) area = { x: 40, y: 40, w: W - 80, h: H * 0.45 };
        state.particles.push({
            type,
            x: area.x + Math.random() * area.w,
            y: area.y + Math.random() * area.h,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
        });
    }

    // DOM Events
    document.getElementById('add-a-btn').addEventListener('click', () => { state.A = Math.min(state.A + 0.3, 5); syncParticles(); });
    document.getElementById('add-b-btn').addEventListener('click', () => { state.B = Math.min(state.B + 0.3, 5); syncParticles(); });
    document.getElementById('add-c-btn').addEventListener('click', () => { state.C = Math.min(state.C + 0.3, 5); syncParticles(); });
    document.getElementById('rem-a-btn').addEventListener('click', () => { state.A = Math.max(state.A - 0.3, 0.05); syncParticles(); });
    document.getElementById('rem-c-btn').addEventListener('click', () => { state.C = Math.max(state.C - 0.3, 0); syncParticles(); });
    document.getElementById('temp-slider').addEventListener('input', e => { state.T = parseFloat(e.target.value); document.getElementById('temp-value').textContent = state.T + ' K'; });
    document.getElementById('play-btn').addEventListener('click', () => {
        state.isPlaying = !state.isPlaying;
        document.getElementById('play-btn').textContent = state.isPlaying ? '⏸ Pause' : '▶ Play';
    });
    document.getElementById('reset-btn').addEventListener('click', () => {
        state.isPlaying = false;
        state.A = 1.0; state.B = 1.0; state.C = 0.0;
        state.T = 300; state.time = 0; state.history = [];
        document.getElementById('temp-slider').value = 300;
        document.getElementById('temp-value').textContent = '300 K';
        document.getElementById('play-btn').textContent = '▶ Play';
        initParticles();
        updateDisplay();
    });

    function syncParticles() {
        // Adjust particle count to match concentrations
        const area = { x: 40, y: 40, w: W - 80, h: H * 0.45 };
        const targetA = Math.round(state.A * 15);
        const targetB = Math.round(state.B * 15);
        const targetC = Math.round(state.C * 15);
        const curA = state.particles.filter(p => p.type === 'A').length;
        const curB = state.particles.filter(p => p.type === 'B').length;
        const curC = state.particles.filter(p => p.type === 'C').length;

        if (targetA > curA) for (let i = 0; i < targetA - curA; i++) addParticle('A', area);
        if (targetB > curB) for (let i = 0; i < targetB - curB; i++) addParticle('B', area);
        if (targetC > curC) for (let i = 0; i < targetC - curC; i++) addParticle('C', area);

        // Remove excess
        if (targetA < curA) { let rem = curA - targetA; state.particles = state.particles.filter(p => { if (p.type === 'A' && rem > 0) { rem--; return false; } return true; }); }
        if (targetB < curB) { let rem = curB - targetB; state.particles = state.particles.filter(p => { if (p.type === 'B' && rem > 0) { rem--; return false; } return true; }); }
        if (targetC < curC) { let rem = curC - targetC; state.particles = state.particles.filter(p => { if (p.type === 'C' && rem > 0) { rem--; return false; } return true; }); }
    }

    function update(dt) {
        if (!state.isPlaying) return;
        state.time += dt;

        const Kc = getKc(state.T);
        const denom = state.A * state.B;
        const Q = denom > 0.001 ? state.C / denom : 0;

        // Drive concentrations toward equilibrium
        const rate = 0.5 * dt;
        if (Q < Kc && state.A > 0.01 && state.B > 0.01) {
            // Forward: A + B → C
            const shift = Math.min(rate, state.A, state.B);
            state.A -= shift;
            state.B -= shift;
            state.C += shift;
        } else if (Q > Kc && state.C > 0.01) {
            // Reverse: C → A + B
            const shift = Math.min(rate, state.C);
            state.A += shift;
            state.B += shift;
            state.C -= shift;
        }

        // Clamp
        state.A = Math.max(0, state.A);
        state.B = Math.max(0, state.B);
        state.C = Math.max(0, state.C);

        // Sync particles
        syncParticles();

        // Move particles
        const speedFactor = state.T / 300;
        const area = { x: 40, y: 40, w: W - 80, h: H * 0.45 };
        for (const p of state.particles) {
            p.x += p.vx * speedFactor;
            p.y += p.vy * speedFactor;
            if (p.x < area.x || p.x > area.x + area.w) p.vx *= -1;
            if (p.y < area.y || p.y > area.y + area.h) p.vy *= -1;
            p.x = Math.max(area.x, Math.min(area.x + area.w, p.x));
            p.y = Math.max(area.y, Math.min(area.y + area.h, p.y));
        }

        // History
        state.history.push({ t: state.time, A: state.A, B: state.B, C: state.C });
        if (state.history.length > 500) state.history.shift();

        updateDisplay();
    }

    function updateDisplay() {
        const Kc = getKc(state.T);
        const denom = state.A * state.B;
        const Q = denom > 0.001 ? state.C / denom : 0;
        let dir = '⇌ At Equilibrium';
        if (Math.abs(Q - Kc) > 0.05) {
            dir = Q < Kc ? '→ Forward' : '← Reverse';
        }

        document.getElementById('data-a').textContent = state.A.toFixed(2) + ' M';
        document.getElementById('data-b').textContent = state.B.toFixed(2) + ' M';
        document.getElementById('data-c').textContent = state.C.toFixed(2) + ' M';
        document.getElementById('data-q').textContent = Q.toFixed(3);
        document.getElementById('data-kc').textContent = Kc.toFixed(3);
        document.getElementById('data-dir').textContent = dir;
    }

    function render() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Reaction vessel
        const area = { x: 40, y: 40, w: W - 80, h: H * 0.45 };
        ctx.strokeStyle = 'rgba(16,185,129,0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(area.x, area.y, area.w, area.h);

        // Vessel label
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Reaction Vessel: A + B ⇌ C', area.x + area.w / 2, area.y - 8);

        // Draw particles
        const PCOLORS = { A: '#ef4444', B: '#3b82f6', C: '#10b981' };
        const PRADII = { A: 8, B: 8, C: 10 };
        for (const p of state.particles) {
            const r = PRADII[p.type];
            const color = PCOLORS[p.type];

            // Glow
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
            glow.addColorStop(0, color + '40');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
            ctx.fill();

            // Particle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = '9px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(p.type, p.x, p.y + 3);
        }

        // Concentration bar chart
        const barArea = { x: 50, y: H * 0.55, w: W - 100, h: H * 0.15 };
        const maxConc = 3;
        const barW = barArea.w / 5;

        // A bar
        const aH = (state.A / maxConc) * barArea.h;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(barArea.x + barW * 0.5, barArea.y + barArea.h - aH, barW * 0.6, aH);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('[A]', barArea.x + barW * 0.8, barArea.y + barArea.h + 18);
        ctx.fillText(state.A.toFixed(2), barArea.x + barW * 0.8, barArea.y + barArea.h - aH - 5);

        // B bar
        const bH = (state.B / maxConc) * barArea.h;
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(barArea.x + barW * 2, barArea.y + barArea.h - bH, barW * 0.6, bH);
        ctx.fillText('[B]', barArea.x + barW * 2.3, barArea.y + barArea.h + 18);
        ctx.fillText(state.B.toFixed(2), barArea.x + barW * 2.3, barArea.y + barArea.h - bH - 5);

        // C bar
        const cH = (state.C / maxConc) * barArea.h;
        ctx.fillStyle = '#10b981';
        ctx.fillRect(barArea.x + barW * 3.5, barArea.y + barArea.h - cH, barW * 0.6, cH);
        ctx.fillText('[C]', barArea.x + barW * 3.8, barArea.y + barArea.h + 18);
        ctx.fillText(state.C.toFixed(2), barArea.x + barW * 3.8, barArea.y + barArea.h - cH - 5);

        // Concentration vs Time graph
        if (state.history.length > 2) {
            const graphX = 50, graphY = H * 0.78, graphW = W - 100, graphH = H * 0.18;
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(graphX, graphY, graphW, graphH);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Concentration vs Time', graphX + graphW / 2, graphY - 5);

            const hist = state.history;
            const tSpan = Math.max(hist[hist.length - 1].t - hist[0].t, 1);
            const maxC = 3;

            // Plot A
            ctx.beginPath();
            for (let i = 0; i < hist.length; i++) {
                const px = graphX + ((hist[i].t - hist[0].t) / tSpan) * graphW;
                const py = graphY + graphH - (hist[i].A / maxC) * graphH;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.stroke();

            // Plot B
            ctx.beginPath();
            for (let i = 0; i < hist.length; i++) {
                const px = graphX + ((hist[i].t - hist[0].t) / tSpan) * graphW;
                const py = graphY + graphH - (hist[i].B / maxC) * graphH;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5; ctx.stroke();

            // Plot C
            ctx.beginPath();
            for (let i = 0; i < hist.length; i++) {
                const px = graphX + ((hist[i].t - hist[0].t) / tSpan) * graphW;
                const py = graphY + graphH - (hist[i].C / maxC) * graphH;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.5; ctx.stroke();

            // Legend
            ctx.font = '10px Inter';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ef4444'; ctx.fillRect(graphX + graphW - 80, graphY + 8, 8, 8);
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText('[A]', graphX + graphW - 68, graphY + 16);
            ctx.fillStyle = '#3b82f6'; ctx.fillRect(graphX + graphW - 80, graphY + 22, 8, 8);
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText('[B]', graphX + graphW - 68, graphY + 30);
            ctx.fillStyle = '#10b981'; ctx.fillRect(graphX + graphW - 80, graphY + 36, 8, 8);
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText('[C]', graphX + graphW - 68, graphY + 44);
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

    initParticles();
    updateDisplay();
    render();
    requestAnimationFrame(loop);

    const toggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) toggle.addEventListener('click', () => navLinks.classList.toggle('active'));
})();
