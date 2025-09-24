import React, { useState, useMemo, useEffect } from "react";
import "./style.css";
import BaseDialog from "../../_BaseDialog";
import CardView from "../../../components/boxes/CardView";
import ItemViewMarketplace from "../../../components/boxes/ItemViewMarketplace";
import { ALL_ITEMS } from "../../../constants/item_data";
import { ID_SEEDS, ID_PRODUCE_ITEMS, ID_BAIT_ITEMS, ID_FISH_ITEMS, ID_CHEST_ITEMS, ID_POTION_ITEMS } from "../../../constants/app_ids";
import BuyConfirmDialog from "./BuyConfirmDialog";
import BaseInput from "../../../components/inputs/BaseInput";
import BaseSelect from "../../../components/inputs/BaseSelect";
import BaseButton from "../../../components/buttons/BaseButton";
import { buttonFrames } from "../../../constants/_baseimages";
import BaseDivider from "../../../components/dividers/BaseDivider";
import { useP2PMarket } from "../../../hooks/useContracts";
import { useItems } from "../../../hooks/useItems";
import { useAgwEthersAndService } from "../../../hooks/useAgwEthersAndService";

const BuyDialog = ({ onBack, onClose }) => {
  const [isBuyConfirmDialog, setIsBuyConfirmDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("price-asc");
  const itemsPerPage = 10;

  // Use P2P Market hook
  const { marketData, getAllListings, cancel } = useP2PMarket();
  const { listings, loading, error } = marketData;
  
  // Use Items hook to refresh user inventory after purchase
  const { refetch: refetchItems } = useItems();
  
  // Get current user account
  const { account } = useAgwEthersAndService();

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

    // Find the constant that matches this BigInt ID
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

  // Convert marketplace listings to displayable items
  const marketplaceItems = useMemo(() => {
    if (!listings || listings.length === 0) {
      return [];
    }

    // Show all individual active listings (no grouping)
    const activeListings = listings.filter(listing => listing.active);
    
    return activeListings.map(listing => {
      const itemData = findItemDataByBigIntId(listing.id.toString());
      
      // Fallback for items not found in ALL_ITEMS
      const fallbackItemData = {
        label: `Unknown Item (${listing.id.toString().slice(-4)})`,
        category: 'unknown',
        type: 'ID_RARE_TYPE_COMMON',
        image: '',
        pos: 0
      };
      
      return {
        id: listing.id,
        ...(itemData || fallbackItemData),
        count: listing.amount,
        price: listing.pricePer,
        hasListing: true,
        listingId: listing.lid,
        seller: listing.seller,
        isMyListing: account && listing.seller.toLowerCase() === account.toLowerCase()
      };
    });
  }, [account, listings]);


  // Filter and sort items based on search term and sort criteria
  const filteredItems = useMemo(() => {
    if (!marketplaceItems || marketplaceItems.length === 0) {
      return [];
    }

    let filtered = marketplaceItems;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((item) => {
        const itemName = (item.label || item.name || 'Unknown Item').toLowerCase();
        return itemName.includes(searchTerm.toLowerCase());
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "name-asc":
          return (a.label || a.name || '').localeCompare(b.label || b.name || '');
        case "name-desc":
          return (b.label || b.name || '').localeCompare(a.label || a.name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [marketplaceItems, searchTerm, sortBy]);

  // Paginate the filtered items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);
  const handleBuy = (item) => {
    setSelectedItem(item);
    setIsBuyConfirmDialog(true);
  };

  const handleCancel = async (item) => {
    console.log('Cancelling item:', item);
    if (!item.listingId) {
      console.error('No listing ID found for item:', item);
      return;
    }
    try {
      await cancel(item.listingId);
      // Refresh marketplace listings and user inventory after successful cancellation
      await Promise.all([
        getAllListings(),
        refetchItems()
      ]);
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  };

  const handlePurchaseSuccess = async () => {
    // Refresh marketplace listings and user inventory after successful purchase
    await Promise.all([
      getAllListings(),
      refetchItems()
    ]);
    setIsBuyConfirmDialog(false);
    setSelectedItem({});
  };

  const onLeftPage = () => {
    setCurrentPage((prev) => {
      return prev <= 1 ? prev : prev - 1;
    });
  };

  const onRightPage = () => {
    setCurrentPage((prev) => {
      return prev >= totalPages ? prev : prev + 1;
    });
  };

  return (
    <BaseDialog onClose={onClose} title="BUY ITEMS">
      <div className="buy-dialog-content">
        <CardView className="left-panel">
          <div className="marketplace-filter">
            <div className="tree-header">
              <BaseInput
                className="h-2.5rem"
                placeholder="Search items..."
                value={searchTerm}
                setValue={setSearchTerm}
              />
              <BaseSelect
                options={[
                  { label: "Price - ASC", value: "price-asc" },
                  { label: "Price - DESC", value: "price-desc" },
                  { label: "Name - ASC", value: "name-asc" },
                  { label: "Name - DESC", value: "name-desc" }
                ]}
                value={sortBy}
                setValue={setSortBy}
              />
              <BaseButton label="Reset" onClick={() => {
                setSearchTerm("");
                setSortBy("price-asc");
              }} />
              <BaseButton label="Back" onClick={onBack} />
            </div>
          </div>
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
            ) : paginatedItems.length > 0 ? (
              paginatedItems.map((item, index) => (
                <ItemViewMarketplace
                  key={index}
                  item={item}
                  onBuy={handleBuy}
                  onCancel={handleCancel}
                  isBuy
                  isMyListing={item.isMyListing}
                  price={item.price}
                />
              ))
            ) : filteredItems.length === 0 ? (
              <div className="no-listings">
                <p>- No listings available -</p>
              </div>
            ) : (
              <div className="no-listings">
                <p>- No items on this page -</p>
              </div>
            )}
          </div>
          <BaseDivider></BaseDivider>
          <div className="pagination">
            <img
              src={buttonFrames.leftTriangleButton}
              alt="left"
              className="triangle-icon"
              onClick={onLeftPage}
            />
            <span>{currentPage}</span>
            <img
              src={buttonFrames.rightTriangleButton}
              alt="right"
              className="triangle-icon"
              onClick={onRightPage}
            />
          </div>
        </CardView>
      </div>

      {isBuyConfirmDialog && (
        <BuyConfirmDialog
          onClose={() => setIsBuyConfirmDialog(false)}
          onPurchaseSuccess={handlePurchaseSuccess}
          item={selectedItem}
        />
      )}      
    </BaseDialog>
  );
};

export default BuyDialog;
