// Wallet integration removed — stub returns "not connected" defaults so any
// component still calling this hook keeps rendering without crashing.
export const useSolanaWallet = () => ({
  isConnected: false,
  hasProfile: false,
  account: null,
  publicKey: null,
  connection: null,
  sendTransaction: async () => null,
  disconnect: () => {},
});
export default useSolanaWallet;
