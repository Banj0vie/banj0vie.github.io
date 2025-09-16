import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '../config/contracts';
import ContractService from '../services/contractService';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [contractService, setContractService] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum;
  };

  // Connect to MetaMask
  const connect = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const account = accounts[0];

      setProvider(provider);
      setSigner(signer);
      setAccount(account);
      setChainId(network.chainId.toString());
      setIsConnected(true);

      // Initialize contract service
      const service = new ContractService(provider, signer, network.chainId.toString());
      setContractService(service);

      // Check if user has a profile
      try {
        const profileExists = await service.hasProfile(account);
        setHasProfile(profileExists);
        console.log('Profile exists:', profileExists);
      } catch (err) {
        console.error('Error checking profile:', err);
        setHasProfile(false);
        // Don't throw error here - user might not have profile yet
      }

      // Check if we're on the correct network
      if (network.chainId !== 11124n) {
        await switchToAbstractTestnet();
      }

    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch to Abstract Testnet
  const switchToAbstractTestnet = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.ABSTRACT_TESTNET.chainId }],
      });
    } catch (switchError) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_CONFIG.ABSTRACT_TESTNET],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
          setError(`Failed to add Abstract Testnet: ${addError.message}. Please add it manually in MetaMask.`);
        }
      } else if (switchError.code === 4001) {
        setError('User rejected network switch. Please manually switch to Abstract Testnet.');
      } else {
        console.error('Failed to switch network:', switchError);
        setError(`Failed to switch to Abstract Testnet: ${switchError.message}`);
      }
    }
  };

  // Create user profile
  const createProfile = async (username) => {
    if (!contractService || !account) {
      throw new Error('Wallet not connected or contract service not initialized');
    }
    if (chainId !== 11124n) {
      await switchToAbstractTestnet();
    }
    if (chainId !== '11124') {
      setError('Please switch to Abstract Testnet before creating profile');
      throw new Error('Wrong network. Please switch to Abstract Testnet.');
    }

    setIsCreatingProfile(true);
    setError(null);

    try {
      await contractService.createProfile(username);
      setHasProfile(true);
      return true;
    } catch (err) {
      console.error('Failed to create profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsCreatingProfile(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsConnected(false);
    setError(null);
    setContractService(null);
    setHasProfile(false);
    setIsCreatingProfile(false);
  };

  // Listen for account changes
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = (chainId) => {
        setChainId(chainId);
        // Optionally reload the page or show a message
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (isMetaMaskInstalled()) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();

            setProvider(provider);
            setSigner(signer);
            setAccount(accounts[0]);
            setChainId(network.chainId.toString());
            setIsConnected(true);

            // Initialize contract service
            const service = new ContractService(provider, signer, network.chainId.toString());
            setContractService(service);

            // Check if user has a profile
            try {
              const profileExists = await service.hasProfile(accounts[0]);
              setHasProfile(profileExists);
            } catch (err) {
              console.error('Error checking profile:', err);
              setHasProfile(false);
            }
          }
        } catch (err) {
          console.error('Failed to check connection:', err);
        }
      }
    };

    checkConnection();
  }, []);

  const value = {
    account,
    provider,
    signer,
    chainId,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    switchToAbstractTestnet,
    isMetaMaskInstalled,
    contractService,
    hasProfile,
    isCreatingProfile,
    createProfile,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

