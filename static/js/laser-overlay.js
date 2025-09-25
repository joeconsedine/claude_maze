class LaserOverlay {
    constructor(containerElement) {
        this.container = containerElement;
        this.canvas = null;
        this.ctx = null;
        this.laserTrails = [];
        this.isActive = false;
        this.animationFrame = null;

        // Touch/mouse tracking
        this.isPointerDown = false;
        this.lastPointerPos = { x: 0, y: 0 };

        // Laser properties
        this.laserColor = '#00ff88';
        this.glowColor = '#00ff88';
        this.trailFadeSpeed = 0.8;
        this.maxTrailLength = 50;
        this.laserWidth = 3;
        this.glowIntensity = 0.8;

        this.init();
    }

    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.startAnimation();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'laser-overlay-canvas';
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            mix-blend-mode: screen;
        `;

        this.container.style.position = 'relative';
        this.container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Listen for container resize
        new ResizeObserver(() => this.resize()).observe(this.container);
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        this.ctx.scale(dpr, dpr);
    }

    setupEventListeners() {
        // Mouse events for desktop
        this.container.addEventListener('mousedown', (e) => this.handlePointerStart(e));
        this.container.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        this.container.addEventListener('mouseup', (e) => this.handlePointerEnd(e));
        this.container.addEventListener('mouseleave', (e) => this.handlePointerEnd(e));

        // Touch events for mobile
        this.container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handlePointerStart(e.touches[0]);
        }, { passive: false });

        this.container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handlePointerMove(e.touches[0]);
        }, { passive: false });

        this.container.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handlePointerEnd(e);
        }, { passive: false });

        this.container.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handlePointerEnd(e);
        }, { passive: false });
    }

    getPointerPosition(event) {
        const rect = this.container.getBoundingClientRect();
        return {
            x: (event.clientX || event.pageX) - rect.left,
            y: (event.clientY || event.pageY) - rect.top
        };
    }

    handlePointerStart(event) {
        this.isPointerDown = true;
        this.isActive = true;
        this.lastPointerPos = this.getPointerPosition(event);

        // Add initial laser point
        this.addLaserPoint(this.lastPointerPos.x, this.lastPointerPos.y, 1.0);
    }

    handlePointerMove(event) {
        if (!this.isPointerDown) return;

        const currentPos = this.getPointerPosition(event);
        const distance = Math.sqrt(
            Math.pow(currentPos.x - this.lastPointerPos.x, 2) +
            Math.pow(currentPos.y - this.lastPointerPos.y, 2)
        );

        // Only add points if mouse/finger moved enough to avoid clustering
        if (distance > 2) {
            this.addLaserPoint(currentPos.x, currentPos.y, 1.0);
            this.lastPointerPos = currentPos;
        }
    }

    handlePointerEnd(event) {
        this.isPointerDown = false;
        // Keep animation running to fade out trails
    }

    addLaserPoint(x, y, intensity) {
        this.laserTrails.push({
            x: x,
            y: y,
            intensity: intensity,
            timestamp: Date.now(),
            size: this.laserWidth + Math.random() * 2
        });

        // Limit trail length for performance
        if (this.laserTrails.length > this.maxTrailLength) {
            this.laserTrails.shift();
        }
    }

    updateTrails() {
        const now = Date.now();

        // Update trail intensities and remove faded ones
        this.laserTrails = this.laserTrails.filter(trail => {
            const age = now - trail.timestamp;
            trail.intensity *= this.trailFadeSpeed;
            return trail.intensity > 0.01; // Remove very faded trails
        });

        // Deactivate if no trails and not actively drawing
        if (this.laserTrails.length === 0 && !this.isPointerDown) {
            this.isActive = false;
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.laserTrails.length === 0) return;

        // Set up laser rendering
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw glow effect (larger, more transparent)
        this.ctx.shadowColor = this.glowColor;
        this.ctx.shadowBlur = 15;
        this.ctx.globalCompositeOperation = 'lighter';

        // Draw each trail segment
        for (let i = 0; i < this.laserTrails.length; i++) {
            const trail = this.laserTrails[i];
            const alpha = trail.intensity * this.glowIntensity;

            if (alpha <= 0) continue;

            // Draw glow - removed dots, keeping only trail lines
            // this.ctx.beginPath();
            // this.ctx.strokeStyle = `rgba(0, 255, 136, ${alpha * 0.3})`;
            // this.ctx.lineWidth = trail.size * 4;
            // this.ctx.arc(trail.x, trail.y, trail.size * 2, 0, Math.PI * 2);
            // this.ctx.stroke();

            // Draw core laser - removed dots, keeping only trail lines
            // this.ctx.beginPath();
            // this.ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`;
            // this.ctx.lineWidth = trail.size;
            // this.ctx.arc(trail.x, trail.y, trail.size * 0.5, 0, Math.PI * 2);
            // this.ctx.stroke();
        }

        // Draw connecting lines between trail points
        if (this.laserTrails.length > 1) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.laserTrails[0].x, this.laserTrails[0].y);

            for (let i = 1; i < this.laserTrails.length; i++) {
                const trail = this.laserTrails[i];
                const alpha = trail.intensity * this.glowIntensity;

                this.ctx.lineTo(trail.x, trail.y);
                this.ctx.strokeStyle = `rgba(0, 255, 136, ${alpha * 0.6})`;
                this.ctx.lineWidth = trail.size * 0.8;
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(trail.x, trail.y);
            }
        }

        // Reset canvas state
        this.ctx.shadowBlur = 0;
        this.ctx.globalCompositeOperation = 'source-over';
    }

    startAnimation() {
        const animate = () => {
            this.updateTrails();
            this.render();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }

    setColor(laserColor, glowColor = null) {
        this.laserColor = laserColor;
        this.glowColor = glowColor || laserColor;
    }

    setIntensity(intensity) {
        this.glowIntensity = Math.max(0, Math.min(1, intensity));
    }
}

// Export for use in other scripts
window.LaserOverlay = LaserOverlay;