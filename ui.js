// ui.js

const ICON_SIZE = 55;
const PADDING = 10;
const HOTBAR_Y_OFFSET = 90;

export let quitButton = { x: 0, y: 10, w: 80, h: 30 };
export let skillButtons = []; // populated by drawSkillBar, used for touch

// ============================================================
//  SKILL BAR (bottom center, touch-friendly)
// ============================================================
export function drawSkillBar(ctx, canvas, player) {
    const keys = player.getSkillKeys();
    const totalWidth = (ICON_SIZE * keys.length) + (PADDING * (keys.length - 1));
    const startX = (canvas.width / 2) - (totalWidth / 2);
    const y = canvas.height - HOTBAR_Y_OFFSET;

    skillButtons = []; // reset each frame

    keys.forEach((key, index) => {
        const skill = player.skills[key];
        const x = startX + index * (ICON_SIZE + PADDING);
        const unlocked = skill.tier > 0;

        skillButtons.push({ key, x, y, w: ICON_SIZE, h: ICON_SIZE });

        // Background
        ctx.fillStyle = unlocked ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.4)';
        ctx.fillRect(x, y, ICON_SIZE, ICON_SIZE);

        // Border — colour by tier
        const borderColors = ['#333', '#888', '#ffcc00', '#ff4400'];
        ctx.strokeStyle = borderColors[skill.tier] || '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, ICON_SIZE, ICON_SIZE);

        // Icon
        ctx.font = "26px serif";
        ctx.textAlign = "center";
        if (unlocked) {
            ctx.globalAlpha = 1;
            ctx.fillText(skill.icon, x + ICON_SIZE / 2, y + 32);
        } else {
            ctx.globalAlpha = 0.4;
            ctx.fillText('🔒', x + ICON_SIZE / 2, y + 32);
            ctx.globalAlpha = 1;
        }

        // Cooldown overlay
        if (skill.cooldown > 0) {
            const ratio = skill.cooldown / skill.maxCD;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(x, y + ICON_SIZE * (1 - ratio), ICON_SIZE, ICON_SIZE * ratio);
            ctx.fillStyle = 'white';
            ctx.font = "bold 13px monospace";
            ctx.textAlign = "center";
            ctx.fillText(Math.ceil(skill.cooldown / 20), x + ICON_SIZE / 2, y + 32);
        }

        // Slot number label
        ctx.fillStyle = '#ffff00';
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        ctx.fillText(index + 1, x + 4, y + 12);

        // Tier pips (bottom of button)
        for (let t = 0; t < skill.maxTier; t++) {
            ctx.fillStyle = t < skill.tier ? '#ffcc00' : '#333';
            ctx.fillRect(x + 4 + t * 10, y + ICON_SIZE - 6, 8, 4);
        }
    });

    ctx.globalAlpha = 1;
}

// ============================================================
//  HUD (HP bar, XP bar, gold, level)
// ============================================================
export function drawHUD(ctx, canvas, player) {
    const barW = Math.min(220, canvas.width * 0.35);

    // --- HP Bar ---
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(20, canvas.height - 44, barW, 18);
    ctx.fillStyle = hpRatio > 0.5 ? '#ff0044' : hpRatio > 0.25 ? '#ff8800' : '#ff0000';
    ctx.fillRect(20, canvas.height - 44, barW * hpRatio, 18);
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, canvas.height - 44, barW, 18);

    // Shield overlay
    if (player.shield > 0) {
        ctx.fillStyle = 'rgba(0,200,255,0.4)';
        ctx.fillRect(20, canvas.height - 44, barW * Math.min(1, player.shield / 30), 18);
    }

    ctx.fillStyle = 'white';
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`HP ${Math.ceil(player.hp)} / ${player.maxHp}`, 24, canvas.height - 30);

    // --- XP Bar ---
    const xpRatio = player.xp / player.xpToNext;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(20, 20, canvas.width - 40, 6);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(20, 20, (canvas.width - 40) * xpRatio, 6);

    // --- Level / Class / Gold ---
    ctx.fillStyle = '#00ffcc';
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
        `LVL ${player.level}  ${player.avatar}  ${player.className}  💰 ${player.gold}`,
        20, 46
    );

    // --- Stat / Skill tokens available indicator ---
    if (player.statPoints > 0) {
        ctx.fillStyle = '#ffcc00';
        ctx.font = "bold 13px monospace";
        ctx.fillText(`▲ ${player.statPoints} STAT PT${player.statPoints > 1 ? 'S' : ''}`, 20, 66);
    }
    if (player.skillTokens > 0) {
        ctx.fillStyle = '#00ffcc';
        ctx.font = "bold 13px monospace";
        ctx.fillText(`★ ${player.skillTokens} SKILL TOKEN${player.skillTokens > 1 ? 'S' : ''}`, 20, 84);
    }
}

// ============================================================
//  STATS PANEL (right side, opens/closes without overlapping canvas)
// ============================================================
export function drawStatsPanel(ctx, canvas, player, panelOpen) {
    if (!panelOpen) return;

    const PW = 210; // panel width — must match JS resize value
    const x = canvas.width; // panel is drawn OUTSIDE canvas in HTML, but
                             // we draw a matching overlay at right edge for
                             // players who view it on canvas fallback
    // The actual panel is HTML — this function is a no-op for the canvas
    // Panel is handled entirely in HTML/CSS (see index.html)
}

// ============================================================
//  BOSS HEALTH BAR
// ============================================================
export function drawBossBar(ctx, canvas, enemies) {
    const boss = enemies.find(e => e.type === 'boss' || e.type === 'miniboss');
    if (!boss) return;

    const barW = Math.min(400, canvas.width * 0.6);
    const barH = 20;
    const x = (canvas.width - barW) / 2;
    const y = 60;
    const ratio = Math.max(0, boss.hp / boss.maxHp);

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(x - 2, y - 2, barW + 4, barH + 4);

    // Bar fill
    ctx.fillStyle = boss.type === 'boss' ? '#ff0000' : '#ff8800';
    ctx.fillRect(x, y, barW * ratio, barH);

    // Border
    ctx.strokeStyle = boss.type === 'boss' ? '#ff4444' : '#ffaa44';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barW, barH);

    // Label
    ctx.fillStyle = 'white';
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    const label = boss.type === 'boss' ? `👹 BOSS  ${Math.ceil(boss.hp)} / ${boss.maxHp}` :
                                         `🐲 MINI-BOSS  ${Math.ceil(boss.hp)} / ${boss.maxHp}`;
    ctx.fillText(label, canvas.width / 2, y + 14);
}

// ============================================================
//  WAVE COUNTER
// ============================================================
export function drawWaveCounter(ctx, canvas, waveNumber, serverPhase, WAVE_CONFIG) {
    if (serverPhase === 'HUB') {
        ctx.fillStyle = '#00ffcc';
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`HUB — Next: Wave ${waveNumber + 1}`, canvas.width - 20, 46);
        return;
    }

    const label = WAVE_CONFIG.getWaveLabel(waveNumber);
    const isBoss = WAVE_CONFIG.isBossWave(waveNumber);
    const isMini = WAVE_CONFIG.isMiniBossWave(waveNumber);

    ctx.font = `bold ${isBoss ? 18 : 14}px monospace`;
    ctx.textAlign = "right";
    ctx.fillStyle = isBoss ? '#ff4444' : isMini ? '#ffaa00' : '#ffffff';
    ctx.fillText(label, canvas.width - 20, 46);
}

// ============================================================
//  PORTAL
// ============================================================
export function drawPortal(ctx, portal) {
    if (!portal) return;
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = 'rgba(0,255,255,0.15)';
    ctx.fillRect(portal.x - 28, portal.y - 28, 56, 56);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(portal.x - 28, portal.y - 28, 56, 56);
    ctx.shadowBlur = 0;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText("PORTAL", portal.x, portal.y - 36);
    ctx.fillStyle = 'white';
    ctx.fillText("PORTAL", portal.x, portal.y - 36);
    ctx.restore();
}

// ============================================================
//  QUIT BUTTON
// ============================================================
export function drawQuitButton(ctx, canvas) {
    quitButton.x = canvas.width - quitButton.w - 20;
    quitButton.y = 10;

    ctx.fillStyle = 'rgba(180,0,0,0.7)';
    ctx.fillRect(quitButton.x, quitButton.y, quitButton.w, quitButton.h);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(quitButton.x, quitButton.y, quitButton.w, quitButton.h);
    ctx.fillStyle = 'white';
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText("QUIT", quitButton.x + quitButton.w / 2, quitButton.y + 20);
}

// ============================================================
//  TICKER
// ============================================================
export function drawTicker(ctx, canvas, tickerMsg) {
    if (!tickerMsg.text) return;
    ctx.fillStyle = '#ffcc00';
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "left";
    ctx.fillText(tickerMsg.text, tickerMsg.x, canvas.height - 100);
}

// ============================================================
//  OVERLAY MESSAGE (wave announce, death, boss warning)
// ============================================================
export function drawOverlayMessage(ctx, canvas, message) {
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = message.color || '#ffcc00';
    ctx.textAlign = 'center';
    ctx.font = `bold ${message.big ? 48 : 36}px monospace`;
    ctx.fillText(message.title, canvas.width / 2, canvas.height / 2 - 30);

    // Body
    ctx.fillStyle = 'white';
    ctx.font = "18px monospace";
    ctx.fillText(message.body, canvas.width / 2, canvas.height / 2 + 20);

    // Prompt
    ctx.fillStyle = '#00ffcc';
    ctx.font = "14px monospace";
    ctx.fillText("TAP OR CLICK TO CONTINUE", canvas.width / 2, canvas.height / 2 + 70);
}

// ============================================================
//  POISON ZONES (world space — call inside ctx.save/translate)
// ============================================================
export function drawPoisonZones(ctx, poisonZones) {
    poisonZones.forEach(z => {
        ctx.save();
        ctx.globalAlpha = z.alpha * (z.duration / 300);
        ctx.fillStyle = '#00ff44';
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    });
}

// ============================================================
//  ZOMBIES (world space)
// ============================================================
export function drawZombies(ctx, zombies) {
    zombies.forEach(z => {
        ctx.font = "28px serif";
        ctx.textAlign = "center";
        ctx.fillText(z.emoji, z.x, z.y + 10);
        // HP bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(z.x - 20, z.y - 22, 40, 5);
        ctx.fillStyle = '#00ff44';
        ctx.fillRect(z.x - 20, z.y - 22, 40 * (z.hp / z.maxHp), 5);
    });
}

// ============================================================
//  HUB ZONE MARKERS (world space)
// ============================================================
export function drawHubZones(ctx, arenaSize) {
    const zones = [
        { x: -200, y: 0,    color: 'rgba(255,220,0,0.25)',  border: '#ffdd00', icon: '🛒', label: 'SHOP'   },
        { x:  200, y: 0,    color: 'rgba(0,255,200,0.25)',  border: '#00ffcc', icon: '📚', label: 'SKILLS' },
        { x:  0,   y: 200,  color: 'rgba(255,0,255,0.25)',  border: '#ff00ff', icon: '🪞', label: 'STATS'  },
        { x:  0,   y: -arenaSize + 60, color: 'rgba(0,200,255,0.2)', border: '#00ccff', icon: '🌀', label: 'READY' },
    ];

    zones.forEach(z => {
        const r = 55;
        ctx.save();
        ctx.fillStyle = z.color;
        ctx.strokeStyle = z.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(z.x, z.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = "26px serif";
        ctx.textAlign = "center";
        ctx.fillText(z.icon, z.x, z.y + 8);

        ctx.fillStyle = 'white';
        ctx.font = "bold 11px monospace";
        ctx.fillText(z.label, z.x, z.y + r + 16);
        ctx.restore();
    });
}

// ============================================================
//  PLAYER NAME TAG (world space)
// ============================================================
export function drawPlayerTag(ctx, player) {
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = '#00ffcc';
    ctx.fillText(player.heroName || player.className, player.x, player.y - 28);
}

// ============================================================
//  ENEMY HP BARS (world space)
// ============================================================
export function drawEnemyBars(ctx, enemies) {
    enemies.forEach(en => {
        if (en.hp === en.maxHp) return; // only show when damaged
        const bw = 30;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(en.x - bw/2, en.y - en.radius - 10, bw, 5);
        ctx.fillStyle = en.type === 'boss' ? '#ff0000' :
                        en.type === 'miniboss' ? '#ff8800' : '#ff4444';
        ctx.fillRect(en.x - bw/2, en.y - en.radius - 10, bw * (en.hp / en.maxHp), 5);
    });
}

// ============================================================
//  SPLASH SCREEN  (handled in HTML — this draws nothing)
//  game.js controls splash state via DOM
// ============================================================
export function drawDeathScreen(ctx, canvas) {
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff0044';
    ctx.font = "bold 48px monospace";
    ctx.textAlign = "center";
    ctx.fillText("YOU DIED", canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillStyle = 'white';
    ctx.font = "18px monospace";
    ctx.fillText("Your progress has been saved.", canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillStyle = '#00ffcc';
    ctx.font = "14px monospace";
    ctx.fillText("TAP TO RESPAWN", canvas.width / 2, canvas.height / 2 + 60);
}
