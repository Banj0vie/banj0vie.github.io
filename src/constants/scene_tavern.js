import { ID_TAVERN_HOTSPOTS } from "./app_ids";

export const TAVERN_VIEWPORT = {
    width: 960,
    height: 480,
};

export const TAVERN_HOTSPOTS = [
    { id: ID_TAVERN_HOTSPOTS.POTION, label: 'POTION SELLER', x: 700, y: 78, delay: 0 },
];

export const TAVERN_STUFFS = [
    {
        image: "/images/tavern/smoke.gif",
        x: 535,
        y: -178,
        width: 223,
        height: 177,
        zIndex: 0,
    },
    {
        image: "/images/tavern/tables.webp",
        x: 431,
        y: 309,
        width: 456,
        height: 170,
        zIndex: 5,
    },
    {
        image: "/images/tavern/counter.webp",
        x: 527,
        y: 99,
        width: 400,
        height: 207,
        zIndex: 2
    },
    {
        image: "/images/tavern/barrels.webp",
        x: 871,
        y: 452,
        width: 82,
        height: 78,
        zIndex: 15,
    },
]

export const TAVERN_BEES = [
    {
        image: "/images/bees/bee_npc.gif",
        x: 33,
        y: 209,
        flip: false,
        delay: Math.random() * (-10),
        zIndex: 0
    },
    {
        image: "/images/bees/bee_npc.gif",
        x: 6,
        y: 380,
        flip: false,
        delay: Math.random() * (-10),
        zIndex: 0
    },
    {
        image: "/images/bees/bee_npc.gif",
        x: 117,
        y: 285,
        flip: true,
        delay: Math.random() * (-10),
        zIndex: 0
    },
    {
        image: "/images/bees/bee_vendor.gif",
        x: 424,
        y: 113,
        flip: false,
        delay: Math.random() * (-10),
        zIndex: 0
    },
    {
        image: "/images/bees/bee_vendor.gif",
        x: 694,
        y: 117,
        flip: false,
        delay: Math.random() * (-10),
        zIndex: 0
    },
    {
        image: "/images/bees/bee_2.png",
        x: 361,
        y: 269,
        flip: false,
        delay: Math.random() * (-10),
        zIndex: 10
    },
    {
        image: "/images/bees/bee_npc.gif",
        x: 361,
        y: 354,
        flip: false,
        delay: Math.random() * (-10),
        zIndex: 10
    },
    {
        image: "/images/bees/bee_npc.gif",
        x: 468,
        y: 306,
        flip: true,
        delay: Math.random() * (-10),
        zIndex: 10
    },
    {
        image: "/images/bees/bee_npc.gif",
        x: 574,
        y: 253,
        flip: false,
        delay: Math.random() * 10,
        zIndex: 4
    },
    {
        image: "/images/bees/bee_npc.gif",
        x: 538,
        y: 338,
        flip: false,
        delay: Math.random() * (-10),
        zIndex: 10
    },
    {
        image: "/images/bees/bee_npc.gif",
        x: 621,
        y: 338,
        flip: true,
        delay: Math.random() * (-10),
        zIndex: 10
    },
    {
        image: "/images/bees/bee_npc.gif",
        x: 739,
        y: 205,
        flip: true,
        delay: Math.random() * (-10),
        zIndex: 10
    },
    {
        image: "/images/bees/bee_npc.gif",
        x: 821,
        y: 285,
        flip: true,
        delay: Math.random() * (-10),
        zIndex: 0
    },
    {
        image: "/images/bees/bee_npc.gif",
        x: 809,
        y: 374,
        flip: true,
        delay: Math.random() * 10,
        zIndex: 10
    },
    {
        image: "/images/bees/bee_banker.gif",
        x: 715,
        y: 374,
        flip: false,
        delay: Math.random() * (-10),
        zIndex: 10
    },
]