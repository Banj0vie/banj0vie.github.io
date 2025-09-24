import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../../../_BaseDialog";
import BaseInput from "../../../../components/inputs/BaseInput";
import BaseDivider from "../../../../components/dividers/BaseDivider";
import BaseButton from "../../../../components/buttons/BaseButton";
import { useP2PMarket } from "../../../../hooks/useContracts";
import { useNotification } from "../../../../contexts/NotificationContext";

const BuyConfirmDialog = ({ onClose, onPurchaseSuccess, item }) => {
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const { purchase } = useP2PMarket();
  const { show } = useNotification();

  const handleConfirm = async () => {
    if (!item || !item.id || !amount || amount <= 0) {
      show('Invalid purchase parameters', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await purchase(item.id, amount);
      show(`Purchase successful! Transaction: ${result.txHash}`, 'success');
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      show(`Purchase failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = item ? item.price * amount : 0;

  return (
    <BaseDialog onClose={onClose} title="BUY ITEMS">
      <div className="buy-confirm-dialog">
        {item && (
          <>
            <div className="text-center">
              <h3>{item.label || item.name || 'Unknown Item'}</h3>
              <p>Price per item: {item.price} HNY</p>
              <p>Available: {item.count} items</p>
            </div>
            <div className="row">
              <div>Amount to purchase</div>
              <BaseInput
                className="input"
                type="number"
                min="1"
                max={item.count}
                value={amount}
                setValue={(val) => setAmount(Math.max(1, Math.min(parseInt(val) || 1, item.count)))}
              ></BaseInput>
            </div>
            <div className="row">
              <div>Total cost</div>
              <div className="total-cost">
                {totalCost} HNY
              </div>
            </div>
            <BaseDivider></BaseDivider>
            <BaseButton 
              label={loading ? "Processing..." : "Confirm Purchase"} 
              onClick={handleConfirm}
              disabled={loading || !item.listingId}
            ></BaseButton>
          </>
        )}
      </div>
    </BaseDialog>
  );
};

export default BuyConfirmDialog;
