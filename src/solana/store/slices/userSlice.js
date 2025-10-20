import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Mirrors on-chain UserData account structure
  userData: {
    name: '',
    referral_code: new Array(32).fill(0),
    sponsor: null, // string (base58) or PublicKey serialized upstream
    level: 0,
    xp: 0,
    epoch_xp: 0,
    last_epoch_counted: 0,
    avatars: [null, null], // array of 2 public keys (strings)
    locked_tokens: 0, // u64, represent as number (ui units handled upstream)
    xtoken_share: 0, // u64
    chest_open_time: 0,
    last_wage_time: 0,
    last_harvest_time: 0,
    active_plot_ids: [], // Vec<u8>
    user_crops: new Array(30).fill({
      id: 0,
      end_time: 0,
      prod_multiplier: 1000, // Default 1000 (1.0x multiplier)
      token_multiplier: 1000, // Default 1000 (1.0x multiplier)
      growth_elixir: 0
    }), // [UserCrops; 30] - each crop has id, end_time, prod_multiplier, token_multiplier, growth_elixir
  },
  loading: false,
  error: null,
  subscriptionId: null,
  hasProfile: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchUserDataStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchUserDataSuccess: (state, action) => {
      // Expect payload to already be shaped per on-chain fields
      state.userData = { ...state.userData, ...action.payload };
      state.hasProfile = true;
      state.loading = false;
      state.error = null;
    },
    fetchUserDataFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.hasProfile = false;
    },
    updateUserData: (state, action) => {
      state.userData = { ...state.userData, ...action.payload };
    },
    subscribeToUser: (state, action) => {
      state.subscriptionId = action.payload;
    },
    unsubscribeFromUser: (state) => {
      state.subscriptionId = null;
    },
    clearUserData: (state) => {
      state.userData = { ...initialState.userData };
      state.hasProfile = false;
      state.subscriptionId = null;
      state.error = null;
    },
    setHasProfile: (state, action) => {
      state.hasProfile = action.payload;
    },
    updateUserLevel: (state, action) => { state.userData.level = action.payload; },
    updateUserXP: (state, action) => { state.userData.xp = action.payload; },

    // New granular updaters aligned with on-chain fields
    updateEpochXP: (state, action) => { state.userData.epoch_xp = action.payload; },
    updateLastEpochCounted: (state, action) => { state.userData.last_epoch_counted = action.payload; },
    updateLockedTokens: (state, action) => { state.userData.locked_tokens = action.payload; },
    updateXTokenShare: (state, action) => { state.userData.xtoken_share = action.payload; },
    updateChestOpenTime: (state, action) => { state.userData.chest_open_time = action.payload; },
    updateLastWageTime: (state, action) => { state.userData.last_wage_time = action.payload; },
    updateLastHarvestTime: (state, action) => { state.userData.last_harvest_time = action.payload; },
    updateActivePlotIds: (state, action) => { state.userData.active_plot_ids = action.payload; },
    updateUserCrops: (state, action) => { state.userData.user_crops = action.payload; },
    updateSponsor: (state, action) => { state.userData.sponsor = action.payload; },
    updateAvatars: (state, action) => { state.userData.avatars = action.payload; },
    updateReferralCode: (state, action) => { state.userData.referral_code = action.payload; },
    updateUserName: (state, action) => { state.userData.name = action.payload; },
    
    // Crop-specific actions
    updateCrop: (state, action) => {
      const { plotIndex, cropData } = action.payload;
      if (plotIndex >= 0 && plotIndex < 30) {
        state.userData.user_crops[plotIndex] = { ...state.userData.user_crops[plotIndex], ...cropData };
      }
    },
    updateCropId: (state, action) => {
      const { plotIndex, id } = action.payload;
      if (plotIndex >= 0 && plotIndex < 30) {
        state.userData.user_crops[plotIndex].id = id;
      }
    },
    updateCropEndTime: (state, action) => {
      const { plotIndex, end_time } = action.payload;
      if (plotIndex >= 0 && plotIndex < 30) {
        state.userData.user_crops[plotIndex].end_time = end_time;
      }
    },
    updateCropMultipliers: (state, action) => {
      const { plotIndex, prod_multiplier, token_multiplier } = action.payload;
      if (plotIndex >= 0 && plotIndex < 30) {
        if (prod_multiplier !== undefined) state.userData.user_crops[plotIndex].prod_multiplier = prod_multiplier;
        if (token_multiplier !== undefined) state.userData.user_crops[plotIndex].token_multiplier = token_multiplier;
      }
    },
    updateCropGrowthElixir: (state, action) => {
      const { plotIndex, growth_elixir } = action.payload;
      if (plotIndex >= 0 && plotIndex < 30) {
        state.userData.user_crops[plotIndex].growth_elixir = growth_elixir;
      }
    },
    clearCrop: (state, action) => {
      const plotIndex = action.payload;
      if (plotIndex >= 0 && plotIndex < 30) {
        state.userData.user_crops[plotIndex] = {
          id: 0,
          end_time: 0,
          prod_multiplier: 1000,
          token_multiplier: 1000,
          growth_elixir: 0
        };
      }
    },
  },
});

export const {
  fetchUserDataStart,
  fetchUserDataSuccess,
  fetchUserDataFailure,
  updateUserData,
  subscribeToUser,
  unsubscribeFromUser,
  clearUserData,
  setHasProfile,
  updateUserLevel,
  updateUserXP,
  updateUserCrops,
  updateActivePlotIds,
  updateEpochXP,
  updateLastEpochCounted,
  updateLockedTokens,
  updateXTokenShare,
  updateChestOpenTime,
  updateLastWageTime,
  updateLastHarvestTime,
  updateSponsor,
  updateAvatars,
  updateReferralCode,
  updateUserName,
  // Crop-specific actions
  updateCrop,
  updateCropId,
  updateCropEndTime,
  updateCropMultipliers,
  updateCropGrowthElixir,
  clearCrop,
} = userSlice.actions;

export default userSlice.reducer;
