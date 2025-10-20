import { useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getGameRegistryPDA, preIx, getPlantBatchRemainingAccounts, getGameTokenMintAuthPDA, getHarvestRemainingAccounts } from '../solana/utils/pdaUtils';
import { SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { GAME_TOKEN_MINT, LOOKUP_TABLE_ADDRESS } from '../solana/constants/programId';

export const useFarming = () => {
    const { publicKey, sendTransaction } = useSolanaWallet();
    const valleyProgram = useProgram();
    const program = valleyProgram.getProgram();
    const connection = valleyProgram.getConnection();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const plantBatch = useCallback(async (seedIds) => {
        if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
        setLoading(true); setError(null);
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const remainingAccounts = getPlantBatchRemainingAccounts(seedIds, publicKey);
            const plantIx = await program.methods
                .plant(seedIds)
                .accounts({ user: publicKey, gameRegistry: gameRegistryPda, userData: userDataPda, tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId })
                .remainingAccounts(remainingAccounts)
                .instruction();
            const { value: alt } = await connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS);
            if (!alt) throw new Error('ALT not found');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            const msgV0 = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: blockhash,
                instructions: [...preIx, plantIx],
            }).compileToV0Message([alt]);
            const tx = new VersionedTransaction(msgV0);
            const sig = await sendTransaction(tx, connection, { skipPreflight: false, maxRetries: 3 });
            await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
            return sig;
        } catch (err) {
            console.error("🚀 ~ plantBatch ~ err:", err)
            setError(err.message); throw new Error(err);
        } finally { setLoading(false); }
    }, [program, publicKey]);

    const harvestMany = useCallback(async (slots) => {
        if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
        setLoading(true); setError(null);
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
            const gameTokenMintAuth = getGameTokenMintAuthPDA();
            const remainingAccounts = await getHarvestRemainingAccounts(slots, publicKey, program);
            const harvestIx = await program.methods
                .harvest(Buffer.from(slots))
                .accounts({
                    user: publicKey, 
                    gameRegistry: gameRegistryPda, 
                    userData: userDataPda,
                    gameTokenMint: GAME_TOKEN_MINT,
                    userGameAta: userGameAta,
                    gameTokenMintAuth: gameTokenMintAuth,
                    systemProgram: SystemProgram.programId, 
                    tokenProgram: TOKEN_PROGRAM_ID, 
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
                })
                .remainingAccounts(remainingAccounts)
                .instruction();
            const { value: alt } = await connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS);
            if (!alt) throw new Error('ALT not found');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            const msgV0 = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: blockhash,
                instructions: [...preIx, harvestIx],
            }).compileToV0Message([alt]);  
            const tx = new VersionedTransaction(msgV0);
            const sig = await sendTransaction(tx, connection, { skipPreflight: false, maxRetries: 3 });
            await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
            return sig;
        } catch (err) {
            console.error("🚀 ~ harvestMany ~ err:", err)
            setError(err.message); throw new Error(err);
        } finally { setLoading(false); }
    }, [program, publicKey]);

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
        setLoading(true); setError(null);
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
            const tx = await program.methods
                .applyGrowthElixir(plotNumber)
                .accounts({ user: publicKey, userData: userDataPda, gameRegistry: gameRegistryPda, gameTokenMint: GAME_TOKEN_MINT, userGameAta, systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID })
                .rpc();
            return tx;
        } catch (err) { setError(err.message); return null; } finally { setLoading(false); }
    }, [program, publicKey]);

    const applyPesticide = useCallback(async (plotNumber) => {
        if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
        setLoading(true); setError(null);
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
            const tx = await program.methods
                .applyPesticide(plotNumber)
                .accounts({ user: publicKey, userData: userDataPda, gameRegistry: gameRegistryPda, gameTokenMint: GAME_TOKEN_MINT, userGameAta, systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID })
                .rpc();
            return tx;
        } catch (err) { setError(err.message); return null; } finally { setLoading(false); }
    }, [program, publicKey]);

    const applyFertilizer = useCallback(async (plotNumber) => {
        if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
        setLoading(true); setError(null);
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
            const tx = await program.methods
                .applyFertilizer(plotNumber)
                .accounts({ user: publicKey, userData: userDataPda, gameRegistry: gameRegistryPda, gameTokenMint: GAME_TOKEN_MINT, userGameAta, systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID })
                .rpc();
            return tx;
        } catch (err) { setError(err.message); return null; } finally { setLoading(false); }
    }, [program, publicKey]);

    return { plantBatch, harvestMany, getUserCrops, getMaxPlots, getPlantedPlotsCount, getCrop, applyGrowthElixir, applyPesticide, applyFertilizer, loading, error };
};


