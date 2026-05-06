// Stub slice — wallet balance tracking has been removed. Selectors return
// inert defaults so UI components that referenced them keep rendering.
import { createSlice } from '@reduxjs/toolkit';

const balanceSlice = createSlice({
  name: 'balance',
  initialState: {
    refreshing: false,
    sol: 0,
    gameToken: 0,
    stakedBalance: 0,
    xTokenShare: 0,
    dexLoading: false,
    dexError: null,
  },
  reducers: {},
});

export const selectBalanceRefreshing = () => false;
export const selectSolBalance = () => 0;
export const selectGameTokenBalance = () => 0;
export const selectDexLoading = () => false;
export const selectDexError = () => null;
export default balanceSlice.reducer;
