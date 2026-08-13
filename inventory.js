// Paint Case, Paint Vials, rendering, totals, and gathering.

  // =========================================================
  // BACKPACK / WAREHOUSE / MIXER RENDER
  // =========================================================

  function renderBackpack() {
    bagContents.innerHTML = "";
    tubes.forEach((tube, index) => {
      const chip = document.createElement("div");
      if (tube.color) {
        chip.className = "stashChip" + (dropperArmed ? " pickable" : "") + (sellMode ? " sellable" : "");
        const tubeValue = tubeSellValue(tube);
        chip.textContent = sellMode
          ? `${colorInfo[tube.color].emoji} ${tube.amount}/${bagCapacityPerTube} · 🪙${tubeValue}`
          : `${colorInfo[tube.color].emoji} ${tube.amount}/${bagCapacityPerTube}`;
        chip.addEventListener("click", () => {
          if (sellMode) sellOneFromTube(index);
        });
      } else {
        chip.className = "stashChip empty";
        chip.textContent = `🧴 0/${bagCapacityPerTube}`;
      }
      bagContents.appendChild(chip);
    });
  }

  function renderWarehouse() {
    storageContents.innerHTML = "";
    vials.forEach((vial, index) => {
      const chip = document.createElement("div");
      if (vial.color) {
        const isFull = vial.amount >= storageCapacityPerVial;
        chip.className = "stashChip"
          + (sellMode ? " sellable" : "")
          + (sellMode && isFull ? " fullVial" : "");
        const vialValue = mixerVialSellValue(vial.color, vial.amount, isFull) + studioEarningsBonus;
        chip.textContent = sellMode
          ? `${colorInfo[vial.color].emoji} ${colorInfo[vial.color].label} ${vial.amount}/${storageCapacityPerVial} · 🪙${vialValue}`
          : `${colorInfo[vial.color].emoji} ${colorInfo[vial.color].label} ${vial.amount}/${storageCapacityPerVial}`;
        if (sellMode) chip.addEventListener("click", () => sellOneFromVial(index));
      } else {
        chip.className = "stashChip empty";
        chip.textContent = "🧪 Empty Mixer Vial";
      }
      storageContents.appendChild(chip);
    });
  }

  function renderDropper() {
    dropperToggle.innerHTML = dropperArmed ? "❌<span>Done</span>" : "🎨<span>Mix</span>";
    dropperToggle.classList.toggle("armed", dropperArmed);

    document.querySelectorAll(".source[data-color]").forEach(source => {
      const active = dropperArmed && source.style.display !== "none";
      source.classList.toggle("mixReady", active);
    });
  }

  function renderAll() {
    bagText.textContent = `${tubes.filter(t => t.color !== null).length} / ${TUBE_COUNT}`;
    storageText.textContent = `${vialsUsedTotal()} / ${storageMaxTotal()}`;
    coinsEl.textContent = coins;
    renderStudioXp();

    if (currentOrder && Array.isArray(currentOrder.requirements)) {
      orderTarget.textContent = orderRequirementText(currentOrder);
      rewardEl.textContent = orderReward(currentOrder);
    } else {
      orderTarget.textContent = ordersUnlocked ? "Choose an Order" : "No Orders Yet";
      rewardEl.textContent = "—";
    }

    renderBackpack();
    renderWarehouse();
    renderDropper();
    renderQuest();
    refreshPrimaryBucketVisual();

    document.querySelectorAll(".source[data-color]").forEach(source => {
      if (source.style.display === "none") return;
      const small = source.querySelector("small");
      if (!small) return;
      small.textContent = sellMode ? `🪙${1 + studioEarningsBonus}` : (dollyMode ? "Move" : "Tap");
      source.classList.toggle("dollyReady", dollyMode);
      source.classList.toggle("dollyShake", dollyMode);
    });

        const sellVialsChoice = document.querySelector("#sellMixedBtnRail");
    if (sellVialsChoice) {
      sellVialsChoice.style.display = VIAL_COUNT > 0 ? "flex" : "none";
    }

const ordersBtnEl=document.querySelector("#fulfillBtn");if(ordersBtnEl)ordersBtnEl.classList.toggle("orderReady",ordersUnlocked&&anyOrderReady());
const mixerToolBtnEl = document.querySelector("#mixerToolBtn");
    if (mixerToolBtnEl) mixerToolBtnEl.style.display = mixerUnlocked ? "flex" : "none";
    if (dollyToolBtn) {
      dollyToolBtn.style.display = rearrangeUnlocked ? "flex" : "none";
      dollyToolBtn.classList.toggle("armed", dollyMode);
      dollyToolBtn.innerHTML = dollyMode ? "❌<span>Dolly</span>" : "🛒<span>Dolly</span>";
    }

    const warehouseRowEl = document.querySelector("#warehouseRow");
    if (warehouseRowEl) warehouseRowEl.style.display = mixerUnlocked ? "block" : "none";

    const storeBtnElForHighlight = document.querySelector("#storeBtn");
    if (storeBtnElForHighlight) {
      storeBtnElForHighlight.classList.toggle("canAfford", cheapestAffordableExists());
    }

    const storeBtnEl = document.querySelector("#storeBtn");
    const mixerBtnEl = document.querySelector("#mixerToolBtn");
    const fulfillBtnEl = document.querySelector("#fulfillBtn");
    if (storeBtnEl) storeBtnEl.style.display = currentProcessIndex >= 1 ? "flex" : "none";
    if (mixerBtnEl) mixerBtnEl.style.display = mixerUnlocked ? "flex" : "none";
    if (fulfillBtnEl) fulfillBtnEl.style.display = ordersUnlocked ? "flex" : "none";

    const sellBtnEl = document.querySelector("#sellBtn");
    if (sellBtnEl) {
      sellBtnEl.innerHTML = sellMode ? "❌<span>Done</span>" : "🪙<span>Sell</span>";
      sellBtnEl.classList.toggle("armed", sellMode);
    }

    if (document.querySelector("#storeOverlay").classList.contains("open")) {
      renderStore();
    }

    saveState();
  }

  // =========================================================
  // FLOATING +1
  // =========================================================

  function spawnFloater(source, text) {
    const rect = source.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    const floater = document.createElement("div");
    floater.className = "floater";
    floater.textContent = text;
    floater.style.left = `${rect.left - fieldRect.left + rect.width / 2 - 10}px`;
    floater.style.top = `${rect.top - fieldRect.top}px`;
    field.appendChild(floater);
    setTimeout(() => floater.remove(), 500);
  }

  // =========================================================
  // GATHERING
  // =========================================================

  function tapSource(source, fromMinion) {
    const color = source.dataset.color;

    // Manual taps always leave a small paint mark on the canvas,
    // even when there isn't room to collect more paint.
    if (!fromMinion) {
      // Splat and sound are feedback for touching the paint bucket itself,
      // so both happen even when the tube is full.
      createCanvasTapSplat(source, color);
      playSplatSound();
    }

    const placed = addToSlots(tubes, color, 1, bagCapacityPerTube);
    if (!placed) {
      if (!fromMinion) say("🧪 No tube space left!");
      return;
    }

    totalGathered++;
    if (!fromMinion) addStudioXp(1, "gather");

    source.classList.remove("pop");
    void source.offsetWidth;
    source.classList.add("pop");

    spawnFloater(source, `+1 ${colorInfo[color].emoji}`);
    renderAll();
    checkJournalSteps();

    if (!fromMinion) {
      
      if (navigator.vibrate) navigator.vibrate(12);
    }
  }

