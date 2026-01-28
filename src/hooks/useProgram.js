import { useMemo } from 'react';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import DEX_IDL from "../solana/anchor/dex.json";
import SOLANA_VALLEY_IDL from "../solana/anchor/solana_valley.json";
import { SOLANA_VALLEY_DEX_PROGRAM_ID, SOLANA_VALLEY_PROGRAM_ID } from '../solana/constants/programId';
import { AnchorProvider, Program } from '@coral-xyz/anchor';

export const useProgram = (isDex = false) => {
  const { publicKey, connected, sendTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  
  const program = useMemo(() => {
    if (!wallet || !publicKey) {
      return null;
    }
    try {
      const provider = new AnchorProvider(connection, wallet, {preflightCommitment: "confirmed",});
      if (isDex) {
        return new Program({ ...DEX_IDL, address: SOLANA_VALLEY_DEX_PROGRAM_ID.toString() }, provider);
      } else {
        return new Program({ ...SOLANA_VALLEY_IDL, address: SOLANA_VALLEY_PROGRAM_ID.toString() }, provider);
      }
    } catch (error) {
      console.error('Failed to create program:', error);
      return null;
    }
  }, [connection, wallet, publicKey, isDex]);

  return {
    program: program,
    connection: connection,
    publicKey: publicKey,
    connected: connected,
    sendTransaction: sendTransaction,
    signAllTransactions: signAllTransactions,
  }
};