import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAgwEthersAndService } from '../hooks/useContractBase';
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
  const { account, isConnected, contractService } = useAgwEthersAndService();
  
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

  // Potion usage state
  const [potionUsageState, setPotionUsageState] = useState({
    isActive: false,
    potionId: null,
    potionName: null
  });

  // Loading states
  const [loading, setLoading] = useState({
    playerData: false,
    balances: false,
    items: false,
    farming: false
  });

  // Potion usage functions
  const triggerPotionUsage = useCallback((potionId, potionName) => {
    setPotionUsageState({
      isActive: true,
      potionId,
      potionName
    });
  }, []);

  const clearPotionUsage = useCallback(() => {
    setPotionUsageState({
      isActive: false,
      potionId: null,
      potionName: null
    });
  }, []);

  // Error states
  const [errors, setErrors] = useState({
    playerData: null,
    balances: null,
    items: null,
    farming: null
  });

  // Load player profile data
  const loadPlayerData = useCallback(async () => {
    if (!isConnected || !account || !contractService) return;

    setLoading(prev => ({ ...prev, playerData: true }));
    setErrors(prev => ({ ...prev, playerData: null }));

    try {
      const profile = await contractService.getProfile(account);
      const maxPlots = await contractService.getMaxPlots(account);
      
      setPlayerData({
        level: Number(profile.level),
        xp: Number(profile.xp),
        lastAction: Number(profile.nextChestAt), // Use nextChestAt as lastAction
        maxPlots: Number(maxPlots),
        exists: profile.exists
      });
    } catch (err) {
      setErrors(prev => ({ ...prev, playerData: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, playerData: false }));
    }
  }, [isConnected, account, contractService]);

  // Load token balances
  const loadBalances = useCallback(async () => {
    if (!isConnected || !account || !contractService) return;

    setLoading(prev => ({ ...prev, balances: true }));
    setErrors(prev => ({ ...prev, balances: null }));

    try {
      const balancePromises = [];

      // Load Honey token balance
      if (contractService) {
        balancePromises.push(
          contractService.getYieldBalance(account).then(balance => ({
            type: 'yield',
            balance: balance.toString()
          })).catch(err => {
            return { type: 'yield', balance: '0' };
          })
        );
      }

      // Load staked Yield balance
      if (contractService) {
        balancePromises.push(
          contractService.getStakedBalance(account).then(balance => ({
            type: 'stakedYield',
            balance: balance.toString()
          })).catch(() => {
            return { type: 'stakedYield', balance: '0' };
          })
        );
      }

      // Load ETH balance
      if (contractService) {
        balancePromises.push(
          contractService.getEthBalance(account).then(balance => ({
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
  }, [isConnected, account, contractService]);


  // Load farming data
  const loadFarmingData = useCallback(async () => {
    if (!isConnected || !account || !contractService) return;

    setLoading(prev => ({ ...prev, farming: true }));
    setErrors(prev => ({ ...prev, farming: null }));

    try {
      // Check if playerStore is available
      if (!contractService) {
        console.warn('PlayerStore contract not available, using default farming data');
        setFarmingData({
          crops: [],
          maxPlots: 15 // Default max plots for level 0
        });
        return;
      }

      // Check if user has a profile first
      const profile = await contractService.getProfile(account);
      if (!profile.exists) {
        // User doesn't have a profile, set default farming data
        setFarmingData({
          crops: [],
          maxPlots: 15 // Default max plots for level 0
        });
        return;
      }

      const maxPlots = await contractService.getMaxPlots(account);
      const crops = [];

      for (let i = 0; i < maxPlots; i++) {
        const crop = await contractService.getCrops(account, i);
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
      setErrors(prev => ({ ...prev, farming: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, farming: false }));
    }
  }, [isConnected, account, contractService]);

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
    if (isConnected && account && contractService) {
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
  }, [isConnected, account, contractService, refreshAll]);

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
    potionUsageState,
    loading,
    errors,

    // Actions
    refreshAll,
    loadPlayerData,
    loadBalances,
    loadFarmingData,
    triggerPotionUsage,
    clearPotionUsage,

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
