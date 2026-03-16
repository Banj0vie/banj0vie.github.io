import { useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getGameRegistryPDA, getUserDataPDA, getMarketDataPDA, getListingPDA, getItemMintPDA, getItemMintAuthPDA, getEpochTop5PDA, getGameRegistryInfo, getSponsorGameAta, getGameVaultPDA, getGameVaultAta } from '../solana/utils/pdaUtils';
import { SystemProgram, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { GAME_TOKEN_MINT } from '../solana/constants/programId';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { EPOCH_PERIOD } from '../utils/basic';
import { sendTransactionForPhantom } from '../utils/transactionHelper';

export const useMarket = () => {
    const { publicKey, sendTransaction } = useSolanaWallet();
    const { program, connection } = useProgram();
    const [marketData, setMarketData] = useState({ listings: [], nextId: 0, loading: false, error: null });

    function getRemainingAccounts({
        listingPairs,
        itemMintPda,
        buyerItemAta,
        itemMintAuthPda,
        epochTop5Pda,
        sponsorGameAta,
    }) {
        const accounts = [];
        // Listings first (each as [listingPda, sellerGameAta])
        for (const [listingPda, sellerGameAta] of listingPairs) {
            accounts.push({ pubkey: listingPda, isWritable: true, isSigner: false });
            accounts.push({ pubkey: sellerGameAta, isWritable: true, isSigner: false });
        }
        // Item minting accounts (searched by address in program)
        accounts.push({ pubkey: itemMintPda, isWritable: true, isSigner: false });
        accounts.push({ pubkey: buyerItemAta, isWritable: true, isSigner: false });
        accounts.push({ pubkey: itemMintAuthPda, isWritable: false, isSigner: false });
        // XP accounts at the end (last 2)
        accounts.push({ pubkey: epochTop5Pda, isWritable: true, isSigner: false });
        accounts.push({ pubkey: sponsorGameAta, isWritable: true, isSigner: false });
        return accounts;
    }
    
    async function getListingPairs({ program, itemId, gameTokenMint, maxPairs = 10 }) {
        // Fetch all listing accounts, filter by active + itemId, return [listingPda, sellerGameAta]
        const allListings = await program.account.listing.all();
        const filtered = allListings.filter(l => l.account.active && l.account.itemId === itemId);
        const pairs = [];
        for (const listing of filtered.slice(0, maxPairs)) {
            const sellerGameAta = await getAssociatedTokenAddress(gameTokenMint, listing.account.seller);
            pairs.push([listing.publicKey, sellerGameAta]);
        }
        return pairs;
    }

    const getAllListings = useCallback(async () => {
        if (!program) return [];
        setMarketData(prev => ({ ...prev, loading: true, error: null }));
        try {
            const marketDataPda = getMarketDataPDA();
            let md;
            try {
                md = await program.account.marketData.fetch(marketDataPda);
            } catch (e) {
                // MarketData account may not exist until first listing
                if (e?.message?.includes('Account does not exist') || e?.message?.includes('has no data')) {
                    setMarketData(prev => ({ ...prev, listings: [], nextId: 0, loading: false }));
                    return [];
                }
                throw e;
            }
            const currentNextId = Number(md.nextId?.toString?.() ?? md.nextId ?? 0);
            const allListings = [];
            for (let i = 0; i < currentNextId; i++) {
                try {
                    const listingPda = getListingPDA(new BN(i));
                    const listing = await program.account.listing.fetch(listingPda);
                    if (listing.active) {
                        allListings.push({
                            lid: i,
                            seller: listing.seller?.toString?.() || '',
                            id: Number(listing.itemId?.toString?.() || listing.itemId || 0),
                            amount: Number(listing.amount?.toString?.() || listing.amount || 0),
                            pricePer: Number(listing.pricePer?.toString?.() || listing.pricePer || 0) / 1e9,
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
        if (marketData.loading) { throw new Error('Transaction already in progress'); }
        setMarketData(prev => ({ ...prev, loading: true, error: null }));
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
            const gameRegistryInfo = await getGameRegistryInfo(program);
            const epochStart = Math.floor(Number(gameRegistryInfo.epochStart?.toString?.() ?? 0));
            const epochCurrent = Math.floor(Number(gameRegistryInfo.epoch?.toString?.() ?? 0));
            const nowSec = Math.floor(Date.now() / 1000);
            const epoch = (epochStart + EPOCH_PERIOD) > nowSec ? epochCurrent : epochCurrent + 1;
            const epochU32 = (epoch >>> 0) & 0xffffffff;
            const epochTop5Pda = getEpochTop5PDA(epochU32);
            const sponsorGameAta = await getSponsorGameAta(program, publicKey);
            const remainingAccounts = [
                { pubkey: sellerGameAta, isWritable: true, isSigner: false },
                { pubkey: itemMintPda, isWritable: true, isSigner: false },
                { pubkey: buyerItemAta, isWritable: true, isSigner: false },
                { pubkey: itemMintAuthPda, isWritable: false, isSigner: false },
                { pubkey: epochTop5Pda, isWritable: true, isSigner: false },
                { pubkey: sponsorGameAta, isWritable: true, isSigner: false },
            ];

            // No client-side balance pre-check; centralized handler will format errors
            // Build transaction with compute budget
            const method = program.methods
                .purchase(new BN(lid), new BN(amount), epochU32)
                .accounts({
                    buyer: publicKey,
                    gameRegistry: gameRegistryPda,
                    listing: listingPda,
                    buyerData: userDataPda,
                    buyerGameAta: userGameAta,
                    gameTokenMint: GAME_TOKEN_MINT,
                    gameVault: getGameVaultPDA(),
                    gameVaultAta: getGameVaultAta(),
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .remainingAccounts(remainingAccounts);
            
            const sig = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
            return sig;
        } catch (error) {
            console.error('Purchase error:', error);
            
            // Handle specific transaction errors
            if (error.message.includes('already been processed') || error.message.includes('Transaction simulation failed: This transaction has already been processed')) {
                throw new Error('Transaction already submitted. Please wait and try again.');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient funds for this transaction.');
            } else if (error.message.toLowerCase().includes('insufficient balance')) {
                throw new Error('Insufficient balance');
            } else if (error.message.includes('User rejected')) {
                throw new Error('Transaction was cancelled by user.');
            } else if (error.message.includes('encoding overruns Uint8Array')) {
                throw new Error('Transaction too large. Please try with a smaller amount.');
            }
            
            throw error;
        } finally {
            setMarketData(prev => ({ ...prev, loading: false }));
        }
    }, [program, publicKey, marketData.loading]);

    const list = useCallback(async (id, amount, pricePer) => {
        if (!program || !publicKey) return null;
        if (marketData.loading) { throw new Error('Transaction already in progress'); }
        setMarketData(prev => ({ ...prev, loading: true, error: null }));
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const marketDataPda = getMarketDataPDA();
            let marketData;
            try {
                marketData = await program.account.marketData.fetch(marketDataPda);
            } catch (e) {
                // MarketData account may not exist until first listing (init_if_needed in contract)
                if (e?.message?.includes('Account does not exist') || e?.message?.includes('has no data')) {
                    marketData = { nextId: new BN(0) };
                } else {
                    throw e;
                }
            }
            const nextId = Number(marketData?.nextId?.toString?.() ?? marketData?.nextId ?? 0);
            const listingPda = getListingPDA(new BN(nextId));
            const itemMintPda = getItemMintPDA(id);
            const sellerItemAta = await getAssociatedTokenAddress(itemMintPda, publicKey, false);
            const itemMintAuthPda = getItemMintAuthPDA();
            // Build transaction with compute budget
            const method = program.methods
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
                });
            
            const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
            return tx;
        } catch (error) {
            console.error('List error:', error);
            
            // Handle specific transaction errors
            if (error.message.includes('already been processed') || error.message.includes('Transaction simulation failed: This transaction has already been processed')) {
                throw new Error('Transaction already submitted. Please wait and try again.');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient funds for this transaction.');
            } else if (error.message.includes('User rejected')) {
                throw new Error('Transaction was cancelled by user.');
            } else if (error.message.includes('encoding overruns Uint8Array')) {
                throw new Error('Transaction too large. Please try with a smaller amount.');
            }
            
            throw error;
        } finally {
            setMarketData(prev => ({ ...prev, loading: false }));
        }
    }, [program, publicKey, marketData.loading]);

    const cancel = useCallback(async (lid) => {
        if (!program || !publicKey) return null;
        if (marketData.loading) { throw new Error('Transaction already in progress'); }
        setMarketData(prev => ({ ...prev, loading: true, error: null }));
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const listingPda = getListingPDA(new BN(lid));
            const listing = await program.account.listing.fetch(listingPda);
            const itemId = Number(listing.itemId || 0);
            const itemMintPda = getItemMintPDA(itemId);
            const sellerItemAta = await getAssociatedTokenAddress(itemMintPda, publicKey, false);
            const itemMintAuthPda = getItemMintAuthPDA();
            // Build transaction with compute budget
            const method = program.methods
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
                });
            
            const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
            return tx;
        } catch (error) {
            console.error('Cancel error:', error);
            
            // Handle specific transaction errors
            if (error.message.includes('already been processed') || error.message.includes('Transaction simulation failed: This transaction has already been processed')) {
                throw new Error('Transaction already submitted. Please wait and try again.');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient funds for this transaction.');
            } else if (error.message.includes('User rejected')) {
                throw new Error('Transaction was cancelled by user.');
            } else if (error.message.includes('encoding overruns Uint8Array')) {
                throw new Error('Transaction too large. Please try with a smaller amount.');
            }
            
            throw error;
        } finally {
            setMarketData(prev => ({ ...prev, loading: false }));
        }
    }, [program, publicKey, marketData.loading]);

    const batchBuy = useCallback(async (id, maxPricePer, totalBudget) => {
        if (!program || !publicKey) return null;
        if (marketData.loading) { throw new Error('Transaction already in progress'); }
        setMarketData(prev => ({ ...prev, loading: true, error: null }));
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const userDataPda = getUserDataPDA(publicKey);
            const userGameAta = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey, false);
            const itemMintPda = getItemMintPDA(id);
            const buyerItemAta = await getAssociatedTokenAddress(itemMintPda, publicKey, false);
            const itemMintAuthPda = getItemMintAuthPDA();
            const gameRegistryInfo = await getGameRegistryInfo(program);
            const epochStart = Math.floor(Number(gameRegistryInfo.epochStart?.toString?.() ?? 0));
            const epochCurrent = Math.floor(Number(gameRegistryInfo.epoch?.toString?.() ?? 0));
            const nowSec = Math.floor(Date.now() / 1000);
            const epoch = (epochStart + EPOCH_PERIOD) > nowSec ? epochCurrent : epochCurrent + 1;
            const epochU32 = (epoch >>> 0) & 0xffffffff;
            const epochTop5Pda = getEpochTop5PDA(epochU32);
            const sponsorGameAta = await getSponsorGameAta(program, publicKey);
            const listingPairs = await getListingPairs({ program, itemId: id, gameTokenMint: GAME_TOKEN_MINT });

            // No client-side balance pre-check; centralized handler will format errors

            // Build transaction with compute budget
            const method = program.methods
                .batchBuy(id, new BN(Math.floor(maxPricePer * 1e9)), new BN(Math.floor(totalBudget * 1e9)), epochU32)
                .accounts({ 
                    buyer: publicKey, 
                    gameRegistry: gameRegistryPda, 
                    buyerData: userDataPda, 
                    buyerGameAta: userGameAta, 
                    gameTokenMint: GAME_TOKEN_MINT, 
                    gameVault: getGameVaultPDA(),
                    gameVaultAta: getGameVaultAta(),
                    tokenProgram: TOKEN_PROGRAM_ID, 
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, 
                    systemProgram: SystemProgram.programId 
                })
                .remainingAccounts(getRemainingAccounts({
                    listingPairs,
                    itemMintPda,
                    buyerItemAta,
                    itemMintAuthPda,
                    epochTop5Pda,
                    sponsorGameAta,
                }));
            
            const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
            return tx;
        } catch (error) {
            console.error('Batch buy error:', error);
            
            // Handle specific transaction errors
            if (error.message.includes('already been processed') || error.message.includes('Transaction simulation failed: This transaction has already been processed')) {
                throw new Error('Transaction already submitted. Please wait and try again.');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient funds for this transaction.');
            } else if (error.message.toLowerCase().includes('insufficient balance')) {
                throw new Error('Insufficient balance');
            } else if (error.message.includes('User rejected')) {
                throw new Error('Transaction was cancelled by user.');
            } else if (error.message.includes('encoding overruns Uint8Array')) {
                throw new Error('Transaction too large. Please try with a smaller amount.');
            }
            
            throw error;
        } finally {
            setMarketData(prev => ({ ...prev, loading: false }));
        }
    }, [program, publicKey, marketData.loading]);

    const send = useCallback(async (id, to, amount) => {
        if (!program || !publicKey) return null;
        if (marketData.loading) { throw new Error('Transaction already in progress'); }
        setMarketData(prev => ({ ...prev, loading: true, error: null }));
        try {
            const gameRegistryPda = getGameRegistryPDA();
            const itemMintPda = getItemMintPDA(id);
            const recipient = new PublicKey(to);
            const senderItemAta = await getAssociatedTokenAddress(itemMintPda, publicKey, false);
            const recipientItemAta = await getAssociatedTokenAddress(itemMintPda, recipient, false);
            const itemMintAuthPda = getItemMintAuthPDA();
            
            // Build transaction with compute budget
            const method = program.methods
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
                });
            
            const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
            return tx;
        } catch (error) {
            console.error('Send error:', error);
            
            // Handle specific transaction errors
            if (error.message.includes('already been processed') || error.message.includes('Transaction simulation failed: This transaction has already been processed')) {
                throw new Error('Transaction already submitted. Please wait and try again.');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient funds for this transaction.');
            } else if (error.message.includes('User rejected')) {
                throw new Error('Transaction was cancelled by user.');
            } else if (error.message.includes('encoding overruns Uint8Array')) {
                throw new Error('Transaction too large. Please try with a smaller amount.');
            }
            
            throw error;
        } finally {
            setMarketData(prev => ({ ...prev, loading: false }));
        }
    }, [program, publicKey, marketData.loading]);

    return { marketData, getAllListings, purchase, list, cancel, batchBuy, send };
};
