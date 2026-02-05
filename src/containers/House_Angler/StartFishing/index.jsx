import React, { useState } from "react";
import "./style.css";
import ItemBigView from "../../../components/boxes/ItemViewBig";
import { ID_FISHING_RODS } from "../../../constants/app_ids";
import LabelValueBox from "../../../components/boxes/LabelValueBox";
import BaseButton from "../../../components/buttons/BaseButton";
import SelectBaitDialog from "./SelectBaitDialog";
import ConfirmBaitAmountDialog from "./ConfirmBaitAmountDialog";
import { useFishing } from "../../../hooks/useFishing";
import { useNotification } from "../../../contexts/NotificationContext";
import { handleContractError } from "../../../utils/errorHandler";

const StartFishing = ({ onBack, onStart }) => {
  const currentFishingRodId = ID_FISHING_RODS.LVL5;
  const [selectedBaitId, setSelectedBaitId] = useState(null);
  const [isBaitSelectDialog, setIsBaitSelectDialog] = useState(false);
  const [isConfirmDialog, setIsConfirmDialog] = useState(false);
  const [isThrowingBait, setIsThrowingBait] = useState(false);

  const { fish } = useFishing();
  const { show } = useNotification();

  const onSelectBait = (baitId) => {
    setSelectedBaitId(baitId);
    setIsBaitSelectDialog(false);
  };

  const onConfirmBaitAmount = async (amount) => {
    setIsThrowingBait(true);
    setIsConfirmDialog(false);
    try {
      // Call fish() function when user confirms bait amount
      const result = await fish(selectedBaitId, amount);

      if (result && result.txHash) {
        show("Bait thrown! Now reel in your catch!", "success");
        // Navigate to fishing page - request ID will be loaded from pending requests
        onStart(selectedBaitId, amount);
      } else {
        show("Failed to throw bait", "error");
      }
    } catch (error) {
      const { message } = handleContractError(error, 'throwing bait');
      show(message, "error");
    } finally {
      setIsThrowingBait(false);
    }
  };
  return (
    <div className="start-fishing">
      <div className="tool-bar">
        <ItemBigView
          itemId={currentFishingRodId}
          onClick={() => { }}
        ></ItemBigView>
        <img className="vs" src="/images/items/left-right.png" alt="vs" />
        <ItemBigView
          itemId={selectedBaitId}
          onClick={() => setIsBaitSelectDialog(true)}
        ></ItemBigView>
      </div>
      <div className="description">
        <LabelValueBox label="Fishing Power" value="5"></LabelValueBox>
        <LabelValueBox label="Failure Chance" value="12.5%"></LabelValueBox>
        <LabelValueBox label="Exp Reward" value="250"></LabelValueBox>
        <LabelValueBox label="Life Bud Chance" value="0.01%"></LabelValueBox>
      </div>
      <br />
      <div className="button-wrapper">
        <BaseButton label="Back" onClick={onBack} isError small className="w-50"></BaseButton>
        {selectedBaitId ? (
          <BaseButton
            label={isThrowingBait ? "Throwing..." : "Throw Bait"}
            onClick={() => setIsConfirmDialog(true)}
            disabled={isThrowingBait}
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
          baitId={selectedBaitId}
        ></ConfirmBaitAmountDialog>
      )}
    </div>
  );
};

export default StartFishing;
