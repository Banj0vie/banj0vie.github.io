// On-chain profile lookup removed — sandbox uses localStorage for username.
export const useProfile = () => ({
  fetchProfile: async () => null,
  profile: null,
  loading: false,
  error: null,
});
export default useProfile;
