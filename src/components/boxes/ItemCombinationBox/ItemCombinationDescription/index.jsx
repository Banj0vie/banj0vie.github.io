import React from "react";
import "./style.css";
import CardView from "../../CardView";
import { ITEM_COMBI } from "../../../../constants/item_combination";

const ItemCombinationDescription = ({ itemId }) => {
  const combiInfo = ITEM_COMBI[itemId];
  return (
    <CardView className="p-0">
      <div className="item-combination-description">
        <div>{combiInfo.description.summary}</div>
        <div>
          {combiInfo.description.extra_bonus}
          <span className="highlight">{combiInfo.description.extra_point}</span>
        </div>
      </div>
    </CardView>
  );
};

export default ItemCombinationDescription;
