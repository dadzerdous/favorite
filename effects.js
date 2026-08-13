// Audio, paint splats, coin effects, and visual feedback helpers.

  // =========================================================
  // SOUND
  // =========================================================

  const splatSoundSrc = "sounds/splat.mp3";

  function playSplatSound() {
    try {
      const sound = new Audio(splatSoundSrc);
      sound.volume = 0.7;
      sound.play().catch(() => {
        // browser blocked autoplay until the user interacts with the page — safe to ignore
      });
    } catch (e) {
      // audio unsupported — fail silently
    }
  }

  const sellChingAudio = new Audio("sounds/ching.wav");
  sellChingAudio.preload = "auto";

  function playSellSound() {
    try {
      sellChingAudio.currentTime = 0;
      sellChingAudio.play().catch(() => {});
    } catch (e) {
      // Audio may be blocked in some browser states; ignore gracefully.
    }
  }


  // =========================================================
  // PAINT SPLAT EFFECT
  // =========================================================

  function createSinglePaintSplat(color) {
    const game = document.querySelector("#game");
    const splatColor = paintSplatColors[color] || "#999";

    const wrap = document.createElement("div");
    wrap.className = "paintSplatWrap";
    wrap.style.left = randomBetween(15, 85) + "%";
    wrap.style.top = randomBetween(18, 82) + "%";
    wrap.style.setProperty("--r0", randomBetween(-35, -8) + "deg");
    wrap.style.setProperty("--r1", randomBetween(4, 22) + "deg");
    wrap.style.setProperty("--r2", randomBetween(-12, 12) + "deg");

    const lifeMs = randomBetween(1700, 4200);
    wrap.style.setProperty("--life", (lifeMs / 1000) + "s");

    const baseSize = randomBetween(110, 220);

    const main = document.createElement("div");
    main.className = "paintSplatMain";
    main.style.width = baseSize + "px";
    main.style.height = randomBetween(baseSize * .7, baseSize * 1.05) + "px";
    main.style.background = splatColor;
    main.style.borderRadius =
      `${randomBetween(35,60)}% ${randomBetween(35,60)}% ${randomBetween(35,60)}% ${randomBetween(35,60)}% / ` +
      `${randomBetween(35,60)}% ${randomBetween(35,60)}% ${randomBetween(35,60)}% ${randomBetween(35,60)}%`;
    wrap.appendChild(main);

    const dropCount = Math.floor(randomBetween(6, 12));
    for (let i = 0; i < dropCount; i++) {
      const drop = document.createElement("div");
      drop.className = "paintDrop";
      const size = randomBetween(10, 42);
      const angle = randomBetween(0, Math.PI * 2);
      const distance = randomBetween(baseSize * .35, baseSize * .95);
      drop.style.width = size + "px";
      drop.style.height = randomBetween(size * .75, size * 1.2) + "px";
      drop.style.left = (Math.cos(angle) * distance) + "px";
      drop.style.top = (Math.sin(angle) * distance) + "px";
      drop.style.background = splatColor;
      wrap.appendChild(drop);
    }

    const farDropCount = Math.floor(randomBetween(1, 4));
    for (let i = 0; i < farDropCount; i++) {
      const drop = document.createElement("div");
      drop.className = "paintDrop";
      const size = randomBetween(5, 14);
      const angle = randomBetween(0, Math.PI * 2);
      const distance = randomBetween(baseSize * .95, baseSize * 1.45);
      drop.style.width = size + "px";
      drop.style.height = size + "px";
      drop.style.left = (Math.cos(angle) * distance) + "px";
      drop.style.top = (Math.sin(angle) * distance) + "px";
      drop.style.background = splatColor;
      wrap.appendChild(drop);
    }

    game.appendChild(wrap);
    setTimeout(() => wrap.remove(), lifeMs + 200);
  }

  
  function createCanvasTapSplat(source, color) {
    const game = document.querySelector("#game");
    if (!game || !source) return;

    const sourceRect = source.getBoundingClientRect();
    const gameRect = game.getBoundingClientRect();

    const wrap = document.createElement("div");
    wrap.className = "canvasTapSplat";

    const centerX = sourceRect.left - gameRect.left + sourceRect.width / 2;
    const centerY = sourceRect.top - gameRect.top + sourceRect.height / 2;

    // Start just outside the bucket edge so the paint reads as hitting the canvas.
    const angle = randomBetween(0, Math.PI * 2);
    const edgeDistance = randomBetween(sourceRect.width * .58, sourceRect.width * .88);
    const offsetX = Math.cos(angle) * edgeDistance;
    const offsetY = Math.sin(angle) * edgeDistance;

    wrap.style.left = `${centerX + offsetX}px`;
    wrap.style.top = `${centerY + offsetY}px`;

    const splatColor = paintSplatColors[color] || "#999";
    const size = randomBetween(26, 48);

    const main = document.createElement("div");
    main.className = "canvasTapSplatMain";
    main.style.width = `${size}px`;
    main.style.height = `${randomBetween(size * .65, size)}px`;
    main.style.background = splatColor;
    main.style.borderRadius =
      `${randomBetween(38,58)}% ${randomBetween(38,58)}% ${randomBetween(38,58)}% ${randomBetween(38,58)}% / ` +
      `${randomBetween(38,58)}% ${randomBetween(38,58)}% ${randomBetween(38,58)}% ${randomBetween(38,58)}%`;

    wrap.appendChild(main);

    const drops = Math.floor(randomBetween(2, 5));
    for (let i = 0; i < drops; i++) {
      const drop = document.createElement("div");
      drop.className = "canvasTapDrop";

      const dropSize = randomBetween(3, 9);
      const angle = randomBetween(0, Math.PI * 2);
      const distance = randomBetween(size * .45, size * .9);

      drop.style.width = `${dropSize}px`;
      drop.style.height = `${dropSize}px`;
      drop.style.left = `${Math.cos(angle) * distance}px`;
      drop.style.top = `${Math.sin(angle) * distance}px`;
      drop.style.background = splatColor;

      wrap.appendChild(drop);
    }

    const lifeMs = randomBetween(7000, 12000);
    wrap.style.setProperty("--tapLife", `${lifeMs / 1000}s`);

    game.appendChild(wrap);

    setTimeout(() => wrap.remove(), lifeMs + 300);
  }

function paintSplatBurst(color) {
    const splatCount = Math.floor(randomBetween(1, 6));
    for (let i = 0; i < splatCount; i++) {
      const delay = randomBetween(0, 250);
      setTimeout(() => createSinglePaintSplat(color), delay);
    }
  }

