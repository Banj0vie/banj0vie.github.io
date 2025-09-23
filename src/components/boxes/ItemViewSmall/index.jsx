import React from "react";
import "./style.css";
import CardView from "../CardView";
import { ALL_ITEMS } from "../../../constants/item_data";
import {
  ONE_SEED_HEIGHT,
  TYPE_LABEL_COLOR,
} from "../../../constants/item_seed";

const ItemSmallView = ({ itemId, count }) => {

  return (itemId ? 
    <div className="item-small-view">
      <CardView className="icon">
        {ALL_ITEMS[itemId].pos === undefined ? (
          <img src={ALL_ITEMS[itemId].image} alt="icon"></img>
        ) : (
          <div
            className="crop-icon"
            style={{
              backgroundPositionY: -ALL_ITEMS[itemId]?.pos * ONE_SEED_HEIGHT,
            }}
          ></div>
        )}
      </CardView>
      <div
        className="label"
        style={{ color: TYPE_LABEL_COLOR[ALL_ITEMS[itemId].type].color }}
      >
        {ALL_ITEMS[itemId].label}
      </div>
      <div className="count">x{count}</div>
    </div> : <></>
  );
};

export default ItemSmallView;
