import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../../../_BaseDialog";
import BaseInput from "../../../../components/inputs/BaseInput";
import Slider from "../../../../components/inputs/Slider";
import BaseDivider from "../../../../components/dividers/BaseDivider";
import BaseButton from "../../../../components/buttons/BaseButton";
import { useP2PMarket } from "../../../../hooks/useContracts";
import { useNotification } from "../../../../contexts/NotificationContext";
import { handleContractError } from "../../../../utils/errorHandler";

const SellConfirmDialog = ({ onClose, onSellSuccess, item }) => {
  const [price, setPrice] = useState(0);
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);

  const { list } = useP2PMarket();
  const { show } = useNotification();

  const handleConfirm = async () => {
    if (!item || !item.id || !amount || amount <= 0 || !price || price <= 0) {
      show("Please enter valid amount and price", "error");
      return;
    }

    if (amount > item.count) {
      show("Amount cannot exceed your available items", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await list(item.id, amount, price);
      show(
        `Items listed successfully!`,
        "success"
      );
      if (onSellSuccess) {
        onSellSuccess();
      } else {
        onClose();
      }
    } catch (error) {
      const { message } = handleContractError(error);
      show(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseDialog onClose={onClose} title="SELL ITEMS">
      <div className="sell-confirm-dialog">
        {item && (
          <>
            <div className="text-center">
              <h3>{item.label || item.name || "Unknown Item"}</h3>
              <p>Available: {item.count} items</p>
            </div>
            <div className="row">
              <div>Price per item (HNY)</div>
              <BaseInput
                className="input"
                type="number"
                min="1"
                value={price}
                setValue={(val) => setPrice(Math.max(1, parseInt(val) || 1))}
              ></BaseInput>
            </div>
            <div className="row">
              <div>Amount to sell</div>
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
            <div className="total-price">Total: {price * amount} HNY</div>
            <BaseDivider></BaseDivider>
            <BaseButton
              label={loading ? "Listing..." : "Confirm Sale"}
              onClick={handleConfirm}
              disabled={loading || !price || !amount}
            ></BaseButton>
          </>
        )}
      </div>
    </BaseDialog>
  );
};

export default SellConfirmDialog;
