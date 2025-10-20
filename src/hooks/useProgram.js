import { useMemo, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createSolanaValleyProgram } from '../solana/anchor/client';

export const useProgram = () => {
  const { connection } = useConnection();
  const { wallet, publicKey, signTransaction, signAllTransactions } = useWallet();

  const program = useMemo(() => {
    if (!wallet || !publicKey) {
      return null;
    }
    try {
      const anchorWallet = { publicKey, signTransaction, signAllTransactions };
      return createSolanaValleyProgram(connection, anchorWallet);
    } catch (error) {
      console.error('Failed to create Solana Valley program:', error);
      return null;
    }
  }, [connection, wallet, publicKey, signTransaction, signAllTransactions]);

  return program;
};

export const useProgramWithError = () => {
  const { connection } = useConnection();
  const { wallet, publicKey, connecting, signTransaction, signAllTransactions } = useWallet();
  const [error, setError] = useState(null);

  const program = useMemo(() => {
    if (connecting) {
      return null;
    }
    if (!wallet || !publicKey) {
      setError('Wallet not connected');
      return null;
    }
    try {
      setError(null);
      const anchorWallet = { publicKey, signTransaction, signAllTransactions };
      return createSolanaValleyProgram(connection, anchorWallet);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create program';
      setError(errorMessage);
      return null;
    }
  }, [connection, wallet, publicKey, connecting, signTransaction, signAllTransactions]);

  return { program, error, loading: connecting };
};
