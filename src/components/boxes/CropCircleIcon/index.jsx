import React from "react";
import "./style.css";
import { ALL_ITEMS } from "../../../constants/item_data";
import { ONE_SEED_HEIGHT } from "../../../constants/item_seed";

const CropCircleIcon = ({ seedId, size, scale = 1 }) => {
  return (
    <div
      className="crop-circle-icon-bg"
      style={{ height: size, width: size, scale: scale }}
    >
      <div
        className="crop-icon"
        style={{
          backgroundPositionY: -ALL_ITEMS[seedId]?.pos * ONE_SEED_HEIGHT,
        }}
      ></div>
    </div>
  );
};

export default CropCircleIcon;
