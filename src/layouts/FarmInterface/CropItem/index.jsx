import React, { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import "./style.css";
import {
  FARM_PLOTS_PER_SIDE,
  FARM_POSITIONS,
} from "../../../constants/scene_farm";
import { ONE_SEED_HEIGHT, ONE_SEED_WIDTH } from "../../../constants/item_seed";
import { ALL_ITEMS } from "../../../constants/item_data";
import { ID_SEEDS } from "../../../constants/app_ids";
import CropTooltip from "./CropTooltip";
import { getSetting, defaultSettings } from "../../../utils/settings";
import { useAppSelector } from "../../../store";
import { selectSettings } from "../../../store/slices/uiSlice";
import { clampVolume } from "../../../utils/basic";

// Per-crop overrides: when a seed has individual stage PNGs, swap them in for the sprite sheet.
// Frame indices: 0 = sign (just planted), 1-4 = growth stages, 5 = ready.
// Most crops currently only have a sign image — the override system uses Math.min(frameIndex, length-1)
// so single-image entries display the sign on every growth frame until additional stages are added.
const CROP_FRAME_OVERRIDES = {
  // Pico seeds — potato locked to sign + p1 only (no p2/p3/p4/p5 progression yet)
  [ID_SEEDS.POTATO]: [
    '/images/crops/new/potato/potatosign.png',
    '/images/crops/new/potato/potatop1.png',
  ],
  [ID_SEEDS.LETTUCE]:  ['/images/crops/new/lettuce/lettucesign.png',  '/images/crops/new/lettuce/lettucep1.png'],
  [ID_SEEDS.CABBAGE]:  ['/images/crops/new/cellary/cellarysign.png',  '/images/crops/new/cellary/cellaryp1.png'], // labeled "Celery"
  [ID_SEEDS.ONION]:    ['/images/crops/new/onion/onionsign.png',      '/images/crops/new/onion/onionp1.png'],
  [ID_SEEDS.RADISH]:   ['/images/crops/new/raddish/raddishsign.png'],
  [ID_SEEDS.TURNIP]:   ['/images/crops/new/turnip/turnipsign.png',    '/images/crops/new/turnip/turnipp1.png'],
  // Feeble seeds — same artwork as their pico counterparts.
  [ID_SEEDS.F_POTATO]: ['/images/crops/new/potato/potatosign.png',    '/images/crops/new/potato/potatop1.png'],
  [ID_SEEDS.F_LETTUCE]:['/images/crops/new/lettuce/lettucesign.png',  '/images/crops/new/lettuce/lettucep1.png'],
  [ID_SEEDS.F_CABBAGE]:['/images/crops/new/cellary/cellarysign.png',  '/images/crops/new/cellary/cellaryp1.png'],
  [ID_SEEDS.F_ONION]:  ['/images/crops/new/onion/onionsign.png',      '/images/crops/new/onion/onionp1.png'],
  [ID_SEEDS.F_RADISH]: ['/images/crops/new/raddish/raddishsign.png'],
  // Basic seeds
  [ID_SEEDS.WHEAT]:       ['/images/crops/new/wheat/wheatsign.png',         '/images/crops/new/wheat/wheatp1.png'],
  [ID_SEEDS.TOMATO]:      ['/images/crops/new/tomato/tomatosign.png',       '/images/crops/new/tomato/tomatop1.png'],
  [ID_SEEDS.CARROT]:      ['/images/crops/new/carrot/carrotsign.png',       '/images/crops/new/carrot/carrotp1.png'],
  [ID_SEEDS.CORN]:        ['/images/crops/new/corn/cornsign.png',           '/images/crops/new/corn/cornp1.png'],
  [ID_SEEDS.PUMPKIN]:     ['/images/crops/new/pumpkin/pumpkinsign.png',     '/images/crops/new/pumpkin/pumpkinp1.png'],
  [ID_SEEDS.PEPPER]:      ['/images/crops/new/pepper/peppersign.png',       '/images/crops/new/pepper/pepperp1.png'],
  [ID_SEEDS.CELERY]:      ['/images/crops/new/cellary/cellarysign.png',     '/images/crops/new/cellary/cellaryp1.png'],
  [ID_SEEDS.BROCCOLI]:    ['/images/crops/new/brocoli/brocolisign.png',     '/images/crops/new/brocoli/broclip1.png'],
  [ID_SEEDS.CAULIFLOWER]: ['/images/crops/new/califlower/califlowersign.png', '/images/crops/new/califlower/califlowerp1.png'],
  [ID_SEEDS.GRAPES]:      ['/images/crops/new/grape/grapesign.png',         '/images/crops/new/grape/grapep1.png'],
  [ID_SEEDS.BOKCHOY]:     ['/images/crops/new/bochoy/bochoysign.png',       '/images/crops/new/bochoy/bochoyp1.png'],
  [ID_SEEDS.EGGPLANT]:    ['/images/crops/new/eggplant/eggplantsign.png',   '/images/crops/new/eggplant/eggplantp1.png'],
  // Premium seeds
  [ID_SEEDS.BANANA]:       ['/images/crops/new/banana/bananasign.png',         '/images/crops/new/banana/bananap1.png'],
  [ID_SEEDS.MANGO]:        ['/images/crops/new/mango/mangosign.png',           '/images/crops/new/mango/mangop1.png'],
  [ID_SEEDS.AVOCADO]:      ['/images/crops/new/avocado/avocadosign.png',       '/images/crops/new/avocado/avocadop1.png'],
  [ID_SEEDS.PINEAPPLE]:    ['/images/crops/new/pineapple/pineapplesign.png',   '/images/crops/new/pineapple/pineapplep1.png'],
  [ID_SEEDS.BLUEBERRY]:    ['/images/crops/new/blueberry/blueberrysign.png',   '/images/crops/new/blueberry/blueberryp1.png'],
  [ID_SEEDS.PAPAYA]:       ['/images/crops/new/papaya/papyasign.png',          '/images/crops/new/papaya/papayap1.png'],
  [ID_SEEDS.LICHI]:        ['/images/crops/new/lychee/lycheesign.png',         '/images/crops/new/lychee/lycheep1.png'],
  [ID_SEEDS.LAVENDER]:     ['/images/crops/new/lavendar/lavendarsign.png',     '/images/crops/new/lavendar/lavendarp1.png'],
  [ID_SEEDS.DRAGON_FRUIT]: ['/images/crops/new/dragonfruit/dragonfruitsign.png', '/images/crops/new/dragonfruit/dragonfruitp1.png'],
  [ID_SEEDS.POMEGRANATE]:  ['/images/crops/new/pomagrante/pomogranetsign.png', '/images/crops/new/pomagrante/pomogranitep1.png'],
  [ID_SEEDS.APPLE]:        ['/images/crops/new/apple/applesign.png',           '/images/crops/new/apple/applep1.png'],
};

// Module-level singleton so all CropItem instances share one fly audio
let _flyAudio = null;
let _flyFadeInterval = null;
const _flyActivePlots = new Set(); // track which plot indices have active bugs

const getFlyAudio = () => {
  if (!_flyAudio) {
    _flyAudio = new Audio("/sounds/fly/flysound.m4a");
    _flyAudio.loop = true;
    _flyAudio.preload = "auto";
    _flyAudio.volume = 0;
  }
  return _flyAudio;
};

const startFlySound = () => {
  const audio = getFlyAudio();
  clearInterval(_flyFadeInterval);
  audio.volume = 0;
  audio.play().catch(() => {});
  _flyFadeInterval = setInterval(() => {
    audio.volume = Math.min(0.09, audio.volume + 0.005);
    if (audio.volume >= 0.09) clearInterval(_flyFadeInterval);
  }, 40);
};

const stopFlySound = () => {
  const audio = getFlyAudio();
  clearInterval(_flyFadeInterval);
  _flyFadeInterval = setInterval(() => {
    audio.volume = Math.max(0, audio.volume - 0.05);
    if (audio.volume <= 0) {
      clearInterval(_flyFadeInterval);
      audio.pause();
    }
  }, 40);
};

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
  const [crowFlyingAway, setCrowFlyingAway] = useState(false);
  const [bugsFlyingAway, setBugsFlyingAway] = useState(false);
  const [bugsGathering, setBugsGathering] = useState(false);
  const bugsGatherTimerRef = useRef(null);
  const bugAudioHandledRef = useRef(false);
  const [dirtActive, setDirtActive] = useState(false);
  const [dirtFading, setDirtFading] = useState(false);
  const dirtTimerRef = useRef(null);
  const dirtOffTimerRef = useRef(null);
  const dirtFadeTimerRef = useRef(null);
  const crowAudioRef = useRef(null);
  const crowSpawnStopRef = useRef(null);
  const [crowScreenPos, setCrowScreenPos] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  useEffect(() => {
    const handler = (e) => setDialogOpen(e.detail.open);
    window.addEventListener('dialogOpenChanged', handler);
    return () => window.removeEventListener('dialogOpenChanged', handler);
  }, []);
  const [plotPrep, setPlotPrep] = useState(() => JSON.parse(localStorage.getItem('sandbox_plot_prep') || '{}'));
  const [soilColor, setSoilColor] = useState(() => localStorage.getItem('sandbox_active_soil_color') || null);
  const [digPhase, setDigPhase] = useState('none');
  const [isShaking, setIsShaking] = useState(false);
  useEffect(() => {
    const handler = (e) => {
      if (e.detail === index) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    };
    window.addEventListener('tutorialPlotShake', handler);
    return () => window.removeEventListener('tutorialPlotShake', handler);
  }, [index]);
  const [waterPhase, setWaterPhase] = useState('none');
  const [checkmarkPhase, setCheckmarkPhase] = useState('none');
  const [holdSignAfterFirstWater, setHoldSignAfterFirstWater] = useState(false);
  const holdSignTimerRef = useRef(null);
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
      // If this was the INITIAL water (growth hasn't progressed yet), hold sign during the icon shrink.
      const wState = JSON.parse(localStorage.getItem('sandbox_water_state') || '{}');
      const wasInitialWater = wState[index]?.needsInitial === false && (growthProgress || 0) === 0;
      if (wasInitialWater || (growthProgress || 0) === 0) {
        setHoldSignAfterFirstWater(true);
        clearTimeout(holdSignTimerRef.current);
        holdSignTimerRef.current = setTimeout(() => setHoldSignAfterFirstWater(false), 350);
      }
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
    const audio = new Audio('/sounds/crow/crowsoundeffect.m4a');
    audio.preload = 'auto';
    crowAudioRef.current = audio;
    return () => {
      clearTimeout(crowSpawnStopRef.current);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    const bugKilled = prevBugCountdownRef.current > 0 && !(data.bugCountdown > 0);
    const bugSpawned = !(prevBugCountdownRef.current > 0) && data.bugCountdown > 0;
    const crowKilled = prevCrowCountdownRef.current > 0 && !(data.crowCountdown > 0);
    if (bugKilled || crowKilled) {
      setPestJustKilled(true);
      clearTimeout(pestKillTimerRef.current);
      pestKillTimerRef.current = setTimeout(() => setPestJustKilled(false), 600);
    }
    if (bugSpawned) {
      const wasEmpty = _flyActivePlots.size === 0;
      _flyActivePlots.add(index);
      if (wasEmpty) startFlySound();
      clearTimeout(bugsGatherTimerRef.current);
      setBugsGathering(true);
      bugsGatherTimerRef.current = setTimeout(() => setBugsGathering(false), 900);
    }
    if (bugKilled) {
      _flyActivePlots.delete(index);
      if (_flyActivePlots.size === 0) stopFlySound();
      bugAudioHandledRef.current = false; // reset for next bug spawn
    }
    prevBugCountdownRef.current = data.bugCountdown;
    prevCrowCountdownRef.current = data.crowCountdown;
  }, [data.bugCountdown, data.crowCountdown]);

  // Handle bug already active on mount
  useEffect(() => {
    if (data.bugCountdown > 0) {
      const wasEmpty = _flyActivePlots.size === 0;
      _flyActivePlots.add(index);
      if (wasEmpty) startFlySound();
      setBugsGathering(true);
      bugsGatherTimerRef.current = setTimeout(() => setBugsGathering(false), 900);
    }
    return () => {
      if (prevBugCountdownRef.current > 0) {
        _flyActivePlots.delete(index);
        if (_flyActivePlots.size === 0) stopFlySound();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const handleCrowAte = (e) => {
      if (e.detail.plotIndex !== index) return;
      // Revert this plot back to a hole
      const stored = JSON.parse(localStorage.getItem('sandbox_plot_prep') || '{}');
      stored[index] = { ...(stored[index] || {}), status: 1 };
      localStorage.setItem('sandbox_plot_prep', JSON.stringify(stored));
      setPlotPrep({ ...stored });
      prevStatusRef.current = 1;
    };
    window.addEventListener('plotPrepUpdated', handlePrepUpdate);
    window.addEventListener('crowAteAtPlot', handleCrowAte);
    return () => {
      window.removeEventListener('plotPrepUpdated', handlePrepUpdate);
      window.removeEventListener('crowAteAtPlot', handleCrowAte);
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

  const lastProgressSeedIdRef = useRef(data.seedId);

  // Reset to 0 immediately when seedId changes (prevents stale frame flash)
  useEffect(() => {
    lastProgressSeedIdRef.current = data.seedId;
    setGrowthProgress(0);
  }, [data.seedId]);

  // Update from cropArray once it's in sync with the current seedId
  useEffect(() => {
    if (cropArray && data.seedId) {
      const progress = cropArray.getGrowthProgress(index);
      lastProgressSeedIdRef.current = data.seedId;
      setGrowthProgress(progress);
    }
  }, [cropArray, index]);

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

  // Plots at top >= 215 in scene_farm FARM_POSITIONS — these are the lower rows that
  // would push the tooltip off the bottom of the screen, so always show to the right.
  const RIGHT_TOOLTIP_PLOTS = new Set([5,6,7,8,9,10,11,12,13,14,20,21,22,23,24,25,26,27,28,29]);
  const forceRight = RIGHT_TOOLTIP_PLOTS.has(index);

  const handleMouseMove = (e) => {
    if (!data.seedId) return;

    const TOOLTIP_HEIGHT = 420;

    if (forceRight) {
      // Always pin to the right of the cursor, vertically clamped
      const xOffset = 30;
      const rawY = e.clientY - 80;
      const clampedClientY = Math.min(Math.max(rawY, 10), window.innerHeight - TOOLTIP_HEIGHT - 10);
      if (portalContainer && portalContainer !== document.body) {
        const rect = portalContainer.getBoundingClientRect();
        const scaleX = rect.width && portalContainer.offsetWidth ? rect.width / portalContainer.offsetWidth : 1;
        const scaleY = rect.height && portalContainer.offsetHeight ? rect.height / portalContainer.offsetHeight : 1;
        setTooltipPos({ x: (e.clientX - rect.left) / (scaleX || 1) + xOffset, y: (clampedClientY - rect.top) / (scaleY || 1) });
        return;
      }
      setTooltipPos({ x: e.clientX + xOffset, y: clampedClientY });
      return;
    }

    const xOffset = 25;
    const isBottomHalf = e.clientY > window.innerHeight / 2;
    const rawY = isBottomHalf ? e.clientY - 130 : e.clientY + 20;
    const clampedClientY = Math.min(rawY, window.innerHeight - TOOLTIP_HEIGHT - 10);

    if (portalContainer && portalContainer !== document.body) {
      const rect = portalContainer.getBoundingClientRect();
      const scaleX = rect.width && portalContainer.offsetWidth ? rect.width / portalContainer.offsetWidth : 1;
      const scaleY = rect.height && portalContainer.offsetHeight ? rect.height / portalContainer.offsetHeight : 1;
      setTooltipPos({ x: (e.clientX - rect.left) / (scaleX || 1) + xOffset, y: (clampedClientY - rect.top) / (scaleY || 1), isBottomHalf });
      return;
    }

    setTooltipPos({ x: e.clientX + xOffset, y: clampedClientY, isBottomHalf });
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
      // Play first 3s of crow sound on spawn with fade in/out
      const audio = crowAudioRef.current;
      if (audio) {
        clearTimeout(crowSpawnStopRef.current);
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0;
        audio.play().catch(() => {});
        // Fade in over 400ms
        const fadeInStep = 0.05, fadeInMs = 40;
        const fadeIn = setInterval(() => {
          audio.volume = Math.min(1, audio.volume + fadeInStep);
          if (audio.volume >= 1) clearInterval(fadeIn);
        }, fadeInMs);
        // Fade out over last 500ms of the 3s window
        crowSpawnStopRef.current = setTimeout(() => {
          const fadeOut = setInterval(() => {
            audio.volume = Math.max(0, audio.volume - 0.1);
            if (audio.volume <= 0) { clearInterval(fadeOut); audio.pause(); }
          }, 50);
        }, 2500);
      }
      // Calculate screen position of this crop-item for portal rendering
      if (rootRef.current) {
        const rect = rootRef.current.getBoundingClientRect();
        setCrowScreenPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.35, plotCX: rect.left + rect.width / 2 - 15, plotCY: rect.top + rect.height * 0.55 + 20 });
      }
      setCrowLanded(false);
      clearTimeout(crowLandedTimerRef.current);
      crowLandedTimerRef.current = setTimeout(() => {
        setCrowLanded(true);
        clearInterval(dirtTimerRef.current);
        clearTimeout(dirtOffTimerRef.current);
        clearTimeout(dirtFadeTimerRef.current);
        const triggerDirt = () => {
          // Cancel any ongoing fade, restart particles fresh
          setDirtFading(false);
          setDirtActive(false);
          setTimeout(() => {
            setDirtActive(true);
            clearTimeout(dirtOffTimerRef.current);
            clearTimeout(dirtFadeTimerRef.current);
            // After peck duration, fade out instead of snap-off
            dirtOffTimerRef.current = setTimeout(() => {
              setDirtFading(true);
              dirtFadeTimerRef.current = setTimeout(() => {
                setDirtActive(false);
                setDirtFading(false);
              }, 800);
            }, 1800);
          }, 16);
        };
        triggerDirt();
        dirtTimerRef.current = setInterval(triggerDirt, 2500);
      }, 2800);
    } else {
      setCrowLanded(false);
      setDirtActive(false);
      setDirtFading(false);
      setCrowScreenPos(null);
      clearTimeout(crowLandedTimerRef.current);
      clearInterval(dirtTimerRef.current);
      clearTimeout(dirtOffTimerRef.current);
      clearTimeout(dirtFadeTimerRef.current);
    }
    return () => { clearTimeout(crowLandedTimerRef.current); clearInterval(dirtTimerRef.current); clearTimeout(dirtOffTimerRef.current); clearTimeout(dirtFadeTimerRef.current); };
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
  const seedJustChanged = lastProgressSeedIdRef.current !== data.seedId;
  const stableProgress = seedJustChanged ? 0 : (growthProgress || 0);

  // Gate sign-to-growth transition on first water actually being given.
  // needsInitial in the water state is true from planting until the first water.
  let needsInitialWater = false;
  try {
    const wState = JSON.parse(localStorage.getItem('sandbox_water_state') || '{}');
    needsInitialWater = wState[index]?.needsInitial === true;
  } catch (e) {}

  // Tutorial: after the first water, lock the potato to p1 for the rest of the scripted phase.
  // The plant never progresses past p1 during the tutorial — the gem-skip just leads to harvest.
  const tutStepForFrame = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
  const tutorialFrameOverride = (() => {
    if (tutStepForFrame >= 17 && tutStepForFrame <= 25) {
      // While initial water hasn't been given (or icon still shrinking), keep sign.
      if (needsInitialWater || holdSignAfterFirstWater) return 0;
      return 1; // p1 — locked, no further progression during the tutorial.
    }
    return null;
  })();

  let frameIndex = 0;
  if (data.seedId && ALL_ITEMS[data.seedId]) {
    if (tutorialFrameOverride !== null) {
      frameIndex = tutorialFrameOverride;
    } else if (seedJustChanged) {
      frameIndex = 0; // seedId changed but effects haven't run yet — hold on sign
    } else if (data.growStatus === 2) {
      frameIndex = FRAMES_PER_SEED - 1; // ready frame
    } else if (needsInitialWater || holdSignAfterFirstWater) {
      frameIndex = 0; // stay on sign until the first water icon finishes shrinking
    } else if (data.growStatus === -1 || data.growStatus === 0) {
      frameIndex = 0; // sign for newly planted and sprout stage
    } else {
      const clamped = Math.max(0, Math.min(0.999, stableProgress));
      if (clamped === 0) {
        frameIndex = 0; // sign until growth actually begins
      } else {
        // 4 growth stages (p1, p2, p3, p4) — p5 reserved for ready (growStatus === 2).
        frameIndex = 1 + Math.floor(clamped * (FRAMES_PER_SEED - 2));
      }
    }
  }

  // Filled segments match the displayed frame: sign = 0, p1 = 1, p2 = 2, ..., p5 (ready) = 5.
  const filledSegments = (!data.seedId || data.seedId === 0n) ? 0 : frameIndex;
  
  const prep = plotPrep[index] || { status: 0 };
  const isPrepStage = (!data.seedId || data.seedId === 0n) && prep.status !== 3;

  return (
    <div
      ref={rootRef}
      data-plot-index={index}
      data-plot-prep-status={prep.status || 0}
      data-plot-hover={isHovered ? 'true' : 'false'}
      data-needs-water={data.needsWater ? 'true' : 'false'}
      data-has-pest={(data.bugCountdown > 0 || data.crowCountdown > 0) ? 'true' : 'false'}
      data-planted-image={(() => {
        if (!data.seedId || data.seedId === 0n) return '';
        const baseId = Number(data.seedId) & 0xFFF;
        const frames = CROP_FRAME_OVERRIDES[baseId];
        if (!frames) return '';
        return frames[Math.min(frameIndex, frames.length - 1)] || '';
      })()}
      className={`crop-item ${getStatusClass()} ${
        jiggling && data.growStatus < 1 ? "jiggling" : ""
      } ${highlighted ? "selected" : ""} ${isShaking ? "shaking" : ""}`}
      style={(() => {
        const isEmptyDirt = prep.status === 3 && (!data.seedId || data.seedId === 0n) && digPhase !== 'hole-shrink';
        // Strip rarity bits — overrides are keyed by base seed id (lower 12 bits).
        const seedNumId = data.seedId ? Number(data.seedId) & 0xFFF : 0;
        const overrideFrames = CROP_FRAME_OVERRIDES[seedNumId];
        const overrideFrameIdx = overrideFrames ? Math.min(frameIndex, overrideFrames.length - 1) : -1;
        const overrideSrc = overrideFrames ? overrideFrames[overrideFrameIdx] : null;
        const isSignFrame = overrideFrameIdx === 0;
        const tutStepNow = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
        // Hide the in-plot rendering during the tutorial steps where the bright overlay takes over —
        // step 16 covers empty dirt, step 17 covers the planted sign.
        const hideDirtForTutorial = (isEmptyDirt && tutStepNow === 16) || (overrideSrc && tutStepNow >= 17 && tutStepNow <= 25);
        // During pest tutorial steps (20=crow, 22=bug), bump the plot above the dim so the bugs/crow are visible.
        const elevatePlot = (tutStepNow === 20 || tutStepNow === 22) && [6, 7, 8].includes(index);
        return {
          ...position,
          zIndex: elevatePlot ? 100002 : undefined,
          backgroundPositionX: isEmptyDirt || overrideSrc
            ? '0'
            : (data.seedId && ALL_ITEMS[data.seedId] ? 0 - frameIndex * ONE_SEED_WIDTH : 0),
          backgroundPositionY: isEmptyDirt || overrideSrc
            ? '0'
            : (data.seedId && ALL_ITEMS[data.seedId] ? 0 - ALL_ITEMS[data.seedId].pos * ONE_SEED_HEIGHT : 0),
          backgroundImage: isPrepStage || digPhase === 'hole-shrink' || hideDirtForTutorial
            ? 'none'
            : (overrideSrc
                ? `url(${overrideSrc})`
                : (isEmptyDirt ? 'url(/images/crops/new/dirt.png)' : undefined)),
          backgroundSize: overrideSrc
            ? (isSignFrame ? 'auto 96%' : '65% auto')
            : (isEmptyDirt ? (isHovered ? '69% auto' : '64% auto') : undefined),
          backgroundPosition: overrideSrc
            ? `${overrideFrameIdx === 0 ? 'calc(50% - 23px)' : (overrideFrameIdx === 1 ? 'calc(50% - 19px)' : 'calc(50% - 30px)')} ${overrideFrameIdx === 0 ? 'calc(50% + 4px)' : (overrideFrameIdx === 1 ? 'bottom' : (overrideFrameIdx === overrideFrames.length - 1 ? 'calc(50% + 21px)' : (overrideFrameIdx === overrideFrames.length - 2 ? 'calc(50% + 36px)' : 'calc(50% + 43px)')))}`
            : (isEmptyDirt ? `${index === 11 ? 'calc(50% - 38px)' : 'calc(50% - 18px)'} center` : undefined),
          backgroundRepeat: isEmptyDirt || overrideSrc ? 'no-repeat' : undefined,
          transform: overrideSrc && isHovered && tutStepNow >= 36 ? 'scale(1.1)' : undefined,
          transformOrigin: overrideSrc ? 'center' : undefined,
          transition: isEmptyDirt
            ? 'background-size 0.15s ease-out'
            : (overrideSrc ? 'transform 0.15s ease-out' : undefined),
          // Pop-in scale animation when dirt is first placed (status 1 → 3 transition).
          animation: digPhase === 'dirt-appear' && isEmptyDirt
            ? 'dirtPopIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both'
            : undefined,
          backgroundColor: isPrepStage || digPhase === 'hole-shrink' ? 'transparent' : undefined,
        };
      })()}
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
            @keyframes xPulseIdle { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
          `}</style>
          {(prep.status === 0 || digPhase === 'x-shrink' || digPhase === 'x-appear') && digPhase !== 'x-hidden' && ![0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].includes(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10)) && (() => {
            const curStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
            // Step 11: Xs pop in one-by-one left→right across the 3 starter plots
            const staggerMap = { 8: 0, 7: 0.3, 6: 0.6 };
            const tutDelay = curStep === 11 ? (staggerMap[index] ?? 0) : 0;
            return (
              <img
                className="plot-x-marker"
                data-plot-x={index}
                data-hover={isHovered && prep.status === 0 ? 'true' : 'false'}
                src={isHovered && prep.status === 0 ? '/images/farming/xhover.png' : '/images/farming/x.png'}
                alt="X"
                style={{
                  width: '115px', height: '115px', objectFit: 'contain', marginTop: '115px', marginLeft: '-34px',
                  // On step 11, hide the real X — a bright overlay takes its place at the exact same position
                  visibility: (curStep === 12 || curStep === 14) ? 'hidden' : 'visible',
                  animation: (curStep >= 12 && curStep < 36) ? 'none'
                           : digPhase === 'x-shrink' ? 'xShrink 0.18s ease-in forwards'
                           : digPhase === 'x-appear' ? 'xAppear 0.2s ease-out forwards'
                           : 'xPulseIdle 1.4s ease-in-out infinite',
                }}
              />
            );
          })()}
          {prep.status === 1 && digPhase !== 'x-shrink' && (() => {
            const curStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
            return (
              <img
                className="plot-hole-marker"
                data-plot-hole={index}
                data-hover={isHovered ? 'true' : 'false'}
                src="/images/farming/hole.png"
                alt="Hole"
                style={{ width: '200px', height: '200px', objectFit: 'contain', marginTop: index === 3 ? '111px' : '125px', marginLeft: '-38px', visibility: (curStep === 14 || curStep === 15) ? 'hidden' : 'visible', transform: isHovered ? 'scale(1.1)' : 'scale(1)', transformOrigin: 'center', transition: 'transform 0.15s ease-out' }}
              />
            );
          })()}
          {prep.status === 2 && (
            <div style={{ position: 'relative', width: '40px', height: '15px', backgroundColor: '#1a1008', borderRadius: '50%', border: '2px solid #000', boxShadow: 'inset 0 5px 10px rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src={ALL_ITEMS[prep.fishId]?.image} alt="fish" style={{ width: '35px', height: '35px', position: 'absolute', top: '-15px', transform: 'rotate(-20deg)', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }} />
            </div>
          )}
        </div>
      )}


      {/* Invisible dirt marker — lets tutorial overlay query the dirt plot position (matches hole position) */}
      {prep.status === 3 && (!data.seedId || data.seedId === 0n) && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
          <div
            className="plot-dirt-marker"
            data-plot-dirt={index}
            data-hover={isHovered ? 'true' : 'false'}
            style={{ width: '220px', height: '220px', marginTop: '115px', marginLeft: '-48px', visibility: 'hidden' }}
          />
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
            <img src="/images/farming/hole.png" alt="Hole" style={{ width: '200px', height: '200px', objectFit: 'contain', marginTop: index === 3 ? '111px' : '125px', marginLeft: '-38px', animation: 'holeShrink 0.18s ease-in forwards' }} />
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
                i < filledSegments ? "filled" : ""
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
        parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10) >= 35 && (
          <CropTooltip
            container={portalContainer}
            pos={tooltipPos}
            data={data}
            growthProgress={growthProgress}
            filledSegments={filledSegments}
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

      {/* Bug indicator — animated flies */}
      {data.bugCountdown !== undefined && data.bugCountdown > 0 && (
        <>
          <style>{`
            @keyframes flyOrbit0 {
              0%   { transform: translate( 28px,  0px) scale(1);   opacity: 0.9; }
              25%  { transform: translate( 10px,-22px) scale(1.2); opacity: 1;   }
              50%  { transform: translate(-28px,  4px) scale(0.8); opacity: 0.7; }
              75%  { transform: translate( -8px, 20px) scale(1.1); opacity: 1;   }
              100% { transform: translate( 28px,  0px) scale(1);   opacity: 0.9; }
            }
            @keyframes flyOrbit1 {
              0%   { transform: translate(-24px, 12px) scale(0.9); opacity: 0.8; }
              25%  { transform: translate( 18px, 22px) scale(1.2); opacity: 1;   }
              50%  { transform: translate( 26px,-10px) scale(0.8); opacity: 0.7; }
              75%  { transform: translate(-14px,-20px) scale(1.1); opacity: 1;   }
              100% { transform: translate(-24px, 12px) scale(0.9); opacity: 0.8; }
            }
            @keyframes flyOrbit2 {
              0%   { transform: translate(  4px,-26px) scale(1.1); opacity: 1;   }
              25%  { transform: translate(-26px, -6px) scale(0.8); opacity: 0.7; }
              50%  { transform: translate(-10px, 24px) scale(1.2); opacity: 1;   }
              75%  { transform: translate( 24px, 14px) scale(0.9); opacity: 0.8; }
              100% { transform: translate(  4px,-26px) scale(1.1); opacity: 1;   }
            }
            @keyframes flyOrbit3 {
              0%   { transform: translate( 18px,-18px) scale(0.9); opacity: 0.8; }
              33%  { transform: translate(-22px,-12px) scale(1.2); opacity: 1;   }
              66%  { transform: translate(  6px, 28px) scale(0.8); opacity: 0.7; }
              100% { transform: translate( 18px,-18px) scale(0.9); opacity: 0.8; }
            }
            @keyframes flyWiggle {
              0%,100% { border-radius: 50% 40% 50% 40%; }
              50%     { border-radius: 40% 50% 40% 50%; }
            }
            @keyframes bugScatter0 { 0%{transform:translate(0,0);opacity:1;} 100%{transform:translate(-70px,-80px) scale(0.3);opacity:0;} }
            @keyframes bugScatter1 { 0%{transform:translate(0,0);opacity:1;} 100%{transform:translate(80px,-60px) scale(0.3);opacity:0;} }
            @keyframes bugScatter2 { 0%{transform:translate(0,0);opacity:1;} 100%{transform:translate(-90px,20px) scale(0.3);opacity:0;} }
            @keyframes bugScatter3 { 0%{transform:translate(0,0);opacity:1;} 100%{transform:translate(90px,30px) scale(0.3);opacity:0;} }
            @keyframes bugScatter4 { 0%{transform:translate(0,0);opacity:1;} 100%{transform:translate(10px,-100px) scale(0.3);opacity:0;} }
            @keyframes bugScatter5 { 0%{transform:translate(0,0);opacity:1;} 100%{transform:translate(-100px,40px) scale(0.3);opacity:0;} }
            @keyframes bugScatter6 { 0%{transform:translate(0,0);opacity:1;} 100%{transform:translate(95px,-30px) scale(0.3);opacity:0;} }
            @keyframes bugScatter7 { 0%{transform:translate(0,0);opacity:1;} 100%{transform:translate(-50px,80px) scale(0.3);opacity:0;} }
            @keyframes bugScatter8 { 0%{transform:translate(0,0);opacity:1;} 100%{transform:translate(60px,90px) scale(0.3);opacity:0;} }
            @keyframes bugScatter9 { 0%{transform:translate(0,0);opacity:1;} 100%{transform:translate(-25px,-95px) scale(0.3);opacity:0;} }
            @keyframes bugGather0 { 0%{transform:translate(-70px,-80px) scale(0.3);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes bugGather1 { 0%{transform:translate(80px,-60px) scale(0.3);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes bugGather2 { 0%{transform:translate(-90px,20px) scale(0.3);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes bugGather3 { 0%{transform:translate(90px,30px) scale(0.3);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes bugGather4 { 0%{transform:translate(10px,-100px) scale(0.3);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes bugGather5 { 0%{transform:translate(-100px,40px) scale(0.3);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes bugGather6 { 0%{transform:translate(95px,-30px) scale(0.3);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes bugGather7 { 0%{transform:translate(-50px,80px) scale(0.3);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes bugGather8 { 0%{transform:translate(60px,90px) scale(0.3);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes bugGather9 { 0%{transform:translate(-25px,-95px) scale(0.3);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
          `}</style>
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (bugsFlyingAway) return;
              setBugsFlyingAway(true);
              bugAudioHandledRef.current = true;
              _flyActivePlots.delete(index);
              if (_flyActivePlots.size === 0) stopFlySound();
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('squashBug', { detail: { plotIndex: index } }));
                localStorage.setItem('stat_bugs_smashed', (parseInt(localStorage.getItem('stat_bugs_smashed') || '0', 10) + 1).toString());
                setBugsFlyingAway(false);
              }, 900);
            }}
            style={(() => {
              const ts = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
              const inTutorial = ts === 22;
              return {
                position: 'absolute',
                top: 'calc(35% + 27.5px)',
                left: 'calc(50% - 19px)',
                width: '50px',
                height: '50px',
                marginLeft: '-25px',
                zIndex: 9999,
                cursor: 'crosshair',
                pointerEvents: 'auto',
                filter: inTutorial
                  ? 'drop-shadow(0 0 6px rgba(255,220,100,0.95)) drop-shadow(0 0 12px rgba(255,180,40,0.85))'
                  : undefined,
                animation: inTutorial ? 'tutXPulse 1.4s ease-in-out infinite' : undefined,
              };
            })()}
          >
            {[
              { anim: 'flyOrbit0', dur: '1.4s', size: 5, color: '#1a1a0a', delay: '0s',    scatter: 'bugScatter0' },
              { anim: 'flyOrbit1', dur: '1.1s', size: 4, color: '#2a1a00', delay: '-0.4s', scatter: 'bugScatter1' },
              { anim: 'flyOrbit2', dur: '1.6s', size: 5, color: '#111108', delay: '-0.8s', scatter: 'bugScatter2' },
              { anim: 'flyOrbit3', dur: '1.3s', size: 4, color: '#1a1208', delay: '-0.2s', scatter: 'bugScatter3' },
              { anim: 'flyOrbit0', dur: '1.8s', size: 3, color: '#2a2000', delay: '-1.0s', scatter: 'bugScatter4' },
              { anim: 'flyOrbit1', dur: '1.5s', size: 5, color: '#1f1a0c', delay: '-0.6s', scatter: 'bugScatter5' },
              { anim: 'flyOrbit2', dur: '1.2s', size: 4, color: '#241800', delay: '-1.2s', scatter: 'bugScatter6' },
              { anim: 'flyOrbit3', dur: '1.7s', size: 5, color: '#161208', delay: '-0.3s', scatter: 'bugScatter7' },
              { anim: 'flyOrbit0', dur: '1.0s', size: 3, color: '#2a1d05', delay: '-0.9s', scatter: 'bugScatter8' },
              { anim: 'flyOrbit2', dur: '1.9s', size: 4, color: '#1c1408', delay: '-0.5s', scatter: 'bugScatter9' },
            ].map((f, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: `${f.size}px`,
                height: `${f.size}px`,
                background: f.color,
                animation: bugsFlyingAway
                  ? `${f.scatter} 0.8s ease-out ${i * 0.07}s forwards`
                  : bugsGathering
                    ? `bugGather${i} 0.8s ease-out ${i * 0.07}s both`
                    : `${f.anim} ${f.dur} ease-in-out ${f.delay} infinite, flyWiggle 0.3s ease-in-out infinite`,
                boxShadow: '0 0 2px rgba(0,0,0,0.6)',
                pointerEvents: 'none',
              }} />
            ))}
          </div>
        </>
      )}

      {/* Crow indicator and countdown - portalled to body to escape stacking contexts */}
      {data.crowCountdown !== undefined && data.crowCountdown > 0 && crowScreenPos && !dialogOpen && createPortal(
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
            @keyframes dirtParticle0  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-20px,-30px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle1  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(20px,-30px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle2  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(35px,-20px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle3  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-35px,-20px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle4  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(40px,-5px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle5  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-40px,-5px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle6  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(0px,-40px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle7  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(28px,-32px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle8  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-28px,-32px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle9  { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(15px,-38px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle10 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-15px,-38px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle11 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(38px,-15px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle12 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-38px,-15px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle13 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(10px,-25px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle14 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-10px,-25px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle15 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(25px,-10px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle16 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-25px,-10px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle17 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(32px,-28px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle18 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-32px,-28px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle19 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(5px,-35px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle20 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-5px,-35px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle21 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(42px,-22px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle22 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-42px,-22px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle23 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(18px,-42px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle24 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-18px,-42px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle25 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(30px,-12px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle26 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-30px,-12px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle27 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(22px,-36px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle28 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-22px,-36px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle29 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(8px,-44px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle30 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(45px,-10px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle31 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-45px,-10px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle32 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(12px,-48px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle33 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-12px,-48px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle34 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(36px,-36px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle35 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-36px,-36px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle36 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(48px,-24px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle37 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-48px,-24px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle38 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(26px,-44px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle39 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-26px,-44px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle40 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(50px,-5px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle41 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-50px,-5px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle42 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(16px,-50px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle43 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-16px,-50px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle44 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(40px,-40px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle45 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-40px,-40px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle46 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(8px,-52px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle47 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-8px,-52px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle48 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(52px,-18px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
            @keyframes dirtParticle49 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{transform:translate(-52px,-18px) scale(0.2);opacity:0;} 100%{transform:translate(0,0) scale(1);opacity:1;} }
          `}</style>
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (crowFlyingAway) return;
              setCrowFlyingAway(true);
              // Stop dirt animation immediately
              clearInterval(dirtTimerRef.current);
              clearTimeout(dirtOffTimerRef.current);
              clearTimeout(dirtFadeTimerRef.current);
              setDirtFading(true);
              setTimeout(() => { setDirtActive(false); setDirtFading(false); }, 800);
              // Play last 4s of crow sound on fly-away
              const audio = crowAudioRef.current;
              if (audio) {
                clearTimeout(crowSpawnStopRef.current);
                audio.pause();
                const playFlyAway = () => {
                  audio.currentTime = Math.max(0, audio.duration - 4);
                  audio.volume = 0;
                  audio.play().catch(() => {});
                  // Fade in over 400ms
                  const fadeIn = setInterval(() => {
                    audio.volume = Math.min(1, audio.volume + 0.05);
                    if (audio.volume >= 1) clearInterval(fadeIn);
                  }, 40);
                  // Fade out over last 600ms
                  setTimeout(() => {
                    const fadeOut = setInterval(() => {
                      audio.volume = Math.max(0, audio.volume - 0.06);
                      if (audio.volume <= 0) { clearInterval(fadeOut); audio.pause(); }
                    }, 40);
                  }, 3400);
                };
                if (audio.readyState >= 1 && audio.duration) {
                  playFlyAway();
                } else {
                  audio.addEventListener('loadedmetadata', playFlyAway, { once: true });
                }
              }
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('scareCrow', { detail: { plotIndex: index } }));
                localStorage.setItem('stat_crows_swatted', (parseInt(localStorage.getItem('stat_crows_swatted') || '0', 10) + 1).toString());
                setCrowFlyingAway(false);
              }, 1500);
            }}
            style={{
              position: "fixed",
              left: crowLanded ? `${crowScreenPos.x + 2}px` : undefined,
              top: crowLanded ? `${crowScreenPos.y + 27}px` : undefined,
              transform: crowFlyingAway
                ? (index < 15 ? "translate(-50%, -50%) translate(-500px, -300px) scale(0.2)" : "translate(-50%, -50%) translate(500px, -300px) scale(0.2)")
                : "translate(-50%, -50%)",
              opacity: crowFlyingAway ? 0 : 1,
              transition: crowFlyingAway ? "transform 1.4s ease-in, opacity 1.4s ease-in 0.4s" : "none",
              // Bump above the tutorial dim layer (z 100001) so the crow shows bright instead of darkened.
              zIndex: parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10) < 36 ? 100002 : 9000,
              cursor: crowFlyingAway ? "default" : "crosshair",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pointerEvents: "auto",
              animation: crowLanded || crowFlyingAway ? "none" : (index < 15 ? "crowFlyInFromRight 3s ease-in-out forwards" : "crowFlyInFromLeft 3s ease-in-out forwards")
            }}
          >
            <img
              key={crowLanded ? 'peck' : 'fly'}
              src={crowFlyingAway ? "/images/badanimals/crowfly.gif" : crowLanded ? "/images/badanimals/crowpeck.gif" : "/images/badanimals/crowfly.gif"}
              alt="crow"
              style={{
                width: crowLanded ? "85px" : "70px",
                height: crowLanded ? "85px" : "70px",
                filter: parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10) === 20
                  ? "drop-shadow(0 0 6px rgba(255,220,100,0.9)) drop-shadow(0 0 12px rgba(255,180,40,0.7)) drop-shadow(0px 0px 5px rgba(255,0,0,0.8))"
                  : "drop-shadow(0px 0px 5px rgba(255,0,0,0.8))",
                animation: parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10) === 20
                  ? "tutXPulse 1.4s ease-in-out infinite"
                  : "none",
                transform: crowFlyingAway
                  ? (index < 15 ? "scaleX(1)" : "scaleX(-1)")
                  : (!crowLanded && index >= 15) ? "scaleX(-1)" : "none"
              }}
            />
          </div>
          {(dirtActive || dirtFading) && (
            <div style={{
              position: "fixed", left: 0, top: 0, pointerEvents: "none", zIndex: 999998,
              opacity: dirtFading ? 0 : 1,
              transition: dirtFading ? "opacity 0.8s ease-out" : "none",
            }}>
              {Array.from({ length: 15 }, (_, i) => (
                <div key={`dirt-${i}`} style={{
                  position: "fixed",
                  left: `${crowScreenPos.plotCX}px`,
                  top: `${crowScreenPos.plotCY}px`,
                  width: i % 3 === 0 ? "10px" : i % 3 === 1 ? "8px" : "6px",
                  height: i % 3 === 0 ? "10px" : i % 3 === 1 ? "8px" : "6px",
                  borderRadius: "50%",
                  backgroundColor: i % 4 === 0 ? "#6b4226" : i % 4 === 1 ? "#8B5E3C" : i % 4 === 2 ? "#a07040" : "#4a2e10",
                  pointerEvents: "none",
                  opacity: 0,
                  animation: `dirtParticle${i} 0.9s ease-out infinite`,
                  animationDelay: `${0.35 + i * 0.06}s`,
                }} />
              ))}
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Status Indicator */}
      <style>{`
        @keyframes statusBounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-10px); } }
        @keyframes indicatorShrink { from { transform: scale(1); opacity: 1; } to { transform: scale(0); opacity: 0; } }
      `}</style>
      {((data.needsWater || waterPhase === 'shrink') && !(data.bugCountdown > 0) && !(data.crowCountdown > 0) || (data.bugCountdown > 0 && !bugsFlyingAway) || (data.crowCountdown > 0 && crowLanded && !crowFlyingAway)) && (() => {
        const ts = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
        return !(ts >= 17 && ts <= 25);
      })() && (
        <div style={{
          position: "absolute",
          top: "-25px",
          left: "50%",
          zIndex: 9999,
          pointerEvents: "none",
          transform: waterPhase === 'shrink' ? 'translateX(-50%)' : undefined,
          animation: waterPhase === 'shrink' ? 'none' : 'statusBounce 1.5s infinite',
        }}>
          {((data.bugCountdown > 0 && !bugsFlyingAway) || (data.crowCountdown > 0 && crowLanded && !crowFlyingAway))
            ? <img src="/images/mail/!.png" alt="!" className="badge-pulse" style={{ width: '38px', height: '38px', filter: 'drop-shadow(0px 2px 2px black)', position: 'relative', left: '25px', top: '38px' }} />
            : (pestJustKilled || crowLanded || data.growStatus === 2)
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
      {(data.growStatus === 2 || checkmarkPhase === 'shrink') && !data.needsWater && waterPhase !== 'shrink' && !crowFlyingAway && !bugsFlyingAway && !pestJustKilled && (() => {
        const ts = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
        return !(ts >= 17 && ts <= 25); // hide checkmark during the scripted potato phase
      })() && (
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
              animation: checkmarkPhase === 'shrink'
                ? 'indicatorShrink 0.2s ease-in forwards'
                : 'badge-pulse 0.9s infinite ease-in-out',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CropItem;
