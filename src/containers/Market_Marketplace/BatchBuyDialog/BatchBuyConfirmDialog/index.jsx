import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../../../_BaseDialog";
import BaseInput from "../../../../components/inputs/BaseInput";
import BaseDivider from "../../../../components/dividers/BaseDivider";
import BaseButton from "../../../../components/buttons/BaseButton";

const BatchBuyConfirmDialog = ({ onClose, item }) => {
  const [price, setPrice] = useState(0);
  const [budget, setBudget] = useState(0);

  const handleConfirm = () => {};

  return (
    <BaseDialog onClose={onClose} title="SELL ITEMS">
      <div className="batch-buy-confirm-dialog">
        <div className="text-center">
          Floor price: {0}
        </div>
        <div className="row">
          <div>Maximum price per item</div>
          <BaseInput
            className="input"
            value={price}
            setValue={(val) => setPrice(val)}
          ></BaseInput>
        </div>
        <div className="row">
          <div>Budget</div>
          <BaseInput
            className="input"
            value={budget}
            setValue={(val) => setBudget(val)}
          ></BaseInput>
        </div>
        <BaseDivider></BaseDivider>
        <BaseButton label="Confirm" onClick={handleConfirm}></BaseButton>
      </div>
    </BaseDialog>
  );
};

export default BatchBuyConfirmDialog;
