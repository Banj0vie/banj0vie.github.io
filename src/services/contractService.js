/* global BigInt */
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../config/contracts';
import { parseAbi } from 'viem';
import { handleContractError } from '../utils/errorHandler';

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
      const { message } = handleContractError(error, 'creating profile');
      throw new Error(message);
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
      const { message } = handleContractError(error, 'swapping ETH for Yield');
      throw new Error(message);
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
      const { message } = handleContractError(error, 'unlocking yield');
      throw new Error(message);
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
    // New ID scheme: low bits encode 3-digit rarity code (e.g., 101, 205)
    const idCode = BigInt(seedId) & 0xFFFFn;
    const rarityCode = idCode / 100n; // 1..5

    if (rarityCode === 1n) return this.getCommonMultiplier(level);
    if (rarityCode === 2n) return this.getUncommonMultiplier(level);
    if (rarityCode === 3n) return this.getRareMultiplier(level);
    if (rarityCode === 4n) return this.getEpicMultiplier(level);
    if (rarityCode === 5n) return this.getLegendaryMultiplier(level);
    return 1000n; // default 1x
  }

  getCommonMultiplier(level) {
    if (level <= 3) return 900n;
    if (level <= 11) return 910n;
    return 920n;
  }

  getUncommonMultiplier(level) {
    if (level <= 2) return 1200n;
    if (level <= 6) return 1210n;
    if (level <= 11) return 1220n;
    return 1230n;
  }

  getRareMultiplier(level) {
    if (level <= 1) return 1300n;
    if (level <= 5) return 1310n;
    if (level <= 8) return 1320n;
    if (level <= 11) return 1330n;
    if (level <= 14) return 1340n;
    return 1350n;
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
}

export default ContractService;