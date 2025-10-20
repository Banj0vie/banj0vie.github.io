import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

import userReducer from './slices/userSlice';
import balanceReducer from './slices/balanceSlice';
import bankerReducer from './slices/bankerSlice';
import farmingReducer from './slices/farmingSlice';
import marketReducer from './slices/marketSlice';
import inventoryReducer from './slices/inventorySlice';
import vendorReducer from './slices/vendorSlice';
import fishingReducer from './slices/fishingSlice';
import uiReducer from './slices/uiSlice';
import leaderboardReducer from './slices/leaderboardSlice';
import sageReducer from './slices/sageSlice';

import { websocketMiddleware } from './middleware/websocketMiddleware';

export const store = configureStore({
  reducer: {
    user: userReducer,
    balance: balanceReducer,
    banker: bankerReducer,
    farming: farmingReducer,
    market: marketReducer,
    inventory: inventoryReducer,
    vendor: vendorReducer,
    leaderboard: leaderboardReducer,
    fishing: fishingReducer,
    ui: uiReducer,
    sage: sageReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'websocket/connect',
          'websocket/disconnect',
          'websocket/subscribe',
          'websocket/unsubscribe',
        ],
        ignoredActionPaths: ['payload.timestamp', 'payload.subscriptionId'],
        ignoredPaths: ['websocket.connections'],
      },
    }).concat(websocketMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

export default store;
