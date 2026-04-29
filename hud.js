// hud.js — all UI: splash, home, gameover, chaptercard, HUD, skill menu, progress bar
// Depends on: constants.js

// ══════════════════════════════════════════════════════════════
//  HUD / UI
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
//  SKILL MENU
// Design intent: 10 mystery slots shown as ?.
// Player spends skill points earned from score.
// All slots start as ??? — skills are revealed/named as we design them.
// This is the souls-like "level up" moment after clearing Ch3.
// DO NOT reveal skill names here until they are designed and intentional.
// ══════════════════════════════════════════════════════════════
// skillCursor declared in constants above

function drawSkillMenu() {
  if(!skillMenuOpen) return;
  const cx=canvas.width/2, cy=canvas.height/2;
  ctx.save();

  // Dark overlay + glow
  ctx.fillStyle='rgba(4,1,12,0.94)'; ctx.fillRect(0,0,canvas.width,canvas.height);
  const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,220);
  grd.addColorStop(0,'rgba(100,60,200,0.2)'); grd.addColorStop(1,'rgba(100,60,200,0)');
  ctx.fillStyle=grd; ctx.fillRect(0,0,canvas.width,canvas.height);

  // Title + SP
  ctx.fillStyle='rgba(200,180,255,0.9)'; ctx.font='bold 15px Courier New'; ctx.textAlign='center';
  ctx.fillText('✦  ADVANCEMENT  ✦', cx, cy-138);
  ctx.fillStyle='#ffd66b'; ctx.font='bold 13px Courier New';
  ctx.fillText(`SP: ${skillPoints}`, cx, cy-118);

  // Tabs: SKILLS | UNLOCKS
  const tabs=['SKILLS','UNLOCKS'];
  const tabW=100, tabH=28, tabGap=8;
  const tabStartX=cx-(tabs.length*(tabW+tabGap)-tabGap)/2;
  tabs.forEach((tab,i)=>{
    const tx=tabStartX+i*(tabW+tabGap), ty=cy-102;
    const active=menuTab===i;
    ctx.fillStyle=active?'rgba(167,139,250,0.35)':'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.roundRect(tx,ty,tabW,tabH,5); ctx.fill();
    ctx.strokeStyle=active?'rgba(167,139,250,0.9)':'rgba(255,255,255,0.15)';
    ctx.lineWidth=active?2:1;
    ctx.beginPath(); ctx.roundRect(tx,ty,tabW,tabH,5); ctx.stroke();
    ctx.fillStyle=active?'#fff':'rgba(255,255,255,0.4)';
    ctx.font=`${active?'bold ':''}11px Courier New`; ctx.textAlign='center';
    ctx.fillText(tab, tx+tabW/2, ty+tabH/2+4);
  });

  // Item list for active tab
  const items = menuTab===0 ? SKILLS : UNLOCKS;
  const rowH=46, listStartY=cy-64, listW=canvas.width*0.82;
  const listX=cx-listW/2;

  items.forEach((item,i)=>{
    const iy=listStartY+i*rowH;
    if(iy>cy+100) return; // clip overflow
    const isHov=skillCursor===i;
    const bought=menuTab===0 ? item.stacks>0 : item.owned;
    const canAfford=skillPoints>=item.cost;

    // Row bg
    ctx.fillStyle=isHov?'rgba(167,139,250,0.15)':bought?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.roundRect(listX,iy,listW,rowH-4,5); ctx.fill();
    ctx.strokeStyle=isHov?'rgba(167,139,250,0.7)':bought?'rgba(167,139,250,0.25)':'rgba(255,255,255,0.08)';
    ctx.lineWidth=isHov?1.5:1;
    ctx.beginPath(); ctx.roundRect(listX,iy,listW,rowH-4,5); ctx.stroke();

    // Name
    const nameKnown=item.name!=='???';
    ctx.fillStyle=bought?'#a78bfa':nameKnown&&canAfford?'#fff':'rgba(255,255,255,0.35)';
    ctx.font=`${isHov?'bold ':''}12px Courier New`; ctx.textAlign='left';
    ctx.fillText(item.name, listX+12, iy+16);

    // Desc
    ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.font='10px Courier New';
    ctx.fillText(bought&&item.desc!=='...' ? item.desc : nameKnown?item.desc:'???', listX+12, iy+30);

    // Right side: cost or status
    ctx.textAlign='right';
    if(menuTab===0){
      // Skill: show stacks and next cost
      if(item.stacks>0){
        ctx.fillStyle='#a78bfa'; ctx.font='bold 10px Courier New';
        ctx.fillText(`x${item.stacks}  →  ${item.cost}sp`, listX+listW-10, iy+16);
      } else {
        ctx.fillStyle=canAfford?'#ffd66b':'rgba(255,255,255,0.25)'; ctx.font='10px Courier New';
        ctx.fillText(`${item.cost} sp`, listX+listW-10, iy+16);
      }
    } else {
      // Unlock: show status
      if(item.owned){
        const status=item.toggleable?(item.active?'ON ✓':'OFF'):'✓';
        ctx.fillStyle=item.active?'#52c97a':'rgba(255,255,255,0.4)'; ctx.font='bold 10px Courier New';
        ctx.fillText(status, listX+listW-10, iy+16);
      } else {
        ctx.fillStyle=canAfford?'#ffd66b':'rgba(255,255,255,0.25)'; ctx.font='10px Courier New';
        ctx.fillText(`${item.cost} sp`, listX+listW-10, iy+16);
      }
    }
  });

  // Controls
  ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.font='10px Courier New'; ctx.textAlign='center';
  ctx.fillText('↑↓ select  ·  ←→ switch tab  ·  Enter/tap to buy  ·  C to continue', cx, cy+122);
  ctx.fillStyle='rgba(255,160,60,0.75)'; ctx.font='bold 11px Courier New';
  ctx.fillText('[ Continue Journey ]', cx, cy+140);

  ctx.restore();
}


// ══════════════════════════════════════════════════════════════
//  SPLASH SCREEN — shown once on first load
//  Design intent: cold open feel. Title, brief dramatic pause, then tap to begin.
//  After first death the home screen takes over instead.
// ══════════════════════════════════════════════════════════════
function drawSplash(ts) {
  const cx=canvas.width/2, cy=canvas.height/2;
  const t=ts*0.001;
  drawBg(ts); drawStars(ts); drawMountains();

  // Vignette
  const vig=ctx.createRadialGradient(cx,cy,canvas.height*0.2,cx,cy,canvas.height*0.85);
  vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,0.7)');
  ctx.fillStyle=vig; ctx.fillRect(0,0,canvas.width,canvas.height);

  // Fade in
  const fade=Math.min(stateTimer/1200,1);
  ctx.save(); ctx.globalAlpha=fade;

  // Title
  ctx.fillStyle='rgba(200,180,255,0.95)'; ctx.font='bold 32px Courier New'; ctx.textAlign='center';
  ctx.fillText('UNLIKELY HERO', cx, cy-30);

  // Subtitle
  ctx.fillStyle='rgba(255,214,107,0.6)'; ctx.font='11px Courier New';
  ctx.fillText('a game about becoming', cx, cy-8);

  // Tap prompt — pulses after 2s
  if(stateTimer>2000){
    const pulse=0.5+0.5*Math.sin(t*3);
    ctx.globalAlpha=fade*pulse;
    ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font='12px Courier New';
    ctx.fillText('tap  /  press any key', cx, cy+40);
  }
  ctx.restore();
}

// ══════════════════════════════════════════════════════════════
//  HOME SCREEN
// Design intent: only accessible after first death — cold open on first play.
// Three options: Continue (resume same chapter), New Game (reset all), How To Play.
// How To Play is intentionally minimal — "SURVIVE" captures the whole design.
// ══════════════════════════════════════════════════════════════
const HOME_OPTS = ['CONTINUE', 'NEW GAME', 'HOW TO PLAY'];

function drawHome(ts) {
  const cx=canvas.width/2, cy=canvas.height/2;
  const t=ts*0.001;
  // Background — reuse game bg
  drawBg(ts); drawStars(ts); drawMountains();

  // Title glow
  const grd=ctx.createRadialGradient(cx,cy-60,0,cx,cy-60,180);
  grd.addColorStop(0,'rgba(120,60,200,0.35)'); grd.addColorStop(1,'rgba(120,60,200,0)');
  ctx.fillStyle=grd; ctx.fillRect(0,0,canvas.width,canvas.height);

  // Game title
  ctx.save();
  ctx.fillStyle='rgba(200,180,255,0.9)'; ctx.font='bold 28px Courier New'; ctx.textAlign='center';
  ctx.fillText('UNLIKELY HERO', cx, cy-70);
  ctx.fillStyle='rgba(255,214,107,0.5)'; ctx.font='11px Courier New';
  ctx.fillText('chapter i — the unlikely lester', cx, cy-48);
  ctx.restore();

  // Menu options
  HOME_OPTS.forEach((label, i) => {
    const oy = cy - 4 + i * 42;
    const isHov = homeMenuCursor === i;
    // Highlight box
    ctx.fillStyle = isHov ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.04)';
    ctx.beginPath(); ctx.roundRect(cx-100, oy-20, 200, 34, 7); ctx.fill();
    ctx.strokeStyle = isHov ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth=isHov?2:1;
    ctx.beginPath(); ctx.roundRect(cx-100, oy-20, 200, 34, 7); ctx.stroke();
    ctx.fillStyle = isHov ? '#ffd66b' : 'rgba(255,255,255,0.55)';
    ctx.font=`${isHov?'bold ':''}14px Courier New`; ctx.textAlign='center';
    ctx.fillText(label, cx, oy+1);
  });

  // Controls hint
  ctx.save();
  ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.font='10px Courier New'; ctx.textAlign='center';
  ctx.fillText('↑↓ or tap  ·  Enter to select', cx, cy+128);
  ctx.restore();
}

function drawHowToPlay() {
  const cx=canvas.width/2, cy=canvas.height/2;
  ctx.save();
  ctx.fillStyle='rgba(4,1,12,0.96)'; ctx.fillRect(0,0,canvas.width,canvas.height);

  // Big centred instruction — intentionally minimal, souls-like philosophy.
  // Players discover mechanics; we only confirm the core loop.
  ctx.fillStyle='rgba(200,180,255,0.85)'; ctx.font='bold 16px Courier New'; ctx.textAlign='center';
  ctx.fillText('HOW TO PLAY', cx, cy-50);

  ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.font='bold 36px Courier New';
  ctx.fillText('SURVIVE', cx, cy+6);

  ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.font='11px Courier New';
  ctx.fillText('Tap  /  Enter to go back', cx, cy+60);
  ctx.restore();
}

function drawProgressBar() {
  // Slim progress track at very bottom of canvas (on the border line with controls).
  // Dot starts at the LEFT end of the track when player.x=0, moves right to the end.
  // Level length is the world-X of the exit for each chapter.
  if(gameState !== 'playing' && gameState !== 'catapult') return;

  const levelEnd = chapter===CHAPTER.ONE ? CATAPULT_X :
                   chapter===CHAPTER.TWO ? CATAPULT_X2 : CATAPULT_X3;
  const pct    = Math.max(0, Math.min(1, player.x / levelEnd));

  const trackY  = canvas.height - 3;
  const trackX0 = 40;                       // left anchor = start of level
  const trackX1 = canvas.width - 40;        // right anchor = end of level
  const trackW  = trackX1 - trackX0;
  const dotX    = trackX0 + pct * trackW;   // player dot

  ctx.save();

  // Background track
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(trackX0, trackY); ctx.lineTo(trackX1, trackY); ctx.stroke();

  // Filled portion (progress made)
  ctx.strokeStyle = 'rgba(167,139,250,0.5)';
  ctx.beginPath(); ctx.moveTo(trackX0, trackY); ctx.lineTo(dotX, trackY); ctx.stroke();

  // Ch1 fog marker on the bar — shows where the fog currently is
  if(chapterTimer > FOG_DELAY){
    const fogPct = Math.max(0, Math.min(1, fogX / levelEnd));
    const fogBarX = trackX0 + fogPct * trackW;
    ctx.fillStyle = 'rgba(200,80,220,0.7)';
    ctx.beginPath(); ctx.arc(fogBarX, trackY, 3, 0, Math.PI*2); ctx.fill();
  }

  // Start marker
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.arc(trackX0, trackY, 2.5, 0, Math.PI*2); ctx.fill();

  // End marker
  ctx.font = '10px serif'; ctx.textAlign = 'center';
  ctx.fillText('🪃', trackX1, trackY+4); // catapult exit for all chapters

  // Player glow dot
  const pulse = 0.85 + 0.15*Math.sin(Date.now()*0.006);
  const dg = ctx.createRadialGradient(dotX, trackY, 0, dotX, trackY, 7);
  dg.addColorStop(0, `rgba(255,214,107,${pulse})`);
  dg.addColorStop(0.5, `rgba(255,160,60,${pulse*0.5})`);
  dg.addColorStop(1, 'rgba(255,100,20,0)');
  ctx.fillStyle = dg;
  ctx.beginPath(); ctx.arc(dotX, trackY, 7, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffd66b';
  ctx.beginPath(); ctx.arc(dotX, trackY, 2.5, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

function drawHUD(ts) {
  const cx = canvas.width/2;

  // Score (top right)
  ctx.save();
  ctx.fillStyle='rgba(255,214,107,0.85)'; ctx.font='bold 14px Courier New'; ctx.textAlign='right';
  ctx.fillText(`SCORE ${Math.floor(score)}`, canvas.width-16, 30);
  ctx.restore();

  // Chapter label (top left) — no spoilers, just the chapter number
  ctx.save();
  ctx.fillStyle='rgba(180,150,255,0.55)'; ctx.font='12px Courier New'; ctx.textAlign='left';
  const chLabel = chapter===CHAPTER.ONE ? 'Chapter I' :
                  chapter===CHAPTER.TWO ? 'Chapter II' :
                  chapter===CHAPTER.THREE ? 'Chapter III' : 'Chapter IV';
  ctx.fillText(chLabel, 16, 30);
  ctx.restore();

  // Skill points — always visible, even at 0.
  // Design intent: showing 0 creates aspiration; player knows what they're working toward.
  ctx.save();
  ctx.fillStyle = skillPoints>0 ? 'rgba(167,139,250,0.9)' : 'rgba(167,139,250,0.35)';
  ctx.font='11px Courier New'; ctx.textAlign='left';
  ctx.fillText(`SP: ${skillPoints}`, 16, 48);
  ctx.restore();

  if(gameState !== 'playing') return; // below only while playing

  // Fog warning — shown on all chapters
  {
    const remaining = Math.max(0, FOG_DELAY - chapterTimer);
    if(chapterTimer > FOG_DELAY - 8000){
      // Fog warning — pulses urgently
      ctx.save();
      const pulse = 0.65+0.35*Math.sin(Date.now()*0.009);
      ctx.globalAlpha = pulse;
      ctx.fillStyle='#ff88ff'; ctx.font='bold 13px Courier New'; ctx.textAlign='center';
      const fogMsg = chapterTimer > FOG_DELAY ? '⚠ THE FOG COMES' : `⚠ FOG IN ${Math.ceil(remaining/1000)}s`;
      ctx.fillText(fogMsg, cx, 55);
      ctx.restore();
    }
    // Catapult hint — bottom center, only when close, doesn't overlap fog text
    const catDist = CATAPULT_X - player.x;
    if(catDist < 500 && catDist > 0){
      const alpha = Math.max(0, 1 - catDist/400) * (0.7+0.3*Math.sin(Date.now()*0.004));
      ctx.save(); ctx.globalAlpha=alpha;
      ctx.fillStyle='#ffd66b'; ctx.font='bold 12px Courier New'; ctx.textAlign='center';
      ctx.fillText('→ CATAPULT', cx, canvas.height - 30);
      ctx.restore();
    }
  }

  // Ch3: catapult hint when close — bottom center
  if(chapter===CHAPTER.THREE){
    const bDist = CATAPULT_X3 - player.x;
    if(bDist < 500 && bDist > 0){
      const alpha = Math.max(0, 1 - bDist/400) * (0.7+0.3*Math.sin(Date.now()*0.004));
      ctx.save(); ctx.globalAlpha=alpha;
      ctx.fillStyle='#ff9944'; ctx.font='bold 12px Courier New'; ctx.textAlign='center';
      ctx.fillText('→ CATAPULT', cx, canvas.height - 30);
      ctx.restore();
    }
  }

  // PC controls hint — fades out after 5s, shown at very bottom so it never overlaps
  if(chapterTimer < 5000){
    const a = Math.max(0, 1 - chapterTimer/5000);
    ctx.save(); ctx.globalAlpha=a*0.55;
    ctx.fillStyle='#fff'; ctx.font='11px Courier New'; ctx.textAlign='center';
    ctx.fillText('← → Move   |   Space / Jump button to jump', cx, canvas.height - 12);
    ctx.restore();
  }
}

function drawGameOver() {
  const fade = Math.min(stateTimer/400, 1);
  const cx=canvas.width/2;
  // Layout: top quarter = death info, middle = action buttons, bottom = skill menu
  const topY   = canvas.height * 0.12;
  const btnY   = canvas.height * 0.38;
  const skillY = canvas.height * 0.56;

  ctx.save();
  ctx.fillStyle=`rgba(10,4,28,${fade*0.92})`; ctx.fillRect(0,0,canvas.width,canvas.height);
  if(fade > 0.45){
    const a = Math.min((fade-0.45)/0.35, 1); ctx.globalAlpha=a;

    // ── Death header ──
    ctx.fillStyle='#ff6b6b'; ctx.font='bold 22px Courier New'; ctx.textAlign='center';
    ctx.fillText('LESTER PANICKED!', cx, topY);
    ctx.fillStyle='#ffd66b'; ctx.font='14px Courier New';
    ctx.fillText(`Score: ${Math.floor(score)}`, cx, topY+26);
    const isNew = score >= highScore && score > 0;
    ctx.fillStyle = isNew ? '#a78bfa' : 'rgba(180,160,255,0.6)';
    ctx.font='11px Courier New';
    ctx.fillText(isNew ? `★ NEW BEST: ${Math.floor(highScore)}` : `Best: ${Math.floor(highScore)}`, cx, topY+44);
    ctx.fillStyle='rgba(200,200,255,0.4)';
    ctx.fillText(`All-time: ${Math.floor(totalScore)}`, cx, topY+58);

    // ── Action buttons: CONTINUE | RESTART | HOME ──
    const opts = ['CONTINUE','RESTART','HOME'];
    const subtitles = ['retry this chapter','Ch1, keep skills','main menu'];
    const btnW=110, btnH=30, btnGap=10;
    const btnTotalW = opts.length*(btnW+btnGap)-btnGap;
    const btnStartX = cx - btnTotalW/2;
    opts.forEach((label,i)=>{
      const bx=btnStartX+i*(btnW+btnGap), by=btnY;
      const isHov=homeMenuCursor===i;
      ctx.fillStyle=isHov?'rgba(255,214,107,0.18)':'rgba(255,255,255,0.05)';
      ctx.beginPath(); ctx.roundRect(bx,by,btnW,btnH,6); ctx.fill();
      ctx.strokeStyle=isHov?'rgba(255,214,107,0.9)':'rgba(255,255,255,0.15)';
      ctx.lineWidth=isHov?2:1;
      ctx.beginPath(); ctx.roundRect(bx,by,btnW,btnH,6); ctx.stroke();
      ctx.fillStyle=isHov?'#ffd66b':'rgba(255,255,255,0.65)';
      ctx.font=`${isHov?'bold ':''}11px Courier New`; ctx.textAlign='center';
      ctx.fillText(label, bx+btnW/2, by+btnH/2+4);
    });
    ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.font='10px Courier New'; ctx.textAlign='center';
    ctx.fillText(subtitles[homeMenuCursor]||'', cx, btnY+btnH+14);
    ctx.fillStyle='rgba(255,255,255,0.15)';
    ctx.fillText('← → select  ·  tap or Enter to confirm', cx, btnY+btnH+26);

    // ── Skill menu embedded below ──
    // Divider
    ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx-120,skillY-8); ctx.lineTo(cx+120,skillY-8); ctx.stroke();

    // SP display + tab switcher
    ctx.fillStyle='rgba(200,180,255,0.85)'; ctx.font='bold 11px Courier New'; ctx.textAlign='center';
    ctx.fillText('✦ SKILLS', cx, skillY+4);
    ctx.fillStyle='#ffd66b'; ctx.font='10px Courier New';
    ctx.fillText(`SP: ${skillPoints}`, cx, skillY+18);

    // Tabs
    const tabs=['SKILLS','UNLOCKS'];
    const tabW=80, tabH=22, tabGap=6;
    const tabStartX=cx-(tabs.length*(tabW+tabGap)-tabGap)/2;
    tabs.forEach((tab,i)=>{
      const tx=tabStartX+i*(tabW+tabGap), ty=skillY+28;
      const active=menuTab===i;
      ctx.fillStyle=active?'rgba(167,139,250,0.3)':'rgba(255,255,255,0.04)';
      ctx.beginPath(); ctx.roundRect(tx,ty,tabW,tabH,4); ctx.fill();
      ctx.strokeStyle=active?'rgba(167,139,250,0.8)':'rgba(255,255,255,0.1)';
      ctx.lineWidth=active?1.5:1;
      ctx.beginPath(); ctx.roundRect(tx,ty,tabW,tabH,4); ctx.stroke();
      ctx.fillStyle=active?'#fff':'rgba(255,255,255,0.35)';
      ctx.font=`${active?'bold ':''}10px Courier New`; ctx.textAlign='center';
      ctx.fillText(tab, tx+tabW/2, ty+tabH/2+4);
    });

    // Item list
    const items=menuTab===0?SKILLS:UNLOCKS;
    const listW=canvas.width*0.8, listX=cx-listW/2;
    const rowH=32, listStartY=skillY+58;
    items.slice(0,4).forEach((item,i)=>{  // show max 4 rows to fit screen
      const iy=listStartY+i*rowH;
      const isHov=skillCursor===i;
      const bought=menuTab===0?item.stacks>0:item.owned;
      const canAfford=skillPoints>=item.cost;
      ctx.fillStyle=isHov?'rgba(167,139,250,0.15)':'rgba(255,255,255,0.03)';
      ctx.beginPath(); ctx.roundRect(listX,iy,listW,rowH-3,4); ctx.fill();
      ctx.strokeStyle=isHov?'rgba(167,139,250,0.6)':'rgba(255,255,255,0.07)';
      ctx.lineWidth=isHov?1.5:1;
      ctx.beginPath(); ctx.roundRect(listX,iy,listW,rowH-3,4); ctx.stroke();
      ctx.fillStyle=bought?'#a78bfa':canAfford?'#fff':'rgba(255,255,255,0.3)';
      ctx.font=`${isHov?'bold ':''}11px Courier New`; ctx.textAlign='left';
      ctx.fillText(item.name, listX+10, iy+rowH/2+4);
      ctx.textAlign='right';
      if(menuTab===0){
        ctx.fillStyle=item.stacks>0?'rgba(167,139,250,0.8)':canAfford?'#ffd66b':'rgba(255,255,255,0.2)';
        ctx.font='10px Courier New';
        ctx.fillText(item.stacks>0?`x${item.stacks} · ${item.cost}sp`:`${item.cost}sp`, listX+listW-8, iy+rowH/2+4);
      } else {
        ctx.fillStyle=item.owned?(item.active?'#52c97a':'rgba(255,255,255,0.4)'):canAfford?'#ffd66b':'rgba(255,255,255,0.2)';
        ctx.font='10px Courier New';
        ctx.fillText(item.owned?(item.toggleable?(item.active?'ON':'OFF'):'✓'):`${item.cost}sp`, listX+listW-8, iy+rowH/2+4);
      }
    });
    ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.font='9px Courier New'; ctx.textAlign='center';
    ctx.fillText('↑↓ navigate skills  ·  Space/tap to buy  ·  ←→ switch tab', cx, listStartY+4*rowH+8);
  }
  ctx.restore();
}

function drawChapterCard() {
  // Design intent: NO SPOILERS. Player discovers what changed themselves.
  // Just show the chapter number and a cryptic flavour line.
  // The mystery IS the reward — souls-like philosophy.
  const fade = Math.min(stateTimer/600, 1);
  const cx = canvas.width/2, cy = canvas.height/2;
  ctx.save();
  ctx.fillStyle=`rgba(4,1,12,${fade*0.98})`; ctx.fillRect(0,0,canvas.width,canvas.height);
  if(fade > 0.45){
    const a = Math.min((fade-0.45)/0.4, 1); ctx.globalAlpha=a;

    // Subtle glow orb
    const nextCh = pendingChapter;
    const glowCol = nextCh===CHAPTER.TWO ? '120,60,200' : nextCh===CHAPTER.THREE ? '200,80,40' : '80,160,200';
    const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,160);
    grd.addColorStop(0,`rgba(${glowCol},0.25)`); grd.addColorStop(1,`rgba(${glowCol},0)`);
    ctx.fillStyle=grd; ctx.fillRect(0,0,canvas.width,canvas.height);

    // Roman numeral chapter number — big, centered
    const numeral = nextCh===CHAPTER.ONE?'I': nextCh===CHAPTER.TWO?'II': nextCh===CHAPTER.THREE?'III':'IV';
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.font=`bold 120px Courier New`; ctx.textAlign='center';
    ctx.fillText(numeral, cx, cy+42);

    // "Chapter X" label
    ctx.fillStyle='rgba(200,180,255,0.85)'; ctx.font='bold 16px Courier New';
    ctx.fillText(`Chapter ${numeral}`, cx, cy-30);

    // Flavour line — cryptic, not a tutorial
    const flavour = nextCh===CHAPTER.TWO   ? 'Something has changed.' :
                    nextCh===CHAPTER.THREE ? 'The world remembers.' :
                    nextCh===CHAPTER.FOUR  ? 'They found you.' : 'Onward.';
    ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.font='13px Courier New';
    ctx.fillText(flavour, cx, cy-8);

    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='11px Courier New';
    ctx.fillText('Tap  /  Enter to continue', cx, cy+85);
  }
  ctx.restore();
}

