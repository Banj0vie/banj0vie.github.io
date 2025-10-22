import { useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getGameRegistryPDA, getItemMintAuthPDA, getEpochTop5PDA, getGameRegistryInfo } from '../solana/utils/pdaUtils';
import { SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { GAME_TOKEN_MINT } from '../solana/constants/programId';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

export const usePotion = () => {
  const [potionData, setPotionData] = useState({ loading: false, error: null });
  const { publicKey } = useSolanaWallet();
  const valleyProgram = useProgram();
  const program = valleyProgram.getProgram();
  const craftGrowthElixir = useCallback(async (count = 1) => {
    if (!program || !publicKey) return null;
    setPotionData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const gameTokenMintAuthPda = getItemMintAuthPDA();
      const gameRegistryInfo = await getGameRegistryInfo(program);
      const epochTop5Pda = getEpochTop5PDA(gameRegistryInfo.epoch);
      const tx = await program.methods
        .craftGrowthElixir(new BN(count))
        .accounts({
          user: publicKey,
          userData: userDataPda,
          gameTokenMint: GAME_TOKEN_MINT,
          gameTokenMintAuth: gameTokenMintAuthPda,
          gameRegistry: gameRegistryPda,
          epochTop5: epochTop5Pda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();
      setPotionData(prev => ({ ...prev, loading: false }));
      return tx;
    } catch (err) { setPotionData(prev => ({ ...prev, loading: false, error: err.message })); throw err; }
  }, [program, publicKey]);

  const craftPesticide = useCallback(async (count = 1) => {
    if (!program || !publicKey) return null;
    setPotionData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const gameTokenMintAuthPda = getItemMintAuthPDA();
      const gameRegistryInfo = await getGameRegistryInfo(program);
      const epochTop5Pda = getEpochTop5PDA(gameRegistryInfo.epoch);
      const tx = await program.methods
        .craftPesticide(new BN(count))
        .accounts({
          user: publicKey,
          userData: userDataPda,
          gameTokenMint: GAME_TOKEN_MINT,
          gameTokenMintAuth: gameTokenMintAuthPda,
          gameRegistry: gameRegistryPda,
          epochTop5: epochTop5Pda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();
      setPotionData(prev => ({ ...prev, loading: false }));
      return tx;
    } catch (err) { setPotionData(prev => ({ ...prev, loading: false, error: err.message })); throw err; }
  }, [program, publicKey]);

  const craftFertilizer = useCallback(async (count = 1) => {
    if (!program || !publicKey) return null;
    setPotionData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const gameTokenMintAuthPda = getItemMintAuthPDA();
      const gameRegistryInfo = await getGameRegistryInfo(program);
      const epochTop5Pda = getEpochTop5PDA(gameRegistryInfo.epoch);
      const tx = await program.methods
        .craftFertilizer(new BN(count))
        .accounts({
          user: publicKey,
          userData: userDataPda,
          gameTokenMint: GAME_TOKEN_MINT,
          gameTokenMintAuth: gameTokenMintAuthPda,
          gameRegistry: gameRegistryPda,
          epochTop5: epochTop5Pda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();
      setPotionData(prev => ({ ...prev, loading: false }));
      return tx;
    } catch (err) { setPotionData(prev => ({ ...prev, loading: false, error: err.message })); throw err; }
  }, [program, publicKey]);

  return { potionData, craftGrowthElixir, craftPesticide, craftFertilizer };
};


