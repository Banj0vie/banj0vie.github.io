import React, { useState } from "react";
import "./style.css";
import ItemBigView from "../../../components/boxes/ItemViewBig";
import { ID_FISHING_RODS } from "../../../constants/app_ids";
import LabelValueBox from "../../../components/boxes/LabelValueBox";
import BaseButton from "../../../components/buttons/BaseButton";
import SelectBaitDialog from "./SelectBaitDialog";
import ConfirmBaitAmountDialog from "./ConfirmBaitAmountDialog";

const StartFishing = ({ onBack, onStart }) => {
  const currentFishingRodId = ID_FISHING_RODS.LVL5;
  const [selectedBaitId, setSelectedBaitId] = useState(null);
  const [isBaitSelectDialog, setIsBaitSelectDialog] = useState(false);
  const [isConfirmDialog, setIsConfirmDialog] = useState(false);

  const onSelectBait = (baitId) => {
    setSelectedBaitId(baitId);
    setIsBaitSelectDialog(false);
  };

  const onConfirmBaitAmount = (amount) => {
    setIsConfirmDialog(false);
    onStart(selectedBaitId, amount);
  };
  return (
    <div className="start-fishing">
      <div className="tool-bar">
        <ItemBigView
          itemId={currentFishingRodId}
          onClick={() => {}}
        ></ItemBigView>
        <div>{`<>`}</div>
        <ItemBigView
          itemId={selectedBaitId}
          onClick={() => setIsBaitSelectDialog(true)}
        ></ItemBigView>
      </div>
      <LabelValueBox label="Fishing Power" value="5"></LabelValueBox>
      <LabelValueBox label="Failure Chance" value="12.5%"></LabelValueBox>
      <LabelValueBox label="Exp Reward" value="250"></LabelValueBox>
      <LabelValueBox label="Life Bud Chance" value="0.01%"></LabelValueBox>
      <br />
      <div className="button-wrapper">
        <BaseButton label="Back" onClick={onBack}></BaseButton>
        {selectedBaitId ? (
          <BaseButton
            label="Throw Bait"
            onClick={() => setIsConfirmDialog(true)}
          ></BaseButton>
        ) : (
          <BaseButton
            label="Select Bait"
            onClick={() => setIsBaitSelectDialog(true)}
          ></BaseButton>
        )}
      </div>
      {isBaitSelectDialog && (
        <SelectBaitDialog
          onClose={() => setIsBaitSelectDialog(false)}
          onSelect={onSelectBait}
        ></SelectBaitDialog>
      )}
      {isConfirmDialog && (
        <ConfirmBaitAmountDialog
          onClose={() => setIsConfirmDialog(false)}
          onConfirm={onConfirmBaitAmount}
        ></ConfirmBaitAmountDialog>
      )}
    </div>
  );
};

export default StartFishing;
