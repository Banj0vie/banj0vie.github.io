import { ID_MARKET_HOTSPOTS } from "./app_ids";

export const MARKET_VIEWPORT = {
  width: 960,
  height: 480,
};

export const MARKET_HOTSPOTS = [
  { id: ID_MARKET_HOTSPOTS.VENDOR, label: 'VENDOR', x: 651, y: 275, delay: 0, disableHoverSound: true },
  { id: ID_MARKET_HOTSPOTS.DEX, label: '', labelImg: '/images/label/stats.png', x: 422, y: 252, delay: 0.4, disableHoverSound: true },
  { id: ID_MARKET_HOTSPOTS.BANKER, label: 'BANKER', x: 682, y: 124, delay: 0.6, disableHoverSound: true },
  // { id: ID_MARKET_HOTSPOTS.HELPER, label: 'HELPER', x: 360, y: 330, delay: 0.8 },
  { id: ID_MARKET_HOTSPOTS.MARKET, label: 'MARKET', x: 193, y: 288, delay: 0.2, disableHoverSound: true },
  { id: ID_MARKET_HOTSPOTS.LEADERBOARD, label: 'LEADERBOARD', x: 532, y: 105, delay: 0.4, disableHoverSound: true },
  { id: ID_MARKET_HOTSPOTS.SAGE, label: 'QUEEN', x: 239, y: 135, delay: 0.6, disableHoverSound: true },
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
    image: "/images/bees/queenbee.gif",
    x: 245,
    y: 150,
    flip: false,
    delay: 0,
  },
  {
    image: "/images/bees/farmerbee.gif",
    x: 283,
    y: 364,
    flip: false,
    delay: 4,
  },
  {
    image: "/images/bees/bee.gif",
    x: 400,
    y: 350,
    flip: false,
    delay: 8,
  },
  {
    image: "/images/bees/clerkbee.gif",
    x: 764,
    y: 185,
    flip: true,
    delay: 6,
  },
  {
    image: "/images/bees/vendorbee.gif",
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