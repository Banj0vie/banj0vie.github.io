import React, { useEffect, useState, useCallback } from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import {
  ID_INVENTORY_MENUS,
} from "../../constants/app_ids";
import BaseButton from "../../components/buttons/BaseButton";
import ItemSmallView from "../../components/boxes/ItemViewSmall";
import ItemViewUsable from "../../components/boxes/ItemViewUsable";
import { useItems } from "../../hooks/useItems";
import { useChest } from "../../hooks/useChest";
import { useNotification } from "../../contexts/NotificationContext";
import { ID_CHEST_ITEMS, ID_POTION_ITEMS } from "../../constants/app_ids";
// ChestRollingDialog removed; chest opens directly via useChest

const menus = [
  { id: ID_INVENTORY_MENUS.SEEDS, label: "Seeds" },
  { id: ID_INVENTORY_MENUS.PRODUCE, label: "Produce" },
  { id: ID_INVENTORY_MENUS.FISHES, label: "Fishes" },
  { id: ID_INVENTORY_MENUS.ITEMS, label: "Items" },
];

const InventoryDialog = ({ onClose }) => {
  const [selectedMenu, setSelectedMenu] = useState(ID_INVENTORY_MENUS.SEEDS);
  const { all: allItems, refetch } = useItems();
  const [list, setList] = useState([]);
  // Use chest opening from useChest (transaction construction and submission)
  const { openChest } = useChest();

  // Potion usage is now handled via context - no need to destructure useFarming
  const { show } = useNotification();
  
  // Function to detect if we're on the farm page
  const isOnFarmPage = () => {
    return window.location.pathname === '/farm' || window.location.pathname.endsWith('/farm');
  };
  
  // Chest opening state
  const [usingItemId, setUsingItemId] = useState(null);
  
  // No reveal dialog flow

  // No pending VRNG flow

  const onUseItem = async (itemId) => {
    setUsingItemId(itemId);
    try {
      console.log("Using item:", itemId);
      const idNum = Number(itemId & 0xFF);
      console.log("🚀 ~ onUseItem ~ idNum:", idNum)
      
      // Handle chest opening
      if (Number(itemId) === ID_CHEST_ITEMS.CHEST_WOOD || 
          Number(itemId) === ID_CHEST_ITEMS.CHEST_BRONZE || 
          Number(itemId) === ID_CHEST_ITEMS.CHEST_SILVER || 
          Number(itemId) === ID_CHEST_ITEMS.CHEST_GOLD) {
        
        show("Opening chest...", "info");
        const result = await openChest(idNum);
        
        if (result.success) {
          show("Chest opened! Click 'Reveal' to see your reward.", "success");
          // Wait a moment for the transaction to be processed
          setTimeout(async () => {
            // Refresh items to update the inventory display
            await refetch();
          }, 1000);
        }
        return;
      }
      
      // Handle potion usage - these require a plot selection
      if (itemId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR ||
          itemId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR_II ||
          itemId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR_III) {
        
        if (isOnFarmPage()) {
          // Trigger potion usage mode in farm interface
          // triggerPotionUsage(itemId, "Growth Elixir");
          show("Select growing crops to apply Growth Elixir.", "info");
          onClose(); // Close inventory dialog
        } else {
          show("Go to the Farm to use Growth Elixir on growing crops.", "info");
        }
        return;
      }
      
      if (itemId === ID_POTION_ITEMS.POTION_PESTICIDE ||
          itemId === ID_POTION_ITEMS.POTION_PESTICIDE_II ||
          itemId === ID_POTION_ITEMS.POTION_PESTICIDE_III) {
        
        if (isOnFarmPage()) {
          // Trigger potion usage mode in farm interface
          // triggerPotionUsage(itemId, "Pesticide");
          show("Select growing crops to apply Pesticide.", "info");
          onClose(); // Close inventory dialog
        } else {
          show("Go to the Farm to use Pesticide on growing crops.", "info");
        }
        return;
      }
      
      if (itemId === ID_POTION_ITEMS.POTION_FERTILIZER ||
          itemId === ID_POTION_ITEMS.POTION_FERTILIZER_II ||
          itemId === ID_POTION_ITEMS.POTION_FERTILIZER_III) {
        
        if (isOnFarmPage()) {
          // Trigger potion usage mode in farm interface
          // triggerPotionUsage(itemId, "Fertilizer");
          show("Select growing crops to apply Fertilizer.", "info");
          onClose(); // Close inventory dialog
        } else {
          show("Go to the Farm to use Fertilizer on growing crops.", "info");
        }
        return;
      }
      
      // Default case
      show("This item cannot be used directly from inventory.", "warning");
      
    } catch (error) {
      console.error("Error using item:", error);
      show(`Error: ${error.message}`, "error");
    } finally {
      setUsingItemId(null);
    }
  };

  useEffect(() => {
    
    switch (selectedMenu) {
      case ID_INVENTORY_MENUS.SEEDS:
        const seeds = allItems.filter(item => item.category === 'ID_ITEM_SEED' && item.count > 0);
        setList(seeds);
        break;
      case ID_INVENTORY_MENUS.PRODUCE:
        const produce = allItems.filter(item => item.category === 'ID_ITEM_CROP' && item.count > 0);
        setList(produce);
        break;
      case ID_INVENTORY_MENUS.FISHES:
        const fishes = allItems.filter(item => item.category === 'ID_ITEM_LOOT' && item.subCategory === 'ID_LOOT_CATEGORY_BAIT' && item.count > 0);
        setList(fishes);
        break;
      case ID_INVENTORY_MENUS.ITEMS:
        // Regular items (chests and potions)
        const regularItems = allItems.filter(item => {
          const isChest = item.category === 'ID_ITEM_LOOT' && item.subCategory === 'ID_LOOT_CATEGORY_CHEST';
          const isPotion = item.category === 'ID_ITEM_POTION';
          const hasCount = item.count > 0;
          return (isChest || isPotion) && hasCount;
        });
        
        setList(regularItems);
        break;
      default:
        break;
    }
  }, [selectedMenu, allItems]);

  return (
    <BaseDialog onClose={onClose} title="INVENTORY">
      <div className="inventory-dialog">
        <div className="layout">
          <div className="info-row">
            {menus.map((item, index) => (
              <BaseButton
                className={`button ${index === 0 ? "first" : ""}`}
                label={item.label}
                key={index}
                focused={selectedMenu === item.id}
                onClick={() => setSelectedMenu(item.id)}
              ></BaseButton>
            ))}
          </div>
          <div className="seed-row">
            {selectedMenu !== ID_INVENTORY_MENUS.ITEMS && (
              <div className="seed-row-wrapper">
                {list.map((item, index) => (
                  <ItemSmallView
                    key={index}
                    itemId={item.id}
                    count={item.count}
                  ></ItemSmallView>
                ))}
              </div>
            )}
            {selectedMenu === ID_INVENTORY_MENUS.ITEMS && (
              <div className="seed-list">
                {list.map((item, index) => {
                  
                  // Regular item (chest or potion)
                  return (
                    <ItemViewUsable
                      key={index}
                      itemId={item.id}
                      count={item.count}
                      onUse={onUseItem}
                      usable={item.usable}
                      buttonLabel={Number(usingItemId) === Number(item.id) ? "Using..." : "Use"}
                      disabled={Number(usingItemId) === Number(item.id)}
                    ></ItemViewUsable>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};

export default InventoryDialog;
