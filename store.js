// Store catalog, upgrades, affordability, purchases, and store rendering.

  // =========================================================
  // STORE ITEMS (one-time / repeatable tool purchases)
  // =========================================================

  const storeItems = [
    {
      id: "buyPrimaryBucket",
      name: "Buy a Primary Bucket",
      level: 0,
      maxLevel: 2,
      baseCost: 10,
      growth: 2,
      visible: () => {
        if (currentProcessIndex < 1) return false;
        if (TUBE_COUNT < 2) return false;
        // First extra primary bucket is available in Process 2.
        if (primaryBucketSlots === 0) return true;
        // Second becomes available after the first mixed-color discovery / Process 4.
        return currentProcessIndex >= 3 && primaryBucketSlots < 2;
      },
      desc: function () {
        return primaryBucketSlots === 0
          ? "Adds one empty permanent primary bucket to your studio"
          : "Adds another empty permanent primary bucket to your studio";
      },
      cost: function () { return Math.round(this.baseCost * Math.pow(this.growth, this.level)); },
      buy: function () {
        primaryBucketSlots++;
        this.level++;
        const emptyBucketEl = document.querySelector("#emptyPrimaryBucket");
        if (emptyBucketEl) emptyBucketEl.dataset.placed = "false";
        refreshPrimaryBucketVisual();
      }
    },
    {
      id: "unlockYellow",
      name: "Yellow Paint",
      level: 0,
      maxLevel: 1,
      baseCost: 5,
      growth: 1,
      visible: () => currentProcessIndex >= 1 && !yellowUnlocked,
      desc: () => emptyPrimaryBucketCount() > 0
        ? `Fill an empty primary bucket with Yellow`
        : `No empty primary bucket available`,
      cost: function () { return primaryColorPrice("yellow"); },
      customBuy: () => purchasePrimaryColor("yellow"),
      buy: function () {}
    },
    {
      id: "unlockBlue",
      name: "Blue Paint",
      level: 0,
      maxLevel: 1,
      baseCost: 5,
      growth: 1,
      visible: () => currentProcessIndex >= 1 && !blueUnlocked,
      desc: () => emptyPrimaryBucketCount() > 0
        ? `Fill an empty primary bucket with Blue`
        : `No empty primary bucket available`,
      cost: function () { return primaryColorPrice("blue"); },
      customBuy: () => purchasePrimaryColor("blue"),
      buy: function () {}
    },
    {
      id: "mixer",
      name: "Buy the Mixer",
      level: 0,
      maxLevel: 1,
      baseCost: 20,
      growth: 1,
      visible: () => currentProcessIndex >= 2 && !mixerUnlocked,
      desc: () => "Unlocks paint mixing and the Mixer Vials area",
      cost: function () { return this.baseCost; },
      buy: function () {
        mixerUnlocked = true;
        this.level = 1;
        document.querySelector("#warehouseRow").style.display = "block";
        const mixerToolBtnEl = document.querySelector("#mixerToolBtn");
        if (mixerToolBtnEl) mixerToolBtnEl.style.display = "flex";
      }
    },
    {
      id: "mixerVial",
      name: "Buy a Mixer Vial",
      level: 0,
      maxLevel: 1,
      baseCost: 12,
      growth: 1,
      visible: () => mixerUnlocked && VIAL_COUNT < 1,
      desc: () => "Adds your first Mixer Vial for storing mixed paint",
      cost: function () { return this.baseCost; },
      buy: function () {
        if (VIAL_COUNT >= 1) return;
        vials.push({ color: null, amount: 0 });
        VIAL_COUNT++;
        this.level = 1;
      }
    },
    {
      id: "unlockOrders",
      name: "Unlock Orders",
      level: 0,
      maxLevel: 1,
      baseCost: 40,
      growth: 1,
      visible: () => yellowUnlocked && blueUnlocked && !ordersUnlocked,
      desc: () => "Customers start placing paint orders for coins",
      cost: function () { return this.baseCost; },
      buy: function () {
        ordersUnlocked = true;
        this.level = 1;
        document.querySelector("#order").style.display = "block";
        document.querySelector("#fulfillBtn").style.display = "block";
      }
    },
    {
      id: "tubeSlot",
      name: "Buy a Tube",
      level: 0,
      maxLevel: 1,
      baseCost: 8,
      growth: 1,
      visible: () => currentProcessIndex >= 1,
      desc: function () {
        return this.level >= 1
          ? "Starter tube purchased"
          : "Adds a second empty tube to your Paint Case";
      },
      cost: function () { return this.baseCost; },
      buy: function () {
        if (this.level >= 1) return;
        tubes.push({ color: null, amount: 0 });
        TUBE_COUNT++;
        this.level = 1;
      }
    },
    {
      id: "whiteBucket",
      name: "Buy a Bucket for White",
      level: 0,
      maxLevel: 1,
      baseCost: 25,
      growth: 1,
      visible: () => ordersUnlocked && !whiteBucketPurchased && !whiteUnlocked,
      desc: () => "Adds an empty bucket that can be filled with White paint",
      cost: function () { return this.baseCost; },
      buy: function () {
        whiteBucketPurchased = true;
        this.level = 1;
        const emptyBucketEl = document.querySelector("#emptyPrimaryBucket");
        if (emptyBucketEl) emptyBucketEl.dataset.placed = "false";
        refreshPrimaryBucketVisual();
      }
    },
    {
      id: "white",
      name: "Buy White Paint",
      level: 0,
      maxLevel: 1,
      baseCost: 50,
      growth: 1,
      visible: () => ordersUnlocked && whiteBucketPurchased && !whiteUnlocked,
      desc: () => "Fill your empty bucket with White and unlock light mixes",
      cost: function () { return this.baseCost; },
      buy: function () {
        whiteUnlocked = true;
        this.level = 1;

        const whiteEl = document.querySelector("#white");
        whiteEl.style.display = "grid";

        if (pendingPrimaryBucketPosition) {
          whiteEl.style.left = pendingPrimaryBucketPosition.left + "px";
          whiteEl.style.top = pendingPrimaryBucketPosition.top + "px";
          sourcePositions.white = { ...pendingPrimaryBucketPosition };
        }

        whiteBucketPurchased = true;
        const emptyBucketEl = document.querySelector("#emptyPrimaryBucket");
        if (emptyBucketEl) emptyBucketEl.dataset.placed = "false";
        pendingPrimaryBucketPosition = null;
        refreshPrimaryBucketVisual();
      }
    },
    {
      id: "minion",
      name: "Hire a Minion",
      level: 0,
      baseCost: 40,
      growth: 1.8,
      visible: () => ordersUnlocked,
      desc: function () { return `A minion that walks between sources and gathers on its own. Minions: ${minionCount} (only while the game is open — no offline progress yet)`; },
      cost: function () { return Math.round(this.baseCost * Math.pow(this.growth, this.level)); },
      buy: function () { minionCount++; this.level++; spawnMinion(); }
    }
  ];

  // =========================================================
  // TOOL UPGRADES (level up things you already own)
  // =========================================================

  const toolUpgrades = [
    {
      id: "backpack",
      name: "Bigger Tubes",
      level: 0,
      baseCost: 20,
      growth: 1.6,
      maxLevel: 5,
      visible: () => TUBE_COUNT >= 2,
      desc: () => `Tube capacity: ${bagCapacityPerTube} → ${bagCapacityPerTube + 2}`,
      cost: function () { return Math.round(this.baseCost * Math.pow(this.growth, this.level)); },
      buy: function () { bagCapacityPerTube += 2; this.level++; }
    },

    {
      id: "fullTubeValue",
      name: "Premium Full Tubes",
      level: 0,
      maxLevel: 5,
      baseCost: 24,
      growth: 1.75,
      visible: () => TUBE_COUNT >= 2,
      desc: function () {
        return `Full Tube bonus: +${1 + tubeSellBonusLevel} → +${2 + tubeSellBonusLevel} coins`;
      },
      cost: function () { return Math.round(this.baseCost * Math.pow(this.growth, this.level)); },
      buy: function () {
        tubeSellBonusLevel++;
        this.level++;
      }
    },
    {
      id: "minionSpeed",
      name: "Faster Minions",
      level: 0,
      maxLevel: 5,
      baseCost: 30,
      growth: 1.7,
      visible: () => ordersUnlocked,
      requires: () => minionCount > 0,
      lockedNote: "Hire a minion in the Store tab first",
      desc: function () { return `Minions gather quicker. Speed level ${this.level} / ${this.maxLevel}`; },
      cost: function () { return Math.round(this.baseCost * Math.pow(this.growth, this.level)); },
      buy: function () { minionSpeedLevel++; this.level++; }
    },
    {
      id: "minionCarry",
      name: "Bigger Scoops",
      level: 0,
      maxLevel: 3,
      baseCost: 35,
      growth: 1.8,
      visible: () => ordersUnlocked,
      requires: () => minionCount > 0,
      lockedNote: "Hire a minion in the Store tab first",
      desc: function () { return `Minions collect more per visit. Currently ${1 + this.level} at a time.`; },
      cost: function () { return Math.round(this.baseCost * Math.pow(this.growth, this.level)); },
      buy: function () { minionCarryLevel++; this.level++; }
    },
    {
      id: "mixerVialCapacity",
      name: "Bigger Mixer Vials",
      level: 0,
      maxLevel: 5,
      baseCost: 25,
      growth: 1.7,
      visible: () => mixerUnlocked && VIAL_COUNT >= 1,
      desc: function () {
        return `Mixer Vial capacity: ${storageCapacityPerVial} → ${storageCapacityPerVial + 2}`;
      },
      cost: function () { return Math.round(this.baseCost * Math.pow(this.growth, this.level)); },
      buy: function () {
        storageCapacityPerVial += 2;
        this.level++;
      }
    },
    {
      id: "fullVialValue",
      name: "Premium Full Vials",
      level: 0,
      maxLevel: 5,
      baseCost: 30,
      growth: 1.8,
      visible: () => mixerUnlocked && VIAL_COUNT >= 1,
      desc: function () {
        return `Full Mixer Vial bonus: +${1 + vialSellBonusLevel} → +${2 + vialSellBonusLevel} coins`;
      },
      cost: function () { return Math.round(this.baseCost * Math.pow(this.growth, this.level)); },
      buy: function () {
        vialSellBonusLevel++;
        this.level++;
      }
    },

  ];

  function minionTravelMs() { return Math.max(3000, 8000 - minionSpeedLevel * 900); }
  function minionPauseMs() { return Math.max(1000, 2600 - minionSpeedLevel * 250); }
  function minionCarryAmount() { return 1 + minionCarryLevel; }

  // =========================================================
  // STORE LOGIC
  // =========================================================

  function isStoreItemActuallyAffordable(item) {
    if (item.visible && !item.visible()) return false;
    if (item.maxLevel && item.level >= item.maxLevel) return false;
    if (item.requires && !item.requires()) return false;

    const primaryPaintItem = item.id === "unlockYellow" || item.id === "unlockBlue";

    // Paint can only be bought if there is an empty bucket to hold it.
    if (primaryPaintItem && emptyPrimaryBucketCount() <= 0) return false;

    return coins >= item.cost();
  }

  function cheapestAffordableExists() {
    return storeItems.some(isStoreItemActuallyAffordable)
      || toolUpgrades.some(isStoreItemActuallyAffordable);
  }

  function buyFromList(list, id) {
    const item = list.find(i => i.id === id);
    if (!item) return;
    if (item.maxLevel && item.level >= item.maxLevel) return;

    if (item.customBuy) {
      item.customBuy();
      return;
    }

    const cost = item.cost();
    if (coins < cost) { say("Not enough coins"); return; }
    coins -= cost;
    item.buy();
    say(`${item.name} purchased!`);
    renderAll();
    checkJournalSteps();
  }

  function renderUpgradeCard(item, list) {
    const maxed = item.maxLevel && item.level >= item.maxLevel;
    const locked = item.requires && !item.requires();
    const soldOut = maxed && (item.id === "tubeSlot" || item.id === "buyPrimaryBucket");
    const primaryPaintItem = item.id === "unlockYellow" || item.id === "unlockBlue";
    const primaryPaintPreBucketLocked = primaryPaintItem && primaryBucketSlots === 0;

    const card = document.createElement("div");
    card.className = "upgradeCard";
    if (soldOut) card.classList.add("soldOut");

    const info = document.createElement("div");
    info.className = "upgradeInfo";
    info.innerHTML = `
      <div class="upgradeName">${item.name}${maxed ? " (Maxed)" : ""}</div>
      <div class="upgradeDesc">${locked ? item.lockedNote : (typeof item.desc === "function" ? item.desc() : item.desc)}</div>
    `;

    const buyBtn = document.createElement("button");
    buyBtn.className = "upgradeBuyBtn";
    buyBtn.textContent = soldOut ? "SOLD OUT" : maxed ? "✓" : `🪙 ${item.cost()}`;
    const affordableNow = isStoreItemActuallyAffordable(item);

    buyBtn.disabled = !affordableNow;
    if (primaryPaintPreBucketLocked) card.classList.add("storeItemLocked");
    if (affordableNow) {
      card.classList.add("affordable");
      buyBtn.classList.add("affordable");
    }
    buyBtn.addEventListener("click", () => buyFromList(list, item.id));

    card.appendChild(info);
    card.appendChild(buyBtn);
    return card;
  }

  function renderStore() {
    const list = document.querySelector("#upgradeList");
    list.innerHTML = "";

    const allItems = activeStoreTab === "store" ? storeItems : toolUpgrades;
    const items = allItems.filter(item => !item.visible || item.visible());

    if (items.length === 0) {
      const note = document.createElement("div");
      note.id = "emptyTabNote";
      note.textContent = activeStoreTab === "store"
        ? "Nothing new to buy yet — keep playing!"
        : "No tools owned yet — buy one in the Store tab to unlock its upgrades.";
      list.appendChild(note);
      return;
    }

    items.forEach(item => list.appendChild(renderUpgradeCard(item, allItems)));
  }

  function setStoreTab(tab) {
    activeStoreTab = tab;
    document.querySelector("#storeTabBtn").classList.toggle("active", tab === "store");
    document.querySelector("#upgradeTabBtn").classList.toggle("active", tab === "upgrades");
    renderStore();
  }

