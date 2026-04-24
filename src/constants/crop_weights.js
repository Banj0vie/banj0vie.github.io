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
export const WEIGHT_BRACKET_COLORS = ['#f7efec', '#81c935', '#29b2c2', '#db6595', '#eedb33'];

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

// Returns { weight, name, bracket (1-5), rarityLabel, rarityColor }
// Rolls weight within the seed's own rarity bracket range.
// A Rare seed always produces a Rare crop; the weight is random within that bracket.
export const rollCropWeight = (seedId) => {
  const baseId = seedId & 0xFFF;
  const info = CROP_WEIGHTS[baseId];

  // Determine the seed's rarity bracket (1–5) from its subtype
  const subtype = getSubtype(Number(seedId));
  const bracket = Math.min(5, Math.max(1, subtype || 1));

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
