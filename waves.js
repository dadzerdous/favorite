// ─── WAVES.JS ─────────────────────────────────────────────────────────────────
// Wave definitions, boss logic, prep/combat phase transitions.

import { ENEMY_TYPES } from './constants.js';
import { run, combat, board, screen } from './state.js';
import { spawnParticles, spawnFloater } from './effects.js';
import { spawnEnemy } from './enemies.js';
import { getPanelTop } from './turrets.js';
import { gainPilotXP, saveMeta, trackQuest } from './meta.js';

// ── Wave building ─────────────────────────────────────────────────────────────
export function buildWaveEnemyDef(wave) {
  const isBoss      = wave % 5 === 0;
  if (isBoss) return [];

  const cycle       = Math.floor((wave - 1) / 5);
  const waveInCycle = ((wave - 1) % 5) + 1;
  const hpScale     = Math.pow(2, cycle);
  const count       = Math.min(4 + (waveInCycle - 1) * 2, 14) + cycle * 2;

  const typePool = waveInCycle < 2 ? ['blue'] :
                   waveInCycle < 3 ? ['blue','purple'] :
                   waveInCycle < 4 ? ['blue','purple','yellow'] :
                                     ['blue','purple','yellow','red','orange'];

  const defs = [];
  for (let i = 0; i < count; i++) {
    const tId  = typePool[Math.floor(Math.random() * typePool.length)];
    const def  = ENEMY_TYPES.find(e => e.id === tId);
    const delay= 60 + i * Math.max(15, 80 - waveInCycle * 12);
    defs.push({ ...def, delay, spawned: false, hpScale });
  }
  return defs;
}

// ── Prep phase ────────────────────────────────────────────────────────────────
export function startPrepPhase(wave) {
  combat.waveEnemyDef    = [];
  combat.enemiesThisWave = 0;
  combat.enemiesSpawned  = 0;
  combat.enemiesKilled   = 0;
  combat.waveComplete    = false;
  combat.combatFrame     = 0;
  combat.prepTimer       = 0;
  combat.prepCountdown   = wave <= 1 ? 8 : 6;
  return 'prep';
}

export function tickPrep(wave) {
  const hasRailTurret = board.rails.some(s => s !== null);
  combat.prepTimer++;

  if (combat.prepTimer < 60) return null; // not a full second yet
  combat.prepTimer = 0;

  if (!hasRailTurret) {
    return { msg: 'PLACE A TURRET IN THE RAILS TO DEPLOY', warning: true };
  }

  combat.prepCountdown--;
  if (combat.prepCountdown <= 0) return { startCombat: true };
  return { msg: 'DEPLOYING IN ' + combat.prepCountdown + 's', warning: false };
}

// ── Combat phase start ────────────────────────────────────────────────────────
export function startCombatPhase(wave) {
  const isBoss = wave % 5 === 0;
  combat.combatFrame = 0;

  if (isBoss) {
    spawnBoss(wave);
    combat.enemiesThisWave = 0; // boss handles its own completion
  } else {
    combat.waveEnemyDef    = buildWaveEnemyDef(wave);
    combat.enemiesThisWave = combat.waveEnemyDef.length;
  }
  combat.enemiesSpawned = 0;
  combat.waveComplete   = false;
  return 'combat';
}

// ── Spawn enemies for this frame ──────────────────────────────────────────────
export function tickEnemySpawns(wave) {
  combat.waveEnemyDef.forEach(def => {
    if (def.spawned) return;
    if (combat.combatFrame < def.delay) return;
    spawnEnemy(def, wave);
    def.spawned = true;
    combat.enemiesSpawned++;
  });
}

// ── Wave complete check ───────────────────────────────────────────────────────
export function checkWaveComplete(meta, wave, onComplete) {
  if (combat.waveComplete) return false;
  if (combat.boss) return false;
  if (combat.enemiesSpawned < combat.enemiesThisWave) return false;
  if (combat.enemies.length > 0) return false;

  combat.waveComplete    = true;
  combat.bullets         = [];
  combat.enemyBullets    = [];
  if (combat.arcTargets) combat.arcTargets = [];

  // Clean wave bonus (full shields)
  if (run.shields >= 100) {
    run.runQuests.cleanwaves = (run.runQuests.cleanwaves || 0) + 1;
    trackQuest(meta, 'pilot', 'cleanwaves', 1);
  }

  const bonus = 10 + wave * 5;
  run.credits += bonus;
  spawnFloater(screen.W / 2, screen.H / 2, 'WAVE CLEAR +$' + bonus, '#ffe600');
  gainPilotXP(meta, 5 + wave);
  saveMeta(meta);

  if (onComplete) onComplete(bonus);
  return true;
}

// ── Boss ──────────────────────────────────────────────────────────────────────
export function spawnBoss(wave) {
  const hp = 80 + wave * 30;
  combat.bossMaxHp = hp;
  combat.boss = {
    x: screen.W / 2, y: -40,
    hp, maxHp: hp,
    speed:        0.8 + wave * 0.05,
    dir:          1,
    lateralSpeed: 1.5 + wave * 0.1,
    size:         40,
    reward:       50 + wave * 10,
    phase2:       false,
    shootTimer:   0,
    shootInterval:80,
    burnTimer: 0, burnDmg: 0,
    slowTimer: 0,
    weakTo: 'plasma', armor: 'kinetic', // boss has type for damage calc
    lastHitType: 'kinetic',
  };
}

export function updateBoss(meta, onWallHit, onBaseHit, onKill) {
  const b = combat.boss;
  if (!b) return;

  b.y += b.speed;
  b.x += b.lateralSpeed * b.dir;

  // Wall bounce — deals damage
  const margin = b.size;
  if (b.x < margin) {
    b.x = margin; b.dir = 1;
    spawnParticles(b.x, b.y, '#ff2244', 12, 5);
    spawnFloater(b.x + 30, b.y, '-5', '#ff2244');
    onWallHit(5);
  }
  if (b.x > screen.W - margin) {
    b.x = screen.W - margin; b.dir = -1;
    spawnParticles(b.x, b.y, '#ff2244', 12, 5);
    spawnFloater(b.x - 30, b.y, '-5', '#ff2244');
    onWallHit(5);
  }

  // Phase 2 at 50% HP
  if (!b.phase2 && b.hp < b.maxHp * 0.5) {
    b.phase2       = true;
    b.speed       *= 1.4;
    b.lateralSpeed*= 1.6;
    b.shootInterval= Math.max(40, b.shootInterval - 20);
    spawnParticles(b.x, b.y, '#ff2244', 30, 8);
    spawnFloater(b.x, b.y - 50, 'PHASE 2!', '#ff2244');
    // Spawn minions
    const minion = ENEMY_TYPES[0];
    for (let i = 0; i < 3; i++) {
      spawnEnemy({ ...minion, x: b.x + (i - 1) * 80, hpScale: 1 }, run.wave);
      combat.enemiesThisWave++;
    }
  }

  // Boss shoots
  b.shootTimer++;
  if (b.shootTimer >= b.shootInterval) {
    b.shootTimer = 0;
    const spread = b.phase2 ? 3 : 1;
    for (let s = 0; s < spread; s++) {
      const angle = Math.PI / 2 + (s - (spread - 1) / 2) * 0.35;
      combat.enemyBullets.push({
        x: b.x, y: b.y + b.size,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4,
        life: 180, r: 5, dmg: 8,
        color: '#ff2244',
      });
    }
  }

  // Burn / slow
  if (b.burnTimer > 0) { b.burnTimer--; b.hp -= b.burnDmg; }
  if (b.slowTimer  > 0)  b.slowTimer--;

  // Reached base
  if (b.y > getPanelTop()) {
    spawnParticles(screen.W / 2, getPanelTop(), '#ff2244', 60, 10);
    combat.boss = null;
    onBaseHit(999); // instant kill
    return;
  }

  if (b.hp <= 0) {
    killBoss(meta, onKill);
  }
}

function killBoss(meta, onKill) {
  const b = combat.boss;
  spawnParticles(b.x, b.y, '#ff2244', 50, 10);
  spawnParticles(b.x, b.y, '#ff6600', 30, 8);
  run.credits += b.reward;
  spawnFloater(b.x, b.y - 60, 'BOSS DOWN! +$' + b.reward, '#ff2244');
  gainPilotXP(meta, 15);
  saveMeta(meta);
  combat.boss = null;
  // Reset so wave complete triggers
  combat.waveComplete    = false;
  combat.enemiesThisWave = 0;
  combat.enemiesSpawned  = 0;
  combat.enemies         = [];
  if (onKill) onKill(b.reward);
}
