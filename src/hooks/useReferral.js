// Referral / on-chain profile creation removed — sandbox-only profiles persist
// the username to localStorage and skip the chain entirely.
export const useReferral = () => ({
  fetchReferralData: async () => null,
  createProfile: async (username, _referralCode) => {
    if (typeof window !== 'undefined' && username) {
      localStorage.setItem('sandbox_username', username);
    }
    return null;
  },
  referralData: null,
  loading: false,
  error: null,
});
export default useReferral;
