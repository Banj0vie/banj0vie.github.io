import React, { useEffect, useState } from "react";
import "./style.css";
import {
  FARM_CROP_COUNT,
  FARM_CROP_HEIGHT,
  FARM_CROP_WIDTH,
  FARM_FIELD_SPACE_X,
  FARM_FIELD_START_X,
  FARM_FIELD_START_Y,
} from "../../../constants/scene_farm";
import { ONE_SEED_HEIGHT, SEEDS } from "../../../constants/item_seed";

const CropItem = ({
  data,
  index,
  onClick,
  jiggling = false,
  isPlanting = true,
}) => {
  const [highlighted, setHighlighted] = useState(false);
  useEffect(() => {
    if (isPlanting) {
      setHighlighted(false);
    }
  }, [isPlanting]);
  return (
    <div
      className={`crop-item ${data.growStatus > 0 ? "planted" : "harvested"} ${
        jiggling && data.growStatus < 1 ? "jiggling" : ""
      } ${highlighted ? "selected" : ""}`}
      style={{
        left:
          FARM_FIELD_START_X +
          FARM_CROP_WIDTH * parseInt(index / 3) +
          (index >= FARM_CROP_COUNT / 2 ? FARM_FIELD_SPACE_X : 0),
        top: FARM_FIELD_START_Y + FARM_CROP_HEIGHT * (index % 3),
        backgroundPositionX: data.seedId
          ? 0 - (data.growStatus === -1 ? 1 : data.growStatus) * ONE_SEED_HEIGHT
          : 0,
        backgroundPositionY: data.seedId
          ? 0 - SEEDS[data.seedId].pos * ONE_SEED_HEIGHT
          : 0,
      }}
    >
      <div
        data-hotspots="true"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className="bounding-box"
        onClick={(e) => {
          if (isPlanting && data.growStatus !== 0) {
            return;
          }
          if (!isPlanting && data.growStatus === 0) {
            return;
          }
          if (!isPlanting) {
            setHighlighted(!highlighted);
          }
          if (e.shiftKey) {
            onClick(true);
          } else {
            onClick(false);
          }
        }}
      ></div>
    </div>
  );
};

export default CropItem;
