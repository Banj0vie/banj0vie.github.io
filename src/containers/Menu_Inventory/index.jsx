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
import { useChestOpener, useRngHub } from "../../hooks/useContracts";
import { useNotification } from "../../contexts/NotificationContext";
import { useGameState } from "../../contexts/GameStateContext";
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
  const { 
    openChest, 
    checkPendingRequests, 
    getAllPendingRequests, 
    listenForChestResults 
  } = useChestOpener();

  const { fulfillRequest } = useRngHub();

  // Potion usage is now handled via context - no need to destructure useFarming
  const { show } = useNotification();
  const { triggerPotionUsage } = useGameState();
  
  // Function to detect if we're on the farm page
  const isOnFarmPage = () => {
    return window.location.pathname === '/farm' || window.location.pathname.endsWith('/farm');
  };
  
  // Chest opening state
  const [, setHasPendingChestRequests] = useState(false);
  const [pendingChestRequests, setPendingChestRequests] = useState([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isRollingDlg, setIsRollingDlg] = useState(false);
  const [rollingInfo, setRollingInfo] = useState({});
  const [revealCleanup, setRevealCleanup] = useState(null);
  
  // Load pending chest requests
  const loadPendingChestRequests = useCallback(async () => {
    if (!checkPendingRequests || !getAllPendingRequests) {
      return;
    }
    
    try {
      const hasPending = await checkPendingRequests();
      setHasPendingChestRequests(hasPending);
      
      if (hasPending) {
        const allPendingReqs = await getAllPendingRequests();
        setPendingChestRequests(allPendingReqs);
      } else {
        setPendingChestRequests([]);
      }
    } catch (err) {
      console.error('Failed to load pending chest requests:', err);
    }
  }, [checkPendingRequests, getAllPendingRequests]);

  // Handle chest reveal
  const handleChestReveal = useCallback(async (requestId, chestId) => {
    if (!requestId) return;
    
    // Clean up any existing reveal process
    if (revealCleanup) {
      revealCleanup();
      setRevealCleanup(null);
    }
    
    setIsRevealing(true);
    
    try {
      // Fulfill the pending request via VRNG system
      const result = await fulfillRequest(requestId);
      
      if (result) {
        // Set up event listener for chest results
        const eventCleanup = await listenForChestResults(requestId, (chestResults) => {
          console.log('Chest results received:', chestResults);
          
          // Show rolling dialog with results
          const rollingInfo = {
            requestId: requestId,
            chestId: chestId,
            chestType: chestResults.chestType,
            rewardId: chestResults.rewardId,
            isReveal: true,
            isComplete: true,
            isFallback: false
          };
          setRollingInfo(rollingInfo);
          setIsRollingDlg(true);
          setIsRevealing(false);
          
          // Refresh pending requests and inventory
          setTimeout(async () => {
            await loadPendingChestRequests();
            await refetch();
          }, 1000);
          
          // Clean up the event listener
          if (revealCleanup) {
            revealCleanup();
            setRevealCleanup(null);
          }
        }, 'latest');
        
        if (eventCleanup) {
          setRevealCleanup(eventCleanup);
        }
        
        // Clean up event listener after 30 seconds (timeout)
        setTimeout(() => {
          if (revealCleanup) {
            revealCleanup();
            setRevealCleanup(null);
          }
          setIsRevealing(false);
        }, 30000);
        
      } else {
        // If fulfillment failed, reset the loading state
        setIsRevealing(false);
      }
      
    } catch (error) {
      console.error('Failed to reveal chest:', error);
      setIsRevealing(false);
      
      // Clean up any existing listeners
      if (revealCleanup) {
        revealCleanup();
        setRevealCleanup(null);
      }
    }
  }, [fulfillRequest, listenForChestResults, loadPendingChestRequests, refetch, revealCleanup]);

  // Cancel reveal process
  const cancelChestReveal = useCallback(async () => {
    if (revealCleanup) {
      revealCleanup();
      setRevealCleanup(null);
    }
    setIsRevealing(false);
    setIsRollingDlg(false);
    
    // Refresh pending requests when dialog is closed
    await loadPendingChestRequests();
  }, [revealCleanup, loadPendingChestRequests]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (revealCleanup) {
        revealCleanup();
      }
    };
  }, [revealCleanup]);

  // Load pending requests on mount and when Items tab is selected
  useEffect(() => {
    loadPendingChestRequests();
  }, [loadPendingChestRequests]);

  // Also load pending requests when switching to Items tab
  useEffect(() => {
    if (selectedMenu === ID_INVENTORY_MENUS.ITEMS) {
      loadPendingChestRequests();
    }
  }, [selectedMenu, loadPendingChestRequests]);

  const onUseItem = async (itemId) => {
    try {
      console.log("Using item:", itemId);
      
      // Handle chest opening
      if (itemId === ID_CHEST_ITEMS.CHEST_WOOD || 
          itemId === ID_CHEST_ITEMS.CHEST_BRONZE || 
          itemId === ID_CHEST_ITEMS.CHEST_SILVER || 
          itemId === ID_CHEST_ITEMS.CHEST_GOLD) {
        
        show("Opening chest...", "info");
        const result = await openChest(itemId);
        
        if (result.success) {
          show("Chest opened! Click 'Reveal' to see your reward.", "success");
          // Wait a moment for the transaction to be processed
          setTimeout(async () => {
            // Refresh pending requests after chest opening
            await loadPendingChestRequests();
            // Also refresh items to update the inventory display
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
          triggerPotionUsage(itemId, "Growth Elixir");
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
          triggerPotionUsage(itemId, "Pesticide");
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
          triggerPotionUsage(itemId, "Fertilizer");
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
        
        // Create pending chest request items
        const pendingChestItems = pendingChestRequests.map(req => ({
          id: req.chestId,
          count: 1,
          category: 'ID_ITEM_LOOT',
          subCategory: 'ID_LOOT_CATEGORY_CHEST',
          usable: true,
          isPending: true,
          requestId: req.requestId
        }));
        
        // Combine regular items with pending chest items
        const allItemsWithPending = [...regularItems, ...pendingChestItems];
        setList(allItemsWithPending);
        break;
      default:
        break;
    }
  }, [selectedMenu, allItems, pendingChestRequests]);

  return !isRollingDlg ? (
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
                  // Check if this is a pending chest item
                  if (item.isPending) {
                    return (
                      <ItemViewUsable
                        key={`pending-${item.requestId}`}
                        itemId={item.id}
                        count={item.count}
                        onUse={() => handleChestReveal(item.requestId, item.id)}
                        usable={item.usable}
                        buttonLabel={isRevealing ? "Revealing..." : "Reveal"}
                        disabled={isRevealing}
                      ></ItemViewUsable>
                    );
                  }
                  
                  // Regular item (chest or potion)
                  return (
                    <ItemViewUsable
                      key={index}
                      itemId={item.id}
                      count={item.count}
                      onUse={onUseItem}
                      usable={item.usable}
                      buttonLabel="Use"
                      disabled={isRevealing}
                    ></ItemViewUsable>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseDialog>
  ) : (
      <ChestRollingDialog
        rollingInfo={rollingInfo}
        onClose={cancelChestReveal}
        onBack={cancelChestReveal}
      />
    );
};

export default InventoryDialog;
