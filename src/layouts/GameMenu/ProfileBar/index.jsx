import React, { useState, useEffect } from "react";
import "./style.css";
import Avatar from "./Avatar";
import ProfileButton from "../../../components/buttons/ProfileButton";
import { profileAssets } from "../../../constants/_baseimages";
import ProfileView from "./ProfileView";
import { useGameState } from "../../../contexts/GameStateContext";
import { useAgwEthersAndService } from "../../../hooks/useAgwEthersAndService";
import { formatNumber } from "../../../utils/basic";
import InventoryDialog from "../../../containers/Menu_Inventory";
import SettingsDialog from "../../../containers/Menu_Settings";

const ProfileBar = () => {
  const { balances, formatBalance } = useGameState();
  const { contractService, account } = useAgwEthersAndService();
  const [isInventoryDialog, setIsInventoryDialog] = useState(false);
  const [isSettingsDialog, setIsSettingsDialog] = useState(false);

  // Persistent local state for instant display
  const [lockedHoney, setLockedHoney] = useState("0.00");
  const [honeyBalance, setHoneyBalance] = useState("0.00");

  // Format balance helper
  const formatBalanceForDisplay = (balance) => {
    if (!balance) return "0.00";
    const formatted = formatBalance(balance);
    return formatNumber(formatted);
  };

  // Update honey balance whenever GameState balances change
  useEffect(() => {
    if (balances?.yield) {
      const formatted = formatBalanceForDisplay(balances.yield);
      setHoneyBalance(formatted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balances?.yield, formatBalance]);

  // Load locked honey balance and update when needed
  useEffect(() => {
    const loadlockedHoney = async () => {
      if (contractService && account) {
        try {
          const lockedHoneyAmount = await contractService.getLockedGameToken(
            account
          );
          const formatted = formatBalanceForDisplay(
            lockedHoneyAmount.toString()
          );
          setLockedHoney(formatted);
        } catch (error) {
          console.error("Failed to load locked ready:", error);
          // Fallback to staked yield if Sage contract fails
          if (balances?.stakedYield) {
            const formatted = formatBalanceForDisplay(balances.stakedYield);
            setLockedHoney(formatted);
          }
        }
      }
    };

    loadlockedHoney();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        onClick={() => setIsSettingsDialog(true)}
      />
      <ProfileButton
        icon={<img alt="Inventory" src={profileAssets.btnInventory} />}
        title="Inventory"
        onClick={() => setIsInventoryDialog(true)}
      />
      <ProfileButton
        icon={<img alt="Tutorial" src={profileAssets.btnTutorial} />}
        title="Tutorial"
      />
      <div className="resource-badge">
        <ProfileButton
          icon={
            <img
              alt="Locked Honey Balance"
              src={profileAssets.btnLockedHoney}
            />
          }
          text={lockedHoney}
          title="Locked Honey Balance"
        />
        <ProfileButton
          icon={<img alt="Honey Balance" src={profileAssets.btnHoney} />}
          text={honeyBalance}
          title="Honey Balance"
        />
      </div>
      {isInventoryDialog && (
        <InventoryDialog
          onClose={() => setIsInventoryDialog(false)}
        ></InventoryDialog>
      )}
      {isSettingsDialog && (
        <SettingsDialog
          onClose={() => setIsSettingsDialog(false)}
        ></SettingsDialog>
      )}
    </div>
  );
};

export default ProfileBar;
