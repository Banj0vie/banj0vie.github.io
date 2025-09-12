import React from "react";
import "./style.css";
import {
  ONE_SEED_HEIGHT,
  SEED_CATEGORIES,
  SEEDS,
} from "../../../constants/item_seed";

const PickSeedItemBox = ({ seedId, count = 1, onClick }) => {
  const selectedSeed = SEEDS[seedId];
  return (
    <div className="pick-seed-item-box" onClick={onClick}>
      <div
        className="pick-seed-item-icon"
        style={{ backgroundPositionY: 0 - selectedSeed.pos * ONE_SEED_HEIGHT }}
      ></div>
      <div className="pick-seed-item-label" style={{
        color: SEED_CATEGORIES[selectedSeed.category].color,
      }}>{selectedSeed.label}</div>
      <div className="pick-seed-item-badge">x{count}</div>
    </div>
  );
};

export default PickSeedItemBox;
