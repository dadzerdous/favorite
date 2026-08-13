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
        const tubeFullBonus = tube.amount >= bagCapacityPerTube ? (1 + tubeSellBonusLevel) : 0;
        const tubeValue = tube.amount + tubeFullBonus + studioEarningsBonus;
        chip.textContent = sellMode
          ? `${colorInfo[tube.color].emoji} ${tube.amount}/${bagCapacityPerTube} · 🪙${tubeValue}`
          : `${colorInfo[tube.color].emoji} ${tube.amount}/${bagCapacityPerTube}`;
        chip.addEventListener("click", event => {
          if (sellMode) sellOneFromTube(index);
          else feedDropperFromTube(index, event);
        });
      } else {
        chip.className = "stashChip empty";
        chip.textContent = "🧴 Empty Tube";
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
        const vialFullBonus = isFull ? (1 + vialSellBonusLevel) : 0;
        const vialValue = vial.amount + vialFullBonus + studioEarningsBonus;
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
    dropperToggle.innerHTML = dropperArmed ? "❌<span>Done</span>" : "💧<span>Mix</span>";
    dropperToggle.classList.toggle("armed", dropperArmed);
    dropperFloaterEl.classList.toggle("visible", dropperArmed);

    dropperChips.innerHTML = "";
    dropperIngredients.forEach(ingredient => {
      const chip = document.createElement("span");
      chip.className = "mixChip";
      chip.textContent = colorInfo[ingredient.color].emoji;
      dropperChips.appendChild(chip);
    });
  }

  function positionDropperFloaterAtPoint(x, y) {
    dropperFloaterEl.style.left = x + "px";
    dropperFloaterEl.style.top = y + "px";
  }

  function positionDropperFloaterAtElement(el) {
    const rect = el.getBoundingClientRect();
    positionDropperFloaterAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  document.addEventListener("pointermove", event => {
    if (dropperArmed) positionDropperFloaterAtPoint(event.clientX, event.clientY);
  });

  function renderAll() {
    bagText.textContent = `${tubes.filter(t => t.color !== null).length} / ${TUBE_COUNT}`;
    storageText.textContent = `${vialsUsedTotal()} / ${storageMaxTotal()}`;
    coinsEl.textContent = coins;

    const orderInfo = colorInfo[currentOrder.color];
    orderTarget.textContent = `${orderInfo.emoji} ${orderInfo.label} ×1`;
    rewardEl.textContent = currentOrder.reward;

    renderBackpack();
    renderWarehouse();
    renderDropper();
    renderQuest();
    refreshPrimaryBucketVisual();

    document.querySelectorAll(".source[data-color]").forEach(source => {
      if (source.style.display === "none") return;
      const small = source.querySelector("small");
      if (!small) return;
      small.textContent = sellMode ? `🪙${1 + studioEarningsBonus}` : "Tap";
    });

    const mixerToolBtnEl = document.querySelector("#mixerToolBtn");
    if (mixerToolBtnEl) mixerToolBtnEl.style.display = mixerUnlocked ? "flex" : "none";

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
    const sellAllBtnEl = document.querySelector("#sellAllBtn");
    if (sellBtnEl) {
      sellBtnEl.innerHTML = sellMode ? "❌<span>Done</span>" : "🪙<span>Sell</span>";
      sellBtnEl.classList.toggle("armed", sellMode);
    }
    if (sellAllBtnEl) sellAllBtnEl.style.display = sellMode ? "flex" : "none";

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

    source.classList.remove("pop");
    void source.offsetWidth;
    source.classList.add("pop");

    spawnFloater(source, `+1 ${colorInfo[color].emoji}`);
    if (!fromMinion) createCanvasTapSplat(source, color);
    renderAll();
    checkQuests();

    if (!fromMinion) {
      
      if (navigator.vibrate) navigator.vibrate(12);
    }
  }

