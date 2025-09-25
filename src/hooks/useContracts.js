/* global BigInt */
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAgwEthersAndService } from './useContractBase';
import { useContractBase } from './useContractBase';
import { SAGE_UNLOCK_RATES, SAGE_UNLOCK_COOLDOWN } from '../config/contracts';
import { handleContractError } from '../utils/errorHandler';

// Hook for Vendor contract interactions
export const useVendor = () => {
  const { account } = useAgwEthersAndService();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getContract, publicClient, executeWrite } = useContractBase(['VENDOR', 'YIELD_TOKEN']);
  const vendor = getContract('VENDOR');
  const yieldToken = getContract('YIELD_TOKEN');

  const buySeedPack = useCallback(async (tier, count) => {
    if (!vendor || !yieldToken) {
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
      const balance = await publicClient.readContract({
        address: yieldToken.address,
        abi: yieldToken.abi,
        functionName: 'balanceOf',
        args: [account],
      });
      
      // 2. Get the pack price and calculate total cost
      const packPrice = await publicClient.readContract({
        address: vendor.address,
        abi: vendor.abi,
        functionName: 'packPrice',
        args: [tier],
      });
      const totalCost = (parseInt(packPrice.toString()) * count).toString();
      
      // 3. Check if user has enough balance
      if (parseInt(balance.toString()) < parseInt(totalCost)) {
        setError(`Insufficient Yield balance. Need ${totalCost}, have ${balance.toString()}`);
        return null;
      }
      const result = await executeWrite({
        abi: vendor.abi,
        address: vendor.address,
        functionName: 'buySeedPack',
        args: [tier, count],
      });
      
      return { txHash: result.txHash, tier, isPending: false };
    } catch (err) {
      console.error('Failed to buy seed pack:', err);
      const { message } = handleContractError(err, 'buying seed pack');
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [vendor, yieldToken, account, publicClient, executeWrite]);

  const getPackPrice = useCallback(async (tier) => {
    if (!vendor || !publicClient) return null;

    try {
      const price = await publicClient.readContract({
        address: vendor.address,
        abi: vendor.abi,
        functionName: 'packPrice',
        args: [tier],
      });
      return price.toString();
    } catch (err) {
      console.error('Failed to get pack price:', err);
      return null;
    }
  }, [vendor, publicClient]);

  const checkPendingRequests = useCallback(async () => {
    if (!vendor || !account || !publicClient) {
      return false;
    }
    try {
      const hasPending = await publicClient.readContract({
        address: vendor.address,
        abi: vendor.abi,
        functionName: 'hasPendingRequests',
        args: [account],
      });
      return hasPending;
    } catch (err) {
      console.error('Failed to check pending requests:', err);
      return false;
    }
  }, [vendor, account, publicClient]);

  const getAllPendingRequests = useCallback(async () => {
    if (!vendor || !account || !publicClient) {
      return [];
    }

    try {
      // Try the new getAllPendingRequests function first
      const [requestIds, tiers, counts] = await publicClient.readContract({
        address: vendor.address,
        abi: vendor.abi,
        functionName: 'getAllPendingRequests',
        args: [account],
      });
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
        const [requestId, tier, count] = await publicClient.readContract({
          address: vendor.address,
          abi: vendor.abi,
          functionName: 'getPendingRequest',
          args: [account],
        });
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
  }, [vendor, account, publicClient]);

  const getPendingRequest = useCallback(async () => {
    if (!vendor || !account || !publicClient) {
      return null;
    }

    try {
      const [requestId, tier, count] = await publicClient.readContract({
        address: vendor.address,
        abi: vendor.abi,
        functionName: 'getPendingRequest',
        args: [account],
      });
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
  }, [vendor, account, publicClient]);

  const listenForSeedsRevealed = useCallback(async (requestId, onSeedsRevealed, fromBlock) => {
    if (!vendor || !publicClient || !account) {
      console.error('Vendor contract, publicClient, or account not available');
      return;
    }
    
    try {
      console.log('Setting up SeedsRevealed listener for requestId:', requestId);
      
      // Use a recent block number instead of 'latest' for better reliability
      let startBlock = fromBlock;
      if (!startBlock || startBlock === 'latest') {
        try {
          const currentBlock = await publicClient.getBlockNumber();
          startBlock = BigInt(currentBlock) - BigInt(10); // Look back 10 blocks to be safe
          console.log('Using block', startBlock.toString(), 'as start block (current:', currentBlock.toString(), ')');
        } catch (err) {
          console.error('Failed to get current block number:', err);
          startBlock = 'earliest';
        }
      }
      
      // Event handler function
      const handleEvent = (eventData) => {
        try {
          console.log('SeedsRevealed event received:', eventData);
          
          // Extract event data
          const eventRequestId = eventData.args.requestId.toString();
          const seedIds = eventData.args.seedIds.map(id => id.toString());
          const tier = eventData.args.tier;
          const count = eventData.args.count.toString();
          
          console.log('Event requestId:', eventRequestId, 'Expected:', requestId.toString());
        
        // Only process if this is the request we're waiting for
        if (eventRequestId === requestId.toString()) {
            console.log('✅ Found matching SeedsRevealed event!');
          if (onSeedsRevealed) {
              onSeedsRevealed({ 
                requestId: eventRequestId, 
                seedIds, 
                tier, 
                count 
              });
            }
          // Clean up the listener after processing the event
          console.log('Cleaning up SeedsRevealed listener after successful event');
          unwatch();
          }
        } catch (err) {
          console.error('Error processing SeedsRevealed event:', err);
          // Clean up the listener on error
          console.log('Cleaning up SeedsRevealed listener after error');
          unwatch();
        }
      };
      
      // Set up real-time event listener using watchContractEvent
      console.log('Setting up watchContractEvent for SeedsRevealed');
      const unwatch = publicClient.watchContractEvent({
        address: vendor.address,
        abi: vendor.abi,
        eventName: 'SeedsRevealed',
        args: {
          player: account
        },
        onLogs: (logs) => {
          console.log('Received SeedsRevealed events via watchContractEvent:', logs);
          logs.forEach(log => {
            console.log('Processing log from watchContractEvent:', log);
            handleEvent(log);
          });
        },
        onError: (error) => {
          console.error('Error in SeedsRevealed event listener:', error);
          // Clean up the listener on error
          console.log('Cleaning up SeedsRevealed listener after watchContractEvent error');
          unwatch();
        }
      });
      
      console.log('watchContractEvent setup complete');
      
      // Also query for any events that might have already happened
      const queryExistingEvents = async () => {
        try {
          console.log('Querying existing SeedsRevealed events from block:', startBlock);
          
          // Use the contract ABI directly for event filtering
          const logs = await publicClient.getLogs({
            address: vendor.address,
            event: {
              type: 'event',
              name: 'SeedsRevealed',
              inputs: [
                { name: 'player', type: 'address', indexed: true },
                { name: 'requestId', type: 'uint256', indexed: false },
                { name: 'seedIds', type: 'uint256[]', indexed: false },
                { name: 'tier', type: 'uint8', indexed: false },
                { name: 'count', type: 'uint256', indexed: false }
              ]
            },
            args: {
              player: account
            },
            fromBlock: startBlock,
            toBlock: 'latest'
          });
          
          console.log('Found', logs.length, 'existing SeedsRevealed events');
          console.log('Logs:', logs);
          
          // Process existing events
          for (const log of logs) {
            try {
              console.log('Processing log:', log);
              
              // The log is already decoded by getLogs, we can use it directly
              const eventData = {
                args: log.args,
                eventName: log.eventName,
                address: log.address,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash
              };
              
              console.log('Event data ready:', eventData);
              handleEvent(eventData);
            } catch (parseErr) {
              console.error('Error processing existing event:', parseErr);
              // Clean up the listener on error
              console.log('Cleaning up SeedsRevealed listener after parsing error');
              unwatch();
            }
          }
        } catch (err) {
          console.error('Error querying existing SeedsRevealed events:', err);
          // Clean up the listener on error
          console.log('Cleaning up SeedsRevealed listener after query error');
          unwatch();
        }
      };
      
      // Query existing events
      queryExistingEvents();
      
      // Return cleanup function
      return () => {
        console.log('Cleaning up SeedsRevealed listener');
        unwatch();
      };
      
    } catch (err) {
      console.error('Failed to set up SeedsRevealed listener:', err);
      return () => {}; // Return no-op cleanup function
    }
  }, [vendor, publicClient, account]);

  return {
    buySeedPack,
    getPackPrice,
    checkPendingRequests,
    getAllPendingRequests,
    getPendingRequest,
    listenForSeedsRevealed,
    loading,
    error
  };
};

// Hook for Farming contract interactions
export const useFarming = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getContract, publicClient, agwClient } = useContractBase(['FARMING']);
  const farming = getContract('FARMING');

  const plant = useCallback(async (seedId, plotNumber) => {
    if (!farming || !agwClient) {
      console.error('Farming contract not available');
      setError('Farming contract not available');
      return null;
    }

    console.log('Planting seed:', seedId, 'at plot:', plotNumber);
    setLoading(true);
    setError(null);

    try {
      const txHash = await agwClient.writeContract({
        abi: farming.abi,
        address: farming.address,
        functionName: 'plant',
        args: [seedId, plotNumber],
      });
      
      console.log('Plant successful!');
      return txHash;
    } catch (err) {
      console.error('Failed to plant seed:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      return null;
    } finally {
      setLoading(false);
    }
  }, [farming, agwClient]);

  const plantBatch = useCallback(async (seedIds, plotNumbers) => {
    if (!farming || !agwClient) {
      console.error('Farming contract not available');
      setError('Farming contract not available');
      return null;
    }

    console.log('Planting batch - seedIds:', seedIds, 'plotNumbers:', plotNumbers);
    setLoading(true);
    setError(null);

    try {
      const txHash = await agwClient.writeContract({
        abi: farming.abi,
        address: farming.address,
        functionName: 'plantBatch',
        args: [seedIds, plotNumbers],
      });
      
      console.log('Plant batch successful!');
      return txHash;
    } catch (err) {
      console.error('Failed to plant seeds batch:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      return null;
    } finally {
      setLoading(false);
    }
  }, [farming, agwClient]);

  const harvest = useCallback(async (slot) => {
    if (!farming || !agwClient) {
      setError('Farming contract not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const txHash = await agwClient.writeContract({
        abi: farming.abi,
        address: farming.address,
        functionName: 'harvest',
        args: [slot],
      });
      
      return txHash;
    } catch (err) {
      console.error('Failed to harvest:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      return null;
    } finally {
      setLoading(false);
    }
  }, [farming, agwClient]);

  const harvestMany = useCallback(async (slots) => {
    if (!farming || !agwClient) {
      setError('Farming contract not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const txHash = await agwClient.writeContract({
        abi: farming.abi,
        address: farming.address,
        functionName: 'harvestMany',
        args: [slots],
      });
      
      console.log('Harvest many successful!');
      return txHash;
    } catch (err) {
      console.error('Failed to harvest many:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      return null;
    } finally {
      setLoading(false);
    }
  }, [farming, agwClient]);

  const harvestAll = useCallback(async () => {
    if (!farming || !agwClient) {
      setError('Farming contract not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const txHash = await agwClient.writeContract({
        abi: farming.abi,
        address: farming.address,
        functionName: 'harvestAll',
      });
      
      console.log('Harvest all successful!');
      return txHash;
    } catch (err) {
      console.error('Failed to harvest all:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      return null;
    } finally {
      setLoading(false);
    }
  }, [farming, agwClient]);

  const getUserCrops = useCallback(async (userAddress) => {
    if (!farming || !publicClient) {
      setError('Farming contract not available');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Getting user crops for address:', userAddress);
      
      const crops = await publicClient.readContract({
        address: farming.address,
        abi: farming.abi,
        functionName: 'getUserCrops',
        args: [userAddress],
      });
      
      console.log('Got user crops from contract:', crops);
      
      // Convert crops to the expected format with new struct fields
      const formattedCrops = crops.map((crop, index) => {
        const seedIdBig = BigInt(crop.seedId);
        const endTimeNum = Number(crop.endTime);
        const produceMultiplier = Number(crop.produceMultiplierX1000 || 1000);
        const tokenMultiplier = Number(crop.tokenMultiplierX1000 || 1000);
        
        return ({
          plotNumber: index,
          seedId: seedIdBig,
          endTime: endTimeNum,
          produceMultiplierX1000: produceMultiplier,
          tokenMultiplierX1000: tokenMultiplier,
          isReady: seedIdBig !== 0n && endTimeNum <= Math.floor(Date.now() / 1000)
        });
      });

      console.log('Formatted crops:', formattedCrops);
      return formattedCrops;
    } catch (err) {
      console.error('Failed to get user crops:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      return [];
    } finally {
      setLoading(false);
    }
  }, [farming, publicClient]);

  const getMaxPlots = useCallback(async (userAddress) => {
    if (!farming || !publicClient) {
      return 0;
    }

    try {
      const maxPlots = await publicClient.readContract({
        address: farming.address,
        abi: farming.abi,
        functionName: 'getMaxPlots',
        args: [userAddress],
      });
      
      return Number(maxPlots);
    } catch (err) {
      console.error('Failed to get max plots:', err);
      return 0;
    }
  }, [farming, publicClient]);

  const getCrop = useCallback(async (userAddress, plotIndex) => {
    if (!farming || !publicClient) return null;

    try {
      const crop = await publicClient.readContract({
        address: farming.address,
        abi: farming.abi,
        functionName: 'crops',
        args: [userAddress, plotIndex],
      });
      
      // Handle case where crop is undefined or doesn't have expected structure
      if (!crop) {
        console.warn('Crop is undefined for plot:', plotIndex);
        return {
          seedId: "0",
          endTime: 0,
          produceMultiplierX1000: 1000,
          tokenMultiplierX1000: 1000
        };
      }
      
      // Handle case where crop is an array (tuple format) - new struct with 4 fields
      if (Array.isArray(crop)) {
        return {
          seedId: crop[0] ? crop[0].toString() : "0",
          endTime: crop[1] ? Number(crop[1]) : 0,
          produceMultiplierX1000: crop[2] ? Number(crop[2]) : 1000,
          tokenMultiplierX1000: crop[3] ? Number(crop[3]) : 1000
        };
      }
      
      // Handle case where crop is an object with new struct fields
      if (crop.seedId !== undefined && crop.endTime !== undefined) {
      return {
        seedId: crop.seedId.toString(),
          endTime: Number(crop.endTime),
          produceMultiplierX1000: crop.produceMultiplierX1000 ? Number(crop.produceMultiplierX1000) : 1000,
          tokenMultiplierX1000: crop.tokenMultiplierX1000 ? Number(crop.tokenMultiplierX1000) : 1000
        };
      }
      
      // Fallback for unexpected structure
      console.warn('Unexpected crop structure:', crop);
      return {
        seedId: "0",
        endTime: 0,
        produceMultiplierX1000: 1000,
        tokenMultiplierX1000: 1000
      };
    } catch (err) {
      console.error('Failed to get crop:', err);
      // Return a default crop structure instead of null to prevent further errors
      return {
        seedId: "0",
        endTime: 0,
        produceMultiplierX1000: 1000,
        tokenMultiplierX1000: 1000
      };
    }
  }, [farming, publicClient]);

  const getGrowthTime = useCallback(async (seedId) => {
    if (!farming || !publicClient) return 60; // Default fallback

    try {
      const growthTime = await publicClient.readContract({
        address: farming.address,
        abi: farming.abi,
        functionName: 'getGrowthTime',
        args: [seedId],
      });
      
      return Number(growthTime);
    } catch (err) {
      console.error('Failed to get growth time:', err);
      return 60; // Default fallback
    }
  }, [farming, publicClient]);

  // Apply Growth Elixir to reduce remaining growth time
  const applyGrowthElixir = useCallback(async (plotNumber) => {
    if (!farming || !agwClient) {
      setError('Farming contract not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const txHash = await agwClient.writeContract({
        abi: farming.abi,
        address: farming.address,
        functionName: 'applyGrowthElixir',
        args: [plotNumber],
      });
      
      console.log('Growth Elixir applied successfully!');
      return txHash;
    } catch (err) {
      console.error('Failed to apply Growth Elixir:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      return null;
    } finally {
      setLoading(false);
    }
  }, [farming, agwClient]);

  // Apply Pesticide to boost produce amount
  const applyPesticide = useCallback(async (plotNumber) => {
    if (!farming || !agwClient) {
      setError('Farming contract not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const txHash = await agwClient.writeContract({
        abi: farming.abi,
        address: farming.address,
        functionName: 'applyPesticide',
        args: [plotNumber],
      });
      
      console.log('Pesticide applied successfully!');
      return txHash;
    } catch (err) {
      console.error('Failed to apply Pesticide:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      return null;
    } finally {
      setLoading(false);
    }
  }, [farming, agwClient]);

  // Apply Fertilizer to increase gameToken amount on harvest
  const applyFertilizer = useCallback(async (plotNumber) => {
    if (!farming || !agwClient) {
      setError('Farming contract not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const txHash = await agwClient.writeContract({
        abi: farming.abi,
        address: farming.address,
        functionName: 'applyFertilizer',
        args: [plotNumber],
      });
      
      console.log('Fertilizer applied successfully!');
      return txHash;
    } catch (err) {
      console.error('Failed to apply Fertilizer:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      return null;
    } finally {
      setLoading(false);
    }
  }, [farming, agwClient]);

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
    applyGrowthElixir,
    applyPesticide,
    applyFertilizer,
    loading,
    error
  };
};

// Hook for getting ROI data and farm level
export const useROIData = () => {
  const { contractService } = useAgwEthersAndService();
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
    if (!contractService) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Getting ROI data for level:', level);
      
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
      setTimeout(() => {
        setError(null);
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, [contractService]);

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
  const { account } = useAgwEthersAndService();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getContract, publicClient, agwClient } = useContractBase(['BANKER', 'YIELD_TOKEN']);
  const banker = getContract('BANKER');
  const yieldToken = getContract('YIELD_TOKEN');

  const stake = useCallback(async (amount) => {
    if (!banker || !yieldToken || !agwClient || !publicClient) {
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
      
      // Check balance first
      const userBalance = await publicClient.readContract({
        address: yieldToken.address,
        abi: yieldToken.abi,
        functionName: 'balanceOf',
        args: [account],
      });
      if (userBalance < amount) {
        throw new Error(`Insufficient Honey balance. You have ${ethers.formatEther(userBalance)} Honey, trying to stake ${ethers.formatEther(amount)}`);
      }
      
      const txHash = await agwClient.writeContract({
        abi: banker.abi,
        address: banker.address,
        functionName: 'stake',
        args: [amount],
      });
      
      return txHash;
    } catch (err) {
      console.error('Failed to stake:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      return null;
    } finally {
      setLoading(false);
    }
  }, [banker, yieldToken, agwClient, publicClient, account]);

  const unstake = useCallback(async (shares) => {
    if (!banker || !agwClient) {
      setError('Banker contract not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const txHash = await agwClient.writeContract({
        abi: banker.abi,
        address: banker.address,
        functionName: 'unstake',
        args: [shares],
      });
      
      return txHash;
    } catch (err) {
      console.error('Failed to unstake:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      return null;
    } finally {
      setLoading(false);
    }
  }, [banker, agwClient]);

  const getBalance = useCallback(async (userAddress) => {
    if (!banker || !publicClient) return "0";

    try {
      const balance = await publicClient.readContract({
        address: banker.address,
        abi: banker.abi,
        functionName: 'balanceOf',
        args: [userAddress],
      });
      
      return balance.toString();
    } catch (err) {
      return "0";
    }
  }, [banker, publicClient]);

  // Get banker contract ratio and total supply data
  const getBankerData = useCallback(async () => {
    if (!banker || !publicClient) return null;

    try {
      const [totalSupply, tokenBalance] = await Promise.all([
        publicClient.readContract({
          address: banker.address,
          abi: banker.abi,
          functionName: 'totalSupply',
        }),
        publicClient.readContract({
          address: banker.address,
          abi: banker.abi,
          functionName: 'totalGameToken',
        })
      ]);
      
      const totalSupplyNum = parseFloat(ethers.formatEther(totalSupply));
      const tokenBalanceNum = parseFloat(ethers.formatEther(tokenBalance));
      
      let ratioValue = 1.0; // Default ratio
      if (totalSupplyNum > 0 && tokenBalanceNum > 0) {
        ratioValue = tokenBalanceNum / totalSupplyNum;
      }
      
      return {
        totalSupply: totalSupplyNum,
        tokenBalance: tokenBalanceNum,
        ratio: ratioValue
      };
    } catch (err) {
      console.error('Failed to get banker data:', err);
      return {
        totalSupply: 0,
        tokenBalance: 0,
        ratio: 1.0
      };
    }
  }, [banker, publicClient]);

  return {
    stake,
    unstake,
    getBalance,
    getBankerData,
    loading,
    error
  };
};

// Hook for DEX contract interactions
export const useDex = () => {

  const { account } = useAgwEthersAndService();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ethBalance, setEthBalance] = useState('0.00');
  const [honeyBalance, setHoneyBalance] = useState('0.00');
  const { getContract, publicClient, agwClient } = useContractBase(['DEX', 'YIELD_TOKEN']);
  const dex = getContract('DEX');
  const yieldToken = getContract('YIELD_TOKEN');

  const swapETHForYield = useCallback(async (ethAmount) => {
    setLoading(true);
    setError(null);

    try {
      const txHash = await agwClient.writeContract({
        abi: dex.abi,
        address: dex.address,
        functionName: 'depositNativeForGameToken',
        args: [ethAmount],
      });
      return txHash;
    } catch (err) {
      console.error('Failed to swap ETH for YLD:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      return null;
    } finally {
      setLoading(false);
    }
  }, [dex, agwClient]);

  const getYieldAmount = useCallback(async (ethAmount) => {
    if (!publicClient) return "0";

    try {
      // Get the actual rate from the MockDex contract
      const ratePerEth = await publicClient.readContract({
        address: dex.address,
        abi: dex.abi,
        functionName: 'RATE_PER_ETH',
      });
      console.log('Rate per ETH from contract:', ratePerEth.toString());
      
      // Calculate yield amount: (ethAmount * ratePerEth) / 1 ether
      const yieldAmount = (ethAmount * ratePerEth) / ethers.parseEther("1");
      console.log('Calculated yield amount:', yieldAmount.toString());
      
      return yieldAmount.toString();
    } catch (err) {
      console.error('Failed to get yield amount:', err);
      return "0";
    }
  }, [dex, publicClient]);

  // Fetch ETH balance
  const fetchEthBalance = useCallback(async () => {
    if (!account || !publicClient) {
      console.log('🔍 useDex fetchEthBalance: Missing account or publicClient', { account, publicClient: !!publicClient });
      return;
    }

    try {
      console.log('🔍 useDex: Fetching ETH balance for account:', account);
      
      // Double-check account is valid before making the call
      if (!account) {
        console.warn('🔍 useDex: Account is null/undefined, skipping ETH balance fetch');
        setEthBalance('0.00');
        return;
      }
      
      const balance = await publicClient.getBalance({address: account});
      const ethBalance = parseFloat(ethers.formatEther(balance));
      setEthBalance(ethBalance.toFixed(2));
      console.log('✅ useDex: ETH balance fetched:', ethBalance.toFixed(2));
    } catch (err) {
      console.error('Failed to fetch ETH balance:', err);
      setEthBalance('0.00');
    }
  }, [account, publicClient]);

  // Fetch Honey token balance
  const fetchHoneyBalance = useCallback(async () => {
    if (!account || !publicClient) {
      console.log('🔍 useDex fetchHoneyBalance: Missing account or publicClient', { account, publicClient: !!publicClient });
      return;
    }
    if(!yieldToken?.address) {
      console.log('🔍 useDex fetchHoneyBalance: Yield token contract not available');
      return;
    }
    try {
      console.log('🔍 useDex: Fetching Honey balance for account:', account);
      const balance = await publicClient.readContract({
        address: yieldToken.address,
        abi: yieldToken.abi,
        functionName: 'balanceOf',
        args: [account],
      });
      const honeyBalance = parseFloat(ethers.formatEther(balance));
      setHoneyBalance(honeyBalance.toFixed(2));
      console.log('✅ useDex: Honey balance fetched:', honeyBalance.toFixed(2));
    } catch (err) {
      console.error('Failed to fetch Honey balance:', err);
      setHoneyBalance('0.00');
    }
  }, [account, publicClient, yieldToken]);

  // Fetch both balances
  const fetchBalances = useCallback(async () => {
    if (!account || !publicClient) {
      console.log('🔍 useDex: Cannot fetch balances - missing account or publicClient');
      return;
    }
    
    await Promise.all([
      fetchEthBalance(),
      fetchHoneyBalance()
    ]);
  }, [account, publicClient, fetchEthBalance, fetchHoneyBalance]);

  // Auto-fetch balances when dependencies change
  useEffect(() => {
    if (account && publicClient) {
      console.log('🔍 useDex: Fetching balances for account:', account);
      fetchBalances();
    }
  }, [account, publicClient, fetchBalances]);

  return {
    swapETHForYield,
    getYieldAmount,
    ethBalance,
    honeyBalance,
    fetchBalances,
    loading,
    error
  };
};

// Hook for Leaderboard data
export const useLeaderboard = (epoch = null) => {
  const { account } = useAgwEthersAndService();
  const { getContract, publicClient, agwClient } = useContractBase(['PLAYER_STORE']);
  const playerStore = getContract('PLAYER_STORE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userScore, setUserScore] = useState(0);
  const [epochStart, setEpochStart] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);

  const fetchLeaderboardData = useCallback(async (targetEpoch = null) => {
    if (!playerStore || !publicClient) {
      return; 
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get current epoch from contract
      const contractCurrentEpoch = await publicClient.readContract({
        address: playerStore.address,
        abi: playerStore.abi,
        functionName: 'gameEpoch',
      });
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
            const address = await publicClient.readContract({
              address: playerStore.address,
              abi: playerStore.abi,
              functionName: 'top5',
              args: [i],
            });
            const xp = await publicClient.readContract({
              address: playerStore.address,
              abi: playerStore.abi,
              functionName: 'top5Xp',
              args: [i],
            });
            
            if (address !== "0x0000000000000000000000000000000000000000") {
              try {
                // Get profile data for this address
                const username = await publicClient.readContract({
                  address: playerStore.address,
                  abi: playerStore.abi,
                  functionName: 'usernameOf',
                  args: [address],
                });
                leaderboardData.push({
                  rank: i + 1,
                  name: username,
                  address: address,
                  score: parseFloat(xp.toString())
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
            const [top5Players, top5XpAmounts, epochNumber, timestamp] = await publicClient.readContract({
              address: playerStore.address,
              abi: playerStore.abi,
              functionName: 'getEpochTop5',
              args: [epochToFetch],
            });
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
                  const username = await publicClient.readContract({
                    address: playerStore.address,
                    abi: playerStore.abi,
                    functionName: 'usernameOf',
                    args: [address],
                  });
                  leaderboardData.push({
                    rank: i + 1,
                    name: username,
                    address: address,
                    score: parseFloat(xp.toString())
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

      // Get user's score for the selected epoch (only if they're in top 5)
      if (account) {
        let userScoreForEpoch = 0;
        for (const player of leaderboardData) {
          if (player.address.toLowerCase() === account.toLowerCase()) {
            userScoreForEpoch = player.score;
            break;
          }
        }
        setUserScore(userScoreForEpoch);
      }

      // Get epoch start time
      try {
        const epochStartTime = await publicClient.readContract({
          address: playerStore.address,
          abi: playerStore.abi,
          functionName: 'epochStart',
        });
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
  }, [playerStore, publicClient, account]);

  const getUserRank = useCallback(async () => {
    if (!playerStore || !account) {
      return null;
    }
  }, [playerStore, account]);

  const advanceEpoch = useCallback(async () => {
    if (!playerStore || !agwClient) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const txHash = await agwClient.writeContract({
        abi: playerStore.abi,
        address: playerStore.address,
        functionName: 'advanceEpochIfNeeded',
      });
      // Refresh data after advancing epoch
      await fetchLeaderboardData();
      return txHash;
    } catch (error) {
      console.error('Failed to advance epoch:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [playerStore, agwClient, fetchLeaderboardData]);

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
  const { account } = useAgwEthersAndService();
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
  const { getContract, publicClient, agwClient } = useContractBase(['SAGE', 'PLAYER_STORE']);
  const sage = getContract('SAGE');
  const playerStore = getContract('PLAYER_STORE');

  // Calculate unlock rate based on player level
  const calculateUnlockRate = useCallback((level) => {
    if (level >= 15) return SAGE_UNLOCK_RATES.LEVEL_15;
    if (level >= 10) return SAGE_UNLOCK_RATES.LEVEL_10;
    return SAGE_UNLOCK_RATES.DEFAULT;
  }, []);

  // Fetch Sage data for the connected user
  const fetchSageData = useCallback(async () => {
    if (!sage || !account || !publicClient) {
      console.log('🔍 useSage fetchSageData: Missing dependencies', { 
        sage: !!sage, 
        account, 
        publicClient: !!publicClient 
      });
      return;
    }

    console.log('🔍 useSage: Starting fetchSageData for account:', account);
    setLoading(true);
    setError(null);

    try {
      // Get locked amount and both unlock times
      const [lockedAmount, lastUnlockTime, lastUnlockTimeHarvest] = await Promise.all([
        publicClient.readContract({
          address: sage.address,
          abi: sage.abi,
          functionName: 'lockedGameToken',
          args: [account],
        }),
        publicClient.readContract({
          address: sage.address,
          abi: sage.abi,
          functionName: 'lastUnlockTime',
          args: [account],
        }),
        publicClient.readContract({
          address: sage.address,
          abi: sage.abi,
          functionName: 'lastUnlockTimeHarvest',
          args: [account],
        })
      ]);
      
      console.log('🚀 Sage data fetched:', { lockedAmount, lastUnlockTime, lastUnlockTimeHarvest });
      
      // Handle undefined values
      const safeLockedAmount = lockedAmount !== undefined ? lockedAmount : 0n;
      const safeLastUnlockTime = lastUnlockTime !== undefined ? lastUnlockTime : 0n;
      const safeLastUnlockTimeHarvest = lastUnlockTimeHarvest !== undefined ? lastUnlockTimeHarvest : 0n;
      // Get player level from PlayerStore
      let playerLevel = 0;
      if (playerStore) {
        try {
          const profile = await publicClient.readContract({
            address: playerStore.address,
            abi: playerStore.abi,
            functionName: 'profileOf',
            args: [account],
          });
          console.log('🚀 Profile data:', profile);
          
          // Handle different profile formats
          if (profile && Array.isArray(profile)) {
            // If profile is an array, level is at index 1
            playerLevel = profile[1] !== undefined ? Number(profile[1]) : 0;
            console.log('🚀 Player level from array:', playerLevel);
          } else if (profile && typeof profile === 'object' && profile.level !== undefined) {
            // If profile is an object with level property
            playerLevel = Number(profile.level);
            console.log('🚀 Player level from object:', playerLevel);
          } else {
            console.warn('Profile format not recognized in Sage:', profile);
            playerLevel = 0;
          }
        } catch (error) {
          console.warn('Failed to get player profile, using default level 0:', error);
          playerLevel = 0;
        }
      }
      
      console.log('🚀 Player level:', playerLevel);

      // Calculate harvest unlock (percentage-based)
      const harvestUnlockPercent = calculateUnlockRate(playerLevel);
      const harvestUnlockAmount = (safeLockedAmount * BigInt(harvestUnlockPercent)) / BigInt(10000);
      
      // Calculate weekly wage amount using getUnlockCost (fixed amount)
      let weeklyWageAmount = 0n;
      try {
        weeklyWageAmount = await publicClient.readContract({
          address: sage.address,
          abi: sage.abi,
          functionName: 'getUnlockCost',
          args: [playerLevel],
        });
        console.log('🚀 Weekly wage amount:', weeklyWageAmount);
      } catch (error) {
        console.warn('Failed to get unlock cost, using default 0:', error);
        weeklyWageAmount = 0n;
      }

      // Check cooldown for both functions
      const now = Date.now();
      const nextWageUnlockTime = Number(safeLastUnlockTime) * 1000 + SAGE_UNLOCK_COOLDOWN;
      const nextHarvestUnlockTime = Number(safeLastUnlockTimeHarvest) * 1000 + SAGE_UNLOCK_COOLDOWN;
      
      // Check if there are enough locked tokens for wage unlock (needs getUnlockCost amount)
      const canUnlockWage = (safeLastUnlockTime === 0n || now >= nextWageUnlockTime);
      const canUnlockHarvest = safeLockedAmount > 0 && (safeLastUnlockTimeHarvest === 0n || now >= nextHarvestUnlockTime);

      const finalSageData = {
        lockedAmount: parseFloat(ethers.formatEther(safeLockedAmount)),
        lastUnlockTime: Number(safeLastUnlockTime),
        lastUnlockTimeHarvest: Number(safeLastUnlockTimeHarvest),
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
      };
      
      console.log('✅ useSage: Final Sage data:', finalSageData);
      setSageData(finalSageData);
    } catch (err) {
      console.error('Failed to fetch Sage data:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, [sage, playerStore, account, publicClient, calculateUnlockRate]);

  // Unlock weekly harvest
  const unlockWeeklyHarvest = useCallback(async () => {
    if (!sage || !agwClient || !sageData.canUnlockHarvest) return;

    setLoading(true);
    setError(null);

    try {
      const txHash = await agwClient.writeContract({
        abi: sage.abi,
        address: sage.address,
        functionName: 'unlockWeeklyHarvest',
      });

      // Refresh data after successful unlock
      await fetchSageData();
      return txHash;
    } catch (err) {
      console.error('Failed to unlock weekly harvest:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sage, agwClient, sageData.canUnlockHarvest, fetchSageData]);

  // Unlock weekly wage
  const unlockWeeklyWage = useCallback(async () => {
    if (!sage || !agwClient || !sageData.canUnlockWage) return;

    console.log('🚀 useSage: Starting weekly wage unlock');
    console.log('🔍 useSage: Current sageData before unlock:', sageData);
    
    setLoading(true);
    setError(null);

    try {
      const txHash = await agwClient.writeContract({
        abi: sage.abi,
        address: sage.address,
        functionName: 'unlockWeeklyWage',
      });

      console.log('✅ useSage: Weekly wage unlock transaction successful:', txHash);
      
      // Add a small delay to allow blockchain state to update
      console.log('⏳ useSage: Waiting for blockchain state to update...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh data after successful unlock
      console.log('🔄 useSage: Refreshing Sage data after unlock...');
      await fetchSageData();
      console.log('✅ useSage: Sage data refreshed after unlock');
      
      return txHash;
    } catch (err) {
      console.error('Failed to unlock weekly wage:', err);
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 2000);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sage, agwClient, sageData, fetchSageData]);

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

// Hook for Gardener contract interactions
export const useGardener = () => {
  const { account } = useAgwEthersAndService();
  const { getContract, publicClient, agwClient } = useContractBase(['GARDENER', 'PLAYER_STORE', 'YIELD_TOKEN']);
  const gardener = getContract('GARDENER');
  const playerStore = getContract('PLAYER_STORE');
  const yieldToken = getContract('YIELD_TOKEN');
  
  const [gardenerData, setGardenerData] = useState({
    currentLevel: 0,
    maxLevel: 50,
    levelUpCost: 0,
    canLevelUp: false,
    loading: false,
    error: null
  });

  const fetchGardenerData = useCallback(async () => {
    if (!gardener || !playerStore || !yieldToken || !account || !publicClient) return;

    setGardenerData(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🌱 Fetching gardener data...');
      
      // Get current player level
      let currentLevel = 0;
      try {
        const profile = await publicClient.readContract({
          address: playerStore.address,
          abi: playerStore.abi,
          functionName: 'profileOf',
          args: [account],
        });
        console.log('🚀 Profile data:', profile);
        
        // Handle different profile formats
        if (profile && Array.isArray(profile)) {
          // If profile is an array, level is at index 1
          currentLevel = profile[1] !== undefined ? Number(profile[1]) : 0;
          console.log('🚀 Current level from array:', currentLevel);
        } else if (profile && typeof profile === 'object' && profile.level !== undefined) {
          // If profile is an object with level property
          currentLevel = Number(profile.level);
          console.log('🚀 Current level from object:', currentLevel);
        } else {
          console.warn('Profile format not recognized:', profile);
          console.warn('Profile type:', typeof profile);
          console.warn('Profile keys:', profile ? Object.keys(profile) : 'null');
          currentLevel = 0;
        }
      } catch (error) {
        console.warn('Failed to get player profile, using default level 0:', error);
        currentLevel = 0;
      }
      
      // Get max level from gardener contract
      let maxLevel = 50; // Default max level (matching contract default)
      try {
        const maxLevelResult = await publicClient.readContract({
          address: gardener.address,
          abi: gardener.abi,
          functionName: 'maxLevel',
        });
        maxLevel = maxLevelResult !== undefined ? Number(maxLevelResult) : 50;
        console.log('🚀 Max level:', maxLevel);
      } catch (error) {
        console.warn('Failed to get max level, using default 50:', error);
        maxLevel = 50;
      }
      
      // Calculate cost to level up to next level
      let levelUpCost = 0;
      if (currentLevel < maxLevel) {
        try {
          const costResult = await publicClient.readContract({
            address: gardener.address,
            abi: gardener.abi,
            functionName: 'priceForLevel',
            args: [currentLevel + 1],
          });
          levelUpCost = costResult !== undefined ? Number(costResult) : 0;
          console.log('🚀 Level up cost:', levelUpCost);
        } catch (error) {
          console.warn('Failed to get level up cost, using default 0:', error);
          levelUpCost = 0;
        }
      }

      // Check if player can afford to level up
      let gameTokenBalance = 0;
      try {
        const balanceResult = await publicClient.readContract({
          address: yieldToken.address,
          abi: yieldToken.abi,
          functionName: 'balanceOf',
          args: [account],
        });
        gameTokenBalance = balanceResult !== undefined ? Number(balanceResult) : 0;
        console.log('🚀 Game token balance:', gameTokenBalance);
      } catch (error) {
        console.warn('Failed to get game token balance, using default 0:', error);
        gameTokenBalance = 0;
      }
      
      const canLevelUp = currentLevel < maxLevel && gameTokenBalance >= levelUpCost;

      // Safely format level up cost to avoid overflow
      let formattedLevelUpCost = 0;
      try {
        // Handle undefined or null values
        if (levelUpCost === undefined || levelUpCost === null) {
          formattedLevelUpCost = 0;
        } else {
          // Convert to string first to handle large numbers
          const levelUpCostStr = levelUpCost.toString();
          console.log('🚀 Raw level up cost:', levelUpCostStr);
          
          // Use BigInt for safe conversion
          const levelUpCostBigInt = BigInt(levelUpCostStr);
          formattedLevelUpCost = parseFloat(ethers.formatEther(levelUpCostBigInt));
          console.log('🚀 Formatted level up cost:', formattedLevelUpCost);
        }
      } catch (error) {
        console.warn('Failed to format level up cost, using manual conversion:', error);
        // Fallback: convert from wei to ether manually
        try {
          const levelUpCostStr = levelUpCost.toString();
          formattedLevelUpCost = parseFloat(levelUpCostStr) / 1e18;
        } catch (fallbackError) {
          console.warn('Manual conversion also failed, using 0:', fallbackError);
          formattedLevelUpCost = 0;
        }
      }

      setGardenerData({
        currentLevel: currentLevel,
        maxLevel: maxLevel,
        levelUpCost: formattedLevelUpCost,
        canLevelUp,
        loading: false,
        error: null
      });
      
      console.log('🌱 Gardener data set:', {
        currentLevel,
        maxLevel,
        levelUpCost: formattedLevelUpCost,
        canLevelUp
      });
    } catch (err) {
      console.error('Failed to fetch Gardener data:', err);
      const { message } = handleContractError(err, 'fetching gardener data');
      setGardenerData(prev => ({
        ...prev,
        loading: false,
        error: message
      }));
    }
  }, [gardener, playerStore, yieldToken, account, publicClient]);

  const levelUp = useCallback(async (targetLevel) => {
    if (!gardener || !account || !agwClient) return;

    console.log('🌱 Attempting to level up to:', targetLevel);
    console.log('🌱 Account:', account);
    console.log('🌱 Gardener contract:', gardener.address);

    setGardenerData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const txHash = await agwClient.writeContract({
        abi: gardener.abi,
        address: gardener.address,
        functionName: 'levelUp',
        args: [targetLevel],
      });

      console.log('🌱 Level up transaction hash:', txHash);
      
      // Refresh data after successful level up
      await fetchGardenerData();
      return txHash;
    } catch (err) {
      console.error('Failed to level up:', err);
      const { message } = handleContractError(err, 'leveling up valley');
      setGardenerData(prev => ({
        ...prev,
        loading: false,
        error: message
      }));
      throw new Error(message);
    }
  }, [gardener, account, agwClient, fetchGardenerData]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchGardenerData();
  }, [fetchGardenerData]);

  return {
    ...gardenerData,
    levelUp,
    fetchGardenerData
  };
};

// Hook for ChestOpener contract interactions
export const useChestOpener = () => {
  const { account } = useAgwEthersAndService();
  const { getContract, publicClient, agwClient } = useContractBase(['CHEST_OPENER', 'PLAYER_STORE']);
  const chestOpener = getContract('CHEST_OPENER');
  const playerStore = getContract('PLAYER_STORE');
  const [chestData, setChestData] = useState({
    nextChestTime: 0,
    canClaim: false,
    currentLevel: 0,
    chestType: 'WOOD', // WOOD, BRONZE, SILVER, GOLD
    loading: false,
    error: null
  });

  const fetchChestData = useCallback(async () => {
    if (!chestOpener || !playerStore || !account || !publicClient) return;

    setChestData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get player profile to check level and next chest time
      const profile = await publicClient.readContract({
        address: playerStore.address,
        abi: playerStore.abi,
        functionName: 'profileOf',
        args: [account],
      });
      // Handle different profile formats
      let currentLevel = 0;
      let nextChestTime = 0;
      
      if (profile && Array.isArray(profile)) {
        // If profile is an array, level is at index 1, nextChestAt at index 2
        currentLevel = profile[1] !== undefined ? Number(profile[1]) : 0;
        nextChestTime = profile[2] !== undefined ? Number(profile[2]) : 0;
      } else if (profile && typeof profile === 'object') {
        // If profile is an object with properties
        currentLevel = profile.level !== undefined ? Number(profile.level) : 0;
        nextChestTime = profile.nextChestAt !== undefined ? Number(profile.nextChestAt) : 0;
      }
      
      // Determine chest type based on level
      let chestType = 'WOOD';
      if (currentLevel >= 15) {
        chestType = 'GOLD';
      } else if (currentLevel >= 10) {
        chestType = 'SILVER';
      } else if (currentLevel >= 5) {
        chestType = 'BRONZE';
      }

      // Check if can claim (current time >= next chest time)
      const now = Math.floor(Date.now() / 1000);
      const canClaim = now >= Number(nextChestTime);

      setChestData({
        nextChestTime: Number(nextChestTime),
        canClaim,
        currentLevel: Number(currentLevel),
        chestType,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Failed to fetch chest data:', err);
      setChestData(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
    }
  }, [chestOpener, playerStore, account, publicClient]);

  const claimDailyChest = useCallback(async () => {
    if (!chestOpener || !account || !agwClient) return;

    setChestData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const txHash = await agwClient.writeContract({
        abi: chestOpener.abi,
        address: chestOpener.address,
        functionName: 'claimDailyChest',
      });

      // Refresh data after successful claim
      await fetchChestData();
      setChestData(prev => ({ ...prev, loading: false, error: null }));
      return txHash;
    } catch (err) {
      const { message } = handleContractError(err, 'claiming daily chest');
      setChestData(prev => ({
        ...prev,
        loading: false,
        error: message
      }));
      throw new Error(message);
    }
  }, [chestOpener, account, agwClient, fetchChestData]);

  const openChest = useCallback(async (chestId) => {
    if (!chestOpener || !account || !agwClient) return;

    setChestData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const txHash = await agwClient.writeContract({
        abi: chestOpener.abi,
        address: chestOpener.address,
        functionName: 'openChest',
        args: [chestId],
      });

      setChestData(prev => ({ ...prev, loading: false, error: null }));
      
      // Return the transaction hash - the fulfillment will happen automatically via events
      return {
        success: true,
        txHash: txHash,
        message: 'Chest opening request sent successfully'
      };
    } catch (err) {
      const { message } = handleContractError(err, 'opening chest');
      setChestData(prev => ({
        ...prev,
        loading: false,
        error: message
      }));
      throw new Error(message);
    }
  }, [chestOpener, account, agwClient]);

  // Calculate time until next chest claim
  const getTimeUntilNextChest = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Math.max(0, chestData.nextChestTime - now);
    return timeLeft * 1000; // Convert to milliseconds for consistency
  }, [chestData.nextChestTime]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchChestData();
  }, [fetchChestData]);

  // Check for pending requests
  const checkPendingRequests = useCallback(async () => {
    if (!chestOpener || !account || !publicClient) {
      return false;
    }
    try {
      const hasPending = await publicClient.readContract({
        address: chestOpener.address,
        abi: chestOpener.abi,
        functionName: 'hasPendingRequests',
        args: [account],
      });
      return hasPending;
    } catch (err) {
      console.error('Failed to check chest pending requests:', err);
      return false;
    }
  }, [chestOpener, account, publicClient]);

  // Get all pending requests
  const getAllPendingRequests = useCallback(async () => {
    if (!chestOpener || !account || !publicClient) {
      return [];
    }

    try {
      const [requestIds, chestIds] = await publicClient.readContract({
        address: chestOpener.address,
        abi: chestOpener.abi,
        functionName: 'getAllPendingRequests',
        args: [account],
      });
      const pendingRequests = [];
      
      for (let i = 0; i < requestIds.length; i++) {
        pendingRequests.push({
          requestId: requestIds[i].toString(),
          chestId: chestIds[i].toString()
        });
      }
      
      return pendingRequests;
    } catch (err) {
      console.error('Failed to get chest pending requests:', err);
      return [];
    }
  }, [chestOpener, account, publicClient]);

  // Listen for chest opening results
  const listenForChestResults = useCallback(async (requestId, onChestResults, fromBlock) => {
    if (!chestOpener || !publicClient || !account) {
      console.error('Chest opener contract, publicClient, or account not available');
      return;
    }
    
    try {
      console.log('Setting up ChestResults listener for requestId:', requestId);
      
      // Use a recent block number instead of 'latest' for better reliability
      let startBlock = fromBlock;
      if (!startBlock || startBlock === 'latest') {
        try {
          const currentBlock = await publicClient.getBlockNumber();
          startBlock = BigInt(currentBlock) - BigInt(10); // Look back 10 blocks to be safe
          console.log('Using block', startBlock.toString(), 'as start block (current:', currentBlock.toString(), ')');
        } catch (err) {
          console.error('Failed to get current block number:', err);
          startBlock = 'earliest';
        }
      }
      
      // Event handler function
      const handleEvent = (eventData) => {
        try {
          console.log('ChestResults event received:', eventData);
          
          // Extract event data
          const eventRequestId = eventData.args.requestId.toString();
          const chestType = eventData.args.chestType.toString();
          const rewardId = eventData.args.rewardId.toString();
          
          console.log('Event requestId:', eventRequestId, 'Expected:', requestId.toString());
        
        // Only process if this is the request we're waiting for
        if (eventRequestId === requestId.toString()) {
            console.log('✅ Found matching ChestResults event!');
          if (onChestResults) {
              onChestResults({ 
                requestId: eventRequestId, 
                chestType,
                rewardId
              });
            }
          // Clean up the listener after processing the event
          console.log('Cleaning up ChestResults listener after successful event');
          unwatch();
          }
        } catch (err) {
          console.error('Error processing ChestResults event:', err);
          // Clean up the listener on error
          console.log('Cleaning up ChestResults listener after error');
          unwatch();
        }
      };
      
      // Set up real-time event listener using watchContractEvent
      console.log('Setting up watchContractEvent for ChestResults');
      const unwatch = publicClient.watchContractEvent({
        address: chestOpener.address,
        abi: chestOpener.abi,
        eventName: 'ChestResults', // We need to add this event to the contract
        args: {
          player: account
        },
        onLogs: (logs) => {
          console.log('Received ChestResults events via watchContractEvent:', logs);
          logs.forEach(log => {
            console.log('Processing log from watchContractEvent:', log);
            handleEvent(log);
          });
        },
        onError: (error) => {
          console.error('Error in ChestResults event listener:', error);
          // Clean up the listener on error
          console.log('Cleaning up ChestResults listener after watchContractEvent error');
          unwatch();
        }
      });
      
      console.log('watchContractEvent setup complete');
      
      const queryExistingEvents = async () => {
        try {
          console.log(
            `Querying existing ChestResults events from block ${startBlock} to latest for player ${account}`
          );
          
          const logs = await publicClient.getLogs({
            address: chestOpener.address,
            event: {
              type: 'event',
              name: 'ChestResults',
              inputs: [
                { indexed: true, name: 'player', type: 'address' },
                { indexed: false, name: 'requestId', type: 'uint256' },
                { indexed: false, name: 'chestType', type: 'uint256' },
                { indexed: false, name: 'rewardId', type: 'uint256' }
              ]
            },
            args: {
              player: account
            },
            fromBlock: startBlock,
            toBlock: 'latest'
          });
          
          console.log('Found', logs.length, 'existing ChestResults events');
          console.log('Logs:', logs);
          
          // Process existing events
          for (const log of logs) {
            try {
              console.log('Processing log:', log);
              
              // The log is already decoded by getLogs, we can use it directly
              const eventData = {
                args: log.args,
                eventName: log.eventName,
                address: log.address,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash
              };
              
              console.log('Event data ready:', eventData);
              handleEvent(eventData);
            } catch (parseErr) {
              console.error('Error processing existing event:', parseErr);
              // Clean up the listener on error
              console.log('Cleaning up ChestResults listener after parsing error');
              unwatch();
            }
          }
        } catch (err) {
          console.error('Error querying existing ChestResults events:', err);
          // Clean up the listener on error
          console.log('Cleaning up ChestResults listener after query error');
          unwatch();
        }
      };
      
      // Query existing events
      queryExistingEvents();
      
      // Return cleanup function
      return () => {
        console.log('Cleaning up ChestResults listener');
        unwatch();
      };
      
    } catch (err) {
      console.error('Failed to set up ChestResults listener:', err);
      return () => {}; // Return no-op cleanup function
    }
  }, [chestOpener, publicClient, account]);

  return {
    ...chestData,
    claimDailyChest,
    openChest,
    getTimeUntilNextChest,
    fetchChestData,
    checkPendingRequests,
    getAllPendingRequests,
    listenForChestResults
  };
};

// Hook for Referral system interactions
export const useReferral = () => {
  const { account } = useAgwEthersAndService();
  const { getContract, publicClient, agwClient } = useContractBase(['PLAYER_STORE']);
  const playerStore = getContract('PLAYER_STORE');
  
  const [referralData, setReferralData] = useState({
    myReferralCode: null,
    sponsor: null,
    canRegisterCode: false,
    referralBpsByLevel: {},
    currentLevel: 0,
    loading: false,
    error: null
  });

  const fetchReferralData = useCallback(async () => {
    if (!playerStore || !account || !publicClient) {
      console.log('🔍 useReferral fetchReferralData: Missing dependencies', { 
        playerStore: !!playerStore, 
        account, 
        publicClient: !!publicClient 
      });
      return;
    }

    console.log('🔍 useReferral: Starting fetchReferralData for account:', account);
    setReferralData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get player profile to check level
      console.log('🔍 useReferral: Fetching profile...');
      const profile = await publicClient.readContract({
        address: playerStore.address,
        abi: playerStore.abi,
        functionName: 'profileOf',
        args: [account],
      });
      console.log('🔍 useReferral: profile fetched:', profile);
      
      // Handle different profile formats
      let currentLevel = 0;
      
      if (profile && Array.isArray(profile)) {
        // If profile is an array, level is at index 1
        currentLevel = profile[1] !== undefined ? Number(profile[1]) : 0;
      } else if (profile && typeof profile === 'object' && profile.level !== undefined) {
        // If profile is an object with level property
        currentLevel = Number(profile.level);
      }
      
      // Get user's referral code
      console.log('🔍 useReferral: Fetching myReferralCode...');
      const myReferralCode = await publicClient.readContract({
        address: playerStore.address,
        abi: playerStore.abi,
        functionName: 'getMyReferralCode',
        args: [account],
      });
      console.log('🔍 useReferral: myReferralCode fetched:', myReferralCode);
      
      // Get user's sponsor
      console.log('🔍 useReferral: Fetching sponsor...');
      const sponsor = await publicClient.readContract({
        address: playerStore.address,
        abi: playerStore.abi,
        functionName: 'getSponsor',
        args: [account],
      });
      console.log('🔍 useReferral: sponsor fetched:', sponsor);
      
      // Check if user can register a referral code (level > 5 and no existing code)
      const canRegisterCode = currentLevel > 5 && myReferralCode === "0x0000000000000000000000000000000000000000000000000000000000000000";
      
      console.log('🔍 useReferral: Processed data:', { 
        currentLevel, 
        canRegisterCode,
        myReferralCode,
        sponsor 
      });
      
      // Get referral rates for different levels
      const referralBps = {};
      for (let level = 0; level <= 15; level++) {
        try {
          const bps = await publicClient.readContract({
            address: playerStore.address,
            abi: playerStore.abi,
            functionName: 'referralBpsByLevel',
            args: [level],
          });
          referralBps[level] = Number(bps);
        } catch (err) {
          referralBps[level] = 0;
        }
      }

      const finalData = {
        myReferralCode: myReferralCode === "0x0000000000000000000000000000000000000000000000000000000000000000" ? null : myReferralCode,
        sponsor: sponsor === "0x0000000000000000000000000000000000000000" ? null : sponsor,
        canRegisterCode,
        referralBpsByLevel: referralBps,
        currentLevel: Number(currentLevel),
        loading: false,
        error: null
      };
      
      console.log('✅ useReferral: Final referral data:', finalData);
      setReferralData(finalData);
    } catch (err) {
      console.error('Failed to fetch referral data:', err);
      setReferralData(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
    }
  }, [playerStore, account, publicClient]);

  const registerReferralCode = useCallback(async (code) => {
    if (!playerStore || !account || !agwClient) return;

    console.log('🚀 useReferral: Starting referral code registration:', code);
    setReferralData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Convert string to bytes32
      const codeBytes32 = ethers.encodeBytes32String(code);
      console.log('🔍 useReferral: Converted code to bytes32:', codeBytes32);
      
      const txHash = await agwClient.writeContract({
        abi: playerStore.abi,
        address: playerStore.address,
        functionName: 'registerMyReferralCode',
        args: [codeBytes32],
      });

      console.log('✅ useReferral: Registration transaction successful:', txHash);
      
      // Refresh data after successful registration
      console.log('🔄 useReferral: Refreshing referral data...');
      await fetchReferralData();
      console.log('✅ useReferral: Referral data refreshed after registration');
      
      return txHash;
    } catch (err) {
      console.error('Failed to register referral code:', err);
      setReferralData(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
      throw err;
    }
  }, [playerStore, account, agwClient, fetchReferralData]);

  const createProfileWithReferral = useCallback(async (name, referralCode = 0) => {
    if (!playerStore || !account || !agwClient) return;

    setReferralData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Convert referralCode to bytes32 if it's a string, otherwise use as-is
      let referralCodeBytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
      if (referralCode && referralCode !== 0) {
        if (typeof referralCode === 'string') {
          referralCodeBytes32 = ethers.encodeBytes32String(referralCode);
        } else {
          referralCodeBytes32 = referralCode;
        }
      }
      const txHash = await agwClient.writeContract({
        abi: playerStore.abi,
        address: playerStore.address,
        functionName: 'createProfile',
        args: [name, referralCodeBytes32],
      });

      // Refresh data after successful profile creation
      await fetchReferralData();
      return txHash;
    } catch (err) {
      console.error('Failed to create profile with referral:', err);
      setReferralData(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
      throw err;
    }
  }, [playerStore, account, agwClient, fetchReferralData]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  return {
    ...referralData,
    registerReferralCode,
    createProfileWithReferral,
    fetchReferralData
  };
};

// Hook for Fishing contract interactions
export const useFishing = () => {
  const { account } = useAgwEthersAndService();
  const { agwClient, publicClient, getContract, handleContractCall, executeWrite } = useContractBase(['FISHING']);
  const fishing = getContract('FISHING');
  
  const [fishingData, setFishingData] = useState({
    loading: false,
    error: null,
    pendingRequests: []
  });

  const craftBait1 = useCallback(async (baitCount) => {
    if (!fishing || !agwClient) return;

    return handleContractCall(async () => {
      const txHash = await agwClient.writeContract({
        abi: fishing.abi,
        address: fishing.address,
        functionName: 'craftBait1',
        args: [baitCount],
      });
      
      return { txHash, isPending: true };
    }, 'crafting bait 1');
  }, [fishing, agwClient, handleContractCall]);

  const craftBait2 = useCallback(async (itemIds, amounts) => {
    if (!fishing || !agwClient) return;

    setFishingData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const txHash = await agwClient.writeContract({
        abi: fishing.abi,
        address: fishing.address,
        functionName: 'craftBait2',
        args: [itemIds, amounts],
      });
      
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash, isPending: true };
    } catch (err) {
      const { message } = handleContractError(err, 'crafting bait 2');
      setFishingData(prev => ({
        ...prev,
        loading: false,
        error: message
      }));
      throw new Error(message);
    }
  }, [fishing, agwClient]);

  const craftBait3 = useCallback(async (itemIds, amounts) => {
    if (!fishing || !agwClient) return;

    setFishingData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const txHash = await agwClient.writeContract({
        abi: fishing.abi,
        address: fishing.address,
        functionName: 'craftBait3',
        args: [itemIds, amounts],
      });
      
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash, isPending: true };
    } catch (err) {
      const { message } = handleContractError(err, 'crafting bait 3');
      setFishingData(prev => ({
        ...prev,
        loading: false,
        error: message
      }));
      throw new Error(message);
    }
  }, [fishing, agwClient]);

  const fish = useCallback(async (baitId, amount = 1) => {
    if (!fishing || !agwClient || !publicClient) return;

    setFishingData(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('Calling fish function with:', { baitId, amount, address: fishing.address });
      
      const result = await executeWrite({
        abi: fishing.abi,
        address: fishing.address,
        functionName: 'fish',
        args: [baitId, amount],
        confirmations: 3,
        pollingInterval: 1000,
        timeout: 120000
      });
      
      setFishingData(prev => ({ ...prev, loading: false }));
      return { 
        txHash: result.txHash, 
        receipt: result.receipt,
        baitId, 
        amount,
        isPending: false 
      };
    } catch (err) {
      console.error('Fish function failed:', err);
      const { message } = handleContractError(err, 'fishing');
      setFishingData(prev => ({
        ...prev,
        loading: false,
        error: message
      }));
      throw new Error(message);
    }
  }, [fishing, agwClient, publicClient, executeWrite]);

  const listenForFishingResults = useCallback(async (requestId, onFishingResults, fromBlock) => {
    if (!fishing || !publicClient || !account) {
      console.error('Fishing contract, publicClient, or account not available');
      return;
    }
    
    try {
      console.log('Setting up FishingResults listener for requestId:', requestId);
      
      // Use a recent block number instead of 'latest' for better reliability
      let startBlock = fromBlock;
      if (!startBlock || startBlock === 'latest') {
        try {
          const currentBlock = await publicClient.getBlockNumber();
          startBlock = BigInt(currentBlock) - BigInt(10); // Look back 10 blocks to be safe
          console.log('Using block', startBlock.toString(), 'as start block (current:', currentBlock.toString(), ')');
        } catch (err) {
          console.error('Failed to get current block number:', err);
          startBlock = 'earliest';
        }
      }
      
      // Event handler function
      const handleEvent = (eventData) => {
        try {
          console.log('FishingResults event received:', eventData);
          
          // Extract event data
          const eventRequestId = eventData.args.requestId.toString();
          const itemIds = eventData.args.itemIds.map(id => id.toString());
          const amounts = eventData.args.amounts.map(amount => amount.toString());
          const baitId = eventData.args.baitId.toString();
          const totalAmount = eventData.args.totalAmount.toString();
          
          console.log('Event requestId:', eventRequestId, 'Expected:', requestId.toString());
        
        // Only process if this is the request we're waiting for
        if (eventRequestId === requestId.toString()) {
            console.log('✅ Found matching FishingResults event!');
          if (onFishingResults) {
              onFishingResults({ 
                requestId: eventRequestId, 
                itemIds, 
                amounts,
                baitId,
                totalAmount
              });
            }
          // Clean up the listener after processing the event
          console.log('Cleaning up FishingResults listener after successful event');
          unwatch();
          }
        } catch (err) {
          console.error('Error processing FishingResults event:', err);
          // Clean up the listener on error
          console.log('Cleaning up FishingResults listener after error');
          unwatch();
        }
      };
      
      // Set up real-time event listener using watchContractEvent
      console.log('Setting up watchContractEvent for FishingResults');
      const unwatch = publicClient.watchContractEvent({
        address: fishing.address,
        abi: fishing.abi,
        eventName: 'FishingResults',
        args: {
          player: account
        },
        onLogs: (logs) => {
          console.log('Received FishingResults events via watchContractEvent:', logs);
          logs.forEach(log => {
            console.log('Processing log from watchContractEvent:', log);
            handleEvent(log);
          });
        },
        onError: (error) => {
          console.error('Error in FishingResults event listener:', error);
          // Clean up the listener on error
          console.log('Cleaning up FishingResults listener after watchContractEvent error');
          unwatch();
        }
      });
      
      console.log('watchContractEvent setup complete');
      
      // Also query for any events that might have already happened
      const queryExistingEvents = async () => {
        try {
          console.log('Querying existing FishingResults events from block:', startBlock);
          
          // Use the contract ABI directly for event filtering
          const logs = await publicClient.getLogs({
            address: fishing.address,
            event: {
              type: 'event',
              name: 'FishingResults',
              inputs: [
                { name: 'player', type: 'address', indexed: true },
                { name: 'requestId', type: 'uint256', indexed: false },
                { name: 'itemIds', type: 'uint256[]', indexed: false },
                { name: 'amounts', type: 'uint256[]', indexed: false },
                { name: 'baitId', type: 'uint256', indexed: false },
                { name: 'totalAmount', type: 'uint16', indexed: false }
              ]
            },
            args: {
              player: account
            },
            fromBlock: startBlock,
            toBlock: 'latest'
          });
          
          console.log('Found', logs.length, 'existing FishingResults events');
          console.log('Logs:', logs);
          
          // Process existing events
          for (const log of logs) {
            try {
              console.log('Processing log:', log);
              
              // The log is already decoded by getLogs, we can use it directly
              const eventData = {
                args: log.args,
                eventName: log.eventName,
                address: log.address,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash
              };
              
              console.log('Event data ready:', eventData);
              handleEvent(eventData);
            } catch (parseErr) {
              console.error('Error processing existing event:', parseErr);
              // Clean up the listener on error
              console.log('Cleaning up FishingResults listener after parsing error');
              unwatch();
            }
          }
        } catch (err) {
          console.error('Error querying existing FishingResults events:', err);
          // Clean up the listener on error
          console.log('Cleaning up FishingResults listener after query error');
          unwatch();
        }
      };
      
      // Query existing events
      queryExistingEvents();
      
      // Return cleanup function
      return () => {
        console.log('Cleaning up FishingResults listener');
        unwatch();
      };
      
    } catch (err) {
      console.error('Failed to set up FishingResults listener:', err);
      return () => {}; // Return no-op cleanup function
    }
  }, [fishing, publicClient, account]);

  const checkPendingRequests = useCallback(async () => {
    if (!fishing || !account || !publicClient) {
      return false;
    }
    try {
      const hasPending = await publicClient.readContract({
        address: fishing.address,
        abi: fishing.abi,
        functionName: 'hasPendingRequests',
        args: [account],
      });
      console.log('hasPending', hasPending);
      return hasPending;
    } catch (err) {
      console.error('Failed to check fishing pending requests:', err);
      return false;
    }
  }, [fishing, account, publicClient]);

  const getAllPendingRequests = useCallback(async () => {
    if (!fishing || !account || !publicClient) {
      return [];
    }

    try {
      const [requestIds, baitIds, levels, amounts] = await publicClient.readContract({
        address: fishing.address,
        abi: fishing.abi,
        functionName: 'getAllPendingRequests',
        args: [account],
      });
      const pendingRequests = [];
      
      for (let i = 0; i < requestIds.length; i++) {
        pendingRequests.push({
          requestId: requestIds[i].toString(),
          baitId: baitIds[i].toString(),
          level: levels[i],
          amount: amounts[i].toString()
        });
      }
      
      return pendingRequests;
    } catch (err) {
      console.error('Failed to get fishing pending requests:', err);
      return [];
    }
  }, [fishing, account, publicClient]);

  return {
    fishingData,
    craftBait1,
    craftBait2,
    craftBait3,
    fish,
    checkPendingRequests,
    getAllPendingRequests,
    listenForFishingResults
  };
};

// Hook for Potion contract interactions
export const usePotion = () => {
  const [potionData, setPotionData] = useState({
    loading: false,
    error: null
  });
  const { getContract, agwClient } = useContractBase(['POTION']);
  const potion = getContract('POTION');

  const craftGrowthElixir = useCallback(async () => {
    if (!potion || !agwClient) return;

    setPotionData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const txHash = await agwClient.writeContract({
        abi: potion.abi,
        address: potion.address,
        functionName: 'craftGrowthElixir',
        args: [],
      });
      
      setPotionData(prev => ({ ...prev, loading: false }));
      return { txHash, isPending: true };
    } catch (err) {
      const { message } = handleContractError(err, 'crafting growth elixir');
      setPotionData(prev => ({
        ...prev,
        loading: false,
        error: message
      }));
      throw new Error(message);
    }
  }, [potion, agwClient]);

  const craftPesticide = useCallback(async () => {
    if (!potion || !agwClient) return;

    setPotionData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const txHash = await agwClient.writeContract({
        abi: potion.abi,
        address: potion.address,
        functionName: 'craftPesticide',
        args: [],
      });
      
      setPotionData(prev => ({ ...prev, loading: false }));
      return { txHash, isPending: true };
    } catch (err) {
      const { message } = handleContractError(err, 'crafting pesticide');
      setPotionData(prev => ({
        ...prev,
        loading: false,
        error: message
      }));
      throw new Error(message);
    }
  }, [potion, agwClient]);

  const craftFertilizer = useCallback(async () => {
    if (!potion || !agwClient) return;

    setPotionData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const txHash = await agwClient.writeContract({
        abi: potion.abi,
        address: potion.address,
        functionName: 'craftFertilizer',
        args: [],
      });
      
      setPotionData(prev => ({ ...prev, loading: false }));
      return { txHash, isPending: true };
    } catch (err) {
      const { message } = handleContractError(err, 'crafting fertilizer');
      setPotionData(prev => ({
        ...prev,
        loading: false,
        error: message
      }));
      throw new Error(message);
    }
  }, [potion, agwClient]);

  const craftGrowthElixirBatch = useCallback(async (count) => {
    if (!potion || !agwClient) return;

    setPotionData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const txHash = await agwClient.writeContract({
        abi: potion.abi,
        address: potion.address,
        functionName: 'craftGrowthElixirBatch',
        args: [count],
      });
      
      setPotionData(prev => ({ ...prev, loading: false }));
      return { txHash, isPending: true };
    } catch (err) {
      const { message } = handleContractError(err, 'crafting growth elixir batch');
      setPotionData(prev => ({
        ...prev,
        loading: false,
        error: message
      }));
      throw new Error(message);
    }
  }, [potion, agwClient]);

  const craftPesticideBatch = useCallback(async (count) => {
    if (!potion || !agwClient) return;

    setPotionData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const txHash = await agwClient.writeContract({
        abi: potion.abi,
        address: potion.address,
        functionName: 'craftPesticideBatch',
        args: [count],
      });
      
      setPotionData(prev => ({ ...prev, loading: false }));
      return { txHash, isPending: true };
    } catch (err) {
      const { message } = handleContractError(err, 'crafting pesticide batch');
      setPotionData(prev => ({
        ...prev,
        loading: false,
        error: message
      }));
      throw new Error(message);
    }
  }, [potion, agwClient]);

  const craftFertilizerBatch = useCallback(async (count) => {
    if (!potion || !agwClient) return;

    setPotionData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const txHash = await agwClient.writeContract({
        abi: potion.abi,
        address: potion.address,
        functionName: 'craftFertilizerBatch',
        args: [count],
      });
      
      setPotionData(prev => ({ ...prev, loading: false }));
      return { txHash, isPending: true };
    } catch (err) {
      const { message } = handleContractError(err, 'crafting fertilizer batch');
      setPotionData(prev => ({
        ...prev,
        loading: false,
        error: message
      }));
      throw new Error(message);
    }
  }, [potion, agwClient]);

  return {
    potionData,
    craftGrowthElixir,
    craftPesticide,
    craftFertilizer,
    craftGrowthElixirBatch,
    craftPesticideBatch,
    craftFertilizerBatch
  };
};

// Hook for RNG_HUB contract interactions
export const useRngHub = () => {
  const { loading, error, agwClient, getContract, handleContractCall } = useContractBase(['RNG_HUB']);
  const rngHub = getContract('RNG_HUB');
  
  const rngHubData = {
    loading,
    error
  };

  const fulfillRequest = useCallback(async (requestId) => {
    if (!rngHub || !agwClient) return;

    const randomNumber = Math.floor(Math.random() * 100000);

    return handleContractCall(async () => {
      const txHash = await agwClient.writeContract({
        abi: rngHub.abi,
        address: rngHub.address,
        functionName: 'fulfillRequest',
        args: [requestId, randomNumber],
      });
      
      return txHash;
    }, 'fulfilling RNG request');
  }, [rngHub, agwClient, handleContractCall]);

  return {
    rngHubData,
    fulfillRequest
  };
};

// Hook for ProduceSeeder contract interactions (TEMPORARY - REMOVE IN PRODUCTION)
export const useProduceSeeder = () => {
  const { loading, error, agwClient, getContract, handleContractCall } = useContractBase(['PRODUCE_SEEDER']);
  const produceSeeder = getContract('PRODUCE_SEEDER');
  
  const produceSeederData = {
    loading,
    error
  };

  const seedAllProduce = useCallback(async (amountEach = 10) => {
    if (!produceSeeder || !agwClient) return;

    return handleContractCall(async () => {
      const txHash = await agwClient.writeContract({
        abi: produceSeeder.abi,
        address: produceSeeder.address,
        functionName: 'seedAllProduce',
        args: [amountEach],
      });
      
      return { txHash, isPending: true };
    }, 'seeding all produce');
  }, [produceSeeder, agwClient, handleContractCall]);

  return {
    produceSeederData,
    seedAllProduce
  };
};

// Hook for P2PMarket contract interactions
export const useP2PMarket = () => {
  const { account } = useAgwEthersAndService();
  const { agwClient, publicClient, getContract, executeWrite } = useContractBase(['P2P_MARKET']);
  const p2pMarket = getContract('P2P_MARKET');
  
  const [marketData, setMarketData] = useState({
    listings: [],
    nextId: 0,
    loading: false,
    error: null
  });

  // Get all marketplace listings
  const getAllListings = useCallback(async () => {
    if (!p2pMarket || !publicClient) {
      return [];
    }

    setMarketData(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('Fetching all marketplace listings...');
      
      // Get nextId to know how many listings exist
      const nextIdResult = await publicClient.readContract({
        address: p2pMarket.address,
        abi: p2pMarket.abi,
        functionName: 'nextId'
      });
      
      const currentNextId = Number(nextIdResult);
      console.log('Next ID:', currentNextId);

      const allListings = [];

      // Fetch all active listings
      for (let i = 1; i <= currentNextId; i++) {
        try {
          const listing = await publicClient.readContract({
            address: p2pMarket.address,
            abi: p2pMarket.abi,
            functionName: 'listings',
            args: [i]
          });
          // Only include active listings
          if (listing[4]) {
            allListings.push({
              lid: i,
              seller: listing[0],
              id: listing[1],
              amount: Number(listing[2]),
              pricePer: Number(listing[3]) / (10 ** 18),
              active: listing[4]
            });
          }
        } catch (err) {
          console.warn(`Failed to fetch listing ${i}:`, err);
        }
      }
      console.log('All listings:', allListings);
      setMarketData(prev => ({ 
        ...prev, 
        listings: allListings, 
        nextId: currentNextId,
        loading: false 
      }));
      return allListings;
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      const { message } = handleContractError(err, 'fetching marketplace listings');
      setMarketData(prev => ({ 
        ...prev, 
        loading: false, 
        error: message 
      }));
      return [];
    }
  }, [p2pMarket, publicClient]);

  // Purchase items from a listing
  const purchase = useCallback(async (lid, amount) => {
    if (!p2pMarket || !agwClient || !account) {
      throw new Error('P2P Market contract, AGW Client, or account not available');
    }

    return await executeWrite({
      abi: p2pMarket.abi,
      address: p2pMarket.address,
      functionName: 'purchase',
      args: [lid, amount],
      confirmations: 1,
      timeout: 120000,
      pollingInterval: 1000
    });
  }, [p2pMarket, agwClient, account, executeWrite]);

  // List items for sale
  const list = useCallback(async (id, amount, pricePer) => {
    if (!p2pMarket || !agwClient || !account) {
      return null;
    }
    console.log(id);
    const pricePerInWei = BigInt(pricePer) * BigInt(10 ** 18);
    return await executeWrite({
      abi: p2pMarket.abi,
      address: p2pMarket.address,
      functionName: 'list',
      args: [id, amount, pricePerInWei],
      confirmations: 1,
      timeout: 120000,
      pollingInterval: 1000
    });
  }, [p2pMarket, agwClient, account, executeWrite]);

  // Cancel a listing
  const cancel = useCallback(async (lid) => {
    if (!p2pMarket || !agwClient || !account) {
      throw new Error('P2P Market contract, AGW Client, or account not available');
    }
    return await executeWrite({
      abi: p2pMarket.abi,
      address: p2pMarket.address,
      functionName: 'cancel',
      args: [lid],
      confirmations: 1,
      timeout: 120000,
      pollingInterval: 1000
    });
  }, [p2pMarket, agwClient, account, executeWrite]);

  // Batch buy items
  const batchBuy = useCallback(async (id, maxPricePer, totalBudget) => {
    if (!p2pMarket || !agwClient || !account) {
      throw new Error('P2P Market contract, AGW Client, or account not available');
    }

    // Convert amounts to wei (18 decimals)
    const maxPricePerInWei = BigInt(maxPricePer) * BigInt(10 ** 18);
    const totalBudgetInWei = BigInt(totalBudget) * BigInt(10 ** 18);
    
    return await executeWrite({
      abi: p2pMarket.abi,
      address: p2pMarket.address,
      functionName: 'batchBuy',
      args: [id, maxPricePerInWei, totalBudgetInWei],
      confirmations: 1,
      timeout: 120000,
      pollingInterval: 1000
    });
  }, [p2pMarket, agwClient, account, executeWrite]);

  // Send items to another address
  const send = useCallback(async (id, to, amount) => {
    if (!p2pMarket || !agwClient || !account) {
      throw new Error('P2P Market contract, AGW Client, or account not available');
    }

    return await executeWrite({
      abi: p2pMarket.abi,
      address: p2pMarket.address,
      functionName: 'send',
      args: [id, to, amount],
      confirmations: 1,
      timeout: 120000,
      pollingInterval: 1000
    });
  }, [p2pMarket, agwClient, account, executeWrite]);

  return {
    marketData,
    getAllListings,
    purchase,
    list,
    cancel,
    batchBuy,
    send
  };
};

// Hook for Equipment Registry contract interactions
export const useEquipmentRegistry = () => {
  const { account } = useAgwEthersAndService();
  const { agwClient, publicClient, getContract, executeWrite } = useContractBase(['EQUIPMENT_REGISTRY', 'BOOST_NFT']);
  const equipmentRegistry = getContract('EQUIPMENT_REGISTRY');
  
  const equipmentRegistryData = {
    loading: false,
    error: null
  };

  // Random mint function
  const randomMint = useCallback(async () => {
    if (!equipmentRegistry || !agwClient || !account) {
      throw new Error('Equipment Registry contract, AGW Client, or account not available');
    }

    return await executeWrite({
      abi: equipmentRegistry.abi,
      address: equipmentRegistry.address,
      functionName: 'randomMint',
      args: [],
      confirmations: 1,
      timeout: 120000,
      pollingInterval: 1000
    });
  }, [equipmentRegistry, agwClient, account, executeWrite]);

  // Get token boost for a player
  const getTokenBoostPpm = useCallback(async (player) => {
    if (!equipmentRegistry || !publicClient) {
      return null;
    }

    return publicClient.readContract({
      abi: equipmentRegistry.abi,
      address: equipmentRegistry.address,
      functionName: 'getTokenBoostPpm',
      args: [player]
    });
  }, [equipmentRegistry, publicClient]);

  // Get avatars for a player
  const getAvatars = useCallback(async (player) => {
    if (!equipmentRegistry || !publicClient) {
      return null;
    }

    return publicClient.readContract({
      abi: equipmentRegistry.abi,
      address: equipmentRegistry.address,
      functionName: 'getAvatars',
      args: [player]
    });
  }, [equipmentRegistry, publicClient]);

  // Set avatar in slot
  const setAvatar = useCallback(async (slot, nft, tokenId) => {
    if (!equipmentRegistry || !agwClient || !account) {
      throw new Error('Equipment Registry contract, AGW Client, or account not available');
    }

    return await executeWrite({
      abi: equipmentRegistry.abi,
      address: equipmentRegistry.address,
      functionName: 'setAvatar',
      args: [slot, nft, tokenId],
      confirmations: 1,
      timeout: 120000,
      pollingInterval: 1000
    });
  }, [equipmentRegistry, agwClient, account, executeWrite]);

  // Clear avatar from slot
  const clearAvatar = useCallback(async (slot) => {
    if (!equipmentRegistry || !agwClient || !account) {
      throw new Error('Equipment Registry contract, AGW Client, or account not available');
    }

    return await executeWrite({
      abi: equipmentRegistry.abi,
      address: equipmentRegistry.address,
      functionName: 'clearAvatar',
      args: [slot],
      confirmations: 1,
      timeout: 120000,
      pollingInterval: 1000
    });
  }, [equipmentRegistry, agwClient, account, executeWrite]);

  // Get NFT metadata by token ID
  const getNFTMetadata = useCallback(async (tokenId) => {
    if (!equipmentRegistry || !publicClient) {
      return null;
    }

    try {
      // Get the BoostNFT contract
      const boostNFT = getContract('BOOST_NFT');
      if (!boostNFT) {
        throw new Error('BoostNFT contract not available');
      }

      // Fetch token metadata from tokenURI
      const tokenURI = await publicClient.readContract({
        address: boostNFT.address,
        abi: boostNFT.abi,
        functionName: 'tokenURI',
        args: [tokenId]
      });

      const tokenData = await fetch(tokenURI);
      const tokenDataJson = await tokenData.json();
      
      // Parse the token metadata
      const name = tokenDataJson.name || `Character #${tokenId}`;
      const image = tokenDataJson.image || '';
      const description = tokenDataJson.description || '';
      
      // Extract boost values from attributes
      let boostPpm = 0;
      let boostPercentage = 0;
      
      if (tokenDataJson.attributes && Array.isArray(tokenDataJson.attributes)) {
        const boostAttribute = tokenDataJson.attributes.find(attr => 
          attr.trait_type === 'Boost (ppm)' || attr.trait_type === 'Boost (%)'
        );
        
        if (boostAttribute) {
          if (boostAttribute.trait_type === 'Boost (ppm)') {
            boostPpm = Number(boostAttribute.value);
            boostPercentage = boostPpm / 1000; // Convert ppm to percentage
          } else if (boostAttribute.trait_type === 'Boost (%)') {
            boostPercentage = Number(boostAttribute.value);
            boostPpm = boostPercentage * 1000; // Convert percentage to ppm
          }
        }
      }

      return {
        tokenId,
        name,
        image,
        description,
        boostPpm,
        boostPercentage,
        tokenURI
      };
    } catch (err) {
      console.error('Failed to fetch NFT metadata:', err);
      return null;
    }
  }, [equipmentRegistry, publicClient, getContract]);

  // Get owned BoostNFTs for a player
  const getOwnedBoostNFTs = useCallback(async (player) => {
    if (!equipmentRegistry || !publicClient) {
      console.log('Equipment registry or public client not available');
      return [];
    }

    try {
      // Get the BoostNFT contract
      const boostNFT = getContract('BOOST_NFT');
      if (!boostNFT) {
        throw new Error('BoostNFT contract not available');
      }

      // Get nextId to know how many NFTs exist (total supply = nextId - 1)
      const nextId = await publicClient.readContract({
        address: boostNFT.address,
        abi: boostNFT.abi,
        functionName: 'nextId'
      });

      const totalSupply = Number(nextId) - 1;
      console.log('Total supply from nextId:', totalSupply);

      const nfts = [];
      
      // Check each token ID to see if player owns it
      for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
        try {
          const owner = await publicClient.readContract({
            address: boostNFT.address,
            abi: boostNFT.abi,
            functionName: 'ownerOf',
            args: [tokenId]
          });

          if (owner.toLowerCase() === player.toLowerCase()) {
            const metadata = await getNFTMetadata(tokenId);
            if (metadata) {
              nfts.push(metadata);
            }
          }
        } catch (err) {
          // Token might not exist or player doesn't own it, skip
          console.warn(`Failed to fetch token ${tokenId}:`, err);
        }
      }
      return nfts;
    } catch (err) {
      console.error('Failed to fetch owned BoostNFTs:', err);
      // Return empty array instead of null for better error handling
      return [];
    }
  }, [equipmentRegistry, publicClient, getContract, getNFTMetadata]);

  return {
    equipmentRegistryData,
    randomMint,
    getTokenBoostPpm,
    getAvatars,
    setAvatar,
    clearAvatar,
    getNFTMetadata,
    getOwnedBoostNFTs,
    getContract
  };
};


