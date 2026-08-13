// Shared DOM references and generic helper functions.

  // =========================================================
  // DOM REFERENCES
  // =========================================================

  const bagText = document.querySelector("#bagText");
  const bagContents = document.querySelector("#bagContents");
  const storageText = document.querySelector("#storageText");
  const storageContents = document.querySelector("#storageContents");
  const coinsEl = document.querySelector("#coins");
  const orderTarget = document.querySelector("#orderTarget");
  const rewardEl = document.querySelector("#reward");
  const message = document.querySelector("#message");
  const dropperToggle = document.querySelector("#mixerToolBtn");
  const dropperChips = document.querySelector("#dropperChips");
  const dropperFloaterEl = document.querySelector("#dropperFloater");
  const journalOverlay = document.querySelector("#journalOverlay");

  // =========================================================
  // BASIC HELPERS
  // =========================================================

  function say(text) {
    message.textContent = text;
    message.classList.remove("dimmed");
    message.classList.add("show");
    clearTimeout(message._timer);
    message._timer = setTimeout(() => {
      if (sellMode) {
        showSellHint(true);
      } else {
        message.classList.remove("show", "dimmed");
      }
    }, 950);
  }

  function showSellHint(dimmed = false) {
    clearTimeout(message._timer);
    message.textContent = "Tap a bucket, tube, or vial to sell paint";
    message.classList.add("show");
    message.classList.toggle("dimmed", dimmed);
  }

  function initTubes() {
    tubes = [];
    for (let i = 0; i < TUBE_COUNT; i++) tubes.push({ color: null, amount: 0 });
  }

  function initVials() {
    vials = [];
    for (let i = 0; i < VIAL_COUNT; i++) vials.push({ color: null, amount: 0 });
  }

  // find a slot that can take `amount` more of `color` (existing matching slot with
  // room, or an empty slot) and add it. Returns true if it fit, false if no room anywhere.
  function addToSlots(slots, color, amount, capacityPerSlot) {
    let target = slots.find(s => s.color === color && s.amount + amount <= capacityPerSlot);
    if (!target) target = slots.find(s => s.color === null);
    if (!target) return false;
    target.color = color;
    target.amount += amount;
    return true;
  }

  // true if addToSlots would succeed, without actually mutating anything
  function canAddToSlots(slots, color, amount, capacityPerSlot) {
    if (slots.some(s => s.color === color && s.amount + amount <= capacityPerSlot)) return true;
    return slots.some(s => s.color === null);
  }

  // remove `amount` of `color` from a single slot that holds enough of it.
  // (items aren't split across slots — one slot must cover the whole amount.)
  function removeFromSlots(slots, color, amount) {
    const target = slots.find(s => s.color === color && s.amount >= amount);
    if (!target) return false;
    target.amount -= amount;
    if (target.amount === 0) target.color = null;
    return true;
  }

  function colorTotalInTubes(color) {
    return tubes.filter(t => t.color === color).reduce((sum, t) => sum + t.amount, 0);
  }

  function colorTotalInVials(color) {
    return vials.filter(v => v.color === color).reduce((sum, v) => sum + v.amount, 0);
  }

  function tubesUsedTotal() {
    return tubes.reduce((sum, t) => sum + t.amount, 0);
  }

  function vialsUsedTotal() {
    return vials.reduce((sum, v) => sum + v.amount, 0);
  }

  function storageMaxTotal() {
    return VIAL_COUNT * storageCapacityPerVial;
  }

  function unlockedRawColors() {
    return whiteUnlocked ? ["red", "blue", "yellow", "white"] : ["red", "blue", "yellow"];
  }

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

