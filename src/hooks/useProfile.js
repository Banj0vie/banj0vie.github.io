import { useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { getUserDataPDA, getReferralCodeOwnerPDA } from '../solana/utils/pdaUtils';
import { SystemProgram } from '@solana/web3.js';
import { sendTransactionForPhantom } from '../utils/transactionHelper';

export const useProfile = () => {
    const { publicKey, connection, sendTransaction, program } = useProgram();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getUserData = useCallback(async () => {
        if (!program || !publicKey) return null;
        try { const [userDataPda] = getUserDataPDA(publicKey); return await program.account.userData.fetch(userDataPda); } catch { return null; }
    }, [program, publicKey]);

    const createProfile = useCallback(async (name, referralCode = '') => {
        if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
        if (loading) { setError('Transaction already in progress'); return null; }
        setLoading(true); setError(null);
    console.log("asdffffffffffffffffffffffffffffffffffffffffffffff", connection)

        try {
            const [userDataPda] = getUserDataPDA(publicKey);
            // Convert referralCode to [u8;32] per IDL
            let referralBytes = new Uint8Array(32);
            if (referralCode && typeof referralCode === 'string') {
                const enc = new TextEncoder();
                const buf = enc.encode(referralCode);
                referralBytes.set(buf.slice(0, 32));
            }
            const [codeOwnerPda] = getReferralCodeOwnerPDA(referralBytes);
            const method = program.methods
                .createProfile(name, referralBytes)
                .accounts({ user: publicKey, userData: userDataPda, codeOwner: codeOwnerPda, systemProgram: SystemProgram.programId });
            
            const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
            return tx;
        } catch (err) { 
          // Handle specific transaction errors
          let errorMessage = err.message;
          if (err.message.includes('already been processed') || err.message.includes('Transaction simulation failed: This transaction has already been processed')) {
            errorMessage = 'Transaction already submitted. Please wait and try again.';
          } else if (err.message.includes('insufficient funds')) {
            errorMessage = 'Insufficient funds for this transaction.';
          } else if (err.message.includes('User rejected')) {
            errorMessage = 'Transaction was cancelled by user.';
          } else if (err.message.includes('encoding overruns Uint8Array')) {
            errorMessage = 'Transaction too large. Please try with a smaller amount.';
          }
          
          setError(errorMessage); 
          return null; 
        } finally { setLoading(false); }
    }, [program, publicKey]);

    return { getUserData, createProfile, loading, error };
};


