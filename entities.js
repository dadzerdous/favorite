// entities.js

export const CLASS_DEFINITIONS = {
    fire: {
        name: "PYRO",
        avatar: "🧙",
        description: "Glass cannon. High damage, low survivability.",
        baseStats: { str: 3, dex: 2, con: 0, int: 4, wis: 1 },
        statMin:   { str: 0, dex: 0, con: 0, int: 0, wis: 0 },
        statMax:   { str: 10, dex: 8, con: 5, int: 15, wis: 8 },
        baseHp: 8,
        baseWeapon: { name: "Ember Wand", baseDamage: 3, baseFireRate: 900, color: 'orange' },
        skills: {
            fireBurst:   { name: "Fire Burst",   icon: "🔥", description: "AOE explosion around you",         cooldown: 0, maxCD: 150, tier: 0, maxTier: 3 },
            flameDash:   { name: "Flame Dash",   icon: "💨", description: "Dash in movement direction",       cooldown: 0, maxCD: 200, tier: 0, maxTier: 3 },
            moltenGuard: { name: "Molten Guard", icon: "🛡️", description: "Shield that absorbs damage",       cooldown: 0, maxCD: 400, tier: 0, maxTier: 3 },
            inferno:     { name: "Inferno",      icon: "☄️", description: "Screen-wide nuke",                cooldown: 0, maxCD: 1000, tier: 0, maxTier: 3 },
        }
    },
    blood: {
        name: "BLOOD",
        avatar: "🧛",
        description: "Sustain fighter. Lifesteal and high HP.",
        baseStats: { str: 2, dex: 1, con: 4, int: 1, wis: 2 },
        statMin:   { str: 0, dex: 0, con: 0, int: 0, wis: 0 },
        statMax:   { str: 8, dex: 6, con: 15, int: 5, wis: 8 },
        baseHp: 15,
        baseWeapon: { name: "Blood Lance", baseDamage: 2, baseFireRate: 1100, color: '#ff0000' },
        skills: {
            bloodDrain:  { name: "Blood Drain",  icon: "🩸", description: "Drain HP from nearest enemy",      cooldown: 0, maxCD: 180, tier: 0, maxTier: 3 },
            batSwarm:    { name: "Bat Swarm",    icon: "🦇", description: "Multi-hit all nearby enemies",     cooldown: 0, maxCD: 220, tier: 0, maxTier: 3 },
            bloodPact:   { name: "Blood Pact",   icon: "❤️", description: "Sacrifice HP for a damage burst",  cooldown: 0, maxCD: 350, tier: 0, maxTier: 3 },
            hemorrhage:  { name: "Hemorrhage",   icon: "💉", description: "Execute low HP enemies instantly", cooldown: 0, maxCD: 900, tier: 0, maxTier: 3 },
        }
    },
    plague: {
        name: "ROT",
        avatar: "🧟",
        description: "DoT specialist. Slow but devastating over time.",
        baseStats: { str: 1, dex: 0, con: 2, int: 5, wis: 2 },
        statMin:   { str: 0, dex: 0, con: 0, int: 0, wis: 0 },
        statMax:   { str: 6, dex: 5, con: 8, int: 15, wis: 10 },
        baseHp: 10,
        baseWeapon: { name: "Rot Staff", baseDamage: 1, baseFireRate: 1400, color: '#00ff00' },
        skills: {
            poisonCloud: { name: "Poison Cloud", icon: "☠️", description: "Leave a damaging poison zone",     cooldown: 0, maxCD: 160, tier: 0, maxTier: 3 },
            webTrap:     { name: "Web Trap",     icon: "🕸️", description: "Slow all nearby enemies",         cooldown: 0, maxCD: 240, tier: 0, maxTier: 3 },
            reanimate:   { name: "Reanimate",    icon: "🧟", description: "Summon a zombie ally",            cooldown: 0, maxCD: 450, tier: 0, maxTier: 3 },
            plagueNova:  { name: "Plague Nova",  icon: "🌑", description: "Ultimate DoT burst on all enemies",cooldown: 0, maxCD: 950, tier: 0, maxTier: 3 },
        }
    }
};

// Skill tier bonuses — applied on top of base values
export const SKILL_TIERS = {
    fire: {
        fireBurst:   [ {}, { cdMult: 0.85, dmg: 3 },  { cdMult: 0.7,  dmg: 6  } ],
        flameDash:   [ {}, { cdMult: 0.85, dist: 220 },{ cdMult: 0.7,  dist: 280 } ],
        moltenGuard: [ {}, { cdMult: 0.85, heal: 4 },  { cdMult: 0.7,  heal: 8  } ],
        inferno:     [ {}, { cdMult: 0.85, dmg: 10 },  { cdMult: 0.7,  dmg: 20  } ],
    },
    blood: {
        bloodDrain:  [ {}, { cdMult: 0.85, heal: 4 },  { cdMult: 0.7,  heal: 8  } ],
        batSwarm:    [ {}, { cdMult: 0.85, dmg: 3 },   { cdMult: 0.7,  dmg: 6   } ],
        bloodPact:   [ {}, { cdMult: 0.85, dmg: 8 },   { cdMult: 0.7,  dmg: 16  } ],
        hemorrhage:  [ {}, { cdMult: 0.85, threshold: 0.3 }, { cdMult: 0.7, threshold: 0.5 } ],
    },
    plague: {
        poisonCloud: [ {}, { cdMult: 0.85, dmg: 2 },   { cdMult: 0.7,  dmg: 4   } ],
        webTrap:     [ {}, { cdMult: 0.85, slow: 0.4 }, { cdMult: 0.7,  slow: 0.6 } ],
        reanimate:   [ {}, { cdMult: 0.85, hp: 10 },   { cdMult: 0.7,  hp: 20   } ],
        plagueNova:  [ {}, { cdMult: 0.85, dmg: 8 },   { cdMult: 0.7,  dmg: 16  } ],
    }
};

export class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.element = 'fire'; // default, overwritten on select
        this.avatar = '🧙';
        this.className = 'PYRO';

        // --- PROGRESSION ---
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 100;
        this.statPoints = 0;
        this.skillTokens = 0;
        this.gold = 0;
        this.lastServerPhase = 'WAVE';
        this.waveNumber = 0;

        // --- STATS (will be set from class def on select) ---
        this.stats = { str: 0, dex: 0, con: 0, int: 0, wis: 0 };
        this.statMax = { str: 10, dex: 8, con: 5, int: 15, wis: 8 };

        this.baseHp = 10;
        this.hp = 10;
        this.speed = 3.5;

        this.shield = 0; // Molten Guard / Blood Pact

        this.weapons = [
            { name: "Starter Wand", baseDamage: 2, baseFireRate: 1000, lastShot: 0, color: 'orange', damage: 2, fireRate: 1000 }
        ];

        this.skills = {}; // populated on class select

        // Control state
        this.controlMode = 'WAVE';
        this.activePad = null;
        this.currentDir = { x: 1, y: 0 };
        this.heroName = 'HERO';
    }

    // --- Initialise class (called on hero select) ---
    initClass(elementType) {
        const def = CLASS_DEFINITIONS[elementType];
        if (!def) return;

        this.element = elementType;
        this.avatar = def.avatar;
        this.className = def.name;
        this.baseHp = def.baseHp;
        this.hp = def.baseHp;
        this.heroName = window._heroName || 'HERO';

        // Deep copy stats & limits
        this.stats = { ...def.baseStats };
        this.statMax = { ...def.statMax };

        // Deep copy skills
        this.skills = {};
        for (const [key, val] of Object.entries(def.skills)) {
            this.skills[key] = { ...val };
        }

        // Set weapon
        const w = def.baseWeapon;
        this.weapons = [{
            name: w.name,
            baseDamage: w.baseDamage,
            baseFireRate: w.baseFireRate,
            lastShot: 0,
            color: w.color,
            damage: w.baseDamage,
            fireRate: w.baseFireRate
        }];
    }

    // --- DYNAMIC STAT CALCULATIONS ---
    get maxHp()          { return this.baseHp + (this.stats.con * 5); }
    get currentDamage()  { return this.weapons[0].baseDamage + (this.stats.str * 1); }
    get currentFireRate(){ return Math.max(200, this.weapons[0].baseFireRate - (this.stats.dex * 50)); }
    get burnDamage()     { return 1 + (this.stats.int * 0.5); }
    get cooldownReduction() { return this.stats.wis * 10; }

    // --- SKILL HELPERS ---
    getSkillKeys() { return Object.keys(this.skills); }

    canUpgradeSkill(key) {
        const skill = this.skills[key];
        if (!skill) return false;
        return this.skillTokens >= 1 && skill.tier < skill.maxTier;
    }

    upgradeSkill(key) {
        if (!this.canUpgradeSkill(key)) return false;
        this.skillTokens--;
        this.skills[key].tier++;
        // Apply CD reduction from tier bonus
        const tierBonus = SKILL_TIERS[this.element]?.[key]?.[this.skills[key].tier];
        if (tierBonus?.cdMult) {
            const def = CLASS_DEFINITIONS[this.element].skills[key];
            this.skills[key].maxCD = Math.round(def.maxCD * tierBonus.cdMult);
        }
        return true;
    }

    isSkillUnlocked(key) {
        return this.skills[key]?.tier > 0;
    }

    // --- STAT CAP CHECK ---
    canUpgradeStat(type) {
        return this.statPoints > 0 && this.stats[type] < this.statMax[type];
    }

    upgradeStat(type) {
        if (!this.canUpgradeStat(type)) return false;
        this.statPoints--;
        this.stats[type]++;
        if (type === 'con') this.hp = Math.min(this.hp + 5, this.maxHp);
        this.saveProfile();
        return true;
    }

    // --- SAVE / LOAD ---
    saveProfile() {
        const data = {
            element: this.element,
            avatar: this.avatar,
            className: this.className,
            level: this.level,
            xp: this.xp,
            xpToNext: this.xpToNext,
            statPoints: this.statPoints,
            skillTokens: this.skillTokens,
            gold: this.gold,
            stats: this.stats,
            statMax: this.statMax,
            baseHp: this.baseHp,
        skills: this.skills,
        weapons: this.weapons,
        heroName: this.heroName || 'HERO'
        };
        localStorage.setItem('spire_save', JSON.stringify(data));
    }

    loadProfile() {
        const json = localStorage.getItem('spire_save');
        if (!json) return false;
        const data = JSON.parse(json);

        this.element    = data.element    || 'fire';
        this.avatar     = data.avatar     || '🧙';
        this.className  = data.className  || 'PYRO';
        this.level      = data.level      || 1;
        this.xp         = data.xp         || 0;
        this.xpToNext   = data.xpToNext   || 100;
        this.statPoints = data.statPoints  || 0;
        this.skillTokens= data.skillTokens || 0;
        this.gold       = data.gold        || 0;
        this.stats      = data.stats       || { str:0, dex:0, con:0, int:0, wis:0 };
        this.statMax    = data.statMax     || { str:10, dex:8, con:5, int:15, wis:8 };
        this.baseHp     = data.baseHp      || 10;
        this.weapons    = data.weapons     || this.weapons;
        this.heroName   = data.heroName    || 'HERO';

        // Restore skills preserving runtime state
        if (data.skills) {
            const def = CLASS_DEFINITIONS[this.element];
            if (def) {
                this.skills = {};
                for (const [key, val] of Object.entries(def.skills)) {
                    this.skills[key] = {
                        ...val,
                        tier: data.skills[key]?.tier || 0,
                        cooldown: 0
                    };
                    // Re-apply CD from saved tier
                    const tier = this.skills[key].tier;
                    if (tier > 0) {
                        const tierBonus = SKILL_TIERS[this.element]?.[key]?.[tier];
                        if (tierBonus?.cdMult) {
                            this.skills[key].maxCD = Math.round(val.maxCD * tierBonus.cdMult);
                        }
                    }
                }
            }
        }

        this.hp = this.maxHp;
        return true;
    }
}

export class Enemy {
    constructor(type, arenaSize) {
        this.id = null; // assigned by server
        this.type = type;
        this.slowed = 0; // frames of slow remaining

        const configs = {
            goblin:   { emoji: '👺', hp: 3,  speed: 1.8, radius: 15 },
            skeleton: { emoji: '💀', hp: 2,  speed: 1.0, radius: 15 },
            troll:    { emoji: '👾', hp: 6,  speed: 1.2, radius: 20 },
            wraith:   { emoji: '👻', hp: 4,  speed: 2.2, radius: 15 },
            miniboss: { emoji: '🐲', hp: 30, speed: 1.0, radius: 25 },
            boss:     { emoji: '👹', hp: 80, speed: 0.7, radius: 35 },
        };

        const cfg = configs[type] || configs.goblin;
        this.emoji  = cfg.emoji;
        this.hp     = cfg.hp;
        this.maxHp  = cfg.hp;
        this.speed  = cfg.speed;
        this.radius = cfg.radius;

        // Spawn on a random edge
        const side = Math.floor(Math.random() * 4);
        const m = 30;
        if      (side === 0) { this.x = -arenaSize + m; this.y = (Math.random()*2-1)*arenaSize; }
        else if (side === 1) { this.x =  arenaSize - m; this.y = (Math.random()*2-1)*arenaSize; }
        else if (side === 2) { this.y = -arenaSize + m; this.x = (Math.random()*2-1)*arenaSize; }
        else                 { this.y =  arenaSize - m; this.x = (Math.random()*2-1)*arenaSize; }

        this.lastShot = 0;
    }
}
