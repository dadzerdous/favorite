// Order fulfillment behavior.

  // =========================================================
  // FULFILL
  // =========================================================

  document.querySelector("#fulfillBtn").addEventListener("click", () => {
    const neededColor = currentOrder.color;
    const weight = weightOf(neededColor);

    if (!removeFromSlots(vials, neededColor, weight)) {
      say(`Need ${colorInfo[neededColor].emoji} ${colorInfo[neededColor].label}`);
      return;
    }

    const earnedReward = currentOrder.reward + studioEarningsBonus;
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

