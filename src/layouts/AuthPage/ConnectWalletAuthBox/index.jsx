import React from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";
import { useAgwEthersAndService } from "../../../hooks/useAgwEthersAndService";
import { useLoginWithAbstract } from "@abstract-foundation/agw-react";

const ConnectWalletAuthBox = () => {
  const { account, isConnected, isConnecting, error, connect } = useAgwEthersAndService();
  const { login } = useLoginWithAbstract();

  if (isConnected && account) {
    return (
      <div>
        <div>Welcome to Abstract Valley!</div>
        <p className="highlight">A farming & adventuring game on Abstract.</p>
        <BaseButton
          label="Continue to Profile"
          className="h-4rem auth-wallet-connect-button"
        ></BaseButton>
      </div>
    );
  }

  return (
    <div>
      <div>Welcome to Abstract Valley!</div>
      <p className="highlight">A farming & adventuring game on Abstract.</p>
      {error && (
        <div style={{color: 'red', margin: '10px 0', fontSize: '14px'}}>
          {error}
        </div>
      )}
      <BaseButton
        label={isConnecting ? "Connecting..." : "Connect Wallet"}
        className="h-4rem auth-wallet-connect-button"
        onClick={login}
        disabled={isConnecting}
      ></BaseButton>
    </div>
  );
};

export default ConnectWalletAuthBox;
