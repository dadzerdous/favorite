// Paint-source positioning and rearrangement behavior.

  // =========================================================
  // FIELD / SOURCE POSITIONS
  // =========================================================

  const field = document.querySelector("#field");

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function initSourcePositions() {
    const fieldRect = field.getBoundingClientRect();
    Object.keys(defaultPositionFractions).forEach(color => {
      if (!sourcePositions[color]) {
        const frac = defaultPositionFractions[color];
        sourcePositions[color] = color === "red"
          ? {
              left: Math.round((fieldRect.width - 78) / 2),
              top: Math.round((fieldRect.height - 78) / 2)
            }
          : {
              left: Math.round(frac.x * fieldRect.width),
              top: Math.round(frac.y * fieldRect.height)
            };
      }
    });
  }

  function applySourcePositions() {
    Object.keys(sourcePositions).forEach(color => {
      const el = document.getElementById(color);
      if (!el) return;
      el.style.left = sourcePositions[color].left + "px";
      el.style.top = sourcePositions[color].top + "px";
    });
  }

  function getUnlockedSources() {
    return Array.from(document.querySelectorAll(".source[data-color]")).filter(el => el.style.display !== "none");
  }

  function beginDragSource(sourceEl, startEvent) {
    if (!rearrangeUnlocked) return;

    const color = sourceEl.dataset.color;
    const fieldRect = field.getBoundingClientRect();

    const startLeft = parseFloat(sourceEl.style.left) || 0;
    const startTop = parseFloat(sourceEl.style.top) || 0;
    const startX = startEvent.clientX;
    const startY = startEvent.clientY;

    sourceEl.classList.add("jiggling");
    sourceEl.classList.add("dragging");
    sourceEl.style.transition = "none";

    if (navigator.vibrate) navigator.vibrate(20);

    function onDragMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newLeft = clamp(startLeft + dx, 0, fieldRect.width - sourceEl.offsetWidth);
      const newTop = clamp(startTop + dy, 0, fieldRect.height - sourceEl.offsetHeight);

      sourceEl.style.left = newLeft + "px";
      sourceEl.style.top = newTop + "px";
    }

    function onDragEnd() {
      window.removeEventListener("pointermove", onDragMove);
      window.removeEventListener("pointerup", onDragEnd);

      sourceEl.classList.remove("dragging");
      sourceEl.classList.remove("jiggling");
      sourceEl.style.transition = "";

      const rawLeft = parseFloat(sourceEl.style.left) || 0;
      const rawTop = parseFloat(sourceEl.style.top) || 0;

      const snappedLeft = Math.round(rawLeft / GRID) * GRID;
      const snappedTop = Math.round(rawTop / GRID) * GRID;

      sourceEl.style.left = snappedLeft + "px";
      sourceEl.style.top = snappedTop + "px";

      sourcePositions[color] = { left: snappedLeft, top: snappedTop };
      saveState();

      if (navigator.vibrate) navigator.vibrate(10);
    }

    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragEnd);
  }

