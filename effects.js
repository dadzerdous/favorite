// ─── EFFECTS.JS ───────────────────────────────────────────────────────────────
// Visual effects: particles, floaters, merge bursts.

import { combat } from './state.js';

export function spawnParticles(x, y, color, count, speed = 6) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const s = (Math.random() * 0.5 + 0.5) * speed;
    combat.particles.push({
      x, y,
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s,
      life: 1,
      color,
      size: Math.random() * 3 + 1,
    });
  }
}

export function spawnMergeEffect(x, y, color) {
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    combat.particles.push({
      x, y,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5,
      life: 1,
      color,
      size: 2,
    });
  }
}

export function spawnFloater(x, y, text, color) {
  combat.floaters.push({ x, y, text, color, life: 1, vy: -1.5 });
}

export function updateParticles() {
  for (let i = combat.particles.length - 1; i >= 0; i--) {
    const p = combat.particles[i];
    p.x  += p.vx;
    p.y  += p.vy;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.life -= 0.025;
    if (p.life <= 0) combat.particles.splice(i, 1);
  }
}

export function updateFloaters() {
  for (let i = combat.floaters.length - 1; i >= 0; i--) {
    const f = combat.floaters[i];
    f.y    += f.vy;
    f.life -= 0.018;
    if (f.life <= 0) combat.floaters.splice(i, 1);
  }
}
