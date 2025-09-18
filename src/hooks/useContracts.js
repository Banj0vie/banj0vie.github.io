/* global BigInt */
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, SAGE_UNLOCK_RATES, SAGE_UNLOCK_COOLDOWN } from '../config/contracts';

export const useContracts = () => {
  const { provider, signer, isConnected, contractService } = useWeb3();
  const [contracts, setContracts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize contracts when provider/signer changes
  useEffect(() => {
    if (provider && signer && isConnected) {
      const initializeContracts = async () => {
        setLoading(true);
        setError(null);

        try {
          
          // Get contract addresses for current network
          const addresses = CONTRACT_ADDRESSES.ABSTRACT_TESTNET; // Default to testnet
          
          const contractInstances = {};
          
          // Initialize each contract
          Object.keys(CONTRACT_ABIS).forEach(contractName => {
            const address = addresses[contractName.toUpperCase()];
            if (address && address !== "0x0000000000000000000000000000000000000000") {
              const contract = new ethers.Contract(address, CONTRACT_ABIS[contractName], signer);
              // Map contract names to lowercase for consistent access
              contractInstances[contractName.toLowerCase()] = contract;
            } else {
              console.warn(`Skipping ${contractName}: no address or zero address`);
            }
          });

          // Add contract service to the contracts object
          if (contractService) {
            contractInstances.contractService = contractService;
          }

          // Debug: Log which contracts were initialized
          console.log('Initialized contracts:', Object.keys(contractInstances));

          setContracts(contractInstances);
        } catch (err) {
          console.error('Failed to initialize contracts:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      initializeContracts();
    } else {
      setContracts({});
    }
  }, [provider, signer, isConnected, contractService]);

  return {
    contracts,
    loading,
    error,
    isReady: Object.keys(contracts).length > 0 && isConnected
  };
};

// Hook for Vendor contract interactions
export const useVendor = () => {
  const { contracts } = useContracts();
  const { account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buySeedPack = useCallback(async (tier, count) => {
    if (!contracts.vendor || !contracts.yield_token) {
      console.log('Vendor or Yield token contract not available');
      setError('Vendor or Yield token contract not available');
      return null;
    }

    if (!account) {
      console.log('Wallet not connected');
      setError('Wallet not connected');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Check user's Yield token balance first
      const balance = await contracts.yield_token.balanceOf(account);
      
      // 2. Get the pack price and calculate total cost
      const packPrice = await contracts.vendor.packPrice(tier);
      const totalCost = (parseInt(packPrice.toString()) * count).toString();
      
      // 3. Check if user has enough balance
      if (parseInt(balance.toString()) < parseInt(totalCost)) {
        setError(`Insufficient Yield balance. Need ${totalCost}, have ${balance.toString()}`);
        return null;
      }
      
      // 4. Now buy the seed pack
      const tx = await contracts.vendor.buySeedPack(tier, count);
      const receipt = await tx.wait();
      // Find the SeedPack event
      const event = receipt.logs.find(log => {
        try {
          const parsed = contracts.vendor.interface.parseLog(log);
          return parsed.name === 'SeedPack';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contracts.vendor.interface.parseLog(event);
        const requestId = parsed.args.requestId;
        
        // Return the request info but don't automatically fulfill
        // The user will need to click the Reveal button to fulfill the request
        return {
          requestId: requestId,
          player: parsed.args.player,
          tier: parsed.args.tier,
          isPending: true
        };
      }

      return { requestId: null, player: null, tier, isPending: false };
    } catch (err) {
      console.error('Failed to buy seed pack:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [contracts, account]);

  const getPackPrice = useCallback(async (tier) => {
    if (!contracts.vendor) return null;

    try {
      const price = await contracts.vendor.packPrice(tier);
      return price.toString();
    } catch (err) {
      console.error('Failed to get pack price:', err);
      return null;
    }
  }, [contracts.vendor]);

  const checkPendingRequests = useCallback(async () => {
    if (!contracts.vendor || !account) {
      return false;
    }
    try {
      const hasPending = await contracts.vendor.hasPendingRequests(account);
      return hasPending;
    } catch (err) {
      console.error('Failed to check pending requests:', err);
      return false;
    }
  }, [contracts.vendor, account]);

  const getAllPendingRequests = useCallback(async () => {
    if (!contracts.vendor || !account) {
      return [];
    }

    try {
      // Try the new getAllPendingRequests function first
      const [requestIds, tiers, counts] = await contracts.vendor.getAllPendingRequests(account);
      const pendingRequests = [];
      
      for (let i = 0; i < requestIds.length; i++) {
        pendingRequests.push({
          requestId: requestIds[i].toString(),
          tier: tiers[i],
          count: counts[i].toString()
        });
      }
      
      return pendingRequests;
    } catch (err) {
      console.log('getAllPendingRequests not available, falling back to getPendingRequest');
      
      // Fallback to getPendingRequest for backward compatibility
      try {
        const [requestId, tier, count] = await contracts.vendor.getPendingRequest(account);
        if (requestId.toString() === '0') {
          return [];
        }
        
        return [{
          requestId: requestId.toString(),
          tier: tier,
          count: count.toString()
        }];
      } catch (fallbackErr) {
        console.error('Failed to get pending requests (both methods):', fallbackErr);
        return [];
      }
    }
  }, [contracts.vendor, account]);

  const getPendingRequest = useCallback(async () => {
    if (!contracts.vendor || !account) {
      return null;
    }

    try {
      const [requestId, tier, count] = await contracts.vendor.getPendingRequest(account);
      if (requestId.toString() === '0') {
        return null;
      }
      return {
        requestId: requestId.toString(),
        tier: tier,
        count: count.toString()
      };
    } catch (err) {
      console.error('Failed to get pending request:', err);
      return null;
    }
  }, [contracts.vendor, account]);

  const fulfillPendingRequest = useCallback(async (requestId) => {
    if (!contracts.rng_hub) {
      setError('RNG Hub contract not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const randomNumber = Math.floor(Math.random() * 100000);
      const tx = await contracts.rng_hub.fulfillRequest(requestId, randomNumber);
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      console.error('Failed to fulfill pending request:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [contracts.rng_hub]);

  const listenForSeedsRevealed = useCallback(async (requestId, onSeedsRevealed, fromBlock) => {
    if (!contracts || !contracts.vendor) {
      console.error('Contracts or Vendor contract not available');
      return;
    }
    try {
      // Check if the contract actually has the SeedsRevealed event
      if (!contracts.vendor.filters?.SeedsRevealed) {
        console.error('Contract does not have SeedsRevealed event filter!');
        return null;
      }
      
      // Use the provided fromBlock (from the fulfill transaction)
      const startBlock = fromBlock || 0;
      
      // Listen for the SeedsRevealed event - only filter by player (indexed parameter)
      // requestId is not indexed, so we'll filter it in the event handler
      const filter = contracts.vendor.filters.SeedsRevealed(account, null, null, null, null);
      
      const handleEvent = (event) => {
        const parsed = contracts.vendor.interface.parseLog(event);
        const eventRequestId = parsed.args.requestId.toString();
        const seedIds = parsed.args.seedIds.map(id => id.toString());
        const tier = parsed.args.tier;
        const count = parsed.args.count.toString();
        
        // Only process if this is the request we're waiting for
        if (eventRequestId === requestId.toString()) {
          if (onSeedsRevealed) {
            onSeedsRevealed({ requestId: eventRequestId, seedIds, tier, count });
          }
        }
      };

      // Use queryFilter to get events from the fulfill transaction block
      const queryEvents = async () => {
        try {
          const events = await contracts.vendor.queryFilter(filter, startBlock, 'latest');
          for (const event of events) {
            handleEvent(event);
          }
        } catch (err) {
          console.error('Error querying events:', err);
        }
      };
      
      // Set up real-time listener
      contracts.vendor.on(filter, handleEvent);
      
      // Also query for any events that might have already happened
      queryEvents();
      
      // Return cleanup function
      return () => {
        contracts.vendor.off(filter, handleEvent);
      };
    } catch (err) {
      console.error('Failed to set up SeedsRevealed listener:', err);
    }
  }, [contracts, account]);

  return {
    buySeedPack,
    getPackPrice,
    checkPendingRequests,
    getAllPendingRequests,
    getPendingRequest,
    fulfillPendingRequest,
    listenForSeedsRevealed,
    loading,
    error
  };
};

// Hook for Farming contract interactions
export const useFarming = (contracts) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const plant = useCallback(async (seedId, plotNumber) => {
    if (!contracts || !contracts.contractService) {
      console.error('Contract service not available');
      setError('Contract service not available');
      return null;
    }

    console.log('Planting seed:', seedId, 'at plot:', plotNumber);
    setLoading(true);
    setError(null);

    try {
      const tx = await contracts.contractService.plantSeed(seedId, plotNumber);
      console.log('Plant successful!');
      return tx;
    } catch (err) {
      console.error('Failed to plant seed:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [contracts]);

  const plantBatch = useCallback(async (seedIds, plotNumbers) => {
    if (!contracts || !contracts.contractService) {
      console.error('Contract service not available');
      setError('Contract service not available');
      return null;
    }

    console.log('Planting batch - seedIds:', seedIds, 'plotNumbers:', plotNumbers);
    setLoading(true);
    setError(null);

    try {
      const tx = await contracts.contractService.plantSeedsBatch(seedIds, plotNumbers);
      console.log('Plant batch successful!');
      return tx;
    } catch (err) {
      console.error('Failed to plant seeds batch:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [contracts]);

  const harvest = useCallback(async (slot) => {
    if (!contracts || !contracts.farming) {
      setError('Farming contract not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const tx = await contracts.farming.harvest(slot);
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      console.error('Failed to harvest:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [contracts]);

  const harvestMany = useCallback(async (slots) => {
    if (!contracts || !contracts.contractService) {
      setError('Contract service not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const tx = await contracts.contractService.harvestMany(slots);
      console.log('Harvest many successful!');
      return tx;
    } catch (err) {
      console.error('Failed to harvest many:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [contracts]);

  const harvestAll = useCallback(async () => {
    if (!contracts) {
      setError('Contracts not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      if (contracts.contractService && typeof contracts.contractService.harvestAll === 'function') {
        const tx = await contracts.contractService.harvestAll();
        console.log('Harvest all via service successful!');
        return tx;
      }
      if (contracts.farming) {
        const tx = await contracts.farming.harvestAll();
        const receipt = await tx.wait();
        return receipt;
      }
      setError('Farming contract not available');
      return null;
    } catch (err) {
      console.error('Failed to harvest all:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [contracts]);

  const getUserCrops = useCallback(async (userAddress) => {
    if (!contracts || !contracts.contractService) {
      setError('Contract service not available');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Getting user crops for address:', userAddress);
      
      const crops = await contracts.contractService.getUserCrops(userAddress);
      console.log('Got user crops from contract service:', crops);
      
      // Convert crops to the expected format (seedId as BigInt, endTime as Number)
      const formattedCrops = crops.map((crop, index) => {
        const seedIdBig = BigInt(crop.seedId);
        const endTimeNum = Number(crop.endTime);
        return ({
          plotNumber: index,
          seedId: seedIdBig,
          endTime: endTimeNum,
          isReady: seedIdBig !== 0n && endTimeNum <= Math.floor(Date.now() / 1000)
        });
      });

      console.log('Formatted crops:', formattedCrops);
      return formattedCrops;
    } catch (err) {
      console.error('Failed to get user crops:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contracts]);

  const getMaxPlots = useCallback(async (userAddress) => {
    if (!contracts || !contracts.contractService) {
      console.error('Contract service not available');
      return 0;
    }

    try {
      const maxPlots = await contracts.contractService.getMaxPlots(userAddress);
      return Number(maxPlots);
    } catch (err) {
      console.error('Failed to get max plots:', err);
      return 0;
    }
  }, [contracts]);

  const getCrop = useCallback(async (userAddress, plotIndex) => {
    if (!contracts.farming) return null;

    try {
      const crop = await contracts.farming.crops(userAddress, plotIndex);
      return {
        seedId: crop.seedId.toString(),
        endTime: Number(crop.endTime)
      };
    } catch (err) {
      console.error('Failed to get crop:', err);
      return null;
    }
  }, [contracts]);

  const getGrowthTime = useCallback(async (seedId) => {
    if (!contracts || !contracts.contractService) return 60; // Default fallback

    try {
      const growthTime = await contracts.contractService.getGrowthTime(seedId);
      return Number(growthTime);
    } catch (err) {
      console.error('Failed to get growth time:', err);
      return 60; // Default fallback
    }
  }, [contracts]);

  return {
    plant,
    plantBatch,
    harvest,
    harvestMany,
    harvestAll,
    getUserCrops,
    getMaxPlots,
    getCrop,
    getGrowthTime,
    loading,
    error
  };
};

// Hook for getting ROI data and farm level
export const useROIData = (contracts) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roiData, setRoiData] = useState({
    commons: 0,
    uncommons: 0,
    rares: 0,
    epics: 0,
    legendaries: 0
  });
  const [farmLevel, setFarmLevel] = useState(0);

  const getROIData = useCallback(async (level = 0) => {
    if (!contracts || !contracts.farming) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Getting ROI data for level:', level);
      
      // Get multipliers using contractService
      if (!contracts.contractService) {
        console.error('Contract service not available');
        setError('Contract service not available');
        return;
      }
      
      const contractService = contracts.contractService;
      const commonMult = Number(contractService.getCommonMultiplier(level));
      const uncommonMult = Number(contractService.getUncommonMultiplier(level));
      const rareMult = Number(contractService.getRareMultiplier(level));
      const epicMult = Number(contractService.getEpicMultiplier(level));
      const legendaryMult = Number(contractService.getLegendaryMultiplier(level));

      console.log('Multipliers:', { commonMult, uncommonMult, rareMult, epicMult, legendaryMult });

      // Base rates from contract constants (in parts per million)
      const baseRates = {
        commons: 273400,    // 27.34%
        uncommons: 437600,  // 43.76%
        rares: 218800,      // 21.88%
        epics: 62600,       // 6.26%
        legendaries: 7600   // 0.76%
      };

      // Calculate adjusted rates with multipliers (multipliers are scaled by 1000)
      const adjustedRates = {
        commons: (baseRates.commons * Number(commonMult)) / 1000000, // Convert to percentage
        uncommons: (baseRates.uncommons * Number(uncommonMult)) / 1000000,
        rares: (baseRates.rares * Number(rareMult)) / 1000000,
        epics: (baseRates.epics * Number(epicMult)) / 1000000,
        legendaries: (baseRates.legendaries * Number(legendaryMult)) / 1000000
      };

      console.log('Adjusted rates:', adjustedRates);
      setRoiData(adjustedRates);
      setFarmLevel(level);
    } catch (err) {
      console.error('Failed to get ROI data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contracts]);

  return {
    roiData,
    farmLevel,
    getROIData,
    loading,
    error
  };
};

// Hook for Banker contract interactions
export const useBanker = () => {
  const { contracts } = useContracts();
  const { account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stake = useCallback(async (amount) => {
    if (!contracts.banker || !contracts.yield_token) {
      setError('Banker or Yield token contract not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      
      if (!account) {
        throw new Error('No account connected');
      }
      
      // Validate amount
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      const userBalance = await contracts.yield_token.balanceOf(account);
      
      if (userBalance < amount) {
        throw new Error(`Insufficient Ready balance. You have ${ethers.formatEther(userBalance)} Ready, trying to stake ${ethers.formatEther(amount)}`);
      }
      const tx = await contracts.banker.stake(amount);
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      console.error('Failed to stake:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [contracts.banker, contracts.yield_token, account]);

  const unstake = useCallback(async (shares) => {
    if (!contracts.banker) {
      setError('Banker contract not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const tx = await contracts.banker.unstake(shares);
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      console.error('Failed to unstake:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [contracts.banker]);

  const getBalance = useCallback(async (userAddress) => {
    if (!contracts.banker) return "0";

    try {
      const balance = await contracts.banker.balanceOf(userAddress);
      return balance.toString();
    } catch (err) {
      return "0";
    }
  }, [contracts.banker]);

  return {
    stake,
    unstake,
    getBalance,
    loading,
    error
  };
};

// Hook for DEX contract interactions
export const useDex = () => {
  const { contracts } = useContracts();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const swapETHForYield = useCallback(async (ethAmount) => {
    if (!contracts.dex) {
      setError('DEX contract not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const tx = await contracts.dex.depositNativeForGameToken(ethAmount);
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      console.error('Failed to swap ETH for YLD:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [contracts.dex]);

  const getYieldAmount = useCallback(async (ethAmount) => {
    if (!contracts.dex) return "0";

    try {
      // Get the actual rate from the MockDex contract
      const ratePerEth = await contracts.dex.RATE_PER_ETH();
      console.log('Rate per ETH from contract:', ratePerEth.toString());
      
      // Calculate yield amount: (ethAmount * ratePerEth) / 1 ether
      const yieldAmount = (ethAmount * ratePerEth) / ethers.parseEther("1");
      console.log('Calculated yield amount:', yieldAmount.toString());
      
      return yieldAmount.toString();
    } catch (err) {
      console.error('Failed to get yield amount:', err);
      return "0";
    }
  }, [contracts.dex]);

  return {
    swapETHForYield,
    getYieldAmount,
    loading,
    error
  };
};

// Hook for Leaderboard data
export const useLeaderboard = (epoch = null) => {
  const { contracts } = useContracts();
  const { account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userScore, setUserScore] = useState(0);
  const [epochStart, setEpochStart] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);

  const fetchLeaderboardData = useCallback(async (targetEpoch = null) => {
    if (!contracts.player_store) {
      return; 
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get current epoch from contract
      const contractCurrentEpoch = await contracts.player_store.gameEpoch();
      const actualCurrentEpoch = Number(contractCurrentEpoch);
      setCurrentEpoch(actualCurrentEpoch);
      
      // Use provided epoch or current epoch
      const epochToFetch = targetEpoch !== null ? targetEpoch : actualCurrentEpoch;
      const targetEpochNumber = Number(epochToFetch);
      
      const leaderboardData = [];
      
      // Check if we're viewing the current epoch (real-time data)
      const isCurrentEpoch = targetEpochNumber === actualCurrentEpoch;
      console.log('Target epoch:', targetEpochNumber, 'Current epoch:', actualCurrentEpoch, 'Is current:', isCurrentEpoch);
      
      // Fetch top 5 players for the specified epoch
      if (isCurrentEpoch) {
        // For current epoch, use top5() and top5Xp() functions
        for (let i = 0; i < 5; i++) {
          try {
            const address = await contracts.player_store.top5(i);
            const xp = await contracts.player_store.top5Xp(i);
            
            if (address !== "0x0000000000000000000000000000000000000000") {
              try {
                // Get profile data for this address
                const username = await contracts.player_store.usernameOf(address);
                leaderboardData.push({
                  rank: i + 1,
                  name: username,
                  address: address,
                  score: parseFloat(xp.toString()) / 1e18
                });
              } catch (err) {
                console.log(`Failed to get profile for address ${address}:`, err);
                // Fallback with empty data
                leaderboardData.push({
                  rank: i + 1,
                  name: "Error",
                  address: address,
                  score: 0.0
                });
              }
            } else {
              leaderboardData.push({
                rank: i + 1,
                name: "Empty",
                address: "0x0000000000000000000000000000000000000000",
                score: 0.0
              });
            }
          } catch (err) {
            console.log(`Failed to get player data for position ${i}:`, err);
            leaderboardData.push({
              rank: i + 1,
              name: "Error",
              address: "0x0000000000000000000000000000000000000000",
              score: 0.0
            });
          }
        }
        } else {
          // For historical epochs, use getEpochTop5() to get all data at once
          try {
            const [top5Players, top5XpAmounts, epochNumber, timestamp] = await contracts.player_store.getEpochTop5(epochToFetch);
            console.log(`getEpochTop5(${epochToFetch}) returned:`, {
              top5Players,
              top5XpAmounts,
              epochNumber: Number(epochNumber),
              timestamp: Number(timestamp),
              targetEpoch: epochToFetch
            });
            
            // Check if we got valid data (epochNumber should match targetEpoch)
            if (Number(epochNumber) === targetEpochNumber && Number(timestamp) > 0) {
            for (let i = 0; i < 5; i++) {
              const address = top5Players[i];
              const xp = top5XpAmounts[i];
              
              if (address !== "0x0000000000000000000000000000000000000000") {
                try {
                  // Get profile data for this address
                  const username = await contracts.player_store.usernameOf(address);
                  leaderboardData.push({
                    rank: i + 1,
                    name: username,
                    address: address,
                    score: parseFloat(xp.toString()) / 1e18
                  });
                } catch (err) {
                  console.log(`Failed to get profile for address ${address}:`, err);
                  // Fallback with empty data
                  leaderboardData.push({
                    rank: i + 1,
                    name: "Error",
                    address: address,
                    score: 0.0
                  });
                }
              } else {
                leaderboardData.push({
                  rank: i + 1,
                  name: "Empty",
                  address: "0x0000000000000000000000000000000000000000",
                  score: 0.0
                });
              }
            }
            } else {
              console.log(`No historical data found for epoch ${epochToFetch}, showing empty data. EpochNumber: ${Number(epochNumber)}, Timestamp: ${Number(timestamp)}`);
              // No historical data available, show empty slots
              for (let i = 0; i < 5; i++) {
                leaderboardData.push({
                  rank: i + 1,
                  name: "Empty",
                  address: "0x0000000000000000000000000000000000000000",
                  score: 0.0
                });
              }
            }
          } catch (err) {
            console.log(`Failed to get epoch ${epochToFetch} data:`, err);
          // Fallback to empty data
          for (let i = 0; i < 5; i++) {
            leaderboardData.push({
              rank: i + 1,
              name: "Empty",
              address: "0x0000000000000000000000000000000000000000",
              score: 0.0
            });
          }
        }
      }

      // Get user's XP if connected (always use current total XP)
      if (account && contracts.player_store) {
        try {
          const userXp = await contracts.player_store.xpOf(account);
          setUserScore(parseFloat(userXp.toString()) / 1e18);
        } catch (err) {
          console.log('Could not fetch user XP:', err);
          setUserScore(0);
        }
      }

      // Get epoch start time
      try {
        const epochStartTime = await contracts.player_store.epochStart();
        setEpochStart(Number(epochStartTime));
      } catch (err) {
        console.log('Could not fetch epoch start:', err);
        setEpochStart(0);
      }

      setLeaderboardData(leaderboardData);
    } catch (error) {
      console.error('Failed to fetch leaderboard data:', error);
      setError(error.message);
      // Fallback to empty data
      setLeaderboardData([
        { rank: 1, name: "Loading...", address: "0x0000000000000000000000000000000000000000", score: 0.0 },
        { rank: 2, name: "Loading...", address: "0x0000000000000000000000000000000000000000", score: 0.0 },
        { rank: 3, name: "Loading...", address: "0x0000000000000000000000000000000000000000", score: 0.0 },
        { rank: 4, name: "Loading...", address: "0x0000000000000000000000000000000000000000", score: 0.0 },
        { rank: 5, name: "Loading...", address: "0x0000000000000000000000000000000000000000", score: 0.0 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [contracts.player_store, account]);

  const getUserRank = useCallback(async () => {
    if (!contracts.player_store || !account) {
      return null;
    }
  }, [contracts.player_store, account]);

  const advanceEpoch = useCallback(async () => {
    if (!contracts.player_store) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const tx = await contracts.player_store.advanceEpochIfNeeded();
      await tx.wait();
      // Refresh data after advancing epoch
      await fetchLeaderboardData();
    } catch (error) {
      console.error('Failed to advance epoch:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [contracts.player_store, fetchLeaderboardData]);

  return {
    leaderboardData,
    userScore,
    epochStart,
    currentEpoch,
    fetchLeaderboardData,
    getUserRank,
    advanceEpoch,
    loading,
    error
  };
};

// Hook for Sage contract interactions
export const useSage = () => {
  const { contracts } = useContracts();
  const { account } = useWeb3();
  const [sageData, setSageData] = useState({
    lockedAmount: 0,
    lastUnlockTime: 0,
    unlockRate: 0,
    unlockAmount: 0,
    canUnlockWage: false,
    nextUnlockTime: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate unlock rate based on player level
  const calculateUnlockRate = useCallback((level) => {
    if (level >= 15) return SAGE_UNLOCK_RATES.LEVEL_15;
    if (level >= 10) return SAGE_UNLOCK_RATES.LEVEL_10;
    return SAGE_UNLOCK_RATES.DEFAULT;
  }, []);

  // Fetch Sage data for the connected user
  const fetchSageData = useCallback(async () => {
    if (!contracts.sage || !account) return;

    setLoading(true);
    setError(null);

    try {
      // Get locked amount and both unlock times
      const [lockedAmount, lastUnlockTime, lastUnlockTimeHarvest] = await Promise.all([
        contracts.sage.lockedGameToken(account),
        contracts.sage.lastUnlockTime(account),
        contracts.sage.lastUnlockTimeHarvest(account)
      ]);
      // Get player level from PlayerStore
      let playerLevel = 0;
      if (contracts.player_store) {
        const profile = await contracts.player_store.profileOf(account);
        playerLevel = profile.level;
      }

      // Calculate harvest unlock (percentage-based)
      const harvestUnlockPercent = calculateUnlockRate(playerLevel);
      const harvestUnlockAmount = (lockedAmount * BigInt(harvestUnlockPercent)) / BigInt(10000);
      
      // Calculate weekly wage amount using getUnlockCost (fixed amount)
      const weeklyWageAmount = await contracts.sage.getUnlockCost(playerLevel);

      // Check cooldowns for both functions
      const now = Date.now();
      const nextWageUnlockTime = Number(lastUnlockTime) * 1000 + SAGE_UNLOCK_COOLDOWN;
      const nextHarvestUnlockTime = Number(lastUnlockTimeHarvest) * 1000 + SAGE_UNLOCK_COOLDOWN;
      
      // Check if there are enough locked tokens for wage unlock (needs getUnlockCost amount)
      const canUnlockWage = (lastUnlockTime === 0n || now >= nextWageUnlockTime);
      const canUnlockHarvest = lockedAmount > 0 && (lastUnlockTimeHarvest === 0n || now >= nextHarvestUnlockTime);

      setSageData({
        lockedAmount: parseFloat(ethers.formatEther(lockedAmount)),
        lastUnlockTime: Number(lastUnlockTime),
        lastUnlockTimeHarvest: Number(lastUnlockTimeHarvest),
        harvestUnlockPercent: harvestUnlockPercent / 100, // Convert to percentage
        harvestUnlockAmount: parseFloat(ethers.formatEther(harvestUnlockAmount)),
        weeklyWageAmount: parseFloat(ethers.formatEther(weeklyWageAmount)),
        canUnlockWage,
        canUnlockHarvest,
        nextWageUnlockTime,
        nextHarvestUnlockTime,
        // Legacy properties for backward compatibility
        unlockRate: harvestUnlockPercent / 100,
        unlockAmount: parseFloat(ethers.formatEther(harvestUnlockAmount)),
        nextUnlockTime: nextHarvestUnlockTime
      });
    } catch (err) {
      console.error('Failed to fetch Sage data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contracts.sage, contracts.player_store, account, calculateUnlockRate]);

  // Unlock weekly harvest
  const unlockWeeklyHarvest = useCallback(async () => {
    if (!contracts.sage || !sageData.canUnlockHarvest) return;

    setLoading(true);
    setError(null);

    try {
      const tx = await contracts.sage.unlockWeeklyHarvest();
      await tx.wait();

      // Refresh data after successful unlock
      await fetchSageData();
      return tx;
    } catch (err) {
      console.error('Failed to unlock weekly harvest:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.sage, sageData.canUnlockHarvest, fetchSageData]);

  // Unlock weekly wage
  const unlockWeeklyWage = useCallback(async () => {
    if (!contracts.sage || !sageData.canUnlockWage) return;

    setLoading(true);
    setError(null);

    try {
      const tx = await contracts.sage.unlockWeeklyWage();
      await tx.wait();

      // Refresh data after successful unlock
      await fetchSageData();
      return tx;
    } catch (err) {
      console.error('Failed to unlock weekly wage:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.sage, sageData.canUnlockWage, fetchSageData]);

  // Format remaining time until next wage unlock
  const getTimeUntilNextWageUnlock = useCallback(() => {
    const now = Date.now();
    const remaining = sageData.nextWageUnlockTime - now;
    return Math.max(0, remaining);
  }, [sageData.nextWageUnlockTime]);

  // Format remaining time until next harvest unlock
  const getTimeUntilNextHarvestUnlock = useCallback(() => {
    const now = Date.now();
    const remaining = sageData.nextHarvestUnlockTime - now;
    return Math.max(0, remaining);
  }, [sageData.nextHarvestUnlockTime]);

  return {
    sageData,
    fetchSageData,
    unlockWeeklyHarvest,
    unlockWeeklyWage,
    getTimeUntilNextWageUnlock,
    getTimeUntilNextHarvestUnlock,
    loading,
    error
  };
};

