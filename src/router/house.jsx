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

  useEffect(() => {
    if (tutorialStep === 17 || tutorialStep === 19) {
      setTutorialStep(20);
      localStorage.setItem('sandbox_tutorial_step', '20');
    }
  }, [tutorialStep]);

  const advanceTutorial = () => {
    const nextStep = tutorialStep + 1;
    setTutorialStep(nextStep);
    localStorage.setItem('sandbox_tutorial_step', nextStep.toString());
  };

  const getActiveHotspots = () => {
    if (tutorialStep >= 32) return hotspots;
    const makeDummy = (arr) => arr.map(h => ({ ...h, id: h.id + '_dummy' }));
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
      label: "REFERRAL",
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

      <PanZoomViewport
        backgroundSrc="/images/backgrounds/house.webp"
        hotspots={getActiveHotspots()}
        dialogs={tutorialStep >= 32 ? dialogs : []}
        width={width}
        height={height}
        bees={bees}
      >
        {/* Fishing Board UI Overlay inside viewport */}
        {(tutorialStep >= 32 || localStorage.getItem('sandbox_dock_repaired') === 'true' || localStorage.getItem('sandbox_dock_unlocked') === 'true') && (
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowFishingBoard(true);
            const allSeen = Array.from(new Set([...seenFishingIds, ...activeFishingIds]));
            localStorage.setItem('seen_fishing_missions_ids', allSeen.join(','));
            window.dispatchEvent(new CustomEvent('questsRead'));
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(0, 191, 255, 0.8))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
            }}
            style={{ position: 'absolute', left: '10px', top: '240px', zIndex: 100000, cursor: 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'visible' }}
          >
            {hasNewFishingMissions && <div style={{position:'absolute', top:'-5px', right:'-5px', width:'20px', height:'20px', backgroundColor:'#ff4444', borderRadius:'50%', border:'2px solid white', zIndex:11, display:'flex', justifyContent:'center', alignItems:'center', color:'white', fontWeight:'bold', fontSize:'12px', fontFamily:'monospace', animation:'pulse-dot 1s infinite'}}>!</div>}
            <div style={{ fontSize: '40px', backgroundColor: 'rgba(0, 191, 255, 0.3)', padding: '5px 10px', borderRadius: '8px', border: '2px solid #00bfff' }}>📋</div>
            <div style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#00bfff', padding: '2px 5px', borderRadius: '4px', fontSize: '10px', marginTop: '5px', fontFamily: 'monospace', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>FISHING MISSIONS</div>
          </div>
        )}
      </PanZoomViewport>
      <AdminPanel />
      
      {tutorialStep >= 20 && tutorialStep <= 24 && (
        <div style={{ position: 'fixed', right: '40px', top: '50%', transform: 'translateY(-50%)', zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
          <style>{`
            a[href*="/farm"], a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; }
            div[title], button[title], .hotspot, .map-btn { pointer-events: none !important; } /* Disable clicking on map hotspots during tutorial */
            @keyframes houseHighlightBox { 0%, 100% { box-shadow: 0 0 20px 5px #00ff41; background-color: rgba(0, 255, 65, 0.2); } 50% { box-shadow: 0 0 5px 2px #00ff41; background-color: transparent; } }
            @keyframes mapIconHighlight { 0%, 100% { box-shadow: 0 0 20px 5px #00ff41; transform: scale(1.1); background-color: rgba(0,255,65,0.3); } 50% { box-shadow: 0 0 10px 2px #00ff41; transform: scale(1); background-color: transparent; } }
            ${tutorialStep === 20 ? `div[title*="POND" i], div[title*="ANGLER" i] { animation: houseHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 21 ? `div[title*="CHEST" i] { animation: houseHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 22 ? `div[title*="GARDNER" i] { animation: houseHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 23 ? `div[title*="REFERRAL" i] { animation: houseHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 24 ? `a[href*="/farm"], img[src*="farm" i] { animation: mapIconHighlight 1.5s infinite !important; border-radius: 12px; position: relative; z-index: 100001; pointer-events: auto !important; }` : ''}
          `}</style>
          <div style={{ position: 'relative', width: '320px', backgroundColor: 'rgba(0,0,0,0.9)', border: '4px solid #ffea00', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px', gap: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.8)', pointerEvents: 'auto' }}>
              <img src="/images/bees/sir.png" alt="Sir" style={{ height: '100px', objectFit: 'contain' }} />
              <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '14px', textAlign: 'center' }}>
                <h3 style={{ color: '#ffea00', margin: '0 0 10px 0', fontSize: '20px' }}>Great Uncle Sir Bee</h3>
                
                {tutorialStep === 20 && (
                  <p style={{ margin: 0, lineHeight: '1.5' }}>Welcome to your House! Down at the <strong>Quiet Pond</strong>, you can play the Angler minigame to catch fish!</p>
                )}
                {tutorialStep === 21 && (
                  <p style={{ margin: 0, lineHeight: '1.5' }}>Here is your <strong>Daily Chest</strong>. Don't forget to claim your free rewards every day!</p>
                )}
                {tutorialStep === 22 && (
                  <p style={{ margin: 0, lineHeight: '1.5' }}>The <strong>Gardner</strong> can help you manage your land and plots.</p>
                )}
                {tutorialStep === 23 && (
                  <p style={{ margin: 0, lineHeight: '1.5' }}>And finally, check the <strong>Referrals</strong> board to invite friends and earn rewards!</p>
                )}
                {tutorialStep === 24 && (
                  <p style={{ margin: 0, lineHeight: '1.5' }}>That's it for the town tour! Head back to the <strong>Farm</strong> to get started!</p>
                )}
              </div>
              
              {tutorialStep < 24 ? (
                <button onClick={advanceTutorial} style={{ padding: '8px 16px', backgroundColor: '#00ff41', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', fontFamily: 'monospace', color: '#000', marginTop: '10px' }}>
                  Next
                </button>
              ) : (
                <button onClick={() => { setTutorialStep(25); localStorage.setItem('sandbox_tutorial_step', '25'); }} style={{ position: 'absolute', top: '15px', right: '15px', padding: '5px 12px', backgroundColor: '#ff4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', fontFamily: 'monospace', color: 'white' }}>X</button>
              )}
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
