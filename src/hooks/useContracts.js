// Backward-compatible re-exports and mappings
export { useBanker } from './useBanker';
export { useChest } from './useChest';
export { useFarming } from './useFarming';
export { useFishing } from './useFishing';
export { useGardener } from './useGardener';
export { useMarket } from './useMarket';
export { usePotion } from './usePotion';
export { useReferral } from './useReferral';
export { useSage } from './useSage';
export { useVendor } from './useVendor';
export { useProfile } from './useProfile';
export { useItems } from './useItems';
export { useROIData } from './useROIData';
export { useLeaderboard } from './useLeaderboard';
export { useDex } from './useDex';


export const useEquipmentRegistry = () => ({
  getOwnedBoostNFTs: async () => [],
  setAvatar: async () => {},
  getContract: () => null,
  getAvatars: async () => [[], []], // Returns [nfts, tokenIds] tuple
  getNFTMetadata: async () => null,
  getTokenBoostPpm: async () => 0,
});
