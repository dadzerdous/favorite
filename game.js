// game.js
import { connectNet, disconnectNet, sendMove, sendHit, sendReady, sendProfile, isConnected, remoteEnemies, remotePlayers, portal, serverPhase, myId } from "./net.js";import { Player } from './entities.js';
import { InputHandler } from './input.js';
import { CombatSystem, AbilitySystem, updatePoisonZones, updateZombies, poisonZones, zombies, WAVE_CONFIG } from './systems.js';
import { MapSystem } from './map.js';
import { drawHUD, drawTicker, drawOverlayMessage, drawSkillBar, drawPortal, drawQuitButton, drawBossBar, drawWaveCounter, drawHubZones, drawPoisonZones, drawZombies, drawPlayerTag, drawEnemyBars, drawDeathScreen, skillButtons, quitButton } from './ui.js';// ============================================================
const GOD_MODE = false;

// ============================================================
//  CANVAS SETUP
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const wrap = document.getElementById('canvas-wrap');
    canvas.width  = wrap.offsetWidth;
    canvas.height = wrap.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ============================================================
//  CORE OBJECTS
// ============================================================
const input    = new InputHandler();
const player   = new Player();
const combat   = new CombatSystem();
const abilitySys = new AbilitySystem(player);

// ============================================================
//  GAME STATE
// ============================================================
let gameState  = 'SPLASH';   // SPLASH | MESSAGE | WAVE | DEAD
let arenaSize  = 450;
let shockwaves = [];
let hazards    = [];
let tickerMsg  = { text: "", x: 0 };
let currentMessage = { title: "", body: "", color: '#ffcc00', big: false };
let bombs      = 0;          // consumable from shop
let panelOpen  = false;

// ============================================================
//  WAIT FOR SPLASH → GAME READY SIGNAL
// ============================================================
function waitForStart() {
    if (!window._gameReady) {
        requestAnimationFrame(waitForStart);
        return;
    }
    initGame();
}
requestAnimationFrame(waitForStart);

// ============================================================
//  INIT GAME
// ============================================================
function initGame() {
    if (window._continueGame) {
        const loaded = player.loadProfile();
        if (loaded) {
            applyGodMode();
connectNet();
const profileInterval = setInterval(() => {
    if (isConnected()) {
        sendProfile(player.avatar, player.className, player.heroName || 'HERO');
        clearInterval(profileInterval);
    }
}, 100);
            hazards = MapSystem.generateHazards(arenaSize);
            gameState = 'MESSAGE';
            currentMessage = {
                title: "WELCOME BACK",
                body: `${player.avatar} ${player.className} — Level ${player.level}`,
                color: '#00ffcc', big: false
            };
            startLoop();
            return;
        }
    }

    // New game
    player.initClass(window._startClass || 'fire');
    applyGodMode();
connectNet();
const profileInterval = setInterval(() => {
    if (isConnected()) {
        sendProfile(player.avatar, player.className, player.heroName || 'HERO');
        clearInterval(profileInterval);
    }
}, 100);
    hazards = MapSystem.generateHazards(arenaSize);
    gameState = 'MESSAGE';
    currentMessage = {
        title: "ASCENSION BEGINS",
        body: `${player.avatar} ${player.className} — Kill enemies to find the Portal`,
        color: '#ffcc00', big: true
    };
    startLoop();
}

// ============================================================
//  GOD MODE APPLY
// ============================================================
function applyGodMode() {
    if (!GOD_MODE) return;
    player.gold = 9999;
    player.statPoints = 99;
    player.skillTokens = 99;
    Object.keys(player.stats).forEach(k => player.stats[k] = player.statMax[k]);
    Object.keys(player.skills).forEach(k => {
        player.skills[k].tier  = player.skills[k].maxTier;
        player.skills[k].cooldown = 0;
    });
    window.triggerTicker("⚡ GOD MODE ACTIVE");
}

// ============================================================
//  MENU FUNCTIONS (called from HTML)
// ============================================================
window.buyItem = (type) => {
    const costs = { potion:50, damage:100, firerate:80, maxhp:120, bomb:60, reset:150 };
    const cost = costs[type];
    if (player.gold < cost) { window.triggerTicker("NOT ENOUGH GOLD"); return; }
    player.gold -= cost;

    switch (type) {
        case 'potion':   player.hp = Math.min(player.hp + 5, player.maxHp); window.triggerTicker("❤️ HEALED +5 HP"); break;
        case 'damage':   player.weapons[0].baseDamage++; window.triggerTicker("⚔️ BASE DAMAGE +1"); break;
        case 'firerate':
            player.weapons[0].baseFireRate = Math.max(200, player.weapons[0].baseFireRate - 80);
            window.triggerTicker("💨 FIRE RATE +1");
            break;
        case 'maxhp':    player.baseHp += 5; player.hp = Math.min(player.hp + 5, player.maxHp); window.triggerTicker("🛡️ MAX HP +5"); break;
        case 'bomb':     bombs++; window.triggerTicker(`💣 BOMB x${bombs} (tap skill 4 to use)`); break;
        case 'reset':
            Object.values(player.skills).forEach(s => s.cooldown = 0);
            window.triggerTicker("⚡ COOLDOWNS RESET");
            break;
    }
    player.saveProfile();
    updateMenuUI();
};

window.closeMenus = () => {
    document.getElementById('shop-menu').style.display  = 'none';
    document.getElementById('skill-menu').style.display = 'none';
    document.getElementById('stat-menu').style.display  = 'none';
    player.controlMode = 'HUB';
    player.activePad   = null;
};

// Panel upgrade callbacks (called from HTML panel buttons)
window.panelUpgradeStat = (type) => {
    if (player.upgradeStat(type)) {
        window.triggerTicker(`▲ ${type.toUpperCase()} UPGRADED`);
        window.updatePanel(player);
    }
};

window.panelUpgradeSkill = (key) => {
    if (player.upgradeSkill(key)) {
        window.triggerTicker(`★ ${player.skills[key].name.toUpperCase()} → TIER ${player.skills[key].tier}`);
        player.saveProfile();
        window.updatePanel(player);
    }
};

function updateMenuUI() {
    document.getElementById('shop-gold').innerText = player.gold;
    window.updatePanel(player);
}

// ============================================================
//  LEVEL UP / PROGRESSION
// ============================================================
function checkLevelUp() {
    if (player.xp < player.xpToNext) return;
    player.level++;
    player.xp = 0;
    player.xpToNext = Math.floor(player.xpToNext * 1.25);
    player.statPoints++;
    player.waveNumber = player.waveNumber || 0;

    // Skill token every 3 levels
    if (player.level % 3 === 0) {
        player.skillTokens++;
        window.triggerTicker(`🎉 LEVEL ${player.level}! +1 STAT PT  +1 SKILL TOKEN`);
    } else {
        window.triggerTicker(`🎉 LEVEL ${player.level}! +1 STAT POINT`);
    }

    player.saveProfile();
    window.updatePanel(player);
}

// ============================================================
//  UPDATE
// ============================================================
function update(time) {
    if (gameState === 'SPLASH' || gameState === 'MESSAGE') return;
    if (gameState === 'DEAD') return;

    // --- APPLY STATS ---
    player.weapons[0].damage   = player.currentDamage;
    player.weapons[0].fireRate = player.currentFireRate;

    // --- TICKER ---
    if (tickerMsg.text) {
        tickerMsg.x -= 3;
        if (tickerMsg.x < -canvas.width) tickerMsg.text = "";
    }

    // --- LEVEL UP ---
    checkLevelUp();

    // --- WAVE PHASE CHANGE ---
    if (player.lastServerPhase === 'WAVE' && serverPhase === 'HUB') {
        player.waveNumber = (player.waveNumber || 0) + 1;
        player.gold += 20 + player.waveNumber * 5;
        window.triggerTicker(`WAVE ${player.waveNumber} CLEARED! +${20 + player.waveNumber * 5}g`);

        // Announce next wave type
        const next = player.waveNumber + 1;
        if (WAVE_CONFIG.isBossWave(next)) {
            setTimeout(() => showAnnouncement(
                `⚠️ BOSS INCOMING`,
                `Wave ${next} — Prepare yourself!`,
                '#ff0044', true
            ), 1500);
        } else if (WAVE_CONFIG.isMiniBossWave(next)) {
            setTimeout(() => showAnnouncement(
                `⚡ MINI-BOSS`,
                `Wave ${next} — A powerful foe approaches`,
                '#ff8800', false
            ), 1500);
        }
        player.saveProfile();
    }
    player.lastServerPhase = serverPhase;

    // --- COOLDOWNS ---
    Object.values(player.skills).forEach(s => {
        if (s.cooldown > 0) s.cooldown--;
    });

    // --- GOD MODE: no cooldowns ---
    if (GOD_MODE) {
        Object.values(player.skills).forEach(s => s.cooldown = 0);
        player.hp = player.maxHp;
    }

    // --- MOVEMENT ---
    const move = input.getMovement();
    if (move.x !== 0 || move.y !== 0) player.currentDir = move;

    let nextX = player.x + move.x * player.speed;
    let nextY = player.y + move.y * player.speed;
    const pRadius = 20;

    // --- HUB MODE ---
    if (serverPhase === 'HUB') {
        if (player.controlMode !== 'UI') player.controlMode = 'HUB';

        if (player.controlMode === 'HUB') {
            player.x = nextX;
            player.y = nextY;
        }

        // Walk-on pads
        if (player.controlMode === 'HUB') {
            if      (Math.hypot(player.x + 200, player.y) < 60)          enterPad('SHOP');
            else if (Math.hypot(player.x - 200, player.y) < 60)          enterPad('SKILLS');
            else if (Math.hypot(player.x, player.y - 200) < 60)          enterPad('STATS');
            else if (player.y < -arenaSize + 120)                         sendReady(true);
            else                                                           sendReady(false);
        }

    // --- WAVE MODE ---
    } else {
        player.controlMode = 'WAVE';

        // Keyboard skills
        for (let i = 0; i < 4; i++) {
            const codes = [['Digit1','Numpad1'],['Digit2','Numpad2'],['Digit3','Numpad3'],['Digit4','Numpad4']];
            if (codes[i].some(c => input.keys[c]))
                abilitySys.tryTriggerSkill(i, remoteEnemies, shockwaves, sendHit);
        }

        // Portal
        if (portal) {
            sendReady(Math.hypot(player.x - portal.x, player.y - portal.y) < 100);
        }

        // Hazard collision
        let hitBarrier = false;
        hazards.forEach(h => {
            if (nextX+pRadius > h.x && nextX-pRadius < h.x+50 &&
                nextY+pRadius > h.y && nextY-pRadius < h.y+50) {
                if (h.type === 'BARRIER') hitBarrier = true;
                else if (h.type === 'TRAP') player.hp -= 0.05;
            }
        });
        if (!hitBarrier) { player.x = nextX; player.y = nextY; }

        // Enemy collision / damage
        remoteEnemies.forEach(en => {
            if (Math.hypot(en.x - player.x, en.y - player.y) < pRadius + (en.radius || 15)) {
                if (!GOD_MODE) player.hp -= 0.04;
            }
        });

        // Poison zones
        updatePoisonZones(remoteEnemies, sendHit);
        updateZombies(remoteEnemies, sendHit);

        // Combat
        combat.updateWeapons(player, remoteEnemies, time);
        combat.updateProjectiles(remoteEnemies, arenaSize, sendHit, player);
    }

    // --- CLAMP TO ARENA ---
    player.x = Math.max(-arenaSize + pRadius, Math.min(arenaSize - pRadius, player.x));
    player.y = Math.max(-arenaSize + pRadius, Math.min(arenaSize - pRadius, player.y));

    sendMove(player.x, player.y);

    // --- DEATH CHECK ---
    if (player.hp <= 0 && !GOD_MODE) {
        player.hp = 0;
        gameState = 'DEAD';
        player.saveProfile();
    }

    // --- SHOCKWAVES ---
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const s = shockwaves[i];
        s.r += 4;
        s.alpha -= 0.025;
        if (s.alpha <= 0) shockwaves.splice(i, 1);
    }

    // --- PANEL UPDATE (throttled to every 30 frames) ---
    if (Math.floor(time / 30) % 2 === 0) window.updatePanel(player);
}

// ============================================================
//  ENTER HUB PAD
// ============================================================
function enterPad(type) {
    if (player.controlMode !== 'HUB') return;
    player.controlMode = 'UI';
    player.activePad   = type;
    input.moveDir = { x: 0, y: 0 };
    updateMenuUI();

    if (type === 'SHOP')   document.getElementById('shop-menu').style.display  = 'flex';
    if (type === 'SKILLS') document.getElementById('skill-menu').style.display = 'flex';
    if (type === 'STATS')  document.getElementById('stat-menu').style.display  = 'flex';
}

// ============================================================
//  SHOW ANNOUNCEMENT
// ============================================================
function showAnnouncement(title, body, color = '#ffcc00', big = false) {
    currentMessage = { title, body, color, big };
    gameState = 'MESSAGE';
}

// ============================================================
//  DRAW
// ============================================================
function draw() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'SPLASH') return;

    // --- DEAD SCREEN ---
    if (gameState === 'DEAD') {
        drawDeathScreen(ctx, canvas);
        return;
    }

    // --- WORLD SPACE ---
    ctx.save();
const scale = Math.min(canvas.width, canvas.height) / (arenaSize * 2.2);
ctx.translate(canvas.width / 2, canvas.height / 2);
ctx.scale(scale, scale);
ctx.translate(-player.x, -player.y);

    // Floor
    if (serverPhase === 'HUB') {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-arenaSize, -arenaSize, arenaSize * 2, arenaSize * 2);
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        for (let i = -arenaSize; i < arenaSize; i += 100) {
            for (let j = -arenaSize; j < arenaSize; j += 100) {
                if ((i / 100 + j / 100) % 2 === 0) {
                    ctx.fillStyle = '#222';
                    ctx.fillRect(i, j, 100, 100);
                }
            }
        }
        drawHubZones(ctx, arenaSize);
    } else {
        ctx.fillStyle = '#12101f';
        ctx.fillRect(-arenaSize, -arenaSize, arenaSize * 2, arenaSize * 2);
        ctx.strokeStyle = '#2a1b4d';
        ctx.lineWidth = 1;
        for (let i = -arenaSize; i <= arenaSize; i += 50) {
            ctx.beginPath(); ctx.moveTo(i, -arenaSize); ctx.lineTo(i, arenaSize); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-arenaSize, i); ctx.lineTo(arenaSize, i); ctx.stroke();
        }
    }

    // Border
    ctx.lineWidth = 6;
    ctx.strokeStyle = serverPhase === 'HUB' ? '#00ffcc' : '#ffff00';
    ctx.strokeRect(-arenaSize, -arenaSize, arenaSize * 2, arenaSize * 2);
    ctx.lineWidth = 1;

    // Hazards
    hazards.forEach(h => {
        if (h.type === 'BARRIER') {
            ctx.fillStyle = '#445';
            ctx.strokeStyle = '#667';
        } else {
            ctx.fillStyle = 'rgba(255,60,0,0.25)';
            ctx.strokeStyle = '#ff3300';
        }
        ctx.lineWidth = 1;
        ctx.fillRect(h.x, h.y, 50, 50);
        ctx.strokeRect(h.x, h.y, 50, 50);
        ctx.font = "20px serif";
        ctx.textAlign = "center";
        ctx.fillStyle = h.type === 'BARRIER' ? '#889' : '#ff6633';
        ctx.fillText(h.type === 'BARRIER' ? '🧱' : '🔺', h.x + 25, h.y + 30);
    });

    // Poison zones
    drawPoisonZones(ctx, poisonZones);

    // Shockwaves
    shockwaves.forEach(s => {
        ctx.save();
        ctx.strokeStyle = s.color || 'white';
        ctx.lineWidth   = 4;
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    });

    // Portal
    drawPortal(ctx, portal);

    // Remote players
Object.values(remotePlayers).forEach(p => {
        if (p.id === myId || p.id === window._myId) return;
        if (!p.avatar || p.avatar === '❓') return; // skip uninitialized players
        ctx.font = "32px serif";
        ctx.textAlign = "center";
        ctx.fillText(p.avatar || '🧙', p.x, p.y + 12);
        ctx.fillStyle = '#00ffcc';
        ctx.font = "10px monospace";
        ctx.fillText(p.className || '', p.x, p.y - 22);
    });

    // Enemies
    remoteEnemies.forEach(en => {
        ctx.font = `${(en.radius || 15) * 1.8}px serif`;
        ctx.textAlign = "center";
        ctx.fillText(en.emoji || '👾', en.x, en.y + (en.radius || 15) * 0.6);
    });
    drawEnemyBars(ctx, remoteEnemies);

    // Zombies
    drawZombies(ctx, zombies);

    // Projectiles
    combat.projectiles.forEach(p => {
        ctx.fillStyle = p.color || 'orange';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = p.color || 'orange';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Local player
    ctx.font = "36px serif";
    ctx.textAlign = "center";
    ctx.fillText(player.avatar, player.x, player.y + 12);
    drawPlayerTag(ctx, player);

    // Shield ring
    if (player.shield > 0) {
        ctx.save();
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        player.shield--;
    }

    ctx.restore(); // end world space

    // --- SCREEN SPACE HUD ---
    if (gameState === 'MESSAGE') {
        drawOverlayMessage(ctx, canvas, currentMessage);
        return;
    }

    drawHUD(ctx, canvas, player);
    drawWaveCounter(ctx, canvas, player.waveNumber || 0, serverPhase, WAVE_CONFIG);
    drawSkillBar(ctx, canvas, player);
    drawQuitButton(ctx, canvas);
    drawTicker(ctx, canvas, tickerMsg);
    drawBossBar(ctx, canvas, remoteEnemies);
}

// ============================================================
//  TOUCH — SKILL BAR
// ============================================================
window.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const tx = touch.clientX;
    const ty = touch.clientY;
    handleSkillTouch(tx, ty);
}, { passive: true });

window.addEventListener('mousedown', (e) => {
    handleSkillTouch(e.clientX, e.clientY);
    handleQuitTouch(e.clientX, e.clientY);
    handleMessageDismiss(e);
    handleDeathDismiss(e);
});

function handleSkillTouch(tx, ty) {
    if (gameState !== 'WAVE' && serverPhase !== 'WAVE') return;
    skillButtons.forEach((btn, i) => {
        if (!btn.x) return;
        if (tx > btn.x && tx < btn.x + btn.w && ty > btn.y && ty < btn.y + btn.h) {
            abilitySys.tryTriggerSkill(i, remoteEnemies, shockwaves, sendHit);
        }
    });
}

function handleQuitTouch(mx, my) {
    if (!quitButton) return;
    if (mx > quitButton.x && mx < quitButton.x + quitButton.w &&
        my > quitButton.y && my < quitButton.y + quitButton.h) {
        player.saveProfile();
        disconnectNet();
        location.reload();
    }
}

function handleMessageDismiss(e) {
    if (gameState === 'MESSAGE') {
        gameState = 'WAVE';
    }
}

function handleDeathDismiss(e) {
    if (gameState === 'DEAD') {
        // Respawn with half HP
        player.hp = Math.ceil(player.maxHp / 2);
        gameState = 'WAVE';
    }
}

// ============================================================
//  TICKER
// ============================================================
window.triggerTicker = (text) => {
    tickerMsg.text = text;
    tickerMsg.x    = canvas.width;
};

// ============================================================
//  MAIN LOOP
// ============================================================
function startLoop() {
    function ticker(t) {
        update(t);
        draw();
        requestAnimationFrame(ticker);
    }
    requestAnimationFrame(ticker);
            }
