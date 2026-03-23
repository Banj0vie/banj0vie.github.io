import { useState, useCallback } from 'react';
import { ID_SEEDS, ID_CROP_CATEGORIES } from '../constants/app_ids';

export const useVendor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buySeedPack = useCallback(async (tier, count) => {
    if (loading) { setError('Transaction already in progress'); return null; }
    setLoading(true); setError(null);
    try {
      const currentHoney = parseFloat(localStorage.getItem('sandbox_honey') || '0');
      // Simple sandbox pricing: 10, 25, 50, 100 honey per pack based on tier
      const price = tier === 1 ? 10 : tier === 2 ? 25 : tier === 3 ? 50 : 100;
      const totalCost = price * count;

      if (currentHoney < totalCost) {
        setError(`Not enough Honey! Need ${totalCost} but you have ${currentHoney}`);
        setLoading(false);
        return null;
      }

      const newHoney = currentHoney - totalCost;
      localStorage.setItem('sandbox_honey', newHoney.toString());
      window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: newHoney.toString() }));

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
      
      const seedValues = Object.values(ID_SEEDS).filter(id => typeof id === 'number');
      
      let pool = [];
      
      if (tier === 1) pool = [ID_SEEDS.POTATO, ID_SEEDS.CORN, ID_SEEDS.TOMATO, ID_SEEDS.LETTUCE].filter(x => x);
      else if (tier === 2) pool = [ID_SEEDS.CABBAGE, ID_SEEDS.ONION, ID_SEEDS.RADISH, ID_SEEDS.WHEAT, ID_SEEDS.CARROT].filter(x => x);
      else if (tier === 3) pool = [ID_SEEDS.PUMPKIN, ID_SEEDS.CHILI, ID_SEEDS.PARSNAP, ID_SEEDS.CELERY, ID_SEEDS.BROCCOLI, ID_SEEDS.CAULIFLOWER, ID_SEEDS.BERRY, ID_SEEDS.GRAPES].filter(x => x);
      else if (tier === 4) pool = [ID_SEEDS.BANANA, ID_SEEDS.MANGO, ID_SEEDS.AVOCADO, ID_SEEDS.PINEAPPLE, ID_SEEDS.BLUEBERRY, ID_SEEDS.ARTICHOKE, ID_SEEDS.PAPAYA, ID_SEEDS.FIG, ID_SEEDS.LYCHEE, ID_SEEDS.LAVENDER, ID_SEEDS.DRAGONFRUIT].filter(x => x);

      // Fallback if specific seeds are undefined or pool is empty
      if (!pool || pool.length === 0) {
         const targetCategory = tier === 1 ? ID_CROP_CATEGORIES.FEEBLE_SEED : tier === 2 ? ID_CROP_CATEGORIES.PICO_SEED : tier === 3 ? ID_CROP_CATEGORIES.BASIC_SEED : ID_CROP_CATEGORIES.PREMIUM_SEED;
         pool = seedValues.filter(id => (id >> 8) === targetCategory || ((id >> 16) & 0xFF) === targetCategory);
      }
      
      if (!pool || pool.length === 0) {
          pool = seedValues;
      }

      const revealedSeeds = [];
      for (let i = 0; i < count; i++) {
        revealedSeeds.push(pool[Math.floor(Math.random() * pool.length)]);
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
