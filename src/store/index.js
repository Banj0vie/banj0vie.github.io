import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import uiReducer from './slices/uiSlice';
import balanceReducer from './slices/balanceSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    balance: balanceReducer,
    user: userReducer,
  },
});

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
