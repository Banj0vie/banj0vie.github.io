import { useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getGameRegistryPDA, getUserDataPDA, getMarketDataPDA, getListingPDA, getItemMintPDA, getItemMintAuthPDA, getGameTokenMintAuthPDA, getEpochTop5PDA, getGameRegistryInfo, getSponsorGameAta } from '../solana/utils/pdaUtils';
import { SystemProgram, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { GAME_TOKEN_MINT, LOOKUP_TABLE_ADDRESS } from '../solana/constants/programId';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { preIx } from '../solana/utils/pdaUtils';

export const useMarket = () => {
    const { publicKey, sendTransaction } = useSolanaWallet();
    const valleyProgram = useProgram();
    const program = valleyProgram.getProgram();
    const connection = valleyProgram.getConnection();
    const [marketData, setMarketData] = useState({ listings: [], nextId: 0, loading: false, error: null });

    const getAllListings = useCallback(async () => {
        if (!program) return [];
        setMarketData(prev => ({ ...prev, loading: true, error: null }));
        try {
            const marketDataPda = getMarketDataPDA();
            const md = await program.account.marketData.fetch(marketDataPda);
            const currentNextId = Number(md.nextId || 0);
            const allListings = [];
            for (let i = 0; i < currentNextId; i++) {
                try {
                    const listingPda = getListingPDA(new BN(i));
                    const listing = await program.account.listing.fetch(listingPda);
                    if (listing.active) {
                        allListings.push({
                            lid: i,
                            seller: listing.seller?.toString?.() || '',
                            id: Number(listing.itemId || 0),
                            amount: Number(listing.amount || 0),
                            pricePer: Number(listing.pricePer || 0) / 1e9,
                            active: !!listing.active,
                        });
                    }
                } catch { }
            }
            setMarketData(prev => ({ ...prev, listings: allListings, nextId: currentNextId, loading: false }));
            return allListings;
        } catch (err) {
            setMarketData(prev => ({ ...prev, loading: false, error: err.message }));
            return [];
        }
    }, [program]);

    const purchase = useCallback(async (lid, amount) => {
        if (!program || !publicKey) return null;
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const listingPda = getListingPDA(new BN(lid));
            
            // Fetch listing to resolve item and seller
            const listing = await program.account.listing.fetch(listingPda);
            const itemId = Number(listing.itemId || 0);
            const seller = listing.seller;
            
            const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
            const sellerGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, seller, false);
            const itemMintPda = getItemMintPDA(itemId);
            const buyerItemAta = await getAssociatedTokenAddress(itemMintPda, publicKey, false);
            const itemMintAuthPda = getItemMintAuthPDA();
            const gameTokenMintAuthPda = getGameTokenMintAuthPDA();
            const remainingAccounts = [];
            const gameRegistryInfo = await getGameRegistryInfo(program);
            const epochTop5Pda = getEpochTop5PDA(gameRegistryInfo.epoch - 1);
            console.log("🚀 ~ useMarket ~ epochTop5Pda:", epochTop5Pda.toBase58())
            remainingAccounts.push({ pubkey: epochTop5Pda, isWritable: true, isSigner: false });
            const sponsorGameAta = await getSponsorGameAta(program, publicKey);
            remainingAccounts.push({ pubkey: sponsorGameAta, isWritable: true, isSigner: false });
            // Build transaction with compute budget
            const ix = await program.methods
                .purchase(new BN(lid), new BN(amount))
                .accounts({
                    buyer: publicKey,
                    gameRegistry: gameRegistryPda,
                    listing: listingPda,
                    buyerData: userDataPda,
                    buyerGameAta: userGameAta,
                    sellerGameAta: sellerGameAta,
                    gameTokenMint: GAME_TOKEN_MINT,
                    gameTokenMintAuth: gameTokenMintAuthPda,
                    itemMint: itemMintPda,
                    buyerItemAta: buyerItemAta,
                    itemMintAuth: itemMintAuthPda,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
            const { value: alt } = await connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS);
            if (!alt) throw new Error('ALT not found');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            const msgV0 = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: blockhash,
                instructions: [...preIx, ix],
            }).compileToV0Message([alt]);
            const tx = new VersionedTransaction(msgV0);
            // INSERT_YOUR_CODE
            // Pre-send simulation to surface possible errors/logs
            try {
                const sim = await connection.simulateTransaction(tx, { sigVerify: false, commitment: 'processed' });
                if (sim?.value?.err) {
                    console.error('🚨 purchase simulate error:', sim.value.err, sim.value.logs);
                    throw new Error('Simulation failed');
                }
            } catch (simErr) {
                console.error('🚨 purchase simulation threw:', simErr);
                throw simErr;
            }
            const sig = await sendTransaction(tx, connection, { skipPreflight: false, maxRetries: 3 });
            await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
            return sig;
        } catch (error) {
            console.error('Purchase error:', error);
            throw error;
        }
    }, [program, publicKey]);

    const list = useCallback(async (id, amount, pricePer) => {
        if (!program || !publicKey) return null;
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const marketDataPda = getMarketDataPDA();
            const marketData = await program.account.marketData.fetch(marketDataPda).catch(e => console.log(e));
            const nextId = Number(marketData?.nextId || 0);
            const listingPda = getListingPDA(new BN(nextId));
            const itemMintPda = getItemMintPDA(id);
            const sellerItemAta = await getAssociatedTokenAddress(itemMintPda, publicKey, false);
            const itemMintAuthPda = getItemMintAuthPDA();
            // Build transaction with compute budget
            const tx = await program.methods
                .list(id, new BN(amount), new BN(Math.floor(pricePer * 1e9)))
                .accounts({ 
                    seller: publicKey, 
                    gameRegistry: gameRegistryPda, 
                    listing: listingPda, 
                    marketData: marketDataPda, 
                    itemMint: itemMintPda, 
                    sellerItemAta: sellerItemAta, 
                    itemMintAuth: itemMintAuthPda, 
                    tokenProgram: TOKEN_PROGRAM_ID, 
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, 
                    systemProgram: SystemProgram.programId 
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('List error:', error);
            throw error;
        }
    }, [program, publicKey]);

    const cancel = useCallback(async (lid) => {
        if (!program || !publicKey) return null;
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const listingPda = getListingPDA(new BN(lid));
            const listing = await program.account.listing.fetch(listingPda);
            const itemId = Number(listing.itemId || 0);
            const itemMintPda = getItemMintPDA(itemId);
            const sellerItemAta = await getAssociatedTokenAddress(itemMintPda, publicKey, false);
            const itemMintAuthPda = getItemMintAuthPDA();
            
            // Build transaction with compute budget
            const tx = await program.methods
                .cancel()
                .accounts({ 
                    seller: publicKey, 
                    gameRegistry: gameRegistryPda, 
                    listing: listingPda, 
                    itemMint: itemMintPda, 
                    sellerItemAta: sellerItemAta, 
                    itemMintAuth: itemMintAuthPda, 
                    tokenProgram: TOKEN_PROGRAM_ID, 
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, 
                    systemProgram: SystemProgram.programId 
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('Cancel error:', error);
            throw error;
        }
    }, [program, publicKey]);

    const batchBuy = useCallback(async (id, maxPricePer, totalBudget) => {
        if (!program || !publicKey) return null;
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
            const itemMintPda = getItemMintPDA(id);
            const buyerItemAta = await getAssociatedTokenAddress(itemMintPda, publicKey, false);
            const itemMintAuthPda = getItemMintAuthPDA();
            const gameTokenMintAuthPda = getGameTokenMintAuthPDA();
            
            // Build transaction with compute budget
            const tx = await program.methods
                .batchBuy(id, new BN(Math.floor(maxPricePer * 1e9)), new BN(Math.floor(totalBudget * 1e9)))
                .accounts({ 
                    buyer: publicKey, 
                    gameRegistry: gameRegistryPda, 
                    buyerData: userDataPda, 
                    buyerGameAta: userGameAta, 
                    gameTokenMint: GAME_TOKEN_MINT, 
                    gameTokenMintAuth: gameTokenMintAuthPda, 
                    itemMint: itemMintPda, 
                    buyerItemAta: buyerItemAta, 
                    itemMintAuth: itemMintAuthPda, 
                    tokenProgram: TOKEN_PROGRAM_ID, 
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, 
                    systemProgram: SystemProgram.programId 
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('Batch buy error:', error);
            throw error;
        }
    }, [program, publicKey]);

    const send = useCallback(async (id, to, amount) => {
        if (!program || !publicKey) return null;
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const itemMintPda = getItemMintPDA(id);
            const recipient = new PublicKey(to);
            const senderItemAta = await getAssociatedTokenAddress(itemMintPda, publicKey, false);
            const recipientItemAta = await getAssociatedTokenAddress(itemMintPda, recipient, false);
            const itemMintAuthPda = getItemMintAuthPDA();
            
            // Build transaction with compute budget
            const tx = await program.methods
                .send(id, new BN(amount))
                .accounts({ 
                    sender: publicKey, 
                    recipient: recipient, 
                    gameRegistry: gameRegistryPda, 
                    itemMint: itemMintPda, 
                    senderItemAta, 
                    recipientItemAta, 
                    itemMintAuth: itemMintAuthPda, 
                    tokenProgram: TOKEN_PROGRAM_ID, 
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, 
                    systemProgram: SystemProgram.programId 
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('Send error:', error);
            throw error;
        }
    }, [program, publicKey]);

    return { marketData, getAllListings, purchase, list, cancel, batchBuy, send };
};


