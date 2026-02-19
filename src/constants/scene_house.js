import { ID_HOUSE_HOTSPOTS } from "./app_ids";

export const HOUSE_VIEWPORT = {
  width: 960,
  height: 480,
};

export const HOUSE_HOTSPOTS = [
  // { id: ID_HOUSE_HOTSPOTS.GOLD, label: "GOLD", x: 192, y: 140, delay: 0 },
  { id: ID_HOUSE_HOTSPOTS.ANGLER, label: "ANGLER", x: 228, y: 327, delay: 0.2 },
  { id: ID_HOUSE_HOTSPOTS.GOLD_CHEST, label: "DAILY CHEST", x: 378, y: 112, delay: 0.4 },
  { id: ID_HOUSE_HOTSPOTS.GARDNER, label: "GARDENER", x: 634, y: 130, delay: 0.6 },
  { id: ID_HOUSE_HOTSPOTS.REFERRALS, label: "REFERRALS", x: 419, y: 300, delay: 0.8 },
];

export const HOUSE_BEES = [
  {
    image: "/images/bees/bee_npc.gif",
    x: 100,
    y: 100,
    flip: false,
    delay: 0,
  },
  {
    image: "/images/bees/bee_npc.gif",
    x: 314,
    y: 392,
    flip: false,
    delay: 0.2,
  },
  {
    image: "/images/bees/bee_npc.gif",
    x: 505,
    y: 145,
    flip: true,
    delay: 0.8,
  },
  {
    image: "/images/bees/bee_npc.gif",
    x: 820,
    y: 400,
    flip: true,
    delay: 0.6,
  },
  {
    image: "/images/bees/bee_2.png",
    x: 684,
    y: 241,
    flip: false,
    delay: 0.4,
  },
];
