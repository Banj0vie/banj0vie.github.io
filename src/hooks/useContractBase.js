import { useState, useEffect, useCallback } from 'react';
import { useAgwEthersAndService } from './useAgwEthersAndService';
import { executeContractWrite, waitForTransactionConfirmation } from '../utils/transactionUtils';

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
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);
  
  // Helper to get contract by name
  const getContract = useCallback((name) => {
    return contracts[name.toLowerCase()];
  }, [contracts]);
  
  // Helper to check if all required contracts are available
  const areContractsReady = useCallback(() => {
    return contractNames.every(name => 
      contracts[name.toLowerCase()] && 
      agwClient && 
      publicClient
    );
  }, [contracts, agwClient, publicClient, contractNames]);
  
  // Transaction utilities
  const executeWrite = useCallback(async (contractConfig, onProgress = null) => {
    return executeContractWrite(agwClient, publicClient, contractConfig, onProgress);
  }, [agwClient, publicClient]);
  
  const waitForConfirmation = useCallback(async (txHash, options = {}, onProgress = null) => {
    return waitForTransactionConfirmation(publicClient, txHash, { ...options, onProgress });
  }, [publicClient]);
  
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
    areContractsReady,
    handleContractCall,
    
    // Transaction utilities
    executeWrite,
    waitForConfirmation
  };
};
