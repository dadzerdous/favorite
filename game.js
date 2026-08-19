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
const powerLevelEl = document.getElementById("powerLevel");
const widthLevelEl = document.getElementById("widthLevel");
const speedLevelEl = document.getElementById("speedLevel");
const runeHudTextEl = document.getElementById("runeHudText");
const emberLevelEl = document.getElementById("emberLevel");
const impactLevelEl = document.getElementById("impactLevel");
const expansionLevelEl = document.getElementById("expansionLevel");
const hasteLevelEl = document.getElementById("hasteLevel");
const wardLevelEl = document.getElementById("wardLevel");

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

const gobImage = new Image();
gobImage.src = "assets/gob1.png";

const brick1Image = new Image();
brick1Image.src = "assets/brick1.png";

const brick2Image = new Image();
brick2Image.src = "assets/brick2.png";

let gameState = "waiting";
let lastTime = 0;
let keys = {};
let pointerActive = false;
let pointerX = WORLD_WIDTH / 2;
let roomNumber = 1;

let runes = {
  ember: 0,
  impact: 0,
  expansion: 0,
  haste: 0,
  ward: 0
};

let gold = 0;

const progression = JSON.parse(localStorage.getItem("spikeTrolleyProgression") || "null") || {
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
  }
};


if (typeof progression.bestRoom !== "number") progression.bestRoom = 0;

let armorPoints = 0;
let stateBeforeStats = "waiting";

function xpNeededForLevel(level) {
  return 100 + (level - 1) * 50;
}

function saveProgression() {
  localStorage.setItem("spikeTrolleyProgression", JSON.stringify(progression));
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
  velocityX: 0,
  hp: 5,
  maxHp: 5,
  invincibleTimer: 0,
  facing: 1,
  runTimer: 0
};

const ball = {
  x: player.x,
  y: player.y - 60,
  radius: 16,
  speed: 620,
  vx: 0,
  vy: 0,
  launched: false,
  damage: 1,
  baseDamageMultiplier: 1
};

let bricks = [];
let enemyProjectiles = [];
let particles = [];
let attackTimer = 0;

const roomLayouts = [
  [
    "BBIBB",
    "BMMMB",
    "BTMIB",
    "BBSBB"
  ],
  [
    "BMBMB",
    "BIMIB",
    "MBTBM",
    "BBSBB"
  ],
  [
    "IIMII",
    "BHBHB",
    "MMTMM",
    "BBSBB"
  ]
];

function buildRoom() {
  bricks = [];

  const layout = roomLayouts[(roomNumber - 1) % roomLayouts.length];
  const brickWidth = 125;
  const brickHeight = 65;
  const gap = 12;
  const cols = 5;
  const totalWidth = cols * brickWidth + (cols - 1) * gap;
  const startX = (WORLD_WIDTH - totalWidth) / 2;
  const startY = 210;

  layout.forEach((line, row) => {
    [...line].forEach((type, col) => {
      if (type === ".") return;

      let hp = 1;
      let isMob = false;
      let shooter = false;
      let treasure = false;
      let ice = false;

      if (type === "B") hp = 2;
      if (type === "H") hp = 4;

      if (type === "M") {
        hp = 3;
        isMob = true;
      }

      if (type === "S") {
        hp = 5;
        isMob = true;
        shooter = true;
      }

      if (type === "T") {
        hp = 2;
        treasure = true;
      }

      if (type === "I") {
        hp = 4;
        ice = true;
      }

      bricks.push({
        x: startX + col * (brickWidth + gap),
        y: startY + row * (brickHeight + gap),
        width: brickWidth,
        height: brickHeight,
        hp,
        maxHp: hp,
        alive: true,
        isMob,
        shooter,
        treasure,
        ice,
        hitFlash: 0,
        type
      });
    });
  });

  roomTitleEl.textContent = `ROOM ${roomNumber} — GOBLIN OUTPOST`;
  updateHUD();
}

function resetRun() {
  roomNumber = 1;
  gold = 0;
  runes = {
    ember: 0,
    impact: 0,
    expansion: 0,
    haste: 0,
    ward: 0
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
  player.hp = player.maxHp;
  player.x = WORLD_WIDTH / 2;

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
  player.x = WORLD_WIDTH / 2;

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
  armorPoints = progression.stats.defense + runes.ward;

  gameState = "waiting";

  buildRoom();
  updateUpgradeText();
  updateShopUI();

  messageEl.style.display = "block";
  messageEl.textContent = "TAP / CLICK TO LAUNCH";
}

function launchBall() {
  if (gameState === "lost") {
    returnToLobby(false);
    return;
  }

  if (ballStuck) {
    ballStuck = false;
    stuckTimer = 0;
    const angle = -Math.PI / 3;
    ball.vx = Math.cos(angle) * ball.speed;
    ball.vy = Math.sin(angle) * ball.speed;
    ball.launched = true;
    gameState = "playing";
    messageEl.style.display = "none";
    return;
  }

  if (gameState !== "waiting" || ball.launched) return;

  ball.launched = true;

  const angle = -Math.PI / 3;
  ball.vx = Math.cos(angle) * ball.speed;
  ball.vy = Math.sin(angle) * ball.speed;

  gameState = "playing";
  messageEl.style.display = "none";
}

window.addEventListener("keydown", event => {
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
  if (gameState === "upgrade" || gameState === "shop" || gameState === "stats") return;

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
}

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

  runes[type] += 1;

  if (type === "impact") {
    ball.damage += 1;
  }

  if (type === "expansion") {
    player.width *= 1.15;
  }

  if (type === "haste") {
    player.speed *= 1.15;
  }

  if (type === "ward") {
    armorPoints += 1;
  }

  upgradeOverlay.classList.add("hidden");
  updateRuneText();
  updateHUD();

  if (roomNumber % 3 === 0) {
    openShop();
  } else {
    roomNumber += 1;
    startRoom();
  }
}

function updateUpgradeText() {
  updateRuneText();
}

function updateRuneText() {
  if (emberLevelEl) {
    emberLevelEl.textContent = runes.ember > 0
      ? `Fire active${runes.ember > 1 ? ` — explosion +${runes.ember}` : ""}`
      : "Fire: inactive";
  }

  if (impactLevelEl) impactLevelEl.textContent = `Bonus damage: +${runes.impact}`;
  if (expansionLevelEl) expansionLevelEl.textContent = `Width bonus: ${Math.round((Math.pow(1.15, runes.expansion) - 1) * 100)}%`;
  if (hasteLevelEl) hasteLevelEl.textContent = `Speed bonus: ${Math.round((Math.pow(1.15, runes.haste) - 1) * 100)}%`;
  if (wardLevelEl) wardLevelEl.textContent = `Ward: +${runes.ward}`;

  const active = [];
  if (runes.ember) active.push(`🔥${runes.ember}`);
  if (runes.impact) active.push(`💥${runes.impact}`);
  if (runes.expansion) active.push(`↔️${runes.expansion}`);
  if (runes.haste) active.push(`🏃${runes.haste}`);
  if (runes.ward) active.push(`💙${runes.ward}`);

  runeHudTextEl.textContent = active.length ? active.join("  ") : "None";
}

function openShop() {
  gameState = "shop";
  messageEl.style.display = "none";
  shopOverlay.classList.remove("hidden");
  updateShopUI();
}

function leaveShop() {
  if (gameState !== "shop") return;

  shopOverlay.classList.add("hidden");
  roomNumber += 1;
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
    if (gold < 6 || player.hp >= player.maxHp) return;
    gold -= 6;
    player.hp = Math.min(player.maxHp, player.hp + 2);
  }

  updateHUD();
  updateShopUI();
}

function updateShopUI() {
  shieldOwnedEl.textContent = hasOvershield ? "OWNED — recharges each room" : "Not owned";
  glueCountEl.textContent = `Charges: ${glueCharges}`;
  healStatusEl.textContent = `HP: ${player.hp} / ${player.maxHp}`;

  const shieldBtn = document.querySelector('[data-shop="overshield"]');
  const glueBtn = document.querySelector('[data-shop="glue"]');
  const healBtn = document.querySelector('[data-shop="heal"]');

  if (shieldBtn) shieldBtn.disabled = hasOvershield || gold < 12;
  if (glueBtn) glueBtn.disabled = gold < 8;
  if (healBtn) healBtn.disabled = gold < 6 || player.hp >= player.maxHp;

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

function updatePlayer(dt) {
  let move = 0;

  if (keys["arrowleft"] || keys["a"]) move -= 1;
  if (keys["arrowright"] || keys["d"]) move += 1;

  if (pointerActive && gameState !== "upgrade" && gameState !== "shop") {
    const difference = pointerX - player.x;

    if (Math.abs(difference) > 10) {
      move = Math.max(-1, Math.min(1, difference / 120));
    }
  }

  player.velocityX = move * player.speed;
  player.x += player.velocityX * dt;

  const halfWidth = player.width / 2;
  player.x = Math.max(
    halfWidth + 30,
    Math.min(WORLD_WIDTH - halfWidth - 30, player.x)
  );

  if (Math.abs(player.velocityX) > 5) {
    player.facing = player.velocityX > 0 ? 1 : -1;
    player.runTimer += dt * Math.abs(player.velocityX) / 80;
  }

  if (player.invincibleTimer > 0) player.invincibleTimer -= dt;
  if (shieldShatterTimer > 0) shieldShatterTimer -= dt;

  if ((!ball.launched && gameState === "waiting") || ballStuck) {
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
    hurtPlayer();

    if (gameState !== "lost") {
      ball.launched = false;
      ball.vx = 0;
      ball.vy = 0;
      gameState = "waiting";
      messageEl.style.display = "block";
      messageEl.textContent = "BALL LOST — TAP TO LAUNCH";
    }

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

    ball.vx = Math.sin(angle) * ball.speed;
    ball.vy = -Math.cos(angle) * ball.speed;

    createParticles(ball.x, ball.y, 8, "#f7d98a");
  }
}

function checkBrickCollisions() {
  for (const brick of bricks) {
    if (!brick.alive) continue;

    if (
      ball.x + ball.radius > brick.x &&
      ball.x - ball.radius < brick.x + brick.width &&
      ball.y + ball.radius > brick.y &&
      ball.y - ball.radius < brick.y + brick.height
    ) {
      damageBrick(brick);

      const overlapLeft = ball.x + ball.radius - brick.x;
      const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
      const overlapTop = ball.y + ball.radius - brick.y;
      const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);

      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapLeft || minOverlap === overlapRight) {
        ball.vx *= -1;
      } else {
        ball.vy *= -1;
      }

      break;
    }
  }
}

function damageBrick(brick) {
  let hitDamage = ball.damage * ball.baseDamageMultiplier;

  if (brick.ice && runes.ember > 0) {
    hitDamage *= 2;
  }

  brick.hp -= hitDamage;
  brick.hitFlash = 0.12;

  if (runes.ember > 0 && brick.ice) {
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

  updateHUD();
}

function fireExplosion(x, y, sourceBrick) {
  const radius = 155 + Math.max(0, runes.ember - 1) * 18;
  const splashDamage = 0.75 + Math.max(0, runes.ember - 1) * 0.25;

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

function updateEnemyAttacks(dt) {
  if (gameState !== "playing") return;

  attackTimer -= dt;
  if (attackTimer > 0) return;

  attackTimer = 2.25;

  const shooters = bricks.filter(brick => brick.alive && brick.shooter);
  if (shooters.length === 0) return;

  const shooter = shooters[Math.floor(Math.random() * shooters.length)];

  enemyProjectiles.push({
    x: shooter.x + shooter.width / 2,
    y: shooter.y + shooter.height,
    radius: 13,
    vy: 380
  });
}

function updateProjectiles(dt) {
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const shot = enemyProjectiles[i];
    shot.y += shot.vy * dt;

    if (
      shot.x > player.x - player.width / 2 &&
      shot.x < player.x + player.width / 2 &&
      shot.y + shot.radius > player.y - player.height / 2 &&
      shot.y - shot.radius < player.y + player.height / 2
    ) {
      enemyProjectiles.splice(i, 1);
      hurtPlayer();
      continue;
    }

    if (shot.y > WORLD_HEIGHT + 50) {
      enemyProjectiles.splice(i, 1);
    }
  }
}

function hurtPlayer() {
  if (player.invincibleTimer > 0 || gameState === "lost") return;

  if (shieldReady) {
    shieldReady = false;
    shieldShatterTimer = 0.55;
    player.invincibleTimer = 0.45;
    createParticles(player.x, player.y, 34, "#76d5ff");
    updateHUD();
    return;
  }

  if (armorPoints > 0) {
    armorPoints = Math.max(0, armorPoints - 1);
    player.invincibleTimer = 0.35;
    createParticles(player.x, player.y, 18, "#c7cbd4");
    updateHUD();
    return;
  }

  player.hp -= 1;
  player.invincibleTimer = 0.7;

  createParticles(player.x, player.y, 20, "#ff8b8b");
  updateHUD();

  if (player.hp <= 0) {
    player.hp = 0;
    gameState = "lost";
    ball.launched = false;
    messageEl.style.display = "block";
    messageEl.textContent = "DEFEATED — TAP TO START A NEW RUN";
  }
}

function checkVictory() {
  const mobsLeft = bricks.filter(brick => brick.alive && brick.isMob).length;

  if (mobsLeft === 0) {
    addXP(20);
    gameState = "upgrade";
    ball.launched = false;
    ballStuck = false;
    enemyProjectiles = [];
    messageEl.style.display = "none";
    updateUpgradeText();

    setTimeout(() => {
      if (gameState === "upgrade") {
        upgradeOverlay.classList.remove("hidden");
      }
    }, 350);
  }
}

function updateLobbyUI() {
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
  goldHudEl.textContent = `💰 ${gold}`;

  const mobsLeft = bricks.filter(brick => brick.alive && brick.isMob).length;
  enemyCountEl.textContent = mobsLeft;

  updateGlueButton();
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
  ctx.save();

  if (
    player.invincibleTimer > 0 &&
    Math.floor(player.invincibleTimer * 15) % 2 === 0
  ) {
    ctx.globalAlpha = 0.45;
  }

  const x = player.x;
  const y = player.y;

  // Overshield bubble remains code-driven so it can flash/shatter later.
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
      y - 30,
      player.width / 2 + 44,
      112,
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

  if (trolleyImage.complete && trolleyImage.naturalWidth > 0) {
    const spriteWidth = player.width * 1.22;
    const spriteHeight =
      spriteWidth *
      (trolleyImage.naturalHeight / trolleyImage.naturalWidth);

    // Bottom-align the wheels slightly below the old paddle collision area.
    ctx.drawImage(
      trolleyImage,
      x - spriteWidth / 2,
      y - spriteHeight * 0.72,
      spriteWidth,
      spriteHeight
    );
  } else {
    // Fallback paddle if the image has not loaded yet.
    ctx.fillStyle = "#76523c";
    ctx.fillRect(
      x - player.width / 2,
      y - player.height / 2,
      player.width,
      player.height
    );

    ctx.strokeStyle = "#c3b8a4";
    ctx.lineWidth = 6;
    ctx.strokeRect(
      x - player.width / 2,
      y - player.height / 2,
      player.width,
      player.height
    );

    drawDriver(x, y - 28);
  }

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
  if (runes.ember > 0) {
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

function drawBricks(dt) {
  for (const brick of bricks) {
    if (!brick.alive) continue;

    if (brick.hitFlash > 0) brick.hitFlash -= dt;

    const ratio = brick.hp / brick.maxHp;

    if (brick.isMob && gobImage.complete && gobImage.naturalWidth > 0) {
      ctx.save();

      // Shooter goblins get a red hue shift so gob1.png can serve as
      // the first reusable mob block asset.
      if (brick.shooter) {
        ctx.filter = "hue-rotate(285deg) saturate(1.15)";
      }

      if (brick.hitFlash > 0) {
        ctx.globalAlpha = 0.55;
      }

      ctx.drawImage(
        gobImage,
        brick.x,
        brick.y - 10,
        brick.width,
        brick.height + 20
      );

      ctx.restore();

      if (brick.hitFlash > 0) {
        ctx.fillStyle = "rgba(255,255,255,.42)";
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      }
    } else if (brick.treasure) {
      // Visible treasure block: intentionally obvious and optional.
      ctx.fillStyle = brick.hitFlash > 0 ? "#fff8c2" : "#d9ad28";
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

      ctx.strokeStyle = "#ffe77c";
      ctx.lineWidth = 5;
      ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

      ctx.fillStyle = "#fff0a2";
      ctx.font = "bold 34px Arial";
      ctx.textAlign = "center";
      ctx.fillText("💰", brick.x + brick.width / 2, brick.y + 44);
      ctx.textAlign = "start";
    } else if (brick.ice) {
      const damaged = brick.hp <= brick.maxHp * 0.5;

      ctx.fillStyle = brick.hitFlash > 0
        ? "#ffffff"
        : damaged
          ? "#78a9c7"
          : "#b9e8f7";

      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

      ctx.strokeStyle = "#e8fbff";
      ctx.lineWidth = 5;
      ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

      ctx.strokeStyle = "rgba(65, 125, 165, .72)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(brick.x + 15, brick.y + 12);
      ctx.lineTo(brick.x + brick.width * .48, brick.y + brick.height * .55);
      ctx.lineTo(brick.x + brick.width - 18, brick.y + 18);
      ctx.moveTo(brick.x + brick.width * .48, brick.y + brick.height * .55);
      ctx.lineTo(brick.x + brick.width * .62, brick.y + brick.height - 8);
      ctx.stroke();

      if (runes.ember > 0) {
        ctx.fillStyle = "#ff9d3f";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText("🔥 WEAK", brick.x + brick.width / 2, brick.y + 24);
        ctx.textAlign = "start";
      }
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
          : brick.ice
            ? "#8edaf0"
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

    // trail
    const trail = ctx.createLinearGradient(
      shot.x,
      shot.y - 38,
      shot.x,
      shot.y + 10
    );
    trail.addColorStop(0, "rgba(255, 69, 35, 0)");
    trail.addColorStop(1, "rgba(255, 126, 51, .8)");

    ctx.strokeStyle = trail;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(shot.x, shot.y - 34);
    ctx.lineTo(shot.x, shot.y - 2);
    ctx.stroke();

    // outer bolt
    ctx.fillStyle = "#ff5e35";
    ctx.beginPath();
    ctx.ellipse(
      shot.x,
      shot.y,
      shot.radius * .8,
      shot.radius * 1.35,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // hot center
    ctx.fillStyle = "#ffd55a";
    ctx.beginPath();
    ctx.ellipse(
      shot.x,
      shot.y - 2,
      shot.radius * .35,
      shot.radius * .75,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

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

  if (gameState === "playing") {
    updateBall(dt);
    updateEnemyAttacks(dt);
    updateProjectiles(dt);
  }

  updateParticles(dt);

  drawBackground();
  drawBricks(dt);
  drawProjectiles();
  drawRail();
  drawPlayer();
  drawBall();
  drawParticles();

  requestAnimationFrame(gameLoop);
}

updateStatsUI();
updateRuneText();
resetRun();
gameState = "lobby";
runLobby.classList.remove("hidden");
updateLobbyUI();
requestAnimationFrame(gameLoop);
