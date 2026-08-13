// Shared mutable game state and progression flags.

  // =========================================================
  // STATE
  // =========================================================

  let coins = 0;

  let TUBE_COUNT = 1;
  let VIAL_COUNT = 1;

  // onboarding gates — teach one thing at a time before the full game opens up
  let primaryBucketSlots = 0;      // purchased extra primary buckets
  let primaryBucketColors = [];    // colors currently occupying those buckets
  let firstPrimaryChoice = null;   // "yellow" or "blue"
  let pendingPrimaryBucketPosition = null;
  let yellowUnlocked = false;
  let mixerUnlocked = false;
  let blueUnlocked = false;
  let ordersUnlocked = false;

  let tubes = [];   // [{ color: null|string, amount: number }, ...] length TUBE_COUNT
  let vials = [];   // [{ color: null|string, amount: number }, ...] length VIAL_COUNT
  let bagCapacityPerTube = 4;
  let storageCapacityPerVial = 4;

  // how many "parts" one item of a mixed color takes up in a vial —
  // secondary colors (2 raw ingredients) take 2 parts; raw colors are implicitly 1.
  // tertiary colors (3-ingredient mixes) would go here as 3 once those exist.
  const colorWeight = {
    purple: 2, orange: 2, green: 2, pink: 2, skyblue: 2, cream: 2
  };

  function weightOf(color) { return colorWeight[color] || 1; }

  let dropperArmed = false;
  let dropperIngredients = []; // [{ color, source: 'field'|'tube' }, ...] up to 2

  let whiteUnlocked = false;

  let minionCount = 0;
  let minionSpeedLevel = 0;
  let minionCarryLevel = 0;
  const minions = [];

  let totalGathered = 0;
  let totalSold = 0;
  let totalMixed = 0;
  let totalFulfilled = 0;
  let studioEarningsBonus = 0;

  let activeStoreTab = "store";
  let sellMode = false;
  let rearrangeUnlocked = false;

  const GRID = 30;

  const defaultPositionFractions = {
    red:    { x: 0.06, y: 0.04 },
    blue:   { x: 0.74, y: 0.20 },
    yellow: { x: 0.26, y: 0.55 },
    white:  { x: 0.60, y: 0.78 }
  };

  const sourcePositions = {};

