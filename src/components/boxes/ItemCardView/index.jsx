import React from "react";
import "./style.css";
import { ALL_ITEMS } from "../../../constants/item_data";
import CardView from "../CardView";
import { SEED_CATEGORIES } from "../../../constants/item_seed";

const ItemCardView = ({
  itemId,
  selectable = false,
  selected = false,
  onClick,
}) => {
  const itemData = ALL_ITEMS[itemId];
  return (
    <CardView
      className={`p-0 item-card-view-wrapper ${selectable ? "selectable" : ""}`}
      secondary={!selected}
      onClick={selectable ? onClick : () => {}}
    >
      <div className="icon">
        {itemData.pos === -1 ? (
          <img src={itemData.image} alt="item-image" width="24"></img>
        ) : (
          <div></div>
        )}
      </div>
      <div className="" style={{ color: SEED_CATEGORIES[itemData.type].color }}>
        {itemData.label}
      </div>
    </CardView>
  );
};

export default ItemCardView;
