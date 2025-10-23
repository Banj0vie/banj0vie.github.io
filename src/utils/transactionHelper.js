import { Connection, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { LOOKUP_TABLE_ADDRESS } from '../solana/constants/programId';

/**
 * Enhanced transaction sender with comprehensive error handling
 */
export const sendTransaction = async (txOrMethod, connection, sendTransactionFn, options = {}) => {
  const {
    skipPreflight = false,
    maxRetries = 3,
    commitment = 'confirmed',
    onSuccess = null,
    onError = null
  } = options;

  try {
    let signature;

    if (typeof txOrMethod === 'function') {
      // Anchor method call
      signature = await txOrMethod();
    } else {
      // VersionedTransaction handling
      signature = await sendTransactionFn(txOrMethod, connection, { 
        skipPreflight, 
        maxRetries,
        preflightCommitment: skipPreflight ? undefined : 'processed'
      });
    }

    // Wait for confirmation
    if (typeof txOrMethod !== 'function') {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });
    }

    if (onSuccess) {
      await onSuccess(signature);
    }

    return { success: true, signature };
  } catch (err) {
    console.error('Transaction error:', err);
    
    // Handle specific transaction errors
    let errorMessage = err.message;
    let errorType = 'unknown';
    
    if (err.message.includes('already been processed') || 
        err.message.includes('Transaction simulation failed: This transaction has already been processed')) {
      errorMessage = 'Transaction already submitted. Please wait and try again.';
      errorType = 'already_processed';
    } else if (err.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for this transaction.';
      errorType = 'insufficient_funds';
    } else if (err.message.includes('User rejected')) {
      errorMessage = 'Transaction was cancelled by user.';
      errorType = 'user_rejected';
    } else if (err.message.includes('encoding overruns Uint8Array')) {
      errorMessage = 'Transaction too large. Please try with a smaller amount.';
      errorType = 'transaction_too_large';
    } else if (err.message.includes('Failed to simulate') || 
               err.message.includes('simulation failed')) {
      errorMessage = 'Transaction simulation failed. Please try again or contact support if the issue persists.';
      errorType = 'simulation_failed';
    }

    if (onError) {
      await onError(err, errorType, errorMessage);
    }

    return { 
      success: false, 
      error: errorMessage, 
      errorType,
      originalError: err 
    };
  }
};

/**
 * Handle simulation errors with retry logic
 */
export const handleSimulationError = async (tx, connection, sendTransactionFn, options = {}) => {
  const {
    maxRetries = 2,
    retryDelay = 1000,
    onRetry = null
  } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Simulation attempt ${attempt}/${maxRetries}`);
      
      const simulationResult = await connection.simulateTransaction(tx, {
        commitment: attempt === 1 ? 'processed' : 'confirmed',
        sigVerify: false,
        replaceRecentBlockhash: attempt > 1
      });
      
      if (simulationResult.value.err) {
        console.warn(`Simulation attempt ${attempt} failed:`, simulationResult.value.err);
        
        if (attempt < maxRetries) {
          console.log('Getting fresh blockhash for retry...');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          if (onRetry) await onRetry(attempt);
          continue;
        }
        
        // If all attempts failed, we should skip preflight
        console.log('All simulation attempts failed, will use skipPreflight=true');
        return { success: false, shouldSkipPreflight: true };
      }
      
      console.log(`Simulation attempt ${attempt} successful`);
      return { success: true, simulationResult: simulationResult.value };
    } catch (err) {
      console.warn(`Simulation attempt ${attempt} error:`, err.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        if (onRetry) await onRetry(attempt);
        continue;
      }
      
      // If simulation fails, we can still try to send with skipPreflight
      console.log('Simulation failed, will attempt with skipPreflight=true');
      return { success: false, shouldSkipPreflight: true };
    }
  }
};

/**
 * Helper specifically for Phantom wallet simulation issues
 */
export const handlePhantomSimulationError = async (tx, connection, sendTransactionFn, options = {}) => {
  const {
    maxRetries = 2,
    retryDelay = 1000,
    onRetry = null
  } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Phantom simulation attempt ${attempt}/${maxRetries}`);
      
      // For Phantom, try different simulation strategies
      const simulationOptions = {
        commitment: attempt === 1 ? 'processed' : 'confirmed',
        sigVerify: false,
        replaceRecentBlockhash: attempt > 1
      };

      const simulationResult = await connection.simulateTransaction(tx, simulationOptions);
      
      if (simulationResult.value.err) {
        console.warn(`Phantom simulation attempt ${attempt} failed:`, simulationResult.value.err);
        
        if (attempt < maxRetries) {
          console.log('Getting fresh blockhash for retry...');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          if (onRetry) await onRetry(attempt);
          continue;
        }
        
        // For Phantom, if simulation fails, we should skip preflight
        console.log('Phantom simulation failed, will use skipPreflight=true');
        return { success: false, shouldSkipPreflight: true };
      }
      
      console.log(`Phantom simulation attempt ${attempt} successful`);
      return { success: true, simulationResult: simulationResult.value };
    } catch (err) {
      console.warn(`Phantom simulation attempt ${attempt} error:`, err.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        if (onRetry) await onRetry(attempt);
        continue;
      }
      
      // For Phantom, if simulation fails, we can still try to send with skipPreflight
      console.log('Phantom simulation failed, will attempt with skipPreflight=true');
      return { success: false, shouldSkipPreflight: true };
    }
  }
};


/**
 * Enhanced transaction helper for Anchor methods using Address Lookup Tables and VersionedTransaction
 * This version works directly with Anchor method objects and uses ALT for better transaction handling
 */
export const sendTransactionForPhantom = async (method, connection, sendTransactionFn, publicKey) => {
  try {
    // Get the instruction from the Anchor method
    const instruction = await method.instruction();
    
    // Get the Address Lookup Table
    const { value: alt } = await connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS);
    if (!alt) throw new Error('Address Lookup Table not found');
    
    // Get fresh blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
    
    // Create VersionedTransaction with ALT
    const msgV0 = new TransactionMessage({
      payerKey: publicKey,
      recentBlockhash: blockhash,
      instructions: [instruction],
    }).compileToV0Message([alt]);
    
    const tx = new VersionedTransaction(msgV0);
    
    // Pre-send simulation to surface errors/logs
    try {
      const sim = await connection.simulateTransaction(tx, { 
        sigVerify: false, 
        commitment: 'processed' 
      });
      
      if (sim?.value?.err) {
        console.log('Simulation error:', sim.value.err);
        // Check if it's an "already processed" error
        if (sim.value.err.toString().includes('already been processed')) {
          console.log('Transaction already processed, treating as success');
          return 'already_processed_' + Date.now();
        }
        // If simulation fails, we should skip preflight
        console.log('Simulation failed, will use skipPreflight=true');
        throw new Error('Simulation failed');
      }
    } catch (simError) {
      console.log('Simulation failed, proceeding with skipPreflight=true:', simError.message);
      // If simulation fails, we should skip preflight
      throw new Error('Simulation failed');
    }
    
    // Send the transaction (prefer raw sign+send to avoid Phantom adapter issues)
    let signature;
    try {
      if (typeof window !== 'undefined' && window?.solana?.signTransaction) {
        const signed = await window.solana.signTransaction(tx);
        signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, maxRetries: 3, preflightCommitment: 'processed' });
      }
    } catch (rawSendErr) {
      console.warn('Raw send (non-skip) failed, falling back to wallet adapter:', rawSendErr?.message);
    }

    if (!signature) {
      try {
        signature = await sendTransactionFn(tx, connection, { 
          skipPreflight: false,
          maxRetries: 3,
          preflightCommitment: 'processed'
        });
      } catch (adapterErr) {
        console.warn('Wallet adapter sendTransaction failed, retrying via raw sign+send with skipPreflight:', adapterErr?.message);
        if (typeof window !== 'undefined' && window?.solana?.signTransaction) {
          const signed = await window.solana.signTransaction(tx);
          signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true, maxRetries: 3 });
        } else {
          throw adapterErr;
        }
      }
    }
    
    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    });
    
    return signature;
  } catch (error) {
    // Check if it's an "already processed" error - treat as success
    if (error.message && error.message.includes('already been processed')) {
      console.log('Transaction already processed, treating as success');
      return 'already_processed_' + Date.now();
    }
    
    // Check if it's a simulation error or "Failed to simulate" error
    if (error.message && (error.message.includes('simulation') || error.message.includes('Failed to simulate'))) {
      console.log('Simulation failed, retrying with skipPreflight...');
      
      try {
        // Retry with skipPreflight = true
        const instruction = await method.instruction();
        const { value: alt } = await connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS);
        if (!alt) throw new Error('Address Lookup Table not found');
        
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
        const msgV0 = new TransactionMessage({
          payerKey: publicKey,
          recentBlockhash: blockhash,
          instructions: [instruction],
        }).compileToV0Message([alt]);
        
        const tx = new VersionedTransaction(msgV0);
        let signature;

        // Prefer raw sign + send to avoid Phantom's simulation gating UI
        try {
          if (typeof window !== 'undefined' && window?.solana?.signTransaction) {
            const signed = await window.solana.signTransaction(tx);
            signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true, maxRetries: 3 });
          }
        } catch (rawErr) {
          console.warn('Raw sign/send failed, falling back to wallet adapter:', rawErr?.message);
        }

        if (!signature) {
          signature = await sendTransactionFn(tx, connection, { skipPreflight: true, maxRetries: 3 });
        }
        
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        });
        
        return signature;
      } catch (retryError) {
        // Check if retry also failed with "already processed"
        if (retryError.message && retryError.message.includes('already been processed')) {
          console.log('Retry also shows already processed, treating as success');
          return 'already_processed_' + Date.now();
        }
        
        console.error('Retry with skipPreflight also failed:', retryError);
        throw retryError;
      }
    }
    
    // If it's not a simulation error, re-throw the original error
    throw error;
  }
};