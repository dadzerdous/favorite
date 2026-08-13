// Mixer/dropper selection and mixing state machine.

  // =========================================================
  // DROPPER — pick it up, tap 2 colors (bucket or tube), it mixes itself
  // =========================================================

  function toggleDropper(event) {
    if (!mixerUnlocked) return;
    if (sellMode) sellMode = false;
    if (dropperArmed) {
      // cancelling: hand back anything pulled from a tube (field-collected drops are just lost)
      dropperIngredients.forEach(ingredient => {
        if (ingredient.source === "tube") addToSlots(tubes, ingredient.color, 1, bagCapacityPerTube);
      });
      dropperArmed = false;
      dropperIngredients = [];
    } else {
      dropperArmed = true;
      dropperIngredients = [];
      if (event && event.currentTarget) positionDropperFloaterAtElement(event.currentTarget);
    }
    renderAll();
  }

  function feedDropperFromTube(index, event) {
    if (!dropperArmed) return;

    const tube = tubes[index];
    if (!tube.color || tube.amount <= 0) return;

    const color = tube.color;
    tube.amount--;
    if (tube.amount === 0) tube.color = null;

    if (event && event.currentTarget) positionDropperFloaterAtElement(event.currentTarget);
    addIngredientToDropper(color, "tube");
  }

  function feedDropperFromField(source) {
    if (!dropperArmed) return;
    positionDropperFloaterAtElement(source);
    addIngredientToDropper(source.dataset.color, "field");
    spawnFloater(source, `💧 ${colorInfo[source.dataset.color].emoji}`);
  }

  function addIngredientToDropper(color, source) {
    dropperIngredients.push({ color, source });
    renderAll();

    if (navigator.vibrate) navigator.vibrate(10);

    if (dropperIngredients.length === 2) resolveDropperMix();
  }

  function resolveDropperMix() {
    const [first, second] = dropperIngredients;
    const recipe = findRecipeForPair(first.color, second.color);

    function returnTubeIngredients() {
      dropperIngredients.forEach(ingredient => {
        if (ingredient.source === "tube") addToSlots(tubes, ingredient.color, 1, bagCapacityPerTube);
      });
    }

    if (!recipe) {
      say("That combo doesn't mix");
      returnTubeIngredients();
      dropperArmed = false;
      dropperIngredients = [];
      renderAll();
      return;
    }

    const weight = weightOf(recipe.result);

    if (!canAddToSlots(vials, recipe.result, weight, storageCapacityPerVial)) {
      say(`🧪 ${colorInfo[recipe.result].label} vial full!`);
      returnTubeIngredients();
      dropperArmed = false;
      dropperIngredients = [];
      renderAll();
      return;
    }

    addToSlots(vials, recipe.result, weight, storageCapacityPerVial);
    totalMixed++;
    recordColorDiscovery(recipe.result);
    dropperArmed = false;
    dropperIngredients = [];

    paintSplatBurst(recipe.result);
    playSplatSound();
    say(`${colorInfo[recipe.result].emoji} Made ${colorInfo[recipe.result].label}!`);
    renderAll();
    checkQuests();

    if (navigator.vibrate) navigator.vibrate(28);
  }

  dropperToggle.addEventListener("click", toggleDropper);


  field.addEventListener("pointerdown", event => {
    const choices = document.querySelector("#sellAllChoices");
    if (!choices || !choices.classList.contains("open")) return;

    // Clicking the open canvas closes only the Sell All submenu.
    if (!event.target.closest(".source") && !event.target.closest(".toolRailBtn") && !event.target.closest(".toolRailChoiceBtn")) {
      choices.classList.remove("open");
    }
  });

  // =========================================================
  // RAW COLOR INPUT — tap to gather, hold to rearrange
  // =========================================================

  document.querySelectorAll(".source[data-color]").forEach(source => {
    source.addEventListener("pointerdown", event => {
      event.preventDefault();
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
            const color = source.dataset.color;
            const earned = 1 + studioEarningsBonus;
            coins += earned;
            totalSold += 1;
            playSellSound();

            source.classList.remove("sellBucketHint");
            void source.offsetWidth;
            source.classList.add("sellBucketHint");

            pulseCoins(earned);
            renderAll();              // updates the visible coin total immediately
            showSellHint(false);

            setTimeout(() => {
              source.classList.remove("sellBucketHint");
              showSellHint(true);
            }, 650);

            checkJournalSteps();
          } else if (dropperArmed) {
            feedDropperFromField(source);
          } else {
            tapSource(source, false);
          }
        }
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
  });

