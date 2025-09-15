import React, { useState, useEffect } from 'react';
import './style.css';
import Avatar from './Avatar';
import ProfileButton from '../../../components/buttons/ProfileButton';
import { profileAssets } from '../../../constants/_baseimages';
import ProfileView from './ProfileView';
import { useGameState } from '../../../contexts/GameStateContext';
import { useWeb3 } from '../../../contexts/Web3Context';

const ProfileBar = () => {
  const { balances, formatBalance } = useGameState();
  const { contractService, account } = useWeb3();
  const [lockedYield, setLockedYield] = useState("0.0");
  const [yieldBalance, setYieldBalance] = useState("0.0");

  useEffect(() => {
    const loadBalances = async () => {
      if (balances && contractService && account) {
        try {
          // Get locked yield from Sage contract
          const lockedYieldAmount = await contractService.getLockedGameToken(account);
          
          // Format the balances to show k notation for large numbers
          const formatBalanceForDisplay = (balance) => {
            const formatted = formatBalance(balance);
            const num = parseFloat(formatted);
            if (num >= 1000) {
              return (num / 1000).toFixed(2) + 'k';
            }
            return formatted;
          };

          setLockedYield(formatBalanceForDisplay(lockedYieldAmount.toString()));
          setYieldBalance(formatBalanceForDisplay(balances.yield));
        } catch (error) {
          console.error('Failed to load locked yield:', error);
          // Fallback to staked yield if Sage contract fails
          const formatBalanceForDisplay = (balance) => {
            const formatted = formatBalance(balance);
            const num = parseFloat(formatted);
            if (num >= 1000) {
              return (num / 1000).toFixed(2) + 'k';
            }
            return formatted;
          };
          setLockedYield(formatBalanceForDisplay(balances.stakedYield));
          setYieldBalance(formatBalanceForDisplay(balances.yield));
        }
      }
    };

    loadBalances();
  }, [balances, formatBalance, contractService, account]);

  return (
    <div className="profile-bar">
      <img alt="Profile" src={profileAssets.profileBg} className="profile-background"/>
      <Avatar />
      <ProfileView />
      <ProfileButton icon={<img alt="Settings" src={profileAssets.btnSettings} />} title="Settings" />
      <ProfileButton icon={<img alt="Inventory" src={profileAssets.btnInventory} />} title="Inventory" />
      <ProfileButton icon={<img alt="Tutorial" src={profileAssets.btnTutorial} />} title="Tutorial" />
      <div className="resource-badge">
        <ProfileButton icon={<img alt="Locked Ready Balance" src={profileAssets.btnLockedYield} />} text={lockedYield} title="Locked Ready Balance" />
        <ProfileButton icon={<img alt="Ready Balance" src={profileAssets.btnYield} />} text={yieldBalance} title="Ready Balance" />
      </div>
    </div>
  );
}

export default ProfileBar;


