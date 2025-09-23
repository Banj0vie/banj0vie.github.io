import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../../../_BaseDialog";
import BaseInput from "../../../../components/inputs/BaseInput";
import Slider from "../../../../components/inputs/Slider";
import BaseDivider from "../../../../components/dividers/BaseDivider";
import BaseButton from "../../../../components/buttons/BaseButton";

const SellConfirmDialog = ({ onClose, item }) => {
  const [price, setPrice] = useState(0);
  const [amount, setAmount] = useState(1);

  const handleConfirm = () => {};

  return (
    <BaseDialog onClose={onClose} title="SELL ITEMS">
      <div className="sell-confirm-dialog">
        <div className="text-center">
          Selling {item.label}
          <br />
          Floor price: {0}
        </div>
        <div className="row">
          <div>Price</div>
          <BaseInput
            className="input"
            value={price}
            setValue={(val) => setPrice(val)}
          ></BaseInput>
        </div>
        <div className="row">
          <div>Amount</div>
          <div className="slider">
            <Slider
              min="1"
              max={item.count}
              value={amount}
              setValue={(val) => setAmount(val)}
            ></Slider>
          </div>
        </div>
        <div className="count-label">SELL x {amount}</div>
        <BaseDivider></BaseDivider>
        <BaseButton label="Confirm" onClick={handleConfirm}></BaseButton>
      </div>
    </BaseDialog>
  );
};

export default SellConfirmDialog;
