import { useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getGameRegistryPDA, getItemMintPDA, getItemMintAuthPDA } from '../solana/utils/pdaUtils';
import { SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { ID_PRODUCE_ITEMS, ID_POTION_ITEMS } from '../constants/app_ids';
import { handleContractError } from '../utils/errorHandler';
import { sendTransactionForPhantom } from '../utils/transactionHelper';

export const usePotion = () => {
  const [potionData, setPotionData] = useState({ loading: false, error: null });
  const { publicKey, connection, sendTransaction } = useSolanaWallet();
  const valleyProgram = useProgram();
  const program = valleyProgram.getProgram();

  // Helper function to get remaining accounts for potion crafting
  const getPotionRemainingAccounts = (potionType) => {
    const accounts = [];
    
    try {
      let requiredItems = [];
      
      // Define required items for each potion type based on Rust program
      switch (potionType) {
        case 'growth_elixir':
          requiredItems = [
            ID_PRODUCE_ITEMS.RADISH,    // 2x required
            ID_PRODUCE_ITEMS.ONION,     // 8x required
            ID_POTION_ITEMS.POTION_GROWTH_ELIXIR  // output
          ];
          break;
        case 'pesticide':
          requiredItems = [
            ID_PRODUCE_ITEMS.GRAPES,    // 2x required
            ID_PRODUCE_ITEMS.BERRY,    // 3x required
            ID_PRODUCE_ITEMS.CAULIFLOWER, // 3x required
            ID_POTION_ITEMS.POTION_PESTICIDE  // output
          ];
          break;
        case 'fertilizer':
          requiredItems = [
            ID_PRODUCE_ITEMS.DRAGONFRUIT, // 2x required
            ID_PRODUCE_ITEMS.LAVENDER,  // 2x required
            ID_PRODUCE_ITEMS.LYCHEE,    // 2x required
            ID_POTION_ITEMS.POTION_FERTILIZER  // output
          ];
          break;
        default:
          return [];
      }
      
      // Add mint and ATA accounts for each required item
      for (const itemId of requiredItems) {
        if (itemId == null || itemId === undefined) continue;
        
        const mint = getItemMintPDA(itemId);
        const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
        
        accounts.push({ pubkey: mint, isWritable: true, isSigner: false });
        accounts.push({ pubkey: ata, isWritable: true, isSigner: false });
      }
      
      // Add item mint authority
      const itemMintAuth = getItemMintAuthPDA();
      accounts.push({ pubkey: itemMintAuth, isWritable: false, isSigner: false });
      
      return accounts;
    } catch (error) {
      console.error('getPotionRemainingAccounts - error:', error);
      return [];
    }
  };
  const craftGrowthElixir = useCallback(async (count = 1) => {
    if (!program || !publicKey) return null;
    if (potionData.loading) {
      setPotionData(prev => ({ ...prev, error: 'Transaction already in progress' }));
      return null;
    }
    
    setPotionData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const remainingAccounts = getPotionRemainingAccounts('growth_elixir');
      
      const method = program.methods
        .craftGrowthElixir(new BN(count))
        .accounts({
          user: publicKey,
          userData: userDataPda,
          gameRegistry: gameRegistryPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts);
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      setPotionData(prev => ({ ...prev, loading: false }));
      return { txHash: tx, isPending: false };
    } catch (err) {
      const { message } = handleContractError(err, 'crafting growth elixir');
      setPotionData(prev => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, [program, publicKey, potionData.loading]);

  const craftPesticide = useCallback(async (count = 1) => {
    if (!program || !publicKey) return null;
    if (potionData.loading) {
      setPotionData(prev => ({ ...prev, error: 'Transaction already in progress' }));
      return null;
    }
    
    setPotionData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const remainingAccounts = getPotionRemainingAccounts('pesticide');
      
      const method = program.methods
        .craftPesticide(new BN(count))
        .accounts({
          user: publicKey,
          userData: userDataPda,
          gameRegistry: gameRegistryPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts);
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      setPotionData(prev => ({ ...prev, loading: false }));
      return { txHash: tx, isPending: false };
    } catch (err) {
      const { message } = handleContractError(err, 'crafting pesticide');
      setPotionData(prev => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, [program, publicKey, potionData.loading]);

  const craftFertilizer = useCallback(async (count = 1) => {
    if (!program || !publicKey) return null;
    if (potionData.loading) {
      setPotionData(prev => ({ ...prev, error: 'Transaction already in progress' }));
      return null;
    }
    
    setPotionData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const remainingAccounts = getPotionRemainingAccounts('fertilizer');
      
      const method = program.methods
        .craftFertilizer(new BN(count))
        .accounts({
          user: publicKey,
          userData: userDataPda,
          gameRegistry: gameRegistryPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts);
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      setPotionData(prev => ({ ...prev, loading: false }));
      return { txHash: tx, isPending: false };
    } catch (err) {
      const { message } = handleContractError(err, 'crafting fertilizer');
      setPotionData(prev => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, [program, publicKey, potionData.loading]);

  // Batch crafting functions (alias for single functions with count parameter)
  const craftGrowthElixirBatch = useCallback(async (count = 1) => {
    return await craftGrowthElixir(count);
  }, [craftGrowthElixir]);

  const craftPesticideBatch = useCallback(async (count = 1) => {
    return await craftPesticide(count);
  }, [craftPesticide]);

  const craftFertilizerBatch = useCallback(async (count = 1) => {
    return await craftFertilizer(count);
  }, [craftFertilizer]);

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


