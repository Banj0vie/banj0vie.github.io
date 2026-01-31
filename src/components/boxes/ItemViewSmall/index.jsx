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
        <img src="/images/profile_bar/avatar_bg.png" className="icon-bg" alt="icon background"></img>
        {ALL_ITEMS[itemId].pos === -1 ? (
          <img style={{scale: 0.2}} src={ALL_ITEMS[itemId].image} alt="icon"></img>
        ) : (
          <div
            className="crop-icon"
            style={{
              backgroundPositionX: 0,
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
      <div className="small-item-badge">
        <img className="small-item-badge-icon" src="/images/items/badge-bg.png" alt="seed-badge" />
        <div className="small-item-badge-count">
          x{count}
        </div>
      </div>
    </div> : <></>
  );
};

export default ItemSmallView;
