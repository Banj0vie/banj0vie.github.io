import React, { useState, useMemo, useCallback } from "react";
import "./style.css";
import BaseDialog from "../../_BaseDialog";
import CardView from "../../../components/boxes/CardView";
import TreeInput from "../../../components/inputs/TreeInputs";
import ItemViewMarketplace from "../../../components/boxes/ItemViewMarketplace";
import { ALL_ITEMS } from "../../../constants/item_data";
import BatchBuyConfirmDialog from "./BatchBuyConfirmDialog";

const BatchBuyDialog = ({ onBack, onClose }) => {
  const [isBatchBuyConfirmDialog, setIsBatchBuyConfirmDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});

  const [checkedItemIds, setCheckedItemIds] = useState([]);
  
  // Convert ALL_ITEMS to array format for filtering
  const allItems = useMemo(() => {
    return Object.entries(ALL_ITEMS).map(([id, itemData]) => ({
      id,
      ...itemData,
      count: 0 // Set count to 0 since these are items available for purchase
    }));
  }, []);

  // Filter items based on checked item IDs
  const filteredItems = useMemo(() => {
    if (!allItems || checkedItemIds.length === 0) {
      return [];
    }

    return allItems.filter((item) => {
      return checkedItemIds.includes(item.id);
    });
  }, [allItems, checkedItemIds]);

  const handleBatchBuy = (item) => {
    setSelectedItem(item);
    setIsBatchBuyConfirmDialog(true);
  };

  return (
    <BaseDialog onClose={onClose} title="BUY ITEMS">
      <div className="batch-buy-dialog-content">
        <CardView className="left-panel">
          <TreeInput
            onBack={onBack}
            onSelect={useCallback(
              (checkedIds) => setCheckedItemIds(checkedIds),
              []
            )}
          ></TreeInput>
        </CardView>
        <CardView className="right-panel">
          <div className="items-list">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <ItemViewMarketplace
                  key={item.id}
                  item={item}
                  onBatchBuy={handleBatchBuy}
                  isBatchBuy
                />
              ))
            ) : (
              <div className="no-items">
                <p>Check items from the left panel to display them here.</p>
              </div>
            )}
          </div>
        </CardView>
      </div>
      {isBatchBuyConfirmDialog && (
        <BatchBuyConfirmDialog
          onClose={() => setIsBatchBuyConfirmDialog(false)}
          item={selectedItem}
        ></BatchBuyConfirmDialog>
      )}
    </BaseDialog>
  );
};

export default BatchBuyDialog;
