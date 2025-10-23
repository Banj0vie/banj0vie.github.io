import { useState, useEffect, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getGameRegistryPDA, preIx, getChestRemainingAccounts, getChestOpenRemainingAccounts } from '../solana/utils/pdaUtils';
import { SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { handleContractError } from '../utils/errorHandler';
import { CHEST_PERIOD } from '../utils/basic';
import { LOOKUP_TABLE_ADDRESS } from '../solana/constants/programId';
import { sendTransactionForPhantom } from '../utils/transactionHelper';

export const useChest = () => {
    const { publicKey, sendTransaction } = useSolanaWallet();
    const valleyProgram = useProgram();
    const program = valleyProgram.getProgram();
    const connection = valleyProgram.getConnection();
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
        if (!program || !publicKey) { setChestData(p => ({ ...p, error: 'Program or wallet not available' })); return null; }
        setChestData(p => ({ ...p, loading: true, error: null }));
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const remainingAccounts = getChestRemainingAccounts(publicKey);
            const method = program.methods
                .claimDailyChest()
                .accounts({
                    user: publicKey,
                    gameRegistry: gameRegistryPda,
                    userData: userDataPda,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                })
                .remainingAccounts(remainingAccounts);
            
            const sig = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
            await fetchChestData();
            setChestData(p => ({ ...p, loading: false, error: null }));
            return sig;
        } catch (err) {
            const { message } = handleContractError(err, 'claiming daily chest');
            setChestData(p => ({ ...p, loading: false, error: message }));
            throw new Error(message);
        }
    }, [program, publicKey, fetchChestData]);

    const openChest = useCallback(async (chestType) => {
        console.log("🚀 ~ useChest ~ chestType:", chestType)
        if (!program || !publicKey) { setChestData(p => ({ ...p, error: 'Program or wallet not available' })); return null; }
        setChestData(p => ({ ...p, loading: true, error: null }));
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const remainingAccounts = getChestOpenRemainingAccounts(chestType, publicKey);
            const ix = await program.methods
                .openChest(chestType)
                .accounts({
                    user: publicKey,
                    gameRegistry: gameRegistryPda,
                    userData: userDataPda,
                    slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                })
                .remainingAccounts(remainingAccounts)
                .instruction();
            
            const { value: alt } = await connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS);
            if (!alt) throw new Error('ALT not found');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            const msgV0 = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: blockhash,
                instructions: [...preIx, ix],
            }).compileToV0Message([alt]);
            const tx = new VersionedTransaction(msgV0);
            
            // Pre-send simulation to surface errors/logs
            try {
                const sim = await connection.simulateTransaction(tx, { sigVerify: false, commitment: 'processed' });
                if (sim?.value?.err) {
                    console.error('🚨 openChest simulate error:', sim.value.err, sim.value.logs);
                    // Don't throw error for simulation failures - let the transaction proceed
                    console.log('🚨 Simulation failed, but proceeding with transaction...');
                }
            } catch (simErr) {
                console.error('🚨 openChest simulation threw:', simErr);
                // Don't throw error for simulation failures - let the transaction proceed
                console.log('🚨 Simulation error caught, but proceeding with transaction...');
            }
            
            let sig;
            try {
                sig = await sendTransaction(tx, connection, { skipPreflight: false, maxRetries: 3 });
            } catch (sendError) {
                console.log('🚨 Normal send failed, retrying with skipPreflight...', sendError.message);
                // Retry with skipPreflight = true to bypass simulation
                sig = await sendTransaction(tx, connection, { skipPreflight: true, maxRetries: 3 });
            }
            const confirmation = await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
            
            // Parse transaction logs to get chest opening results
            let chestResults = [];
            console.log("🔍 Chest opening - checking logs:", confirmation.value?.logs);
            
            // Try to get transaction details if logs are not available in confirmation
            let transactionDetails = null;
            if (!confirmation.value?.logs || confirmation.value.logs.length === 0) {
                console.log("🔍 No logs in confirmation, fetching transaction details...");
                try {
                    transactionDetails = await connection.getTransaction(sig, {
                        commitment: 'confirmed',
                        maxSupportedTransactionVersion: 0
                    });
                    console.log("🔍 Transaction details:", transactionDetails?.meta?.logMessages);
                } catch (err) {
                    console.error("🔍 Error fetching transaction details:", err);
                }
            }
            
            const logsToCheck = confirmation.value?.logs || transactionDetails?.meta?.logMessages || [];
            console.log("🔍 Checking logs:", logsToCheck);
            
            if (logsToCheck.length > 0) {
                for (const log of logsToCheck) {
                    console.log("🔍 Checking log:", log);
                    if (log.includes("reward_cat:") && log.includes("reward_local_id:")) {
                        console.log("🎯 Found reward log:", log);
                        const match = log.match(/reward_cat: (\d+), reward_local_id: (\d+)/);
                        if (match) {
                            const rewardCat = parseInt(match[1]);
                            const rewardLocalId = parseInt(match[2]);
                            // Convert to full item ID (category << 8 | local_id)
                            const fullItemId = (rewardCat << 8) | rewardLocalId;
                            console.log("🎁 Parsed reward:", { rewardCat, rewardLocalId, fullItemId });
                            chestResults.push(fullItemId);
                        }
                    }
                }
            }
            console.log("🎁 Final chest results:", chestResults);
            
            setChestData(p => ({ ...p, loading: false, error: null }));
            return { 
                success: true, 
                txHash: sig, 
                message: 'Chest opened successfully!',
                results: chestResults
            };
        } catch (err) {
            console.error("🚀 ~ openChest ~ err:", err)
            const { message } = handleContractError(err, 'opening chest');
            setChestData(p => ({ ...p, loading: false, error: message }));
            throw new Error(message);
        }
    }, [program, publicKey]);

    useEffect(() => { fetchChestData(); }, [fetchChestData]);

    const getTimeUntilNextChest = useCallback(() => {
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = Math.max(0, chestData.nextChestTime - now);
        return timeLeft * 1000;
    }, [chestData.nextChestTime]);

    return { ...chestData, claimDailyChest, openChest, getTimeUntilNextChest, fetchChestData };
};


