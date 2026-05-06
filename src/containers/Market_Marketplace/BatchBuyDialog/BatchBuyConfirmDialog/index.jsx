import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../../../_BaseDialog";
import BaseInput from "../../../../components/inputs/BaseInput";
import BaseDivider from "../../../../components/dividers/BaseDivider";
import BaseButton from "../../../../components/buttons/BaseButton";
import { useMarket } from "../../../../hooks/useMarket";
import { useNotification } from "../../../../contexts/NotificationContext";
import { handleContractError } from "../../../../utils/errorHandler";

const BatchBuyConfirmDialog = ({ onClose, onPurchaseSuccess, item }) => {
  const [maxPricePer, setMaxPricePer] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [loading, setLoading] = useState(false);

  const { batchBuy } = useMarket();
  const { show } = useNotification();

  const handleConfirm = async () => {
    if (
      !item ||
      !item.id ||
      !maxPricePer ||
      maxPricePer <= 0 ||
      !totalBudget ||
      totalBudget <= 0
    ) {
      show("Please enter valid maximum price and budget", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await batchBuy(item.id, maxPricePer, totalBudget);
      show(
        `Batch purchase successful!`,
        "success"
      );
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
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
    <BaseDialog onClose={onClose} title="BATCH BUY" header="/images/dialog/modal-header-vendor.png" headerOffset={10}>
      <div className="batch-buy-confirm-dialog">
        {item && (
          <>
            <div className="text-center">
              <h3>{item.label || item.name || "Unknown Item"}</h3>
              <p>Buy multiple items at or below your maximum price</p>
            </div>
            <div className="row">
              <div>Maximum price per item (Gold)</div>
              <BaseInput
                className="input"
                type="number"
                min="1"
                value={maxPricePer}
                setValue={(val) =>
                  setMaxPricePer(Math.max(1, parseInt(val) || 1))
                }
              ></BaseInput>
            </div>
            <div className="row">
              <div>Total budget (Gold)</div>
              <BaseInput
                className="input"
                type="number"
                min="1"
                value={totalBudget}
                setValue={(val) =>
                  setTotalBudget(Math.max(1, parseInt(val) || 1))
                }
              ></BaseInput>
            </div>
            <BaseDivider></BaseDivider>
            <BaseButton
              label={loading ? "Buying..." : "Confirm Batch Buy"}
              onClick={handleConfirm}
              disabled={loading || !maxPricePer || !totalBudget}
            ></BaseButton>
          </>
        )}
      </div>
    </BaseDialog>
  );
};

export default BatchBuyConfirmDialog;
