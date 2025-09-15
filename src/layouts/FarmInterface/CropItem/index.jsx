import React, { useEffect, useState } from "react";
import "./style.css";
import {
  FARM_CROP_HEIGHT,
  FARM_CROP_WIDTH,
  FARM_LEFT_PLOT_START_X,
  FARM_LEFT_PLOT_START_Y,
  FARM_RIGHT_PLOT_START_X,
  FARM_RIGHT_PLOT_START_Y,
  FARM_GRID_COLS,
  FARM_PLOTS_PER_SIDE,
} from "../../../constants/scene_farm";
import { ONE_SEED_HEIGHT, SEEDS } from "../../../constants/item_seed";

const CropItem = ({
  data,
  index,
  onClick,
  jiggling = false,
  isPlanting = true,
  cropArray,
  isDisabled = false,
  maxPlots = 12,
}) => {
  const [highlighted, setHighlighted] = useState(false);
  const [growthProgress, setGrowthProgress] = useState(0);
  
  useEffect(() => {
    if (isPlanting) {
      setHighlighted(false);
    }
  }, [isPlanting]);

  // Update growth progress
  useEffect(() => {
    if (cropArray && data.seedId) {
      const progress = cropArray.getGrowthProgress(index);
      setGrowthProgress(progress);
    }
  }, [cropArray, data.seedId, index]);

  const getStatusClass = () => {
    if (isDisabled) return "disabled";
    if (!data.seedId) return "empty";
    if (data.growStatus === -1) return "newly-planted";
    if (data.growStatus === 1) return "growing";
    if (data.growStatus === 2) return "ready-to-harvest";
    return "harvested";
  };

  // Determine which plot this crop belongs to (left or right)
  const isLeftPlot = index < FARM_PLOTS_PER_SIDE;
  const plotIndex = isLeftPlot ? index : index - FARM_PLOTS_PER_SIDE;
  
  const position = {
    left: isLeftPlot 
      ? FARM_LEFT_PLOT_START_X + FARM_CROP_WIDTH * (plotIndex % FARM_GRID_COLS)
      : FARM_RIGHT_PLOT_START_X + FARM_CROP_WIDTH * (plotIndex % FARM_GRID_COLS),
    top: isLeftPlot
      ? FARM_LEFT_PLOT_START_Y + FARM_CROP_HEIGHT * Math.floor(plotIndex / FARM_GRID_COLS)
      : FARM_RIGHT_PLOT_START_Y + FARM_CROP_HEIGHT * Math.floor(plotIndex / FARM_GRID_COLS),
  };

  return (
    <div
      className={`crop-item ${getStatusClass()} ${
        jiggling && data.growStatus < 1 ? "jiggling" : ""
      } ${highlighted ? "selected" : ""}`}
      style={{
        ...position,
        backgroundPositionX: data.seedId && SEEDS[data.seedId]
          ? 0 - (data.growStatus === -1 ? 1 : data.growStatus) * ONE_SEED_HEIGHT
          : 0,
        backgroundPositionY: data.seedId && SEEDS[data.seedId]
          ? 0 - SEEDS[data.seedId].pos * ONE_SEED_HEIGHT
          : 0,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      {/* Growth progress bar */}
      {data.seedId && data.growStatus === 1 && (
        <div className="growth-progress">
          <div 
            className="growth-bar" 
            style={{ width: `${growthProgress * 100}%` }}
          ></div>
        </div>
      )}
      
      {/* Lock icon for disabled plots */}
        {isDisabled && (
          <div
            style={{
              position: 'absolute',
              top: '73%', // Moved slightly down from 50%
              left: '51%',
              transform: 'translate(-50%, -50%)',
              fontSize: '10px',
              color: '#666',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            🔒
          </div>
        )}
      
      <div
        data-hotspots="true"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className="bounding-box"
        onClick={(e) => {
          if (isDisabled) {
            return; // Don't allow interaction with disabled plots
          }
          console.log(`CropItem ${index} clicked:`, {
            isDisabled,
            isPlanting,
            data,
            index
          });
          if (isPlanting && data.seedId) {
            return; // Don't allow planting on already planted plots
          }
          // Allow clicking empty plots when planting, and planted plots when harvesting
          if (!isPlanting) {
            setHighlighted(!highlighted);
          }
          // Pass parameters in correct order: (isShift, index)
          if (e.shiftKey) {
            onClick(true, index);
          } else {
            onClick(false, index);
          }
        }}
      ></div>
    </div>
  );
};

export default CropItem;
