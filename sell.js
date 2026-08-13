// Selective selling and Sell All behavior.

  // =========================================================
  // SELL — selective selling, with Sell All as a convenience
  // =========================================================

  function pulseCoins(amount) {
    const coinPanel = coinsEl.closest(".panel") || coinsEl;
    coinPanel.classList.remove("coinImpact");
    void coinPanel.offsetWidth;
    coinPanel.classList.add("coinImpact");

    const rect = coinPanel.getBoundingClientRect();
    const pop = document.createElement("div");
    pop.className = "coinGainFloater";
    pop.textContent = `+${amount} 🪙`;
    pop.style.left = `${rect.left + rect.width / 2}px`;
    pop.style.top = `${rect.bottom + 4}px`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 900);
  }

  function sellImpactAt(element, label) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    element.classList.remove("sellImpact");
    void element.offsetWidth;
    element.classList.add("sellImpact");

    for (let i = 0; i < 5; i++) {
      const coin = document.createElement("div");
      coin.className = "sellCoinBurst";
      coin.textContent = i % 2 ? "✨" : "🪙";
      coin.style.left = `${rect.left + rect.width / 2}px`;
      coin.style.top = `${rect.top + rect.height / 2}px`;
      coin.style.setProperty("--dx", `${randomBetween(-42, 42)}px`);
      coin.style.setProperty("--dy", `${randomBetween(-55, -18)}px`);
      document.body.appendChild(coin);
      setTimeout(() => coin.remove(), 650);
    }

    if (label) {
      const text = document.createElement("div");
      text.className = "sellLabelBurst";
      text.textContent = label;
      text.style.left = `${rect.left + rect.width / 2}px`;
      text.style.top = `${rect.top}px`;
      document.body.appendChild(text);
      setTimeout(() => text.remove(), 750);
    }
  }

  function sellOneFromTube(index) {
    const tube = tubes[index];
    if (!tube || !tube.color || tube.amount <= 0) return;

    const color = tube.color;
    const earned = tube.amount + studioEarningsBonus;

    coins += earned;
    totalSold += tube.amount;
    playSellSound();

    tube.color = null;
    tube.amount = 0;

    sellImpactAt(bagContents.children[index], `+${earned}`);
    pulseCoins(earned);
    renderAll();
    showSellHint(true);

    checkQuests();

    if (navigator.vibrate) navigator.vibrate(24);
  }

  function sellOneFromVial(index) {
    const vial = vials[index];
    if (!vial || !vial.color || vial.amount <= 0) return;

    const chipEl = storageContents.children[index];
    const color = vial.color;
    const amount = vial.amount;
    const fullBonus = amount >= storageCapacityPerVial ? 1 : 0;
    const earned = amount + fullBonus;

    vial.color = null;
    vial.amount = 0;
    coins += earned;
    totalSold += amount;
    playSellSound();

    sellImpactAt(chipEl, fullBonus ? `+${earned} FULL!` : `+${earned}`);
    pulseCoins(earned);
    renderAll();
    showSellHint(true);
    checkQuests();
    if (navigator.vibrate) navigator.vibrate([18, 18, 28]);
  }

  function openSellAllPicker() {
  }

  document.querySelector("#sellBtn").addEventListener("click", () => {
    sellMode = !sellMode;
    if (sellMode && dropperArmed) {
      dropperIngredients.forEach(ingredient => {
        if (ingredient.source === "tube") addToSlots(tubes, ingredient.color, 1, bagCapacityPerTube);
      });
      dropperArmed = false;
      dropperIngredients = [];
    }

    if (sellMode) {
      showSellHint(false);
    } else {
      clearTimeout(message._timer);
      message.classList.remove("show", "dimmed");
      document.querySelector("#sellAllChoices")?.classList.remove("open");
    }

    renderAll();
  });

  document.querySelector("#sellAllBtn").addEventListener("click", openSellAllPicker);


  function sellAllTubesNow() {
    const earned = tubesUsedTotal() + studioEarningsBonus;
    if (tubesUsedTotal() === 0) { say("No tube paint to sell"); return; }

    totalSold += tubesUsedTotal();
    coins += earned;
    playSellSound();
    initTubes();

    pulseCoins(earned);
    renderAll();
    showSellHint(true);
    checkJournalSteps();
    if (navigator.vibrate) navigator.vibrate(24);
  }

  function sellAllVialsNow() {
    const base = vialsUsedTotal();
    if (base === 0) { say("No vial paint to sell"); return; }

    let fullBonus = 0;
    vials.forEach(v => {
      if (v.color && v.amount >= storageCapacityPerVial) fullBonus += 1;
    });

    const earned = base + fullBonus + studioEarningsBonus;
    totalSold += base;
    coins += earned;
    playSellSound();
    initVials();

    pulseCoins(earned);
    renderAll();
    showSellHint(true);
    checkJournalSteps();
    if (navigator.vibrate) navigator.vibrate(24);
  }

  function sellEverythingNow() {
    const raw = tubesUsedTotal();
    const mixed = vialsUsedTotal();

    if (raw + mixed === 0) { say("Nothing to sell"); return; }

    let fullBonus = 0;
    vials.forEach(v => {
      if (v.color && v.amount >= storageCapacityPerVial) fullBonus += 1;
    });

    const earned = raw + mixed + fullBonus + studioEarningsBonus;
    totalSold += raw + mixed;
    coins += earned;
    playSellSound();

    initTubes();
    initVials();

    pulseCoins(earned);
    renderAll();
    showSellHint(true);
    checkJournalSteps();
    if (navigator.vibrate) navigator.vibrate(28);
  }

  document.querySelector("#sellRawBtnRail").addEventListener("click", sellAllTubesNow);
  document.querySelector("#sellMixedBtnRail").addEventListener("click", sellAllVialsNow);
  document.querySelector("#sellEverythingBtnRail").addEventListener("click", sellEverythingNow);

