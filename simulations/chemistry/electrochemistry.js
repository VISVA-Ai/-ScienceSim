/**
 * Electrochemistry - Galvanic Cell Simulation
 * ScienceSim - Chemistry Lab
 *
 * Chemistry:
 * - E°cell = E°cathode - E°anode
 * - Nernst: E = E° - (RT/nF)ln(Q)
 * - ΔG° = -nFE°
 * - Anode: oxidation (metal → ions + e⁻)
 * - Cathode: reduction (ions + e⁻ → metal)
 * - Salt bridge provides ion flow to maintain neutrality
 */

(function () {
    'use strict';

    const ELECTRODE_DATA = {
        Zn: { E: -0.76, n: 2, color: '#a1a1aa', ion: 'Zn²⁺', halfRx: 'Zn → Zn²⁺ + 2e⁻' },
        Fe: { E: -0.44, n: 2, color: '#78716c', ion: 'Fe²⁺', halfRx: 'Fe → Fe²⁺ + 2e⁻' },
        Al: { E: -1.66, n: 3, color: '#d4d4d8', ion: 'Al³⁺', halfRx: 'Al → Al³⁺ + 3e⁻' },
        Mg: { E: -2.37, n: 2, color: '#e4e4e7', ion: 'Mg²⁺', halfRx: 'Mg → Mg²⁺ + 2e⁻' },
        Cu: { E: 0.34, n: 2, color: '#c2703e', ion: 'Cu²⁺', halfRx: 'Cu²⁺ + 2e⁻ → Cu' },
        Ag: { E: 0.80, n: 1, color: '#c0c0c0', ion: 'Ag⁺', halfRx: 'Ag⁺ + e⁻ → Ag' },
        Au: { E: 1.50, n: 3, color: '#fbbf24', ion: 'Au³⁺', halfRx: 'Au³⁺ + 3e⁻ → Au' },
        Pt: { E: 1.20, n: 2, color: '#d4d4d8', ion: 'Pt²⁺', halfRx: 'Pt²⁺ + 2e⁻ → Pt' }
    };

    const state = {
        anode: 'Zn', cathode: 'Cu', conc: 1.0,
        isPlaying: false, time: 0,
        electrons: [], ions: []
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
    document.getElementById('anode-select').addEventListener('change', e => { state.anode = e.target.value; calcCell(); });
    document.getElementById('cathode-select').addEventListener('change', e => { state.cathode = e.target.value; calcCell(); });
    document.getElementById('conc-slider').addEventListener('input', e => { state.conc = parseFloat(e.target.value); document.getElementById('conc-value').textContent = state.conc.toFixed(2) + ' M'; calcCell(); });
    document.getElementById('play-btn').addEventListener('click', () => {
        state.isPlaying = !state.isPlaying;
        document.getElementById('play-btn').textContent = state.isPlaying ? '⏸ Pause' : '⚡ Start Cell';
    });
    document.getElementById('reset-btn').addEventListener('click', () => {
        state.isPlaying = false;
        state.time = 0;
        state.electrons = [];
        state.ions = [];
        document.getElementById('play-btn').textContent = '⚡ Start Cell';
    });

    function calcCell() {
        const anodeData = ELECTRODE_DATA[state.anode];
        const cathodeData = ELECTRODE_DATA[state.cathode];
        const Ecell = cathodeData.E - anodeData.E;

        document.getElementById('data-ecell').textContent = Ecell.toFixed(2) + ' V';
        document.getElementById('data-eanode').textContent = anodeData.E.toFixed(2) + ' V';
        document.getElementById('data-ecathode').textContent = cathodeData.E.toFixed(2) + ' V';
        document.getElementById('data-spont').textContent = Ecell > 0 ? 'Yes ✓' : 'No ✗';
        document.getElementById('data-ox').textContent = anodeData.halfRx;
        document.getElementById('data-red').textContent = cathodeData.halfRx;
    }

    function spawnElectron() {
        const anodeX = W * 0.25;
        const cathodeX = W * 0.75;
        state.electrons.push({
            x: anodeX + 30, y: H * 0.25,
            tx: cathodeX - 30, ty: H * 0.25,
            progress: 0, speed: 0.3 + Math.random() * 0.3
        });
    }

    function spawnIon(side) {
        const x = side === 'anode' ? W * 0.25 : W * 0.75;
        const y = H * 0.45 + Math.random() * (H * 0.3);
        state.ions.push({
            x, y,
            vx: (side === 'anode' ? 1 : -1) * (0.3 + Math.random() * 0.5),
            vy: (Math.random() - 0.5) * 0.5,
            life: 1, side,
            color: side === 'anode' ? ELECTRODE_DATA[state.anode].color : ELECTRODE_DATA[state.cathode].color
        });
    }

    function update(dt) {
        if (!state.isPlaying) return;
        state.time += dt;

        // Spawn particles periodically
        if (Math.random() < 0.1) spawnElectron();
        if (Math.random() < 0.05) spawnIon('anode');
        if (Math.random() < 0.05) spawnIon('cathode');

        // Update electrons
        for (let i = state.electrons.length - 1; i >= 0; i--) {
            const e = state.electrons[i];
            e.progress += e.speed * dt;
            if (e.progress >= 1) { state.electrons.splice(i, 1); continue; }
            // Arc path through wire (top)
            const t = e.progress;
            const midY = H * 0.1;
            e.x = e.x * (1 - t) + e.tx * t + 0; // Not using this; calc below
            // Bezier-like path
            const p0x = W * 0.25 + 30, p0y = H * 0.25;
            const p1x = W * 0.5, p1y = H * 0.08;
            const p2x = W * 0.75 - 30, p2y = H * 0.25;
            e.x = (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * p1x + t * t * p2x;
            e.y = (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;
        }

        // Update ions
        for (let i = state.ions.length - 1; i >= 0; i--) {
            const ion = state.ions[i];
            ion.x += ion.vx;
            ion.y += ion.vy;
            ion.life -= dt * 0.3;
            if (ion.life <= 0 || ion.x < 0 || ion.x > W || ion.y > H) {
                state.ions.splice(i, 1);
            }
        }
    }

    function render() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const anodeData = ELECTRODE_DATA[state.anode];
        const cathodeData = ELECTRODE_DATA[state.cathode];
        const anodeX = W * 0.25, cathodeX = W * 0.75;
        const beakerTop = H * 0.35, beakerBot = H * 0.85, beakerW = W * 0.2;

        // Wire connection (top)
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(anodeX, H * 0.25);
        ctx.quadraticCurveTo(W * 0.5, H * 0.08, cathodeX, H * 0.25);
        ctx.stroke();

        // Voltmeter
        ctx.fillStyle = '#1a1a24';
        ctx.strokeStyle = 'rgba(16,185,129,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(W * 0.5, H * 0.12, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const Ecell = cathodeData.E - anodeData.E;
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(Ecell.toFixed(2) + ' V', W * 0.5, H * 0.12 + 4);

        // eˉ direction arrow on wire
        if (state.isPlaying && Ecell > 0) {
            const arrowT = 0.5;
            const ax = (1 - arrowT) * (1 - arrowT) * (anodeX + 30) + 2 * (1 - arrowT) * arrowT * W * 0.5 + arrowT * arrowT * (cathodeX - 30);
            const ay = (1 - arrowT) * (1 - arrowT) * H * 0.25 + 2 * (1 - arrowT) * arrowT * H * 0.08 + arrowT * arrowT * H * 0.25;
            ctx.fillStyle = '#fbbf24';
            ctx.font = '11px Inter';
            ctx.fillText('e⁻ →', ax, ay - 12);
        }

        // Anode beaker
        drawBeaker(anodeX - beakerW / 2, beakerTop, beakerW, beakerBot - beakerTop, 'rgba(100,116,139,0.15)', state.anode + '²⁺(aq)');
        // Cathode beaker
        drawBeaker(cathodeX - beakerW / 2, beakerTop, beakerW, beakerBot - beakerTop, 'rgba(194,112,62,0.15)', cathodeData.ion + '(aq)');

        // Salt bridge
        const sbY = beakerTop + 20;
        ctx.fillStyle = '#4a4a5a';
        ctx.beginPath();
        ctx.roundRect(anodeX + beakerW / 2 - 5, sbY, cathodeX - anodeX - beakerW + 10, 18, 8);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Salt Bridge (KCl)', W * 0.5, sbY + 13);

        // Anode electrode
        drawElectrode(anodeX, beakerTop + 10, 80, anodeData.color, state.anode, 'Anode (−)');
        // Cathode electrode
        drawElectrode(cathodeX, beakerTop + 10, 80, cathodeData.color, state.cathode, 'Cathode (+)');

        // Labels
        ctx.fillStyle = '#ef4444';
        ctx.font = '13px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('OXIDATION', anodeX, beakerBot + 20);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px Inter';
        ctx.fillText(anodeData.halfRx, anodeX, beakerBot + 35);

        ctx.fillStyle = '#3b82f6';
        ctx.font = '13px Outfit';
        ctx.fillText('REDUCTION', cathodeX, beakerBot + 20);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px Inter';
        ctx.fillText(cathodeData.halfRx, cathodeX, beakerBot + 35);

        // Draw electrons
        for (const e of state.electrons) {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(e.x, e.y, 3, 0, Math.PI * 2);
            ctx.fill();
            const eg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 8);
            eg.addColorStop(0, 'rgba(251,191,36,0.4)');
            eg.addColorStop(1, 'rgba(251,191,36,0)');
            ctx.fillStyle = eg;
            ctx.beginPath();
            ctx.arc(e.x, e.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw ions
        for (const ion of state.ions) {
            ctx.globalAlpha = ion.life;
            ctx.fillStyle = ion.side === 'anode' ? '#60a5fa' : '#f97316';
            ctx.beginPath();
            ctx.arc(ion.x, ion.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function drawBeaker(x, y, w, h, solColor, label) {
        // Solution
        ctx.fillStyle = solColor;
        ctx.fillRect(x + 5, y + 20, w - 10, h - 25);

        // Beaker outline
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 5, y);
        ctx.lineTo(x + 5, y + h);
        ctx.lineTo(x + w - 5, y + h);
        ctx.lineTo(x + w - 5, y);
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w / 2, y + h - 10);
    }

    function drawElectrode(x, y, h, color, symbol, label) {
        // Electrode bar
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x - 12, y, 24, h, 3);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(symbol, x, y + h / 2 + 4);

        // Polarity label
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px Inter';
        ctx.fillText(label, x, y - 8);
    }

    let lastTime = performance.now();
    function loop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        update(dt);
        render();
        requestAnimationFrame(loop);
    }

    calcCell();
    render();
    requestAnimationFrame(loop);

    const toggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) toggle.addEventListener('click', () => navLinks.classList.toggle('active'));
})();
