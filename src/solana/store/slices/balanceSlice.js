import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  gameToken: '0',
  stakedBalance: '0',
  xTokenShare: '0',
  solBalance: '0',
  loading: false,
  error: null,
  subscriptionIds: [],
  dexLoading: false,
  dexError: null,
  balanceRefreshing: false,
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
    // DEX-specific actions
    buyTokensStart: (state) => {
      state.dexLoading = true;
      state.dexError = null;
    },
    buyTokensSuccess: (state) => {
      state.dexLoading = false;
      state.dexError = null;
    },
    buyTokensFailure: (state, action) => {
      state.dexLoading = false;
      state.dexError = action.payload;
    },
    sellTokensStart: (state) => {
      state.dexLoading = true;
      state.dexError = null;
    },
    sellTokensSuccess: (state) => {
      state.dexLoading = false;
      state.dexError = null;
    },
    sellTokensFailure: (state, action) => {
      state.dexLoading = false;
      state.dexError = action.payload;
    },
    updateDexBalances: (state, action) => {
      const { solBalance, gameTokenBalance } = action.payload;
      if (solBalance !== undefined) {
        state.solBalance = solBalance;
      }
      if (gameTokenBalance !== undefined) {
        state.gameToken = gameTokenBalance;
      }
    },
    // Balance refresh actions
    startBalanceRefresh: (state) => {
      state.balanceRefreshing = true;
    },
    completeBalanceRefresh: (state) => {
      state.balanceRefreshing = false;
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
  buyTokensStart,
  buyTokensSuccess,
  buyTokensFailure,
  sellTokensStart,
  sellTokensSuccess,
  sellTokensFailure,
  updateDexBalances,
  startBalanceRefresh,
  completeBalanceRefresh,
} = balanceSlice.actions;

export default balanceSlice.reducer;

// Selectors
export const selectBalanceLoading = (state) => state.balance.loading;
export const selectBalanceError = (state) => state.balance.error;
export const selectDexLoading = (state) => state.balance.dexLoading;
export const selectDexError = (state) => state.balance.dexError;
export const selectSolBalance = (state) => state.balance.solBalance;
export const selectGameTokenBalance = (state) => state.balance.gameToken;
export const selectBalanceRefreshing = (state) => state.balance.balanceRefreshing;
