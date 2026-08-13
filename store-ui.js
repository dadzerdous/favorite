// Store overlay event wiring.

  // =========================================================
  // STORE OVERLAY
  // =========================================================

  const storeOverlay = document.querySelector("#storeOverlay");

  document.querySelector("#storeBtn").addEventListener("click", () => {
    storeOverlay.classList.add("open");
    renderStore();
  });

  document.querySelector("#storeCloseBtn").addEventListener("click", () => {
    storeOverlay.classList.remove("open");
  });

  document.querySelector("#storeTabBtn").addEventListener("click", () => setStoreTab("store"));
  document.querySelector("#upgradeTabBtn").addEventListener("click", () => setStoreTab("upgrades"));

