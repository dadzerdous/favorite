// ─── CONSTANTS.JS ────────────────────────────────────────────────────────────
// All static game data. No imports needed — pure data.

export const SAVE_KEY = 'neonStrikeSave_v2';

// ── Turret types ──────────────────────────────────────────────────────────────
export const TYPES = {
  kinetic: { color: '#00f5ff', label: 'KINETIC', icon: 'hex'     },
  energy:  { color: '#cc00ff', label: 'ENERGY',  icon: 'diamond' },
  plasma:  { color: '#ff6600', label: 'PLASMA',  icon: 'tri'     },
};

export const TURRET_BASE_RANGE = { kinetic: 280, energy: 380, plasma: 200 };
export const MAX_LEVEL = 3; // default, overridden to 4 by Overclock skill

// ── Enemy types ───────────────────────────────────────────────────────────────
export const ENEMY_TYPES = [
  { id:'blue',   color:'#00aaff', shape:'rect',    hpMult:1,   speedMult:1,   reward:3, weakTo:'kinetic', armor:'energy',  label:'SCOUT',  pulses:false },
  { id:'purple', color:'#cc00ff', shape:'diamond', hpMult:1.3, speedMult:0.8, reward:4, weakTo:'energy',  armor:'kinetic', label:'PHANTOM',pulses:false },
  { id:'red',    color:'#ff2244', shape:'triangle',hpMult:1.8, speedMult:0.6, reward:6, weakTo:'plasma',  armor:'energy',  label:'TANK',   pulses:false },
  { id:'yellow', color:'#ffe600', shape:'circle',  hpMult:0.6, speedMult:1.8, reward:5, weakTo:'kinetic', armor:'plasma',  label:'RUNNER', pulses:true  },
  { id:'orange', color:'#ff6600', shape:'star',    hpMult:2,   speedMult:0.9, reward:8, weakTo:'plasma',  armor:'kinetic', label:'BRUTE',  pulses:true  },
];

// ── Skill trees ───────────────────────────────────────────────────────────────
export const TURRET_SKILLS = {
  kinetic: [
    { id:'k1', name:'Rapid Fire',    desc:'Fire rate +25%',         effect:'fireRate',  branch:'rate'   },
    { id:'k2', name:'Piercing Shot', desc:'Bullets pierce 1 enemy', effect:'pierce',    branch:'pierce', req:'k1' },
    { id:'k3', name:'Ricochet',      desc:'Bullets bounce once',    effect:'ricochet',  branch:'pierce', req:'k2' },
    { id:'k4', name:'Overdrive',     desc:'Fire rate +50%',         effect:'fireRate2', branch:'rate',   req:'k1' },
    { id:'k5', name:'Twin Barrel',   desc:'Fire 2 bullets',         effect:'twin',      branch:'rate',   req:'k4' },
    { id:'k6', name:'Railgun',       desc:'Bullets ignore armor',   effect:'armorpen',  branch:'rate',   req:'k5' },
    { id:'k7', name:'Long Barrel',   desc:'Range +60px',            effect:'range1',    branch:'range'  },
    { id:'k8', name:'Extended Bore', desc:'Range +80px',            effect:'range2',    branch:'range',  req:'k7' },
    { id:'k9', name:'Sniper Rail',   desc:'Range +120px',           effect:'range3',    branch:'range',  req:'k8' },
  ],
  energy: [
    { id:'e1', name:'Wide Beam',     desc:'Beam width +30%',              effect:'beamWidth', branch:'heat'  },
    { id:'e2', name:'Slow Field',    desc:'Hits slow enemy 20%',          effect:'slow',      branch:'slow',  req:'e1' },
    { id:'e3', name:'Shield Drain',  desc:'+50% vs armored',              effect:'shieldbns', branch:'slow',  req:'e2' },
    { id:'e4', name:'Overcharge',    desc:'Dmg +40% when beam hot',       effect:'heatbonus', branch:'heat',  req:'e1' },
    { id:'e5', name:'Chain Arc',     desc:'Arcs to 2nd enemy',            effect:'arc',       branch:'heat',  req:'e4' },
    { id:'e6', name:'Ion Storm',     desc:'All-lane pulse every 10s',     effect:'pulse',     branch:'heat',  req:'e5' },
    { id:'e7', name:'Capacitor',     desc:'Heat cools 25% faster',        effect:'cooldown',  branch:'slow'  },
    { id:'e8', name:'Focus Lens',    desc:'Damage +30%',                  effect:'dmgBonus',  branch:'slow',  req:'e7' },
    { id:'e9', name:'Overload',      desc:'Lv3 bursts on kill',           effect:'overload',  branch:'slow',  req:'e8' },
  ],
  plasma: [
    { id:'p1', name:'Blast Radius',  desc:'AOE radius +25px',             effect:'aoe1',      branch:'aoe'   },
    { id:'p2', name:'Wide Burst',    desc:'AOE radius +35px',             effect:'aoe2',       branch:'aoe',   req:'p1' },
    { id:'p3', name:'Shockwave',     desc:'AOE radius +50px',             effect:'aoe3',       branch:'aoe',   req:'p2' },
    { id:'p4', name:'Burn DoT',      desc:'Leaves burn on hit',           effect:'burn',       branch:'burn'  },
    { id:'p5', name:'Napalm',        desc:'Burn damage +50%',             effect:'burnDmg',    branch:'burn',  req:'p4' },
    { id:'p6', name:'Sticky Fire',   desc:'Burn slows enemy',             effect:'burnSlow',   branch:'burn',  req:'p5' },
    { id:'p7', name:'Heat Sink',     desc:'Less beam heat per shot',      effect:'heatRed',    branch:'aoe'   },
    { id:'p8', name:'Superheated',   desc:'Dmg scales with wave',         effect:'waveBonus',  branch:'burn',  req:'p7' },
    { id:'p9', name:'Meltdown',      desc:'5% instant-kill chance',       effect:'instakill',  branch:'burn',  req:'p8' },
  ],
};

export const PILOT_SKILLS = [
  { id:'pr1', name:'Veteran Start',  desc:'Start with +$30',         effect:'startCredits', branch:'econ'    },
  { id:'pr2', name:'Salvage',        desc:'Kill credit +$1',         effect:'killBonus',    branch:'econ',    req:'pr1' },
  { id:'pr3', name:'Fast Cooldown',  desc:'Beam cools 30% faster',  effect:'beamCool',     branch:'defense'  },
  { id:'pr4', name:'Chain Master',   desc:'Chain timer 50% longer', effect:'chainTime',    branch:'econ',    req:'pr2' },
  { id:'pr5', name:'Iron Will',      desc:'Start with +10 shields', effect:'startShields', branch:'defense', req:'pr3' },
  { id:'pr6', name:'Efficiency',     desc:'Turrets 10% cheaper',    effect:'discount',     branch:'econ',    req:'pr4' },
  { id:'pr7', name:'Overclock',      desc:'Unlock Lv4 merges',      effect:'overclock',    branch:'econ',    req:'pr6' },
  { id:'pr8', name:'Arsenal',        desc:'+1 rail slot',           effect:'railSlot',     branch:'defense', req:'pr5' },
  { id:'pr9', name:'Hangar Bay',     desc:'+2 hangar slots',        effect:'hangarSlot',   branch:'defense', req:'pr5' },
];

// Which skill IDs belong to which branch (for quest gating)
export const BRANCH_SKILLS = {
  kinetic: { range:['k7','k8','k9'], rate:['k4','k5','k6'], pierce:['k2','k3'] },
  energy:  { slow:['e2','e3','e7','e8','e9'], heat:['e4','e5','e6'] },
  plasma:  { aoe:['p1','p2','p3','p7'], burn:['p4','p5','p6','p8','p9'] },
  pilot:   { econ:['pr1','pr2','pr4','pr6','pr7'], defense:['pr3','pr5','pr8','pr9'] },
};

// ── Stat tweaks ───────────────────────────────────────────────────────────────
export const TURRET_STAT_DEFS = {
  kinetic: [
    { id:'dmg',         name:'Damage',       desc:'+0.15 base dmg/level',     max:5, unique:false },
    { id:'fireRate',    name:'Fire Rate',     desc:'+8% rate/level',           max:5, unique:false },
    { id:'crit',        name:'Crit Chance',  desc:'+5% crit chance/level',    max:5, unique:false },
    { id:'penetration', name:'Penetration',  desc:'+12% pierce chance/level', max:5, unique:true  },
  ],
  energy: [
    { id:'dmg',         name:'Damage',       desc:'+0.15 base dmg/level',     max:5, unique:false },
    { id:'fireRate',    name:'Fire Rate',     desc:'+8% rate/level',           max:5, unique:false },
    { id:'heatRed',     name:'Heat Control', desc:'-6% heat gen/level',       max:5, unique:false },
    { id:'crit',        name:'Crit Chance',  desc:'+5% crit chance/level',    max:5, unique:false },
    { id:'resonance',   name:'Resonance',    desc:'+0.5s slow duration/lvl',  max:5, unique:true  },
  ],
  plasma: [
    { id:'dmg',         name:'Damage',       desc:'+0.15 base dmg/level',     max:5, unique:false },
    { id:'fireRate',    name:'Fire Rate',     desc:'+8% rate/level',           max:5, unique:false },
    { id:'aoe',         name:'Blast+',       desc:'+8px AOE radius/level',    max:5, unique:false },
    { id:'crit',        name:'Crit Chance',  desc:'+5% crit chance/level',    max:5, unique:false },
    { id:'volatility',  name:'Volatility',   desc:'Burning enemies explode',  max:5, unique:true  },
  ],
};

// ── Quests ────────────────────────────────────────────────────────────────────
// Each quest is a chain of tiers. Completing a tier unlocks the next,
// which is harder but gives a bigger boost to the same reward.
// tier 0 = branch unlock, tier 1+ = passive stat boosts on top.

export const QUEST_CHAINS = {
  kinetic: [
    {
      id: 'qk_range', name: 'Long Shot', statKey: 'longshots',
      reward: 'range', rewardLabel: 'Range branch',
      tiers: [
        { target:10,   desc:'Kill 10 enemies from max range',    bonus:null,                 bonusDesc:'Unlocks Range branch'         },
        { target:50,   desc:'Kill 50 enemies from max range',    bonus:'range_dmg_1',        bonusDesc:'+10% damage at max range'     },
        { target:200,  desc:'Kill 200 enemies from max range',   bonus:'range_dmg_2',        bonusDesc:'+20% damage at max range'     },
        { target:600,  desc:'Kill 600 enemies from max range',   bonus:'range_dmg_3',        bonusDesc:'+15% range on all turrets'    },
      ],
    },
    {
      id: 'qk_rate', name: 'Chain Killer', statKey: 'chain5',
      reward: 'rate', rewardLabel: 'Rate branch',
      tiers: [
        { target:1,    desc:'Reach a x5 kill chain',             bonus:null,                 bonusDesc:'Unlocks Rate branch'          },
        { target:5,    desc:'Reach x5 chain 5 times',            bonus:'chain_time_1',       bonusDesc:'+0.3s chain window'           },
        { target:20,   desc:'Reach x5 chain 20 times',           bonus:'chain_credit_1',     bonusDesc:'+$1 per chain kill'           },
        { target:50,   desc:'Reach x5 chain 50 times',           bonus:'chain_mult_1',       bonusDesc:'Chain cap raised to x10'      },
      ],
    },
    {
      id: 'qk_pierce', name: 'Armory Built', statKey: 'bought',
      reward: 'pierce', rewardLabel: 'Pierce branch',
      tiers: [
        { target:30,   desc:'Buy 30 kinetic turrets',            bonus:null,                 bonusDesc:'Unlocks Pierce branch'        },
        { target:100,  desc:'Buy 100 kinetic turrets',           bonus:'kinetic_cost_1',     bonusDesc:'Kinetic turrets cost -$2'     },
        { target:300,  desc:'Buy 300 kinetic turrets',           bonus:'kinetic_dmg_1',      bonusDesc:'+0.2 flat kinetic damage'     },
        { target:750,  desc:'Buy 750 kinetic turrets',           bonus:'kinetic_pierce_1',   bonusDesc:'All kinetic pierce by default'},
      ],
    },
  ],
  energy: [
    {
      id: 'qe_slow', name: 'Crowd Control', statKey: 'slowed',
      reward: 'slow', rewardLabel: 'Slow branch',
      tiers: [
        { target:50,   desc:'Slow 50 enemies in one run',        bonus:null,                 bonusDesc:'Unlocks Slow branch'          },
        { target:200,  desc:'Slow 200 enemies total',            bonus:'slow_strength_1',    bonusDesc:'Slow effect +5%'              },
        { target:750,  desc:'Slow 750 enemies total',            bonus:'slow_strength_2',    bonusDesc:'Slow effect +10% more'        },
        { target:2000, desc:'Slow 2000 enemies total',           bonus:'slow_aoe_1',         bonusDesc:'Slow splashes to nearby enemy'},
      ],
    },
    {
      id: 'qe_heat', name: 'Heat Seeker', statKey: 'overheats',
      reward: 'heat', rewardLabel: 'Heat branch',
      tiers: [
        { target:10,   desc:'Overheat the beam 10 times',        bonus:null,                 bonusDesc:'Unlocks Heat branch'          },
        { target:40,   desc:'Overheat 40 times total',           bonus:'beam_dmg_1',         bonusDesc:'+15% beam damage'             },
        { target:120,  desc:'Overheat 120 times total',          bonus:'cooldown_1',         bonusDesc:'Beam cools 20% faster'        },
        { target:300,  desc:'Overheat 300 times total',          bonus:'overheat_wave_1',    bonusDesc:'Overheat releases energy wave'},
      ],
    },
  ],
  plasma: [
    {
      id: 'qp_aoe', name: 'Splash Damage', statKey: 'splashkills',
      reward: 'aoe', rewardLabel: 'AOE branch',
      tiers: [
        { target:20,   desc:'Hit 3+ enemies with one shot x20',  bonus:null,                 bonusDesc:'Unlocks AOE branch'           },
        { target:75,   desc:'Hit 3+ enemies with one shot x75',  bonus:'aoe_radius_1',       bonusDesc:'+12px AOE radius'             },
        { target:200,  desc:'Hit 3+ enemies 200 times',          bonus:'aoe_dmg_1',          bonusDesc:'+15% AOE splash damage'       },
        { target:500,  desc:'Hit 3+ enemies 500 times',          bonus:'aoe_chain_1',        bonusDesc:'AOE can chain once more'      },
      ],
    },
    {
      id: 'qp_burn', name: 'Pyromaniac', statKey: 'burndmg',
      reward: 'burn', rewardLabel: 'Burn branch',
      tiers: [
        { target:500,  desc:'Deal 500 burn damage total',        bonus:null,                 bonusDesc:'Unlocks Burn branch'          },
        { target:2000, desc:'Deal 2000 burn damage total',       bonus:'burn_dmg_1',         bonusDesc:'+25% burn damage'             },
        { target:7500, desc:'Deal 7500 burn damage total',       bonus:'burn_duration_1',    bonusDesc:'+1s burn duration'            },
        { target:20000,desc:'Deal 20000 burn damage total',      bonus:'burn_spread_1',      bonusDesc:'Burn spreads on kill'         },
      ],
    },
  ],
  pilot: [
    {
      id: 'qpr_econ', name: 'Entrepreneur', statKey: 'credits',
      reward: 'econ', rewardLabel: 'Economy branch',
      tiers: [
        { target:2000,  desc:'Earn $2000 credits across runs',   bonus:null,                 bonusDesc:'Unlocks Economy branch'       },
        { target:8000,  desc:'Earn $8000 credits total',         bonus:'start_credits_1',    bonusDesc:'Start each run with +$10'     },
        { target:25000, desc:'Earn $25000 credits total',        bonus:'kill_bonus_1',       bonusDesc:'+$1 per kill always'          },
        { target:75000, desc:'Earn $75000 credits total',        bonus:'wave_bonus_1',       bonusDesc:'+25% wave clear bonus'        },
      ],
    },
    {
      id: 'qpr_def', name: 'Shield Wall', statKey: 'cleanwaves',
      reward: 'defense', rewardLabel: 'Defense branch',
      tiers: [
        { target:3,    desc:'Complete 3 waves at full shields',  bonus:null,                 bonusDesc:'Unlocks Defense branch'       },
        { target:15,   desc:'Complete 15 waves at full shields', bonus:'shield_cap_1',       bonusDesc:'+10 max shields'              },
        { target:50,   desc:'Complete 50 waves at full shields', bonus:'shield_regen_1',     bonusDesc:'Regen 1 shield per clean wave'},
        { target:150,  desc:'Complete 150 clean waves total',    bonus:'turret_armor_1',     bonusDesc:'Turrets take -20% damage'     },
      ],
    },
  ],
};

// Flat QUEST_DEFS for backward compat — derived from chains tier 0
export const QUEST_DEFS = Object.fromEntries(
  Object.entries(QUEST_CHAINS).map(([type, chains]) => [
    type,
    chains.map(c => ({
      id:          c.id,
      name:        c.name,
      statKey:     c.statKey,
      reward:      c.reward,
      rewardLabel: c.rewardLabel,
      target:      c.tiers[0].target,
      desc:        c.tiers[0].desc,
    })),
  ])
);

// ── XP thresholds ─────────────────────────────────────────────────────────────
export const PILOT_XP_PER_RANK  = [0,300,600,1000,1500,2200,3000,4000,5500,7500];
export const TURRET_XP_PER_RANK = [0, 250, 550, 1000, 1800, 3000, 5000]; // rank 6 = prestige

// ── Layout ────────────────────────────────────────────────────────────────────
export const SLOT_W        = 52;
export const SLOT_GAP      = 6;
export const RAIL_W        = 60;
export const RAIL_GAP      = 10;
export const BTN_ZONE      = 50;
export const HNG_ZONE      = 70;
export const RAIL_ZONE     = 75;
export const PANEL_H       = BTN_ZONE + HNG_ZONE + RAIL_ZONE + 10;
export const VISIBLE_HANGAR = 5;
export const DEFAULT_RAILS  = 3;
export const DEFAULT_HANGAR = 10;
