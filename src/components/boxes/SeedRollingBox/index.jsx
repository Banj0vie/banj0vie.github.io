import React, { useEffect, useState } from "react";
import "./style.css";
import {
  ALL_SEED_IMAGE_HEIGHT,
  ONE_SEED_HEIGHT,
  SEED_CATEGORIES,
} from "../../../constants/seedPack";
import { getRandomSeedEntry } from "../../../utils/basic";

const SeedRollingBox = ({ seedPackId, delay = 0 }) => {
  const [isRolling, setIsRolling] = useState(true);
  const [selectedSeed, setSelectedSeed] = useState({});
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRolling(false);
      const randomSeed = getRandomSeedEntry();
      console.log("RandomSeed, ", randomSeed);
      setSelectedSeed(randomSeed);
    }, 3000); // stop after 3s

    return () => clearTimeout(timer); // cleanup
  }, []);
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
