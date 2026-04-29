// player.js — player state, input handling, charge ring, character drawing, fog drawing
// Depends on: constants.js

// ══════════════════════════════════════════════════════════════
const PW=28, PH=48;
const player = {
  x:80, y:0, vx:0, vy:0,   // start near left edge of world so progress bar dot starts left
  grounded:false, facing:1,
  walkFrame:0,
  crouching:false, chargeTime:0, maxCharge:650, jumpQueued:false,
  sliding:false,   // true while slide is active (down+moving on ground)
  slideTimer:0,    // slide duration limiter (max 600ms per slide)
  flying:false,
};

function resetPlayer() {
  player.x=80; player.y=GY()-PH/2;
  player.vx=0; player.vy=0;
  player.grounded=false; player.crouching=false;
  player.chargeTime=0; player.jumpQueued=false;
  player.walkFrame=0; player.facing=1; player.flying=false;
}

// ══════════════════════════════════════════════════════════════
//  INPUT
// ══════════════════════════════════════════════════════════════
const jBase = document.getElementById('joystick-base');
const jKnob = document.getElementById('joystick-knob');
const jZone = document.getElementById('joystick-zone');
const J = { active:false, tid:null, bx:0, by:0, dx:0, dy:0, maxR:42 };

jZone.addEventListener('touchstart',e=>{
  e.preventDefault(); if(J.active) return;
  const t=e.changedTouches[0]; J.active=true; J.tid=t.identifier;
  const r=jBase.getBoundingClientRect(); J.bx=r.left+r.width/2; J.by=r.top+r.height/2;
  moveJ(t.clientX,t.clientY);
},{passive:false});
jZone.addEventListener('touchmove',e=>{
  e.preventDefault();
  for(const t of e.changedTouches) if(t.identifier===J.tid) moveJ(t.clientX,t.clientY);
},{passive:false});
['touchend','touchcancel'].forEach(ev=>jZone.addEventListener(ev,e=>{
  for(const t of e.changedTouches) if(t.identifier===J.tid){
    J.active=false; J.dx=0; jKnob.style.transform='translate(-50%,-50%)';
  }
}));
function moveJ(cx,cy){
  let dx=cx-J.bx, dy=cy-J.by;
  const dist=Math.sqrt(dx*dx+dy*dy);
  if(dist>J.maxR){dx=dx/dist*J.maxR; dy=dy/dist*J.maxR;}
  J.dx=dx/J.maxR;
  J.dy=dy/J.maxR;  // track vertical for slide detection
  jKnob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
}

const jBtnEl  = document.getElementById('jump-btn');
const jIcon   = jBtnEl.querySelector('.btn-icon');
const jLabelEl= jBtnEl.querySelector('.btn-label');
const jZoneEl = document.getElementById('jump-zone');
const JB = { held:false, tid:null, justReleased:false };

jZoneEl.addEventListener('touchstart',e=>{
  e.preventDefault(); if(JB.held) return;
  JB.held=true; JB.justReleased=false; JB.tid=e.changedTouches[0].identifier;
  if(chapter===CHAPTER.TWO){
    jBtnEl.classList.add('charging'); jIcon.textContent='↓'; jLabelEl.textContent='Hold';
  }
},{passive:false});
['touchend','touchcancel'].forEach(ev=>jZoneEl.addEventListener(ev,e=>{
  for(const t of e.changedTouches) if(t.identifier===JB.tid){
    JB.justReleased=true;
    if(chapter===CHAPTER.TWO && player.crouching) player.jumpQueued=true;
    JB.held=false; jBtnEl.classList.remove('charging'); jIcon.textContent='↑'; jLabelEl.textContent='Jump';
  }
}));

const keys={};
document.addEventListener('keydown',e=>{
  if(!keys[e.key]) {
    if(e.key===' ') JB.justReleased=false; // handled on up
  }
  keys[e.key]=true;
});
document.addEventListener('keyup',e=>{
  if(e.key===' '){
    JB.justReleased=true;
    if(chapter===CHAPTER.TWO && player.crouching) player.jumpQueued=true;
  }
  keys[e.key]=false;
});

// ══════════════════════════════════════════════════════════════
//  CHARGE RING
// ══════════════════════════════════════════════════════════════
function drawChargeRing(pct) {
  chargeCtx.clearRect(0,0,104,104);
  if(pct<=0||chapter===CHAPTER.ONE) return;
  const cx=52,cy=52,r=48;
  chargeCtx.beginPath(); chargeCtx.arc(cx,cy,r,-Math.PI/2,Math.PI*1.5);
  chargeCtx.strokeStyle='rgba(255,255,255,0.07)'; chargeCtx.lineWidth=5; chargeCtx.stroke();
  const g=chargeCtx.createLinearGradient(0,0,104,104);
  g.addColorStop(0,'#ffd66b'); g.addColorStop(1,'#a78bfa');
  chargeCtx.beginPath(); chargeCtx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*pct);
  chargeCtx.strokeStyle=g; chargeCtx.lineWidth=5; chargeCtx.lineCap='round'; chargeCtx.stroke();
}

// ══════════════════════════════════════════════════════════════
//  CHARGE RING
// ══════════════════════════════════════════════════════════════
function drawChargeRing(pct) {
  chargeCtx.clearRect(0,0,104,104);
  if(pct<=0||chapter===CHAPTER.ONE) return;
  const cx=52,cy=52,r=48;
  chargeCtx.beginPath(); chargeCtx.arc(cx,cy,r,-Math.PI/2,Math.PI*1.5);
  chargeCtx.strokeStyle='rgba(255,255,255,0.07)'; chargeCtx.lineWidth=5; chargeCtx.stroke();
  const g=chargeCtx.createLinearGradient(0,0,104,104);
  g.addColorStop(0,'#ffd66b'); g.addColorStop(1,'#a78bfa');
  chargeCtx.beginPath(); chargeCtx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*pct);
  chargeCtx.strokeStyle=g; chargeCtx.lineWidth=5; chargeCtx.lineCap='round'; chargeCtx.stroke();
}

// ══════════════════════════════════════════════════════════════
function drawCharacter(sx, sy, facing, wf, state) {
  const moving = Math.abs(J.dx)>0.1 || keys['ArrowLeft'] || keys['ArrowRight'];
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(facing, 1);
  drawLester(wf, moving, state);
  ctx.restore();
}

// All coords relative to (0,0) = feet. Y goes up in game logic, down in canvas.
function drawLester(wf, moving, state) {
  const crouch  = state==='crouch';
  const jumping = state==='jump';

  const swing = moving && !crouch ? Math.sin(wf*0.18)*10 : 0;
  const bob   = moving && !crouch ? Math.abs(Math.sin(wf*0.18))*-1.5 : 0;
  const flail = moving && !crouch ? Math.sin(wf*0.18)*18 : 0;

  // Skeleton anchors (all Y negative = above feet)
  const hipY      = crouch ? -14 : -24;
  const torsoH    = crouch ? 10  : 18;
  const torsoTopY = hipY - torsoH;   // shoulder level
  // upper body (torso+arms+head) all share the bob offset
  const uOff = bob; // applied via translate below

  // Shadow
  ctx.save(); ctx.fillStyle='rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(0,0,crouch?22:16,crouch?3.5:5,0,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // Shield visual — ring around Lester when shield is active and not broken
  const shieldOwned = typeof getUnlock !== 'undefined' && getUnlock('shield')?.owned;
  if(shieldOwned && !player.shieldBroken){
    const shieldAlpha = player.shieldFlash > 0
      ? 0.9   // bright flash when recently hit (shouldn't happen if not broken, but safety)
      : 0.35 + 0.1 * Math.sin(Date.now() * 0.004);
    ctx.save();
    ctx.strokeStyle=`rgba(140,210,255,${shieldAlpha})`;
    ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.ellipse(0,-PH/2+8, 22, PH/2+4, 0, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }
  // Shield broken — red flash
  if(player.shieldBroken && player.shieldFlash > 0){
    const a = player.shieldFlash / 400;
    ctx.save();
    ctx.strokeStyle=`rgba(255,80,80,${a * 0.8})`;
    ctx.lineWidth=3;
    ctx.beginPath(); ctx.ellipse(0,-PH/2+8, 22, PH/2+4, 0, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  // ── Legs ──
  if(crouch){
    ctx.save(); ctx.strokeStyle='#4a36a0'; ctx.lineWidth=7; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-3,hipY); ctx.lineTo(-16,hipY+10); ctx.lineTo(-10,-1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 3,hipY); ctx.lineTo( 16,hipY+10); ctx.lineTo( 10,-1); ctx.stroke();
    ctx.restore();
    ctx.fillStyle='#f5f5f5'; ctx.beginPath(); ctx.ellipse(-11,1,9,4,0.1,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#2a1f5e'; ctx.beginPath(); ctx.ellipse( 11,1,9,4,-0.1,0,Math.PI*2); ctx.fill();
  } else if(jumping){
    ctx.save(); ctx.strokeStyle='#4a36a0'; ctx.lineWidth=7; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-3,hipY); ctx.lineTo(-13,hipY+12); ctx.lineTo(-7,hipY+22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 3,hipY); ctx.lineTo( 13,hipY+12); ctx.lineTo(  7,hipY+22); ctx.stroke();
    ctx.restore();
    ctx.fillStyle='#f5f5f5'; ctx.beginPath(); ctx.ellipse(-7,hipY+24,7,3.5,-0.3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#2a1f5e'; ctx.beginPath(); ctx.ellipse( 7,hipY+24,7,3.5, 0.3,0,Math.PI*2); ctx.fill();
  } else {
    ctx.save(); ctx.strokeStyle='#3b2a7a'; ctx.lineWidth=7; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-2,hipY); ctx.lineTo(-4-swing*.5,hipY+14); ctx.lineTo(-6-swing*.5,hipY+22); ctx.stroke();
    ctx.fillStyle='#2a1f5e'; ctx.beginPath(); ctx.ellipse(-7-swing*.5,hipY+24,8,4,0.2,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.strokeStyle='#4a36a0'; ctx.lineWidth=7; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(2,hipY); ctx.lineTo(4+swing*.5,hipY+14); ctx.lineTo(8+swing*.5,hipY+22); ctx.stroke();
    ctx.fillStyle='#f5f5f5'; ctx.beginPath(); ctx.ellipse(9+swing*.5,hipY+24,8,4,-0.2,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // Override whole body for slide — Lester goes flat, legs extended forward
  if(state==='slide'){
    ctx.save();
    ctx.translate(0,-8); // lower to ground
    // Body horizontal
    ctx.fillStyle='#ddeeff'; ctx.beginPath(); ctx.ellipse(4,-10,16,7,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#aaccee'; ctx.fillRect(-4,-14,8,6);
    // Backpack flattened
    ctx.fillStyle='#c0392b'; ctx.beginPath(); ctx.ellipse(-6,-10,8,5,0,0,Math.PI*2); ctx.fill();
    // Legs out front
    ctx.strokeStyle='#4a36a0'; ctx.lineWidth=7; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(6,-4); ctx.lineTo(22,-4); ctx.stroke();
    ctx.fillStyle='#f5f5f5'; ctx.beginPath(); ctx.ellipse(24,-4,7,3.5,0,0,Math.PI*2); ctx.fill();
    // Head down
    ctx.fillStyle='#f0c890'; ctx.beginPath(); ctx.ellipse(2,-18,8,9,0.3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#5c3d1e'; ctx.beginPath(); ctx.ellipse(2,-25,7,5,0.3,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#333'; ctx.lineWidth=1.5;
    ctx.strokeRect(-4,-21,6,4); ctx.strokeRect(2,-21,6,4);
    ctx.fillStyle='#333';
    ctx.beginPath(); ctx.ellipse(-1,-19,1.5,1.5,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5,-19,1.5,1.5,0,0,Math.PI*2); ctx.fill();
    // Dust puff
    ctx.fillStyle='rgba(200,180,255,0.25)';
    ctx.beginPath(); ctx.ellipse(-10,-3,10,5,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
    return; // skip normal upper body draw below
  }

  // ── Upper body (torso + backpack + arms + head) ──
  // Single translate groups everything so bob moves them all together
  ctx.save();
  ctx.translate(0, torsoTopY + uOff); // (0,0) here = top of torso

  // Backpack
  ctx.fillStyle='#c0392b'; ctx.beginPath(); ctx.roundRect(-18,0,9,torsoH,2); ctx.fill();
  ctx.fillStyle='#e74c3c'; ctx.fillRect(-16,2,5,4);
  // Shirt
  ctx.fillStyle='#ddeeff'; ctx.beginPath(); ctx.roundRect(-8,0,18,torsoH,3); ctx.fill();
  ctx.fillStyle='#aaccee'; ctx.fillRect(-5,2,6,8);
  ctx.fillStyle='#888';    ctx.fillRect(-4,1,1,9); ctx.fillRect(-2,1,1,9);

  // Arms (shoulder at y=2 in local space)
  const sY=2;
  if(crouch){
    ctx.strokeStyle='#ddeeff'; ctx.lineWidth=6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-10,sY); ctx.lineTo(-17,sY+16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(  9,sY); ctx.lineTo( 16,sY+16); ctx.stroke();
  } else if(jumping){
    ctx.strokeStyle='#ddeeff'; ctx.lineWidth=6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-10,sY); ctx.lineTo(-21,sY-13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(  9,sY); ctx.lineTo( 20,sY-13); ctx.stroke();
  } else {
    ctx.strokeStyle='#ddeeff'; ctx.lineWidth=6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-10,sY); ctx.lineTo(-16+flail*.8,sY+12+Math.abs(flail)*.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(  9,sY); ctx.lineTo( 16-flail*.8,sY+12+Math.abs(flail)*.3); ctx.stroke();
  }

  // ── Head — positioned relative to top of torso (local 0,0) ──
  ctx.save();
  ctx.translate(-1, -2); // neck: 2px above torso top
  // Hair
  ctx.fillStyle='#5c3d1e';
  ctx.beginPath(); ctx.ellipse(0,-22,12,9,0.1,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4,-28); ctx.bezierCurveTo(7,-36,12,-32,8,-26); ctx.fill();
  // Face
  ctx.fillStyle='#f0c890'; ctx.beginPath(); ctx.ellipse(0,-14,10,11,0,0,Math.PI*2); ctx.fill();
  // Glasses
  ctx.strokeStyle='#333'; ctx.lineWidth=1.5;
  ctx.strokeRect(-9,-18,7,5); ctx.strokeRect(-1,-18,7,5);
  ctx.beginPath();
  ctx.moveTo(-2,-16); ctx.lineTo(-1,-16);
  ctx.moveTo(-9,-16); ctx.lineTo(-12,-15);
  ctx.moveTo( 6,-16); ctx.lineTo(  9,-15);
  ctx.stroke();
  // Eyes
  ctx.fillStyle='#333';
  ctx.beginPath(); ctx.ellipse(-5.5,-16,2,2,0,0,Math.PI*2); ctx.ellipse(2.5,-16,2,2,0,0,Math.PI*2); ctx.fill();
  // Mouth
  ctx.strokeStyle='#7a4020'; ctx.lineWidth=1.5;
  if(crouch){ ctx.beginPath(); ctx.moveTo(-4,-8); ctx.lineTo(4,-8); ctx.stroke(); }
  else if(jumping){ ctx.beginPath(); ctx.arc(0,-8,3,0,Math.PI*2); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(0,-9,4,0.2,Math.PI-0.2); ctx.stroke(); }
  ctx.restore(); // end head

  ctx.restore(); // end upper body
}

// ══════════════════════════════════════════════════════════════
//  FOG WALL DRAWING
// ══════════════════════════════════════════════════════════════
function drawFog() {
  // Fog appears on every chapter — always chasing Lester.
  if(fogX < cameraX - canvas.width * 0.5) return;

  // fogX = RIGHT edge of the fog wall in world-space.
  // The fog body extends leftward from there (off-screen left).
  // sx = screen-space position of the fog's right edge.
  const sx = wx(fogX);
  if(sx > canvas.width) return;

  // Gradient: fully opaque on the left, feathering to transparent at the right edge (sx).
  // This means the solid fog wall is always to the LEFT of sx.
  const feather = 80; // px of soft leading edge
  const grd = ctx.createLinearGradient(sx - feather, 0, sx, 0);
  grd.addColorStop(0, 'rgba(200,20,220,0.95)');
  grd.addColorStop(0.6, 'rgba(150,0,180,0.8)');
  grd.addColorStop(1, 'rgba(60,0,80,0)');
  ctx.fillStyle = grd;
  // Fill from left edge of screen to fogX (right edge), plus the feather
  ctx.fillRect(0, 0, sx, canvas.height);

  // Swirling tendrils near the leading edge
  const t = Date.now() * 0.001;
  for(let i = 0; i < 8; i++){
    const ty = (i/8)*canvas.height + Math.sin(t*1.2+i)*30;
    const tx = sx - 20 + Math.sin(t*0.8+i*1.3)*20;
    const tg = ctx.createRadialGradient(tx,ty,0,tx,ty,40);
    tg.addColorStop(0,'rgba(255,120,255,0.35)');
    tg.addColorStop(1,'rgba(255,120,255,0)');
    ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(tx,ty,40,0,Math.PI*2); ctx.fill();
  }

  // RUN! warning when fog is within 300px of player
  if(chapterTimer > FOG_DELAY){
    const playerDist = player.x - fogX;
    const dangerAlpha = Math.max(0, Math.min(1, 1 - playerDist/300));
    if(dangerAlpha > 0){
      ctx.save();
      ctx.globalAlpha = dangerAlpha * (0.6+0.4*Math.sin(t*6));
      ctx.fillStyle='#ff88ff'; ctx.font='bold 18px Courier New'; ctx.textAlign='center';
      ctx.fillText('RUN!', canvas.width/2, 60);
      ctx.restore();
    }
  }
}

