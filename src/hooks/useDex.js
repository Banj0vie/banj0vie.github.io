/* global BigInt */
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useProgram } from './useProgram';
import {
  GAME_TOKEN_MINT,
  SOLANA_VALLEY_DEX_PROGRAM_ID
} from '../solana/constants/programId';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getBalance, getParsedTokenAccountsByOwner } from '../utils/requestQueue';
import {
  buyTokensStart,
  buyTokensSuccess,
  buyTokensFailure,
  sellTokensStart,
  sellTokensSuccess,
  sellTokensFailure,
  updateSolBalance,
  updateGameTokenBalance,
  selectBalanceLoading,
  selectBalanceError,
} from '../solana/store/slices/balanceSlice';
import { sendTransactionForPhantom } from '../utils/transactionHelper';
import { useBalanceRefresh } from './useBalanceRefresh';

export const useDex = () => {
  const { publicKey, connection, sendTransaction, program } = useProgram(true);
  const dispatch = useDispatch();
  const { refreshBalancesAfterTransaction } = useBalanceRefresh();
  
  // Redux state
  const loading = useSelector(selectBalanceLoading);
  const error = useSelector(selectBalanceError);

  // Calculate PDAs
  const getDexPoolPda = useCallback(() => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("dex_pool"), GAME_TOKEN_MINT.toBuffer()],
      SOLANA_VALLEY_DEX_PROGRAM_ID
    );
    return pda;
  }, []);

  const getSolVaultPda = useCallback(() => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("sol_vault"), GAME_TOKEN_MINT.toBuffer()],
      SOLANA_VALLEY_DEX_PROGRAM_ID
    );
    return pda;
  }, []);

  
  // Fetch user balances
  const fetchBalances = useCallback(async () => {
    if (!publicKey) return;

    try {
      if (!connection) return;

      // Get SOL balance
      const solBalance = await getBalance(connection, publicKey);
      const solBalanceFormatted = (solBalance / LAMPORTS_PER_SOL).toFixed(6);

      // Get game token balance
      const userGameTokenAta = await getAssociatedTokenAddress(
        GAME_TOKEN_MINT, 
        publicKey, 
        false
      );

      let gameTokenBalance = '0';
      try {
        const parsed = await getParsedTokenAccountsByOwner(connection, publicKey, { mint: GAME_TOKEN_MINT });
        gameTokenBalance = (parsed.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0).toFixed(6);
      } catch (err) {
        // Token account doesn't exist yet
        gameTokenBalance = '0';
      }

      // Update Redux state
      dispatch(updateSolBalance(solBalanceFormatted));
      dispatch(updateGameTokenBalance(gameTokenBalance));

    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  }, [publicKey, connection, dispatch]);

  // Buy tokens with SOL
  const buyTokens = useCallback(async (solAmount) => {
    if (!publicKey || !program) {
      dispatch(buyTokensFailure('Wallet not connected'));
      return false;
    }

    // Check if already loading
    if (loading) {
      dispatch(buyTokensFailure('Transaction already in progress'));
      return false;
    }

    dispatch(buyTokensStart());

    try {
      const solAmountLamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
      if (solAmountLamports <= 0) {
        throw new Error('Invalid SOL amount');
      }

      const dexPoolPda = getDexPoolPda();
      const solVaultPda = getSolVaultPda();
      const userGameTokenAta = await getAssociatedTokenAddress(
        GAME_TOKEN_MINT, 
        publicKey, 
        false
      );

      // Get vault ATA (authority = dex_pool PDA)
      const vaultAta = await getAssociatedTokenAddress(
        GAME_TOKEN_MINT,
        dexPoolPda,
        true
      );

      const method = program.methods
        .buyTokens(new BN(solAmountLamports))
        .accounts({
          user: publicKey,
          dexPool: dexPoolPda,
          vault: vaultAta,
          userAta: userGameTokenAta,
          solVault: solVaultPda,
          tokenMint: GAME_TOKEN_MINT,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        });
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);

      dispatch(buyTokensSuccess());
      
      // Refresh balances after successful transaction
      await fetchBalances();
      await refreshBalancesAfterTransaction(1000);
      
      return { txHash: tx, success: true };
    } catch (err) {
      console.error('Buy tokens error:', err);
      
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
      
      dispatch(buyTokensFailure(errorMessage));
      return false;
    }
  }, [publicKey, dispatch, program, getDexPoolPda, getSolVaultPda, fetchBalances]);

  // Sell tokens for SOL
  const sellTokens = useCallback(async (tokenAmount) => {
    if (!publicKey || !program) {
      dispatch(sellTokensFailure('Wallet not connected'));
      return false;
    }

    // Check if already loading
    if (loading) {
      dispatch(sellTokensFailure('Transaction already in progress'));
      return false;
    }

    dispatch(sellTokensStart());

    try {
      const tokenAmountBaseUnits = Math.floor(tokenAmount * 1e6); // Assuming 6 decimals
      if (tokenAmountBaseUnits <= 0) {
        throw new Error('Invalid token amount');
      }

      const dexPoolPda = getDexPoolPda();
      const solVaultPda = getSolVaultPda();
      const userGameTokenAta = await getAssociatedTokenAddress(
        GAME_TOKEN_MINT, 
        publicKey, 
        false
      );

      // Get vault ATA (authority = dex_pool PDA)
      const vaultAta = await getAssociatedTokenAddress(
        GAME_TOKEN_MINT,
        dexPoolPda,
        true
      );

      const method = program.methods
        .sellTokens(new BN(tokenAmountBaseUnits))
        .accounts({
          user: publicKey,
          dexPool: dexPoolPda,
          vault: vaultAta,
          userAta: userGameTokenAta,
          solVault: solVaultPda,
          tokenMint: GAME_TOKEN_MINT,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        });
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);

      dispatch(sellTokensSuccess());
      
      // Refresh balances after successful transaction
      await fetchBalances();
      await refreshBalancesAfterTransaction(1000);
      
      return { txHash: tx, success: true };
    } catch (err) {
      console.error('Sell tokens error:', err);
      
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
      
      dispatch(sellTokensFailure(errorMessage));
      return false;
    }
  }, [publicKey, dispatch, program, getDexPoolPda, getSolVaultPda, fetchBalances]);

  // Fetch current pool state
  const fetchDexPool = useCallback(async () => {
    if (!publicKey) return null;

    try {
      const dexPoolPda = getDexPoolPda();
      const poolData = await program.account.dexPool.fetch(dexPoolPda);
      
      return {
        virtualSolReserves: poolData.virtualSolReserves.toString(),
        virtualTokenReserves: poolData.virtualTokenReserves.toString(),
        realSolReserves: poolData.realSolReserves.toString(),
        realTokenReserves: poolData.realTokenReserves.toString(),
        totalTokensSold: poolData.totalTokensSold.toString(),
        tokenMint: poolData.tokenMint.toString(),
        authority: poolData.authority.toString(),
      };
    } catch (err) {
      console.error('Failed to fetch DEX pool:', err);
      return null;
    }
  }, [publicKey, program, getDexPoolPda]);


  // Calculate tokens out for given SOL amount (preview)
  const getTokensOut = useCallback(async (solAmount) => {
    const poolData = await fetchDexPool();
    if (!poolData) return '0';

    try {
      const solIn = Math.floor(solAmount * LAMPORTS_PER_SOL);
      const s0 = BigInt(poolData.virtualSolReserves) + BigInt(poolData.realSolReserves);
      const t0 = BigInt(poolData.virtualTokenReserves) + BigInt(poolData.realTokenReserves);
      
      if (s0 === 0n || t0 === 0n) return '0';

      // token_out = sol_in * t0 / s0
      const tokensOut = (BigInt(solIn) * t0) / s0;
      return (Number(tokensOut) / 1e6).toFixed(6); // Convert back to UI units
    } catch (err) {
      console.error('Failed to calculate tokens out:', err);
      return '0';
    }
  }, [fetchDexPool]);

  // Calculate SOL out for given token amount (preview)
  const getSolOut = useCallback(async (tokenAmount) => {
    const poolData = await fetchDexPool();
    if (!poolData) return '0';

    try {
      const tokenIn = Math.floor(tokenAmount * 1e6);
      const s0 = BigInt(poolData.virtualSolReserves) + BigInt(poolData.realSolReserves);
      const t0 = BigInt(poolData.virtualTokenReserves) + BigInt(poolData.realTokenReserves);
      
      if (s0 === 0n || t0 === 0n) return '0';

      // sol_out = token_in * s0 / t0
      const solOut = (BigInt(tokenIn) * s0) / t0;
      return (Number(solOut) / LAMPORTS_PER_SOL).toFixed(6);
    } catch (err) {
      console.error('Failed to calculate SOL out:', err);
      return '0';
    }
  }, [fetchDexPool]);

  return {
    buyTokens,
    sellTokens,
    fetchDexPool,
    fetchBalances,
    getTokensOut,
    getSolOut,
    loading,
    error,
  };
};
