import { ID_SEEDS } from './app_ids';
import { getSubtype } from '../utils/basic';

// Per-crop realistic weight ranges (kg). Key = base seedId (seedId & 0xFFF).
export const CROP_WEIGHTS = {
  // Pico
  [ID_SEEDS.POTATO]:       { name: 'Potato',       min:   50, max:   500 },
  [ID_SEEDS.LETTUCE]:      { name: 'Lettuce',       min:   30, max:   300 },
  [ID_SEEDS.CABBAGE]:      { name: 'Cabbage',       min:  300, max:  2000 },
  [ID_SEEDS.ONION]:        { name: 'Onion',         min:   60, max:   400 },
  [ID_SEEDS.RADISH]:       { name: 'Radish',        min:   25, max:   250 },
  [ID_SEEDS.TURNIP]:       { name: 'Turnip',        min:  100, max:   600 },
  // Basic
  [ID_SEEDS.WHEAT]:        { name: 'Wheat',         min:   20, max:   150 },
  [ID_SEEDS.TOMATO]:       { name: 'Tomato',        min:   80, max:   500 },
  [ID_SEEDS.CARROT]:       { name: 'Carrot',        min:  100, max:   650 },
  [ID_SEEDS.CORN]:         { name: 'Corn',          min:  150, max:   800 },
  [ID_SEEDS.PUMPKIN]:      { name: 'Pumpkin',       min: 2000, max: 15000 },
  [ID_SEEDS.PEPPER]:       { name: 'Pepper',        min:   50, max:   300 },
  [ID_SEEDS.PARSNIP]:      { name: 'Parsnip',       min:  100, max:   600 },
  [ID_SEEDS.CELERY]:       { name: 'Celery',        min:  100, max:   600 },
  [ID_SEEDS.BROCCOLI]:     { name: 'Broccoli',      min:  200, max:  1000 },
  [ID_SEEDS.CAULIFLOWER]:  { name: 'Cauliflower',   min:  400, max:  2000 },
  [ID_SEEDS.BERRY]:        { name: 'Berry',         min:   10, max:   100 },
  [ID_SEEDS.GRAPES]:       { name: 'Grapes',        min:  200, max:  1500 },
  // Premium
  [ID_SEEDS.BANANA]:       { name: 'Banana',        min:  100, max:   400 },
  [ID_SEEDS.MANGO]:        { name: 'Mango',         min:  200, max:  1000 },
  [ID_SEEDS.AVOCADO]:      { name: 'Avocado',       min:  150, max:   600 },
  [ID_SEEDS.PINEAPPLE]:    { name: 'Pineapple',     min: 1000, max:  5000 },
  [ID_SEEDS.BLUEBERRY]:    { name: 'Blueberry',     min:   50, max:   300 },
  [ID_SEEDS.ARTICHOKE]:    { name: 'Artichoke',     min:  200, max:   800 },
  [ID_SEEDS.PAPAYA]:       { name: 'Papaya',        min:  500, max:  3000 },
  [ID_SEEDS.FIG]:          { name: 'Fig',           min:   50, max:   200 },
  [ID_SEEDS.LICHI]:        { name: 'Lichi',         min:   50, max:   200 },
  [ID_SEEDS.LAVENDER]:     { name: 'Lavender',      min:   50, max:   250 },
  [ID_SEEDS.DRAGON_FRUIT]: { name: 'Dragon Fruit',  min:  500, max:  2500 },
};

// Weight brackets: the range is split into 5 equal sections.
// bracket 1 = Common (lowest 20%), 5 = Legendary (top 20%)
export const WEIGHT_BRACKET_LABELS = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
// Per-rarity colors — used for the harvest card glow + rarity labels everywhere.
// Common = grey, uncommon = green, rare = blue, epic = purple, legendary = yellow.
export const WEIGHT_BRACKET_COLORS = ['#a3a3a3', '#3fb950', '#3b82f6', '#a855f7', '#fbbf24'];

export const getWeightBracket = (seedId, weight) => {
  const baseId = seedId & 0xFFF;
  const info = CROP_WEIGHTS[baseId];
  if (!info) return 1;
  const range = info.max - info.min;
  if (range <= 0) return 1;
  const fraction = (weight - info.min) / range;
  const bracket = Math.floor(fraction * 5) + 1;
  return Math.min(5, Math.max(1, bracket));
};

// Ordered rotation — one crop spotlighted per week (repeats every 18 weeks)
export const WEEKLY_CROP_ROTATION = [
  ID_SEEDS.PUMPKIN,
  ID_SEEDS.CABBAGE,
  ID_SEEDS.CAULIFLOWER,
  ID_SEEDS.PINEAPPLE,
  ID_SEEDS.PAPAYA,
  ID_SEEDS.CORN,
  ID_SEEDS.CARROT,
  ID_SEEDS.GRAPES,
  ID_SEEDS.POTATO,
  ID_SEEDS.DRAGON_FRUIT,
  ID_SEEDS.TOMATO,
  ID_SEEDS.BROCCOLI,
  ID_SEEDS.MANGO,
  ID_SEEDS.TURNIP,
  ID_SEEDS.CELERY,
  ID_SEEDS.AVOCADO,
  ID_SEEDS.ONION,
  ID_SEEDS.RADISH,
];

export const getWeekNumber = () => Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

export const getWeeklyFeaturedCrop = () => {
  const weekNum = getWeekNumber();
  const baseId = WEEKLY_CROP_ROTATION[weekNum % WEEKLY_CROP_ROTATION.length];
  return { baseId, weekNum, ...CROP_WEIGHTS[baseId] };
};

// Probability distribution for the harvested CROP's bracket given the SEED's tier.
// Rows = seed tier (1=common .. 5=legendary). Columns = crop bracket (1..5).
// Each row sums to 100. Tuned so the seed's own tier is the most likely outcome,
// with a small "miracle" chance for upgrades — e.g. a common seed has a 1-in-2000
// shot at growing a legendary crop.
const SEED_BRACKET_DISTRIBUTIONS = {
  // common seed: 92.5 / 6 / 1.2 / 0.25 / 0.05  (legendary ≈ 1 in 2000)
  1: [92.5, 6, 1.2, 0.25, 0.05],
  // uncommon seed: 10 / 80 / 8 / 1.7 / 0.3     (legendary ≈ 1 in 333)
  2: [10, 80, 8, 1.7, 0.3],
  // rare seed: 3 / 12 / 75 / 8.5 / 1.5         (legendary ≈ 1.5%)
  3: [3, 12, 75, 8.5, 1.5],
  // epic seed: 1 / 4 / 15 / 70 / 10            (legendary ≈ 10%)
  4: [1, 4, 15, 70, 10],
  // legendary seed: 0.5 / 1.5 / 6 / 22 / 70    (legendary ≈ 70%)
  5: [0.5, 1.5, 6, 22, 70],
};

// Roll the harvested crop's bracket from the seed tier's distribution.
const rollBracketForSeedTier = (seedTier) => {
  const dist = SEED_BRACKET_DISTRIBUTIONS[seedTier] || SEED_BRACKET_DISTRIBUTIONS[1];
  const roll = Math.random() * 100;
  let cum = 0;
  for (let i = 0; i < dist.length; i++) {
    cum += dist[i];
    if (roll < cum) return i + 1;
  }
  return seedTier; // numerical safety net — shouldn't reach
};

// Returns { weight, name, bracket (1-5), rarityLabel, rarityColor }
// The seed's tier biases the bracket strongly but no longer guarantees it — a common
// seed can occasionally pop a higher-tier crop (and vice versa). Once the bracket is
// rolled, the weight is randomized within that bracket's slice of the crop's range.
export const rollCropWeight = (seedId) => {
  const baseId = seedId & 0xFFF;
  const info = CROP_WEIGHTS[baseId];

  // Determine the SEED's own rarity tier (1-5) from its subtype, then roll a CROP
  // bracket from the corresponding distribution.
  const subtype = getSubtype(Number(seedId));
  const seedTier = Math.min(5, Math.max(1, subtype || 1));
  const bracket = rollBracketForSeedTier(seedTier);

  if (!info) {
    const weight = Math.round(50 + Math.random() * 450);
    return { weight, name: 'Crop', bracket, rarityLabel: WEIGHT_BRACKET_LABELS[bracket - 1], rarityColor: WEIGHT_BRACKET_COLORS[bracket - 1] };
  }

  const range = info.max - info.min;
  const bracketSize = range / 5;
  const bracketMin = info.min + bracketSize * (bracket - 1);
  const bracketMax = bracketMin + bracketSize;
  const w = Math.round(bracketMin + Math.random() * (bracketMax - bracketMin));

  return {
    weight: w,
    name: info.name,
    bracket,
    rarityLabel: WEIGHT_BRACKET_LABELS[bracket - 1],
    rarityColor: WEIGHT_BRACKET_COLORS[bracket - 1],
  };
};
