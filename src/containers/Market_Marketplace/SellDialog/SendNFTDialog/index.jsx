import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../../../_BaseDialog";
import BaseInput from "../../../../components/inputs/BaseInput";
import Slider from "../../../../components/inputs/Slider";
import BaseButton from "../../../../components/buttons/BaseButton";
import { useP2PMarket } from "../../../../hooks/useContracts";
import { useNotification } from "../../../../contexts/NotificationContext";

const SendNFTDialog = ({ onClose, onSendSuccess, item }) => {
  const [count, setCount] = useState(1);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { send } = useP2PMarket();
  const { show } = useNotification();

  const handleSend = async () => {
    if (!item || !item.id || !count || count <= 0 || !address) {
      show('Please enter valid recipient address and amount', 'error');
      return;
    }

    if (count > item.count) {
      show('Amount cannot exceed your available items', 'error');
      return;
    }

    // Basic address validation
    if (!address.startsWith('0x') || address.length !== 42) {
      show('Please enter a valid Ethereum address', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await send(item.id, address, count);
      show(`Items sent successfully! Transaction: ${result.txHash}`, 'success');
      if (onSendSuccess) {
        onSendSuccess();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Send failed:', error);
      show(`Send failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <BaseDialog onClose={onClose} title="SEND NFT">
      <div className="send-nft-dialog">
        {item && (
          <>
            <div className="text-center">
              <h3>{item.label || item.name || 'Unknown Item'}</h3>
              <p>Available: {item.count} items</p>
            </div>
            <div className="row">
              <div>Recipient Address</div>
              <BaseInput
                className="input"
                placeholder="0x..."
                value={address}
                maxLength={42}
                setValue={(val) => setAddress(val)}
              ></BaseInput>
            </div>
            <div className="row">
              <div>Amount to send</div>
              <div className="slider">
                <Slider
                  min="1"
                  max={item.count}
                  value={count}
                  setValue={(val) => setCount(val)}
                ></Slider>
              </div>
            </div>
            <div className="count-label">SEND x {count}</div>
            <BaseButton 
              label={loading ? "Sending..." : "Send Items"} 
              onClick={handleSend}
              disabled={loading || !address || !count}
            ></BaseButton>
          </>
        )}
      </div>
    </BaseDialog>
  );
};

export default SendNFTDialog;
