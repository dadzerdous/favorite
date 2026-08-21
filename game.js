const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const heroHpEl = document.getElementById("heroHp");
const heroShieldEl = document.getElementById("heroShield");
const goldHudEl = document.getElementById("goldHud");
const levelHudEl = document.getElementById("levelHud");
const statsOverlay = document.getElementById("statsOverlay");
const runLobby = document.getElementById("runLobby");
const startRunButton = document.getElementById("startRunButton");
const openStatsButton = document.getElementById("openStatsButton");
const lobbyLevelEl = document.getElementById("lobbyLevel");
const lobbyXpEl = document.getElementById("lobbyXp");
const bestRoomEl = document.getElementById("bestRoom");
const lastRunSummaryEl = document.getElementById("lastRunSummary");
const lobbyTitleEl = document.getElementById("lobbyTitle");
const lobbySubtitleEl = document.getElementById("lobbySubtitle");
const activeProfileNameEl = document.getElementById("activeProfileName");
const openProfilesButton = document.getElementById("openProfilesButton");
const profilesOverlay = document.getElementById("profilesOverlay");
const profileCardsEl = document.getElementById("profileCards");
const closeProfilesButton = document.getElementById("closeProfiles");
const openOptionsButton = document.getElementById("openOptionsButton");
const optionsOverlay = document.getElementById("optionsOverlay");
const closeOptionsButton = document.getElementById("closeOptions");
const musicVolumeInput = document.getElementById("musicVolume");
const sfxVolumeInput = document.getElementById("sfxVolume");
const musicVolumeText = document.getElementById("musicVolumeText");
const sfxVolumeText = document.getElementById("sfxVolumeText");
const muteMusicButton = document.getElementById("muteMusicButton");
const muteSfxButton = document.getElementById("muteSfxButton");
const openLoadoutButton = document.getElementById("openLoadoutButton");
const loadoutOverlay = document.getElementById("loadoutOverlay");
const closeLoadoutButton = document.getElementById("closeLoadout");
const equipmentPicker = document.getElementById("equipmentPicker");
const glovesNameEl = document.getElementById("glovesName");
const glovesEffectEl = document.getElementById("glovesEffect");
const ballNameEl = document.getElementById("ballName");
const ballEffectEl = document.getElementById("ballEffect");
const shopGoldEl = document.getElementById("shopGold");
const livesHudEl = document.getElementById("livesHud");
const ballShopStatusEl = document.getElementById("ballShopStatus");
const pathHintEl = document.getElementById("pathHint");
const comboHudEl = document.getElementById("comboHud");
const comboCountEl = document.getElementById("comboCount");
const comboXpEl = document.getElementById("comboXp");
const roomClearBannerEl = document.getElementById("roomClearBanner");
const skillCooldownFillEl = document.getElementById("skillCooldownFill");
const skillStatusEl = document.getElementById("skillStatus");
const bossHudEl = document.getElementById("bossHud");
const bossBarFillEl = document.getElementById("bossBarFill");
const bossPhaseEl = document.getElementById("bossPhase");
const closeStatsBtn = document.getElementById("closeStats");
const levelTextEl = document.getElementById("levelText");
const xpFillEl = document.getElementById("xpFill");
const xpTextEl = document.getElementById("xpText");
const availablePointsEl = document.getElementById("availablePoints");
const enemyCountEl = document.getElementById("enemyCount");
const roomTitleEl = document.getElementById("roomTitle");
const messageEl = document.getElementById("message");

const upgradeOverlay = document.getElementById("upgradeOverlay");
const shopOverlay = document.getElementById("shopOverlay");
const runeHudTextEl = document.getElementById("runeHudText");
const powerRuneLevelEl = document.getElementById("powerRuneLevel");
const tempoRuneLevelEl = document.getElementById("tempoRuneLevel");
const dragRuneLevelEl = document.getElementById("dragRuneLevel");
const agilityRuneLevelEl = document.getElementById("agilityRuneLevel");
const expansionRuneLevelEl = document.getElementById("expansionRuneLevel");
const vitalityRuneLevelEl = document.getElementById("vitalityRuneLevel");
const cooldownRuneLevelEl = document.getElementById("cooldownRuneLevel");
const ballSizeRuneLevelEl = document.getElementById("ballSizeRuneLevel");
const elementalRuneLevelEl = document.getElementById("elementalRuneLevel");

const shieldOwnedEl = document.getElementById("shieldOwned");
const glueCountEl = document.getElementById("glueCount");
const healStatusEl = document.getElementById("healStatus");
const leaveShopBtn = document.getElementById("leaveShop");
const glueButton = document.getElementById("glueButton");
const glueButtonCount = document.getElementById("glueButtonCount");

const WORLD_WIDTH = 900;
const WORLD_HEIGHT = 1400;


const bgImage = new Image();
bgImage.src = "assets/bg1.png";

const trolleyImage = new Image();
trolleyImage.src = "assets/trolley1.png";

const trolleyBodyImage = new Image();
trolleyBodyImage.src = "assets/trolley_body.png";

const heroImage = new Image();
heroImage.src = "assets/hero1.png";

const gobImage = new Image();
gobImage.src = "assets/gob1.png";
const raiderImage = new Image();
raiderImage.src = "assets/mob-skel-arch.png";

const doorImage = new Image();
doorImage.src = "assets/door.png";
const splashImage = new Image();
splashImage.src = "assets/bg-ball.png";

const brick1Image = new Image();
brick1Image.src = "assets/brick1.png";

const brick2Image = new Image();
brick2Image.src = "assets/brick2.png";
const SETTINGS_KEY = "spikeTrolleySettings";

let gameSettings = safeParseJSON(localStorage.getItem(SETTINGS_KEY)) || {
  musicVolume: 34,
  sfxVolume: 70,
  musicMuted: false,
  sfxMuted: false
};

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(gameSettings));
}

function applySoundSettings() {
  bgMusic.volume = gameSettings.musicMuted
    ? 0
    : gameSettings.musicVolume / 100;

  hitSound.volume = gameSettings.sfxMuted
    ? 0
    : gameSettings.sfxVolume / 100;

  musicVolumeInput.value = gameSettings.musicVolume;
  sfxVolumeInput.value = gameSettings.sfxVolume;
  musicVolumeText.textContent = `${gameSettings.musicVolume}%`;
  sfxVolumeText.textContent = `${gameSettings.sfxVolume}%`;

  muteMusicButton.textContent = gameSettings.musicMuted
    ? "UNMUTE MUSIC"
    : "MUTE MUSIC";

  muteSfxButton.textContent = gameSettings.sfxMuted
    ? "UNMUTE SFX"
    : "MUTE SFX";
}

const bgMusic = new Audio("assets/bgmusic-bq.mp3");
bgMusic.loop = true;

let bgMusicStarted = false;

function ensureBgMusic() {
  if (bgMusicStarted) return;
  bgMusicStarted = true;
  bgMusic.play().catch(() => { bgMusicStarted = false; });
}

const hitSound = new Audio("assets/click.wav");
hitSound.preload = "auto";

function playHitSound() {
  try {
    hitSound.currentTime = 0;
    hitSound.play().catch(() => {});
  } catch (_) {}
}


let gameState = "waiting";
let lastTime = 0;
let keys = {};
let pointerActive = false;
let pointerX = WORLD_WIDTH / 2;
let pointerY = WORLD_HEIGHT / 2;
let roomNumber = 1;

let pendingRoomType = "battle";
let currentRoomType = "battle";

let postRewardShakeTimer = 0;
let pendingExitAfterReward = false;

const exitChoice = {
  active: false,
  heroX: WORLD_WIDTH / 2,
  heroY: 1110,
  speed: 390,
  minX: 70,
  maxX: WORLD_WIDTH - 70,
  minY: 760,
  maxY: 1135,
  facing: 1,
  hopTimer: 0,
  chosen: null,
  leftType: "battle",
  rightType: "treasure"
};

let runes = {
  power: 0,       // +10% ball damage each
  tempo: 0,       // +8% ball speed each
  drag: 0,        // -8% ball speed each
  agility: 0,     // +10% trolley speed each
  expansion: 0,   // +10% trolley width each
  vitality: 0,    // +10% max HP each
  cooldown: 0,    // -8% class-skill cooldown each
  ballSize: 0,    // +8% ball radius each
  elemental: 0    // +12% elemental effect strength each
};

const runeCatalog = ["power","tempo","drag","agility","expansion","vitality","cooldown","ballSize","elemental"];
let currentRuneOffer = [];
function rollRuneOffer(count = 3) {
  const pool = [...runeCatalog];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  currentRuneOffer = pool.slice(0, Math.min(count, pool.length));
  document.querySelectorAll("[data-rune]").forEach(button => {
    button.classList.toggle("hidden", !currentRuneOffer.includes(button.dataset.rune));
  });
}


let gold = 0;

const PROFILE_COUNT = 3;
const ACTIVE_PROFILE_KEY = "spikeTrolleyActiveProfile";
const LEGACY_SAVE_KEY = "spikeTrolleyProgression";

function createFreshProgression(profileIndex = 1) {
  return {
    profileName: `Adventurer ${profileIndex}`,
    xp: 0,
    level: 1,
    statPoints: 0,
    bestRoom: 0,
    stats: {
      vitality: 0,
      defense: 0,
      agility: 0,
      power: 0,
      control: 0,
      fortune: 0
    },
    equipment: {
      gloves: "adventurer",
      ball: "iron",
      unlocked: {
        gloves: ["adventurer", "heavy", "quick"],
        ball: ["iron", "piercing", "cinder"]
      }
    }
  };
}

function safeParseJSON(raw, fallback = null) {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Ignoring invalid saved JSON:", error);
    return fallback;
  }
}

function profileKey(index) {
  return `spikeTrolleyProfile${index}`;
}

function migrateLegacySave() {
  const legacyRaw = localStorage.getItem(LEGACY_SAVE_KEY);
  const slot1 = localStorage.getItem(profileKey(1));

  if (legacyRaw && !slot1) {
    const migrated = safeParseJSON(legacyRaw);

    if (!migrated) return;

    migrated.profileName =
      migrated.profileName || "Adventurer 1";

    localStorage.setItem(
      profileKey(1),
      JSON.stringify(migrated)
    );
  }
}

function loadProfile(index) {
  const raw =
    localStorage.getItem(profileKey(index));

  const loaded =
    safeParseJSON(raw);

  if (!loaded) return null;

  normalizeProgression(loaded, index);

  return loaded;
}

function normalizeProgression(save, index) {
  if (!save.profileName) save.profileName = `Adventurer ${index}`;
  if (typeof save.xp !== "number") save.xp = 0;
  if (typeof save.level !== "number") save.level = 1;
  if (typeof save.statPoints !== "number") save.statPoints = 0;
  if (typeof save.bestRoom !== "number") save.bestRoom = 0;

  if (!save.stats) save.stats = {};
  for (const stat of ["vitality","defense","agility","power","control","fortune"]) {
    if (typeof save.stats[stat] !== "number") save.stats[stat] = 0;
  }

  if (!save.equipment) {
    save.equipment = createFreshProgression(index).equipment;
  }

  if (!save.equipment.unlocked) {
    save.equipment.unlocked = createFreshProgression(index).equipment.unlocked;
  }
}

migrateLegacySave();

let activeProfileIndex =
  Number(localStorage.getItem(ACTIVE_PROFILE_KEY) || 1);

if (activeProfileIndex < 1 || activeProfileIndex > PROFILE_COUNT) {
  activeProfileIndex = 1;
}

let progression = loadProfile(activeProfileIndex);

if (!progression) {
  progression = createFreshProgression(activeProfileIndex);
  localStorage.setItem(
    profileKey(activeProfileIndex),
    JSON.stringify(progression)
  );
}




let armorPoints = 0;
const equipmentCatalog = {
  gloves:{
    adventurer:{name:"Adventurer Gloves",effect:"Balanced ball handling."},
    heavy:{name:"Heavy Gloves",effect:"Ball -15% speed, +25% damage."},
    quick:{name:"Quick Gloves",effect:"Ball +15% speed, -10% damage."}
  },
  ball:{
    iron:{name:"Iron Ball",effect:"Standard rebound."},
    piercing:{name:"Piercing Ball",effect:"Excess damage carries through destroyed blocks."},
    cinder:{name:"Cinder Ball",effect:"Adds Fire to Ball hits: splash damage and bonus vs Ice."}
  }
};
let patchBoughtThisVisit = false;

let stateBeforeStats = "waiting";

function xpNeededForLevel(level) {
  return 100 + (level - 1) * 50;
}

function saveProgression() {
  localStorage.setItem(
    profileKey(activeProfileIndex),
    JSON.stringify(progression)
  );
}

function addXP(amount) {
  progression.xp += amount;

  while (progression.xp >= xpNeededForLevel(progression.level)) {
    progression.xp -= xpNeededForLevel(progression.level);
    progression.level += 1;
    progression.statPoints += 1;
  }

  saveProgression();
  applyPermanentStats();
  updateStatsUI();
}

function applyPermanentStats() {
  const s = progression.stats;

  // Every point matters immediately.
  player.maxHp = 5 + s.vitality;

  // Defense is literal armor HP refreshed at the start of every room.
  armorPoints = s.defense;

  // +3% movement per point.
  player.speed = player.baseSpeed * (1 + s.agility * 0.03);

  // +10% ball damage per point.
  ball.baseDamageMultiplier = 1 + s.power * 0.10;

  // +3% trolley width per point.
  player.width = player.baseWidth * (1 + s.control * 0.03);

  // Fortune remains a direct +5% treasure reward per point.
  if (player.hp > player.maxHp) player.hp = player.maxHp;
}

function updateStatsUI() {
  levelHudEl.textContent = `⭐ Lv ${progression.level}`;
  levelTextEl.textContent = `Level ${progression.level}`;

  const need = xpNeededForLevel(progression.level);
  xpTextEl.textContent = `${progression.xp} / ${need} XP`;
  xpFillEl.style.width = `${Math.min(100, progression.xp / need * 100)}%`;
  availablePointsEl.textContent = `Available Points: ${progression.statPoints}`;

  for (const stat of Object.keys(progression.stats)) {
    const id = "stat" + stat.charAt(0).toUpperCase() + stat.slice(1);
    const el = document.getElementById(id);
    if (el) el.textContent = progression.stats[stat];
  }
}
let hasOvershield = false;
let shieldReady = false;
let shieldShatterTimer = 0;
let glueCharges = 0;
let glueArmed = false;
let ballStuck = false;
let stuckTimer = 0;

const player = {
  x: WORLD_WIDTH / 2,
  y: 1240,
  baseWidth: 220,
  width: 220,
  height: 44,
  baseSpeed: 620,
  speed: 620,
  runSpeedMultiplier: 1,
  velocityX: 0,
  hp: 5,
  maxHp: 5,
  invincibleTimer: 0,
  facing: 1,
  runTimer: 0,
  slowTimer: 0,
  slowMultiplier: 1,
  slowStacks: 0,
  stunTimer: 0
};

const ball = {
  x: player.x,
  y: player.y - 60,
  baseRadius: 16,
  radius: 16,
  speed: 620,
  vx: 0,
  vy: 0,
  launched: false,
  damage: 1,
  baseDamageMultiplier: 1,
  equipmentSpeedMultiplier: 1,
  equipmentDamageMultiplier: 1,
  runDamageMultiplier: 1,
  runSpeedMultiplier: 1,
  pierceDamageRemaining: 0
};

let bricks = [];
let enemyProjectiles = [];
let playerProjectiles = [];

const rangerSkill = {
  cooldown: 5.0,
  timer: 0,
  damage: 1,
  speed: 720
};
let particles = [];
const splashEffects = [];
let attackTimer = 0;
let pendingShot = null;
let roomClearTimer = 0;
let roomClearRewardPending = false;
let ballsLeft = 3;
const maxBalls = 3;

let hitCombo = 0;
let comboXpEarned = 0;

function resetHitCombo() {
  hitCombo = 0;
  comboXpEarned = 0;
  updateComboHUD();
}

function registerComboHit() {
  hitCombo += 1;

  // Small permanent-XP reward for keeping the ball alive and chaining hits.
  // The reward grows gently at 5/10/20-hit thresholds.
  let xp = 1;
  if (hitCombo >= 20) xp = 4;
  else if (hitCombo >= 10) xp = 3;
  else if (hitCombo >= 5) xp = 2;

  comboXpEarned += xp;
  addXP(xp);
  updateComboHUD();

  if (hitCombo === 5 || hitCombo === 10 || hitCombo === 20) {
    createFloatingText(
      ball.x,
      ball.y - 28,
      `COMBO x${hitCombo}! +${xp} XP`,
      "#ffe171"
    );
  }
}

function updateComboHUD() {
  if (!comboHudEl) return;

  if (hitCombo <= 0 || gameState !== "playing") {
    comboHudEl.classList.add("hidden");
    return;
  }

  comboHudEl.classList.remove("hidden");
  comboCountEl.textContent = `x${hitCombo}`;
  comboXpEl.textContent = `+${comboXpEarned} XP`;
}

const roomLayouts = [
  // Room 1 — 2 Grey Grunts + 1 Fire Grunt
  [
    "BBBBB",
    "BMBFB",
    "BBMBB",
    "BBBBB"
  ],

  // Room 2 — 2 Ice Grunts + 2 Green Grunts
  [
    "BBIBB",
    "BGBGB",
    "BBIBB",
    "BBBBB"
  ],

  // Room 3 — 2 Grey + 2 Ice + 1 Dark-Red Fire
  [
    "BIMIB",
    "BBDBB",
    "BIMIB",
    "BBBBB"
  ],

  // Room 4 — Grey Grunt endurance room
  [
    "BMBMB",
    "BBMBB",
    "BMBMB",
    "BBBBB"
  ],

  // Room 5 — Armored Raider mini-boss arena (5x8)
  [
    "BBBBBBBB",
    "BMB..MBB",
    "B...R..B",
    "BBM..MBB",
    "BBBBBBBB"
  ]
];

function shuffleEnemyPlacements() {
  if (roomNumber === 5) return;

  const mobs = bricks.filter(brick => brick.alive && brick.isMob);
  const positions = mobs.map(brick => ({ x: brick.x, y: brick.y }));

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  mobs.forEach((brick, index) => {
    brick.x = positions[index].x;
    brick.y = positions[index].y;
  });
}

function applyHardEnemyMix() {
  if (roomNumber === 5 || currentRoomType !== "hard") return;

  const mobs = bricks.filter(brick => brick.isMob);

  // Hard rooms must contain an active threat, not only tougher Grey Grunts.
  // Room 4 specifically introduces the Stun Grunt.
  if (roomNumber >= 4 && mobs.length) {
    const target = mobs[Math.floor(Math.random() * mobs.length)];

    target.stunGoblin = true;
    target.shooter = true;
    target.shooterVariant = "stun";
    target.fireGoblin = false;
    target.darkFireGoblin = false;
    target.iceGoblin = false;
    target.greenGoblin = false;
    target.hp = Math.max(target.hp, 4);
    target.maxHp = Math.max(target.maxHp, 4);
  }
}

function applyRouteThreat() {
  if (roomNumber === 5 || currentRoomType !== "hard") return;

  // Hard changes the encounter without simply doubling everything.
  // Every other mob gains +2 HP for this first tuning pass.
  const mobs = bricks.filter(brick => brick.isMob);
  mobs.forEach((brick, index) => {
    if (index % 2 === 0) {
      brick.hp += 2;
      brick.maxHp += 2;
    }
  });
}

function buildRoom() {
  bricks = [];

  const layout =
    roomNumber <= roomLayouts.length
      ? roomLayouts[roomNumber - 1]
      : roomLayouts[3]; // temporary post-boss fallback: Room 4, never repeat boss

  const workingLayout = layout.map(row => row.split(""));

  if (roomNumber !== 5) {
    const availableBricks = [];

    workingLayout.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === "B") {
          availableBricks.push([r, c]);
        }
      });
    });

    // Standard rooms can naturally contain a little treasure.
    // Treasure routes intentionally contain a lot more.
    let treasureCount = 0;

    if (currentRoomType === "treasure") {
      treasureCount = Math.min(
        availableBricks.length,
        5 + Math.floor(Math.random() * 3) // 5–7
      );
    } else if (
      currentRoomType === "standard" ||
      currentRoomType === "battle"
    ) {
      // About a 45% chance of one treasure brick,
      // with a small chance for a second.
      if (Math.random() < 0.45) treasureCount = 1;
      if (treasureCount > 0 && Math.random() < 0.18) treasureCount += 1;
    } else if (currentRoomType === "hard") {
      // Hard is primarily about threat, but can still occasionally contain loot.
      if (Math.random() < 0.30) treasureCount = 1;
    }

    // Shuffle eligible environmental-brick positions.
    for (let i = availableBricks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableBricks[i], availableBricks[j]] =
        [availableBricks[j], availableBricks[i]];
    }

    for (let i = 0; i < treasureCount; i++) {
      const [r, c] = availableBricks[i];
      workingLayout[r][c] = "T";
    }
  }

  const rows = workingLayout.length;
  const cols = Math.max(...workingLayout.map(row => row.length));

  // Dynamically fit the board. Normal rooms keep the larger 5-column bricks.
  // Wider boss boards shrink their bricks enough to stay centered on mobile.
  const gap = cols >= 8 ? 8 : 12;
  const maxBoardWidth = WORLD_WIDTH - 90;
  const preferredBrickWidth = 125;
  const brickWidth = Math.min(
    preferredBrickWidth,
    (maxBoardWidth - gap * (cols - 1)) / cols
  );

  const brickHeight = cols >= 8
    ? Math.max(48, brickWidth * 0.52)
    : 65;

  const totalWidth =
    cols * brickWidth +
    (cols - 1) * gap;

  const startX =
    (WORLD_WIDTH - totalWidth) / 2;

  const startY = 210;

  workingLayout.forEach((line, row) => {
    line.forEach((type, col) => {
      if (type === ".") return;

      let hp = 2;
      let isMob = false;
      let shooter = false;
      let shooterVariant = null;
      let treasure = false;
      let iceGoblin = false;
      let greenGoblin = false;
      let fireGoblin = false;
      let darkFireGoblin = false;
      let stunGoblin = false;
      let raiderBoss = false;

      // Environment
      if (type === "B") hp = 2;
      if (type === "H") hp = 4;

      // Visible treasure is still a normal-looking brick with a yellow hue.
      if (type === "T") {
        hp = 2;
        treasure = true;
      }

      // Grey / neutral grunt
      if (type === "M") {
        hp = 5;
        isMob = true;
      }

      // Fire grunt
      if (type === "F") {
        hp = 4;
        isMob = true;
        shooter = true;
        shooterVariant = "basic";
        fireGoblin = true;
      }

      // Ice grunt
      if (type === "I") {
        hp = 4;
        isMob = true;
        iceGoblin = true;
      }

      // Green grunt — elemental behavior deliberately undefined for now.
      if (type === "G") {
        hp = 4;
        isMob = true;
        greenGoblin = true;
      }

      // Dark-red fire grunt
      if (type === "D") {
        hp = 5;
        isMob = true;
        shooter = true;
        shooterVariant = "spread";
        darkFireGoblin = true;
      }

      // Stun Grunt — stationary electric attacker.
      if (type === "Z") {
        hp = 4;
        isMob = true;
        shooter = true;
        shooterVariant = "stun";
        stunGoblin = true;
      }

      // Armored Raider mini-boss
      if (type === "R") {
        hp = 28;
        isMob = true;
        raiderBoss = true;
        shooter = true;
        shooterVariant = "raiderAim";
      }

      bricks.push({
        x: startX + col * (brickWidth + gap),
        y: startY + row * (brickHeight + gap),

        baseCellCol: col,
        baseCellRow: row,

        width: brickWidth,
        height: brickHeight,

        hp,
        maxHp: hp,

        alive: true,
        isMob,
        shooter,
        shooterVariant,
        telegraph: 0,

        treasure,
        iceGoblin,
        greenGoblin,
        fireGoblin,
        darkFireGoblin,
        stunGoblin,
        raiderBoss,

        armor: raiderBoss ? 12 : 0,
        maxArmor: raiderBoss ? 12 : 0,

        moveDir: 1,
        moveSpeed: raiderBoss ? 92 : 0,

        hitFlash: 0,
        type
      });
    });
  });

  roomTitleEl.textContent =
    roomNumber === 5
      ? "ROOM 5 — ARMORED RAIDER ARCHER"
      : currentRoomType === "treasure"
        ? `ROOM ${roomNumber} — TREASURE ROUTE`
        : currentRoomType === "hard"
          ? `ROOM ${roomNumber} — HARD ROUTE`
          : `ROOM ${roomNumber} — STANDARD ROUTE`;

  applyHardEnemyMix();
  applyRouteThreat();
  shuffleEnemyPlacements();
  updateHUD();

  const activeBoss =
    bricks.find(brick => brick.alive && brick.raiderBoss);

  updateBossHUD(activeBoss);
}


function applyEquipment() {
  ball.equipmentSpeedMultiplier = 1;
  ball.equipmentDamageMultiplier = 1;
  if (progression.equipment.gloves === "heavy") {
    ball.equipmentSpeedMultiplier = 0.85;
    ball.equipmentDamageMultiplier = 1.25;
  } else if (progression.equipment.gloves === "quick") {
    ball.equipmentSpeedMultiplier = 1.15;
    ball.equipmentDamageMultiplier = 0.90;
  }
}
function updateLoadoutUI() {
  const g = equipmentCatalog.gloves[progression.equipment.gloves];
  const b = equipmentCatalog.ball[progression.equipment.ball];
  glovesNameEl.textContent=g.name; glovesEffectEl.textContent=g.effect;
  ballNameEl.textContent=b.name; ballEffectEl.textContent=b.effect;
}
function openEquipmentPicker(slot) {
  equipmentPicker.innerHTML = `<strong>Choose ${slot.toUpperCase()}</strong>`;
  for (const id of progression.equipment.unlocked[slot] || []) {
    const item=equipmentCatalog[slot][id], btn=document.createElement("button");
    btn.className="equipmentChoice";
    btn.innerHTML=`<strong>${item.name}</strong><small>${item.effect}</small>`;
    btn.onclick=()=>{progression.equipment[slot]=id;saveProgression();updateLoadoutUI();equipmentPicker.classList.add("hidden");};
    equipmentPicker.appendChild(btn);
  }
  equipmentPicker.classList.remove("hidden");
}
function resetRun() {
  roomNumber = 1;
  currentRoomType = "battle";
  pendingRoomType = "battle";
  gold = 0;
  ballsLeft = maxBalls;
  resetHitCombo();
  runes = {
    power: 0,
    tempo: 0,
    drag: 0,
    agility: 0,
    expansion: 0,
    vitality: 0,
    cooldown: 0,
    ballSize: 0,
    elemental: 0
  };
  hasOvershield = false;
  shieldReady = false;
  shieldShatterTimer = 0;
  glueCharges = 0;
  glueArmed = false;
  ballStuck = false;
  stuckTimer = 0;

  player.width = player.baseWidth;
  player.speed = player.baseSpeed;
  ball.damage = 1;
  applyPermanentStats();
  applyEquipment();
  applyRunModifiers();
  player.hp = player.maxHp;
  player.x = WORLD_WIDTH / 2;
  player.slowTimer = 0;
  player.slowMultiplier = 1;
  player.slowStacks = 0;

  ball.launched = false;
  ball.vx = 0;
  ball.vy = 0;

  enemyProjectiles = [];
  particles = [];
  attackTimer = 0;

  upgradeOverlay.classList.add("hidden");
  shopOverlay.classList.add("hidden");
  statsOverlay.classList.add("hidden");

  updateHUD();
  updateStatsUI();
  updateLobbyUI();
}

function startRoom() {
  playerProjectiles = [];
  rangerSkill.timer = 0;
  resetHitCombo();
  exitChoice.active = false;
  exitChoice.chosen = null;
  pathHintEl.classList.add("hidden");
  player.x = WORLD_WIDTH / 2;
  player.slowTimer = 0;
  player.slowMultiplier = 1;
  player.slowStacks = 0;

  ball.launched = false;
  ballStuck = false;
  glueArmed = false;
  ball.vx = 0;
  ball.vy = 0;
  ball.x = player.x;
  ball.y = player.y - 58;

  enemyProjectiles = [];
  attackTimer = 0;
  shieldReady = hasOvershield;
  armorPoints = progression.stats.defense;

  gameState = "waiting";

  buildRoom();
  updateRuneText();
  updateShopUI();

  messageEl.style.display = "block";
  messageEl.textContent = "TAP / CLICK TO LAUNCH";
}

function launchBall() {
  if (gameState === "exitChoice") return;

  if (gameState === "lost") {
    returnToLobby(false);
    return;
  }

  if (ballStuck) {
    ballStuck = false;
    stuckTimer = 0;
    const angle = -Math.PI / 3;
    ball.vx = Math.cos(angle) * ball.speed * ball.equipmentSpeedMultiplier * ball.runSpeedMultiplier;
    ball.vy = Math.sin(angle) * ball.speed * ball.equipmentSpeedMultiplier * ball.runSpeedMultiplier;
    ball.launched = true;
    ball.pierceDamageRemaining = 0;
    gameState = "playing";
    messageEl.style.display = "none";
    return;
  }

  if (gameState !== "waiting" || ball.launched) return;

  ball.launched = true;
  ball.pierceDamageRemaining = 0;

  const angle = -Math.PI / 3;
  ball.vx = Math.cos(angle) * ball.speed * ball.equipmentSpeedMultiplier * ball.runSpeedMultiplier;
  ball.vy = Math.sin(angle) * ball.speed * ball.equipmentSpeedMultiplier * ball.runSpeedMultiplier;

  gameState = "playing";
  messageEl.style.display = "none";
}

window.addEventListener("keydown", event => {
  ensureBgMusic();
  keys[event.key.toLowerCase()] = true;

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    launchBall();
  }

  if (event.key.toLowerCase() === "g") {
    armGlue();
  }
});

window.addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener("pointerdown", event => {
  ensureBgMusic();
  if (gameState === "upgrade" || gameState === "shop" || gameState === "stats") return;

  if (gameState === "playing") {
    const rect = canvas.getBoundingClientRect();
    const worldX = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
    const worldY = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
    const tappedEnemy = enemyAtWorldPoint(worldX, worldY);

    if (tappedEnemy && useRangerSkill(tappedEnemy)) {
      event.preventDefault();
      return;
    }
  }

  if (gameState === "exitChoice" || gameState === "roomClear") {
    pointerActive = true;
    setPointerPosition(event);
    return;
  }

  pointerActive = true;
  setPointerPosition(event);

  if (gameState === "lost") {
    returnToLobby(false);
    return;
  }

  if (!ball.launched || ballStuck) launchBall();
});

canvas.addEventListener("pointermove", event => {
  if (!pointerActive) return;
  setPointerPosition(event);
});

window.addEventListener("pointerup", () => {
  pointerActive = false;
});

function setPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  pointerX = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
  pointerY = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
}

openProfilesButton.addEventListener("click", () => {
  runLobby.classList.add("hidden");
  renderProfiles();
  profilesOverlay.classList.remove("hidden");
});

closeProfilesButton.addEventListener("click", () => {
  profilesOverlay.classList.add("hidden");
  runLobby.classList.remove("hidden");
});

openOptionsButton.addEventListener("click", () => {
  runLobby.classList.add("hidden");
  applySoundSettings();
  optionsOverlay.classList.remove("hidden");
});

closeOptionsButton.addEventListener("click", () => {
  optionsOverlay.classList.add("hidden");
  runLobby.classList.remove("hidden");
});

musicVolumeInput.addEventListener("input", () => {
  gameSettings.musicVolume = Number(musicVolumeInput.value);
  gameSettings.musicMuted = false;
  saveSettings();
  applySoundSettings();
  ensureBgMusic();
});

sfxVolumeInput.addEventListener("input", () => {
  gameSettings.sfxVolume = Number(sfxVolumeInput.value);
  gameSettings.sfxMuted = false;
  saveSettings();
  applySoundSettings();
});

muteMusicButton.addEventListener("click", () => {
  gameSettings.musicMuted = !gameSettings.musicMuted;
  saveSettings();
  applySoundSettings();
});

muteSfxButton.addEventListener("click", () => {
  gameSettings.sfxMuted = !gameSettings.sfxMuted;
  saveSettings();
  applySoundSettings();
});

function profileSummary(index) {
  const save = loadProfile(index);
  if (!save) return null;

  return {
    name: save.profileName || `Adventurer ${index}`,
    level: save.level || 1,
    xp: save.xp || 0,
    bestRoom: save.bestRoom || 0
  };
}

function renderProfiles() {
  profileCardsEl.innerHTML = "";

  for (let index = 1; index <= PROFILE_COUNT; index++) {
    const summary = profileSummary(index);
    const card = document.createElement("div");
    card.className =
      "profileCard" +
      (index === activeProfileIndex ? " active" : "") +
      (!summary ? " empty" : "");

    if (summary) {
      card.innerHTML = `
        <div class="profileCardHeader">
          <strong>${summary.name}</strong>
          <span>${index === activeProfileIndex ? "ACTIVE" : `SLOT ${index}`}</span>
        </div>
        <div class="profileMeta">
          Level ${summary.level} · ${summary.xp}/${xpNeededForLevel(summary.level)} XP · Best Room ${summary.bestRoom}
        </div>
        <div class="profileActions">
          <button data-profile-load="${index}">
            ${index === activeProfileIndex ? "SELECTED" : "SWITCH"}
          </button>
          <button class="danger" data-profile-reset="${index}">NEW GAME</button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="profileCardHeader">
          <strong>Empty Slot ${index}</strong>
          <span>SLOT ${index}</span>
        </div>
        <div class="profileMeta">Start a completely fresh adventurer.</div>
        <div class="profileActions">
          <button data-profile-new="${index}">CREATE</button>
        </div>
      `;
    }

    profileCardsEl.appendChild(card);
  }

  profileCardsEl
    .querySelectorAll("[data-profile-load]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.profileLoad);
        switchProfile(index);
      });
    });

  profileCardsEl
    .querySelectorAll("[data-profile-new]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.profileNew);
        createProfile(index, false);
      });
    });

  profileCardsEl
    .querySelectorAll("[data-profile-reset]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.profileReset);
        createProfile(index, true);
      });
    });
}

function switchProfile(index) {
  const loaded = loadProfile(index);
  if (!loaded) return;

  activeProfileIndex = index;
  progression = loaded;

  localStorage.setItem(
    ACTIVE_PROFILE_KEY,
    String(activeProfileIndex)
  );

  applyPermanentStats();
  applyEquipment();
  updateStatsUI();
  updateLoadoutUI();
  updateLobbyUI();
  renderProfiles();

  profilesOverlay.classList.add("hidden");
  runLobby.classList.remove("hidden");
}

function createProfile(index, overwrite) {
  if (overwrite) {
    const ok = window.confirm(
      `Start a completely new game in Slot ${index}? This permanently erases that slot's progress.`
    );

    if (!ok) return;
  }

  const fresh = createFreshProgression(index);

  localStorage.setItem(
    profileKey(index),
    JSON.stringify(fresh)
  );

  activeProfileIndex = index;
  progression = fresh;

  localStorage.setItem(
    ACTIVE_PROFILE_KEY,
    String(activeProfileIndex)
  );

  applyPermanentStats();
  applyEquipment();
  updateStatsUI();
  updateLoadoutUI();
  updateLobbyUI();
  renderProfiles();

  profilesOverlay.classList.add("hidden");
  runLobby.classList.remove("hidden");
}

openLoadoutButton.addEventListener("click",()=>{runLobby.classList.add("hidden");loadoutOverlay.classList.remove("hidden");updateLoadoutUI();});
closeLoadoutButton.addEventListener("click",()=>{loadoutOverlay.classList.add("hidden");equipmentPicker.classList.add("hidden");runLobby.classList.remove("hidden");});
document.querySelectorAll(".equipmentSlot[data-slot]").forEach(b=>b.addEventListener("click",()=>openEquipmentPicker(b.dataset.slot)));

openStatsButton.addEventListener("click", () => {
  runLobby.classList.add("hidden");
  statsOverlay.classList.remove("hidden");
  updateStatsUI();
});

closeStatsBtn.addEventListener("click", () => {
  statsOverlay.classList.add("hidden");
  runLobby.classList.remove("hidden");
  updateLobbyUI();
});

startRunButton.addEventListener("click", () => {
  runLobby.classList.add("hidden");
  lastRunSummaryEl.classList.add("hidden");
  resetRun();
  startRoom();
});

document.querySelectorAll("[data-stat]").forEach(button => {
  button.addEventListener("click", () => {
    const stat = button.dataset.stat;
    const dir = Number(button.dataset.dir);

    if (dir > 0) {
      if (progression.statPoints <= 0) return;
      progression.statPoints -= 1;
      progression.stats[stat] += 1;
    } else {
      if (progression.stats[stat] <= 0) return;
      progression.stats[stat] -= 1;
      progression.statPoints += 1;
    }

    saveProgression();
    applyPermanentStats();
    updateStatsUI();
    updateHUD();
  });
});

document.querySelectorAll(".upgradeCard[data-rune]").forEach(button => {
  button.addEventListener("click", () => chooseRune(button.dataset.rune));
});

document.querySelectorAll(".shopCard").forEach(button => {
  button.addEventListener("click", () => buyShopItem(button.dataset.shop));
});

leaveShopBtn.addEventListener("click", leaveShop);
glueButton.addEventListener("click", armGlue);

function chooseRune(type) {
  if (gameState !== "upgrade") return;
  if (!(type in runes)) return;
  if (!currentRuneOffer.includes(type)) return;

  runes[type] += 1;

  applyRunModifiers();

  upgradeOverlay.classList.add("hidden");
  updateRuneText();
  updateHUD();

  gameState = "postRewardShake";
  postRewardShakeTimer = 0.72;
  pendingExitAfterReward = true;
}



function applyRunModifiers() {
  // Caps protect the physical game from runaway stacking.
  const damageMult = Math.min(2.5, 1 + runes.power * 0.10);

  const speedUp = runes.tempo * 0.08;
  const speedDown = runes.drag * 0.08;
  const ballSpeedMult = Math.max(0.55, Math.min(1.75, 1 + speedUp - speedDown));

  const trolleySpeedMult = Math.min(1.75, 1 + runes.agility * 0.10);
  const widthMult = Math.min(1.60, 1 + runes.expansion * 0.10);
  const hpMult = Math.min(2.0, 1 + runes.vitality * 0.10);

  const cooldownReduction = Math.min(0.45, runes.cooldown * 0.08);
  const ballRadiusMult = Math.min(1.50, 1 + runes.ballSize * 0.08);

  ball.runDamageMultiplier = damageMult;
  ball.runSpeedMultiplier = ballSpeedMult;
  ball.radius = Math.round(ball.baseRadius * ballRadiusMult);

  player.runSpeedMultiplier = trolleySpeedMult;
  player.width = Math.min(
    player.baseWidth * 1.60,
    player.baseWidth *
      (1 + progression.stats.control * 0.03) *
      widthMult
  );

  const permanentMaxHp = 5 + progression.stats.vitality;
  const newMaxHp = Math.max(
    permanentMaxHp,
    Math.round(permanentMaxHp * hpMult)
  );

  const hpDelta = newMaxHp - player.maxHp;
  player.maxHp = newMaxHp;
  if (hpDelta > 0) player.hp += hpDelta;
  player.hp = Math.min(player.hp, player.maxHp);

  rangerSkill.effectiveCooldown =
    rangerSkill.cooldown * (1 - cooldownReduction);
}

function elementalStrengthMultiplier() {
  return Math.min(2.0, 1 + runes.elemental * 0.12);
}

function updateRuneText() {
  if (powerRuneLevelEl) {
    powerRuneLevelEl.textContent =
      `Ball damage: +${Math.min(150, runes.power * 10)}%`;
  }

  if (tempoRuneLevelEl) {
    tempoRuneLevelEl.textContent =
      `Ball speed: +${Math.min(75, runes.tempo * 8)}%`;
  }

  if (dragRuneLevelEl) {
    dragRuneLevelEl.textContent =
      `Ball speed: -${Math.min(45, runes.drag * 8)}%`;
  }

  if (agilityRuneLevelEl) {
    agilityRuneLevelEl.textContent =
      `Trolley speed: +${Math.min(75, runes.agility * 10)}%`;
  }

  if (expansionRuneLevelEl) {
    expansionRuneLevelEl.textContent =
      `Width: +${Math.min(60, runes.expansion * 10)}%`;
  }

  if (vitalityRuneLevelEl) {
    vitalityRuneLevelEl.textContent =
      `Max HP: +${Math.min(100, runes.vitality * 10)}%`;
  }

  if (cooldownRuneLevelEl) {
    cooldownRuneLevelEl.textContent =
      `Skill cooldown: -${Math.min(45, runes.cooldown * 8)}%`;
  }

  if (ballSizeRuneLevelEl) {
    ballSizeRuneLevelEl.textContent =
      `Ball size: +${Math.min(50, runes.ballSize * 8)}%`;
  }

  if (elementalRuneLevelEl) {
    elementalRuneLevelEl.textContent =
      `Element strength: +${Math.min(100, runes.elemental * 12)}%`;
  }

  const active = [];

  if (runes.power) active.push(`💥${runes.power}`);
  if (runes.tempo) active.push(`⚡${runes.tempo}`);
  if (runes.drag) active.push(`🐌${runes.drag}`);
  if (runes.agility) active.push(`🏃${runes.agility}`);
  if (runes.expansion) active.push(`↔️${runes.expansion}`);
  if (runes.vitality) active.push(`❤️${runes.vitality}`);
  if (runes.cooldown) active.push(`⌛${runes.cooldown}`);
  if (runes.ballSize) active.push(`⚪${runes.ballSize}`);
  if (runes.elemental) active.push(`✨${runes.elemental}`);

  runeHudTextEl.textContent =
    active.length ? active.join("  ") : "None";
}

function openShop() {
  gameState = "shop";
  patchBoughtThisVisit = false;
  document.querySelectorAll('[data-shop="heal"],[data-shop="patch"]').forEach(b=>{b.disabled=false;b.style.opacity="1";});
  messageEl.style.display = "none";
  shopOverlay.classList.remove("hidden");
  updateShopUI();
}

function leaveShop() {
  if (gameState !== "shop") return;

  shopOverlay.classList.add("hidden");
  roomNumber += 1;
  currentRoomType = pendingRoomType;
  startRoom();
}

function buyShopItem(type) {
  if (gameState !== "shop") return;

  if (type === "overshield") {
    if (hasOvershield || gold < 12) return;
    gold -= 12;
    hasOvershield = true;
    shieldReady = true;
  }

  if (type === "glue") {
    if (gold < 8) return;
    gold -= 8;
    glueCharges += 1;
  }

  if (type === "heal") {
    if (patchBoughtThisVisit || gold < 6 || player.hp >= player.maxHp) return;
    gold -= 6;
    player.hp = Math.min(player.maxHp, player.hp + 2);
    patchBoughtThisVisit = true;
  }

  if (type === "ball") {
    if (gold < 10 || ballsLeft >= maxBalls) return;
    gold -= 10;
    ballsLeft += 1;
  }

  updateHUD();
  updateShopUI();
}

function updateShopUI() {
  shieldOwnedEl.textContent = hasOvershield ? "OWNED — recharges each room" : "Not owned";
  glueCountEl.textContent = `Charges: ${glueCharges}`;
  healStatusEl.textContent = patchBoughtThisVisit
    ? `PURCHASED THIS VISIT — HP: ${player.hp} / ${player.maxHp}`
    : `HP: ${player.hp} / ${player.maxHp}`;
  if (ballShopStatusEl) ballShopStatusEl.textContent = `Balls: ${ballsLeft} / ${maxBalls}`;

  const shieldBtn = document.querySelector('[data-shop="overshield"]');
  const glueBtn = document.querySelector('[data-shop="glue"]');
  const healBtn = document.querySelector('[data-shop="heal"]');
  const ballBtn = document.querySelector('[data-shop="ball"]');

  if (shieldBtn) shieldBtn.disabled = hasOvershield || gold < 12;
  if (glueBtn) glueBtn.disabled = gold < 8;
  if (healBtn) healBtn.disabled = patchBoughtThisVisit || gold < 6 || player.hp >= player.maxHp;
  if (ballBtn) ballBtn.disabled = gold < 10 || ballsLeft >= maxBalls;

  updateGlueButton();
}

function armGlue() {
  if (gameState !== "playing" || glueCharges <= 0 || glueArmed || ballStuck) return;

  glueCharges -= 1;
  glueArmed = true;
  updateGlueButton();
  updateShopUI();
}

function updateGlueButton() {
  glueButtonCount.textContent = glueCharges;
  glueButton.classList.toggle("armed", glueArmed);
  glueButton.classList.toggle("hidden", glueCharges <= 0 && !glueArmed);
  glueButton.disabled = gameState !== "playing" || glueCharges <= 0 || glueArmed;
}

function updateRoomClear(dt) {
  if (gameState !== "roomClear") return;

  roomClearTimer -= dt;
  if (roomClearTimer > 0) return;

  roomClearBannerEl.classList.add("hidden");

  if (roomClearRewardPending) {
    roomClearRewardPending = false;
    gameState = "upgrade";
    updateRuneText();
    upgradeOverlay.classList.remove("hidden");
  }
}

function updatePostRewardShake(dt) {
  if (gameState !== "postRewardShake") return;

  postRewardShakeTimer -= dt;

  if (postRewardShakeTimer <= 0) {
    pendingExitAfterReward = false;
    beginExitChoice();
  }
}

function beginExitChoice() {
  gameState = "exitChoice";
  exitChoice.active = true;
  player.x = WORLD_WIDTH / 2;
  exitChoice.heroX = WORLD_WIDTH / 2;
  exitChoice.heroY = 1110;
  exitChoice.facing = player.facing || 1;
  exitChoice.hopTimer = 0.45;
  exitChoice.chosen = null;

  const routeSets = [
    ["standard", "hard"],
    ["standard", "treasure"],
    ["hard", "treasure"]
  ];
  const pair = routeSets[Math.floor(Math.random() * routeSets.length)];
  exitChoice.leftType = pair[0];
  exitChoice.rightType = pair[1];
  pathHintEl.classList.remove("hidden");
}

function updateExitChoice(dt) {
  if (gameState !== "exitChoice") return;
  let moveX = 0, moveY = 0;
  if (keys["arrowleft"] || keys["a"]) moveX -= 1;
  if (keys["arrowright"] || keys["d"]) moveX += 1;
  if (keys["arrowup"] || keys["w"]) moveY -= 1;
  if (keys["arrowdown"] || keys["s"]) moveY += 1;

  if (pointerActive) {
    const dx = pointerX - exitChoice.heroX;
    const dy = pointerY - exitChoice.heroY;
    if (Math.abs(dx) > 10) moveX = Math.max(-1, Math.min(1, dx / 100));
    if (Math.abs(dy) > 10) moveY = Math.max(-1, Math.min(1, dy / 100));
  }
  if (moveX !== 0) exitChoice.facing = moveX > 0 ? 1 : -1;
  if (exitChoice.hopTimer > 0) { exitChoice.hopTimer -= dt; return; }
  const len = Math.hypot(moveX, moveY);
  if (len > 1) { moveX /= len; moveY /= len; }
  exitChoice.heroX += moveX * exitChoice.speed * dt;
  exitChoice.heroY += moveY * exitChoice.speed * dt;
  exitChoice.heroX = Math.max(exitChoice.minX, Math.min(exitChoice.maxX, exitChoice.heroX));
  exitChoice.heroY = Math.max(exitChoice.minY, Math.min(exitChoice.maxY, exitChoice.heroY));

  const doorY = 810, doorW = 205, doorH = 300, r = 28;
  const lx = 35, rx = WORLD_WIDTH - 35 - doorW;
  const inDoor = (x,y) => exitChoice.heroX + r > x && exitChoice.heroX - r < x + doorW && exitChoice.heroY + r > y && exitChoice.heroY - r < y + doorH;
  if (inDoor(lx, doorY)) commitExitDoor("left");
  else if (inDoor(rx, doorY)) commitExitDoor("right");
}

function commitExitDoor(side) {
  if (gameState !== "exitChoice" || exitChoice.chosen) return;

  const type =
    side === "left"
      ? exitChoice.leftType
      : exitChoice.rightType;

  if (!type) {
    console.warn("Exit door had no assigned route type:", side);
    return;
  }

  chooseDungeonExit(type);
}

function chooseDungeonExit(type) {
  if (gameState !== "exitChoice" || exitChoice.chosen) return;

  const normalizedType =
    type === "battle"
      ? "standard"
      : type;

  exitChoice.chosen = normalizedType;
  exitChoice.active = false;
  pathHintEl.classList.add("hidden");

  if (normalizedType === "shop") {
    pendingRoomType = "standard";
    openShop();
    return;
  }

  pendingRoomType = normalizedType;
  currentRoomType = normalizedType;
  roomNumber += 1;

  console.log(
    `ENTERING ${normalizedType.toUpperCase()} ROUTE — ROOM ${roomNumber}`
  );

  startRoom();
}

function updatePlayer(dt) {
  if (gameState === "exitChoice" || gameState === "postRewardShake") {
    player.velocityX = 0;
    return;
  }

  let move = 0;

  if (player.stunTimer > 0) {
    player.stunTimer = Math.max(0, player.stunTimer - dt);
  }

  if (player.stunTimer <= 0) {
    if (keys["arrowleft"] || keys["a"]) move -= 1;
    if (keys["arrowright"] || keys["d"]) move += 1;

    if (
      pointerActive &&
      gameState !== "upgrade" &&
      gameState !== "shop"
    ) {
      const difference = pointerX - player.x;

      if (Math.abs(difference) > 10) {
        move = Math.max(-1, Math.min(1, difference / 120));
      }
    }
  }

  if (player.slowTimer > 0) {
    player.slowTimer -= dt;

    const slowByStack = [1, 0.70, 0.40, 0.10];

    player.slowMultiplier =
      slowByStack[
        Math.min(3, player.slowStacks || 0)
      ];

    if (player.slowTimer <= 0) {
      player.slowStacks = 0;
      player.slowMultiplier = 1;
    }
  } else {
    player.slowStacks = 0;
    player.slowMultiplier = 1;
  }

  player.velocityX =
    move *
    player.speed *
    player.runSpeedMultiplier *
    player.slowMultiplier;

  player.x += player.velocityX * dt;

  const halfWidth = player.width / 2;

  player.x =
    Math.max(
      halfWidth + 30,
      Math.min(
        WORLD_WIDTH - halfWidth - 30,
        player.x
      )
    );

  if (Math.abs(player.velocityX) > 5) {
    player.facing =
      player.velocityX > 0 ? 1 : -1;

    player.runTimer +=
      dt *
      Math.abs(player.velocityX) /
      80;
  }

  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= dt;
  }

  if (shieldShatterTimer > 0) {
    shieldShatterTimer -= dt;
  }

  if (
    (!ball.launched && gameState === "waiting") ||
    ballStuck
  ) {
    ball.x = player.x;
    ball.y = player.y - 58;
  }

  if (ballStuck) {
    stuckTimer -= dt;

    if (stuckTimer <= 0) {
      launchBall();
    }
  }
}

function updateBall(dt) {
  if (!ball.launched || ballStuck || gameState !== "playing") return;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x - ball.radius < 25) {
    ball.x = 25 + ball.radius;
    ball.vx = Math.abs(ball.vx);
  }

  if (ball.x + ball.radius > WORLD_WIDTH - 25) {
    ball.x = WORLD_WIDTH - 25 - ball.radius;
    ball.vx = -Math.abs(ball.vx);
  }

  if (ball.y - ball.radius < 120) {
    ball.y = 120 + ball.radius;
    ball.vy = Math.abs(ball.vy);
  }

  if (ball.y > WORLD_HEIGHT + 50) {
    loseBall();
    return;
  }

  checkPaddleCollision();
  checkBrickCollisions();
}

function checkPaddleCollision() {
  if (ball.vy <= 0) return;

  const left = player.x - player.width / 2;
  const right = player.x + player.width / 2;
  const top = player.y - player.height / 2;
  const bottom = player.y + player.height / 2;

  if (
    ball.x + ball.radius > left &&
    ball.x - ball.radius < right &&
    ball.y + ball.radius > top &&
    ball.y - ball.radius < bottom
  ) {
    resetHitCombo();
    ball.pierceDamageRemaining = 0;
    ball.y = top - ball.radius;

    if (glueArmed) {
      glueArmed = false;
      ballStuck = true;
      ball.launched = false;
      ball.vx = 0;
      ball.vy = 0;
      stuckTimer = 3;
      messageEl.style.display = "block";
      messageEl.textContent = "BALL GLUED — TAP / SPACE TO LAUNCH";
      updateGlueButton();
      return;
    }

    const relativeHit = (ball.x - player.x) / (player.width / 2);
    const maxAngle = Math.PI * 0.38;
    const angle = relativeHit * maxAngle;

    ball.vx = Math.sin(angle) * ball.speed * ball.equipmentSpeedMultiplier * ball.runSpeedMultiplier;
    ball.vy = -Math.cos(angle) * ball.speed * ball.equipmentSpeedMultiplier * ball.runSpeedMultiplier;

    playHitSound();
    createParticles(ball.x, ball.y, 8, "#f7d98a");
  }
}

function checkBrickCollisions() {
  for (const brick of bricks) {
    if (!brick.alive) continue;

    // Art contains a small amount of transparent padding. Use an inset
    // collision face so the visible Ball actually reaches the visible block.
    const insetX = Math.max(3, brick.width * 0.045);
    const insetY = Math.max(2, brick.height * 0.055);

    const left = brick.x + insetX;
    const right = brick.x + brick.width - insetX;
    const top = brick.y + insetY;
    const bottom = brick.y + brick.height - insetY;

    if (
      ball.x + ball.radius > left &&
      ball.x - ball.radius < right &&
      ball.y + ball.radius > top &&
      ball.y - ball.radius < bottom
    ) {
      const equippedPiercing =
        progression.equipment.ball === "piercing";

      const baseHitDamage =
        ball.damage *
        ball.baseDamageMultiplier *
        ball.equipmentDamageMultiplier *
        ball.runDamageMultiplier;

      let damageToApply = baseHitDamage;

      if (equippedPiercing) {
        if (ball.pierceDamageRemaining <= 0) {
          ball.pierceDamageRemaining = baseHitDamage;
        }

        damageToApply = ball.pierceDamageRemaining;
      }

      const hpBefore =
        brick.hp +
        (brick.raiderBoss ? brick.armor : 0);

      damageBrick(
        brick,
        damageToApply,
        "ball"
      );

      if (equippedPiercing) {
        ball.pierceDamageRemaining =
          Math.max(
            0,
            damageToApply - hpBefore
          );

        if (
          !brick.alive &&
          ball.pierceDamageRemaining > 0
        ) {
          // Piercing only passes through a target that was actually destroyed.
          continue;
        }

        ball.pierceDamageRemaining = 0;
      }

      const overlapLeft =
        ball.x + ball.radius - left;
      const overlapRight =
        right - (ball.x - ball.radius);
      const overlapTop =
        ball.y + ball.radius - top;
      const overlapBottom =
        bottom - (ball.y - ball.radius);

      const minOverlap =
        Math.min(
          overlapLeft,
          overlapRight,
          overlapTop,
          overlapBottom
        );

      if (
        minOverlap === overlapLeft ||
        minOverlap === overlapRight
      ) {
        ball.vx *= -1;
      } else {
        ball.vy *= -1;
      }

      break;
    }
  }
}

function damageBrick(brick, overrideDamage = null, source = "ball") {
  if (!brick || !brick.alive) return;

  playHitSound();

  const isBallDamage = source === "ball";

  // Ball combo XP is separate from class weapon damage.
  if (isBallDamage) {
    registerComboHit();
  }

  let hitDamage =
    overrideDamage !== null
      ? overrideDamage
      : ball.damage *
        ball.baseDamageMultiplier *
        ball.equipmentDamageMultiplier *
        ball.runDamageMultiplier;

  const ballHasFire =
    isBallDamage &&
    (
      progression.equipment.ball === "cinder"
    );

  if (brick.iceGoblin && ballHasFire) {
    hitDamage *= 2;
  }

  // Armor is universal defense; both Ball and weapon damage can break it.
  if (brick.raiderBoss && brick.armor > 0) {
    const absorbed = Math.min(brick.armor, hitDamage);
    brick.armor -= absorbed;
    hitDamage -= absorbed;

    createFloatingText(
      brick.x + brick.width / 2,
      brick.y - 8,
      brick.armor > 0 ? "ARMOR" : "ARMOR BROKEN!",
      "#d7c8a8"
    );

    if (hitDamage <= 0) {
      brick.hitFlash = 0.12;
      updateBossHUD(brick);
      return;
    }
  }

  brick.hp -= hitDamage;
  brick.hitFlash = 0.12;

  // Ball-only elemental/equipment effects.
  if (ballHasFire) {
    fireExplosion(
      brick.x + brick.width / 2,
      brick.y + brick.height / 2,
      brick
    );
  }

  createParticles(
    brick.x + brick.width / 2,
    brick.y + brick.height / 2,
    10,
    brick.isMob ? "#c8f07a" : "#b9a991"
  );

  if (brick.hp <= 0) {
    brick.hp = 0;
    brick.alive = false;

    if (brick.isMob) {
      const xpReward = brick.shooter ? 10 : 5;
      addXP(xpReward);
      createFloatingText(
        brick.x + brick.width / 2,
        brick.y + brick.height / 2,
        `+${xpReward} XP`,
        "#d8c8ff"
      );
    }

    if (brick.treasure) {
      const baseGold = 8;
      const fortuneBonus = 1 + progression.stats.fortune * 0.05;
      const reward = Math.max(1, Math.round(baseGold * fortuneBonus));
      gold += reward;
      createFloatingGold(
        brick.x + brick.width / 2,
        brick.y + brick.height / 2,
        reward
      );
    }

    createParticles(
      brick.x + brick.width / 2,
      brick.y + brick.height / 2,
      24,
      brick.isMob ? "#d8ff8a" : "#c2ad90"
    );

    checkVictory();
  }

  if (brick.raiderBoss) updateBossHUD(brick);
  updateHUD();
}

function createSplashEffect(x,y,element="fire",scale=1){
  const filters={fire:"hue-rotate(0deg) saturate(1.7) brightness(1.2)",ice:"hue-rotate(155deg) saturate(1.5) brightness(1.2)",poison:"hue-rotate(75deg) saturate(1.8)",arcane:"hue-rotate(245deg) saturate(1.7)"};
  splashEffects.push({x,y,age:0,duration:.28,scale,filter:filters[element]||filters.fire});
}
function updateSplashEffects(dt){
  for(let i=splashEffects.length-1;i>=0;i--){splashEffects[i].age+=dt;if(splashEffects[i].age>=splashEffects[i].duration)splashEffects.splice(i,1);}
}
function drawSplashEffects(){
  if(!splashImage.complete||!splashImage.naturalWidth)return;
  for(const fx of splashEffects){
    const t=fx.age/fx.duration,size=(50+105*(1-Math.pow(1-t,3)))*fx.scale;
    ctx.save();ctx.globalAlpha=Math.max(0,1-t);ctx.filter=fx.filter;ctx.translate(fx.x,fx.y);ctx.rotate(t*.3);
    ctx.drawImage(splashImage,-size/2,-size/2,size,size);ctx.restore();
  }
}
function fireExplosion(x, y, sourceBrick) {
  createSplashEffect(x,y,"fire",1);

  const elementMult = elementalStrengthMultiplier();
  const radius = 155 * Math.min(1.5, elementMult);
  const splashDamage = 0.75 * elementMult;

  createParticles(x, y, 28, "#ff7a35");

  for (const target of bricks) {
    if (!target.alive || target === sourceBrick) continue;

    const tx = target.x + target.width / 2;
    const ty = target.y + target.height / 2;
    const dist = Math.hypot(tx - x, ty - y);

    if (dist <= radius) {
      target.hp -= splashDamage;
      target.hitFlash = 0.16;

      createParticles(tx, ty, 7, "#ffb24a");

      if (target.hp <= 0) {
        target.hp = 0;
        target.alive = false;

        if (target.isMob) {
          const xpReward = target.shooter ? 10 : 5;
          addXP(xpReward);
          createFloatingText(tx, ty, `+${xpReward} XP`, "#d8c8ff");
        }

        if (target.treasure) {
          const baseGold = 8;
          const fortuneBonus = 1 + progression.stats.fortune * 0.05;
          const reward = Math.max(1, Math.round(baseGold * fortuneBonus));
          gold += reward;
          createFloatingGold(tx, ty, reward);
        }
      }
    }
  }

  updateHUD();
  checkVictory();
}

function updateBossMovement(dt) {
  if (gameState !== "playing" || roomNumber !== 5) return;

  const boss =
    bricks.find(brick => brick.alive && brick.raiderBoss);

  if (!boss) return;

  const sideWalls =
    bricks.filter(
      brick =>
        brick.alive &&
        !brick.isMob &&
        brick.baseCellRow === 2
    );

  // Start with the inner arena lane. As side blocks disappear later,
  // this can be expanded further into the "destroy the cage" mechanic.
  const leftWall = sideWalls
    .filter(b => b.x < WORLD_WIDTH / 2)
    .sort((a,b) => b.x - a.x)[0];

  const rightWall = sideWalls
    .filter(b => b.x > WORLD_WIDTH / 2)
    .sort((a,b) => a.x - b.x)[0];

  const leftLimit =
    leftWall
      ? leftWall.x + leftWall.width + 6
      : 55;

  const rightLimit =
    rightWall
      ? rightWall.x - boss.width - 6
      : WORLD_WIDTH - 55 - boss.width;

  const exposed = boss.armor <= 0;
  const speed =
    exposed
      ? boss.moveSpeed * 1.65
      : boss.moveSpeed;

  boss.x +=
    boss.moveDir *
    speed *
    dt;

  if (boss.x <= leftLimit) {
    boss.x = leftLimit;
    boss.moveDir = 1;
  } else if (boss.x >= rightLimit) {
    boss.x = rightLimit;
    boss.moveDir = -1;
  }

  updateBossHUD(boss);
}

function updateBossHUD(boss) {
  if (!boss || !boss.alive || roomNumber !== 5 || gameState !== "playing") {
    bossHudEl.classList.add("hidden");
    return;
  }

  bossHudEl.classList.remove("hidden");
  const hpPct = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
  bossBarFillEl.style.width = `${hpPct * 100}%`;

  if (boss.armor > 0) {
    bossPhaseEl.textContent = `ARMOR ${Math.ceil(boss.armor)} / ${boss.maxArmor}`;
  } else {
    bossPhaseEl.textContent = "ARMOR BROKEN — RAIDER ENRAGED";
  }
}

function updateRangerSkill(dt) {
  rangerSkill.timer = Math.max(0, rangerSkill.timer - dt);
  const ready = rangerSkill.timer <= 0;
  const activeCooldown = rangerSkill.effectiveCooldown || rangerSkill.cooldown;
  const fill = 1 - rangerSkill.timer / activeCooldown;

  if (skillCooldownFillEl) {
    skillCooldownFillEl.style.width = `${Math.max(0, Math.min(1, fill)) * 100}%`;
  }

  if (skillStatusEl) {
    skillStatusEl.textContent = ready
      ? "BOW SHOT READY — TAP ENEMY"
      : `BOW SHOT ${rangerSkill.timer.toFixed(1)}s`;
  }
}

function enemyAtWorldPoint(x, y) {
  for (let i = bricks.length - 1; i >= 0; i--) {
    const enemy = bricks[i];
    if (
      enemy.alive &&
      enemy.isMob &&
      x >= enemy.x &&
      x <= enemy.x + enemy.width &&
      y >= enemy.y &&
      y <= enemy.y + enemy.height
    ) {
      return enemy;
    }
  }
  return null;
}

function useRangerSkill(target) {
  if (
    gameState !== "playing" ||
    rangerSkill.timer > 0 ||
    !target ||
    !target.alive ||
    !target.isMob
  ) return false;

  const x = player.x;
  const y = player.y - 55;
  const targetX = target.x + target.width / 2;
  const targetY = target.y + target.height / 2;
  const dx = targetX - x;
  const dy = targetY - y;
  const length = Math.hypot(dx, dy) || 1;

  playerProjectiles.push({
    x,
    y,
    vx: dx / length * rangerSkill.speed,
    vy: dy / length * rangerSkill.speed,
    radius: 8,
    damage: rangerSkill.damage,
    target
  });

  rangerSkill.timer = rangerSkill.effectiveCooldown || rangerSkill.cooldown;
  return true;
}

function updatePlayerProjectiles(dt) {
  for (let i = playerProjectiles.length - 1; i >= 0; i--) {
    const shot = playerProjectiles[i];
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;

    const target = shot.target;
    if (
      target &&
      target.alive &&
      shot.x + shot.radius > target.x &&
      shot.x - shot.radius < target.x + target.width &&
      shot.y + shot.radius > target.y &&
      shot.y - shot.radius < target.y + target.height
    ) {
      damageBrick(target, shot.damage, "weapon");
      playerProjectiles.splice(i, 1);
      continue;
    }

    if (
      shot.x < -40 || shot.x > WORLD_WIDTH + 40 ||
      shot.y < -40 || shot.y > WORLD_HEIGHT + 40
    ) {
      playerProjectiles.splice(i, 1);
    }
  }
}

function drawPlayerProjectiles() {
  for (const shot of playerProjectiles) {
    ctx.save();
    ctx.translate(shot.x, shot.y);
    ctx.rotate(Math.atan2(shot.vy, shot.vx));
    ctx.strokeStyle = "#f2d7a0";
    ctx.fillStyle = "#f2d7a0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(13, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(6, -6);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function updateEnemyAttacks(dt) {
  if (gameState !== "playing") return;

  for (const enemy of bricks) {
    if (!enemy.alive || !(enemy.shooter || enemy.iceGoblin || enemy.raiderBoss)) continue;

    enemy.fireCooldown = (enemy.fireCooldown || 0) - dt;

    if (enemy.fireCharge > 0) {
      enemy.fireCharge -= dt;
      enemy.telegraph = enemy.fireCharge;

      if (enemy.fireCharge <= 0) {
        enemy.telegraph = 0;
        fireEnemyShot(enemy);

        if (enemy.raiderBoss) {
          enemy.fireCooldown = enemy.armor > 0 ? 2.25 : 1.55;
        } else if (enemy.shooterVariant === "stun") {
          enemy.fireCooldown = 3.0;
        } else if (enemy.shooterVariant === "spread") {
          enemy.fireCooldown = 1.35;
        } else if (enemy.iceGoblin) {
          enemy.fireCooldown = 2.6;
        } else {
          enemy.fireCooldown = 2.2;
        }
      }

      continue;
    }

    if (enemy.fireCooldown <= 0) {
      if (enemy.raiderBoss) {
        enemy.fireCharge = 0.75;
      } else if (enemy.shooterVariant === "stun") {
        enemy.fireCharge = 0.8;
      } else if (enemy.shooterVariant === "spread") {
        enemy.fireCharge = 0.42;
      } else {
        enemy.fireCharge = 0.65;
      }
      enemy.telegraph = enemy.fireCharge;
    }
  }
}

function fireEnemyShot(shooter) {
  const x = shooter.x + shooter.width / 2;
  const y = shooter.y + shooter.height;

  if (shooter.raiderBoss) {
    const targetX = player.x;
    const targetY = player.y - 20;
    const dx = targetX - x;
    const dy = targetY - y;
    const length = Math.hypot(dx, dy) || 1;
    const speed = shooter.armor > 0 ? 360 : 430;
    const vx = dx / length * speed;
    const vy = dy / length * speed;

    enemyProjectiles.push({
      x, y, radius: 11, vx, vy,
      type: "arrow",
      angle: Math.atan2(vy, vx)
    });
    return;
  }

  if (shooter.iceGoblin) {
    enemyProjectiles.push({x,y,radius:15,vx:0,vy:320,type:"ice"});
    return;
  }

  if (shooter.shooterVariant === "stun") {
    enemyProjectiles.push({
      x,
      y,
      radius: 14,
      vx: 0,
      vy: 355,
      type: "stun"
    });
    return;
  }

  if (shooter.shooterVariant === "spread") {
    for (const vx of [-150, 0, 150]) {
      enemyProjectiles.push({x,y,radius:12,vx,vy:350,type:"damage"});
    }
    return;
  }

  enemyProjectiles.push({x,y,radius:13,vx:0,vy:380,type:"damage"});
}

function updateProjectiles(dt) {
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const shot = enemyProjectiles[i];
    shot.x += (shot.vx || 0) * dt;
    shot.y += shot.vy * dt;

    if (
      shot.x > player.x - player.width / 2 &&
      shot.x < player.x + player.width / 2 &&
      shot.y + shot.radius > player.y - player.height / 2 &&
      shot.y - shot.radius < player.y + player.height / 2
    ) {
      enemyProjectiles.splice(i, 1);
      if (shot.type === "ice") {
        applyIceSlow();
      } else if (shot.type === "stun") {
        applyStun();
      } else {
        hurtPlayer();
      }
      continue;
    }

    if (shot.y > WORLD_HEIGHT + 50) {
      enemyProjectiles.splice(i, 1);
    }
  }
}

function loseBall() {
  if (gameState === "lost") return;

  resetHitCombo();
  ball.pierceDamageRemaining = 0;

  ballsLeft = Math.max(0, ballsLeft - 1);
  ball.launched = false;
  ball.vx = 0;
  ball.vy = 0;
  updateHUD();

  if (ballsLeft <= 0) {
    gameState = "lost";
    messageEl.style.display = "block";
    messageEl.textContent = "OUT OF BALLS — TAP TO END RUN";
    return;
  }

  gameState = "waiting";
  ball.x = player.x;
  ball.y = player.y - 58;
  messageEl.style.display = "block";
  messageEl.textContent = `BALL LOST — ${ballsLeft} LEFT — TAP TO LAUNCH`;
}

function applyIceSlow() {
  // Stack Ice up to three times; each hit refreshes the duration.
  player.slowStacks = Math.min(3, (player.slowStacks || 0) + 1);
  player.slowTimer = 3;

  const slowByStack = [1, 0.70, 0.40, 0.10];
  player.slowMultiplier = slowByStack[player.slowStacks];

  createParticles(player.x, player.y, 28, "#9de7ff");
  createFloatingText(
    player.x,
    player.y - 45,
    player.slowStacks > 1 ? `FROZEN x${player.slowStacks}!` : "SLOWED!",
    "#bceeff"
  );
}

function applyStun() {
  // Briefly removes trolley control while the ball keeps moving.
  player.stunTimer = Math.max(player.stunTimer || 0, 1.15);

  createParticles(
    player.x,
    player.y - 20,
    30,
    "#ffe66d"
  );

  createFloatingText(
    player.x,
    player.y - 55,
    "STUNNED!",
    "#fff08a"
  );
}

function hurtPlayer() {
  if (player.invincibleTimer > 0 || gameState !== "playing") return;

  if (shieldReady) {
    shieldReady = false;
    shieldShatterTimer = 0.55;
    createParticles(player.x, player.y - 30, 26, "#73d8ff");
    createFloatingText(player.x, player.y - 70, "SHIELD!", "#9fe8ff");
    return;
  }

  player.hp -= 1;
  player.invincibleTimer = 0.8;
  createParticles(player.x, player.y - 25, 18, "#ff725f");
  updateHUD();

  if (player.hp <= 0) {
    loseBallFromHP();
  }
}

function loseBallFromHP() {
  ballsLeft = Math.max(0, ballsLeft - 1);
  resetHitCombo();

  if (ballsLeft <= 0) {
    player.hp = 0;
    gameState = "lost";
    ball.launched = false;
    messageEl.style.display = "block";
    messageEl.textContent = "OUT OF BALLS — TAP TO END RUN";
    updateHUD();
    return;
  }

  player.hp = player.maxHp;
  player.invincibleTimer = 1.4;
  ball.launched = false;
  ball.vx = 0;
  ball.vy = 0;
  ball.x = player.x;
  ball.y = player.y - 58;
  gameState = "waiting";
  messageEl.style.display = "block";
  messageEl.textContent = `KNOCKED OUT — ${ballsLeft} BALLS LEFT — TAP TO RELAUNCH`;
  updateHUD();
}

function checkVictory() {
  const mobsLeft =
    bricks.filter(brick => brick.alive && brick.isMob).length;

  if (mobsLeft === 0 && gameState === "playing") {
    addXP(roomNumber === 5 ? 75 : 20);

    if (roomNumber === 5) {
      progression.raiderUnlocked = true;
      saveProgression();
    }

    resetHitCombo();

    ball.launched = false;
    ballStuck = false;
    enemyProjectiles = [];
    bossHudEl.classList.add("hidden");

    // Re-center the mounted hero/trolley before presenting the reward.
    player.x = WORLD_WIDTH / 2;
    player.velocityX = 0;
    ball.x = player.x;
    ball.y = player.y - 58;

    gameState = "upgrade";
    messageEl.style.display = "none";

    updateRuneText();
    rollRuneOffer(3);

    upgradeOverlay.classList.add("rewardRise");
    upgradeOverlay.classList.remove("hidden");

    setTimeout(() => {
      upgradeOverlay.classList.remove("rewardRise");
    }, 450);
  }
}

function updateLobbyUI() {
  activeProfileNameEl.textContent =
    progression.profileName || `Adventurer ${activeProfileIndex}`;
  lobbyLevelEl.textContent = progression.level;
  lobbyXpEl.textContent = `${progression.xp} / ${xpNeededForLevel(progression.level)}`;
  bestRoomEl.textContent = progression.bestRoom || 0;
}

function returnToLobby(victory = false) {
  progression.bestRoom = Math.max(progression.bestRoom || 0, roomNumber);
  saveProgression();
  updateStatsUI();
  updateLobbyUI();

  const xpNeed = xpNeededForLevel(progression.level);
  lobbyTitleEl.textContent = victory ? "Run Complete!" : "Run Ended";
  lobbySubtitleEl.textContent = victory
    ? "Your adventure continues."
    : "Spend your earned stat points, adjust your build, and try again.";

  lastRunSummaryEl.innerHTML =
    `Reached Room <strong>${roomNumber}</strong><br>` +
    `Level <strong>${progression.level}</strong> — ${progression.xp}/${xpNeed} XP`;

  lastRunSummaryEl.classList.remove("hidden");
  runLobby.classList.remove("hidden");

  gameState = "lobby";
  ball.launched = false;
  ballStuck = false;
  enemyProjectiles = [];
}

function createParticles(x, y, count, color = "#f7d98a") {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 360,
      vy: (Math.random() - 0.5) * 360,
      life: 0.4 + Math.random() * 0.4,
      size: 4 + Math.random() * 7,
      color,
      text: null
    });
  }
}

function createFloatingGold(x, y, amount) {
  createFloatingText(x, y, `+${amount} 💰`, "#f4d26f");
}

function createFloatingText(x, y, text, color) {
  particles.push({
    x,
    y,
    vx: 0,
    vy: -70,
    life: 1.1,
    size: 22,
    color,
    text
  });
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (!p.text) p.vy += 400 * dt;

    p.life -= dt;

    if (p.life <= 0) particles.splice(i, 1);
  }
}

function updateHUD() {
  heroHpEl.textContent = `❤️ ${player.hp} / ${player.maxHp}`;
  heroShieldEl.textContent =
    (hasOvershield ? (shieldReady ? " 💙" : " ♡") : "") +
    (armorPoints > 0 ? ` 🛡️${armorPoints}` : "");
  livesHudEl.textContent = ` ⚪ ${ballsLeft}`;
  goldHudEl.textContent = `💰 ${gold}`;
  if (shopGoldEl) shopGoldEl.textContent = `${gold} 💰`;

  const mobsLeft = bricks.filter(brick => brick.alive && brick.isMob).length;
  enemyCountEl.textContent = mobsLeft;

  updateGlueButton();
  updateComboHUD();
}

function drawBackground() {
  // Approved dungeon artwork. It is scaled to fully cover the fixed 9:14
  // gameplay world without changing gameplay geometry.
  if (bgImage.complete && bgImage.naturalWidth > 0) {
    const imageRatio = bgImage.naturalWidth / bgImage.naturalHeight;
    const worldRatio = WORLD_WIDTH / WORLD_HEIGHT;

    let drawWidth;
    let drawHeight;
    let drawX;
    let drawY;

    if (imageRatio > worldRatio) {
      drawHeight = WORLD_HEIGHT;
      drawWidth = drawHeight * imageRatio;
      drawX = (WORLD_WIDTH - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = WORLD_WIDTH;
      drawHeight = drawWidth / imageRatio;
      drawX = 0;
      drawY = (WORLD_HEIGHT - drawHeight) / 2;
    }

    ctx.drawImage(
      bgImage,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );

    // Light darkening layer keeps mobs/bricks readable over the artwork.
    ctx.fillStyle = "rgba(7, 8, 12, 0.18)";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  } else {
    ctx.fillStyle = "#1c1926";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  // Retain subtle side boundaries for collision readability.
  ctx.fillStyle = "rgba(12, 12, 18, 0.30)";
  ctx.fillRect(0, 110, 28, WORLD_HEIGHT);
  ctx.fillRect(WORLD_WIDTH - 28, 110, 28, WORLD_HEIGHT);
}

function routeDoorInfo(type) {
  if (type === "hard") {
    return {
      icon: "🔥",
      label: "HARD",
      filter: "hue-rotate(135deg) saturate(1.65) brightness(.92)",
      detail: "TOUGHER ENEMIES"
    };
  }

  if (type === "treasure") {
    return {
      icon: "💰",
      label: "TREASURE",
      filter: "hue-rotate(205deg) saturate(1.7) brightness(1.08)",
      detail: "MORE TREASURE"
    };
  }

  if (type === "shop") {
    return {
      icon: "🛒",
      label: "SHOP",
      filter: "hue-rotate(70deg) saturate(1.55) brightness(.95)",
      detail: "SPEND GOLD"
    };
  }

  return {
    icon: "⚔️",
    label: "STANDARD",
    filter: "none",
    detail: "STANDARD ROOM"
  };
}

function drawExitChoice() {
  if (gameState !== "exitChoice") return;

  ctx.fillStyle = "rgba(7, 7, 10, .42)";
  ctx.fillRect(0, 110, WORLD_WIDTH, 1040);

  const doorY = 810;
  const doorW = 205;
  const doorH = 300;

  const left = routeDoorInfo(exitChoice.leftType);
  const right = routeDoorInfo(exitChoice.rightType);

  drawDoor(
    35,
    doorY,
    doorW,
    doorH,
    left.icon,
    left.label,
    left.filter,
    left.detail
  );

  drawDoor(
    WORLD_WIDTH - 35 - doorW,
    doorY,
    doorW,
    doorH,
    right.icon,
    right.label,
    right.filter,
    right.detail
  );

  let heroY = exitChoice.heroY;

  if (exitChoice.hopTimer > 0) {
    const t = 1 - exitChoice.hopTimer / 0.45;
    heroY -= Math.sin(t * Math.PI) * 55;
  }

  drawHeroSprite(
    exitChoice.heroX,
    heroY,
    exitChoice.facing,
    0.92
  );
}

function drawDoor(x, y, w, h, icon, label, filter, detail = "") {
  ctx.save();

  // Route glow remains visible even if the PNG fails to load.
  ctx.globalAlpha = 0.40;
  ctx.fillStyle =
    label === "HARD" ? "#c43d34" :
    label === "TREASURE" ? "#d2a933" :
    label === "SHOP" ? "#8c55cc" :
    "#3c91d1";

  ctx.shadowBlur = 30;
  ctx.shadowColor = ctx.fillStyle;
  ctx.fillRect(x + 22, y + 22, w - 44, h - 38);

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  if (doorImage.complete && doorImage.naturalWidth > 0) {
    ctx.filter = filter || "none";
    ctx.drawImage(doorImage, x, y, w, h);
    ctx.filter = "none";
  } else {
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 7;
    ctx.strokeRect(x, y, w, h);
  }

  ctx.textAlign = "center";
  ctx.shadowBlur = 8;
  ctx.shadowColor = "#000";

  ctx.font = "bold 30px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(icon, x + w / 2, y + h - 73);

  ctx.font = "bold 20px Arial";
  ctx.fillText(label, x + w / 2, y + h - 45);

  ctx.font = "bold 11px Arial";
  ctx.fillStyle = "#eee5d4";
  ctx.fillText(detail, x + w / 2, y + h - 25);

  ctx.restore();
}

function drawRail() {
  const railY = player.y + 70;

  // Dark bed beneath the track.
  ctx.fillStyle = "rgba(10, 9, 12, .72)";
  ctx.fillRect(22, railY - 10, WORLD_WIDTH - 44, 70);

  // Wooden sleepers.
  for (let x = 25; x < WORLD_WIDTH - 25; x += 74) {
    ctx.fillStyle = "#5b3c29";
    ctx.fillRect(x, railY + 12, 50, 18);

    ctx.strokeStyle = "#2d2019";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, railY + 12, 50, 18);
  }

  // Twin metal rails.
  ctx.fillStyle = "#b5b1ad";
  ctx.fillRect(28, railY, WORLD_WIDTH - 56, 10);
  ctx.fillRect(28, railY + 36, WORLD_WIDTH - 56, 10);

  ctx.fillStyle = "#55525a";
  ctx.fillRect(28, railY + 8, WORLD_WIDTH - 56, 5);
  ctx.fillRect(28, railY + 44, WORLD_WIDTH - 56, 5);

  // Rail bolts.
  ctx.fillStyle = "#d0c9be";
  for (let x = 48; x < WORLD_WIDTH - 40; x += 74) {
    ctx.beginPath();
    ctx.arc(x, railY + 5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, railY + 41, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  let x = player.x;
  let y = player.y;

  if (gameState === "postRewardShake") {
    x += Math.sin(performance.now() * 0.022) * 8;
    y += Math.cos(performance.now() * 0.028) * 2;
  }

  ctx.save();
  if (player.slowTimer > 0 && player.slowStacks > 0) {
    const tintByStack = [
      "none",
      "hue-rotate(145deg) saturate(1.7) brightness(1.18)",
      "hue-rotate(155deg) saturate(2.3) brightness(1.30)",
      "hue-rotate(165deg) saturate(3.0) brightness(1.48)"
    ];
    ctx.filter = tintByStack[Math.min(3, player.slowStacks)];
  }

  if (player.stunTimer > 0) {
    ctx.filter = "sepia(.8) saturate(2.2) brightness(1.35)";
  }


  if (
    player.invincibleTimer > 0 &&
    Math.floor(player.invincibleTimer * 15) % 2 === 0
  ) {
    ctx.globalAlpha = 0.45;
  }

  // Shield is drawn in world space and should never visually mirror.
  if (shieldReady || shieldShatterTimer > 0) {
    const alpha = shieldReady
      ? 0.85
      : Math.max(0, shieldShatterTimer / 0.55);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#69d0ff";
    ctx.lineWidth = shieldReady ? 9 : 4;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y - 22,
      player.width / 2 + 44,
      106,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.12;
    ctx.fillStyle = "#69d0ff";
    ctx.fill();
    ctx.restore();
  }

  // Mirror the mounted assembly based on the trolley's last movement direction.
  const facing = player.facing >= 0 ? 1 : -1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  const trolleyW = player.width * 1.24;
  const trolleyH = trolleyBodyImage.naturalWidth > 0
    ? trolleyW * (trolleyBodyImage.naturalHeight / trolleyBodyImage.naturalWidth)
    : 92;

  if (trolleyBodyImage.complete && trolleyBodyImage.naturalWidth > 0) {
    ctx.drawImage(
      trolleyBodyImage,
      -trolleyW / 2,
      -trolleyH * 0.48,
      trolleyW,
      trolleyH
    );
  } else {
    ctx.fillStyle = "#76523c";
    ctx.fillRect(-player.width / 2, -20, player.width, 40);
  }

  // Hero is deliberately much closer to the trolley deck now.
  // Draw directly in the already-mirrored trolley coordinate system.
  if (gameState !== "exitChoice") {
    const heroH = 92;
    const heroW = heroImage.naturalHeight > 0
      ? heroH * (heroImage.naturalWidth / heroImage.naturalHeight)
      : 58;

    if (heroImage.complete && heroImage.naturalWidth > 0) {
      ctx.drawImage(
        heroImage,
        -heroW / 2,
        -trolleyH * 0.36 - heroH + 8,
        heroW,
        heroH
      );
    }
  }

  ctx.restore();
  ctx.restore();
}

function drawHeroSprite(x, y, facing = 1, scale = 1) {
  if (!(heroImage.complete && heroImage.naturalWidth > 0)) {
    ctx.fillStyle = "#4f7bc4";
    ctx.fillRect(x - 18, y - 50, 36, 60);
    return;
  }

  const h = 118 * scale;
  const w = h * (heroImage.naturalWidth / heroImage.naturalHeight);

  ctx.save();
  ctx.translate(x, y);

  if (facing < 0) {
    ctx.scale(-1, 1);
  }

  ctx.drawImage(heroImage, -w / 2, -h, w, h);
  ctx.restore();
}

function drawDriver(x, y) {
  const runAmount = Math.sin(player.runTimer) * 12;
  const bodyY = y - 32;

  ctx.fillStyle = "#e1b58d";
  ctx.beginPath();
  ctx.arc(x, bodyY - 32, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#d7d9df";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(x, bodyY - 16);
  ctx.lineTo(x, bodyY + 18);
  ctx.stroke();

  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x, bodyY - 5);
  ctx.lineTo(x + 25 * player.facing, bodyY + 3);
  ctx.stroke();

  ctx.strokeStyle = "#6e86ad";
  ctx.lineWidth = 8;

  ctx.beginPath();
  ctx.moveTo(x, bodyY + 15);
  ctx.lineTo(x - runAmount, bodyY + 43);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, bodyY + 15);
  ctx.lineTo(x + runAmount, bodyY + 43);
  ctx.stroke();
}

function drawBall() {
  if (progression.equipment.ball === "cinder") {
    ctx.save();

    const glow = ctx.createRadialGradient(
      ball.x,
      ball.y,
      2,
      ball.x,
      ball.y,
      ball.radius * 2.3
    );
    glow.addColorStop(0, "rgba(255, 244, 155, 1)");
    glow.addColorStop(.38, "rgba(255, 135, 45, .95)");
    glow.addColorStop(1, "rgba(255, 60, 20, 0)");

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 2.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffb33e";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff1a8";
    ctx.beginPath();
    ctx.arc(ball.x - 4, ball.y - 5, ball.radius * .45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return;
  }

  ctx.fillStyle = ballStuck ? "#ffe892" : "#f4e9c8";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = ballStuck ? "#f2c85c" : "#ffffff";
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawMobImage(image, brick, scaleX = 1, scaleY = 1, yOffset = 0) {
  if (!(image.complete && image.naturalWidth > 0)) return false;

  const targetW = brick.width * scaleX;
  const targetH = brick.height * scaleY;

  const imageRatio =
    image.naturalWidth / image.naturalHeight;

  const targetRatio =
    targetW / targetH;

  let drawW;
  let drawH;

  if (imageRatio > targetRatio) {
    drawW = targetW;
    drawH = targetW / imageRatio;
  } else {
    drawH = targetH;
    drawW = targetH * imageRatio;
  }

  ctx.drawImage(
    image,
    brick.x + brick.width / 2 - drawW / 2,
    brick.y + brick.height / 2 - drawH / 2 + yOffset,
    drawW,
    drawH
  );

  return true;
}

function drawBricks(dt) {
  for (const brick of bricks) {
    if (!brick.alive) continue;

    if (brick.hitFlash > 0) brick.hitFlash -= dt;

    const ratio = brick.hp / brick.maxHp;

    if (brick.isMob && gobImage.complete && gobImage.naturalWidth > 0) {
      ctx.save();

      // Shooter goblins get a red hue shift so gob1.png can serve as
      // the first reusable mob block asset.
      if (brick.telegraph > 0 && Math.floor(brick.telegraph * 16) % 2 === 0) {
        ctx.filter = "brightness(2.1) saturate(.35)";
      } else if (brick.raiderBoss) {
        ctx.filter = brick.armor > 0
          ? "grayscale(.45) brightness(.82) contrast(1.25)"
          : "none";
      } else if (brick.stunGoblin) {
        ctx.filter = "hue-rotate(48deg) saturate(2.1) brightness(1.2)";
      } else if (brick.darkFireGoblin) {
        ctx.filter = "hue-rotate(320deg) saturate(2) brightness(.66)";
      } else if (brick.fireGoblin || brick.shooter) {
        ctx.filter = "hue-rotate(300deg) saturate(1.8) brightness(.95)";
      } else if (brick.iceGoblin) {
        ctx.filter = "hue-rotate(145deg) saturate(1.45) brightness(1.14)";
      } else if (brick.greenGoblin) {
        // Keep green family close to the source sprite for now.
        ctx.filter = "hue-rotate(12deg) saturate(1.15) brightness(1.02)";
      } else {
        // Neutral/grey grunt.
        ctx.filter = "grayscale(.92) brightness(.88) contrast(1.15)";
      }

      if (brick.hitFlash > 0) {
        ctx.globalAlpha = 0.55;
      }

      if (brick.raiderBoss) {
        // Raider has different source dimensions/padding; force exact cell size
        // so its prison block matches every other enemy block.
        if (raiderImage.complete && raiderImage.naturalWidth > 0) {
          ctx.drawImage(
            raiderImage,
            brick.x,
            brick.y - 3,
            brick.width,
            brick.height + 6
          );
        }
      } else {
        drawMobImage(
          gobImage,
          brick,
          1.16,
          1.20,
          -3
        );
      }

      ctx.restore();

      if (brick.hitFlash > 0) {
        ctx.fillStyle = "rgba(255,255,255,.42)";
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      }
    } else if (brick.treasure) {
      const damaged = brick.hp <= brick.maxHp * 0.5;
      const img = damaged ? brick2Image : brick1Image;
      ctx.save();
      ctx.filter = "hue-rotate(35deg) saturate(1.9) brightness(1.18)";
      if (brick.hitFlash > 0) ctx.globalAlpha = 0.65;
      if (img.complete && img.naturalWidth > 0) ctx.drawImage(img, brick.x, brick.y, brick.width, brick.height);
      else { ctx.fillStyle="#c79d31"; ctx.fillRect(brick.x,brick.y,brick.width,brick.height); }
      ctx.restore();
    } else {
      const damaged = brick.hp <= brick.maxHp * 0.5;
      const img = damaged ? brick2Image : brick1Image;

      if (img.complete && img.naturalWidth > 0) {
        ctx.save();

        if (brick.hitFlash > 0) {
          ctx.globalAlpha = 0.62;
        }

        ctx.drawImage(
          img,
          brick.x,
          brick.y,
          brick.width,
          brick.height
        );

        ctx.restore();

        if (brick.hitFlash > 0) {
          ctx.fillStyle = "rgba(255,255,255,.38)";
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        }
      } else {
        ctx.fillStyle = damaged ? "#7b3f31" : "#b35042";
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      }
    }

    if (brick.raiderBoss && brick.armor > 0) {
      ctx.save();
      const pulse = 0.78 + Math.sin(performance.now() * 0.006) * 0.10;

      ctx.globalAlpha = pulse;
      ctx.strokeStyle = "#aeb4bb";
      ctx.lineWidth = 7;
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#9299a1";

      ctx.strokeRect(
        brick.x - 7,
        brick.y - 9,
        brick.width + 14,
        brick.height + 18
      );

      ctx.globalAlpha = 0.09;
      ctx.fillStyle = "#c5c9cd";
      ctx.fillRect(
        brick.x - 5,
        brick.y - 7,
        brick.width + 10,
        brick.height + 14
      );

      ctx.restore();
    }

    if (brick.maxHp > 1) {
      ctx.fillStyle = "#251d26";
      ctx.fillRect(
        brick.x + 10,
        brick.y + brick.height - 14,
        brick.width - 20,
        7
      );

      ctx.fillStyle = brick.isMob
        ? "#e45757"
        : brick.treasure
          ? "#ffe77c"
          : "#bcae9b";

      ctx.fillRect(
        brick.x + 10,
        brick.y + brick.height - 14,
        (brick.width - 20) * ratio,
        7
      );
    }
  }
}
function drawProjectiles() {
  for (const shot of enemyProjectiles) {
    ctx.save();

    if (shot.type === "arrow") {
      ctx.translate(shot.x, shot.y);
      ctx.rotate(shot.angle || Math.atan2(shot.vy, shot.vx));
      ctx.strokeStyle = "#d7c6a1";
      ctx.fillStyle = "#d7c6a1";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(16, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(7, -7);
      ctx.lineTo(7, 7);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle =
        shot.type === "ice"
          ? "#91e9ff"
          : shot.type === "stun"
            ? "#ffe15a"
            : "#ff5d4c";
      ctx.shadowBlur = 14;
      ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);

    if (p.text) {
      ctx.fillStyle = p.color;
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "center";
      ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  ctx.globalAlpha = 1;
  ctx.textAlign = "start";
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
  lastTime = timestamp;

  updatePlayer(dt);
  updateRoomClear(dt);
  updatePostRewardShake(dt);
  updateExitChoice(dt);

  if (gameState === "playing") {
    updateRangerSkill(dt);
    updatePlayerProjectiles(dt);
    updateBall(dt);
    updateBossMovement(dt);
    updateEnemyAttacks(dt);
    updateProjectiles(dt);
  }

  updateParticles(dt);
  updateSplashEffects(dt);

  drawBackground();
  drawBricks(dt);
  drawSplashEffects();
  drawPlayerProjectiles();
  drawProjectiles();
  drawRail();
  drawPlayer();
  drawExitChoice();

  if (gameState !== "exitChoice" && gameState !== "roomClear") {
    drawBall();
  }
  drawParticles();

  requestAnimationFrame(gameLoop);
}

applySoundSettings();
updateStatsUI();
updateLoadoutUI();
updateRuneText();
resetRun();
gameState = "lobby";
runLobby.classList.remove("hidden");
updateLobbyUI();
requestAnimationFrame(gameLoop);;














