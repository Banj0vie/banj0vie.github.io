// DEX (Raydium) integration removed — stubs return inert defaults.
export const useDex = () => ({
  buyTokens: async () => null,
  sellTokens: async () => null,
  getTokensOut: async () => 0,
  getSolOut: async () => 0,
  fetchBalances: async () => null,
  error: null,
  loading: false,
});
export default useDex;
