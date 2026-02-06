import { PublicKey } from '@solana/web3.js';
import { getClusterConfig, getRpcEndpoint, getWsEndpoint, getFinalCluster } from '../utils/clusterUtils';

export const SOLANA_VALLEY_PROGRAM_ID = new PublicKey(process.env.REACT_APP_SOLANA_VALLEY_PROGRAM_ID) //new PublicKey('gzxT81zxzrKXt6awQF1vUkaAtKLRW94rSSwFWxceDw1');
export const SOLANA_VALLEY_DEX_PROGRAM_ID = process.env.REACT_APP_SOLANA_VALLEY_DEX_PROGRAM_ID && new PublicKey(process.env.REACT_APP_SOLANA_VALLEY_DEX_PROGRAM_ID) // new PublicKey('EVHHfpb4sarb9D2UWSXB6kkyWcS34hWTkd2qGEJhBJJe');

export const GAME_TOKEN_MINT = new PublicKey(process.env.REACT_APP_GAME_TOKEN_MINT) // new PublicKey('ENiJaLrLtgtiPbPrt5ZjKKe6yHzaLQcJpiPmEbiwNyJT');

export const LOOKUP_TABLE_ADDRESS = new PublicKey(process.env.REACT_APP_LOOKUP_TABLE_ADDRESS);

export const getCurrentCluster = () => getFinalCluster();
export const getCurrentClusterConfig = () => getClusterConfig();

export const SOLANA_NETWORK = getCurrentCluster();
export const RPC_ENDPOINT = getRpcEndpoint();
export const WS_ENDPOINT = getWsEndpoint();

export const ENV_RPC_ENDPOINT = process.env.REACT_APP_RPC_ENDPOINT;
export const ENV_WS_ENDPOINT = process.env.REACT_APP_WS_ENDPOINT;

export const FINAL_RPC_ENDPOINT = ENV_RPC_ENDPOINT || RPC_ENDPOINT;
export const FINAL_WS_ENDPOINT = ENV_WS_ENDPOINT || WS_ENDPOINT;