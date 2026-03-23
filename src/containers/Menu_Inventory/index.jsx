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
import ProduceListDialog from "../../components/boxes/ItemViewMarketplace";

const menus = [
  { id: ID_INVENTORY_MENUS.SEEDS, label: "Seeds" },
  { id: ID_INVENTORY_MENUS.PRODUCE, label: "Produce" },
  { id: ID_INVENTORY_MENUS.BAITS, label: "Baits" },
  { id: ID_INVENTORY_MENUS.FISHES, label: "Fishes" },
  { id: ID_INVENTORY_MENUS.CHESTS, label: "Chests" },
  { id: ID_INVENTORY_MENUS.POTIONS, label: "Potions" },
  { id: ID_INVENTORY_MENUS.ITEMS, label: "Items" },
];

const InventoryDialog = ({ onClose }) => {
  const [selectedMenu, setSelectedMenu] = useState(ID_INVENTORY_MENUS.SEEDS);
  const { seeds, productions, baits, fish, chests, potions, items, refetch } = useItems();
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
  const [selectedProduce, setSelectedProduce] = useState(null);

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

      if (itemId === ID_POTION_ITEMS.SCARECROW) {
        if (isOnFarmPage()) {
          // Directly trigger farm placement mode
          window.dispatchEvent(new CustomEvent('startPotionUsage', {
            detail: { id: itemId, name: 'Scarecrow' }
          }));
          onClose(); // Close inventory dialog
        } else {
          localStorage.setItem("pendingScarecrowPlacement", "true");
          window.location.href = "/farm";
        }
        return;
      }

      if (itemId === ID_POTION_ITEMS.LADYBUG) {
        if (isOnFarmPage()) {
          // Directly trigger farm placement mode
          window.dispatchEvent(new CustomEvent('startPotionUsage', {
            detail: { id: itemId, name: 'Ladybug' }
          }));
          onClose(); // Close inventory dialog
        } else {
          localStorage.setItem("pendingLadybugPlacement", "true");
          window.location.href = "/farm";
        }
        return;
      }

      if (itemId === 9998) {
        if (isOnFarmPage()) {
          // Directly trigger farm placement mode
          window.dispatchEvent(new CustomEvent('startPotionUsage', {
            detail: { id: itemId, name: 'Water Sprinkler' }
          }));
          onClose(); // Close inventory dialog
        } else {
          localStorage.setItem("pendingSprinklerPlacement", "true");
          window.location.href = "/farm";
        }
        return;
      }

      if (itemId === 9999) {
        if (isOnFarmPage()) {
          // Directly trigger farm placement mode
          window.dispatchEvent(new CustomEvent('startPotionUsage', {
            detail: { id: itemId, name: 'Umbrella' }
          }));
          onClose(); // Close inventory dialog
        } else {
          localStorage.setItem("pendingUmbrellaPlacement", "true");
          window.location.href = "/farm";
        }
        return;
      }
      
      if (itemId === 9955) {
        if (isOnFarmPage()) {
          // Directly trigger yarn interaction mode
          window.dispatchEvent(new CustomEvent('startPotionUsage', {
            detail: { id: itemId, name: 'Yarn' }
          }));
          onClose(); // Close inventory dialog
        } else {
          localStorage.setItem("pendingYarnPlacement", "true");
          window.location.href = "/farm";
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
        setList(seeds.filter(item => item.count > 0));
        break;
      case ID_INVENTORY_MENUS.PRODUCE:
        setList(productions.filter(item => item.count > 0));
        break;
      case ID_INVENTORY_MENUS.BAITS:
        setList(baits.filter(item => item.count > 0));
        break;
      case ID_INVENTORY_MENUS.FISHES:
        setList(fish.filter(item => item.count > 0));
        break;
      case ID_INVENTORY_MENUS.CHESTS:
        setList(chests.filter(item => item.count > 0));
        break;
      case ID_INVENTORY_MENUS.POTIONS:
        setList(potions.filter(item => item.count > 0));
        break;
      case ID_INVENTORY_MENUS.ITEMS:
        setList(items.filter(item => item.count > 0));
        break;
      default:
        break;
    }
  }, [selectedMenu, seeds, productions, baits, fish, chests, potions, items]);

  return (
    <>
      <style>{`
        .produce-hover {
          transition: transform 0.2s ease, filter 0.2s ease;
          cursor: pointer;
        }
        .produce-hover:hover {
          transform: scale(1.1);
          filter: drop-shadow(0px 0px 8px rgba(0, 255, 65, 0.8));
        }
        img[src*="rock.png"] {
          transform: scale(0.2);
        }
      `}</style>
      <BaseDialog onClose={onClose} title="INVENTORY" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
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
                  small
                ></BaseButton>
              ))}
            </div>
            <div className="seed-row">
              {selectedMenu !== ID_INVENTORY_MENUS.CHESTS && selectedMenu !== ID_INVENTORY_MENUS.POTIONS && selectedMenu !== ID_INVENTORY_MENUS.ITEMS && (
                <div className="seed-row-wrapper" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                  {list.map((item, index) => (
                  <div 
                    key={index}
                    className={(selectedMenu === ID_INVENTORY_MENUS.PRODUCE || selectedMenu === ID_INVENTORY_MENUS.FISHES) ? "produce-hover" : ""}
                    onClick={() => {
                      if (selectedMenu === ID_INVENTORY_MENUS.PRODUCE || selectedMenu === ID_INVENTORY_MENUS.FISHES) {
                        setSelectedProduce(item);
                      }
                    }}
                  >
                    <ItemSmallView
                      itemId={item.id}
                      count={item.count}
                    ></ItemSmallView>
                  </div>
                  ))}
                </div>
              )}
              {(selectedMenu === ID_INVENTORY_MENUS.CHESTS || selectedMenu === ID_INVENTORY_MENUS.POTIONS || selectedMenu === ID_INVENTORY_MENUS.ITEMS) && (
                <div className="seed-list" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
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
      
      {/* Produce List Dialog */}
      {selectedProduce && (
        <ProduceListDialog 
          item={selectedProduce} 
          onClose={() => setSelectedProduce(null)} 
        />
      )}

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
