import React from "react";
import "./style.css";
import CardView from "../CardView";
import { ALL_ITEMS } from "../../../constants/item_data";
import { TYPE_LABEL_COLOR } from "../../../constants/item_seed";

const ItemSmallView = ({ itemId, count }) => {
  return (
    <div className="item-small-view">
      <CardView className="icon">
        <img src={ALL_ITEMS[itemId].image} alt="icon"></img>
      </CardView>
      <div
        className="label"
        style={{ color: TYPE_LABEL_COLOR[ALL_ITEMS[itemId].type].color }}
      >
        {ALL_ITEMS[itemId].label}
      </div>
      <div className="count">x{count}</div>
    </div>
  );
};

export default ItemSmallView;
