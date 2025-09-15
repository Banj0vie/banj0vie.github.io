import React, { useEffect, useState } from "react";
import "./style.css";
import {
  ALL_SEED_IMAGE_HEIGHT,
  ONE_SEED_HEIGHT,
  SEED_CATEGORIES,
  SEEDS,
} from "../../../constants/item_seed";
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
      const seedData = SEEDS[value];
      if (seedData) {
        return { id: key, ...seedData };
      }
    }
  }
  
  return null;
};

const SeedRollingBox = ({ seedPackId, delay = 0 }) => {
  const [isRolling, setIsRolling] = useState(true);
  const [selectedSeed, setSelectedSeed] = useState({});
  
  useEffect(() => {
    // If seedPackId is 0 or falsy, show rolling animation
    if (!seedPackId || seedPackId === 0 || seedPackId === "0") {
      const timer = setTimeout(() => {
        setIsRolling(false);
        const randomSeed = getRandomSeedEntry();
        setSelectedSeed(randomSeed);
      }, 3000 + delay); // stop after 3s

      return () => clearTimeout(timer); // cleanup
    } else {
      // If we have a real seedId, convert it and show immediately
      const seedData = convertSeedIdToSeedData(seedPackId);
      if (seedData) {
        setIsRolling(false);
        setSelectedSeed(seedData);
      } else {
        // Fallback to random if conversion fails
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
        <div
          className={`seed-rolling-image ${isRolling ? "rolling" : "finish"}`}
          style={
            selectedSeed.pos
              ? {
                  "--all-seed-image-height": `-${ALL_SEED_IMAGE_HEIGHT}px`,
                  backgroundPositionY: 0 - selectedSeed.pos * ONE_SEED_HEIGHT,
                }
              : { "--all-seed-image-height": `-${ALL_SEED_IMAGE_HEIGHT}px` }
          }
        ></div>
      </div>
      <div className="seed-label">
        <p
          style={{
            color: selectedSeed.category
              ? SEED_CATEGORIES[selectedSeed.category].color
              : "white",
          }}
        >
          {isRolling
            ? "ROLLING"
            : selectedSeed.category &&
              SEED_CATEGORIES[selectedSeed.category].label}
        </p>
      </div>
    </div>
  );
};

export default SeedRollingBox;
