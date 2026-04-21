// UI helpers — toast, speech bubble, stat bars, pet sprite
let toastTimeout = null;

export function showToast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.add('hidden'), duration);
}

export function updateStats(state) {
  const stats = ['hunger', 'happy', 'energy', 'xp'];
  stats.forEach(stat => {
    const bar = document.getElementById(`bar-${stat}`);
    const val = document.getElementById(`val-${stat}`);
    if (!bar || !val) return;

    const max = stat === 'xp' ? state.level * 100 : 100;
    const pct = Math.min(100, Math.round((state[stat] / max) * 100));
    bar.style.width = `${pct}%`;
    val.textContent = Math.round(state[stat]);

    // Color urgency
    if (stat !== 'xp') {
      if (pct < 20) bar.style.background = '#e84040';
      else if (pct < 50) bar.style.background = '#e8a020';
      else bar.style.background = '';
    }
  });

  // Coins
  const coinsEl = document.getElementById('hdr-coins');
  if (coinsEl) coinsEl.textContent = state.coins;

  const shopCoinsEl = document.getElementById('shop-coins');
  if (shopCoinsEl) shopCoinsEl.textContent = state.coins;
}

let speechTimeout = null;

export function speak(lines) {
  const el = document.getElementById('pet-speech');
  if (!el) return;
  const line = Array.isArray(lines) ? lines[Math.floor(Math.random() * lines.length)] : lines;
  el.textContent = line;
  el.classList.add('show');
  clearTimeout(speechTimeout);
  speechTimeout = setTimeout(() => el.classList.remove('show'), 3000);
}

export function setPetSprite(race) {
  const sprites = { goblin: '👺', human: '🧑', elf: '🧝' };
  const el = document.getElementById('pet-sprite');
  if (el) el.textContent = sprites[race] ?? '🧑';
}

export function animatePet(type = 'happy') {
  const el = document.getElementById('pet-sprite');
  if (!el) return;
  el.classList.remove('happy');
  void el.offsetWidth; // reflow
  el.classList.add('happy');
}

export function updateRoomItems(items) {
  const el = document.getElementById('room-items');
  if (!el) return;
  el.innerHTML = items.map(e => `<span class="room-item">${e}</span>`).join('');
}
