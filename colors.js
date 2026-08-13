// Color metadata, recipes, weights, and order helpers.

  // =========================================================
  // COLOR DATA
  // =========================================================

  const colorInfo = {
    red:     { emoji: "🔴", label: "Red" },
    blue:    { emoji: "🔵", label: "Blue" },
    yellow:  { emoji: "🟡", label: "Yellow" },
    white:   { emoji: "⚪", label: "White" },
    purple:  { emoji: "🟣", label: "Purple" },
    orange:  { emoji: "🟠", label: "Orange" },
    green:   { emoji: "🟢", label: "Green" },
    pink:    { emoji: "🩷", label: "Pink" },
    skyblue: { emoji: "🩵", label: "Sky Blue" },
    cream:   { emoji: "🟤", label: "Cream" }
  };

  const paintSplatColors = {
    red: "#ff6b6b",
    blue: "#6fa8ff",
    yellow: "#ffd95f",
    white: "#f7f7f2",
    purple: "#8e5bd9",
    orange: "#ff9f43",
    green: "#55c96b",
    pink: "#ff8fc7",
    skyblue: "#7fcfff",
    cream: "#f3df9b"
  };

  // =========================================================
  // RECIPES
  // =========================================================

  const baseRecipes = [
    { a: "red", b: "blue", result: "purple" },
    { a: "red", b: "yellow", result: "orange" },
    { a: "blue", b: "yellow", result: "green" }
  ];

  const whiteRecipes = [
    { a: "red", b: "white", result: "pink" },
    { a: "blue", b: "white", result: "skyblue" },
    { a: "yellow", b: "white", result: "cream" }
  ];

  function activeRecipes() {
    return whiteUnlocked ? baseRecipes.concat(whiteRecipes) : baseRecipes;
  }

  function findRecipeForPair(colorA, colorB) {
    return activeRecipes().find(r =>
      (r.a === colorA && r.b === colorB) || (r.a === colorB && r.b === colorA)
    );
  }

  // =========================================================
  // ORDERS
  // =========================================================

  function activeOrderColors() {
    const colors = ["purple", "orange", "green"];
    if (whiteUnlocked) colors.push("pink", "skyblue", "cream");
    return colors;
  }

  function mixedPaintPartValue(color) {
    // Mixed paint is deliberately worth more than raw paint.
    // A full starter secondary vial (4 parts) is worth 8 + a 2 coin full-vial bonus = 10.
    return 2;
  }

  function fullMixerVialBonus() {
    return 2 + vialSellBonusLevel;
  }

  function mixerVialSellValue(color, amount, isFull = false) {
    return amount * mixedPaintPartValue(color) + (isFull ? fullMixerVialBonus() : 0);
  }

  function orderRewardForColor(color) {
    // Orders pay a premium over simply selling the same full vial.
    return mixerVialSellValue(color, storageCapacityPerVial, true) + 3;
  }

  function makeOrder(color) {
    return { color };
  }

  let currentOrder = makeOrder("purple");

