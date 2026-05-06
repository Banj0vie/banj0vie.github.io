// On-chain marketplace removed — stubs. Marketplace UI now reads sandbox
// listings from localStorage directly.
export const useMarket = () => ({
  marketData: { listings: [] },
  getAllListings: async () => [],
  list: async () => null,
  cancel: async () => null,
  purchase: async () => null,
  send: async () => null,
  batchBuy: async () => null,
});
export default useMarket;
