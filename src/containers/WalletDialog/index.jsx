import React from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import BaseButton from "../../components/buttons/BaseButton";
import { formatAddress } from "../../utils/basic";

const WalletDialog = ({onClose}) => {
  const onDisconnect = () => {};
  return (
    <BaseDialog title="WALLET" onClose={onClose}>
      <div className="wallet-dialog">
        <div>Connected Account</div>
        <div className="wallet-address-box">
          <div>
            {formatAddress("0xfD2f2e1D219704960Ba1b0101d38DfE57099f1Ab")}
          </div>
        </div>
        <BaseButton
          className="h-4rem"
          label="Disconnect"
          onClick={() => onDisconnect()}
        ></BaseButton>
      </div>
    </BaseDialog>
  );
};

export default WalletDialog;
