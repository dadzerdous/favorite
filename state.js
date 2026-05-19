// ─── STATE.JS ─────────────────────────────────────────────────────────────────
// Single source of truth for all mutable game state.
// Modules import this and mutate it directly — no hidden globals.

import { DEFAULT_RAILS, DEFAULT_HANGAR } from './constants.js';

// ── Session ───────────────────────────────────────────────────────────────────
export const session = {
  gameStarted: false,
  isGameOver:  false,
  skillPaused: false,
  phase: 'splash', // 'splash' | 'prep' | 'combat'
};

// ── Run state (resets each run) ───────────────────────────────────────────────
export const run = {
  wave:      1,
  credits:   50,
  shields:   100,
  heat:      0,
  overheated:false,
  chainCount:1,
  lastKillTime: 0,
  chainTimeout: 1800, // ms

  // Per-run quest tracking (resets each run)
  runQuests: {
    slowed:      0,
    overheats:   0,
    splashkills: 0,
    longshots:   0,
    chain5:      0,
    cleanwaves:  0, // waves completed at full shields
  },
};

// ── Hangar / rails ────────────────────────────────────────────────────────────
export const board = {
  hangar:      Array(DEFAULT_HANGAR).fill(null),
  rails:       Array(DEFAULT_RAILS).fill(null),
  hangarPage:  0,
  // Rail turret HP — index matches rails array
  railHp:      Array(DEFAULT_RAILS).fill(null),
};

// Max HP per turret level
export const TURRET_MAX_HP = { 1: 30, 2: 55, 3: 90, 4: 140 };

// ── Combat objects ────────────────────────────────────────────────────────────
export const combat = {
  enemies:      [],
  bullets:      [],
  enemyBullets: [],
  particles:    [],
  floaters:     [],
  boss:         null,
  bossMaxHp:    0,

  // Wave spawning
  waveEnemyDef:   [],
  enemiesThisWave: 0,
  enemiesSpawned:  0,
  enemiesKilled:   0,
  waveComplete:    false,

  // Timers
  frameCount:   0,
  combatFrame:  0,
  prepCountdown:8,
  prepTimer:    0,
  ionPulseTimer:0,
};

// ── Input / interaction ───────────────────────────────────────────────────────
export const input = {
  mouseX:       0,
  mouseY:       0,
  dragging:     null,
  dragFromIdx:  -1,
  dragFromHangar: true,
  beamActive:   false,
  beamX:        0,
  beamY:        0,
  hoveredSlot:  null,
  selectedSlot: null,
  sellMode:     false,
};

// ── Canvas dims (set properly in main.js on DOMContentLoaded) ────────────────
export const screen = {
  W: 0,
  H: 0,
};

// ── Reset helpers ─────────────────────────────────────────────────────────────
export function resetRun(meta, startCredits, startShields, railCount, hangarCount) {
  run.wave       = 1;
  run.credits    = startCredits;
  run.shields    = startShields;
  run.heat       = 0;
  run.overheated = false;
  run.chainCount = 1;
  run.lastKillTime = 0;
  Object.keys(run.runQuests).forEach(k => run.runQuests[k] = 0);

  board.hangar     = Array(hangarCount).fill(null);
  board.rails      = Array(railCount).fill(null);
  board.railHp     = Array(railCount).fill(null);
  board.hangarPage = 0;

  resetCombat();
}

export function resetCombat() {
  combat.enemies      = [];
  combat.bullets      = [];
  combat.enemyBullets = [];
  combat.particles    = [];
  combat.floaters     = [];
  combat.boss         = null;
  combat.bossMaxHp    = 0;
  combat.waveEnemyDef   = [];
  combat.enemiesThisWave = 0;
  combat.enemiesSpawned  = 0;
  combat.enemiesKilled   = 0;
  combat.waveComplete    = false;
  combat.frameCount      = 0;
  combat.combatFrame     = 0;
  combat.prepCountdown   = 8;
  combat.prepTimer       = 0;
  combat.ionPulseTimer   = 0;
}
