import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getGameRegistryPDA, getUserDataPDA, getBankerDataPDA, getGameTokenMintAuthPDA } from '../solana/utils/pdaUtils';
import { BN } from '@coral-xyz/anchor';
import { GAME_TOKEN_MINT } from '../solana/constants/programId';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  fetchBankerDataSuccess,
  fetchBankerDataFailure,
  selectBankerLoading,
  selectBankerError,
  fetchBankerDataStart,
} from '../solana/store/slices/bankerSlice';
import {
  fetchBalancesSuccess,
} from '../solana/store/slices/balanceSlice';

export const useBanker = () => {
  const { publicKey } = useSolanaWallet();
  const validatorProgram = useProgram();
  const program = validatorProgram.getProgram();
  const connection = validatorProgram.getConnection();
  const dispatch = useDispatch();
  
  // Redux state
  const loading = useSelector(selectBankerLoading);
  const error = useSelector(selectBankerError);

  const stake = useCallback(async (amount) => {
    if (!program || !publicKey) {
      dispatch(fetchBankerDataFailure('Program or wallet not available'));
      return false;
    }
    dispatch(fetchBankerDataStart());

    try {
      if (amount <= 0) throw new Error('Amount must be greater than 0');

      const userDataPda = getUserDataPDA(publicKey);
      const bankerDataPda = getBankerDataPDA();
      const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
      
      await program.methods
        .stake(new BN(amount * 1e6))
        .accounts({
          userData: userDataPda,
          bankerData: bankerDataPda,
          gameTokenMint: GAME_TOKEN_MINT,
          userGameAta,
          user: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      
      // Fetch updated balance after successful stake
      try {
        const bankerData = await program.account.bankerData.fetch(bankerDataPda);
        const xGameToken = bankerData.xbalance / 1e6 || '0';
        const gameToken = bankerData.balance / 1e6 || '0';
        dispatch(fetchBankerDataSuccess({ totalGameToken: gameToken, totalXGameToken: xGameToken }));
      } catch (err) {
        console.error('Failed to update banker data:', err);
      }
      
      return true;
    } catch (err) {
      console.error('Stake error:', err);
      dispatch(fetchBankerDataFailure(err.message));
      return false;
    }
  }, [program, publicKey, dispatch]);

  const unstake = useCallback(async (shares) => {
    if (!program || !publicKey) {
      dispatch(fetchBankerDataFailure('Program or wallet not available'));
      return false;
    }
    dispatch(fetchBankerDataStart());
    try {
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const bankerDataPda = getBankerDataPDA();
      const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
      const gameTokenMintAuthPda = getGameTokenMintAuthPDA();
      
      const tx = await program.methods
        .unstake(new BN(shares * 1e6))
        .accounts({
          gameRegistry: gameRegistryPda,
          userData: userDataPda,
          bankerData: bankerDataPda,
          gameTokenMint: GAME_TOKEN_MINT,
          userGameAta,
          gameTokenMintAuth: gameTokenMintAuthPda,
          user: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      
      // Fetch updated balance after successful unstake
      try {
        const bankerData = await program.account.bankerData.fetch(bankerDataPda);
        const xGameToken = bankerData.xbalance / 1e6 || '0';
        const gameToken = bankerData.balance / 1e6 || '0';
        dispatch(fetchBankerDataSuccess({ totalGameToken: gameToken, totalXGameToken: xGameToken }));
      } catch (err) {
        console.error('Failed to update banker data:', err);
      }
      
      return tx;
    } catch (err) {
      console.error('Unstake error:', err);
      dispatch(fetchBankerDataFailure(err.message));
      return false;
    }
  }, [program, publicKey, dispatch]);

  const getBankerData = useCallback(async () => {
    if (!program || !publicKey) return null;
    
    try {
      const bankerDataPda = getBankerDataPDA();
      const bankerData = await program.account.bankerData.fetch(bankerDataPda);
      const xGameToken = bankerData.xbalance / 1e6 || '0';
      const gameToken = bankerData.balance / 1e6 || '0';
      const result = { totalGameToken: gameToken, totalXGameToken: xGameToken };
      dispatch(fetchBankerDataSuccess(result));
      
      return result;
    } catch (err) {
      dispatch(fetchBankerDataFailure(err.message));
      return { totalGameToken: 0, totalXGameToken: 0 };
    }
  }, [program, publicKey, dispatch]);

  const getBalance = useCallback(async () => {
    if (!program || !publicKey) return '0';
    try {
      const userDataPda = getUserDataPDA(publicKey);
        const userDataRaw = await program.account.userData.fetch(userDataPda);
        const userData = userDataRaw;
        const parsed = await connection.getParsedTokenAccountsByOwner(publicKey, { GAME_TOKEN_MINT });
        const gameTokenAmount = parsed.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
        const lamports = await connection.getBalance(publicKey);
        
        // Update all balances at once with fetchBalancesSuccess
        dispatch(fetchBalancesSuccess({
          gameToken: gameTokenAmount.toString(),
          stakedBalance: userData?.lockedTokens ? (parseFloat(userData.lockedTokens.toString()) / 1e6).toString() : '0',
          xTokenShare: userData?.xtokenShare ? (parseFloat(userData.xtokenShare.toString()) / 1e6).toString() : '0',
          solBalance: (lamports / 1e9).toString()
        }));
      
      return gameTokenAmount.toString();
    } catch {
      return '0';
    }
  }, [program, publicKey, dispatch]);

  return { stake, unstake, getBalance, getBankerData, loading, error };
};
