import React from "react";
import TreeInput from "../TreeInputs";
import CardView from "../../boxes/CardView";

/**
 * Reusable marketplace filter component that provides category filtering
 * for both buy and sell dialogs in the marketplace
 */
const MarketplaceFilter = ({ onBack, onSelect, sortable = false }) => {
  return (
    <CardView className="marketplace-filter left-panel items-list">
      <TreeInput
        onBack={onBack}
        onSelect={onSelect}
        sortable={sortable}
      />
    </CardView>
  );
};

export default MarketplaceFilter;
