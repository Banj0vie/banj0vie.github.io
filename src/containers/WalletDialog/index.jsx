import React from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import BaseButton from "../../components/buttons/BaseButton";
import { formatAddress } from "../../utils/basic";
import { useAgwEthersAndService } from "../../hooks/useAgwEthersAndService";

const WalletDialog = ({onClose}) => {
  const { account, disconnect } = useAgwEthersAndService();

  const onDisconnect = () => {
    try {
      disconnect();
      onClose();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      onClose();
    }
  };

  return (
    <BaseDialog title="WALLET" onClose={onClose}>
      <div className="wallet-dialog">
        <div>Connected Account</div>
        <div className="wallet-address-box">
          <div>
            {formatAddress(account || "0x0000000000000000000000000000000000000000")}
          </div>
        </div>
        <BaseButton
          className="h-4rem"
          label="Disconnect"
          onClick={onDisconnect}
        ></BaseButton>
      </div>
    </BaseDialog>
  );
};

export default WalletDialog;
