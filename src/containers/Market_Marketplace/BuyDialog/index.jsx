import React, { useState, useMemo, useCallback } from "react";
import "./style.css";
import BaseDialog from "../../_BaseDialog";
import CardView from "../../../components/boxes/CardView";
import ItemViewMarketplace from "../../../components/boxes/ItemViewMarketplace";
import { ALL_ITEMS } from "../../../constants/item_data";
import BuyConfirmDialog from "./BuyConfirmDialog";
import TreeInput from "../../../components/inputs/TreeInputs";
import { buttonFrames } from "../../../constants/_baseimages";
import BaseDivider from "../../../components/dividers/BaseDivider";

const BuyDialog = ({ onBack, onClose }) => {
  const [isBuyConfirmDialog, setIsBuyConfirmDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [checkedItemIds, setCheckedItemIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Convert ALL_ITEMS to array format for filtering
  const allItems = useMemo(() => {
    return Object.entries(ALL_ITEMS).map(([id, itemData]) => ({
      id,
      ...itemData,
      count: 0, // Set count to 0 since these are items available for purchase
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

  const handleBuy = (item) => {
    setSelectedItem(item);
    setIsBuyConfirmDialog(true);
  };

  const onLeftPage = () => {
    setCurrentPage((prev) => {
      return prev <= 1 ? prev : prev - 1;
    });
  };

  const onRightPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  return (
    <BaseDialog onClose={onClose} title="BUY ITEMS">
      <div className="buy-dialog-content">
        <CardView className="left-panel">
          <TreeInput
            onBack={onBack}
            onSelect={useCallback(
              (checkedIds) => setCheckedItemIds(checkedIds),
              []
            )}
            sortable
          ></TreeInput>
        </CardView>

        <CardView className="right-panel">
          <div className="items-list">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <ItemViewMarketplace
                  key={item.id}
                  item={item}
                  onBuy={handleBuy}
                  isBuy
                  price={item.price}
                />
              ))
            ) : (
              <div className="no-listings">
                <p>- No listings available -</p>
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
          item={selectedItem}
        />
      )}
    </BaseDialog>
  );
};

export default BuyDialog;
