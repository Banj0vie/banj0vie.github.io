// On-chain staking / banker removed — sandbox bank lives in localStorage and
// is handled directly by Market_Banker UI.
export const useBanker = () => ({
  stake: async () => null,
  unstake: async () => null,
  getBalance: async () => 0,
  getBankerData: async () => null,
});
export default useBanker;
