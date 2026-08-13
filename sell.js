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
    const amount = tube.amount;
    const earned = tubeSellValue(tube);

    coins += earned;
    totalSold += amount;
    totalTubesSold++;
    if (amount >= bagCapacityPerTube) addStudioXp(3, "full tube");
    playSellSound();

    tube.color = null;
    tube.amount = 0;

    sellImpactAt(bagContents.children[index], `+${earned}`);
    pulseCoins(earned);
    renderAll();
    showSellHint(true);

    checkJournalSteps();

    if (navigator.vibrate) navigator.vibrate(24);
  }

  function sellOneFromVial(index) {
    const vial = vials[index];
    if (!vial || !vial.color || vial.amount <= 0) return;

    const chipEl = storageContents.children[index];
    const color = vial.color;
    const amount = vial.amount;
    const isFull = amount >= storageCapacityPerVial;
    const earned = mixerVialSellValue(color, amount, isFull) + studioEarningsBonus;

    vial.color = null;
    vial.amount = 0;
    coins += earned;
    totalSold += amount;
    if (isFull) addStudioXp(5, "full vial");
    playSellSound();

    sellImpactAt(chipEl, isFull ? `+${earned} FULL!` : `+${earned}`);
    pulseCoins(earned);
    renderAll();
    showSellHint(true);
    checkJournalSteps();
    if (navigator.vibrate) navigator.vibrate([18, 18, 28]);
  }

  document.querySelector("#sellBtn").addEventListener("click", () => {
    sellMode = !sellMode;

    if (sellMode && dropperArmed) {
      dropperArmed = false;
      dropperIngredients = [];
    }

    if (sellMode && dollyMode) {
      dollyMode = false;
    }

    const choices = document.querySelector("#sellAllChoices");

    if (sellMode) {
      choices?.classList.add("open");
      showSellHint(false);
    } else {
      choices?.classList.remove("open");
      clearTimeout(message._timer);
      message.classList.remove("show", "dimmed");
    }

    renderAll();
  });


  function sellAllTubesNow() {
    const base = tubesUsedTotal();
    if (base === 0) { say("No tube paint to sell"); return; }

    let earned = studioEarningsBonus;
    let tubesSoldNow = 0;
    tubes.forEach(t => {
      if (!t.color || t.amount <= 0) return;
      tubesSoldNow++;
      earned += tubeSellValue(t) - studioEarningsBonus;
    });
    const fullTubeXp = tubes.filter(t => t.color && t.amount >= bagCapacityPerTube).length * 3;
    totalSold += base;
    totalTubesSold += tubesSoldNow;
    coins += earned;
    if (fullTubeXp) addStudioXp(fullTubeXp, "full tubes");
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

    let earned = studioEarningsBonus;
    vials.forEach(v => {
      if (!v.color || v.amount <= 0) return;
      earned += mixerVialSellValue(v.color, v.amount, v.amount >= storageCapacityPerVial);
    });
    const fullVialXp = vials.filter(v => v.color && v.amount >= storageCapacityPerVial).length * 5;
    totalSold += base;
    coins += earned;
    if (fullVialXp) addStudioXp(fullVialXp, "full vials");
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

    let tubeValue = 0;
    let tubesSoldNow = 0;

    tubes.forEach(t => {
      if (!t.color || t.amount <= 0) return;
      tubesSoldNow++;
      tubeValue += tubeSellValue(t) - studioEarningsBonus;
    });

    let mixedValue = 0;
    vials.forEach(v => {
      if (!v.color || v.amount <= 0) return;
      mixedValue += mixerVialSellValue(v.color, v.amount, v.amount >= storageCapacityPerVial);
    });

    const earned = tubeValue + mixedValue + studioEarningsBonus;
    const fullTubeXp = tubes.filter(t => t.color && t.amount >= bagCapacityPerTube).length * 3;
    const fullVialXp = vials.filter(v => v.color && v.amount >= storageCapacityPerVial).length * 5;
    totalSold += raw + mixed;
    totalTubesSold += tubesSoldNow;
    coins += earned;
    if (fullTubeXp + fullVialXp) addStudioXp(fullTubeXp + fullVialXp, "full containers");
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

