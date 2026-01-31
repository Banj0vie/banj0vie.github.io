import React from "react";
import "./style.css";
import CardView from "../CardView";
import { ALL_ITEMS } from "../../../constants/item_data";
import { TYPE_LABEL_COLOR } from "../../../constants/item_seed";
import BaseButton from "../../buttons/BaseButton";

const ItemViewUsable = ({ itemId, count, onUse, usable = true, buttonLabel = "Use", disabled = false }) => {
  const isBaseImage = ALL_ITEMS[itemId].image.startsWith("data:");
  
  return (
    <CardView className="p-0">
      <div className="item-view-usable">
        <div className="icon-and-label">
          <CardView className={`p-0 icon ${isBaseImage ? "base-image" : ""}`}>
            <img src={ALL_ITEMS[itemId].image} alt="base-icon"></img>
          </CardView>
          <div className="label">
            <div
              style={{
                color: TYPE_LABEL_COLOR[ALL_ITEMS[itemId].type].color,
              }}
            >
              {ALL_ITEMS[itemId].label}
            </div>
            <div className="text-1.25">x{count}</div>
          </div>
        </div>
        {usable && (
          <BaseButton
            className="button"
            label={buttonLabel}
            onClick={() => onUse(itemId)}
            disabled={disabled}
            small
          ></BaseButton>
        )}
      </div>
    </CardView>
  );
};

export default ItemViewUsable;
