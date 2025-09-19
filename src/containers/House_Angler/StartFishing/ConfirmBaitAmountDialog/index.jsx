import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../../../BaseDialog";
import Slider from "../../../../components/inputs/Slider";
import BaseDivider from "../../../../components/dividers/BaseDivider";
import BaseButton from "../../../../components/buttons/BaseButton";

const ConfirmBaitAmountDialog = ({ onClose, onConfirm }) => {
  const [amount, setAmount] = useState(0);
  return (
    <BaseDialog onClose={onClose} title="AMOUNT">
      <div className="confirm-bait-amount-dialog">
        <Slider value={amount} setValue={(val) => setAmount(val)}></Slider>
        <div className="text-center">
          <br />
          Throw {parseInt(amount) + 1} baits
        </div>
        <BaseDivider></BaseDivider>
        <BaseButton
          label="Confirm"
          onClick={() => onConfirm(amount)}
        ></BaseButton>
      </div>
    </BaseDialog>
  );
};

export default ConfirmBaitAmountDialog;
