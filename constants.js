// constants.js — canvas setup, helpers, shared state, skills, unlocks, scoring
// Load FIRST — everything depends on this.


// ══════════════════════════════════════════════════════════════
//  CANVAS SETUP
// ══════════════════════════════════════════════════════════════
const canvas  = document.getElementById('game');
const ctx     = canvas.getContext('2d');
const chargeCanvas = document.getElementById('charge-canvas');
const chargeCtx    = chargeCanvas.getContext('2d');

function resize() {
  const w = document.getElementById('game-wrapper');
  canvas.width  = w.clientWidth;
  canvas.height = w.clientHeight;
}
resize();
window.addEventListener('resize', resize);

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════
function rnd(a,b){ return a + Math.random()*(b-a); }
function irnd(a,b){ return Math.floor(rnd(a,b+0.99)); }
const GY = () => canvas.height - 55;
function wx(x){ return x - cameraX; }
function lerp(a,b,t){ return a+(b-a)*t; }

// ══════════════════════════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════════════════════════
const CHAPTER = { ONE:1, TWO:2, THREE:3, FOUR:4 };

let chapter        = CHAPTER.ONE;
let chapterTimer   = 0;
let gameState      = 'splash';
// gameState values:
//   'home'        — main menu (shown after death, not on first load which auto-starts)
//   'playing'     — normal gameplay
//   'catapult'    — cutscene: Lester being launched
//   'chaptercard' — between-chapter fade card
//   'gameover'    — death screen with Continue / Home options
// Design intent: home screen only shown AFTER first death — player is dropped
// straight into Ch1 on first load. Keeps the cold-open feel.
let stateTimer     = 0;
let score          = 0;
let homeMenuCursor = 0; // 0=Continue, 1=New Game, 2=How To Play
let splashDone     = false; // latched after first splash dismiss
let deathCount     = 0; // tracks if player has died at least once (gates home screen access)
let howToPlayOpen  = false;
let cameraX        = 0;
let lastTime       = 0;

// ── Fog wall (Chapter 1 only) ──────────────────────────────
// Design intent: fog creates urgency without being the primary threat.
// FOG_DELAY gives the player breathing room to learn controls first.
// FOG_SPEED is slow — it's a motivator, not instant death.
// The fog's right edge (fogX) is in world-space, compared against player.x.
const FOG_DELAY    = 10000;  // ms before fog starts (10s — quick for testing, raise to 25s for release)
const FOG_SPEED    = 0.7;    // px per frame at 60fps — slow creep
let fogX           = -800;   // world-space X of fog's RIGHT edge — far off-screen left until FOG_DELAY fires

// ── Catapult (Chapter 1 exit / Chapter 2 transition) ───────
// Design intent: catapult is the REWARD for surviving Ch1.
// It should be visible before you reach it so it reads as a clear goal.
// IMPORTANT: catapultPhase is set to 1 at trigger time (NOT 0).
// Phase 0 is only used by drawCatapult for idle rendering before trigger.
// Do NOT reset catapultPhase to 0 on trigger — that causes an infinite loop.
let catapultPhase  = 0;      // 0=idle(pre-trigger), 1=loading, 2=launching, 3=flying
let catapultTimer  = 0;
const CATAPULT_X   = 900;    // Ch1 catapult — reachable before fog closes in
let activeCatapultX = CATAPULT_X; // which catapult is currently active (set at trigger time)

// ── Chapter 2 catapult (Ch2 exit → Ch3) ─────────────────────
// Design intent: Ch2 has the same exit fantasy as Ch1 — another catapult.
// Placed far enough that the player faces pits + hopper enemy before reaching it.
// No bonfire in Ch2 — the bonfire is the Ch3 reward.
const CATAPULT_X2  = 2000;   // world X of the Ch2 catapult

// ── Bonfire (Chapter 3 only — skill menu) ───────────────────
// Moved to Ch3 so the skill system is a late-game reward.
// Design intent: player discovers skills AFTER experiencing all basic mechanics.
const CATAPULT_X3  = 2400;   // world X of the Ch3 catapult (replaces bonfire)
// No bonfire — skill menu opens after Ch3 catapult launches
let bonfireReached = false;  // reused as 'catapult3Reached' to prevent re-trigger
let pendingChapter = CHAPTER.TWO;  // chapter we're transitioning INTO
let skillMenuOpen  = false;
// 10 skill slots — only the first is designed; rest are ??? until we decide.
// Design intent: skills are discovered by the player, not explained up front.
// Spring Legs (slot 0): stackable charge-speed buff. Each purchase costs more.
//   Effect applied in update() — chargeTime += dt * springLegsMultiplier.
//   DO NOT cap stacks — the escalating cost is the natural limiter.
// ── SKILLS — stackable stat upgrades ─────────────────────
// Buy multiple times, cost rises 50% each stack.
// Effect must be wired in update() or physics code.
const BASE_SPRING_COST = 15;
const SKILLS = [
  { id:'spring',    name:'Spring Legs',    desc:'+10% charge speed per stack', cost:BASE_SPRING_COST, stacks:0, stackable:true  },
  { id:'shield_str',name:'Shield Strength',desc:'+1 hit absorbed per stack',   cost:25,               stacks:0, stackable:true  },
  { id:'???2',      name:'???',            desc:'...',                          cost:60,               stacks:0, stackable:false },
  { id:'???3',      name:'???',            desc:'...',                          cost:80,               stacks:0, stackable:false },
  { id:'???4',      name:'???',            desc:'...',                          cost:100,              stacks:0, stackable:false },
];

// ── UNLOCKS — one-time mechanic unlocks ────────────────────
// Buy once to enable the mechanic. Toggleable unlocks can be turned on/off.
// To add: push entry here + wire effect in update()/render().
const UNLOCKS = [
  // Toggleable unlocks
  { id:'autorun',    name:'Auto-Run',       desc:'Lester runs automatically. Earn more score.',  cost:40,  owned:false, active:false, toggleable:true  },
  // Stackable duration unlock — slide is free at Ch4, but duration upgrades cost SP
  { id:'slide_dur',  name:'Slide Duration', desc:'+200ms slide per stack (base 400ms free)',     cost:35,  owned:false, active:false, toggleable:false, stacks:0, stackable:true },
  // One-time mechanic unlocks
  { id:'stomp',      name:'Stomp',          desc:'Land on enemies to defeat them.',               cost:50,  owned:false, active:false, toggleable:false },
  { id:'shield',     name:'Shield',         desc:'Absorb one hit before dying.',                  cost:60,  owned:false, active:false, toggleable:false },
  { id:'???u1',      name:'???',            desc:'...',                                            cost:120, owned:false, active:false, toggleable:false },
];

let skillPoints = 0;
let menuTab     = 0;  // 0=SKILLS, 1=UNLOCKS
let skillCursor = 0;

function hasUnlock(id){ return UNLOCKS.find(u=>u.id===id)?.owned ?? false; }
function getUnlock(id){ return UNLOCKS.find(u=>u.id===id); }

function getSpringLegsMultiplier() {
  const sk = SKILLS.find(s=>s.id==='spring');
  return 1 + (sk ? sk.stacks : 0) * 0.10;
}
function getShieldStrength() {
  const sk = SKILLS.find(s=>s.id==='shield_str');
  return sk ? sk.stacks : 0;
}


// ── Persistent scoring ─────────────────────────────────────
// Design intent: highScore rewards skill, totalScore rewards dedication.
// Both stored in localStorage so they survive page refreshes.
let highScore   = parseFloat(localStorage.getItem('uh_highscore')   || '0');
let totalScore  = parseFloat(localStorage.getItem('uh_totalscore')  || '0');
// SP persists across sessions — players keep their points between visits
skillPoints = parseFloat(localStorage.getItem('uh_skillpoints') || '0');

function saveScores() {
  if (score > highScore) highScore = score;
  totalScore += score;
  // Award skill points on death — accumulate across runs.
  // Design intent: dying still feels rewarding. Points persist via localStorage.
  skillPoints += Math.floor(score / 5);
  const savedSP = parseFloat(localStorage.getItem('uh_skillpoints') || '0');
  const totalSP = savedSP + Math.floor(score / 5);
  localStorage.setItem('uh_skillpoints',  totalSP.toFixed(0));
  localStorage.setItem('uh_highscore',    highScore.toFixed(1));
  localStorage.setItem('uh_totalscore',   totalScore.toFixed(1));
}

// ══════════════════════════════════════════════════════════════
//  WORLD / TERRAIN
// ══════════════════════════════════════════════════════════════
const terrain   = [];
const platforms = [];
let   terrainHead = 0;

