import { useState, useCallback, useEffect } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getReferralCodeOwnerPDA, getReceiverPDA } from '../solana/utils/pdaUtils';
import { SystemProgram, PublicKey } from '@solana/web3.js';
import { handleContractError } from '../utils/errorHandler';
import { sendTransactionForPhantom } from '../utils/transactionHelper';

export const useReferral = () => {
  const { publicKey, connection, sendTransaction } = useSolanaWallet();
  const { program } = useProgram();
  const [referralData, setReferralData] = useState({
    myReferralCode: null,
    sponsor: null,
    canRegisterCode: false,
    referralBpsByLevel: {},
    currentLevel: 0,
    loading: false,
    error: null,
  });

  const fetchReferralData = useCallback(async () => {
    if (!program || !publicKey) return;
    if (!program.account || !program.account.userData) {
      setReferralData(prev => ({ ...prev, loading: false, error: 'Program account client not initialized' }));
      return;
    }
    setReferralData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const userDataPda = getUserDataPDA(publicKey);
      const ud = await program.account.userData.fetch(userDataPda);
      const currentLevel = Number(ud.level || 0);
      // referral code is [u8;32] on-chain; support both field names
      const codeField = ud.referral_code || ud.referralCode || null;
      let myReferralCode = codeField ? new Uint8Array(codeField) : null;
      // Treat all-zero [u8;32] as not registered
      if (myReferralCode && myReferralCode.length === 32 && myReferralCode.every((b) => b === 0)) {
        myReferralCode = null;
      }
      const sponsorPk = ud.sponsor || null;
      const sponsor = sponsorPk && sponsorPk.toString && sponsorPk.toString() !== PublicKey.default.toString() ? sponsorPk.toString() : null;
      const canRegisterCode = currentLevel >= 6 && !myReferralCode;
      const referralBps = {}; for (let level = 0; level <= 15; level++) referralBps[level] = 500;
      setReferralData({ myReferralCode, sponsor, canRegisterCode, referralBpsByLevel: referralBps, currentLevel, loading: false, error: null });
    } catch (err) {
      const { message } = handleContractError(err, 'fetching referral data');
      setReferralData(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [program, publicKey]);

  const registerReferralCode = useCallback(async (code) => {
    if (!program || !publicKey) { setReferralData(p => ({ ...p, error: 'Program or wallet not available' })); return null; }
    setReferralData(p => ({ ...p, loading: true, error: null }));
    try {
      const userDataPda = getUserDataPDA(publicKey);
      // Encode code to [u8;32]
      let codeBytes = new Uint8Array(32);
      if (code && typeof code === 'string') {
        const enc = new TextEncoder();
        const buf = enc.encode(code);
        codeBytes.set(buf.slice(0, 32));
      } else if (code instanceof Uint8Array) {
        codeBytes.set(code.slice(0, 32));
      }
      const referralCodeOwnerPda = getReferralCodeOwnerPDA(codeBytes);
      const receiverPda = getReceiverPDA();
      const receiverInfo = await program.account.receiver.fetch(receiverPda);
      const receiverWallet1 = receiverInfo.receiver1;
      const receiverWallet2 = receiverInfo.receiver2;
      const method = program.methods
        .registerMyReferralCode(codeBytes)
        .accounts({ 
          player: publicKey, 
          userData: userDataPda, 
          codeOwner: referralCodeOwnerPda, 
          receiver: receiverPda,
          receiverWallet1: receiverWallet1,
          receiverWallet2: receiverWallet2,
          systemProgram: SystemProgram.programId 
        });
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      await fetchReferralData();
      return tx;
    } catch (err) {
      const { message } = handleContractError(err, 'registering referral code');
      setReferralData(p => ({ ...p, loading: false, error: message }));
      throw err;
    }
  }, [program, publicKey, fetchReferralData]);

  const createProfile = useCallback(async (name, referralCode = null) => {
    if (!program || !publicKey) { setReferralData(p => ({ ...p, error: 'Program or wallet not available' })); return null; }
    setReferralData(p => ({ ...p, loading: true, error: null }));
    try {
      const userDataPda = getUserDataPDA(publicKey);
      const receiverPda = getReceiverPDA();
      const receiverInfo = await program.account.receiver.fetch(receiverPda);
      const receiverWallet1 = receiverInfo.receiver1;
      const receiverWallet2 = receiverInfo.receiver2;
      // Check if profile already exists
      if (!program.account || !program.account.userData) {
        setReferralData(p => ({ ...p, loading: false, error: 'Program account client not initialized' }));
        return null;
      }
      try {
        const existingProfile = await program.account.userData.fetch(userDataPda);
        if (existingProfile && existingProfile.name) {
          setReferralData(p => ({ ...p, loading: false, error: 'Profile already exists' }));
          throw new Error('Profile already exists');
        }
      } catch (err) {
        // Profile doesn't exist, continue with creation
      }
      
      // Check if referral code is provided and valid
      let referralBytes = new Uint8Array(32); // Default to [0u8; 32]
      let referralCodeOwnerPda = null;
      
      if (referralCode && referralCode.trim() !== '') {
        // Encode referralCode to [u8;32]
        if (typeof referralCode === 'string') {
          const enc = new TextEncoder();
          const buf = enc.encode(referralCode.trim());
          referralBytes.set(buf.slice(0, 32));
        } else if (referralCode instanceof Uint8Array) {
          referralBytes.set(referralCode.slice(0, 32));
        }
        
        // Check if the referral code owner account exists
        if (!program.account || !program.account.referralCodeOwner) {
          setReferralData(p => ({ ...p, loading: false, error: 'Program account client not initialized' }));
          return null;
        }
        referralCodeOwnerPda = getReferralCodeOwnerPDA(referralBytes);
        try {
          await program.account.referralCodeOwner.fetch(referralCodeOwnerPda);
        } catch (err) {
          // Referral code doesn't exist, show user-friendly error
          setReferralData(p => ({ ...p, loading: false, error: 'Invalid referral code' }));
          throw new Error('Invalid referral code');
        }
      }
      
      // For empty referral code, use [0u8; 32] and null codeOwner (as per test script)
      if (!referralCodeOwnerPda) {
        referralBytes = new Uint8Array(32); // [0u8; 32]
        referralCodeOwnerPda = null; // null for empty referral code
      }
      
      if (!program.methods || !program.methods.createProfile) {
        setReferralData(p => ({ ...p, loading: false, error: 'Program methods not initialized' }));
        return null;
      }
      const method = program.methods
        .createProfile(name, referralBytes)
        .accounts({ 
          user: publicKey, 
          userData: userDataPda, 
          receiver: receiverPda,
          receiverWallet1: receiverWallet1,
          receiverWallet2: receiverWallet2,
          codeOwner: referralCodeOwnerPda, 
          systemProgram: SystemProgram.programId,
        });
      
      const tx = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      await fetchReferralData();
      return tx;
    } catch (err) {
      let errorMessage = 'Failed to create profile';
      
      // Handle specific error cases with shorter messages
      if (err.message.includes('Invalid referral code')) {
        errorMessage = 'Invalid referral code';
      } else if (err.message.includes('AccountNotInitialized')) {
        errorMessage = 'Invalid referral code';
      } else if (err.message.includes('already been processed') || err.message.includes('Transaction simulation failed: This transaction has already been processed')) {
        errorMessage = 'Profile already exists or transaction already submitted';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds';
      } else if (err.message.includes('User rejected')) {
        errorMessage = 'Transaction cancelled';
      } else if (err.message.includes('Transaction simulation failed')) {
        errorMessage = 'Transaction failed - please try again';
      } else {
        const { message } = handleContractError(err, 'creating profile');
        errorMessage = message;
      }
      
      setReferralData(p => ({ ...p, loading: false, error: errorMessage }));
      throw err;
    }
  }, [program, publicKey, fetchReferralData]);

  useEffect(() => { fetchReferralData(); }, [fetchReferralData]);

  return { ...referralData, registerReferralCode, createProfile, fetchReferralData };
};


