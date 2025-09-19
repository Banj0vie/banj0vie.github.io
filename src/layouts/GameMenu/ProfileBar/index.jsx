import React, { useState, useEffect } from "react";
import "./style.css";
import Avatar from "./Avatar";
import ProfileButton from "../../../components/buttons/ProfileButton";
import { profileAssets } from "../../../constants/_baseimages";
import ProfileView from "./ProfileView";
import { useGameState } from "../../../contexts/GameStateContext";
import { useAgwEthersAndService } from "../../../hooks/useAgwEthersAndService";
import { formatNumber } from "../../../utils/basic";

const ProfileBar = () => {
  const { balances, formatBalance } = useGameState();
  const { contractService, account } = useAgwEthersAndService();
  const [lockedReady, setLockedReady] = useState("0.0");
  const [readyBalance, setReadyBalance] = useState("0.0");

  useEffect(() => {
    const loadBalances = async () => {
      if (balances && contractService && account) {
        try {
          // Get locked ready from Sage contract
          const lockedReadyAmount = await contractService.getLockedGameToken(
            account
          );

          // Format the balances to show k notation for large numbers
          const formatBalanceForDisplay = (balance) => {
            const formatted = formatBalance(balance);
            return formatNumber(formatted);
          };

          setLockedReady(formatBalanceForDisplay(lockedReadyAmount.toString()));
          setReadyBalance(formatBalanceForDisplay(balances.yield));
        } catch (error) {
          console.error("Failed to load locked ready:", error);
          // Fallback to staked yield if Sage contract fails
          const formatBalanceForDisplay = (balance) => {
            const formatted = formatBalance(balance);
            const num = parseFloat(formatted);
            if (num >= 1000) {
              return (num / 1000).toFixed(2) + "k";
            }
            return formatted;
          };
          setLockedReady(formatBalanceForDisplay(balances.stakedYield));
          setReadyBalance(formatBalanceForDisplay(balances.yield));
        }
      }
    };

    loadBalances();
  }, [balances, formatBalance, contractService, account]);

  return (
    <div className="profile-bar">
      <img
        alt="Profile"
        src={profileAssets.profileBg}
        className="profile-background"
      />
      <Avatar />
      <ProfileView />
      <ProfileButton
        icon={<img alt="Settings" src={profileAssets.btnSettings} />}
        title="Settings"
      />
      <ProfileButton
        icon={<img alt="Inventory" src={profileAssets.btnInventory} />}
        title="Inventory"
      />
      <ProfileButton
        icon={<img alt="Tutorial" src={profileAssets.btnTutorial} />}
        title="Tutorial"
      />
      <div className="resource-badge">
        <ProfileButton
          icon={
            <img
              alt="Locked Ready Balance"
              src={profileAssets.btnLockedReady}
            />
          }
          text={lockedReady}
          title="Locked Ready Balance"
        />
        <ProfileButton
          icon={<img alt="Ready Balance" src={profileAssets.btnReady} />}
          text={readyBalance}
          title="Ready Balance"
        />
      </div>
    </div>
  );
};

export default ProfileBar;
