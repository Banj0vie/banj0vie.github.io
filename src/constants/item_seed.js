import { seedIcons } from "./_baseimages";
import { ID_SEED_SHOP_ITEMS, ID_SEED_TYPE, ID_SEEDS } from "./app_ids";

export const SEED_PACKS = [
    {
        id: ID_SEED_SHOP_ITEMS.FEEBLE_SEED,
        items: [
            {
                label: "1x Seed",
                count: 1,
                price: 1,
                priceLabel: "1 RDY",
                icon: seedIcons.feebleOneRandom,
            },
            {
                label: "3x Seed",
                count: 3,
                price: 1,
                priceLabel: "3 RDY",
                icon: seedIcons.feebleThree,
            },
            {
                label: "Custom",
                count: 0,
                price: 1,
                priceLabel: "1.00 RDY x Seed",
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
                priceLabel: "20 RDY",
                icon: seedIcons.picoOne,
            },
            {
                label: "3x Seed",
                count: 3,
                price: 20,
                priceLabel: "60 RDY",
                icon: seedIcons.picoThree,
            },
            {
                label: "Custom",
                count: 0,
                price: 20,
                priceLabel: "20 RDY x Seed",
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
                priceLabel: "100 RDY",
                icon: seedIcons.basicOne,
            },
            {
                label: "3x Seed",
                count: 3,
                price: 100,
                priceLabel: "300 RDY",
                icon: seedIcons.basicThree,
            },
            {
                label: "Custom",
                count: 0,
                price: 100,
                priceLabel: "100 RDY x Seed",
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
                priceLabel: "250 RDY",
                icon: seedIcons.premiumOne,
            },
            {
                label: "3x Seed",
                count: 3,
                price: 250,
                priceLabel: "750 RDY",
                icon: seedIcons.premiumThree,
            },
            {
                label: "Custom",
                count: 0,
                price: 250,
                priceLabel: "250 RDY x Seed",
                icon: seedIcons.premiumOneRandom,
            },
        ],
    }
]

export const SEED_PACK_LIST = {
    [ID_SEED_SHOP_ITEMS.FEEBLE_SEED]: {
        id: ID_SEED_SHOP_ITEMS.FEEBLE_SEED,
        label: "Feeble",
    },
    [ID_SEED_SHOP_ITEMS.PICO_SEED]: {
        id: ID_SEED_SHOP_ITEMS.PICO_SEED,
        label: "Pico",
    },
    [ID_SEED_SHOP_ITEMS.BASIC_SEED]: {
        id: ID_SEED_SHOP_ITEMS.BASIC_SEED,
        label: "Basic",
    },
    [ID_SEED_SHOP_ITEMS.PREMIUM_SEED]: {
        id: ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
        label: "Premium",
    }
}

export const SEED_PACK_STATUS = {
    NORMAL: "SEED_PACK_STATUS_NORMAL",
    COMMITING: "SEED_PACK_STATUS_COMMITING",
    COMMITED: "SEED_PACK_STATUS_COMMITED",
}

export const ALL_SEED_IMAGE_HEIGHT = 2176;
export const ONE_SEED_HEIGHT = 64;
export const SEED_CATEGORIES = {
    [ID_SEED_TYPE.COMMON]: {
        label: "COMMON",
        color: "#f7efec"
    },
    [ID_SEED_TYPE.UNCOMMON]: {
        label: "UNCOMMON",
        color: "#81c935"
    },
    [ID_SEED_TYPE.RARE]: {
        label: "RARE",
        color: "#29b2c2",
    },
    [ID_SEED_TYPE.EPIC]: {
        label: "EPIC",
        color: "#db6595"
    },
    [ID_SEED_TYPE.LEGENDARY]: {
        label: "LEGENDARY",
        color: "#eedb33"
    }
}

export const SEED_TREE = {
    [ID_SEED_SHOP_ITEMS.FEEBLE_SEED]: {
        [ID_SEED_TYPE.COMMON]: {
            count: 1,
            list: [ID_SEEDS.F_POTATO]
        },
        [ID_SEED_TYPE.UNCOMMON]: {
            count: 1,
            list: [ID_SEEDS.F_LETTUCE]
        },
        [ID_SEED_TYPE.RARE]: {
            count: 1,
            list: [ID_SEEDS.F_CABBAGE]
        },
        [ID_SEED_TYPE.EPIC]: {
            count: 1,
            list: [ID_SEEDS.F_ONION]
        },
        [ID_SEED_TYPE.LEGENDARY]: {
            count: 1,
            list: [ID_SEEDS.F_RADISH]
        },
    },
    [ID_SEED_SHOP_ITEMS.PICO_SEED]: {
        [ID_SEED_TYPE.COMMON]: {
            count: 1,
            list: [ID_SEEDS.POTATO]
        },
        [ID_SEED_TYPE.UNCOMMON]: {
            count: 1,
            list: [ID_SEEDS.LETTUCE]
        },
        [ID_SEED_TYPE.RARE]: {
            count: 1,
            list: [ID_SEEDS.CABBAGE]
        },
        [ID_SEED_TYPE.EPIC]: {
            count: 1,
            list: [ID_SEEDS.ONION]
        },
        [ID_SEED_TYPE.LEGENDARY]: {
            count: 1,
            list: [ID_SEEDS.RADISH]
        },
    },
    [ID_SEED_SHOP_ITEMS.BASIC_SEED]: {
        [ID_SEED_TYPE.COMMON]: {
            count: 4,
            list: [ID_SEEDS.WHEAT, ID_SEEDS.TOMATO, ID_SEEDS.CARROT, ID_SEEDS.CORN]
        },
        [ID_SEED_TYPE.UNCOMMON]: {
            count: 3,
            list: [ID_SEEDS.PUMPKIN, ID_SEEDS.CHILI, ID_SEEDS.PARSNIP]
        },
        [ID_SEED_TYPE.RARE]: {
            count: 2,
            list: [ID_SEEDS.CELERY, ID_SEEDS.BROCCOLI]
        },
        [ID_SEED_TYPE.EPIC]: {
            count: 1,
            list: [ID_SEEDS.CAULIFLOWER, ID_SEEDS.BERRY]
        },
        [ID_SEED_TYPE.LEGENDARY]: {
            count: 1,
            list: [ID_SEEDS.GRAPES]
        },
    },
    [ID_SEED_SHOP_ITEMS.PREMIUM_SEED]: {
        [ID_SEED_TYPE.COMMON]: {
            count: 3,
            list: [ID_SEEDS.BANANA, ID_SEEDS.MANGO, ID_SEEDS.AVOCADO]
        },
        [ID_SEED_TYPE.UNCOMMON]: {
            count: 3,
            list: [ID_SEEDS.PINEAPPLE, ID_SEEDS.BLUEBERRY, ID_SEEDS.ARTICHOKE]
        },
        [ID_SEED_TYPE.RARE]: {
            count: 2,
            list: [ID_SEEDS.PAPAYA, ID_SEEDS.FIG]
        },
        [ID_SEED_TYPE.EPIC]: {
            count: 1,
            list: [ID_SEEDS.LICHI, ID_SEEDS.LAVENDER]
        },
        [ID_SEED_TYPE.LEGENDARY]: {
            count: 1,
            list: [ID_SEEDS.DRAGON_FRUIT]
        },
    },
}

// SEEDS removed in favor of ALL_ITEMS in item_all.js

export const GROW_STATUS = {
    [-1]: "Newly Planted",
    0: "Sprout",
    1: "Budding",
    2: "Harvest",
}