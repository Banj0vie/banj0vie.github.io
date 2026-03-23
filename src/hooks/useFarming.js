import { useState, useCallback } from 'react';
import { ID_PRODUCE_ITEMS } from '../constants/app_ids';
import { getGrowthTime } from '../utils/basic';

export const useFarming = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- SANDBOX HELPERS (LOCAL STORAGE) ---
    const getSandboxCrops = () => {
      const stored = localStorage.getItem('sandbox_crops');
      if (stored) return JSON.parse(stored);
      return new Array(30).fill(null).map(() => ({ id: 0, endTime: 0, prodMultiplier: 1000, tokenMultiplier: 1000, growthElixir: 0 }));
    };
    const saveSandboxCrops = (crops) => localStorage.setItem('sandbox_crops', JSON.stringify(crops));

    const plantBatch = useCallback(async (seedIds) => {
        setLoading(true); setError(null);
        try {
            const crops = getSandboxCrops();
            let speedMultiplier = Number(localStorage.getItem('sandbox_crop_speed') || 100) / 100;
            if (isNaN(speedMultiplier) || speedMultiplier <= 0) speedMultiplier = 1;

            seedIds.forEach(encodedId => {
                const plotId = (encodedId >> 24) & 0xFF;
                const cropId = encodedId & 0xFFFFFF;
                
                const baseTime = getGrowthTime(cropId);
                const finalTime = Math.max(1, Math.floor(baseTime / speedMultiplier));

                crops[plotId] = {
                    id: cropId,
                    endTime: Math.floor(Date.now() / 1000) + finalTime,
                    prodMultiplier: 1000,
                    tokenMultiplier: 1000,
                    growthElixir: 0
                };
            });
            saveSandboxCrops(crops);
            await new Promise(r => setTimeout(r, 500)); // Simulate transaction delay
            return "SANDBOX_TX_PLANT";
        } catch (err) {
            setError(err.message);
            return null;
        } finally { setLoading(false); }
    }, []);

    const harvestMany = useCallback(async (slots) => {
        setLoading(true); setError(null);
        try {
            // Ensure slots is always an array
            const slotsArray = Array.isArray(slots) ? slots : [slots];
            const crops = getSandboxCrops();
            let sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
            
            slotsArray.forEach(slot => {
                const crop = crops[slot];
                if (crop && crop.id !== 0) {
                    const category = (crop.id >> 16) & 0xFF;
                    const localId = crop.id & 0xFF;
                    
                    // Contract logic: produce category is usually seed category + 3
                    const expectedProduceCategory = category + 3;
                    
                    let matchingProduce = Object.values(ID_PRODUCE_ITEMS).find(id => 
                        (typeof id === 'number') && 
                        (id & 0xFF) === localId && 
                        (id >> 8) === expectedProduceCategory
                    );
                    
                    // Fallback to just matching localId if exact category mapping misses
                    if (!matchingProduce) {
                        matchingProduce = Object.values(ID_PRODUCE_ITEMS).find(id => (typeof id === 'number') && (id & 0xFF) === localId);
                    }
                    
                    const produceToGive = matchingProduce || Object.values(ID_PRODUCE_ITEMS).find(id => typeof id === 'number');
                    if (produceToGive) sandboxProduce[produceToGive] = (sandboxProduce[produceToGive] || 0) + 3;
                }
                crops[slot] = { id: 0, endTime: 0, prodMultiplier: 1000, tokenMultiplier: 1000, growthElixir: 0 };
            });
            saveSandboxCrops(crops);
            localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));
            await new Promise(r => setTimeout(r, 500));
            return "SANDBOX_TX_HARVEST";
        } catch (err) {
            setError(err.message);
            return null;
        } finally { setLoading(false); }
    }, []);

    const getUserCrops = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const crops = getSandboxCrops();
            return crops.map((crop, index) => ({
                plotNumber: index,
                seedId: Number((crop.id >> 16 << 8) | (crop.id & 0xFF)),
                endTime: Number(crop.endTime || 0),
                produceMultiplierX1000: Number(crop.prodMultiplier || 1000),
                tokenMultiplierX1000: Number(crop.tokenMultiplier || 1000),
                growthElixirApplied: Boolean(crop.growthElixir),
                isReady: Number(crop.id || 0) !== 0 && Number(crop.endTime || 0) <= Math.floor(Date.now() / 1000),
            }));
        } catch (err) { setError(err.message); return []; } finally { setLoading(false); }
    }, []);

    const getMaxPlots = useCallback(async () => {
        return 30; // Sandbox max plots
    }, []);

    const getPlantedPlotsCount = useCallback(async () => {
        return getSandboxCrops().filter(c => c.id !== 0).length;
    }, []);

    // Preview harvest amounts for a given seed (based on on-chain rules in farming.rs)
    const previewHarvestForSeed = useCallback(async (seedId) => {
        return { lockedGameToken: '50', unlockedGameToken: '150' };
    }, []);

    const getCrop = useCallback(async (plotIndex) => {
        const crop = getSandboxCrops()[plotIndex];
        if (!crop || crop.id === 0) return { seedId: '0', endTime: 0, produceMultiplierX1000: 1000, tokenMultiplierX1000: 1000, growthElixirApplied: false };
        return {
            seedId: crop.id.toString(),
            endTime: Number(crop.endTime || 0),
            produceMultiplierX1000: Number(crop.prodMultiplier || 1000),
            tokenMultiplierX1000: Number(crop.tokenMultiplier || 1000),
            growthElixirApplied: Boolean(crop.growthElixir),
        };
    }, []);

    const applyGrowthElixir = useCallback(async (plotNumber) => {
        setLoading(true); setError(null);
        try {
            const crops = getSandboxCrops();
            if (crops[plotNumber]) crops[plotNumber].growthElixir = 1;
            saveSandboxCrops(crops);
            return "SANDBOX_TX_POTION";
        } catch (err) { 
            console.error("🚀 ~ applyGrowthElixir ~ err:", err);
            setError(err.message); 
            return null; 
        } finally { 
            setLoading(false); 
        }
    }, []);

    const applyPesticide = useCallback(async (plotNumber) => {
        setLoading(true); setError(null);
        try {
            const crops = getSandboxCrops();
            if (crops[plotNumber]) crops[plotNumber].prodMultiplier = 2000;
            saveSandboxCrops(crops);
            return "SANDBOX_TX_POTION";
        } catch (err) { 
            console.error("🚀 ~ applyPesticide ~ err:", err);
            setError(err.message); 
            return null; 
        } finally { 
            setLoading(false); 
        }
    }, []);

    const applyFertilizer = useCallback(async (plotNumber) => {
        setLoading(true); setError(null);
        try {
            const crops = getSandboxCrops();
            if (crops[plotNumber]) crops[plotNumber].tokenMultiplier = 2000;
            saveSandboxCrops(crops);
            return "SANDBOX_TX_POTION";
        } catch (err) { 
            console.error("🚀 ~ applyFertilizer ~ err:", err);
            setError(err.message); 
            return null; 
        } finally { 
            setLoading(false); 
        }
    }, []);

    const destroyCrop = useCallback(async (plotNumber) => {
        setLoading(true); setError(null);
        try {
            const crops = getSandboxCrops();
            if (crops[plotNumber]) crops[plotNumber] = { id: 0, endTime: 0, prodMultiplier: 1000, tokenMultiplier: 1000, growthElixir: 0 };
            saveSandboxCrops(crops);
            return "SANDBOX_TX_DESTROY_CROP";
        } catch (err) { 
            console.error("🚀 ~ destroyCrop ~ err:", err);
            setError(err.message); 
            return null; 
        } finally { 
            setLoading(false); 
        }
    }, []);

    return { plantBatch, harvestMany, getUserCrops, getMaxPlots, getPlantedPlotsCount, getCrop, applyGrowthElixir, applyPesticide, applyFertilizer, destroyCrop, previewHarvestForSeed, loading, error };
};
