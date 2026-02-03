import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getGameRegistryPDA, getGameTokenMintAuthPDA, getGameVaultPDA, getGameVaultAta } from '../solana/utils/pdaUtils';
import { fetchUserDataSuccess } from '../solana/store/slices/userSlice';
import { BN } from '@coral-xyz/anchor';
import { GAME_TOKEN_MINT } from '../solana/constants/programId';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { EPOCH_PERIOD } from '../utils/basic';
import { sendTransactionForPhantom } from '../utils/transactionHelper';
import { useBalanceRefresh } from './useBalanceRefresh';

// Mirror on-chain constants/logic from sage.rs
const SAGE_UNLOCK_COOLDOWN = EPOCH_PERIOD; // EPOCH_PERIOD (ms)
const getUnlockPercentBps = (level) => {
  if (level >= 15) return 1500; // 15%
  if (level >= 10) return 1000; // 10%
  return 100; // 1%
};
// 2.5 + 2.5 * level, program uses 6 decimals (1e9)
const getUnlockCost = (level) => {
  const unit = 2_500_000_000; // 2.5e9
  return unit + unit * (Number(level) || 0);
};

export const useSage = () => {
  const { publicKey, connection, sendTransaction } = useSolanaWallet();
  const { program } = useProgram();
  const dispatch = useDispatch();
  const { refreshBalancesAfterTransaction } = useBalanceRefresh();
  const [sageData, setSageData] = useState({
    lockedAmount: 0,
    lastUnlockTime: 0,
    lastUnlockTimeHarvest: 0,
    unlockRate: 0,
    unlockAmount: 0,
    canUnlockWage: false,
    canUnlockHarvest: false,
    nextUnlockTime: 0,
    nextWageUnlockTime: 0,
    nextHarvestUnlockTime: 0,
    harvestUnlockPercent: 0,
    harvestUnlockAmount: 0,
    weeklyWageAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateUnlockRate = useCallback((level) => getUnlockPercentBps(level), []);

  const fetchSageData = useCallback(async () => {
    if (!program || !publicKey) return;
    setLoading(true); setError(null);
    try {
      const userDataPda = getUserDataPDA(publicKey);
      const ud = await program.account.userData.fetch(userDataPda);

      // Normalize and dispatch latest userData to Redux (snake_case expected by userSlice)
      const serializePubkey = (pk) => (pk && typeof pk.toString === 'function' ? pk.toString() : pk);
      const mapCropToSnake = (c) => {
        if (!c) return { id: 0, end_time: 0, prod_multiplier: 1000, token_multiplier: 1000, growth_elixir: 0 };
        return {
          id: Number(c.id ?? 0),
          end_time: Number(c.end_time ?? c.endTime ?? 0),
          prod_multiplier: Number(c.prod_multiplier ?? c.produceMultiplier ?? 1000),
          token_multiplier: Number(c.token_multiplier ?? c.tokenMultiplier ?? 1000),
          growth_elixir: Number(c.growth_elixir ?? c.growthElixir ?? 0),
        };
      };
      const userDataSnake = {
        name: ud.name ?? '',
        referral_code: Array.isArray(ud.referral_code ?? ud.referralCode) ? [...(ud.referral_code ?? ud.referralCode)] : new Array(32).fill(0),
        sponsor: serializePubkey(ud.sponsor),
        level: Number(ud.level ?? 0),
        xp: Number(ud.xp ?? 0),
        epoch_xp: Number(ud.epoch_xp ?? ud.epochXp ?? 0),
        last_epoch_counted: Number(ud.last_epoch_counted ?? ud.lastEpochCounted ?? 0),
        avatars: Array.isArray(ud.avatars) ? ud.avatars.map(serializePubkey) : [null, null],
        locked_tokens: (ud.locked_tokens ?? ud.lockedTokens ?? 0).toString(),
        xtoken_share: (ud.xtoken_share ?? ud.xtokenShare ?? 0).toString(),
        chest_open_time: Number(ud.chest_open_time ?? ud.chestOpenTime ?? 0),
        last_wage_time: Number(ud.last_wage_time ?? ud.lastWageTime ?? 0),
        last_harvest_time: Number(ud.last_harvest_time ?? ud.lastHarvestTime ?? 0),
        active_plot_ids: Array.isArray(ud.active_plot_ids ?? ud.activePlotIds) ? [...(ud.active_plot_ids ?? ud.activePlotIds)] : [],
        user_crops: Array.isArray(ud.user_crops ?? ud.userCrops)
          ? (ud.user_crops ?? ud.userCrops).map(mapCropToSnake)
          : new Array(30).fill(null).map(() => mapCropToSnake(null)),
      };
      dispatch(fetchUserDataSuccess(userDataSnake));
      // Handle camelCase or snake_case from Anchor
      const level = Number(ud.level || 0);
      const lockedTokens = new BN((ud.locked_tokens ?? ud.lockedTokens) || 0);
      const lastWageTime = Number(ud.last_wage_time ?? ud.lastWageTime ?? 0);
      const lastHarvestTime = Number(ud.last_harvest_time ?? ud.lastHarvestTime ?? 0);

      const percentBps = calculateUnlockRate(level); // in bps
      const harvestUnlockAmount = lockedTokens.mul(new BN(percentBps)).div(new BN(10_000));
      const weeklyWageAmount = new BN(getUnlockCost(level));

      const now = Date.now();
      const nextWageUnlockTime = lastWageTime + SAGE_UNLOCK_COOLDOWN;
      const nextHarvestUnlockTime = lastHarvestTime + SAGE_UNLOCK_COOLDOWN;
      const canUnlockWage = (lastWageTime === 0 || now >= nextWageUnlockTime * 1000);
      const canUnlockHarvest = (lastHarvestTime === 0 || now >= nextHarvestUnlockTime * 1000);

      // Convert to UI units (assume 6 decimals)
      const toUi = (bn) => parseFloat(bn.toString()) / 1e9;

      setSageData({
        lockedAmount: toUi(lockedTokens),
        lastUnlockTime: lastWageTime,
        lastUnlockTimeHarvest: lastHarvestTime,
        harvestUnlockPercent: percentBps / 100, // percent
        harvestUnlockAmount: toUi(harvestUnlockAmount),
        weeklyWageAmount: toUi(weeklyWageAmount),
        canUnlockWage,
        canUnlockHarvest,
        nextWageUnlockTime,
        nextHarvestUnlockTime,
        unlockRate: percentBps / 100,
        unlockAmount: toUi(harvestUnlockAmount),
        nextUnlockTime: nextHarvestUnlockTime,
      });
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [program, publicKey, calculateUnlockRate]);

  const unlockWeeklyHarvest = useCallback(async () => {
    if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
    if (loading) { setError('Transaction already in progress'); return null; }
    setLoading(true); setError(null);
    try {
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const gameTokenMintAuthPda = getGameTokenMintAuthPDA();
      const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
      const gameVaultPda = getGameVaultPDA();
      const gameVaultAta = getGameVaultAta();
      const method = program.methods
        .unlockWeeklyHarvest()
        .accounts({ 
          gameRegistry: gameRegistryPda, 
          userData: userDataPda, 
          gameTokenMint: GAME_TOKEN_MINT, 
          userGameAta, 
          gameVault: gameVaultPda, 
          gameVaultAta, 
          gameTokenMintAuth: gameTokenMintAuthPda, 
          user: publicKey, 
          tokenProgram: TOKEN_PROGRAM_ID 
        });
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      await fetchSageData();
      
      // Refresh balances after successful unlock
      await refreshBalancesAfterTransaction(1000);
      
      return tx;
    } catch (err) { 
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
      
      setError(errorMessage); 
      throw err; 
    } finally { setLoading(false); }
  }, [program, publicKey, fetchSageData]);

  const unlockWeeklyWage = useCallback(async () => {
    if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
    if (loading) { setError('Transaction already in progress'); return null; }
    setLoading(true); setError(null);
    try {
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const gameTokenMintAuthPda = getGameTokenMintAuthPDA();
      const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
      const gameVaultPda = getGameVaultPDA();
      const gameVaultAta = getGameVaultAta();
      const method = program.methods
        .unlockWeeklyWage()
        .accounts({ 
          gameRegistry: gameRegistryPda, 
          userData: userDataPda, 
          gameTokenMint: GAME_TOKEN_MINT, 
          userGameAta, 
          gameVault: gameVaultPda, 
          gameVaultAta, 
          gameTokenMintAuth: gameTokenMintAuthPda, 
          user: publicKey, 
          tokenProgram: TOKEN_PROGRAM_ID 
        });
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      await new Promise(r => setTimeout(r, 2000));
      await fetchSageData();
      
      // Refresh balances after successful unlock
      await refreshBalancesAfterTransaction(1000);
      
      return tx;
    } catch (err) { 
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
      
      setError(errorMessage); 
      throw err; 
    } finally { setLoading(false); }
  }, [program, publicKey, fetchSageData]);

  const getTimeUntilNextWageUnlock = useCallback(() => {
    const now = Date.now();
    const remaining = sageData.nextWageUnlockTime*1000 - now;
    return Math.max(0, remaining);
  }, [sageData.nextWageUnlockTime]);

  const getTimeUntilNextHarvestUnlock = useCallback(() => {
    const now = Date.now();
    const remaining = sageData.nextHarvestUnlockTime*1000 - now;
    return Math.max(0, remaining);
  }, [sageData.nextHarvestUnlockTime]);

  return { sageData, fetchSageData, unlockWeeklyHarvest, unlockWeeklyWage, getTimeUntilNextWageUnlock, getTimeUntilNextHarvestUnlock, loading, error };
};


