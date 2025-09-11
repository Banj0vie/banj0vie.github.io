import { seedIcons } from "./baseimages";
import { ID_SEED_SHOP_ITEMS, ID_SEED_CATEGORIES, ID_SEEDS } from "./id";

export const SEED_SHOP_PAGES = {
    SEED_PACK_LIST: "SEED_SHOP_PAGES_SEED_PACK_LIST",
    SEED_PACK_DETAIL: "SEED_SHOP_PAGES_SEED_PACK_DETAIL",
    ROLL_CHANCES: "SEED_SHOP_PAGES_ROLL_CHANCES",
    CUSTOM_AMOUNT: "SEED_SHOP_PAGES_CUSTOM_AMOUNT",
}

export const SEED_PACKS = [
    {
        id: ID_SEED_SHOP_ITEMS.FEEBLE_SEED,
        items: [
            {
                label: "1x Seed",
                count: 1,
                price: 1,
                priceLabel: "1 Yield",
                icon: seedIcons.feebleOneRandom,
            },
            {
                label: "3x Seed",
                count: 3,
                price: 1,
                priceLabel: "3 Yield",
                icon: seedIcons.feebleThree,
            },
            {
                label: "Custom",
                count: 0,
                price: 1,
                priceLabel: "1.00 Yield x Seed",
                icon: seedIcons.feebleOneRandom,
            },
        ],
        tip: "Feeble seeds won't give produce!",
    }, {
        id: ID_SEED_SHOP_ITEMS.PICO_SEED,
        items: [
            {
                label: "1x Seed",
                count: 1,
                price: 20,
                priceLabel: "20 Yield",
                icon: seedIcons.picoOne,
            },
            {
                label: "3x Seed",
                count: 3,
                price: 20,
                priceLabel: "60 Yield",
                icon: seedIcons.picoThree,
            },
            {
                label: "Custom",
                count: 0,
                price: 20,
                priceLabel: "20 Yield x Seed",
                icon: seedIcons.picoOneRandom,
            },
        ],
    }, {
        id: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        items: [
            {
                label: "1x Seed",
                count: 1,
                price: 100,
                priceLabel: "100 Yield",
                icon: seedIcons.basicOne,
            },
            {
                label: "3x Seed",
                count: 3,
                price: 100,
                priceLabel: "300 Yield",
                icon: seedIcons.basicThree,
            },
            {
                label: "Custom",
                count: 0,
                price: 100,
                priceLabel: "100 Yield x Seed",
                icon: seedIcons.basicOneRandom,
            },
        ],
    }, {
        id: ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
        items: [
            {
                label: "1x Seed",
                count: 1,
                price: 250,
                priceLabel: "250 Yield",
                icon: seedIcons.premiumOne,
            },
            {
                label: "3x Seed",
                count: 3,
                price: 250,
                priceLabel: "750 Yield",
                icon: seedIcons.premiumThree,
            },
            {
                label: "Custom",
                count: 0,
                price: 250,
                priceLabel: "250 Yield x Seed",
                icon: seedIcons.premiumOneRandom,
            },
        ],
    }
]

export const SEED_PACK_STATUS = {
    NORMAL: "SEED_PACK_STATUS_NORMAL",
    COMMITING: "SEED_PACK_STATUS_COMMITING",
    COMMITED: "SEED_PACK_STATUS_COMMITED",
}

export const ALL_SEED_IMAGE_HEIGHT = 2176;
export const ONE_SEED_HEIGHT = 64;
export const SEED_CATEGORIES = {
    [ID_SEED_CATEGORIES.COMMON]: {
        label: "COMMON",
        color: "#f7efec"
    },
    [ID_SEED_CATEGORIES.UNCOMMON]: {
        label: "UNCOMMON",
        color: "#81c935"
    },
    [ID_SEED_CATEGORIES.RARE]: {
        label: "RARE",
        color: "#29b2c2",
    },
    [ID_SEED_CATEGORIES.EPIC]: {
        label: "EPIC",
        color: "#db6595"
    },
    [ID_SEED_CATEGORIES.LEGENDARY]: {
        label: "LEGENDARY",
        color: "#eedb33"
    }
}

export const SEED_TREE = {
    [ID_SEED_SHOP_ITEMS.FEEBLE_SEED]: {
        [ID_SEED_CATEGORIES.COMMON]: {
            count: 1,
            list: [ID_SEEDS.F_POTATO]
        },
        [ID_SEED_CATEGORIES.UNCOMMON]: {
            count: 1,
            list: [ID_SEEDS.F_LETTUCE]
        },
        [ID_SEED_CATEGORIES.RARE]: {
            count: 1,
            list: [ID_SEEDS.F_CABBAGE]
        },
        [ID_SEED_CATEGORIES.EPIC]: {
            count: 1,
            list: [ID_SEEDS.F_ONION]
        },
        [ID_SEED_CATEGORIES.LEGENDARY]: {
            count: 1,
            list: [ID_SEEDS.F_RADISH]
        },
    },
    [ID_SEED_SHOP_ITEMS.PICO_SEED]: {
        [ID_SEED_CATEGORIES.COMMON]: {
            count: 1,
            list: [ID_SEEDS.POTATO]
        },
        [ID_SEED_CATEGORIES.UNCOMMON]: {
            count: 1,
            list: [ID_SEEDS.LETTUCE]
        },
        [ID_SEED_CATEGORIES.RARE]: {
            count: 1,
            list: [ID_SEEDS.CABBAGE]
        },
        [ID_SEED_CATEGORIES.EPIC]: {
            count: 1,
            list: [ID_SEEDS.ONION]
        },
        [ID_SEED_CATEGORIES.LEGENDARY]: {
            count: 1,
            list: [ID_SEEDS.RADISH]
        },
    },
    [ID_SEED_SHOP_ITEMS.BASIC_SEED]: {
        [ID_SEED_CATEGORIES.COMMON]: {
            count: 4,
            list: [ID_SEEDS.WEAT, ID_SEEDS.TOMATO, ID_SEEDS.CARROT, ID_SEEDS.CORN]
        },
        [ID_SEED_CATEGORIES.UNCOMMON]: {
            count: 3,
            list: [ID_SEEDS.PUMPKIN, ID_SEEDS.CHILI, ID_SEEDS.PARSNIP]
        },
        [ID_SEED_CATEGORIES.RARE]: {
            count: 2,
            list: [ID_SEEDS.CELERY, ID_SEEDS.BROCCOLI]
        },
        [ID_SEED_CATEGORIES.EPIC]: {
            count: 1,
            list: [ID_SEEDS.CAULIFLOWER, ID_SEEDS.BERRY]
        },
        [ID_SEED_CATEGORIES.LEGENDARY]: {
            count: 1,
            list: [ID_SEEDS.GRAPES]
        },
    },
    [ID_SEED_SHOP_ITEMS.PREMIUM_SEED]: {
        [ID_SEED_CATEGORIES.COMMON]: {
            count: 3,
            list: [ID_SEEDS.BANANA, ID_SEEDS.MANGO, ID_SEEDS.AVOCADO]
        },
        [ID_SEED_CATEGORIES.UNCOMMON]: {
            count: 3,
            list: [ID_SEEDS.PINEAPPLE, ID_SEEDS.BLUEBERRY, ID_SEEDS.ARTICHOKE]
        },
        [ID_SEED_CATEGORIES.RARE]: {
            count: 2,
            list: [ID_SEEDS.PAPAYA, ID_SEEDS.FIG]
        },
        [ID_SEED_CATEGORIES.EPIC]: {
            count: 1,
            list: [ID_SEEDS.LICHI, ID_SEEDS.LAVENDER]
        },
        [ID_SEED_CATEGORIES.LEGENDARY]: {
            count: 1,
            list: [ID_SEEDS.DRAGON_FRUIT]
        },
    },
}

export const SEEDS = {
    [ID_SEEDS.WEAT]: {
        label: "WEAT",
        pack: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        category: ID_SEED_CATEGORIES.COMMON,
        pos: 1,
        yield: 50,
        lockedYield: 75,
    },
    [ID_SEEDS.TOMATO]: {
        label: "TOMATO",
        pack: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        category: ID_SEED_CATEGORIES.COMMON,
        pos: 2,
        yield: 50,
        lockedYield: 75,
    },
    [ID_SEEDS.CARROT]: {
        label: "CARROT",
        pack: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        category: ID_SEED_CATEGORIES.COMMON,
        pos: 3,
        yield: 50,
        lockedYield: 75,
    },
    [ID_SEEDS.CORN]: {
        label: "CORN",
        pack: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        category: ID_SEED_CATEGORIES.COMMON,
        pos: 4,
        yield: 50,
        lockedYield: 75,
    },
    [ID_SEEDS.PUMPKIN]: {
        label: "PUMPKIN",
        pack: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        category: ID_SEED_CATEGORIES.UNCOMMON,
        pos: 5,
        yield: 90,
        lockedYield: 135,
    },
    [ID_SEEDS.CHILI]: {
        label: "CHILI",
        pack: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        category: ID_SEED_CATEGORIES.UNCOMMON,
        pos: 6,
        yield: 90,
        lockedYield: 135,
    },
    [ID_SEEDS.PARSNIP]: {
        label: "PARSNIP",
        pack: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        category: ID_SEED_CATEGORIES.UNCOMMON,
        pos: 7,
        yield: 90,
        lockedYield: 135,
    },
    [ID_SEEDS.CELERY]: {
        label: "CELERY",
        pack: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        category: ID_SEED_CATEGORIES.RARE,
        pos: 8,
        yield: 120,
        lockedYield: 180,
    },
    [ID_SEEDS.BROCCOLI]: {
        label: "BROCCOLI",
        pack: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        category: ID_SEED_CATEGORIES.RARE,
        pos: 9,
        yield: 120,
        lockedYield: 180,
    },
    [ID_SEEDS.CAULIFLOWER]: {
        label: "CAULIFLOWER",
        pack: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        category: ID_SEED_CATEGORIES.EPIC,
        pos: 10,
        yield: 200,
        lockedYield: 300,
    },
    [ID_SEEDS.BERRY]: {
        label: "BERRY",
        pack: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        category: ID_SEED_CATEGORIES.EPIC,
        pos: 11,
        yield: 200,
        lockedYield: 300,
    },
    [ID_SEEDS.GRAPES]: {
        label: "GRAPES",
        pack: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        category: ID_SEED_CATEGORIES.LEGENDARY,
        pos: 12,
        yield: 540,
        lockedYield: 810,
    },
    [ID_SEEDS.BANANA]: {
        label: "BANANA",
        pack: ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
        category: ID_SEED_CATEGORIES.COMMON,
        pos: 13,
        yield: 400,
        lockedYield: 600,
    },
    [ID_SEEDS.MANGO]: {
        label: "MANGO",
        pack: ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
        category: ID_SEED_CATEGORIES.COMMON,
        pos: 14,
        yield: 400,
        lockedYield: 600,
    },
    [ID_SEEDS.AVOCADO]: {
        label: "AVOCADO",
        pack: ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
        category: ID_SEED_CATEGORIES.COMMON,
        pos: 15,
        yield: 400,
        lockedYield: 600,
    },
    [ID_SEEDS.PINEAPPLE]: {
        label: "PINEAPPLE",
        pack: ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
        category: ID_SEED_CATEGORIES.UNCOMMON,
        pos: 16,
        yield: 720,
        lockedYield: 1080,
    },
    [ID_SEEDS.BLUEBERRY]: {
        label: "BLUEBERRY",
        pack: ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
        category: ID_SEED_CATEGORIES.UNCOMMON,
        pos: 17,
        yield: 720,
        lockedYield: 1080,
    },
    [ID_SEEDS.ARTICHOKE]: {
        label: "ARTICHOKE",
        pack: ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
        category: ID_SEED_CATEGORIES.UNCOMMON,
        pos: 18,
        yield: 720,
        lockedYield: 1080,
    },
    [ID_SEEDS.PAPAYA]: {
        label: "PAPAYA",
        pack: ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
        category: ID_SEED_CATEGORIES.RARE,
        pos: 19,
        yield: 960,
        lockedYield: 1440,
    },
    [ID_SEEDS.FIG]: {
        label: "FIG",
        pack: ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
        category: ID_SEED_CATEGORIES.RARE,
        pos: 20,
        yield: 960,
        lockedYield: 1440,
    },
    [ID_SEEDS.LICHI]: {
        label: "LICHI",
        pack: ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
        category: ID_SEED_CATEGORIES.EPIC,
        pos: 21,
        yield: 1600,
        lockedYield: 2400,
    },
    [ID_SEEDS.LAVENDER]: {
        label: "LAVENDER",
        pack: ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
        category: ID_SEED_CATEGORIES.EPIC,
        pos: 22,
        yield: 1600,
        lockedYield: 2400,
    },
    [ID_SEEDS.DRAGON_FRUIT]: {
        label: "DRAGON_FRUIT",
        pack: ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
        category: ID_SEED_CATEGORIES.LEGENDARY,
        pos: 23,
        yield: 4400,
        lockedYield: 6600,
    },
    [ID_SEEDS.POTATO]: {
        label: "POTATO",
        pack: ID_SEED_SHOP_ITEMS.PICO_SEED,
        category: ID_SEED_CATEGORIES.COMMON,
        pos: 24,
        yield: 10,
        lockedYield: 15,
    },
    [ID_SEEDS.LETTUCE]: {
        label: "LETTUCE",
        pack: ID_SEED_SHOP_ITEMS.PICO_SEED,
        category: ID_SEED_CATEGORIES.UNCOMMON,
        pos: 25,
        yield: 18,
        lockedYield: 27,
    },
    [ID_SEEDS.CABBAGE]: {
        label: "CABBAGE",
        pack: ID_SEED_SHOP_ITEMS.PICO_SEED,
        category: ID_SEED_CATEGORIES.RARE,
        pos: 26,
        yield: 24,
        lockedYield: 36,
    },
    [ID_SEEDS.ONION]: {
        label: "ONION",
        pack: ID_SEED_SHOP_ITEMS.PICO_SEED,
        category: ID_SEED_CATEGORIES.EPIC,
        pos: 27,
        yield: 40,
        lockedYield: 60,
    },
    [ID_SEEDS.RADISH]: {
        label: "RADISH",
        pack: ID_SEED_SHOP_ITEMS.PICO_SEED,
        category: ID_SEED_CATEGORIES.LEGENDARY,
        pos: 28,
        yield: 108,
        lockedYield: 162,
    },
    [ID_SEEDS.F_POTATO]: {
        label: "F.POTATO",
        pack: ID_SEED_SHOP_ITEMS.FEEBLE_SEED,
        category: ID_SEED_CATEGORIES.COMMON,
        pos: 29,
        yield: 0.5,
        lockedYield: 0.75,
    },
    [ID_SEEDS.F_LETTUCE]: {
        label: "F.LETTUCE",
        pack: ID_SEED_SHOP_ITEMS.FEEBLE_SEED,
        category: ID_SEED_CATEGORIES.UNCOMMON,
        pos: 30,
        yield: 0.9,
        lockedYield: 1.35,
    },
    [ID_SEEDS.F_CABBAGE]: {
        label: "F.CABBAGE",
        pack: ID_SEED_SHOP_ITEMS.FEEBLE_SEED,
        category: ID_SEED_CATEGORIES.RARE,
        pos: 31,
        yield: 1.2,
        lockedYield: 1.8,
    },
    [ID_SEEDS.F_ONION]: {
        label: "F.ONION",
        pack: ID_SEED_SHOP_ITEMS.FEEBLE_SEED,
        category: ID_SEED_CATEGORIES.EPIC,
        pos: 32,
        yield: 2,
        lockedYield: 3,
    },
    [ID_SEEDS.F_RADISH]: {
        label: "F.RADISH",
        pack: ID_SEED_SHOP_ITEMS.FEEBLE_SEED,
        category: ID_SEED_CATEGORIES.LEGENDARY,
        pos: 33,
        yield: 5.4,
        lockedYield: 8.1,
    },
}