import { useState, useEffect, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getGameRegistryPDA, preIx, getChestRemainingAccounts, getChestOpenRemainingAccounts } from '../solana/utils/pdaUtils';
import { SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { handleContractError } from '../utils/errorHandler';
import { CHEST_PERIOD } from '../utils/basic';
import { LOOKUP_TABLE_ADDRESS } from '../solana/constants/programId';

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
            const ix = await program.methods
                .claimDailyChest()
                .accounts({
                    user: publicKey,
                    gameRegistry: gameRegistryPda,
                    userData: userDataPda,
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
            const sig = await sendTransaction(tx, connection, { skipPreflight: false, maxRetries: 3 });
            await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
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
                console.log('openChest arg (raw):', chestType);
                console.log('remainingAccounts:', remainingAccounts.map(a => ({
                    k: a.pubkey?.toBase58?.(), w: a.isWritable, s: a.isSigner
                })));
                const sim = await connection.simulateTransaction(tx, { sigVerify: false, commitment: 'processed' });
                if (sim?.value?.err) {
                    console.error('🚨 openChest simulate error:', sim.value.err, sim.value.logs);
                    throw new Error('Simulation failed');
                }
            } catch (simErr) {
                console.error('🚨 openChest simulation threw:', simErr);
                throw simErr;
            }
            const sig = await sendTransaction(tx, connection, { skipPreflight: false, maxRetries: 3 });
            await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
            setChestData(p => ({ ...p, loading: false, error: null }));
            return { success: true, txHash: sig, message: 'Chest opening request sent successfully' };
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


