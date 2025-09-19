import React, { useEffect, useState } from "react";
import "./style.css";
import { ALL_ITEMS } from "../../../constants/item_data";
import { ID_PRODUCE_ITEMS } from "../../../constants/app_ids";
import ItemCombinationHeader from "./ItemCombinationHeader";
import ItemCombinationController from "./ItemCombinationController";
import ItemCombinationTable from "./ItemCombinationTable";
import ItemCombinationDescription from "./ItemCombinationDescription";
import { ITEM_COMBI } from "../../../constants/item_combination";
import BaseButton from "../../buttons/BaseButton";

// Demo inventory data - simulate your available items
const DEMO_INVENTORY = {
  [ID_PRODUCE_ITEMS.WHEAT]: 15,
  [ID_PRODUCE_ITEMS.TOMATO]: 12,
  [ID_PRODUCE_ITEMS.CARROT]: 8,
  [ID_PRODUCE_ITEMS.CORN]: 20,
  [ID_PRODUCE_ITEMS.PUMPKIN]: 6,
  [ID_PRODUCE_ITEMS.CHILI]: 4,
  [ID_PRODUCE_ITEMS.PARSNAP]: 3,
  [ID_PRODUCE_ITEMS.CELERY]: 2,
  [ID_PRODUCE_ITEMS.BROCCOLI]: 5,
  [ID_PRODUCE_ITEMS.CAULIFLOWER]: 1,
  [ID_PRODUCE_ITEMS.BERRY]: 7,
  [ID_PRODUCE_ITEMS.GRAPES]: 3,
  [ID_PRODUCE_ITEMS.BANANA]: 10,
  [ID_PRODUCE_ITEMS.MANGO]: 8,
  [ID_PRODUCE_ITEMS.AVOCADO]: 4,
  [ID_PRODUCE_ITEMS.PINEAPPLE]: 2,
  [ID_PRODUCE_ITEMS.BLUEBERRY]: 6,
  [ID_PRODUCE_ITEMS.ARTICHOKE]: 1,
  [ID_PRODUCE_ITEMS.PAPAYA]: 2,
  [ID_PRODUCE_ITEMS.FIG]: 1,
  [ID_PRODUCE_ITEMS.LYCHEE]: 1,
  [ID_PRODUCE_ITEMS.LAVENDER]: 1,
  [ID_PRODUCE_ITEMS.DRAGONFRUIT]: 0,
};

const ItemCombinationBox = ({
  itemId,
  limit = 100,
  limitedController = true,
}) => {
  const itemData = ALL_ITEMS[itemId];
  const combiItems = ITEM_COMBI[itemId];

  const [multiplier, setMultiplier] = useState(1);
  const [cropCounts, setCropCounts] = useState({});
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
    if (currentCount >= DEMO_INVENTORY[cropId]) {
      return; // Not enough items in inventory
    }
    
    setCropCounts((prevCounts) => ({
      ...prevCounts,
      [cropId]: (prevCounts[cropId] || 0) + 1,
    }));
  };

  const onAutofill = () => {
    if (combiItems.simple) return; // Don't autofill for simple items
    
    const newCropCounts = {};
    
    // For each combination group, distribute the count among the items
    combiItems.list.forEach((combi) => {
      const availableItems = combi.ids.filter(cropId => DEMO_INVENTORY[cropId] > 0);
      
      if (availableItems.length === 0) return; // No available items
      
      const itemCount = availableItems.length;
      // Apply multiplier to the count
      const totalCount = combi.count * multiplier;
      const countPerItem = Math.floor(totalCount / itemCount);
      const remainder = totalCount % itemCount;
      
      // Distribute the count evenly among available items in the group
      availableItems.forEach((cropId, index) => {
        const baseCount = countPerItem + (index < remainder ? 1 : 0);
        // Don't exceed what's available in inventory
        newCropCounts[cropId] = Math.min(baseCount, DEMO_INVENTORY[cropId]);
      });
    });
    
    setCropCounts(newCropCounts);
  };

  const onCraft = () => {};

  // Check if craft button should be disabled
  const isCraftDisabled = () => {
    if (combiItems.simple) return false; // Simple items don't need validation
    
    // Check each combination group
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
  return (
    <div className="item-combination-box">
      <ItemCombinationHeader
        image={itemData.image}
        label={itemData.label}
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
          label="Craft" 
          onClick={onCraft}
          disabled={isCraftDisabled()}
        ></BaseButton>
      </div>
    </div>
  );
};

export default ItemCombinationBox;
