import { ID_CROP_CATEGORIES, ID_RARE_TYPE, ID_SEEDS } from "./app_ids";

export const SEED_PACK_PRICE = {
    [1]: 100,
    [2]: 750,
    [3]: 3500,
    [4]: 15000,
}

export const SEED_PACKS = [
    {
        id: ID_CROP_CATEGORIES.PICO_SEED,
        items: [
            {
                label: "5x Seeds",
                count: 5,
                price: SEED_PACK_PRICE[2],
                priceLabel: "750 HNY",
                icon: "/images/crops/pack-pico-three.png",
            },
        ],
    }, {
        id: ID_CROP_CATEGORIES.BASIC_SEED,
        items: [
            {
                label: "5x Seeds",
                count: 5,
                price: SEED_PACK_PRICE[3],
                priceLabel: "3,500 HNY",
                icon: "/images/crops/pack-basic-three.png",
            },
        ],
    }, {
        id: ID_CROP_CATEGORIES.PREMIUM_SEED,
        items: [
            {
                label: "5x Seeds",
                count: 5,
                price: SEED_PACK_PRICE[4],
                priceLabel: "15,000 HNY",
                icon: "/images/crops/pack-premium-three.png",
            },
        ],
    }
]

export const SEED_PACK_LIST = {
    [ID_CROP_CATEGORIES.PICO_SEED]: {
        id: ID_CROP_CATEGORIES.PICO_SEED,
        label: "Pico",
    },
    [ID_CROP_CATEGORIES.BASIC_SEED]: {
        id: ID_CROP_CATEGORIES.BASIC_SEED,
        label: "Basic",
    },
    [ID_CROP_CATEGORIES.PREMIUM_SEED]: {
        id: ID_CROP_CATEGORIES.PREMIUM_SEED,
        label: "Premium",
    }
}

export const SEED_PACK_STATUS = {
    NORMAL: "SEED_PACK_STATUS_NORMAL",
    COMMITING: "SEED_PACK_STATUS_COMMITING",
    COMMITED: "SEED_PACK_STATUS_COMMITED",
}

export const ALL_SEED_IMAGE_HEIGHT = 7076;
export const ONE_SEED_HEIGHT = 207.7647;
export const ONE_SEED_WIDTH = 159;
export const TYPE_LABEL_COLOR = {
    [ID_RARE_TYPE.COMMON]: {
        label: "COMMON",
        color: "#f7efec"
    },
    [ID_RARE_TYPE.UNCOMMON]: {
        label: "UNCOMMON",
        color: "#81c935"
    },
    [ID_RARE_TYPE.RARE]: {
        label: "RARE",
        color: "#29b2c2",
    },
    [ID_RARE_TYPE.EPIC]: {
        label: "EPIC",
        color: "#db6595"
    },
    [ID_RARE_TYPE.LEGENDARY]: {
        label: "LEGENDARY",
        color: "#eedb33"
    }
}

export const SEED_TREE = {
    [ID_CROP_CATEGORIES.PICO_SEED]: {
        [ID_RARE_TYPE.COMMON]: {
            count: 1,
            list: [ID_SEEDS.POTATO]
        },
        [ID_RARE_TYPE.UNCOMMON]: {
            count: 1,
            list: [ID_SEEDS.LETTUCE]
        },
        [ID_RARE_TYPE.RARE]: {
            count: 1,
            list: [ID_SEEDS.CABBAGE]
        },
        [ID_RARE_TYPE.EPIC]: {
            count: 1,
            list: [ID_SEEDS.ONION]
        },
        [ID_RARE_TYPE.LEGENDARY]: {
            count: 1,
            list: [ID_SEEDS.RADISH]
        },
    },
    [ID_CROP_CATEGORIES.BASIC_SEED]: {
        [ID_RARE_TYPE.COMMON]: {
            count: 4,
            list: [ID_SEEDS.WHEAT, ID_SEEDS.TOMATO, ID_SEEDS.CARROT, ID_SEEDS.CORN]
        },
        [ID_RARE_TYPE.UNCOMMON]: {
            count: 3,
            list: [ID_SEEDS.PUMPKIN, ID_SEEDS.PEPPER, ID_SEEDS.PARSNIP]
        },
        [ID_RARE_TYPE.RARE]: {
            count: 2,
            list: [ID_SEEDS.CELERY, ID_SEEDS.BROCCOLI]
        },
        [ID_RARE_TYPE.EPIC]: {
            count: 1,
            list: [ID_SEEDS.CAULIFLOWER, ID_SEEDS.BERRY]
        },
        [ID_RARE_TYPE.LEGENDARY]: {
            count: 1,
            list: [ID_SEEDS.GRAPES]
        },
    },
    [ID_CROP_CATEGORIES.PREMIUM_SEED]: {
        [ID_RARE_TYPE.COMMON]: {
            count: 3,
            list: [ID_SEEDS.BANANA, ID_SEEDS.MANGO, ID_SEEDS.AVOCADO]
        },
        [ID_RARE_TYPE.UNCOMMON]: {
            count: 3,
            list: [ID_SEEDS.PINEAPPLE, ID_SEEDS.BLUEBERRY, ID_SEEDS.ARTICHOKE]
        },
        [ID_RARE_TYPE.RARE]: {
            count: 2,
            list: [ID_SEEDS.PAPAYA, ID_SEEDS.FIG]
        },
        [ID_RARE_TYPE.EPIC]: {
            count: 1,
            list: [ID_SEEDS.LICHI, ID_SEEDS.LAVENDER]
        },
        [ID_RARE_TYPE.LEGENDARY]: {
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