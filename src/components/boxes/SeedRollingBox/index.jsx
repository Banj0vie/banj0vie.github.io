import React, { useEffect, useState } from "react";
import "./style.css";
import {
  ALL_SEED_IMAGE_HEIGHT,
  ONE_SEED_HEIGHT,
  ONE_SEED_WIDTH,
  TYPE_LABEL_COLOR,
} from "../../../constants/item_seed";
import { ALL_ITEMS } from "../../../constants/item_data";
import { getRandomSeedEntry } from "../../../utils/basic";
import { ID_SEEDS } from "../../../constants/app_ids";

// Convert BigInt seedId to seed data structure
const convertSeedIdToSeedData = (seedId) => {
  if (!seedId || seedId === 0 || seedId === "0") {
    return null;
  }
  
  // Convert to string if it's a BigInt
  const seedIdStr = seedId.toString();
  
  // Find the seed in our constants
  for (const [key, value] of Object.entries(ID_SEEDS)) {
    if (value.toString() === seedIdStr) {
      const seedData = ALL_ITEMS[value];
      if (seedData) {
        return { id: key, ...seedData };
      }
    }
  }
  
  // If not found in ID_SEEDS, try to find directly in ALL_ITEMS
  for (const [itemKey, itemData] of Object.entries(ALL_ITEMS)) {
    if (itemData.id && itemData.id.toString() === seedIdStr) {
      // Check if this is a seed item
      if (itemData.category === 'ID_ITEM_CROP' && itemData.subCategory && itemData.subCategory.includes('SEED')) {
        return { id: itemKey, ...itemData };
      }
    }
  }
  
  return null;
};

const SeedRollingBox = ({ seedPackId, delay = 0 }) => {
  const [isRolling, setIsRolling] = useState(true);
  const [selectedSeed, setSelectedSeed] = useState({});
  
  useEffect(() => {
    console.log('SeedRollingBox received seedPackId:', seedPackId, 'type:', typeof seedPackId);
    
    // If seedPackId is 0 or falsy, show rolling animation
    if (!seedPackId || seedPackId === 0 || seedPackId === "0") {
      const timer = setTimeout(() => {
        setIsRolling(false);
        const randomSeed = getRandomSeedEntry();
        console.log('Using random seed fallback:', randomSeed);
        setSelectedSeed(randomSeed);
      }, 5000 + delay); // stop after 3s

      return () => clearTimeout(timer); // cleanup
    } else {
      // If we have a real seedId, convert it and show immediately
      const seedData = convertSeedIdToSeedData(seedPackId);
      console.log('Converted seed data:', seedData);
      if (seedData) {
        setIsRolling(false);
        setSelectedSeed(seedData);
      } else {
        // Fallback to random if conversion fails
        console.log('Conversion failed, using random seed fallback');
        setIsRolling(false);
        const randomSeed = getRandomSeedEntry();
        setSelectedSeed(randomSeed);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedPackId]);
  return (
    <div className="seed-rolling-box">
      <div className="seed-roller">
        <img className="seed-roller-bg" src="/images/items/crop-bg.png" alt="Seed Roller Background"></img>
        <div
          className={`seed-rolling-image ${isRolling ? "rolling" : "finish"}`}
          style={
            selectedSeed.pos
              ? {
                  "--all-seed-image-height": `-${ALL_SEED_IMAGE_HEIGHT * 0.308}px`,
                  "--scaled-seed-height": `${ONE_SEED_HEIGHT * 0.308}px`,
                  backgroundPositionY: `-${selectedSeed.pos * ONE_SEED_HEIGHT * 0.308}px`,
                }
              : { 
                  "--all-seed-image-height": `-${ALL_SEED_IMAGE_HEIGHT * 0.308}px`,
                  "--scaled-seed-height": `${ONE_SEED_HEIGHT * 0.308}px`,
                }
          }
        ></div>
      </div>
      <div className="seed-label">
        <p
          style={{
            color: selectedSeed.type
              ? TYPE_LABEL_COLOR[selectedSeed.type].color
              : "white",
          }}
        >
          {isRolling
            ? "ROLLING"
            : selectedSeed.type && TYPE_LABEL_COLOR[selectedSeed.type].label}
        </p>
      </div>
    </div>
  );
};

export default SeedRollingBox;
