import React, { useState, useRef, useCallback, useEffect } from "react";
import "./style.css";
import { fishImages, fishingPanelImages } from "../../../constants/_baseimages";
import BaseButton from "../../../components/buttons/BaseButton";
import LootReceivedDialog from "../../Global_LootReceivedDialog";
import { useFishing } from "../../../hooks/useFishing";
import { useItems } from "../../../hooks/useItems";
import { useNotification } from "../../../contexts/NotificationContext";
import { handleContractError } from "../../../utils/errorHandler";

const Fishing = ({ baitId, amount, requestId, onBuyAgain, onBackToMenu }) => {
  const [isFishing, setIsFishing] = useState(false);
  const [isLootReceivedDialog, setIsLootReceivedDialog] = useState(false);
  const [isBuyAgain, setIsBuyAgain] = useState(false);
  const [fishingResult, setFishingResult] = useState(null);
  const [hasThrownBait, setHasThrownBait] = useState(false);
  
  const { revealFishing, listenForFishingResults } = useFishing();
  const { refetch } = useItems();
  const { show } = useNotification();
  
  // Use ref to track cleanup function, similar to handleReveal pattern
  const fishingCleanupRef = useRef(null);

  // Initialize state when component mounts
  useEffect(() => {
    if (requestId) {
      // Coming from pending request - bait was already thrown
      setHasThrownBait(true);
    } else if (baitId && amount) {
      // Coming from new fishing - bait was just thrown in StartFishing
      setHasThrownBait(true);
    }
  }, [requestId, baitId, amount]);

  // Phase 2: Reel in Fish - Fulfill RNG request and get results (like fulfillPendingRequest)
  const onReelInFish = useCallback(async () => {
    // Clean up any existing fishing process
    if (fishingCleanupRef.current) {
      fishingCleanupRef.current();
      fishingCleanupRef.current = null;
    }

    setIsFishing(true);
    
    try {
      // Reveal fishing on-chain - use requestId if available, otherwise use stored nonce
      const result = await revealFishing(requestId);
      
      if (result && result.txHash) {
        show("Reeling in fish...", "info");
        
        // Listen for fishing results from transaction logs
        await listenForFishingResults(result.txHash, (results) => {
          // Transform itemIds array into items array with id and count
          const items = results.itemIds.map(itemId => ({
            id: itemId,
            count: 1 // Each fishing result gives 1 of each item
          }));
          
          setFishingResult(items);
          setIsLootReceivedDialog(true);
          setIsFishing(false);
          refetch();
        });
        
        show("Fishing revealed! Check your rewards.", "success");
      } else {
        // If fulfillment failed, reset the loading state
        setIsFishing(false);
        show("Failed to reel in fish", "error");
      }
      
    } catch (error) {
      const { message } = handleContractError(error, 'reeling in fish');
      show(message, "error");
      setIsFishing(false);
      
      // Clean up any existing listeners
      if (fishingCleanupRef.current) {
        fishingCleanupRef.current();
        fishingCleanupRef.current = null;
      }
    }
  }, [requestId, revealFishing, listenForFishingResults, show, refetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fishingCleanupRef.current) {
        fishingCleanupRef.current();
      }
    };
  }, []);

  const onCloseLootReceiveDialog = () => {
    setIsLootReceivedDialog(false);
    if (onBackToMenu) {
      // Go back to angler menu and refresh pending requests
      onBackToMenu();
    } else {
      setIsBuyAgain(true);
    }
    // Reset fishing state for next fishing session
    setFishingResult(null);
    setHasThrownBait(false);
  };
  return (
    <div className="fishing-wrapper">
      <div className="loading">
        <img
          className="background"
          src={"/images/label/left-panel-normal.png"}
          alt="fishing panel"
        ></img>
        <img className="pin" src={fishImages.catfish} alt="fish"></img>
      </div>
      {isBuyAgain ? (
        <BaseButton
          className="button"
          label="Buy Again"
          onClick={onBuyAgain}
        ></BaseButton>
      ) : (
        // Show "Reel in Fish" button (bait was already thrown when user clicked Confirm)
        <BaseButton
          className="button"
          label={isFishing ? "Reeling..." : "Reel in Fish"}
          onClick={onReelInFish}
          disabled={isFishing || !hasThrownBait}
        ></BaseButton>
      )}
      {isLootReceivedDialog && (
        <LootReceivedDialog
          onClose={onCloseLootReceiveDialog}
          items={fishingResult}
        ></LootReceivedDialog>
      )}
    </div>
  );
};

export default Fishing;
