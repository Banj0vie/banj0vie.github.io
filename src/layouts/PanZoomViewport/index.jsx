import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import TooltipButton from "../../components/buttons/TooltipButton";
import GameMenu from "../GameMenu";
import { isWalletConnected, clampVolume } from "../../utils/basic";
import AuthPage from "../AuthPage";
import { useAppSelector } from "../../solana/store";
import { selectSettings } from "../../solana/store/slices/uiSlice";
import { defaultSettings } from "../../utils/settings";

if (typeof window !== 'undefined' && !window.__ls_patched_v2) {
  window.__ls_patched_v2 = true;
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    window.dispatchEvent(new CustomEvent('ls-update', { detail: { key, value } }));
  };
}

const defaultHotspots = [
  { id: "gold", label: "GOLD", x: 210, y: 110, delay: 0 },
  { id: "angler", label: "ANGLER", x: 70, y: 260, delay: 0.2 },
  { id: "gold-chest", label: "DAILY CHEST", x: 500, y: 160, delay: 0.4 },
  { id: "gardener", label: "GARDENER", x: 720, y: 100, delay: 0.6 },
  { id: "referrals", label: "REFERRALS", x: 600, y: 240, delay: 0.8 },
];

const PanZoomViewport = ({
  backgroundSrc,
  hotspots = defaultHotspots,
  dialogs = [],
  width,
  height,
  hideMenu = false,
  bees = [],
  children,
  isBig = false,
  stuffs = [],
}) => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const settings = useAppSelector(selectSettings) || defaultSettings;
  const anglerHoverAudioRef = useRef(null);
  const anglerClickAudioRef = useRef(null);

  // Center the layer in the viewport: (viewportWidth - layerWidth) / 2
  const computeInitialTx = useCallback(() => {
    if (typeof width === "number") {
      return (window?.innerWidth || 0) / 2 - width / 2;
    }
    return 0;
  }, [width]);
  const computeInitialTy = useCallback(() => {
    if (typeof height === "number") {
      return (window?.innerHeight || 0) / 2 - height / 2;
    }
    return 0;
  }, [height]);

  const [tx, setTx] = useState(() => computeInitialTx());
  const [ty, setTy] = useState(() => computeInitialTy());
  const [scale, setScale] = useState(1);
  const [activeModal, setActiveModal] = useState(null);
  
  const [isDockLocked, setIsDockLocked] = useState(
    () => localStorage.getItem("sandbox_dock_unlocked") !== "true"
  );
  const [showDockLockModal, setShowDockLockModal] = useState(false);
  const [seenDockPrompt, setSeenDockPrompt] = useState(
    () => localStorage.getItem('seen_dock_repair_prompt') === 'true'
  );

  const [menuKey, setMenuKey] = useState(0);

  useEffect(() => {
    const handleLsUpdate = (e) => {
      const k = e.detail?.key;
      if (k === 'sandbox_worker_bee_level' || k === 'sandbox_fishing_xp' || k === 'sandbox_fishing_level' || k === 'sandbox_fishing_catches') {
        setMenuKey(prev => prev + 1);
      }
      if (k === 'seen_dock_repair_prompt') {
        setSeenDockPrompt(e.detail.value === 'true');
      }
    };
    const handleBee = () => setMenuKey(prev => prev + 1);
    
    window.addEventListener('ls-update', handleLsUpdate);
    window.addEventListener('workerBeeLevelChanged', handleBee);
    return () => {
      window.removeEventListener('ls-update', handleLsUpdate);
      window.removeEventListener('workerBeeLevelChanged', handleBee);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (anglerHoverAudioRef.current) {
        anglerHoverAudioRef.current.pause();
        anglerHoverAudioRef.current.currentTime = 0;
      }
      if (anglerClickAudioRef.current) {
        anglerClickAudioRef.current.pause();
        anglerClickAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  const playAnglerHoverSound = useCallback(() => {
    if (!anglerHoverAudioRef.current) {
      anglerHoverAudioRef.current = new Audio("/sounds/FishingHoverLoop.wav");
      anglerHoverAudioRef.current.preload = "auto";
      anglerHoverAudioRef.current.loop = true;
    }
    const audio = anglerHoverAudioRef.current;
    const volumeSetting = parseFloat(settings?.soundVolume ?? 0) / 100;
    audio.volume = clampVolume(volumeSetting);
    audio.play().catch(() => {});
  }, [settings?.soundVolume]);

  const stopAnglerHoverSound = useCallback(() => {
    const audio = anglerHoverAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const playAnglerClickSound = useCallback(() => {
    if (!anglerClickAudioRef.current) {
      anglerClickAudioRef.current = new Audio("/sounds/AnglerButtonClick.wav");
      anglerClickAudioRef.current.preload = "auto";
    }
    const audio = anglerClickAudioRef.current;
    const volumeSetting = parseFloat(settings?.soundVolume ?? 0) / 100;
    audio.volume = clampVolume(volumeSetting);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [settings?.soundVolume]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setActiveModal(null);
    };
    window.addEventListener("keydown", handleEsc);
    // Re-center when window resizes or layer size props change
    const handleResize = () => {
      setTx(computeInitialTx());
      setTy(computeInitialTy());
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      window.removeEventListener("resize", handleResize);
    };
  }, [computeInitialTx, computeInitialTy]);

  const normalizeSize = (v) => {
    if (v === undefined || v === null || v === false || v === true)
      return undefined;
    return typeof v === "number" ? `${v}px` : v;
  };

  const layerInlineStyle = {
    transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
    ...(normalizeSize(width) ? { width: normalizeSize(width) } : {}),
    ...(normalizeSize(height) ? { height: normalizeSize(height) } : {}),
  };

  return isWalletConnected() ? (
    <>
      <div className="panzoom-root">

        {!hideMenu && <GameMenu key={`game-menu-${menuKey}`} />}
        <div
          ref={containerRef}
          className="panzoom-viewport"
          style={{ touchAction: "none" }}
        >
          <div className="panzoom-layer" style={layerInlineStyle}>
            {backgroundSrc && (
              <img
                className="img-scene"
                src={backgroundSrc}
                alt="Scene"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                loading="eager"
                decoding="sync"
              />
            )}
            {bees.map((b, index) => (
              <div
                key={`bee-${index}`}
                className="bee-wrapper"
                style={{ 
                  left: b.x, 
                  top: b.y, 
                  transform: b.flip ? "scaleX(-1)" : "none",
                  zIndex: b.zIndex ? b.zIndex : 0
                }}
              >
                <img
                  src={b.image}
                  alt="Bee"
                  className="img-bee"
                  style={{ animationDelay: `${b.delay}s` }}
                />
              </div>
            ))}
            {stuffs.map((s, index) => (
              <img
                key={`stuff-${index}`}
                src={s.image}
                alt="Stuff"
                className="img-stuff"
                style={{ left: s.x, top: s.y, width: s.width, height: s.height, zIndex: s.zIndex ? s.zIndex : 0 }}
              />
            ))}
            {hotspots.map((h) => (
              <TooltipButton
                key={h.id}
                data-hotspot="true"
              className={`map-btn ${isBig ? "map-big-btn" : ""} ${isDockLocked && !seenDockPrompt && (h.id === "ID_HOUSE_HOTSPOTS_ANGLER" || h.id === "angler") ? "quest-active-hotspot" : ""}`}
                label={h.label}
                style={{ left: h.x, top: h.y, animationDelay: `${h.delay}s` }}
                onMouseEnter={() => {
                  if (h.id === "ID_HOUSE_HOTSPOTS_ANGLER") {
                    playAnglerHoverSound();
                  }
                }}
                onMouseLeave={() => {
                  if (h.id === "ID_HOUSE_HOTSPOTS_ANGLER") {
                    stopAnglerHoverSound();
                  }
                }}
                onClick={() => {
                  if (h.id === "ID_HOUSE_HOTSPOTS_ANGLER" || h.id === "angler") {
                    console.log("angler click");
                    playAnglerClickSound();
                    
                    // If the dock hasn't been repaired yet, prompt the user for planks
                    if (isDockLocked) {
                      setShowDockLockModal(true);
                    if (!seenDockPrompt) {
                      localStorage.setItem('seen_dock_repair_prompt', 'true');
                      setSeenDockPrompt(true);
                      window.dispatchEvent(new CustomEvent('seenDockPrompt'));
                    }
                      return;
                    }
                  }
                  if (h.link) {
                    // Navigate based on link content
                    navigate(h.link);
                  } else {
                    setActiveModal(
                      dialogs.find((d) => d.id === h.id) || dialogs[0]
                    );
                  }
                }}
              />
            ))}
            <div className="panzoom-children">{children}</div>
          </div>
        </div>
        <div className="panzoom-sunlight"></div>
      </div>
      {activeModal && (
        <activeModal.component
          onClose={() => setActiveModal(null)}
          label={activeModal.label}
          header={activeModal.header}
          headerOffset={activeModal.headerOffset}
          actions={activeModal.actions}
        />
      )}

      {showDockLockModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1b1f3b, #12121a)',
            border: '2px solid #555',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            textAlign: 'center',
            color: 'white',
            fontFamily: 'monospace'
          }}>
            <h2 style={{ margin: '0 0 12px 0', color: '#ff9c9c' }}>Dock Destroyed!</h2>
            <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>
              A storm just came in and wrecked the dock! If you have 5 wooden planks, please donate them so we can open the dock again!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => {
                  const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
                  const PLANK_ID = 9989; // Adjust this ID to match your game's actual wooden plank item!
                  
                  if (sandboxLoot[PLANK_ID] >= 5) {
                    sandboxLoot[PLANK_ID] -= 5;
                    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
                    localStorage.setItem('sandbox_dock_unlocked', 'true');
                    localStorage.setItem('sandbox_dock_repaired', 'true');
                    setIsDockLocked(false);
                    setShowDockLockModal(false);
                    window.dispatchEvent(new CustomEvent('dockRepaired'));
                    alert("Thank you! The dock is now repaired and open.");
                  } else {
                    alert(`You don't have enough wooden planks! You need 5, but have ${sandboxLoot[PLANK_ID] || 0}.`);
                  }
                }}
                style={{ padding: '10px 16px', background: '#00ff41', border: 'none', borderRadius: '6px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' }}
              >
                Donate 5 Planks
              </button>
              <button
                onClick={() => setShowDockLockModal(false)}
                style={{ padding: '10px 16px', background: '#444', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontFamily: 'monospace' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  ) : (
    <AuthPage></AuthPage>
  );
};

export default PanZoomViewport;
