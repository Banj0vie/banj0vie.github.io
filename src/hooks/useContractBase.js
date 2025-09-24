import { useState, useEffect, useCallback } from 'react';
import { useAgwEthersAndService } from './useAgwEthersAndService';
import { executeContractWrite } from '../utils/transactionUtils';
import { handleContractError } from '../utils/errorHandler';

/**
 * Base hook that provides common contract interaction functionality
 * Reduces duplication across all contract hooks
 */
export const useContractBase = (contractNames = []) => {
  const { contractService } = useAgwEthersAndService();
  
  // Common state for all contract hooks
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agwClient, setAgwClient] = useState(null);
  const [publicClient, setPublicClient] = useState(null);
  
  // Dynamic contract state based on contractNames array
  const [contracts, setContracts] = useState({});
  
  // Initialize contracts and clients
  useEffect(() => {
    if (!contractService) return;
    
    const newContracts = {};
    contractNames.forEach(name => {
      newContracts[name.toLowerCase()] = contractService.getContract(name);
    });
    
    setContracts(newContracts);
    setAgwClient(contractService.agwClient);
    setPublicClient(contractService.publicClient);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractService, contractNames.join(',')]);
  
  // Common error handling wrapper
  const handleContractCall = useCallback(async (contractCall, errorContext = 'contract operation') => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await contractCall();
      setLoading(false);
      return result;
    } catch (err) {
      const { message } = handleContractError(err, errorContext);
      setError(message);
      setLoading(false);
      // Throw a new error with the processed message instead of the original error
      throw new Error(message);
    }
  }, []);
  
  // Helper to get contract by name
  const getContract = useCallback((name) => {
    return contracts[name.toLowerCase()];
  }, [contracts]);
  
  // Transaction utilities
  const executeWrite = useCallback(async (contractConfig, onProgress = null) => {
    return executeContractWrite(agwClient, publicClient, contractConfig, onProgress);
  }, [agwClient, publicClient]);
  
  return {
    // State
    loading,
    error,
    agwClient,
    publicClient,
    contracts,
    
    // Setters
    setLoading,
    setError,
    
    // Helpers
    getContract,
    handleContractCall,
    
    // Transaction utilities
    executeWrite,
  };
};
