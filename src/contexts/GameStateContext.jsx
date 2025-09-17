import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWeb3 } from './Web3Context';
import { useContracts } from '../hooks/useContracts';
import { ethers } from 'ethers';

const GameStateContext = createContext();

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

export const GameStateProvider = ({ children }) => {
  const { account, isConnected, provider } = useWeb3();
  const { contracts, isReady } = useContracts();
  
  // Player data state
  const [playerData, setPlayerData] = useState({
    level: 0,
    xp: 0,
    lastAction: 0,
    maxPlots: 0,
    exists: false
  });

  // Token balances state
  const [balances, setBalances] = useState({
    yield: '0',
    stakedYield: '0',
    eth: '0'
  });

  // Item balances state (ERC1155 items)
  const [itemBalances, setItemBalances] = useState({});

  // Farming data state
  const [farmingData, setFarmingData] = useState({
    crops: [],
    maxPlots: 0
  });

  // Loading states
  const [loading, setLoading] = useState({
    playerData: false,
    balances: false,
    items: false,
    farming: false
  });

  // Error states
  const [errors, setErrors] = useState({
    playerData: null,
    balances: null,
    items: null,
    farming: null
  });

  // Load player profile data
  const loadPlayerData = useCallback(async () => {
    if (!isConnected || !account || !contracts.player_store) return;

    setLoading(prev => ({ ...prev, playerData: true }));
    setErrors(prev => ({ ...prev, playerData: null }));

    try {
      const profile = await contracts.player_store.profileOf(account);
      const maxPlots = contracts.farming ? await contracts.farming.getMaxPlots(account) : 0;
      
      setPlayerData({
        level: Number(profile.level),
        xp: Number(profile.xp),
        lastAction: Number(profile.lastAction),
        maxPlots: Number(maxPlots),
        exists: profile.exists
      });
    } catch (err) {
      console.error('Failed to load player data:', err);
      setErrors(prev => ({ ...prev, playerData: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, playerData: false }));
    }
  }, [isConnected, account, contracts.player_store, contracts.farming]);

  // Load token balances
  const loadBalances = useCallback(async () => {
    if (!isConnected || !account || !isReady) return;

    setLoading(prev => ({ ...prev, balances: true }));
    setErrors(prev => ({ ...prev, balances: null }));

    try {
      const balancePromises = [];

      // Load Ready token balance
      if (contracts.yield_token) {
        balancePromises.push(
          contracts.yield_token.balanceOf(account).then(balance => ({
            type: 'yield',
            balance: balance.toString()
          })).catch(err => {
            console.warn('Failed to load yield token balance:', err);
            return { type: 'yield', balance: '0' };
          })
        );
      }

      // Load staked Yield balance
      if (contracts.banker) {
        balancePromises.push(
          contracts.banker.balanceOf(account).then(balance => ({
            type: 'stakedYield',
            balance: balance.toString()
          })).catch(err => {
            console.warn('Failed to load staked yield balance:', err);
            return { type: 'stakedYield', balance: '0' };
          })
        );
      }

      // Load ETH balance
      if (provider) {
        balancePromises.push(
          provider.getBalance(account).then(balance => ({
            type: 'eth',
            balance: balance.toString()
          })).catch(err => {
            console.warn('Failed to load ETH balance:', err);
            return { type: 'eth', balance: '0' };
          })
        );
      }

      if (balancePromises.length === 0) {
        console.warn('No contracts available for balance loading');
        setBalances({ yield: '0', stakedYield: '0', eth: '0' });
        return;
      }

      const results = await Promise.all(balancePromises);
      
      const newBalances = {
        yield: '0',
        stakedYield: '0',
        eth: '0'
      };
      results.forEach(({ type, balance }) => {
        newBalances[type] = balance;
      });

      setBalances(newBalances);
    } catch (err) {
      console.error('Failed to load balances:', err);
      setErrors(prev => ({ ...prev, balances: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, balances: false }));
    }
  }, [isConnected, account, isReady, contracts, provider]);


  // Load farming data
  const loadFarmingData = useCallback(async () => {
    if (!isConnected || !account || !contracts.farming) return;

    setLoading(prev => ({ ...prev, farming: true }));
    setErrors(prev => ({ ...prev, farming: null }));

    try {
      // Check if playerStore is available
      if (!contracts.player_store) {
        console.warn('PlayerStore contract not available, using default farming data');
        setFarmingData({
          crops: [],
          maxPlots: 15 // Default max plots for level 0
        });
        return;
      }

      // Check if user has a profile first
      const [hasProfile] = await contracts.player_store.profileOf(account);
      if (!hasProfile) {
        // User doesn't have a profile, set default farming data
        setFarmingData({
          crops: [],
          maxPlots: 15 // Default max plots for level 0
        });
        return;
      }

      const maxPlots = await contracts.farming.getMaxPlots(account);
      const crops = [];

      for (let i = 0; i < maxPlots; i++) {
        const crop = await contracts.farming.crops(account, i);
        crops.push({
          seedId: crop.seedId.toString(),
          endTime: Number(crop.endTime),
          plotIndex: i
        });
      }

      setFarmingData({
        crops,
        maxPlots: Number(maxPlots)
      });
    } catch (err) {
      console.error('Failed to load farming data:', err);
      setErrors(prev => ({ ...prev, farming: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, farming: false }));
    }
  }, [isConnected, account, contracts.farming, contracts.player_store]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadPlayerData(),
      loadBalances(),
      loadFarmingData()
    ]);
  }, [loadPlayerData, loadBalances, loadFarmingData]);

  // Auto-refresh when account changes
  useEffect(() => {
    if (isConnected && account && isReady) {
      refreshAll();
    } else {
      // Reset state when disconnected
      setPlayerData({
        level: 0,
        xp: 0,
        lastAction: 0,
        maxPlots: 0,
        exists: false
      });
      setBalances({
        yield: '0',
        stakedYield: '0',
        eth: '0'
      });
      setItemBalances({});
      setFarmingData({
        crops: [],
        maxPlots: 0
      });
    }
  }, [isConnected, account, isReady, refreshAll]);

  // Auto-refresh balances every 30 seconds
  useEffect(() => {
    if (!isConnected || !account) return;

    const interval = setInterval(() => {
      loadBalances();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, account, loadBalances]);

  // Helper functions
  const formatBalance = (balance, decimals = 18) => {
    try {
      return ethers.formatUnits(balance, decimals);
    } catch {
      return '0';
    }
  };

  const getItemBalance = (itemId) => {
    return itemBalances[itemId] || '0';
  };

  const isCropReady = (crop) => {
    if (!crop || !crop.endTime) return false;
    return Date.now() / 1000 >= crop.endTime;
  };

  const getReadyCrops = () => {
    return farmingData.crops.filter(isCropReady);
  };

  const getActiveCrops = () => {
    return farmingData.crops.filter(crop => crop && crop.seedId !== '0');
  };

  const value = {
    // State
    playerData,
    balances,
    itemBalances,
    farmingData,
    loading,
    errors,

    // Actions
    refreshAll,
    loadPlayerData,
    loadBalances,
    loadFarmingData,

    // Helpers
    formatBalance,
    getItemBalance,
    isCropReady,
    getReadyCrops,
    getActiveCrops
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
};
