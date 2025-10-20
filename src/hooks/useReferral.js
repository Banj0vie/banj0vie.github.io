import { useState, useCallback, useEffect } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getUserDataPDA, getReferralCodeOwnerPDA } from '../solana/utils/pdaUtils';
import { SystemProgram, PublicKey } from '@solana/web3.js';
import { handleContractError } from '../utils/errorHandler';

export const useReferral = () => {
  const { publicKey } = useSolanaWallet();
  const valleyProgram = useProgram();
  const program = valleyProgram.getProgram();
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
      const tx = await program.methods
        .registerMyReferralCode(codeBytes)
        .accounts({ 
          player: publicKey, 
          userData: userDataPda, 
          codeOwner: referralCodeOwnerPda, 
          systemProgram: SystemProgram.programId 
        })
        .rpc();
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
      // Encode referralCode to [u8;32]
      let referralBytes = new Uint8Array(32);
      if (referralCode) {
        if (typeof referralCode === 'string') {
          const enc = new TextEncoder();
          const buf = enc.encode(referralCode);
          referralBytes.set(buf.slice(0, 32));
        } else if (referralCode instanceof Uint8Array) {
          referralBytes.set(referralCode.slice(0, 32));
        }
      }
      const referralCodeOwnerPda = getReferralCodeOwnerPDA(referralBytes);
      const tx = await program.methods
        .createProfile(name, referralBytes)
        .accounts({ user: publicKey, userData: userDataPda, codeOwner: referralCodeOwnerPda, systemProgram: SystemProgram.programId })
        .rpc();
      await fetchReferralData();
      return tx;
    } catch (err) {
      const { message } = handleContractError(err, 'creating profile with referral');
      setReferralData(p => ({ ...p, loading: false, error: message }));
      throw err;
    }
  }, [program, publicKey, fetchReferralData]);

  useEffect(() => { fetchReferralData(); }, [fetchReferralData]);

  return { ...referralData, registerReferralCode, createProfile, fetchReferralData };
};


