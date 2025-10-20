import { useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getGameRegistryPDA, getUserDataPDA, getRequestPDA, getBankerDataPDA, getItemMintAuthPDA, getGameTokenMintAuthPDA, getEpochTop5PDA, getSponsorGameAta, getGameRegistryInfo, getRevealSeedsRemainingAccounts, preIx } from '../solana/utils/pdaUtils';
import { SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { GAME_TOKEN_MINT, LOOKUP_TABLE_ADDRESS } from '../solana/constants/programId';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

export const useVendor = () => {
  const { publicKey, sendTransaction } = useSolanaWallet();
  const valleyProgram = useProgram();
  const program = valleyProgram.getProgram();
  const connection = valleyProgram.getConnection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buySeedPack = useCallback(async (tier, count) => {
    if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
    setLoading(true); setError(null);
    try {
      const pendingKey = `seedNonce:${publicKey.toBase58()}`;
      // Enforce one pending request per account
      const existing = localStorage.getItem(pendingKey);
      if (existing) {
        const existingNonce = Number(existing.requestId);
        const existingReqPda = getRequestPDA(publicKey, new BN(existingNonce));
        const reqData = await program.account.request.fetch(existingReqPda);
        if (!reqData.revealed) {
          setError('Pending seed pack request not revealed yet');
          return null;
        }
      }
      const nonce = Date.now();
      const gameRegistryPda = getGameRegistryPDA();
      const userDataPda = getUserDataPDA(publicKey);
      const bankerDataPda = getBankerDataPDA(publicKey);
      const requestPda = getRequestPDA(publicKey, new BN(nonce));
      const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
      const gameTokenMintAuthPda = getGameTokenMintAuthPDA();
      const gameRegistryInfo = await getGameRegistryInfo(program);
      const remainingAccounts = [];
      const epochTop5Pda = getEpochTop5PDA(gameRegistryInfo.epoch - 1);
      remainingAccounts.push({ pubkey: epochTop5Pda, isWritable: true, isSigner: false });
      const sponsorGameAta = await getSponsorGameAta(program, publicKey);
      remainingAccounts.push({ pubkey: sponsorGameAta, isWritable: true, isSigner: false });
      const tx = await program.methods
      .buySeedPack(tier, new BN(count), new BN(nonce))
      .accounts({
        buyer: publicKey,
        gameRegistry: gameRegistryPda,
        userData: userDataPda,
        bankerData: bankerDataPda,
        buyerGameAta: userGameAta,
        gameTokenMint: GAME_TOKEN_MINT,
        gameTokenMintAuth: gameTokenMintAuthPda,
        request: requestPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts(remainingAccounts)
      .rpc();
      localStorage.setItem(pendingKey, JSON.stringify({requestId: nonce, tier, count}));
      return { txHash: tx, tier, isPending: false };
    } catch (err) { 
      console.log("🚀 ~ useVendor ~ err:", err); setError(err.message); return null; 
    } finally { 
      setLoading(false); 
    }
  }, [program, publicKey]);

  const getPackPrice = (tier) => { if (tier == 1) return 1000000; if (tier == 2) return 2000000; if (tier == 3) return 10000000; if (tier == 4) return 25000000; return 0; };

  const getAllPendingRequests = useCallback(async () => {
    if (!program || !publicKey) return [];
    try {
      const pendingKey = `seedNonce:${publicKey.toBase58()}`;
      const raw = localStorage.getItem(pendingKey);
      if (!raw) return [];
      const {requestId, tier, count} = JSON.parse(raw);
      try {
        const requestPda = getRequestPDA(publicKey, new BN(requestId));
        const requestData = await program.account.request.fetch(requestPda);
        if (requestData.revealed) {
          localStorage.removeItem(pendingKey);
          return [];
        }
        return [{requestId: requestId, tier: tier, count: count}];
      } catch {
        // If account missing, clear and return none
        localStorage.removeItem(pendingKey);
        return [];
      }
    } catch (err) { setError(err.message); return []; }
  }, [program, publicKey]);

  const listenForSeedsRevealed = useCallback(async (txSig, onRevealed) => {
    if (!program || !publicKey) return null;
    setLoading(true); setError(null);
    try {
      const tx = await connection.getTransaction(txSig, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      if (!tx) throw new Error("tx not found");
      const logs = tx.meta?.logMessages ?? [];
      const revealedSeeds = [];
      for (const log of logs) {
        if (log.includes("BuyItem")) {
          const itemIds = log.split(";;")[1];
          revealedSeeds.push(Number(itemIds));
        }
      }
      onRevealed({seedIds: revealedSeeds});
    } catch (err) { setError(err.message); return null; } finally { setLoading(false); }
  }, [program, publicKey]);

  const revealSeeds = useCallback(async () => {
    if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
    setLoading(true); setError(null);
    try {
      // INSERT_YOUR_CODE
      const pendingKey = `seedNonce:${publicKey.toBase58()}`;
      const raw = localStorage.getItem(pendingKey);
      if (!raw) {
        setError('No pending seed nonce found in local storage');
        setLoading(false);
        return null;
      }
      const {requestId, tier, count} = JSON.parse(raw);
      const gameRegistryPda = getGameRegistryPDA();
      const requestPda = getRequestPDA(publicKey, new BN(requestId));
      const itemMintAuthPda = getItemMintAuthPDA();
      const remainingAccounts = await getRevealSeedsRemainingAccounts(publicKey, tier);
      const buyIx = await program.methods
        .revealSeeds(new BN(requestId))
        .accounts({
          buyer: publicKey,
          gameRegistry: gameRegistryPda,
          itemMintAuth: itemMintAuthPda,
          request: requestPda,
          slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
      const { value: alt } = await connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS);
      if (!alt) throw new Error('ALT not found');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const msgV0 = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: [...preIx, buyIx],
      }).compileToV0Message([alt]);
      const tx = new VersionedTransaction(msgV0);
      const sig = await sendTransaction(tx, connection, { skipPreflight: false, maxRetries: 3 });
      console.log("🚀 ~ useVendor ~ sig:", sig)
      await connection.confirmTransaction({signature: sig, blockhash, lastValidBlockHeight});
      localStorage.removeItem(`seedNonce:${publicKey.toBase58()}`);
      return sig;
    } catch (err) {
      console.log("🚀 ~ useVendor ~ err:", err);
      setError(err.message); return null; 
    } finally { setLoading(false); }
  }, [program, publicKey]);

  return { buySeedPack, getPackPrice, getAllPendingRequests, revealSeeds, listenForSeedsRevealed, loading, error };
};


