import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  gameToken: '0',
  stakedBalance: '0',
  xTokenShare: '0',
  solBalance: '0',
  loading: false,
  error: null,
  subscriptionIds: [],
};

const balanceSlice = createSlice({
  name: 'balance',
  initialState,
  reducers: {
    fetchBalancesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchBalancesSuccess: (state, action) => {
      state.gameToken = action.payload.gameToken;
      state.stakedBalance = action.payload.stakedBalance;
      state.xTokenShare = action.payload.xTokenShare;
      state.solBalance = action.payload.solBalance;
      state.loading = false;
      state.error = null;
    },
    fetchBalancesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateGameTokenBalance: (state, action) => {
      state.gameToken = action.payload;
    },
    updateStakedBalance: (state, action) => {
      state.stakedBalance = action.payload;
    },
    updateXTokenShare: (state, action) => {
      state.xTokenShare = action.payload;
    },
    updateSolBalance: (state, action) => {
      state.solBalance = action.payload;
    },
    subscribeToBalances: (state, action) => {
      state.subscriptionIds = action.payload;
    },
    unsubscribeFromBalances: (state) => {
      state.subscriptionIds = [];
    },
    clearBalances: (state) => {
      state.gameToken = '0';
      state.stakedBalance = '0';
      state.xTokenShare = '0';
      state.solBalance = '0';
      state.subscriptionIds = [];
      state.error = null;
    },
    updateBalancesAfterTransaction: (state, action) => {
      const { gameTokenDelta, stakedBalanceDelta, xTokenShareDelta } = action.payload || {};
      if (gameTokenDelta) {
        state.gameToken = String(Number(state.gameToken) + Number(gameTokenDelta));
      }
      if (stakedBalanceDelta) {
        state.stakedBalance = String(Number(state.stakedBalance) + Number(stakedBalanceDelta));
      }
      if (xTokenShareDelta) {
        state.xTokenShare = String(Number(state.xTokenShare) + Number(xTokenShareDelta));
      }
    },
  },
});

export const {
  fetchBalancesStart,
  fetchBalancesSuccess,
  fetchBalancesFailure,
  updateGameTokenBalance,
  updateStakedBalance,
  updateXTokenShare,
  updateSolBalance,
  subscribeToBalances,
  unsubscribeFromBalances,
  clearBalances,
  updateBalancesAfterTransaction,
} = balanceSlice.actions;

export default balanceSlice.reducer;
