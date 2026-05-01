/**
 * Electric Field Simulation
 * ScienceSim - Physics Lab
 *
 * Physics (Coulomb's Law & Electric Fields):
 * - F = k·q₁·q₂ / r²
 * - E = k·q / r² (field magnitude)
 * - V = k·q / r (potential)
 * - k = 8.99 × 10⁹ N·m²/C²
 * - Field lines: outward from +, inward to -
 */

(function () {
    'use strict';

    const K = 8.99e9; // Coulomb constant
    const FIELD_LINE_STEPS = 200;
    const FIELD_LINE_STEP_SIZE = 5;

    const state = {
        charges: [],
        chargeMag: 5.0,     // μC
        chargeSign: 1,       // +1 or -1
        fieldLinesPerCharge: 12,
        mouseX: 0, mouseY: 0
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
    const chargeSlider = document.getElementById('charge-slider');
    const signSlider = document.getElementById('sign-slider');
    const linesSlider = document.getElementById('lines-slider');
    const chargeVal = document.getElementById('charge-value');
    const signVal = document.getElementById('sign-value');
    const linesVal = document.getElementById('lines-value');
    const clearBtn = document.getElementById('clear-btn');

    chargeSlider.addEventListener('input', e => {
        state.chargeMag = parseFloat(e.target.value);
        chargeVal.textContent = state.chargeMag.toFixed(1) + ' μC';
    });
    signSlider.addEventListener('input', e => {
        state.chargeSign = parseInt(e.target.value) === 1 ? 1 : -1;
        signVal.textContent = state.chargeSign > 0 ? 'Positive (+)' : 'Negative (−)';
    });
    linesSlider.addEventListener('input', e => {
        state.fieldLinesPerCharge = parseInt(e.target.value);
        linesVal.textContent = state.fieldLinesPerCharge;
    });
    clearBtn.addEventListener('click', () => {
        state.charges = [];
        updateInfo();
    });

    // Click to place charge
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        state.charges.push({
            x, y,
            q: state.chargeMag * state.chargeSign * 1e-6 // Convert to Coulombs
        });
        updateInfo();
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        state.mouseX = e.clientX - rect.left;
        state.mouseY = e.clientY - rect.top;
    });

    function updateInfo() {
        const count = state.charges.length;
        const netQ = state.charges.reduce((s, c) => s + c.q, 0) * 1e6;
        document.getElementById('data-count').textContent = count;
        document.getElementById('data-net').textContent = netQ.toFixed(1) + ' μC';
    }

    function getFieldAt(x, y) {
        let Ex = 0, Ey = 0;
        for (const c of state.charges) {
            const dx = x - c.x, dy = y - c.y;
            const r2 = dx * dx + dy * dy;
            if (r2 < 100) continue; // Skip if too close
            const r = Math.sqrt(r2);
            // Scale factor — we use pixel distance directly, treating 1px = 0.01m
            const scale = 0.01;
            const rM = r * scale;
            const E = K * Math.abs(c.q) / (rM * rM);
            const sign = c.q > 0 ? 1 : -1;
            Ex += sign * E * (dx / r);
            Ey += sign * E * (dy / r);
        }
        return { Ex, Ey };
    }

    function getPotentialAt(x, y) {
        let V = 0;
        for (const c of state.charges) {
            const dx = x - c.x, dy = y - c.y;
            const r = Math.sqrt(dx * dx + dy * dy) * 0.01;
            if (r < 0.05) continue;
            V += K * c.q / r;
        }
        return V;
    }

    function traceFieldLine(startX, startY, direction) {
        const points = [{ x: startX, y: startY }];
        let x = startX, y = startY;

        for (let i = 0; i < FIELD_LINE_STEPS; i++) {
            const field = getFieldAt(x, y);
            const mag = Math.sqrt(field.Ex * field.Ex + field.Ey * field.Ey);
            if (mag < 1e-3) break;

            const dx = (field.Ex / mag) * FIELD_LINE_STEP_SIZE * direction;
            const dy = (field.Ey / mag) * FIELD_LINE_STEP_SIZE * direction;
            x += dx;
            y += dy;

            if (x < -50 || x > W + 50 || y < -50 || y > H + 50) break;

            // Stop if we hit another charge
            let hitCharge = false;
            for (const c of state.charges) {
                const dist = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2);
                if (dist < 15) { hitCharge = true; break; }
            }
            if (hitCharge) { points.push({ x, y }); break; }

            points.push({ x, y });
        }
        return points;
    }

    function render() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Draw field lines
        for (const charge of state.charges) {
            const n = state.fieldLinesPerCharge;
            const direction = charge.q > 0 ? 1 : -1;

            for (let i = 0; i < n; i++) {
                const angle = (i / n) * Math.PI * 2;
                const startX = charge.x + Math.cos(angle) * 18;
                const startY = charge.y + Math.sin(angle) * 18;
                const points = traceFieldLine(startX, startY, direction);

                if (points.length < 2) continue;

                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let j = 1; j < points.length; j++) {
                    ctx.lineTo(points[j].x, points[j].y);
                }

                const alpha = Math.min(0.6, 0.2 + Math.abs(charge.q) * 1e5);
                ctx.strokeStyle = charge.q > 0
                    ? `rgba(239, 68, 68, ${alpha})`
                    : `rgba(59, 130, 246, ${alpha})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Arrowheads along lines
                if (points.length > 20) {
                    const mi = Math.floor(points.length / 2);
                    const p1 = points[mi - 1], p2 = points[mi];
                    const a = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.beginPath();
                    ctx.moveTo(p2.x, p2.y);
                    ctx.lineTo(p2.x - 6 * Math.cos(a - 0.4), p2.y - 6 * Math.sin(a - 0.4));
                    ctx.lineTo(p2.x - 6 * Math.cos(a + 0.4), p2.y - 6 * Math.sin(a + 0.4));
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }

        // Draw charges
        for (const charge of state.charges) {
            const isPositive = charge.q > 0;
            const color = isPositive ? '#ef4444' : '#3b82f6';
            const colorLight = isPositive ? '#fca5a5' : '#93c5fd';

            // Glow
            const glow = ctx.createRadialGradient(charge.x, charge.y, 0, charge.x, charge.y, 40);
            glow.addColorStop(0, isPositive ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(charge.x, charge.y, 40, 0, Math.PI * 2);
            ctx.fill();

            // Circle
            const grad = ctx.createRadialGradient(charge.x - 4, charge.y - 4, 0, charge.x, charge.y, 16);
            grad.addColorStop(0, colorLight);
            grad.addColorStop(1, color);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(charge.x, charge.y, 16, 0, Math.PI * 2);
            ctx.fill();

            // + or - sign
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(charge.x - 6, charge.y);
            ctx.lineTo(charge.x + 6, charge.y);
            ctx.stroke();
            if (isPositive) {
                ctx.beginPath();
                ctx.moveTo(charge.x, charge.y - 6);
                ctx.lineTo(charge.x, charge.y + 6);
                ctx.stroke();
            }

            // Label
            const qMu = (charge.q * 1e6).toFixed(1);
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`${qMu} μC`, charge.x, charge.y + 28);
        }

        // Field info at cursor
        if (state.charges.length > 0) {
            const field = getFieldAt(state.mouseX, state.mouseY);
            const E = Math.sqrt(field.Ex * field.Ex + field.Ey * field.Ey);
            const V = getPotentialAt(state.mouseX, state.mouseY);
            document.getElementById('data-field').textContent = E > 1e6 ? (E / 1e6).toFixed(1) + ' MN/C' : E > 1e3 ? (E / 1e3).toFixed(1) + ' kN/C' : E.toFixed(1) + ' N/C';
            document.getElementById('data-potential').textContent = Math.abs(V) > 1e6 ? (V / 1e6).toFixed(1) + ' MV' : Math.abs(V) > 1e3 ? (V / 1e3).toFixed(1) + ' kV' : V.toFixed(1) + ' V';
        }

        // Instructions
        if (state.charges.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Click anywhere to place a charge', W / 2, H / 2);
            ctx.font = '13px Inter';
            ctx.fillText('Use sidebar to set charge magnitude and sign', W / 2, H / 2 + 30);
        }

        // Legend
        ctx.textAlign = 'left';
        ctx.font = '12px Inter';
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(20, 20, 12, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('Positive charge', 40, 30);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(20, 40, 12, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('Negative charge', 40, 50);
    }

    let lastTime = performance.now();
    function loop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        render();
        requestAnimationFrame(loop);
    }

    updateInfo();
    render();
    requestAnimationFrame(loop);

    const toggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) toggle.addEventListener('click', () => navLinks.classList.toggle('active'));
})();
