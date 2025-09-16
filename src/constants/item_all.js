import { ID_CROP_CATEGORIES, ID_ITEM_CATEGORIES, ID_LOOT_CATEGORIES, ID_LOOTS, ID_POTION_CATEGORIES, ID_POTIONS, ID_SEEDS } from "./app_ids";

export const ALL_ITEM_TREE = [
    {
        id: "ALL",
        label: "All",
        children: [
            {
                id: ID_ITEM_CATEGORIES.CROP,
                label: "Crops",
                children: [
                    {
                        id: ID_CROP_CATEGORIES.PICO_SEED, label: "Pico", children: [
                            { id: ID_SEEDS.POTATO, label: "Potato" },
                            { id: ID_SEEDS.LETTUCE, label: "Lettuce" },
                            { id: ID_SEEDS.CABBAGE, label: "Cabbage" },
                            { id: ID_SEEDS.ONION, label: "Onion" },
                            { id: ID_SEEDS.RADISH, label: "Radish" },
                        ]
                    },
                    {
                        id: ID_CROP_CATEGORIES.BASIC_SEED, label: "Basic", children: [
                            { id: ID_SEEDS.WEAT, label: "Wheat" },
                            { id: ID_SEEDS.TOMATO, label: "Tomato" },
                            { id: ID_SEEDS.CARROT, label: "Carrot" },
                            { id: ID_SEEDS.CORN, label: "Corn" },
                            { id: ID_SEEDS.PUMPKIN, label: "Pumpkin" },
                            { id: ID_SEEDS.CHILI, label: "Chili" },
                            { id: ID_SEEDS.PARSNIP, label: "Parsnip" },
                            { id: ID_SEEDS.CELERY, label: "Celery" },
                            { id: ID_SEEDS.BROCCOLI, label: "Broccoli" },
                            { id: ID_SEEDS.CAULIFLOWER, label: "Cauliflower" },
                            { id: ID_SEEDS.BERRY, label: "Berry" },
                            { id: ID_SEEDS.GRAPES, label: "Grapes" },
                        ]
                    },
                    {
                        id: ID_CROP_CATEGORIES.PREMIUM_SEED, label: "Premium", children: [
                            { id: ID_SEEDS.BANANA, label: "Banana" },
                            { id: ID_SEEDS.MANGO, label: "Mango" },
                            { id: ID_SEEDS.AVOCADO, label: "Avocado" },
                            { id: ID_SEEDS.PINEAPPLE, label: "Pineapple" },
                            { id: ID_SEEDS.BLUEBERRY, label: "Blueberry" },
                            { id: ID_SEEDS.ARTICHOKE, label: "Artichoke" },
                            { id: ID_SEEDS.PAPAYA, label: "Papaya" },
                            { id: ID_SEEDS.FIG, label: "Fig" },
                            { id: ID_SEEDS.LICHI, label: "Lichi" },
                            { id: ID_SEEDS.LAVENDER, label: "Lavender" },
                            { id: ID_SEEDS.DRAGON_FRUIT, label: "Dragon Fruit" },
                        ]
                    },
                ],
            },
            {
                id: ID_ITEM_CATEGORIES.POTION,
                label: "Potions",
                children: [
                    {
                        id: ID_POTION_CATEGORIES.GROWTH_ELIXIR, label: "Growth Elixirs", children: [
                            { id: ID_POTIONS.GROWTH_ELIXIR, label: "Growth Elixir I" },
                            { id: ID_POTIONS.GROWTH_ELIXIR_II, label: "Growth Elixir II" },
                            { id: ID_POTIONS.GROWTH_ELIXIR_III, label: "Growth Elixir III" },
                        ]
                    },
                    {
                        id: ID_POTION_CATEGORIES.FERTILIZER, label: "Fertilizers", children: [
                            { id: ID_POTIONS.FERTILIZER, label: "Fertilizer" },
                            { id: ID_POTIONS.FERTILIZER_II, label: "Fertilizer II" },
                            { id: ID_POTIONS.FERTILIZER_III, label: "Fertilizer III" },
                        ]
                    },
                    {
                        id: ID_POTION_CATEGORIES.PESTICIDE, label: "Pesticides", children: [
                            { id: ID_POTIONS.PESTICIDE, label: "Pesticide" },
                            { id: ID_POTIONS.PESTICIDE_II, label: "Pesticide II" },
                            { id: ID_POTIONS.PESTICIDE_III, label: "Pesticide III" },
                        ]
                    }
                ]
            },
            {
                id: ID_ITEM_CATEGORIES.LOOT,
                label: "Loot",
                children: [
                    {
                        id: ID_LOOT_CATEGORIES.CHEST, label: "Chests", children: [
                            { id: ID_LOOTS.WOODEN_CHEST, label: "Wooden Chest" },
                            { id: ID_LOOTS.BRONZE_CHEST, label: "Bronze Chest" },
                            { id: ID_LOOTS.SILVER_CHEST, label: "Silver Chest" },
                            { id: ID_LOOTS.GOLDEN_CHEST, label: "Golden Chest" },
                            { id: ID_LOOTS.PLATINUM_CHEST, label: "Platinum Chest" },
                        ]
                    },
                    {
                        id: ID_LOOT_CATEGORIES.BAIT, label: "Baits", children: [
                            { id: ID_LOOTS.BAIT_I, label: "Bait I" },
                            { id: ID_LOOTS.BAIT_II, label: "Bait II" },
                            { id: ID_LOOTS.BAIT_III, label: "Bait III" }
                        ]
                    },
                    {
                        id: ID_LOOT_CATEGORIES.FISH, label: "Fish", children: [
                            { id: ID_LOOTS.ANCHOVY, label: "Anchovy" },
                            { id: ID_LOOTS.SARDINE, label: "Sardine" },
                            { id: ID_LOOTS.HERRING, label: "Herring" },
                            { id: ID_LOOTS.SMALL_TROUT, label: "Small Trout" },
                            { id: ID_LOOTS.YELLOW_PERCH, label: "Yellow Perch" },
                            { id: ID_LOOTS.SALMON, label: "Salmon" },
                            { id: ID_LOOTS.ORANGE_ROUGHY, label: "Orange Roughy" },
                            { id: ID_LOOTS.CATFISH, label: "Catfish" },
                            { id: ID_LOOTS.SMALL_SHARK, label: "Small Shark" },
                        ]
                    },
                    {
                        id: ID_LOOT_CATEGORIES.MISC, label: "Misc", children: [
                            { id: ID_LOOTS.LIFE_BUD, label: "Life Bud" },
                        ]
                    }
                ]
            }
        ],
    },
];