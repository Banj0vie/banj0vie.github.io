import { useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getReferralCodeOwnerPDA } from '../solana/utils/pdaUtils';
import { SystemProgram } from '@solana/web3.js';

export const useProfile = () => {
    const { publicKey } = useSolanaWallet();
    const program = useProgram();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getUserData = useCallback(async () => {
        if (!program || !publicKey) return null;
        try { const [userDataPda] = getUserDataPDA(publicKey); return await program.account.userData.fetch(userDataPda); } catch { return null; }
    }, [program, publicKey]);

    const createProfile = useCallback(async (name, referralCode = '') => {
        if (!program || !publicKey) { setError('Program or wallet not available'); return null; }
        setLoading(true); setError(null);
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
            const tx = await program.methods
                .createProfile(name, referralBytes)
                .accounts({ user: publicKey, userData: userDataPda, codeOwner: codeOwnerPda, systemProgram: SystemProgram.programId })
                .rpc();
            return tx;
        } catch (err) { setError(err.message); return null; } finally { setLoading(false); }
    }, [program, publicKey]);

    return { getUserData, createProfile, loading, error };
};


