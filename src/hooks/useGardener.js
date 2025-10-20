import { useState, useCallback, useEffect } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getGameRegistryPDA } from '../solana/utils/pdaUtils';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { GAME_TOKEN_MINT } from '../solana/constants/programId';
import { handleContractError } from '../utils/errorHandler';

export const useGardener = () => {
  const { publicKey } = useSolanaWallet();
  const valleyProgram = useProgram();
  const program = valleyProgram.getProgram();
  const connection = valleyProgram.getConnection();
  const [gardenerData, setGardenerData] = useState({
    currentLevel: 0,
    maxLevel: 50,
    levelUpCost: 0,
    canLevelUp: false,
    loading: false,
    error: null,
  });

  const fetchGardenerData = useCallback(async () => {
    if (!program || !publicKey) return;
    setGardenerData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const userDataPda = getUserDataPDA(publicKey);
      const gameRegistryPda = getGameRegistryPDA();
      const userData = await program.account.userData.fetch(userDataPda);
      const gameRegistry = await program.account.gameRegistry.fetch(gameRegistryPda);
      const currentLevel = Number(userData.level || 0);
      const maxLevel = Number(gameRegistry.maxLevel || 50);
      const levelUpCost = currentLevel < maxLevel ? (currentLevel + 1) * 100 : 0; // in HONEY (ui)
      // Fetch user's HONEY balance via associated token account
      const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
      let gameTokenBalanceUi = 0;
      try {
        const info = await connection.getParsedAccountInfo(userGameAta);
        const parsed = info?.value?.data?.parsed?.info?.tokenAmount?.uiAmount;
        gameTokenBalanceUi = Number(parsed || 0);
      } catch {}
      const canLevelUp = currentLevel < maxLevel && gameTokenBalanceUi >= levelUpCost;
      setGardenerData({ currentLevel, maxLevel, levelUpCost, canLevelUp, loading: false, error: null });
    } catch (err) {
      const { message } = handleContractError(err, 'fetching gardener data');
      setGardenerData(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [program, publicKey, connection]);

  const levelUp = useCallback(async (targetLevel) => {
    if (!program || !publicKey) { setGardenerData(p => ({ ...p, error: 'Program or wallet not available' })); return null; }
    setGardenerData(p => ({ ...p, loading: true, error: null }));
    try {
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
      const tx = await program.methods
        .levelUp(targetLevel)
        .accounts({ 
          user: publicKey, 
          userData: userDataPda, 
          gameRegistry: gameRegistryPda, 
          gameTokenMint: GAME_TOKEN_MINT, 
          userGameAta, 
          tokenProgram: TOKEN_PROGRAM_ID 
        })
        .rpc();
      await fetchGardenerData();
      return tx;
    } catch (err) {
      console.log("🚀 ~ useGardener ~ err:", err)
      const { message } = handleContractError(err, 'leveling up valley');
      setGardenerData(p => ({ ...p, loading: false, error: message }));
      throw new Error(message);
    }
  }, [program, publicKey, fetchGardenerData]);

  useEffect(() => { fetchGardenerData(); }, [fetchGardenerData]);

  return { ...gardenerData, levelUp, fetchGardenerData };
};


