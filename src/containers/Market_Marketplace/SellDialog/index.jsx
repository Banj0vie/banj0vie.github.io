import React, { useState, useMemo, useCallback } from "react";
import "./style.css";
import BaseDialog from "../../_BaseDialog";
import CardView from "../../../components/boxes/CardView";
import ItemViewMarketplace from "../../../components/boxes/ItemViewMarketplace";
import TreeInput from "../../../components/inputs/TreeInputs";
import { useItems } from "../../../hooks/useItems";
import { useMarket } from "../../../hooks/useMarket";
import SendNFTDialog from "./SendNFTDialog";
import SellConfirmDialog from "./SellConfirmDialog";

const SellDialog = ({ onBack, onClose }) => {
  const [isSendNFTDialog, setIsSendNFTDialog] = useState(false);
  const [isSellConfirmDialog, setIsSellConfirmDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [checkedItemIds, setCheckedItemIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { all: allItems, loading, refetch: refetchItems } = useItems();
  const { getAllListings } = useMarket();
  // Filter items based on search term, only show owned items
  const filteredItems = useMemo(() => {
    if (!allItems || allItems.length === 0) {
      return [];
    }

    // First filter to only show owned items
    let filtered = allItems.filter((item) => item.count > 0 && item.category !== 'ID_ITEM_SEED' && checkedItemIds.includes(item.id));

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((item) => {
        const itemName = (item.label || item.name || 'Unknown Item').toLowerCase();
        return itemName.includes(searchTerm.toLowerCase());
      });
    }

    return filtered;
  }, [allItems, checkedItemIds, searchTerm]);

  const handleSend = (item) => {
    setSelectedItem(item);
    setIsSendNFTDialog(true);
  };

  const handleSell = (item) => {
    setSelectedItem(item);
    setIsSellConfirmDialog(true);
  };

  const handleSellSuccess = async () => {
    // Refresh marketplace listings and user inventory after successful listing
    await Promise.all([
      getAllListings(),
      refetchItems()
    ]);
    setIsSellConfirmDialog(false);
    setSelectedItem({});
  };

  const handleSendSuccess = async () => {
    // Refresh user inventory after successful send
    await refetchItems();
    setIsSendNFTDialog(false);
    setSelectedItem({});
  };

  return (
    <BaseDialog onClose={onClose} title="SELL ITEMS">
      <div className="sell-dialog-content">
        <CardView className="left-panel items-list">
          <TreeInput
            onBack={onBack}
            onSelect={useCallback(
              (checkedIds) => setCheckedItemIds(checkedIds),
              []
            )}
            onSearch={setSearchTerm}
            search={searchTerm}
          ></TreeInput>
        </CardView>
        <CardView className="right-panel">
          {loading && <div className="items-header">Loading items... </div>}
          <div className="items-list">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <ItemViewMarketplace
                  key={item.id}
                  item={item}
                  onSend={handleSend}
                  onSell={handleSell}
                />
              ))
            ) : (
              <div className="no-items">
                <p>No items found matching your search criteria.</p>
              </div>
            )}
          </div>
        </CardView>
      </div>
      {isSendNFTDialog && (
        <SendNFTDialog
          onClose={() => setIsSendNFTDialog(false)}
          onSendSuccess={handleSendSuccess}
          item={selectedItem}
        ></SendNFTDialog>
      )}
      {isSellConfirmDialog && (
        <SellConfirmDialog
          onClose={() => setIsSellConfirmDialog(false)}
          onSellSuccess={handleSellSuccess}
          item={selectedItem}
        ></SellConfirmDialog>
      )}
    </BaseDialog>
  );
};

export default SellDialog;
