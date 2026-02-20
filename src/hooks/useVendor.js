import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getGameRegistryPDA, getUserDataPDA, getRequestPDA, getBankerDataPDA, getItemMintAuthPDA, getEpochTop5PDA, getSponsorGameAta, getGameRegistryInfo, getRevealSeedsRemainingAccounts, getGameVaultPDA, getGameVaultAta } from '../solana/utils/pdaUtils';
import { SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { GAME_TOKEN_MINT } from '../solana/constants/programId';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { EPOCH_PERIOD } from '../utils/basic';
import { fetchBalancesSuccess, selectGameTokenBalance } from '../solana/store/slices/balanceSlice';
import { getBalance, getParsedTokenAccountsByOwner } from '../utils/requestQueue';
import { sendTransactionForPhantom } from '../utils/transactionHelper';
import { useBalanceRefresh } from './useBalanceRefresh';
import { SEED_PACK_PRICE } from '../constants/item_seed';

export const useVendor = () => {
  const { publicKey, sendTransaction } = useSolanaWallet();
  const { program, connection } = useProgram();
  const dispatch = useDispatch();
  const gameToken = useSelector(selectGameTokenBalance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { refreshBalancesAfterTransaction } = useBalanceRefresh();

  // Function to refresh user balances after transactions
  const refreshBalances = useCallback(async () => {
    if (!program || !publicKey) return;
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
    } catch (err) {
      console.error('Failed to refresh balances:', err);
    }
  }, [program, publicKey, connection, dispatch]);

  const buySeedPack = useCallback(async (tier, count) => {
    if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
    if (loading) { setError('Transaction already in progress'); return null; }
    setLoading(true); setError(null);
    try {
      const userDataPda = getUserDataPDA(publicKey);
      // Require profile (UserData) to exist before buy; otherwise program fails with AccountDiscriminatorMismatch
      try {
        await program.account.userData.fetch(userDataPda);
      } catch (e) {
        setError('Please create a profile first before buying seed packs.');
        setLoading(false);
        return null;
      }
      const pendingKey = `seedNonce:${publicKey.toBase58()}`;
      // Enforce one pending request per account
      const existing = localStorage.getItem(pendingKey);
      if (existing) {
        const parsed = JSON.parse(existing);
        const existingNonce = Math.floor(Number(parsed.requestId));
        const existingReqPda = getRequestPDA(publicKey, new BN(existingNonce));
        const reqData = await program.account.request.fetch(existingReqPda);
        if (!reqData.revealed) {
          setError('Pending seed pack request not revealed yet');
          setLoading(false);
          return null;
        }
      }
      // Check user has enough GAME tokens to buy the requested seed packs (from Redux)
      const gameTokenBalance = Math.floor(Number(gameToken || 0) * 1e9);
      const tierU8 = Number(tier);
      const pricePerPack = Number(SEED_PACK_PRICE[tierU8] ?? 0);
      const totalCost = Math.floor(pricePerPack * 1e9 * Number(count));
      if (gameTokenBalance < totalCost) {
        setError(`Insufficient $HNY balance: Need ${totalCost / 1e9} but you have ${gameTokenBalance / 1e9}`);
        setLoading(false);
        return null;
      }
      // Generate a more unique nonce to prevent duplicate transactions (must be integer for Request PDA)
      const nonce = Math.floor(Date.now() + Math.random() * 1000000);
      const gameRegistryPda = getGameRegistryPDA();
      const bankerDataPda = getBankerDataPDA();
      const gameVaultPda = getGameVaultPDA();
      const gameVaultAta = getGameVaultAta();
      const requestPda = getRequestPDA(publicKey, new BN(nonce));
      const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
      const gameRegistryInfo = await getGameRegistryInfo(program);
      const epochStart = Math.floor(Number(gameRegistryInfo.epochStart?.toString?.() ?? 0));
      const epochCurrent = Math.floor(Number(gameRegistryInfo.epoch?.toString?.() ?? 0));
      const nowSec = Math.floor(Date.now() / 1000);
      const epoch = (epochStart + EPOCH_PERIOD) > nowSec ? epochCurrent : epochCurrent + 1;
      const epochU32 = (epoch >>> 0) & 0xffffffff;
      const epochTop5Pda = getEpochTop5PDA(epochU32);
      const sponsorGameAta = await getSponsorGameAta(program, publicKey);
      let remainingAccounts = [];
      remainingAccounts.push({ pubkey: userDataPda, isWritable: true, isSigner: false });
      remainingAccounts.push({ pubkey: bankerDataPda, isWritable: true, isSigner: false });
      remainingAccounts.push({ pubkey: userGameAta, isWritable: true, isSigner: false });
      remainingAccounts.push({ pubkey: epochTop5Pda, isWritable: true, isSigner: false });
      remainingAccounts.push({ pubkey: sponsorGameAta, isWritable: true, isSigner: false });
      const method = program.methods
        .buySeedPack(tier, new BN(count), new BN(nonce), epochU32)
        .accounts({
          buyer: publicKey,
          gameRegistry: gameRegistryPda,
          request: requestPda,
          gameTokenMint: GAME_TOKEN_MINT,
          gameVault: gameVaultPda,
          gameVaultAta: gameVaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts);
      
      const result = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      
      // Store pending request on success
      if (result) {
        localStorage.setItem(pendingKey, JSON.stringify({requestId: nonce, tier, count}));
        
        // Refresh balances after successful purchase
        await refreshBalancesAfterTransaction(1000);
        
        return { txHash: result, tier, isPending: false };
      } else {
        return null;
      }
    } catch (err) { 
      console.log("🚀 ~ useVendor ~ err:", err); 
      const msg = err?.message ?? String(err);
      const isDiscriminatorMismatch = msg.includes('AccountDiscriminatorMismatch') || msg.includes('0xbba') || (err?.code === 3002);
      setError(isDiscriminatorMismatch
        ? 'A program account could not be loaded. Ensure you have created a profile first. If the issue persists, the program may need to be re-initialized for this epoch.'
        : msg);
      return null; 
    } finally { 
      setLoading(false); 
    }
  }, [program, publicKey, gameToken]);

  const getPackPrice = (tier) => { if (tier == 1) return 1000000; if (tier == 2) return 2000000; if (tier == 3) return 10000000; if (tier == 4) return 25000000; return 0; };

  const getAllPendingRequests = useCallback(async () => {
    if (!program || !publicKey) return [];
    try {
      const pendingKey = `seedNonce:${publicKey.toBase58()}`;
      const raw = localStorage.getItem(pendingKey);
      if (!raw) return [];
      const {requestId, tier, count} = JSON.parse(raw);
      const requestIdInt = Math.floor(Number(requestId));
      try {
        const requestPda = getRequestPDA(publicKey, new BN(requestIdInt));
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
      let tx = null;
      for (let attempt = 0; attempt < 8; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
        tx = await connection.getTransaction(txSig, {
          maxSupportedTransactionVersion: 0,
          commitment: "confirmed",
        });
        if (tx) break;
      }
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
  }, [program, publicKey, connection]);

  const revealSeeds = useCallback(async () => {
    if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
    setLoading(true); setError(null);
    
    // Declare variables outside try block so they're accessible in catch block
    let requestId, tier, count;
    
    try {
      // INSERT_YOUR_CODE
      const pendingKey = `seedNonce:${publicKey.toBase58()}`;
      const raw = localStorage.getItem(pendingKey);
      if (!raw) {
        setError('No pending seed nonce found in local storage');
        setLoading(false);
        return null;
      }
      ({requestId, tier, count} = JSON.parse(raw));
      const requestIdInt = Math.floor(Number(requestId));
      
      // Check if the request has already been revealed
      const gameRegistryPda = getGameRegistryPDA();
      const requestPda = getRequestPDA(publicKey, new BN(requestIdInt));
      
      try {
        const requestData = await program.account.request.fetch(requestPda);
        if (requestData.revealed) {
          console.log('Request already revealed, cleaning up localStorage');
          localStorage.removeItem(pendingKey);
          setLoading(false);
          return 'already_revealed';
        }
      } catch (err) {
        console.log('Request account not found or error fetching:', err);
        // Continue with the reveal attempt
      }
      
      const itemMintAuthPda = getItemMintAuthPDA();
      const remainingAccounts = await getRevealSeedsRemainingAccounts(publicKey, tier);
      const method = program.methods
        .revealSeeds(new BN(requestIdInt))
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
        .remainingAccounts(remainingAccounts);
      
      const result = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);

      // Clean up pending request and refresh balances
      localStorage.removeItem(`seedNonce:${publicKey.toBase58()}`);
      await refreshBalances();
      
      if (result) {
        return result;
      } else {
        return null;
      }
    } catch (err) {
      console.log("🚀 ~ useVendor ~ err:", err);
      setError(err.message);
      return null; 
    } finally { setLoading(false); }
  }, [program, publicKey]);

  return { buySeedPack, getPackPrice, getAllPendingRequests, revealSeeds, listenForSeedsRevealed, loading, error };
};


