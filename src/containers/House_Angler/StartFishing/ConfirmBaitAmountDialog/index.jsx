import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../../../_BaseDialog";
import Slider from "../../../../components/inputs/Slider";
import BaseDivider from "../../../../components/dividers/BaseDivider";
import BaseButton from "../../../../components/buttons/BaseButton";
import { useItems } from "../../../../hooks/useItems";
import CardView from "../../../../components/boxes/CardView";

const ConfirmBaitAmountDialog = ({ onClose, onConfirm, baitId }) => {
  const { all: userItems } = useItems();
  const [amount, setAmount] = useState(0);
  
  // Get the amount of baits the user owns
  const userBaitItem = userItems.find(item => item.id === baitId);
  const maxAmount = userBaitItem ? userBaitItem.count : 0;
  const selectedAmount = parseInt(amount) + 1;
  
  return (
    <BaseDialog onClose={onClose} title="AMOUNT"  header="/images/dialog/modal-header-angler.png" headerOffset={50} >
      <div className="confirm-bait-amount-dialog">
        <CardView className="p-0">
          <div className="text-center">
            Throw {selectedAmount} baits!
          </div>
        </CardView>
        <Slider 
          value={amount} 
          setValue={(val) => setAmount(val)}
          max={Math.max(0, maxAmount - 1)} // Slider is 0-indexed, so max is count-1
        ></Slider>
        <BaseButton
          label="Confirm"
          onClick={() => onConfirm(selectedAmount)}
          disabled={selectedAmount > maxAmount || selectedAmount <= 0}
        ></BaseButton>
      </div>
    </BaseDialog>
  );
};

export default ConfirmBaitAmountDialog;
