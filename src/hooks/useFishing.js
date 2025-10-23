import { useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getGameRegistryPDA, getFishingRequestPDA, getItemMintAuthPDA, getCraftBaitRemainingAccounts, getCraftBaitSpecificRemainingAccounts, getCraftBait1RemainingAccounts, getRevealFishingRemainingAccounts } from '../solana/utils/pdaUtils';
import { SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { ID_BAIT_ITEMS } from '../constants/app_ids';
import { sendTransactionForPhantom } from '../utils/transactionHelper';

export const useFishing = () => {
  const { publicKey, connection, sendTransaction } = useSolanaWallet();
  const valleyProgram = useProgram();
  const program = valleyProgram.getProgram();
  const [fishingData, setFishingData] = useState({ loading: false, error: null, pendingRequests: [] });

  const storageKey = () => {
    try { 
      return publicKey ? `fishingNonce:${publicKey.toString()}` : `fishingNonce`; 
    } catch { return 'fishingNonce'; }
  };

  const readStoredNonce = () => {
    try {
      const raw = localStorage.getItem(storageKey());
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data.requestId;
    } catch { return null; }
  };

  const writeStoredNonce = (nonce, baitId, amount) => {
    try { 
      const key = storageKey(); 
      if (nonce == null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify({requestId: nonce, baitId, amount}));
      }
    } catch {}
  };

  const ensureNoUnrevealedPending = useCallback(async () => {
    if (!program || !publicKey) return true;
    const existing = readStoredNonce();
    if (existing == null) return true;
    try {
      const reqPda = getFishingRequestPDA(publicKey, new BN(existing));
      const req = await program.account.fishingRequest.fetch(reqPda);
      if (req.revealed) {
        writeStoredNonce(null);
        return true;
      }
      return false;
    } catch {
      // If fetch fails, clear the stale nonce and allow
      writeStoredNonce(null);
      return true;
    }
  }, [program, publicKey]);

  const craftBait1 = useCallback(async (baitCount) => {
    if (!program || !publicKey) return null;
    if (fishingData.loading) {
      setFishingData(prev => ({ ...prev, error: 'Transaction already in progress' }));
      return null;
    }
    
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const remainingAccounts = getCraftBait1RemainingAccounts(publicKey);
      
      const method = program.methods
        .craftBait1(new BN(baitCount))
        .accounts({
          user: publicKey,
          gameRegistry: gameRegistryPda,
          userData: userDataPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts);
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: tx, isPending: false };
    } catch (err) {
      console.error('craftBait1 error:', err);
      
      // Handle specific transaction errors
      let errorMessage = err.message;
      if (err.message.includes('already been processed')) {
        errorMessage = 'Transaction already submitted. Please wait and try again.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this transaction.';
      } else if (err.message.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled by user.';
      } else if (err.message.includes('encoding overruns Uint8Array')) {
        errorMessage = 'Transaction too large. Please try with fewer items.';
      }
      
      setFishingData(prev => ({ ...prev, loading: false, error: errorMessage }));
      return null;
    }
  }, [program, publicKey, fishingData.loading]);

  const craftBait2 = useCallback(async (itemIds, amounts) => {
    if (!program || !publicKey) return null;
    if (fishingData.loading) {
      setFishingData(prev => ({ ...prev, error: 'Transaction already in progress' }));
      return null;
    }
    
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      
      // Use specific remaining accounts if itemIds is valid, otherwise fall back to general
      let remainingAccounts;
      if (Array.isArray(itemIds) && itemIds.length > 0) {
        remainingAccounts = getCraftBaitSpecificRemainingAccounts(publicKey, itemIds, ID_BAIT_ITEMS.BAIT_2);
      } else {
        remainingAccounts = getCraftBaitRemainingAccounts(publicKey);
      }
      
      const method = program.methods
        .craftBait2(itemIds, amounts.map(a => new BN(a)))
        .accounts({
          user: publicKey,
          gameRegistry: gameRegistryPda,
          userData: userDataPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts);
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: tx, isPending: false };
    } catch (err) {
      console.error('craftBait2 error:', err);
      
      // Handle specific transaction errors
      let errorMessage = err.message;
      if (err.message.includes('already been processed')) {
        errorMessage = 'Transaction already submitted. Please wait and try again.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this transaction.';
      } else if (err.message.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled by user.';
      } else if (err.message.includes('encoding overruns Uint8Array')) {
        errorMessage = 'Transaction too large. Please try with fewer items.';
      }
      
      setFishingData(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage); // Re-throw with better error message
    }
  }, [program, publicKey, fishingData.loading]);

  const craftBait3 = useCallback(async (itemIds, amounts) => {
    if (!program || !publicKey) return null;
    if (fishingData.loading) {
      setFishingData(prev => ({ ...prev, error: 'Transaction already in progress' }));
      return null;
    }
    
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      
      // Use specific remaining accounts if itemIds is valid, otherwise fall back to general
      let remainingAccounts;
      if (Array.isArray(itemIds) && itemIds.length > 0) {
        remainingAccounts = getCraftBaitSpecificRemainingAccounts(publicKey, itemIds, ID_BAIT_ITEMS.BAIT_3);
      } else {
        remainingAccounts = getCraftBaitRemainingAccounts(publicKey);
      }
      
      const method = program.methods
        .craftBait3(itemIds, amounts.map(a => new BN(a)))
        .accounts({
          user: publicKey,
          gameRegistry: gameRegistryPda,
          userData: userDataPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts);
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: tx, isPending: false };
    } catch (err) {
      console.error('craftBait3 error:', err);
      
      // Handle specific transaction errors
      let errorMessage = err.message;
      if (err.message.includes('already been processed')) {
        errorMessage = 'Transaction already submitted. Please wait and try again.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this transaction.';
      } else if (err.message.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled by user.';
      } else if (err.message.includes('encoding overruns Uint8Array')) {
        errorMessage = 'Transaction too large. Please try with fewer items.';
      }
      
      setFishingData(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage); // Re-throw with better error message
    }
  }, [program, publicKey, fishingData.loading]);

  const fish = useCallback(async (baitId, amount = 1, nonce = null) => {
    if (!program || !publicKey) return null;
    if (fishingData.loading) {
      setFishingData(prev => ({ ...prev, error: 'Transaction already in progress' }));
      return null;
    }
    
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      // Do not allow a new request if there is an unrevealed one
      const allowed = await ensureNoUnrevealedPending();
      if (!allowed) {
        setFishingData(prev => ({ ...prev, loading: false, error: 'Pending fishing request not revealed yet' }));
        return null;
      }
      
      // Check if there's already a pending request to prevent duplicates
      const existingNonce = readStoredNonce();
      if (existingNonce) {
        setFishingData(prev => ({ ...prev, loading: false, error: 'You already have a pending fishing request. Please reveal it first.' }));
        return null;
      }
      
      // Generate a unique nonce if not provided
      const finalNonce = nonce || Date.now() + Math.random() * 1000000;
      
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const fishingRequestPda = getFishingRequestPDA(publicKey, new BN(finalNonce));
      
      // Add remaining accounts for bait burning
      const remainingAccounts = getCraftBaitSpecificRemainingAccounts(publicKey, [baitId], baitId);
      
      const method = program.methods
        .fish(baitId, amount, new BN(finalNonce))
        .accounts({
          user: publicKey,
          gameRegistry: gameRegistryPda,
          userData: userDataPda,
          request: fishingRequestPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts);
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      writeStoredNonce(finalNonce, baitId, amount);
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: tx, isPending: false };
    } catch (err) {
      console.error('fish error:', err);
      
      // Handle specific transaction errors
      let errorMessage = err.message;
      if (err.message.includes('already been processed')) {
        errorMessage = 'Transaction already submitted. Please wait and try again.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this transaction.';
      } else if (err.message.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled by user.';
      } else if (err.message.includes('encoding overruns Uint8Array')) {
        errorMessage = 'Transaction too large. Please try with fewer items.';
      }
      
      setFishingData(prev => ({ ...prev, loading: false, error: errorMessage }));
      return null;
    }
  }, [program, publicKey, ensureNoUnrevealedPending, fishingData.loading]);

  const getAllPendingRequests = useCallback(async () => {
    if (!program || !publicKey) return [];
    try {
      const raw = localStorage.getItem(storageKey());
      if (!raw) return [];
      const {requestId, baitId, amount} = JSON.parse(raw);
      try {
        const reqPda = getFishingRequestPDA(publicKey, new BN(requestId));
        const req = await program.account.fishingRequest.fetch(reqPda);
        if (req.revealed) {
          localStorage.removeItem(storageKey());
          return [];
        }
        return [{
          requestId: requestId,
          baitId: Number(baitId || 0),
          amount: Number(amount || 0),
          level: Number(req.level || 0),
        }];
      } catch {
        // If account missing, clear and return none
        localStorage.removeItem(storageKey());
        return [];
      }
    } catch {
      return [];
    }
  }, [program, publicKey]);

  const checkPendingRequests = useCallback(async () => {
    const list = await getAllPendingRequests();
    return list.length > 0;
  }, [getAllPendingRequests]);

  const revealFishing = useCallback(async (requestId) => {
    if (!program || !publicKey) return null;
    if (fishingData.loading) {
      setFishingData(prev => ({ ...prev, error: 'Transaction already in progress' }));
      return null;
    }
    
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      
      // Get stored fishing request data
      const raw = localStorage.getItem(storageKey());
      if (!raw) {
        setFishingData(prev => ({ ...prev, loading: false, error: 'No pending fishing request found' }));
        return null;
      }
      const {requestId: storedRequestId} = JSON.parse(raw);
      
      // Check if the fishing request has already been revealed
      try {
        const fishingRequestPda = getFishingRequestPDA(publicKey, new BN(storedRequestId));
        const request = await program.account.fishingRequest.fetch(fishingRequestPda);
        if (request.revealed) {
          setFishingData(prev => ({ ...prev, loading: false, error: 'This fishing request has already been revealed' }));
          localStorage.removeItem(storageKey()); // Clean up
          return null;
        }
      } catch (err) {
      }
      
      const gameRegistryPda = getGameRegistryPDA();
      const fishingRequestPda = getFishingRequestPDA(publicKey, new BN(storedRequestId));
      const itemMintAuthPda = getItemMintAuthPDA();
      const remainingAccounts = getRevealFishingRemainingAccounts(publicKey);
      
      const method = program.methods
        .revealFishing(new BN(storedRequestId))
        .accounts({
          user: publicKey,
          gameRegistry: gameRegistryPda,
          itemMintAuth: itemMintAuthPda,
          request: fishingRequestPda,
          slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts);
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      
      localStorage.removeItem(storageKey());
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: tx, isPending: false };
    } catch (err) {
      console.error('revealFishing error:', err);
      
      // Handle specific transaction errors
      let errorMessage = err.message;
      if (err.message.includes('already been processed')) {
        errorMessage = 'Transaction already submitted. Please wait and try again.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this transaction.';
      } else if (err.message.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled by user.';
      } else if (err.message.includes('encoding overruns Uint8Array')) {
        errorMessage = 'Transaction too large. Please try with fewer items.';
      }
      
      setFishingData(prev => ({ ...prev, loading: false, error: errorMessage }));
      return null;
    }
  }, [program, publicKey, fishingData.loading]);

  const listenForFishingResults = useCallback(async (txSig, onResults) => {
    if (!program || !publicKey) return null;
    setFishingData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { connection } = program.provider;
      const tx = await connection.getTransaction(txSig, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      if (!tx) throw new Error("tx not found");
      const logs = tx.meta?.logMessages ?? [];
      const fishingResults = [];
      for (const log of logs) {
        if (log.includes("FishingItem")) {
          const itemId = log.split(";;")[1];
          fishingResults.push(Number(itemId));
        }
      }
      onResults({itemIds: fishingResults});
    } catch (err) { 
      setFishingData(prev => ({ ...prev, loading: false, error: err.message })); 
      return null; 
    } finally { 
      setFishingData(prev => ({ ...prev, loading: false })); 
    }
  }, [program, publicKey]);

  return { fishingData, craftBait1, craftBait2, craftBait3, fish, revealFishing, listenForFishingResults, getAllPendingRequests, checkPendingRequests };
};


