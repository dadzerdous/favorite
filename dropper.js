// Mixer mode: drag one paint bucket onto another, then snap it back.

  function toggleDropper() {
    if (!mixerUnlocked) return;

    if (sellMode) {
      sellMode = false;
      document.querySelector("#sellAllChoices")?.classList.remove("open");
    }

    dropperArmed = !dropperArmed;
    dropperIngredients = [];

    if (dropperArmed) {
      if (VIAL_COUNT <= 0) {
        dropperArmed = false;
        say("Buy a Mixer Vial first");
      } else {
        say("Drag one paint bucket onto another to mix");
      }
    }

    renderAll();
  }

  function resolveBucketDragMix(firstSource, secondSource) {
    const colorA = firstSource.dataset.color;
    const colorB = secondSource.dataset.color;
    const recipe = findRecipeForPair(colorA, colorB);

    if (!recipe) {
      say("That combo doesn't mix");
      return;
    }

    const weight = weightOf(recipe.result);

    if (!canAddToSlots(vials, recipe.result, weight, storageCapacityPerVial)) {
      say(`🧪 No Mixer Vial room for ${colorInfo[recipe.result].label}`);
      return;
    }

    addToSlots(vials, recipe.result, weight, storageCapacityPerVial);
    totalMixed++;
    recordColorDiscovery(recipe.result);

    paintSplatBurst(recipe.result);
    playSplatSound();
    say(`${colorInfo[recipe.result].emoji} Made ${colorInfo[recipe.result].label}!`);

    renderAll();
    checkQuests();

    if (navigator.vibrate) navigator.vibrate([24, 15, 30]);
  }

  dropperToggle.addEventListener("click", toggleDropper);

  field.addEventListener("pointerdown", event => {
    const choices = document.querySelector("#sellAllChoices");
    if (!choices || !choices.classList.contains("open")) return;

    if (!event.target.closest(".source") &&
        !event.target.closest(".toolRailBtn") &&
        !event.target.closest(".toolRailChoiceBtn")) {
      choices.classList.remove("open");
    }
  });

  document.querySelectorAll(".source[data-color]").forEach(source => {
    source.addEventListener("pointerdown", event => {
      event.preventDefault();

      if (dropperArmed && !sellMode) {
        beginMixerBucketDrag(source, event);
        return;
      }

      source.classList.add("pressed");

      const startX = event.clientX;
      const startY = event.clientY;
      let longPressFired = false;
      let moved = false;

      const holdTimer = setTimeout(() => {
        if (!rearrangeUnlocked) return;
        longPressFired = true;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        source.classList.remove("pressed");
        beginDragSource(source, event);
      }, 450);

      function onMove(e) {
        if (Math.hypot(e.clientX - startX, e.clientY - startY) > 8) {
          moved = true;
          clearTimeout(holdTimer);
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        }
      }

      function onUp() {
        clearTimeout(holdTimer);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        source.classList.remove("pressed");

        if (!longPressFired && !moved) {
          if (sellMode) {
            const earned = 1 + studioEarningsBonus;
            coins += earned;
            totalSold += 1;
            playSellSound();

            source.classList.remove("sellBucketHint");
            void source.offsetWidth;
            source.classList.add("sellBucketHint");

            pulseCoins(earned);
            renderAll();
            showSellHint(false);

            setTimeout(() => {
              source.classList.remove("sellBucketHint");
              showSellHint(true);
            }, 650);

            checkJournalSteps();
          } else {
            tapSource(source, false);
          }
        }
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
  });

  function beginMixerBucketDrag(source, startEvent) {
    if (!dropperArmed || source.style.display === "none") return;

    const fieldRect = field.getBoundingClientRect();
    const startRect = source.getBoundingClientRect();

    const originalLeft = source.style.left;
    const originalTop = source.style.top;
    const originalZ = source.style.zIndex;

    const pointerOffsetX = startEvent.clientX - startRect.left;
    const pointerOffsetY = startEvent.clientY - startRect.top;

    source.classList.add("mixDragging");
    source.style.zIndex = "40";

    function onMove(event) {
      const left = clamp(event.clientX - fieldRect.left - pointerOffsetX, 0, fieldRect.width - source.offsetWidth);
      const top = clamp(event.clientY - fieldRect.top - pointerOffsetY, 0, fieldRect.height - source.offsetHeight);

      source.style.left = `${left}px`;
      source.style.top = `${top}px`;

      document.querySelectorAll(".source[data-color]").forEach(other => {
        if (other === source || other.style.display === "none") {
          other.classList.remove("mixTarget");
          return;
        }

        const a = source.getBoundingClientRect();
        const b = other.getBoundingClientRect();
        const overlaps = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        other.classList.toggle("mixTarget", overlaps);
      });
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);

      let target = null;

      document.querySelectorAll(".source[data-color]").forEach(other => {
        if (other !== source && other.classList.contains("mixTarget")) target = other;
        other.classList.remove("mixTarget");
      });

      source.classList.remove("mixDragging");

      // Snap back to exactly where the bucket started.
      source.style.transition = "left .28s ease, top .28s ease, transform .12s ease";
      source.style.left = originalLeft;
      source.style.top = originalTop;
      source.style.zIndex = originalZ;

      setTimeout(() => {
        source.style.transition = "";
      }, 300);

      if (target) resolveBucketDragMix(source, target);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
