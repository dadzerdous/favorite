// ─── ENEMIES.JS ───────────────────────────────────────────────────────────────
// Enemy spawning, updating, dying, enemy bullets.

import { ENEMY_TYPES, RAIL_W, RAIL_GAP } from './constants.js';
import { run, combat, board, screen } from './state.js';
import { getPanelTop, getRailPos, calcDamage, getPlasmaAoeRadius, getPenetrationChance, getResonanceDuration, getVolatilityChance, explodeOrb } from './turrets.js';
import { spawnParticles, spawnFloater } from './effects.js';
import { hasTurretSkill, gainPilotXP, gainTurretXP, trackQuest, saveMeta } from './meta.js';

// ── Chain kill system ─────────────────────────────────────────────────────────
function registerKill(meta, x, y, reward, killerType) {
  const now          = Date.now();
  const chainTimeout = run.chainTimeout * (hasTurretSkill(meta, 'pilot', 'pr4') ? 1.5 : 1);

  if (now - run.lastKillTime < chainTimeout) {
    run.chainCount = Math.min(run.chainCount + 1, 8);
  } else {
    run.chainCount = 1;
  }
  run.lastKillTime = now;

  // Quest: chain x5
  if (run.chainCount >= 5) {
    const events = trackQuest(meta, 'kinetic', 'chain5', 1);
    events.forEach(ev => spawnFloater(x, y - 30, 'QUEST: ' + ev.questName + '!', '#ffe600'));
  }

  const killBonus  = hasTurretSkill(meta, 'pilot', 'pr2') ? 1 : 0;
  const earned     = Math.floor(reward * run.chainCount) + killBonus;
  run.credits     += earned;

  // Lifetime credits for pilot quest
  meta.lifetime.credits = (meta.lifetime.credits || 0) + earned;
  trackQuest(meta, 'pilot', 'credits', earned);

  const xpEvents = [
    ...gainPilotXP(meta, 1 + Math.floor(run.chainCount / 3)),
    ...gainTurretXP(meta, killerType, 2),
  ];

  spawnFloater(x, y, '+$' + earned + (run.chainCount > 1 ? ' x' + run.chainCount : ''),
    run.chainCount > 2 ? '#ffe600' : '#00ff88');

  saveMeta(meta);
  return { earned, chainCount: run.chainCount, xpEvents };
}

// ── Spawn enemy ───────────────────────────────────────────────────────────────
export function spawnEnemy(def, wave) {
  const cycle       = Math.floor((wave - 1) / 5);
  const waveInCycle = ((wave - 1) % 5) + 1;
  const earlyBoost  = (cycle === 0 && waveInCycle <= 4) ? 1.35 : 1.0;
  const speed       = (def.speedMult * (0.8 + wave * 0.04) * earlyBoost);
  const hpScale     = def.hpScale || 1;
  const baseHp      = def.hpMult * (3 + wave * 0.6) * hpScale;

  // Spawn just above the visible zoomed area (a few frames out)
  // getViewTransform imported from draw is circular -- use a simple offset
  const spawnY = def.y ?? -40; // just off top

  combat.enemies.push({
    ...def,
    x:          def.x ?? (60 + Math.random() * (screen.W - 120)),
    y:          spawnY,
    hp:         baseHp,
    maxHp:      baseHp,
    speed,
    angle:      Math.random() * Math.PI * 2,
    rotSpeed:   (Math.random() * 0.03 + 0.01) * (Math.random() < 0.5 ? 1 : -1),
    burnTimer:  0, burnDmg: 0,
    slowTimer:  0, slowAmt: 0,
    shootTimer: Math.floor(Math.random() * 120),
    phase:      Math.random() * Math.PI * 2,
    driftX:     0,
  });
}

// ── Update enemies ────────────────────────────────────────────────────────────
export function updateEnemies(meta, onDeath, onBaseHit) {
  const cycle = Math.floor((run.wave - 1) / 5);

  for (let i = combat.enemies.length - 1; i >= 0; i--) {
    const en = combat.enemies[i];

    // Burn tick
    if (en.burnTimer > 0) {
      en.burnTimer--;
      en.hp -= en.burnDmg;
      run.runQuests.burndmg = (run.runQuests.burndmg || 0) + en.burnDmg;
      trackQuest(meta, 'plasma', 'burndmg', en.burnDmg);
      if (hasTurretSkill(meta, 'plasma', 'p6')) en.slowTimer = 30;
    }

    if (en.hp <= 0) { killEnemy(meta, i, onDeath); continue; }

    // Movement
    const slowMult = en.slowTimer > 0 ? (1 - (en.slowAmt || 0.2)) : 1;
    if (en.slowTimer > 0) en.slowTimer--;

    en.y += en.speed * slowMult;
    if (en.id === 'yellow') en.driftX = Math.sin(combat.frameCount * 0.05 + en.phase) * 0.5;
    en.x += en.driftX;

    // Rotate
    en.angle += en.rotSpeed * (en.slowTimer > 0 ? 0.4 : 1);

    // Stage 2+ enemies shoot back
    if (cycle >= 1 && en.id !== 'yellow') {
      en.shootTimer = (en.shootTimer || 0) + 1;
      const shootInterval = en.id === 'orange' ? 90 : en.id === 'red' ? 120 : 180;
      if (en.shootTimer >= shootInterval) {
        en.shootTimer = 0;
        combat.enemyBullets.push({
          x: en.x, y: en.y + 12,
          vx: (Math.random() - 0.5) * 2,
          vy: 3 + cycle * 0.5,
          life: 150, r: 3, dmg: 5,
          color: en.color,
        });
      }
    }

    // Reached turret zone or base
    const turretLineY = getPanelTop() - RAIL_W - 14;
    if (en.y > turretLineY) {
      // Check proximity to each rail turret
      let hitTurret = false;
      const railCount = board.rails.length;
      for (let ri = 0; ri < railCount; ri++) {
        if (!board.rails[ri] || board.railHp[ri] === null) continue;
        const rp = getRailPos(ri, railCount);
        const tx = rp.x + RAIL_W / 2;
        if (Math.abs(en.x - tx) < RAIL_W) {
          board.railHp[ri] -= 10;
          spawnParticles(tx, rp.y + RAIL_W/2, '#ff2244', 5, 4);
          hitTurret = true;
          if (board.railHp[ri] <= 0) {
            spawnParticles(tx, rp.y + RAIL_W/2, '#ff2244', 20, 6);
            spawnFloater(tx, rp.y, 'TURRET DESTROYED', '#ff2244');
            board.rails[ri]  = null;
            board.railHp[ri] = null;
          }
          break;
        }
      }
      if (!hitTurret) {
        spawnParticles(en.x, getPanelTop(), '#ff2244', 8, 5);
        onBaseHit(8);
      }
      combat.enemies.splice(i, 1);
    }
  }
}

// ── Kill enemy ────────────────────────────────────────────────────────────────
export function killEnemy(meta, idx, onDeath) {
  const en = combat.enemies[idx];
  if (!en) return;

  spawnParticles(en.x, en.y, en.color, 10, 6);

  // Volatility: burning enemies explode on death
  const vol = getVolatilityChance(meta);
  if (en.burnTimer > 0 && vol > 0 && Math.random() < vol) {
    const boom = getPlasmaAoeRadius(meta) + 20;
    spawnParticles(en.x, en.y, '#ff6600', 15, 7);
    spawnFloater(en.x, en.y - 20, 'VOLATILE!', '#ff6600');
    for (let k = combat.enemies.length - 1; k >= 0; k--) {
      if (k === idx) continue;
      const splash = combat.enemies[k];
      if (splash && Math.hypot(splash.x - en.x, splash.y - en.y) < boom) {
        splash.lastHitType = 'plasma'; // volatility = plasma kill
        splash.hp -= 5;
        if (splash.hp <= 0) killEnemy(meta, k, onDeath);
      }
    }
  }

  const result = registerKill(meta, en.x, en.y, en.reward, en.lastHitType || 'kinetic');
  combat.enemiesKilled++;
  combat.enemies.splice(idx, 1);

  if (onDeath) onDeath(result);
}

// ── Update player bullets ─────────────────────────────────────────────────────
export function updateBullets(meta, onEnemyKill) {
  const panelTop = getPanelTop();

  for (let i = combat.bullets.length - 1; i >= 0; i--) {
    const b = combat.bullets[i];
    b.x += b.vx; b.y += b.vy; b.life--;

    if (b.life <= 0 || b.x < 0 || b.x > screen.W || b.y < 0 || b.y > screen.H) {
      // Plasma orb timeout — explode anyway
      if (b.isOrb) {
        spawnParticles(b.x, b.y, '#ff6600', 20, 6);
        explodeOrb(meta, b, onEnemyKill);
        for (let k = combat.enemies.length - 1; k >= 0; k--) {
          if (combat.enemies[k]?._dead) { delete combat.enemies[k]._dead; killEnemy(meta, k, onEnemyKill); }
        }
      }
      combat.bullets.splice(i, 1); continue;
    }

    // Plasma orb: check collision by orb radius
    if (b.isOrb) {
      let hit = false;
      for (let j = combat.enemies.length - 1; j >= 0; j--) {
        const en = combat.enemies[j];
        if (Math.hypot(en.x - b.x, en.y - b.y) < (b.orbR + 10)) {
          hit = true; break;
        }
      }
      if (combat.boss && Math.hypot(combat.boss.x - b.x, combat.boss.y - b.y) < (b.orbR + combat.boss.size)) hit = true;
      if (hit) {
        spawnParticles(b.x, b.y, '#ff6600', 30, 8);
        spawnParticles(b.x, b.y, '#ff2244', 15, 5);
        if (b.crit) spawnFloater(b.x, b.y - 20, 'CRIT!', '#ffe600');
        explodeOrb(meta, b, onEnemyKill);
        for (let k = combat.enemies.length - 1; k >= 0; k--) {
          if (combat.enemies[k]?._dead) { delete combat.enemies[k]._dead; killEnemy(meta, k, onEnemyKill); }
        }
        combat.bullets.splice(i, 1);
      }
      continue; // skip kinetic logic for orbs
    }

    let bulletDead = false;

    for (let j = combat.enemies.length - 1; j >= 0; j--) {
      const en = combat.enemies[j];
      if (Math.hypot(en.x - b.x, en.y - b.y) >= 18) continue;

      en.lastHitType = b.type;
      const dmg = calcDamage(meta, b, en);
      en.hp -= dmg;

      // Crit visual feedback
      if (b.crit) spawnFloater(en.x, en.y - 16, 'CRIT!', '#ffe600');

      // Slow on hit (energy)
      if (b.type === 'energy' && hasTurretSkill(meta, 'energy', 'e2')) {
        if (!en.slowTimer) {
          run.runQuests.slowed++;
          trackQuest(meta, 'energy', 'slowed', 1);
        }
        en.slowTimer = 90 + getResonanceDuration(meta);
        en.slowAmt   = 0.2;
      }

      // Burn on hit (plasma)
      if (b.type === 'plasma' && hasTurretSkill(meta, 'plasma', 'p4')) {
        en.burnTimer = 120;
        en.burnDmg   = 0.3 * (1 + (hasTurretSkill(meta, 'plasma', 'p5') ? 0.5 : 0));
      }

      // Instakill
      if (b.type === 'plasma' && hasTurretSkill(meta, 'plasma', 'p9') && Math.random() < 0.05) {
        en.hp = -9999;
      }

      // Plasma AOE splash
      if (b.type === 'plasma') {
        const aoeR = getPlasmaAoeRadius(meta);
        if (aoeR > 0) {
          let splashCount = 0;
          spawnParticles(b.x, b.y, '#ff6600', 8, 5);
          for (let k = combat.enemies.length - 1; k >= 0; k--) {
            if (k === j) continue;
            const splash = combat.enemies[k];
            if (!splash) continue;
            if (Math.hypot(splash.x - b.x, splash.y - b.y) < aoeR) {
              splash.lastHitType = 'plasma';
              splash.hp -= calcDamage(meta, b, splash) * 0.6;
              spawnParticles(splash.x, splash.y, '#ff6600', 3, 3);
              splashCount++;
              if (splash.hp <= 0) killEnemy(meta, k, onEnemyKill);
            }
          }
          if (splashCount >= 2) {
            run.runQuests.splashkills++;
            trackQuest(meta, 'plasma', 'splashkills', 1);
          }
        }
      }

      spawnParticles(en.x, en.y, b.type === 'kinetic' ? '#00f5ff' : b.type === 'energy' ? '#cc00ff' : '#ff6600', 2, 4);

      if (en.hp <= 0) killEnemy(meta, j, onEnemyKill);

      // Penetration stat
      const pen = getPenetrationChance(meta);
      if (b.pierce > 0) { b.pierce--; }
      else if (b.type === 'kinetic' && Math.random() < pen) { /* bullet continues */ }
      else { combat.bullets.splice(i, 1); bulletDead = true; }
      break;
    }

    // Boss hit
    if (!bulletDead && combat.boss) {
      const bos = combat.boss;
      if (Math.hypot(bos.x - b.x, bos.y - b.y) < bos.size) {
        const dmg = calcDamage(meta, b, bos);
        bos.hp -= dmg;
        spawnParticles(bos.x, bos.y, b.type === 'kinetic' ? '#00f5ff' : b.type === 'energy' ? '#cc00ff' : '#ff6600', 3, 5);
        combat.bullets.splice(i, 1);
      }
    }
  }
}

// ── Enemy bullets ─────────────────────────────────────────────────────────────
export function updateEnemyBullets(onBaseHit) {
  const panelTop = getPanelTop();
  for (let i = combat.enemyBullets.length - 1; i >= 0; i--) {
    const b = combat.enemyBullets[i];
    b.x += b.vx; b.y += b.vy; b.life--;
    if (b.life <= 0 || b.y > screen.H) { combat.enemyBullets.splice(i, 1); continue; }
    if (b.y > panelTop) {
      combat.enemyBullets.splice(i, 1);
      spawnParticles(b.x, panelTop, '#ff2244', 4, 3);
      onBaseHit(b.dmg);
    }
  }
}
