// Journal processes, step tracking, Color Guide, and process rewards.

  // =========================================================
  // JOURNAL / PROCESSES
  // =========================================================

  let currentProcessIndex = 0;
  let followedStepId = "gatherRed";
  let completedJournalSteps = {};
  let completedProcessRewards = {};
  let colorGuideUnlocked = false;
  let activeJournalTab = "processes";
  const discoveredColors = {};

  const processes = [
    {
      id: "firstPaint",
      title: "Process 1 — My First Paint",
      description: "Learn the basics of gathering and selling paint.",
      completionText: "Store unlocked!",
      steps: [
        { id: "gatherRed", desc: "Gather 4 Red paint", target: 4, progress: () => Math.min(totalGathered, 4) },
        { id: "sellRed", desc: "Sell 4 paint", target: 4, progress: () => Math.min(totalSold, 4) }
      ]
    },
    {
      id: "yellowBucket",
      title: "Process 2 — Add a Primary",
      description: "Expand storage, add an empty primary bucket, then choose a new paint color.",
      completionText: "Primary production expanded!",
      steps: [
        { id: "buyTube", desc: "Buy a new tube", target: 1, progress: () => TUBE_COUNT >= 2 ? 1 : 0 },
        { id: "buyPrimaryBucket", desc: "Buy a Primary Bucket", target: 1, progress: () => primaryBucketSlots >= 1 ? 1 : 0 },
        { id: "buyNewColor", desc: "Buy a new primary color", target: 1, progress: () => (yellowUnlocked || blueUnlocked) ? 1 : 0 }
      ]
    },
    {
      id: "experiment",
      title: "Process 3 — Experiment",
      description: "Set up the tools you need to begin mixing paint.",
      completionText: "Mixing production established!",
      steps: [
        { id: "buyMixer", desc: "Buy the Mixer", target: 1, progress: () => mixerUnlocked ? 1 : 0 },
        { id: "firstMix", desc: "Create your first mixed color", target: 1, progress: () => Math.min(totalMixed, 1) }
      ]
    },
    {
      id: "primaries",
      title: "Process 4 — Complete the Primaries",
      description: "Bring the third primary into the studio and begin working with customers.",
      completionText: "Orders unlocked!",
      steps: [
        { id: "buyPrimaryBucket2", desc: "Buy another Primary Bucket", target: 1, progress: () => primaryBucketSlots >= 2 ? 1 : 0 },
        { id: "buyRemainingPrimary", desc: "Buy the remaining primary color", target: 1, progress: () => (yellowUnlocked && blueUnlocked) ? 1 : 0 },
        { id: "buyOrders", desc: "Open Orders", target: 1, progress: () => ordersUnlocked ? 1 : 0 }
      ]
    },
    {
      id: "workingArtist",
      title: "Process 5 — Working Artist",
      description: "Put the studio to work.",
      completionText: "Studio earnings boosted!",
      steps: [
        { id: "fulfill3", desc: "Fulfill 3 orders", target: 3, progress: () => Math.min(totalFulfilled, 3) },
        { id: "collect20", desc: "Gather 20 paint total", target: 20, progress: () => Math.min(totalGathered, 20) }
      ]
    }
  ];

  function getCurrentProcess() {
    return processes[Math.min(currentProcessIndex, processes.length - 1)];
  }

  function findStepById(stepId) {
    for (const process of processes) {
      const step = process.steps.find(s => s.id === stepId);
      if (step) return { process, step };
    }
    return null;
  }

  function isStepComplete(step) {
    return !!completedJournalSteps[step.id];
  }

  function isProcessComplete(process) {
    return process.steps.every(isStepComplete);
  }

  function firstIncompleteStep(process) {
    return process.steps.find(step => !isStepComplete(step)) || process.steps[0];
  }

  function ensureFollowedStep() {
    const current = getCurrentProcess();
    const found = findStepById(followedStepId);

    if (!found || found.process.id !== current.id || isStepComplete(found.step)) {
      const next = firstIncompleteStep(current);
      followedStepId = next ? next.id : current.steps[0].id;
    }
  }

  function awardProcessCompletion(process) {
    if (!process || completedProcessRewards[process.id]) return;
    completedProcessRewards[process.id] = true;

    // Process rewards are progression rewards, not little coin payouts.
    if (process.id === "firstPaint") {
      // Completing Process 1 unlocks the Store.
      say("🎉 Process complete — Store unlocked!");
    } else if (process.id === "yellowBucket") {
      // Process reward is progression, not an automatic capacity increase.
      say("🎉 Process complete — Experimenting unlocked!");
    } else if (process.id === "experiment") {
      say("🎉 Process complete — Color Guide expanded!");
    } else if (process.id === "primaries") {
      say("🎉 Process complete — Customer work established!");
    } else if (process.id === "workingArtist") {
      // Simple earnings milestone for now: future order payouts get boosted.
      studioEarningsBonus += 1;
      say("🎉 Process complete — Studio earnings +1!");
    }

    saveState();
  }

  function advanceCompletedProcesses() {
    while (
      currentProcessIndex < processes.length - 1 &&
      isProcessComplete(processes[currentProcessIndex])
    ) {
      const completed = processes[currentProcessIndex];
      awardProcessCompletion(completed);
      currentProcessIndex++;
      followedStepId = firstIncompleteStep(getCurrentProcess()).id;
    }

    if (
      currentProcessIndex === processes.length - 1 &&
      isProcessComplete(processes[currentProcessIndex])
    ) {
      awardProcessCompletion(processes[currentProcessIndex]);
    }
  }

  function checkJournalSteps() {
    let changed = false;
    const current = getCurrentProcess();

    current.steps.forEach(step => {
      if (!isStepComplete(step) && step.progress() >= step.target) {
        completedJournalSteps[step.id] = true;
        changed = true;
        say("✅ Step complete!");
      }
    });

    advanceCompletedProcesses();
    ensureFollowedStep();

    if (changed) {
      renderAll();
    } else {
      renderJournalTeaser();
      if (document.querySelector("#journalOverlay")?.classList.contains("open")) {
        renderJournal();
      }
    }
  }

  function checkQuests() {
    checkJournalSteps();
  }

  function renderQuest() {
    renderJournalTeaser();
  }

  function renderJournalTeaser() {
    const questText = document.querySelector("#questText");
    const questProgress = document.querySelector("#questProgress");
    const current = getCurrentProcess();

    if (currentProcessIndex === processes.length - 1 && isProcessComplete(current)) {
      questText.textContent = "📖 Starter Processes complete!";
      questProgress.textContent = "Open Journal";
      return;
    }

    ensureFollowedStep();
    const found = findStepById(followedStepId);
    const step = found ? found.step : firstIncompleteStep(current);
    const progress = Math.min(step.progress(), step.target);

    questText.textContent = `📖 ${current.title}: ${step.desc}`;
    questProgress.textContent = `${progress} / ${step.target}`;
  }

  function selectJournalStep(stepId) {
    const found = findStepById(stepId);
    if (!found || found.process.id !== getCurrentProcess().id || isStepComplete(found.step)) return;

    followedStepId = stepId;
    renderJournalTeaser();
    renderJournal();
    saveState();
  }

  function isColorDiscovered(color) {
    if (color === "red") return true;
    if (color === "yellow") return yellowUnlocked;
    if (color === "blue") return blueUnlocked;
    if (color === "white") return whiteUnlocked;
    return !!discoveredColors[color];
  }

  function recordColorDiscovery(color) {
    if (isColorDiscovered(color)) return false;

    discoveredColors[color] = true;

    if (!colorGuideUnlocked) {
      colorGuideUnlocked = true;
      activeJournalTab = "guide";
      setTimeout(() => say("📖 Color Guide added to your Journal!"), 450);
    }

    saveState();
    return true;
  }

  function recipeTextForColor(color) {
    const recipe = baseRecipes.concat(whiteRecipes).find(r => r.result === color);
    if (!recipe) return "Primary paint";
    return `${colorInfo[recipe.a].emoji} + ${colorInfo[recipe.b].emoji}`;
  }

  function renderJournalProcesses() {
    const list = document.querySelector("#journalProcessList");
    list.innerHTML = "";

    processes.forEach((process, index) => {
      const card = document.createElement("div");
      card.className = "journalProcessCard";

      if (index < currentProcessIndex || isProcessComplete(process)) card.classList.add("complete");
      if (index > currentProcessIndex) card.classList.add("future");

      const title = document.createElement("div");
      title.className = "journalProcessTitle";
      title.textContent = `${index < currentProcessIndex || isProcessComplete(process) ? "✓ " : ""}${process.title}`;
      card.appendChild(title);

      const desc = document.createElement("div");
      desc.className = "journalProcessDesc";
      desc.textContent = process.description;
      card.appendChild(desc);

      if (index === currentProcessIndex) {
        process.steps.forEach(step => {
          const row = document.createElement("button");
          row.className = "journalStepBtn";

          const complete = isStepComplete(step);
          const following = followedStepId === step.id && !complete;

          if (complete) row.classList.add("complete");
          if (following) row.classList.add("following");

          const progress = Math.min(step.progress(), step.target);

          row.innerHTML = `
            <span class="journalStepMain">
              <span class="journalStepMark">${complete ? "✓" : following ? "▶" : "○"}</span>
              <span>${step.desc}</span>
            </span>
            <span class="journalStepProgress">${progress}/${step.target}</span>
          `;

          row.disabled = complete;
          row.addEventListener("click", () => selectJournalStep(step.id));
          card.appendChild(row);
        });

        const hint = document.createElement("div");
        hint.className = "journalFollowHint";
        hint.textContent = "Tap an unfinished step to follow it on the main screen.";
        card.appendChild(hint);
      }

      list.appendChild(card);
    });
  }

  function renderColorGuide() {
    const panel = document.querySelector("#colorGuidePanel");
    panel.innerHTML = "";

    const groups = [
      { title: "Primary", colors: ["red", "yellow", "blue"] },
      { title: "Secondary", colors: ["orange", "purple", "green"] },
      { title: "Light Mixes", colors: ["pink", "skyblue", "cream"] }
    ];

    groups.forEach(group => {
      const heading = document.createElement("div");
      heading.className = "guideGroupTitle";
      heading.textContent = group.title;
      panel.appendChild(heading);

      const grid = document.createElement("div");
      grid.className = "guideGrid";

      group.colors.forEach(color => {
        const discovered = isColorDiscovered(color);
        const card = document.createElement("div");
        card.className = "guideColorCard" + (discovered ? "" : " locked");

        if (discovered) {
          card.innerHTML = `
            <div class="guideColorEmoji">${colorInfo[color].emoji}</div>
            <div class="guideColorName">${colorInfo[color].label}</div>
            <div class="guideRecipe">${recipeTextForColor(color)}</div>
          `;
        } else {
          card.innerHTML = `
            <div class="guideColorEmoji">❔</div>
            <div class="guideColorName">???</div>
            <div class="guideRecipe">Undiscovered</div>
          `;
        }

        grid.appendChild(card);
      });

      panel.appendChild(grid);
    });
  }

  function setJournalTab(tab) {
    if (tab === "guide" && !colorGuideUnlocked) return;

    activeJournalTab = tab;

    document.querySelector("#journalProcessesTab").classList.toggle("active", tab === "processes");
    document.querySelector("#journalGuideTab").classList.toggle("active", tab === "guide");

    document.querySelector("#journalProcessList").style.display = tab === "processes" ? "block" : "none";
    document.querySelector("#colorGuidePanel").style.display = tab === "guide" ? "block" : "none";

    if (tab === "guide") renderColorGuide();
  }

  function renderJournal() {
    const guideTab = document.querySelector("#journalGuideTab");
    guideTab.style.display = colorGuideUnlocked ? "block" : "none";

    renderJournalProcesses();

    if (!colorGuideUnlocked && activeJournalTab === "guide") {
      activeJournalTab = "processes";
    }

    setJournalTab(activeJournalTab);
  }

  function emptyPrimaryBucketCount() {
    return Math.max(0, primaryBucketSlots - primaryBucketColors.length);
  }

  function primaryColorOwned(color) {
    return color === "yellow" ? yellowUnlocked : color === "blue" ? blueUnlocked : false;
  }

  function primaryColorPrice(color) {
    // First extra primary is cheap. The unchosen primary gets more expensive.
    if (!firstPrimaryChoice) return 5;
    if (firstPrimaryChoice === color) return 5;
    return 12;
  }

  function canPurchasePrimaryColor(color) {
    if (primaryColorOwned(color)) return false;
    return emptyPrimaryBucketCount() > 0;
  }

  function purchasePrimaryColor(color) {
    if (primaryColorOwned(color)) {
      say(`${colorInfo[color].label} is already in a bucket`);
      return false;
    }

    if (emptyPrimaryBucketCount() <= 0) {
      say(`🚫 No empty bucket for ${colorInfo[color].label}!`);
      return false;
    }

    const price = primaryColorPrice(color);
    if (coins < price) {
      say("Not enough coins");
      return false;
    }

    coins -= price;
    primaryBucketColors.push(color);

    if (!firstPrimaryChoice) firstPrimaryChoice = color;

    if (color === "yellow") {
      yellowUnlocked = true;
      const el = document.querySelector("#yellow");
      el.style.display = "grid";
      if (pendingPrimaryBucketPosition) {
        el.style.left = pendingPrimaryBucketPosition.left + "px";
        el.style.top = pendingPrimaryBucketPosition.top + "px";
        sourcePositions.yellow = { ...pendingPrimaryBucketPosition };
      }
    } else if (color === "blue") {
      blueUnlocked = true;
      const el = document.querySelector("#blue");
      el.style.display = "grid";
      if (pendingPrimaryBucketPosition) {
        el.style.left = pendingPrimaryBucketPosition.left + "px";
        el.style.top = pendingPrimaryBucketPosition.top + "px";
        sourcePositions.blue = { ...pendingPrimaryBucketPosition };
      }
    }

    const emptyBucketEl = document.querySelector("#emptyPrimaryBucket");
    if (emptyBucketEl) emptyBucketEl.dataset.placed = "false";
    pendingPrimaryBucketPosition = null;
    refreshPrimaryBucketVisual();
    say(`${colorInfo[color].emoji} ${colorInfo[color].label} added to your new bucket!`);
    renderAll();
    checkJournalSteps();
    saveState();
    return true;
  }

  function refreshPrimaryBucketVisual() {
    const emptyBucket = document.querySelector("#emptyPrimaryBucket");
    if (!emptyBucket) return;

    const hasEmpty = emptyPrimaryBucketCount() > 0;
    emptyBucket.style.display = hasEmpty ? "grid" : "none";

    if (!hasEmpty) return;

    // Keep its current position once placed so it doesn't jump around on every render.
    if (emptyBucket.dataset.placed === "true") return;

    const fieldRect = field.getBoundingClientRect();
    const bucketW = emptyBucket.offsetWidth || 78;
    const bucketH = emptyBucket.offsetHeight || 78;
    const padding = 10;

    const occupied = Array.from(document.querySelectorAll(".source[data-color]"))
      .filter(el => el.style.display !== "none")
      .map(el => {
        const r = el.getBoundingClientRect();
        return {
          left: r.left - fieldRect.left - padding,
          top: r.top - fieldRect.top - padding,
          right: r.right - fieldRect.left + padding,
          bottom: r.bottom - fieldRect.top + padding
        };
      });

    function overlapsAny(left, top) {
      const rect = {
        left,
        top,
        right: left + bucketW,
        bottom: top + bucketH
      };

      return occupied.some(o =>
        rect.left < o.right &&
        rect.right > o.left &&
        rect.top < o.bottom &&
        rect.bottom > o.top
      );
    }

    const maxLeft = Math.max(0, fieldRect.width - bucketW);
    const maxTop = Math.max(0, fieldRect.height - bucketH);

    let chosen = null;

    // Try a bunch of random positions until we find a clear one.
    for (let i = 0; i < 40; i++) {
      const left = Math.round(Math.random() * maxLeft);
      const top = Math.round(Math.random() * maxTop);

      if (!overlapsAny(left, top)) {
        chosen = { left, top };
        break;
      }
    }

    // Fallback: use a safe-ish corner if the field is crowded.
    if (!chosen) {
      const candidates = [
        { left: maxLeft, top: 0 },
        { left: 0, top: maxTop },
        { left: maxLeft, top: maxTop },
        { left: Math.round(maxLeft / 2), top: maxTop }
      ];

      chosen = candidates.find(p => !overlapsAny(p.left, p.top)) || { left: 0, top: 0 };
    }

    emptyBucket.style.left = chosen.left + "px";
    emptyBucket.style.top = chosen.top + "px";
    emptyBucket.dataset.placed = "true";
    pendingPrimaryBucketPosition = { left: chosen.left, top: chosen.top };
  }

