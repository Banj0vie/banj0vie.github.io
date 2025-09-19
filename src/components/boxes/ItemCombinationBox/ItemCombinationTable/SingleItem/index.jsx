import React from "react";
import "./style.css";
import CropCircleIcon from "../../../CropCircleIcon";
import { ALL_ITEMS } from "../../../../../constants/item_data";

const SingleItem = ({ itemId }) => {
  return (
    <div className="single-combi-item-wrapper">
      <div className="crop-icon">
        <CropCircleIcon seedId={itemId} size={104} scale={0.5}></CropCircleIcon>
      </div>
      <div className="crop-label">{ALL_ITEMS[itemId].label}</div>
    </div>
  );
};

export default SingleItem;
