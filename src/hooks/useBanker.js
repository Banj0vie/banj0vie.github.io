import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getGameRegistryPDA, getUserDataPDA, getBankerDataPDA, getBankVaultPDA, getBankVaultAta, getReceiverPDA } from '../solana/utils/pdaUtils';
import { BN } from '@coral-xyz/anchor';
import { GAME_TOKEN_MINT } from '../solana/constants/programId';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram } from '@solana/web3.js';
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
import { useBalanceRefresh } from './useBalanceRefresh';

export const useBanker = () => {
  const { publicKey, sendTransaction } = useSolanaWallet();
  const { program, connection } = useProgram();
  const dispatch = useDispatch();
  const { refreshBalancesAfterTransaction } = useBalanceRefresh();
  
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
      const bankVaultPda = getBankVaultPDA(bankerDataPda);
      const bankVaultAta = getBankVaultAta(bankerDataPda);
      
      const method = program.methods
        .stake(new BN(amount * 1e9))
        .accounts({
          user: publicKey,
          userData: userDataPda,
          bankerData: bankerDataPda,
          gameTokenMint: GAME_TOKEN_MINT,
          userGameAta,
          bankVault: bankVaultPda,
          bankVaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        });
      
      await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      
      // Fetch updated banker data after successful stake
      try {
        const bankerData = await program.account.bankerData.fetch(bankerDataPda);
        const xGameToken = bankerData.xbalance / 1e9 || '0';
        const gameToken = bankerData.balance / 1e9 || '0';
        dispatch(fetchBankerDataSuccess({ totalGameToken: gameToken, totalXGameToken: xGameToken }));
      } catch (err) {
        console.error('Failed to update banker data:', err);
      }
      
      // Use centralized balance refresh
      await refreshBalancesAfterTransaction(1000);
      
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
      const bankVaultPda = getBankVaultPDA(bankerDataPda);
      const bankVaultAta = getBankVaultAta(bankerDataPda);

      const receiverPda = getReceiverPDA();
      const receiverInfo = await program.account.receiver.fetch(receiverPda);
      const receiverWallet1 = receiverInfo.receiver1;
      const receiverWallet2 = receiverInfo.receiver2;
      const method = program.methods
        .unstake(new BN(shares * 1e9))
        .accounts({
          user: publicKey,
          gameRegistry: gameRegistryPda,
          userData: userDataPda,
          bankerData: bankerDataPda,
          gameTokenMint: GAME_TOKEN_MINT,
          userGameAta,
          bankVault: bankVaultPda,
          bankVaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          receiver: receiverPda,
          receiverWallet1: receiverWallet1,
          receiverWallet2: receiverWallet2,
        });
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      
      // Fetch updated banker data after successful unstake
      try {
        const bankerData = await program.account.bankerData.fetch(bankerDataPda);
        const xGameToken = bankerData.xbalance / 1e9 || '0';
        const gameToken = bankerData.balance / 1e9 || '0';
        dispatch(fetchBankerDataSuccess({ totalGameToken: gameToken, totalXGameToken: xGameToken }));
      } catch (err) {
        console.error('Failed to update banker data:', err);
      }
      
      // Use centralized balance refresh
      await refreshBalancesAfterTransaction(1000);
      
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
      const xGameToken = bankerData.xbalance / 1e9 || '0';
      const gameToken = bankerData.balance / 1e9 || '0';
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
        try { return (parseFloat(userDataRaw.lockedTokens?.toString?.() ?? '0') / 1e9).toString(); } catch { return '0'; }
      })();
      const xTokenShareUi = (() => {
        try { return (parseFloat(userDataRaw.xtokenShare?.toString?.() ?? '0') / 1e9).toString(); } catch { return '0'; }
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
