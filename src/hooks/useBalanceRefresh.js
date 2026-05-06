// On-chain balance refresh removed — no-op stub.
export const useBalanceRefresh = () => ({
  refreshBalancesAfterTransaction: async () => null,
});
export default useBalanceRefresh;
