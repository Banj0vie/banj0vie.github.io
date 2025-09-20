import React, { useState, useEffect } from "react";
import "./style.css";
import Avatar from "./Avatar";
import ProfileButton from "../../../components/buttons/ProfileButton";
import { profileAssets } from "../../../constants/_baseimages";
import ProfileView from "./ProfileView";
import { useProfile } from "../../../contexts/ProfileContext";
import { useGameState } from "../../../contexts/GameStateContext";
import { useAgwEthersAndService } from "../../../hooks/useAgwEthersAndService";
import { formatNumber } from "../../../utils/basic";

const ProfileBar = () => {
  const { balances, formatBalance } = useGameState();
  const { contractService, account } = useAgwEthersAndService();
  
  // Persistent local state for instant display
  const [lockedReady, setLockedReady] = useState("0.00");
  const [readyBalance, setReadyBalance] = useState("0.00");

  // Format balance helper
  const formatBalanceForDisplay = (balance) => {
    if (!balance) return "0.00";
    const formatted = formatBalance(balance);
    return formatNumber(formatted);
  };

  // Update ready balance whenever GameState balances change
  useEffect(() => {
    if (balances?.yield) {
      const formatted = formatBalanceForDisplay(balances.yield);
      setReadyBalance(formatted);
    }
  }, [balances?.yield, formatBalance]);

  // Load locked ready balance and update when needed
  useEffect(() => {
    const loadLockedReady = async () => {
      if (contractService && account) {
        try {
          const lockedReadyAmount = await contractService.getLockedGameToken(account);
          const formatted = formatBalanceForDisplay(lockedReadyAmount.toString());
          setLockedReady(formatted);
        } catch (error) {
          console.error("Failed to load locked ready:", error);
          // Fallback to staked yield if Sage contract fails
          if (balances?.stakedYield) {
            const formatted = formatBalanceForDisplay(balances.stakedYield);
            setLockedReady(formatted);
          }
        }
      }
    };

    loadLockedReady();
  }, [contractService, account, balances?.stakedYield, formatBalance]);

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
