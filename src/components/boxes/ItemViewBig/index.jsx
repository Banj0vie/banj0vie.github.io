import React from "react";
import "./style.css";
import { ALL_ITEMS } from "../../../constants/item_data";
import { TYPE_LABEL_COLOR } from "../../../constants/item_seed";

const ItemBigView = ({ itemId, onClick }) => {
  return (
    <div className="item-big-view">
      <div className="icon" onClick={() => onClick()}>
        {itemId && <img src={ALL_ITEMS[itemId].image} alt="item"></img>}
      </div>
      <br />
      <div className="label">
        {itemId && (
          <div
            style={{ color: TYPE_LABEL_COLOR[ALL_ITEMS[itemId].type].color }}
          >
            {ALL_ITEMS[itemId].label}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemBigView;
