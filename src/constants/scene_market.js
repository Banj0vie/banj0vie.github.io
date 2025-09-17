import { ID_MARKET_HOTSPOTS } from "./app_ids";

export const MARKET_VIEWPORT = {
  width: 960,
  height: 480,
};

export const MARKET_HOTSPOTS = [
  { id: ID_MARKET_HOTSPOTS.VENDOR, label: 'VENDOR', x: 564, y: 290, delay: 0 },
  { id: ID_MARKET_HOTSPOTS.DEX, label: 'DEX', x: 110, y: 230, delay: 0.4 },
  { id: ID_MARKET_HOTSPOTS.BANKER, label: 'BANKER', x: 780, y: 120, delay: 0.6 },
  { id: ID_MARKET_HOTSPOTS.HELPER, label: 'HELPER', x: 360, y: 330, delay: 0.8 },
  { id: ID_MARKET_HOTSPOTS.MARKET, label: 'MARKET', x: 280, y: 270, delay: 0.2 },
  { id: ID_MARKET_HOTSPOTS.LEADERBOARD, label: 'LEADERBOARD', x: 630, y: 120, delay: 0.4 },
  { id: ID_MARKET_HOTSPOTS.SAGE, label: 'SAGE', x: 444, y: -10, delay: 0.6 },
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