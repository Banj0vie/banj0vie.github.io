import React, { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import "./style.css";
import {
  FARM_PLOTS_PER_SIDE,
  FARM_POSITIONS,
} from "../../../constants/scene_farm";
import { ONE_SEED_HEIGHT, ONE_SEED_WIDTH } from "../../../constants/item_seed";
import { ALL_ITEMS } from "../../../constants/item_data";
import CropTooltip from "./CropTooltip";
import { getSetting, defaultSettings } from "../../../utils/settings";
import { useAppSelector } from "../../../solana/store";
import { selectSettings } from "../../../solana/store/slices/uiSlice";
import { clampVolume } from "../../../utils/basic";

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
  const [isHovered, setIsHovered] = useState(false);
  const [pestJustKilled, setPestJustKilled] = useState(false);
  const pestKillTimerRef = useRef(null);
  const prevBugCountdownRef = useRef(data.bugCountdown);
  const prevCrowCountdownRef = useRef(data.crowCountdown);
  const [crowLanded, setCrowLanded] = useState(false);
  const crowLandedTimerRef = useRef(null);
  const [crowScreenPos, setCrowScreenPos] = useState(null);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isShowGrowthStage, setIsShowGrowthStage] = useState(false);
  // tooltipRef removed; portal rendering handled by CropTooltip
  const rootRef = useRef(null);
  const [portalContainer, setPortalContainer] = useState(null);
  const clickAudioRef = useRef(null);
  const settings = useAppSelector(selectSettings) || defaultSettings;
  const [showDebug, setShowDebug] = useState(() => localStorage.getItem('show_debug_labels') !== 'false');
  const [plotPrep, setPlotPrep] = useState(() => JSON.parse(localStorage.getItem('sandbox_plot_prep') || '{}'));
  const [soilColor, setSoilColor] = useState(() => localStorage.getItem('sandbox_active_soil_color') || null);
  const [digPhase, setDigPhase] = useState('none');
  const [waterPhase, setWaterPhase] = useState('none');
  const [checkmarkPhase, setCheckmarkPhase] = useState('none');
  const prevNeedsWaterRef = useRef(data.needsWater);
  const prevGrowStatusRef = useRef(data.growStatus);
  const waterTimerRef = useRef(null);
  const waterDebounceRef = useRef(null);
  const checkmarkTimerRef = useRef(null);
  const prevStatusRef = useRef(() => {
    const stored = JSON.parse(localStorage.getItem('sandbox_plot_prep') || '{}');
    return stored[index]?.status ?? 0;
  });
  const prevAnimStatusRef = useRef(null);
  const digTimersRef = useRef([]);

  useEffect(() => {
    const init = JSON.parse(localStorage.getItem('sandbox_plot_prep') || '{}');
    prevStatusRef.current = init[index]?.status ?? 0;
  }, [index]);

  useEffect(() => {
    if (prevNeedsWaterRef.current === true && data.needsWater === false) {
      // Debounce: only animate if needsWater stays false for 80ms (ignores crop-placement flickers)
      clearTimeout(waterDebounceRef.current);
      waterDebounceRef.current = setTimeout(() => {
        clearTimeout(waterTimerRef.current);
        setWaterPhase('shrink');
        waterTimerRef.current = setTimeout(() => setWaterPhase('none'), 220);
      }, 80);
    } else if (data.needsWater === true) {
      clearTimeout(waterDebounceRef.current);
    }

    const wasHarvesting = prevGrowStatusRef.current === 2 && data.growStatus !== 2;
    if (wasHarvesting) {
      clearTimeout(checkmarkTimerRef.current);
      setCheckmarkPhase('shrink');
      checkmarkTimerRef.current = setTimeout(() => setCheckmarkPhase('none'), 220);
    }

    prevNeedsWaterRef.current = data.needsWater;
    prevGrowStatusRef.current = data.growStatus;
  }, [data.needsWater, data.growStatus]);

  useEffect(() => {
    return () => {
      clearTimeout(waterTimerRef.current);
      clearTimeout(waterDebounceRef.current);
      clearTimeout(checkmarkTimerRef.current);
      clearTimeout(pestKillTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const bugKilled = prevBugCountdownRef.current > 0 && !(data.bugCountdown > 0);
    const crowKilled = prevCrowCountdownRef.current > 0 && !(data.crowCountdown > 0);
    if (bugKilled || crowKilled) {
      setPestJustKilled(true);
      clearTimeout(pestKillTimerRef.current);
      pestKillTimerRef.current = setTimeout(() => setPestJustKilled(false), 600);
    }
    prevBugCountdownRef.current = data.bugCountdown;
    prevCrowCountdownRef.current = data.crowCountdown;
  }, [data.bugCountdown, data.crowCountdown]);

  useEffect(() => {
    const handlePrepUpdate = (e) => {
      const newPrep = e.detail;
      const prevStatus = typeof prevStatusRef.current === 'function' ? prevStatusRef.current() : prevStatusRef.current;
      const newStatus = newPrep[index]?.status ?? 0;

      if (prevStatus === 0 && newStatus === 1) {
        digTimersRef.current.forEach(clearTimeout);
        digTimersRef.current = [];
        setDigPhase('x-shrink');
        digTimersRef.current.push(setTimeout(() => setDigPhase('hole-appear'), 180));
        digTimersRef.current.push(setTimeout(() => setDigPhase('none'), 500));
      } else if ((prevStatus === 1 || prevStatus === 2) && newStatus === 3) {
        digTimersRef.current.forEach(clearTimeout);
        digTimersRef.current = [];
        prevAnimStatusRef.current = prevStatus;
        setDigPhase('hole-shrink');
        digTimersRef.current.push(setTimeout(() => setDigPhase('dirt-appear'), 180));
        digTimersRef.current.push(setTimeout(() => setDigPhase('none'), 500));
      } else if (prevStatus === 3 && newStatus === 0) {
        // Crop harvested → wait for checkmark to scale down, then X scales in
        digTimersRef.current.forEach(clearTimeout);
        digTimersRef.current = [];
        setDigPhase('x-hidden');
        digTimersRef.current.push(setTimeout(() => setDigPhase('x-appear'), 220));
        digTimersRef.current.push(setTimeout(() => setDigPhase('none'), 440));
      }

      prevStatusRef.current = newStatus;
      setPlotPrep(newPrep);
    };
    window.addEventListener('plotPrepUpdated', handlePrepUpdate);
    return () => {
      window.removeEventListener('plotPrepUpdated', handlePrepUpdate);
      digTimersRef.current.forEach(clearTimeout);
    };
  }, [index]);

  useEffect(() => {
    const handler = (e) => setShowDebug(e.detail);
    window.addEventListener('toggleDebugLabels', handler);
    return () => window.removeEventListener('toggleDebugLabels', handler);
  }, []);

  useEffect(() => {
    const handler = () => setSoilColor(localStorage.getItem('sandbox_active_soil_color') || null);
    window.addEventListener('farmSoilChanged', handler);
    return () => window.removeEventListener('farmSoilChanged', handler);
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
    setGrowthProgress(0);
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
    setIsHovered(true);
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
      setPortalContainer(document.body);
    }
    handleMouseMove(e);
  };

  const handleMouseLeave = () => {
    setTooltipVisible(false);
    setIsHovered(false);
  };

  // Switch from flying to pecking after fly-in animation completes
  useEffect(() => {
    if (data.crowCountdown > 0) {
      // Calculate screen position of this crop-item for portal rendering
      if (rootRef.current) {
        const rect = rootRef.current.getBoundingClientRect();
        setCrowScreenPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.35, plotCX: rect.left + rect.width / 2 - 15, plotCY: rect.top + rect.height * 0.55 + 20 });
      }
      setCrowLanded(false);
      clearTimeout(crowLandedTimerRef.current);
      crowLandedTimerRef.current = setTimeout(() => setCrowLanded(true), 4800);
    } else {
      setCrowLanded(false);
      setCrowScreenPos(null);
      clearTimeout(crowLandedTimerRef.current);
    }
    return () => clearTimeout(crowLandedTimerRef.current);
  }, [data.crowCountdown > 0 ? 'active' : 'inactive']);

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
    if (data.growStatus === 2) {
      frameIndex = FRAMES_PER_SEED - 1; // ready frame
    } else if (data.growStatus === -1 || data.growStatus === 0) {
      frameIndex = 0; // sign for newly planted and sprout stage
    } else {
      const clamped = Math.max(0, Math.min(0.999, growthProgress || 0));
      if (clamped === 0) {
        frameIndex = 0; // sign until growth actually begins
      } else {
        frameIndex = 1 + Math.floor(clamped * (FRAMES_PER_SEED - 2));
      }
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
        backgroundImage: isPrepStage || digPhase === 'hole-shrink' ? 'none' : undefined,
        backgroundColor: isPrepStage || digPhase === 'hole-shrink' ? 'transparent' : undefined,
      }}
    >
      {/* Soil color overlay */}
      {soilColor && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          backgroundColor: soilColor,
          mixBlendMode: 'color',
          opacity: 0.55,
          pointerEvents: 'none',
        }} />
      )}

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
      {!isDisabled && (isPrepStage || digPhase === 'x-hidden' || digPhase === 'x-appear') && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
          <style>{`
            @keyframes xShrink  { from { transform: scale(1); opacity: 1; } to { transform: scale(0); opacity: 0; } }
            @keyframes xAppear  { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            @keyframes holeShrink { from { transform: scale(1); opacity: 1; } to { transform: scale(0); opacity: 0; } }
            @keyframes dirtFadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
          {(prep.status === 0 || digPhase === 'x-shrink' || digPhase === 'x-appear') && digPhase !== 'x-hidden' && (
            <img
              src={isHovered && prep.status === 0 ? '/images/farming/xhover.png' : '/images/farming/x.png'}
              alt="X"
              style={{
                width: '115px', height: '115px', objectFit: 'contain', marginTop: '115px', marginLeft: '-34px',
                animation: digPhase === 'x-shrink' ? 'xShrink 0.18s ease-in forwards'
                         : digPhase === 'x-appear' ? 'xAppear 0.2s ease-out forwards'
                         : 'none',
              }}
            />
          )}
          {prep.status === 1 && digPhase !== 'x-shrink' && (
            <img
              src="/images/farming/hole.png"
              alt="Hole"
              style={{ width: '220px', height: '220px', objectFit: 'contain', marginTop: '115px', marginLeft: '-48px' }}
            />
          )}
          {prep.status === 2 && (
            <div style={{ position: 'relative', width: '40px', height: '15px', backgroundColor: '#1a1008', borderRadius: '50%', border: '2px solid #000', boxShadow: 'inset 0 5px 10px rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src={ALL_ITEMS[prep.fishId]?.image} alt="fish" style={{ width: '35px', height: '35px', position: 'absolute', top: '-15px', transform: 'rotate(-20deg)', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }} />
            </div>
          )}
        </div>
      )}

      {/* Dirt fade-in overlay after hole shrinks */}
      {digPhase === 'dirt-appear' && (
        <div style={{ position: 'absolute', inset: 0, animation: 'dirtFadeIn 0.25s ease-out forwards', pointerEvents: 'none', zIndex: 1 }} />
      )}

      {/* Hole/fish shrink overlay when transitioning to dirt */}
      {digPhase === 'hole-shrink' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
          {prevAnimStatusRef.current === 1 && (
            <img src="/images/farming/hole.png" alt="Hole" style={{ width: '220px', height: '220px', objectFit: 'contain', marginTop: '115px', marginLeft: '-48px', animation: 'holeShrink 0.18s ease-in forwards' }} />
          )}
          {prevAnimStatusRef.current === 2 && (
            <div style={{ position: 'relative', width: '40px', height: '15px', backgroundColor: '#1a1008', borderRadius: '50%', border: '2px solid #000', boxShadow: 'inset 0 5px 10px rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'holeShrink 0.18s ease-in forwards' }}>
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
        portalContainer &&
        parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10) !== 3 && (
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
            const volumeSetting = parseFloat(settings?.soundVolume ?? defaultSettings.soundVolume) / 100;
            clickAudio.volume = clampVolume(volumeSetting);
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
            localStorage.setItem('stat_bugs_smashed', (parseInt(localStorage.getItem('stat_bugs_smashed') || '0', 10) + 1).toString());
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
          {parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10) >= 32 && <div style={{
            color: '#ff4444',
            fontWeight: 'bold',
            fontSize: '18px',
            textShadow: '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black',
            marginBottom: '-5px',
            zIndex: 31
          }}>
            {data.bugCountdown}s
          </div>}
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

      {/* Crow indicator and countdown - portalled to body to escape stacking contexts */}
      {data.crowCountdown !== undefined && data.crowCountdown > 0 && crowScreenPos && createPortal(
        <div>
          <style>{`
            @keyframes crowFlyInFromLeft {
              0% { left: -150px; top: -100px; transform: translate(0, 0) scale(0.4); opacity: 0; }
              70% { opacity: 1; }
              100% { left: ${crowScreenPos.x + 7}px; top: ${crowScreenPos.y + 37}px; transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            @keyframes crowFlyInFromRight {
              0% { left: calc(100vw + 150px); top: -100px; transform: translate(0, 0) scale(0.4); opacity: 0; }
              70% { opacity: 1; }
              100% { left: ${crowScreenPos.x + 7}px; top: ${crowScreenPos.y + 37}px; transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            @keyframes dirtParticle0  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-20px,-30px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle1  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(20px,-30px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle2  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(35px,-20px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle3  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-35px,-20px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle4  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(40px,-5px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle5  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-40px,-5px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle6  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(0px,-40px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle7  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(28px,-32px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle8  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-28px,-32px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle9  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(15px,-38px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle10 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-15px,-38px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle11 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(38px,-15px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle12 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-38px,-15px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle13 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(10px,-25px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle14 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-10px,-25px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle15 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(25px,-10px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle16 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-25px,-10px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle17 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(32px,-28px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle18 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-32px,-28px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle19 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(5px,-35px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle20 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-5px,-35px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle21 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(42px,-22px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle22 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-42px,-22px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle23 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(18px,-42px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle24 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-18px,-42px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle25 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(30px,-12px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle26 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-30px,-12px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle27 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(22px,-36px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle28 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-22px,-36px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle29 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(8px,-44px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle30 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(45px,-10px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle31 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-45px,-10px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle32 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(12px,-48px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle33 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-12px,-48px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle34 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(36px,-36px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle35 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-36px,-36px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle36 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(48px,-24px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle37 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-48px,-24px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle38 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(26px,-44px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle39 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-26px,-44px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle40 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(50px,-5px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle41 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-50px,-5px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle42 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(16px,-50px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle43 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-16px,-50px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle44 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(40px,-40px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle45 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-40px,-40px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle46 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(8px,-52px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle47 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-8px,-52px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle48 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(52px,-18px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
            @keyframes dirtParticle49 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-52px,-18px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(0);opacity:0;} }
          `}</style>
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('scareCrow', { detail: { plotIndex: index } }));
              localStorage.setItem('stat_crows_swatted', (parseInt(localStorage.getItem('stat_crows_swatted') || '0', 10) + 1).toString());
            }}
            style={{
              position: "fixed",
              left: crowLanded ? `${crowScreenPos.x + 2}px` : undefined,
              top: crowLanded ? `${crowScreenPos.y + 27}px` : undefined,
              transform: "translate(-50%, -50%)",
              zIndex: 999999,
              cursor: "crosshair",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pointerEvents: "auto",
              animation: crowLanded ? "none" : (index < 15 ? "crowFlyInFromRight 5s ease-in-out forwards" : "crowFlyInFromLeft 5s ease-in-out forwards")
            }}
          >
            {parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10) >= 32 && crowLanded && <div style={{
              color: '#ff4444',
              fontWeight: 'bold',
              fontSize: '18px',
              textShadow: '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black',
              marginBottom: '-5px',
            }}>
              {data.crowCountdown}s
            </div>}
            <img
              key={crowLanded ? 'peck' : 'fly'}
              src={crowLanded ? "/images/badanimals/crowpeck.gif" : "/images/badanimals/crowfly.gif"}
              alt="crow"
              style={{
                width: crowLanded ? "85px" : "70px",
                height: crowLanded ? "85px" : "70px",
                filter: "drop-shadow(0px 0px 5px rgba(255,0,0,0.8))",
                transform: (!crowLanded && index >= 15) ? "scaleX(-1)" : "none"
              }}
            />
          </div>
          {crowLanded && Array.from({ length: 50 }, (_, i) => (
            <div key={`dirt-${i}`} style={{
              position: "fixed",
              left: `${crowScreenPos.plotCX}px`,
              top: `${crowScreenPos.plotCY}px`,
              width: i % 3 === 0 ? "10px" : i % 3 === 1 ? "8px" : "6px",
              height: i % 3 === 0 ? "10px" : i % 3 === 1 ? "8px" : "6px",
              borderRadius: "50%",
              backgroundColor: i % 4 === 0 ? "#6b4226" : i % 4 === 1 ? "#8B5E3C" : i % 4 === 2 ? "#a07040" : "#4a2e10",
              pointerEvents: "none",
              zIndex: 999998,
              animation: `dirtParticle${i} 0.9s ease-out infinite`,
              animationDelay: `${0.35 + i * 0.06}s`,
            }} />
          ))}
        </div>,
        document.body
      )}

      {/* Status Indicator */}
      <style>{`
        @keyframes statusBounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-10px); } }
        @keyframes indicatorShrink { from { transform: scale(1); opacity: 1; } to { transform: scale(0); opacity: 0; } }
      `}</style>
      {(data.needsWater || waterPhase === 'shrink') && (
        <div style={{
          position: "absolute",
          top: "-25px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          pointerEvents: "none",
          animation: waterPhase === 'shrink' ? 'none' : 'statusBounce 1.5s infinite',
        }}>
          {(data.bugCountdown > 0 || (data.crowCountdown > 0 && crowLanded))
            ? <img src="/images/mail/!.png" alt="!" className="badge-pulse" style={{ width: '28px', height: '28px', filter: 'drop-shadow(0px 2px 2px black)', position: 'relative', left: '23px', top: '65px' }} />
            : (pestJustKilled || data.crowCountdown > 0)
              ? null
              : <img
                  src="/images/farming/waterneeded.png"
                  alt="Needs Water"
                  style={{
                    width: '38px', height: '38px',
                    filter: 'drop-shadow(0px 2px 2px black)',
                    position: 'relative', left: '25px', top: '38px',
                    transformOrigin: '50% 50%',
                    animation: waterPhase === 'shrink' ? 'indicatorShrink 0.2s ease-in forwards' : 'none',
                  }}
                />
          }
        </div>
      )}
      {(data.growStatus === 2 || checkmarkPhase === 'shrink') && !data.needsWater && waterPhase !== 'shrink' && (
        <div style={{
          position: "absolute",
          top: "60px",
          left: "60%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          pointerEvents: "none",
          animation: checkmarkPhase === 'shrink' ? 'none' : 'statusBounce 1.5s infinite',
        }}>
          <img
            src="/images/farming/checkmark.png"
            alt="Ready"
            style={{
              width: '28px', height: '28px',
              filter: 'drop-shadow(0px 2px 2px black)',
              transformOrigin: '50% 50%',
              animation: checkmarkPhase === 'shrink' ? 'indicatorShrink 0.2s ease-in forwards' : 'none',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CropItem;
