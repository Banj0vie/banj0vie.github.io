import React, { useState, useMemo, useEffect, useCallback } from "react";
import "./style.css";
import BaseDialog from "../../_BaseDialog";
import CardView from "../../../components/boxes/CardView";
import TreeInput from "../../../components/inputs/TreeInputs";
import ItemViewMarketplace from "../../../components/boxes/ItemViewMarketplace";
import { ALL_ITEMS } from "../../../constants/item_data";
import { ID_SEEDS, ID_PRODUCE_ITEMS, ID_BAIT_ITEMS, ID_FISH_ITEMS, ID_CHEST_ITEMS, ID_POTION_ITEMS } from "../../../constants/app_ids";
import { useMarket } from "../../../hooks/useMarket";
import BatchBuyConfirmDialog from "./BatchBuyConfirmDialog";

const BatchBuyDialog = ({ onBack, onClose, onPurchaseSuccess, item, excludeSeller }) => {
  const [isBatchBuyConfirmDialog, setIsBatchBuyConfirmDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [checkedItemIds, setCheckedItemIds] = useState([]);
  // Use P2P Market hook to get actual marketplace listings
  const { marketData, getAllListings } = useMarket();
  const { listings, loading, error } = marketData;

  // Helper function to find item data by BigInt ID
  const findItemDataByBigIntId = (bigIntIdString) => {
    const allItemConstants = [
      ...Object.values(ID_SEEDS),
      ...Object.values(ID_PRODUCE_ITEMS),
      ...Object.values(ID_BAIT_ITEMS),
      ...Object.values(ID_FISH_ITEMS),
      ...Object.values(ID_CHEST_ITEMS),
      ...Object.values(ID_POTION_ITEMS),
    ];

    const matchingConstant = allItemConstants.find(constantId => 
      constantId.toString() === bigIntIdString
    );

    if (matchingConstant) {
      return ALL_ITEMS[matchingConstant];
    }
    return null;
  };

  // Load marketplace listings on mount
  useEffect(() => {
    getAllListings();
  }, [getAllListings]);

  // Group marketplace listings by item ID and calculate price statistics
  const groupedItems = useMemo(() => {
    if (!listings || listings.length === 0) {
      return [];
    }

    // Filter out listings from the excluded seller (current user's own listings)
    const filteredListings = listings.filter(listing => {
      if (!listing.active) return false;
      if (excludeSeller && listing.seller.toLowerCase() === excludeSeller.toLowerCase()) {
        return false;
      }
      return true;
    });
    
    const grouped = {};

    filteredListings.forEach(listing => {
      const itemId = listing.id.toString();
      if (!grouped[itemId]) {
        const itemData = findItemDataByBigIntId(itemId);
        grouped[itemId] = {
          id: listing.id,
          ...(itemData || {
            label: `Unknown Item (${itemId.slice(-4)})`,
            category: 'unknown',
            type: 'ID_RARE_TYPE_COMMON',
            image: '',
            pos: 0
          }),
          listings: [],
          totalAmount: 0,
          minPrice: Infinity,
          maxPrice: 0,
          avgPrice: 0
        };
      }

      grouped[itemId].listings.push(listing);
      grouped[itemId].totalAmount += listing.amount;
      grouped[itemId].minPrice = Math.min(grouped[itemId].minPrice, listing.pricePer);
      grouped[itemId].maxPrice = Math.max(grouped[itemId].maxPrice, listing.pricePer);
    });

    // Calculate average price
    Object.values(grouped).forEach(item => {
      const totalValue = item.listings.reduce((sum, listing) => sum + (listing.pricePer * listing.amount), 0);
      item.avgPrice = Math.round(totalValue / item.totalAmount);
    });

    return Object.values(grouped);
  }, [listings, excludeSeller]);

  // Filter and sort grouped items
  const filteredItems = useMemo(() => {
    let filtered = groupedItems.filter((item) => checkedItemIds.includes(item.id));

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((item) => {
        const itemName = (item.label || item.name || 'Unknown Item').toLowerCase();
        return itemName.includes(searchTerm.toLowerCase());
      });
    }

    return filtered;
  }, [groupedItems, checkedItemIds, searchTerm]);

  const handleBatchBuy = (item) => {
    setSelectedItem(item);
    setIsBatchBuyConfirmDialog(true);
  };

  const handleBatchBuySuccess = async () => {
    // Refresh marketplace listings after successful batch purchase
    await getAllListings();
    if (onPurchaseSuccess) {
      await onPurchaseSuccess();
    }
    setIsBatchBuyConfirmDialog(false);
    setSelectedItem({});
  };

  const toggleAccordion = (itemId) => {
    setExpandedItems(prev => {
      // If the clicked item is already expanded, close it
      if (prev.has(itemId)) {
        return new Set();
      } else {
        // Close all others and open only the clicked item
        return new Set([itemId]);
      }
    });
  };

  return (
    <BaseDialog onClose={onClose} title="BATCH BUY">
      <div className="batch-buy-dialog-content">
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
          <div className="items-list">
            {loading ? (
              <div className="loading">
                <p>Loading marketplace listings...</p>
              </div>
            ) : error ? (
              <div className="error">
                <p>Error: {error}</p>
              </div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isExpanded = expandedItems.has(item.id.toString());
                const hasMultipleListings = item.listings.length > 0;
                
                return (
                  <div key={item.id} className="batch-buy-item">
                    <div className="item-header" onClick={() => hasMultipleListings && toggleAccordion(item.id.toString())}>
                      <ItemViewMarketplace
                        item={item}
                        onBatchBuy={handleBatchBuy}
                        isBatchBuy
                      />
                    </div>
                    {isExpanded && hasMultipleListings && (
                      <div className="price-details accordion-content">
                        <div className="price-summary">
                          <p><strong>Available:</strong> {item.totalAmount} items</p>
                          <p><strong>Price range:</strong> {item.minPrice} - {item.maxPrice} HNY</p>
                          <p><strong>Average price:</strong> {item.avgPrice} HNY</p>
                          <p><strong>Listings:</strong> {item.listings.length}</p>
                        </div>
                        <div className="individual-listings">
                          <h4>Individual Listings:</h4>
                          {item.listings.map((listing, index) => (
                            <div key={index} className="listing-item">
                              <p>Listing {index + 1}: {listing.amount} items @ {listing.pricePer} HNY each</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!hasMultipleListings && (
                      <div className="price-details single-listing">
                        <p><strong>Available:</strong> {item.totalAmount} items @ {item.minPrice} HNY each</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="no-items">
                <p>No items found matching your search criteria.</p>
              </div>
            )}
          </div>
        </CardView>
      </div>
      {isBatchBuyConfirmDialog && (
        <BatchBuyConfirmDialog
          onClose={() => setIsBatchBuyConfirmDialog(false)}
          onPurchaseSuccess={handleBatchBuySuccess}
          item={selectedItem}
        ></BatchBuyConfirmDialog>
      )}
    </BaseDialog>
  );
};

export default BatchBuyDialog;
