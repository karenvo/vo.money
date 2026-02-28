// Nostalgic 90's Effects and Animations

// Add CSS animation for terminal glitch
const style = document.createElement('style');
style.textContent = `
    @keyframes terminal-glitch {
        0%, 100% { 
            transform: translate(0);
            filter: hue-rotate(0deg);
        }
        10% { 
            transform: translate(-2px, 2px);
            filter: hue-rotate(90deg);
        }
        20% { 
            transform: translate(-2px, -2px);
            filter: hue-rotate(180deg);
        }
        30% { 
            transform: translate(2px, 2px);
            filter: hue-rotate(270deg);
        }
        40% { 
            transform: translate(2px, -2px);
            filter: hue-rotate(360deg);
        }
        50% { 
            transform: translate(0);
            filter: hue-rotate(0deg);
        }
    }
`;
document.head.appendChild(style);

// VHS Tape Effect
class VHSEffect {
    constructor() {
        this.init();
    }
    
    init() {
        // Random VHS tracking issues
        setInterval(() => {
            if (Math.random() > 0.7) {
                this.triggerTrackingIssue();
            }
        }, 8000);
        
        // Random color bleeding
        setInterval(() => {
            if (Math.random() > 0.8) {
                this.triggerColorBleed();
            }
        }, 12000);
    }
    
    triggerTrackingIssue() {
        const overlay = document.querySelector('.vhs-overlay');
        if (overlay) {
            overlay.style.animation = 'none';
            setTimeout(() => {
                overlay.style.animation = 'vhs-tracking 0.5s';
            }, 10);
        }
    }
    
    triggerColorBleed() {
        const terminal = document.querySelector('.terminal-container');
        if (terminal) {
            terminal.style.filter = 'hue-rotate(10deg) saturate(1.2)';
            setTimeout(() => {
                terminal.style.filter = '';
            }, 200);
        }
    }
}

// CRT Monitor Effects
class CRTEffects {
    constructor() {
        this.init();
    }
    
    init() {
        // Random screen flicker
        setInterval(() => {
            if (Math.random() > 0.85) {
                this.triggerFlicker();
            }
        }, 10000);
        
        // Magnetic interference simulation
        setInterval(() => {
            if (Math.random() > 0.9) {
                this.triggerMagneticInterference();
            }
        }, 15000);
    }
    
    triggerFlicker() {
        const screen = document.querySelector('.crt-screen');
        if (screen) {
            screen.style.opacity = '0.95';
            setTimeout(() => {
                screen.style.opacity = '1';
            }, 100);
        }
    }
    
    triggerMagneticInterference() {
        const scanlines = document.querySelector('.scanlines');
        if (scanlines) {
            scanlines.style.transform = 'translateY(2px) scaleY(1.1)';
            scanlines.style.filter = 'hue-rotate(5deg)';
            setTimeout(() => {
                scanlines.style.transform = '';
                scanlines.style.filter = '';
            }, 500);
        }
    }
}

// Typing Effect for Commands (optional enhancement)
class TypingEffect {
    static type(element, text, speed = 30) {
        return new Promise((resolve) => {
            let i = 0;
            element.textContent = '';
            const timer = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(timer);
                    resolve();
                }
            }, speed);
        });
    }
}

// Matrix-style Rain Effect (optional, can be toggled)
class MatrixRain {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        this.drops = [];
    }
    
    init() {
        // Only create if user wants it (commented out by default)
        // this.createCanvas();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'matrix-rain';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1';
        this.canvas.style.opacity = '0.1';
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        const fontSize = 14;
        const columns = this.canvas.width / fontSize;
        
        for (let i = 0; i < columns; i++) {
            this.drops[i] = Math.random() * -100;
        }
        
        this.animate();
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    animate() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#00ff41';
        this.ctx.font = '14px DejaVu Sans Mono, Liberation Mono, Courier New, monospace';
        
        for (let i = 0; i < this.drops.length; i++) {
            const text = this.chars[Math.floor(Math.random() * this.chars.length)];
            const x = i * 14;
            const y = this.drops[i] * 14;
            
            this.ctx.fillText(text, x, y);
            
            if (y > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            
            this.drops[i]++;
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize effects when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new VHSEffect();
    new CRTEffects();
    // new MatrixRain(); // Uncomment if you want matrix rain effect
});

// Add random glitch to text elements
function addTextGlitch(element) {
    setInterval(() => {
        if (Math.random() > 0.95) {
            element.style.textShadow = `
                2px 2px 0 #00ffff,
                -2px -2px 0 #ff00ff
            `;
            setTimeout(() => {
                element.style.textShadow = '';
            }, 100);
        }
    }, 3000);
}

// Pixelated cursor trail effect
class PixelCursorTrail {
    constructor() {
        this.pixels = [];
        this.pixelId = 0;
        this.lastPosition = { x: -1000, y: -1000 }; // Initialize far away so first pixel always creates
        this.pixelSize = 12;
        this.trailLength = 30;
        this.fadeSpeed = 0.05;
        this.animationFrame = null;
        this.isActive = false;
        this.init();
    }
    
    init() {
        this.isActive = true;
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.startAnimation();
    }
    
    handleMouseMove(e) {
        const x = e.clientX;
        const y = e.clientY;
        
        const dx = x - this.lastPosition.x;
        const dy = y - this.lastPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only create pixel if mouse moved enough distance (lower threshold for more pixels)
        if (distance > 3) {
            this.createPixel(x, y);
            this.lastPosition = { x, y };
        }
    }
    
    createPixel(x, y) {
        const pixel = {
            id: this.pixelId++,
            x: x,
            y: y,
            opacity: 1,
            age: 0,
            element: null
        };
        
        // Create pixel element
        const element = document.createElement('div');
        element.className = 'pixel-cursor-trail';
        element.style.cssText = `
            position: fixed;
            left: ${x - this.pixelSize / 2}px;
            top: ${y - this.pixelSize / 2}px;
            width: ${this.pixelSize}px;
            height: ${this.pixelSize}px;
            background-color: #00ff41;
            opacity: 1;
            pointer-events: none;
            z-index: 99999;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
            -ms-interpolation-mode: nearest-neighbor;
            -webkit-font-smoothing: none;
            -moz-osx-font-smoothing: unset;
        `;
        
        document.body.appendChild(element);
        pixel.element = element;
        
        this.pixels.push(pixel);
        
        // Limit trail length
        if (this.pixels.length > this.trailLength) {
            const oldPixel = this.pixels.shift();
            if (oldPixel && oldPixel.element) {
                oldPixel.element.remove();
            }
        }
    }
    
    startAnimation() {
        const animate = () => {
            if (!this.isActive) return;
            this.updatePixels();
            this.animationFrame = requestAnimationFrame(animate);
        };
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    updatePixels() {
        this.pixels = this.pixels.filter(pixel => {
            if (!pixel.element) return false;
            
            pixel.opacity -= this.fadeSpeed;
            pixel.age += 1;
            
            if (pixel.opacity <= 0) {
                pixel.element.remove();
                return false;
            }
            
            // Calculate size based on age - older pixels are smaller
            const sizeMultiplier = Math.max(0.4, 1 - pixel.age / 80);
            const currentSize = this.pixelSize * sizeMultiplier;
            
            // Update element
            pixel.element.style.opacity = pixel.opacity;
            pixel.element.style.width = Math.round(currentSize) + 'px';
            pixel.element.style.height = Math.round(currentSize) + 'px';
            pixel.element.style.left = Math.round(pixel.x - currentSize / 2) + 'px';
            pixel.element.style.top = Math.round(pixel.y - currentSize / 2) + 'px';
            
            return true;
        });
    }
    
    destroy() {
        this.isActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.pixels.forEach(pixel => {
            if (pixel.element) {
                pixel.element.remove();
            }
        });
        this.pixels = [];
    }
}

// Initialize pixel cursor trail
document.addEventListener('DOMContentLoaded', () => {
    new PixelCursorTrail();
});

