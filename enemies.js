// enemies.js — enemy types, spawn, update logic, all draw functions
// Depends on: constants.js, levels.js

// ══════════════════════════════════════════════════════════════
//  ENEMIES
// ══════════════════════════════════════════════════════════════
const enemies = [];
let eSpawnTimer = 0;
let lastSpawnX  = -9999; // world X of last spawned enemy — prevents clustering

// ── Creature roster ────────────────────────────────────────
// label = internal dispatch key (used in draw switch + update)
// name  = display name shown briefly on spawn
// Chapter assignment: controlled by which ETYPES_CHx array the entry lives in.
// To move a creature: cut its row, paste into the target array.
// To add a creature: add row here + drawXxx() + case in drawEnemies dispatch.
const ETYPES_CH1 = [
  // Ch1: Pincher + Swooper (temporarily added for testing swooper mechanic).
  // Remove Swooper from this array to restore Ch1 to Pincher-only.
  {w:32,h:20,spd:1.6,label:'crab',    name:'Pincher',  col:'#e84c3d',acc:'#ff7c6e'},
  {w:30,h:22,spd:1.6,label:'swooper', name:'Swooper',  col:'#1a6b8a',acc:'#4dc8f0'},
];
const ETYPES_CH2 = [
  // Ch2: Pincher (faster) + Idol introduced.
  // Idol is tall and narrow — teaches that not all threats have the same clearance height.
  {w:32,h:20,spd:1.8,label:'crab',    name:'Pincher',  col:'#e84c3d',acc:'#ff7c6e'},
  {w:18,h:42,spd:1.4,label:'totem',   name:'Idol',     col:'#8b6914',acc:'#c9a227'},
];
const ETYPES_CH3 = [
  // Ch3: Pincher + Idol return. Shellback + Bounder introduced.
  // Bounder's hop combined with pits/platforms makes Ch3 the first truly complex chapter.
  {w:32,h:20,spd:2.0,label:'crab',    name:'Pincher',  col:'#e84c3d',acc:'#ff7c6e'},
  {w:18,h:42,spd:1.6,label:'totem',   name:'Idol',     col:'#8b6914',acc:'#c9a227'},
  {w:28,h:26,spd:1.4,label:'turtle',  name:'Shellback',col:'#2e8b57',acc:'#52c97a'},
  {w:24,h:28,spd:1.8,label:'hopper',  name:'Bounder',  col:'#5b2d8e',acc:'#b86ee8'},
  {w:24,h:28,spd:1.8,label:'hopper',  name:'Bounder',  col:'#5b2d8e',acc:'#b86ee8'}, // double weight
];
const ETYPES_CH4 = [
  // Ch4: All prior creatures + Swooper introduced.
  // Swooper is a flying enemy that dives down — requires slide or timing to avoid.
  // Slide (hold-down while running) is unlocked in Ch4 as the new mechanic.
  {w:32,h:20,spd:2.2,label:'crab',    name:'Pincher',  col:'#e84c3d',acc:'#ff7c6e'},
  {w:18,h:42,spd:1.8,label:'totem',   name:'Idol',     col:'#8b6914',acc:'#c9a227'},
  {w:28,h:26,spd:1.6,label:'turtle',  name:'Shellback',col:'#2e8b57',acc:'#52c97a'},
  {w:24,h:28,spd:2.0,label:'hopper',  name:'Bounder',  col:'#5b2d8e',acc:'#b86ee8'},
  {w:30,h:22,spd:2.0,label:'swooper', name:'Swooper',  col:'#1a6b8a',acc:'#4dc8f0'},
];

function getETypes() {
  if(chapter===CHAPTER.ONE)  return ETYPES_CH1;
  if(chapter===CHAPTER.TWO)  return ETYPES_CH2;
  if(chapter===CHAPTER.THREE)return ETYPES_CH3;
  return ETYPES_CH4;
}

function spawnEnemy() {
  const pool = getETypes();
  const t = pool[irnd(0, pool.length-1)];
  const spawnX = player.x + canvas.width * 0.65 + rnd(0, 200);
  // Only spawn on ground
  const isSwooper = t.label==='swooper';
  // Minimum world-space gap between any two enemies.
  // Prevents clusters that make sections impassable.
  // Ground and air enemies share the same gap budget.
  const MIN_ENEMY_GAP = 220;
  if(spawnX - lastSpawnX < MIN_ENEMY_GAP) return false;
  if (!isSwooper && !isGroundAt(spawnX)) return false;
  // Swooper spawns at a fixed high canvas Y — independent of player position.
  // It hovers there, then periodically dips toward the player's head level.
  // Using a fixed canvas Y prevents jitter from player vertical movement.
  // Swooper hovers one full swooper-height above player's head.
  // Player head = GY() - PH. Spawns t.h above that, so it's clearly in view.
  // Spawn two full swooper-heights above player head — clearly visible, not cramped
  const spawnY = isSwooper ? GY() - PH - t.h*2 - rnd(10, 20) : GY() - t.h/2;
  enemies.push({
    x: spawnX,
    y: spawnY,
    w:t.w, h:t.h, spd: t.spd + score*0.003,
    label:t.label, name:t.name, col:t.col, acc:t.acc,
    anim: rnd(0, Math.PI*2),
    grounded: !isSwooper,
    vy: 0,
    hopTimer: rnd(0, 1200),   // stagger hopper timing so they don't all bounce in sync
    swoopTimer: rnd(1200,2500), // ms before first dip
    swooping:   false,           // true during active dip cycle
    swoopPhase: 'down',          // 'down' | 'hold' | 'up'
    swoopHold:  0,               // ms spent at bottom of dip
    baseY: spawnY,               // fixed hover altitude (canvas Y, not world Y)
    nameTimer: 1800,
  });
  lastSpawnX = spawnX;
  return true; // successfully spawned
}

function updateEnemies(dt) {
  if (gameState !== 'playing') return;

  eSpawnTimer += dt;
  const interval = Math.max(1400, 3500 - score * 12);
  if (eSpawnTimer >= interval) {
    const spawned = spawnEnemy();
    if(spawned) eSpawnTimer = 0;
    else eSpawnTimer = interval * 0.6; // retry sooner if spawn was blocked
  }

  const gy = GY();
  for (let i = enemies.length-1; i >= 0; i--) {
    const e = enemies[i];
    e.x  -= e.spd;
    e.anim += dt * 0.004;
    if(e.nameTimer > 0) e.nameTimer -= dt;

    // Gravity for enemies (so they fall into pits)
    if (!e.grounded) e.vy += 0.55;
    e.y += e.vy;

    // Check ground under enemy
    const eGround = isGroundAt(e.x);
    if (e.y + e.h/2 >= gy) {
      if (!eGround) {
        enemies.splice(i, 1);
        // No score for pit kills — stomp kills will be added later.
        continue;
      } else {
        e.y = gy - e.h/2; e.vy = 0; e.grounded = true;
      }
    } else {
      if (e.grounded && !isGroundAt(e.x)) e.grounded = false;
    }

    // Hopper hop logic — periodic small bounce.
    // Design intent: hop interval ~1.5s, upward velocity is ~40% of player min jump.
    // This makes the hopper's effective height variable and unpredictable.
    if(e.label==='hopper' && e.grounded){
      e.hopTimer += dt;
      if(e.hopTimer > 1500){
        e.vy = -5.5;  // small hop — enough to be awkward, not enough to sail over pits
        e.grounded = false;
        e.hopTimer = 0;
      }
    }

    // ── Swooper flight + dive logic ──────────────────────────
    // Swooper spawns near the top of the canvas, dives toward player HEAD level.
    // Pull-out happens at player head height — not ground.
    // Player counters: jump OVER the swoop path, or SLIDE under it.
    if(e.label === 'swooper'){
      // Swooper hovers at baseY (fixed canvas altitude set on spawn).
      // Every swoopTimer ms it dips smoothly down to player's head level,
      // holds there briefly, then rises back to baseY.
      // Player reads: if swooper is descending → jump or slide NOW.
      // baseY is fixed so hover doesn't jitter with player vertical movement.

      e.swoopTimer -= dt;

      if(!e.swooping && e.swoopTimer <= 0){
        e.swooping   = true;
        e.swoopPhase = 'down'; // 'down' → 'hold' → 'up'
        e.swoopHold  = 0;
      }

      if(e.swooping){
        // Target = top of Lester's head. Never goes to ground.
        // player.y is centre; player.y - PH/2 = top of head.
        const targetY = Math.min(player.y - PH/2, GY() - e.h - 20);
        if(e.swoopPhase === 'down'){
          e.y += 4.5;   // fast descent
          if(e.y >= targetY){ e.y = targetY; e.swoopPhase = 'hold'; e.swoopHold = 0; }
        } else if(e.swoopPhase === 'hold'){
          e.swoopHold += dt;
          if(e.swoopHold > 700){ e.swoopPhase = 'up'; } // hold at head level — long enough to react
        } else {
          e.y -= 3.0;   // rise back up
          if(e.y <= e.baseY){ e.y = e.baseY; e.swooping = false; e.swoopTimer = rnd(1500,3000); }
        }
      } else {
        // Gentle hover bob at base altitude
        e.y = e.baseY + Math.sin(e.anim * 1.8) * 5;
      }

      e.y = Math.max(10, Math.min(GY() - e.h - 8, e.y));
    }

    // Remove if far behind or in catapult zone
    if (e.x < player.x - canvas.width * 1.5) { enemies.splice(i, 1); continue; }

    // Collision with player
    if (gameState === 'playing') {
      const m=6;
      const ph = player.sliding ? PH*0.35 : (player.crouching||player.ducking) ? PH*0.6 : PH;
      if (player.x+PW/2-m > e.x-e.w/2 && player.x-PW/2+m < e.x+e.w/2 &&
          player.y+ph/2-m > e.y-e.h/2 && player.y-ph/2+m < e.y+e.h/2) {

        // Stomp kill: player falling and their centre is above enemy centre.
        // Requires Stomp unlock. Rewards aggressive play (Mario feel).
        const stompUnlock = getUnlock('stomp');
        const playerAbove   = player.y < e.y - e.h * 0.25;
        const playerFalling = player.vy > 0;
        if(stompUnlock && stompUnlock.owned && playerAbove && playerFalling){
          player.vy = -10;       // bounce Lester upward
          player.grounded = false;
          score += 25;           // stomp bonus
          enemies.splice(i, 1);
          continue;
        }

        // Shield: absorb the hit, break the shield, destroy the enemy.
        // Shield repairs after 8s (see game.js). One hit per shield charge.
        const shieldUnlock = getUnlock('shield');
        if(shieldUnlock && shieldUnlock.owned && !player.shieldBroken){
          player.shieldBroken      = true;
          player.shieldFlash       = 400; // ms red flash
          player.shieldRepairTimer = 0;
          enemies.splice(i, 1);
          continue;
        }

        // No protection — game over
        gameState='gameover'; stateTimer=0; deathCount++; homeMenuCursor=0; saveScores();
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  CATAPULT
// ══════════════════════════════════════════════════════════════
// Draw hopper enemy — small alien creature that bounces periodically.
// Design intent: wide body, big eyes, stubby legs. Cute but threatening.
// The hop squash/stretch gives visual feedback of when it's about to jump.
function drawHopper(e) {
  const squash = e.grounded ? 1 : 0.7; // squish when on ground, stretch mid-air
  const stretch = e.grounded ? 1 : 1.3;
  ctx.save();
  ctx.scale(squash, stretch);
  // Body — round, wide, alien purple
  ctx.fillStyle=e.col;
  ctx.beginPath(); ctx.ellipse(0,0,e.w/2,e.h/2*0.8,0,0,Math.PI*2); ctx.fill();
  // Belly highlight
  ctx.fillStyle=e.acc;
  ctx.beginPath(); ctx.ellipse(0,3,e.w/2*0.55,e.h/2*0.4,0,0,Math.PI*2); ctx.fill();
  // Eyes — big, expressive
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.ellipse(-6,-5,5,6,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 6,-5,5,6,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a0030';
  ctx.beginPath(); ctx.ellipse(-6,-5,2.5,3.5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 6,-5,2.5,3.5,0,0,Math.PI*2); ctx.fill();
  // Shine
  ctx.fillStyle='rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.ellipse(-7,-7,1.2,1.5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 5,-7,1.2,1.5,0,0,Math.PI*2); ctx.fill();
  // Stubby legs (visible when on ground)
  if(e.grounded){
    ctx.fillStyle=e.col;
    ctx.beginPath(); ctx.ellipse(-7,e.h/2*0.6,4,3,0.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 7,e.h/2*0.6,4,3,-0.3,0,Math.PI*2); ctx.fill();
  }
  // Antenna
  ctx.strokeStyle=e.acc; ctx.lineWidth=1.5; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-4,-e.h/2*0.8); ctx.lineTo(-7,-e.h/2*0.8-8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 4,-e.h/2*0.8); ctx.lineTo( 7,-e.h/2*0.8-8); ctx.stroke();
  ctx.fillStyle=e.acc;
  ctx.beginPath(); ctx.arc(-7,-e.h/2*0.8-9,2.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 7,-e.h/2*0.8-9,2.5,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

// drawCatapult: draws catapult at given world X.
// Reused for both Ch1 (CATAPULT_X) and Ch2 (CATAPULT_X2).
// Swooper — a winged creature that flies and dives.
// Design intent: thin horizontal silhouette so slide (low profile) clearly counters it.
// Wings animate with a flap cycle; body tilts during dive.
function drawSwooper(e) {
  const diving = e.swooping;
  const tilt = diving ? 0.5 : -0.1;
  ctx.save();
  ctx.rotate(tilt);

  // Body — sleek, horizontal
  ctx.fillStyle=e.col;
  ctx.beginPath(); ctx.ellipse(0,0,e.w/2,e.h/2,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=e.acc;
  ctx.beginPath(); ctx.ellipse(-2,-2,e.w/3,e.h/3,-0.2,0,Math.PI*2); ctx.fill();

  // Wings — animated flap
  const flapAngle = diving ? 0.3 : Math.sin(e.anim*4)*0.5;
  ctx.fillStyle=e.col;
  // Left wing
  ctx.save(); ctx.translate(-e.w/2+4, 0); ctx.rotate(-flapAngle);
  ctx.beginPath(); ctx.ellipse(-10,0,14,5,-0.2,0,Math.PI*2); ctx.fill();
  ctx.restore();
  // Right wing
  ctx.save(); ctx.translate(e.w/2-4, 0); ctx.rotate(flapAngle);
  ctx.beginPath(); ctx.ellipse(10,0,14,5,0.2,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // Eyes — beady, forward-facing
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.ellipse(e.w/2-5,-3,3,3,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#0a1a2a';
  ctx.beginPath(); ctx.ellipse(e.w/2-4,-3,1.5,1.5,0,0,Math.PI*2); ctx.fill();

  // Beak
  ctx.fillStyle=e.acc;
  ctx.beginPath();
  ctx.moveTo(e.w/2+2,-1); ctx.lineTo(e.w/2+8,0); ctx.lineTo(e.w/2+2,2);
  ctx.closePath(); ctx.fill();

  ctx.restore();
}

function drawCatapult(ts, worldX) {
  const sx = wx(worldX);
  const gy = GY();
  if(sx < -200 || sx > canvas.width+200) return;

  // Base / wheels
  ctx.fillStyle='#6b3a1f';
  ctx.fillRect(sx-18,gy-28,36,28);
  ctx.fillStyle='#4a2810'; ctx.fillRect(sx-22,gy-8,44,10);
  // Wheels
  [sx-14, sx+14].forEach(wx2=>{
    ctx.beginPath(); ctx.arc(wx2,gy+2,10,0,Math.PI*2);
    ctx.fillStyle='#3a1f0a'; ctx.fill();
    ctx.strokeStyle='#8b6020'; ctx.lineWidth=2; ctx.stroke();
    ctx.beginPath(); ctx.arc(wx2,gy+2,4,0,Math.PI*2);
    ctx.fillStyle='#c9a227'; ctx.fill();
  });

  // Arm (rotates based on catapult state)
  let armAngle = -Math.PI * 0.7; // default: arm back (loaded)
  if(catapultPhase===2||catapultPhase===3){
    // launch: arm swings forward
    const t = Math.min(catapultTimer/300,1);
    armAngle = lerp(-Math.PI*0.7, Math.PI*0.25, t);
  }
  ctx.save();
  ctx.translate(sx, gy-20);
  ctx.rotate(armAngle);
  ctx.fillStyle='#8b4a24'; ctx.fillRect(-4,-50,8,50); // arm beam
  // Cup at tip
  ctx.beginPath(); ctx.arc(0,-52,8,0,Math.PI*2);
  ctx.fillStyle='#6b3a1f'; ctx.fill();
  ctx.restore();
  // Counterweight
  ctx.save();
  ctx.translate(sx,gy-20);
  ctx.rotate(armAngle);
  ctx.fillStyle='#333';
  ctx.fillRect(-7,10,14,18);
  ctx.restore();

  // "LAUNCH" sign near catapult
  if(catapultPhase===0){
    const dist = worldX - player.x;
    if(dist < 500 && dist > 0){
      const alpha = Math.max(0, 1-(dist-100)/300);
      ctx.save();
      ctx.globalAlpha=alpha*Math.abs(Math.sin(ts*0.003));
      ctx.fillStyle='#ffd66b'; ctx.font='bold 14px Courier New'; ctx.textAlign='center';
      ctx.fillText('→ CATAPULT →', sx, gy-60);
      ctx.restore();
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  ENEMIES DRAWING
// ══════════════════════════════════════════════════════════════
function drawEnemies() {
  for(const e of enemies){
    const sx=wx(e.x); if(sx<-100||sx>canvas.width+100) continue;
    const bob = e.grounded ? Math.sin(e.anim)*2 : 0;
    ctx.save(); ctx.translate(sx,e.y+bob);
    if(e.label==='crab')          drawCrab(e);
    else if(e.label==='totem')    drawTotem(e);
    else if(e.label==='hopper')   drawHopper(e);
    else if(e.label==='swooper')  drawSwooper(e);
    else                          drawTurtle(e);
    // Exclamation mark — always shown
    ctx.fillStyle='rgba(255,220,100,0.85)'; ctx.font='bold 12px Courier New'; ctx.textAlign='center';
    ctx.fillText('!',0,-e.h/2-10);
    // Creature name fades in on spawn, then disappears
    if(e.nameTimer > 0){
      const na = Math.min(e.nameTimer/400, 1) * Math.min(e.nameTimer, 400)/400;
      ctx.save(); ctx.globalAlpha=na;
      ctx.fillStyle='#fff'; ctx.font='9px Courier New'; ctx.textAlign='center';
      ctx.fillText(e.name, 0, -e.h/2-22);
      ctx.restore();
    }
    ctx.restore();
  }
}
function drawCrab(e){
  ctx.fillStyle=e.col; ctx.beginPath(); ctx.ellipse(0,0,e.w/2,e.h/2,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=e.acc; ctx.beginPath(); ctx.ellipse(-4,-4,e.w/4,e.h/4,-0.3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=e.col;
  ctx.beginPath(); ctx.ellipse(-e.w/2-6,-2,7,5,-0.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(e.w/2+6,-2,7,5,0.4,0,Math.PI*2); ctx.fill();
  ['#fff','#111'].forEach((c,ci)=>{
    ctx.fillStyle=c;
    const r=ci?1.5:3;
    ctx.beginPath(); ctx.arc(-5,-e.h/2-3,r,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5,-e.h/2-3,r,0,Math.PI*2); ctx.fill();
  });
}
function drawTotem(e){
  ctx.fillStyle=e.col; ctx.fillRect(-e.w/2,-e.h/2,e.w,e.h);
  ctx.strokeStyle='#5a3d00'; ctx.lineWidth=1;
  [-8,0,8].forEach(dy=>{ctx.beginPath();ctx.moveTo(-e.w/2,dy);ctx.lineTo(e.w/2,dy);ctx.stroke();});
  ctx.fillStyle=e.acc; ctx.fillRect(-e.w/2+2,-e.h/2+2,e.w-4,18);
  ctx.fillStyle='#3a1800'; ctx.fillRect(-6,-e.h/2+5,4,4); ctx.fillRect(2,-e.h/2+5,4,4);
  ctx.strokeStyle='#3a1800'; ctx.beginPath(); ctx.moveTo(-5,-e.h/2+14); ctx.lineTo(5,-e.h/2+14); ctx.stroke();
}
function drawTurtle(e){
  ctx.fillStyle=e.col; ctx.beginPath(); ctx.ellipse(0,-2,e.w/2,e.h/2-2,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=e.acc; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(0,-e.h/2+2); ctx.lineTo(0,e.h/2-6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-e.w/2+4,-4); ctx.lineTo(e.w/2-4,-4); ctx.stroke();
  ctx.fillStyle='#3da85a'; ctx.beginPath(); ctx.ellipse(e.w/2+4,-4,7,6,0.3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(e.w/2+7,-6,1.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#3da85a';
  ctx.beginPath(); ctx.ellipse(-e.w/2+2,e.h/2-4,5,4,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(e.w/2-2,e.h/2-4,5,4,0,0,Math.PI*2); ctx.fill();
}

// ══════════════════════════════════════════════════════════════
//  CHARACTER DRAWING
// ══════════════════════════════════════════════════════════════
