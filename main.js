// ─── MAIN.JS ──────────────────────────────────────────────────────────────────
// Game loop, init, beam logic, wires all modules together.

import { loadMeta, saveMeta, gainPilotXP, hasPilotSkill, hasTurretSkill, getTurretStat, trackQuest, tickQuestSave, trackPrestigeBuild } from './meta.js';
import { run, combat, board, input, screen, session, resetRun } from './state.js';
import { initDraw, draw, reinitStars, resetChainTimerCache } from './draw.js';
import { initInput } from './input.js';
import { updateHUD, updatePrepHUD, hidePrepTimer, updateBossHP, hideBossHP, showWaveAnnounce, showGameOver, hideGameOver, openSkillDrawer, closeSkillDrawer, renderSkillTab, splashTab, checkQuestToast, showQuestToast, wireCC } from './ui.js';
import { buyTurret, getRailCount, getHangarCount } from './turrets.js';
import { updateTurrets } from './turrets.js';
import { updateEnemies, updateBullets, updateEnemyBullets, killEnemy } from './enemies.js';
import { updateParticles, updateFloaters, spawnFloater } from './effects.js';
import { startPrepPhase, tickPrep, startCombatPhase, tickEnemySpawns, checkWaveComplete, updateBoss } from './waves.js';

// ── Bootstrap ─────────────────────────────────────────────────────────────────
let meta = loadMeta();
let canvas, phase = 'splash';

window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('gameCanvas');

  // Set correct dimensions immediately -- don't wait for a resize event
  screen.W = canvas.width  = window.innerWidth;
  screen.H = canvas.height = window.innerHeight;

  initDraw(canvas);
  initInput(canvas, meta);
  wireButtons();
  updateSplashStats();
  requestAnimationFrame(gameLoop);
});

window.addEventListener('resize', () => {
  screen.W = canvas.width  = window.innerWidth;
  screen.H = canvas.height = window.innerHeight;
  reinitStars();
});

// ── Main loop ─────────────────────────────────────────────────────────────────
function gameLoop() {
  if (session.gameStarted && !session.skillPaused && !session.isGameOver) {
    coolHeat();
    update();
  }
  draw(meta);
  requestAnimationFrame(gameLoop);
}

function coolHeat() {
  if (!input.beamActive) {
    const rate = 0.5 *
      (1 + (hasTurretSkill(meta, 'energy', 'e7') ? 0.25 : 0)) *
      (1 + (hasPilotSkill(meta, 'pr3')           ? 0.30 : 0));
    run.heat = Math.max(0, run.heat - rate);
    if (run.heat === 0) run.overheated = false;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update() {
  combat.frameCount++;
  updateHUD(meta);
  tickQuestSave(meta); // batch-save quest progress every ~5s

  if (phase === 'prep') {
    updatePrep();
    updateParticles();
    updateFloaters();
    return;
  }

  // Combat
  combat.combatFrame++;
  tickEnemySpawns(run.wave);
  updateBeam();
  updateTurrets(meta, (idx) => killEnemy(meta, idx, onEnemyKill));
  updateBullets(meta, onEnemyKill);
  updateEnemies(meta, onEnemyKill, onBaseHit);
  updateEnemyBullets(onBaseHit);
  if (combat.boss) {
    updateBoss(meta, onWallHit, onBaseHit, onBossKill);
    if (combat.boss) updateBossHP(combat.boss.hp / combat.boss.maxHp * 100);
  }
  updateIonStorm();
  updateParticles();
  updateFloaters();
  decayChain();
  checkWaveComplete(meta, run.wave, onWaveClear);
}

function updatePrep() {
  const result = tickPrep(run.wave);
  if (!result) return;
  if (result.startCombat) {
    hidePrepTimer();
    phase = startCombatPhase(run.wave);
  } else {
    updatePrepHUD(result.msg, result.warning);
  }
}

// ── Beam ──────────────────────────────────────────────────────────────────────
function updateBeam() {
  if (!input.beamActive || run.overheated || input.dragging || phase !== 'combat') return;

  const heatRate  = hasTurretSkill(meta, 'plasma', 'p7') ? 0.9 : 1.2;
  const heatBoost = 1 - getTurretStat(meta, 'energy', 'heatRed') * 0.06;
  run.heat += heatRate * heatBoost;

  if (run.heat >= 100) {
    run.heat = 100; run.overheated = true; input.beamActive = false;
    run.runQuests.overheats = (run.runQuests.overheats || 0) + 1;
    trackQuest(meta, 'energy', 'overheats', 1);
    saveMeta(meta);
    return;
  }

  const beamDmg    = hasTurretSkill(meta, 'energy', 'e8') ? 0.7 : 0.5;
  const widthMult  = 1 + (hasTurretSkill(meta, 'energy', 'e1') ? 0.3 : 0);
  const beamRadius = 30 * widthMult;
  const heatBonus  = hasTurretSkill(meta, 'energy', 'e4') && run.heat > 60 ? 1.4 : 1;

  combat.enemies.forEach((en, i) => {
    if (Math.hypot(en.x - input.beamX, en.y - input.beamY) < beamRadius) {
      en.lastHitType = 'energy'; // fix: beam kills give energy XP
      en.hp -= beamDmg * heatBonus;
      if (en.hp <= 0) killEnemy(meta, i, onEnemyKill);
    }
  });
  if (combat.boss && Math.hypot(combat.boss.x - input.beamX, combat.boss.y - input.beamY) < beamRadius * 1.5) {
    combat.boss.lastHitType = 'energy';
    combat.boss.hp -= beamDmg * 0.5;
  }
}

// ── Ion storm ─────────────────────────────────────────────────────────────────
function updateIonStorm() {
  if (!hasTurretSkill(meta, 'energy', 'e6')) return;
  combat.ionPulseTimer = (combat.ionPulseTimer || 0) + 1;
  if (combat.ionPulseTimer >= 600) {
    combat.ionPulseTimer = 0;
    combat.enemies.forEach((en, i) => {
      en.lastHitType = 'energy'; // ion storm = energy kill
      en.hp -= 8;
      if (en.hp <= 0) killEnemy(meta, i, onEnemyKill);
    });
  }
}

// ── Chain decay ───────────────────────────────────────────────────────────────
function decayChain() {
  const timeout = run.chainTimeout * (hasPilotSkill(meta, 'pr4') ? 1.5 : 1);
  if (Date.now() - run.lastKillTime > timeout + 200) {
    if (run.chainCount > 1) resetChainTimerCache();
    run.chainCount = 1;
  }
}

// ── Event handlers ────────────────────────────────────────────────────────────
function onEnemyKill(result) {
  if (result?.xpEvents) {
    result.xpEvents.forEach(ev => {
      if (ev.type === 'turretRankUp') spawnFloater(screen.W/2, screen.H/2 - 40, ev.turretType.toUpperCase() + ' RANK ' + ev.rank + '! +1 SKILL +1 STAT', '#00f5ff');
      if (ev.type === 'pilotRankUp')  spawnFloater(screen.W/2, screen.H/2 - 60, 'PILOT RANK ' + ev.rank + '! +1 SKILL PT', '#ffe600');
    });
  }
}

function onBaseHit(dmg) {
  run.shields -= dmg;
  if (run.shields <= 0) gameOver();
}

function onWallHit(dmg) {
  run.shields -= dmg;
  if (run.shields <= 0) gameOver();
}

function onBossKill(reward) {
  hideBossHP();
  spawnFloater(screen.W/2, screen.H/2 - 80, 'BOSS DEFEATED! +$' + reward, '#ff2244');
}

function onWaveClear(bonus) {
  saveMeta(meta); // persist quest progress at end of each wave
  run.wave++;
  setTimeout(() => {
    showWaveAnnounce(run.wave);
    phase = startPrepPhase(run.wave);
  }, 1500);
}

// ── Quest event processing ────────────────────────────────────────────────────
export function processQuestEvents(meta, events) {
  if (!events?.length) return;
  events.forEach(ev => {
    if (ev.type === 'questProgress') {
      checkQuestToast(meta, ev.questType, ev.statKey, ev.current);
    }
    if (ev.type === 'questComplete') {
      showQuestToast(ev.questName + ' COMPLETE!', 100, ev.target, ev.target, '#00ff88');
      spawnFloater(screen.W/2, screen.H/2 - 80, 'QUEST: ' + ev.questName + '!', '#ffe600');
    }
  });
}
function startGame() {
  document.getElementById('splash').style.display = 'none';
  session.gameStarted = true;
  session.isGameOver  = false;
  initRun();
}

function initRun() {
  meta.totalRuns = (meta.totalRuns || 0) + 1;
  saveMeta(meta);
  const startCredits = 50 + (hasPilotSkill(meta, 'pr1') ? 30 : 0);
  const startShields = 100 + (hasPilotSkill(meta, 'pr5') ? 10 : 0);
  const railCount    = getRailCount(meta);
  const hangarCount  = getHangarCount(meta);
  resetRun(meta, startCredits, startShields, railCount, hangarCount);
  phase = startPrepPhase(1);
  showWaveAnnounce(1);
  hideBossHP();
  hideGameOver();
}

function gameOver() {
  session.isGameOver = true;
  meta.highScore = Math.max(meta.highScore, run.wave);
  gainPilotXP(meta, run.wave * 2);
  saveMeta(meta); // full save captures all in-memory quest progress
  showGameOver(meta, run.wave);
}

function restartGame() {
  session.isGameOver = false;
  hideGameOver();
  initRun();
}

function quitToMenu() {
  session.gameStarted = false;
  session.isGameOver  = false;
  session.skillPaused = false;
  hideBossHP();
  hideGameOver();
  closeSkillDrawer();
  updateSplashStats();
  splashTab('play');
  document.getElementById('splash').style.display = 'flex';
}

function updateSplashStats() {
  const s = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  s('splashRank',  meta.pilotRank);
  s('splashHigh',  meta.highScore > 0 ? meta.highScore : '--');
  s('splashRuns',  meta.totalRuns || 0);
  s('splashKRank', 'R' + (meta.turretRank?.kinetic || 1));
  s('splashERank', 'R' + (meta.turretRank?.energy  || 1));
  s('splashPRank', 'R' + (meta.turretRank?.plasma  || 1));
}

// ── Wire HTML buttons ─────────────────────────────────────────────────────────
function wireButtons() {
  // Can't use onclick= in module context, so wire here
  window.startGame    = startGame;
  window.restartGame  = restartGame;
  window.quitToMenu   = quitToMenu;
  window.resetMeta = () => {
    if (!confirm('Reset ALL progress? Cannot be undone.')) return;
    localStorage.removeItem('neonStrikeSave_v2');
    localStorage.removeItem('neonStrikeSave'); // clear old monolith save too
    meta = loadMeta();
    updateSplashStats();
  };

  window.buyTurret    = () => { const r = buyTurret(meta); if (r?.questEvents) r.questEvents.forEach(ev => spawnFloater(screen.W/2, screen.H/2-80, 'QUEST: '+ev.questName+'!', '#ffe600')); };
  window.toggleSellMode = () => {
    input.sellMode = !input.sellMode;
    const btn = document.querySelector('.btn-sell');
    if (btn) { btn.style.background = input.sellMode ? 'var(--red)' : ''; btn.style.color = input.sellMode ? '#000' : ''; }
  };
  wireCC(); // set up window.ccSelectType / window.ccSelectSub
  window.openSkills   = () => openSkillDrawer(meta);
  window.closeSkills  = () => closeSkillDrawer();
  window.switchTab    = (tab) => renderSkillTab(meta, tab);
  window.splashTab    = splashTab;
  window.menuSkillTab = (tab) => renderSkillTab(meta, tab); // for menu skills panel
}
