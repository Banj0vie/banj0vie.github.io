import { ID_TAVERN_HOTSPOTS } from "./app_ids";

export const TAVERN_VIEWPORT = {
    width: 960,
    height: 480,
};

export const TAVERN_HOTSPOTS = [
    { id: ID_TAVERN_HOTSPOTS.POTION, label: 'POTION SELLER', x: 655, y: 113, delay: 0 },
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
        image: "/images/bees/bee.gif",
        x: 117,
        y: 285,
        flip: true,
        delay: Math.random() * (-10),
        zIndex: 0
    },
    {
        image: "/images/bees/bee.gif",
        x: 566,
        y: 353,
        flip: false,
        delay: Math.random() * (-10),
        zIndex: 10
    },
    {
        image: "/images/bees/tavernbee.gif",
        x: 424,
        y: 113,
        flip: false,
        delay: Math.random() * (-10),
        zIndex: 0
    },
    {
        image: "/images/bees/tavernbee.gif",
        x: 704,
        y: 147,
        flip: false,
        delay: Math.random() * (-10),
        zIndex: 0
    },
    {
        image: "/images/bees/farmerbee.gif",
        x: 381,
        y: 299,
        flip: false,
        delay: Math.random() * (-10),
        zIndex: 10
    },
    {
        image: "/images/bees/fishingbee.gif",
        x: 599,
        y: 278,
        flip: false,
        delay: Math.random() * 10,
        zIndex: 4
    },
    {
        image: "/images/bees/bee.gif",
        x: 631,
        y: 353,
        flip: true,
        delay: Math.random() * (-10),
        zIndex: 10
    },
    {
        image: "/images/bees/bee.gif",
        x: 729,
        y: 210,
        flip: true,
        delay: Math.random() * (-10),
        zIndex: 10
    },
    {
        image: "/images/bees/bee.gif",
        x: 811,
        y: 285,
        flip: true,
        delay: Math.random() * (-10),
        zIndex: 0
    },
    {
        image: "/images/bees/bee.gif",
        x: 869,
        y: 359,
        flip: true,
        delay: Math.random() * 10,
        zIndex: 10
    },
    {
        image: "/images/bees/clerkbee.gif",
        x: 730,
        y: 364,
        flip: false,
        delay: Math.random() * (-10),
        zIndex: 10
    },
]