import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useDispatch, useSelector } from 'react-redux';
import { getUserPDAs, getGameRegistryPDA } from '../solana/utils/pdaUtils';
import { setHasProfile, fetchUserDataSuccess } from '../solana/store/slices/userSlice';
import { updateSolBalance, fetchBalancesSuccess } from '../solana/store/slices/balanceSlice';
import { useProgram } from './useProgram';
import { getBalance, getParsedTokenAccountsByOwner } from '../utils/requestQueue';

const serializePubkey = (pk) => (pk && typeof pk.toString === 'function' ? pk.toString() : pk);
const toStringIfBN = (v) => (v && typeof v.toString === 'function' && typeof v !== 'string' ? v.toString() : v);
const mapCropToSnake = (c) => {
  if (!c) return { id: 0, end_time: 0, prod_multiplier: 1000, token_multiplier: 1000, growth_elixir: 0 };
  return {
    id: Number(c.id ?? 0),
    end_time: Number(c.endTime ?? c.end_time ?? 0),
    prod_multiplier: Number(c.prodMultiplier ?? c.produceMultiplier ?? c.prod_multiplier ?? 1000),
    token_multiplier: Number(c.tokenMultiplier ?? c.token_multiplier ?? 1000),
    growth_elixir: Number(c.growthElixir ?? c.growth_elixir ?? 0),
  };
};
const serializeUserData = (ud) => {
  if (!ud) return ud;
  return {
    // snake_case fields expected by userSlice
    name: ud.name ?? '',
    referral_code: Array.isArray(ud.referralCode) ? [...ud.referralCode] : (ud.referral_code ?? new Array(32).fill(0)),
    sponsor: serializePubkey(ud.sponsor),
    level: Number(ud.level ?? 0),
    xp: Number(ud.xp ?? 0),
    epoch_xp: Number(ud.epochXp ?? ud.epoch_xp ?? 0),
    last_epoch_counted: Number(ud.lastEpochCounted ?? ud.last_epoch_counted ?? 0),
    avatars: Array.isArray(ud.avatars) ? ud.avatars.map(serializePubkey) : [null, null],
    locked_tokens: toStringIfBN(ud.lockedTokens ?? ud.locked_tokens ?? 0),
    xtoken_share: toStringIfBN(ud.xtokenShare ?? ud.xtoken_share ?? 0),
    chest_open_time: Number(ud.chestOpenTime ?? ud.chest_open_time ?? 0),
    last_wage_time: Number(ud.lastWageTime ?? ud.last_wage_time ?? 0),
    last_harvest_time: Number(ud.lastHarvestTime ?? ud.last_harvest_time ?? 0),
    active_plot_ids: Array.isArray(ud.activePlotIds ?? ud.active_plot_ids) ? [...(ud.activePlotIds ?? ud.active_plot_ids)] : [],
    user_crops: Array.isArray(ud.userCrops ?? ud.user_crops)
      ? (ud.userCrops ?? ud.user_crops).map(mapCropToSnake)
      : new Array(30).fill(null).map(() => mapCropToSnake(null)),
  };
};

/**
 * Solana wallet hook that provides wallet connection and interaction functionality
 * Replaces the Abstract wallet implementation with Solana wallet adapter
 */
export const useSolanaWallet = () => {
  // Solana wallet adapter hooks
  const { 
    wallet, 
    disconnect, 
    connecting, 
    disconnecting,
    select,
    wallets,
    walletName
  } = useWallet();
  
  const { setVisible } = useWalletModal();
  const dispatch = useDispatch();
  const { program, connection, publicKey, connected, sendTransaction } = useProgram();
  
  // Redux derived state
  const hasProfile = useSelector(state => state.user.hasProfile);
  
  // Local state
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  // Update account when publicKey changes
  useEffect(() => {
    if (publicKey) {
      setAccount(publicKey.toString());
    } else {
      setAccount(null);
    }
  }, [publicKey]);

  // Update connecting state
  useEffect(() => {
    setIsConnecting(connecting);
  }, [connecting]);

  // Clear error when wallet connects successfully
  useEffect(() => {
    if (connected && error) {
      setError(null);
    }
  }, [connected, error]);

  // On wallet connect, check if userData PDA exists and update Redux hasProfile
  useEffect(() => {
    let cancelled = false;
    const checkProfile = async () => {
      if (!publicKey) {
        dispatch(setHasProfile(false));
        return;
      }
      try {
        setLoading(true);
        const { userData: userDataPda } = getUserPDAs(publicKey);
        const userDataAccount = await program.account.userData.fetch(userDataPda);
        const accountExists = !!userDataAccount;
        if (!cancelled) {
          dispatch(setHasProfile(accountExists));
          if (accountExists) {
            const serialized = serializeUserData(userDataAccount);
            dispatch(fetchUserDataSuccess(serialized));
          }
        }
      } catch (e) {
        console.error('Error checking profile:', e);
        if (!cancelled) {
          dispatch(setHasProfile(false));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    checkProfile();
    return () => { cancelled = true; };
  }, [publicKey, connection, dispatch, program]);

  // When profile exists, fetch profile data and balances (with rate limiting)
  const fetchGuardRef = useRef({ inFlight: false, lastFetch: 0 });
  useEffect(() => {
    let cancelled = false;
    if (!publicKey || !program || !hasProfile) return;

    const guard = fetchGuardRef.current;
    const now = Date.now();
    
    // Prevent concurrent fetches and rate limit to once per 5 seconds
    if (guard.inFlight || (now - guard.lastFetch) < 5000) return;
    
    guard.inFlight = true;
    guard.lastFetch = now;

    const doFetch = async () => {
      try {
        // UserData
        const { userData: userDataPda } = getUserPDAs(publicKey);
        const userDataRaw = await program.account.userData.fetch(userDataPda);
        const userData = serializeUserData(userDataRaw);
        if (!cancelled && userData) {
          dispatch(fetchUserDataSuccess(userData));
        }

        // SOL balance
        const lamports = await getBalance(connection, publicKey);
        if (!cancelled) dispatch(updateSolBalance(lamports.toString()));

        // Game token balance via GameRegistry.mint -> parsed token account
        const gameRegistryPda = getGameRegistryPDA();
        const gameRegistry = await program.account.gameRegistry.fetch(gameRegistryPda);
        const mint = gameRegistry.gameTokenMint;
        let gameTokenAmount = '0';
        try {
          const parsed = await getParsedTokenAccountsByOwner(connection, publicKey, { mint });
          gameTokenAmount = parsed.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
        } catch {}
        
        // Update all balances at once with fetchBalancesSuccess
        if (!cancelled) {
          const lockedTokensStr = userData?.locked_tokens ? userData.locked_tokens.toString() : '0';
          const xTokenShareStr = userData?.xtoken_share ? userData.xtoken_share.toString() : '0';
          const lockedTokensUi = (() => { try { return (parseFloat(lockedTokensStr) / 1e9).toString(); } catch { return '0'; } })();
          const xTokenShareUi = (() => { try { return (parseFloat(xTokenShareStr) / 1e9).toString(); } catch { return '0'; } })();
          dispatch(fetchBalancesSuccess({
            gameToken: gameTokenAmount.toString(),
            stakedBalance: lockedTokensUi,
            xTokenShare: xTokenShareUi,
            solBalance: (lamports / 1e9).toString()
          }));
        }

      } catch (e) {
        console.error('Failed to fetch profile/balances', e);
      } finally {
        guard.inFlight = false;
      }
    };

    doFetch();
    return () => { cancelled = true; };
  }, [publicKey, program, hasProfile, connection, dispatch]);

  // Function to connect wallet - opens wallet selection dialog
  const connectWallet = useCallback(async () => {
    try {
      setError(null);
      setVisible(true);
    } catch (err) {
      console.error('Failed to open wallet modal:', err);
      setError(err.message || 'Failed to open wallet selection');
    }
  }, [setVisible]);

  // Function to disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      setError(null);
      await disconnect();
      setAccount(null);
      dispatch(setHasProfile(false));
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
      setError(err.message || 'Failed to disconnect wallet');
    }
  }, [disconnect, dispatch]);

  // Function to refresh profile status using PDA existence
  const refreshProfileStatus = useCallback(async () => {
    if (!publicKey) {
      dispatch(setHasProfile(false));
      return false;
    }
    try {
      setLoading(true);
      const { userData: userDataPda } = getUserPDAs(publicKey);
      const userDataAccount = await program.account.userData.fetch(userDataPda);
      const exists = !!userDataAccount;
      dispatch(setHasProfile(exists));
      return exists;
    } catch (err) {
      console.error('Failed to check profile status:', err);
      dispatch(setHasProfile(false));
      return false;
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, dispatch]);

  // Function to refresh balances
  const refreshBalances = useCallback(async () => {
    if (!publicKey || !hasProfile) return;
    // Force refresh by clearing the guard and triggering a new fetch
    fetchGuardRef.current.inFlight = false;
    fetchGuardRef.current.lastFetch = 0;
  }, [publicKey, hasProfile]);

  // Function to sign a message
  const signMessage = useCallback(async (message) => {
    if (!wallet || !publicKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await wallet.signMessage(encodedMessage);
      return signature;
    } catch (err) {
      console.error('Failed to sign message:', err);
      throw err;
    }
  }, [wallet, publicKey]);

  return {
    // Wallet state
    account,
    publicKey,
    wallet,
    isConnected: connected,
    isConnecting,
    isDisconnecting: disconnecting,
    error,
    hasProfile,
    loading,
    
    // Wallet actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    select,
    refreshProfileStatus,
    refreshBalances,
    signMessage,
    sendTransaction,
    
    // Additional info
    walletName,
    wallets,
    connection,
    
    isWalletReady: connected && !!publicKey,
  };
};

