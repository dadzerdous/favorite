// Pet state — all stats, persistence, tick logic
const SAVE_KEY = 'tamapets_save';

const DEFAULT_STATE = {
  name: '',
  race: '',
  hunger: 80,
  happy: 80,
  energy: 80,
  xp: 0,
  coins: 0,
  level: 1,
  ownedItems: [],
  roomItems: [],
  lastTick: Date.now(),
};

class PetState {
  constructor() {
    this.state = { ...DEFAULT_STATE };
    this.listeners = [];
    this._tickInterval = null;
  }

  load() {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...DEFAULT_STATE, ...parsed };
        // Apply offline decay
        this._applyOfflineDecay();
      }
    } catch { /* ignore */ }
    return this;
  }

  save() {
    this.state.lastTick = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
  }

  reset(name, race) {
    this.state = { ...DEFAULT_STATE, name, race, lastTick: Date.now() };
    this.save();
    this._notify();
  }

  _applyOfflineDecay() {
    const elapsed = (Date.now() - (this.state.lastTick || Date.now())) / 1000;
    const minutes = Math.min(elapsed / 60, 60); // cap at 60 min
    this._decay(minutes * 0.5); // gentler offline decay
  }

  _decay(amount = 1) {
    this.state.hunger = Math.max(0, this.state.hunger - amount * 0.6);
    this.state.happy  = Math.max(0, this.state.happy  - amount * 0.4);
    this.state.energy = Math.max(0, this.state.energy - amount * 0.3);
  }

  _clamp(val) { return Math.max(0, Math.min(100, val)); }

  adjust(stat, amount) {
    if (stat === 'xp') {
      this.state.xp += amount;
      this._checkLevelUp();
    } else if (stat === 'coins') {
      this.state.coins = Math.max(0, this.state.coins + amount);
    } else if (['hunger','happy','energy'].includes(stat)) {
      this.state[stat] = this._clamp(this.state[stat] + amount);
    }
    this.save();
    this._notify();
  }

  _checkLevelUp() {
    const threshold = this.state.level * 100;
    if (this.state.xp >= threshold) {
      this.state.xp -= threshold;
      this.state.level += 1;
      this._notify('levelup');
    }
  }

  feed(amount = 20) {
    this.adjust('hunger', amount);
    this.adjust('happy', 5);
  }

  play(happyAmount = 20, energyCost = 10) {
    this.adjust('happy', happyAmount);
    this.adjust('energy', -energyCost);
  }

  sleep() {
    this.adjust('energy', 40);
  }

  buyItem(item) {
    if (this.state.coins < item.cost) return false;
    if (this.state.ownedItems.includes(item.id)) return false;
    this.state.coins -= item.cost;
    this.state.ownedItems.push(item.id);
    if (item.room) this.state.roomItems.push(item.emoji);
    this.adjust(item.stat, item.val);
    this.save();
    this._notify();
    return true;
  }

  startTick() {
    this._tickInterval = setInterval(() => {
      this._decay(1);
      this.save();
      this._notify();
    }, 10_000); // every 10 seconds
  }

  stopTick() { clearInterval(this._tickInterval); }

  onChange(fn) { this.listeners.push(fn); }
  _notify(event) { this.listeners.forEach(fn => fn(this.state, event)); }

  get() { return this.state; }
}

export const petState = new PetState();
