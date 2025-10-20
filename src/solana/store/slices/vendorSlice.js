import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  pendingRequests: [],
  isRevealing: false,
  lastPurchase: null,
  loading: false,
  error: null,
  subscriptionIds: [],
};

const vendorSlice = createSlice({
  name: 'vendor',
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
    buySeedPack: (state, action) => {
      const { tier, count, nonce } = action.payload;
      const request = {
        buyer: '',
        tier,
        revealed: false,
        count: Number(count),
        nonce: Number(nonce ?? 0),
        commitment: new Array(32).fill(0),
        commitSlot: 0,
      };
      state.pendingRequests.push(request);
      state.lastPurchase = { tier, count, nonce: Number(nonce ?? 0), timestamp: Date.now() };
    },
    revealSeedsStart: (state) => {
      state.isRevealing = true;
      state.error = null;
    },
    revealSeedsSuccess: (state, action) => {
      const { nonce } = action.payload;
      const request = state.pendingRequests.find(r => r.nonce === Number(nonce));
      if (request) request.revealed = true;
      state.isRevealing = false;
    },
    revealSeedsFailure: (state, action) => {
      state.isRevealing = false;
      state.error = action.payload;
    },
    addRequest: (state, action) => {
      state.pendingRequests.push(action.payload);
    },
    removeRequest: (state, action) => {
      const nonce = Number(action.payload);
      state.pendingRequests = state.pendingRequests.filter(r => r.nonce !== nonce);
    },
    updateRequestStatus: (state, action) => {
      const { nonce, revealed } = action.payload;
      const request = state.pendingRequests.find(r => r.nonce === Number(nonce));
      if (request) request.revealed = !!revealed;
    },
    subscribeToVendor: (state, action) => {
      state.subscriptionIds = action.payload;
    },
    unsubscribeFromVendor: (state) => {
      state.subscriptionIds = [];
    },
    clearVendorData: (state) => {
      state.pendingRequests = [];
      state.isRevealing = false;
      state.lastPurchase = null;
      state.subscriptionIds = [];
      state.error = null;
    },
    updateLastPurchase: (state, action) => {
      state.lastPurchase = { ...action.payload, nonce: Number(action.payload?.nonce ?? 0), timestamp: Date.now() };
    },
    clearLastPurchase: (state) => {
      state.lastPurchase = null;
    },
  },
});

export const {
  fetchPendingRequestsStart,
  fetchPendingRequestsSuccess,
  fetchPendingRequestsFailure,
  buySeedPack,
  revealSeedsStart,
  revealSeedsSuccess,
  revealSeedsFailure,
  addRequest,
  removeRequest,
  updateRequestStatus,
  subscribeToVendor,
  unsubscribeFromVendor,
  clearVendorData,
  updateLastPurchase,
  clearLastPurchase,
} = vendorSlice.actions;

export default vendorSlice.reducer;

export const selectHasPendingVendorRequests = (state) => state.vendor.pendingRequests.length > 0;
export const selectPendingVendorRequestsForUser = (state, userPublicKey) =>
  state.vendor.pendingRequests.filter(r => String(r.buyer) === userPublicKey);
export const selectUnrevealedVendorRequests = (state) =>
  state.vendor.pendingRequests.filter(r => !r.revealed);
export const selectVendorRequestByNonce = (state, nonce) =>
  state.vendor.pendingRequests.find(r => r.nonce === Number(nonce));
export const selectIsVendorRequestReadyForReveal = (state, nonce) => {
  const request = state.vendor.pendingRequests.find(r => r.nonce === Number(nonce));
  return request ? !request.revealed : false;
};
