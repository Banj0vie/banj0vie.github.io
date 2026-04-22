import { ID_FARM_HOTSPOTS } from "./app_ids";

export const FARM_VIEWPORT = {
  width: 1380,
  height: 690,
};

export const FARM_HOTSPOTS = [
  { id: ID_FARM_HOTSPOTS.FARMER, label: 'Mission Board', x: 595, y: 90, delay: 0 },
];

export const FARM_BEES = [];
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

  { left: 420, top: 111, },
  { left: 336, top: 111, },
  { left: 449, top: 164, },
  { left: 378, top: 164, },
  { left: 306, top: 164, },
  { left: 494, top: 215, },
  { left: 436, top: 215, },
  { left: 378, top: 215, },
  { left: 319, top: 215, },
  { left: 260, top: 215, },
  { left: 449, top: 267, },
  { left: 378, top: 267, },
  { left: 306, top: 267, },
  { left: 420, top: 320, },
  { left: 336, top: 320, },
  { left: 903, top: 111, },
  { left: 819, top: 111, },
  { left: 932, top: 164, },
  { left: 861, top: 164, },
  { left: 789, top: 164, },
  { left: 977, top: 215, },
  { left: 919, top: 215, },
  { left: 861, top: 215, },
  { left: 802, top: 215, },
  { left: 743, top: 215, },
  { left: 932, top: 267, },
  { left: 861, top: 267, },
  { left: 789, top: 267, },
  { left: 903, top: 320, },
  { left: 819, top: 320, },
]