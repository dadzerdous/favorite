// ─── DRAW.JS ──────────────────────────────────────────────────────────────────
// All canvas rendering. Reads state, draws, never mutates.

import { TYPES, SLOT_W, SLOT_GAP, RAIL_W, RAIL_GAP, BTN_ZONE, HNG_ZONE, RAIL_ZONE, PANEL_H, VISIBLE_HANGAR } from './constants.js';
import { run, combat, board, input, screen, TURRET_MAX_HP } from './state.js';
import { getRailPos, getSlotPos, getTurretRange, getPlasmaAoeRadius, getPanelTop } from './turrets.js';

let ctx;
let stars = [];

export function initDraw(canvas) {
  ctx = canvas.getContext('2d');
  initStars();
}

function initStars() {
  stars = [];
  const count = 180;
  for (let i = 0; i < count; i++) {
    stars.push({
      x:       Math.random(),   // 0-1 normalized, scaled by screen.W
      y:       Math.random(),   // 0-1 normalized, scaled by screen.H
      r:       Math.random() * 1.4 + 0.3,
      speed:   Math.random() * 0.00008 + 0.00002,
      opacity: Math.random() * 0.6 + 0.15,
      twinkle: Math.random() * Math.PI * 2,  // phase offset
      twinkleSpeed: Math.random() * 0.04 + 0.01,
      color:   Math.random() < 0.12 ? '#a0c8ff'  // occasional blue-white
             : Math.random() < 0.08 ? '#ffd0a0'  // occasional warm
             : '#ffffff',
    });
  }
}

export function reinitStars() { initStars(); }

// ── Viewport zoom ─────────────────────────────────────────────────────────────
let viewZoom = 1, viewOX = 0, viewOY = 0;
export function getViewTransform() { return { zoom: viewZoom, ox: viewOX, oy: viewOY }; }
export function screenToGame(sx, sy) {
  return { x: (sx - viewOX) / viewZoom, y: (sy - viewOY) / viewZoom };
}
function updateZoom(meta) {
  const panelTop = getPanelTop();
  let maxRange   = 220;
  board.rails.forEach(slot => { if (slot) { const r = getTurretRange(meta, slot); if (r > maxRange) maxRange = r; } });
  const targetZ = (panelTop * 0.88) / (maxRange * 1.2);
  viewZoom = viewZoom + (Math.min(Math.max(targetZ, 0.45), 2.2) - viewZoom) * 0.03;
  viewOX   = screen.W / 2 * (1 - viewZoom);
  viewOY   = panelTop / 2 * (1 - viewZoom);
}

export function draw(meta) {
  ctx.fillStyle = '#020816';
  ctx.fillRect(0, 0, screen.W, screen.H);

  updateZoom(meta);
  drawStars();

  // Apply zoom transform to play area only
  ctx.save();
  ctx.translate(viewOX, viewOY);
  ctx.scale(viewZoom, viewZoom);

  drawGrid();
  drawRangeOverlays(meta);
  drawEnemies();
  if (combat.boss) drawBoss();
  drawPlayerBullets();
  drawEnemyBullets();
  drawBeam(meta);

  ctx.restore(); // end zoom

  drawPanelBackground();
  drawRails(meta);
  drawHangar(meta);
  drawParticles();
  drawFloaters();
  if (input.dragging) drawTurret(input.mouseX, input.mouseY, input.dragging, false);
  drawHoverTooltip();
  drawChainTimer();
  drawTutorialHints(meta);
}

// ── Starfield ─────────────────────────────────────────────────────────────────
function drawStars() {
  const panelTop = getPanelTop();
  const t = combat.frameCount || 0;

  stars.forEach(s => {
    // Slow drift downward, wrap
    s.y += s.speed;
    if (s.y > 1) s.y = 0;

    const px = s.x * screen.W;
    const py = s.y * screen.H;
    if (py > panelTop) return; // don't draw in panel area

    // Twinkle: opacity pulses
    const twinkle = Math.sin(t * s.twinkleSpeed + s.twinkle);
    const alpha   = Math.max(0.05, s.opacity + twinkle * 0.25);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = s.color;
    ctx.beginPath();
    ctx.arc(px, py, s.r, 0, Math.PI * 2);
    ctx.fill();

    // Occasional cross-sparkle on brighter stars
    if (s.r > 1.4 && alpha > 0.6) {
      ctx.globalAlpha = alpha * 0.4;
      ctx.strokeStyle = s.color;
      ctx.lineWidth   = 0.5;
      ctx.beginPath();
      ctx.moveTo(px - s.r * 3, py); ctx.lineTo(px + s.r * 3, py);
      ctx.moveTo(px, py - s.r * 3); ctx.lineTo(px, py + s.r * 3);
      ctx.stroke();
    }
    ctx.restore();
  });
}

// ── Grid ──────────────────────────────────────────────────────────────────────
function drawGrid() {
  const panelTop = getPanelTop();
  ctx.strokeStyle = 'rgba(0,20,60,0.6)';
  ctx.lineWidth = 1;
  for (let x = 0; x < screen.W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, panelTop); ctx.stroke();
  }
  for (let y = 0; y < panelTop; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(screen.W, y); ctx.stroke();
  }
  // Base line
  ctx.strokeStyle = 'rgba(0,245,255,0.2)';
  ctx.setLineDash([8, 8]);
  ctx.beginPath(); ctx.moveTo(0, panelTop); ctx.lineTo(screen.W, panelTop); ctx.stroke();
  ctx.setLineDash([]);
}

// ── Range overlays ────────────────────────────────────────────────────────────
function drawRangeOverlays(meta) {
  const railCount = board.rails.length;
  board.rails.forEach((slot, i) => {
    if (!slot) return;
    const isHovered  = input.hoveredSlot?.slot === slot;
    const isSelected = input.selectedSlot?.slot === slot;
    if (!isHovered && !isSelected) return;

    const p     = getRailPos(i, railCount);
    const cx    = p.x + RAIL_W / 2;
    const cy    = p.y + RAIL_W / 2;
    const range = getTurretRange(meta, slot);
    const col   = TYPES[slot.type].color;

    ctx.save();

    // Range ring
    ctx.beginPath();
    ctx.arc(cx, cy, range, 0, Math.PI * 2);
    ctx.strokeStyle = col;
    ctx.lineWidth   = 1;
    ctx.globalAlpha = 0.25;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Fire cone
    ctx.globalAlpha = 0.12;
    ctx.fillStyle   = col;
    if (slot.type === 'kinetic') {
      const ha = Math.PI / 10;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, range, -Math.PI/2 - ha, -Math.PI/2 + ha);
      ctx.closePath(); ctx.fill();
    } else if (slot.type === 'energy') {
      const ha = Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, range, -Math.PI/2 - ha, -Math.PI/2 + ha);
      ctx.closePath(); ctx.fill();
    } else {
      // Plasma: show actual AOE radius + outer range
      const aoeR = getPlasmaAoeRadius(meta);
      if (aoeR > 0) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle   = '#ff6600';
        ctx.beginPath(); ctx.arc(cx, cy, aoeR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, aoeR, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 0.06;
      ctx.fillStyle   = col;
      ctx.beginPath(); ctx.arc(cx, cy, range, 0, Math.PI * 2); ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  });
}

// ── Enemies ───────────────────────────────────────────────────────────────────
function drawEnemies() {
  combat.enemies.forEach(en => {
    const flash = en.burnTimer > 0 && combat.frameCount % 6 < 3;
    const col   = flash ? '#ff8800' : en.color;
    const x = en.x, y = en.y;
    const scale = en.pulses ? (1 + 0.22 * Math.sin(combat.frameCount * 0.12 + en.phase)) : 1;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(en.angle || 0);
    ctx.scale(scale, scale);
    ctx.shadowBlur = 8; ctx.shadowColor = col;
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath();

    switch (en.shape) {
      case 'rect':    ctx.strokeRect(-10, -10, 20, 20); break;
      case 'diamond':
        ctx.moveTo(0,-14); ctx.lineTo(14,0); ctx.lineTo(0,14); ctx.lineTo(-14,0);
        ctx.closePath(); ctx.stroke(); break;
      case 'triangle':
        ctx.moveTo(0,-14); ctx.lineTo(14,10); ctx.lineTo(-14,10);
        ctx.closePath(); ctx.stroke(); break;
      case 'circle':
        ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(10,0); ctx.stroke(); break;
      case 'star':
        for (let s = 0; s < 5; s++) {
          const a  = (s/5)*Math.PI*2 - Math.PI/2;
          const a2 = a + Math.PI/5;
          ctx.moveTo(Math.cos(a)*14, Math.sin(a)*14);
          ctx.lineTo(Math.cos(a2)*6, Math.sin(a2)*6);
        }
        ctx.stroke(); break;
    }

    ctx.restore();
    ctx.shadowBlur = 0;

    // HP bar (unrotated)
    const pct = Math.max(0, en.hp / en.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x-12, y-22, 24, 4);
    ctx.fillStyle = pct > 0.5 ? '#00ff88' : pct > 0.25 ? '#ffe600' : '#ff2244';
    ctx.fillRect(x-12, y-22, 24*pct, 4);

    if (en.slowTimer > 0) {
      ctx.strokeStyle = 'rgba(0,245,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI*2); ctx.stroke();
    }
  });
}

// ── Boss ──────────────────────────────────────────────────────────────────────
function drawBoss() {
  const b     = combat.boss;
  const pulse = Math.sin(combat.frameCount * 0.1) * 3;
  const col   = b.phase2 ? '#ff6600' : '#ff2244';

  ctx.shadowBlur = 20; ctx.shadowColor = col;
  ctx.strokeStyle = col; ctx.lineWidth = 3;

  ctx.beginPath();
  for (let s = 0; s < 6; s++) {
    const a = (s/6)*Math.PI*2;
    const r = b.size + pulse;
    if (s === 0) ctx.moveTo(b.x + Math.cos(a)*r, b.y + Math.sin(a)*r);
    else         ctx.lineTo(b.x + Math.cos(a)*r, b.y + Math.sin(a)*r);
  }
  ctx.closePath(); ctx.stroke();

  ctx.beginPath();
  ctx.arc(b.x, b.y, 20 + pulse*0.5, 0, Math.PI*2);
  ctx.stroke();

  ctx.fillStyle = col;
  ctx.font = 'bold 10px "Share Tech Mono"';
  ctx.textAlign = 'center';
  ctx.fillText('BOSS', b.x, b.y + 4);
  ctx.textAlign = 'left';
  ctx.shadowBlur = 0;
}

// ── Bullets ───────────────────────────────────────────────────────────────────
function drawPlayerBullets() {
  combat.bullets.forEach(b => {
    if (b.isOrb) {
      // Plasma orb -- glowing ball
      const pulse = Math.sin(combat.frameCount * 0.3) * 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.orbR + pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,102,0,0.25)';
      ctx.shadowBlur = 20; ctx.shadowColor = '#ff6600';
      ctx.fill();
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Inner core
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.orbR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = b.crit ? '#ffffff' : '#ffaa44';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      return;
    }
    // Kinetic bullet -- slim rectangle
    const col = TYPES[b.type]?.color || '#fff';
    ctx.shadowBlur = 8; ctx.shadowColor = col;
    ctx.fillStyle  = col;
    ctx.fillRect(b.x - 2, b.y - 5, 4, 10);
    ctx.shadowBlur = 0;
  });

  // Energy arcs
  if (combat.arcTargets?.length) {
    combat.arcTargets.forEach(arc => {
      if (arc.life <= 0) return;
      const alpha = arc.life / 8;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#cc00ff';
      ctx.lineWidth   = 1.5;
      ctx.shadowBlur  = 12;
      ctx.shadowColor = '#cc00ff';

      // Jagged lightning path
      ctx.beginPath();
      ctx.moveTo(arc.fromX, arc.fromY);
      const dx = arc.toX - arc.fromX;
      const dy = arc.toY - arc.fromY;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(3, Math.floor(dist / 30));
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const jitter = (Math.random() - 0.5) * 18;
        const nx = arc.fromX + dx * t + (-dy/dist) * jitter;
        const ny = arc.fromY + dy * t + (dx/dist)  * jitter;
        ctx.lineTo(nx, ny);
      }
      ctx.lineTo(arc.toX, arc.toY);
      ctx.stroke();
      ctx.restore();
    });
  }
}

function drawEnemyBullets() {
  combat.enemyBullets.forEach(b => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r || 3, 0, Math.PI*2);
    ctx.fillStyle  = b.color || '#ff2244';
    ctx.shadowBlur = 6; ctx.shadowColor = b.color || '#ff2244';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  });
}

// ── Beam ──────────────────────────────────────────────────────────────────────
function drawBeam(meta) {
  if (!input.beamActive || run.overheated || input.dragging) return;
  const col  = '#ff00cc';
  const panelTop = getPanelTop();
  ctx.shadowBlur = 20; ctx.shadowColor = col;
  ctx.strokeStyle = col; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(screen.W/2, panelTop);
  ctx.lineTo(input.beamX, input.beamY);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(screen.W/2, panelTop);
  ctx.lineTo(input.beamX, input.beamY);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ── Panel background ──────────────────────────────────────────────────────────
function drawPanelBackground() {
  const panelTop = getPanelTop();
  const grad = ctx.createLinearGradient(0, panelTop, 0, screen.H);
  grad.addColorStop(0, 'rgba(0,5,15,0)');
  grad.addColorStop(0.2, 'rgba(0,5,15,0.92)');
  grad.addColorStop(1,   'rgba(0,2,8,0.98)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, panelTop, screen.W, screen.H - panelTop);

  // Defense line -- dashed with text inline
  const lineY = panelTop;
  const label = ' DEFENSE LINE ';
  ctx.save();
  ctx.font = '8px "Orbitron"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelW = ctx.measureText(label).width + 12;
  const cx = screen.W / 2;

  // Left dash segment
  ctx.strokeStyle = 'rgba(0,245,255,0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(cx - labelW/2, lineY); ctx.stroke();
  // Right dash segment
  ctx.beginPath(); ctx.moveTo(cx + labelW/2, lineY); ctx.lineTo(screen.W, lineY); ctx.stroke();
  ctx.setLineDash([]);

  // Label
  ctx.fillStyle = 'rgba(0,245,255,0.45)';
  ctx.fillText(label, cx, lineY);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();

  // Heat bar -- sits just below the defense line, in the panel
  const heatBarY = panelTop + 18;
  drawHeatBar(heatBarY);
}

function drawHeatBar(centerY) {
  const barW = 180;
  const barH = 4;
  const cx   = screen.W / 2;
  const x    = cx - barW / 2;
  const y    = centerY - barH / 2;
  const pct  = run.heat / 100;

  ctx.save();

  // Label
  ctx.font = '7px "Orbitron"';
  ctx.textAlign = 'center';
  ctx.fillStyle = run.overheated ? '#ff2244' : 'rgba(255,0,204,0.5)';
  ctx.fillText(run.overheated ? 'OVERHEATED' : 'BEAM HEAT', cx, y - 5);

  // Track
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.roundRect(x, y, barW, barH, 2);
  ctx.fill();

  // Fill
  if (pct > 0) {
    const fillColor = run.overheated
      ? '#ff2244'
      : `hsl(${180 - pct * 180}, 100%, 60%)`;
    ctx.fillStyle = fillColor;
    ctx.shadowBlur = 6; ctx.shadowColor = fillColor;
    ctx.beginPath();
    ctx.roundRect(x, y, barW * pct, barH, 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

// ── Rails ─────────────────────────────────────────────────────────────────────
function drawRails(meta) {
  const railCount = board.rails.length;
  for (let i = 0; i < railCount; i++) {
    const p    = getRailPos(i, railCount);
    const slot = board.rails[i];
    const hp   = board.railHp[i];
    const col  = slot ? TYPES[slot.type].color : 'rgba(0,245,255,0.6)';

    drawSlotBox(p.x, p.y, RAIL_W, RAIL_W, col, input.sellMode && slot);

    if (slot) {
      drawTurret(p.x + RAIL_W/2, p.y + RAIL_W/2, slot, true);
      drawTypeLabel(p.x + RAIL_W/2, p.y + RAIL_W - 3, slot.type);

      // HP bar above the turret slot
      const maxHp = TURRET_MAX_HP[slot.level] || 30;
      const pct   = Math.max(0, hp / maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(p.x, p.y - 6, RAIL_W, 4);
      ctx.fillStyle = pct > 0.5 ? '#00ff88' : pct > 0.25 ? '#ffe600' : '#ff2244';
      ctx.fillRect(p.x, p.y - 6, RAIL_W * pct, 4);

      // Low HP glow warning
      if (pct < 0.25) {
        ctx.shadowBlur = 8; ctx.shadowColor = '#ff2244';
        ctx.strokeStyle = '#ff2244'; ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, p.y, RAIL_W, RAIL_W);
        ctx.shadowBlur = 0; ctx.lineWidth = 1;
      }
    }
  }
}

// ── Hangar ────────────────────────────────────────────────────────────────────
function drawHangar(meta) {
  const totalHangar = board.hangar.length;
  const arrowY      = screen.H - BTN_ZONE - HNG_ZONE + 10 + SLOT_W/2;
  const rowLeft     = getSlotPos(0).x;
  const rowRight    = getSlotPos(VISIBLE_HANGAR-1).x + SLOT_W;

  // Arrows
  const showLeft  = board.hangarPage > 0;
  const showRight = board.hangarPage + VISIBLE_HANGAR < totalHangar;
  ctx.save();
  ctx.font = 'bold 18px "Share Tech Mono"';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = showLeft ? 'rgba(0,245,255,0.7)' : 'rgba(255,255,255,0.1)';
  ctx.fillText('<', rowLeft - 18, arrowY);
  ctx.fillStyle = showRight ? 'rgba(0,245,255,0.7)' : 'rgba(255,255,255,0.1)';
  ctx.fillText('>', rowRight + 18, arrowY);

  // Page dots
  if (totalHangar > VISIBLE_HANGAR) {
    const pages   = Math.ceil(totalHangar / VISIBLE_HANGAR);
    const curPage = Math.floor(board.hangarPage / VISIBLE_HANGAR);
    for (let d = 0; d < pages; d++) {
      ctx.beginPath();
      ctx.arc(rowLeft + (rowRight-rowLeft)/2 + (d-(pages-1)/2)*10, arrowY + SLOT_W/2 + 6, 2, 0, Math.PI*2);
      ctx.fillStyle = d === curPage ? 'rgba(0,245,255,0.7)' : 'rgba(255,255,255,0.15)';
      ctx.fill();
    }
  }
  ctx.textBaseline = 'alphabetic';
  ctx.restore();

  // Slots
  for (let vi = 0; vi < VISIBLE_HANGAR; vi++) {
    const ai   = board.hangarPage + vi;
    if (ai >= totalHangar) continue;
    const p    = getSlotPos(vi);
    const slot = board.hangar[ai];
    const col  = slot ? TYPES[slot.type].color : 'rgba(0,245,255,0.35)';
    drawSlotBox(p.x, p.y, SLOT_W, SLOT_W, col, input.sellMode && slot);
    if (slot) {
      drawTurret(p.x + SLOT_W/2, p.y + SLOT_W/2, slot, false);
      drawTypeLabel(p.x + SLOT_W/2, p.y + SLOT_W - 3, slot.type);
    }
  }
}

// ── Slot box ──────────────────────────────────────────────────────────────────
function drawSlotBox(x, y, w, h, color, highlight) {
  ctx.fillStyle = 'rgba(0,20,40,0.6)';
  ctx.fillRect(x, y, w, h);
  if (highlight) {
    ctx.shadowBlur = 12; ctx.shadowColor = '#ff2244';
    ctx.strokeStyle = '#ff2244'; ctx.lineWidth = 2;
  } else {
    ctx.shadowBlur = 6; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  }
  ctx.strokeRect(x, y, w, h);
  ctx.shadowBlur = 0; ctx.lineWidth = 1;
}

// ── Turret shape ──────────────────────────────────────────────────────────────
export function drawTurret(x, y, slot, large) {
  const size = large ? 18 : 13;
  const col  = TYPES[slot.type]?.color || '#fff';
  ctx.shadowBlur = 10; ctx.shadowColor = col;
  ctx.strokeStyle = col; ctx.lineWidth = 2;
  ctx.beginPath();
  if (slot.level === 1) {
    ctx.arc(x, y, size, 0, Math.PI*2);
  } else if (slot.level === 2) {
    ctx.strokeRect(x-size, y-size, size*2, size*2);
  } else if (slot.level === 3) {
    ctx.moveTo(x, y-size); ctx.lineTo(x+size, y+size*0.7); ctx.lineTo(x-size, y+size*0.7);
    ctx.closePath();
  } else {
    // Level 4 — hexagon
    for (let s = 0; s < 6; s++) {
      const a = (s/6)*Math.PI*2 - Math.PI/2;
      if (s===0) ctx.moveTo(x+Math.cos(a)*size, y+Math.sin(a)*size);
      else       ctx.lineTo(x+Math.cos(a)*size, y+Math.sin(a)*size);
    }
    ctx.closePath();
    ctx.shadowBlur = 20 + Math.sin(combat.frameCount*0.2)*5;
  }
  ctx.stroke();

  // Level number
  ctx.fillStyle = col;
  ctx.font = `bold ${large ? 11 : 9}px "Orbitron"`;
  ctx.textAlign = 'center';
  ctx.fillText(slot.level, x, y + 4);
  ctx.textAlign = 'left';
  ctx.shadowBlur = 0;
}

function drawTypeLabel(cx, y, type) {
  ctx.save();
  ctx.font = '7px "Orbitron"';
  ctx.textAlign = 'center';
  ctx.fillStyle = TYPES[type].color;
  ctx.globalAlpha = 0.85;
  ctx.fillText(type.slice(0,3).toUpperCase(), cx, y);
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Particles & floaters ──────────────────────────────────────────────────────
function drawParticles() {
  combat.particles.forEach(p => {
    ctx.fillStyle  = p.color;
    ctx.globalAlpha = p.life;
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}

function drawFloaters() {
  ctx.textAlign = 'center';
  combat.floaters.forEach(f => {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle   = f.color;
    ctx.font = 'bold 13px "Share Tech Mono"';
    ctx.fillText(f.text, f.x, f.y);
  });
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// ── Tutorial flash hints ──────────────────────────────────────────────────────
export function drawTutorialHints(meta) {
  // Flash stops as soon as credits drop below starting amount (first purchase)
  const startCredits = 50;
  const hasEverBought = run.credits < startCredits || board.hangar.some(s => s) || board.rails.some(s => s);
  const hasEverPlaced  = combat.frameCount > 0 && (board.rails.some(s=>s) || hasEverBought);
  const t              = combat.frameCount;

  if (!hasEverBought) {
    const pulse  = (Math.sin(t * 0.1) + 1) / 2;
    const buyBtn = document.getElementById('buyBtn');
    if (buyBtn) {
      buyBtn.style.boxShadow   = `0 0 ${8 + pulse*14}px rgba(0,245,255,${0.5+pulse*0.5})`;
      buyBtn.style.borderColor = `rgba(0,245,255,${0.7+pulse*0.3})`;
    }
  } else {
    const buyBtn = document.getElementById('buyBtn');
    if (buyBtn) { buyBtn.style.boxShadow = ''; buyBtn.style.borderColor = ''; }
  }

  // Flash empty hangar slots and show DRAG hint until first turret placed
  if (hasEverBought && !board.rails.some(s => s) && board.hangar.some(s => s)) {
    const pulse = (Math.sin(t * 0.12) + 1) / 2;
    ctx.save();
    ctx.globalAlpha = 0.3 + pulse * 0.4;
    ctx.font = 'bold 11px "Orbitron"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f5ff';
    ctx.shadowBlur = 10; ctx.shadowColor = '#00f5ff';
    // Arrow pointing from hangar up to rails
    const hangarMid = getSlotPos(0).x + (SLOT_W * VISIBLE_HANGAR + SLOT_GAP * (VISIBLE_HANGAR-1)) / 2;
    const railMid   = getRailPos(0, board.rails.length).y + RAIL_W / 2;
    const hangarTop = getSlotPos(0).y;
    ctx.fillText('DRAG TO RAILS', screen.W/2, hangarTop - 16);
    ctx.restore();

    // Flash empty rail slots
    board.rails.forEach((slot, i) => {
      if (slot) return;
      const p = getRailPos(i, board.rails.length);
      ctx.save();
      ctx.globalAlpha = 0.15 + pulse * 0.25;
      ctx.fillStyle = '#00f5ff';
      ctx.fillRect(p.x, p.y, RAIL_W, RAIL_W);
      ctx.restore();
    });
  }
}
// Drawn on canvas over the HUD chain block.
// Position is read from the DOM element once and cached.
let chainBlockPos = null;
export function resetChainTimerCache() { chainBlockPos = null; }

function drawChainTimer() {
  if (run.chainCount <= 1) { chainBlockPos = null; return; }

  // Cache position of chain HUD block
  if (!chainBlockPos) {
    const el = document.getElementById('chainVal');
    if (!el) return;
    const r = el.getBoundingClientRect();
    chainBlockPos = { x: r.left + r.width/2, y: r.top + r.height/2 + 8 };
  }

  const timeout = run.chainTimeout * 1; // main.js applies pr4 multiplier to decay
  const elapsed = Date.now() - run.lastKillTime;
  const frac    = Math.max(0, 1 - elapsed / timeout);
  if (frac <= 0) { chainBlockPos = null; return; }

  const { x, y } = chainBlockPos;
  const radius   = 18;
  const startAngle = -Math.PI / 2;
  const endAngle   = startAngle + Math.PI * 2 * frac;

  // Color shifts red as time runs out
  const r255 = Math.round(255 * (1 - frac));
  const g255 = Math.round(255 * frac * 0.8);
  const arcColor = `rgb(${r255},${g255},255)`;

  ctx.save();

  // Track bg
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth   = 3;
  ctx.stroke();

  // Timer arc
  ctx.beginPath();
  ctx.arc(x, y, radius, startAngle, endAngle);
  ctx.strokeStyle  = arcColor;
  ctx.lineWidth    = 3;
  ctx.lineCap      = 'round';
  ctx.shadowBlur   = 8;
  ctx.shadowColor  = arcColor;
  ctx.stroke();

  ctx.restore();
}
function drawHoverTooltip() {
  if (!input.hoveredSlot || input.dragging) return;
  const { slot, cx, cy } = input.hoveredSlot;
  const col = TYPES[slot.type].color;
  ctx.save();
  ctx.font = 'bold 10px "Orbitron"';
  ctx.textAlign = 'center';
  ctx.shadowBlur = 8; ctx.shadowColor = col;
  ctx.fillStyle  = col;
  ctx.fillText(slot.type.toUpperCase() + ' LV' + slot.level, cx, cy - SLOT_W/2 - 6);
  ctx.restore();
}
