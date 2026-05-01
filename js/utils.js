/**
 * ScienceSim - Utility Functions
 * Common canvas and simulation utilities
 */

/**
 * Canvas Setup Utility
 * Creates a properly scaled canvas for high-DPI displays
 */
function setupCanvas(container) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    function resize() {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';

        ctx.scale(dpr, dpr);

        return { width: rect.width, height: rect.height };
    }

    container.appendChild(canvas);
    const size = resize();

    window.addEventListener('resize', resize);

    return {
        canvas, ctx, resize, getSize: () => {
            const rect = container.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
        }
    };
}

/**
 * Animation Loop Handler
 * Provides frame-rate independent updates
 */
class SimulationLoop {
    constructor(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.lastTime = 0;
        this.running = false;
        this.animationId = null;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.loop();
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    loop() {
        if (!this.running) return;

        const currentTime = performance.now();
        const dt = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        // Cap delta time to prevent large jumps
        const cappedDt = Math.min(dt, 0.1);

        this.updateFn(cappedDt);
        this.renderFn();

        this.animationId = requestAnimationFrame(() => this.loop());
    }
}

/**
 * Convert degrees to radians
 */
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Map a value from one range to another
 */
function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Format number with specified decimal places
 */
function formatNumber(value, decimals = 2) {
    return Number(value).toFixed(decimals);
}

/**
 * Draw an arrow (vector) on canvas
 */
function drawArrow(ctx, fromX, fromY, toX, toY, color = '#ffffff', headLength = 10) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
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

/**
 * Draw a grid on canvas
 */
function drawGrid(ctx, width, height, spacing, color = 'rgba(255, 255, 255, 0.05)', offsetX = 0, offsetY = 0) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    // Vertical lines
    const startX = offsetX % spacing;
    for (let x = startX; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Horizontal lines
    const startY = offsetY % spacing;
    for (let y = startY; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

/**
 * Color utilities for consistent theming
 */
const Colors = {
    primary: 'hsl(220, 90%, 60%)',
    physics: '#8b5cf6',
    chemistry: '#10b981',
    background: '#0a0a0f',
    text: '#ffffff',
    textMuted: '#71717a',
    grid: 'rgba(255, 255, 255, 0.05)',
    gridMajor: 'rgba(255, 255, 255, 0.1)'
};

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setupCanvas,
        SimulationLoop,
        degToRad,
        radToDeg,
        clamp,
        lerp,
        mapRange,
        formatNumber,
        drawArrow,
        drawGrid,
        Colors
    };
}
