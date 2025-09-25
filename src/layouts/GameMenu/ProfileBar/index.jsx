import React, { useState, useEffect, useCallback } from "react";
import "./style.css";
import Avatar from "./Avatar";
import ProfileButton from "../../../components/buttons/ProfileButton";
import { profileAssets } from "../../../constants/_baseimages";
import ProfileView from "./ProfileView";
import { useGameState } from "../../../contexts/GameStateContext";
import { useAgwEthersAndService } from "../../../hooks/useContractBase";
import { useProduceSeeder, useEquipmentRegistry } from "../../../hooks/useContracts";
import { useNotification } from "../../../contexts/NotificationContext";
import { formatNumber } from "../../../utils/basic";
import { handleContractError } from "../../../utils/errorHandler";
import InventoryDialog from "../../../containers/Menu_Inventory";
import SettingsDialog from "../../../containers/Menu_Settings";

const ProfileBar = () => {
  const { balances, formatBalance } = useGameState();
  const { contractService, account } = useAgwEthersAndService();
  const { seedAllProduce, produceSeederData } = useProduceSeeder();
  const { randomMint, equipmentRegistryData } = useEquipmentRegistry();
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

  // TEMPORARY: Handler for dummy seed all produce button (REMOVE IN PRODUCTION)
  const handleSeedAllProduce = useCallback(async () => {
    if (!account) {
      show('Please connect your wallet first', 'warning');
      return;
    }

    try {
      show('Seeding all produce items...', 'info');
      const result = await seedAllProduce(100); // Seed 10 of each item
      
      if (result) {
        show('Successfully seeded all produce items!', 'success');
      } else {
        show('Failed to seed produce items', 'error');
      }
    } catch (error) {
      console.error('Failed to seed produce:', error);
      show(`Failed to seed produce: ${error.message}`, 'error');
    }
  }, [account, seedAllProduce, show]);

  // TEMPORARY: Handler for dummy random mint button (REMOVE IN PRODUCTION)
  const handleRandomMint = useCallback(async () => {
    if (!account) {
      show('Please connect your wallet first', 'warning');
      return;
    }

    try {
      show('Minting BoostNFT...', 'info');
      
      // Then try to mint
      const result = await randomMint();
      console.log(result);
      if (result) {
        show(`Successfully minted BoostNFT!`, 'success');
      } else {
        show('Failed to mint BoostNFT', 'error');
      }
    } catch (error) {
      console.error('Failed to random mint:', error);
      if (error.message.includes('disabled')) {
        show('Random minting is disabled. Please enable it first or check contract configuration.', 'error');
      } else if (error.message.includes('AccessControl') || error.message.includes('MINTER_ROLE')) {
        show('EquipmentRegistry needs MINTER_ROLE on BoostNFT. Please grant the role first.', 'error');
      } else {
        show(`Failed to random mint: ${error.message}`, 'error');
      }
    }
  }, [account, randomMint, show]);

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
      {/* <ProfileButton
        icon={<img alt="Tutorial" src={profileAssets.btnTutorial} />}
        title="Tutorial"
      /> */}
      {/* TEMPORARY: Dummy button for seeding all produce (REMOVE IN PRODUCTION) */}
      <ProfileButton
        style={{ display: 'none' }}
        icon={<span style={{ color: '#ff6b6b', fontSize: '16px', fontWeight: 'bold' }}>🌱</span>}
        title="Seed All Produce (DEV)"
        onClick={handleSeedAllProduce}
        disabled={produceSeederData.loading}
      />
      <ProfileButton
        style={{ display: 'none' }}
        icon={<span style={{ color: '#ff6b6b', fontSize: '16px', fontWeight: 'bold' }}>🎭</span>}
        title="Random Mint NFT (DEV)"
        onClick={handleRandomMint}
        disabled={equipmentRegistryData.loading}
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
