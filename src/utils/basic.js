import { ALL_ITEMS } from "../constants/item_data";
import { ID_SEEDS, ID_PRODUCE_ITEMS, ID_POTION_ITEMS, ID_CHEST_ITEMS, CAT_FEEBLE_SEED, CAT_PICO_SEED, CAT_BASIC_SEED, CAT_PREMIUM_SEED, CAT_PICO_PRODUCE, CAT_BASIC_PRODUCE, CAT_PREMIUM_PRODUCE, CAT_CHEST } from "../constants/app_ids";

export function generateId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatNumber(value) {
  const num = Number(value);

  if (isNaN(num)) return "-"; // invalid input
  if (num === 0) return "0.00"; // special case

  // Helper: format with 3 decimals, then trim trailing zeros but keep at least 2
  const format = (n) => {
    let str = n.toFixed(3);
    str = str.replace(/(\.\d*?[1-9])0+$/, "$1"); // trim trailing zeros
    if (/^\d+\.\d$/.test(str)) {
      str += "0"; // ensure at least 2 decimals
    }
    return str;
  };

  if (num >= 1_000_000_000) {
    return format(num / 1_000_000_000) + "B";
  } else if (num >= 1_000_000) {
    return format(num / 1_000_000) + "M";
  } else if (num >= 1_000) {
    return format(num / 1_000) + "K";
  } else {
    return format(num);
  }
}

export function formatAddress(address, chars = 4) {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export const formatDuration = (timestampMs) => {
  // If input is in seconds, convert to ms
  let totalSeconds = Math.floor(timestampMs / 1000);

  const days = Math.floor(totalSeconds / (24 * 3600));
  totalSeconds %= 24 * 3600;

  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let result = [];
  if (days > 0) result.push(`${days}d`);
  if (hours > 0) result.push(`${hours}h`);
  if (minutes > 0) result.push(`${minutes}m`);
  if (seconds > 0 || result.length === 0) result.push(`${seconds}s`);

  return result.join(" ");
}

// For the test
export const getRandomSeedEntry = () => {
  // Only select from seed items, not all items
  const seedEntries = Object.entries(ALL_ITEMS).filter(([key, item]) => {
    // Check if this item is a seed by looking at the category or checking if it's in ID_SEEDS
    return item.category === 'ID_ITEM_CROP' && item.subCategory && item.subCategory.includes('SEED');
  });
  
  if (seedEntries.length === 0) {
    // Fallback: return a default seed entry
    return {
      id: 'POTATO_SEED',
      label: 'POTATO',
      pos: 1,
      type: 'ID_RARE_TYPE_COMMON',
      category: 'ID_ITEM_CROP',
      subCategory: 'ID_CROP_PICO_SEED'
    };
  }
  
  const randomIndex = Math.floor(Math.random() * seedEntries.length);
  const [key, seed] = seedEntries[randomIndex];
  return { id: key, ...seed };
};

export const isWalletConnected = () => {
  return true;
  // return false;
}

export function getMultiplier(subType, level) {
  switch (subType) {
    // Common
    case 1:
      if (level <= 3) return 900;
      else if (level <= 11) return 910;
      else return 920;
    // Uncommon
    case 2:
      if (level <= 2) return 1200;
      else if (level <= 6) return 1210;
      else if (level <= 11) return 1220;
      else return 1230;
    // Rare
    case 3:
      if (level <= 1) return 1300;
      else if (level <= 5) return 1310;
      else if (level <= 8) return 1320;
      else if (level <= 11) return 1330;
      else if (level <= 14) return 1340;
      else return 1350;
    // Epic
    case 4:
      if (level <= 1) return 2000;
      else if (level <= 3) return 2010;
      else if (level <= 5) return 2020;
      else if (level <= 7) return 2030;
      else if (level <= 9) return 2040;
      else if (level <= 11) return 2050;
      else if (level <= 13) return 2060;
      else if (level <= 14) return 2070;
      else return 2080;
    // Legendary
    case 5:
      return 5400 + (level * 20);
    // Default fallback
    default:
      return 1000;
  }
}

export const FEE_BPS_TO_VAULT = 50;
export const EPOCH_PERIOD = 20 * 60; // 7 * 24 * 60 * 60;
export const CHEST_PERIOD = 5 * 60; // 1 * 24 * 60 * 60;
export const GROWTH_REDUCE_LOW = 2 * 60; // 3 * 60 * 60;
export const GROWTH_REDUCE_MID = 4 * 60; // 6 * 60 * 60;
export const GROWTH_REDUCE_HIGH = 6 * 60; // 12 * 60 * 60;
export const GROWTH_COMMON = 3 * 60; // 3 * 60 * 60;
export const GROWTH_UNCOMMON = 4 * 60; // 4 * 60 * 60;
export const GROWTH_RARE = 5 * 60; // 8 * 60 * 60;
export const GROWTH_EPIC = 6 * 60; // 12 * 60 * 60;
export const GROWTH_LEGENDARY = 7 * 60; // 24 * 60 * 60;

export const feebleSeedArray = [1, 2, 3, 4, 5];
export const picoSeedArray = [1, 2, 3, 4, 5];
export const basicSeedArray = [4, 7, 9, 11, 12];
export const premiumSeedArray = [3, 6, 8, 10, 11];

export const getSubtype = (seedId) => {
  const category = seedId >> 8;
  const id = seedId & 0xFF;
  let array = [];
  if (category === 1) {
    array = feebleSeedArray;
  } else if (category === 2) {
    array = picoSeedArray;
  } else if (category === 3) {
    array = basicSeedArray;
  } else if (category === 4) {
    array = premiumSeedArray;
  }
  let x = 0;
  for (let i = 0; i < array.length; i++) {
    if (array[i] <= id) {
      x = i + 1;
      break;
    }
  }
  return x;
}

export const getGrowthTime = (seedId) => {
  const x = getSubtype(seedId);
  switch (x) {
    case 1:
      return GROWTH_COMMON;
    case 2:
      return GROWTH_UNCOMMON;
    case 3:
      return GROWTH_RARE;
    case 4:
      return GROWTH_EPIC;
    case 5:
      return GROWTH_LEGENDARY;
    default:
      return GROWTH_COMMON;
  }
}

export const chestLootTable = (chestType) => {
  const chestId = (CAT_CHEST << 8) | Number(chestType);
  const values = (obj) => Object.values(obj || {});
  const byCategory = (ids, category) => ids.filter((id) => ((Number(id) >> 8) === category)).slice(0, 4);

  const seedIds = values(ID_SEEDS);
  const produceIds = values(ID_PRODUCE_ITEMS);

  const feebleSeeds = byCategory(seedIds, CAT_FEEBLE_SEED);
  const picoSeeds = byCategory(seedIds, CAT_PICO_SEED);
  const basicSeeds = byCategory(seedIds, CAT_BASIC_SEED);
  const premiumSeeds = byCategory(seedIds, CAT_PREMIUM_SEED);

  const picoProduce = byCategory(produceIds, CAT_PICO_PRODUCE);
  const basicProduce = byCategory(produceIds, CAT_BASIC_PRODUCE);
  const premiumProduce = byCategory(produceIds, CAT_PREMIUM_PRODUCE);

  const growth = ID_POTION_ITEMS.POTION_GROWTH_ELIXIR;
  const pesticide = ID_POTION_ITEMS.POTION_PESTICIDE;
  const fertilizer = ID_POTION_ITEMS.POTION_FERTILIZER;

  switch (chestId) {
    case ID_CHEST_ITEMS.CHEST_WOOD: // CHEST_WOOD
      return [
        ...picoProduce,
        ...feebleSeeds,
        ...picoSeeds,
      ];
    case ID_CHEST_ITEMS.CHEST_BRONZE: // CHEST_BRONZE
      return [
        ...picoProduce,
        growth,
        pesticide,
        ...feebleSeeds,
        ...picoSeeds,
        ...basicSeeds,
      ];
    case ID_CHEST_ITEMS.CHEST_SILVER: // CHEST_SILVER
      return [
        ...basicProduce,
        growth,
        pesticide,
        fertilizer,
        ...feebleSeeds,
        ...picoSeeds,
        ...basicSeeds,
      ];
    case ID_CHEST_ITEMS.CHEST_GOLD: // CHEST_GOLD
      return [
        ...premiumProduce,
        growth,
        pesticide,
        fertilizer,
        ...feebleSeeds,
        ...picoSeeds,
        ...basicSeeds,
        ...premiumSeeds,
      ];
    default:
      return [];
  }
}
