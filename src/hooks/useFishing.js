import { useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getGameRegistryPDA, getFishingRequestPDA, getItemMintAuthPDA } from '../solana/utils/pdaUtils';
import { SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';

export const useFishing = () => {
  const { publicKey } = useSolanaWallet();
  const program = useProgram();
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
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    } catch { return null; }
  };

  const writeStoredNonce = (nonce) => {
    try { const key = storageKey(); if (nonce == null) localStorage.removeItem(key); else localStorage.setItem(key, String(nonce)); } catch {}
  };

  const ensureNoUnrevealedPending = useCallback(async () => {
    if (!program || !publicKey) return true;
    const existing = readStoredNonce();
    if (existing == null) return true;
    try {
      const [reqPda] = getFishingRequestPDA(publicKey, new BN(existing));
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
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      const [gameRegistryPda] = getGameRegistryPDA();
      const [userDataPda] = getUserDataPDA(publicKey);
      const tx = await program.methods
        .craftBait1(new BN(baitCount))
        .accounts({
          user: publicKey,
          gameRegistry: gameRegistryPda,
          userData: userDataPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: tx, isPending: false };
    } catch (err) {
      setFishingData(prev => ({ ...prev, loading: false, error: err.message }));
      return null;
    }
  }, [program, publicKey]);

  const craftBait2 = useCallback(async (itemIds, amounts) => {
    if (!program || !publicKey) return null;
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      const [gameRegistryPda] = getGameRegistryPDA();
      const [userDataPda] = getUserDataPDA(publicKey);
      const tx = await program.methods
        .craftBait2(itemIds, amounts.map(a => new BN(a)))
        .accounts({
          user: publicKey,
          gameRegistry: gameRegistryPda,
          userData: userDataPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: tx, isPending: false };
    } catch (err) {
      setFishingData(prev => ({ ...prev, loading: false, error: err.message }));
      return null;
    }
  }, [program, publicKey]);

  const craftBait3 = useCallback(async (itemIds, amounts) => {
    if (!program || !publicKey) return null;
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      const [gameRegistryPda] = getGameRegistryPDA();
      const [userDataPda] = getUserDataPDA(publicKey);
      const tx = await program.methods
        .craftBait3(itemIds, amounts.map(a => new BN(a)))
        .accounts({
          user: publicKey,
          gameRegistry: gameRegistryPda,
          userData: userDataPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: tx, isPending: false };
    } catch (err) {
      setFishingData(prev => ({ ...prev, loading: false, error: err.message }));
      return null;
    }
  }, [program, publicKey]);

  const fish = useCallback(async (baitId, amount = 1, nonce = Date.now()) => {
    if (!program || !publicKey) return null;
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      // Do not allow a new request if there is an unrevealed one
      const allowed = await ensureNoUnrevealedPending();
      if (!allowed) {
        setFishingData(prev => ({ ...prev, loading: false, error: 'Pending fishing request not revealed yet' }));
        return null;
      }
      const [gameRegistryPda] = getGameRegistryPDA();
      const [userDataPda] = getUserDataPDA(publicKey);
      const [fishingRequestPda] = getFishingRequestPDA(publicKey, new BN(nonce));
      const tx = await program.methods
        .fish(baitId, amount, new BN(nonce))
        .accounts({
          user: publicKey,
          gameRegistry: gameRegistryPda,
          userData: userDataPda,
          request: fishingRequestPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      writeStoredNonce(nonce);
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: tx, isPending: false };
    } catch (err) {
      setFishingData(prev => ({ ...prev, loading: false, error: err.message }));
      return null;
    }
  }, [program, publicKey, ensureNoUnrevealedPending]);

  const getAllPendingRequests = useCallback(async () => {
    if (!program || !publicKey) return [];
    try {
      const nonce = readStoredNonce();
      if (nonce == null) return [];
      try {
        const [reqPda] = getFishingRequestPDA(publicKey, new BN(nonce));
        const req = await program.account.fishingRequest.fetch(reqPda);
        if (req.revealed) {
          writeStoredNonce(null);
          return [];
        }
        return [{
          requestId: reqPda.toString(),
          baitId: Number(req.baitId || 0),
          amount: Number(req.amount || 0),
          level: Number(req.level || 0),
          nonce,
        }];
      } catch {
        writeStoredNonce(null);
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

  const revealFishing = useCallback(async (nonce) => {
    if (!program || !publicKey) return null;
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      const [gameRegistryPda] = getGameRegistryPDA();
      const [userDataPda] = getUserDataPDA(publicKey);
      const [fishingRequestPda] = getFishingRequestPDA(publicKey, new BN(nonce));
      const [itemMintAuthPda] = getItemMintAuthPDA();
      const tx = await program.methods
        .revealFishing(new BN(nonce))
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
        .rpc();
      writeStoredNonce(null);
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: tx, isPending: false };
    } catch (err) {
      setFishingData(prev => ({ ...prev, loading: false, error: err.message }));
      return null;
    }
  }, [program, publicKey]);

  return { fishingData, craftBait1, craftBait2, craftBait3, fish, revealFishing, getAllPendingRequests, checkPendingRequests };
};


