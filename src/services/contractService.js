/* global BigInt */
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../config/contracts';
import { parseAbi } from 'viem';

class ContractService {
  constructor(publicClient, agwClient) {
    this.publicClient = publicClient;
    this.agwClient = agwClient;
    this.contracts = {};
  }

  // Get contract instance for a given contract name
  getContract(contractName) {
    if (this.contracts[contractName]) return this.contracts[contractName]

    const address = CONTRACT_ADDRESSES.ABSTRACT_TESTNET[contractName]
    const abi = parseAbi(CONTRACT_ABIS[contractName])
    if (!address || !abi) {
      throw new Error(`Contract ${String(contractName)} not found in configuration`)
    }
    const cached = { address, abi }
    this.contracts[contractName] = cached
    return cached
  }

  // Player Store functions
  async createProfile(username, referralCode = "") {
    try {
      // Prefer AGW client if available for sponsored/account-abstracted writes
      if (this.agwClient) {
        const abi = parseAbi(CONTRACT_ABIS.PLAYER_STORE);
        // Convert referral to bytes32
        let referralCodeBytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
        if (referralCode && referralCode.toString().trim() !== "") {
          referralCodeBytes32 = ethers.encodeBytes32String(referralCode.toString().trim());
        }
        const txHash = await this.agwClient.writeContract({
          abi,
          address: CONTRACT_ADDRESSES.ABSTRACT_TESTNET.PLAYER_STORE,
          functionName: 'createProfile',
          args: [username, referralCodeBytes32],
        });
        return txHash;
      }

      // Fallback to ethers signer path
      throw new Error('AGW client not available for profile creation');
      
    } catch (error) {
      console.error('Error creating profile:', error);
      
      // Provide more specific error messages
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction');
      } else if (error.message.includes('user rejected')) {
        throw new Error('Transaction rejected by user');
      } else if (error.message.includes('Wrong network')) {
        throw error;
      } else {
        throw new Error(`Profile creation failed: ${error.message}`);
      }
    }
  }

  async getUsername(address) {
    try {
      // First check if the user has a profile
      const hasProfile = await this.hasProfile(address);
      if (!hasProfile) {
        console.log('🔍 ContractService: User has no profile, returning null for username');
        return null;
      }

      const playerStore = this.getContract('PLAYER_STORE');
      const username = await this.publicClient.readContract({
        address: playerStore.address,
        abi: playerStore.abi,
        functionName: 'usernameOf',
        args: [address],
      });
      return username;
    } catch (error) {
      console.warn('Failed to get username for address:', address, error);
      return null;
    }
  }

  async getProfile(address) {
    try {
      const playerStore = this.getContract('PLAYER_STORE');
      try {
        const profile = await this.publicClient.readContract({
          address: playerStore.address,
          abi: playerStore.abi,
          functionName: 'profileOf',
          args: [address],
        })
        return {
          exists: profile[0],
          level: profile[1],
          nextChestAt: profile[2],
          nextFishAt: profile[3]
        };
      } catch (contractError) {
        if (contractError.message.includes('BAD_DATA') || contractError.message.includes('0x')) {
          console.warn('PlayerStore contract not deployed or wrong address');
          // it should disco
          return {
            exists: false,
            level: 0,
            nextChestAt: 0,
            nextFishAt: 0
          };
        }
        throw contractError;
      }
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  }

  async getXP(address) {
    try {
      const playerStore = this.getContract('PLAYER_STORE');
      
      // First check if profile exists
      const profile = await this.publicClient.readContract({
        address: playerStore.address,
        abi: playerStore.abi,
        functionName: 'profileOf',
        args: [address],
      })
      if (!profile[0]) { // profile[0] is exists
        return 0; // No profile = 0 XP
      }
      
      const xp = await this.publicClient.readContract({
        address: playerStore.address,
        abi: playerStore.abi,
        functionName: 'xpOf',
        args: [address],
      })
      return xp;
    } catch (error) {
      console.error('Error getting XP:', error);
      // If error is "no profile", return 0
      if (error.message.includes('no profile')) {
        return 0;
      }
      throw error;
    }
  }

  // Yield Token functions
  async getYieldBalance(address) {
    try {
      const yieldToken = this.getContract('YIELD_TOKEN');
      const balance = await this.publicClient.readContract({
        address: yieldToken.address,
        abi: yieldToken.abi,
        functionName: 'balanceOf',
        args: [address],
      })
      return balance;
    } catch (error) {
      console.error('Error getting yield balance:', error);
      throw error;
    }
  }

  // DEX functions
  async swapETHForYield(ethAmount) {
    try {
      const dex = this.getContract('DEX');
      const tx = await this.agwClient.writeContract({
        abi: dex.abi,
        address: dex.address,
        functionName: 'swapETHForYield',
        args: [ethers.parseEther(ethAmount.toString())],
      })
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error swapping ETH for Yield:', error);
      throw error;
    }
  }

  // Check if user has a profile
  async hasProfile(address) {
    try {
      const profile = await this.getProfile(address);
      return profile.exists;
    } catch (error) {
      console.error('Error checking profile existence:', error);
      return false;
    }
  }

  // Sage functions
  async getLockedGameToken(address) {
    try {
      const sage = this.getContract('SAGE');
      const lockedGameToken = await this.publicClient.readContract({
        address: sage.address,
        abi: sage.abi,
        functionName: 'lockedGameToken',
        args: [address],
      })
      return lockedGameToken;
    } catch (error) {
      console.error('Error getting locked yield:', error);
      throw error;
    }
  }

  async getLastUnlockTime(address) {
    try {
      const sage = this.getContract('SAGE');
      const lastUnlockTime = await this.publicClient.readContract({
        address: sage.address,
        abi: sage.abi,
        functionName: 'lastUnlockTime',
        args: [address],
      })
      return lastUnlockTime;
    } catch (error) {
      console.error('Error getting last unlock time:', error);
      throw error;
    }
  }

  async unlockYield() {
    try {
      const sage = this.getContract('SAGE');
      const tx = await this.agwClient.writeContract({
        abi: sage.abi,
        address: sage.address,
        functionName: 'unlockYield',
      })
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error unlocking yield:', error);
      throw error;
    }
  }

  // Farming functions
  async getUserCrops(address) {
    try {
      const farming = this.getContract('FARMING');
      const crops = await this.publicClient.readContract({
        address: farming.address,
        abi: farming.abi,
        functionName: 'getUserCrops',
        args: [address],
      })
      // Convert tuple arrays to objects for compatibility
      return crops.map(crop => ({
        seedId: crop[0],
        endTime: crop[1]
      }));
    } catch (error) {
      console.error('Error getting user crops:', error);
      throw error;
    }
  }

  async getMaxPlots(address) {
    try {
      const farming = this.getContract('FARMING');
      const maxPlots = await this.publicClient.readContract({
        address: farming.address,
        abi: farming.abi,
        functionName: 'getMaxPlots',
        args: [address],
      })
      return maxPlots;
    } catch (error) {
      console.error('Error getting max plots:', error);
      throw error;
    }
  }

  async getGrowthTime(seedId) {
    try {
      const farming = this.getContract('FARMING');
      const growthTime = await this.publicClient.readContract({
        address: farming.address,
        abi: farming.abi,
        functionName: 'getGrowthTime',
        args: [seedId],
      })
      return growthTime;
    } catch (error) {
      console.error('Error getting growth time:', error);
      throw error;
    }
  }

  async plantSeed(seedId, plotNumber) {
    try {
      const farming = this.getContract('FARMING');
      
      // Check if user has the seed item first
      const items = this.getContract('ITEMS_1155');
      const userAddress = await this.signer.getAddress();
      const balance = await this.publicClient.readContract({
        address: items.address,
        abi: items.abi,
        functionName: 'balanceOf',
        args: [userAddress, seedId],
      })
      if (balance === 0n) {
        throw new Error(`You don't have seed with ID ${seedId}`);
      }

      // Check that the plot is empty
      try {
        const existing = await farming.crops(userAddress, plotNumber);
        if (existing && (existing.seedId ?? 0n) !== 0n) {
          throw new Error(`Plot ${plotNumber} is already occupied`);
        }
      } catch (readErr) {
        // If reading crops fails, continue and let the tx revert rather than blocking
        console.warn('Could not read crop slot before planting:', readErr);
      }

      // Estimate gas first
      const gasEstimate = await farming.plant.estimateGas(seedId, plotNumber);
      const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer

      const tx = await this.agwClient.writeContract({
        abi: farming.abi,
        address: farming.address,
        functionName: 'plant',
        args: [seedId, plotNumber],
        gasLimit: gasLimit,
      })
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error planting seed:', error);
      throw error;
    }
  }

  async plantSeedsBatch(seedIds, plotNumbers) {
    try {
      const farming = this.getContract('FARMING');
      const userAddress = await this.signer.getAddress();
      
      // Validate inputs
      if (seedIds.length !== plotNumbers.length) {
        throw new Error('Seed IDs and plot numbers arrays must have the same length');
      }

      // Check if user has all the seed items first
      const items = this.getContract('ITEMS_1155');
      for (const seedId of seedIds) {
        const balance = await this.publicClient.readContract({
          address: items.address,
          abi: items.abi,
          functionName: 'balanceOf',
          args: [userAddress, seedId],
        })
        if (balance === 0n) {
          throw new Error(`You don't have seed with ID ${seedId}`);
        }
      }

      // Check current crops to avoid conflicts
      const currentCrops = await this.getUserCrops(userAddress);
      for (let i = 0; i < plotNumbers.length; i++) {
        const plotNumber = plotNumbers[i];
        if (plotNumber < currentCrops.length && currentCrops[plotNumber].seedId !== 0n) {
          throw new Error(`Plot ${plotNumber} is already occupied`);
        }
      }

      // Estimate gas first
      const gasEstimate = await farming.plantBatch.estimateGas(seedIds, plotNumbers);
      const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer

      const tx = await this.agwClient.writeContract({
        abi: farming.abi,
        address: farming.address,
        functionName: 'plantBatch',
        args: [seedIds, plotNumbers],
        gasLimit: gasLimit,
      })
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error planting seeds batch:', error);
      throw error;
    }
  }

  async harvestCrop(slot) {
    try {
      const farming = this.getContract('FARMING');
      
      // Estimate gas first
      const gasEstimate = await farming.harvest.estimateGas(slot);
      const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer

      const tx = await this.agwClient.writeContract({
        abi: farming.abi,
        address: farming.address,
        functionName: 'harvest',
        args: [slot],
        gasLimit: gasLimit,
      })
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error harvesting crop:', error);
      throw error;
    }
  }

  async harvestAll() {
    try {
      const farming = this.getContract('FARMING');
      
      // Estimate gas first
      const gasEstimate = await farming.harvestAll.estimateGas();
      const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer

      const tx = await this.agwClient.writeContract({
        abi: farming.abi,
        address: farming.address,
        functionName: 'harvestAll',
        gasLimit: gasLimit,
      })
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error harvesting all crops:', error);
      throw error;
    }
  }

  async harvestMany(slots) {
    try {
      const farming = this.getContract('FARMING');
      
      // Estimate gas first
      const gasEstimate = await farming.harvestMany.estimateGas(slots);
      const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer

      const tx = await this.agwClient.writeContract({
        abi: farming.abi,
        address: farming.address,
        functionName: 'harvestMany',
        args: [slots],
        gasLimit: gasLimit,
      })
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error harvesting many crops:', error);
      throw error;
    }
  }

  // Items functions
  async getItemBalance(address, itemId) {
    try {
      const items = this.getContract('ITEMS_1155');
      const balance = await this.publicClient.readContract({
        address: items.address,
        abi: items.abi,
        functionName: 'balanceOf',
        args: [address, itemId],
      })
      return balance;
    } catch (error) {
      console.error('Error getting item balance:', error);
      throw error;
    }
  }

  // Calculate harvest rewards for a seed
  async calculateHarvestRewards(seedId, userAddress) {
    try {
      // Get user level
      const profile = await this.getProfile(userAddress);
      const level = profile.level;
      
      // Calculate based on seed tier and multiplier
      // These calculations should match the smart contract logic
      const seedPrice = this.getSeedPrice(seedId);
      const multiplier = this.getMultiplier(seedId, level);
      
      const unlockedAmount = (seedPrice * multiplier) / 1000n;
      const lockedAmount = unlockedAmount; // Equal amounts as per contract
      
      return {
        unlockedAmount: unlockedAmount.toString(),
        lockedAmount: lockedAmount.toString()
      };
    } catch (error) {
      console.error('Error calculating harvest rewards:', error);
      return {
        unlockedAmount: "0",
        lockedAmount: "0"
      };
    }
  }

  // Helper method to get seed price (matching contract logic)
  getSeedPrice(seedId) {
    const catByte = BigInt(seedId) >> 248n; // high-order category byte (1..4)
    
    if (catByte === 1n) return 1000000000000000000n; // Feeble 1e18
    if (catByte === 2n) return 20000000000000000000n; // Pico 20e18
    if (catByte === 3n) return 100000000000000000000n; // Basic 100e18
    if (catByte === 4n) return 250000000000000000000n; // Premium 250e18
    return 0n;
  }

  // Helper method to get multiplier (matching contract logic)
  getMultiplier(seedId, level) {
    const id = BigInt(seedId) & 0xFFn;
    
    if (id === 1n) return this.getCommonMultiplier(level);
    if (id === 2n) return this.getUncommonMultiplier(level);
    if (id === 3n) return this.getRareMultiplier(level);
    if (id === 4n) return this.getEpicMultiplier(level);
    if (id === 5n) return this.getLegendaryMultiplier(level);
    return 1000n; // 1x default
  }

  getCommonMultiplier(level) {
    if (level <= 3) return 500n;
    if (level <= 11) return 510n;
    return 520n;
  }

  getUncommonMultiplier(level) {
    if (level <= 2) return 900n;
    if (level <= 6) return 910n;
    if (level <= 11) return 920n;
    return 930n;
  }

  getRareMultiplier(level) {
    if (level <= 1) return 1200n;
    if (level <= 5) return 1210n;
    if (level <= 8) return 1220n;
    if (level <= 11) return 1230n;
    if (level <= 14) return 1240n;
    return 1250n;
  }

  getEpicMultiplier(level) {
    if (level <= 1) return 2000n;
    if (level <= 3) return 2010n;
    if (level <= 5) return 2020n;
    if (level <= 7) return 2030n;
    if (level <= 9) return 2040n;
    if (level <= 11) return 2050n;
    if (level <= 13) return 2060n;
    if (level <= 14) return 2070n;
    return 2080n;
  }

  getLegendaryMultiplier(level) {
    return 5400n + (BigInt(level) * 20n); // 5400 to 5600
  }

  // Additional methods needed by GameStateContext
  async getEthBalance(address) {
    try {
      const balance = await this.publicClient.getBalance({ address });
      return balance;
    } catch (error) {
      console.error('Error getting ETH balance:', error);
      throw error;
    }
  }

  async getCrops(address, plotIndex) {
    try {
      const farming = this.getContract('FARMING');
      const crop = await this.publicClient.readContract({
        address: farming.address,
        abi: farming.abi,
        functionName: 'crops',
        args: [address, plotIndex],
      });
      // Convert tuple to object for compatibility
      return {
        seedId: crop[0],
        endTime: crop[1]
      };
    } catch (error) {
      console.error('Error getting crop:', error);
      throw error;
    }
  }

  // Additional farming methods
  async buySeedPack(tier, count) {
    try {
      const vendor = this.getContract('VENDOR');
      const tx = await this.agwClient.writeContract({
        abi: vendor.abi,
        address: vendor.address,
        functionName: 'buySeedPack',
        args: [tier, count],
      });
      return tx;
    } catch (error) {
      console.error('Error buying seed pack:', error);
      throw error;
    }
  }

  async fulfillRequest(requestId, randomNumber) {
    try {
      const rngHub = this.getContract('RNG_HUB');
      const tx = await this.agwClient.writeContract({
        abi: rngHub.abi,
        address: rngHub.address,
        functionName: 'fulfillRequest',
        args: [requestId, randomNumber],
      });
      return tx;
    } catch (error) {
      console.error('Error fulfilling request:', error);
      throw error;
    }
  }

  async stake(amount) {
    try {
      const banker = this.getContract('BANKER');
      const tx = await this.agwClient.writeContract({
        abi: banker.abi,
        address: banker.address,
        functionName: 'stake',
        args: [amount],
      });
      return tx;
    } catch (error) {
      console.error('Error staking:', error);
      throw error;
    }
  }

  async unstake(shares) {
    try {
      const banker = this.getContract('BANKER');
      const tx = await this.agwClient.writeContract({
        abi: banker.abi,
        address: banker.address,
        functionName: 'unstake',
        args: [shares],
      });
      return tx;
    } catch (error) {
      console.error('Error unstaking:', error);
      throw error;
    }
  }

  async getStakedBalance(address) {
    try {
      const banker = this.getContract('BANKER');
      const balance = await this.publicClient.readContract({
        address: banker.address,
        abi: banker.abi,
        functionName: 'balanceOf',
        args: [address],
      });
      return balance;
    } catch (error) {
      console.error('Error getting staked balance:', error);
      throw error;
    }
  }

  async unlockWeeklyHarvest() {
    try {
      const sage = this.getContract('SAGE');
      const tx = await this.agwClient.writeContract({
        abi: sage.abi,
        address: sage.address,
        functionName: 'unlockWeeklyHarvest',
      });
      return tx;
    } catch (error) {
      console.error('Error unlocking weekly harvest:', error);
      throw error;
    }
  }

  async unlockWeeklyWage() {
    try {
      const sage = this.getContract('SAGE');
      const tx = await this.agwClient.writeContract({
        abi: sage.abi,
        address: sage.address,
        functionName: 'unlockWeeklyWage',
      });
      return tx;
    } catch (error) {
      console.error('Error unlocking weekly wage:', error);
      throw error;
    }
  }
}

export default ContractService;
