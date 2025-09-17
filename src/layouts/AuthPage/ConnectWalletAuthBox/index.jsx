import React from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";
import { useWeb3 } from "../../../contexts/Web3Context";

const ConnectWalletAuthBox = () => {
  const { 
    account, 
    isConnected, 
    isConnecting, 
    error, 
    connect
  } = useWeb3();
  const handleConnect = async () => {
    try {
      const connectedAccount = await connect();
      console.log(connectedAccount);
    } catch (err) {
      console.error('Wallet connection failed:', err);
    }
  };

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
        onClick={handleConnect}
        disabled={isConnecting}
      ></BaseButton>
    </div>
  );
};

export default ConnectWalletAuthBox;
