/**
 * Molecular Structure Viewer
 * ScienceSim - Chemistry Lab
 *
 * Displays ball-and-stick models of common molecules with:
 * - Atom coloring based on element (CPK convention)
 * - Bond visualization (single, double, triple)
 * - Rotation and zoom controls
 * - Real-time info on geometry, bond angles, polarity
 */

(function () {
    'use strict';

    // Atom colors (CPK convention)
    const ATOM_COLORS = {
        H: { fill: '#f0f0f0', r: 16, name: 'Hydrogen' },
        O: { fill: '#ef4444', r: 22, name: 'Oxygen' },
        C: { fill: '#3a3a3a', r: 22, name: 'Carbon' },
        N: { fill: '#3b82f6', r: 21, name: 'Nitrogen' },
        Cl: { fill: '#22c55e', r: 24, name: 'Chlorine' }
    };

    // Molecule database
    const MOLECULES = {
        H2O: {
            name: 'Water', formula: 'H₂O', geometry: 'Bent', bondAngle: '104.5°',
            polarity: 'Polar', molarMass: '18.02 g/mol', bondDesc: '2 O-H',
            atoms: [
                { el: 'O', x: 0, y: 0 },
                { el: 'H', x: -0.8, y: 0.6 },
                { el: 'H', x: 0.8, y: 0.6 }
            ],
            bonds: [[0, 1, 1], [0, 2, 1]] // [from, to, order]
        },
        CO2: {
            name: 'Carbon Dioxide', formula: 'CO₂', geometry: 'Linear', bondAngle: '180°',
            polarity: 'Nonpolar', molarMass: '44.01 g/mol', bondDesc: '2 C=O',
            atoms: [
                { el: 'C', x: 0, y: 0 },
                { el: 'O', x: -1.2, y: 0 },
                { el: 'O', x: 1.2, y: 0 }
            ],
            bonds: [[0, 1, 2], [0, 2, 2]]
        },
        CH4: {
            name: 'Methane', formula: 'CH₄', geometry: 'Tetrahedral', bondAngle: '109.5°',
            polarity: 'Nonpolar', molarMass: '16.04 g/mol', bondDesc: '4 C-H',
            atoms: [
                { el: 'C', x: 0, y: 0 },
                { el: 'H', x: 0, y: -1 },
                { el: 'H', x: -0.94, y: 0.33 },
                { el: 'H', x: 0.94, y: 0.33 },
                { el: 'H', x: 0, y: 0.85 }
            ],
            bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]
        },
        NH3: {
            name: 'Ammonia', formula: 'NH₃', geometry: 'Trigonal Pyramidal', bondAngle: '107°',
            polarity: 'Polar', molarMass: '17.03 g/mol', bondDesc: '3 N-H',
            atoms: [
                { el: 'N', x: 0, y: -0.2 },
                { el: 'H', x: -0.8, y: 0.6 },
                { el: 'H', x: 0.8, y: 0.6 },
                { el: 'H', x: 0, y: -0.9 }
            ],
            bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]]
        },
        O2: {
            name: 'Oxygen', formula: 'O₂', geometry: 'Linear', bondAngle: '—',
            polarity: 'Nonpolar', molarMass: '32.00 g/mol', bondDesc: '1 O=O',
            atoms: [
                { el: 'O', x: -0.6, y: 0 },
                { el: 'O', x: 0.6, y: 0 }
            ],
            bonds: [[0, 1, 2]]
        },
        N2: {
            name: 'Nitrogen', formula: 'N₂', geometry: 'Linear', bondAngle: '—',
            polarity: 'Nonpolar', molarMass: '28.01 g/mol', bondDesc: '1 N≡N',
            atoms: [
                { el: 'N', x: -0.55, y: 0 },
                { el: 'N', x: 0.55, y: 0 }
            ],
            bonds: [[0, 1, 3]]
        },
        HCl: {
            name: 'Hydrogen Chloride', formula: 'HCl', geometry: 'Linear', bondAngle: '—',
            polarity: 'Polar', molarMass: '36.46 g/mol', bondDesc: '1 H-Cl',
            atoms: [
                { el: 'H', x: -0.65, y: 0 },
                { el: 'Cl', x: 0.65, y: 0 }
            ],
            bonds: [[0, 1, 1]]
        },
        C2H4: {
            name: 'Ethylene', formula: 'C₂H₄', geometry: 'Trigonal Planar', bondAngle: '120°',
            polarity: 'Nonpolar', molarMass: '28.05 g/mol', bondDesc: '1 C=C, 4 C-H',
            atoms: [
                { el: 'C', x: -0.6, y: 0 },
                { el: 'C', x: 0.6, y: 0 },
                { el: 'H', x: -1.2, y: -0.6 },
                { el: 'H', x: -1.2, y: 0.6 },
                { el: 'H', x: 1.2, y: -0.6 },
                { el: 'H', x: 1.2, y: 0.6 }
            ],
            bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]]
        }
    };

    let currentMol = 'H2O';
    let rotation = 0;
    let zoom = 1.0;
    let dragAngle = 0;
    let isDragging = false;
    let lastMouseX = 0;

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
    const select = document.getElementById('molecule-select');
    const rotSlider = document.getElementById('rot-slider');
    const zoomSlider = document.getElementById('zoom-slider');

    select.addEventListener('change', e => { currentMol = e.target.value; updateInfo(); });
    rotSlider.addEventListener('input', e => { rotation = parseFloat(e.target.value) * Math.PI / 180; document.getElementById('rot-value').textContent = e.target.value + '°'; });
    zoomSlider.addEventListener('input', e => { zoom = parseFloat(e.target.value); document.getElementById('zoom-value').textContent = zoom.toFixed(1) + 'x'; });

    // Drag to rotate
    canvas.addEventListener('mousedown', (e) => { isDragging = true; lastMouseX = e.clientX; });
    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMouseX;
        dragAngle += dx * 0.01;
        lastMouseX = e.clientX;
    });
    window.addEventListener('mouseup', () => isDragging = false);

    function updateInfo() {
        const mol = MOLECULES[currentMol];
        document.getElementById('data-formula').textContent = mol.formula;
        document.getElementById('data-geometry').textContent = mol.geometry;
        document.getElementById('data-angle').textContent = mol.bondAngle;
        document.getElementById('data-polarity').textContent = mol.polarity;
        document.getElementById('data-mass').textContent = mol.molarMass;
        document.getElementById('data-bonds').textContent = mol.bondDesc;
    }

    function render() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const mol = MOLECULES[currentMol];
        const cx = W / 2, cy = H / 2;
        const scale = 100 * zoom;
        const totalRot = rotation + dragAngle;

        // Transform atom positions
        const transformed = mol.atoms.map(a => {
            const rx = a.x * Math.cos(totalRot) - a.y * Math.sin(totalRot);
            const ry = a.x * Math.sin(totalRot) + a.y * Math.cos(totalRot);
            return {
                el: a.el,
                px: cx + rx * scale,
                py: cy + ry * scale
            };
        });

        // Draw bonds first
        for (const bond of mol.bonds) {
            const a1 = transformed[bond[0]];
            const a2 = transformed[bond[1]];
            const order = bond[2];
            const dx = a2.px - a1.px, dy = a2.py - a1.py;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len, ny = dx / len; // perpendicular

            ctx.lineWidth = 4;
            ctx.lineCap = 'round';

            if (order === 1) {
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.moveTo(a1.px, a1.py);
                ctx.lineTo(a2.px, a2.py);
                ctx.stroke();
            } else if (order === 2) {
                const offset = 4;
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.moveTo(a1.px + nx * offset, a1.py + ny * offset);
                ctx.lineTo(a2.px + nx * offset, a2.py + ny * offset);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(a1.px - nx * offset, a1.py - ny * offset);
                ctx.lineTo(a2.px - nx * offset, a2.py - ny * offset);
                ctx.stroke();
            } else if (order === 3) {
                const offset = 6;
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath(); ctx.moveTo(a1.px, a1.py); ctx.lineTo(a2.px, a2.py); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(a1.px + nx * offset, a1.py + ny * offset); ctx.lineTo(a2.px + nx * offset, a2.py + ny * offset); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(a1.px - nx * offset, a1.py - ny * offset); ctx.lineTo(a2.px - nx * offset, a2.py - ny * offset); ctx.stroke();
            }
        }

        // Draw atoms
        for (const atom of transformed) {
            const info = ATOM_COLORS[atom.el];
            const r = info.r * zoom;

            // Glow
            const glow = ctx.createRadialGradient(atom.px, atom.py, 0, atom.px, atom.py, r * 2);
            glow.addColorStop(0, info.fill + '40');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(atom.px, atom.py, r * 2, 0, Math.PI * 2);
            ctx.fill();

            // Atom sphere
            const grad = ctx.createRadialGradient(atom.px - r / 3, atom.py - r / 3, 0, atom.px, atom.py, r);
            const baseColor = info.fill;
            grad.addColorStop(0, '#ffffff80');
            grad.addColorStop(0.3, baseColor);
            grad.addColorStop(1, baseColor + '80');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(atom.px, atom.py, r, 0, Math.PI * 2);
            ctx.fill();

            // Outline
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Element label
            ctx.fillStyle = atom.el === 'C' ? '#fff' : '#000';
            ctx.font = `bold ${Math.round(12 * zoom)}px Inter`;
            ctx.textAlign = 'center';
            ctx.fillText(atom.el, atom.px, atom.py + 4 * zoom);
        }

        // Molecule name
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '20px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(mol.name, cx, 40);
        ctx.font = '14px Inter';
        ctx.fillText(mol.formula, cx, 62);

        // Bond angle visualization (for molecules with > 2 atoms)
        if (mol.atoms.length >= 3 && mol.bondAngle !== '—') {
            ctx.fillStyle = 'rgba(16,185,129,0.4)';
            ctx.font = '13px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`Bond Angle: ${mol.bondAngle}`, cx, H - 30);
        }

        // Instructions
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Click and drag to rotate • Use slider to zoom', cx, H - 10);
    }

    let lastTime = performance.now();
    function loop(now) {
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
