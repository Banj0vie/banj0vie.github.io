import React, { useState, useMemo, useCallback } from "react";
import "./style.css";
import BaseDialog from "../../BaseDialog";
import CardView from "../../../components/boxes/CardView";
import TreeInput from "../../../components/inputs/TreeInputs";
import SellItemBox from "../../../components/boxes/SellItemBox";
import { useItems } from "../../../hooks/useItems";

const SellDialog = ({ onBack, onClose }) => {
  const [checkedItemIds, setCheckedItemIds] = useState([]);
  const { all: allItems, loading, error } = useItems();
  // Filter items based on checked item IDs
  const filteredItems = useMemo(() => {
    if (!allItems || checkedItemIds.length === 0) {
      return [];
    }
    
    return allItems.filter(item => {
      return checkedItemIds.includes(item.id);
    });
  }, [allItems, checkedItemIds]);

  const handleSend = (item) => {
    console.log("Send item:", item);
    // TODO: Implement send functionality
  };

  const handleSell = (item) => {
    console.log("Sell item:", item);
    // TODO: Implement sell functionality
  };

  return (
    <BaseDialog onClose={onClose} title="SELL ITEMS">
      <div className="sell-dialog-content">
        <CardView className="left-panel">
          <TreeInput onBack={onBack} onSelect={useCallback((checkedIds) => setCheckedItemIds(checkedIds), [])}></TreeInput>
        </CardView>
        <CardView className="right-panel">
          <div className="items-header">
            {loading ? "Loading items..." : error ? `Error: ${error}` : `Items (${filteredItems.length})`}
          </div>
          <div className="items-list">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <SellItemBox
                  key={item.id}
                  item={item}
                  onSend={handleSend}
                  onSell={handleSell}
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
    </BaseDialog>
  );
};

export default SellDialog;
