import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useGlobalWalletSignerClient, useLoginWithAbstract, useAbstractClient } from '@abstract-foundation/agw-react';
import { transformEIP1193Provider } from '@abstract-foundation/agw-client';
import { abstractTestnet } from 'viem/chains';
import ContractService from '../services/contractService';
import { useAccount, useDisconnect } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { executeContractWrite } from '../utils/transactionUtils';
import { handleContractError } from '../utils/errorHandler';

/**
 * Unified hook that provides wallet connection and contract interaction functionality
 * Consolidates wallet management, contract service, and contract interactions
 */
export const useContractBase = (contractNames = []) => {
  // Wallet connection hooks
  const signerClient = useGlobalWalletSignerClient();
  const { login } = useLoginWithAbstract();
  const { address: wagmiAddress, isConnected, isConnecting, error } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: agwClient } = useAbstractClient();
  // Wallet and provider state
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contractService, setContractService] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  
  // Contract interaction state
  const [loading, setLoading] = useState(false);
  const [contractError, setContractError] = useState(null);
  const [publicClient, setPublicClient] = useState(null);
  
  // Dynamic contract state based on contractNames array
  const [contracts, setContracts] = useState({});
  
  const isWalletReady = !!(isConnected && account && contractService);
  
  // Wallet and contract service setup
  useEffect(() => {
    const setup = async () => {
      // Initialize AGW-only service ASAP for early writes/reads
      if (agwClient && !contractService) {
        const publicClient = createPublicClient({
          chain: abstractTestnet,
          transport: http(),
        });
        const svc = new ContractService(publicClient, agwClient);
        setContractService(svc);
        setPublicClient(publicClient);
        try {
          if (account) {
            const has = await svc.hasProfile(account);
            setHasProfile(has);
          }
        } catch {}
      }

      // Hydrate ethers provider/signer when signerClient is ready
      try {
        if (!signerClient) return;
        const eip1193 = transformEIP1193Provider({
          provider: signerClient.transport.value,
          chain: abstractTestnet,
        });
        const nextProvider = new ethers.BrowserProvider(eip1193);
        const nextSigner = await nextProvider.getSigner();
        const [network, address] = await Promise.all([
          nextProvider.getNetwork(),
          nextSigner.getAddress(),
        ]);
        setProvider(nextProvider);
        setSigner(nextSigner);
        setAccount(address || wagmiAddress || null);
        setChainId(network.chainId.toString());
        
        // Upgrade to full service with ethers runner
        const publicClient = createPublicClient({
          chain: abstractTestnet,
          transport: http(),
        });
        const fullSvc = new ContractService(publicClient, agwClient);
        setContractService(fullSvc);
        setPublicClient(publicClient);
        try {
          const has = account ? await fullSvc.hasProfile(account) : false;
          setHasProfile(has);
        } catch (error) {
          const { message } = handleContractError(error, 'checking profile status');
          console.warn('Failed to check profile status:', message);
          setHasProfile(false);
        }
      } catch (e) {
        // ignore until wallet connects
      }
    };
    setup();
  }, [signerClient, wagmiAddress, agwClient, account, contractService]);

  // Fallback: if wagmi has an address but signer/provider not yet set, surface account early
  useEffect(() => {
    if (wagmiAddress && !account) {
      setAccount(wagmiAddress);
    }
  }, [wagmiAddress, account]);

  // Initialize contracts when contractService is ready
  useEffect(() => {
    if (!contractService) return;
    
    const newContracts = {};
    contractNames.forEach(name => {
      console.log(name);
      newContracts[name.toLowerCase()] = contractService.getContract(name);
    });
    
    setContracts(newContracts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractService, contractNames.join(',')]);
  
  // Common error handling wrapper
  const handleContractCall = useCallback(async (contractCall, errorContext = 'contract operation') => {
    setLoading(true);
    setContractError(null);
    
    try {
      const result = await contractCall();
      setLoading(false);
      return result;
    } catch (err) {
      const { message } = handleContractError(err, errorContext);
      setContractError(message);
      setLoading(false);
      // Throw a new error with the processed message instead of the original error
      throw new Error(message);
    }
  }, []);

  // Function to refresh profile status
  const refreshProfileStatus = useCallback(async () => {
    if (contractService && account) {
      try {
        console.log('🔄 useContractBase: Refreshing profile status for account:', account);
        const has = await contractService.hasProfile(account);
        console.log('🔍 useContractBase: Profile status result:', has);
        setHasProfile(has);
        console.log('✅ useContractBase: hasProfile state updated to:', has);
        return has;
      } catch (error) {
        const { message } = handleContractError(error, 'refreshing profile status');
        console.warn('Failed to refresh profile status:', message);
        setHasProfile(false);
        return false;
      }
    }
    return false;
  }, [contractService, account]);
  
  // Helper to get contract by name
  const getContract = useCallback((name) => {
    return contracts[name.toLowerCase()];
  }, [contracts]);
  
  // Transaction utilities
  const executeWrite = useCallback(async (contractConfig, onProgress = null) => {
    return executeContractWrite(agwClient, publicClient, contractConfig, onProgress);
  }, [agwClient, publicClient]);
  
  return {
    // Wallet state
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isWalletReady,
    isConnecting,
    error,
    contractService,
    hasProfile,
    
    // Contract interaction state
    loading,
    contractError,
    publicClient,
    agwClient,
    contracts,
    
    // Setters
    setLoading,
    setContractError,
    
    // Wallet actions
    connect: login,
    disconnect,
    refreshProfileStatus,
    
    // Contract helpers
    getContract,
    handleContractCall,
    
    // Transaction utilities
    executeWrite,
  };
};

/**
 * Backward compatibility export for useAgwEthersAndService
 * This maintains the same interface as the original hook
 */
export const useAgwEthersAndService = () => {
  const base = useContractBase();
  
  return {
    provider: base.provider,
    signer: base.signer,
    account: base.account,
    chainId: base.chainId,
    isConnected: base.isConnected,
    isWalletReady: base.isWalletReady,
    isConnecting: base.isConnecting,
    error: base.error,
    connect: base.connect,
    disconnect: base.disconnect,
    contractService: base.contractService,
    hasProfile: base.hasProfile,
    refreshProfileStatus: base.refreshProfileStatus,
  };
};
