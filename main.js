// Initialization sequence and splash-screen startup.

  // =========================================================
  // START
  // =========================================================

  let hasExistingSave = false;
  try { hasExistingSave = !!localStorage.getItem(SAVE_KEY); } catch (e) { /* ignore */ }

  initTubes();
  initVials();
  loadState();
  initSourcePositions();
  applySourcePositions();

  for (let i = 0; i < minionCount; i++) spawnMinion();

  renderAll();

  if (!hasExistingSave) {
    document.querySelector("#splashOverlay").classList.add("open");
  }



  const splashStartBtn = document.querySelector("#splashStartBtn");
  if (splashStartBtn) {
    splashStartBtn.addEventListener("click", () => {
      document.querySelector("#splashOverlay")?.classList.remove("open");
    });
  }
document.querySelector("#godModeBtn")?.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    coins += 100;
    renderAll();
    saveState();
    e.currentTarget.classList.remove("godPulse");
    void e.currentTarget.offsetWidth;
    e.currentTarget.classList.add("godPulse");
    say("✦");
  });

  renderFlexibleBuckets();
