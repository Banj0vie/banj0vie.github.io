// On-chain leaderboard removed. Sandbox uses localStorage for season points,
// and Market_Leaderboard renders mock data + the player's own row.
export const useLeaderboard = () => ({
  fetchLeaderboard: async () => [],
  data: [],
  loading: false,
  error: null,
});
export default useLeaderboard;
