/* global BigInt */
import React, { useEffect, useState } from "react";
import "./style.css";
import { ALL_ITEMS } from "../../../constants/item_data";
import { ID_BAIT_ITEMS, ID_POTION_ITEMS } from "../../../constants/app_ids";
import ItemCombinationHeader from "./ItemCombinationHeader";
import ItemCombinationController from "./ItemCombinationController";
import ItemCombinationTable from "./ItemCombinationTable";
import ItemCombinationDescription from "./ItemCombinationDescription";
import { ITEM_COMBI } from "../../../constants/item_combination";
import BaseButton from "../../buttons/BaseButton";
import { useFishing } from "../../../hooks/useContracts";
import { usePotion } from "../../../hooks/useContracts";
import { useItems } from "../../../hooks/useItems";
import { useNotification } from "../../../contexts/NotificationContext";
import { handleContractError } from "../../../utils/errorHandler";

// This will be replaced with real inventory data from useItems hook

const ItemCombinationBox = ({
  itemId,
  limit = 100,
  limitedController = true,
}) => {
  const itemData = ALL_ITEMS[itemId];
  const { all: userItems, refetch } = useItems();
  const { show } = useNotification();
  
  // Get contract hooks (always call hooks unconditionally)
  const fishing = useFishing();
  const { craftGrowthElixir, craftPesticide, craftFertilizer } = usePotion();
  
  // Determine item type
  const isBait = Object.values(ID_BAIT_ITEMS).includes(itemId);
  const isPotion = Object.values(ID_POTION_ITEMS).includes(itemId);

  // Get recipe requirements from contract data instead of hardcoded ITEM_COMBI
  const getRecipeRequirements = () => {
    if (!itemId) return null;
    
    // For now, use ITEM_COMBI as fallback, but this should eventually come from contract
    const combiItems = ITEM_COMBI[itemId];
    if (!combiItems) return null;
    
    return combiItems;
  };

  const combiItems = getRecipeRequirements();

  const [multiplier, setMultiplier] = useState(1);
  const [cropCounts, setCropCounts] = useState({});
  const [isCrafting, setIsCrafting] = useState(false);

  // Convert userItems to inventory format for compatibility
  const inventory = (userItems || []).reduce((acc, item) => {
    acc[item.id] = item.count || 0;
    return acc;
  }, {});
  const onLeftToLimited = () => {
    setMultiplier(1);
  };
  const onRightToLimited = () => {
    setMultiplier(limit);
  };
  const onLeftOne = () => {
    if (multiplier <= 1) {
      return;
    }
    setMultiplier((prev) => prev - 1);
  };

  const onRightOne = () => {
    if (multiplier >= limit) {
      return;
    }
    setMultiplier((prev) => prev + 1);
  };

  const onCropCountDown = (cropId, combiIndex) => {
    setCropCounts((prevCounts) => {
      if (!prevCounts[cropId]) return prevCounts;

      return {
        ...prevCounts,
        [cropId]: Math.max(0, prevCounts[cropId] - 1),
      };
    });
  };

  const onCropCountUp = (cropId, combiIndex) => {
    let totalCombiCount = 0;
    for (let i = 0; i < combiItems.list[combiIndex].ids.length; i++) {
      totalCombiCount += cropCounts[combiItems.list[combiIndex].ids[i]] || 0;
    }
    if (totalCombiCount + 1 > combiItems.list[combiIndex].count) {
      return;
    }
    
    // Check if we have enough items in inventory
    const currentCount = cropCounts[cropId] || 0;
    if (currentCount >= (inventory[cropId] || 0)) {
      return; // Not enough items in inventory
    }
    
    setCropCounts((prevCounts) => ({
      ...prevCounts,
      [cropId]: (prevCounts[cropId] || 0) + 1,
    }));
  };

  const onAutofill = () => {
    if (combiItems.simple) return; // Don't autofill for simple items
    
    const newCropCounts = { ...cropCounts }; // Start with existing counts
    
    // For each combination group, try to fill up to the required amount
    combiItems.list.forEach((combi) => {
      // Filter available items based on user's inventory
      const availableItems = combi.ids.filter(cropId => {
        const userItem = userItems?.find(item => item.id.toString() === cropId.toString());
        return userItem && userItem.count > 0;
      });
      
      if (availableItems.length === 0) return; // No available items
      
      // Apply multiplier to the count
      const totalRequired = combi.count * multiplier;
      
      // Calculate how much we already have from this group
      const currentTotal = combi.ids.reduce((sum, id) => sum + (newCropCounts[id.toString()] || 0), 0);
      const stillNeeded = Math.max(0, totalRequired - currentTotal);
      
      if (stillNeeded <= 0) return; // Already have enough
      
      // Distribute the remaining needed amount among available items
      let remainingToAllocate = stillNeeded;
      
      // Sort by availability (most available first)
      const sortedByAvailability = availableItems.sort((a, b) => {
        const userItemA = userItems?.find(item => item.id.toString() === a.toString());
        const userItemB = userItems?.find(item => item.id.toString() === b.toString());
        return (userItemB?.count || 0) - (userItemA?.count || 0);
      });
      
      sortedByAvailability.forEach((cropId) => {
        if (remainingToAllocate <= 0) return;
        
        const userItem = userItems?.find(item => item.id.toString() === cropId.toString());
        if (!userItem) return;
        
        const currentCount = newCropCounts[cropId.toString()] || 0;
        const maxCanTake = userItem.count - currentCount;
        
        if (maxCanTake <= 0) return;
        
        const toTake = Math.min(remainingToAllocate, maxCanTake);
        newCropCounts[cropId.toString()] = currentCount + toTake;
        remainingToAllocate -= toTake;
      });
    });
    
    setCropCounts(newCropCounts);
  };

  const onCraft = async () => {
    if (isCrafting) return;
    
    setIsCrafting(true);
    
    try {
      if (isBait) {
        await handleBaitCraft();
      } else if (isPotion) {
        await handlePotionCraft();
      } else {
        show("Unknown item type", "error");
      }
      
      // Reset form after successful craft
      setCropCounts({});
      setMultiplier(1);
      show("Successfully crafted!", "success");
      
      // Refresh inventory to show updated item counts
      await refetch();
    } catch (error) {
      const { message } = handleContractError(error, 'crafting');
      show(message, "error");
    } finally {
      setIsCrafting(false);
    }
  };

  const handleBaitCraft = async () => {
    if (!fishing) throw new Error("Fishing contract not available");

    if (itemId === ID_BAIT_ITEMS.BAIT_1) {
      // Bait1: Use the multiplier as the bait count to craft
      await fishing.craftBait1(multiplier);
    } else if (itemId === ID_BAIT_ITEMS.BAIT_2 || itemId === ID_BAIT_ITEMS.BAIT_3) {
      // Bait2 and Bait3 require arrays of items and amounts
      const itemIds = [];
      const amounts = [];
      
      Object.entries(cropCounts).forEach(([cropId, count]) => {
        if (count > 0) {
          itemIds.push(BigInt(cropId));
          amounts.push(count);
        }
      });
      
      if (itemId === ID_BAIT_ITEMS.BAIT_2) {
        await fishing.craftBait2(itemIds, amounts);
      } else {
        await fishing.craftBait3(itemIds, amounts);
      }
    }
  };

  const handlePotionCraft = async () => {
    if (!craftGrowthElixir) throw new Error("Potion contract not available");

    if (itemId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR) {
      await craftGrowthElixir();
    } else if (itemId === ID_POTION_ITEMS.POTION_PESTICIDE) {
      await craftPesticide();
    } else if (itemId === ID_POTION_ITEMS.POTION_FERTILIZER) {
      await craftFertilizer();
    }
  };

  // Check if craft button should be disabled
  const isCraftDisabled = () => {
    if (!combiItems) return true;
    
    if (combiItems.simple) {
      // For simple items, check if user has enough inventory
      return combiItems.list.some((combi) => {
        const required = combi.count * multiplier;
        const available = inventory[combi.ids[0]] || 0;
        return available < required;
      });
    }
    
    // For complex items, check each combination group
    return combiItems.list.some((combi) => {
      let totalCombiCount = 0;
      combi.ids.forEach((cropId) => {
        totalCombiCount += cropCounts[cropId] || 0;
      });
      
      // If any group doesn't meet the required count * multiplier, disable craft
      return totalCombiCount < (combi.count * multiplier);
    });
  };

  useEffect(() => {
    setCropCounts({});
  }, [itemId]);

  // Populate cropCounts with user's inventory data
  useEffect(() => {
    if (!userItems || !combiItems || !combiItems.list) return;
    
    const newCropCounts = {};
    
    // For each item in the combination, initialize with zero (not full inventory)
    combiItems.list.forEach(combi => {
      combi.ids.forEach(cropId => {
        const userItem = userItems.find(item => item.id.toString() === cropId.toString());
        if (userItem && userItem.count > 0) {
          newCropCounts[cropId.toString()] = 0; // Start with zero, not full inventory
        }
      });
    });
    
    setCropCounts(newCropCounts);
  }, [userItems, combiItems]);
  return (
    <div className="item-combination-box">
      <ItemCombinationHeader
        image={itemData.image}
        label={itemData.label}
        exp={itemData.exp}
      ></ItemCombinationHeader>
      <ItemCombinationController
        limitedController={limitedController}
        multiplier={multiplier}
        onLeftOne={onLeftOne}
        onRightOne={onRightOne}
        onLeftToLimited={onLeftToLimited}
        onRightToLimited={onRightToLimited}
      ></ItemCombinationController>
        <ItemCombinationTable
          itemId={itemId}
          multiplier={multiplier}
          cropCounts={cropCounts}
          onCountDown={onCropCountDown}
          onCountUp={onCropCountUp}
          inventory={inventory}
        ></ItemCombinationTable>
      <ItemCombinationDescription itemId={itemId}></ItemCombinationDescription>
      <div className="button-wrapper">
        {!combiItems.simple && (
          <BaseButton
            className=""
            label="Autofill"
            onClick={onAutofill}
          ></BaseButton>
        )}
        <BaseButton 
          className="" 
          label={isCrafting ? "Crafting..." : "Craft"} 
          onClick={onCraft}
          disabled={isCraftDisabled() || isCrafting}
        ></BaseButton>
      </div>
    </div>
  );
};

export default ItemCombinationBox;
