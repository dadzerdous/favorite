// Studio XP and level progression.

  function studioXpNeeded(level = studioLevel) {
    return 25 + Math.max(0, level - 1) * 25;
  }

  function studioLevelReward(level) {
    return level * 5;
  }

  function addStudioXp(amount, reason = "") {
    amount = Math.max(0, Math.floor(amount || 0));
    if (!amount) return;

    studioXp += amount;

    let leveled = false;
    while (studioXp >= studioXpNeeded(studioLevel)) {
      studioXp -= studioXpNeeded(studioLevel);
      studioLevel++;
      leveled = true;

      const reward = studioLevelReward(studioLevel);
      coins += reward;
      pulseCoins(reward);

      showMajorNotice(
        "level",
        `Your studio reached Level ${studioLevel}. You earned ${reward} bonus coins.`,
        { title: `Studio Level ${studioLevel}!`, icon: "⭐" }
      );
    }

    renderStudioXp();

    if (!leveled && reason) {
      showXpFloater(`+${amount} XP`);
    }

    saveState();
  }

  function renderStudioXp() {
    const levelEl = document.querySelector("#studioLevel");
    const textEl = document.querySelector("#studioXpText");
    const fillEl = document.querySelector("#studioXpFill");

    if (!levelEl || !textEl || !fillEl) return;

    const needed = studioXpNeeded(studioLevel);
    const pct = needed > 0 ? Math.min(100, (studioXp / needed) * 100) : 0;

    levelEl.textContent = `⭐ Studio Lv ${studioLevel}`;
    textEl.textContent = `${studioXp} / ${needed} XP`;
    fillEl.style.width = `${pct}%`;
  }

  function showXpFloater(text) {
    const el = document.querySelector("#studioXpFloat");
    if (!el) return;

    el.textContent = text;
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
  }
