import { ID_MARKET_HOTSPOTS } from "./app_ids";

export const MARKET_VIEWPORT = {
  width: 960,
  height: 480,
};

export const MARKET_HOTSPOTS = [
  { id: ID_MARKET_HOTSPOTS.VENDOR, label: 'VENDOR', x: 571, y: 265, delay: 0 },
  { id: ID_MARKET_HOTSPOTS.DEX, label: 'DEX', x: 377, y: 222, delay: 0.4 },
  { id: ID_MARKET_HOTSPOTS.BANKER, label: 'BANKER', x: 637, y: 79, delay: 0.6 },
  // { id: ID_MARKET_HOTSPOTS.HELPER, label: 'HELPER', x: 360, y: 330, delay: 0.8 },
  { id: ID_MARKET_HOTSPOTS.MARKET, label: 'MARKET', x: 148, y: 283, delay: 0.2 },
  { id: ID_MARKET_HOTSPOTS.LEADERBOARD, label: 'LEADERBOARD', x: 487, y: 135, delay: 0.4 },
  { id: ID_MARKET_HOTSPOTS.SAGE, label: 'QUEEN', x: 204, y: -10, delay: 0.6 },
];

export const MARKET_STUFFS = [
    {
        image: "/images/market/flag.gif",
        x: 279,
        y: 24,
        width: 49,
        height: 34,
        zIndex: 0,
    },
]

export const MARKET_BEES = [
  {
    image: "/images/bees/bee_npc.gif",
    x: 442,
    y: -10,
    flip: true,
    delay: 2,
  },
  {
    image: "/images/bees/bee_queen.gif",
    x: 270,
    y: 150,
    flip: false,
    delay: 0,
  },
  {
    image: "/images/bees/bee_2.png",
    x: 283,
    y: 364,
    flip: false,
    delay: 4,
  },
  {
    image: "/images/bees/bee_npc.gif",
    x: 400,
    y: 350,
    flip: false,
    delay: 8,
  },
  {
    image: "/images/bees/bee_banker.gif",
    x: 764,
    y: 185,
    flip: true,
    delay: 6,
  },
  {
    image: "/images/bees/bee_vendor.gif",
    x: 755,
    y: 307,
    flip: false,
    delay: 6,
  },  
];
export const PRIZES = [
  [
    {
      label: "Golden Chests",
      count: 20,
      highlighted: true,
    },
    {
      label: "Fertilizer III",
      count: 3,
      highlighted: false,
    },
  ],
  [
    {
      label: "Golden Chests",
      count: 15,
      highlighted: true,
    },
    {
      label: "Fertilizer III",
      count: 2,
      highlighted: false,
    },
  ],
  [
    {
      label: "Golden Chests",
      count: 12,
      highlighted: true,
    },
    {
      label: "Fertilizer II",
      count: 1,
      highlighted: false,
    },
  ],
  [
    {
      label: "Golden Chests",
      count: 9,
      highlighted: true,
    },
    {
      label: "Fertilizer II",
      count: 1,
      highlighted: false,
    },
  ],
  [
    {
      label: "Golden Chests",
      count: 6,
      highlighted: true,
    },
    {
      label: "Fertilizer II",
      count: 1,
      highlighted: false,
    },
  ],
]