import { useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getGameRegistryPDA, getFishingRequestPDA, getItemMintAuthPDA, getCraftBaitRemainingAccounts, getCraftBaitSpecificRemainingAccounts, getCraftBait1RemainingAccounts, getRevealFishingRemainingAccounts, getReceiverPDA } from '../solana/utils/pdaUtils';
import { SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { ID_BAIT_ITEMS, ID_CHEST_ITEMS, ID_FISH_ITEMS } from '../constants/app_ids';
import { sendTransactionForPhantom } from '../utils/transactionHelper';

export const useFishing = () => {
  const { publicKey, connection, sendTransaction } = useSolanaWallet();
  const { program } = useProgram();
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
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[ID_BAIT_ITEMS.BAIT_1] = (sandboxLoot[ID_BAIT_ITEMS.BAIT_1] || 0) + Number(baitCount);
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      await new Promise(r => setTimeout(r, 500));
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: "SANDBOX_TX_CRAFT_BAIT1", isPending: false };
    } catch (err) {
      setFishingData(prev => ({ ...prev, loading: false, error: err.message }));
      return null;
    }
  }, []);

  const craftBait2 = useCallback(async (itemIds, amounts) => {
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[ID_BAIT_ITEMS.BAIT_2] = (sandboxLoot[ID_BAIT_ITEMS.BAIT_2] || 0) + 1;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      await new Promise(r => setTimeout(r, 500));
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: "SANDBOX_TX_CRAFT_BAIT2", isPending: false };
    } catch (err) {
      setFishingData(prev => ({ ...prev, loading: false, error: err.message }));
      throw new Error(err.message);
    }
  }, []);

  const craftBait3 = useCallback(async (itemIds, amounts) => {
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[ID_BAIT_ITEMS.BAIT_3] = (sandboxLoot[ID_BAIT_ITEMS.BAIT_3] || 0) + 1;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      await new Promise(r => setTimeout(r, 500));
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: "SANDBOX_TX_CRAFT_BAIT3", isPending: false };
    } catch (err) {
      setFishingData(prev => ({ ...prev, loading: false, error: err.message }));
      throw new Error(err.message);
    }
  }, []);

  const fish = useCallback(async (baitId, amount = 1, nonce = null) => {
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
      writeStoredNonce(finalNonce, baitId, amount);
      await new Promise(r => setTimeout(r, 500));
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: "SANDBOX_TX_FISH", isPending: false };
    } catch (err) {
      setFishingData(prev => ({ ...prev, loading: false, error: err.message }));
      return null;
    }
  }, [ensureNoUnrevealedPending]);

  const getAllPendingRequests = useCallback(async () => {
    try {
      const raw = localStorage.getItem(storageKey());
      if (!raw) return [];
      const {requestId, baitId, amount} = JSON.parse(raw);
      return [{
        requestId: requestId,
        baitId: Number(baitId || 0),
        amount: Number(amount || 0),
        level: 1,
      }];
    } catch {
      return [];
    }
  }, []);

  const checkPendingRequests = useCallback(async () => {
    const list = await getAllPendingRequests();
    return list.length > 0;
  }, [getAllPendingRequests]);

  const revealFishing = useCallback(async (requestId) => {
    try {
      setFishingData(prev => ({ ...prev, loading: true, error: null }));
      
      // Get stored fishing request data
      const raw = localStorage.getItem(storageKey());
      if (!raw) {
        setFishingData(prev => ({ ...prev, loading: false, error: 'No pending fishing request found' }));
        return null;
      }
      
      // Save the bait type so we know what table to use in the results
      const requestData = JSON.parse(raw);
      localStorage.setItem('sandbox_last_bait', requestData.baitId || ID_BAIT_ITEMS.BAIT_1);
      
      localStorage.removeItem(storageKey());
      await new Promise(r => setTimeout(r, 500));
      setFishingData(prev => ({ ...prev, loading: false }));
      return { txHash: "SANDBOX_TX_REVEAL", isPending: false };
    } catch (err) {
      setFishingData(prev => ({ ...prev, loading: false, error: err.message }));
      return null;
    }
  }, []);

  const listenForFishingResults = useCallback(async (txSig, onResults) => {
    setFishingData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const rewards = [];
      const roll = Math.random() * 100;
      
      // Retrieve the bait we saved during reveal
      const baitId = Number(localStorage.getItem('sandbox_last_bait')) || ID_BAIT_ITEMS.BAIT_1;

      // Define drop rates based on Bait Level
      let legendaryChance = 1, epicChance = 10, rareChance = 30, uncommonChance = 60;
      let chestGold = 1, chestSilver = 5, chestBronze = 15, chestWood = 30;

      if (baitId === ID_BAIT_ITEMS.BAIT_2) {
        // Bait II: Boosts chances moderately
        legendaryChance = 3;  // 3% 
        epicChance = 18;      // 15% 
        rareChance = 45;      // 27%
        uncommonChance = 75;  // 30%
        
        chestGold = 3; chestSilver = 10; chestBronze = 25; chestWood = 45;
      } else if (baitId === ID_BAIT_ITEMS.BAIT_3) {
        // Bait III: Massive boosts for high-tier loot
        legendaryChance = 8;  // 8%
        epicChance = 30;      // 22%
        rareChance = 65;      // 35%
        uncommonChance = 90;  // 25%
        
        chestGold = 8; chestSilver = 20; chestBronze = 45; chestWood = 60;
      }

      let difficulty = 0; // 0: Common, 1: Uncommon, 2: Rare, 3: Epic, 4: Legendary

      // 1. Pick a Fish based on percentage
      if (roll < legendaryChance) {
        rewards.push(ID_FISH_ITEMS.SMALL_SHARK); // Legendary
        difficulty = 4;
      } else if (roll < epicChance) {
        rewards.push(Math.random() < 0.5 ? ID_FISH_ITEMS.ORANGE_ROUGHY : ID_FISH_ITEMS.CATFISH); // Epic
        difficulty = 3;
      } else if (roll < rareChance) {
        rewards.push(Math.random() < 0.5 ? ID_FISH_ITEMS.YELLOW_PERCH : ID_FISH_ITEMS.SALMON); // Rare
        difficulty = 2;
      } else if (roll < uncommonChance) {
        rewards.push(Math.random() < 0.5 ? ID_FISH_ITEMS.HERRING : ID_FISH_ITEMS.SMALL_TROUT); // Uncommon
        difficulty = 1;
      } else {
        const commons = [ID_FISH_ITEMS.ANCHOVY, ID_FISH_ITEMS.SARDINE, ID_FISH_ITEMS.NORMAL_FISH];
        rewards.push(commons[Math.floor(Math.random() * commons.length)]); // Common
        difficulty = 0;
      }

      // 2. Bonus: 30% chance to also fish up a Chest!
      const chestRoll = Math.random() * 100;
      if (chestRoll < chestGold) rewards.push(ID_CHEST_ITEMS.CHEST_GOLD || ID_CHEST_ITEMS.GOLDEN_CHEST);
      else if (chestRoll < chestSilver) rewards.push(ID_CHEST_ITEMS.CHEST_SILVER || ID_CHEST_ITEMS.SILVER_CHEST);
      else if (chestRoll < chestBronze) rewards.push(ID_CHEST_ITEMS.CHEST_BRONZE || ID_CHEST_ITEMS.BRONZE_CHEST);
      else if (chestRoll < chestWood) rewards.push(ID_CHEST_ITEMS.CHEST_WOOD || ID_CHEST_ITEMS.WOODEN_CHEST);

      // Trigger the Stardew Valley Fishing Minigame
      const catchSuccess = await new Promise((resolve) => {
        let isResolved = false;
        let isIntercepted = false;
        const safeResolve = (val) => {
          if (!isResolved) {
            isResolved = true;
            resolve(val);
          }
        };
        window.dispatchEvent(new CustomEvent('startFishingMinigame', { 
          detail: { difficulty, callback: safeResolve, onIntercept: () => { isIntercepted = true; } } 
        }));
        // Fallback: Auto-win if the minigame UI isn't currently rendered on screen
        setTimeout(() => { if (!isIntercepted) safeResolve(true); }, 500);
      });

      if (!catchSuccess) {
        onResults({itemIds: []}); // No rewards if fish escapes!
        return;
      }

      const validRewards = rewards.filter(Boolean);
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      validRewards.forEach(id => {
        sandboxLoot[id] = (sandboxLoot[id] || 0) + 1;
      });
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      
      onResults({itemIds: validRewards});
    } catch (err) { 
      setFishingData(prev => ({ ...prev, loading: false, error: err.message })); 
      return null; 
    } finally { 
      setFishingData(prev => ({ ...prev, loading: false })); 
    }
  }, []);

  return { fishingData, craftBait1, craftBait2, craftBait3, fish, revealFishing, listenForFishingResults, getAllPendingRequests, checkPendingRequests };
};
