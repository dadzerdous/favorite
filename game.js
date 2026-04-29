// game.js — main loop, update, render, input handlers, startChapter
// Load LAST — depends on all other modules.

// ══════════════════════════════════════════════════════════════
//  CATAPULT SEQUENCE UPDATE
// ══════════════════════════════════════════════════════════════
function updateCatapult(dt) {
  catapultTimer += dt;

  // Phase 0 is handled in update() — we should never arrive here at phase 0.
  // Phases: 1=loading in cup, 2=arm swings, 3=player flies.
  if(catapultPhase===1){
    // Load: lock player in catapult cup. activeCatapultX set at trigger time.
    player.x = activeCatapultX + 2;
    player.y = GY() - PH/2 - 28;
    player.vx=0; player.vy=0; player.grounded=false;
    if(catapultTimer > 1200){ catapultPhase=2; catapultTimer=0; }
  } else if(catapultPhase===2){
    // Launch arm swing
    player.x = activeCatapultX + 2;
    player.y = GY() - PH/2 - 28 - catapultTimer*0.08;
    if(catapultTimer > 300){
      catapultPhase=3; catapultTimer=0;
      player.vy=-22; player.vx=6; player.flying=true;
    }
  } else if(catapultPhase===3){
    // Player flies through air
    player.vy += 0.35; // gentle gravity during flight
    player.x += player.vx;
    player.y += player.vy;
    // Slow horizontal
    player.vx *= 0.995;
    if(catapultTimer > 2200){
      // Transition to chapter card
      // Ch3 catapult leads to skill menu then chapter card (Ch4 is TBD/stub)
      // Ch1 -> Ch2, Ch2 -> Ch3, Ch3 -> skill menu then Ch4
      if(chapter===CHAPTER.THREE){
        // Ch3 catapult goes straight to Ch4 — no skill menu interrupt.
        // Skill menu lives on the death screen now.
        pendingChapter=CHAPTER.FOUR;
        gameState='chaptercard'; stateTimer=0;
      } else {
        pendingChapter = chapter===CHAPTER.ONE ? CHAPTER.TWO : CHAPTER.THREE;
        gameState='chaptercard'; stateTimer=0;
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  RESET
// ══════════════════════════════════════════════════════════════
function startChapter(ch, isNewGame=false) {
  chapter=ch; chapterTimer=0;
  gameState='playing'; stateTimer=0;
  // Score accumulates across ALL chapters in a run — only reset on New Game or death.
  // Design intent: skill points at bonfire reflect the whole journey, not just Ch3.
  if(isNewGame) score=0;
  cameraX=0;
  fogX=-800; eSpawnTimer=0;  // reset fog far off-screen — it only appears after FOG_DELAY
  enemies.length=0;
  catapultPhase=0; catapultTimer=0; activeCatapultX=CATAPULT_X;
  bonfireReached=false; skillMenuOpen=false;
  buildTerrain();
  resetPlayer();
  jIcon.textContent='↑';
  jLabelEl.textContent='Jump';
}

// ══════════════════════════════════════════════════════════════
//  UPDATE
// ══════════════════════════════════════════════════════════════
function update(dt) {
  stateTimer += dt;

  if(gameState==='gameover') return;
  if(gameState==='home') return;
  if(gameState==='splash') return;
  // skillMenu is now on death screen — doesn't pause gameplay

  if(gameState==='chaptercard') {
    // Wait for tap (handled in input listener)
    return;
  }

  if(gameState==='catapult'){
    updateCatapult(dt);
    // Still scroll camera
    const tc=player.x-canvas.width*0.4;
    cameraX+=(tc-cameraX)*0.05;
    return;
  }

  // ── PLAYING ──
  chapterTimer += dt;
  score += dt * 0.01;

  // Shield flash timer — visual feedback when shield absorbs a hit
  if(player.shieldFlash > 0) player.shieldFlash -= dt;

  // Repair shield: if player owns shield unlock but it's broken,
  // it repairs automatically after 8 seconds (souls-like feel).
  // Design intent: shield is a safety net, not permanent invincibility.
  if(player.shieldBroken){
    if(!player.shieldRepairTimer) player.shieldRepairTimer = 0;
    player.shieldRepairTimer += dt;
    if(player.shieldRepairTimer >= 8000){
      player.shieldBroken = false;
      player.shieldRepairTimer = 0;
    }
  } else {
    player.shieldRepairTimer = 0;
  }

  // Fog wall advance (ch1 only).
  // Fog wall — ALL chapters. Snaps to one screen behind player on first activation.
  if(chapterTimer > FOG_DELAY){
    // Snap fog to just off the left edge of the visible screen.
    // Use cameraX (left world edge) minus a small margin — not full canvas.width.
    if(fogX < cameraX - 80){
      fogX = cameraX - 80;
    }
    fogX += FOG_SPEED * (dt / 16.67);
    if(fogX >= player.x){
      gameState='gameover'; stateTimer=0; deathCount++; homeMenuCursor=0; saveScores(); return;
    }
  }

  // Ch1 catapult trigger — only in Ch1
  if(chapter===CHAPTER.ONE && player.x >= CATAPULT_X - 80 && catapultPhase===0){
    gameState='catapult'; stateTimer=0;
    catapultPhase=1;
    catapultTimer=0;
    activeCatapultX=CATAPULT_X;
    player.vx=0; player.facing=1;
    enemies.length=0;
    return;
  }

  // Horizontal input
  let ix=J.dx;
  if(keys['ArrowLeft'])  ix=-1;
  if(keys['ArrowRight']) ix= 1;

  // During catapult approach still allow movement
  const canMove = gameState==='playing';
  if(canMove && Math.abs(ix)>0.08){
    player.vx=ix*3.2; player.facing=ix>0?1:-1;
    if(player.grounded && !player.crouching) player.walkFrame++;
  } else {
    player.vx*=0.72;
  }
  player.x=Math.max(20, player.x+player.vx);

  // Down input: joystick pushed down OR ArrowDown key
  const downInput = J.dy > 0.5 || keys['ArrowDown'];
  const isMoving  = Math.abs(player.vx) > 0.5;

  // Duck (crouch without jump charge) — available always when grounded + not jumping.
  // Holding down while still = duck. Reduces collision height, different animation.
  // Does NOT queue a jump on release (only the jump button does that).
  if(player.grounded && downInput && !JB.held && !keys[' '] && !player.sliding){
    player.ducking = true;
  } else {
    player.ducking = false;
  }

  // Slide: Ch4+ only, requires movement. Overrides duck.
  // Base duration = 400ms + 200ms per Slide Duration stack.
  const slideAvailable = chapter >= CHAPTER.FOUR;
  const slideDurUnlock = getUnlock('slide_dur');
  const slideMaxDur = 400 + (slideDurUnlock ? slideDurUnlock.stacks * 200 : 0);
  const slideInput = downInput && isMoving;
  if(slideAvailable && player.grounded && slideInput && !player.crouching){
    player.sliding  = true;
    player.ducking  = false; // slide overrides duck
    player.slideTimer = Math.min(player.slideTimer + dt, slideMaxDur);
  } else {
    if(player.slideTimer > 0) player.slideTimer -= dt * 2;
    if(player.slideTimer <= 0){ player.sliding=false; player.slideTimer=0; }
  }

  // Jump logic
  const held=JB.held||keys[' '];

  if(chapter===CHAPTER.ONE){
    // Tap-to-jump: no charge, just a clean fixed jump on button press
    if(player.grounded && JB.justReleased){
      player.vy=-13;
      player.grounded=false;
    }
  } else {
    // Chapter 2: hold-to-charge
    if(player.grounded){
      if(held){
        player.crouching=true;
        // Spring Legs skill multiplies charge speed.
        // getSpringLegsMultiplier() returns 1.0 + stacks*0.10.
        player.chargeTime=Math.min(player.chargeTime+dt*getSpringLegsMultiplier(),player.maxCharge);
      }
      if(player.jumpQueued||(!held && player.crouching)){
        const pct=Math.max(0.15,player.chargeTime/player.maxCharge);
        player.vy=-7+(-9)*pct;
        player.grounded=false; player.crouching=false;
        player.chargeTime=0; player.jumpQueued=false;
      }
    } else {
      player.crouching=false; player.chargeTime=0; player.jumpQueued=false;
    }
  }
  JB.justReleased=false;

  // Gravity
  if(!player.grounded) player.vy+=0.55;
  player.y+=player.vy;

  const gy=GY();
  const feet=player.y+PH/2;
  // Effective player height for collisions: full, crouched, or sliding
  const effectivePH = player.sliding ? PH*0.35 : (player.crouching||player.ducking) ? PH*0.6 : PH;
  const pl=player.x-PW/2+4, pr=player.x+PW/2-4;
  player.grounded=false;

  // Platform landing
  if(player.vy>=0){
    for(const p of platforms){
      if(pr>p.x && pl<p.x+p.w && feet>=p.y && feet<=p.y+p.h+Math.abs(player.vy)+2){
        player.y=p.y-effectivePH/2; player.vy=0; player.grounded=true; break;
      }
    }
  }

  // Ground / pit
  if(!player.grounded && feet>=gy){
    if(!isGroundAt(player.x)){
      gameState='gameover'; stateTimer=0; saveScores();
    } else {
      player.y=gy-PH/2; player.vy=0; player.grounded=true;
    }
  }
  if(player.y>canvas.height+300){ gameState='gameover'; stateTimer=0; deathCount++; homeMenuCursor=0; saveScores(); }

  // Camera
  const tc=player.x-canvas.width/2;
  cameraX+=(tc-cameraX)*0.08; if(cameraX<0) cameraX=0;

  // Generate terrain ahead (ch2)
  if(chapter >= CHAPTER.TWO) genTerrain(player.x + canvas.width * 2);

  // Ch2 catapult trigger — when player reaches it, warp them to a
  // safe starting point near the catapult base, THEN begin loading.
  // Design intent: the warp is brief (player is placed just behind the catapult)
  // so the sequence reads as "you ran here, now get launched".
  if(chapter===CHAPTER.TWO && player.x >= CATAPULT_X2 - 80 && catapultPhase===0){
    gameState='catapult'; stateTimer=0;
    catapultPhase=1;
    catapultTimer=0;
    activeCatapultX=CATAPULT_X2;
    player.x = CATAPULT_X2 - 20; // position just at the catapult base
    player.y = GY() - PH/2;
    player.vx=0; player.vy=0; player.facing=1;
    cameraX = player.x - canvas.width*0.4; // snap camera so catapult is visible
    enemies.length=0;
    return;
  }

  // Ch3 catapult trigger — launches player then opens skill menu in the chaptercard.
  if(chapter===CHAPTER.THREE && !bonfireReached && player.x >= CATAPULT_X3 - 80 && catapultPhase===0){
    bonfireReached=true;
    gameState='catapult'; stateTimer=0;
    catapultPhase=1;
    catapultTimer=0;
    activeCatapultX=CATAPULT_X3;
    player.x = CATAPULT_X3 - 20;
    player.y = GY() - PH/2;
    player.vx=0; player.vy=0; player.facing=1;
    cameraX = player.x - canvas.width*0.4;
    enemies.length=0;
  }

  updateEnemies(dt);
}

// ══════════════════════════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════════════════════════
function render(ts) {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBg(ts);
  drawStars(ts);
  drawMountains();
  drawBgTrees();
  drawTerrain();
  if(chapter>=CHAPTER.THREE) drawPlatforms();

  // Catapult (ch1 always visible near the end)
  if(chapter===CHAPTER.ONE) drawCatapult(ts, CATAPULT_X);
  if(chapter===CHAPTER.TWO)   drawCatapult(ts, CATAPULT_X2);
  if(chapter===CHAPTER.THREE) drawCatapult(ts, CATAPULT_X3);
  if(chapter===CHAPTER.TWO)   drawCatapult(ts, CATAPULT_X2);
  if(chapter===CHAPTER.ONE)   drawCatapult(ts, CATAPULT_X);

  drawEnemies();

  // Player
  if(gameState!=='chaptercard'){
    const charState = player.flying ? 'jump' :
                      !player.grounded ? 'jump' :
                      player.sliding   ? 'slide' :
                      (player.crouching||player.ducking) ? 'crouch' : 'stand';
    drawCharacter(player.x-cameraX, player.y+PH/2, player.facing, player.walkFrame, charState);
  }

  drawFog();
  drawChargeRing(player.chargeTime/player.maxCharge);
  drawProgressBar();
  drawHUD(ts);

  if(gameState==='gameover')    drawGameOver();
  if(gameState==='chaptercard') drawChapterCard();
  if(gameState==='splash')      drawSplash(ts);
  if(gameState==='home')        drawHome(ts);
  if(howToPlayOpen)             drawHowToPlay();
}

// ══════════════════════════════════════════════════════════════
//  LOOP
// ══════════════════════════════════════════════════════════════
function loop(ts) {
  const dt=Math.min(ts-lastTime,32); lastTime=ts;
  update(dt); render(ts);
  requestAnimationFrame(loop);
}

// ══════════════════════════════════════════════════════════════
//  INPUT HANDLERS (global)
// ══════════════════════════════════════════════════════════════

function confirmGameOver() {
  if(stateTimer < 700) return;
  if(homeMenuCursor===0){
    // Continue — retry same chapter, score resets
    score=0; startChapter(chapter);
  } else if(homeMenuCursor===1){
    // Restart — back to Ch1, but KEEP accumulated score and skills
    // Design intent: player keeps their progress, just resets position
    startChapter(CHAPTER.ONE, false);
  } else {
    // Home
    gameState='home'; stateTimer=0; homeMenuCursor=0; score=0;
  }
}

function fullReset() {
  // Wipe everything — scores, SP, skills, unlocks.
  // Called only after explicit confirmation from the New Game dialog.
  highScore=0; totalScore=0; skillPoints=0;
  localStorage.removeItem('uh_highscore');
  localStorage.removeItem('uh_totalscore');
  localStorage.removeItem('uh_skillpoints');
  // Reset all skill stacks and costs to defaults
  SKILLS.forEach(sk=>{ sk.stacks=0; sk.cost=sk.id==='spring'?15:sk.id==='shield_str'?25:sk.cost; });
  UNLOCKS.forEach(un=>{ un.owned=false; un.active=false; un.stacks=0; });
  newGameConfirmOpen=false;
  startChapter(CHAPTER.ONE, true);
}

function confirmHome() {
  if(newGameConfirmOpen){ return; } // handled separately by confirmNewGame
  if(howToPlayOpen){ howToPlayOpen=false; return; }
  if(homeMenuCursor===0){
    startChapter(chapter);
  } else if(homeMenuCursor===1){
    // Show confirmation dialog instead of immediately resetting
    newGameConfirmOpen=true;
  } else {
    howToPlayOpen=true;
  }
}

function confirmNewGame(yes) {
  if(yes) fullReset();
  else    newGameConfirmOpen=false;
}

// handlePointer — routes clicks/touches to the correct menu action.
// IMPORTANT: on the gameover screen, check skill menu zones FIRST before
// calling confirmGameOver. Any tap that hits a skill slot or tab should
// buy/navigate, not restart. confirmGameOver only fires if the tap is
// clearly in the action button row.
function handlePointer(clientX, clientY) {
  if(gameState==='splash'&&stateTimer>800){ startChapter(CHAPTER.ONE,true); return; }
  if(howToPlayOpen){ howToPlayOpen=false; return; }

  if(gameState==='gameover' && stateTimer>700){
    const rect = canvas.getBoundingClientRect();
    // Scale from CSS pixels to canvas pixels
    const scaleY = canvas.height / rect.height;
    const scaleX = canvas.width  / rect.width;
    const cx = canvas.width  / 2;
    const ty = (clientY - rect.top)  * scaleY;
    const tx = (clientX - rect.left) * scaleX;

    // ── Skill area zones (drawn in drawGameOver) ──
    const skillY   = canvas.height * 0.56;
    const tabY     = skillY + 28;
    const listStartY = skillY + 58;
    const rowH     = 32;
    const listW    = canvas.width * 0.8;
    const listX    = cx - listW / 2;
    const tabW=80, tabGap=6, tabTotal=2*(tabW+tabGap)-tabGap;
    const tabStartX = cx - tabTotal/2;

    // Tab switch
    if(ty >= tabY && ty <= tabY+22){
      if(tx >= tabStartX && tx <= tabStartX+tabW){ menuTab=0; skillCursor=0; return; }
      if(tx >= tabStartX+tabW+tabGap && tx <= tabStartX+tabTotal){ menuTab=1; skillCursor=0; return; }
    }

    // Skill row buy
    const items = menuTab===0?SKILLS:UNLOCKS;
    for(let i=0;i<Math.min(items.length,4);i++){
      const iy=listStartY+i*rowH;
      if(ty>=iy && ty<=iy+rowH-3 && tx>=listX && tx<=listX+listW){
        skillCursor=i; buyItem(i); return;
      }
    }

    // ── Action buttons (horizontal, at ~38% down canvas) ──
    const btnY    = canvas.height * 0.38;
    const btnH    = 30;
    const btnW    = 110, btnGap = 10;
    const btnTotal2 = 3*(btnW+btnGap)-btnGap;
    const btnStartX = cx - btnTotal2/2;
    let hitBtn = false;
    for(let bi=0;bi<3;bi++){
      const bx=btnStartX+bi*(btnW+btnGap);
      if(tx>=bx && tx<=bx+btnW && ty>=btnY && ty<=btnY+btnH){
        homeMenuCursor=bi; hitBtn=true;
      }
    }
    if(hitBtn){ confirmGameOver(); return; }

    // Tap outside all zones — do nothing (don't accidentally restart)
    return;
  }

  if(gameState==='home'){
    const rect=canvas.getBoundingClientRect();
    const scaleY=canvas.height/rect.height;
    const scaleX=canvas.width/rect.width;
    const ty=(clientY-rect.top)*scaleY;
    const tx=(clientX-rect.left)*scaleX;
    const cx2=canvas.width/2, cy2=canvas.height/2;

    // New Game confirm dialog
    if(newGameConfirmOpen){
      // YES button: left half of confirm area. NO: right half.
      const dialogY=cy2+20;
      if(ty>=dialogY && ty<=dialogY+36){
        if(tx<cx2) confirmNewGame(true);
        else       confirmNewGame(false);
      }
      return;
    }

    HOME_OPTS.forEach((_,i)=>{
      const oy=cy2-4+i*42;
      if(ty>=oy-20 && ty<=oy+14) homeMenuCursor=i;
    });
    confirmHome(); return;
  }
  if(gameState==='chaptercard' && stateTimer>1000){ startChapter(pendingChapter); return; }
}

document.addEventListener('click', e=>{
  handlePointer(e.clientX, e.clientY);
});

document.addEventListener('touchstart', e=>{
  handlePointer(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
});
// buyItem: purchase from active menu tab (SKILLS or UNLOCKS).
// Skills are stackable — cost rises 50% each stack.
// Unlocks are one-time (except toggleable ones which can be turned on/off).
function buyItem(cursor) {
  if(menuTab === 0){
    const sk = SKILLS[cursor];
    if(!sk) return;
    // Shield Strength requires Shield unlock to be purchased first
    if(sk.id==='shield_str' && !hasUnlock('shield')){
      return; // silently block — UI shows it as locked
    }
    if(skillPoints < sk.cost) return;
    if(sk.stackable){
      skillPoints -= sk.cost;
      sk.stacks++;
      sk.cost = Math.round(sk.cost * 1.5);
    } else {
      if(sk.stacks > 0) return;
      skillPoints -= sk.cost;
      sk.stacks = 1;
    }
  } else {
    const un = UNLOCKS[cursor];
    if(!un) return;
    if(un.stackable){
      // Stackable unlock (e.g. Slide Duration) — buy multiple times
      if(skillPoints < un.cost) return;
      skillPoints -= un.cost;
      un.stacks = (un.stacks||0) + 1;
      un.owned = true;
      un.cost = Math.round(un.cost * 1.5);
    } else if(un.owned){
      if(un.toggleable) un.active = !un.active;
    } else {
      if(skillPoints < un.cost) return;
      skillPoints -= un.cost;
      un.owned = true;
      un.active = true;
    }
  }
}

document.addEventListener('keydown', e=>{
  if(gameState==='splash'&&stateTimer>800){ startChapter(CHAPTER.ONE,true); return; }
  if(howToPlayOpen){ howToPlayOpen=false; return; }

  // Skill menu navigation
  if(skillMenuOpen){
    const items=menuTab===0?SKILLS:UNLOCKS;
    if(e.key==='ArrowDown')  skillCursor=Math.min(skillCursor+1,items.length-1);
    if(e.key==='ArrowUp')    skillCursor=Math.max(skillCursor-1,0);
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
      menuTab=menuTab===0?1:0; skillCursor=0;
    }
    if(e.key===' '||e.key==='Enter') buyItem(skillCursor);
    if(e.key==='c'||e.key==='C'){
      skillMenuOpen=false;
      gameState='chaptercard'; stateTimer=0;
    }
    return;
  }

  // Game over screen navigation
  if(gameState==='gameover'){
    // Left/Right navigate the 3 action buttons
    if(e.key==='ArrowRight') homeMenuCursor=Math.min(homeMenuCursor+1,2);
    if(e.key==='ArrowLeft')  homeMenuCursor=Math.max(homeMenuCursor-1,0);
    // Up/Down navigate skill rows
    const goItems=menuTab===0?SKILLS:UNLOCKS;
    if(e.key==='ArrowDown')  skillCursor=Math.min(skillCursor+1,Math.min(goItems.length-1,3));
    if(e.key==='ArrowUp')    skillCursor=Math.max(skillCursor-1,0);
    if(e.key==='Tab'){ menuTab=menuTab===0?1:0; skillCursor=0; e.preventDefault(); }
    if(e.key===' ')  buyItem(skillCursor);
    if(e.key==='Enter') confirmGameOver();
    return;
  }

  // Home screen navigation
  if(gameState==='home'){
    if(newGameConfirmOpen){
      if(e.key==='Enter'||e.key==='y'||e.key==='Y') confirmNewGame(true);
      if(e.key==='Escape'||e.key==='n'||e.key==='N') confirmNewGame(false);
      return;
    }
    if(e.key==='ArrowDown') homeMenuCursor=(homeMenuCursor+1)%3;
    if(e.key==='ArrowUp')   homeMenuCursor=(homeMenuCursor+2)%3;
    if(e.key==='Enter')     confirmHome();
    return;
  }

  if(e.key==='Enter'){
    if(gameState==='chaptercard' && stateTimer>1000){ startChapter(pendingChapter); return; }
  }
});

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
// Start at splash screen. Player taps/presses any key to begin Ch1.
stateTimer=0; // splash uses stateTimer for its fade-in
requestAnimationFrame(ts=>{ lastTime=ts; requestAnimationFrame(loop); });
