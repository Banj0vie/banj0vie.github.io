import { useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getGameRegistryPDA, preIx, getPlantBatchRemainingAccounts, getGameTokenMintAuthPDA, getHarvestRemainingAccounts, getPotionUsageRemainingAccounts, getGameVaultPDA, getGameVaultAta, getReceiverPDA } from '../solana/utils/pdaUtils';
import { SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { GAME_TOKEN_MINT, LOOKUP_TABLE_ADDRESS } from '../solana/constants/programId';
import { sendTransactionForPhantom } from '../utils/transactionHelper';
import { ID_POTION_ITEMS } from '../constants/app_ids';
import { PRICE_BY_CATEGORY, LOCKED_BPS } from '../constants/farming';
import { getMultiplier, getSubtype } from '../utils/basic';
import { useBalanceRefresh } from './useBalanceRefresh';

export const useFarming = () => {
    const { publicKey, sendTransaction } = useSolanaWallet();
    const { program, connection } = useProgram();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { refreshBalancesAfterTransaction } = useBalanceRefresh();

    const plantBatch = useCallback(async (seedIds) => {
        if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
        if (loading) { setError('Transaction already in progress'); return null; }
        setLoading(true); setError(null);
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const remainingAccounts = getPlantBatchRemainingAccounts(seedIds, publicKey);
            const plantIx = await program.methods
                .plant(seedIds)
                .accounts({ 
                    user: publicKey, 
                    gameRegistry: gameRegistryPda, 
                    userData: userDataPda, 
                    tokenProgram: TOKEN_PROGRAM_ID, 
                    systemProgram: SystemProgram.programId 
                })
                .remainingAccounts(remainingAccounts);

            const tx = await sendTransactionForPhantom(plantIx, connection, sendTransaction, publicKey);
            
            // Refresh balances after successful plant
            await refreshBalancesAfterTransaction(1000);
            
            return tx;
        } catch (err) {
            console.error("🚀 ~ plantBatch ~ err:", err)
            
            // Handle specific transaction errors
            let errorMessage = err.message;
            if (err.message.includes('already been processed') || err.message.includes('Transaction simulation failed: This transaction has already been processed')) {
                errorMessage = 'Transaction already submitted. Please wait and try again.';
            } else if (err.message.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for this transaction.';
            } else if (err.message.includes('User rejected')) {
                errorMessage = 'Transaction was cancelled by user.';
            } else if (err.message.includes('encoding overruns Uint8Array')) {
                errorMessage = 'Transaction too large. Please try with fewer items.';
            }
            
            setError(errorMessage); 
            throw new Error(err);
        } finally { setLoading(false); }
    }, [program, publicKey, connection, sendTransaction, refreshBalancesAfterTransaction]);

    const harvestMany = useCallback(async (slots) => {
        if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
        if (loading) { setError('Transaction already in progress'); return null; }
        setLoading(true); setError(null);
        try {
            // Ensure slots is always an array
            const slotsArray = Array.isArray(slots) ? slots : [slots];
            console.log("🌾 Harvesting slots:", slotsArray);
            
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
            const gameVaultPda = getGameVaultPDA();
            const gameVaultAta = getGameVaultAta();
            const remainingAccounts = await getHarvestRemainingAccounts(slotsArray, publicKey, program);
            const receiverPda = getReceiverPDA();
            const receiverInfo = await program.account.receiver.fetch(receiverPda);
            const receiverWallet1 = receiverInfo.receiver1;
            const receiverWallet2 = receiverInfo.receiver2;
            const harvestIx = await program.methods
                .harvest(Buffer.from(slotsArray))
                .accounts({
                    user: publicKey, 
                    gameRegistry: gameRegistryPda, 
                    userData: userDataPda,
                    gameTokenMint: GAME_TOKEN_MINT,
                    userGameAta: userGameAta,
                    gameVault: gameVaultPda,
                    gameVaultAta: gameVaultAta,
                    systemProgram: SystemProgram.programId, 
                    tokenProgram: TOKEN_PROGRAM_ID, 
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    receiver: receiverPda,
                    receiverWallet1: receiverWallet1,
                    receiverWallet2: receiverWallet2,
                })
                .remainingAccounts(remainingAccounts);
            
            const tx = await sendTransactionForPhantom(harvestIx, connection, sendTransaction, publicKey);
            // Refresh balances after successful harvest
            await refreshBalancesAfterTransaction(1000);
            
            return tx;
        } catch (err) {
            console.error("🚀 ~ harvestMany ~ err:", err)
            
            // Handle specific transaction errors
            let errorMessage = err.message;
            if (err.message.includes('already been processed') || err.message.includes('Transaction simulation failed: This transaction has already been processed')) {
                errorMessage = 'Transaction already submitted. Please wait and try again.';
            } else if (err.message.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for this transaction.';
            } else if (err.message.includes('User rejected')) {
                errorMessage = 'Transaction was cancelled by user.';
            } else if (err.message.includes('encoding overruns Uint8Array')) {
                errorMessage = 'Transaction too large. Please try with fewer items.';
            }
            
            setError(errorMessage); 
            throw new Error(err);
        } finally { setLoading(false); }
    }, [program, publicKey, connection, sendTransaction, refreshBalancesAfterTransaction]);

    const getUserCrops = useCallback(async () => {
        if (!program || !publicKey) return [];
        setLoading(true); setError(null);
        try {
            const userDataPda = getUserDataPDA(publicKey);
            const userData = await program.account.userData.fetch(userDataPda);
            const formatted = (userData.userCrops || []).map((crop, index) => ({
                plotNumber: index,
                seedId: Number((crop.id >> 16 << 8) | (crop.id & 0xFF)),
                endTime: Number(crop.endTime || 0),
                produceMultiplierX1000: Number(crop.prodMultiplier || 1000),
                tokenMultiplierX1000: Number(crop.tokenMultiplier || 1000),
                growthElixirApplied: Boolean(crop.growthElixir),
                isReady: Number(crop.id || 0) !== 0n && Number(crop.endTime || 0) <= Math.floor(Date.now() / 1000),
            }));
            return formatted;
        } catch (err) { setError(err.message); return []; } finally { setLoading(false); }
    }, [program, publicKey]);

    const getMaxPlots = useCallback(async () => {
        if (!program || !publicKey) return 15;
        try {
            const userDataPda = getUserDataPDA(publicKey);
            const userData = await program.account.userData.fetch(userDataPda);
            return (userData.level || 0) + 15;
        } catch { return 15; }
    }, [program, publicKey]);

    const getPlantedPlotsCount = useCallback(async () => {
        if (!program || !publicKey) return 0;
        try {
            const userDataPda = getUserDataPDA(publicKey);
            const userData = await program.account.userData.fetch(userDataPda);
            return (userData.activePlotIds || []).length;
        } catch { return 0; }
    }, [program, publicKey]);

    // Preview harvest amounts for a given seed (based on on-chain rules in farming.rs)
    const previewHarvestForSeed = useCallback(async (seedId) => {
        try {
            if (!program || !publicKey) return { lockedGameToken: '0', unlockedGameToken: '0' };

            // Decode seed to category (1..4) and local id
            const seedCategory = (Number(seedId) >> 8) & 0xFF;
            const localId = Number(seedId) & 0xFF;
            const basePrice = PRICE_BY_CATEGORY[seedCategory] || 0n;

            // Pull user level and token multiplier from user data for this crop
            let level = 0;
            let tokenMul = 1000;  // x1000
            try {
                const userDataPda = getUserDataPDA(publicKey);
                const ud = await program.account.userData.fetch(userDataPda);
                level = Number(ud?.level || 0);
                const crops = ud?.userCrops || ud?.user_crops || [];
                const targetCat = seedCategory;
                const targetLocalId = localId;
                for (const c of crops) {
                    const rawId = c?.id?.toNumber ? c.id.toNumber() : Number(c?.id || 0);
                    const cat = (rawId >> 16) & 0xFF;
                    const localId = rawId & 0xFF;
                    if (cat === targetCat && localId === targetLocalId) {
                        tokenMul = Number(c?.tokenMultiplier ?? 1000);
                        break;
                    }
                }
            } catch (err) {
                // fallback to defaults
            }

            // Use helper getMultiplier(subType, level) per on-chain helper.rs
            const subType = getSubtype(Number(seedId));
            const mult = getMultiplier(subType, level); // x1000 or higher

            // Apply multiplier and token multiplier as helper.rs::calc_harvest
            const toBI = (v) => (typeof window !== 'undefined' && window.BigInt ? window.BigInt(v) : 0n);
            let totalTokens = 0n;
            if (tokenMul > 1000) {
                totalTokens = (basePrice * toBI(mult) * toBI(tokenMul)) / 1_000_000n;
            } else {
                totalTokens = (basePrice * toBI(mult)) / 1000n;
            }

            // Split locked/unlocked. LOCKED_RATIO = 166 bps (approx) per consts.rs
            const locked = (totalTokens * LOCKED_BPS) / 1000n;
            const unlocked = totalTokens - locked;

            return {
                lockedGameToken: locked.toString(),
                unlockedGameToken: unlocked.toString(),
            };
        } catch {
            return { lockedGameToken: '0', unlockedGameToken: '0' };
        }
    }, [program, publicKey]);

    const getCrop = useCallback(async (plotIndex) => {
        if (!program || !publicKey) return null;
        try {
            const userDataPda = getUserDataPDA(publicKey);
            const userData = await program.account.userData.fetch(userDataPda);
            const crop = userData.userCrops?.[plotIndex];
            if (!crop) return { seedId: '0', endTime: 0, produceMultiplierX1000: 1000, tokenMultiplierX1000: 1000, growthElixirApplied: false };
            return {
                seedId: crop.id?.toString() || '0',
                endTime: Number(crop.endTime || 0),
                produceMultiplierX1000: Number(crop.produceMultiplier || 1000),
                tokenMultiplierX1000: Number(crop.tokenMultiplier || 1000),
                growthElixirApplied: Boolean(crop.growthElixir),
            };
        } catch {
            return { seedId: '0', endTime: 0, produceMultiplierX1000: 1000, tokenMultiplierX1000: 1000, growthElixirApplied: false };
        }
    }, [program, publicKey]);

    const applyGrowthElixir = useCallback(async (plotNumber) => {
        if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
        if (loading) { setError('Transaction already in progress'); return null; }
        setLoading(true); setError(null);
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const remainingAccounts = getPotionUsageRemainingAccounts(publicKey, ID_POTION_ITEMS.POTION_GROWTH_ELIXIR);
            const method = program.methods
                .applyGrowthElixir(plotNumber)
                .accounts({ 
                    user: publicKey, 
                    userData: userDataPda, 
                    gameRegistry: gameRegistryPda, 
                    systemProgram: SystemProgram.programId, 
                    tokenProgram: TOKEN_PROGRAM_ID, 
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID 
                })
                .remainingAccounts(remainingAccounts);
            
            const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
            return tx;
        } catch (err) { 
            console.error("🚀 ~ applyGrowthElixir ~ err:", err);
            setError(err.message); 
            return null; 
        } finally { 
            setLoading(false); 
        }
    }, [program, publicKey, connection, sendTransaction, loading]);

    const applyPesticide = useCallback(async (plotNumber) => {
        if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
        if (loading) { setError('Transaction already in progress'); return null; }
        setLoading(true); setError(null);
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const remainingAccounts = getPotionUsageRemainingAccounts(publicKey, ID_POTION_ITEMS.POTION_PESTICIDE);
            const method = program.methods
                .applyPesticide(plotNumber)
                .accounts({ 
                    user: publicKey, 
                    userData: userDataPda, 
                    gameRegistry: gameRegistryPda, 
                    systemProgram: SystemProgram.programId, 
                    tokenProgram: TOKEN_PROGRAM_ID, 
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID 
                })
                .remainingAccounts(remainingAccounts);
            
            const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
            return tx;
        } catch (err) { 
            console.error("🚀 ~ applyPesticide ~ err:", err);
            setError(err.message); 
            return null; 
        } finally { 
            setLoading(false); 
        }
    }, [program, publicKey, connection, sendTransaction, loading]);

    const applyFertilizer = useCallback(async (plotNumber) => {
        if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
        if (loading) { setError('Transaction already in progress'); return null; }
        setLoading(true); setError(null);
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const remainingAccounts = getPotionUsageRemainingAccounts(publicKey, ID_POTION_ITEMS.POTION_FERTILIZER);
            const method = program.methods
                .applyFertilizer(plotNumber)
                .accounts({ 
                    user: publicKey, 
                    userData: userDataPda, 
                    gameRegistry: gameRegistryPda, 
                    systemProgram: SystemProgram.programId, 
                    tokenProgram: TOKEN_PROGRAM_ID, 
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID 
                })
                .remainingAccounts(remainingAccounts);
            
            const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
            return tx;
        } catch (err) { 
            console.error("🚀 ~ applyFertilizer ~ err:", err);
            setError(err.message); 
            return null; 
        } finally { 
            setLoading(false); 
        }
    }, [program, publicKey, connection, sendTransaction, loading]);

    return { plantBatch, harvestMany, getUserCrops, getMaxPlots, getPlantedPlotsCount, getCrop, applyGrowthElixir, applyPesticide, applyFertilizer, previewHarvestForSeed, loading, error };
};


