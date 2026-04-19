// input.js
export class InputHandler {
    constructor() {
        this.touchStart = { x: 0, y: 0 };
        this.command = null;
        this.moveDir = { x: 0, y: 0 };
        this.joystickActive = false;
        this.keys = {};

        // Mouse Events
        window.addEventListener('mousedown', e => this.handleStart(e.clientX, e.clientY));
        window.addEventListener('mousemove', e => this.handleMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', () => this.handleEnd());

        // Touch Events
        window.addEventListener('touchstart', e => this.handleStart(e.touches[0].clientX, e.touches[0].clientY));
        window.addEventListener('touchmove', e => this.handleMove(e.touches[0].clientX, e.touches[0].clientY));
        window.addEventListener('touchend', () => this.handleEnd());

        // Keyboard
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'Space') this.command = 'UP_SWIPE';
            if (e.code === 'ShiftLeft') this.command = 'RIGHT_SWIPE';
        });
        window.addEventListener('keyup', e => this.keys[e.code] = false);
    }

    handleStart(x, y) {
        this.touchStart = { x: x, y: y };
        this.joystickActive = true;
    }

    handleMove(x, y) {
        if (!this.joystickActive) return;
        const dx = x - this.touchStart.x;
        const dy = y - this.touchStart.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 10) {
            this.moveDir.x = dx / dist;
            this.moveDir.y = dy / dist;
        }

        if (dy < -70 && Math.abs(dx) < 30) this.command = 'UP_SWIPE';
        if (dx > 70 && Math.abs(dy) < 30) this.command = 'RIGHT_SWIPE';
    }

    handleEnd() {
        this.joystickActive = false;
        this.moveDir = { x: 0, y: 0 };
    }

    getMovement() {
        let x = this.moveDir.x;
        let y = this.moveDir.y;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) y = -1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) y = 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) x = -1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) x = 1;

        if (x !== 0 && y !== 0) {
            const mag = Math.hypot(x, y);
            x /= mag; y /= mag;
        }
        return { x, y };
    }

    consumeCommand() {
        const cmd = this.command;
        this.command = null;
        return cmd;
    }
}
