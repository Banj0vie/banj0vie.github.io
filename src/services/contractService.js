import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../config/contracts';

class ContractService {
  constructor(provider, signer, chainId) {
    this.provider = provider;
    this.signer = signer;
    this.chainId = chainId;
    this.contracts = {};
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
  async createProfile(username) {
    try {
      const playerStore = this.getContract('PLAYER_STORE');
      
      // First check if we're on the correct network
      const network = await this.provider.getNetwork();
      if (network.chainId !== 11124n) {
        throw new Error(`Wrong network. Expected Abstract Testnet (11124), got ${network.chainId}`);
      }

      // Estimate gas first to avoid high fees
      const gasEstimate = await playerStore.createProfile.estimateGas(username);
      console.log('Gas estimate:', gasEstimate.toString());

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate * 120n / 100n;

      const tx = await playerStore.createProfile(username, {
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
}

export default ContractService;
