import React, { useState, useEffect } from "react";
import "./style.css";
import CropItem from "./CropItem";

const FarmInterface = ({crops, cropArray, onClickCrop, isFarmMenu, isPlanting, maxPlots = 15, totalPlots = 30, selectedIndexes = [], unlockedPlots = null}) => {
  const unlockedSet = unlockedPlots ? new Set(unlockedPlots) : null;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!ready) return null;

  return (
    <div className="farm-interface">
      {cropArray.arrays.map((crop, index) => {
        // Hide plots that aren't unlocked yet
        if (unlockedSet && !unlockedSet.has(index)) return null;
        return (
          <CropItem
            key={index}
            data={crop}
            index={index}
            jiggling={isFarmMenu}
            isPlanting={isPlanting}
            cropArray={cropArray}
            crops={crops}
            isDisabled={false}
            maxPlots={maxPlots}
            totalPlots={totalPlots}
            selectedIndexes={selectedIndexes}
            onClick={(e) => onClickCrop(e, index)}
          />
        );
      })}
    </div>
  );
};

export default FarmInterface;
