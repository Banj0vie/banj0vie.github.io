// On-chain fishing removed — stub. Sandbox fishing logic lives in the UI.
export const useFishing = () => ({
  fish: async () => null,
  revealFishing: async () => null,
  listenForFishingResults: () => () => {},
  checkPendingRequests: async () => [],
  getAllPendingRequests: async () => [],
  craftBait1: async () => null,
  craftBait2: async () => null,
  craftBait3: async () => null,
});
export default useFishing;
