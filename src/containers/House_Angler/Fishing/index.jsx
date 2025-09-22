import React, { useState } from "react";
import "./style.css";
import { fishImages, fishingPanelImages } from "../../../constants/_baseimages";
import BaseButton from "../../../components/buttons/BaseButton";
import LootReceivedDialog from "../../Global_LootReceivedDialog";
import { ID_POTION_ITEMS, ID_CHEST_ITEMS } from "../../../constants/app_ids";
import { useFishing } from "../../../hooks/useContracts";
import { useItems } from "../../../hooks/useItems";
import { useNotification } from "../../../contexts/NotificationContext";
import { handleContractError } from "../../../utils/errorHandler";

const Fishing = ({ baitId, amount, onBuyAgain }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLootReceivedDialog, setIsLootReceivedDialog] = useState(false);
  const [isBuyAgain, setIsBuyAgain] = useState(false);
  const [fishingResult, setFishingResult] = useState(null);
  
  const { fish } = useFishing();
  const { all: userItems, refetch } = useItems();
  const { show } = useNotification();

  // Get fishing rewards from user's inventory (potions and chests)
  const getFishingRewards = () => {
    if (!userItems) return [];
    
    const rewards = [];
    
    // Add potions
    Object.values(ID_POTION_ITEMS).forEach(potionId => {
      const potionItem = userItems.find(item => item.id === potionId);
      if (potionItem && potionItem.count > 0) {
        rewards.push({
          id: potionId,
          count: potionItem.count
        });
      }
    });
    
    // Add chests
    Object.values(ID_CHEST_ITEMS).forEach(chestId => {
      const chestItem = userItems.find(item => item.id === chestId);
      if (chestItem && chestItem.count > 0) {
        rewards.push({
          id: chestId,
          count: chestItem.count
        });
      }
    });
    
    return rewards;
  };

  const onReel = async () => {
    if (!baitId) {
      show("No bait selected", "error");
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the contract to start fishing
      await fish(baitId);
      
      // Get real fishing rewards from user's inventory
      const rewards = getFishingRewards();
      
      // For now, show mock result since VRNG callback handling is complex
      // In a real implementation, you'd listen for events or poll for results
      setTimeout(async () => {
        setFishingResult(rewards);
        setIsLootReceivedDialog(true);
        setIsLoading(false);
        
        // Refresh inventory to show updated item counts
        await refetch();
      }, 2000);
      
      show("Fishing started! Waiting for results...", "info");
    } catch (error) {
      const { message } = handleContractError(error, 'fishing');
      show(message, "error");
      setIsLoading(false);
    }
  };

  const onCloseLootReceiveDialog = () => {
    setIsLootReceivedDialog(false);
    setIsBuyAgain(true);
  };
  return (
    <div className="fishing-wrapper">
      <div className="loading">
        <img
          className="background"
          src={fishingPanelImages.background}
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
      ) : isLoading ? (
        <BaseButton className="button" label="Loading..." disabled></BaseButton>
      ) : (
        <BaseButton
          className="button"
          label="Reel in Fish"
          onClick={onReel}
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
