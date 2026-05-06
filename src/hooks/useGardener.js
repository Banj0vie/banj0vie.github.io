// On-chain gardener removed — stub. Sandbox planting/harvesting is handled by
// the farm router directly via localStorage.
export const useGardener = () => ({
  plant: async () => null,
  harvest: async () => null,
  water: async () => null,
});
export default useGardener;
