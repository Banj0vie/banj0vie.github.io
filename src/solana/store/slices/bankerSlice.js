import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  totalGameToken: '0',
  totalXGameToken: '0',
  loading: false,
  error: null,
};

const bankerSlice = createSlice({
  name: 'banker',
  initialState,
  reducers: {
    fetchBankerDataStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchBankerDataSuccess: (state, action) => {
      state.totalGameToken = action.payload.totalGameToken;
      state.totalXGameToken = action.payload.totalXGameToken;
      state.loading = false;
    },
    fetchBankerDataFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearBankerData: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  fetchBankerDataStart,
  fetchBankerDataSuccess,
  fetchBankerDataFailure,
  clearBankerData,
} = bankerSlice.actions;

export default bankerSlice.reducer;

// Selectors
export const selectBankerLoading = (state) => state.banker.loading;
export const selectBankerError = (state) => state.banker.error;
export const selectBankerTotalGameToken = (state) => state.banker.totalGameToken;
export const selectBankerTotalXGameToken = (state) => state.banker.totalXGameToken;

