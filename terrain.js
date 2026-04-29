// terrain.js — world drawing: background, stars, mountains, trees, terrain, platforms
// Depends on: constants.js, levels.js

// ══════════════════════════════════════════════════════════════
//  BACKGROUND / WORLD DRAWING
// ══════════════════════════════════════════════════════════════
const stars = Array.from({length:120},()=>({
  x:rnd(0,8000), y:rnd(0,300), r:rnd(0.3,1.8), tw:rnd(0,Math.PI*2)
}));
const mountains = Array.from({length:40},(_,i)=>({
  x:i*210+rnd(0,80), h:rnd(90,210), w:rnd(140,240)
}));
const bgTrees = Array.from({length:100},(_,i)=>({
  x:i*80+rnd(0,40)+60, h:rnd(50,95)
}));

function ch2Tint(col, alpha=1) {
  // In chapter 2 sky shifts to warmer sunset
  return chapter===CHAPTER.TWO ? col : col;
}

// Cloud data for Ch4 — generated once, parallax scrolled
const clouds = Array.from({length:12},(_,i)=>({
  x: i*300 + Math.random()*200,
  y: 30 + Math.random()*120,
  w: 80 + Math.random()*120,
  h: 30 + Math.random()*40,
  spd: 0.08 + Math.random()*0.06,  // parallax speed
}));

function drawBg(ts) {
  let sky = ctx.createLinearGradient(0,0,0,canvas.height);
  if(chapter===CHAPTER.ONE){
    // Ch1: deep night — mysterious, unknown world
    sky.addColorStop(0,'#0d0820'); sky.addColorStop(0.65,'#1a1040'); sky.addColorStop(1,'#2d1a5e');
  } else if(chapter===CHAPTER.TWO){
    // Ch2: blood crimson — tension rising, fog and pits introduced
    sky.addColorStop(0,'#1a0810'); sky.addColorStop(0.5,'#3d1020'); sky.addColorStop(1,'#5c2040');
  } else if(chapter===CHAPTER.THREE){
    // Ch3: deep teal/forest — Lester finding his footing, platforms emerge
    sky.addColorStop(0,'#031a18'); sky.addColorStop(0.5,'#0a3530'); sky.addColorStop(1,'#1a5040');
  } else {
    // Ch4: stormy amber — the world at its most dangerous, Swoopers debut
    sky.addColorStop(0,'#1a1000'); sky.addColorStop(0.5,'#3d2500'); sky.addColorStop(1,'#5c3800');
  }
  ctx.fillStyle=sky; ctx.fillRect(0,0,canvas.width,canvas.height);

  // Ch4 storm clouds — dark rolling shapes with amber underlighting
  if(chapter===CHAPTER.FOUR){
    const t=(ts||0)*0.001;
    clouds.forEach(cl=>{
      const sx=((cl.x - cameraX*cl.spd)%canvas.width+canvas.width*1.5)%(canvas.width*1.5)-canvas.width*0.25;
      // Cloud body
      const cg=ctx.createRadialGradient(sx,cl.y,0,sx,cl.y,cl.w/2);
      cg.addColorStop(0,'rgba(60,35,5,0.75)');
      cg.addColorStop(0.6,'rgba(40,22,2,0.5)');
      cg.addColorStop(1,'rgba(20,10,0,0)');
      ctx.fillStyle=cg;
      ctx.beginPath(); ctx.ellipse(sx,cl.y,cl.w/2,cl.h/2,0,0,Math.PI*2); ctx.fill();
      // Amber underlighting — storm glow
      const ug=ctx.createRadialGradient(sx,cl.y+cl.h/2,0,sx,cl.y+cl.h/2,cl.w/2.5);
      ug.addColorStop(0,'rgba(255,120,0,0.12)');
      ug.addColorStop(1,'rgba(255,120,0,0)');
      ctx.fillStyle=ug;
      ctx.beginPath(); ctx.ellipse(sx,cl.y+cl.h/2,cl.w/2.5,cl.h/3,0,0,Math.PI*2); ctx.fill();
    });
  }
}

function drawStars(ts) {
  stars.forEach(s=>{
    const sx=((s.x-cameraX*0.05)%canvas.width+canvas.width)%canvas.width;
    ctx.beginPath(); ctx.arc(sx,s.y,s.r,0,Math.PI*2);
    const col = chapter===CHAPTER.TWO ? '255,180,120' : '255,230,180';
    ctx.fillStyle=`rgba(${col},${0.4+0.4*Math.sin(s.tw+ts*0.001)})`; ctx.fill();
  });
}

function drawMountains() {
  const col1 = chapter===CHAPTER.TWO ? '#4a1030' : '#2a1660';
  const col2 = chapter===CHAPTER.TWO ? 'rgba(255,160,100,0.2)' : 'rgba(200,180,255,0.22)';
  mountains.forEach(m=>{
    const sx=((wx(m.x)*0.2+canvas.width*10)%(canvas.width*1.5))-canvas.width*0.25;
    ctx.beginPath(); ctx.moveTo(sx-m.w/2,GY()-8); ctx.lineTo(sx,GY()-m.h-8); ctx.lineTo(sx+m.w/2,GY()-8);
    ctx.closePath(); ctx.fillStyle=col1; ctx.fill();
    ctx.beginPath(); ctx.moveTo(sx-m.w*0.12,GY()-m.h*0.72-8); ctx.lineTo(sx,GY()-m.h-8); ctx.lineTo(sx+m.w*0.12,GY()-m.h*0.72-8);
    ctx.closePath(); ctx.fillStyle=col2; ctx.fill();
  });
}

function drawBgTrees() {
  bgTrees.forEach(tr=>{
    const sx=wx(tr.x);
    if(sx<-60||sx>canvas.width+60) return;
    if(!isGroundAt(tr.x)) return;
    const trunk = chapter===CHAPTER.TWO ? '#2a0d18' :
                  chapter===CHAPTER.THREE ? '#0a2a1a' :
                  chapter===CHAPTER.FOUR  ? '#1a0d00' : '#1a0d38';
    ctx.fillStyle=trunk; ctx.fillRect(sx-4,GY()-tr.h,8,tr.h);
    [0,0.35,0.65].forEach((off,i)=>{
      const lw=(1-off)*34+10, lh=tr.h*0.45;
      ctx.beginPath();
      ctx.moveTo(sx,GY()-tr.h-18+off*tr.h*0.5);
      ctx.lineTo(sx-lw/2,GY()-tr.h+off*tr.h*0.5+lh*0.5);
      ctx.lineTo(sx+lw/2,GY()-tr.h+off*tr.h*0.5+lh*0.5);
      ctx.closePath();
      const d=30+i*15;
      // Tree colors per chapter — reinforce the world palette shift
      const r2 = chapter===CHAPTER.TWO ? d*1.5|0 : chapter===CHAPTER.FOUR ? d*1.8|0 : d*0.4|0;
      const g2 = chapter===CHAPTER.TWO ? d*0.6|0 : chapter===CHAPTER.THREE ? d*2.0|0 : chapter===CHAPTER.FOUR ? d*0.8|0 : d*1.4|0;
      const b2 = chapter===CHAPTER.TWO ? d*0.8|0 : chapter===CHAPTER.THREE ? d*1.2|0 : chapter===CHAPTER.FOUR ? d*0.2|0 : d*2.2|0;
      ctx.fillStyle=`rgb(${r2},${g2},${b2})`; ctx.fill();
    });
  });
}

function drawTerrain() {
  const gy=GY();
  const groundCol = chapter===CHAPTER.TWO ? '#2d1020' :
                    chapter===CHAPTER.THREE ? '#0a2a20' :
                    chapter===CHAPTER.FOUR  ? '#2a1800' : '#1e0d40';
  const glowTop   = chapter===CHAPTER.TWO ? 'rgba(255,80,80,0.5)' :
                    chapter===CHAPTER.THREE ? 'rgba(40,220,120,0.45)' :
                    chapter===CHAPTER.FOUR  ? 'rgba(255,140,20,0.5)' : 'rgba(140,100,255,0.55)';
  const tileCol   = chapter===CHAPTER.TWO ? 'rgba(200,60,80,0.22)' :
                    chapter===CHAPTER.THREE ? 'rgba(40,180,100,0.18)' :
                    chapter===CHAPTER.FOUR  ? 'rgba(220,120,20,0.22)' : 'rgba(120,80,220,0.22)';

  for(const seg of terrain){
    const sx=wx(seg.x);
    if(sx>canvas.width+20||sx+seg.w<-20) continue;
    if(seg.type==='ground'){
      ctx.fillStyle=groundCol; ctx.fillRect(sx,gy,seg.w,canvas.height-gy);
      const tg=ctx.createLinearGradient(0,gy-6,0,gy+6);
      tg.addColorStop(0,glowTop); tg.addColorStop(1,'rgba(80,40,160,0)');
      ctx.fillStyle=tg; ctx.fillRect(sx,gy-6,seg.w,12);
      for(let tx=Math.ceil(seg.x/40)*40; tx<seg.x+seg.w; tx+=40){
        const tsx=wx(tx); if(tsx<-2||tsx>canvas.width+2) continue;
        ctx.strokeStyle=tileCol; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(tsx,gy+4); ctx.lineTo(tsx,gy+16); ctx.stroke();
      }
    } else {
      const pg=ctx.createLinearGradient(0,gy,0,canvas.height);
      pg.addColorStop(0,'rgba(5,2,18,0.97)'); pg.addColorStop(1,'#000');
      ctx.fillStyle=pg; ctx.fillRect(sx,gy,seg.w,canvas.height-gy);
      const gw=22;
      const lg=ctx.createLinearGradient(sx,0,sx+gw,0);
      lg.addColorStop(0,'rgba(220,40,40,0.45)'); lg.addColorStop(1,'rgba(220,40,40,0)');
      ctx.fillStyle=lg; ctx.fillRect(sx,gy-8,gw,14);
      const rg=ctx.createLinearGradient(sx+seg.w-gw,0,sx+seg.w,0);
      rg.addColorStop(0,'rgba(220,40,40,0)'); rg.addColorStop(1,'rgba(220,40,40,0.45)');
      ctx.fillStyle=rg; ctx.fillRect(sx+seg.w-gw,gy-8,gw,14);
    }
  }
}

function drawPlatforms() {
  for(const p of platforms){
    const sx=wx(p.x);
    if(sx>canvas.width+10||sx+p.w<-10) continue;
    if(p.style==='stone'){
      ctx.fillStyle='#3d2d6e'; ctx.beginPath(); ctx.roundRect(sx,p.y,p.w,p.h,3); ctx.fill();
      const sg=ctx.createLinearGradient(0,p.y,0,p.y+p.h);
      sg.addColorStop(0,'rgba(160,120,255,0.45)'); sg.addColorStop(1,'rgba(60,30,120,0)');
      ctx.fillStyle=sg; ctx.beginPath(); ctx.roundRect(sx,p.y,p.w,p.h,3); ctx.fill();
      ctx.strokeStyle='rgba(80,55,140,0.5)'; ctx.lineWidth=1;
      for(let bx=sx+24;bx<sx+p.w-10;bx+=24){ctx.beginPath();ctx.moveTo(bx,p.y);ctx.lineTo(bx,p.y+p.h);ctx.stroke();}
      ctx.fillStyle='rgba(60,180,80,0.3)';
      for(let mx=sx+8;mx<sx+p.w-8;mx+=18){ctx.beginPath();ctx.arc(mx,p.y+3,2.5,0,Math.PI*2);ctx.fill();}
    } else if(p.style==='wood'){
      ctx.fillStyle='#6b3a1f'; ctx.beginPath(); ctx.roundRect(sx,p.y,p.w,p.h,2); ctx.fill();
      ctx.fillStyle='#8b4a24';
      for(let bx=sx;bx<sx+p.w;bx+=20){const bw=Math.min(19,sx+p.w-bx);ctx.fillRect(bx+1,p.y+1,bw-2,p.h-2);}
      ctx.fillStyle='rgba(200,130,60,0.4)'; ctx.fillRect(sx,p.y,p.w,3);
    } else {
      ctx.fillStyle='rgba(80,200,220,0.22)'; ctx.beginPath(); ctx.roundRect(sx,p.y,p.w,p.h,4); ctx.fill();
      ctx.strokeStyle='rgba(140,240,255,0.65)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.roundRect(sx,p.y,p.w,p.h,4); ctx.stroke();
      ctx.fillStyle='rgba(200,240,255,0.15)'; ctx.fillRect(sx+4,p.y+2,p.w-8,4);
    }
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.beginPath();
    ctx.ellipse(sx+p.w/2,p.y+p.h+5,p.w/2-4,4,0,0,Math.PI*2); ctx.fill();
  }
}

