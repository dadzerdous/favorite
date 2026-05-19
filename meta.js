// ─── META.JS ──────────────────────────────────────────────────────────────────
// Persistent player data. All localStorage access lives here.

import {
  SAVE_KEY,
  TURRET_XP_PER_RANK, PILOT_XP_PER_RANK,
  QUEST_DEFS, BRANCH_SKILLS, TURRET_SKILLS, PILOT_SKILLS,
} from './constants.js';

// ── Default structure ─────────────────────────────────────────────────────────
function defaultMeta() {
  return {
    pilotRank:  1,
    pilotXP:    0,
    skillPoints: 0,

    turretXP:         { kinetic:0, energy:0, plasma:0 },
    turretRank:       { kinetic:1, energy:1, plasma:1 },
    turretSkillPoints:{ kinetic:0, energy:0, plasma:0 },
    turretStatPoints: { kinetic:0, energy:0, plasma:0 },

    turretStats: {
      kinetic: { dmg:0, fireRate:0, crit:0, penetration:0 },
      energy:  { dmg:0, fireRate:0, heatRed:0, crit:0, resonance:0 },
      plasma:  { dmg:0, fireRate:0, aoe:0, crit:0, volatility:0  },
    },

    pilotSkills:  {},
    turretSkills: { kinetic:{}, energy:{}, plasma:{} },

    // Quest completion: { questId: 'done' }
    quests: {},
    // Quest progress: { 'qprog_questId': number }

    highScore:   0,
    totalRuns:   0,

    // Lifetime stats for quests
    lifetime: {
      credits:    0,
      kinetic:    { bought:0 },
      energy:     { bought:0 },
      plasma:     { bought:0 },
    },
  };
}

// ── Load / save ───────────────────────────────────────────────────────────────
export function loadMeta() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultMeta();
    const saved = JSON.parse(raw);
    // Deep-merge with defaults so old saves get new fields safely
    const def = defaultMeta();
    return deepMerge(def, saved);
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(meta)); } catch {}
}

export function resetMeta() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
  return defaultMeta();
}

function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      out[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

// ── XP helpers ────────────────────────────────────────────────────────────────
export function getNextPilotXP(meta) {
  return PILOT_XP_PER_RANK[Math.min(meta.pilotRank, PILOT_XP_PER_RANK.length - 1)];
}

export function getNextTurretXP(meta, type) {
  return TURRET_XP_PER_RANK[Math.min(meta.turretRank[type], TURRET_XP_PER_RANK.length - 1)];
}

/**
 * Add pilot XP. Returns array of rank-up events { newRank }.
 */
export function gainPilotXP(meta, amount) {
  meta.pilotXP += amount;
  const events = [];
  while (meta.pilotRank < PILOT_XP_PER_RANK.length && meta.pilotXP >= getNextPilotXP(meta)) {
    meta.pilotXP -= getNextPilotXP(meta);
    meta.pilotRank++;
    meta.skillPoints = (meta.skillPoints || 0) + 1;
    events.push({ type:'pilotRankUp', rank: meta.pilotRank });
  }
  return events;
}

/**
 * Add turret XP. Returns array of rank-up events.
 */
export function gainTurretXP(meta, turretType, amount) {
  meta.turretXP[turretType] += amount;
  const events = [];
  const maxRank = getMaxTurretRank(meta, turretType);
  while (
    meta.turretRank[turretType] < maxRank &&
    meta.turretXP[turretType] >= getNextTurretXP(meta, turretType)
  ) {
    meta.turretXP[turretType] -= getNextTurretXP(meta, turretType);
    meta.turretRank[turretType]++;
    meta.turretSkillPoints[turretType] = (meta.turretSkillPoints[turretType] || 0) + 1;
    meta.turretStatPoints[turretType]  = (meta.turretStatPoints[turretType]  || 0) + 1;
    events.push({ type:'turretRankUp', turretType, rank: meta.turretRank[turretType] });
  }
  return events;
}

// ── Skill helpers ─────────────────────────────────────────────────────────────
export function isQuestUnlocked(meta, type, branch) {
  const defs = QUEST_DEFS[type] || [];
  const quest = defs.find(q => q.reward === branch);
  if (!quest) return true; // no quest gate for this branch
  return meta.quests?.[quest.id] === 'done';
}

export function isSkillAvailable(meta, type, skillId) {
  const skills  = type === 'pilot' ? PILOT_SKILLS : TURRET_SKILLS[type];
  const skill   = skills?.find(s => s.id === skillId);
  if (!skill) return false;

  const unlocked = type === 'pilot' ? meta.pilotSkills : meta.turretSkills[type];

  // Check prerequisite
  if (skill.req && !unlocked[skill.req]) return false;

  // Check branch quest gate
  if (skill.branch) {
    const branches = BRANCH_SKILLS[type] || {};
    if (branches[skill.branch]?.includes(skillId) && !isQuestUnlocked(meta, type, skill.branch)) {
      return false;
    }
  }

  return true;
}

export function unlockSkill(meta, type, skillId) {
  if (type === 'pilot') {
    if ((meta.skillPoints || 0) < 1) return false;
    if (!isSkillAvailable(meta, type, skillId)) return false;
    meta.skillPoints--;
    meta.pilotSkills[skillId] = true;
  } else {
    if ((meta.turretSkillPoints[type] || 0) < 1) return false;
    if (!isSkillAvailable(meta, type, skillId)) return false;
    meta.turretSkillPoints[type]--;
    meta.turretSkills[type][skillId] = true;
  }
  return true;
}

// ── Stat helpers ──────────────────────────────────────────────────────────────
export function getStatCost(currentLevel) {
  return currentLevel < 3 ? 1 : 2;
}

export function spendStatPoint(meta, type, statId, dir) {
  const { TURRET_STAT_DEFS } = globalThis._neonConstants || {};
  // defs are imported in the caller (ui.js) which imports constants directly
  // We just do the mutation here
  const cur = meta.turretStats?.[type]?.[statId] || 0;
  if (!meta.turretStats[type]) meta.turretStats[type] = {};

  if (dir > 0) {
    const cost = getStatCost(cur);
    if ((meta.turretStatPoints?.[type] || 0) < cost) return false;
    meta.turretStatPoints[type] -= cost;
    meta.turretStats[type][statId] = cur + 1;
  } else {
    if (cur <= 0) return false;
    const refund = getStatCost(cur - 1);
    meta.turretStatPoints[type] = (meta.turretStatPoints[type] || 0) + refund;
    meta.turretStats[type][statId] = cur - 1;
  }
  return true;
}

export function getTurretStat(meta, type, stat) {
  return meta.turretStats?.[type]?.[stat] || 0;
}

// ── Quest helpers ─────────────────────────────────────────────────────────────
export function getQuestProgress(meta, questId) {
  return meta['qprog_' + questId] || 0;
}

/**
 * Increment quest progress. Returns array of completion events.
 */
let _questSaveDirty = false;
let _questSaveTimer = 0;
export function markQuestDirty() { _questSaveDirty = true; }
export function tickQuestSave(meta) {
  if (!_questSaveDirty) return;
  _questSaveTimer++;
  if (_questSaveTimer >= 300) {
    _questSaveTimer = 0; _questSaveDirty = false; saveMeta(meta);
  }
}

// Track quest progress. Pass highFrequency=true for burn damage (batched save).
export function trackQuest(meta, type, statKey, amount, highFrequency = false) {
  if (!meta.quests) meta.quests = {};
  const defs = QUEST_DEFS[type] || [];
  const events = [];

  defs.forEach(qd => {
    if (qd.statKey !== statKey) return;
    if (meta.quests[qd.id] === 'done') return;

    const key = 'qprog_' + qd.id;
    meta[key] = (meta[key] || 0) + amount;

    events.push({
      type:      'questProgress',
      questType: type,
      statKey,
      questId:   qd.id,
      questName: qd.name,
      current:   meta[key],
      target:    qd.target,
      done:      meta[key] >= qd.target,
    });

    if (meta[key] >= qd.target) {
      meta.quests[qd.id] = 'done';
      events.push({ type:'questComplete', questId: qd.id, questName: qd.name, reward: qd.reward, questType: type });
      saveMeta(meta); // always save immediately on completion
    } else if (highFrequency) {
      markQuestDirty(); // batch save for high-frequency events
    } else {
      saveMeta(meta); // save immediately for normal events
    }
  });

  return events;
}

// ── Max rank unlock ───────────────────────────────────────────────────────────
// Each type can unlock rank 6 by completing the prestige quest.
// Prestige quest: reach max rank (5) AND build 25 max-level (lv3) turrets of that type.

export function getMaxTurretRank(meta, type) {
  // Base max is 5. Prestige quest extends to 6.
  const prestigeKey = 'prestige_' + type;
  return (meta[prestigeKey]) ? 6 : 5;
}

export function checkPrestigeQuest(meta, type) {
  // Already prestiged
  if (meta['prestige_' + type]) return null;

  const rank    = meta.turretRank?.[type] || 1;
  const built   = meta['qprog_prestige_built_' + type] || 0;
  const maxRank = 5; // must be at base max rank to prestige

  if (rank >= maxRank && built >= 25) {
    meta['prestige_' + type] = true;
    saveMeta(meta);
    return { type:'prestigeUnlocked', turretType: type };
  }
  return null;
}

export function trackPrestigeBuild(meta, type, level) {
  if (meta['prestige_' + type]) return null; // already prestiged
  if (level < 3) return null; // only max-level turrets count
  const key = 'qprog_prestige_built_' + type;
  meta[key] = (meta[key] || 0) + 1;
  saveMeta(meta);
  return checkPrestigeQuest(meta, type);
}

// ── Pilot skill query helpers (used by turrets/combat) ───────────────────────
export function hasPilotSkill(meta, id) {
  return !!meta.pilotSkills?.[id];
}

export function hasTurretSkill(meta, type, id) {
  return !!meta.turretSkills?.[type]?.[id];
}
