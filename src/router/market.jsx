import React, { useState, useEffect } from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { MARKET_VIEWPORT, MARKET_HOTSPOTS, MARKET_BEES, MARKET_STUFFS } from "../constants/scene_market";
import DexDialog from "../containers/Market_Dex";
import VendorDialog from "../containers/Market_Vendor";
import BankerDialog from "../containers/Market_Banker";
import { ID_MARKET_HOTSPOTS, ID_PRODUCE_ITEMS, ID_SEEDS, ID_POTION_ITEMS } from "../constants/app_ids";
import MarketPlaceDialog from "../containers/Market_Marketplace";
import LeaderboardDialog from "../containers/Market_Leaderboard";
import SageDialog from "../containers/Market_Sage";
import AdminPanel from "./index";
import WeatherOverlay from "../components/WeatherOverlay";
import BaseDialog from "../containers/_BaseDialog";
import BaseButton from "../components/buttons/BaseButton";
import { useNotification } from "../contexts/NotificationContext";
import { useItems } from "../hooks/useItems";

const Market = () => {
  const { width, height } = MARKET_VIEWPORT;
  const hotspots = MARKET_HOTSPOTS;
  const { refetch } = useItems();
  const [tutorialStep, setTutorialStep] = useState(() => parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));

  useEffect(() => {
    if (tutorialStep === 10) {
      setTutorialStep(11);
      localStorage.setItem('sandbox_tutorial_step', '11');
    }
    
    const stepHandler = () => setTutorialStep(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
    window.addEventListener('tutorialStepChanged', stepHandler);
    return () => {
      window.removeEventListener('tutorialStepChanged', stepHandler);
    };
  }, [tutorialStep]);

  const advanceTutorial = () => {
    const nextStep = tutorialStep + 1;
    setTutorialStep(nextStep);
    localStorage.setItem('sandbox_tutorial_step', nextStep.toString());
  };

  const getActiveHotspots = () => {
    if (tutorialStep >= 32) return hotspots;
    const makeDummy = (arr) => arr.map(h => ({ ...h, id: h.id + '_dummy' }));
    if (tutorialStep === 11) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.DEX));
    if (tutorialStep === 12) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.VENDOR));
    if (tutorialStep === 13) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.MARKET));
    if (tutorialStep === 14) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.SAGE));
    if (tutorialStep === 15) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.LEADERBOARD));
    if (tutorialStep === 16) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.BANKER));
    return [];
  };

  const dialogs = [
    {
      id: ID_MARKET_HOTSPOTS.DEX,
      component: DexDialog,
      label: "EXCHANGE TOKENS",
      header: "/images/dialog/modal-header-dex.png",
    },
    {
      id: ID_MARKET_HOTSPOTS.VENDOR,
      component: VendorDialog,
      label: "VENDOR",
      header: "/images/dialog/modal-header-vendor.png",
      headerOffset: 10,
    },
    {
      id: ID_MARKET_HOTSPOTS.BANKER,
      component: BankerDialog,
      label: "BANKER",
      header: "/images/dialog/modal-header-dex.png",
    },
    {
      id: ID_MARKET_HOTSPOTS.MARKET,
      component: MarketPlaceDialog,
      label: "MARKETPLACE",
      header: "/images/dialog/modal-header-vendor.png",
      headerOffset: 10,
    },
    {
      id: ID_MARKET_HOTSPOTS.LEADERBOARD,
      component: LeaderboardDialog,
      label: "LEADERBOARD",
      header: "/images/dialog/modal-header-leaderboard.png",
      headerOffset: 22,
    },
    {
      id: ID_MARKET_HOTSPOTS.SAGE,
      component: SageDialog,
      label: "QUEEN",
      header: "/images/dialog/modal-header-queen.png",
      headerOffset: 10,
    },
  ];
  const bees = MARKET_BEES;
  return (
    <>
      <WeatherOverlay />
      <PanZoomViewport
        backgroundSrc="/images/backgrounds/market.webp"
        hotspots={getActiveHotspots()}
        dialogs={tutorialStep >= 32 ? dialogs : []}
        width={width}
        height={height}
        stuffs={MARKET_STUFFS}
        bees={bees}
      />
      
      <AdminPanel />

      {tutorialStep >= 11 && tutorialStep <= 17 && (
        <div style={{ position: 'fixed', right: '40px', top: '50%', transform: 'translateY(-50%)', zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
          <style>{`
            a[href*="/farm"], a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; opacity: 0.5 !important; }
            div[title], button[title], .hotspot, .map-btn { pointer-events: none !important; } /* Disable clicking on map hotspots during tutorial */
            @keyframes marketHighlightBox { 0%, 100% { box-shadow: 0 0 20px 5px #00ff41; background-color: rgba(0, 255, 65, 0.2); } 50% { box-shadow: 0 0 5px 2px #00ff41; background-color: transparent; } }
            @keyframes mapIconHighlight { 0%, 100% { box-shadow: 0 0 20px 5px #00ff41; transform: scale(1.1); background-color: rgba(0,255,65,0.3); } 50% { box-shadow: 0 0 10px 2px #00ff41; transform: scale(1); background-color: transparent; } }
            ${tutorialStep === 11 ? `div[title*="EXCHANGE" i] { animation: marketHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 12 ? `div[title*="VENDOR" i], div[title*="SEED" i] { animation: marketHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 13 ? `div[title*="MARKET" i] { animation: marketHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 14 ? `div[title*="QUEEN" i] { animation: marketHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 15 ? `div[title*="LEADERBOARD" i] { animation: marketHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 16 ? `div[title*="BANKER" i] { animation: marketHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 17 ? `a[href*="/house"], img[src*="house" i] { animation: mapIconHighlight 1.5s infinite !important; border-radius: 12px; position: relative; z-index: 100001; pointer-events: auto !important; opacity: 1 !important; }` : ''}
          `}</style>
          <div style={{ position: 'relative', width: '320px', backgroundColor: 'rgba(0,0,0,0.9)', border: '4px solid #ffea00', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px', gap: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.8)', pointerEvents: 'auto' }}>
             <img src="/images/bees/sir.png" alt="Sir" style={{ height: '100px', objectFit: 'contain' }} />
             <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '14px', textAlign: 'center' }}>
               <h3 style={{ color: '#ffea00', margin: '0 0 10px 0', fontSize: '20px' }}>Great Uncle Sir Bee</h3>
               {tutorialStep === 11 && (
                 <p style={{ margin: 0, lineHeight: '1.5' }}>Welcome to the Town Market! First, you'll need some Honey to buy things. Click on the <strong>DEX</strong> to exchange your tokens for Honey!</p>
               )}
               {tutorialStep === 12 && (
                 <p style={{ margin: 0, lineHeight: '1.5' }}>Next is the <strong>Vendor</strong>! Here you can buy Seed Packs to plant on your farm. Go ahead and take a look!</p>
               )}
               {tutorialStep === 13 && (
                 <p style={{ margin: 0, lineHeight: '1.5' }}>This is the <strong>Marketplace</strong>. You can trade items with other players here!</p>
               )}
               {tutorialStep === 14 && (
                 <p style={{ margin: 0, lineHeight: '1.5' }}>That's the <strong>Queen Sage</strong>. She can help you upgrade your Worker Bees!</p>
               )}
               {tutorialStep === 15 && (
                 <p style={{ margin: 0, lineHeight: '1.5' }}>Check the <strong>Leaderboard</strong> to see who the top farmers are!</p>
               )}
               {tutorialStep === 16 && (
                 <p style={{ margin: 0, lineHeight: '1.5' }}>The <strong>Banker</strong> can securely store your tokens.</p>
               )}
               {tutorialStep === 17 && (
                 <p style={{ margin: 0, lineHeight: '1.5' }}>Now, let's head to your <strong>House</strong>! Click the House icon on the map.</p>
               )}
             </div>
             
             {tutorialStep < 17 && (
               <button onClick={advanceTutorial} style={{ padding: '8px 16px', backgroundColor: '#00ff41', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', fontFamily: 'monospace', color: '#000', marginTop: '10px' }}>
                 Next
               </button>
             )}
          </div>
        </div>
      )}

    </>
  );
};

export default Market;
