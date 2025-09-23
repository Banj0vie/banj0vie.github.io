import React from "react";
import "./style.css";
import {
  ONE_SEED_HEIGHT,
  TYPE_LABEL_COLOR,
} from "../../../constants/item_seed";
import { ALL_ITEMS } from "../../../constants/item_data";
import CardView from "../CardView";
import BaseButton from "../../buttons/BaseButton";

const ItemViewMarketplace = ({
  item,
  onSend = () => {},
  onSell = () => {},
  onBatchBuy = () => {},
  onBuy = () => {},
  isBatchBuy = false,
  isBuy = false,
  price = 0,
}) => {
  // Try to get item data from ALL_ITEMS, fallback to item data from contract
  const itemData = ALL_ITEMS[item.id] || item;

  // Use item's own data if ALL_ITEMS doesn't have it
  const itemLabel = itemData.label || item.label || "Unknown Item";
  const itemPos = itemData.pos || 0;

  // Determine if this item should use img tag or CSS sprite sheet
  const shouldUseImageTag = () => {
    const category = itemData.category || item.category;
    const subCategory = itemData.subCategory || item.subCategory;

    // Use img tag for bait, potion items, and loot items (they have specific image files)
    if (
      subCategory === "ID_LOOT_CATEGORY_BAIT" ||
      category === "ID_ITEM_POTION" ||
      category === "ID_ITEM_LOOT"
    ) {
      return true;
    }

    // Use CSS sprite sheet for produce items
    return false;
  };

  // Get the image source for items that use img tags
  const getImageSrc = () => {
    return itemData.image || item.image || "/public/images/crops/seeds.png";
  };

  // Get CSS class for items that use sprite sheets
  const getImageClass = () => {
    const subCategory = itemData.subCategory || item.subCategory;
    const image = itemData.image || item.image;

    // Special handling for chest items - use CSS-generated chest icons
    if (image === "chest" || subCategory === "ID_LOOT_CATEGORY_CHEST") {
      return "item-icon item-icon-chest";
    }

    // Default to seeds for produce items
    return "item-icon item-icon-seeds";
  };

  return (
    <CardView className="sell-item-box-wrapper" secondary>
      <div className="sell-item-box">
        {/* Item Icon */}
        <CardView className="item-icon-card">
          <div className="item-icon-wrapper">
            {shouldUseImageTag() ? (
              <img src={getImageSrc()} alt={itemLabel} className="item-icon" />
            ) : (
              <div
                className={getImageClass()}
                style={{
                  backgroundPositionY: 0 - itemPos * ONE_SEED_HEIGHT,
                  // Add chest-specific styling
                  ...(itemData.image === "chest"
                    ? {
                        "--chest-type": itemPos,
                      }
                    : {}),
                }}
              ></div>
            )}
          </div>
        </CardView>

        {/* Item Name and Quantity/Price */}
        <div
          className="item-details"
          style={{ color: TYPE_LABEL_COLOR[item.type].color }}
        >
          {itemLabel} {isBuy ? `(${price} tokens)` : `(${item.count})`}
        </div>

        {/* Action Buttons */}
        <div className="item-actions">
          {!isBatchBuy && !isBuy && (
            <BaseButton label="Send" onClick={() => onSend(item)}></BaseButton>
          )}
          {!isBatchBuy && !isBuy && (
            <BaseButton label="Sell" onClick={() => onSell(item)}></BaseButton>
          )}
          {isBatchBuy && (
            <BaseButton
              label="Batch Buy"
              onClick={() => onBatchBuy(item)}
            ></BaseButton>
          )}
          {isBuy && (
            <BaseButton
              label="Buy"
              onClick={() => onBuy(item)}
            ></BaseButton>
          )}
        </div>
      </div>
    </CardView>
  );
};

export default ItemViewMarketplace;
