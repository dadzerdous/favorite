// systems.js
import { SKILL_TIERS } from './entities.js';

// --- POISON ZONES (for Rot's Poison Cloud) ---
export let poisonZones = [];
// --- ZOMBIES (for Rot's Reanimate) ---
export let zombies = [];

// ============================================================
//  ABILITY SYSTEM
// ============================================================
export class AbilitySystem {
    constructor(player) {
        this.player = player;
    }

    tryTriggerSkill(slotIndex, enemies, shockwaves, sendHit) {
        const p = this.player;
        const keys = p.getSkillKeys();
        const key = keys[slotIndex];
        if (!key) return;

        const skill = p.skills[key];
        if (!skill) return;
        if (skill.tier === 0) return;        // Not unlocked
        if (skill.cooldown > 0) return;      // On cooldown

        this.executeSkill(key, enemies, shockwaves, sendHit);

        // Apply cooldown (reduced by WIS)
        skill.cooldown = Math.max(20, skill.maxCD - p.cooldownReduction);
    }

    executeSkill(key, enemies, shockwaves, sendHit) {
        const p = this.player;
        const tier = p.skills[key].tier;
        const tierData = SKILL_TIERS[p.element]?.[key]?.[tier] || {};

        switch (p.element) {

            // ===================== PYRO =====================
            case 'fire':
                this._pyroSkill(key, tier, tierData, enemies, shockwaves, sendHit);
                break;

            // ===================== BLOOD =====================
            case 'blood':
                this._bloodSkill(key, tier, tierData, enemies, shockwaves, sendHit);
                break;

            // ===================== PLAGUE =====================
            case 'plague':
                this._plagueSkill(key, tier, tierData, enemies, shockwaves, sendHit);
                break;
        }
    }

    // --------------------------------------------------------
    //  PYRO SKILLS
    // --------------------------------------------------------
    _pyroSkill(key, tier, tierData, enemies, shockwaves, sendHit) {
        const p = this.player;

        switch (key) {
            case 'fireBurst': {
                // AOE explosion - radius and damage scale with tier
                const radius = 120 + tier * 40;
                const dmg = (tierData.dmg || 3);
                shockwaves.push({
                    x: p.x, y: p.y, r: 10, alpha: 1,
                    color: 'orange', maxR: radius
                });
                enemies.forEach(en => {
                    if (Math.hypot(en.x - p.x, en.y - p.y) < radius)
                        sendHit(en.id, dmg + p.stats.int);
                });
                break;
            }

            case 'flameDash': {
                // Dash in movement direction, leaving fire trail
                const dist = tierData.dist || 180;
                const dx = p.currentDir.x || 1;
                const dy = p.currentDir.y || 0;
                // Trail shockwaves
                for (let i = 0; i < 3; i++) {
                    shockwaves.push({
                        x: p.x + dx * (dist / 3) * i,
                        y: p.y + dy * (dist / 3) * i,
                        r: 15, alpha: 0.7, color: '#ff6600', maxR: 35
                    });
                }
                p.x += dx * dist;
                p.y += dy * dist;
                break;
            }

            case 'moltenGuard': {
                // Shield that absorbs hits, heals at higher tiers
                const heal = tierData.heal || 2;
                p.shield = 20 + tier * 15; // shield HP
                p.hp = Math.min(p.hp + heal, p.maxHp);
                shockwaves.push({
                    x: p.x, y: p.y, r: 35, alpha: 1,
                    color: 'cyan', maxR: 50
                });
                break;
            }

            case 'inferno': {
                // Screen-wide nuke, massive damage
                const dmg = tierData.dmg || 10;
                const radius = 200 + tier * 80;
                shockwaves.push({
                    x: p.x, y: p.y, r: 10, alpha: 1,
                    color: '#ff2200', maxR: radius
                });
                // Multiple rings for visual drama
                setTimeout(() => shockwaves.push({
                    x: p.x, y: p.y, r: 10, alpha: 0.6,
                    color: '#ffaa00', maxR: radius * 0.7
                }), 100);
                enemies.forEach(en => {
                    if (Math.hypot(en.x - p.x, en.y - p.y) < radius)
                        sendHit(en.id, dmg + p.stats.int * 2);
                });
                break;
            }
        }
    }

    // --------------------------------------------------------
    //  BLOOD SKILLS
    // --------------------------------------------------------
    _bloodSkill(key, tier, tierData, enemies, shockwaves, sendHit) {
        const p = this.player;

        switch (key) {
            case 'bloodDrain': {
                // Drain HP from nearest enemy
                const healAmt = tierData.heal || 3;
                if (enemies.length === 0) break;
                const nearest = enemies.reduce((a, b) =>
                    Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? a : b
                );
                const dist = Math.hypot(nearest.x - p.x, nearest.y - p.y);
                const range = 150 + tier * 50;
                if (dist < range) {
                    sendHit(nearest.id, 2 + tier);
                    p.hp = Math.min(p.hp + healAmt + p.stats.con, p.maxHp);
                    // Visual beam
                    shockwaves.push({
                        x: (p.x + nearest.x) / 2,
                        y: (p.y + nearest.y) / 2,
                        r: 5, alpha: 1, color: '#ff0044', maxR: 20
                    });
                }
                break;
            }

            case 'batSwarm': {
                // Multi-hit all enemies in range
                const dmg = tierData.dmg || 2;
                const range = 160 + tier * 40;
                let hits = 0;
                enemies.forEach(en => {
                    if (Math.hypot(en.x - p.x, en.y - p.y) < range) {
                        sendHit(en.id, dmg);
                        hits++;
                        shockwaves.push({
                            x: en.x, y: en.y, r: 5, alpha: 0.8,
                            color: '#880088', maxR: 20
                        });
                    }
                });
                // Lifesteal per hit
                if (hits > 0) p.hp = Math.min(p.hp + hits * 0.5, p.maxHp);
                break;
            }

            case 'bloodPact': {
                // Sacrifice HP for a massive damage burst
                const selfDmg = Math.min(p.hp - 1, 3 + tier); // never kill self
                const dmg = tierData.dmg || 8;
                const range = 180 + tier * 50;
                p.hp -= selfDmg;
                shockwaves.push({
                    x: p.x, y: p.y, r: 20, alpha: 1,
                    color: '#ff0000', maxR: range
                });
                enemies.forEach(en => {
                    if (Math.hypot(en.x - p.x, en.y - p.y) < range)
                        sendHit(en.id, dmg + selfDmg * 2);
                });
                break;
            }

            case 'hemorrhage': {
                // Execute enemies below HP threshold
                const threshold = tierData.threshold || 0.25;
                enemies.forEach(en => {
                    const hpRatio = en.hp / (en.maxHp || 1);
                    if (hpRatio < threshold) {
                        sendHit(en.id, 9999); // instant kill
                        shockwaves.push({
                            x: en.x, y: en.y, r: 10, alpha: 1,
                            color: '#ff0044', maxR: 30
                        });
                        p.hp = Math.min(p.hp + 2, p.maxHp); // restore per kill
                    }
                });
                break;
            }
        }
    }

    // --------------------------------------------------------
    //  PLAGUE SKILLS
    // --------------------------------------------------------
    _plagueSkill(key, tier, tierData, enemies, shockwaves, sendHit) {
        const p = this.player;

        switch (key) {
            case 'poisonCloud': {
                // Leave a lingering damage zone
                const dmgPerTick = tierData.dmg || 1;
                poisonZones.push({
                    x: p.x, y: p.y,
                    radius: 80 + tier * 30,
                    dmgPerTick: dmgPerTick + p.stats.int * 0.3,
                    duration: 180 + tier * 60, // frames
                    tickTimer: 0,
                    alpha: 0.4
                });
                shockwaves.push({
                    x: p.x, y: p.y, r: 10, alpha: 0.5,
                    color: '#00ff44', maxR: 80 + tier * 30
                });
                break;
            }

            case 'webTrap': {
                // Slow all nearby enemies
                const slowAmt = tierData.slow || 0.3;
                const range = 140 + tier * 40;
                enemies.forEach(en => {
                    if (Math.hypot(en.x - p.x, en.y - p.y) < range) {
                        en.slowed = 180 + tier * 60; // frames
                        en.slowAmount = slowAmt;
                        shockwaves.push({
                            x: en.x, y: en.y, r: 5, alpha: 0.7,
                            color: '#aaaaaa', maxR: 25
                        });
                    }
                });
                shockwaves.push({
                    x: p.x, y: p.y, r: 10, alpha: 0.4,
                    color: '#888888', maxR: range
                });
                break;
            }

            case 'reanimate': {
                // Summon a zombie ally that attacks nearby enemies
                const zombieHp = tierData.hp || 8;
                zombies.push({
                    x: p.x + 40, y: p.y,
                    hp: zombieHp + p.stats.int,
                    maxHp: zombieHp + p.stats.int,
                    speed: 1.5,
                    damage: 1 + tier,
                    lastShot: 0,
                    lifetime: 600 + tier * 200, // frames
                    emoji: '🧟'
                });
                shockwaves.push({
                    x: p.x, y: p.y, r: 10, alpha: 0.6,
                    color: '#00ff00', maxR: 50
                });
                break;
            }

            case 'plagueNova': {
                // Ultimate: DoT burst on ALL enemies on screen
                const dmg = tierData.dmg || 8;
                shockwaves.push({
                    x: p.x, y: p.y, r: 10, alpha: 1,
                    color: '#00ff44', maxR: 500
                });
                setTimeout(() => shockwaves.push({
                    x: p.x, y: p.y, r: 10, alpha: 0.5,
                    color: '#004400', maxR: 450
                }), 150);
                enemies.forEach(en => {
                    sendHit(en.id, dmg + p.stats.int);
                    // Also apply poison zone on each enemy position
                    poisonZones.push({
                        x: en.x, y: en.y,
                        radius: 40,
                        dmgPerTick: 1 + p.stats.int * 0.2,
                        duration: 120 + tier * 40,
                        tickTimer: 0,
                        alpha: 0.3
                    });
                });
                break;
            }
        }
    }
}

// ============================================================
//  COMBAT SYSTEM
// ============================================================
export class CombatSystem {
    constructor() {
        this.projectiles = [];
    }

    updateWeapons(player, enemies, currentTime) {
        player.weapons.forEach(w => {
            if (currentTime - w.lastShot > player.currentFireRate && enemies.length > 0) {
                // Find nearest enemy
                let nearest = enemies.reduce((a, b) =>
                    Math.hypot(a.x - player.x, a.y - player.y) <
                    Math.hypot(b.x - player.x, b.y - player.y) ? a : b
                );

                if (Math.hypot(nearest.x - player.x, nearest.y - player.y) < 500) {
                    const dx = nearest.x - player.x;
                    const dy = nearest.y - player.y;
                    const dist = Math.hypot(dx, dy);
                    this.projectiles.push({
                        x: player.x, y: player.y,
                        vx: (dx / dist) * 10,
                        vy: (dy / dist) * 10,
                        damage: player.currentDamage,
                        color: w.color
                    });
                    w.lastShot = currentTime;
                }
            }
        });
    }

    updateProjectiles(enemies, arenaSize, sendHit, player) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;

            let hit = false;
            for (let j = 0; j < enemies.length; j++) {
                const en = enemies[j];
                if (Math.hypot(p.x - en.x, p.y - en.y) < (en.radius || 20)) {
                    sendHit(en.id, p.damage);
                    hit = true;
                    // XP prediction
                    if (en.hp <= p.damage) {
                        player.xp += en.type === 'boss' ? 200 :
                                     en.type === 'miniboss' ? 80 : 20;
                    }
                    this.projectiles.splice(i, 1);
                    break;
                }
            }

            if (!hit && (Math.abs(p.x) > arenaSize + 100 || Math.abs(p.y) > arenaSize + 100)) {
                this.projectiles.splice(i, 1);
            }
        }
    }
}

// ============================================================
//  POISON ZONE SYSTEM
// ============================================================
export function updatePoisonZones(enemies, sendHit) {
    for (let i = poisonZones.length - 1; i >= 0; i--) {
        const z = poisonZones[i];
        z.duration--;
        z.tickTimer++;

        // Tick damage every 30 frames
        if (z.tickTimer >= 30) {
            z.tickTimer = 0;
            enemies.forEach(en => {
                if (Math.hypot(en.x - z.x, en.y - z.y) < z.radius) {
                    sendHit(en.id, z.dmgPerTick);
                }
            });
        }

        if (z.duration <= 0) poisonZones.splice(i, 1);
    }
}

// ============================================================
//  ZOMBIE SYSTEM
// ============================================================
export function updateZombies(enemies, sendHit) {
    for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];
        z.lifetime--;

        // Move toward nearest enemy
        if (enemies.length > 0) {
            const nearest = enemies.reduce((a, b) =>
                Math.hypot(a.x - z.x, a.y - z.y) <
                Math.hypot(b.x - z.x, b.y - z.y) ? a : b
            );
            const dx = nearest.x - z.x;
            const dy = nearest.y - z.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 20) {
                z.x += (dx / dist) * z.speed;
                z.y += (dy / dist) * z.speed;
            } else {
                // Attack
                const now = Date.now();
                if (now - z.lastShot > 1000) {
                    sendHit(nearest.id, z.damage);
                    z.lastShot = now;
                }
            }
        }

        if (z.lifetime <= 0 || z.hp <= 0) zombies.splice(i, 1);
    }
}

// ============================================================
//  WAVE CONFIG
// ============================================================
export const WAVE_CONFIG = {
    // Returns enemy types and counts for a given wave number
    getWaveEnemies(waveNum) {
        const isBoss     = waveNum % 10 === 0;
        const isMiniBoss = waveNum % 5  === 0 && !isBoss;

        if (isBoss) {
            return [
                { type: 'boss',     count: 1 },
                { type: 'skeleton', count: 4 + Math.floor(waveNum / 10) },
            ];
        }

        if (isMiniBoss) {
            return [
                { type: 'miniboss', count: 1 },
                { type: 'goblin',   count: 3 + Math.floor(waveNum / 5) },
            ];
        }

        // Normal waves — escalate over time
        const base = 3 + Math.floor(waveNum * 1.2);
        const types = [];

        if (waveNum >= 1)  types.push({ type: 'goblin',   count: Math.ceil(base * 0.5) });
        if (waveNum >= 3)  types.push({ type: 'skeleton', count: Math.ceil(base * 0.3) });
        if (waveNum >= 6)  types.push({ type: 'wraith',   count: Math.ceil(base * 0.2) });
        if (waveNum >= 8)  types.push({ type: 'troll',    count: Math.ceil(base * 0.15) });

        return types.length ? types : [{ type: 'goblin', count: base }];
    },

    isBossWave(waveNum)     { return waveNum > 0 && waveNum % 10 === 0; },
    isMiniBossWave(waveNum) { return waveNum > 0 && waveNum % 5  === 0 && waveNum % 10 !== 0; },

    getWaveLabel(waveNum) {
        if (this.isBossWave(waveNum))     return `⚠️ BOSS WAVE ${waveNum}`;
        if (this.isMiniBossWave(waveNum)) return `⚡ MINI-BOSS WAVE ${waveNum}`;
        return `WAVE ${waveNum}`;
    }
};
