import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getGameRegistryPDA, getUserDataPDA, getBankerDataPDA, getGameTokenMintAuthPDA } from '../solana/utils/pdaUtils';
import { BN } from '@coral-xyz/anchor';
import { GAME_TOKEN_MINT } from '../solana/constants/programId';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getBalance, getParsedTokenAccountsByOwner } from '../utils/requestQueue';
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
import { sendTransactionForPhantom } from '../utils/transactionHelper';

export const useBanker = () => {
  const { publicKey, sendTransaction } = useSolanaWallet();
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
    if (loading) {
      dispatch(fetchBankerDataFailure('Transaction already in progress'));
      return false;
    }
    dispatch(fetchBankerDataStart());

    try {
      if (amount <= 0) throw new Error('Amount must be greater than 0');

      const userDataPda = getUserDataPDA(publicKey);
      const bankerDataPda = getBankerDataPDA();
      const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
      
      const method = program.methods
        .stake(new BN(amount * 1e6))
        .accounts({
          userData: userDataPda,
          bankerData: bankerDataPda,
          gameTokenMint: GAME_TOKEN_MINT,
          userGameAta,
          user: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        });
      
      await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      
      // Fetch updated balance after successful stake
      try {
        const bankerData = await program.account.bankerData.fetch(bankerDataPda);
        const xGameToken = bankerData.xbalance / 1e6 || '0';
        const gameToken = bankerData.balance / 1e6 || '0';
        dispatch(fetchBankerDataSuccess({ totalGameToken: gameToken, totalXGameToken: xGameToken }));
        
        // Refresh user's actual token balances with retry mechanism
        await getBankerBalance();
        
        // Multiple refresh attempts to ensure balance updates
        const refreshBalances = async (attempt = 1) => {
          console.log(`🔄 Balance refresh attempt ${attempt} after stake...`);
          await getBankerBalance();
          
          if (attempt < 3) {
            setTimeout(() => refreshBalances(attempt + 1), 1000 * attempt);
          }
        };
        
        setTimeout(() => refreshBalances(), 1000);
      } catch (err) {
        console.error('Failed to update banker data:', err);
      }
      
      return true;
    } catch (err) {
      console.error('Stake error:', err);
      
      // Handle specific transaction errors
      let errorMessage = err.message;
      if (err.message.includes('already been processed') || err.message.includes('Transaction simulation failed: This transaction has already been processed')) {
        errorMessage = 'Transaction already submitted. Please wait and try again.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this transaction.';
      } else if (err.message.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled by user.';
      } else if (err.message.includes('encoding overruns Uint8Array')) {
        errorMessage = 'Transaction too large. Please try with a smaller amount.';
      }
      
      dispatch(fetchBankerDataFailure(errorMessage));
      return false;
    }
  }, [program, publicKey, dispatch]);

  const unstake = useCallback(async (shares) => {
    if (!program || !publicKey) {
      dispatch(fetchBankerDataFailure('Program or wallet not available'));
      return false;
    }
    if (loading) {
      dispatch(fetchBankerDataFailure('Transaction already in progress'));
      return false;
    }
    dispatch(fetchBankerDataStart());
    try {
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const bankerDataPda = getBankerDataPDA();
      const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
      const gameTokenMintAuthPda = getGameTokenMintAuthPDA();
      
      const method = program.methods
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
        });
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      
      // Fetch updated balance after successful unstake
      try {
        const bankerData = await program.account.bankerData.fetch(bankerDataPda);
        const xGameToken = bankerData.xbalance / 1e6 || '0';
        const gameToken = bankerData.balance / 1e6 || '0';
        dispatch(fetchBankerDataSuccess({ totalGameToken: gameToken, totalXGameToken: xGameToken }));
        
        // Refresh user's actual token balances with retry mechanism
        await getBankerBalance();
        
        // Multiple refresh attempts to ensure balance updates
        const refreshBalances = async (attempt = 1) => {
          console.log(`🔄 Balance refresh attempt ${attempt} after unstake...`);
          await getBankerBalance();
          
          if (attempt < 3) {
            setTimeout(() => refreshBalances(attempt + 1), 1000 * attempt);
          }
        };
        
        setTimeout(() => refreshBalances(), 1000);
      } catch (err) {
        console.error('Failed to update banker data:', err);
      }
      
      return tx;
    } catch (err) {
      console.error('Unstake error:', err);
      
      // Handle specific transaction errors
      let errorMessage = err.message;
      if (err.message.includes('already been processed') || err.message.includes('Transaction simulation failed: This transaction has already been processed')) {
        errorMessage = 'Transaction already submitted. Please wait and try again.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this transaction.';
      } else if (err.message.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled by user.';
      } else if (err.message.includes('encoding overruns Uint8Array')) {
        errorMessage = 'Transaction too large. Please try with a smaller amount.';
      }
      
      dispatch(fetchBankerDataFailure(errorMessage));
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

  const getBankerBalance = useCallback(async () => {
    if (!program || !publicKey) return '0';
    try {
      const userDataPda = getUserDataPDA(publicKey);
      const userDataRaw = await program.account.userData.fetch(userDataPda);

      // Fetch SPL token balance for GAME_TOKEN_MINT
      const parsed = await getParsedTokenAccountsByOwner(connection, publicKey, { mint: GAME_TOKEN_MINT });
      const gameTokenAmount = parsed.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;

      // Fetch SOL balance
      const lamports = await getBalance(connection, publicKey);

      // Convert on-chain fields (assumed 6 decimals)
      const lockedTokensUi = (() => {
        try { return (parseFloat(userDataRaw.lockedTokens?.toString?.() ?? '0') / 1e6).toString(); } catch { return '0'; }
      })();
      const xTokenShareUi = (() => {
        try { return (parseFloat(userDataRaw.xtokenShare?.toString?.() ?? '0') / 1e6).toString(); } catch { return '0'; }
      })();

      // Update all balances at once
      dispatch(fetchBalancesSuccess({
        gameToken: (gameTokenAmount ?? 0).toString(),
        stakedBalance: lockedTokensUi,
        xTokenShare: xTokenShareUi,
        solBalance: (lamports / 1e9).toString(),
      }));

      return (gameTokenAmount ?? 0).toString();
    } catch (e) {
      console.error('getBalance failed:', e);
      return '0';
    }
  }, [program, publicKey, connection, dispatch]);

  return { stake, unstake, getBalance: getBankerBalance, getBankerData, loading, error };
};
