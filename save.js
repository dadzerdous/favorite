// Save/load/reset plus iOS rapid-tap protection.

  // =========================================================
  // SAVE / LOAD / RESET
  // =========================================================

  const SAVE_KEY = "colorGatherSave_v1";

  function saveState() {
    try {
      const data = {
        coins, tubes, vials, bagCapacityPerTube, storageCapacityPerVial,
        primaryBucketSlots, primaryBucketColors, firstPrimaryChoice, pendingPrimaryBucketPosition, yellowUnlocked, mixerUnlocked, blueUnlocked, ordersUnlocked, rearrangeUnlocked,
        whiteUnlocked, minionCount, minionSpeedLevel, minionCarryLevel,
        totalGathered, totalSold, totalMixed, totalFulfilled, studioEarningsBonus,
        currentProcessIndex, followedStepId, completedJournalSteps,
        colorGuideUnlocked, activeJournalTab, discoveredColors,
        currentOrder, sourcePositions,
        storeItemLevels: storeItems.map(i => ({ id: i.id, level: i.level })),
        toolUpgradeLevels: toolUpgrades.map(i => ({ id: i.id, level: i.level }))
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      // storage unavailable (private mode, quota, etc) — fail silently
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      coins = data.coins ?? coins;
      if (Array.isArray(data.tubes) && data.tubes.length > 0) {
        tubes = data.tubes;
        TUBE_COUNT = tubes.length;
      }
      bagCapacityPerTube = data.bagCapacityPerTube ?? bagCapacityPerTube;
      if (Array.isArray(data.vials) && data.vials.length > 0) {
        vials = data.vials;
        VIAL_COUNT = vials.length;
      }
      storageCapacityPerVial = data.storageCapacityPerVial ?? storageCapacityPerVial;
      primaryBucketSlots = data.primaryBucketSlots ?? primaryBucketSlots;
      primaryBucketColors = Array.isArray(data.primaryBucketColors) ? data.primaryBucketColors : primaryBucketColors;
      firstPrimaryChoice = data.firstPrimaryChoice ?? firstPrimaryChoice;
      pendingPrimaryBucketPosition = data.pendingPrimaryBucketPosition ?? pendingPrimaryBucketPosition;
      yellowUnlocked = data.yellowUnlocked ?? yellowUnlocked;
      mixerUnlocked = data.mixerUnlocked ?? mixerUnlocked;
      blueUnlocked = data.blueUnlocked ?? blueUnlocked;
      ordersUnlocked = data.ordersUnlocked ?? ordersUnlocked;
      rearrangeUnlocked = data.rearrangeUnlocked ?? rearrangeUnlocked;
      if (yellowUnlocked) {
        document.querySelector("#yellow").style.display = "grid";
      }
      if (blueUnlocked) document.querySelector("#blue").style.display = "grid";
      if (mixerUnlocked) document.querySelector("#warehouseRow").style.display = "block";
      if (ordersUnlocked) {
        document.querySelector("#order").style.display = "block";
        document.querySelector("#fulfillBtn").style.display = "block";
      }
      whiteUnlocked = data.whiteUnlocked ?? whiteUnlocked;
      minionCount = data.minionCount ?? minionCount;
      minionSpeedLevel = data.minionSpeedLevel ?? minionSpeedLevel;
      minionCarryLevel = data.minionCarryLevel ?? minionCarryLevel;
      totalGathered = data.totalGathered ?? totalGathered;
      totalSold = data.totalSold ?? totalSold;
      totalMixed = data.totalMixed ?? totalMixed;
      totalFulfilled = data.totalFulfilled ?? totalFulfilled;
      studioEarningsBonus = data.studioEarningsBonus ?? studioEarningsBonus;
      if (typeof data.currentProcessIndex === "number") currentProcessIndex = data.currentProcessIndex;
      followedStepId = data.followedStepId ?? followedStepId;

      if (data.completedJournalSteps && typeof data.completedJournalSteps === "object") {
        completedJournalSteps = data.completedJournalSteps;
      } else if (typeof data.questIndex === "number") {
        const oldOrder = [
          "gatherRed", "sellRed", "buyYellow", "buyMixer", "firstMix",
          "buyVial2", "buyBlue", "buyOrders", "fulfill3", "collect20"
        ];
        oldOrder.slice(0, data.questIndex).forEach(id => completedJournalSteps[id] = true);
      }

      colorGuideUnlocked = data.colorGuideUnlocked ?? (totalMixed > 0);
      activeJournalTab = data.activeJournalTab ?? activeJournalTab;

      if (data.discoveredColors && typeof data.discoveredColors === "object") {
        Object.assign(discoveredColors, data.discoveredColors);
      } else if (totalMixed > 0) {
        discoveredColors.orange = true;
      }

      currentProcessIndex = 0;
      while (
        currentProcessIndex < processes.length - 1 &&
        isProcessComplete(processes[currentProcessIndex])
      ) {
        currentProcessIndex++;
      }
      ensureFollowedStep();

      if (data.currentOrder) currentOrder = data.currentOrder;
      if (data.sourcePositions) Object.assign(sourcePositions, data.sourcePositions);

      (data.storeItemLevels || []).forEach(saved => {
        const item = storeItems.find(i => i.id === saved.id);
        if (item) item.level = saved.level;
      });

      (data.toolUpgradeLevels || []).forEach(saved => {
        const item = toolUpgrades.find(i => i.id === saved.id);
        if (item) item.level = saved.level;
      });

      if (whiteUnlocked) document.querySelector("#white").style.display = "grid";
    } catch (e) {
      // corrupt save — ignore and start fresh
    }
  }

  const resetConfirmOverlay = document.querySelector("#resetConfirmOverlay");

  document.querySelector("#journalResetBtn").addEventListener("click", () => {
    resetConfirmOverlay.classList.add("open");
  });

  document.querySelector("#resetNoBtn").addEventListener("click", () => {
    resetConfirmOverlay.classList.remove("open");
  });

  document.querySelector("#resetYesBtn").addEventListener("click", () => {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    window.location.reload();
  });

  // =========================================================
  // IOS RAPID-TAP PROTECTION
  // =========================================================

  let lastTouchEnd = 0;
  document.addEventListener("touchend", event => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) event.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

