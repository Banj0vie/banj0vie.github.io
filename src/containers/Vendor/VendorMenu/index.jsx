import React from "react";
import "./style.css";
import BaseDivider from "../../../components/dividers/BaseDivider";
import BaseButton from "../../../components/buttons/BaseButton";
import ErrorLabel from "../../../components/labels/ErrorLabel";
import { ID_SEED_SHOP_ITEMS } from "../../../constants/app_ids";
import { SEED_PACK_STATUS } from "../../../constants/item_seed";

const VendorMenu = ({ 
  seedStatus, 
  onSeedsClicked, 
  onRollChancesClicked, 
  availablePlots = 0, 
  hasPendingRequests = false, 
  pendingRequests = [], 
  onRevealClicked, 
  isRevealing = false,
  isLoading = false,
  buyingSeedId = null
}) => {
  const seedOrder = [
    ID_SEED_SHOP_ITEMS.FEEBLE_SEED,
    ID_SEED_SHOP_ITEMS.PICO_SEED,
    ID_SEED_SHOP_ITEMS.BASIC_SEED,
    ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
  ];
  
  // Tier mapping to match the contract
  const tierMap = {
    [ID_SEED_SHOP_ITEMS.FEEBLE_SEED]: 1,
    [ID_SEED_SHOP_ITEMS.PICO_SEED]: 2,
    [ID_SEED_SHOP_ITEMS.BASIC_SEED]: 3,
    [ID_SEED_SHOP_ITEMS.PREMIUM_SEED]: 4,
  };
  return (
    <div className="vendor-menu">
      <div className="available-plots">Available Plots: {isLoading ? "Loading..." : availablePlots}</div>
      <BaseDivider></BaseDivider>
      {seedOrder.map((id) => {
        // Check if this tier has pending requests
        const tierPendingRequests = pendingRequests.filter(req => {
          const reqTier = typeof req.tier === 'bigint' ? Number(req.tier) : req.tier;
          const mapTier = tierMap[id];
          return reqTier === mapTier;
        });
        const isPendingTier = tierPendingRequests.length > 0;
        const isThisTierRevealing = isPendingTier && isRevealing;
        const isThisSeedBuying = buyingSeedId === id;
        
        // Calculate total count for this tier
        const totalCount = tierPendingRequests.reduce((sum, req) => sum + parseInt(req.count), 0);
        
        // Determine if this button should be disabled
        const isDisabled = seedStatus[id].status === SEED_PACK_STATUS.COMMITING || 
                          (hasPendingRequests && !isPendingTier) ||
                          (buyingSeedId !== null && !isThisSeedBuying) ||
                          isRevealing; // Disable ALL buttons when any reveal is happening
        
        return (
          <BaseButton
            className={`vendor-button`}
            label={
              isThisSeedBuying
                ? "Buying..."
                : isThisTierRevealing
                ? "Revealing..."
                : isPendingTier
                ? `Reveal ${totalCount} ${seedStatus[id].label}`
                : seedStatus[id].status === SEED_PACK_STATUS.NORMAL
                ? seedStatus[id].label
                : seedStatus[id].status === SEED_PACK_STATUS.COMMITING
                ? "Committing..."
                : `Reveal ${seedStatus[id].count} ${seedStatus[id].label}`
            }
            key={id}
            onClick={() => {
              if (isPendingTier) {
                // Reveal the first pending request for this tier
                const firstRequest = tierPendingRequests[0];
                onRevealClicked(firstRequest.requestId, firstRequest.tier, firstRequest.count);
              } else {
                onSeedsClicked(id);
              }
            }}
            disabled={isDisabled}
          />
        );
      })}
      <BaseDivider></BaseDivider>
      <BaseButton
        className="vendor-button"
        label="Roll Chances"
        onClick={() => {
          onRollChancesClicked();
        }}
        disabled={hasPendingRequests || buyingSeedId !== null || isRevealing}
      ></BaseButton>
      <br />
      <ErrorLabel
        text={"Caution: Please reveal within ~8 minutes!"}
      ></ErrorLabel>
    </div>
  );
};

export default VendorMenu;
