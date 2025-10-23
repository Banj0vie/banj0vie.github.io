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
import ChestRollingDialog from "./ChestRollingDialog";

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
  const [chestResult, setChestResult] = useState(null);
  const [showChestDialog, setShowChestDialog] = useState(false);

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
        
        console.log("🎁 Chest opening result:", result);
        if (result.success && result.results && result.results.length > 0) {
          console.log("🎁 Showing chest result dialog with reward:", result.results[0]);
          // Show the chest result dialog
          setChestResult({
            rewardId: result.results[0], // Take the first reward
            chestType: idNum
          });
          setShowChestDialog(true);
          console.log("🎁 Dialog state set - showChestDialog should be true");
          
          // Refresh items immediately and then with retry mechanism
          await refetch();
          
          // Multiple refresh attempts to ensure inventory updates
          const refreshInventory = async (attempt = 1) => {
            console.log(`🔄 Refresh attempt ${attempt} after chest opening...`);
            await refetch();
            
            if (attempt < 5) {
              setTimeout(() => refreshInventory(attempt + 1), 1000 * attempt);
            }
          };
          
          setTimeout(() => refreshInventory(), 1000);
        } else if (result.success) {
          console.log("🎁 Chest opened but no results found");
          show("Chest opened successfully!", "success");
          
          // Refresh items immediately and then with retry mechanism
          await refetch();
          
          // Multiple refresh attempts to ensure inventory updates
          const refreshInventory = async (attempt = 1) => {
            console.log(`🔄 Refresh attempt ${attempt} after chest opening...`);
            await refetch();
            
            if (attempt < 5) {
              setTimeout(() => refreshInventory(attempt + 1), 1000 * attempt);
            }
          };
          
          setTimeout(() => refreshInventory(), 1000);
        }
        return;
      }
      
      // Handle potion usage - these require a plot selection
      if (itemId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR ||
          itemId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR_II ||
          itemId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR_III) {
        
        if (isOnFarmPage()) {
          // Directly trigger farm potion mode
          window.dispatchEvent(new CustomEvent('startPotionUsage', {
            detail: { id: itemId, name: 'Growth Elixir' }
          }));
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
          // Directly trigger farm potion mode
          window.dispatchEvent(new CustomEvent('startPotionUsage', {
            detail: { id: itemId, name: 'Pesticide' }
          }));
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
          // Directly trigger farm potion mode
          window.dispatchEvent(new CustomEvent('startPotionUsage', {
            detail: { id: itemId, name: 'Fertilizer' }
          }));
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
    <>
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
      
      {/* Chest Result Dialog */}
      {console.log("🔍 Dialog render check - showChestDialog:", showChestDialog, "chestResult:", chestResult)}
      {showChestDialog && chestResult && (
        <ChestRollingDialog
          rollingInfo={chestResult}
          onClose={() => {
            console.log("🎁 Closing chest dialog");
            setShowChestDialog(false);
            setChestResult(null);
            // Refresh inventory when dialog is closed
            refetch();
          }}
          onBack={() => {
            console.log("🎁 Going back from chest dialog");
            setShowChestDialog(false);
            setChestResult(null);
            // Refresh inventory when dialog is closed
            refetch();
          }}
        />
      )}
      
    </>
  );
};

export default InventoryDialog;
