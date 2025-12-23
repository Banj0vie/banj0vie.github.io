import { ID_FARM_HOTSPOTS } from "./app_ids";

export const FARM_VIEWPORT = {
  width: 960,
  height: 480,
};

export const FARM_HOTSPOTS = [
  { id: ID_FARM_HOTSPOTS.FARMER, label: 'PLANT', x: 400, y: 150, delay: 0 },
];

export const FARM_BEES = [
  {
    image: "/images/bees/bee_2.png",
    x: 425,
    y: 200,
    flip: false,
    delay: 0,
  },
];
// Left plot positioning
export const FARM_LEFT_PLOT_START_X = 108;
export const FARM_LEFT_PLOT_START_Y = 116;
export const FARM_LEFT_PLOT_WIDTH = 320; // 5 columns * 64px
export const FARM_LEFT_PLOT_HEIGHT = 192; // 3 rows * 64px

// Right plot positioning  
export const FARM_RIGHT_PLOT_START_X = 525; // Moved further left to reduce empty space
export const FARM_RIGHT_PLOT_START_Y = 120;
export const FARM_RIGHT_PLOT_WIDTH = 320; // 5 columns * 64px
export const FARM_RIGHT_PLOT_HEIGHT = 192; // 3 rows * 64px

// Central path
export const FARM_CENTRAL_PATH_X = 460; // Between the two plots
export const FARM_CENTRAL_PATH_Y = 116;
export const FARM_CENTRAL_PATH_WIDTH = 40;

// Individual crop dimensions
export const FARM_CROP_WIDTH = 64;
export const FARM_CROP_HEIGHT = 64;
export const FARM_GRID_COLS = 5; // 5 columns per plot
export const FARM_GRID_ROWS = 3; // 3 rows per plot

// Total plots per side
export const FARM_PLOTS_PER_SIDE = 15; // 5 * 3
export const FARM_TOTAL_PLOTS = 30; // 15 * 2
