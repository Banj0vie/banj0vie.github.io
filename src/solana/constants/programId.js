import { PublicKey } from '@solana/web3.js';
import { getClusterConfig, getRpcEndpoint, getWsEndpoint, getFinalCluster } from '../utils/clusterUtils';

export const SOLANA_VALLEY_PROGRAM_ID = new PublicKey('CGT1otbr2P59kjbJckZvTAQLRFsX7oZhN5RZPHJhSzth');

export const GAME_TOKEN_MINT = new PublicKey('6k71Fit7Tp48UM6jHN3WDRA7QTDhycM7a64H4fyZsjPe');

export const LOOKUP_TABLE_ADDRESS = new PublicKey('5RRRwfh42wvSXTSAzKcCRsfjFrJqUZMDioqyou5Uoub7');

export const getCurrentCluster = () => getFinalCluster();
export const getCurrentClusterConfig = () => getClusterConfig();

export const SOLANA_NETWORK = getCurrentCluster();
export const RPC_ENDPOINT = getRpcEndpoint();
export const WS_ENDPOINT = getWsEndpoint();

export const ENV_RPC_ENDPOINT = process.env.REACT_APP_RPC_ENDPOINT;
export const ENV_WS_ENDPOINT = process.env.REACT_APP_WS_ENDPOINT;

export const FINAL_RPC_ENDPOINT = ENV_RPC_ENDPOINT || RPC_ENDPOINT;
export const FINAL_WS_ENDPOINT = ENV_WS_ENDPOINT || WS_ENDPOINT;
