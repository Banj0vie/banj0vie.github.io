import { useState, useCallback } from 'react';
import { ID_SEEDS, ID_CROP_CATEGORIES, getRaritySeedId } from '../constants/app_ids';

// Hidden crop pool per pack tier — player never sees these odds
const CROP_POOLS = {
  2: [ // Pico
    { seeds: [ID_SEEDS.POTATO],                  weight: 45 },
    { seeds: [ID_SEEDS.LETTUCE],                 weight: 30 },
    { seeds: [ID_SEEDS.ONION],                   weight: 15 },
    { seeds: [ID_SEEDS.RADISH],                  weight: 10 },
  ],
  3: [ // Basic
    { seeds: [ID_SEEDS.WHEAT, ID_SEEDS.TOMATO, ID_SEEDS.CARROT, ID_SEEDS.CORN], weight: 40 },
    { seeds: [ID_SEEDS.PUMPKIN, ID_SEEDS.PEPPER],                                weight: 25 },
    { seeds: [ID_SEEDS.CELERY, ID_SEEDS.BROCCOLI],                               weight: 20 },
    { seeds: [ID_SEEDS.CAULIFLOWER],                                              weight: 10 },
    { seeds: [ID_SEEDS.GRAPES],                                                   weight:  5 },
  ],
  4: [ // Premium
    { seeds: [ID_SEEDS.BANANA, ID_SEEDS.MANGO, ID_SEEDS.AVOCADO],               weight: 40 },
    { seeds: [ID_SEEDS.PINEAPPLE, ID_SEEDS.BLUEBERRY],                           weight: 25 },
    { seeds: [ID_SEEDS.PAPAYA, ID_SEEDS.LICHI],                                  weight: 20 },
    { seeds: [ID_SEEDS.LAVENDER],                                                 weight: 10 },
    { seeds: [ID_SEEDS.DRAGON_FRUIT],                                             weight:  5 },
  ],
};

// Visible quality rarity roll — player sees this
const RARITY_ROLL_TABLE = [
  { level: 1, weight: 50 }, // Common    — 1 produce
  { level: 2, weight: 25 }, // Uncommon  — 2 produce
  { level: 3, weight: 15 }, // Rare      — 3 produce
  { level: 4, weight:  7 }, // Epic      — 4 produce
  { level: 5, weight:  3 }, // Legendary — 5 produce
];

function weightedPick(table) {
  const total = table.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const entry of table) {
    r -= entry.weight;
    if (r <= 0) return entry;
  }
  return table[table.length - 1];
}

function rollSeed(tier) {
  const pool = CROP_POOLS[tier];
  if (!pool) return null;
  // Roll 1: which crop (hidden)
  const cropTier = weightedPick(pool);
  const baseSeedId = cropTier.seeds[Math.floor(Math.random() * cropTier.seeds.length)];
  // Roll 2: which quality (visible)
  const rarityRoll = weightedPick(RARITY_ROLL_TABLE);
  return getRaritySeedId(baseSeedId, rarityRoll.level);
}

export const useVendor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buySeedPack = useCallback(async (tier, count) => {
    if (loading) { setError('Transaction already in progress'); return null; }
    setLoading(true); setError(null);
    try {
      const currentGold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
      // Pricing: 100 / 750 / 3500 / 15000 gold per 5-seed pack
      const pricePerPack = tier === 1 ? 100 : tier === 2 ? 750 : tier === 3 ? 3500 : 15000;
      const numPacks = Math.ceil(count / 5);
      const totalCost = pricePerPack * numPacks;

      if (currentGold < totalCost) {
        setError(`Not enough gold! Need ${totalCost} but you have ${currentGold}`);
        setLoading(false);
        return null;
      }

      const newGold = currentGold - totalCost;
      localStorage.setItem('sandbox_gold', newGold.toString());
      window.dispatchEvent(new CustomEvent('sandboxGoldChanged', { detail: newGold.toString() }));

      const nonce = Math.floor(Date.now() + Math.random() * 1000000);
      localStorage.setItem('sandbox_seed_request', JSON.stringify({ requestId: nonce, tier, count }));
      
      await new Promise(r => setTimeout(r, 500));
      return { txHash: "SANDBOX_TX_BUY_SEED", tier, isPending: false };
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const getPackPrice = (tier) => { 
    if (tier == 1) return 1000000; 
    if (tier == 2) return 2000000; 
    if (tier == 3) return 10000000; 
    if (tier == 4) return 25000000; 
    return 0; 
  };

  const getAllPendingRequests = useCallback(async () => {
    try {
      const raw = localStorage.getItem('sandbox_seed_request');
      if (!raw) return [];
      const data = JSON.parse(raw);
      return [data];
    } catch (err) {
      return [];
    }
  }, []);

  const listenForSeedsRevealed = useCallback(async (txSig, onRevealed) => {
    setLoading(true); setError(null);
    try {
      const raw = localStorage.getItem('sandbox_seed_request');
      if (!raw) throw new Error("No pending request");
      const { count, tier } = JSON.parse(raw);
      
      const revealedSeeds = [];
      for (let i = 0; i < count; i++) {
        const seedId = rollSeed(tier);
        // Fallback for tier 1 (Feeble) or unknown tiers — pick a random base seed
        if (seedId === null) {
          const fallback = Object.values(ID_SEEDS).filter(id => typeof id === 'number');
          revealedSeeds.push(fallback[Math.floor(Math.random() * fallback.length)]);
        } else {
          revealedSeeds.push(seedId);
        }
      }

      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      revealedSeeds.forEach(seedId => {
        sandboxLoot[seedId] = (sandboxLoot[seedId] || 0) + 1;
      });
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      localStorage.removeItem('sandbox_seed_request');
      
      await new Promise(r => setTimeout(r, 800)); // Simulate VRF delay
      onRevealed({ seedIds: revealedSeeds });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const revealSeeds = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const raw = localStorage.getItem('sandbox_seed_request');
      if (!raw) {
        setError('No pending seed request found');
        return null;
      }
      await new Promise(r => setTimeout(r, 500));
      return "SANDBOX_TX_REVEAL";
    } catch (err) {
      setError(err.message);
      return null; 
    } finally { 
      setLoading(false); 
    }
  }, []);

  return { buySeedPack, getPackPrice, getAllPendingRequests, revealSeeds, listenForSeedsRevealed, loading, error };
};
