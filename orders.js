// Order fulfillment behavior.

  // =========================================================
  // FULFILL
  // =========================================================

  document.querySelector("#fulfillBtn").addEventListener("click", () => {
    const neededColor = currentOrder.color;
    const vial = vials.find(v =>
      v.color === neededColor &&
      v.amount >= storageCapacityPerVial
    );

    if (!vial) {
      say(`Need 1 full ${colorInfo[neededColor].emoji} ${colorInfo[neededColor].label} Mixer Vial`);
      return;
    }

    vial.color = null;
    vial.amount = 0;

    const earnedReward = orderRewardForColor(neededColor) + studioEarningsBonus;
    coins += earnedReward;
    pulseCoins(earnedReward);
    totalFulfilled++;

    const colors = activeOrderColors();
    let nextColor;
    do {
      nextColor = colors[Math.floor(Math.random() * colors.length)];
    } while (colors.length > 1 && nextColor === currentOrder.color);
    currentOrder = makeOrder(nextColor);

    say(`✅ Order complete! +${earnedReward}`);
    renderAll();
    checkQuests();

    if (navigator.vibrate) navigator.vibrate([25, 20, 25]);
  });

