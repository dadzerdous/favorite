// ─── UI.JS ────────────────────────────────────────────────────────────────────

import {
  TURRET_SKILLS, PILOT_SKILLS, TURRET_STAT_DEFS,
  QUEST_CHAINS, TYPES,
} from './constants.js';
import { run, combat, input, session } from './state.js';
import {
  getNextPilotXP, getNextTurretXP,
  isSkillAvailable, unlockSkill as metaUnlock,
  spendStatPoint as metaSpend,
  getStatCost, getQuestProgress, saveMeta,
  getMaxTurretRank,
} from './meta.js';

// ── State ─────────────────────────────────────────────────────────────────────
const TYPE_ORDER = ['kinetic','energy','plasma','pilot'];
let activeType   = 'kinetic';
let activeSub    = 'stats';
let _meta        = null; // set when drawer opens

const TYPE_COLORS = {
  kinetic: '#00f5ff', energy: '#cc00ff', plasma: '#ff6600', pilot: '#ffe600',
};

// ── Toast ─────────────────────────────────────────────────────────────────────
const toastQ = []; let toastBusy = false;

export function checkQuestToast(meta, type, statKey, total) {
  (QUEST_CHAINS[type] || []).forEach(chain => {
    if (chain.statKey !== statKey) return;
    chain.tiers.forEach((tier, ti) => {
      const key = chain.id + '_t' + ti;
      if (meta.quests?.[key] === 'done') return;
      if (total > 0 && total % 50 === 0) {
        const pct = Math.min(100, Math.round(total / tier.target * 100));
        showQuestToast(chain.name + ' T' + (ti+1), pct, total, tier.target, TYPE_COLORS[type] || '#ffe600');
      }
    });
  });
}

export function showQuestToast(name, pct, cur, target, color) {
  toastQ.push({ name, pct, cur, target, color });
  if (!toastBusy) nextToast();
}

function nextToast() {
  if (!toastQ.length) { toastBusy = false; return; }
  toastBusy = true;
  const t = toastQ.shift();
  let el = document.getElementById('questToast');
  if (!el) {
    el = document.createElement('div'); el.id = 'questToast';
    el.style.cssText = 'position:fixed;top:68px;right:10px;width:190px;background:rgba(2,6,16,0.97);border-radius:8px;padding:10px 12px;z-index:500;transition:opacity 0.35s,transform 0.35s;font-family:"Share Tech Mono",monospace;pointer-events:none;';
    document.body.appendChild(el);
  }
  el.style.borderLeft = '3px solid ' + t.color;
  el.innerHTML =
    '<div style="font-size:8px;letter-spacing:2px;opacity:0.35;margin-bottom:3px;">QUEST</div>' +
    '<div style="font-size:10px;font-family:Orbitron,monospace;color:' + t.color + ';margin-bottom:6px;">' + t.name + '</div>' +
    '<div style="display:flex;align-items:center;gap:6px;">' +
      '<div style="flex:1;height:3px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;">' +
        '<div style="width:' + t.pct + '%;height:100%;background:' + t.color + ';border-radius:2px;"></div>' +
      '</div>' +
      '<span style="font-size:9px;color:rgba(255,255,255,0.35);">' + Math.min(t.cur,t.target) + '/' + t.target + '</span>' +
    '</div>';
  el.style.opacity = '0'; el.style.transform = 'translateX(12px)';
  requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateX(0)'; });
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(12px)'; setTimeout(nextToast, 400); }, 2800);
}

// ── HUD ───────────────────────────────────────────────────────────────────────
export function updateHUD(meta) {
  s('waveVal', run.wave); s('creditsVal', '$' + run.credits);
  s('shieldsVal', run.shields + '%'); s('chainVal', 'x' + run.chainCount);
  s('rankVal', meta.pilotRank);
  css('shieldFill', 'width', Math.max(0, run.shields) + '%');
  css('heatFill', 'width', run.heat + '%');
  css('heatFill', 'background', run.overheated ? 'var(--red)' : '');
  const pts = (meta.skillPoints||0) +
    Object.values(meta.turretStatPoints||{}).reduce((a,b)=>a+b,0) +
    Object.values(meta.turretSkillPoints||{}).reduce((a,b)=>a+b,0);
  const badge = document.getElementById('skillPtBadge');
  if (badge) { badge.style.display = pts>0?'block':'none'; badge.textContent = pts+' PT'+(pts!==1?'S':'')+' AVAIL'; }
}
export function updatePrepHUD(msg, warn) {
  const el=document.getElementById('prepTimer'); if(!el)return;
  el.style.opacity='1'; el.style.color=warn?'var(--red)':'var(--yellow)'; el.textContent=msg;
}
export function hidePrepTimer() { const el=document.getElementById('prepTimer'); if(el)el.style.opacity='0'; }
export function updateBossHP(pct) { css('bossHpFill','width',Math.max(0,pct)+'%'); const b=document.getElementById('bossHpBar'); if(b)b.style.display='flex'; }
export function hideBossHP() { const b=document.getElementById('bossHpBar'); if(b)b.style.display='none'; }
export function showWaveAnnounce(wave) {
  const el=document.getElementById('waveAnnounce'); if(!el)return;
  el.textContent = wave%5===0 ? '!! BOSS WAVE '+wave+' !!' : 'WAVE '+wave;
  el.style.color = wave%5===0 ? 'var(--red)' : 'var(--cyan)';
  el.style.opacity='1'; setTimeout(()=>el.style.opacity='0',2500);
}
export function showGameOver(meta, wave) {
  s('overlayTitle','DESTROYED'); css('overlayTitle','color','var(--red)');
  s('overlaySub','YOUR BASE HAS FALLEN');
  s('overlayStat','WAVE '+wave+' | BEST: WAVE '+meta.highScore+' | RANK: '+meta.pilotRank);
  s('overlayBtn','DEPLOY AGAIN');
  document.getElementById('overlay')?.classList.add('active');
}
export function hideGameOver() { document.getElementById('overlay')?.classList.remove('active'); }

// ── Drawer open/close ─────────────────────────────────────────────────────────
export function openSkillDrawer(meta) {
  _meta = meta;
  session.skillPaused = true;
  document.getElementById('skillOverlay')?.classList.add('active');
  renderDrawer();
  initSwipe();
}
export function closeSkillDrawer() {
  session.skillPaused = false;
  document.getElementById('skillOverlay')?.classList.remove('active');
}

// ── Wire global callbacks for HTML onclick ────────────────────────────────────
export function wireCC() {
  window.ccSelectType = (type) => { activeType = type; activeSub = 'stats'; renderDrawer(); };
  window.ccSelectSub  = (sub)  => { activeSub  = sub;  renderDrawer(); };
  window.closeSkills  = closeSkillDrawer;
  window.openSkills   = () => {}; // overridden in main.js
}

// ── Main render ───────────────────────────────────────────────────────────────
export function renderDrawer() {
  if (!_meta) return;
  updateTypeTabs();
  updateTypeHeader();
  updateXpBar();
  updateSubTabs();
  renderContent();
}

// exported alias for main.js compatibility
export function renderSkillTab(meta, tab) {
  _meta = meta;
  if (TYPE_ORDER.includes(tab)) activeType = tab;
  renderDrawer();
}
export function switchTab(meta, tab) { renderSkillTab(meta, tab); }

function updateTypeTabs() {
  document.querySelectorAll('.cc-type-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === activeType);
  });
}

function updateTypeHeader() {
  const meta  = _meta;
  const color = TYPE_COLORS[activeType];
  const rank  = activeType === 'pilot' ? meta.pilotRank : meta.turretRank[activeType];
  const spts  = activeType === 'pilot' ? (meta.skillPoints||0) : (meta.turretSkillPoints?.[activeType]||0);
  const stpts = activeType === 'pilot' ? 0 : (meta.turretStatPoints?.[activeType]||0);

  const label = document.getElementById('ccTypeLabel');
  const m     = document.getElementById('ccTypeMeta');
  if (label) { label.textContent = activeType.toUpperCase(); label.style.color = color; }
  if (m) {
    let parts = ['RANK ' + rank];
    if (spts  > 0) parts.push(spts  + ' SKILL PT' + (spts !==1?'S':''));
    if (stpts > 0) parts.push(stpts + ' STAT PT'  + (stpts!==1?'S':''));
    m.innerHTML = parts.join(' &nbsp;&bull;&nbsp; ');
  }
}

function updateXpBar() {
  const meta   = _meta;
  const xpCur  = activeType === 'pilot' ? meta.pilotXP   : meta.turretXP[activeType];
  const xpNext = activeType === 'pilot' ? getNextPilotXP(meta) : getNextTurretXP(meta, activeType);
  const pct    = Math.min(100, Math.round(xpCur / xpNext * 100));
  const color  = TYPE_COLORS[activeType];
  const fill   = document.getElementById('ccXpFill');
  const nums   = document.getElementById('ccXpNums');
  if (fill) { fill.style.width = pct + '%'; fill.style.background = color; }
  if (nums) nums.textContent = xpCur + ' / ' + xpNext;
}

function updateSubTabs() {
  const isPilot = activeType === 'pilot';
  document.querySelectorAll('.cc-sub-tab').forEach((btn, i) => {
    const subs = ['stats','skills','quests'];
    btn.textContent = subs[i].toUpperCase();
    // Hide stats for pilot
    btn.style.display = (i === 0 && isPilot) ? 'none' : 'block';
    btn.classList.toggle('active', subs[i] === activeSub);
  });
  // Pilot defaults to skills
  if (isPilot && activeSub === 'stats') activeSub = 'skills';
}

function renderContent() {
  const el = document.getElementById('ccContent');
  if (!el) return;
  el.innerHTML = '';
  if (activeSub === 'stats')   renderStats(el);
  if (activeSub === 'skills')  renderSkillTree(el);
  if (activeSub === 'quests')  renderQuests(el);
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function renderStats(container) {
  const meta  = _meta;
  const type  = activeType;
  const defs  = TURRET_STAT_DEFS[type] || [];
  const color = TYPE_COLORS[type];
  const pts   = meta.turretStatPoints?.[type] || 0;

  if (!defs.length) {
    container.innerHTML = '<p style="color:rgba(255,255,255,0.2);text-align:center;padding:24px;font-size:11px;">No stat tweaks for Pilot.</p>';
    return;
  }

  // Points banner
  const banner = mkEl('div','');
  banner.style.cssText = 'text-align:center;font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.35);margin-bottom:12px;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;';
  banner.textContent = pts + ' STAT POINT' + (pts!==1?'S':'') + ' AVAILABLE';
  container.appendChild(banner);

  defs.forEach(def => {
    const cur   = meta.turretStats?.[type]?.[def.id] || 0;
    const cost  = getStatCost(cur);
    const canUp = pts >= cost && cur < def.max;
    const canDn = cur > 0;

    const row = mkEl('div','stat-row');
    const info = mkEl('div','stat-info');

    const nameRow = mkEl('div','');
    nameRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:3px;';
    const nameEl = mkEl('span','stat-name');
    nameEl.style.color = color;
    nameEl.textContent = def.name;
    nameRow.appendChild(nameEl);
    if (def.unique) {
      const badge = mkEl('span','');
      badge.style.cssText = 'font-size:7px;background:rgba(255,200,0,0.12);color:#ffe600;padding:1px 5px;border-radius:3px;letter-spacing:1px;';
      badge.textContent = 'UNIQUE';
      nameRow.appendChild(badge);
    }
    info.appendChild(nameRow);

    const desc = mkEl('div','stat-desc');
    desc.textContent = def.desc;
    info.appendChild(desc);

    const pips = mkEl('div','stat-pips');
    for (let i = 0; i < def.max; i++) {
      const pip = mkEl('div','stat-pip');
      if (i < cur) { pip.classList.add('filled'); pip.style.background = color; }
      pips.appendChild(pip);
    }
    info.appendChild(pips);
    row.appendChild(info);

    const ctrl = mkEl('div','stat-controls');

    const dn = mkEl('button','stat-btn');
    dn.textContent = '-'; dn.style.color = color;
    if (canDn) { dn.classList.add('enabled'); dn.style.borderColor = 'rgba(255,255,255,0.3)'; dn.style.color = 'rgba(255,255,255,0.6)'; }
    dn.disabled = !canDn;
    dn.addEventListener('click', () => { if (metaSpend(meta,type,def.id,-1)) { saveMeta(meta); renderDrawer(); } });

    const val = mkEl('div','stat-val');
    val.style.color = color; val.textContent = cur;

    const up = mkEl('button','stat-btn');
    up.textContent = canUp ? '+' : (cur >= def.max ? 'MAX' : cost+'pt');
    up.style.color = color;
    if (canUp) { up.classList.add('enabled'); up.style.borderColor = color; }
    up.disabled = !canUp;
    up.addEventListener('click', () => { if (metaSpend(meta,type,def.id,1)) { saveMeta(meta); renderDrawer(); } });

    ctrl.appendChild(dn); ctrl.appendChild(val); ctrl.appendChild(up);
    row.appendChild(ctrl);
    container.appendChild(row);
  });
}

// ── SKILL TREE (SVG) ──────────────────────────────────────────────────────────
function renderSkillTree(container) {
  const meta     = _meta;
  const type     = activeType;
  const skills   = type === 'pilot' ? PILOT_SKILLS : TURRET_SKILLS[type];
  const unlocked = type === 'pilot' ? (meta.pilotSkills||{}) : (meta.turretSkills?.[type]||{});
  const skillPts = type === 'pilot' ? (meta.skillPoints||0) : (meta.turretSkillPoints?.[type]||0);
  const color    = TYPE_COLORS[type];

  if (!skills?.length) return;

  // Pts banner
  const banner = mkEl('div','');
  banner.style.cssText = 'text-align:center;font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.35);margin-bottom:14px;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;';
  banner.textContent = skillPts + ' SKILL POINT' + (skillPts!==1?'S':'') + ' AVAILABLE';
  container.appendChild(banner);

  // Layout: place nodes on a grid
  // Group by branch, arrange branch columns
  const branches = {};
  skills.forEach(s => { const b=s.branch||'core'; if(!branches[b])branches[b]=[]; branches[b].push(s); });
  const branchList = Object.keys(branches);

  const NODE_W   = 90;
  const NODE_H   = 60;
  const COL_GAP  = 14;
  const ROW_GAP  = 40;
  const cols     = branchList.length;
  const maxRows  = Math.max(...branchList.map(b => branches[b].length));
  const svgW     = cols * NODE_W + (cols-1) * COL_GAP + 20;
  const svgH     = maxRows * NODE_H + (maxRows-1) * ROW_GAP + 60;

  // Assign positions
  const nodePos = {};
  branchList.forEach((branch, ci) => {
    branches[branch].forEach((skill, ri) => {
      nodePos[skill.id] = {
        x: 10 + ci * (NODE_W + COL_GAP) + NODE_W/2,
        y: 50 + ri * (NODE_H + ROW_GAP) + NODE_H/2,
        branch, ci, ri,
      };
    });
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox', '0 0 ' + svgW + ' ' + svgH);
  svg.setAttribute('width', '100%');
  svg.style.touchAction = 'pan-y';

  // Branch labels at top
  branchList.forEach((branch, ci) => {
    const bx = 10 + ci * (NODE_W + COL_GAP) + NODE_W/2;
    const isUnlocked = isBranchUnlocked(meta, type, branch);
    const text = document.createElementNS('http://www.w3.org/2000/svg','text');
    text.setAttribute('x', bx); text.setAttribute('y', 20);
    text.setAttribute('text-anchor','middle');
    text.setAttribute('font-family','Orbitron,monospace');
    text.setAttribute('font-size','7');
    text.setAttribute('fill', isUnlocked ? color : '#ff2244');
    text.setAttribute('letter-spacing','1');
    text.textContent = branch.toUpperCase();
    svg.appendChild(text);

    if (!isUnlocked) {
      const lock = document.createElementNS('http://www.w3.org/2000/svg','text');
      lock.setAttribute('x', bx); lock.setAttribute('y', 32);
      lock.setAttribute('text-anchor','middle');
      lock.setAttribute('font-size','7');
      lock.setAttribute('fill','rgba(255,34,68,0.5)');
      lock.textContent = 'QUEST LOCKED';
      svg.appendChild(lock);
    }
  });

  // Edges (req connections)
  skills.forEach(skill => {
    if (!skill.req || !nodePos[skill.id] || !nodePos[skill.req]) return;
    const from = nodePos[skill.req];
    const to   = nodePos[skill.id];
    const isUnlocked = unlocked[skill.req];
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', from.x); line.setAttribute('y1', from.y + NODE_H/2 - 2);
    line.setAttribute('x2', to.x);   line.setAttribute('y2', to.y - NODE_H/2 + 2);
    line.setAttribute('stroke', isUnlocked ? color : 'rgba(255,255,255,0.08)');
    line.setAttribute('stroke-width','1.5');
    line.setAttribute('stroke-dasharray', isUnlocked ? 'none' : '4 3');
    svg.appendChild(line);
  });

  // Nodes
  skills.forEach(skill => {
    const pos  = nodePos[skill.id];
    if (!pos) return;
    const bUnlocked  = isBranchUnlocked(meta, type, skill.branch);
    const isUnlocked = unlocked[skill.id];
    const available  = !isUnlocked && isSkillAvailable(meta, type, skill.id) && bUnlocked;
    const canAfford  = skillPts >= 1;
    const locked     = !isUnlocked && (!available || !bUnlocked);

    const x = pos.x, y = pos.y;
    const hw = NODE_W/2 - 4, hh = NODE_H/2 - 4;

    const g = document.createElementNS('http://www.w3.org/2000/svg','g');

    // Node background rect
    const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('x', x - hw); rect.setAttribute('y', y - hh);
    rect.setAttribute('width', hw*2); rect.setAttribute('height', hh*2);
    rect.setAttribute('rx','5');
    rect.setAttribute('fill', isUnlocked ? color + '22' : 'rgba(0,10,20,0.8)');
    rect.setAttribute('stroke', isUnlocked ? color : available ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)');
    rect.setAttribute('stroke-width', isUnlocked || available ? '1.5' : '1');
    g.appendChild(rect);

    // Checkmark for unlocked
    if (isUnlocked) {
      const chk = document.createElementNS('http://www.w3.org/2000/svg','text');
      chk.setAttribute('x', x); chk.setAttribute('y', y - 6);
      chk.setAttribute('text-anchor','middle');
      chk.setAttribute('font-size','11');
      chk.setAttribute('fill','#00ff88');
      chk.textContent = '✓';
      g.appendChild(chk);
    } else if (locked) {
      const lk = document.createElementNS('http://www.w3.org/2000/svg','text');
      lk.setAttribute('x', x); lk.setAttribute('y', y - 4);
      lk.setAttribute('text-anchor','middle');
      lk.setAttribute('font-size','12');
      lk.setAttribute('fill','rgba(255,255,255,0.15)');
      lk.textContent = '🔒';
      g.appendChild(lk);
    }

    // Skill name (two lines if needed)
    const words = skill.name.split(' ');
    const line1 = words.slice(0, Math.ceil(words.length/2)).join(' ');
    const line2 = words.slice(Math.ceil(words.length/2)).join(' ');
    const nameY = isUnlocked ? y + 8 : locked ? y + 8 : y + 2;

    [line1, line2].filter(Boolean).forEach((txt, i) => {
      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('x', x); t.setAttribute('y', nameY + i*11);
      t.setAttribute('text-anchor','middle');
      t.setAttribute('font-size','8');
      t.setAttribute('font-family','Orbitron,monospace');
      t.setAttribute('fill', isUnlocked ? '#00ff88' : available ? (canAfford ? '#ffffff' : 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.15)');
      t.textContent = txt;
      g.appendChild(t);
    });

    // Cost label
    if (!isUnlocked && available) {
      const cost = document.createElementNS('http://www.w3.org/2000/svg','text');
      cost.setAttribute('x', x); cost.setAttribute('y', y + hh - 5);
      cost.setAttribute('text-anchor','middle');
      cost.setAttribute('font-size','7');
      cost.setAttribute('fill', canAfford ? '#ffe600' : 'rgba(255,255,255,0.25)');
      cost.textContent = canAfford ? '1 SKILL PT' : 'NEED PT';
      g.appendChild(cost);
    }

    // Click handler
    if (available && canAfford) {
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => {
        if (metaUnlock(_meta, type, skill.id)) { saveMeta(_meta); renderDrawer(); }
      });
      // Tap highlight
      g.addEventListener('pointerdown', () => rect.setAttribute('fill', color+'44'));
      g.addEventListener('pointerup',   () => rect.setAttribute('fill', color+'22'));
    }

    svg.appendChild(g);
  });

  container.appendChild(svg);
}

// ── QUESTS ────────────────────────────────────────────────────────────────────
function renderQuests(container) {
  const meta   = _meta;
  const type   = activeType;
  const chains = QUEST_CHAINS[type] || [];
  const color  = TYPE_COLORS[type] || '#ffe600';

  if (!chains.length) {
    const empty = mkEl('p','');
    empty.style.cssText = 'text-align:center;color:rgba(255,255,255,0.2);padding:24px;font-size:11px;';
    empty.textContent = 'No quests for this type yet.';
    container.appendChild(empty);
    return;
  }

  chains.forEach(chain => {
    // Find active tier (first not done)
    let activeTierIdx = 0;
    for (let ti = 0; ti < chain.tiers.length; ti++) {
      const key    = chain.id + '_t' + ti;
      const legKey = chain.id;
      if (meta.quests?.[key] === 'done' || (ti===0 && meta.quests?.[legKey]==='done')) {
        activeTierIdx = ti + 1;
      } else break;
    }
    const allDone    = activeTierIdx >= chain.tiers.length;
    const tier       = allDone ? chain.tiers[chain.tiers.length-1] : chain.tiers[activeTierIdx];
    const prevDone   = activeTierIdx > 0;
    const tierKey    = chain.id + '_t' + activeTierIdx;
    const legKey     = chain.id;
    const prog       = allDone ? tier.target : (getQuestProgress(meta, tierKey) || (activeTierIdx===0 ? getQuestProgress(meta, legKey) : 0) || 0);
    const pct        = Math.min(100, Math.round(prog / tier.target * 100));

    const card = mkEl('div','quest-card');
    card.style.borderColor = allDone ? 'rgba(0,255,136,0.3)' : color + '33';
    if (allDone) card.style.background = 'rgba(0,255,136,0.04)';

    card.innerHTML =
      '<div class="quest-tier-badge">' + chain.name.toUpperCase() + ' &nbsp;&bull;&nbsp; ' +
        (allDone ? 'ALL TIERS COMPLETE' : 'TIER ' + (activeTierIdx+1) + ' OF ' + chain.tiers.length) +
      '</div>' +
      '<div class="quest-name" style="color:' + (allDone?'#00ff88':color) + ';">' +
        (allDone ? chain.name : chain.name) +
      '</div>' +
      '<div class="quest-desc">' + (allDone ? 'All quest tiers complete.' : tier.desc) + '</div>' +
      (!allDone ? '<div class="quest-reward" style="color:' + color + ';border:1px solid ' + color + '44;">' + tier.bonusDesc + '</div>' : '') +
      '<div class="quest-prog-row">' +
        '<div class="quest-prog-track">' +
          '<div class="quest-prog-fill" style="width:' + pct + '%;background:' + (allDone?'#00ff88':color) + ';"></div>' +
        '</div>' +
        '<span class="quest-prog-label">' + (allDone ? 'DONE' : Math.min(prog,tier.target) + '/' + tier.target) + '</span>' +
      '</div>';

    container.appendChild(card);
  });

  // Prestige card (turret types only)
  if (type !== 'pilot') {
    const meta       = _meta;
    const color      = TYPE_COLORS[type];
    const prestiged  = !!meta['prestige_' + type];
    const rank       = meta.turretRank?.[type] || 1;
    const built      = meta['qprog_prestige_built_' + type] || 0;
    const rankReady  = rank >= 5;
    const builtReady = built >= 25;
    const pct        = Math.min(100, Math.round(built / 25 * 100));

    const pcard = mkEl('div','quest-card');
    pcard.style.cssText += ';border-color:' + (prestiged?'rgba(255,230,0,0.4)':'rgba(255,255,255,0.06)') +
      ';background:' + (prestiged?'rgba(255,230,0,0.04)':'rgba(255,255,255,0.01)') + ';margin-top:8px;';

    pcard.innerHTML =
      '<div class="quest-tier-badge" style="color:#ffe600;">PRESTIGE QUEST</div>' +
      '<div class="quest-name" style="color:' + (prestiged?'#ffe600':color) + ';">' +
        (prestiged ? '★ RANK 6 UNLOCKED' : 'Unlock Rank 6') +
      '</div>' +
      '<div class="quest-desc">' +
        (prestiged
          ? 'Prestiged — Rank 6 is now available for this type.'
          : 'Reach Rank 5 AND build 25 max-level (Lv3) ' + type + ' turrets.') +
      '</div>' +
      (!prestiged ?
        '<div style="display:flex;gap:6px;margin-bottom:8px;">' +
          '<span style="font-size:9px;padding:2px 8px;border-radius:4px;background:rgba(255,255,255,0.04);color:' + (rankReady?'#00ff88':'rgba(255,255,255,0.3)') + ';">' +
            (rankReady ? '✓ Rank 5' : 'Rank ' + rank + '/5') +
          '</span>' +
          '<span style="font-size:9px;padding:2px 8px;border-radius:4px;background:rgba(255,255,255,0.04);color:' + (builtReady?'#00ff88':'rgba(255,255,255,0.3)') + ';">' +
            (builtReady ? '✓ 25 Lv3 built' : built + '/25 Lv3') +
          '</span>' +
        '</div>' +
        '<div class="quest-prog-row">' +
          '<div class="quest-prog-track"><div class="quest-prog-fill" style="width:' + pct + '%;background:' + color + ';"></div></div>' +
          '<span class="quest-prog-label">' + built + '/25</span>' +
        '</div>'
      : '');

    container.appendChild(pcard);
  }
}
function isBranchUnlocked(meta, type, branch) {
  if (branch === 'core') return true;
  const chains = QUEST_CHAINS[type] || [];
  const chain  = chains.find(c => c.reward === branch);
  if (!chain) return true;
  return meta.quests?.[chain.id+'_t0']==='done' || meta.quests?.[chain.id]==='done';
}

function mkEl(tag, cls) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  return el;
}

function s(id, v)    { const e=document.getElementById(id); if(e) e.textContent=v; }
function css(id,p,v) { const e=document.getElementById(id); if(e) e.style[p]=v; }

// ── Splash ────────────────────────────────────────────────────────────────────
export function splashTab(tab) {
  ['play','skills','how'].forEach(t => {
    const p = document.getElementById('panel'+t[0].toUpperCase()+t.slice(1));
    const b = document.getElementById('tab'+t[0].toUpperCase()+t.slice(1));
    if (p) p.style.display = t===tab ? (t==='how'?'block':'flex') : 'none';
    if (b) { b.style.background=t===tab?'var(--cyan)':'transparent'; b.style.color=t===tab?'#000':'var(--cyan)'; }
  });
}

// ── Swipe to close ────────────────────────────────────────────────────────────
function initSwipe() {
  const el     = document.getElementById('skillOverlay'); if (!el) return;
  const handle = document.getElementById('skillDragHandle'); if (!handle) return;
  let sy=0,cy=0,drag=false;
  const start=e=>{sy=(e.touches?e.touches[0]:e).clientY;drag=true;el.style.transition='none';};
  const move =e=>{if(!drag)return;cy=(e.touches?e.touches[0]:e).clientY-sy;if(cy>0)el.style.transform='translateY('+cy+'px)';};
  const end  =()=>{if(!drag)return;drag=false;el.style.transition='';if(cy>80){el.style.transform='';closeSkillDrawer();}else el.style.transform='';cy=0;};
  const nh=handle.cloneNode(true);handle.parentNode.replaceChild(nh,handle);
  nh.addEventListener('touchstart',start,{passive:true});
  nh.addEventListener('touchmove', move, {passive:true});
  nh.addEventListener('touchend',  end);
  nh.addEventListener('mousedown', start);
  window.addEventListener('mousemove',move);
  window.addEventListener('mouseup',  end);
}
