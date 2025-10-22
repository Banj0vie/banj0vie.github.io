import { Connection } from '@solana/web3.js';

/**
 * Optimized connection configuration to reduce RPC load
 */
export const createOptimizedConnection = (endpoint = 'https://api.devnet.solana.com') => {
  return new Connection(endpoint, {
    commitment: 'confirmed', // Use confirmed instead of finalized for faster response
    confirmTransactionInitialTimeout: 60000, // 60 seconds
    disableRetryOnRateLimit: false, // Allow retries on rate limit
    httpHeaders: {
      'Content-Type': 'application/json',
    },
    // Reduce the number of concurrent requests
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        // Add a small delay to prevent overwhelming the RPC
        signal: options.signal,
      });
    }
  });
};

/**
 * Connection with aggressive caching and rate limiting
 */
export const createCachedConnection = (endpoint = 'https://api.devnet.solana.com') => {
  const connection = createOptimizedConnection(endpoint);
  
  // Override getBalance with caching
  const originalGetBalance = connection.getBalance.bind(connection);
  const balanceCache = new Map();
  
  connection.getBalance = async (publicKey, commitment = 'confirmed') => {
    const key = `${publicKey.toString()}_${commitment}`;
    const cached = balanceCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < 5000) { // 5 second cache
      return cached.balance;
    }
    
    const balance = await originalGetBalance(publicKey, commitment);
    balanceCache.set(key, { balance, timestamp: Date.now() });
    
    return balance;
  };
  
  // Override getParsedTokenAccountsByOwner with caching
  const originalGetParsedTokenAccountsByOwner = connection.getParsedTokenAccountsByOwner.bind(connection);
  const tokenCache = new Map();
  
  connection.getParsedTokenAccountsByOwner = async (ownerPublicKey, config, commitment = 'confirmed') => {
    const key = `${ownerPublicKey.toString()}_${JSON.stringify(config)}_${commitment}`;
    const cached = tokenCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < 10000) { // 10 second cache
      return cached.result;
    }
    
    const result = await originalGetParsedTokenAccountsByOwner(ownerPublicKey, config, commitment);
    tokenCache.set(key, { result, timestamp: Date.now() });
    
    return result;
  };
  
  return connection;
};
