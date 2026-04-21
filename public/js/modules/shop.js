// Shop module — renders shop items for the active race
import { getRaceData } from './races.js';
import { petState } from './petState.js';
import { showToast } from './ui.js';

export function openShop(race) {
  const raceData = getRaceData(race);
  const modal = document.getElementById('modal-shop');
  const grid = document.getElementById('shop-grid');
  const shopTitle = document.getElementById('shop-title');
  const shopCoins = document.getElementById('shop-coins');

  shopTitle.textContent = `🛒 ${raceData.shopName}`;
  modal.classList.remove('hidden');
  renderShop(raceData, grid, shopCoins);

  // Re-render when state changes (coin updates)
  const unsub = () => renderShop(raceData, grid, shopCoins);
  petState.onChange(unsub);

  document.getElementById('shop-close-btn').onclick = () => {
    modal.classList.add('hidden');
  };
}

function renderShop(raceData, grid, shopCoins) {
  const state = petState.get();
  shopCoins.textContent = state.coins;
  grid.innerHTML = '';

  raceData.shopItems.forEach(item => {
    const owned = state.ownedItems.includes(item.id);
    const canAfford = state.coins >= item.cost;

    const el = document.createElement('div');
    el.className = `shop-item${owned ? ' owned' : ''}`;

    el.innerHTML = `
      <span class="shop-emoji">${item.emoji}</span>
      <span class="shop-name">${item.name}</span>
      <span class="shop-desc">${item.desc}</span>
      <span class="shop-cost">${owned ? '✓ Owned' : `${item.cost} 💰`}</span>
    `;

    if (!owned) {
      el.style.opacity = canAfford ? '1' : '0.5';
      el.onclick = () => {
        const ok = petState.buyItem(item);
        if (!ok) {
          showToast('Not enough coins! 💸');
        } else {
          showToast(`Bought ${item.name}!`);
          renderShop(raceData, grid, shopCoins);
        }
      };
    }

    grid.appendChild(el);
  });
}
