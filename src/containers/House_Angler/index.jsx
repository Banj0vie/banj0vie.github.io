import React, { useState, useCallback, useEffect, useRef } from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import BaseButton from "../../components/buttons/BaseButton";
import { ID_ANGLER_PAGES } from "../../constants/app_ids";
import AnglerMenu from "./AnglerMenu";
import CraftBait from "./CraftBait";
import StartFishing from "./StartFishing";
import Fishing from "./Fishing";
import { useFishing } from "../../hooks/useFishing";
import { useSolanaWallet } from "../../hooks/useSolanaWallet";

const ProgressBar = ({ progress, label, color = '#00ff41' }) => (
  <div style={{ width: '100%', marginBottom: '10px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
      <span>{label}</span>
      <span>{progress.toFixed(2)}%</span>
    </div>
    <div style={{ height: '20px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '4px', border: '1px solid #5a402a', overflow: 'hidden' }}>
      <div style={{ width: `${progress}%`, height: '100%', backgroundColor: color, transition: 'width 0.5s ease-in-out' }} />
    </div>
  </div>
);

const AnglerLeveling = ({ onBack }) => {
  const [fishingXp, setFishingXp] = useState(() => parseInt(localStorage.getItem('sandbox_fishing_xp') || '0', 10));
  const [baitXp, setBaitXp] = useState(() => parseInt(localStorage.getItem('sandbox_bait_crafting_xp') || '0', 10));

  useEffect(() => {
    const handleLsUpdate = (e) => {
      if (e.detail?.key === 'sandbox_fishing_xp') {
        setFishingXp(parseInt(localStorage.getItem('sandbox_fishing_xp') || '0', 10));
      }
      if (e.detail?.key === 'sandbox_bait_crafting_xp') {
        setBaitXp(parseInt(localStorage.getItem('sandbox_bait_crafting_xp') || '0', 10));
      }
    };
    window.addEventListener('ls-update', handleLsUpdate);
    return () => window.removeEventListener('ls-update', handleLsUpdate);
  }, []);

  const getLevelInfo = (xp) => {
    if (xp === 0) return { level: 1, progress: 0, currentXp: 0, neededXp: 100 };
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;
    const xpForCurrentLevel = 100 * Math.pow(level - 1, 2);
    const xpForNextLevel = 100 * Math.pow(level, 2);
    const progress = xpForNextLevel - xpForCurrentLevel === 0 ? 100 : ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    return { level, progress, currentXp: xp - xpForCurrentLevel, neededXp: xpForNextLevel - xpForCurrentLevel };
  };

  const fishingLevelInfo = getLevelInfo(fishingXp);
  const baitLevelInfo = getLevelInfo(baitXp);

  return (
    <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', textAlign: 'center', minWidth: '400px' }}>
      <h2 style={{ color: '#00bfff', margin: '0 0 20px 0' }}>Angler Levels</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#ffea00', borderBottom: '1px solid #5a402a', paddingBottom: '10px', marginBottom: '15px' }}>
          Fishing Level: {fishingLevelInfo.level}
        </h3>
        <ProgressBar progress={fishingLevelInfo.progress} label={`XP: ${fishingLevelInfo.currentXp.toFixed(0)} / ${fishingLevelInfo.neededXp.toFixed(0)}`} color="#00bfff" />
      </div>

      <div style={{marginTop: '20px'}}>
        <h3 style={{ color: '#ffea00', borderBottom: '1px solid #5a402a', paddingBottom: '10px', marginBottom: '15px' }}>
          Bait Crafting Level: {baitLevelInfo.level}
        </h3>
        <ProgressBar progress={baitLevelInfo.progress} label={`XP: ${baitLevelInfo.currentXp.toFixed(0)} / ${baitLevelInfo.neededXp.toFixed(0)}`} color="#00ff41" />
        <p style={{fontSize: '12px', color: '#aaa', marginTop: '10px'}}>Gain XP by crafting bait.</p>
      </div>

      <div style={{ marginTop: '30px' }}>
        <BaseButton label="Back" onClick={onBack} />
      </div>
    </div>
  );
};

const AnglerDialog = ({ onClose, label = "QUIET POND", header = "/images/dialog/modal-header-angler.png", headerOffset = 0, headerWidth = 210 }) => {
  const [pageIndex, setPageIndex] = useState(ID_ANGLER_PAGES.ANGLER_MENU);
  const [selectedBaitId, setSelectedBaitId] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const fishingButtonAudioRef = useRef(null);

  const { isConnected, account } = useSolanaWallet();
  const { checkPendingRequests, getAllPendingRequests } = useFishing();

  // Load pending requests when dialog opens
  const loadPendingRequests = useCallback(async () => {
    if (!isConnected || !account || !checkPendingRequests || !getAllPendingRequests) return;
    
    try {
      const hasPending = await checkPendingRequests();
      setHasPendingRequests(hasPending);
      
      if (hasPending) {
        const allPendingReqs = await getAllPendingRequests();
        setPendingRequests(allPendingReqs);
      } else {
        setPendingRequests([]);
      }
    } catch (err) {
      console.error('Failed to load fishing pending requests:', err);
    }
  }, [isConnected, account, checkPendingRequests, getAllPendingRequests]);

  // Load pending requests when component mounts or when user connects
  useEffect(() => {
    if (isConnected && account) {
      loadPendingRequests();
    }
  }, [isConnected, account, loadPendingRequests]);

  const onStartFishing = useCallback(async (baitId, amount) => {
    setSelectedBaitId(baitId);
    setSelectedAmount(amount);
    
    // Navigate to fishing page immediately - the request ID will be handled by the Fishing component
    setPageIndex(ID_ANGLER_PAGES.FISHING);
  }, []);

  const onReelFish = (requestId, baitId, level, amount) => {
    // Navigate to fishing page with pending request info
    setSelectedBaitId(parseInt(baitId)); // Use the real baitId from pending request
    setSelectedAmount(parseInt(amount));
    setSelectedRequestId(requestId); // Set the real request ID
    setPageIndex(ID_ANGLER_PAGES.FISHING);
  };

  return (
    <BaseDialog onClose={onClose} title={label} header={header} headerOffset={headerOffset} headerWidth={headerWidth} className="custom-modal-background">
      {pageIndex === ID_ANGLER_PAGES.ANGLER_MENU && (
        <AnglerMenu
            onStartFish={() => {
              if (!fishingButtonAudioRef.current) {
                fishingButtonAudioRef.current = new Audio("/sounds/FishingButton.wav");
                fishingButtonAudioRef.current.preload = "auto";
              }
              const audio = fishingButtonAudioRef.current;
              audio.currentTime = 0;
              audio.play().catch(() => {});
              setPageIndex(ID_ANGLER_PAGES.START_FISHING);
            }}
          onCraftBait={() => setPageIndex(ID_ANGLER_PAGES.CRAFT_BAIT)}
          onLeveling={() => setPageIndex("LEVELING")}
          hasPendingRequests={hasPendingRequests}
          pendingRequests={pendingRequests}
          onReelFish={onReelFish}
        ></AnglerMenu>
      )}
      {pageIndex === ID_ANGLER_PAGES.CRAFT_BAIT && (
        <CraftBait
          onBack={() => setPageIndex(ID_ANGLER_PAGES.ANGLER_MENU)}
        ></CraftBait>
      )}
      {pageIndex === ID_ANGLER_PAGES.START_FISHING && (
        <StartFishing
          onBack={() => setPageIndex(ID_ANGLER_PAGES.ANGLER_MENU)}
          onStart={onStartFishing}
        ></StartFishing>
      )}
      {pageIndex === ID_ANGLER_PAGES.FISHING && (
        <Fishing
          baitId={selectedBaitId}
          amount={selectedAmount}
          requestId={selectedRequestId}
          onBuyAgain={() => setPageIndex(ID_ANGLER_PAGES.START_FISHING)}
          onBackToMenu={() => {
            setPageIndex(ID_ANGLER_PAGES.ANGLER_MENU);
            loadPendingRequests(); // Refresh pending requests
          }}
        ></Fishing>
      )}
      {pageIndex === "LEVELING" && (
        <AnglerLeveling onBack={() => setPageIndex(ID_ANGLER_PAGES.ANGLER_MENU)} />
      )}
    </BaseDialog>
  );
};

export default AnglerDialog;
