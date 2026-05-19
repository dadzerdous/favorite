// ─── INPUT.JS ─────────────────────────────────────────────────────────────────
// Pointer/touch events.
//
// TOUCH BEHAVIOUR:
//   Hangar slots  — tap or drag immediately picks up the turret
//   Rail slots    — TAP = show range ring only
//                   LONG PRESS (>280ms) or DRAG = pick up the turret
//                   Dragging below the defense line while holding = unequip to hangar
//   Play field    — tap/drag activates beam

import { SLOT_W, SLOT_GAP, RAIL_W, VISIBLE_HANGAR, TYPES } from './constants.js';
import { run, board, input, screen, TURRET_MAX_HP } from './state.js';
import { getRailPos, getSlotPos, getPanelTop, getMaxLevel, getTurretBuyCost, condenseRails, condenseHangar, returnToHangar } from './turrets.js';
import { spawnMergeEffect } from './effects.js';
import { gainTurretXP, saveMeta, trackPrestigeBuild } from './meta.js';
import { screenToGame } from './draw.js';

// ── Long-press state ──────────────────────────────────────────────────────────
let longPressTimer   = null;
let longPressSlotIdx = -1;      // which rail slot is pending
let downX = 0, downY = 0;      // pointer position at pointerdown
let didLongPress     = false;   // did the long-press fire this touch?
const LONG_PRESS_MS  = 280;
const DRAG_THRESHOLD = 8;       // px movement to cancel long-press and begin drag

export function initInput(canvas, meta) {
  canvas.addEventListener('pointerdown', e => onDown(e, meta));
  canvas.addEventListener('pointermove', e => onMove(e, meta));
  canvas.addEventListener('pointerup',   e => onUp(e, meta));
  canvas.addEventListener('pointercancel', () => cancelLongPress());
}

// ── Pointer down ──────────────────────────────────────────────────────────────
function onDown(e, meta) {
  const x = e.clientX, y = e.clientY;
  const panelTop = getPanelTop();
  downX = x; downY = y;
  didLongPress = false;

  // Scroll arrows
  const arrowY   = screen.H - 50 - 70 + 10 + SLOT_W/2;
  const rowLeft  = getSlotPos(0).x;
  const rowRight = getSlotPos(VISIBLE_HANGAR-1).x + SLOT_W;
  if (Math.abs(y - arrowY) < 24) {
    if (Math.abs(x - (rowLeft - 12)) < 20)  { scrollHangar(-1); return; }
    if (Math.abs(x - (rowRight + 18)) < 20) { scrollHangar(1);  return; }
  }

  // Sell mode
  if (input.sellMode) {
    handleSell(x, y, meta);
    return;
  }

  // Check if touching a rail slot first
  let touchedRailIdx = -1;
  board.rails.forEach((slot, i) => {
    if (!slot || touchedRailIdx !== -1) return;
    const p = getRailPos(i, board.rails.length);
    if (x > p.x && x < p.x+RAIL_W && y > p.y && y < p.y+RAIL_W) {
      touchedRailIdx = i;
    }
  });

  if (touchedRailIdx !== -1) {
    // Rail slot touched — start long-press timer
    longPressSlotIdx = touchedRailIdx;
    longPressTimer = setTimeout(() => {
      // Long press fired — pick up the turret
      didLongPress = true;
      const slot = board.rails[longPressSlotIdx];
      if (slot) {
        input.dragging       = slot;
        input.dragFromIdx    = longPressSlotIdx;
        input.dragFromHangar = false;
        board.rails[longPressSlotIdx] = null;
        condenseRails();
        input.selectedSlot = null;
      }
      longPressSlotIdx = -1;
      longPressTimer   = null;
    }, LONG_PRESS_MS);
    updateMouse(e);
    return; // wait for long-press or tap
  }

  // Hangar slot — immediate pickup (no long-press needed)
  let picked = false;
  for (let vi = 0; vi < VISIBLE_HANGAR; vi++) {
    if (picked) break;
    const ai = board.hangarPage + vi;
    if (!board.hangar[ai]) continue;
    const p = getSlotPos(vi);
    if (x > p.x && x < p.x+SLOT_W && y > p.y && y < p.y+SLOT_W) {
      input.dragging      = board.hangar[ai];
      input.dragFromIdx   = ai;
      input.dragFromHangar= true;
      board.hangar[ai]    = null;
      condenseHangar();
      picked = true;
    }
  }

  // Beam (play field, nothing picked)
  if (!picked && y < panelTop) {
    input.beamActive = true;
    const g = screenToGame(x, Math.min(y, panelTop - 2));
    input.beamX = g.x;
    input.beamY = g.y;
  }

  updateMouse(e);
}

// ── Pointer move ──────────────────────────────────────────────────────────────
function onMove(e, meta) {
  updateMouse(e);
  const panelTop = getPanelTop();

  // If long-press is pending and we've moved too much, cancel it and start drag
  if (longPressTimer !== null && longPressSlotIdx !== -1) {
    const dx = Math.abs(e.clientX - downX);
    const dy = Math.abs(e.clientY - downY);
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      // Moved enough — cancel timer, immediately pick up turret
      cancelLongPress();
      const slot = board.rails[longPressSlotIdx];
      if (slot) {
        didLongPress = true;
        input.dragging       = slot;
        input.dragFromIdx    = longPressSlotIdx;
        input.dragFromHangar = false;
        board.rails[longPressSlotIdx] = null;
        condenseRails();
        input.selectedSlot = null;
      }
      longPressSlotIdx = -1;
    }
    return;
  }

  // Beam tracking
  if (input.beamActive) {
    const raw = screenToGame(e.clientX, Math.min(e.clientY, panelTop - 2));
    input.beamX = raw.x;
    input.beamY = Math.min(raw.y, panelTop - 2);
  }

  // While dragging a rail turret — if dragged below defense line, auto-unequip
  if (input.dragging && !input.dragFromHangar) {
    if (e.clientY > panelTop + 20) {
      // Return to hangar and cancel drag
      returnToHangar(input.dragging);
      input.dragging     = null;
      input.selectedSlot = null;
      input.beamActive   = false;
      return;
    }
  }

  // Hover for range ring (desktop mouse)
  input.hoveredSlot = null;
  if (!input.dragging) {
    for (let vi = 0; vi < VISIBLE_HANGAR; vi++) {
      const ai = board.hangarPage + vi;
      if (!board.hangar[ai]) continue;
      const p = getSlotPos(vi);
      if (e.clientX > p.x && e.clientX < p.x+SLOT_W && e.clientY > p.y && e.clientY < p.y+SLOT_W) {
        input.hoveredSlot = { slot: board.hangar[ai], cx: p.x+SLOT_W/2, cy: p.y+SLOT_W/2 };
      }
    }
    board.rails.forEach((slot, i) => {
      if (!slot) return;
      const p = getRailPos(i, board.rails.length);
      if (e.clientX > p.x && e.clientX < p.x+RAIL_W && e.clientY > p.y && e.clientY < p.y+RAIL_W) {
        input.hoveredSlot = { slot, cx: p.x+RAIL_W/2, cy: p.y+RAIL_W/2 };
      }
    });
  }
}

// ── Pointer up ────────────────────────────────────────────────────────────────
function onUp(e, meta) {
  updateMouse(e);
  const panelTop = getPanelTop();

  // If long-press timer is still pending — this was a SHORT TAP on a rail slot
  if (longPressTimer !== null) {
    cancelLongPress();
    // Tap = toggle selected slot for range display
    const i = longPressSlotIdx === -1
      ? findRailSlotAt(e.clientX, e.clientY)
      : longPressSlotIdx;
    longPressSlotIdx = -1;

    if (i !== -1 && board.rails[i]) {
      const slot = board.rails[i];
      input.selectedSlot = (input.selectedSlot?.slot === slot) ? null : {
        slot,
        cx: getRailPos(i, board.rails.length).x + RAIL_W/2,
        cy: getRailPos(i, board.rails.length).y + RAIL_W/2,
      };
    } else {
      input.selectedSlot = null;
    }
    input.beamActive = false;
    return;
  }

  if (input.dragging) {
    let dropped = false;

    // Try drop on hangar
    for (let vi = 0; vi < VISIBLE_HANGAR; vi++) {
      if (dropped) break;
      const ai  = board.hangarPage + vi;
      const p   = getSlotPos(vi);
      if (input.mouseX > p.x && input.mouseX < p.x+SLOT_W && input.mouseY > p.y && input.mouseY < p.y+SLOT_W) {
        if (!board.hangar[ai]) {
          board.hangar[ai] = input.dragging; dropped = true;
        } else if (canMerge(meta, board.hangar[ai], input.dragging)) {
          board.hangar[ai].level++;
          gainTurretXP(meta, board.hangar[ai].type, 8);
          trackPrestigeBuild(meta, board.hangar[ai].type, board.hangar[ai].level);
          saveMeta(meta);
          dropped = true;
          spawnMergeEffect(p.x+SLOT_W/2, p.y+SLOT_W/2, TYPES[board.hangar[ai].type].color);
        }
      }
    }

    // Try drop on rail
    if (!dropped) {
      board.rails.forEach((slot, i) => {
        if (dropped) return;
        const p = getRailPos(i, board.rails.length);
        if (input.mouseX > p.x && input.mouseX < p.x+RAIL_W && input.mouseY > p.y && input.mouseY < p.y+RAIL_W) {
          if (!slot) {
            board.rails[i]  = input.dragging;
            board.railHp[i] = TURRET_MAX_HP[input.dragging.level] || 30;
            dropped = true;
          } else if (canMerge(meta, slot, input.dragging)) {
            slot.level++;
            board.railHp[i] = TURRET_MAX_HP[slot.level] || 30;
            gainTurretXP(meta, slot.type, 8);
            trackPrestigeBuild(meta, slot.type, slot.level);
            saveMeta(meta);
            board.rails[i] = slot; dropped = true;
            spawnMergeEffect(p.x+RAIL_W/2, p.y+RAIL_W/2, TYPES[slot.type].color);
          } else {
            // Swap
            const old = board.rails[i];
            board.rails[i]  = input.dragging;
            board.railHp[i] = board.railHp[i] || (TURRET_MAX_HP[input.dragging.level] || 30);
            returnToHangar(old);
            dropped = true;
            condenseRails();
          }
        }
      });
    }

    if (!dropped) returnToHangar(input.dragging);
    input.dragging     = null;
    input.selectedSlot = null;
  } else if (!didLongPress) {
    // Tap on non-rail areas
    let tapped = false;
    for (let vi = 0; vi < VISIBLE_HANGAR; vi++) {
      if (tapped) break;
      const ai = board.hangarPage + vi;
      if (!board.hangar[ai]) continue;
      const p = getSlotPos(vi);
      if (input.mouseX > p.x && input.mouseX < p.x+SLOT_W && input.mouseY > p.y && input.mouseY < p.y+SLOT_W) {
        input.selectedSlot = input.selectedSlot?.slot === board.hangar[ai] ? null : { slot: board.hangar[ai] };
        tapped = true;
      }
    }
    if (!tapped) input.selectedSlot = null;
  }

  didLongPress = false;
  input.beamActive = false;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function cancelLongPress() {
  if (longPressTimer !== null) { clearTimeout(longPressTimer); longPressTimer = null; }
}

function findRailSlotAt(x, y) {
  let found = -1;
  board.rails.forEach((slot, i) => {
    if (!slot || found !== -1) return;
    const p = getRailPos(i, board.rails.length);
    if (x > p.x && x < p.x+RAIL_W && y > p.y && y < p.y+RAIL_W) found = i;
  });
  return found;
}

function handleSell(x, y, meta) {
  for (let vi = 0; vi < VISIBLE_HANGAR; vi++) {
    const ai = board.hangarPage + vi;
    if (!board.hangar[ai]) continue;
    const p = getSlotPos(vi);
    if (x > p.x && x < p.x+SLOT_W && y > p.y && y < p.y+SLOT_W) {
      run.credits += Math.floor(getTurretBuyCost(meta, board.hangar[ai].type) * 0.4 * board.hangar[ai].level);
      board.hangar[ai] = null;
    }
  }
  condenseHangar();
  board.rails.forEach((slot, i) => {
    if (!slot) return;
    const p = getRailPos(i, board.rails.length);
    if (x > p.x && x < p.x+RAIL_W && y > p.y && y < p.y+RAIL_W) {
      run.credits += Math.floor(getTurretBuyCost(meta, slot.type) * 0.4 * slot.level);
      board.rails[i] = null;
    }
  });
  condenseRails();
}

function canMerge(meta, a, b) {
  return a.level === b.level && a.type === b.type && a.level < getMaxLevel(meta);
}

function scrollHangar(dir) {
  const max = board.hangar.length - VISIBLE_HANGAR;
  board.hangarPage = Math.max(0, Math.min(max, board.hangarPage + dir));
}

function updateMouse(e) {
  input.mouseX = e.clientX;
  input.mouseY = e.clientY;
}
