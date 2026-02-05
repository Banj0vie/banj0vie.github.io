import React, { useEffect, useState, useRef, useMemo } from "react";
import "./style.css";
import {
  FARM_PLOTS_PER_SIDE,
  FARM_POSITIONS,
} from "../../../constants/scene_farm";
import { ONE_SEED_HEIGHT, ONE_SEED_WIDTH } from "../../../constants/item_seed";
import { ALL_ITEMS } from "../../../constants/item_data";
import CropTooltip from "./CropTooltip";
import { getSetting } from "../../../utils/settings";

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
  const [isShowGrowthStage, setIsShowGrowthStage] = useState(false);
  // tooltipRef removed; portal rendering handled by CropTooltip
  const rootRef = useRef(null);
  const [portalContainer, setPortalContainer] = useState(null);
  const hoverAudioRef = useRef(null);
  const clickAudioRef = useRef(null);
  const isPreview = useMemo(() => {
    if (!crops || !data?.seedId || index >= crops.getLength()) return false;
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

  useEffect(() => {
    if (!hoverAudioRef.current) {
      hoverAudioRef.current = new Audio("/sounds/ButtonHover.wav");
      hoverAudioRef.current.preload = "auto";
    }
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio("/sounds/ButtonClick.wav");
      clickAudioRef.current.preload = "auto";
    }
  }, []);

  // Update growth progress
  useEffect(() => {
    if (cropArray && data.seedId) {
      const progress = cropArray.getGrowthProgress(index);
      setGrowthProgress(progress);
    }
  }, [cropArray, data.seedId, index]);

  // Load and listen for growth stage setting changes
  useEffect(() => {
    const loadGrowthStageSetting = () => {
      try {
        const setting = getSetting("isShowGrowthStage");
        setIsShowGrowthStage(setting);
      } catch (error) {
        console.error("Failed to load growth stage setting:", error);
        setIsShowGrowthStage(false);
      }
    };

    // Load initial setting
    loadGrowthStageSetting();

    // Listen for storage changes (when settings are updated in another tab/component)
    const handleStorageChange = (e) => {
      if (e.key === "cryptoValley_settings") {
        loadGrowthStageSetting();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically in case localStorage is updated without storage event
    const interval = setInterval(loadGrowthStageSetting, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (!data.seedId) return;
    // Compute tooltip position relative to the portal container (if present)
    if (portalContainer && portalContainer !== document.body) {
      const rect = portalContainer.getBoundingClientRect();
      // Calculate scale factors in case the container is transformed (scaled)
      const scaleX =
        rect.width && portalContainer.offsetWidth
          ? rect.width / portalContainer.offsetWidth
          : 1;
      const scaleY =
        rect.height && portalContainer.offsetHeight
          ? rect.height / portalContainer.offsetHeight
          : 1;
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
    const hoverAudio = hoverAudioRef.current;
    if (hoverAudio && !isDisabled) {
      hoverAudio.currentTime = 0;
      hoverAudio.play().catch(() => {});
    }
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
    left: FARM_POSITIONS[index].left,
    top: FARM_POSITIONS[index].top,
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

  // Calculate number of filled segments using same logic as sprite frame calculation
  const getFilledSegments = () => {
    if (!data.seedId || data.seedId === 0n) return 0;

    // Use the exact same logic as the sprite frame calculation
    if (data.growStatus === -1) {
      return 1; // newly planted
    } else if (data.growStatus === 2) {
      return 5; // ready frame (all 5 segments)
    } else {
      // growing: interpolate segments based on progress, same as sprite frames
      const clamped = Math.max(0, Math.min(0.999, growthProgress || 0));
      const segments = 1 + Math.floor(clamped * 4); // 1-5 segments based on progress
      return segments;
    }
  };

  const filledSegments = getFilledSegments();

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
            ? 0 - frameIndex * ONE_SEED_WIDTH
            : 0,
        backgroundPositionY:
          data.seedId && ALL_ITEMS[data.seedId]
            ? 0 - ALL_ITEMS[data.seedId].pos * ONE_SEED_HEIGHT
            : 0,
      }}
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

      {/* Growth stage indicator - 5 segments */}
      {isShowGrowthStage && data.seedId && data.seedId !== 0n && (
        <div className="growth-stage-indicator">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`growth-segment ${
                i <= filledSegments ? "filled" : ""
              }`}
            />
          ))}
        </div>
      )}

      {/* Tooltip rendered into portal container so it aligns with transformed parents */}
      {tooltipVisible &&
        data.seedId &&
        data.seedId !== 0n &&
        !isPreview &&
        portalContainer && (
          <CropTooltip
            container={portalContainer}
            pos={tooltipPos}
            data={data}
            growthProgress={growthProgress}
          />
        )}

      {/* Lock icon for disabled plots */}
      {isDisabled && (
        <div
          style={{
            position: "absolute",
            top: "70%", // Moved slightly down from 50%
            left: "40%",
            transform: "translate(-50%, -50%)",
            fontSize: "50px",
            color: "#666",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          🔒
        </div>
      )}

      {/* Potion effect indicators */}
      {/* {data.seedId && (data.produceMultiplierX1000 > 1000 || data.tokenMultiplierX1000 > 1000 || data.growthElixirApplied) && (
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
      )} */}

      <div
        data-hotspots="true"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className="bounding-box"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          if (isDisabled) {
            return; // Don't allow interaction with disabled plots
          }

          if (isPlanting && data.seedId) {
            return; // Don't allow planting on already planted plots
          }
          const clickAudio = clickAudioRef.current;
          if (clickAudio) {
            clickAudio.currentTime = 0;
            clickAudio.play().catch(() => {});
          }
          // Pass parameters in correct order: (isShift, index)
          // Don't update local highlighted state here - let parent handle it
          if (e.shiftKey) {
            onClick(true, index);
          } else {
            onClick(false, index);
          }
        }}
        style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
      ></div>
    </div>
  );
};

export default CropItem;
