import { ID_SEEDS } from './app_ids';

// Per-crop realistic weight ranges (kg). Key = base seedId (seedId & 0xFFF).
export const CROP_WEIGHTS = {
  // Pico
  [ID_SEEDS.POTATO]:       { name: 'Potato',       min: 0.08, max: 0.45 },
  [ID_SEEDS.LETTUCE]:      { name: 'Lettuce',       min: 0.05, max: 0.32 },
  [ID_SEEDS.CABBAGE]:      { name: 'Cabbage',       min: 0.30, max: 1.80 },
  [ID_SEEDS.ONION]:        { name: 'Onion',         min: 0.06, max: 0.38 },
  [ID_SEEDS.RADISH]:       { name: 'Radish',        min: 0.03, max: 0.22 },
  [ID_SEEDS.TURNIP]:       { name: 'Turnip',        min: 0.10, max: 0.55 },
  // Basic
  [ID_SEEDS.WHEAT]:        { name: 'Wheat',         min: 0.02, max: 0.14 },
  [ID_SEEDS.TOMATO]:       { name: 'Tomato',        min: 0.08, max: 0.52 },
  [ID_SEEDS.CARROT]:       { name: 'Carrot',        min: 0.10, max: 0.65 },
  [ID_SEEDS.CORN]:         { name: 'Corn',          min: 0.15, max: 0.80 },
  [ID_SEEDS.PUMPKIN]:      { name: 'Pumpkin',       min: 2.00, max: 12.0 },
  [ID_SEEDS.PEPPER]:       { name: 'Pepper',        min: 0.05, max: 0.30 },
  [ID_SEEDS.PARSNIP]:      { name: 'Parsnip',       min: 0.10, max: 0.60 },
  [ID_SEEDS.CELERY]:       { name: 'Celery',        min: 0.10, max: 0.55 },
  [ID_SEEDS.BROCCOLI]:     { name: 'Broccoli',      min: 0.20, max: 0.90 },
  [ID_SEEDS.CAULIFLOWER]:  { name: 'Cauliflower',   min: 0.40, max: 1.90 },
  [ID_SEEDS.BERRY]:        { name: 'Berry',         min: 0.01, max: 0.08 },
  [ID_SEEDS.GRAPES]:       { name: 'Grapes',        min: 0.20, max: 1.20 },
  // Premium
  [ID_SEEDS.BANANA]:       { name: 'Banana',        min: 0.10, max: 0.32 },
  [ID_SEEDS.MANGO]:        { name: 'Mango',         min: 0.20, max: 0.85 },
  [ID_SEEDS.AVOCADO]:      { name: 'Avocado',       min: 0.15, max: 0.55 },
  [ID_SEEDS.PINEAPPLE]:    { name: 'Pineapple',     min: 0.80, max: 3.50 },
  [ID_SEEDS.BLUEBERRY]:    { name: 'Blueberry',     min: 0.01, max: 0.05 },
  [ID_SEEDS.ARTICHOKE]:    { name: 'Artichoke',     min: 0.20, max: 0.75 },
  [ID_SEEDS.PAPAYA]:       { name: 'Papaya',        min: 0.50, max: 2.60 },
  [ID_SEEDS.FIG]:          { name: 'Fig',           min: 0.03, max: 0.12 },
  [ID_SEEDS.LICHI]:        { name: 'Lichi',         min: 0.01, max: 0.04 },
  [ID_SEEDS.LAVENDER]:     { name: 'Lavender',      min: 0.01, max: 0.05 },
  [ID_SEEDS.DRAGON_FRUIT]: { name: 'Dragon Fruit',  min: 0.30, max: 1.20 },
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

// Returns { weight: number, name: string } for the given seedId
export const rollCropWeight = (seedId) => {
  const baseId = seedId & 0xFFF;
  const info = CROP_WEIGHTS[baseId];
  if (!info) return { weight: parseFloat((0.1 + Math.random() * 0.4).toFixed(2)), name: 'Crop' };
  const w = info.min + Math.random() * (info.max - info.min);
  return { weight: parseFloat(w.toFixed(2)), name: info.name };
};
