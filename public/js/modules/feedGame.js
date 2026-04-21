// Feed Minigame — click/tap falling food items before they drop
import { getRaceData } from './races.js';

export class FeedMinigame {
  constructor(canvasId, scoreId, timerId, streakId, race) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.scoreEl = document.getElementById(scoreId);
    this.timerEl = document.getElementById(timerId);
    this.streakEl = document.getElementById(streakId);
    this.raceData = getRaceData(race);

    this.score = 0;
    this.streak = 0;
    this.timeLeft = 10;
    this.items = [];
    this.running = false;
    this._frame = null;
    this._countdownInterval = null;
    this._spawnInterval = null;

    this._bindClick();
  }

  _bindClick() {
    const handler = (e) => {
      if (!this.running) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      this._checkHit(x, y);
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
    this.score = 0; this.streak = 0; this.timeLeft = 10; this.items = [];
    this.running = true;
    this.onFinish = onFinish;
    this._updateHUD();
    this._spawnInterval = setInterval(() => this._spawnItem(), 800);
    this._countdownInterval = setInterval(() => {
      this.timeLeft--;
      this._updateHUD();
      if (this.timeLeft <= 0) this._end();
    }, 1000);
    this._loop();
  }

  _spawnItem() {
    if (!this.running) return;
    const size = 30 + Math.random() * 20;
    const x = size + Math.random() * (this.canvas.width - size * 2);
    const speed = 1.5 + Math.random() * 2.5 + (10 - this.timeLeft) * 0.3;
    this.items.push({ x, y: -size, size, speed, hit: false, alpha: 1 });
  }

  _checkHit(cx, cy) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item.hit) continue;
      const dx = cx - item.x, dy = cy - item.y;
      if (Math.sqrt(dx * dx + dy * dy) < item.size) {
        item.hit = true;
        this.streak++;
        const bonus = Math.max(1, this.streak);
        this.score += 10 * bonus;
        this._showHitFX(item.x, item.y, `+${10 * bonus}${this.streak > 2 ? ' 🔥' : ''}`);
        this._updateHUD();
        break;
      }
    }
  }

  _hitFX = [];

  _showHitFX(x, y, text) {
    this._hitFX.push({ x, y, text, alpha: 1 });
  }

  _loop() {
    if (!this.running) return;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw & update items
    this.items = this.items.filter(item => {
      if (!item.hit) item.y += item.speed;
      else item.alpha -= 0.08;
      if (!item.hit && item.y > canvas.height + item.size) {
        this.streak = 0;
        this._updateHUD();
        return false;
      }
      if (item.hit && item.alpha <= 0) return false;

      ctx.globalAlpha = item.alpha;
      ctx.font = `${item.size * 1.4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.raceData.food.emoji, item.x, item.y);
      ctx.globalAlpha = 1;
      return true;
    });

    // Draw hit FX
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
    clearInterval(this._spawnInterval);
    clearInterval(this._countdownInterval);
    cancelAnimationFrame(this._frame);
    this.onFinish?.(this.score);
  }

  _updateHUD() {
    this.scoreEl.textContent  = this.score;
    this.timerEl.textContent  = this.timeLeft;
    this.streakEl.textContent = this.streak;
  }

  destroy() { this._end(); }
}
