import React from "react";
import "./style.css";
import {
  ONE_SEED_HEIGHT,
} from "../../../constants/item_seed";
import { ALL_ITEMS } from "../../../constants/item_data";

const SellItemBox = ({ item, onSend, onSell }) => {
  // Try to get item data from ALL_ITEMS, fallback to item data from contract
  const itemData = ALL_ITEMS[item.id] || item;
  
  // Use item's own data if ALL_ITEMS doesn't have it
  const itemLabel = itemData.label || item.label || 'Unknown Item';
  const itemPos = itemData.pos || 0;
  
  // Determine which sprite sheet to use based on item type
  const getImageClass = () => {
    const category = itemData.category || item.category;
    const subCategory = itemData.subCategory || item.subCategory;
    const image = itemData.image || item.image;
    
    // Special handling for chest items - use CSS-generated chest icons
    if (image === 'chest' || subCategory === 'ID_LOOT_CATEGORY_CHEST') {
      return 'item-icon item-icon-chest';
    }
    
    // Use different CSS classes for different item types
    if (category === 'ID_ITEM_POTION') {
      return 'item-icon item-icon-bigger-plants';
    }
    return 'item-icon item-icon-seeds';
  };
  
  return (
    <div className="sell-item-box">
      {/* Item Icon */}
      <div className="item-icon-wrapper">
        <div
          className={getImageClass()}
          style={{ 
            backgroundPositionY: 0 - itemPos * ONE_SEED_HEIGHT,
            // Add chest-specific styling
            ...(itemData.image === 'chest' ? {
              '--chest-type': itemPos
            } : {})
          }}
        ></div>
      </div>

      {/* Item Name and Quantity */}
      <div className="item-details">
        {itemLabel} ({item.count})
      </div>

      {/* Action Buttons */}
      <div className="item-actions">
        <button
          className="base-button"
          onClick={() => onSend(item)}
        >
          Send
        </button>
        <button
          className="base-button"
          onClick={() => onSell(item)}
        >
          Sell
        </button>
      </div>
    </div>
  );
};

export default SellItemBox;
