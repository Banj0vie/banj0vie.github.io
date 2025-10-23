
export const CLUSTER_CONFIGS = {
  'devnet': {
    name: 'devnet',
    rpcEndpoint: 'https://devnet.helius-rpc.com/?api-key=58281a41-2a84-4eab-82ea-b84c72af7346',
    wsEndpoint: 'wss://api.devnet.solana.com',
    isMainnet: false,
    isTestnet: true,
  },
  'mainnet-beta': {
    name: 'mainnet-beta',
    rpcEndpoint: 'https://mainnet.helius-rpc.com/?api-key=58281a41-2a84-4eab-82ea-b84c72af7346',
    wsEndpoint: 'wss://api.mainnet-beta.solana.com',
    isMainnet: true,
    isTestnet: false,
  },
  'testnet': {
    name: 'testnet',
    rpcEndpoint: 'https://api.testnet.solana.com',
    wsEndpoint: 'wss://api.testnet.solana.com',
    isMainnet: false,
    isTestnet: true,
  },
};

export const getClusterFromUrl = () => {
  if (typeof window === 'undefined') {
    return 'devnet';
  }
  const urlParams = new URLSearchParams(window.location.search);
  const clusterParam = urlParams.get('cluster');
  if (clusterParam && CLUSTER_CONFIGS[clusterParam]) {
    return clusterParam;
  }
  return 'devnet';
};

export const getClusterConfig = (cluster) => {
  const targetCluster = cluster || getClusterFromUrl();
  return CLUSTER_CONFIGS[targetCluster];
};

export const getRpcEndpoint = (cluster) => {
  const config = getClusterConfig(cluster);
  return config.rpcEndpoint;
};

export const getWsEndpoint = (cluster) => {
  const config = getClusterConfig(cluster);
  return config.wsEndpoint;
};

export const isMainnet = (cluster) => {
  const config = getClusterConfig(cluster);
  return config.isMainnet;
};

export const isTestnet = (cluster) => {
  const config = getClusterConfig(cluster);
  return config.isTestnet;
};

export const getClusterDisplayName = (cluster) => {
  const config = getClusterConfig(cluster);
  return config.name === 'mainnet-beta' ? 'Mainnet' : config.name.charAt(0).toUpperCase() + config.name.slice(1);
};

export const getClusterWarning = (cluster) => {
  const config = getClusterConfig(cluster);
  if (config.isMainnet) {
    return '⚠️ You are connected to Solana Mainnet. Real funds will be used!';
  }
  return null;
};

export const updateUrlWithCluster = (cluster) => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('cluster', cluster);
  window.history.replaceState({}, '', url.toString());
};

export const getAvailableClusters = () => {
  return Object.keys(CLUSTER_CONFIGS);
};

export const isValidCluster = (cluster) => {
  return !!CLUSTER_CONFIGS[cluster];
};

export const getClusterFromEnv = () => {
  const envCluster = process.env.REACT_APP_SOLANA_CLUSTER;
  if (envCluster && isValidCluster(envCluster)) {
    return envCluster;
  }
  return 'devnet';
};

export const getFinalCluster = () => {
  const urlCluster = getClusterFromUrl();
  const envCluster = getClusterFromEnv();
  if (urlCluster !== 'devnet' || (typeof window !== 'undefined' && window.location.search.includes('cluster'))) {
    return urlCluster;
  }
  return envCluster;
};
