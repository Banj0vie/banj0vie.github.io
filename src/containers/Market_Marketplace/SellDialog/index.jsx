import React from "react";
import "./style.css";
import BaseDialog from "../../BaseDialog";
import CardView from "../../../components/boxes/CardView";
import TreeInput from "../../../components/inputs/TreeInputs";

const SellDialog = ({ onBack, onClose }) => {
  const handleSelect = (selected) => {
    console.log("Selected items:", selected);
  };

  return (
    <BaseDialog onClose={onClose} title="SELL ITEMS">
      <div className="sell-dialog-content">
        <CardView className="left-panel">
          <TreeInput onBack={onBack} onSelect={handleSelect}></TreeInput>
        </CardView>
        <CardView className="right-panel"></CardView>
      </div>
    </BaseDialog>
  );
};

export default SellDialog;
