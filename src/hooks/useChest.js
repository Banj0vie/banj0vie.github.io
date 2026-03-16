import { useState, useEffect, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getGameRegistryPDA, preIx, getChestRemainingAccounts, getChestOpenRemainingAccounts, getReceiverPDA } from '../solana/utils/pdaUtils';
import { SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { handleContractError } from '../utils/errorHandler';
import { CHEST_PERIOD } from '../utils/basic';
import { LOOKUP_TABLE_ADDRESS } from '../solana/constants/programId';
import { sendTransactionForPhantom } from '../utils/transactionHelper';
import { ID_CHEST_ITEMS, ID_POTION_ITEMS, ID_SEEDS } from '../constants/app_ids';

export const useChest = () => {
    const { publicKey, sendTransaction } = useSolanaWallet();
    const { program, connection } = useProgram();
    const [chestData, setChestData] = useState({
        nextChestTime: 0,
        canClaim: false,
        currentLevel: 0,
        chestType: 'WOOD',
        loading: false,
        error: null,
    });

    const fetchChestData = useCallback(async () => {
        if (!program || !publicKey) return;
        setChestData(prev => ({ ...prev, loading: true, error: null }));
        try {
            const userDataPda = getUserDataPDA(publicKey);
            const ud = await program.account.userData.fetch(userDataPda);
            const currentLevel = Number(ud.level || 0);
            // next chest time = last chest open time + CHEST_PERIOD (seconds)
            const lastOpen = Number(ud.chest_open_time ?? ud.chestOpenTime ?? 0);
            const nextChestTime = lastOpen + CHEST_PERIOD;
            let chestType = 'WOOD';
            if (currentLevel >= 15) chestType = 'GOLD';
            else if (currentLevel >= 10) chestType = 'SILVER';
            else if (currentLevel >= 5) chestType = 'BRONZE';
            const nowSec = Math.floor(Date.now() / 1000);
            const canClaim = nowSec >= nextChestTime;
            setChestData({ nextChestTime, canClaim, currentLevel, chestType, loading: false, error: null });
        } catch (err) {
            const { message } = handleContractError(err, 'fetching chest data');
            setChestData(prev => ({ ...prev, loading: false, error: message }));
        }
    }, [program, publicKey]);

    const claimDailyChest = useCallback(async () => {
        setChestData(p => ({ ...p, loading: true, error: null }));
        try {
            await new Promise(r => setTimeout(r, 500));
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            const woodChest = ID_CHEST_ITEMS.CHEST_WOOD || ID_CHEST_ITEMS.WOODEN_CHEST;
            sandboxLoot[woodChest] = (sandboxLoot[woodChest] || 0) + 1;
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            
            setChestData(p => ({ ...p, loading: false, error: null, canClaim: false, nextChestTime: Math.floor(Date.now() / 1000) + 300 }));
            return "SANDBOX_TX_CLAIM_CHEST";
        } catch (err) {
            setChestData(p => ({ ...p, loading: false, error: err.message }));
            throw new Error(err.message);
        }
    }, []);

    const openChest = useCallback(async (chestType) => {
        console.log("🚀 ~ useChest ~ chestType:", chestType)
        setChestData(p => ({ ...p, loading: true, error: null }));
        try {
            // --- SANDBOX HACK: Instant Chest Opening ---
            await new Promise(resolve => setTimeout(resolve, 800)); // Cool delay for suspense
            
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            
            // 1. Deduct the exact chest from inventory
            let chestIdToDeduct = null;
            if (Number(chestType) === 1) chestIdToDeduct = ID_CHEST_ITEMS.CHEST_WOOD || ID_CHEST_ITEMS.WOODEN_CHEST;
            if (Number(chestType) === 2) chestIdToDeduct = ID_CHEST_ITEMS.CHEST_BRONZE || ID_CHEST_ITEMS.BRONZE_CHEST;
            if (Number(chestType) === 3) chestIdToDeduct = ID_CHEST_ITEMS.CHEST_SILVER || ID_CHEST_ITEMS.SILVER_CHEST;
            if (Number(chestType) === 4) chestIdToDeduct = ID_CHEST_ITEMS.CHEST_GOLD || ID_CHEST_ITEMS.GOLDEN_CHEST;
            
            if (chestIdToDeduct && sandboxLoot[chestIdToDeduct] > 0) {
                sandboxLoot[chestIdToDeduct] -= 1;
            } else {
                // Fallback: just decrement any chest we find
                const existingChestId = Object.keys(sandboxLoot).find(id => 
                    Object.values(ID_CHEST_ITEMS).includes(Number(id)) && sandboxLoot[id] > 0
                );
                if (existingChestId) sandboxLoot[existingChestId] -= 1;
            }

            // 2. Grant Sandbox Rewards! 
            // Let's guarantee some God-Tier potions and a random premium seed
            const premiumSeed = Object.values(ID_SEEDS).find(id => typeof id === 'number' && id > 1000) || Object.values(ID_SEEDS).find(id => typeof id === 'number');
            const rewardIds = [
                ID_POTION_ITEMS.POTION_GROWTH_ELIXIR_III || ID_POTION_ITEMS.GROWTH_ELIXIR_III,
                ID_POTION_ITEMS.POTION_FERTILIZER_III || ID_POTION_ITEMS.FERTILIZER_III,
                premiumSeed
            ].filter(Boolean);

            rewardIds.forEach(id => {
                sandboxLoot[id] = (sandboxLoot[id] || 0) + 1;
            });

            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));

            setChestData(p => ({ ...p, loading: false, error: null }));
            return { 
                success: true, 
                txHash: "SANDBOX_TX_OPEN_CHEST", 
                message: 'Chest opened successfully!',
                results: rewardIds
            };
        } catch (err) {
            console.error("🚀 ~ openChest ~ err:", err)
            setChestData(p => ({ ...p, loading: false, error: err.message }));
            throw new Error(err.message);
        }
    }, []);

    useEffect(() => { fetchChestData(); }, [fetchChestData]);

    const getTimeUntilNextChest = useCallback(() => {
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = Math.max(0, chestData.nextChestTime - now);
        return timeLeft * 1000;
    }, [chestData.nextChestTime]);

    return { ...chestData, claimDailyChest, openChest, getTimeUntilNextChest, fetchChestData };
};
