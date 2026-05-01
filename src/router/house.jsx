import React, { useState, useEffect, useRef } from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { HOUSE_BEES, HOUSE_HOTSPOTS, HOUSE_VIEWPORT } from "../constants/scene_house";
import { ID_HOUSE_HOTSPOTS } from "../constants/app_ids";
import GoldDialog from "../containers/House_Gold";
import GardnerDialog from "../containers/House_Gardner";
import ReferralDialog from "../containers/House_Referral";
import GoldChestDialog from "../containers/House_Gold_Chest";
import AnglerDialog from "../containers/House_Angler";
import AdminPanel from "./index";
import WeatherOverlay from "../components/WeatherOverlay";
import { useNotification } from "../contexts/NotificationContext";
import { useItems } from "../hooks/useItems";
import { RegionalQuestBoard, getQuestData } from "./farm";
const House = () => {
  const { width, height } = HOUSE_VIEWPORT;
  const hotspots = HOUSE_HOTSPOTS;

  const [fishingMinigame, setFishingMinigame] = useState(null);
  const isMouseDownRef = useRef(false);
  const minigameStateRef = useRef(null);
  const { show } = useNotification();
  const { refetch } = useItems();
  const [showFishingBoard, setShowFishingBoard] = useState(false);
  const [completedQuests, setCompletedQuests] = useState(() => JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]'));

  const [fishingXp, setFishingXp] = useState(() => parseInt(localStorage.getItem('sandbox_fishing_xp') || '0', 10));
  const fishingLevel = Math.floor(Math.sqrt((fishingXp || 0) / 150)) + 1;
  const fishingProgress = ((fishingXp - Math.pow(fishingLevel - 1, 2) * 150) / (Math.pow(fishingLevel, 2) * 150 - Math.pow(fishingLevel - 1, 2) * 150)) * 100;

  useEffect(() => {
      const handleLsUpdate = (e) => {
          if (e.detail.key === 'sandbox_fishing_xp') setFishingXp(parseInt(e.detail.value, 10));
      };
      window.addEventListener('ls-update', handleLsUpdate);
      return () => window.removeEventListener('ls-update', handleLsUpdate);
  }, []);

  useEffect(() => {
      const handleNotif = (e) => show(e.detail.msg, e.detail.type);
      window.addEventListener('showNotification', handleNotif);
      return () => window.removeEventListener('showNotification', handleNotif);
  }, [show]);

  useEffect(() => {
    localStorage.setItem('seen_dock_repair_prompt', 'true');
    window.dispatchEvent(new CustomEvent('seenDockPrompt'));
    if (localStorage.getItem('sandbox_beejamin_dock_visited') !== 'true') {
      localStorage.setItem('sandbox_beejamin_dock_visited', 'true');
      window.dispatchEvent(new CustomEvent('questStateChanged'));
    }
  }, []);

  useEffect(() => {
    minigameStateRef.current = fishingMinigame;
  }, [fishingMinigame]);

  useEffect(() => {
    const handleStart = (e) => {
      if (e.detail.onIntercept) e.detail.onIntercept();
      
      const diff = e.detail.difficulty || 0;
      const params = {
        0: { barSize: 150, fishSpeed: 0.005, targetChance: 0.002, progressUp: 1.5, progressDown: 0.05, hitBox: 75 },
        1: { barSize: 120, fishSpeed: 0.015, targetChance: 0.01, progressUp: 0.8, progressDown: 0.1, hitBox: 60 },
        2: { barSize: 80, fishSpeed: 0.03, targetChance: 0.03, progressUp: 0.5, progressDown: 0.2, hitBox: 40 },
        3: { barSize: 60, fishSpeed: 0.04, targetChance: 0.04, progressUp: 0.4, progressDown: 0.3, hitBox: 30 },
        4: { barSize: 40, skipChance: 0.07, targetChance: 0.06, progressUp: 0.3, progressDown: 0.5, hitBox: 25 }
      }[diff] || { barSize: 70, fishSpeed: 0.025, targetChance: 0.02, progressUp: 0.45, progressDown: 0.25, hitBox: 40 };

      setFishingMinigame({
        status: 'playing',
        barPos: 0,
        fishPos: 50,
        progress: 25,
        velocity: 0,
        fishVelocity: 0,
        fishTarget: 50,
        callback: e.detail.callback,
        ...params
      });
    };
    window.addEventListener('startFishingMinigame', handleStart);
    return () => window.removeEventListener('startFishingMinigame', handleStart);
  }, []);

  const [tutorialStep, setTutorialStep] = useState(() => parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
  const [dockTutPage, setDockTutPage] = useState(0);
  const [showTavernClosed, setShowTavernClosed] = useState(false);

  useEffect(() => {
    if (dockTutPage !== 21) return;
    const handler = (e) => {
      const link = e.target.closest('a[href*="/tavern"]');
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      setShowTavernClosed(true);
      setDockTutPage(22);
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [dockTutPage]);

  useEffect(() => {
    const onSkip = () => {
      setTutorialStep(36);
      setDockTutPage(0);
      localStorage.setItem('sandbox_tutorial_step', '36');
      window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
    };
    window.addEventListener('skipTutorial', onSkip);
    return () => window.removeEventListener('skipTutorial', onSkip);
  }, []);

  useEffect(() => {
    if (tutorialStep === 17 || tutorialStep === 19) {
      setTutorialStep(20);
      localStorage.setItem('sandbox_tutorial_step', '20');
    }
    if (tutorialStep === 20) {
      setDockTutPage(16);
    }
  }, [tutorialStep]);

  const advanceTutorial = () => {
    const nextStep = tutorialStep + 1;
    setDockTutPage(0);
    setTutorialStep(nextStep);
    localStorage.setItem('sandbox_tutorial_step', nextStep.toString());
    window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
  };


  const getActiveHotspots = () => {
    if (tutorialStep >= 36) return hotspots;
    const makeDummy = (arr) => arr.map(h => ({ ...h, id: h.id + '_dummy' }));
    if (tutorialStep === 20 && dockTutPage === 20) return makeDummy(hotspots.filter(h => h.id === ID_HOUSE_HOTSPOTS.ANGLER || h.id === ID_HOUSE_HOTSPOTS.REFERRALS));
    if (tutorialStep === 20 && dockTutPage === 19) return makeDummy(hotspots.filter(h => h.id === ID_HOUSE_HOTSPOTS.ANGLER || h.id === ID_HOUSE_HOTSPOTS.GARDNER));
    if (tutorialStep === 20 && dockTutPage === 18) return makeDummy(hotspots.filter(h => h.id === ID_HOUSE_HOTSPOTS.ANGLER || h.id === ID_HOUSE_HOTSPOTS.GOLD_CHEST));
    if (tutorialStep === 20) return makeDummy(hotspots.filter(h => h.id === ID_HOUSE_HOTSPOTS.ANGLER));
    if (tutorialStep === 21) return makeDummy(hotspots.filter(h => h.id === ID_HOUSE_HOTSPOTS.GOLD_CHEST));
    if (tutorialStep === 22) return makeDummy(hotspots.filter(h => h.id === ID_HOUSE_HOTSPOTS.GARDNER));
    if (tutorialStep === 23) return makeDummy(hotspots.filter(h => h.id === ID_HOUSE_HOTSPOTS.REFERRALS));
    return []; 
  };

  useEffect(() => {
    const handlePointerDown = () => { isMouseDownRef.current = true; };
    const handlePointerUp = () => { isMouseDownRef.current = false; };
    
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    let frameId;
    let lastTime = performance.now();

    const loop = (time) => {
      frameId = requestAnimationFrame(loop);
      const dt = time - lastTime;
      lastTime = time;

      const state = minigameStateRef.current;
      if (!state || state.status !== 'playing') return;

      let { barPos, fishPos, progress, velocity, fishVelocity, fishTarget, barSize, fishSpeed, targetChance, progressUp, progressDown, hitBox } = state;

      // Physics - Bar
      if (isMouseDownRef.current) {
        velocity += 1.5; // thrust
      } else {
        velocity -= 1.5; // gravity
      }
      velocity *= 0.85; // friction
      barPos += velocity;

      if (barPos < 0) { barPos = 0; velocity = 0; }
      if (barPos > 300 - barSize) { barPos = 300 - barSize; velocity = 0; }

      // Physics - Fish AI
      if (Math.random() < targetChance) { 
        fishTarget = Math.random() * 270; // 300 - 30
      }
      
      const diff = fishTarget - fishPos;
      fishVelocity += diff * fishSpeed;
      fishVelocity *= 0.85;
      fishPos += fishVelocity;

      if (fishPos < 0) { fishPos = 0; fishVelocity *= -1; }
      if (fishPos > 270) { fishPos = 270; fishVelocity *= -1; }

      // Collision Check
      const fishCenter = fishPos + 15;
      const barCenter = barPos + (barSize / 2);
      const isIntersecting = Math.abs(fishCenter - barCenter) < hitBox;

      if (isIntersecting) {
        progress += progressUp;
      } else {
        progress -= progressDown;
      }

      if (progress >= 100) {
        setFishingMinigame(prev => ({ ...prev, status: 'success' }));
        
        const currentCatches = parseInt(localStorage.getItem('sandbox_fishing_catches') || '0', 10);
        localStorage.setItem('sandbox_fishing_catches', (currentCatches + 1).toString());
        window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'sandbox_fishing_catches', value: (currentCatches + 1).toString() } }));

        // Leaderboard tracking
        const fishPts = parseInt(localStorage.getItem('sandbox_fishing_points') || '0', 10);
        localStorage.setItem('sandbox_fishing_points', (fishPts + 10).toString());
        const fishW = (0.2 + Math.random() * 1.3).toFixed(2);
        const storedFish = JSON.parse(localStorage.getItem('sandbox_heaviest_fish') || 'null');
        if (!storedFish || parseFloat(fishW) > parseFloat(storedFish.weight)) {
          localStorage.setItem('sandbox_heaviest_fish', JSON.stringify({ weight: fishW, name: 'Fish' }));
        }

        const xpGains = { 80: 10, 70: 20, 60: 35, 50: 50, 40: 75 };
        const xpToAdd = xpGains[state.barSize] || 10;
        const currentXp = parseInt(localStorage.getItem('sandbox_fishing_xp') || '0', 10);
        const oldLevel = Math.floor(Math.sqrt((currentXp || 0) / 150)) + 1;
        const newXp = currentXp + xpToAdd;
        localStorage.setItem('sandbox_fishing_xp', newXp.toString());
        window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `+${xpToAdd} Fishing XP!`, type: "success" } }));
        // Manually trigger ls-update for components listening to it
        window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'sandbox_fishing_xp', value: newXp.toString() } }));
        const newLevel = Math.floor(Math.sqrt((newXp || 0) / 150)) + 1;
        if (newLevel > oldLevel) {
          window.dispatchEvent(new CustomEvent('levelUp', { detail: { skill: 'Fishing', level: newLevel } }));
        }

        if (!localStorage.getItem('easter_blue_egg')) {
            localStorage.setItem('easter_blue_egg', 'true');
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            sandboxLoot[9984] = (sandboxLoot[9984] || 0) + 1;
            sandboxLoot[9987] = 1;
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: "🐣 You fished up the Blue Easter Egg!", type: "success" } }));
        }

        setTimeout(() => {
          if (state.callback) state.callback(true);
          setFishingMinigame(null);
        }, 1500);
      } else if (progress <= 0) {
        setFishingMinigame(prev => ({ ...prev, status: 'fail' }));
        setTimeout(() => {
          if (state.callback) state.callback(false);
          setFishingMinigame(null);
        }, 1500);
      } else {
        setFishingMinigame(prev => ({
          ...prev, barPos, fishPos, progress, velocity, fishVelocity, fishTarget
        }));
      }
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      cancelAnimationFrame(frameId);
    };
  }, []);

  const dialogs = [
    {
      id: ID_HOUSE_HOTSPOTS.GOLD,
      component: GoldDialog,
      label: "BLAST GOLD III",
    },
    {
      id: ID_HOUSE_HOTSPOTS.GARDNER,
      component: GardnerDialog,
      label: "GARDNER",
      header: "/images/dialog/modal-header-gardner.png"
    },
    {
      id: ID_HOUSE_HOTSPOTS.REFERRALS,
      component: ReferralDialog,
      label: "",
    },
    {
      id: ID_HOUSE_HOTSPOTS.GOLD_CHEST,
      component: GoldChestDialog,
      label: "DAILY CHEST",
      header: "/images/dialog/modal-header-chest.png"
    },
    {
      id: ID_HOUSE_HOTSPOTS.ANGLER,
      component: AnglerDialog,
      label: "QUIET POND",
      header: "/images/dialog/modal-header-angler.png",
      headerOffset: 50,
    },
  ];
  const bees = HOUSE_BEES;
  
  const availableFishingQuests = getQuestData().filter(q => q.type === 'fishing' && q.unlockCondition(tutorialStep, completedQuests) && !completedQuests.includes(q.id));
  const activeFishingIds = availableFishingQuests.map(q => q.id);
  const seenFishingIds = (localStorage.getItem('seen_fishing_missions_ids') || '').split(',').filter(Boolean);
  const hasNewFishingMissions = activeFishingIds.some(id => !seenFishingIds.includes(id));

  const [isGlobalDialogOpen, setIsGlobalDialogOpen] = useState(false);
  const [isPetOpen, setIsPetOpen] = useState(false);

  useEffect(() => {
    const handleGlobalDialog = (e) => setIsGlobalDialogOpen(e.detail);
    window.addEventListener('globalDialogOpen', handleGlobalDialog);
    return () => window.removeEventListener('globalDialogOpen', handleGlobalDialog);
  }, []);

  useEffect(() => {
    const handlePetOpen = (e) => setIsPetOpen(e.detail);
    window.addEventListener('petDialogOpen', handlePetOpen);
    return () => window.removeEventListener('petDialogOpen', handlePetOpen);
  }, []);

  const hideIcons = isGlobalDialogOpen || isPetOpen;

  return (
    <>
      <WeatherOverlay />
      
      {showFishingBoard && (
        <RegionalQuestBoard 
          onClose={() => setShowFishingBoard(false)} 
          title="FISHING MISSIONS"
          questType="fishing"
          tutorialStep={tutorialStep}
          completedQuests={completedQuests}
          setCompletedQuests={setCompletedQuests}
          refetch={refetch} 
        />
      )}

      {/* Fish Banner */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '0px' }}>
        {/* PFP with border on top */}
        <div style={{ position: 'relative', display: 'inline-block', left: '-10px' }}>
          <img src="/images/fish/fisherpfp.png" alt="Fisher PFP" style={{ height: '80px', width: '80px', objectFit: 'contain', display: 'block' }} />
          <img src="/images/fish/fisherpfpborder.png" alt="Fisher PFP Border" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90px', height: '90px', objectFit: 'contain' }} />
        </div>
        {/* Banner */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src="/images/fish/fisherbanner.png" alt="Fisher Banner" style={{ height: '90px', objectFit: 'contain', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '8px', paddingBottom: '18px' }}>
            <span style={{ fontFamily: 'Cartoonist', fontSize: '32px', color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', whiteSpace: 'nowrap' }}>LEVEL {fishingLevel}</span>
          </div>
        </div>
      </div>

      <PanZoomViewport
        backgroundSrc="/images/backgrounds/house.webp"
        hotspots={getActiveHotspots()}
        dialogs={tutorialStep >= 36 ? dialogs : []}
        width={width}
        height={height}
        bees={bees}
        initialScale={1.55}
        initialOffsetX={10}
        backgroundOffsetY={-73}
        disablePanZoom
        hotspotScale={0.75}
        onHotspotClick={(id) => {
          if (tutorialStep === 20) {
            setDockTutPage(16);
            return true;
          }
          return false;
        }}
      >
      </PanZoomViewport>
      <AdminPanel />
      
      {tutorialStep >= 20 && tutorialStep <= 24 && dockTutPage === 0 && (
        <>
          <style>{`
            a[href*="/farm"], a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; }
            a[href*="/valley"], a[href*="/tavern"] { display: none !important; }
            .tooltip-btn span { visibility: hidden !important; }
            .tooltip-btn { background-image: none !important; }
            div[title], button[title], .hotspot, .map-btn { pointer-events: none !important; }
            @keyframes houseHighlightBox { 0%, 100% { box-shadow: 0 0 20px 5px #00ff41; background-color: rgba(0, 255, 65, 0.2); } 50% { box-shadow: 0 0 5px 2px #00ff41; background-color: transparent; } }
            @keyframes mapIconHighlight { 0%, 100% { transform: scale(1.1); } 50% { transform: scale(1); } }
            ${tutorialStep === 20 ? `div[title*="POND" i], div[title*="ANGLER" i], div[title*="DOCK" i] { pointer-events: auto !important; cursor: pointer !important; }` : ''}
            ${tutorialStep === 21 ? `div[title*="CHEST" i] { animation: houseHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 22 ? `div[title*="GARDNER" i] { animation: houseHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 23 ? `div[title*="REFERRAL" i] { animation: houseHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 24 ? `a[href*="/tavern"] { animation: mapIconHighlight 1.5s infinite !important; position: relative; z-index: 100001; pointer-events: auto !important; }` : ''}
          `}</style>
          <div style={{ position: 'fixed', right: '0px', bottom: '0px', zIndex: 100000 }}>
            <div style={{ position: 'relative', width: '666px' }}>
              <img src="/images/tutorial/sirbeetextbox.png" alt="Tutorial" style={{ width: '666px', objectFit: 'contain' }} />
              <div style={{ position: 'absolute', top: 'calc(10% + 45px)', left: '22%', right: '10%', bottom: '22%', display: 'flex', alignItems: 'flex-start' }}>
                {tutorialStep === 20 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    Welcome to your House! Down at the Quiet Pond, you can play the Angler minigame to catch fish!
                  </p>
                )}
                {tutorialStep === 21 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    Here is your Daily Chest. Don't forget to claim your free rewards every day!
                  </p>
                )}
                {tutorialStep === 22 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    The Gardner can help you manage your land and plots.
                  </p>
                )}
                {tutorialStep === 23 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    And finally, check the Referrals board to invite friends and earn rewards!
                  </p>
                )}
                {tutorialStep === 24 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    Next up is the Tavern! Click the Tavern icon to visit the Tavern.
                  </p>
                )}
              </div>
              {tutorialStep >= 20 && tutorialStep <= 23 && (
                <div className="tut-arrow" onClick={advanceTutorial}>
                  <img src="/images/tutorial/next.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {dockTutPage >= 16 && dockTutPage <= 22 && (
        <style>{`
          a[href*="/valley"] { display: none !important; }
          ${dockTutPage !== 21 ? `a[href*="/tavern"] { display: none !important; }` : ''}
          ${dockTutPage === 16 ? `.tooltip-btn span { visibility: hidden !important; } .tooltip-btn { background-image: none !important; }` : ''}
          ${dockTutPage === 18 ? `.tooltip-btn span { visibility: hidden !important; } .tooltip-btn { background-image: none !important; } .tooltip-btn[title*="CHEST" i] span { visibility: visible !important; } .tooltip-btn[title*="CHEST" i] { background-image: url('/images/backgrounds/tooltip_bg.png') !important; }` : ''}
          ${dockTutPage === 19 ? `.tooltip-btn span { visibility: hidden !important; } .tooltip-btn { background-image: none !important; } .tooltip-btn[title*="GARDEN" i] span { visibility: visible !important; } .tooltip-btn[title*="GARDEN" i] { background-image: url('/images/backgrounds/tooltip_bg.png') !important; }` : ''}
          ${dockTutPage === 20 ? `.tooltip-btn span { visibility: hidden !important; } .tooltip-btn { background-image: none !important; } .tooltip-btn[title*="REFERRAL" i] span { visibility: visible !important; } .tooltip-btn[title*="REFERRAL" i] { background-image: url('/images/backgrounds/tooltip_bg.png') !important; }` : ''}
          ${dockTutPage === 21 ? `@keyframes tavernIconPulse { 0%, 100% { filter: drop-shadow(0 0 8px #ffe033) drop-shadow(0 0 18px #ffb800); } 50% { filter: drop-shadow(0 0 18px #ffe033) drop-shadow(0 0 36px #ffb800) brightness(1.2); } } a[href*="/tavern"] { animation: tavernIconPulse 1.5s infinite !important; pointer-events: auto !important; z-index: 100002 !important; position: relative !important; display: flex !important; }` : ''}
          ${dockTutPage === 22 ? `.tooltip-btn span { visibility: hidden !important; } .tooltip-btn { background-image: none !important; } a[href*="/tavern"] { display: flex !important; pointer-events: none !important; }` : ''}
        `}</style>
      )}

      {dockTutPage === 16 && (
        <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 100001 }}>
          <div style={{ position: 'relative', width: '490px' }}>
            <img src="/images/tutorial/tutp16.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain', display: 'block' }} />
            <div className="tut-arrow" onClick={() => setDockTutPage(17)}>
              <img src="/images/tutorial/next.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}

      {dockTutPage === 17 && (
        <div style={{ position: 'fixed', right: '420px', bottom: '420px', zIndex: 100001 }}>
          <div style={{ position: 'relative', width: '490px' }}>
            <img src="/images/tutorial/tutp17.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain', display: 'block' }} />
            <div className="tut-arrow" style={{ top: 'calc(50% + 55px)' }} onClick={() => setDockTutPage(18)}>
              <img src="/images/tutorial/next.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}

      {dockTutPage === 18 && (
        <div style={{ position: 'fixed', right: '420px', bottom: '370px', zIndex: 100001 }}>
          <div style={{ position: 'relative', width: '490px' }}>
            <img src="/images/tutorial/tutp18.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain', display: 'block' }} />
            <div className="tut-arrow" onClick={() => setDockTutPage(19)}>
              <img src="/images/tutorial/next.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}

      {dockTutPage === 19 && (
        <div style={{ position: 'fixed', right: '520px', bottom: '370px', zIndex: 100001 }}>
          <div style={{ position: 'relative', width: '490px' }}>
            <img src="/images/tutorial/tutp19.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain', display: 'block' }} />
            <div className="tut-arrow" style={{ top: 'calc(50% + 80px)' }} onClick={() => setDockTutPage(20)}>
              <img src="/images/tutorial/next.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}

      {dockTutPage === 20 && (
        <div style={{ position: 'fixed', right: '120px', bottom: '170px', zIndex: 100001 }}>
          <div style={{ position: 'relative', width: '490px' }}>
            <img src="/images/tutorial/tutp20.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain', display: 'block' }} />
            <div className="tut-arrow" style={{ top: 'calc(50% + 60px)' }} onClick={() => setDockTutPage(21)}>
              <img src="/images/tutorial/next.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}

      {dockTutPage === 21 && (
        <div style={{ position: 'fixed', right: '120px', bottom: '170px', zIndex: 100001 }}>
          <div style={{ position: 'relative', width: '490px' }}>
            <img src="/images/tutorial/tutp21.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain', display: 'block' }} />
          </div>
        </div>
      )}

      {showTavernClosed && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100003, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowTavernClosed(false)}>
          <div style={{ background: '#2c1a0e', border: '4px solid #a67c52', borderRadius: '16px', padding: '40px 60px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <p style={{ fontFamily: 'Cartoonist', fontSize: '28px', color: '#ffe033', margin: '0 0 20px 0' }}>Tavern is Closed</p>
            <button onClick={() => setShowTavernClosed(false)} style={{ fontFamily: 'Cartoonist', fontSize: '16px', backgroundColor: '#a67c52', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 30px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {dockTutPage === 22 && (
        <div style={{ position: 'fixed', right: '120px', bottom: '170px', zIndex: 100001 }}>
          <div style={{ position: 'relative', width: '490px' }}>
            <img src="/images/tutorial/tutp22.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain', display: 'block' }} />
            <div className="tut-arrow" onClick={() => {
              setTutorialStep(25);
              localStorage.setItem('sandbox_tutorial_step', '25');
              localStorage.setItem('sandbox_dock_tut_page', '23');
              window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
              window.location.href = '/valley';
            }}>
              <img src="/images/tutorial/next.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}

      {/* Stardew Valley Fishing Minigame Overlay */}
      {fishingMinigame && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); isMouseDownRef.current = true; }}
          onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); isMouseDownRef.current = false; }}
        >
          <div style={{ backgroundColor: '#2c221a', border: '4px solid #a67c52', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#fff', fontFamily: 'monospace', boxShadow: '0 10px 25px rgba(0,0,0,0.8)', minWidth: '400px', userSelect: 'none' }}>
            <h2 style={{ color: '#00ff41', margin: '0 0 20px 0', fontSize: '28px' }}>FISHING MINIGAME</h2>
            
            {fishingMinigame.status === 'playing' ? (
              <>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '8px', padding: '5px 15px', display: 'inline-block', marginBottom: '15px' }}>
                  <span style={{ color: '#ccc', fontSize: '14px' }}>Fishing Level: </span>
                  <span style={{ color: '#00bfff', fontWeight: 'bold', fontSize: '18px' }}>{fishingLevel}</span>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${fishingProgress}%`, height: '100%', backgroundColor: '#00bfff', transition: 'width 0.3s' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'flex-end', height: '300px' }}>
                {/* Fishing Bar Container */}
                <div style={{ width: '50px', height: '300px', backgroundColor: 'rgba(0,150,255,0.2)', border: '3px solid #5a402a', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                  {/* Catch Area (Green Bar) */}
                  <div style={{ position: 'absolute', bottom: `${fishingMinigame.barPos}px`, left: '0', width: '100%', height: `${fishingMinigame.barSize}px`, backgroundColor: 'rgba(0,255,65,0.4)', border: '3px solid #00ff41', borderRadius: '4px', boxSizing: 'border-box', transition: 'height 0.2s ease' }} />
                  {/* Fish */}
                  <div style={{ position: 'absolute', bottom: `${fishingMinigame.fishPos}px`, left: '50%', transform: 'translateX(-50%)', fontSize: '30px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>🐟</div>
                </div>

                {/* Progress Bar Container */}
                <div style={{ width: '25px', height: '300px', backgroundColor: 'rgba(0,0,0,0.5)', border: '3px solid #5a402a', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: `${fishingMinigame.progress}%`, backgroundColor: fishingMinigame.progress > 75 ? '#00ff41' : fishingMinigame.progress > 25 ? '#ffea00' : '#ff4444', transition: 'background-color 0.2s, height 0.1s linear' }} />
                </div>

              </div>
              </>
            ) : fishingMinigame.status === 'success' ? (
              <h3 style={{ color: '#00ff41', margin: '20px 0', fontSize: '28px' }}>CAUGHT IT!</h3>
            ) : (
              <h3 style={{ color: '#ff4444', margin: '20px 0', fontSize: '28px' }}>IT GOT AWAY...</h3>
            )}
            
            {fishingMinigame.status === 'playing' && (
              <p style={{ color: '#ccc', marginTop: '20px', fontSize: '14px' }}>Click and hold to raise the bar.<br/>Keep the fish inside the green area!</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default House;
