import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], // { rank, pubkey, name, score }
  userScore: 0,
  currentEpoch: 0,
  epochStart: 0,
  selectedEpoch: null,
  loading: false,
  error: null,
};

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    fetchLeaderboardStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchLeaderboardSuccess: (state, action) => {
      const { items, userScore, currentEpoch, epochStart, selectedEpoch } = action.payload;
      state.items = items || [];
      state.userScore = userScore ?? 0;
      state.currentEpoch = currentEpoch ?? state.currentEpoch;
      state.epochStart = epochStart ?? state.epochStart;
      state.selectedEpoch = selectedEpoch ?? state.selectedEpoch;
      state.loading = false;
      state.error = null;
    },
    fetchLeaderboardFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to load leaderboard';
    },
    setSelectedEpoch: (state, action) => {
      state.selectedEpoch = action.payload;
    },
    clearLeaderboard: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  fetchLeaderboardStart,
  fetchLeaderboardSuccess,
  fetchLeaderboardFailure,
  setSelectedEpoch,
  clearLeaderboard,
} = leaderboardSlice.actions;

export default leaderboardSlice.reducer;

// selectors
export const selectLeaderboardItems = (state) => state.leaderboard.items;
export const selectLeaderboardUserScore = (state) => state.leaderboard.userScore;
export const selectLeaderboardCurrentEpoch = (state) => state.leaderboard.currentEpoch;
export const selectLeaderboardEpochStart = (state) => state.leaderboard.epochStart;
export const selectLeaderboardSelectedEpoch = (state) => state.leaderboard.selectedEpoch;
export const selectLeaderboardLoading = (state) => state.leaderboard.loading;
export const selectLeaderboardError = (state) => state.leaderboard.error;


