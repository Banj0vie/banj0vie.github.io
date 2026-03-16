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
const House = () => {
  const { width, height } = HOUSE_VIEWPORT;
  const hotspots = HOUSE_HOTSPOTS;

  const [fishingMinigame, setFishingMinigame] = useState(null);
  const isMouseDownRef = useRef(false);
  const minigameStateRef = useRef(null);

  useEffect(() => {
    minigameStateRef.current = fishingMinigame;
  }, [fishingMinigame]);

  useEffect(() => {
    const handleStart = (e) => {
      if (e.detail.onIntercept) e.detail.onIntercept();
      
      const diff = e.detail.difficulty || 0;
      const params = {
        0: { barSize: 80, fishSpeed: 0.015, targetChance: 0.01, progressUp: 0.5, progressDown: 0.2, hitBox: 45 },
        1: { barSize: 70, fishSpeed: 0.025, targetChance: 0.02, progressUp: 0.45, progressDown: 0.25, hitBox: 40 },
        2: { barSize: 60, fishSpeed: 0.035, targetChance: 0.03, progressUp: 0.4, progressDown: 0.3, hitBox: 35 },
        3: { barSize: 50, fishSpeed: 0.05, targetChance: 0.045, progressUp: 0.35, progressDown: 0.4, hitBox: 30 },
        4: { barSize: 40, skipChance: 0.07, targetChance: 0.06, progressUp: 0.3, progressDown: 0.5, hitBox: 25 }
      }[diff];

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
  return (
    <>
      <WeatherOverlay />
      <PanZoomViewport
        backgroundSrc="/images/backgrounds/house.webp"
        hotspots={hotspots}
        dialogs={dialogs}
        width={width}
        height={height}
        bees={bees}
      />
      <AdminPanel />
      
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
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'flex-end', height: '350px' }}>
                
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
