import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../../BaseDialog";
import CardView from "../../../components/boxes/CardView";
import TreeInput from "../../../components/inputs/TreeInputs";

const SellDialog = ({ onBack, onClose }) => {
  const [selected, setSelected] = useState([]);

  return (
    <BaseDialog onClose={onClose} title="SELL ITEMS">
      <div className="sell-dialog-content">
        <CardView className="left-panel">
          <TreeInput onBack={onBack} onSelect={(sel) => setSelected(sel)}></TreeInput>
        </CardView>
        <CardView className="right-panel"></CardView>
      </div>
    </BaseDialog>
  );
};

export default SellDialog;
