import React from "react";
import "./style.css";
import BaseDialog from "../../BaseDialog";
import CardView from "../../../components/boxes/CardView";
import TreeInput from "../../../components/inputs/TreeInputs";

const SellDialog = ({ onBack, onClose }) => {
  return (
    <BaseDialog onClose={onClose} title="SELL ITEMS">
      <div className="sell-dialog-content">
        <CardView className="left-panel">
          <TreeInput onBack={onBack}></TreeInput>
        </CardView>
        <CardView className="right-panel"></CardView>
      </div>
    </BaseDialog>
  );
};

export default SellDialog;
