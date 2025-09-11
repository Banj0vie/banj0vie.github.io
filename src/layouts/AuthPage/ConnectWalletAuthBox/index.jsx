import React from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";

const ConnectWalletAuthBox = ({ onWalletConnect }) => {
  return (
    <div>
      <div>Welcome to !</div>
      <p className="highlight">A farming & adventuring game on Blast.</p>
      <BaseButton
        label="Connect Wallet"
        className="h-4rem auth-wallet-connect-button"
        onClick={onWalletConnect}
      ></BaseButton>
    </div>
  );
};

export default ConnectWalletAuthBox;
