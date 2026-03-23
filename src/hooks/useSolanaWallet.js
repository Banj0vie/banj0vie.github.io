import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setHasProfile, fetchUserDataSuccess } from '../solana/store/slices/userSlice';
import { fetchBalancesSuccess } from '../solana/store/slices/balanceSlice';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const storedLockedHoney = localStorage.getItem('sandbox_locked_honey') || "0.00";
        dispatch(setHasProfile(true));
        dispatch(fetchUserDataSuccess({
          name: user.displayName || 'Player',
          level: 1,
          xp: 0,
          active_plot_ids: [],
          user_crops: generateFakeCrops(),
          locked_tokens: (parseFloat(storedLockedHoney) * 1e9).toString(),
          xtoken_share: "0"
        }));
        const storedHoney = localStorage.getItem('sandbox_honey') || "0.00";
        dispatch(fetchBalancesSuccess({
          gameToken: storedHoney,
          stakedBalance: storedLockedHoney,
          xTokenShare: "0.00",
          solBalance: "0.00"
        }));
      } else {
        dispatch(setHasProfile(false));
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    const handleHoney = (e) => {
      const currentLocked = localStorage.getItem('sandbox_locked_honey') || "0.00";
      dispatch(fetchBalancesSuccess({
        gameToken: e.detail,
        stakedBalance: currentLocked,
        xTokenShare: "0.00",
        solBalance: "0.00"
      }));
    };
    
    const handleLockedHoney = (e) => {
      const currentHoney = localStorage.getItem('sandbox_honey') || "0.00";
      dispatch(fetchBalancesSuccess({
        gameToken: currentHoney,
        stakedBalance: e.detail,
        xTokenShare: "0.00",
        solBalance: "0.00"
      }));
    };
    
    window.addEventListener('sandboxHoneyChanged', handleHoney);
    window.addEventListener('sandboxLockedHoneyChanged', handleLockedHoney);
    
    return () => {
      window.removeEventListener('sandboxHoneyChanged', handleHoney);
      window.removeEventListener('sandboxLockedHoneyChanged', handleLockedHoney);
    }
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
