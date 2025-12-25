import React from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import BaseButton from "../../components/buttons/BaseButton";
import { formatAddress } from "../../utils/basic";
import { useSolanaWallet } from '../../hooks/useSolanaWallet';
import { handleContractError } from "../../utils/errorHandler";

const WalletDialog = ({onClose}) => {
  const { account, disconnect } = useSolanaWallet();

  const onDisconnect = () => {
    try {
      disconnect();
      onClose();
    } catch (error) {
      const { message } = handleContractError(error, 'disconnecting wallet');
      console.error('Failed to disconnect wallet:', message);
      onClose();
    }
  };

  return (
    <BaseDialog title="WALLET" onClose={onClose} header="/images/dialog/modal-header-wallet.png">
      <div className="wallet-dialog text-center">
        <div>Connected Account</div>
        <div className="wallet-address-box">
          <div>
            {formatAddress(account || "0x0000000000000000000000000000000000000000")}
          </div>
        </div>
        <BaseButton
          className="w-fit mx-auto h-4.5rem"
          label="Disconnect"
          onClick={onDisconnect}
          small={true}
        ></BaseButton>
      </div>
    </BaseDialog>
  );
};

export default WalletDialog;
