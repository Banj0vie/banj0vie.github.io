import { seedIcons } from "./baseimages";
import { ID_SEED_SHOP_ITEMS } from "./id";

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