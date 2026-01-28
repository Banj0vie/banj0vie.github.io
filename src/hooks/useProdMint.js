/**
 * Temporary hook for test mint (prod_mint instruction).
 * category: 0 = Pico Produce, 1 = Basic Produce, 2 = Premium Produce
 */
import { useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getGameRegistryPDA, getItemMintAuthPDA, getProdMintRemainingAccounts } from '../solana/utils/pdaUtils';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram } from '@solana/web3.js';
import { sendTransactionForPhantom } from '../utils/transactionHelper';

export const useProdMint = () => {
  const { publicKey, sendTransaction } = useSolanaWallet();
  const { program, connection } = useProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const prodMint = useCallback(async (category) => {
    if (!program || !publicKey) {
      setError('Wallet or program not ready');
      return null;
    }
    if (loading) {
      setError('Transaction in progress');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const gameRegistryPda = getGameRegistryPDA();
      const itemMintAuth = getItemMintAuthPDA();
      const remainingAccounts = getProdMintRemainingAccounts(publicKey, category);

      const method = program.methods
        .prodMint(category)
        .accounts({
          user: publicKey,
          gameRegistry: gameRegistryPda,
          itemMintAuth,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts);

      const result = await sendTransactionForPhantom(method, connection, sendTransaction, publicKey);
      return result;
    } catch (err) {
      const msg = err?.message ?? String(err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, connection, sendTransaction, loading]);

  return { prodMint, loading, error };
};
