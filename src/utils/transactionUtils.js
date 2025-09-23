/**
 * Utility functions for handling blockchain transactions
 */

/**
 * Wait for transaction confirmation with retry logic
 * @param {Object} publicClient - Viem public client
 * @param {string} txHash - Transaction hash
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Transaction receipt
 */
export const waitForTransactionConfirmation = async (publicClient, txHash, options = {}) => {
  const {
    confirmations = 3,
    pollingInterval = 1000,
    timeout = 120000,
    onProgress = null
  } = options;

  if (!publicClient) {
    throw new Error('Public client is required for transaction confirmation');
  }

  if (!txHash) {
    throw new Error('Transaction hash is required');
  }

  try {
    if (onProgress) {
      onProgress('Waiting for transaction confirmation...');
    }

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations,
      pollingInterval,
      timeout,
    });

    if (onProgress) {
      onProgress('Transaction confirmed!');
    }

    return receipt;
  } catch (error) {
    if (onProgress) {
      onProgress('Transaction confirmation failed');
    }
    throw error;
  }
};

/**
 * Execute a contract write operation with transaction confirmation
 * @param {Object} agwClient - Abstract SDK client for writing
 * @param {Object} publicClient - Viem public client for confirmation
 * @param {Object} contractConfig - Contract configuration
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Result with txHash, receipt, and metadata
 */
export const executeContractWrite = async (agwClient, publicClient, contractConfig, onProgress = null) => {
  const {
    abi,
    address,
    functionName,
    args = [],
    confirmations = 3,
    pollingInterval = 1000,
    timeout = 120000
  } = contractConfig;

  if (!agwClient) {
    throw new Error('AGW client is required for contract writes');
  }

  if (!publicClient) {
    throw new Error('Public client is required for transaction confirmation');
  }

  try {
    if (onProgress) {
      onProgress(`Submitting ${functionName} transaction...`);
    }

    // Submit the transaction
    const txHash = await agwClient.writeContract({
      abi,
      address,
      functionName,
      args,
    });

    if (onProgress) {
      onProgress(`Transaction submitted: ${txHash}`);
    }

    // Wait for confirmation
    const receipt = await waitForTransactionConfirmation(
      publicClient, 
      txHash, 
      { confirmations, pollingInterval, timeout, onProgress }
    );

    return {
      txHash,
      receipt,
      functionName,
      isPending: false,
      success: true
    };

  } catch (error) {
    if (onProgress) {
      onProgress(`Transaction failed: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Execute a contract write operation with custom success callback
 * @param {Object} agwClient - Abstract SDK client for writing
 * @param {Object} publicClient - Viem public client for confirmation
 * @param {Object} contractConfig - Contract configuration
 * @param {Function} onSuccess - Success callback with receipt data
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Result with txHash, receipt, and metadata
 */
export const executeContractWriteWithCallback = async (
  agwClient, 
  publicClient, 
  contractConfig, 
  onSuccess = null,
  onProgress = null
) => {
  try {
    const result = await executeContractWrite(agwClient, publicClient, contractConfig, onProgress);
    
    if (onSuccess && result.success) {
      await onSuccess(result.receipt, result.txHash);
    }
    
    return result;
  } catch (error) {
    throw error;
  }
};
