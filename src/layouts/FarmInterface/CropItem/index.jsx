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
  const clickAudioRef = useRef(null);
  const [showDebug, setShowDebug] = useState(() => localStorage.getItem('show_debug_labels') !== 'false');
  const [plotPrep, setPlotPrep] = useState(() => JSON.parse(localStorage.getItem('sandbox_plot_prep') || '{}'));

  useEffect(() => {
    const handlePrepUpdate = (e) => setPlotPrep(e.detail);
    window.addEventListener('plotPrepUpdated', handlePrepUpdate);
    return () => window.removeEventListener('plotPrepUpdated', handlePrepUpdate);
  }, []);

  useEffect(() => {
    const handler = (e) => setShowDebug(e.detail);
    window.addEventListener('toggleDebugLabels', handler);
    return () => window.removeEventListener('toggleDebugLabels', handler);
  }, []);

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
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio("/sounds/ButtonHover.wav");
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

    // Determine offset direction based on cursor position on screen
    const isBottomHalf = e.clientY > window.innerHeight / 2;
    const xOffset = 25; // Middle to the right
    const yOffset = isBottomHalf ? -130 : 20; // Bottom goes to top, top goes to bottom

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
      const localX = (e.clientX - rect.left) / (scaleX || 1) + xOffset;
      const localY = (e.clientY - rect.top) / (scaleY || 1) + yOffset;
      setTooltipPos({ x: localX, y: localY, isBottomHalf });
      return;
    }

    // Fallback: position relative to viewport (use fixed positioning)
    const x = e.clientX + xOffset;
    const y = e.clientY + yOffset;
    setTooltipPos({ x, y, isBottomHalf });
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
    if (!data.seedId || data.seedId === 0n) {
      if (plotPrep[index]?.status === 3) return "empty";
      return "prep-stage";
    }
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
      frameIndex = 0; // newly planted (sign)
    } else if (data.growStatus === 2) {
      frameIndex = FRAMES_PER_SEED - 1; // ready frame
    } else {
      // growing: interpolate frames based on progress, keep last frame for ready
      const clamped = Math.max(0, Math.min(0.999, growthProgress || 0));
      frameIndex = Math.floor(clamped * (FRAMES_PER_SEED - 1));
    }
  }

  // Calculate number of filled segments using same logic as sprite frame calculation
  const getFilledSegments = () => {
    if (!data.seedId || data.seedId === 0n) return 0;

    // Use the exact same logic as the sprite frame calculation
    if (data.growStatus === -1) {
      return 0; // newly planted
    } else if (data.growStatus === 2) {
      return 5; // ready frame (all 5 segments)
    } else {
      // growing: interpolate segments based on progress, same as sprite frames
      const clamped = Math.max(0, Math.min(0.999, growthProgress || 0));
      return Math.floor(clamped * 5); // 0-4 segments based on progress
    }
  };

  const filledSegments = getFilledSegments();
  
  const prep = plotPrep[index] || { status: 0 };
  const isPrepStage = (!data.seedId || data.seedId === 0n) && prep.status !== 3;

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
        backgroundImage: isPrepStage ? 'none' : undefined,
        backgroundColor: isPrepStage ? 'transparent' : undefined,
      }}
    >
      {/* --- DEBUG: PLOT INDEX LABEL --- */}
      {showDebug && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: '#ff00ff',
          border: '1px solid #ff00ff',
          padding: '2px 6px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 10000,
          pointerEvents: 'none'
        }}>
          Plot: {index}
        </div>
      )}

      {/* Prep Stage Overlays */}
      {!isDisabled && isPrepStage && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
          {prep.status === 0 && (
            <div style={{ fontSize: '40px', color: '#ff4444', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>❌</div>
          )}
          {prep.status === 1 && (
            <div style={{ width: '40px', height: '15px', backgroundColor: '#1a1008', borderRadius: '50%', border: '2px solid #000', boxShadow: 'inset 0 5px 10px rgba(0,0,0,0.8)' }}></div>
          )}
          {prep.status === 2 && (
            <div style={{ position: 'relative', width: '40px', height: '15px', backgroundColor: '#1a1008', borderRadius: '50%', border: '2px solid #000', boxShadow: 'inset 0 5px 10px rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src={ALL_ITEMS[prep.fishId]?.image} alt="fish" style={{ width: '35px', height: '35px', position: 'absolute', top: '-15px', transform: 'rotate(-20deg)', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }} />
            </div>
          )}
        </div>
      )}

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

      {/* Bug indicator and countdown */}
      {data.bugCountdown !== undefined && data.bugCountdown > 0 && (
        <div 
          className="bug-container"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('squashBug', { detail: { plotIndex: index } }));
          }}
          style={{
            position: "absolute",
            top: "35%", // Overlay directly on the plant
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999, // Ensure it's above the bounding box
            cursor: "crosshair",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "auto" // Make sure it captures clicks
          }}
        >
          <div style={{
            color: '#ff4444',
            fontWeight: 'bold',
            fontSize: '18px', // Slightly larger so it's easier to see
            textShadow: '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black',
            marginBottom: '-5px',
            zIndex: 31
          }}>
            {data.bugCountdown}s
          </div>
          <img
            src="/images/bug/bug.jpg"
            alt="bug"
            style={{ 
              width: "45px", // Slightly bigger bug
              height: "45px",
              filter: "drop-shadow(0px 0px 5px rgba(255,0,0,0.8))" // Add a glowing red shadow to make it pop
            }}
          />
        </div>
      )}

      {/* Crow indicator and countdown */}
      {data.crowCountdown !== undefined && data.crowCountdown > 0 && (
        <div 
          className="crow-container"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('scareCrow', { detail: { plotIndex: index } }));
          }}
          style={{
            position: "absolute",
            top: "35%", 
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999, 
            cursor: "crosshair",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "auto",
            animation: "crowFlyIn 1.2s ease-out forwards"
          }}
        >
          <style>{`
            @keyframes ratAppear {
              0% { top: 35%; left: -200px; transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
              100% { top: 35%; left: 50%; transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
          `}</style>
          <div style={{
            color: '#ff4444',
            fontWeight: 'bold',
            fontSize: '18px',
            textShadow: '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black',
            marginBottom: '-5px',
            zIndex: 31
          }}>
            {data.crowCountdown}s
          </div>
          <img
            src="/images/crow/crow.jpg"
            alt="crow"
            style={{ 
              width: "55px", // Make the crow slightly larger than the bug!
              height: "55px",
              filter: "drop-shadow(0px 0px 5px rgba(255,0,0,0.8))"
            }}
          />
        </div>
      )}

      {/* Rat indicator and countdown */}
      {data.ratCountdown !== undefined && data.ratCountdown > 0 && (
        <div 
          className="rat-container"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('scareRat', { detail: { plotIndex: index } }));
          }}
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999, 
            cursor: "crosshair",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "auto",
            animation: "ratAppear 0.8s ease-out forwards"
          }}
        >
          <div style={{
            color: '#ff4444',
            fontWeight: 'bold',
            fontSize: '18px',
            textShadow: '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black',
            marginBottom: '-5px',
            zIndex: 31
          }}>
            {data.ratCountdown}s
          </div>
          <img
            src="/images/bug/rat.png"
            alt="rat"
            style={{ width: "45px", height: "45px", filter: "drop-shadow(0px 0px 5px rgba(255,0,0,0.8))" }}
          />
        </div>
      )}
      {/* Status Indicator */}
      {(data.needsWater || data.growStatus === 2) && (
        <div style={{
          position: "absolute",
          top: "-25px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          pointerEvents: "none",
          animation: "statusBounce 1.5s infinite"
        }}>
          <style>{`@keyframes statusBounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-10px); } }`}</style>
          <div style={{ fontSize: '28px', filter: 'drop-shadow(0px 2px 2px black)' }}>
            {data.growStatus === 2 ? '✅' : ((data.bugCountdown > 0 || data.crowCountdown > 0 || data.ratCountdown > 0) ? '❗' : '💧')}
          </div>
        </div>
      )}
    </div>
  );
};

export default CropItem;
