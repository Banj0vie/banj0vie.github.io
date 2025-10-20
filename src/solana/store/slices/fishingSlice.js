import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  pendingRequests: [],
  isRevealing: false,
  lastFishing: null,
  loading: false,
  error: null,
  subscriptionIds: [],
};

const fishingSlice = createSlice({
  name: 'fishing',
  initialState,
  reducers: {
    fetchPendingRequestsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPendingRequestsSuccess: (state, action) => {
      state.pendingRequests = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchPendingRequestsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    startFishing: (state, action) => {
      const { baitId, amount, nonce } = action.payload;
      const request = {
        player: '',
        level: 1,
        baitId,
        amount,
        commitment: new Array(32).fill(0),
        commitSlot: Number(nonce ?? 0),
        revealed: false,
      };
      state.pendingRequests.push(request);
      state.lastFishing = { baitId, amount, nonce: Number(nonce ?? 0), timestamp: Date.now() };
    },
    revealFishingStart: (state) => {
      state.isRevealing = true;
      state.error = null;
    },
    revealFishingSuccess: (state, action) => {
      const { nonce } = action.payload;
      const request = state.pendingRequests.find(r => r.commitSlot === Number(nonce));
      if (request) request.revealed = true;
      state.isRevealing = false;
    },
    revealFishingFailure: (state, action) => {
      state.isRevealing = false;
      state.error = action.payload;
    },
    addFishingRequest: (state, action) => {
      state.pendingRequests.push(action.payload);
    },
    removeFishingRequest: (state, action) => {
      const nonce = Number(action.payload);
      state.pendingRequests = state.pendingRequests.filter(r => r.commitSlot !== nonce);
    },
    updateFishingRequestStatus: (state, action) => {
      const { nonce, revealed } = action.payload;
      const request = state.pendingRequests.find(r => r.commitSlot === Number(nonce));
      if (request) request.revealed = !!revealed;
    },
    subscribeToFishing: (state, action) => {
      state.subscriptionIds = action.payload;
    },
    unsubscribeFromFishing: (state) => {
      state.subscriptionIds = [];
    },
    clearFishingData: (state) => {
      state.pendingRequests = [];
      state.isRevealing = false;
      state.lastFishing = null;
      state.subscriptionIds = [];
      state.error = null;
    },
    updateLastFishing: (state, action) => {
      state.lastFishing = { ...action.payload, nonce: Number(action.payload?.nonce ?? 0), timestamp: Date.now() };
    },
    clearLastFishing: (state) => {
      state.lastFishing = null;
    },
  },
});

export const {
  fetchPendingRequestsStart,
  fetchPendingRequestsSuccess,
  fetchPendingRequestsFailure,
  startFishing,
  revealFishingStart,
  revealFishingSuccess,
  revealFishingFailure,
  addFishingRequest,
  removeFishingRequest,
  updateFishingRequestStatus,
  subscribeToFishing,
  unsubscribeFromFishing,
  clearFishingData,
  updateLastFishing,
  clearLastFishing,
} = fishingSlice.actions;

export default fishingSlice.reducer;

export const selectHasPendingFishingRequests = (state) => state.fishing.pendingRequests.length > 0;
export const selectPendingFishingRequestsForUser = (state, userPublicKey) =>
  state.fishing.pendingRequests.filter(r => String(r.player) === userPublicKey);
export const selectUnrevealedFishingRequests = (state) =>
  state.fishing.pendingRequests.filter(r => !r.revealed);
export const selectFishingRequestByNonce = (state, nonce) =>
  state.fishing.pendingRequests.find(r => r.commitSlot === Number(nonce));
export const selectIsFishingRequestReadyForReveal = (state, nonce) => {
  const request = state.fishing.pendingRequests.find(r => r.commitSlot === Number(nonce));
  return request ? !request.revealed : false;
};
export const selectFishingRequestsByBait = (state, baitId) =>
  state.fishing.pendingRequests.filter(r => r.baitId === baitId);
export const selectFishingRequestsByLevel = (state, level) =>
  state.fishing.pendingRequests.filter(r => r.level === level);
