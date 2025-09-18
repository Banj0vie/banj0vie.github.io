/* global BigInt */
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../config/contracts';

class ContractService {
  constructor(provider, signer, chainId, disconnect) {
    this.provider = provider;
    this.signer = signer;
    this.chainId = chainId;
    this.contracts = {};
    
    this.disconnect = disconnect;
  }

  // Get contract instance for a given contract name
  getContract(contractName) {
    if (this.contracts[contractName]) {
      return this.contracts[contractName];
    }

    const contractAddress = CONTRACT_ADDRESSES.ABSTRACT_TESTNET[contractName];
    const contractABI = CONTRACT_ABIS[contractName];

    if (!contractAddress || !contractABI) {
      throw new Error(`Contract ${contractName} not found in configuration`);
    }

    const contract = new ethers.Contract(contractAddress, contractABI, this.signer);
    this.contracts[contractName] = contract;
    return contract;
  }

  // Player Store functions
  async createProfile(username, referralCode = "") {
    try {
      const playerStore = this.getContract('PLAYER_STORE');
      
      // First check if we're on the correct network
      const network = await this.provider.getNetwork();
      if (network.chainId !== 11124n) {
        throw new Error(`Wrong network. Expected Abstract Testnet (11124), got ${network.chainId}`);
      }

      // Convert referralCode to bytes32
      let referralCodeBytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
      if (referralCode && referralCode.toString().trim() !== "") {
        referralCodeBytes32 = ethers.encodeBytes32String(referralCode.toString().trim());
      }

      // Estimate gas first to avoid high fees
      const gasEstimate = await playerStore.createProfile.estimateGas(username, referralCodeBytes32);
      console.log('Gas estimate:', gasEstimate.toString());

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate * 120n / 100n;

      const tx = await playerStore.createProfile(username, referralCodeBytes32, {
        gasLimit: gasLimit
      });
      
      console.log('Profile creation transaction:', tx.hash);
      await tx.wait();
      return tx;
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

  async getProfile(address) {
    try {
      const playerStore = this.getContract('PLAYER_STORE');
      
      // Check if contract exists by calling a simple view function first
      try {
        const profile = await playerStore.profileOf(address);
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
      const profile = await playerStore.profileOf(address);
      if (!profile[0]) { // profile[0] is exists
        return 0; // No profile = 0 XP
      }
      
      const xp = await playerStore.xpOf(address);
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
      const balance = await yieldToken.balanceOf(address);
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
      const tx = await dex.swapETHForYield({ value: ethers.parseEther(ethAmount.toString()) });
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
      const lockedGameToken = await sage.lockedGameToken(address);
      return lockedGameToken;
    } catch (error) {
      console.error('Error getting locked yield:', error);
      throw error;
    }
  }

  async getLastUnlockTime(address) {
    try {
      const sage = this.getContract('SAGE');
      const lastUnlockTime = await sage.lastUnlockTime(address);
      return lastUnlockTime;
    } catch (error) {
      console.error('Error getting last unlock time:', error);
      throw error;
    }
  }

  async unlockYield() {
    try {
      const sage = this.getContract('SAGE');
      const tx = await sage.unlockYield();
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
      const crops = await farming.getUserCrops(address);
      return crops;
    } catch (error) {
      console.error('Error getting user crops:', error);
      throw error;
    }
  }

  async getMaxPlots(address) {
    try {
      const farming = this.getContract('FARMING');
      const maxPlots = await farming.getMaxPlots(address);
      return maxPlots;
    } catch (error) {
      console.error('Error getting max plots:', error);
      throw error;
    }
  }

  async getGrowthTime(seedId) {
    try {
      const farming = this.getContract('FARMING');
      const growthTime = await farming.getGrowthTime(seedId);
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
      const balance = await items.balanceOf(userAddress, seedId);
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

      const tx = await farming.plant(seedId, plotNumber, { gasLimit });
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
        const balance = await items.balanceOf(userAddress, seedId);
        if (balance === 0n) {
          throw new Error(`You don't have seed with ID ${seedId}`);
        }
      }

      // Check current crops to avoid conflicts
      const currentCrops = await farming.getUserCrops(userAddress);
      for (let i = 0; i < plotNumbers.length; i++) {
        const plotNumber = plotNumbers[i];
        if (plotNumber < currentCrops.length && currentCrops[plotNumber].seedId !== 0n) {
          throw new Error(`Plot ${plotNumber} is already occupied`);
        }
      }

      // Estimate gas first
      const gasEstimate = await farming.plantBatch.estimateGas(seedIds, plotNumbers);
      const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer

      const tx = await farming.plantBatch(seedIds, plotNumbers, { gasLimit });
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

      const tx = await farming.harvest(slot, { gasLimit });
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

      const tx = await farming.harvestAll({ gasLimit });
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

      const tx = await farming.harvestMany(slots, { gasLimit });
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
      const balance = await items.balanceOf(address, itemId);
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
}

export default ContractService;
