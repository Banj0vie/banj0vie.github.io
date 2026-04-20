/**
 * Centralized error handler for contract interactions
 * Converts technical contract errors into user-friendly messages
 */

export const ErrorTypes = {
  // Network and connection errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  
  // Contract specific errors
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_ITEMS: 'INSUFFICIENT_ITEMS',
  INVALID_ITEM: 'INVALID_ITEM',
  COOLDOWN_ACTIVE: 'COOLDOWN_ACTIVE',
  LEVEL_REQUIREMENT: 'LEVEL_REQUIREMENT',
  CONTRACT_NOT_AVAILABLE: 'CONTRACT_NOT_AVAILABLE',
  VRNG_ERROR: 'VRNG_ERROR',
  
  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED'
};

export const ErrorMessages = {
  [ErrorTypes.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
  [ErrorTypes.WALLET_NOT_CONNECTED]: 'Please connect your wallet first.',
  [ErrorTypes.TRANSACTION_REJECTED]: 'Transaction was rejected by user.',
  [ErrorTypes.INSUFFICIENT_FUNDS]: 'Insufficient funds for gas fees.',
  [ErrorTypes.INSUFFICIENT_BALANCE]: 'Insufficient balance to complete this action.',
  [ErrorTypes.INSUFFICIENT_ITEMS]: 'You don\'t have enough items to complete this action.',
  [ErrorTypes.INVALID_ITEM]: 'Invalid item selected.',
  [ErrorTypes.COOLDOWN_ACTIVE]: 'Please wait for the cooldown period to end.',
  [ErrorTypes.LEVEL_REQUIREMENT]: 'You need to reach a higher level to perform this action.',
  [ErrorTypes.CONTRACT_NOT_AVAILABLE]: 'Contract is not available. Please try again later.',
  [ErrorTypes.VRNG_ERROR]: 'VRNG system not properly initialized. Please contact support.',
  [ErrorTypes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [ErrorTypes.TRANSACTION_FAILED]: 'Transaction failed. Please try again.'
};

/**
 * Extracts user-friendly error message from contract error
 * @param {Error} error - The error object from contract call
 * @param {string} context - Context of the operation (e.g., 'crafting', 'fishing')
 * @returns {Object} - { type, message, originalError }
 */
export const handleContractError = (error, context = '') => {
  console.error(`Contract error in ${context}:`, error);
  
  const errorMessage = error?.message || error?.toString() || '';
  const errorCode = error?.code;
  
  // Handle "already processed" errors
  if (errorMessage.includes('already been processed') || 
      errorMessage.includes('Transaction simulation failed: This transaction has already been processed') ||
      errorMessage.includes('This transaction has already been processed')) {
    return {
      type: ErrorTypes.TRANSACTION_FAILED,
      message: 'Transaction already submitted. Please wait and try again.',
      originalError: error
    };
  }

  // Handle user rejection
  if (errorCode === 4001 || 
      errorCode === 'ACTION_REJECTED' ||
      errorMessage.includes('User denied') || 
      errorMessage.includes('User rejected') ||
      errorMessage.includes('rejected') ||
      errorMessage.includes('cancelled') ||
      errorMessage.includes('cancelled by user') ||
      errorMessage.includes('User cancelled') ||
      errorMessage.includes('MetaMask Tx Signature: User denied') ||
      errorMessage.includes('User rejected the request') ||
      errorMessage.includes('The user rejected the request')) {
    return {
      type: ErrorTypes.TRANSACTION_REJECTED,
      message: ErrorMessages[ErrorTypes.TRANSACTION_REJECTED],
      originalError: error
    };
  }

  // VRNG system initialization error
  if (errorMessage.includes('Failed to initialize request') && 
      (context.includes('fishing') || context.includes('Fishing'))) {
    return {
      type: ErrorTypes.VRNG_ERROR,
      message: 'VRNG system not properly initialized. Please contact support.',
      originalError: error
    };
  }
  
  // Handle insufficient funds for gas
  if (errorCode === -32603 || errorMessage.includes('insufficient funds') || errorMessage.includes('gas')) {
    return {
      type: ErrorTypes.INSUFFICIENT_FUNDS,
      message: ErrorMessages[ErrorTypes.INSUFFICIENT_FUNDS],
      originalError: error
    };
  }

  // Handle direct insufficient balance messages from dApp or program
  const lowerMsg = errorMessage.toLowerCase();
  if (
    lowerMsg.includes('insufficient balance') ||
    lowerMsg.includes('not enough balance') ||
    lowerMsg.includes('not enough hny') ||
    lowerMsg.includes('insufficient hny') ||
    lowerMsg.includes('insufficient game') ||
    lowerMsg.includes('not enough tokens')
  ) {
    return {
      type: ErrorTypes.INSUFFICIENT_BALANCE,
      message: ErrorMessages[ErrorTypes.INSUFFICIENT_BALANCE],
      originalError: error
    };
  }
  
  // Handle network errors
  if (errorCode === 'NETWORK_ERROR' || errorMessage.includes('network') || errorMessage.includes('connection')) {
    return {
      type: ErrorTypes.NETWORK_ERROR,
      message: ErrorMessages[ErrorTypes.NETWORK_ERROR],
      originalError: error
    };
  }
  
  // Handle contract-specific revert messages
  if (errorMessage.includes('revert')) {
    const revertMessage = extractRevertMessage(errorMessage);
    
    // Insufficient balance/items
    if (revertMessage.includes('Insufficient') || revertMessage.includes('insufficient')) {
      if (revertMessage.includes('potato') || revertMessage.includes('lettuce') || revertMessage.includes('celery') ||
          revertMessage.includes('radish') || revertMessage.includes('onion') || revertMessage.includes('grapes') ||
          revertMessage.includes('berry') || revertMessage.includes('cauliflower') || revertMessage.includes('dragonfruit') ||
          revertMessage.includes('lavender') || revertMessage.includes('lychee') || revertMessage.includes('wheat') ||
          revertMessage.includes('tomato') || revertMessage.includes('carrot') || revertMessage.includes('corn') ||
          revertMessage.includes('pumpkin') || revertMessage.includes('pepper') || revertMessage.includes('parsnap') ||
          revertMessage.includes('celery') || revertMessage.includes('broccoli') || revertMessage.includes('banana') ||
          revertMessage.includes('mango') || revertMessage.includes('avocado') || revertMessage.includes('pineapple') ||
          revertMessage.includes('blueberry') || revertMessage.includes('artichoke') || revertMessage.includes('papaya') ||
          revertMessage.includes('fig')) {
        return {
          type: ErrorTypes.INSUFFICIENT_ITEMS,
          message: ErrorMessages[ErrorTypes.INSUFFICIENT_ITEMS],
          originalError: error
        };
      }
      return {
        type: ErrorTypes.INSUFFICIENT_BALANCE,
        message: ErrorMessages[ErrorTypes.INSUFFICIENT_BALANCE],
        originalError: error
      };
    }
    
    // Invalid item
    if (revertMessage.includes('Invalid item') || revertMessage.includes('invalid bait')) {
      return {
        type: ErrorTypes.INVALID_ITEM,
        message: ErrorMessages[ErrorTypes.INVALID_ITEM],
        originalError: error
      };
    }
    
    // Cooldown active
    if (revertMessage.includes('cooldown') || revertMessage.includes('wait')) {
      return {
        type: ErrorTypes.COOLDOWN_ACTIVE,
        message: ErrorMessages[ErrorTypes.COOLDOWN_ACTIVE],
        originalError: error
      };
    }
    
    // Level requirement
    if (revertMessage.includes('level') || revertMessage.includes('Level')) {
      return {
        type: ErrorTypes.LEVEL_REQUIREMENT,
        message: ErrorMessages[ErrorTypes.LEVEL_REQUIREMENT],
        originalError: error
      };
    }
    
    // Generic revert message
    return {
      type: ErrorTypes.TRANSACTION_FAILED,
      message: revertMessage || ErrorMessages[ErrorTypes.TRANSACTION_FAILED],
      originalError: error
    };
  }
  
  // Handle wallet not connected
  if (errorMessage.includes('wallet') || errorMessage.includes('connect') || errorMessage.includes('signer')) {
    return {
      type: ErrorTypes.WALLET_NOT_CONNECTED,
      message: ErrorMessages[ErrorTypes.WALLET_NOT_CONNECTED],
      originalError: error
    };
  }
  
  // Default unknown error
  return {
    type: ErrorTypes.UNKNOWN_ERROR,
    message: ErrorMessages[ErrorTypes.UNKNOWN_ERROR],
    originalError: error
  };
};

/**
 * Extracts the revert message from error string
 * @param {string} errorMessage - Full error message
 * @returns {string} - Extracted revert message
 */
const extractRevertMessage = (errorMessage) => {
  const revertMatch = errorMessage.match(/revert\s+(.+)/i);
  if (revertMatch) {
    return revertMatch[1].trim();
  }
  
  const reasonMatch = errorMessage.match(/reason:\s*(.+)/i);
  if (reasonMatch) {
    return reasonMatch[1].trim();
  }
  
  return errorMessage;
};

/**
 * Hook for handling errors with notifications
 * @param {Function} showNotification - Notification function
 * @returns {Function} - Error handler function
 */
export const useErrorHandler = (showNotification) => {
  return (error, context = '') => {
    const { type, message, originalError } = handleContractError(error, context);
    
    // Log original error for debugging
    console.error(`Error in ${context}:`, originalError);
    
    // Show user-friendly message
    if (showNotification) {
      showNotification(message, 'error');
    }
    
    return { type, message, originalError };
  };
};
