import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA } from '../solana/utils/pdaUtils';
import { getBalance, getParsedTokenAccountsByOwner } from '../utils/requestQueue';
import { GAME_TOKEN_MINT } from '../solana/constants/programId';
import { 
  fetchBalancesSuccess, 
  startBalanceRefresh, 
  completeBalanceRefresh,
  selectBalanceRefreshing 
} from '../solana/store/slices/balanceSlice';
import { updateLockedTokens, updateXTokenShare } from '../solana/store/slices/userSlice';

export const useBalanceRefresh = () => {
  const { publicKey, connection } = useSolanaWallet();
  const { program } = useProgram();
  const dispatch = useDispatch();
  
  const isRefreshing = useSelector(selectBalanceRefreshing);
  
  // Track if a refresh is already scheduled to prevent duplicates
  const scheduledRefreshRef = useRef(false);
  const secondRefreshTimeoutRef = useRef(null);
  const lastBalanceRef = useRef(null);

  const refreshBalances = useCallback(async (retryCount = 0, maxRetries = 3) => {
    if (!program || !publicKey || !connection) {
      console.warn('Cannot refresh balances: missing program, publicKey, or connection');
      return;
    }

    // Don't start a new refresh if one is already in progress
    if (isRefreshing && retryCount === 0) {
      return;
    }

    try {
      if (retryCount === 0) {
        dispatch(startBalanceRefresh());
      }

      // Fetch user data from on-chain
      const userDataPda = getUserDataPDA(publicKey);
      const userDataRaw = await program.account.userData.fetch(userDataPda);

      // Fetch SPL token balance for GAME_TOKEN_MINT
      const parsed = await getParsedTokenAccountsByOwner(connection, publicKey, { mint: GAME_TOKEN_MINT });
      const gameTokenAmount = parsed.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;

      // Fetch SOL balance
      const lamports = await getBalance(connection, publicKey);

      // Convert on-chain fields (assumed 6 decimals)
      const lockedTokensUi = (() => {
        try { 
          return (parseFloat(userDataRaw.lockedTokens?.toString?.() ?? '0') / 1e6).toString(); 
        } catch { 
          return '0'; 
        }
      })();
      
      const xTokenShareUi = (() => {
        try { 
          return (parseFloat(userDataRaw.xtokenShare?.toString?.() ?? '0') / 1e6).toString(); 
        } catch { 
          return '0'; 
        }
      })();

      // Update all balances at once
      const balanceUpdate = {
        gameToken: (gameTokenAmount ?? 0).toString(),
        stakedBalance: lockedTokensUi,
        xTokenShare: xTokenShareUi,
        solBalance: (lamports / 1e9).toString(),
      };

      // Only update if there are actual changes
      dispatch(fetchBalancesSuccess(balanceUpdate));

      // Also update user slice to keep data in sync
      dispatch(updateLockedTokens(parseFloat(lockedTokensUi) * 1e6)); // Convert back to lamports
      dispatch(updateXTokenShare(parseFloat(xTokenShareUi) * 1e6)); // Convert back to lamports

      // Force immediate UI update by completing refresh state
      dispatch(completeBalanceRefresh());
      
      // If this is the first refresh and we got updated values, cancel the second refresh
      if (retryCount === 0 && secondRefreshTimeoutRef.current) {
        const currentBalance = `${gameTokenAmount}-${lockedTokensUi}-${xTokenShareUi}`;
        const lastBalance = lastBalanceRef.current;
        
        if (lastBalance && currentBalance !== lastBalance) {
          clearTimeout(secondRefreshTimeoutRef.current);
          secondRefreshTimeoutRef.current = null;
          scheduledRefreshRef.current = false;
        }
        
        lastBalanceRef.current = currentBalance;
      }

    } catch (err) {
      console.error('Balance refresh failed:', err);
      
      if (retryCount < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000;
        
        setTimeout(() => {
          refreshBalances(retryCount + 1, maxRetries);
        }, delay);
      } else {
        dispatch(completeBalanceRefresh());
      }
    }
  }, [program, publicKey, connection, dispatch, isRefreshing]);

  // Convenience method for post-transaction refresh with smart retry
  const refreshBalancesAfterTransaction = useCallback(async (delay = 2000) => {
    // Prevent duplicate scheduling
    if (scheduledRefreshRef.current) {
      return;
    }
    
    scheduledRefreshRef.current = true;
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          await refreshBalances();
          
          // Only do one additional refresh after 3 seconds to catch any blockchain lag
          secondRefreshTimeoutRef.current = setTimeout(async () => {
            // Check if we're still supposed to run this refresh
            if (scheduledRefreshRef.current) {
              await refreshBalances();
            }
            scheduledRefreshRef.current = false; // Reset after final attempt
            secondRefreshTimeoutRef.current = null;
          }, 3000);
          
          resolve();
        } catch (error) {
          console.error('Balance refresh failed:', error);
          scheduledRefreshRef.current = false; // Reset on error
          resolve(); // Still resolve to not block the UI
        }
      }, delay);
    });
  }, [refreshBalances]);

  // Test function to manually trigger balance refresh
  const testBalanceRefresh = useCallback(async () => {
    await refreshBalances();
  }, [refreshBalances]);

  // Expose test function globally for debugging
  if (typeof window !== 'undefined') {
    window.testBalanceRefresh = testBalanceRefresh;
  }

  // Cleanup function to cancel any pending refreshes
  const cleanup = useCallback(() => {
    if (secondRefreshTimeoutRef.current) {
      clearTimeout(secondRefreshTimeoutRef.current);
      secondRefreshTimeoutRef.current = null;
    }
    scheduledRefreshRef.current = false;
  }, []);

  return {
    refreshBalances,
    refreshBalancesAfterTransaction,
    testBalanceRefresh,
    cleanup,
    isRefreshing
  };
};
