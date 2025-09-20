import { ID_BAIT_ITEMS, ID_POTION_ITEMS, ID_PRODUCE_ITEMS } from "./app_ids";

export const ITEM_COMBI = {
    [ID_BAIT_ITEMS.BAIT_1]: {
        simple: true,
        list: [
            {
                ids: [ID_PRODUCE_ITEMS.POTATO],
                count: 8,
            },
            {
                ids: [ID_PRODUCE_ITEMS.LETTUCE],
                count: 4,
            },
            {
                ids: [ID_PRODUCE_ITEMS.CABBAGE],
                count: 2,
            }
        ],
        description: {
            summary: "Bait that can be used to attract fish.",
            extra_bonus: "Fishing power bonuse: ",
            extra_point: "1"
        }
    },
    [ID_BAIT_ITEMS.BAIT_2]: {
        simple: false,
        list: [
            {
                ids: [ID_PRODUCE_ITEMS.WEAT, ID_PRODUCE_ITEMS.TOMATO, ID_PRODUCE_ITEMS.CARROT, ID_PRODUCE_ITEMS.CORN],
                count: 8,
            },
            {
                ids: [ID_PRODUCE_ITEMS.PUMPKIN, ID_PRODUCE_ITEMS.CHILI, ID_PRODUCE_ITEMS.PARSNAP],
                count: 4,
            },
            {
                ids: [ID_PRODUCE_ITEMS.CELERY, ID_PRODUCE_ITEMS.BROCCOLI],
                count: 2,
            }
        ],
        description: {
            summary: "Bait that can be used to attract fish.",
            extra_bonus: "Fishing power bonuse: ",
            extra_point: "2"
        }
    },
    [ID_BAIT_ITEMS.BAIT_3]: {
        simple: false,
        list: [
            {
                ids: [ID_PRODUCE_ITEMS.BANANA, ID_PRODUCE_ITEMS.MANGO, ID_PRODUCE_ITEMS.AVOCADO],
                count: 8,
            },
            {
                ids: [ID_PRODUCE_ITEMS.PINEAPPLE, ID_PRODUCE_ITEMS.BLUEBERRY, ID_PRODUCE_ITEMS.ARTICHOKE],
                count: 4,
            },
            {
                ids: [ID_PRODUCE_ITEMS.PAPAYA, ID_PRODUCE_ITEMS.FIG],
                count: 2,
            }
        ],
        description: {
            summary: "Bait that can be used to attract fish.",
            extra_bonus: "Fishing power bonuse: ",
            extra_point: "3"
        }
    },
    [ID_POTION_ITEMS.POTION_GROWTH_ELIXIR]: {
        simple: true,
        list: [
            {
                ids: [ID_PRODUCE_ITEMS.RADISH],
                count: 2,
            },
            {
                ids: [ID_PRODUCE_ITEMS.ONION],
                count: 8,
            },
        ],
        description: {
            summary: "Speeds up the growth process of a plant.",
            extra_bonus: "Tier bonuses: ",
            extra_point: "3H / 6H / 12H"
        }
    },
    [ID_POTION_ITEMS.POTION_PESTICIDE]: {
        simple: true,
        list: [
            {
                ids: [ID_PRODUCE_ITEMS.GRAPES],
                count: 2,
            },
            {
                ids: [ID_PRODUCE_ITEMS.BERRY],
                count: 3,
            },
            {
                ids: [ID_PRODUCE_ITEMS.CAULIFLOWER],
                count: 3,
            },
        ],
        description: {
            summary: "Boosts the amount of produce you receive upon harvest.",
            extra_bonus: "Tier bonuses: ",
            extra_point: "2X / 3X /4X"
        }
    },
    [ID_POTION_ITEMS.POTION_FERTILIZER]: {
        simple: true,
        list: [
            {
                ids: [ID_PRODUCE_ITEMS.DRAGONFRUIT],
                count: 2,
            },
            {
                ids: [ID_PRODUCE_ITEMS.LAVENDER],
                count: 2,
            },
            {
                ids: [ID_PRODUCE_ITEMS.LYCHEE],
                count: 2,
            },
        ],
        description: {
            summary: "Increases the amount of tokens you receive upon harvest.",
            extra_bonus: "Tier bonuses: ",
            extra_point: "4% / 6% / 8%",
        }
    },
}