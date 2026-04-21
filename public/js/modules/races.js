// Race configuration — all theme-specific content lives here
export const RACES = {
  goblin: {
    name: 'Goblin',
    emoji: '👺',
    themeClass: 'theme-goblin',
    badge: '🟢 Goblin',
    // Pet stats flavour
    speech: {
      hungry: ['Gimme rats!', 'FEED ME NOW!', 'My belly grumbles...', 'Rats... please...'],
      happy:  ['Hehehe! GOLD!', 'Chaos is good!', 'I am chaos itself!', 'More shiny things!'],
      tired:  ['Zzz... gold...', 'Sleep time, sneaky...', 'Goblin need nap.'],
      idle:   ['Scheming...', 'Eyeing your pockets...', 'Counting gold...', '*sniffs*']
    },
    // Food for feed minigame
    food: { emoji: '🐀', label: 'Rats', color: '#5a3a1a' },
    drink: { emoji: '🪣', label: 'Swamp Brew' },
    // Shop
    shopName: "Grimbolt's Junk Den",
    shopItems: [
      { id: 'mushroom', emoji: '🍄', name: 'Gloom Shroom', cost: 50,  desc: '+10 Happy', stat: 'happy',  val: 10 },
      { id: 'bone',     emoji: '🦴', name: 'Chew Bone',    cost: 30,  desc: '+8 Hunger', stat: 'hunger', val: 8  },
      { id: 'crown',    emoji: '👑', name: 'Stolen Crown',  cost: 120, desc: '+15 XP', stat: 'xp', val: 15 },
      { id: 'fire',     emoji: '🔥', name: 'Chaos Torch',   cost: 80,  desc: '+12 Happy', stat: 'happy', val: 12 },
      { id: 'gem',      emoji: '💎', name: 'Shiny Gem',     cost: 200, desc: '+20 XP', stat: 'xp', val: 20, room: true },
      { id: 'chest',    emoji: '📦', name: 'Loot Crate',    cost: 90,  desc: '+10 Energy', stat: 'energy', val: 10, room: true },
    ],
    // Room decoration defaults
    roomItems: [],
    // Minigame food color (for canvas)
    foodColor: '#8B4513',
    petColor: '#2d8a3e',
  },

  human: {
    name: 'Human',
    emoji: '🧑',
    themeClass: 'theme-human',
    badge: '🟡 Human',
    speech: {
      hungry: ['I could eat!', 'Time for supper?', 'A hearty meal!', 'Bread... butter...'],
      happy:  ['Life is good!', 'Huzzah!', 'Fortune favours me!', 'Cheers to that!'],
      tired:  ['Must rest...', 'A nap would be grand.', 'Weary to the bone.'],
      idle:   ['Hmm...', 'Just thinking.', 'Planning my next move.', 'Nice weather.']
    },
    food: { emoji: '🍞', label: 'Bread', color: '#c8a040' },
    drink: { emoji: '🍺', label: 'Ale' },
    shopName: "The Village Market",
    shopItems: [
      { id: 'apple',   emoji: '🍎', name: 'Red Apple',     cost: 30,  desc: '+8 Hunger',  stat: 'hunger', val: 8  },
      { id: 'sword',   emoji: '⚔️',  name: 'Practice Sword', cost: 80, desc: '+10 Happy',  stat: 'happy',  val: 10 },
      { id: 'potion',  emoji: '🧪', name: 'Energy Potion', cost: 60,  desc: '+12 Energy', stat: 'energy', val: 12 },
      { id: 'book',    emoji: '📚', name: 'Spell Tome',    cost: 100, desc: '+15 XP',     stat: 'xp',    val: 15 },
      { id: 'candle',  emoji: '🕯️', name: 'Hearth Candle', cost: 70,  desc: '+10 Happy',  stat: 'happy',  val: 10, room: true },
      { id: 'chest',   emoji: '🪙', name: 'Gold Chest',    cost: 150, desc: '+20 XP',     stat: 'xp',    val: 20, room: true },
    ],
    roomItems: [],
    foodColor: '#c8a040',
    petColor: '#c9a84c',
  },

  elf: {
    name: 'Elf',
    emoji: '🧝',
    themeClass: 'theme-elf',
    badge: '🔵 Elf',
    speech: {
      hungry: ['A drop of wine?', 'Moonberries, please.', 'The spirit hungers...', 'Sustenance, swiftly.'],
      happy:  ['Elara sings!', 'The stars approve.', 'Ancient joy stirs within.', 'Perfection.'],
      tired:  ['Meditation calls.', 'Rest beneath the stars.', 'The stars dim...'],
      idle:   ['Communing with nature.', 'Ancient wisdom flows.', 'I sense... things.', 'Patience is virtue.']
    },
    food: { emoji: '🍇', label: 'Moonberries', color: '#7a30b0' },
    drink: { emoji: '🍷', label: 'Fine Wine' },
    shopName: "Sylvan Sanctum",
    shopItems: [
      { id: 'herb',    emoji: '🌿', name: 'Moon Herb',      cost: 40,  desc: '+10 Hunger', stat: 'hunger', val: 10 },
      { id: 'wine',    emoji: '🍷', name: 'Vintage Wine',   cost: 60,  desc: '+12 Happy',  stat: 'happy',  val: 12 },
      { id: 'staff',   emoji: '🪄', name: 'Elder Staff',    cost: 120, desc: '+15 XP',     stat: 'xp',    val: 15 },
      { id: 'lantern', emoji: '🏮', name: 'Star Lantern',   cost: 80,  desc: '+10 Energy', stat: 'energy', val: 10, room: true },
      { id: 'harp',    emoji: '🎵', name: 'Forest Harp',    cost: 90,  desc: '+12 Happy',  stat: 'happy',  val: 12, room: true },
      { id: 'gem',     emoji: '💠', name: 'Star Crystal',   cost: 200, desc: '+20 XP',     stat: 'xp',    val: 20, room: true },
    ],
    roomItems: [],
    foodColor: '#7a30b0',
    petColor: '#4a90d9',
  }
};

export function getRaceData(race) {
  return RACES[race] ?? RACES.human;
}
