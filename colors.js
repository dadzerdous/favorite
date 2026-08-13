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

  function mixedPaintPartValue() {
    // Mixed paint is deliberately worth more than raw paint.
    // A full starter secondary vial (4 parts) is worth 8 + a 2 coin full-vial bonus = 10.
    return 2;
  }

  function tubeSellValue(tube) {
    if (!tube || !tube.color || tube.amount <= 0) return 0;
    const fullBonus = tube.amount >= bagCapacityPerTube ? (1 + tubeSellBonusLevel) : 0;
    return tube.amount + fullBonus + studioEarningsBonus;
  }

  function fullMixerVialBonus() {
    return 2 + vialSellBonusLevel;
  }

  function mixerVialSellValue(color, amount, isFull = false) {
    return amount * mixedPaintPartValue() + (isFull ? fullMixerVialBonus() : 0);
  }

  function orderRewardForColor(color) {
    // Orders pay a premium over simply selling the same full vial.
    return mixerVialSellValue(color, storageCapacityPerVial, true) + 3;
  }

  function makeOrder(type, requirements, tier = "quick") { return { type, requirements, tier }; }
  function orderTierInfo(tier) {
    if (tier === "standard") return { label: "Standard", premium: 8 };
    if (tier === "big") return { label: "Big Job", premium: 18 };
    return { label: "Quick", premium: 3 };
  }
  function orderRequirementText(order) {
    if (!order || !Array.isArray(order.requirements)) return "";
    return order.requirements.map(req => {
      const info = colorInfo[req.color];
      return req.kind === "tube" ? `1 ${info.emoji} ${info.label} Tube` : `1 ${info.emoji} ${info.label} Mixer Vial`;
    }).join(" + ");
  }
  function orderReward(order) {
    if (!order || !Array.isArray(order.requirements)) return 0;
    let base = 0;
    order.requirements.forEach(req => { base += req.kind === "tube" ? bagCapacityPerTube + 2 : orderRewardForColor(req.color); });
    return base + orderTierInfo(order.tier).premium;
  }
  function randomRawOrderColor() {
    const colors = ["red"];
    if (yellowUnlocked) colors.push("yellow");
    if (blueUnlocked) colors.push("blue");
    if (whiteUnlocked) colors.push("white");
    return colors[Math.floor(Math.random() * colors.length)];
  }
  function randomMixedOrderColor(exclude = null) {
    const colors = activeOrderColors().filter(c => c !== exclude);
    return colors[Math.floor(Math.random() * colors.length)];
  }
  function generateOrderChoices() {
    const quickColor = randomRawOrderColor();
    const standardColor = randomMixedOrderColor();
    const bigA = randomMixedOrderColor();
    const bigB = randomMixedOrderColor(bigA);
    return [
      makeOrder("tube", [{ kind: "tube", color: quickColor }], "quick"),
      makeOrder("vial", [{ kind: "vial", color: standardColor }], "standard"),
      makeOrder("multi", [{ kind: "vial", color: bigA }, { kind: "vial", color: bigB }], "big")
    ];
  }
  function canFulfillOrder(order) {
    if (!order || !Array.isArray(order.requirements)) return false;
    const tempTubes = tubes.map(t => ({...t}));
    const tempVials = vials.map(v => ({...v}));
    for (const req of order.requirements) {
      if (req.kind === "tube") {
        const idx = tempTubes.findIndex(t => t.color === req.color && t.amount >= bagCapacityPerTube);
        if (idx < 0) return false;
        tempTubes.splice(idx, 1);
      } else {
        const idx = tempVials.findIndex(v => v.color === req.color && v.amount >= storageCapacityPerVial);
        if (idx < 0) return false;
        tempVials.splice(idx, 1);
      }
    }
    return true;
  }
  let currentOrder = null;

