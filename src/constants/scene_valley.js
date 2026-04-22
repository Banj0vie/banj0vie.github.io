import { ID_VALLEY_HOTSPOTS } from "./app_ids";

export const VALLEY_VIEWPORT = {
    width: 4128,
    height: 2640,
};

export const VALLEY_HOTSPOTS = [
    { id: ID_VALLEY_HOTSPOTS.HOUSE, label: 'HOUSE', x: 1054, y: 1856, delay: 0, link: "/house" },
    { id: ID_VALLEY_HOTSPOTS.FARM, label: 'FARM', x: 2537, y: 1304, delay: 0.5, link: "/farm" },
    { id: ID_VALLEY_HOTSPOTS.MARKET, label: 'MARKETPLACE', x: 2165, y: 1050, delay: 0.8, link: "/market" },
    { id: ID_VALLEY_HOTSPOTS.TAVERN, label: 'TAVERN', x: 1521, y: 437, delay: 0.1, link: "/tavern" },
    // { id: ID_VALLEY_HOTSPOTS.HERMITS_CAVE, label: "HERMIT'S CAVE", x: 380, y: 460, delay: 0, link: "/cave" },
];