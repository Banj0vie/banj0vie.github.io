import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setHasProfile, fetchUserDataSuccess } from '../solana/store/slices/userSlice';
import { fetchBalancesSuccess } from '../solana/store/slices/balanceSlice';

// --- SANDBOX HELPERS ---
const generateFakeCrops = () => {
  return new Array(30).fill(null).map((_, i) => ({
    id: 0,
    end_time: 0,
    prod_multiplier: 1000,
    token_multiplier: 1000,
    growth_elixir: 0
  }));
};

/**
 * SANDBOX EDITION: useSolanaWallet
 * Bypasses all blockchain checks so you can play with the UI and add features.
 */
export const useSolanaWallet = () => {
  const dispatch = useDispatch();

  // 1. Hardcoded Account Info
  const [account] = useState("Logan_Sandbox_User");
  const [publicKey] = useState("LoganSandboxAddress111111111111111111111111");

  // 2. Force the App to think we are logged in with a profile
  useEffect(() => {
    // Set a fake profile in Redux
    dispatch(setHasProfile(true));
    
    // Set fake user stats (Level 99, lots of XP)
    dispatch(fetchUserDataSuccess({
      name: 'Logan_Dev',
      level: 99,
      xp: 5000,
      active_plot_ids: [0, 1, 2],
      user_crops: generateFakeCrops(),
      locked_tokens: "1000000000",
      xtoken_share: "500000000"
    }));

    // Set fake balances (10,000 Game Tokens and 50 SOL)
    dispatch(fetchBalancesSuccess({
      gameToken: "10000.00",
      stakedBalance: "1000.00",
      xTokenShare: "500.00",
      solBalance: "50.00"
    }));
  }, [dispatch]);

  // 3. Fake functions so buttons don't crash when clicked
  const connectWallet = useCallback(async () => {
    console.log("Sandbox: Connection is automatic.");
  }, []);

  const disconnectWallet = useCallback(async () => {
    console.log("Sandbox: Disconnect disabled in dev mode.");
  }, []);

  const signMessage = useCallback(async (message) => {
    console.log("Sandbox signing message:", message);
    return new Uint8Array([1, 2, 3]);
  }, []);

  const sendTransaction = useCallback(async (tx) => {
    console.log("Sandbox simulating transaction...");
    return "SANDBOX_TX_SUCCESS_LOGAN";
  }, []);

  return {
    // Wallet state
    account,
    publicKey,
    wallet: { name: 'Sandbox Mode', adapter: { name: 'Sandbox' } },
    isConnected: true, 
    isConnecting: false,
    isDisconnecting: false,
    error: null,
    hasProfile: true,
    loading: false,
    
    // Wallet actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    select: () => {},
    refreshProfileStatus: async () => true,
    refreshBalances: async () => {},
    signMessage,
    sendTransaction,
    
    // Additional info
    walletName: "Sandbox Mode",
    wallets: [],
    connection: null, 
    
    isWalletReady: true
  };
};

