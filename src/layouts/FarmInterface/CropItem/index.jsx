import React, { useEffect, useState, useRef, useMemo } from "react";
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
import { ONE_SEED_HEIGHT } from "../../../constants/item_seed";
import { ALL_ITEMS } from "../../../constants/item_data";
import CropTooltip from "./CropTooltip";

const CropItem = ({
  data,
  index,
  onClick,
  jiggling = false,
  isPlanting = true,
  cropArray,
  crops,
  isDisabled = false,
  maxPlots = 15,
  selectedIndexes = [], // Add selectedIndexes prop to sync with parent state
}) => {
  const [highlighted, setHighlighted] = useState(false);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  // tooltipRef removed; portal rendering handled by CropTooltip
  const rootRef = useRef(null);
  const [portalContainer, setPortalContainer] = useState(null);
  const isPreview = useMemo(() => {
    if(!crops || !data?.seedId || index >= crops.getLength()) return false;
    return crops.getItem(index).seedId !== data.seedId;
  }, [crops, data?.seedId, index]);

  useEffect(() => {
    if (isPlanting) {
      setHighlighted(false);
    } else {
      // Sync local highlighted state with parent selectedIndexes
      setHighlighted(selectedIndexes.includes(index));
    }
  }, [isPlanting, selectedIndexes, index]);

  // Update growth progress
  useEffect(() => {
    if (cropArray && data.seedId) {
      const progress = cropArray.getGrowthProgress(index);
      setGrowthProgress(progress);
    }
  }, [cropArray, data.seedId, index]);

  const handleMouseMove = (e) => {
    if (!data.seedId) return;
    // Compute tooltip position relative to the portal container (if present)
    if (portalContainer && portalContainer !== document.body) {
      const rect = portalContainer.getBoundingClientRect();
      // Calculate scale factors in case the container is transformed (scaled)
      const scaleX = rect.width && portalContainer.offsetWidth ? rect.width / portalContainer.offsetWidth : 1;
      const scaleY = rect.height && portalContainer.offsetHeight ? rect.height / portalContainer.offsetHeight : 1;
      // Map client coordinates into container local coordinates by dividing by scale
      const localX = (e.clientX - rect.left) / (scaleX || 1) + 12;
      const localY = (e.clientY - rect.top) / (scaleY || 1) + 12;
      setTooltipPos({ x: localX, y: localY });
      return;
    }

    // Fallback: position relative to viewport (use fixed positioning)
    const x = e.clientX + 12; // slight offset
    const y = e.clientY + 12;
    setTooltipPos({ x, y });
  };

  const handleMouseEnter = (e) => {
    if (!data.seedId) return;
    setTooltipVisible(true);
    // Ensure portal container is resolved before computing position
    if (!portalContainer && rootRef.current) {
      // find nearest ancestor that has a transform (so tooltip lives in same transformed space)
      let el = rootRef.current.parentElement;
      let found = null;
      while (el) {
        const style = window.getComputedStyle(el);
        if (style.transform && style.transform !== "none") {
          found = el;
          break;
        }
        el = el.parentElement;
      }
      setPortalContainer(found || document.body);
    }
    handleMouseMove(e);
  };

  const handleMouseLeave = () => {
    setTooltipVisible(false);
  };

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
      : FARM_RIGHT_PLOT_START_X +
        FARM_CROP_WIDTH * (plotIndex % FARM_GRID_COLS),
    top: isLeftPlot
      ? FARM_LEFT_PLOT_START_Y +
        FARM_CROP_HEIGHT * Math.floor(plotIndex / FARM_GRID_COLS)
      : FARM_RIGHT_PLOT_START_Y +
        FARM_CROP_HEIGHT * Math.floor(plotIndex / FARM_GRID_COLS),
  };

  // Determine sprite frame based on growth progress for smoother, real-time stages
  const FRAMES_PER_SEED = 6; // total frames across X for one seed line
  let frameIndex = 0;
  if (data.seedId && ALL_ITEMS[data.seedId]) {
    if (data.growStatus === -1) {
      frameIndex = 1; // newly planted
    } else if (data.growStatus === 2) {
      frameIndex = FRAMES_PER_SEED - 1; // ready frame
    } else {
      // growing: interpolate frames based on progress, keep last frame for ready
      const clamped = Math.max(0, Math.min(0.999, growthProgress || 0));
      frameIndex = 1 + Math.floor(clamped * (FRAMES_PER_SEED - 2));
    }
  }

  return (
    <div
      ref={rootRef}
      className={`crop-item ${getStatusClass()} ${
        jiggling && data.growStatus < 1 ? "jiggling" : ""
      } ${highlighted ? "selected" : ""}`}
      style={{
        ...position,
        backgroundPositionX:
          data.seedId && ALL_ITEMS[data.seedId]
            ? 0 - frameIndex * ONE_SEED_HEIGHT
            : 0,
        backgroundPositionY:
          data.seedId && ALL_ITEMS[data.seedId]
            ? 0 - ALL_ITEMS[data.seedId].pos * ONE_SEED_HEIGHT
            : 0,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Growth progress bar */}
      {data.seedId && data.seedId !== 0n && (
        <div className="growth-progress">
          <div
            className="growth-bar"
            style={{ width: `${growthProgress * 100}%` }}
          ></div>
        </div>
      )}

      {/* Tooltip rendered into portal container so it aligns with transformed parents */}
      {tooltipVisible && data.seedId && data.seedId !== 0n && !isPreview && portalContainer && (
        <CropTooltip container={portalContainer} pos={tooltipPos} data={data} growthProgress={growthProgress} />
      )}

      {/* Lock icon for disabled plots */}
      {isDisabled && (
        <div
          style={{
            position: "absolute",
            top: "73%", // Moved slightly down from 50%
            left: "51%",
            transform: "translate(-50%, -50%)",
            fontSize: "10px",
            color: "#666",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          🔒
        </div>
      )}

      {/* Potion effect indicators */}
      {data.seedId && (data.produceMultiplierX1000 > 1000 || data.tokenMultiplierX1000 > 1000 || data.growthElixirApplied) && (
        <div className="potion-effects">
          {data.produceMultiplierX1000 > 1000 && (
            <div className="potion-indicator pesticide-indicator" title="Pesticide Active">
              🌱
            </div>
          )}
          {data.tokenMultiplierX1000 > 1000 && (
            <div className="potion-indicator fertilizer-indicator" title="Fertilizer Active">
              💰
            </div>
          )}
          {data.growthElixirApplied && (
            <div className="potion-indicator growth-indicator" title="Growth Elixir Active">
              ⏱️
            </div>
          )}
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
            index,
          });
          if (isPlanting && data.seedId) {
            return; // Don't allow planting on already planted plots
          }
          // Pass parameters in correct order: (isShift, index)
          // Don't update local highlighted state here - let parent handle it
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
