import { ID_FARM_HOTSPOTS } from "./app_ids";

export const FARM_VIEWPORT = {
  width: 1380,
  height: 690,
};

export const FARM_HOTSPOTS = [
  { id: ID_FARM_HOTSPOTS.FARMER, label: 'PLANT', x: 650, y: 240, delay: 0 },
];

export const FARM_BEES = [
  {
    image: "/images/bees/bee_2.png",
    x: 675,
    y: 290,
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

export const FARM_POSITIONS = [

  { left: 455, top: 141, },
  { left: 371, top: 141, },
  { left: 484, top: 194, },
  { left: 413, top: 194, },
  { left: 341, top: 194, },
  { left: 529, top: 245, },
  { left: 471, top: 245, },
  { left: 413, top: 245, },
  { left: 354, top: 245, },
  { left: 295, top: 245, },
  { left: 484, top: 297, },
  { left: 413, top: 297, },
  { left: 341, top: 297, },
  { left: 455, top: 350, },
  { left: 371, top: 350, },
  { left: 898, top: 141, },
  { left: 814, top: 141, },
  { left: 927, top: 194, },
  { left: 856, top: 194, },
  { left: 784, top: 194, },
  { left: 972, top: 245, },
  { left: 914, top: 245, },
  { left: 856, top: 245, },
  { left: 797, top: 245, },
  { left: 738, top: 245, },
  { left: 927, top: 297, },
  { left: 856, top: 297, },
  { left: 784, top: 297, },
  { left: 898, top: 350, },
  { left: 814, top: 350, },
]