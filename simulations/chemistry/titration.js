/**
 * Acid-Base Titration Simulation
 * ScienceSim - Chemistry Lab
 *
 * Chemistry (Strong Acid + Strong Base):
 * - HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)
 * - Before equivalence: excess H⁺ → pH = -log[H⁺]
 * - At equivalence: pH = 7.00 (strong/strong)
 * - After equivalence: excess OH⁻ → pOH = -log[OH⁻], pH = 14 - pOH
 * - Equivalence volume: V_eq = (C_a × V_a) / C_b
 */

(function () {
    'use strict';

    const state = {
        acidConc: 0.10,    // M
        acidVol: 50.0,     // mL
        baseConc: 0.10,    // M
        dropSize: 0.5,     // mL
        baseAdded: 0,      // mL
        phData: [],        // {vol, ph}
        animDrop: null      // drop animation
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
    document.getElementById('acid-conc-slider').addEventListener('input', e => { state.acidConc = parseFloat(e.target.value); document.getElementById('acid-conc-value').textContent = state.acidConc.toFixed(2) + ' M'; resetSim(); });
    document.getElementById('acid-vol-slider').addEventListener('input', e => { state.acidVol = parseFloat(e.target.value); document.getElementById('acid-vol-value').textContent = state.acidVol.toFixed(1) + ' mL'; resetSim(); });
    document.getElementById('base-conc-slider').addEventListener('input', e => { state.baseConc = parseFloat(e.target.value); document.getElementById('base-conc-value').textContent = state.baseConc.toFixed(2) + ' M'; resetSim(); });
    document.getElementById('drop-slider').addEventListener('input', e => { state.dropSize = parseFloat(e.target.value); document.getElementById('drop-value').textContent = state.dropSize.toFixed(1) + ' mL'; });

    document.getElementById('add-btn').addEventListener('click', addDrop);
    document.getElementById('reset-btn').addEventListener('click', resetSim);

    function calculatePH(baseVol) {
        const molesAcid = state.acidConc * state.acidVol / 1000;
        const molesBase = state.baseConc * baseVol / 1000;
        const totalVol = (state.acidVol + baseVol) / 1000; // in L

        if (Math.abs(molesAcid - molesBase) < 1e-10) {
            return 7.00; // Equivalence point
        } else if (molesBase < molesAcid) {
            // Before equivalence: excess acid
            const excessH = (molesAcid - molesBase) / totalVol;
            return -Math.log10(excessH);
        } else {
            // After equivalence: excess base
            const excessOH = (molesBase - molesAcid) / totalVol;
            const pOH = -Math.log10(excessOH);
            return 14 - pOH;
        }
    }

    function addDrop() {
        state.baseAdded += state.dropSize;
        const pH = calculatePH(state.baseAdded);
        state.phData.push({ vol: state.baseAdded, ph: pH });

        // Animate drop
        state.animDrop = { y: 0, targetY: 1, t: 0 };

        updateDisplay();
    }

    function resetSim() {
        state.baseAdded = 0;
        state.phData = [];
        state.animDrop = null;
        // Add initial point
        const initPH = calculatePH(0);
        state.phData.push({ vol: 0, ph: initPH });
        updateDisplay();
    }

    function updateDisplay() {
        const pH = state.phData.length > 0 ? state.phData[state.phData.length - 1].ph : calculatePH(0);
        const eqVol = (state.acidConc * state.acidVol) / state.baseConc;
        let status = 'Acidic';
        if (pH > 7.05) status = 'Basic';
        else if (pH >= 6.95) status = 'Equivalence Point!';

        document.getElementById('data-vol').textContent = state.baseAdded.toFixed(2) + ' mL';
        document.getElementById('data-ph').textContent = pH.toFixed(2);
        document.getElementById('data-eq').textContent = eqVol.toFixed(1) + ' mL';
        document.getElementById('data-status').textContent = status;
    }

    function getColorForPH(ph) {
        if (ph < 3) return '#ef4444';        // strong acid red
        if (ph < 5) return '#f97316';        // orange
        if (ph < 6.5) return '#eab308';      // yellow
        if (ph < 7.5) return '#22c55e';      // green at neutral
        if (ph < 9) return '#06b6d4';        // cyan
        if (ph < 11) return '#3b82f6';       // blue
        return '#8b5cf6';                     // purple for strong base
    }

    function render() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        const pH = state.phData.length > 0 ? state.phData[state.phData.length - 1].ph : 1;

        // --- Left half: Flask visualization ---
        const flaskCX = W * 0.28;
        const flaskCY = H * 0.55;
        const flaskW = 120, flaskH = 140;

        // Burette above flask
        const buretteX = flaskCX;
        const buretteTop = flaskCY - flaskH - 80;
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(buretteX - 8, buretteTop, 16, 60);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeRect(buretteX - 8, buretteTop, 16, 60);

        // Burette tip
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(buretteX - 3, buretteTop + 60, 6, 15);

        // Drip animation
        if (state.animDrop) {
            state.animDrop.t += 0.03;
            const dropY = buretteTop + 75 + state.animDrop.t * (flaskCY - flaskH / 2 - buretteTop - 75);
            if (state.animDrop.t < 1) {
                ctx.fillStyle = '#3b82f6';
                ctx.beginPath();
                ctx.ellipse(buretteX, dropY, 4, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                // Glow
                const dg = ctx.createRadialGradient(buretteX, dropY, 0, buretteX, dropY, 12);
                dg.addColorStop(0, 'rgba(59,130,246,0.4)');
                dg.addColorStop(1, 'rgba(59,130,246,0)');
                ctx.fillStyle = dg;
                ctx.beginPath();
                ctx.arc(buretteX, dropY, 12, 0, Math.PI * 2);
                ctx.fill();
            } else {
                state.animDrop = null;
            }
        }

        // Flask outline
        ctx.beginPath();
        ctx.moveTo(flaskCX - 25, flaskCY - flaskH / 2);
        ctx.lineTo(flaskCX + 25, flaskCY - flaskH / 2);
        ctx.lineTo(flaskCX + flaskW / 2, flaskCY + flaskH / 2 - 20);
        ctx.quadraticCurveTo(flaskCX + flaskW / 2 + 5, flaskCY + flaskH / 2, flaskCX + flaskW / 2 - 10, flaskCY + flaskH / 2);
        ctx.lineTo(flaskCX - flaskW / 2 + 10, flaskCY + flaskH / 2);
        ctx.quadraticCurveTo(flaskCX - flaskW / 2 - 5, flaskCY + flaskH / 2, flaskCX - flaskW / 2, flaskCY + flaskH / 2 - 20);
        ctx.lineTo(flaskCX - 25, flaskCY - flaskH / 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Solution inside flask
        const solnColor = getColorForPH(pH);
        const fillLevel = 0.6 + (state.baseAdded / (state.acidVol * 2)) * 0.3;
        const solnTop = flaskCY + flaskH / 2 - flaskH * fillLevel;
        const solnWidthTop = 25 + (flaskW / 2 - 25) * ((flaskCY + flaskH / 2 - solnTop) / flaskH);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(flaskCX - solnWidthTop, solnTop);
        ctx.lineTo(flaskCX + solnWidthTop, solnTop);
        ctx.lineTo(flaskCX + flaskW / 2 - 10, flaskCY + flaskH / 2);
        ctx.lineTo(flaskCX - flaskW / 2 + 10, flaskCY + flaskH / 2);
        ctx.closePath();
        ctx.fillStyle = solnColor + '40';
        ctx.fill();
        ctx.restore();

        // pH indicator circle
        ctx.beginPath();
        ctx.arc(flaskCX, flaskCY + 20, 30, 0, Math.PI * 2);
        ctx.fillStyle = solnColor;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(`pH ${pH.toFixed(1)}`, flaskCX, flaskCY + 25);

        // --- Right half: pH Curve ---
        const graphX = W * 0.5 + 20;
        const graphY = 40;
        const graphW = W * 0.45 - 40;
        const graphH = H - 100;

        // Graph background
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(graphX, graphY, graphW, graphH);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(graphX, graphY, graphW, graphH);

        // pH scale lines
        ctx.font = '10px Inter';
        ctx.textAlign = 'right';
        for (let ph = 0; ph <= 14; ph += 2) {
            const y = graphY + graphH - (ph / 14) * graphH;
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath();
            ctx.moveTo(graphX, y);
            ctx.lineTo(graphX + graphW, y);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillText(ph.toString(), graphX - 5, y + 4);
        }

        // Axis labels
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Volume of Base Added (mL)', graphX + graphW / 2, graphY + graphH + 30);
        ctx.save();
        ctx.translate(graphX - 30, graphY + graphH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('pH', 0, 0);
        ctx.restore();

        // Volume axis markers
        const eqVol = (state.acidConc * state.acidVol) / state.baseConc;
        const maxVol = Math.max(eqVol * 2, state.baseAdded * 1.2, 20);
        ctx.textAlign = 'center';
        for (let v = 0; v <= maxVol; v += Math.ceil(maxVol / 5)) {
            const x = graphX + (v / maxVol) * graphW;
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '10px Inter';
            ctx.fillText(v.toFixed(0), x, graphY + graphH + 15);
        }

        // Equivalence volume marker
        const eqX = graphX + (eqVol / maxVol) * graphW;
        if (eqX > graphX && eqX < graphX + graphW) {
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(16,185,129,0.4)';
            ctx.beginPath();
            ctx.moveTo(eqX, graphY);
            ctx.lineTo(eqX, graphY + graphH);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(16,185,129,0.6)';
            ctx.font = '10px Inter';
            ctx.fillText('Equiv.', eqX, graphY - 5);
        }

        // pH = 7 line
        const ph7Y = graphY + graphH - (7 / 14) * graphH;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.moveTo(graphX, ph7Y);
        ctx.lineTo(graphX + graphW, ph7Y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Plot pH data
        if (state.phData.length > 1) {
            ctx.beginPath();
            for (let i = 0; i < state.phData.length; i++) {
                const px = graphX + (state.phData[i].vol / maxVol) * graphW;
                const py = graphY + graphH - (state.phData[i].ph / 14) * graphH;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            const grd = ctx.createLinearGradient(graphX, graphY, graphX, graphY + graphH);
            grd.addColorStop(0, '#8b5cf6');
            grd.addColorStop(0.5, '#10b981');
            grd.addColorStop(1, '#ef4444');
            ctx.strokeStyle = grd;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Data points
            for (const pt of state.phData) {
                const px = graphX + (pt.vol / maxVol) * graphW;
                const py = graphY + graphH - (pt.ph / 14) * graphH;
                ctx.fillStyle = getColorForPH(pt.ph);
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Graph title
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '14px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('Titration Curve', graphX + graphW / 2, graphY - 15);
    }

    let lastTime = performance.now();
    function loop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        render();
        requestAnimationFrame(loop);
    }

    resetSim();
    render();
    requestAnimationFrame(loop);

    const toggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) toggle.addEventListener('click', () => navLinks.classList.toggle('active'));
})();
