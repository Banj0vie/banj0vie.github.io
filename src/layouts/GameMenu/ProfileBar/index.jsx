import React, { useState, useEffect, useCallback } from "react";
import "./style.css";
import Avatar from "./Avatar";
import ProfileButton from "../../../components/buttons/ProfileButton";
import { profileAssets } from "../../../constants/_baseimages";
import ProfileView from "./ProfileView";
import { useGameState } from "../../../contexts/GameStateContext";
import { useAgwEthersAndService } from "../../../hooks/useContractBase";
import { useNotification } from "../../../contexts/NotificationContext";
import { formatNumber } from "../../../utils/basic";
import { handleContractError } from "../../../utils/errorHandler";
import InventoryDialog from "../../../containers/Menu_Inventory";
import SettingsDialog from "../../../containers/Menu_Settings";

const ProfileBar = ({ isFarmMenu }) => {
  const { balances, formatBalance } = useGameState();
  const { contractService, account } = useAgwEthersAndService();
  const { show } = useNotification();
  
  const [isInventoryDialog, setIsInventoryDialog] = useState(false);
  const [isSettingsDialog, setIsSettingsDialog] = useState(false);

  // Persistent local state for instant display
  const [lockedHoney, setLockedHoney] = useState("0.00");
  const [honeyBalance, setHoneyBalance] = useState("0.00");

  // Format balance helper
  const formatBalanceForDisplay = useCallback((balance) => {
    if (!balance) return "0.00";
    const formatted = formatBalance(balance);
    return formatNumber(formatted);
  }, [formatBalance]);

  // Update honey balance whenever GameState balances change
  useEffect(() => {
    if (balances?.yield) {
      const formatted = formatBalanceForDisplay(balances.yield);
      setHoneyBalance(formatted);
    }
  }, [balances?.yield, formatBalance, formatBalanceForDisplay]);

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
          const { message } = handleContractError(error, 'loading locked ready');
          console.error("Failed to load locked ready:", message);
          // Fallback to staked yield if Sage contract fails
          if (balances?.stakedYield) {
            const formatted = formatBalanceForDisplay(balances.stakedYield);
            setLockedHoney(formatted);
          }
        }
      }
    };

    loadlockedHoney();
  }, [contractService, account, balances?.stakedYield, formatBalance, formatBalanceForDisplay]);

  return (
    <div className="profile-bar" style={{ display: isFarmMenu ? 'none' : 'flex' }}>
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
      {/* <ProfileButton
        icon={<img alt="Tutorial" src={profileAssets.btnTutorial} />}
        title="Tutorial"
      /> */}
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
