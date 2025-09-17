import { ID_SEEDS, ID_PRODUCE_ITEMS, ID_BAIT_ITEMS, ID_FISH_ITEMS, ID_CHEST_ITEMS, ID_POTION_ITEMS } from "./app_ids";
import { ID_SEED_CATEGORIES } from "./app_ids";

// Item categories
export const ITEM_CATEGORIES = {
  SEED: "SEED",
  PRODUCE: "PRODUCE", 
  BAIT: "BAIT",
  FISH: "FISH",
  CHEST: "CHEST",
  POTION: "POTION",
};

// All items data with categories
export const ALL_ITEMS = {
  // Seeds
  [ID_SEEDS.F_POTATO]: {
    label: "F.POTATO",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.COMMON,
    yield: 0.5,
    lockedReady: 0.75,
  },
  [ID_SEEDS.F_LETTUCE]: {
    label: "F.LETTUCE", 
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
    yield: 0.9,
    lockedReady: 1.35,
  },
  [ID_SEEDS.F_CABBAGE]: {
    label: "F.CABBAGE",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.RARE,
    yield: 1.2,
    lockedReady: 1.8,
  },
  [ID_SEEDS.F_ONION]: {
    label: "F.ONION",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.EPIC,
    yield: 2,
    lockedReady: 3,
  },
  [ID_SEEDS.F_RADISH]: {
    label: "F.RADISH",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.LEGENDARY,
    yield: 5.4,
    lockedReady: 8.1,
  },
  [ID_SEEDS.POTATO]: {
    label: "POTATO",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.COMMON,
    yield: 10,
    lockedReady: 15,
  },
  [ID_SEEDS.LETTUCE]: {
    label: "LETTUCE",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
    yield: 18,
    lockedReady: 27,
  },
  [ID_SEEDS.CABBAGE]: {
    label: "CABBAGE",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.RARE,
    yield: 24,
    lockedReady: 36,
  },
  [ID_SEEDS.ONION]: {
    label: "ONION",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.EPIC,
    yield: 40,
    lockedReady: 60,
  },
  [ID_SEEDS.RADISH]: {
    label: "RADISH",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.LEGENDARY,
    yield: 108,
    lockedReady: 162,
  },
  [ID_SEEDS.WEAT]: {
    label: "WHEAT",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.COMMON,
    yield: 50,
    lockedReady: 75,
  },
  [ID_SEEDS.TOMATO]: {
    label: "TOMATO",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.COMMON,
    yield: 50,
    lockedReady: 75,
  },
  [ID_SEEDS.CARROT]: {
    label: "CARROT",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.COMMON,
    yield: 50,
    lockedReady: 75,
  },
  [ID_SEEDS.CORN]: {
    label: "CORN",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.COMMON,
    yield: 50,
    lockedReady: 75,
  },
  [ID_SEEDS.PUMPKIN]: {
    label: "PUMPKIN",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
    yield: 90,
    lockedReady: 135,
  },
  [ID_SEEDS.CHILI]: {
    label: "CHILI",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
    yield: 90,
    lockedReady: 135,
  },
  [ID_SEEDS.PARSNIP]: {
    label: "PARSNIP",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
    yield: 90,
    lockedReady: 135,
  },
  [ID_SEEDS.CELERY]: {
    label: "CELERY",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.RARE,
    yield: 120,
    lockedReady: 180,
  },
  [ID_SEEDS.BROCCOLI]: {
    label: "BROCCOLI",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.RARE,
    yield: 120,
    lockedReady: 180,
  },
  [ID_SEEDS.CAULIFLOWER]: {
    label: "CAULIFLOWER",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.EPIC,
    yield: 200,
    lockedReady: 300,
  },
  [ID_SEEDS.BERRY]: {
    label: "BERRY",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.EPIC,
    yield: 200,
    lockedReady: 300,
  },
  [ID_SEEDS.GRAPES]: {
    label: "GRAPES",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.LEGENDARY,
    yield: 540,
    lockedReady: 810,
  },
  [ID_SEEDS.BANANA]: {
    label: "BANANA",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.COMMON,
    yield: 400,
    lockedReady: 600,
  },
  [ID_SEEDS.MANGO]: {
    label: "MANGO",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.COMMON,
    yield: 400,
    lockedReady: 600,
  },
  [ID_SEEDS.AVOCADO]: {
    label: "AVOCADO",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.COMMON,
    yield: 400,
    lockedReady: 600,
  },
  [ID_SEEDS.PINEAPPLE]: {
    label: "PINEAPPLE",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
    yield: 720,
    lockedReady: 1080,
  },
  [ID_SEEDS.BLUEBERRY]: {
    label: "BLUEBERRY",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
    yield: 720,
    lockedReady: 1080,
  },
  [ID_SEEDS.ARTICHOKE]: {
    label: "ARTICHOKE",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
    yield: 720,
    lockedReady: 1080,
  },
  [ID_SEEDS.PAPAYA]: {
    label: "PAPAYA",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.RARE,
    yield: 960,
    lockedReady: 1440,
  },
  [ID_SEEDS.FIG]: {
    label: "FIG",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.RARE,
    yield: 960,
    lockedReady: 1440,
  },
  [ID_SEEDS.LICHI]: {
    label: "LICHI",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.EPIC,
    yield: 1600,
    lockedReady: 2400,
  },
  [ID_SEEDS.LAVENDER]: {
    label: "LAVENDER",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.EPIC,
    yield: 1600,
    lockedReady: 2400,
  },
  [ID_SEEDS.DRAGON_FRUIT]: {
    label: "DRAGON_FRUIT",
    category: ITEM_CATEGORIES.SEED,
    subCategory: ID_SEED_CATEGORIES.LEGENDARY,
    yield: 4400,
    lockedReady: 6600,
  },

  // Produce items
  [ID_PRODUCE_ITEMS.POTATO]: {
    label: "POTATO",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.COMMON,
  },
  [ID_PRODUCE_ITEMS.LETTUCE]: {
    label: "LETTUCE",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
  },
  [ID_PRODUCE_ITEMS.CABBAGE]: {
    label: "CABBAGE",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.RARE,
  },
  [ID_PRODUCE_ITEMS.ONION]: {
    label: "ONION",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.EPIC,
  },
  [ID_PRODUCE_ITEMS.RADISH]: {
    label: "RADISH",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.LEGENDARY,
  },
  [ID_PRODUCE_ITEMS.WHEAT]: {
    label: "WHEAT",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.COMMON,
  },
  [ID_PRODUCE_ITEMS.TOMATO]: {
    label: "TOMATO",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.COMMON,
  },
  [ID_PRODUCE_ITEMS.CARROT]: {
    label: "CARROT",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.COMMON,
  },
  [ID_PRODUCE_ITEMS.CORN]: {
    label: "CORN",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.COMMON,
  },
  [ID_PRODUCE_ITEMS.PUMPKIN]: {
    label: "PUMPKIN",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
  },
  [ID_PRODUCE_ITEMS.CHILI]: {
    label: "CHILI",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
  },
  [ID_PRODUCE_ITEMS.PARSNAP]: {
    label: "PARSNAP",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
  },
  [ID_PRODUCE_ITEMS.CELERY]: {
    label: "CELERY",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.RARE,
  },
  [ID_PRODUCE_ITEMS.BROCCOLI]: {
    label: "BROCCOLI",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.RARE,
  },
  [ID_PRODUCE_ITEMS.CAULIFLOWER]: {
    label: "CAULIFLOWER",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.EPIC,
  },
  [ID_PRODUCE_ITEMS.BERRY]: {
    label: "BERRY",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.EPIC,
  },
  [ID_PRODUCE_ITEMS.GRAPES]: {
    label: "GRAPES",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.LEGENDARY,
  },
  [ID_PRODUCE_ITEMS.BANANA]: {
    label: "BANANA",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.COMMON,
  },
  [ID_PRODUCE_ITEMS.MANGO]: {
    label: "MANGO",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.COMMON,
  },
  [ID_PRODUCE_ITEMS.AVOCADO]: {
    label: "AVOCADO",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.COMMON,
  },
  [ID_PRODUCE_ITEMS.PINEAPPLE]: {
    label: "PINEAPPLE",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
  },
  [ID_PRODUCE_ITEMS.BLUEBERRY]: {
    label: "BLUEBERRY",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
  },
  [ID_PRODUCE_ITEMS.ARTICHOKE]: {
    label: "ARTICHOKE",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.UNCOMMON,
  },
  [ID_PRODUCE_ITEMS.PAPAYA]: {
    label: "PAPAYA",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.RARE,
  },
  [ID_PRODUCE_ITEMS.FIG]: {
    label: "FIG",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.RARE,
  },
  [ID_PRODUCE_ITEMS.LYCHEE]: {
    label: "LYCHEE",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.EPIC,
  },
  [ID_PRODUCE_ITEMS.LAVENDER]: {
    label: "LAVENDER",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.EPIC,
  },
  [ID_PRODUCE_ITEMS.DRAGONFRUIT]: {
    label: "DRAGONFRUIT",
    category: ITEM_CATEGORIES.PRODUCE,
    subCategory: ID_SEED_CATEGORIES.LEGENDARY,
  },

  // Bait items
  [ID_BAIT_ITEMS.BAIT_1]: {
    label: "BAIT_1",
    category: ITEM_CATEGORIES.BAIT,
  },
  [ID_BAIT_ITEMS.BAIT_2]: {
    label: "BAIT_2", 
    category: ITEM_CATEGORIES.BAIT,
  },
  [ID_BAIT_ITEMS.BAIT_3]: {
    label: "BAIT_3",
    category: ITEM_CATEGORIES.BAIT,
  },

  // Fish items
  [ID_FISH_ITEMS.FISH_SMALL]: {
    label: "FISH_SMALL",
    category: ITEM_CATEGORIES.FISH,
  },
  [ID_FISH_ITEMS.FISH_LARGE]: {
    label: "FISH_LARGE",
    category: ITEM_CATEGORIES.FISH,
  },

  // Chest items
  [ID_CHEST_ITEMS.CHEST_WOOD]: {
    label: "CHEST_WOOD",
    category: ITEM_CATEGORIES.CHEST,
  },
  [ID_CHEST_ITEMS.CHEST_BRONZE]: {
    label: "CHEST_BRONZE",
    category: ITEM_CATEGORIES.CHEST,
  },
  [ID_CHEST_ITEMS.CHEST_SILVER]: {
    label: "CHEST_SILVER",
    category: ITEM_CATEGORIES.CHEST,
  },
  [ID_CHEST_ITEMS.CHEST_GOLD]: {
    label: "CHEST_GOLD",
    category: ITEM_CATEGORIES.CHEST,
  },

  // Potion items
  [ID_POTION_ITEMS.POTION_GROWTH_ELIXIR]: {
    label: "POTION_GROWTH_ELIXIR",
    category: ITEM_CATEGORIES.POTION,
  },
  [ID_POTION_ITEMS.POTION_PESTICIDE]: {
    label: "POTION_PESTICIDE",
    category: ITEM_CATEGORIES.POTION,
  },
  [ID_POTION_ITEMS.POTION_FERTILIZER]: {
    label: "POTION_FERTILIZER",
    category: ITEM_CATEGORIES.POTION,
  },
};
