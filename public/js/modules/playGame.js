// Play Minigame — tap glowing targets as fast as possible
export class PlayMinigame {
  constructor(canvasId, scoreId, timerId, bestId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.scoreEl = document.getElementById(scoreId);
    this.timerEl = document.getElementById(timerId);
    this.bestEl  = document.getElementById(bestId);

    this.score = 0;
    this.timeLeft = 15;
    this.bestReaction = Infinity;
    this.target = null;
    this.running = false;
    this.shownAt = null;
    this._frame = null;
    this._countdown = null;
    this._spawnTimeout = null;

    this._bindClick();
  }

  _bindClick() {
    const handler = (e) => {
      if (!this.running || !this.target) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const dx = x - this.target.x, dy = y - this.target.y;
      if (Math.sqrt(dx * dx + dy * dy) < this.target.r) {
        const reaction = Date.now() - this.shownAt;
        this._onHit(reaction);
      }
    };
    const touchHandler = (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      handler({ clientX: t.clientX, clientY: t.clientY });
    };
    this.canvas.addEventListener('click', handler);
    this.canvas.addEventListener('touchstart', touchHandler, { passive: false });
  }

  start(onFinish) {
    this.score = 0; this.timeLeft = 15; this.bestReaction = Infinity;
    this.target = null; this.running = true;
    this.onFinish = onFinish;
    this._hitFX = [];
    this._updateHUD();
    this._countdown = setInterval(() => {
      this.timeLeft--;
      this._updateHUD();
      if (this.timeLeft <= 0) this._end();
    }, 1000);
    this._scheduleNext(800);
    this._loop();
  }

  _scheduleNext(delay) {
    this._spawnTimeout = setTimeout(() => {
      if (!this.running) return;
      const padding = 50;
      const r = 28 + Math.random() * 18;
      const x = padding + Math.random() * (this.canvas.width - padding * 2);
      const y = padding + Math.random() * (this.canvas.height - padding * 2);
      this.target = { x, y, r, pulse: 0 };
      this.shownAt = Date.now();
    }, delay);
  }

  _onHit(reaction) {
    const pts = Math.max(10, Math.round(1000 / (reaction / 100)));
    this.score += pts;
    if (reaction < this.bestReaction) this.bestReaction = reaction;
    this._hitFX.push({ x: this.target.x, y: this.target.y, text: `+${pts}`, alpha: 1 });
    this.target = null;
    this._updateHUD();
    this._scheduleNext(400 + Math.random() * 600);
  }

  _hitFX = [];

  _loop() {
    if (!this.running) return;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (this.target) {
      this.target.pulse = (this.target.pulse + 0.08) % (Math.PI * 2);
      const glow = 1 + Math.sin(this.target.pulse) * 0.3;

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(this.target.x, this.target.y, this.target.r * glow * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(92,200,255,0.12)';
      ctx.fill();

      // Main target
      const grad = ctx.createRadialGradient(
        this.target.x, this.target.y, 0,
        this.target.x, this.target.y, this.target.r * glow
      );
      grad.addColorStop(0, '#a8e4ff');
      grad.addColorStop(0.6, '#5ab4f5');
      grad.addColorStop(1, '#1864b0');
      ctx.beginPath();
      ctx.arc(this.target.x, this.target.y, this.target.r * glow, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Cross hair
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.target.x - 10, this.target.y);
      ctx.lineTo(this.target.x + 10, this.target.y);
      ctx.moveTo(this.target.x, this.target.y - 10);
      ctx.lineTo(this.target.x, this.target.y + 10);
      ctx.stroke();
    }

    // Hit FX
    this._hitFX = this._hitFX.filter(fx => {
      fx.y -= 1.5;
      fx.alpha -= 0.04;
      if (fx.alpha <= 0) return false;
      ctx.globalAlpha = fx.alpha;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#f5d060';
      ctx.textAlign = 'center';
      ctx.fillText(fx.text, fx.x, fx.y);
      ctx.globalAlpha = 1;
      return true;
    });

    this._frame = requestAnimationFrame(() => this._loop());
  }

  _end() {
    this.running = false;
    clearInterval(this._countdown);
    clearTimeout(this._spawnTimeout);
    cancelAnimationFrame(this._frame);
    this.onFinish?.(this.score);
  }

  _updateHUD() {
    this.scoreEl.textContent = this.score;
    this.timerEl.textContent = this.timeLeft;
    this.bestEl.textContent  = this.bestReaction === Infinity ? '—' : `${this.bestReaction}ms`;
  }

  destroy() { this._end(); }
}
