/**
 * Request Queue System for Solana RPC calls
 * Prevents 429 errors by batching and throttling requests
 */

class RequestQueue {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 3;
    this.delay = options.delay || 100; // ms between requests
    this.retryDelay = options.retryDelay || 1000; // ms before retry on 429
    this.maxRetries = options.maxRetries || 3;
    
    this.queue = [];
    this.active = 0;
    this.processing = false;
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 5000; // 5 seconds
  }

  async add(requestFn, key = null, useCache = true) {
    return new Promise((resolve, reject) => {
      // Check cache first
      if (useCache && key && this.cache.has(key)) {
        const cached = this.cache.get(key);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          resolve(cached.data);
          return;
        }
        this.cache.delete(key);
      }

      this.queue.push({
        requestFn,
        key,
        resolve,
        reject,
        retries: 0,
        timestamp: Date.now()
      });

      this.process();
    });
  }

  async process() {
    if (this.processing || this.active >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.active < this.maxConcurrent) {
      const request = this.queue.shift();
      this.active++;

      try {
        const result = await request.requestFn();
        
        // Cache successful results
        if (request.key) {
          this.cache.set(request.key, {
            data: result,
            timestamp: Date.now()
          });
        }

        request.resolve(result);
      } catch (error) {
        if (error.message?.includes('429') && request.retries < this.maxRetries) {
          // Retry 429 errors after delay
          request.retries++;
          setTimeout(() => {
            this.queue.unshift(request);
            this.process();
          }, this.retryDelay * request.retries);
        } else {
          request.reject(error);
        }
      } finally {
        this.active--;
      }

      // Add delay between requests
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }

    this.processing = false;
  }

  clearCache() {
    this.cache.clear();
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      active: this.active,
      cacheSize: this.cache.size
    };
  }
}

// Global request queue instance
export const requestQueue = new RequestQueue({
  maxConcurrent: 2, // Reduce concurrent requests
  delay: 100, // 200ms between requests
  retryDelay: 1000, // 2s before retry on 429
  maxRetries: 3,
  cacheTimeout: 10000 // 10 seconds cache
});

// Helper functions for common RPC calls
export const createRpcCall = (connection, method, params = []) => {
  return () => connection[method](...params);
};

export const createCachedRpcCall = (connection, method, params = [], cacheKey = null) => {
  const key = cacheKey || `${method}_${JSON.stringify(params)}`;
  return requestQueue.add(
    createRpcCall(connection, method, params),
    key,
    true
  );
};

// Specific helpers for common operations
export const getBalance = (connection, publicKey) => {
  return createCachedRpcCall(connection, 'getBalance', [publicKey], `balance_${publicKey.toString()}`);
};

export const getParsedTokenAccountsByOwner = (connection, owner, config) => {
  const key = `token_accounts_${owner.toString()}_${JSON.stringify(config)}`;
  return createCachedRpcCall(connection, 'getParsedTokenAccountsByOwner', [owner, config], key);
};

export const getAccountInfo = (connection, publicKey) => {
  return createCachedRpcCall(connection, 'getAccountInfo', [publicKey], `account_${publicKey.toString()}`);
};

export const getMultipleAccounts = (connection, publicKeys) => {
  const key = `multiple_accounts_${publicKeys.map(pk => pk.toString()).join('_')}`;
  return createCachedRpcCall(connection, 'getMultipleAccounts', [publicKeys], key);
};
