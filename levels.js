// levels.js — level config, terrain generation, ground checks
// Depends on: constants.js

function buildTerrain() {
  terrain.length = 0;
  platforms.length = 0;
  terrainHead = 0;

  if (chapter === CHAPTER.ONE) {
    // Ch1: flat ground only — player learns movement + tap-jump before any hazards.
    // Catapult at CATAPULT_X is the exit. Fog wall creates urgency.
    terrain.push({ type:'ground', x:0, w:CATAPULT_X + 600 });
    terrainHead = CATAPULT_X + 600;
  } else if (chapter === CHAPTER.TWO) {
    // Ch2: pits introduced, NO platforms (platforms are Ch3's new mechanic).
    // New enemy: hopper. Exit is a second catapult at CATAPULT_X2.
    // Charge jump mechanic discovered organically here.
    terrain.push({ type:'ground', x:0, w:500 });
    terrainHead = 500;
    genTerrain(CATAPULT_X2 + 600);
  } else if (chapter === CHAPTER.THREE) {
    // Ch3: pits + platforms + Bounder. Catapult exit at CATAPULT_X3.
    terrain.push({ type:'ground', x:0, w:400 });
    terrainHead = 400;
    genTerrain(CATAPULT_X3 + 600);
  } else {
    // Ch4: hardest tier. Large pits with stepping stones, Swooper debuts, slide available.
    // Infinite runner — no fixed exit yet. Terrain generates ahead of the player.
    terrain.push({ type:'ground', x:0, w:400 });
    terrainHead = 400;
    genTerrain(4000);
  }
}

function genTerrain(upTo) {
  // Design intent for fair pit placement:
  // 1. NEVER place a pit immediately after another pit — player needs ground to land and re-charge.
  // 2. Ground segment AFTER a pit must be wide enough to land + crouch + jump again.
  //    MIN_LANDING = 280px — enough for Lester to touch down, decelerate, and charge jump.
  // 3. Ground segments BEFORE a pit can be shorter — 200px min is fine since player is already running.
  // 4. Pit width is capped so even a minimal charge jump (tap) can clear it.
  //    MAX_PIT at full diff = 230px. A tap jump covers ~260px at walking speed — always clearable.
  const MIN_LANDING = 280;  // minimum ground after a pit — always enough to land + re-jump
  const MIN_GROUND  = 200;
  const MAX_GROUND  = 360;

  // Per-chapter pit sizing:
  // Ch2: small  (90–120px)  — tap jump clears easily, no ledge needed
  // Ch3: medium (130–160px) — needs a committed jump, still clearable without ledge
  // Ch4: large  (170–210px) — stepping stone in middle is the intended path,
  //                           full charge jump can still clear it as a skill expression
  const PIT_MIN = chapter===CHAPTER.TWO ? 90  : chapter===CHAPTER.THREE ? 130 : 170;
  const PIT_MAX = chapter===CHAPTER.TWO ? 120 : chapter===CHAPTER.THREE ? 160 : 210;

  let lastWasPit = false;

  while (terrainHead < upTo) {
    const diff = Math.min(terrainHead / 5000, 1);
    const pitChance = (chapter >= CHAPTER.TWO) ? 0.30 + diff*0.15 : 0;
    const canPit = !lastWasPit && Math.random() < pitChance;

    if (canPit) {
      const pw = irnd(PIT_MIN, PIT_MAX);
      terrain.push({ type:'pit', x:terrainHead, w:pw });

      // Stepping stone: Ch3+ large pits get a platform centred in the pit.
      // Height: 100-130px above ground — requires a deliberate jump from the edge,
      // but NOT a full charge (that would make it feel unfair on first encounter).
      // Width: narrow (42-56px) — you have to commit to landing on it.
      // Design intent: for large pits this IS the intended path.
      // Skilled players can still charge-clear the whole pit without using it.
      if(chapter >= CHAPTER.THREE && pw > 130){
        const gy = GY();
        const stoneW = irnd(42, 56);
        const stoneX = terrainHead + pw/2 - stoneW/2;
        platforms.push({
          x: stoneX,
          y: gy - irnd(100, 130),   // high — requires a real jump, not a tap
          w: stoneW, h: 12,
          style: 'stone',
          isStepping: true,
        });
      }

      terrainHead += pw;
      lastWasPit = true;
    } else {
      // Ground segment: wider after a pit to guarantee safe landing room
      const minW = lastWasPit ? MIN_LANDING : MIN_GROUND;
      const gw = irnd(minW, MAX_GROUND);
      terrain.push({ type:'ground', x:terrainHead, w:gw });

      // Platforms ONLY in Ch3 — this is their debut mechanic.
      // Design intent: player needs to discover pits + hopper in Ch2 without
      // platform complexity. Platforms in Ch3 add vertical play.
      if (chapter === CHAPTER.THREE && Math.random() < 0.55) {
        const gy = GY();
        const plw=irnd(80,160), plh=14;
        const plx=terrainHead+irnd(24,gw-plw-24);
        const ply=gy-irnd(72,140);
        const style=['stone','wood','crystal'][irnd(0,2)];
        platforms.push({x:plx,y:ply,w:plw,h:plh,style});
        if (Math.random()<0.35 && plw>90) {
          const plw2=irnd(50,plw-20);
          platforms.push({x:plx+irnd(0,plw-plw2),y:ply-irnd(55,85),w:plw2,h:plh,style});
        }
      }
      terrainHead += gw;
      lastWasPit = false;
    }
  }
}

function isGroundAt(worldX) {
  for (const s of terrain) {
    if (worldX >= s.x && worldX < s.x + s.w) return s.type === 'ground';
  }
  return chapter === CHAPTER.ONE; // ch1 always ground
}

// ══════════════════════════════════════════════════════════════
//  PLAYER
