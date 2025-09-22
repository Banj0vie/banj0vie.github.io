/* global BigInt */
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAgwEthersAndService } from '../hooks/useAgwEthersAndService';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, SAGE_UNLOCK_RATES, SAGE_UNLOCK_COOLDOWN } from '../config/contracts';

export const useContracts = () => {
  const { provider, signer, isConnected, contractService } = useAgwEthersAndService();
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
  const { account, contractService } = useAgwEthersAndService();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [yieldToken, setYieldToken] = useState(null);
  const [rngHub, setRngHub] = useState(null);
  const [agwClient, setAgwClient] = useState(null);
  const [publicClient, setPublicClient] = useState(null);

  useEffect(() => {
    if (!contractService) return;
    setVendor(contractService.getContract('VENDOR'));
    setYieldToken(contractService.getContract('YIELD_TOKEN'));
    setRngHub(contractService.getContract('RNG_HUB'));
    setAgwClient(contractService.agwClient);
    setPublicClient(contractService.publicClient);
  }, [contractService]);

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
      
      // 4. Use AGW for transaction
      const txHash = await agwClient.writeContract({
        abi: vendor.abi,
        address: vendor.address,
        functionName: 'buySeedPack',
        args: [tier, count],
      });
      
      return { txHash, tier, isPending: true };
    } catch (err) {
      console.error('Failed to buy seed pack:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [vendor, yieldToken, agwClient, publicClient, account]);

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

  const fulfillPendingRequest = useCallback(async (requestId) => {
    if (!rngHub || !agwClient) {
      setError('RNG Hub contract not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const randomNumber = Math.floor(Math.random() * 100000);
      const txHash = await agwClient.writeContract({
        abi: rngHub.abi,
        address: rngHub.address,
        functionName: 'fulfillRequest',
        args: [requestId, randomNumber],
      });
      return txHash;
    } catch (err) {
      console.error('Failed to fulfill pending request:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [rngHub, agwClient]);

  const listenForSeedsRevealed = useCallback(async (requestId, onSeedsRevealed, fromBlock) => {
    if (!vendor || !publicClient) {
      console.error('Vendor contract not available');
      return;
    }
    try {
      // Note: Event listening with viem publicClient is different from ethers
      // This is a simplified version - you may need to implement proper event listening
      // based on your specific requirements
      console.log('Event listening setup for SeedsRevealed event');
      
      // For now, return a no-op cleanup function
      // You'll need to implement proper event listening with viem
      return () => {
        console.log('Cleaning up SeedsRevealed listener');
      };
    } catch (err) {
      console.error('Failed to set up SeedsRevealed listener:', err);
    }
  }, [vendor, publicClient]);

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
export const useFarming = () => {
  const { contractService } = useAgwEthersAndService();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [farming, setFarming] = useState(null);
  const [agwClient, setAgwClient] = useState(null);
  const [publicClient, setPublicClient] = useState(null);

  useEffect(() => {
    if (!contractService) return;
    setFarming(contractService.getContract('FARMING'));
    setAgwClient(contractService.agwClient);
    setPublicClient(contractService.publicClient);
  }, [contractService]);

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
      
      console.log('🚀 getCrop result:', { userAddress, plotIndex, crop });
      
      // Handle case where crop is undefined or doesn't have expected structure
      if (!crop) {
        console.warn('Crop is undefined for plot:', plotIndex);
        return {
          seedId: "0",
          endTime: 0
        };
      }
      
      // Handle case where crop is an array (tuple format)
      if (Array.isArray(crop)) {
        return {
          seedId: crop[0] ? crop[0].toString() : "0",
          endTime: crop[1] ? Number(crop[1]) : 0
        };
      }
      
      // Handle case where crop is an object
      if (crop.seedId !== undefined && crop.endTime !== undefined) {
        return {
          seedId: crop.seedId.toString(),
          endTime: Number(crop.endTime)
        };
      }
      
      // Fallback for unexpected structure
      console.warn('Unexpected crop structure:', crop);
      return {
        seedId: "0",
        endTime: 0
      };
    } catch (err) {
      console.error('Failed to get crop:', err);
      return null;
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
  const { account, contractService } = useAgwEthersAndService();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [banker, setBanker] = useState(null);
  const [yieldToken, setYieldToken] = useState(null);
  const [agwClient, setAgwClient] = useState(null);
  const [publicClient, setPublicClient] = useState(null);

  useEffect(() => {
    if (!contractService) return;
    setBanker(contractService.getContract('BANKER'));
    setYieldToken(contractService.getContract('YIELD_TOKEN'));
    setAgwClient(contractService.agwClient);
    setPublicClient(contractService.publicClient);
  }, [contractService]);

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

  const { account, contractService } = useAgwEthersAndService();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ethBalance, setEthBalance] = useState('0.00');
  const [honeyBalance, setHoneyBalance] = useState('0.00');
  const [dex, setDex] = useState(null);
  const [agwClient, setAgwClient] = useState(null);
  const [publicClient, setPublicClient] = useState(null);

  useEffect(() => {
    if (!contractService) return;
    setDex(contractService.getContract('DEX'));
    setAgwClient(contractService.agwClient);
    setPublicClient(contractService.publicClient);
  }, [contractService]);

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
      const balance = await publicClient.getBalance({account});
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
    
    const yieldToken = contractService.getContract('YIELD_TOKEN');
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
  }, [account, publicClient, contractService]);

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
  const { account, contractService } = useAgwEthersAndService();
  const [playerStore, setPlayerStore] = useState(null);
  const [publicClient, setPublicClient] = useState(null);
  const [agwClient, setAgwClient] = useState(null);

  useEffect(() => {
    if (!contractService) return;
    setPlayerStore(contractService.getContract('PLAYER_STORE'));
    setPublicClient(contractService.publicClient);
    setAgwClient(contractService.agwClient);
  }, [contractService]);
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

      // Get user's XP if connected (always use current total XP)
      if (account && playerStore) {
        try {
          const userXp = await publicClient.readContract({
            address: playerStore.address,
            abi: playerStore.abi,
            functionName: 'xpOf',
            args: [account],
          });
          setUserScore(parseFloat(userXp.toString()));
        } catch (err) {
          console.log('Could not fetch user XP:', err);
          setUserScore(0);
        }
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
  const { account, contractService } = useAgwEthersAndService();
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
  const [sage, setSage] = useState(null);
  const [playerStore, setPlayerStore] = useState(null);
  const [agwClient, setAgwClient] = useState(null);
  const [publicClient, setPublicClient] = useState(null);

  useEffect(() => {
    if (!contractService) return;
    setSage(contractService.getContract('SAGE'));
    setPlayerStore(contractService.getContract('PLAYER_STORE'));
    setAgwClient(contractService.agwClient);
    setPublicClient(contractService.publicClient);
  }, [contractService]);

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

      // Check cooldowns for both functions
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
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sage, agwClient, sageData.canUnlockWage, fetchSageData]);

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
  const { account, contractService } = useAgwEthersAndService();
  const [gardener, setGardener] = useState(null);
  const [playerStore, setPlayerStore] = useState(null);
  const [yieldToken, setYieldToken] = useState(null);
  const [agwClient, setAgwClient] = useState(null);
  const [publicClient, setPublicClient] = useState(null);

  useEffect(() => {
    if (!contractService) return;
    setGardener(contractService.getContract('GARDENER'));
    setPlayerStore(contractService.getContract('PLAYER_STORE'));
    setYieldToken(contractService.getContract('YIELD_TOKEN'));
    setAgwClient(contractService.agwClient);
    setPublicClient(contractService.publicClient);
  }, [contractService]);
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
      setGardenerData(prev => ({
        ...prev,
        loading: false,
        error: err.message
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
      console.error('Error details:', {
        targetLevel,
        account,
        gardenerAddress: gardener.address,
        error: err.message
      });
      setGardenerData(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
      throw err;
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
  const { account, contractService } = useAgwEthersAndService();
  const [chestOpener, setChestOpener] = useState(null);
  const [playerStore, setPlayerStore] = useState(null);
  const [agwClient, setAgwClient] = useState(null);
  const [publicClient, setPublicClient] = useState(null);

  useEffect(() => {
    if (!contractService) return;
    setChestOpener(contractService.getContract('CHEST_OPENER'));
    setPlayerStore(contractService.getContract('PLAYER_STORE'));
    setAgwClient(contractService.agwClient);
    setPublicClient(contractService.publicClient);
  }, [contractService]);
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
      return txHash;
    } catch (err) {
      console.error('Failed to claim daily chest:', err);
      setChestData(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
      throw err;
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

      return txHash;
    } catch (err) {
      console.error('Failed to open chest:', err);
      setChestData(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
      throw err;
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

  return {
    ...chestData,
    claimDailyChest,
    openChest,
    getTimeUntilNextChest,
    fetchChestData
  };
};

// Hook for Referral system interactions
export const useReferral = () => {
  const { account, contractService } = useAgwEthersAndService();
  const [playerStore, setPlayerStore] = useState(null);
  const [agwClient, setAgwClient] = useState(null);
  const [publicClient, setPublicClient] = useState(null);

  useEffect(() => {
    if (!contractService) return;
    setPlayerStore(contractService.getContract('PLAYER_STORE'));
    setAgwClient(contractService.agwClient);
    setPublicClient(contractService.publicClient);
  }, [contractService]);
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

