import { ID_HOUSE_HOTSPOTS } from "./app_ids";

export const HOUSE_VIEWPORT = {
  width: 960,
  height: 480,
};

export const HOUSE_HOTSPOTS = [
  // { id: ID_HOUSE_HOTSPOTS.GOLD, label: "GOLD", x: 192, y: 140, delay: 0 },
  { id: ID_HOUSE_HOTSPOTS.ANGLER, label: "DOCK", x: 168, y: 107, delay: 0.2, disableHoverSound: true },
  { id: ID_HOUSE_HOTSPOTS.GOLD_CHEST, label: "DAILY CHEST", x: 379, y: 31, delay: 0.4, disableHoverSound: true },
  { id: ID_HOUSE_HOTSPOTS.GARDNER, label: "GARDENER", x: 637, y: 144, delay: 0.6, disableHoverSound: true },
  { id: ID_HOUSE_HOTSPOTS.REFERRALS, label: "REFERRALS", x: 419, y: 225, delay: 0.8, disableHoverSound: true },
];

export const HOUSE_BEES = [
  {
    image: "/images/bees/fishingbee.gif",
    x: 100,
    y: 100,
    flip: true,
    delay: 0,
  },
  {
    image: "/images/bees/fishingbee.gif",
    x: 314,
    y: 392,
    flip: true,
    delay: 0.2,
  },
  {
    image: "/images/bees/bee.gif",
    x: 505,
    y: 145,
    flip: true,
    delay: 0.8,
  },
  {
    image: "/images/bees/bee.gif",
    x: 820,
    y: 360,
    flip: true,
    delay: 0.6,
  },
  {
    image: "/images/bees/farmerbee.gif",
    x: 684,
    y: 226,
    flip: false,
    delay: 0.4,
  },
];
