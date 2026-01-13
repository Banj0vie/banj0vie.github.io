import React from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";
import { useSolanaWallet } from "../../../hooks/useSolanaWallet";
import CardView from "../../../components/boxes/CardView";

const ConnectWalletAuthBox = () => {
  const { account, isConnected, isConnecting, hasProfile, error, connect } =
    useSolanaWallet();

  // If connected and profile status is unknown, show "Connecting..." while checking
  if (isConnected && account && hasProfile === null) {
    return (
      <div>
        <CardView className="auth-welcome-card">
          <div>Welcome to Solana Valley!</div>
          <p className="highlight text-center">A farming adventuring<br/> game on Solana.</p>
        </CardView>
        <BaseButton
          label="Connecting..."
          className="h-4rem auth-wallet-connect-button"
          disabled={true}
        ></BaseButton>
      </div>
    );
  }

  // If connected and has profile, show continue button
  if (isConnected && account && hasProfile === true) {
    return (
      <div>
        <CardView className="auth-welcome-card">
          <div>Welcome to Solana Valley!</div>
          <p className="highlight text-center">A farming adventuring<br/> game on Solana.</p>
        </CardView>
        <BaseButton
          label="Continue to Profile"
          className="h-4rem auth-wallet-connect-button"
        ></BaseButton>
      </div>
    );
  }

  return (
    <div>
      <CardView className="auth-welcome-card">
        <div>Welcome to Solana Valley!</div>
        <p className="highlight text-center">A farming adventuring<br/> game on Solana.</p>
        {error && (
          <div style={{ color: "red", margin: "10px 0", fontSize: "14px" }}>
            {error}
          </div>
        )}
      </CardView>
      <BaseButton
        label={isConnecting ? "Connecting..." : "Connect Wallet"}
        className="h-4rem auth-wallet-connect-button"
        onClick={connect}
        disabled={isConnecting}
      ></BaseButton>
    </div>
  );
};

export default ConnectWalletAuthBox;
