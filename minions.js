// Blob/minion movement and automatic collection.

  // =========================================================
  // MINIONS
  // =========================================================

  function positionMinionAt(element, sourceElement, instant) {
    const rect = sourceElement.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    const left = rect.left - fieldRect.left + rect.width / 2 - 19;
    const top = rect.top - fieldRect.top + rect.height / 2 - 19;

    if (instant) {
      element.style.transition = "none";
      element.style.left = left + "px";
      element.style.top = top + "px";
      void element.offsetWidth;
      element.style.transition = "";
    } else {
      element.style.transitionDuration = `${minionTravelMs()}ms`;
      element.style.left = left + "px";
      element.style.top = top + "px";
    }
  }

  function scheduleMinionMove(minion) {
    const sources = getUnlockedSources().filter(el => {
      const color = el.dataset.color;
      return colorTotalInTubes(color) > 0 && canAddToSlots(tubes, color, 1, bagCapacityPerTube);
    });

    if (!sources.length) {
      minion.el.classList.add("asleep");
      minion.timer = setTimeout(() => scheduleMinionMove(minion), 1000);
      return;
    }

    minion.el.classList.remove("asleep");

    const nonRepeat = sources.filter(el => el.dataset.color !== minion.lastColor);
    const pool = nonRepeat.length ? nonRepeat : sources;

    const target = pool[Math.floor(Math.random() * pool.length)];
    minion.lastColor = target.dataset.color;
    minion.el.classList.add("moving");
    positionMinionAt(minion.el, target, false);

    minion.timer = setTimeout(() => {
      minion.el.classList.remove("moving");
      collectMinionScoops(minion, target, minionCarryAmount());
    }, minionTravelMs());
  }

  function collectMinionScoops(minion, target, scoopsLeft) {
    if (scoopsLeft <= 0) {
      minion.timer = setTimeout(() => scheduleMinionMove(minion), minionPauseMs());
      return;
    }

    tapSource(target, true);
    minion.timer = setTimeout(() => collectMinionScoops(minion, target, scoopsLeft - 1), 220);
  }

function spawnMinion() {

  const element =
    document.createElement("div");

  element.className =
    "minion";


  const img =
    document.createElement("img");

  img.src =
    "images/blob.png";

  img.alt =
    "Paint Blob";

  img.draggable =
    false;


  element.appendChild(img);

  field.appendChild(element);


  const minion = {
    el: element,
    timer: null,
    lastColor: null
  };


  minions.push(
    minion
  );


  const sources =
    getUnlockedSources();


  if (
    sources.length
  ) {

    positionMinionAt(

      element,

      sources[
        Math.floor(
          Math.random() *
          sources.length
        )
      ],

      true

    );

  }


  scheduleMinionMove(
    minion
  );

}

