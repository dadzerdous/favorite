// Journal overlay event wiring.

  // =========================================================
  // JOURNAL OVERLAY
  // =========================================================

  document.querySelector("#journalBtn").addEventListener("click", () => {
    journalOverlay.classList.add("open");
    renderJournal();
  });

  document.querySelector("#quest").addEventListener("click", () => {
    journalOverlay.classList.add("open");
    renderJournal();
  });

  document.querySelector("#journalCloseBtn").addEventListener("click", () => {
    journalOverlay.classList.remove("open");
  });

  document.querySelector("#journalProcessesTab").addEventListener("click", () => setJournalTab("processes"));
  document.querySelector("#journalGuideTab").addEventListener("click", () => setJournalTab("guide"));

